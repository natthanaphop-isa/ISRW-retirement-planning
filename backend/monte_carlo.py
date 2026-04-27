import numpy as np
from models import CalculationRequest, MonteCarloResult, PercentileData, PercentilePaths, RuinProbability, HistogramBucket

def calculate_monte_carlo(req: CalculationRequest) -> MonteCarloResult:
    n_sims = req.n_simulations
    current_age = req.current_age
    retirement_age = req.retirement_age
    life_expectancy = req.life_expectancy
    
    years_accum = retirement_age - current_age
    years_retire = life_expectancy - retirement_age
    total_years = years_accum + years_retire
    
    months_accum = years_accum * 12
    months_retire = years_retire * 12
    total_months = months_accum + months_retire
    
    # Generate random samples for all years
    # Accumulation
    ret_accum_annual = np.random.normal(req.expected_return_accumulation, req.sigma_accum, (n_sims, years_accum))
    # Glide path adjustment
    if req.glide_path_years > 0:
        glide_start_yr = max(0, years_accum - req.glide_path_years)
        ret_near_annual = np.random.normal(req.expected_return_near_retirement, req.sigma_near, (n_sims, years_accum))
        
        for y in range(glide_start_yr, years_accum):
            weight_near = (req.glide_path_years - (years_accum - y)) / req.glide_path_years
            weight_near = min(1.0, max(0.0, weight_near))
            # Actually, the prompt says: "blend linearly toward expected_return_near_retirement"
            # It's easier to blend the means, but since we already sampled, blending the samples is equivalent
            ret_accum_annual[:, y] = ret_near_annual[:, y] * weight_near + ret_accum_annual[:, y] * (1 - weight_near)
            
    # Retirement
    ret_retire_annual = np.random.normal(req.expected_return_post_retirement, req.sigma_post, (n_sims, years_retire))
    
    # Combine
    ret_annual = np.hstack([ret_accum_annual, ret_retire_annual])
    ret_annual = np.clip(ret_annual, -0.30, 0.60)
    
    # Monthly returns. shape: (n_sims, total_years) -> repeat each year 12 times to get (n_sims, total_months)
    ret_monthly = (1 + ret_annual) ** (1/12.0) - 1
    ret_monthly_full = np.repeat(ret_monthly, 12, axis=1)
    
    # Inflation
    inf_annual = np.random.normal(req.inflation_rate, req.sigma_inflation, (n_sims, total_years))
    inf_annual = np.clip(inf_annual, -0.10, 0.30)
    
    # We need inflation factor for each month. 
    # Let's approximate inflation_factor for month m using the exact same years_elapsed as deterministic
    # The prompt actually says: "inflation_factor = (1 + inflation_rate) ^ (months_since_retirement / 12)"
    # Since we need to randomize inflation per year, the compound inflation up to year Y is prod(1 + inf_annual[:, :Y])
    inf_cumulative_annual = np.cumprod(1 + inf_annual, axis=1)
    # Add a column of ones at the beginning for year 0
    inf_cumulative_annual = np.hstack([np.ones((n_sims, 1)), inf_cumulative_annual[:, :-1]])
    inf_cumulative_monthly = np.repeat(inf_cumulative_annual, 12, axis=1)
    
    # Passive income logic
    fi_ages = np.full(n_sims, 999) # Placeholder
    
    # We will compute month by month because portfolio depends on path-dependent withdrawals
    portfolio = np.full(n_sims, req.initial_capital, dtype=np.float64)
    monthly_investment = req.monthly_investment
    
    # Calculate bottom quartile years for each simulation
    # If portfolio return in year Y is in bottom quartile of that simulation's returns
    percentile_25_ret = np.percentile(ret_annual, 25, axis=1, keepdims=True)
    is_bottom_quartile = ret_annual <= percentile_25_ret
    is_bottom_quartile_monthly = np.repeat(is_bottom_quartile, 12, axis=1)
    
    # Passive income monthly arrays (shape: n_sims, total_months)
    total_passive_income = np.zeros((n_sims, total_months))
    
    if req.include_passive_income:
        for asset in req.passive_assets:
            # Sample growth rates
            # Income growth
            inc_growth = np.random.normal(asset.income_growth_rate, req.sigma_income_growth, (n_sims, total_years))
            # "effective_income_growth_rate = max(0, sampled_income_growth_rate - 1.5%)" in bottom quartile years
            eff_inc_growth = np.where(is_bottom_quartile, np.maximum(0.0, inc_growth - 0.015), inc_growth)
            
            # Cumulative income growth
            cum_inc_growth = np.cumprod(1 + eff_inc_growth, axis=1)
            cum_inc_growth = np.hstack([np.ones((n_sims, 1)), cum_inc_growth[:, :-1]])
            cum_inc_growth_monthly = np.repeat(cum_inc_growth, 12, axis=1)
            
            # We don't randomize cost growth, use constant or just asset.cost_growth_rate
            cum_cost_growth = np.array([(1 + asset.cost_growth_rate) ** y for y in range(total_years)])
            cum_cost_growth_monthly = np.repeat(cum_cost_growth, 12).reshape(1, total_months)
            
            gross = asset.monthly_income_today * cum_inc_growth_monthly
            cost = asset.monthly_cost_today * cum_cost_growth_monthly
            net = np.maximum(0.0, gross - cost)
            
            # Mask out ages
            m_ages = current_age + np.arange(total_months) / 12.0
            mask = (m_ages >= asset.income_start_age) & (m_ages <= asset.income_end_age)
            net[:, ~mask] = 0.0
            
            total_passive_income += net

    # Track paths
    portfolio_paths = np.zeros((n_sims, total_years + 1))
    portfolio_paths[:, 0] = portfolio
    
    # Track FI
    base_monthly_expenses = req.monthly_need + req.monthly_want
    expenses_monthly = base_monthly_expenses * inf_cumulative_monthly
    
    # To vectorize over time but path dependent, a loop over months is needed for portfolio update 
    # if there are bounds (like max(0, withdrawal)).
    # Since numpy has no fast path-dependent cumulation with flooring at 0, we must loop over months.
    # 1000 sims * 600 months = 600,000 ops, totally fine in Python/Numpy (takes ~0.05s).
    
    ruin_month = np.full(n_sims, -1)
    
    for m in range(total_months):
        is_accum = m < months_accum
        
        # Withdrawals
        if is_accum:
            # Accumulation phase: net_passive_income adds to portfolio
            flow = monthly_investment + total_passive_income[:, m]
            portfolio = portfolio * (1 + ret_monthly_full[:, m]) + flow
        else:
            if m == months_accum:
                # Retirement lump sums
                if req.include_health_costs:
                    portfolio -= (req.health_insurance_lump_sum + req.health_other_lump_sum)
                if req.include_extra_costs:
                    portfolio -= req.extra_lump_sum
                if req.include_passive_income:
                    for asset in req.passive_assets:
                        portfolio -= asset.lump_sum_cost_at_retirement
            
            # Retirement phase
            net_passive = total_passive_income[:, m]
            expense = expenses_monthly[:, m]
            
            required_withdrawal = np.maximum(0.0, expense - net_passive)
            surplus = np.maximum(0.0, net_passive - expense)
            
            portfolio = portfolio * (1 + ret_monthly_full[:, m]) + surplus - required_withdrawal
            
            # Track ruin
            ruined = (portfolio <= 0) & (ruin_month == -1)
            ruin_month[ruined] = m

        if m % 12 == 11:
            y = m // 12
            portfolio_paths[:, y + 1] = portfolio
            
        # FI Check
        if req.include_passive_income:
            fi_reached = (total_passive_income[:, m] >= expenses_monthly[:, m]) & (fi_ages == 999)
            if np.any(fi_reached):
                fi_ages[fi_reached] = int(current_age + m / 12.0)
                
    portfolio_paths = np.maximum(0, portfolio_paths)
    retirement_corpus_array = portfolio_paths[:, years_accum]
    final_portfolio = portfolio_paths[:, -1]
    
    success_rate = float(np.mean(final_portfolio > 0) * 100)
    
    # Estate calculation
    total_estate = final_portfolio.copy()
    if req.include_passive_income:
        for asset in req.passive_assets:
            if asset.include_asset_value_in_estate and asset.current_asset_value > 0:
                asset_val_growth = np.random.normal(asset.asset_value_growth_rate, req.sigma_asset_value_growth, (n_sims, total_years))
                cum_asset_val_growth = np.prod(1 + asset_val_growth, axis=1)
                total_estate += asset.current_asset_value * cum_asset_val_growth
                
    # Percentiles
    def get_pct(arr):
        return PercentileData(
            p10=float(np.percentile(arr, 10)),
            p25=float(np.percentile(arr, 25)),
            p50=float(np.percentile(arr, 50)),
            p75=float(np.percentile(arr, 75)),
            p90=float(np.percentile(arr, 90))
        )
        
    rc_pct = get_pct(retirement_corpus_array)
    fp_pct = get_pct(final_portfolio)
    te_pct = get_pct(total_estate)
    
    # FI Age percentiles (only for those who reached FI)
    valid_fi = fi_ages[fi_ages != 999]
    if len(valid_fi) > 0:
        fi_pct = get_pct(valid_fi)
    else:
        fi_pct = PercentileData(p10=0, p25=0, p50=0, p75=0, p90=0)
        
    # Percentile paths
    # shape is (n_sims, total_years + 1)
    paths_10 = np.percentile(portfolio_paths, 10, axis=0).tolist()
    paths_25 = np.percentile(portfolio_paths, 25, axis=0).tolist()
    paths_50 = np.percentile(portfolio_paths, 50, axis=0).tolist()
    paths_75 = np.percentile(portfolio_paths, 75, axis=0).tolist()
    paths_90 = np.percentile(portfolio_paths, 90, axis=0).tolist()
    
    pct_paths = PercentilePaths(
        p10=paths_10,
        p25=paths_25,
        p50=paths_50,
        p75=paths_75,
        p90=paths_90
    )
    
    # Ruin probability by age
    ruin_prob = []
    # ruin_month is from 0 to total_months
    # If ruin_month != -1, then simulation ruined.
    # Cumulative ruins at each age
    for y in range(years_accum, total_years + 1):
        age = current_age + y
        months_passed = y * 12
        ruins_up_to_now = np.sum((ruin_month != -1) & (ruin_month < months_passed))
        prob = float(ruins_up_to_now) / n_sims * 100
        ruin_prob.append(RuinProbability(age=age, probability=prob))
        
    # Histogram
    hist, bin_edges = np.histogram(total_estate, bins=20)
    estate_hist = []
    for i in range(len(hist)):
        estate_hist.append(HistogramBucket(
            bucket_min=float(bin_edges[i]),
            bucket_max=float(bin_edges[i+1]),
            count=int(hist[i])
        ))
        
    return MonteCarloResult(
        success_rate=success_rate,
        simulations_run=n_sims,
        retirement_corpus=rc_pct,
        final_estate=fp_pct,
        total_estate_incl_assets=te_pct,
        financial_independence_age=fi_pct,
        ruin_probability_by_age=ruin_prob,
        percentile_paths=pct_paths,
        estate_histogram=estate_hist
    )
