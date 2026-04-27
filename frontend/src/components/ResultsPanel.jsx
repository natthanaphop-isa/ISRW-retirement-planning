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
  
  let badgeColor = "bg-danger-bg";
  let textColor = "text-danger";
  let badgeText = `❌ ${t.fail}`;
  let subText = "";

  if (monte_carlo) {
    const successRate = Number(monte_carlo.success_rate);
    const cutoff = Number(inputs.success_cutoff) || 80;
    
    console.log('[Badge Debug] successRate:', successRate, 'cutoff:', cutoff, 'pass:', successRate >= cutoff);
    
    if (successRate >= cutoff) {
      badgeColor = "bg-success-bg";
      textColor = "text-success";
      badgeText = `✅ ${t.success}`;
    } else if (successRate >= Math.max(50, cutoff - 30)) {
      badgeColor = "bg-warning-bg";
      textColor = "text-warning";
      badgeText = `⚠️ ${t.risk}`;
    }
    subText = `${t.chance_of_success}: ${successRate.toFixed(1)}% (${t.from_sims}) | ${t.success_cutoff}: ${cutoff}%`;
  } else {
    if (deterministic.success) {
      badgeColor = "bg-success-bg";
      textColor = "text-success";
      badgeText = `✅ ${t.success}`;
    }
    subText = deterministic.success ? t.det_success_subtext : t.det_fail_subtext;
  }

  const fiAge = deterministic.financial_independence_age;

  const combinedData = deterministic.yearly_data.map((detItem, idx) => {
    let mcItem = {};
    if (monte_carlo && monte_carlo.percentile_paths) {
      mcItem = {
        p50: monte_carlo.percentile_paths.p50[idx],
        p25_p75: [monte_carlo.percentile_paths.p25[idx], monte_carlo.percentile_paths.p75[idx]],
        p10_p90: [monte_carlo.percentile_paths.p10[idx], monte_carlo.percentile_paths.p90[idx]],
      };
    }
    return { ...detItem, ...mcItem };
  });

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className={`rounded-xl p-6 shadow-sm border border-gray-100 ${badgeColor} transition-colors duration-300 ${textColor}`}>
        <h2 className="text-3xl font-bold mb-2">{t.plan_status}: {badgeText}</h2>
        <p className="text-lg opacity-90 text-gray-700">{subText}</p>
      </div>

      {fiAge && (
        <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium flex items-center space-x-3 shadow-sm">
          <span className="text-2xl">🎯</span>
          <p>{t.fi_callout.replace('{age}', fiAge)}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {monte_carlo ? (
          <>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_corpus}</p>
              <p className="text-xl font-bold text-gray-900">{formatCompactTHB(monte_carlo.retirement_corpus.p50)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_success}</p>
              <p className="text-xl font-bold text-gray-900">{monte_carlo.success_rate.toFixed(1)}%</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_estate}</p>
              <p className="text-xl font-bold text-gray-900">{formatCompactTHB(monte_carlo.final_estate.p50)}</p>
            </div>
          </>
        ) : (
          <>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_corpus}</p>
              <p className="text-xl font-bold text-gray-900">{formatCompactTHB(deterministic.retirement_corpus)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">{t.metrics_estate}</p>
              <p className="text-xl font-bold text-gray-900">{formatCompactTHB(deterministic.final_portfolio_value)}</p>
            </div>
          </>
        )}
        
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
              <p className="text-xl font-bold text-gray-900">{formatCompactTHB(monte_carlo ? monte_carlo.total_estate_incl_assets.p50 : deterministic.total_estate)}</p>
            </div>
          </>
        )}
      </div>

      {/* Combined Chart */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4 text-gray-900">{t.chart_det} {monte_carlo && `& ${t.chart_mc}`}</h3>
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
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: '8px', fontSize: '12px', padding: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ padding: 0, margin: '2px 0' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              
              {monte_carlo && <Area type="monotone" dataKey="p10_p90" fill="#a89f91" fillOpacity={0.15} stroke="none" name="MC 10th-90th" />}
              {monte_carlo && <Area type="monotone" dataKey="p25_p75" fill="#8a7f70" fillOpacity={0.2} stroke="none" name="MC 25th-75th" />}
              {monte_carlo && <Line type="monotone" dataKey="p50" stroke="#74C69D" strokeWidth={2} strokeDasharray="3 3" dot={false} name="MC Median" />}
              
              <Line type="monotone" dataKey="portfolio_value" name={t.portfolio_value} stroke="#2D6A4F" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="cumulative_expenses" name={t.cumulative_expenses} stroke="#BC4749" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <ReferenceLine x={inputs.retirement_age} stroke="#475569" strokeDasharray="3 3" label={{ position: 'top', value: t.retirement_age, fill: '#475569', fontSize: 12, dy: -10 }} />
              {fiAge && <ReferenceLine x={fiAge} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: t.fi_age, fill: '#f59e0b', fontSize: 12, dy: -10 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card bg-gray-50">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">{t.summary_assumptions}</h3>
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
