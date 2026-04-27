import { useState, useEffect, useCallback, useRef } from 'react';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import { defaultInputs } from './utils/constants';
import { calculateDeterministic } from './utils/calculator';
import { calculateMonteCarlo } from './utils/monteCarlo';

function App() {
  const [lang, setLang] = useState('th');
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastMcInputsRef = useRef(null);
  const lastMcResultRef = useRef(null);

  const calculate = useCallback((currentInputs) => {
    setLoading(true);
    setError(null);
    try {
      // Small timeout to allow UI to render loading state before heavy lifting
      setTimeout(() => {
        try {
          const detResult = calculateDeterministic(currentInputs);
          
          let mcResult = null;
          if (currentInputs.enable_monte_carlo) {
            // Ignore success_cutoff for MC recalculation trigger
            const currentMcConfig = { ...currentInputs };
            delete currentMcConfig.success_cutoff;
            const configStr = JSON.stringify(currentMcConfig);
            
            if (lastMcInputsRef.current === configStr && lastMcResultRef.current) {
              mcResult = lastMcResultRef.current;
            } else {
              mcResult = calculateMonteCarlo(currentInputs);
              lastMcInputsRef.current = configStr;
              lastMcResultRef.current = mcResult;
            }
          }
          
          setResults({
            deterministic: detResult.deterministic,
            passive_income_summary: detResult.passive_income_summary,
            monte_carlo: mcResult
          });
        } catch(e) {
          console.error(e);
          setError('Calculation failed: ' + e.message);
        } finally {
          setLoading(false);
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      calculate(inputs);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputs, calculate]);

  const toggleLang = () => {
    setLang(l => l === 'th' ? 'en' : 'th');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        <div className="w-full md:w-1/3">
          <InputPanel 
            inputs={inputs} 
            setInputs={setInputs} 
            lang={lang} 
            toggleLang={toggleLang} 
          />
        </div>
        
        <div className="w-full md:w-2/3">
          <ResultsPanel 
            inputs={inputs}
            results={results} 
            loading={loading} 
            error={error} 
            lang={lang} 
          />
        </div>
        
      </div>
    </div>
  );
}

export default App;
