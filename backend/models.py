from pydantic import BaseModel, Field
from typing import List, Optional

class PassiveIncomeAsset(BaseModel):
    asset_name: str
    asset_type: str
    asset_icon: str = ""
    monthly_income_today: float = 0.0
    income_start_age: int
    income_end_age: int
    income_growth_rate: float = 0.02
    current_asset_value: float = 0.0
    asset_value_growth_rate: float = 0.03
    include_asset_value_in_estate: bool = True
    monthly_cost_today: float = 0.0
    cost_growth_rate: float = 0.02
    lump_sum_cost_at_retirement: float = 0.0

class CalculationRequest(BaseModel):
    current_age: int = Field(default=30, ge=18, le=60)
    retirement_age: int = Field(default=65, ge=40, le=75)
    life_expectancy: int = Field(default=85, ge=60, le=100)
    
    initial_capital: float = 100000.0
    monthly_investment: float = 20000.0
    
    monthly_need: float = 0.0
    monthly_want: float = 0.0
    
    include_health_costs: bool = False
    health_insurance_lump_sum: float = 0.0
    health_other_lump_sum: float = 0.0
    
    include_extra_costs: bool = False
    extra_lump_sum: float = 0.0
    
    include_passive_income: bool = False
    passive_assets: List[PassiveIncomeAsset] = []
    
    inflation_rate: float = 0.035
    expected_return_accumulation: float = 0.08
    expected_return_near_retirement: float = 0.05
    glide_path_years: int = 5
    expected_return_post_retirement: float = 0.035
    
    n_simulations: int = Field(default=1000, ge=500, le=5000)
    sigma_accum: float = 0.10
    sigma_near: float = 0.06
    sigma_post: float = 0.04
    sigma_inflation: float = 0.01
    sigma_income_growth: float = 0.015
    sigma_asset_value_growth: float = 0.03

class YearlyData(BaseModel):
    age: int
    portfolio_value: float
    cumulative_expenses: float
    total_passive_income_monthly: float
    required_withdrawal_monthly: float

class DeterministicResult(BaseModel):
    retirement_corpus: float
    yearly_data: List[YearlyData]
    success: bool
    final_portfolio_value: float
    total_estate: float
    financial_independence_age: Optional[int]

class PercentileData(BaseModel):
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float

class RuinProbability(BaseModel):
    age: int
    probability: float

class PercentilePaths(BaseModel):
    p10: List[float]
    p25: List[float]
    p50: List[float]
    p75: List[float]
    p90: List[float]

class HistogramBucket(BaseModel):
    bucket_min: float
    bucket_max: float
    count: int

class MonteCarloResult(BaseModel):
    success_rate: float
    simulations_run: int
    retirement_corpus: PercentileData
    final_estate: PercentileData
    total_estate_incl_assets: PercentileData
    financial_independence_age: PercentileData
    ruin_probability_by_age: List[RuinProbability]
    percentile_paths: PercentilePaths
    estate_histogram: List[HistogramBucket]

class AssetSummary(BaseModel):
    name: str
    type: str
    monthly_net_at_retirement: float
    monthly_net_at_life_expectancy: float
    asset_value_at_life_expectancy: float

class PassiveIncomeSummary(BaseModel):
    total_monthly_at_retirement: float
    coverage_ratio_at_retirement: float
    financial_independence_age: Optional[int]
    total_asset_value_at_life_expectancy: float
    assets_detail: List[AssetSummary]

class CalculationResponse(BaseModel):
    deterministic: DeterministicResult
    monte_carlo: MonteCarloResult
    passive_income_summary: Optional[PassiveIncomeSummary]
