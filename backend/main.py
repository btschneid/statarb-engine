# risk-engine-backend/main.py
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List, Dict, Tuple

from services import (
    get_default_tickers, get_ticker_data, get_sectors, get_sector_tickers,
    validate_ticker, validate_tickers, calculate_risk_metrics, get_default_dates,
    get_default_sector_tickers, get_metrics, find_best_cointegrated_pair
)
from schemas import (
    TickerValidation, DefaultTickers, ChartDataResponse,
    SectorsResponse, SectorTickersResponse, RiskMetrics,
    DateResponse, MetricsList, BestPairResponse
)
from config import (
    API_TITLE, API_VERSION, API_DESCRIPTION,
    CORS_ORIGINS, CORS_CREDENTIALS, CORS_METHODS, CORS_HEADERS,
    DEFAULT_START_DATE, DEFAULT_END_DATE
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

@app.get("/tickers/validate/{ticker}", response_model=TickerValidation)
def validate_ticker_endpoint(ticker: str):
    """Validate if a ticker exists on Yahoo Finance"""
    valid, name = validate_ticker(ticker)
    return {"valid": valid, "name": name if valid else ""}

@app.get("/tickers/validate", response_model=Dict[str, TickerValidation])
def validate_tickers_endpoint(tickers: List[str] = Query(...)):
    """Validate multiple tickers"""
    results = {}
    for ticker, valid, name in validate_tickers(tickers):
        results[ticker] = {"valid": valid, "name": name}
    return results

@app.get("/sectors", response_model=SectorsResponse)
def get_sectors_endpoint():
    """Get list of all sectors"""
    return {"sectors": get_sectors()}

@app.get("/sectors/{sector}/tickers", response_model=SectorTickersResponse)
def get_sector_tickers_endpoint(sector: str):
    """Get list of tickers for a specific sector"""
    tickers = get_sector_tickers(sector)
    if not tickers:
        raise HTTPException(status_code=404, detail=f"Sector {sector} not found")
    return {"tickers": tickers}

@app.get("/risk-metrics", response_model=RiskMetrics)
def get_risk_metrics(
    tickers: List[str] = Query(...),
    start: str = DEFAULT_START_DATE,
    end: str = DEFAULT_END_DATE
):
    """Get risk metrics for the specified tickers"""
    try:
        df = get_ticker_data(tickers, start, end)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found for the specified tickers")
        metrics = calculate_risk_metrics(df)
        return metrics
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating risk metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/chart-data", response_model=ChartDataResponse)
def get_chart_data(
    tickers: List[str] = Query(..., max_items=2),
    start: str = DEFAULT_START_DATE,
    end: str = DEFAULT_END_DATE
):
    if len(tickers) > 2:
        raise HTTPException(status_code=400, detail="Max of 2 tickers allowed")
    try:
        df = get_ticker_data(tickers, start, end)
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found for the specified tickers")
        return df.to_dict(orient="records")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting ticker data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/default-start-date", response_model=DateResponse)
def get_default_start_date():
    try:
        date = get_default_dates("start")
        return {"date": date}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting start date: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/default-end-date", response_model=DateResponse)
def get_default_end_date():
    try:
        date = get_default_dates("end")
        return {"date": date}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting end date: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.get("/default-sector-tickers", response_model=SectorTickersResponse)
def get_default_tickers_by_sector():
    try:
        tickers = get_default_sector_tickers()
        return {"tickers": tickers}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting default tickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@app.get("/metrics-list", response_model=MetricsList)
def get_all_metrics():
    try:
        metrics = get_metrics()
        return {"metrics": metrics}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting metrics list: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/find-best-pair", response_model=BestPairResponse)
def find_best_pair_endpoint(
    tickers: List[str] = Query(...),
    start: str = DEFAULT_START_DATE,
    end: str = DEFAULT_END_DATE
):
    """Find the best cointegrated pair from a list of tickers"""
    if len(tickers) < 2:
        raise HTTPException(status_code=400, detail="At least 2 tickers required")
    
    try:
        # Find the best pair and get its chart data
        best_pair, chart_data = find_best_cointegrated_pair(tickers, start, end)
        
        return {
            "pair": best_pair,
            "chart_data": chart_data
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error finding best pair: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")