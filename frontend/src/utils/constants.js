export const defaultInputs = {
  current_age: 30,
  retirement_age: 65,
  life_expectancy: 85,
  
  initial_capital: 100000,
  monthly_investment: 20000,
  
  monthly_need: 30000,
  monthly_want: 10000,
  
  include_health_costs: false,
  health_insurance_lump_sum: 0,
  health_other_lump_sum: 0,
  
  include_extra_costs: false,
  extra_lump_sum: 0,
  
  include_passive_income: false,
  passive_assets: [],
  
  inflation_rate: 0.035,
  expected_return_accumulation: 0.08,
  expected_return_near_retirement: 0.05,
  glide_path_years: 5,
  expected_return_post_retirement: 0.035,
  
  success_cutoff: 80,
  enable_monte_carlo: true,
  n_simulations: 1000,
  sigma_accum: 0.10,
  sigma_near: 0.06,
  sigma_post: 0.04,
  sigma_inflation: 0.01,
  sigma_income_growth: 0.015,
  sigma_asset_value_growth: 0.03
};
