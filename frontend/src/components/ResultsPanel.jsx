import React from 'react';
import { i18n } from '../i18n';
import { formatTHB, formatCompactTHB, formatPercent } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine, ComposedChart } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const ResultsPanel = ({ inputs, results, loading, error, lang }) => {
  const t = i18n[lang];

  if (error) {
    return <div className="card text-red-500 font-semibold">{error}</div>;
  }

  if (loading && !results) {
    return <div className="card text-gray-500 animate-pulse">Loading...</div>;
  }

  if (!results) {
    return null;
  }

  const { deterministic, monte_carlo, passive_income_summary } = results;
  const successRate = monte_carlo.success_rate;
  
  let badgeColor = "bg-danger-bg text-danger";
  let badgeText = `🔴 ${t.fail}`;
  if (successRate >= 80) {
    badgeColor = "bg-success-bg text-success";
    badgeText = `🟢 ${t.success}`;
  } else if (successRate >= 50) {
    badgeColor = "bg-warning-bg text-warning";
    badgeText = `🟡 ${t.risk}`;
  }

  const fiAge = deterministic.financial_independence_age;

  const combinedData = deterministic.yearly_data.map((detItem, idx) => {
    return {
      ...detItem,
      p50: monte_carlo.percentile_paths.p50[idx],
      p25_p75: [monte_carlo.percentile_paths.p25[idx], monte_carlo.percentile_paths.p75[idx]],
      p10_p90: [monte_carlo.percentile_paths.p10[idx], monte_carlo.percentile_paths.p90[idx]],
    };
  });

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className={`rounded-xl p-6 shadow-sm border border-gray-100 ${badgeColor} transition-colors duration-300`}>
        <h2 className="text-3xl font-bold mb-2">{t.plan_status}: {badgeText}</h2>
        <p className="text-lg opacity-90">{t.chance_of_success}: {successRate.toFixed(1)}% ({t.from_sims})</p>
      </div>

      {fiAge && (
        <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium flex items-center space-x-3 shadow-sm">
          <span className="text-2xl">🎯</span>
          <p>{t.fi_callout.replace('{age}', fiAge)}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">{t.metrics_corpus}</p>
          <p className="text-xl font-bold text-gray-800">{formatCompactTHB(monte_carlo.retirement_corpus.p50)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">{t.metrics_success}</p>
          <p className="text-xl font-bold text-gray-800">{successRate.toFixed(1)}%</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">{t.metrics_estate}</p>
          <p className="text-xl font-bold text-gray-800">{formatCompactTHB(monte_carlo.final_estate.p50)}</p>
        </div>
        
        {passive_income_summary && (
          <>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_passive_retire}</p>
              <p className="text-xl font-bold text-primary">{formatTHB(passive_income_summary.total_monthly_at_retirement)}/mo</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_passive_cov}</p>
              <p className="text-xl font-bold text-primary">{formatPercent(passive_income_summary.coverage_ratio_at_retirement)}</p>
            </div>
            {fiAge && (
              <div className="card p-4 bg-yellow-50">
                <p className="text-sm text-yellow-600 mb-1">{t.metrics_fi_age}</p>
                <p className="text-xl font-bold text-yellow-700">{fiAge} {t.age}</p>
              </div>
            )}
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_total_estate}</p>
              <p className="text-xl font-bold text-gray-800">{formatCompactTHB(monte_carlo.total_estate_incl_assets.p50)}</p>
            </div>
          </>
        )}
      </div>

      {/* Combined Chart */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">{t.chart_det} & {t.chart_mc}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="age" tick={{fontSize: 12}} />
              <YAxis tickFormatter={(v) => `฿${(v/1000000).toFixed(1)}M`} tick={{fontSize: 12}} />
              <Tooltip 
                formatter={(value, name) => {
                   if (Array.isArray(value)) return [`฿${(value[0]/1000000).toFixed(1)}M - ฿${(value[1]/1000000).toFixed(1)}M`, name];
                   const n = name === 'portfolio_value' ? t.portfolio_value : (name === 'cumulative_expenses' ? t.cumulative_expenses : name);
                   return [formatTHB(value), n];
                }}
                labelFormatter={(label) => `${t.age}: ${label}`}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="p10_p90" fill="#3b82f6" fillOpacity={0.1} stroke="none" name="MC 10th-90th" />
              <Area type="monotone" dataKey="p25_p75" fill="#3b82f6" fillOpacity={0.2} stroke="none" name="MC 25th-75th" />
              <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={false} name="MC Median" />
              <Line type="monotone" dataKey="portfolio_value" name={t.portfolio_value} stroke="#16a34a" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="cumulative_expenses" name={t.cumulative_expenses} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <ReferenceLine x={inputs.retirement_age} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: t.retirement_age, fill: '#10b981', fontSize: 12, dy: -10 }} />
              {fiAge && <ReferenceLine x={fiAge} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: t.fi_age, fill: '#f59e0b', fontSize: 12, dy: -10 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card bg-gray-50">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">Summary of Assumptions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 text-sm">
          <div>
            <p className="text-gray-500 text-xs">{t.current_age}</p>
            <p className="font-medium text-gray-800">{inputs.current_age}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.retirement_age}</p>
            <p className="font-medium text-gray-800">{inputs.retirement_age}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.life_expectancy}</p>
            <p className="font-medium text-gray-800">{inputs.life_expectancy}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.inflation}</p>
            <p className="font-medium text-gray-800">{(inputs.inflation_rate * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.initial_capital}</p>
            <p className="font-medium text-gray-800">{formatTHB(inputs.initial_capital)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.monthly_investment}</p>
            <p className="font-medium text-gray-800">{formatTHB(inputs.monthly_investment)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.return_accum}</p>
            <p className="font-medium text-gray-800">{(inputs.expected_return_accumulation * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{t.return_post}</p>
            <p className="font-medium text-gray-800">{(inputs.expected_return_post_retirement * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResultsPanel;
