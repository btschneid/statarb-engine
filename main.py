from src.config import TICKER_SETS, START_DATE, END_DATE, logger
from src.data_loader import load_data
from src.preprocess import preprocess_data
from src.cointegration import find_cointegrated_pairs

def main():
    logger.info("Loading Data...")
    load_data(TICKER_SETS, START_DATE, END_DATE)

    logger.info("Cleaning Data...")
    processed_data = preprocess_data()

    logger.info("Finding cointegrated pairs...")
    coint_pairs = find_cointegrated_pairs(processed_data)

if __name__ == "__main__":
    main()