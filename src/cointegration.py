import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller
import os
from itertools import combinations

def cointegration_pvalue(ticker_A_name, ticker_A_df, ticker_B_name, ticker_B_df, 
                        col_A='adj_close', col_B='adj_close'):
    """
    Calculate cointegration metrics between two tickers.
    
    Args:
        ticker_A_name: Name of first ticker
        ticker_A_df: DataFrame for first ticker
        ticker_B_name: Name of second ticker
        ticker_B_df: DataFrame for second ticker
        col_A: Column name for first ticker (default: 'adj_close')
        col_B: Column name for second ticker (default: 'adj_close')
        
    Returns:
        tuple: (p_value, beta, adf_statistic)
    """
    # Align on common dates
    df = pd.DataFrame({
        ticker_A_name: ticker_A_df[col_A],
        ticker_B_name: ticker_B_df[col_B]
    }).dropna()

    # Log transform
    df_log = df.apply(lambda x: np.log(x))

    # Regress Ticker A on Ticker B using log-transformed data
    X = sm.add_constant(df_log[ticker_B_name])
    model = sm.OLS(df_log[ticker_A_name], X).fit()
    beta = model.params[ticker_B_name]  # This is the hedge ratio
    residuals = model.resid

    # ADF test on residuals
    adf_result = adfuller(residuals)
    p_value = adf_result[1]
    adf_statistic = adf_result[0]  # The ADF test statistic

    return p_value, beta, adf_statistic

def get_category_pairs(category: str, tickers: dict) -> list:
    """
    Get all possible pairs and their cointegration metrics for a category.
    Returns list of dicts with ticker_A, ticker_B, sector, p_value, beta, adf_statistic, and data.
    """
    category_results = []
    
    if category == 'known_pairs':
        for ticker, df in tickers.items():
            ticker_A = df.columns[0].split('_')[0]
            ticker_B = df.columns[2].split('_')[0]
            p_value, beta, adf_statistic = cointegration_pvalue(
                ticker_A, df, ticker_B, df,
                col_A=df.columns[0],
                col_B=df.columns[2]
            )
            category_results.append({
                'ticker_A': ticker_A,
                'ticker_B': ticker_B,
                'sector': category,
                'p_value': p_value,
                'beta': beta,
                'adf_statistic': adf_statistic,
                'data': {
                    'type': 'known_pairs',
                    'df': df
                }
            })
    else:
        for ticker_A, ticker_B in combinations(tickers.keys(), 2):
            p_value, beta, adf_statistic = cointegration_pvalue(ticker_A, tickers[ticker_A], ticker_B, tickers[ticker_B])
            category_results.append({
                'ticker_A': ticker_A,
                'ticker_B': ticker_B,
                'sector': category,
                'p_value': p_value,
                'beta': beta,
                'adf_statistic': adf_statistic,
                'data': {
                    'type': 'regular',
                    'df_A': tickers[ticker_A],
                    'df_B': tickers[ticker_B]
                }
            })
    
    return category_results

def save_pair_data(pair: dict, pairs_dir: str) -> None:
    """
    Save the log-transformed price data for a pair to a CSV file.
    """
    if pair['data']['type'] == 'known_pairs':
        df = pair['data']['df']
        pair_df = pd.DataFrame({
            f"{pair['ticker_A']}_log_price": np.log(df[df.columns[0]]),
            f"{pair['ticker_B']}_log_price": np.log(df[df.columns[2]])
        })
    else:
        # Align the data on common dates
        df_A = pair['data']['df_A']['adj_close']
        df_B = pair['data']['df_B']['adj_close']
        pair_df = pd.DataFrame({
            f"{pair['ticker_A']}_log_price": np.log(df_A),
            f"{pair['ticker_B']}_log_price": np.log(df_B)
        })
    
    # Round log-transformed prices to 4 decimal places
    pair_df = pair_df.round(4)
    
    # Reset index to make date a column
    pair_df = pair_df.reset_index()
    pair_df = pair_df.rename(columns={'index': 'date'})
    
    filename = f"{pair['sector']}_{pair['ticker_A']}_{pair['ticker_B']}.csv"
    pair_df.to_csv(os.path.join(pairs_dir, filename), index=False)

def find_cointegrated_pairs(data):
    """
    Find cointegrated pairs across all categories and save results.
    1. Calculate cointegration metrics for all pairs
    2. Save all results to cointegration.csv
    3. Save best pair from each category to pairs directory
    """
    # Step 1: Calculate metrics for all pairs
    all_results = []
    best_pairs = {}
    
    for category, tickers in data.items():
        category_results = get_category_pairs(category, tickers)
        all_results.extend(category_results)
        
        # Find best pair for this category
        if category_results:
            best_pair = min(category_results, key=lambda x: x['p_value'])
            best_pairs[category] = best_pair
    
    # Step 2: Save all results to cointegration.csv
    df = pd.DataFrame([{k: v for k, v in r.items() if k != 'data'} for r in all_results])
    
    # Round numerical columns to 4 decimal places
    numerical_columns = ['p_value', 'beta', 'adf_statistic']
    df[numerical_columns] = df[numerical_columns].round(4)
    
    os.makedirs('data/cointegration', exist_ok=True)
    df.to_csv('data/cointegration/cointegration.csv', index=False)
    
    # Step 3: Save best pairs to pairs directory
    pairs_dir = 'data/pairs'
    os.makedirs(pairs_dir, exist_ok=True)
    for pair in best_pairs.values():
        save_pair_data(pair, pairs_dir)
    
    return df

    