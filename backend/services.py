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
        "spread_cumulative_return": 0.0,
        "spread_annualized_return": 0.0,
        "spread_sharpe_ratio": 0.0,
        "spread_sortino_ratio": 0.0,
        "spread_calmar_ratio": 0.0,
        "spread_max_drawdown": 0.0,
        "spread_var_95": 0.0,
        "spread_cvar_95": 0.0,
        "spread_profit_factor": 0.0,
        "spread_mae": 0.0,
        "cointegration_adf_stat": 0.0,
        "cointegration_p_value": 0.05,
        "hedge_ratio": 0.0,
        "mean_reversion_half_life_days": 0.0,
        "num_trades": 0,
        "win_rate": 0.0,
        "mean_trade_duration_days": 0.0,
        "spread_z_score": 0.0
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
            "id": "spread_cumulative_return",
            "title": "Spread Cumulative Return",
            "description": "Definition: Total percentage return from executing the pair trading strategy over the entire backtest period.<br><br>Context: It tells you how much your strategy would have made in total.<br><br>Interpretation:<br>• +50%: Your strategy would have increased the portfolio by 50%<br>• Higher is better<br>• 0% = breakeven<br>• Negative = loss"
        },
        {
            "id": "spread_annualized_return",
            "title": "Spread Annualized Return",
            "description": "Definition: The average yearly return, assuming the performance continued as-is.<br><br>Context: Important for comparing to benchmarks (like S&P 500 or risk-free rate).<br><br>Interpretation:<br>• 10% = expected yearly return<br>• >15% = strong<br>• <0% = unprofitable"
        },
        {
            "id": "spread_sharpe_ratio",
            "title": "Spread Sharpe Ratio",
            "description": "Definition: Measures return per unit of volatility (risk). Formula: Sharpe = (R - Rf) / σ<br><br>Context: Captures risk-adjusted return — how much return you're getting for each unit of risk.<br><br>Interpretation:<br>• >1.0 = decent<br>• >2.0 = strong<br>• <1.0 = weak<br>• 0 = no return vs risk"
        },
        {
            "id": "spread_sortino_ratio",
            "title": "Spread Sortino Ratio",
            "description": "Definition: Like Sharpe but only penalizes downside volatility (bad volatility).<br><br>Context: Better for strategies where only losses matter, like mean-reversion.<br><br>Interpretation:<br>• >2.0 = very good<br>• 1.0–2.0 = moderate<br>• <1.0 = weak risk-return tradeoff"
        },
        {
            "id": "spread_calmar_ratio",
            "title": "Spread Calmar Ratio",
            "description": "Definition: Annualized return / Max drawdown.<br><br>Context: Measures return relative to the worst possible loss.<br><br>Interpretation:<br>• >1.0 = acceptable<br>• >3.0 = great<br>• <1.0 = too much risk"
        },
        {
            "id": "spread_max_drawdown",
            "title": "Spread Max Drawdown",
            "description": "Definition: The largest % drop from a peak to a trough in strategy value.<br><br>Context: Shows the worst case you could've experienced if you started at the peak.<br><br>Interpretation:<br>• -10% = tolerable<br>• -30% = risky<br>• Lower (closer to 0) = better"
        },
        {
            "id": "spread_var_95",
            "title": "Spread VaR (95%)",
            "description": "Definition: Value at Risk: worst loss you'd expect 95% of the time in a given time period.<br><br>Context: Measures tail risk — how bad things could get in a normal market.<br><br>Interpretation:<br>• -2% = 5% chance of losing more than 2% on a given day<br>• More negative = riskier"
        },
        {
            "id": "spread_cvar_95",
            "title": "Spread CVaR (95%)",
            "description": "Definition: Conditional Value at Risk: the average of losses in the worst 5% of outcomes.<br><br>Context: A stronger measure than VaR — answers: 'How bad are the really bad days?'<br><br>Interpretation:<br>• -5% = in worst 5% of days, loss averaged 5%<br>• Smaller magnitude = better"
        },
        {
            "id": "spread_profit_factor",
            "title": "Spread Profit Factor",
            "description": "Definition: Ratio of total gains to total losses.<br><br>Context: A profit factor of 2.0 means you make $2 for every $1 lost.<br><br>Interpretation:<br>• >1.5 = decent<br>• >2.0 = strong<br>• <1.0 = losing strategy"
        },
        {
            "id": "spread_mae",
            "title": "Spread MAE",
            "description": "Definition: Max Adverse Excursion - Largest unrealized loss experienced before a trade becomes profitable.<br><br>Context: Shows how much you have to 'endure' during a trade.<br><br>Interpretation:<br>• 2% = on average, you had to sit through a 2% unrealized loss<br>• Lower = safer strategy"
        },
        {
            "id": "cointegration_adf_stat",
            "title": "Cointegration ADF Stat",
            "description": "Definition: Augmented Dickey-Fuller test statistic for the spread.<br><br>Context: Used to check if the spread is stationary — a key assumption for mean reversion.<br><br>Interpretation:<br>• More negative = better (more likely stationary)<br>• -3.5 or lower = strong evidence of cointegration"
        },
        {
            "id": "cointegration_p_value",
            "title": "Cointegration P-Value",
            "description": "Definition: P-value from the ADF test.<br><br>Context: A small value means we reject the null hypothesis that the spread has a unit root (i.e., not stationary).<br><br>Interpretation:<br>• < 0.05 = good<br>• ~0.10 = weak evidence<br>• > 0.10 = not cointegrated → don't trade"
        },
        {
            "id": "hedge_ratio",
            "title": "Hedge Ratio",
            "description": "Definition: The ratio used to create the spread: spread = ticker1 - hedge_ratio × ticker2<br><br>Context: Derived from linear regression (often OLS). This controls for beta-like relationship.<br><br>Interpretation:<br>• hedge_ratio = 0.8 means buy 1 unit of ticker1 and short 0.8 units of ticker2"
        },
        {
            "id": "mean_reversion_half_life_days",
            "title": "Mean Reversion Half-Life",
            "description": "Definition: How many days it takes for the spread to revert halfway to its mean after a shock.<br><br>Context: Indicates how quickly you can expect profits after entering a trade.<br><br>Interpretation:<br>• <5 days = fast mean reversion (good)<br>• >20 days = slow, inefficient<br>• Use this to time rebalancing or exits"
        },
        {
            "id": "spread_z_score",
            "title": "Spread Z-Score",
            "description": "Definition: Number of standard deviations the current spread is from its historical mean.<br><br>Context: Used to trigger trades. If the spread is far from the mean, you expect it to revert.<br><br>Interpretation:<br>• z = +2 → spread is 2 std devs above mean → short the spread<br>• z = -2 → long the spread<br>• Values > |2| often trigger trades"
        },
        {
            "id": "num_trades",
            "title": "Number of Trades",
            "description": "Definition: How many trades were executed during the backtest.<br><br>Context: Gives a sense of sample size and strategy activity.<br><br>Interpretation:<br>• >30 = decent sample<br>• <10 = may not be enough data to evaluate"
        },
        {
            "id": "win_rate",
            "title": "Win Rate",
            "description": "Definition: Percentage of trades that closed with a profit.<br><br>Context: Doesn't tell the whole story (you can win often but lose big), but still useful.<br><br>Interpretation:<br>• >60% = strong<br>• ~50% = coin toss<br>• <40% = weak unless profits are large"
        },
        {
            "id": "mean_trade_duration_days",
            "title": "Mean Trade Duration",
            "description": "Definition: Average number of days your trades are open.<br><br>Context: Helps assess capital lock-up and turnover speed.<br><br>Interpretation:<br>• <3 days = short-term, high-frequency strategy<br>• >10 days = longer-term mean reversion<br>• Use to optimize your capital efficiency"
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

                    # Get chart data for this pair - use same format as /chart-data endpoint
                    pair_df = df[['date', ticker1, ticker2]]
                    best_chart_data = pair_df.to_dict(orient="records")

            except Exception as e:
                logging.error(f"Error processing pair {ticker1}-{ticker2}: {str(e)}")
                continue

    if best_pair is None or best_chart_data is None:
        raise ValueError("No valid cointegrated pairs found")

    return best_pair, best_chart_data