import { useState, useEffect, useCallback } from 'react';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import { defaultInputs } from './utils/constants';

function App() {
  const [lang, setLang] = useState('th');
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculate = useCallback(async (currentInputs) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentInputs),
      });
      
      if (!response.ok) {
        throw new Error('API Error');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate. Is the backend running?');
    } finally {
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
