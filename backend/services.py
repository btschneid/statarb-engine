import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from config import (
    DEFAULT_START_DATE, DEFAULT_END_DATE,
    DEFAULT_TICKERS
)

def validate_ticker(ticker: str) -> Tuple[bool, str]:
    """Validate if a ticker exists on Yahoo Finance"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        if info is None or len(info) == 0:
            return False, ""
        return True, info.get("longName", ticker)
    except:
        return False, ""

def validate_tickers(tickers: List[str]) -> List[Tuple[str, bool, str]]:
    """Validate multiple tickers and return their status"""
    results = []
    for ticker in tickers:
        valid, name = validate_ticker(ticker)
        results.append((ticker, valid, name))
    return results

def get_default_tickers() -> Dict[str, List[str]]:
    """Get list of default tickers by category"""
    return DEFAULT_TICKERS

def get_sectors() -> List[str]:
    """Get list of all sectors from default tickers"""
    return list(DEFAULT_TICKERS.keys())

def get_sector_tickers(sector: str) -> List[str]:
    """Get list of tickers for a specific sector"""
    if sector not in DEFAULT_TICKERS:
        return []
    return DEFAULT_TICKERS[sector]

def calculate_risk_metrics(df: pd.DataFrame) -> Dict[str, float]:
    """Calculate risk metrics for the given ticker data"""
    # Placeholder implementation
    return {
        "cumulative_return": 0.0,
        "annualized_return": 0.0,
        "sharpe_ratio": 0.0,
        "sortino_ratio": 0.0,
        "calmar_ratio": 0.0,
        "max_drawdown": 0.0,
        "var_95": 0.0,
        "cvar_95": 0.0,
        "profit_factor": 0.0,
        "mae": 0.0,
        "adf_statistic": 0.0,
        "p_value": 0.0,
        "hedge_ratio": 0.0,
        "half_life_days": 0.0,
        "number_of_trades": 0,
        "win_rate": 0.0,
        "mean_duration": 0.0,
        "z_score": 0.0
    }

def get_ticker_data(tickers: List[str], start_date: str, end_date: str) -> pd.DataFrame:
    """Get historical data for multiple tickers"""
    # Validate all tickers first
    validation_results = validate_tickers(tickers)
    invalid_tickers = [ticker for ticker, valid, _ in validation_results if not valid]
    
    if invalid_tickers:
        raise ValueError(f"Invalid tickers: {', '.join(invalid_tickers)}")
    
    all_data = []
    for ticker in tickers:
        stock = yf.Ticker(ticker)
        hist_data = stock.history(start=start_date, end=end_date, auto_adjust=False)
        if not hist_data.empty:
            # Select only Adj Close and rename to ticker symbol
            ticker_data = hist_data[["Adj Close"]].copy()
            ticker_data.columns = [ticker]  # Use ticker symbol as column name
            all_data.append(ticker_data)
    
    if not all_data:
        return pd.DataFrame()
    
    # Combine all data horizontally (by date)
    df = pd.concat(all_data, axis=1)
    # Reset index to make date a column
    df = df.reset_index()
    # Rename Date column to date
    df = df.rename(columns={"Date": "date"})
    
    return df


