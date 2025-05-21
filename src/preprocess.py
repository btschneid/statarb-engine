from src.config import logger
from typing import Dict, List, Tuple, Union, Any
import os
import pandas as pd
import glob

def get_category_directories(raw_dir: str) -> List[str]:
    """Get list of category directories from raw data folder."""
    return [d for d in os.listdir(raw_dir) if os.path.isdir(os.path.join(raw_dir, d))]

def read_category_data(category_path: str) -> Dict[str, pd.DataFrame]:
    """
    Read all CSV files in a category directory into a dictionary of dataframes.
    
    Args:
        category_path: Path to the category directory
        
    Returns:
        Dictionary mapping ticker names to their dataframes
    """
    csv_files = glob.glob(os.path.join(category_path, "*.csv"))
    if not csv_files:
        logger.warning(f"No CSV files found in {category_path}")
        return {}
        
    dfs = {}
    for file in csv_files:
        ticker = os.path.basename(file).replace('.csv', '')
        df = pd.read_csv(file, index_col='date', parse_dates=True)
        dfs[ticker] = df
    return dfs

def find_common_dates(dfs: Dict[str, pd.DataFrame]) -> List[pd.Timestamp]:
    """
    Find dates that are common across all tickers in a category.
    
    Args:
        dfs: Dictionary of dataframes for each ticker
        
    Returns:
        Sorted list of common dates
    """
    common_dates = None
    for df in dfs.values():
        if common_dates is None:
            common_dates = set(df.index)
        else:
            common_dates = common_dates.intersection(set(df.index))
    
    if not common_dates:
        return []
    return sorted(list(common_dates))

def process_and_save_ticker(
    df: pd.DataFrame,
    common_dates: List[pd.Timestamp],
    output_path: str
) -> None:
    """
    Process a single ticker's data and save it to the processed directory.
    
    Args:
        df: DataFrame for the ticker
        common_dates: List of dates to keep
        output_path: Path where to save the processed data
    """
    # Filter to common dates and drop NA values
    df_common = df.loc[common_dates].dropna()
    
    # Save processed data
    df_common.to_csv(output_path)
    logger.info(f"Saved processed data to {output_path}")

def process_category(
    category: str,
    raw_dir: str,
    processed_dir: str
) -> None:
    """
    Process all tickers within a single category.
    
    Args:
        category: Category name (e.g., 'banks', 'airlines')
        raw_dir: Path to raw data directory
        processed_dir: Path to processed data directory
    """
    logger.info(f"Processing category: {category}")
    
    # Read all data for this category
    category_path = os.path.join(raw_dir, category)
    dfs = read_category_data(category_path)
    
    if not dfs:
        return
        
    # Find common dates
    common_dates = find_common_dates(dfs)
    if not common_dates:
        logger.warning(f"No common dates found in {category}")
        return
        
    # Create category directory in processed
    category_processed_dir = os.path.join(processed_dir, category)
    os.makedirs(category_processed_dir, exist_ok=True)
    
    # Process each ticker
    for ticker, df in dfs.items():
        output_path = os.path.join(category_processed_dir, f"{ticker}.csv")
        process_and_save_ticker(df, common_dates, output_path)
        
    logger.info(f"Completed processing {category} with {len(common_dates)} common dates")

def preprocess_data():
    """
    Main function to clean and preprocess all ticker data.
    Processes each category separately, aligning dates and removing missing values.
    """
    raw_dir = "data/raw"
    processed_dir = "data/processed"
    
    # Create processed directory if it doesn't exist
    os.makedirs(processed_dir, exist_ok=True)
    
    # Process each category
    categories = get_category_directories(raw_dir)
    for category in categories:
        process_category(category, raw_dir, processed_dir)