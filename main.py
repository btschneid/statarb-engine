from src.config import TICKER_SETS, START_DATE, END_DATE, logger
from src.data_loader import load_data
from src.preprocess import preprocess_data

def main():
    logger.info("Loading Data...")
    load_data(TICKER_SETS, START_DATE, END_DATE)

    logger.info("Cleaning Data...")
    preprocess_data()

if __name__ == "__main__":
    main()