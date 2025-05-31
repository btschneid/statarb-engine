import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple, Any
from config import (
    DEFAULT_START_DATE, DEFAULT_END_DATE,
    DEFAULT_TICKERS, DEFAULT_SECTOR, METRICS
)
from statsmodels.tsa.stattools import coint, adfuller
import statsmodels.api as sm
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

def calculate_risk_metrics(df: pd.DataFrame, tickers: List[str]) -> Dict[str, float]:
    """Calculate risk metrics for the given ticker data"""

    ticker_1, ticker_2 = tickers

    s1, s2 = df[ticker_1], df[ticker_2]

    # Hedge Ratio
    X = sm.add_constant(s2)
    model = sm.OLS(s1, X).fit()
    hedge_ratio = model.params.iloc[1]

    # Spread
    spread = s1 - (hedge_ratio * s2)

    # Coint Test
    coint_stat, coint_pval, _ = coint(s1, s2)

    # ADF test on the spread
    adf_result = adfuller(spread)
    spread_adf_stat, spread_adf_pval = adf_result[0], adf_result[1]

    # Placeholder implementation
    return {
        # Row 1: Relationship & Stationarity
        "hedge_ratio": hedge_ratio,
        "cointegration_adf_stat": coint_stat,
        "cointegration_p_value": coint_pval,
        "spread_adf_stat": spread_adf_stat,
        "spread_adf_p_value": spread_adf_pval,
        "mean_reversion_half_life_days": 0,
        "spread_std_dev": 0,

        # Row 2: Spread Performance & Risk Metrics
        "spread_z_score": 0,
        "spread_cumulative_return": 0,
        "spread_annualized_return": 0,
        "spread_sharpe_ratio": 0,
        "spread_sortino_ratio": 0,
        "spread_calmar_ratio": 0,
        "spread_max_drawdown": 0,

        # Row 3: Trade Stats & Tail Risk
        "spread_var_95": 0,
        "spread_cvar_95": 0,
        "spread_profit_factor": 0,
        "spread_mae": 0,
        "num_trades": 0,
        "win_rate": 0,
        "mean_trade_duration_days": 0
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
        # ROW 1: Relationship & Stationarity
        {
            "id": "hedge_ratio",
            "title": "Hedge Ratio",
            "decimal_places": 3,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This number tells you: 'For every 1 share of the first stock I buy, how many shares of the second stock should I sell to create a balanced pair?' It's like a recipe ratio - 1 cup flour needs 0.5 cups milk."
                "<br><br>"
                "Formula: \\text{spread} = \\text{ticker}_1 - \\text{hedge ratio} \\times \\text{ticker}_2<br>"
                "Obtained from OLS: hedge_ratio = slope of regression(ticker₁ ~ ticker₂)"
                "<br><br>"
                "Context: If Coca-Cola costs $50 and Pepsi costs $100, but historically Coke moves twice as much as Pepsi, your hedge ratio might be 0.5. This means: buy 1 share of Coke ($50) and sell 0.5 shares of Pepsi ($50), creating a balanced $0 net position that profits from their relative movements."
                "<br><br>"
                "Interpretation:"
                "• 0.8 = for every 1 share of stock A you buy, sell 0.8 shares of stock B"
                "• 1.2 = for every 1 share of stock A you buy, sell 1.2 shares of stock B"
                "• The goal is to make your total position value roughly neutral to market movements"
            )
        },
        {
            "id": "cointegration_adf_stat",
            "title": "Cointegration ADF Stat",
            "decimal_places": 3,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This is a statistical test that answers: 'Are these two stocks actually connected in a predictable way, or am I just imagining a pattern?' The ADF (Augmented Dickey-Fuller) test checks if the price difference between two stocks behaves predictably over time."
                "<br><br>"
                "Formula: \\Delta y_t = \\alpha + \\beta \\cdot t + \\gamma \\cdot y_{t-1} + \\sum_{i=1}^{p} \\delta_i \\cdot \\Delta y_{t-i} + \\epsilon_t<br>"
                "Test statistic = γ / SE(γ)"
                "<br><br>"
                "Context: Think of two friends walking dogs connected by an elastic leash. Sometimes one dog runs ahead, but the leash pulls them back together. The ADF test checks if your two stocks behave like those dogs - when one gets 'too far' from the other, do they reliably come back together?"
                "<br><br>"
                "Interpretation:"
                "• -4.0 or more negative = excellent - very strong statistical relationship"
                "• -3.5 to -4.0 = good - solid evidence of connection"
                "• -3.0 to -3.5 = moderate - some evidence but not bulletproof"
                "• Above -3.0 = weak - the stocks might not actually be connected"
            )
        },
        {
            "id": "cointegration_p_value",
            "title": "Cointegration P-Value",
            "decimal_places": 4,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This number answers: 'What's the probability that I'm wrong about these two stocks being connected?' It's like a confidence score for your pair trading strategy. Lower numbers mean you can be more confident the relationship is real, not just random chance."
                "<br><br>"
                "Formula: P\\left(|t| > |\\text{ADF stat}|\\right) \\text{ under null hypothesis of unit root}"
                "<br><br>"
                "Context: Scientists use p-values to decide if their discoveries are real or just lucky coincidences. In finance, we use the same idea. A p-value of 0.03 means there's only a 3% chance you're seeing a fake pattern. It's like a weather forecast - 97% chance of rain means you should probably bring an umbrella."
                "<br><br>"
                "Interpretation:"
                "• Below 0.01 = extremely confident - less than 1% chance you're wrong"
                "• 0.01-0.05 = confident - less than 5% chance you're wrong (industry standard)"
                "• 0.05-0.10 = moderate confidence - some risk you're seeing things that aren't there"
                "• Above 0.10 = weak confidence - too risky to trust this relationship"
            )
        },
        {
            "id": "spread_adf_stat",
            "title": "Spread ADF Stat",
            "decimal_places": 3,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This tests if the spread (price difference) itself is stationary, meaning it has a tendency to revert to its mean over time. It's like testing if a rubber band stretched away from its natural position will snap back."
                "<br><br>"
                "Formula: Applied to the spread: spread = price₁ - hedge_ratio × price₂"
                "<br><br>"
                "Context: Even if two stocks are cointegrated, you want to make sure their spread behaves predictably on its own. This test confirms that the spread doesn't just wander randomly but actually reverts to a mean value."
                "<br><br>"
                "Interpretation:"
                "• -4.0 or more negative = excellent - spread reliably reverts to mean"
                "• -3.5 to -4.0 = good - solid mean reversion behavior"
                "• -3.0 to -3.5 = moderate - some mean reversion tendency"
                "• Above -3.0 = weak - spread might not be predictable enough for trading"
            )
        },
        {
            "id": "spread_adf_p_value",
            "title": "Spread ADF P-Value",
            "decimal_places": 4,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This is the confidence level for the spread stationarity test. It tells you: 'How confident can I be that this spread actually reverts to its mean rather than just wandering randomly?'"
                "<br><br>"
                "Context: Lower p-values mean higher confidence that the spread is stationary and will revert to its mean, making it more predictable for trading strategies."
                "<br><br>"
                "Interpretation:"
                "• Below 0.01 = extremely confident - spread is highly predictable"
                "• 0.01-0.05 = confident - spread shows reliable mean reversion"
                "• 0.05-0.10 = moderate confidence - some predictability but be cautious"
                "• Above 0.10 = weak confidence - spread might be too random to trade"
            )
        },
        {
            "id": "mean_reversion_half_life_days",
            "title": "Mean Reversion Half-Life",
            "decimal_places": 1,
            "unit_type": "time",
            "unit_symbol": " days",
            "description": (
                "Definition: This answers the crucial question: 'When these two stocks get out of sync, how long does it typically take for them to get halfway back to normal?' It's like asking how long it takes a rubber band to snap halfway back after you stretch it."
                "<br><br>"
                "Formula: \\text{half life} = \\frac{\\ln(0.5)}{\\ln(1 + \\lambda)}<br>"
                "Where λ is the mean-reversion speed coefficient"
                "<br><br>"
                "Context: If two stocks are normally priced similarly, but one suddenly jumps 10% higher than the other, the half-life tells you how many days it usually takes for that gap to shrink to 5%. Faster is generally better because your money isn't tied up as long."
                "<br><br>"
                "Interpretation:"
                "• 1-5 days = very fast - profits come quickly, less time at risk"
                "• 5-15 days = moderate - reasonable timeframe for most strategies"
                "• 15-30 days = slow - requires patience and ties up capital longer"
                "• Above 30 days = very slow - might not be worth the wait"
            )
        },
        {
            "id": "spread_std_dev",
            "title": "Spread Standard Deviation",
            "decimal_places": 2,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This measures how much the spread typically bounces around its average value. It's like measuring how much a person's daily mood varies from their normal temperament - some people are very steady, others are more volatile."
                "<br><br>"
                "Formula: \\sigma_{\\text{spread}} = \\sqrt{\\text{variance}(\\text{spread})}"
                "<br><br>"
                "Context: A higher standard deviation means the spread moves in larger swings, potentially offering bigger profit opportunities but also bigger risks. A lower standard deviation means smaller, more predictable movements."
                "<br><br>"
                "Interpretation:"
                "• Low values = stable, predictable spread movements"
                "• Medium values = moderate volatility with reasonable opportunities"
                "• High values = volatile spread with big opportunities but higher risk"
                "• Used with Z-score to determine when spread is unusually wide or narrow"
            )
        },
        
        # ROW 2: Spread Performance & Risk Metrics
        {
            "id": "spread_z_score",
            "title": "Spread Z-Score",
            "decimal_places": 2,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This number tells you: 'How unusual is the current price difference between these two stocks?' It measures how many 'standard deviations' (think of them as units of weirdness) the current spread is from normal. It's like a fever thermometer for stock relationships."
                "<br><br>"
                "Formula: z = \\frac{\\text{spread}_{\\text{current}} - \\text{mean}(\\text{spread})}{\\text{std}(\\text{spread})}"
                "<br><br>"
                "Context: If Coke and Pepsi normally trade within $5 of each other, but today Coke is $15 higher than Pepsi, that's very unusual. The Z-score quantifies this unusualness. Most pair traders enter trades when Z-score hits +2 or -2 (meaning the spread is 2 standard deviations from normal)."
                "<br><br>"
                "Interpretation:"
                "• +2 or higher = very unusual - one stock is much more expensive than normal vs the other (time to sell the expensive one)"
                "• +1 to +2 = moderately unusual - starting to get interesting"
                "• -1 to +1 = normal range - no trading opportunity"
                "• -2 or lower = very unusual in opposite direction (time to buy the cheaper one)"
            )
        },
        {
            "id": "spread_cumulative_return",
            "title": "Spread Cumulative Return",
            "decimal_places": 2,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: This is like asking 'If I started with $100, how much money would I have at the end?' It's the total profit (or loss) your pair trading strategy made over the entire time period, expressed as a percentage."
                "<br><br>"
                "Formula: \\text{cumulative\\_return} = \\left( \\frac{\\text{final\\_value}}{\\text{initial\\_value}} - 1 \\right) \\times 100"
                "<br><br>"
                "Context: Imagine you're running a lemonade stand for a summer. This metric tells you if you made money overall. In pair trading, you're betting that two similar stocks (like Coca-Cola and Pepsi) will return to their normal price relationship when they get out of sync."
                "<br><br>"
                "Interpretation:"
                "• +50% means you turned $100 into $150 - you made $50 profit"
                "• +10% means modest gains - you made $10 on every $100"
                "• 0% means you broke even - no profit, no loss"
                "• -20% means you lost money - you'd have $80 left from your original $100"
            )
        },
        {
            "id": "spread_annualized_return",
            "title": "Spread Annualized Return",
            "decimal_places": 2,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: This answers 'How much would I make per year if this strategy kept performing the same way?' It's like converting your monthly salary into an annual salary - taking your actual results and scaling them to a full year for easy comparison."
                "<br><br>"
                "Formula: \\text{annualized\\_return} = \\left(\\left(1 + \\frac{\\text{cumulative\\_return}}{100}\\right)^{\\frac{252}{T}} - 1\\right) \\times 100<br>"
                "Where T = number of trading days (stock markets are closed weekends)"
                "<br><br>"
                "Context: This is crucial for comparing investments. A savings account might give you 2% per year, the stock market historically returns about 10% per year, and a good hedge fund might target 15-20%. This metric tells you where your strategy fits."
                "<br><br>"
                "Interpretation:"
                "• 15% per year is excellent - better than most professional investors"
                "• 10% per year matches the stock market's long-term average"
                "• 5% per year is decent but you could just buy index funds"
                "• Negative means you're losing money each year - time to stop!"
            )
        },
        {
            "id": "spread_sharpe_ratio",
            "title": "Spread Sharpe Ratio",
            "decimal_places": 2,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: Think of this as 'bang for your buck' but for risk. It measures how much extra return you get for taking on volatility (price swings). It's like asking: 'Is this roller coaster ride worth it for the thrill?'"
                "<br><br>"
                "Formula: \\text{Sharpe} = \\frac{R - R_f}{\\sigma} \\times \\sqrt{252}<br>"
                "• R = average daily return (how much you make per day on average)<br>"
                "• R_f = risk-free rate (what you'd get from a safe government bond, usually ~0%)<br>"
                "• σ = volatility (how much your daily returns bounce around)"
                "<br><br>"
                "Context: Imagine two investment strategies: Strategy A makes 20% per year but swings wildly (sometimes +5%, sometimes -8% in a day), while Strategy B makes 12% per year but is steady (usually +0.1% per day). Strategy B might have a better Sharpe ratio because it's less stressful."
                "<br><br>"
                "Interpretation:"
                "• Above 2.0 = excellent - you're getting great returns for the risk taken"
                "• 1.0-2.0 = good - reasonable reward for the risk"
                "• 0.5-1.0 = mediocre - might be better off in index funds"
                "• Below 0.5 = poor - too much risk for too little reward"
            )
        },
        {
            "id": "spread_sortino_ratio",
            "title": "Spread Sortino Ratio",
            "decimal_places": 2,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This is like the Sharpe ratio's smarter cousin. While Sharpe penalizes ALL volatility (even profitable swings), Sortino only cares about bad volatility - the downward swings that lose you money. It's like judging a restaurant only on the bad meals, not the amazing ones."
                "<br><br>"
                "Formula: \\text{Sortino} = \\frac{R - R_f}{\\sigma_{\\text{downside}}} \\times \\sqrt{252}<br>"
                "Where σ_downside = volatility of only the losing days"
                "<br><br>"
                "Context: Some strategies make money in big, irregular chunks with small losses in between. Sharpe ratio punishes this, but Sortino recognizes that 'good volatility' (big wins) is actually desirable. It's like preferring a job with steady small pay vs one with occasional big bonuses - some people prefer the bonuses."
                "<br><br>"
                "Interpretation:"
                "• Above 3.0 = outstanding - you rarely have big down days"
                "• 2.0-3.0 = very good - losses are controlled and predictable"
                "• 1.0-2.0 = acceptable - some painful days but not too many"
                "• Below 1.0 = concerning - too many bad losing streaks"
            )
        },
        {
            "id": "spread_calmar_ratio",
            "title": "Spread Calmar Ratio",
            "decimal_places": 2,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This asks the critical question: 'How much do I make each year compared to the worst loss I might face?' It's like evaluating a business by comparing annual profits to the biggest loss you might have to endure."
                "<br><br>"
                "Formula: \\text{Calmar} = \\frac{\\text{annualized\\_return}}{|\\text{max\\_drawdown}|}"
                "<br><br>"
                "Context: Imagine your strategy makes 15% per year but once had a period where you lost 30% of your money (even if you recovered later). The Calmar ratio would be 15/30 = 0.5. This helps you decide: 'Is 15% annual return worth potentially losing 30% at some point?'"
                "<br><br>"
                "Interpretation:"
                "• Above 3.0 = excellent - great returns with manageable worst-case losses"
                "• 1.0-3.0 = good - reasonable trade-off between return and risk"
                "• 0.5-1.0 = questionable - the potential losses might be too scary"
                "• Below 0.5 = dangerous - you risk losing more than you gain annually"
            )
        },
        {
            "id": "spread_max_drawdown",
            "title": "Spread Max Drawdown",
            "decimal_places": 2,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: This is your 'nightmare scenario' number - the biggest percentage drop from your highest point to your lowest point. It's like asking: 'What's the worst losing streak I experienced, and how much of my money did I lose during it?'"
                "<br><br>"
                "Formula: \\text{max\\_drawdown} = \\min\\left(\\frac{\\text{trough} - \\text{peak}}{\\text{peak}}\\right) \\times 100"
                "<br><br>"
                "Context: Say your strategy grew your $100 to $150, then crashed to $100, then recovered to $180. Your max drawdown would be -33% (from $150 peak to $100 trough). This number tells you the worst emotional and financial pain you would have endured, even if you ended up profitable overall."
                "<br><br>"
                "Interpretation:"
                "• -5% to -15% = mild - most people can handle this psychologically"
                "• -15% to -30% = moderate - requires discipline to stick with the strategy"
                "• -30% to -50% = severe - would cause sleepless nights for most investors"
                "• Worse than -50% = extreme - only for the most risk-tolerant investors"
            )
        },
        {
            "id": "spread_var_95",
            "title": "Spread VaR (95%)",
            "decimal_places": 2,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: VaR stands for 'Value at Risk.' This number answers: 'On a typical bad day (worst 5% of all days), how much money do I expect to lose?' It's like weather forecasting for your money - predicting how bad the 'storms' usually get."
                "<br><br>"
                "Formula: \\text{VaR}_{95} = \\text{percentile}(\\text{returns}, 5\\%) \\times 100"
                "<br><br>"
                "Context: If your VaR is -3%, it means that 95% of the time, you'll lose less than 3% in a day. Only 5% of days will be worse than -3%. Think of it like saying '95% of the time, traffic delays are under 20 minutes, but 5% of the time they're worse.'"
                "<br><br>"
                "Interpretation:"
                "• -1% to -2% = low risk - bad days are quite manageable"
                "• -2% to -4% = moderate risk - some painful days but not devastating"
                "• -4% to -7% = high risk - bad days will hurt your account noticeably"
                "• Worse than -7% = extreme risk - bad days could wipe out weeks of gains"
            )
        },
        {
            "id": "spread_cvar_95",
            "title": "Spread CVaR (95%)",
            "decimal_places": 2,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: CVaR stands for 'Conditional Value at Risk.' While VaR tells you the threshold of bad days, CVaR tells you: 'When you have a really bad day (worst 5%), how bad is it on average?' It's the difference between 'how often does it rain' vs 'when it does rain, how hard does it pour?'"
                "<br><br>"
                "Formula: \\text{CVaR}_{95} = \\text{mean}(\\text{returns where return} \\leq \\text{VaR}_{95}) \\times 100"
                "<br><br>"
                "Context: If your VaR is -3% but your CVaR is -8%, it means that while most bad days lose you around 3%, when you have a truly terrible day, you lose about 8% on average. It's like knowing that while most traffic jams delay you 20 minutes, the really bad ones average 2 hours."
                "<br><br>"
                "Interpretation:"
                "• -2% to -4% = manageable - even your worst days aren't catastrophic"
                "• -4% to -8% = concerning - your worst days can erase significant gains"
                "• -8% to -15% = dangerous - terrible days can set you back weeks or months"
                "• Worse than -15% = extreme - single bad days can destroy your account"
            )
        },
        {
            "id": "spread_profit_factor",
            "title": "Spread Profit Factor",
            "decimal_places": 2,
            "unit_type": "number",
            "unit_symbol": "",
            "description": (
                "Definition: This is a simple but powerful ratio that asks: 'For every dollar I lose on bad trades, how many dollars do I make on good trades?' It's like measuring a baseball player by comparing their successful hits to their strikeouts, but in money terms."
                "<br><br>"
                "Formula: \\text{Profit Factor} = \\frac{\\sum(\\text{profitable trades})}{|\\sum(\\text{losing trades})|}"
                "<br><br>"
                "Context: Imagine you make 10 trades: 6 win an average of $100 each ($600 total), and 4 lose an average of $80 each ($320 total). Your profit factor would be $600 ÷ $320 = 1.875. This means for every $1 you lose, you make $1.88 back."
                "<br><br>"
                "Interpretation:"
                "• Above 2.5 = excellent - your wins more than double your losses"
                "• 1.5-2.5 = good - solid positive expectation"
                "• 1.1-1.5 = barely profitable - wins barely exceed losses"
                "• 1.0 = break-even - wins exactly equal losses"
                "• Below 1.0 = losing strategy - you lose more than you win"
            )
        },
        {
            "id": "spread_mae",
            "title": "Spread MAE",
            "decimal_places": 2,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: MAE stands for 'Maximum Adverse Excursion.' This measures: 'During my trades, what's the worst unrealized loss I typically have to sit through before the trade works out?' It's like asking how far underwater you usually go before swimming back to the surface."
                "<br><br>"
                "Formula: \\text{MAE} = \\text{mean}\\left(\\max\\left(\\frac{|\\text{spread path} - \\text{entry spread}|}{|\\text{entry spread}|}\\right)\\right) \\times 100"
                "<br><br>"
                "Context: Imagine you buy a stock at $100, expecting it to go to $110. But first it drops to $95, then slowly climbs to $112 where you sell. Your MAE for this trade was 5% ($95 is 5% below your $100 entry). This metric averages that across all your trades."
                "<br><br>"
                "Interpretation:"
                "• 1-3% = low stress - trades usually don't go against you much"
                "• 3-7% = moderate stress - some trades will make you nervous"
                "• 7-15% = high stress - you'll need strong nerves to stick with trades"
                "• Above 15% = extreme stress - most people would panic and close trades early"
            )
        },
        {
            "id": "num_trades",
            "title": "Number of Trades",
            "decimal_places": 0,
            "unit_type": "count",
            "unit_symbol": "",
            "description": (
                "Definition: This is simply: 'How many complete buy-and-sell cycles did this strategy execute?' It's like counting how many times you went to the grocery store - more data points usually give you more confidence in your results."
                "<br><br>"
                "Formula: \\text{count of completed entry} \\rightarrow \\text{exit trade cycles}"
                "<br><br>"
                "Context: If you test a strategy for 2 years but it only generates 3 trades, you can't be very confident in the results. It's like judging a restaurant based on 3 meals vs 100 meals - more data is almost always better for making decisions."
                "<br><br>"
                "Interpretation:"
                "• 50+ trades = excellent sample size - high confidence in results"
                "• 20-50 trades = good sample size - reasonable confidence"
                "• 10-20 trades = small sample - some confidence but be cautious"
                "• Under 10 trades = very small sample - results might just be luck"
            )
        },
        {
            "id": "win_rate",
            "title": "Win Rate",
            "decimal_places": 1,
            "unit_type": "percentage",
            "unit_symbol": "%",
            "description": (
                "Definition: This answers: 'What percentage of my trades made money?' It's like a baseball batting average, but for trades. However, be careful - you can have a high win rate but still lose money if your losses are bigger than your wins."
                "<br><br>"
                "Formula: \\text{win rate} = \\frac{\\text{num winning trades}}{\\text{total trades}} \\times 100"
                "<br><br>"
                "Context: Imagine you make 10 trades: 8 win $10 each (total +$80) and 2 lose $50 each (total -$100). Your win rate is 80% but you lost $20 overall! This is why win rate alone doesn't tell the whole story - the size of wins vs losses matters more."
                "<br><br>"
                "Interpretation:"
                "• 70%+ = excellent - you're right most of the time"
                "• 55-70% = good - more wins than losses"
                "• 45-55% = average - basically a coin flip"
                "• Below 45% = concerning - you're wrong more often than right (better have big wins!)"
            )
        },
        {
            "id": "mean_trade_duration_days",
            "title": "Mean Trade Duration",
            "decimal_places": 1,
            "unit_type": "time",
            "unit_symbol": " days",
            "description": (
                "Definition: This tells you: 'On average, how many days is my money tied up in each trade?' It's like asking how long your typical vacation lasts - longer isn't necessarily better or worse, but it affects your planning and expectations."
                "<br><br>"
                "Formula: \\text{mean duration} = \\text{mean}(\\text{exit date} - \\text{entry date})"
                "<br><br>"
                "Context: Short durations (1-3 days) mean you can potentially do more trades and compound profits faster, but you need the price relationships to snap back quickly. Long durations (20+ days) tie up your capital longer but might capture bigger moves. It's a trade-off between frequency and size of opportunities."
                "<br><br>"
                "Interpretation:"
                "• 1-3 days = high-frequency strategy - requires quick mean reversion"
                "• 3-10 days = medium-term strategy - balanced approach"
                "• 10-30 days = longer-term strategy - requires patience but potentially bigger profits"
                "• 30+ days = very long-term - better make sure the profits justify tying up capital this long"
            )
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