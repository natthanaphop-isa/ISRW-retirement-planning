export function calculateDeterministic(req) {
  const current_age = req.current_age;
  const retirement_age = req.retirement_age;
  const life_expectancy = req.life_expectancy;
  
  const months_accum = (retirement_age - current_age) * 12;
  const months_retire = (life_expectancy - retirement_age) * 12;
  const total_months = months_accum + months_retire;
  
  let portfolio = req.initial_capital;
  const yearly_data = [];
  
  // 1. Accumulation phase
  for (let m = 0; m < months_accum; m++) {
      const months_to_retire = months_accum - m;
      const years_to_retire = months_to_retire / 12.0;
      
      let ret;
      if (years_to_retire <= req.glide_path_years) {
          const weight_near = (req.glide_path_years - years_to_retire) / req.glide_path_years;
          ret = req.expected_return_near_retirement * weight_near + req.expected_return_accumulation * (1 - weight_near);
      } else {
          ret = req.expected_return_accumulation;
      }
          
      const monthly_ret = ret / 12.0;
      const current_month_age = current_age + m / 12.0;
      
      let net_passive_income = 0.0;
      if (req.include_passive_income) {
          for (const asset of req.passive_assets) {
              if (asset.income_start_age <= current_month_age && current_month_age <= asset.income_end_age) {
                  const years_elapsed = current_month_age - current_age;
                  const gross = asset.monthly_income_today * Math.pow(1 + asset.income_growth_rate, years_elapsed);
                  const cost = asset.monthly_cost_today * Math.pow(1 + asset.cost_growth_rate, years_elapsed);
                  net_passive_income += Math.max(0.0, gross - cost);
              }
          }
      }
      
      portfolio = portfolio * (1 + monthly_ret) + req.monthly_investment + net_passive_income;
      
      if (m % 12 === 11 || m === months_accum - 1) {
          yearly_data.push({
              age: Math.floor(current_month_age),
              portfolio_value: portfolio,
              cumulative_expenses: 0.0,
              total_passive_income_monthly: net_passive_income,
              required_withdrawal_monthly: 0.0
          });
      }
  }

  const retirement_corpus = portfolio;
  
  if (req.include_health_costs) {
      portfolio -= (req.health_insurance_lump_sum + req.health_other_lump_sum);
  }
  if (req.include_extra_costs) {
      portfolio -= req.extra_lump_sum;
  }
  if (req.include_passive_income) {
      for (const asset of req.passive_assets) {
          portfolio -= asset.lump_sum_cost_at_retirement;
      }
  }
          
  let cumulative_expenses = 0.0;
  const monthly_ret_post = req.expected_return_post_retirement / 12.0;
  
  for (let m = 0; m < months_retire; m++) {
      const current_month_age = retirement_age + m / 12.0;
      const inflation_factor = Math.pow(1 + req.inflation_rate, m / 12.0);
      
      const total_monthly_expenses = (req.monthly_need + req.monthly_want) * inflation_factor;
      cumulative_expenses += total_monthly_expenses;
      
      let net_passive_income = 0.0;
      if (req.include_passive_income) {
          for (const asset of req.passive_assets) {
              if (asset.income_start_age <= current_month_age && current_month_age <= asset.income_end_age) {
                  const years_elapsed = current_month_age - current_age;
                  const gross = asset.monthly_income_today * Math.pow(1 + asset.income_growth_rate, years_elapsed);
                  const cost = asset.monthly_cost_today * Math.pow(1 + asset.cost_growth_rate, years_elapsed);
                  net_passive_income += Math.max(0.0, gross - cost);
              }
          }
      }
                  
      const required_withdrawal = Math.max(0.0, total_monthly_expenses - net_passive_income);
      
      if (net_passive_income >= total_monthly_expenses) {
          const surplus = net_passive_income - total_monthly_expenses;
          portfolio = portfolio * (1 + monthly_ret_post) + surplus;
      } else {
          portfolio = portfolio * (1 + monthly_ret_post) - required_withdrawal;
      }
          
      if (m % 12 === 11 || m === months_retire - 1) {
          yearly_data.push({
              age: Math.floor(current_month_age),
              portfolio_value: portfolio,
              cumulative_expenses: cumulative_expenses,
              total_passive_income_monthly: net_passive_income,
              required_withdrawal_monthly: required_withdrawal
          });
      }
  }
          
  let fi_age = null;
  if (req.include_passive_income) {
      for (let m = 0; m < total_months; m++) {
          const current_month_age = current_age + m / 12.0;
          const years_elapsed = m / 12.0;
          
          const inflation_factor = Math.pow(1 + req.inflation_rate, years_elapsed);
          const total_monthly_expenses = (req.monthly_need + req.monthly_want) * inflation_factor;
          
          let net_passive = 0.0;
          for (const asset of req.passive_assets) {
              if (asset.income_start_age <= current_month_age && current_month_age <= asset.income_end_age) {
                  const gross = asset.monthly_income_today * Math.pow(1 + asset.income_growth_rate, years_elapsed);
                  const cost = asset.monthly_cost_today * Math.pow(1 + asset.cost_growth_rate, years_elapsed);
                  net_passive += Math.max(0.0, gross - cost);
              }
          }
                  
          if (net_passive >= total_monthly_expenses) {
              fi_age = Math.floor(current_month_age);
              break;
          }
      }
  }

  let total_estate = portfolio;
  if (req.include_passive_income) {
      for (const asset of req.passive_assets) {
          if (asset.include_asset_value_in_estate && asset.current_asset_value > 0) {
              const years_to_life_expectancy = life_expectancy - current_age;
              const asset_val = asset.current_asset_value * Math.pow(1 + asset.asset_value_growth_rate, years_to_life_expectancy);
              total_estate += asset_val;
          }
      }
  }
              
  const success = portfolio > 0;

  const det_res = {
      retirement_corpus: retirement_corpus,
      yearly_data: yearly_data,
      success: success,
      final_portfolio_value: portfolio,
      total_estate: Math.max(0.0, total_estate),
      financial_independence_age: fi_age
  };
  
  let passive_summary = null;
  if (req.include_passive_income) {
      let total_monthly_at_retire = 0.0;
      let total_asset_val_at_life_exp = 0.0;
      const assets_detail = [];
      
      const years_to_retire = retirement_age - current_age;
      const years_to_life_expectancy = life_expectancy - current_age;
      const inflation_at_retire = Math.pow(1 + req.inflation_rate, years_to_retire);
      const expenses_at_retire = (req.monthly_need + req.monthly_want) * inflation_at_retire;
      
      for (const asset of req.passive_assets) {
          let net_r = 0.0;
          if (asset.income_start_age <= retirement_age && retirement_age <= asset.income_end_age) {
              const gross_r = asset.monthly_income_today * Math.pow(1 + asset.income_growth_rate, years_to_retire);
              const cost_r = asset.monthly_cost_today * Math.pow(1 + asset.cost_growth_rate, years_to_retire);
              net_r = Math.max(0.0, gross_r - cost_r);
          }
              
          let net_l = 0.0;
          if (asset.income_start_age <= life_expectancy && life_expectancy <= asset.income_end_age) {
              const gross_l = asset.monthly_income_today * Math.pow(1 + asset.income_growth_rate, years_to_life_expectancy);
              const cost_l = asset.monthly_cost_today * Math.pow(1 + asset.cost_growth_rate, years_to_life_expectancy);
              net_l = Math.max(0.0, gross_l - cost_l);
          }
              
          let asset_val_l = 0.0;
          if (asset.include_asset_value_in_estate && asset.current_asset_value > 0) {
              asset_val_l = asset.current_asset_value * Math.pow(1 + asset.asset_value_growth_rate, years_to_life_expectancy);
          }
              
          total_monthly_at_retire += net_r;
          total_asset_val_at_life_exp += asset_val_l;
          
          assets_detail.push({
              name: asset.asset_name,
              type: asset.asset_type,
              monthly_net_at_retirement: net_r,
              monthly_net_at_life_expectancy: net_l,
              asset_value_at_life_expectancy: asset_val_l
          });
      }
          
      const coverage = expenses_at_retire > 0 ? (total_monthly_at_retire / expenses_at_retire) : 1.0;
      
      passive_summary = {
          total_monthly_at_retirement: total_monthly_at_retire,
          coverage_ratio_at_retirement: coverage,
          financial_independence_age: fi_age,
          total_asset_value_at_life_expectancy: total_asset_val_at_life_exp,
          assets_detail: assets_detail
      };
  }
      
  return { deterministic: det_res, passive_income_summary: passive_summary };
}
