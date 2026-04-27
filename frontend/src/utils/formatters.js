export const formatTHB = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '฿0';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCompactTHB = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '฿0';
  if (value >= 1000000) {
    return `฿${(value / 1000000).toFixed(1)}M`;
  }
  return formatTHB(value);
};

export const formatPercent = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
};
