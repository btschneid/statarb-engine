import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple, Any
from config import (
    DEFAULT_START_DATE, DEFAULT_END_DATE,
    DEFAULT_TICKERS, DEFAULT_SECTOR, METRICS
)
from statsmodels.tsa.stattools import coint
from datetime import datetime, timedelta
import logging

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

def get_default_dates(date_type: str):
    if date_type not in ["start", "end"]:
        raise ValueError(f"Invalid date type")

    if date_type == "start":
        return DEFAULT_START_DATE

    return DEFAULT_END_DATE

def get_default_sector_tickers():
    if DEFAULT_SECTOR not in DEFAULT_TICKERS:
        raise ValueError(f"Invalid default sector")
    
    return DEFAULT_TICKERS[DEFAULT_SECTOR]

def get_metrics():
    """Get list of all metrics with their metadata"""
    return [
        {
            "id": "cumulative_return",
            "title": "Cumulative Return",
            "description": "Total return over the selected period"
        },
        {
            "id": "annualized_return",
            "title": "Annualized Return",
            "description": "Return annualized to a yearly rate"
        },
        {
            "id": "sharpe_ratio",
            "title": "Sharpe Ratio",
            "description": "Risk-adjusted return measure"
        },
        {
            "id": "sortino_ratio",
            "title": "Sortino Ratio",
            "description": "Risk-adjusted return measure focusing on downside volatility"
        },
        {
            "id": "calmar_ratio",
            "title": "Calmar Ratio",
            "description": "Return relative to maximum drawdown"
        },
        {
            "id": "max_drawdown",
            "title": "Maximum Drawdown",
            "description": "Largest peak-to-trough decline"
        },
        {
            "id": "var_95",
            "title": "Value at Risk (95%)",
            "description": "95th percentile of potential losses"
        },
        {
            "id": "cvar_95",
            "title": "Conditional VaR (95%)",
            "description": "Average loss beyond VaR"
        },
        {
            "id": "profit_factor",
            "title": "Profit Factor",
            "description": "Ratio of gross profits to gross losses"
        },
        {
            "id": "mae",
            "title": "Mean Absolute Error",
            "description": "Average absolute deviation from the mean"
        },
        {
            "id": "adf_statistic",
            "title": "ADF Statistic",
            "description": "Augmented Dickey-Fuller test statistic"
        },
        {
            "id": "p_value",
            "title": "P-Value",
            "description": "Statistical significance of the ADF test"
        },
        {
            "id": "hedge_ratio",
            "title": "Hedge Ratio",
            "description": "Optimal ratio for hedging"
        },
        {
            "id": "half_life_days",
            "title": "Half-Life (Days)",
            "description": "Time for mean reversion"
        },
        {
            "id": "number_of_trades",
            "title": "Number of Trades",
            "description": "Total number of trading signals"
        },
        {
            "id": "win_rate",
            "title": "Win Rate",
            "description": "Percentage of profitable trades"
        },
        {
            "id": "mean_duration",
            "title": "Mean Duration",
            "description": "Average holding period"
        },
        {
            "id": "z_score",
            "title": "Z-Score",
            "description": "Number of standard deviations from the mean"
        }
    ]

def find_best_cointegrated_pair(tickers: List[str], start: str, end: str) -> Tuple[Tuple[str, str], List[Dict[str, Any]]]:
    """
    Find the best cointegrated pair from a list of tickers.
    Returns the best pair and chart data.
    """
    if len(tickers) < 2:
        raise ValueError("At least 2 tickers required")

    # Get data for all tickers
    try:
        df = get_ticker_data(tickers, start, end)
        if df.empty:
            raise ValueError("No data found for the specified tickers")
    except Exception as e:
        logging.error(f"Error getting ticker data: {str(e)}")
        raise ValueError("Failed to get ticker data")

    # Find best cointegrated pair
    best_p_value = float('inf')
    best_pair = None
    best_chart_data = None

    # Try all possible pairs
    for ticker1 in tickers:
        for ticker2 in tickers:
            if ticker1 >= ticker2:
                continue

            try:
                # Get price data for both tickers
                prices1 = df[ticker1]
                prices2 = df[ticker2]

                # Calculate cointegration
                _, p_value, _ = coint(prices1, prices2)

                # If this pair has better cointegration, save it
                if p_value < best_p_value:
                    best_p_value = p_value
                    best_pair = (ticker1, ticker2)

                    # Get chart data for this pair
                    pair_df = df[[ticker1, ticker2]]
                    chart_data = []
                    for date, row in pair_df.iterrows():
                        # Convert date to string format if it's a datetime
                        date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date)
                        chart_data.append({
                            'date': date_str,
                            ticker1: float(row[ticker1]),
                            ticker2: float(row[ticker2])
                        })

                    best_chart_data = chart_data

            except Exception as e:
                logging.error(f"Error processing pair {ticker1}-{ticker2}: {str(e)}")
                continue

    if best_pair is None or best_chart_data is None:
        raise ValueError("No valid cointegrated pairs found")

    return best_pair, best_chart_data