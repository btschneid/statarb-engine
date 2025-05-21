from src.config import logger
from typing import Dict, List, Tuple, Union, Any
import yfinance as yf
import os
import pandas as pd

# Type alias for ticker values which can be either a list of single tickers
# or a list of ticker pairs
TickerValue = Union[List[str], List[Tuple[str, str]]]

def get_stock_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Fetch historical stock data for a single ticker using yfinance.
    
    Args:
        ticker: Stock symbol (e.g., 'AAPL')
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
    
    Returns:
        DataFrame containing adjusted close prices and volume with standardized column names
    """
    stock = yf.Ticker(ticker)

    # Download historical data
    hist_data = stock.history(start=start_date, end=end_date, auto_adjust=False)

    # Select and rename columns to follow financial industry conventions
    df = hist_data[['Adj Close', 'Volume']].copy()
    df.columns = ['adj_close', 'vol']
    df.index.name = 'date'
    return df

def save_dataframe_to_csv(df: pd.DataFrame, filepath: str) -> None:
    """
    Save a DataFrame to CSV file, creating directories if they don't exist.
    
    Args:
        df: DataFrame to save
        filepath: Path where the CSV file should be saved
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df.to_csv(filepath)
    logger.info(f"Saved data to {filepath}")

def download_and_save_single_ticker(
    ticker: str,
    category: str,
    base_dir: str,
    start_date: str,
    end_date: str
) -> pd.DataFrame:
    """
    Download and save data for a single ticker.
    
    Args:
        ticker: Stock symbol
        category: Category name (e.g., 'banks', 'airlines')
        base_dir: Base directory for saving data
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
    
    Returns:
        DataFrame containing the downloaded data with standardized column names
    """
    df = get_stock_data(ticker, start_date, end_date)
    path = os.path.join(base_dir, "raw", category, f"{ticker}.csv")
    save_dataframe_to_csv(df, path)
    return df

def download_and_save_pair(
    pair: Tuple[str, str],
    category: str,
    base_dir: str,
    start_date: str,
    end_date: str
) -> pd.DataFrame:
    """
    Download and save data for a pair of tickers, merging their data.
    
    Args:
        pair: Tuple of two stock symbols
        category: Category name (e.g., 'known_pairs')
        base_dir: Base directory for saving data
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
    
    Returns:
        DataFrame containing the merged data for both tickers with standardized column names
    """
    df1 = get_stock_data(pair[0], start_date, end_date)
    df2 = get_stock_data(pair[1], start_date, end_date)
    
    # Rename columns to use ticker symbols
    df1.columns = [f"{pair[0]}_{col}" for col in df1.columns]
    df2.columns = [f"{pair[1]}_{col}" for col in df2.columns]
    
    merged = df1.join(df2)
    path = os.path.join(base_dir, "raw", category, f"{pair[0]}_{pair[1]}.csv")
    save_dataframe_to_csv(merged, path)
    return merged

def load_data(
    tickers: Dict[str, TickerValue],
    start_date: str,
    end_date: str,
    base_dir: str = "data"
) -> None:
    """
    Main function to download and save data for all tickers and pairs.
    
    Args:
        tickers: Dictionary mapping categories to lists of tickers or ticker pairs
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
        base_dir: Base directory for saving data (default: "data")
    """
    for category, ticker_list in tickers.items():
        # Check if the list contains pairs (tuples) or single tickers
        if all(isinstance(t, tuple) for t in ticker_list):
            for pair in ticker_list:
                download_and_save_pair(pair, category, base_dir, start_date, end_date)
        else:
            for ticker in ticker_list:
                download_and_save_single_ticker(ticker, category, base_dir, start_date, end_date)