from src.config import TICKER_SETS, START_DATE, END_DATE, logger
from src.data_loader import load_data

def main():
    logger.info("Loading Data...")
    load_data(TICKER_SETS, START_DATE, END_DATE)

if __name__ == "__main__":
    main()