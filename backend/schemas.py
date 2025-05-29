from typing import List, Dict, Optional, Any, Tuple
from pydantic import BaseModel, RootModel
from datetime import datetime

class TickerValidation(BaseModel):
    valid: bool
    name: str

class DefaultTickers(BaseModel):
    finance: List[str]
    healthcare: List[str]
    tech: List[str]
    energy: List[str]

class SectorsResponse(BaseModel):
    sectors: List[str]

class SectorTickersResponse(BaseModel):
    tickers: List[str]

class RiskMetrics(BaseModel):
    cumulative_return: float
    annualized_return: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown: float
    var_95: float
    cvar_95: float
    profit_factor: float
    mae: float
    adf_statistic: float
    p_value: float
    hedge_ratio: float
    half_life_days: float
    number_of_trades: int
    win_rate: float
    mean_duration: float
    z_score: float

class ChartDataPoint(BaseModel):
    date: datetime
    # Allow any additional ticker fields
    model_config = {
        "extra": "allow"
    }

class ChartDataResponse(RootModel):
    root: List[ChartDataPoint]

class DateResponse(BaseModel):
    date: str

class MetricMetadata(BaseModel):
    id: str
    title: str
    description: str

class MetricsList(BaseModel):
    metrics: List[MetricMetadata]

class BestPairResponse(BaseModel):
    pair: Tuple[str, str]
    chart_data: List[Dict[str, Any]]
