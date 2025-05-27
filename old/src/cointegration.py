import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller
from itertools import combinations
from src.data_utils import download_stock_data
from src.constants import DEFAULT_START_DATE, DEFAULT_END_DATE

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

def find_cointegrated_pairs(tickers, start_date=DEFAULT_START_DATE, end_date=DEFAULT_END_DATE):
    """
    Find the best cointegrated pair from a list of tickers.
    
    Args:
        tickers: List of ticker symbols
        start_date: Start date for data (default: from constants)
        end_date: End date for data (default: from constants)
        
    Returns:
        dict: Dictionary containing the best pair's information including:
            - ticker_A: First ticker
            - ticker_B: Second ticker
            - p_value: Cointegration p-value
            - beta: Hedge ratio
            - adf_statistic: ADF test statistic
    """
    # Download data for all tickers
    ticker_data = {}
    for ticker in tickers:
        if download_stock_data(ticker, start_date, end_date):
            df = pd.read_csv(f'data/{ticker}.csv')
            df['date'] = pd.to_datetime(df['date'], utc=True)
            ticker_data[ticker] = df
    
    # Calculate cointegration metrics for all pairs
    best_pair = None
    best_p_value = float('inf')
    
    for ticker_A, ticker_B in combinations(ticker_data.keys(), 2):
        p_value, beta, adf_statistic = cointegration_pvalue(
            ticker_A, ticker_data[ticker_A],
            ticker_B, ticker_data[ticker_B]
        )
        
        if p_value < best_p_value:
            best_p_value = p_value
            best_pair = {
                'ticker_A': ticker_A,
                'ticker_B': ticker_B,
                'p_value': p_value,
                'beta': beta,
                'adf_statistic': adf_statistic
            }
    
    return best_pair