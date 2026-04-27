import React, { useState, useEffect } from 'react';

const FormattedInput = ({ value, onChange, className }) => {
  const [localVal, setLocalVal] = useState(value === 0 ? '' : value.toLocaleString('en-US'));

  useEffect(() => {
    if (value !== undefined && value !== null && !isNaN(value)) {
      const numLocal = parseFloat(localVal.replace(/,/g, ''));
      if (numLocal !== value && !(isNaN(numLocal) && value === 0)) {
        setLocalVal(value === 0 ? '' : value.toLocaleString('en-US'));
      }
    }
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^0-9.]/g, '');
    
    if ((raw.match(/\./g) || []).length > 1) return;

    if (raw === '') {
      setLocalVal('');
      onChange(0);
      return;
    }

    if (raw.endsWith('.')) {
      // Allows user to type "1000." before adding decimals
      const parts = raw.split('.');
      parts[0] = parts[0] ? parseInt(parts[0], 10).toLocaleString('en-US') : '0';
      setLocalVal(parts[0] + '.');
    } else {
      const parts = raw.split('.');
      parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
      setLocalVal(parts.join('.'));
      
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    if (localVal === '') {
      setLocalVal('0');
      onChange(0);
    } else {
      const raw = localVal.replace(/,/g, '');
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        setLocalVal(num.toLocaleString('en-US'));
      }
    }
  };

  return (
    <input 
      type="text" 
      inputMode="decimal"
      className={className}
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

export default FormattedInput;
