import logging
import os
from pathlib import Path

TICKER_SETS = {
    "banks": ["JPM", "BAC", "WFC", "GS", "MS", "C"],
    "airlines": ["DAL", "UAL", "AAL", "LUV"],
    "etfs": ["SPY", "QQQ", "DIA", "XLF", "XLK", "XLE"],
    "known_pairs": [("KO", "PEP"), ("CVX", "XOM"), ("WMT", "TGT")]
}
START_DATE = "2016-01-01"
END_DATE = "2025-01-01"

# Create logs directory if it doesn't exist
logs_dir = Path(__file__).parent.parent / "logs"
logs_dir.mkdir(exist_ok=True)

# Create a logger object
logger = logging.getLogger('statarb')  # Using a specific name for the application
logger.setLevel(logging.DEBUG)  # Set minimum logging level

# Prevent adding handlers multiple times
if not logger.handlers:
    # Create console handler with a specific log level
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)

    # Create file handler
    file_handler = logging.FileHandler(logs_dir / "statarb.log")
    file_handler.setLevel(logging.DEBUG)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # Add handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

# Export the logger for use in other files
__all__ = ['logger', 'TICKER_SETS', 'START_DATE', 'END_DATE']
