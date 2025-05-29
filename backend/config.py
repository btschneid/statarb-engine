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
    "cumulative_return",
    "annualized_return",
    "sharpe_ratio",
    "sortino_ratio",
    "calmar_ratio",
    "max_drawdown",
    "var_95",
    "cvar_95",
    "profit_factor",
    "mae",
    "adf_statistic",
    "p_value",
    "hedge_ratio",
    "half_life_days",
    "number_of_trades",
    "win_rate",
    "mean_duration",
    "z_score"
]
