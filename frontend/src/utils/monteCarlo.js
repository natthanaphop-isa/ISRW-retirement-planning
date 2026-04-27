import { randomNormal, percentile } from './mathUtils';

export function calculateMonteCarlo(req) {
  const n_sims = req.n_simulations;
  const current_age = req.current_age;
  const retirement_age = req.retirement_age;
  const life_expectancy = req.life_expectancy;
  
  const years_accum = retirement_age - current_age;
  const years_retire = life_expectancy - retirement_age;
  const total_years = years_accum + years_retire;
  
  const months_accum = years_accum * 12;
  const months_retire = years_retire * 12;
  const total_months = months_accum + months_retire;
  
  // Arrays to hold paths for percentiles later
  // shape: [total_years + 1][n_sims]
  const portfolio_yearly_paths = Array.from({ length: total_years + 1 }, () => new Float64Array(n_sims));
  
  const final_portfolio = new Float64Array(n_sims);
  const retirement_corpus_array = new Float64Array(n_sims);
  const total_estate = new Float64Array(n_sims);
  const ruin_month = new Int32Array(n_sims).fill(-1);
  const fi_ages = new Int32Array(n_sims).fill(999);

  let successCount = 0;
  
  // We can simulate per path to save memory allocation overhead
  for (let s = 0; s < n_sims; s++) {
    let portfolio = req.initial_capital;
    portfolio_yearly_paths[0][s] = portfolio;
    
    // Pre-calculate randoms for this sim
    const ret_annual = new Float64Array(total_years);
    const inf_annual = new Float64Array(total_years);
    const inc_growth = req.include_passive_income ? new Float64Array(total_years) : null;
    
    // Accumulation returns
    for (let y = 0; y < years_accum; y++) {
      let r = randomNormal(req.expected_return_accumulation, req.sigma_accum);
      if (req.glide_path_years > 0 && y >= years_accum - req.glide_path_years) {
        const r_near = randomNormal(req.expected_return_near_retirement, req.sigma_near);
        let weight_near = (req.glide_path_years - (years_accum - y)) / req.glide_path_years;
        weight_near = Math.min(1.0, Math.max(0.0, weight_near));
        r = r_near * weight_near + r * (1 - weight_near);
      }
      ret_annual[y] = Math.max(-0.30, Math.min(0.60, r));
    }
    // Retirement returns
    for (let y = years_accum; y < total_years; y++) {
      let r = randomNormal(req.expected_return_post_retirement, req.sigma_post);
      ret_annual[y] = Math.max(-0.30, Math.min(0.60, r));
    }
    
    // Sort ret_annual to find 25th percentile for this sim
    const ret_sorted = Float64Array.from(ret_annual).sort();
    const p25_ret = ret_sorted[Math.floor(ret_sorted.length * 0.25)];
    
    for (let y = 0; y < total_years; y++) {
      let inf = randomNormal(req.inflation_rate, req.sigma_inflation);
      inf_annual[y] = Math.max(-0.10, Math.min(0.30, inf));
      if (inc_growth) {
        let ig = randomNormal(req.passive_assets[0]?.income_growth_rate || 0.02, req.sigma_income_growth);
        if (ret_annual[y] <= p25_ret) {
          ig = Math.max(0, ig - 0.015);
        }
        inc_growth[y] = ig;
      }
    }
    
    let cum_inf = 1.0;
    let cum_ig = 1.0;
    
    for (let m = 0; m < total_months; m++) {
      const is_accum = m < months_accum;
      const y = Math.floor(m / 12);
      
      if (m % 12 === 0 && m > 0) {
        cum_inf *= (1 + inf_annual[y - 1]);
        if (inc_growth) cum_ig *= (1 + inc_growth[y - 1]);
      }
      
      const r_monthly = Math.pow(1 + ret_annual[y], 1.0 / 12.0) - 1;
      const current_month_age = current_age + m / 12.0;
      
      let total_passive_income = 0;
      if (req.include_passive_income) {
        for (const asset of req.passive_assets) {
          if (asset.income_start_age <= current_month_age && current_month_age <= asset.income_end_age) {
            const gross = asset.monthly_income_today * cum_ig;
            const cost_growth = Math.pow(1 + asset.cost_growth_rate, y);
            const cost = asset.monthly_cost_today * cost_growth;
            total_passive_income += Math.max(0, gross - cost);
          }
        }
      }
      
      const expense_monthly = (req.monthly_need + req.monthly_want) * cum_inf;
      
      if (is_accum) {
        portfolio = portfolio * (1 + r_monthly) + req.monthly_investment + total_passive_income;
      } else {
        if (m === months_accum) {
          if (req.include_health_costs) portfolio -= (req.health_insurance_lump_sum + req.health_other_lump_sum);
          if (req.include_extra_costs) portfolio -= req.extra_lump_sum;
          if (req.include_passive_income) {
            for (const asset of req.passive_assets) portfolio -= asset.lump_sum_cost_at_retirement;
          }
          retirement_corpus_array[s] = portfolio;
        }
        
        const required_withdrawal = Math.max(0, expense_monthly - total_passive_income);
        const surplus = Math.max(0, total_passive_income - expense_monthly);
        
        portfolio = portfolio * (1 + r_monthly) + surplus - required_withdrawal;
        
        if (portfolio <= 0 && ruin_month[s] === -1) {
          ruin_month[s] = m;
        }
      }
      
      if (req.include_passive_income && total_passive_income >= expense_monthly && fi_ages[s] === 999) {
        fi_ages[s] = Math.floor(current_month_age);
      }
      
      if (m % 12 === 11) {
        portfolio_yearly_paths[y + 1][s] = Math.max(0, portfolio);
      }
    }
    
    final_portfolio[s] = Math.max(0, portfolio);
    if (final_portfolio[s] > 0) successCount++;
    
    let estate = final_portfolio[s];
    if (req.include_passive_income) {
      for (const asset of req.passive_assets) {
        if (asset.include_asset_value_in_estate && asset.current_asset_value > 0) {
           let asset_val = asset.current_asset_value;
           for (let y = 0; y < total_years; y++) {
             const ag = randomNormal(asset.asset_value_growth_rate, req.sigma_asset_value_growth);
             asset_val *= (1 + ag);
           }
           estate += asset_val;
        }
      }
    }
    total_estate[s] = estate;
  }
  
  const getPct = (arr) => {
    const sorted = Float64Array.from(arr).sort();
    return {
      p10: percentile(sorted, 10),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p90: percentile(sorted, 90)
    };
  };
  
  const rc_pct = getPct(retirement_corpus_array);
  const fp_pct = getPct(final_portfolio);
  const te_pct = getPct(total_estate);
  
  const valid_fi = Array.from(fi_ages).filter(a => a !== 999);
  const fi_pct = valid_fi.length > 0 ? getPct(valid_fi) : {p10:0, p25:0, p50:0, p75:0, p90:0};
  
  const pct_paths = { p10: [], p25: [], p50: [], p75: [], p90: [] };
  for (let y = 0; y <= total_years; y++) {
    const sorted_path = Float64Array.from(portfolio_yearly_paths[y]).sort();
    pct_paths.p10.push(percentile(sorted_path, 10));
    pct_paths.p25.push(percentile(sorted_path, 25));
    pct_paths.p50.push(percentile(sorted_path, 50));
    pct_paths.p75.push(percentile(sorted_path, 75));
    pct_paths.p90.push(percentile(sorted_path, 90));
  }
  
  const ruin_prob = [];
  for (let y = years_accum; y <= total_years; y++) {
    const age = current_age + y;
    const months_passed = y * 12;
    let ruins_up_to_now = 0;
    for (let s = 0; s < n_sims; s++) {
      if (ruin_month[s] !== -1 && ruin_month[s] < months_passed) ruins_up_to_now++;
    }
    ruin_prob.push({ age, probability: (ruins_up_to_now / n_sims) * 100 });
  }

  return {
    success_rate: (successCount / n_sims) * 100,
    simulations_run: n_sims,
    retirement_corpus: rc_pct,
    final_estate: fp_pct,
    total_estate_incl_assets: te_pct,
    financial_independence_age: fi_pct,
    ruin_probability_by_age: ruin_prob,
    percentile_paths: pct_paths
  };
}
