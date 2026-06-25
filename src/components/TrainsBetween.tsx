import { useState, useEffect } from 'react';
import { Search, MapPin, ArrowRight, Train, AlertCircle, Clock } from 'lucide-react';

export default function TrainsBetween({ onTrainClick }: { onTrainClick?: (no: string) => void }) {
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [showFromSuggest, setShowFromSuggest] = useState(false);
  const [showToSuggest, setShowToSuggest] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromQuery.length >= 2 && showFromSuggest) {
        fetch(`/api/search-stations?q=${fromQuery}`)
          .then(r => r.json())
          .then(d => setFromSuggestions(d.results || []))
          .catch(() => setFromSuggestions([]));
      } else {
        setFromSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fromQuery, showFromSuggest]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (toQuery.length >= 2 && showToSuggest) {
        fetch(`/api/search-stations?q=${toQuery}`)
          .then(r => r.json())
          .then(d => setToSuggestions(d.results || []))
          .catch(() => setToSuggestions([]));
      } else {
        setToSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [toQuery, showToSuggest]);

  const searchTrains = async () => {
    if (!fromCode || !toCode) return;
    setLoading(true);
    setResults(null);
    
    try {
        const r = await fetch(`/api/trains-between?from=${fromCode}&to=${toCode}`);
        const data = await r.json();
        setResults(data.results || []);
    } catch (e) {
        setResults([]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <div className="rounded-3xl shadow-3d-card p-6 lg:p-8 bg-[#0d1326] shrink-0 mb-6 mt-4">
        <h2 className="text-xl font-extrabold text-teal-300 mb-6 flex items-center gap-2 drop-shadow-sm">
           Search Trains Between Stations
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-4 items-end">
           <div className="flex-1 w-full relative">
              <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 ml-1">From Station</label>
              <div className="relative p-2 rounded-2xl shadow-3d-inset bg-[#0d1326]">
                 <div className="absolute top-4 left-4 text-teal-600"><MapPin size={20} /></div>
                 <input 
                   type="text" 
                   value={fromQuery}
                   onChange={(e) => {
                      setFromQuery(e.target.value);
                      setShowFromSuggest(true);
                   }}
                   onFocus={() => setShowFromSuggest(true)}
                   onBlur={() => setTimeout(() => setShowFromSuggest(false), 200)}
                   className="w-full pl-10 pr-4 py-2 border-none bg-transparent rounded-xl outline-none font-bold placeholder:font-normal uppercase text-teal-400"
                   placeholder="Enter Station Code/Name"
                 />
                 {showFromSuggest && fromSuggestions.length > 0 && (
                   <div className="absolute z-50 w-full mt-3 rounded-2xl max-h-60 overflow-y-auto shadow-3d-card bg-[#0d1326]">
                     {fromSuggestions.map((s, idx) => (
                       <div 
                         key={idx} 
                         className="p-4 hover:bg-[#0d1326] cursor-pointer text-sm border-b border-teal-900 last:border-0 transition-colors"
                         onClick={() => {
                           setFromQuery(`${s.name} (${s.code})`);
                           setFromCode(s.code);
                           setShowFromSuggest(false);
                         }}
                       >
                         <span className="font-bold text-cyan-400 uppercase drop-shadow-sm">{s.code}</span> - <span className="text-teal-400 font-bold capitalize drop-shadow-sm">{s.name?.toLowerCase()}</span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>
           
           <div className="hidden lg:flex w-12 h-12 shrink-0 items-center justify-center bg-[#0d1326] shadow-3d rounded-full self-end mb-2">
              <ArrowRight size={20} className="text-blue-500 drop-shadow-sm" />
           </div>

           <div className="flex-1 w-full relative">
              <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 ml-1">To Station</label>
              <div className="relative p-2 rounded-2xl shadow-3d-inset bg-[#0d1326]">
                 <div className="absolute top-4 left-4 text-teal-600"><MapPin size={20} /></div>
                 <input 
                   type="text" 
                   value={toQuery}
                   onChange={(e) => {
                      setToQuery(e.target.value);
                      setShowToSuggest(true);
                   }}
                   onFocus={() => setShowToSuggest(true)}
                   onBlur={() => setTimeout(() => setShowToSuggest(false), 200)}
                   className="w-full pl-10 pr-4 py-2 border-none bg-transparent rounded-xl outline-none font-bold placeholder:font-normal uppercase text-teal-400"
                   placeholder="Enter Station Code/Name"
                 />
                 {showToSuggest && toSuggestions.length > 0 && (
                   <div className="absolute z-50 w-full mt-3 rounded-2xl max-h-60 overflow-y-auto shadow-3d-card bg-[#0d1326]">
                     {toSuggestions.map((s, idx) => (
                       <div 
                         key={idx} 
                         className="p-4 hover:bg-[#0d1326] cursor-pointer text-sm border-b border-teal-900 last:border-0 transition-colors"
                         onClick={() => {
                           setToQuery(`${s.name} (${s.code})`);
                           setToCode(s.code);
                           setShowToSuggest(false);
                         }}
                       >
                         <span className="font-bold text-cyan-400 uppercase drop-shadow-sm">{s.code}</span> - <span className="text-teal-400 font-bold capitalize drop-shadow-sm">{s.name?.toLowerCase()}</span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>

           <div className="flex-none w-full lg:w-48 relative">
              <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 ml-1">Journey Date</label>
              <div className="p-2 rounded-2xl shadow-3d-inset bg-[#0d1326]">
                 <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-2 px-3 border-none bg-transparent rounded-xl outline-none text-teal-400 font-bold"
                 />
              </div>
           </div>

           <button 
              onClick={searchTrains}
              disabled={loading || !fromCode || !toCode}
              className="w-full lg:w-auto flex-none bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 text-white font-extrabold py-4 px-8 rounded-2xl shadow-3d-button hover:bg-blue-700 disabled:opacity-50 transition-all self-end uppercase tracking-wider text-base"
           >
              {loading ? 'Searching...' : 'Find Trains'}
           </button>
        </div>
      </div>

      {results && (
         <div className="mt-6 space-y-6">
            <h3 className="font-extrabold text-teal-300 text-xl mb-4 ml-2 drop-shadow-sm">Available Trains ({results.length})</h3>
            {results.length > 0 ? results.map((t, i) => (
              <div key={i} className="bg-[#0d1326] rounded-3xl shadow-3d p-6 flex flex-col md:flex-row justify-between items-center gap-6 transition-transform hover:scale-[1.01]">
                  <div className="w-full md:w-auto">
                     <div className="flex items-center gap-3 mb-2">
                        <span 
                          onClick={() => onTrainClick?.(t.number)}
                          className="font-black text-cyan-400 text-xl tracking-tight hover:underline cursor-pointer drop-shadow-sm"
                        >
                          {t.number}
                        </span>
                        <span className="bg-blue-100/50 text-cyan-400 text-[10px] font-extrabold px-3 py-1 rounded shadow-3d-inset uppercase tracking-widest">{t.type}</span>
                     </div>
                     <p className="font-extrabold text-teal-300 uppercase tracking-tight drop-shadow-sm">{t.name}</p>
                     {(t.source && t.destination) && (
                        <div className="text-xs text-teal-600 font-bold mt-2 flex items-center gap-2 uppercase tracking-wide">
                           <span>{t.source}</span>
                           <ArrowRight size={12} className="text-blue-400" />
                           <span>{t.destination}</span>
                        </div>
                     )}
                     <p className="text-xs text-teal-600 font-bold mt-2 tracking-wide">Runs On: <span className="text-teal-500">{t.runningDays || "M T W T F S S"}</span></p>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-6 text-center shrink-0 w-full md:w-auto justify-center">
                     <div>
                        <p className="font-black text-teal-300 text-2xl drop-shadow-sm">{t.dept}</p>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">{t.boardStn || fromCode}</p>
                     </div>
                     <div className="flex flex-col items-center min-w-[120px]">
                        <p className="text-[10px] font-bold text-teal-600 flex items-center justify-center gap-1 mb-2 tracking-widest"><Clock size={12} className="text-teal-600"/> {t.duration}</p>
                        <div className="w-full relative flex items-center">
                           <div className="w-3 h-3 rounded-full shadow-3d bg-[#0d1326] z-10 border-2 border-teal-900"></div>
                           <div className="h-1 flex-1 shadow-inner bg-slate-200"></div>
                           <div className="w-3 h-3 rounded-full shadow-3d bg-[#0d1326] z-10 border-2 border-teal-900"></div>
                        </div>
                     </div>
                     <div>
                        <p className="font-black text-teal-300 text-2xl drop-shadow-sm">{t.arr}</p>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">{t.alightStn || toCode}</p>
                     </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-wrap gap-3 justify-start md:justify-end shrink-0">
                     {t.classes.split(',').map((c: string, ci: number) => (
                        <div key={ci} className="shadow-3d bg-[#0d1326] rounded-xl px-4 py-2 text-sm font-extrabold text-teal-500">
                           {c.trim()}
                        </div>
                     ))}
                  </div>
              </div>
            )) : (
              <div className="bg-[#0d1326] shadow-3d rounded-3xl p-8 text-center text-orange-800">
                  <AlertCircle size={40} className="mx-auto mb-4 text-orange-400 drop-shadow-sm" />
                  <h4 className="font-extrabold text-xl mb-2 drop-shadow-sm">No Direct Trains Found</h4>
                  <p className="text-sm font-medium opacity-80 max-w-sm mx-auto">No direct trains are running between these two selected stations. Try choosing different stations.</p>
              </div>
            )}
         </div>
      )}
    </div>
  );
}
