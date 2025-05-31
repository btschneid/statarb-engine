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
    # Row 1: Relationship & Stationarity
    hedge_ratio: float
    cointegration_adf_stat: float
    cointegration_p_value: float
    spread_adf_stat: float
    spread_adf_p_value: float
    mean_reversion_half_life_days: float
    spread_std_dev: float
    
    # Row 2: Spread Performance & Risk Metrics
    spread_z_score: float
    spread_cumulative_return: float
    spread_annualized_return: float
    spread_sharpe_ratio: float
    spread_sortino_ratio: float
    spread_calmar_ratio: float
    spread_max_drawdown: float
    
    # Row 3: Trade Stats & Tail Risk
    spread_var_95: float
    spread_cvar_95: float
    spread_profit_factor: float
    spread_mae: float
    num_trades: int
    win_rate: float
    mean_trade_duration_days: float

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
