import React from 'react';
import { i18n } from '../i18n';
import PassiveIncomePanel from './PassiveIncomePanel';

const InputPanel = ({ inputs, setInputs, lang, toggleLang }) => {
  const t = i18n[lang];

  const update = (key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="card space-y-6 bg-white sticky top-4 max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{t.app_title}</h2>
        <button onClick={toggleLang} className="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium">
          {lang.toUpperCase()}
        </button>
      </div>

      {/* Section 1: Personal Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-primary">{t.personal_info}</h3>
        
        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.current_age}</span>
            <span className="font-medium">{inputs.current_age}</span>
          </label>
          <input type="range" min="18" max="60" className="range-slider"
            value={inputs.current_age} onChange={(e) => update('current_age', parseInt(e.target.value))} />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.retirement_age}</span>
            <span className="font-medium">{inputs.retirement_age}</span>
          </label>
          <input type="range" min="40" max="75" className="range-slider"
            value={inputs.retirement_age} onChange={(e) => update('retirement_age', parseInt(e.target.value))} />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.life_expectancy}</span>
            <span className="font-medium">{inputs.life_expectancy}</span>
          </label>
          <input type="range" min="60" max="100" className="range-slider"
            value={inputs.life_expectancy} onChange={(e) => update('life_expectancy', parseInt(e.target.value))} />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Section 2: Accumulation */}
      <div className="space-y-4">
        <h3 className="font-semibold text-primary">{t.accumulation}</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t.initial_capital}</label>
          <input type="number" min="0" step="10000" className="input-base"
            value={inputs.initial_capital} onChange={(e) => update('initial_capital', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t.monthly_investment}</label>
          <input type="number" min="0" step="1000" className="input-base"
            value={inputs.monthly_investment} onChange={(e) => update('monthly_investment', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Section 3: Retirement Spending */}
      <div className="space-y-4">
        <h3 className="font-semibold text-primary">{t.retirement_spending}</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t.monthly_need}</label>
          <input type="number" min="0" step="1000" className="input-base"
            value={inputs.monthly_need} onChange={(e) => update('monthly_need', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t.monthly_want}</label>
          <input type="number" min="0" step="1000" className="input-base"
            value={inputs.monthly_want} onChange={(e) => update('monthly_want', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Section 4 & 5: Health & Extra Costs */}
      <div className="space-y-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="rounded text-primary focus:ring-primary"
            checked={inputs.include_health_costs} onChange={(e) => update('include_health_costs', e.target.checked)} />
          <span className="font-semibold text-primary text-sm">{t.health_costs}</span>
        </label>
        {inputs.include_health_costs && (
          <div className="pl-6 space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.health_insurance}</label>
              <input type="number" min="0" step="10000" className="input-base"
                value={inputs.health_insurance_lump_sum} onChange={(e) => update('health_insurance_lump_sum', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.health_other}</label>
              <input type="number" min="0" step="10000" className="input-base"
                value={inputs.health_other_lump_sum} onChange={(e) => update('health_other_lump_sum', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="rounded text-primary focus:ring-primary"
            checked={inputs.include_extra_costs} onChange={(e) => update('include_extra_costs', e.target.checked)} />
          <span className="font-semibold text-primary text-sm">{t.extra_costs}</span>
        </label>
        {inputs.include_extra_costs && (
          <div className="pl-6 space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t.extra_lump_sum}</label>
              <input type="number" min="0" step="10000" className="input-base"
                value={inputs.extra_lump_sum} onChange={(e) => update('extra_lump_sum', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Section 6: Passive Income */}
      <PassiveIncomePanel inputs={inputs} update={update} lang={lang} t={t} />

      <hr className="border-gray-200" />

      {/* Section 7: Economic */}
      <div className="space-y-4">
        <h3 className="font-semibold text-primary">{t.economic}</h3>
        
        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.inflation}</span>
            <span className="font-medium">{(inputs.inflation_rate * 100).toFixed(1)}%</span>
          </label>
          <input type="range" min="0" max="0.10" step="0.005" className="range-slider"
            value={inputs.inflation_rate} onChange={(e) => update('inflation_rate', parseFloat(e.target.value))} />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.return_accum}</span>
            <span className="font-medium">{(inputs.expected_return_accumulation * 100).toFixed(1)}%</span>
          </label>
          <input type="range" min="0" max="0.15" step="0.005" className="range-slider"
            value={inputs.expected_return_accumulation} onChange={(e) => update('expected_return_accumulation', parseFloat(e.target.value))} />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.return_near}</span>
            <span className="font-medium">{(inputs.expected_return_near_retirement * 100).toFixed(1)}%</span>
          </label>
          <input type="range" min="0" max="0.10" step="0.005" className="range-slider"
            value={inputs.expected_return_near_retirement} onChange={(e) => update('expected_return_near_retirement', parseFloat(e.target.value))} />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.glide_path}</span>
            <span className="font-medium">{inputs.glide_path_years}</span>
          </label>
          <input type="range" min="0" max="15" step="1" className="range-slider"
            value={inputs.glide_path_years} onChange={(e) => update('glide_path_years', parseInt(e.target.value))} />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t.return_post}</span>
            <span className="font-medium">{(inputs.expected_return_post_retirement * 100).toFixed(1)}%</span>
          </label>
          <input type="range" min="0" max="0.08" step="0.005" className="range-slider"
            value={inputs.expected_return_post_retirement} onChange={(e) => update('expected_return_post_retirement', parseFloat(e.target.value))} />
        </div>
      </div>
      
      {/* Advanced Monte Carlo */}
      <details className="mt-4">
        <summary className="text-sm font-semibold text-gray-600 cursor-pointer">{t.advanced_mc}</summary>
        <div className="pt-4 space-y-4 pl-2">
          <div>
            <label className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{t.n_sims}</span>
              <span className="font-medium">{inputs.n_simulations}</span>
            </label>
            <input type="range" min="500" max="5000" step="100" className="range-slider"
              value={inputs.n_simulations} onChange={(e) => update('n_simulations', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{t.sigma_accum}</span>
              <span className="font-medium">{(inputs.sigma_accum * 100).toFixed(1)}%</span>
            </label>
            <input type="range" min="0" max="0.30" step="0.01" className="range-slider"
              value={inputs.sigma_accum} onChange={(e) => update('sigma_accum', parseFloat(e.target.value))} />
          </div>
        </div>
      </details>

    </div>
  );
};

export default InputPanel;
