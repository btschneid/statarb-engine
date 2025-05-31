from datetime import datetime

# API Configuration
API_TITLE = "Risk Engine API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "API for statistical arbitrage risk engine"

# CORS Configuration
CORS_ORIGINS = ["*"]  # Replace with frontend URL in production
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"]

# Date Configuration
DEFAULT_START_DATE = "2016-01-01"
DEFAULT_END_DATE = datetime.now().strftime("%Y-%m-%d")

# Ticker Lists
FINANCE_TICKERS = ["JPM", "BAC", "WFC", "GS", "MS"]
HEALTHCARE_TICKERS = ["JNJ", "PFE", "MRK", "UNH", "ABBV"]
TECH_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
ENERGY_TICKERS = ["XOM", "CVX", "COP", "SLB", "EOG"]

# Default Tickers by Category
DEFAULT_TICKERS = {
    "Finance": FINANCE_TICKERS,
    "Healthcare": HEALTHCARE_TICKERS,
    "Tech": TECH_TICKERS,
    "Energy": ENERGY_TICKERS
} 

# Default Sector
DEFAULT_SECTOR = "Tech"

# List of metrics
METRICS = [
    # Row 1: Relationship & Stationarity
    "hedge_ratio",
    "cointegration_adf_stat",
    "cointegration_p_value",
    "spread_adf_stat",
    "spread_adf_p_value",
    "mean_reversion_half_life_days",
    "spread_std_dev",
    
    # Row 2: Spread Performance & Risk Metrics
    "spread_z_score",
    "spread_cumulative_return",
    "spread_annualized_return",
    "spread_sharpe_ratio",
    "spread_sortino_ratio",
    "spread_calmar_ratio",
    "spread_max_drawdown",
    
    # Row 3: Trade Stats & Tail Risk
    "spread_var_95",
    "spread_cvar_95",
    "spread_profit_factor",
    "spread_mae",
    "num_trades",
    "win_rate",
    "mean_trade_duration_days"
]
