import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatTHB } from '../utils/formatters';
import FormattedInput from './FormattedInput';

const PassiveIncomePanel = ({ inputs, update, lang, t }) => {
  const addAsset = () => {
    if (inputs.passive_assets.length >= 5) return;
    const newAsset = {
      asset_name: `Asset ${inputs.passive_assets.length + 1}`,
      asset_type: 'real_estate',
      asset_icon: '🏠',
      monthly_income_today: 10000,
      income_start_age: inputs.current_age,
      income_end_age: inputs.life_expectancy,
      income_growth_rate: 0.02,
      current_asset_value: 0,
      asset_value_growth_rate: 0.03,
      include_asset_value_in_estate: true,
      monthly_cost_today: 0,
      cost_growth_rate: 0.02,
      lump_sum_cost_at_retirement: 0,
    };
    update('passive_assets', [...inputs.passive_assets, newAsset]);
  };

  const removeAsset = (idx) => {
    const arr = [...inputs.passive_assets];
    arr.splice(idx, 1);
    update('passive_assets', arr);
  };

  const updateAsset = (idx, key, val) => {
    const arr = [...inputs.passive_assets];
    arr[idx] = { ...arr[idx], [key]: val };
    update('passive_assets', arr);
  };

  const typeIcons = {
    real_estate: '🏠',
    dividend_stock: '📈',
    business: '🏪',
    other: '💰'
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-2">
        <input type="checkbox" className="rounded text-primary focus:ring-primary"
          checked={inputs.include_passive_income} onChange={(e) => update('include_passive_income', e.target.checked)} />
        <span className="font-semibold text-primary text-sm">{t.passive_income}</span>
      </label>

      {inputs.include_passive_income && (
        <div className="space-y-4 pl-2">
          {inputs.passive_assets.map((asset, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative">
              <button onClick={() => removeAsset(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t.asset_name}</label>
                  <input type="text" className="input-base text-xs py-1" value={asset.asset_name} onChange={(e) => updateAsset(idx, 'asset_name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t.asset_type}</label>
                  <select className="input-base text-xs py-1" value={asset.asset_type} onChange={(e) => {
                    updateAsset(idx, 'asset_type', e.target.value);
                    updateAsset(idx, 'asset_icon', typeIcons[e.target.value]);
                  }}>
                    <option value="real_estate">🏠 Real Estate</option>
                    <option value="dividend_stock">📈 Stock</option>
                    <option value="business">🏪 Business</option>
                    <option value="other">💰 Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t.income_today}</label>
                  <FormattedInput className="input-base text-xs py-1" value={asset.monthly_income_today} onChange={(val) => updateAsset(idx, 'monthly_income_today', val)} />
                </div>

                <div>
                  <label className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{t.income_growth}</span>
                    <span className="font-medium">{(asset.income_growth_rate * 100).toFixed(1)}%</span>
                  </label>
                  <input type="range" min="0" max="0.10" step="0.005" className="range-slider" value={asset.income_growth_rate} onChange={(e) => updateAsset(idx, 'income_growth_rate', parseFloat(e.target.value))} />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Age</label>
                    <input type="number" min={inputs.current_age} max={inputs.life_expectancy} className="input-base text-xs py-1" value={asset.income_start_age} onChange={(e) => updateAsset(idx, 'income_start_age', parseInt(e.target.value) || inputs.current_age)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Age</label>
                    <input type="number" min={asset.income_start_age} max={inputs.life_expectancy} className="input-base text-xs py-1" value={asset.income_end_age} onChange={(e) => updateAsset(idx, 'income_end_age', parseInt(e.target.value) || inputs.life_expectancy)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">{t.monthly_cost}</label>
                    <FormattedInput className="input-base text-xs py-1" value={asset.monthly_cost_today} onChange={(val) => updateAsset(idx, 'monthly_cost_today', val)} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">{t.lump_sum_cost}</label>
                    <FormattedInput className="input-base text-xs py-1" value={asset.lump_sum_cost_at_retirement} onChange={(val) => updateAsset(idx, 'lump_sum_cost_at_retirement', val)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">{t.asset_value}</label>
                    <FormattedInput className="input-base text-xs py-1" value={asset.current_asset_value} onChange={(val) => updateAsset(idx, 'current_asset_value', val)} />
                  </div>
                  <div>
                     <label className="flex items-center mt-4 space-x-1">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={asset.include_asset_value_in_estate} onChange={(e) => updateAsset(idx, 'include_asset_value_in_estate', e.target.checked)} />
                      <span className="text-[10px] text-gray-600">{t.include_estate}</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          ))}

          {inputs.passive_assets.length < 5 && (
            <button onClick={addAsset} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center space-x-2">
              <Plus size={16} /> <span>{t.add_asset}</span>
            </button>
          )}

          <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
            {t.total_passive}: {formatTHB(inputs.passive_assets.reduce((sum, a) => sum + a.monthly_income_today, 0))} / mo
          </div>
        </div>
      )}
    </div>
  );
};

export default PassiveIncomePanel;
