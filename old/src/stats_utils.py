import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller
from itertools import combinations

def calculate_pair_statistics(pair_data, ticker1, ticker2):
    """
    Calculate comprehensive trading statistics for a pair of securities.
    
    Parameters:
    -----------
    pair_data : pd.DataFrame
        DataFrame with columns: date, adj_close_{ticker1}, vol_{ticker1}, adj_close_{ticker2}, vol_{ticker2}
    ticker1 : str
        First ticker symbol
    ticker2 : str  
        Second ticker symbol
        
    Returns:
    --------
    dict : Dictionary containing 18 calculated metrics
    """

    # Create log prices only for price columns
    price_col1 = f'adj_close_{ticker1}'
    price_col2 = f'adj_close_{ticker2}'

    df_log = np.log(pair_data[[price_col1, price_col2]])

    X = sm.add_constant(df_log[price_col2])
    model = sm.OLS(df_log[price_col1], X).fit()
    beta = model.params[price_col2]  # This is the hedge ratio
    residuals = model.resid

    # ADF test on residuals
    adf_result = adfuller(residuals)
    p_value = adf_result[1]
    adf_stat = adf_result[0]  # The ADF test statistic
    
    cum_return = 0
    annual_return = 0
    sharpe = 0
    sortino = 0
    calmar = 0
    max_drawdown = 0
    var_95 = 0
    cvar_95 = 0
    profit_factor = 0
    mae = 0
    #adf_stat = 0
    #p_value = 0
    #beta = 0
    half_life = 0
    mean_crossings = 0
    win_rate = 0
    trade_duration = 0
    current_z = 0

    return {
        'cum_return': cum_return,
        'annual_return': annual_return,
        'sharpe': sharpe,
        'sortino': sortino,
        'calmar': calmar,
        'max_drawdown': max_drawdown,
        'var_95': var_95,
        'cvar_95': cvar_95,
        'profit_factor': profit_factor,
        'mae': mae,
        'adf_stat': adf_stat,
        'p_value': p_value,
        'beta': beta,
        'half_life': half_life,
        'mean_crossings': mean_crossings,
        'win_rate': win_rate,
        'trade_duration': trade_duration,
        'current_z': current_z
    }