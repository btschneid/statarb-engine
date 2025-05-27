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
    "finance": FINANCE_TICKERS,
    "healthcare": HEALTHCARE_TICKERS,
    "tech": TECH_TICKERS,
    "energy": ENERGY_TICKERS
} 