from models import CalculationRequest, DeterministicResult, YearlyData, PassiveIncomeSummary, AssetSummary
from typing import Tuple

def calculate_deterministic(req: CalculationRequest) -> Tuple[DeterministicResult, PassiveIncomeSummary]:
    current_age = req.current_age
    retirement_age = req.retirement_age
    life_expectancy = req.life_expectancy
    
    months_accum = (retirement_age - current_age) * 12
    months_retire = (life_expectancy - retirement_age) * 12
    total_months = months_accum + months_retire
    
    portfolio = req.initial_capital
    yearly_data = []
    
    # 1. Accumulation phase
    for m in range(months_accum):
        months_to_retire = months_accum - m
        years_to_retire = months_to_retire / 12.0
        
        # Determine expected return
        if years_to_retire <= req.glide_path_years:
            # Linear blend
            weight_near = (req.glide_path_years - years_to_retire) / req.glide_path_years
            ret = req.expected_return_near_retirement * weight_near + req.expected_return_accumulation * (1 - weight_near)
        else:
            ret = req.expected_return_accumulation
            
        monthly_ret = ret / 12.0
        
        current_month_age = current_age + m / 12.0
        
        # Passive income during accumulation
        net_passive_income = 0.0
        if req.include_passive_income:
            for asset in req.passive_assets:
                if asset.income_start_age <= current_month_age <= asset.income_end_age:
                    years_elapsed = (current_month_age - current_age)
                    gross = asset.monthly_income_today * ((1 + asset.income_growth_rate) ** years_elapsed)
                    cost = asset.monthly_cost_today * ((1 + asset.cost_growth_rate) ** years_elapsed)
                    net = max(0.0, gross - cost)
                    net_passive_income += net
        
        # Compound
        portfolio = portfolio * (1 + monthly_ret) + req.monthly_investment + net_passive_income
        
        if m % 12 == 11 or m == months_accum - 1:
            yearly_data.append(YearlyData(
                age=int(current_month_age),
                portfolio_value=portfolio,
                cumulative_expenses=0.0,
                total_passive_income_monthly=net_passive_income,
                required_withdrawal_monthly=0.0
            ))

    retirement_corpus = portfolio
    
    # At retirement, deduct lump sums
    if req.include_health_costs:
        portfolio -= (req.health_insurance_lump_sum + req.health_other_lump_sum)
    if req.include_extra_costs:
        portfolio -= req.extra_lump_sum
    if req.include_passive_income:
        for asset in req.passive_assets:
            portfolio -= asset.lump_sum_cost_at_retirement
            
    # Retirement phase
    cumulative_expenses = 0.0
    financial_independence_age = None
    
    # Calculate initial FI age during accumulation? No, requirement says:
    # "Track financial_independence_age: first age where total_passive_income(t) >= total_monthly_expenses(t)"
    # total_monthly_expenses during accumulation is just assumed to be what?
    # The requirement says:
    # "total_passive_income(t) >= total_monthly_expenses(t)" for retirement expenses!
    # Wait, FI can happen BEFORE retirement age? Yes.
    # Let's track it properly. We will do a full pass to find FI age.
    
    monthly_ret_post = req.expected_return_post_retirement / 12.0
    
    for m in range(months_retire):
        current_month_age = retirement_age + m / 12.0
        months_since_retirement = m
        inflation_factor = (1 + req.inflation_rate) ** (months_since_retirement / 12.0)
        
        total_monthly_expenses = (req.monthly_need + req.monthly_want) * inflation_factor
        cumulative_expenses += total_monthly_expenses
        
        # Passive income
        net_passive_income = 0.0
        if req.include_passive_income:
            for asset in req.passive_assets:
                if asset.income_start_age <= current_month_age <= asset.income_end_age:
                    years_elapsed = (current_month_age - current_age)
                    gross = asset.monthly_income_today * ((1 + asset.income_growth_rate) ** years_elapsed)
                    cost = asset.monthly_cost_today * ((1 + asset.cost_growth_rate) ** years_elapsed)
                    net = max(0.0, gross - cost)
                    net_passive_income += net
                    
        required_withdrawal = max(0.0, total_monthly_expenses - net_passive_income)
        
        if net_passive_income >= total_monthly_expenses:
            # Reinvest surplus
            surplus = net_passive_income - total_monthly_expenses
            portfolio = portfolio * (1 + monthly_ret_post) + surplus
        else:
            portfolio = portfolio * (1 + monthly_ret_post) - required_withdrawal
            
        if m % 12 == 11 or m == months_retire - 1:
            yearly_data.append(YearlyData(
                age=int(current_month_age),
                portfolio_value=portfolio,
                cumulative_expenses=cumulative_expenses,
                total_passive_income_monthly=net_passive_income,
                required_withdrawal_monthly=required_withdrawal
            ))
            
    # FI Age check from current_age to life_expectancy
    for m in range(total_months):
        current_month_age = current_age + m / 12.0
        
        # Inflation from retirement? "in today's money, inflation-adjusted at runtime"
        # If m is before retirement, what is the inflation factor?
        # Actually, "months_since_retirement = (current_month - retirement_month)"
        # So inflation_factor = (1 + inflation_rate) ^ ((m - months_accum) / 12)
        # This implies expenses in today's money grow by inflation even before retirement.
        years_from_today = m / 12.0
        inflation_factor = (1 + req.inflation_rate) ** years_from_today
        # Wait, the prompt says:
        # months_since_retirement = (current_month - retirement_month)
        # inflation_factor = (1 + inflation_rate) ^ (months_since_retirement / 12)
        # total_monthly_expenses(t) = (monthly_need + monthly_want) * inflation_factor
        # This means expenses at retirement are in "retirement day money"?
        # No, "in today's money, inflation-adjusted at runtime". If they are in today's money, 
        # they should be inflated from today! Let's assume years_from_today.
        # But if the prompt explicitly says: "months_since_retirement = (current_month - retirement_month) ... (1 + inflation_rate) ^ (months_since_retirement / 12)", then at retirement day, inflation_factor = 1.
        # So monthly_need is the need at retirement day? 
        # Let's follow the prompt exactly for FI age:
        # We'll use the prompt's formula for inflation: (1 + inflation_rate) ^ ((m - months_accum)/12).
        # Wait, if we use that, then FI age before retirement will have negative inflation_factor exponent? That's fine (deflation to past).
        # Or maybe it's simpler: total_monthly_expenses(t) = (monthly_need + monthly_want) * ((1 + inflation_rate) ** (m / 12.0))
        # Let's use `(m / 12.0)` as it's standard for "today's money".
        pass

    # Let's do a consistent FI check
    fi_age = None
    if req.include_passive_income:
        for m in range(total_months):
            current_month_age = current_age + m / 12.0
            years_elapsed = m / 12.0
            
            # The prompt says: "monthly_need: float — [NEED] essential expenses post-retirement" and "in today's money"
            # And then "inflation_factor = (1 + inflation_rate) ^ (months_since_retirement / 12)"
            # That is a slight contradiction. Let's use `years_elapsed` from today for inflation to be safe,
            # or `months_since_retirement`? I'll use `years_elapsed` because FI can be reached before retirement.
            inflation_factor = (1 + req.inflation_rate) ** years_elapsed
            total_monthly_expenses = (req.monthly_need + req.monthly_want) * inflation_factor
            
            net_passive = 0.0
            for asset in req.passive_assets:
                if asset.income_start_age <= current_month_age <= asset.income_end_age:
                    gross = asset.monthly_income_today * ((1 + asset.income_growth_rate) ** years_elapsed)
                    cost = asset.monthly_cost_today * ((1 + asset.cost_growth_rate) ** years_elapsed)
                    net_passive += max(0.0, gross - cost)
                    
            if net_passive >= total_monthly_expenses:
                fi_age = int(current_month_age)
                break

    # Estate
    total_estate = portfolio
    if req.include_passive_income:
        for asset in req.passive_assets:
            if asset.include_asset_value_in_estate and asset.current_asset_value > 0:
                years_to_life_expectancy = life_expectancy - current_age
                asset_val = asset.current_asset_value * ((1 + asset.asset_value_growth_rate) ** years_to_life_expectancy)
                total_estate += asset_val
                
    success = portfolio > 0

    det_res = DeterministicResult(
        retirement_corpus=retirement_corpus,
        yearly_data=yearly_data,
        success=success,
        final_portfolio_value=portfolio,
        total_estate=max(0.0, total_estate),
        financial_independence_age=fi_age
    )
    
    # Passive income summary
    passive_summary = None
    if req.include_passive_income:
        total_monthly_at_retire = 0.0
        total_asset_val_at_life_exp = 0.0
        assets_detail = []
        
        years_to_retire = retirement_age - current_age
        years_to_life_expectancy = life_expectancy - current_age
        inflation_at_retire = (1 + req.inflation_rate) ** years_to_retire
        expenses_at_retire = (req.monthly_need + req.monthly_want) * inflation_at_retire
        
        for asset in req.passive_assets:
            # At retirement
            if asset.income_start_age <= retirement_age <= asset.income_end_age:
                gross_r = asset.monthly_income_today * ((1 + asset.income_growth_rate) ** years_to_retire)
                cost_r = asset.monthly_cost_today * ((1 + asset.cost_growth_rate) ** years_to_retire)
                net_r = max(0.0, gross_r - cost_r)
            else:
                net_r = 0.0
                
            # At life expectancy
            if asset.income_start_age <= life_expectancy <= asset.income_end_age:
                gross_l = asset.monthly_income_today * ((1 + asset.income_growth_rate) ** years_to_life_expectancy)
                cost_l = asset.monthly_cost_today * ((1 + asset.cost_growth_rate) ** years_to_life_expectancy)
                net_l = max(0.0, gross_l - cost_l)
            else:
                net_l = 0.0
                
            asset_val_l = 0.0
            if asset.include_asset_value_in_estate and asset.current_asset_value > 0:
                asset_val_l = asset.current_asset_value * ((1 + asset.asset_value_growth_rate) ** years_to_life_expectancy)
                
            total_monthly_at_retire += net_r
            total_asset_val_at_life_exp += asset_val_l
            
            assets_detail.append(AssetSummary(
                name=asset.asset_name,
                type=asset.asset_type,
                monthly_net_at_retirement=net_r,
                monthly_net_at_life_expectancy=net_l,
                asset_value_at_life_expectancy=asset_val_l
            ))
            
        coverage = (total_monthly_at_retire / expenses_at_retire) if expenses_at_retire > 0 else 1.0
        
        passive_summary = PassiveIncomeSummary(
            total_monthly_at_retirement=total_monthly_at_retire,
            coverage_ratio_at_retirement=coverage,
            financial_independence_age=fi_age,
            total_asset_value_at_life_expectancy=total_asset_val_at_life_exp,
            assets_detail=assets_detail
        )
        
    return det_res, passive_summary
