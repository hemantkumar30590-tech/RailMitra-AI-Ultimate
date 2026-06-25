import { useState, useEffect, useRef } from 'react';
import { Search, Train, AlertCircle, Clock, LayoutDashboard, MapPin, Info, ArrowRight, Map, LogIn, FileText, ArrowLeftRight, Bot, Send, Calendar, X } from 'lucide-react';
import RouteMap from './components/RouteMap';
import StationDisplay from './components/StationDisplay';
import PnrEnquiry from './components/PnrEnquiry';
import TrainsBetween from './components/TrainsBetween';
import RailMitraAi from './components/RailMitraAi';

interface StatusData {
  train_name?: string;
  // ... other fields
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-inner">
      <Clock className="w-4 h-4 text-blue-400" />
      <span className="font-mono text-sm tracking-wider">
        {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}

export default function App() {
  const getDates = () => {
    return [0, 1, 2, 3, 4, 5, 6].map(offset => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      return d.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    });
  };
  const dates = getDates();

  const getTodayIST = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + 330);
    return d.toISOString().split('T')[0];
  };

  const [trainNo, setTrainNo] = useState('19038');
  const [trainSuggestions, setTrainSuggestions] = useState<any[]>([]);
  const [showTrainSuggest, setShowTrainSuggest] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ledStationIdx, setLedStationIdx] = useState<number>(-1);
  const [stationQuery, setStationQuery] = useState('');
  const [stationSuggestions, setStationSuggestions] = useState<any[]>([]);
  const [showStationSuggest, setShowStationSuggest] = useState(false);
  const [showMockBanner, setShowMockBanner] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [targetStationCode, setTargetStationCode] = useState<string>('');
  const [targetStationName, setTargetStationName] = useState<string>('');
  const [sourceStationName, setSourceStationName] = useState<string>('');
  const [destStationName, setDestStationName] = useState<string>('');

  useEffect(() => {
    setLedStationIdx(-1);
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (trainNo.length >= 2) {
        fetch(`/api/search-trains?q=${trainNo}`)
          .then(r => r.json())
          .then(d => setTrainSuggestions(d.results || []))
          .catch(() => setTrainSuggestions([]));
      } else {
        setTrainSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [trainNo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stationQuery.length >= 2) {
        fetch(`/api/search-stations?q=${stationQuery}`)
          .then(r => r.json())
          .then(d => setStationSuggestions(d.results || []))
          .catch(() => setStationSuggestions([]));
      } else {
        setStationSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [stationQuery]);

  const fetchStatus = async (overrideNo?: string, overrideStartDate?: string) => {
    const noToFetch = overrideNo || trainNo;
    const dateToFetch = overrideStartDate || selectedDate;
    
    // Calculate the startDay offset parameter from the date
    let dayToFetch = '1';
    if (dateToFetch.length >= 5) {
      const today = getTodayIST();
      const t = new Date(today);
      const sel = new Date(dateToFetch);
      const diffDays = Math.floor((t.getTime() - sel.getTime()) / (1000 * 60 * 60 * 24));
      dayToFetch = String(diffDays + 1);
    } else {
      dayToFetch = dateToFetch; // if it was explicitly passed as '1', '2'
    }

    setLoading(true);
    setError(null);
    setStatus(null);
    setShowMockBanner(true);
    try {
      const response = await fetch(`/api/train-status?trainNo=${noToFetch}&startDay=${dayToFetch}`);
      const data = await response.json();
      if (response.ok) {
        setStatus(data);
      } else {
        setError(data.message || data.error || 'Failed to fetch status');
      }
    } catch (err: any) {
      console.error(err);
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainClick = (clickedTrainNo: string) => {
    setTrainNo(clickedTrainNo);
    setActiveTab('schedules');
    fetchStatus(clickedTrainNo);
  };

  const handleAiAction = (intent: string, entities: Record<string, string>) => {
    if (entities.train_number) {
      setTrainNo(entities.train_number);
    }
    
    switch(intent) {
      case 'LIVE_TRAIN_STATUS':
      case 'TRAIN_DELAY_STATUS':
        setActiveTab('dashboard');
        if (entities.train_number) {
           if (entities.start_day) {
               const offset = parseInt(entities.start_day) - 1;
               if (!isNaN(offset)) {
                   const d = new Date(getTodayIST());
                   d.setDate(d.getDate() - offset);
                   setSelectedDate(d.toISOString().split('T')[0]);
               }
           }
           setTimeout(() => fetchStatus(entities.train_number, entities.start_day), 100);
        }
        break;
      case 'PNR_STATUS':
      case 'PNR_PREDICTION':
        setActiveTab('pnr');
        break;
      case 'TRAIN_BETWEEN_STATIONS':
      case 'TRAIN_SEARCH':
        setActiveTab('trains_between');
        setSourceStationName(entities.source_station || "");
        setDestStationName(entities.destination_station || "");
        break;
      case 'STATION_CODE_LOOKUP':
      case 'STATION_NAME_LOOKUP':
      case 'STATION_LIVE_BOARD':
      case 'PLATFORM_INFO':
        setActiveTab('station_search');
        if (entities.station_code) {
           setTargetStationCode(entities.station_code.toUpperCase());
        } else {
           setTargetStationCode("");
        }
        if (entities.station_name) {
           setTargetStationName(entities.station_name);
        } else {
           setTargetStationName("");
        }
        break;
      case 'TRAIN_ROUTE':
        setActiveTab('schedules');
        if (entities.train_number) {
           if (entities.start_day) {
               const offset = parseInt(entities.start_day) - 1;
               if (!isNaN(offset)) {
                   const d = new Date(getTodayIST());
                   d.setDate(d.getDate() - offset);
                   setSelectedDate(d.toISOString().split('T')[0]);
               }
           }
           setTimeout(() => fetchStatus(entities.train_number, entities.start_day), 100);
        }
        break;
      default:
        break;
    }
  };

  const trainData = status?.data || status;
  const isSuccess = trainData && (trainData.success === true || trainData.train_number);

  const allStations: any[] = [];
  if (trainData?.previous_stations?.length) {
    trainData.previous_stations.forEach((s: any) => allStations.push({...s, isPast: true}));
  }
  if (trainData?.upcoming_stations?.length) {
    trainData.upcoming_stations.forEach((s: any) => allStations.push({...s, isPast: false}));
  }

  return (
    <div className="min-h-screen bg-[#0d1326] text-white font-sans flex flex-col">
      <header className="flex flex-col lg:flex-row items-center justify-between px-4 lg:px-8 py-4 gap-4 shadow-3d-card z-50 rounded-b-3xl">
        <div className="flex items-center gap-3 self-start lg:self-auto w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 rounded-xl flex items-center justify-center text-white shadow-3d shrink-0 transform transition-transform hover:scale-105">
              <Train className="h-6 w-6 drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-teal-300 flex items-center gap-2 drop-shadow-sm">
                RailMitra AI
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold drop-shadow-sm">Intelligent Transit Tracking</p>
            </div>
          </div>
          <div className="hidden sm:block ml-2 shadow-3d-dark rounded-lg overflow-hidden">
            <LiveClock />
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0d1326] p-2 rounded-2xl w-full lg:max-w-md relative shadow-3d-inset">
          <input 
            type="text" 
            placeholder="Search Train No (e.g. 19038)" 
            value={trainNo} 
            onChange={(e) => {
              setTrainNo(e.target.value);
              setShowTrainSuggest(true);
            }}
            onFocus={() => setShowTrainSuggest(true)}
            onBlur={() => setTimeout(() => setShowTrainSuggest(false), 200)}
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold px-4 py-2 flex-grow min-w-0 outline-none text-teal-400 placeholder-slate-400"
          />
          {showTrainSuggest && trainSuggestions.length > 0 && (
            <div className="absolute top-[calc(100%+12px)] left-0 z-50 w-full bg-[#0d1326] rounded-2xl max-h-60 overflow-y-auto shadow-3d-card">
              {trainSuggestions.map((t, idx) => (
                <div 
                  key={idx} 
                  className="p-4 hover:bg-[#0d1326] cursor-pointer text-sm border-b border-teal-900 last:border-0 text-left transition-colors"
                  onClick={() => {
                    setTrainNo(t.number);
                    setShowTrainSuggest(false);
                    fetchStatus(t.number); 
                  }}
                >
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-cyan-400 drop-shadow-sm">{t.number}</span>
                     <span className="text-teal-400 font-bold capitalize drop-shadow-sm">{t.name?.toLowerCase()}</span>
                  </div>
                  {(t.from_station_name && t.to_station_name) && (
                     <div className="text-xs text-teal-600 mt-1 uppercase flex items-center gap-1 font-medium">
                        <span>{t.from_station_name}</span>
                        <ArrowRight size={10} className="text-teal-600" />
                        <span>{t.to_station_name}</span>
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <button 
            onClick={() => fetchStatus()}
            disabled={loading}
            className="bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-3d-button shrink-0"
          >
            {loading ? 'Searching...' : 'Track Live'}
          </button>
        </div>
        
        <nav className="flex gap-4 lg:gap-6 text-sm font-medium text-teal-600 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0 p-2 rounded-2xl shadow-3d-inset bg-[#0d1326]">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><LayoutDashboard size={16}/>Status</button>
          <button onClick={() => setActiveTab('schedules')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'schedules' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><Clock size={16}/>Live Schedule</button>
          <button onClick={() => setActiveTab('station_info')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'station_info' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><MapPin size={16}/>Train LED</button>
          <button onClick={() => setActiveTab('station_search')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'station_search' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><LogIn size={16}/>Station Board</button>
          <button onClick={() => setActiveTab('trains_between')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'trains_between' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><ArrowLeftRight size={16}/>Trains Between</button>
          <button onClick={() => setActiveTab('pnr')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'pnr' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><FileText size={16}/>PNR Enquiry</button>
          <button onClick={() => setActiveTab('map')} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl transition-all ${activeTab === 'map' ? 'text-cyan-400 shadow-3d bg-[#0d1326] font-bold' : 'hover:shadow-3d-button hover:bg-[#0d1326] hover:text-teal-400'}`}><Map size={16}/>Route Map</button>
        </nav>
      </header>

      <main className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-8 overflow-y-auto lg:overflow-hidden relative">
        {activeTab === 'station_search' ? (
          <StationDisplay onTrainClick={handleTrainClick} initialStationCode={targetStationCode} initialStationName={targetStationName} />
        ) : activeTab === 'pnr' ? (
          <PnrEnquiry onTrainClick={handleTrainClick} />
        ) : activeTab === 'trains_between' ? (
          <TrainsBetween onTrainClick={handleTrainClick} initialSource={sourceStationName} initialDest={destStationName} />
        ) : (
          <>
            <section className="w-full lg:w-1/3 flex flex-col gap-8 shrink-0 lg:overflow-y-auto pb-4 px-2">
              <div className="rounded-3xl p-6 shadow-3d-card">
            <h2 className="text-xl font-extrabold text-teal-300 mb-6 drop-shadow-sm flex items-center gap-2"><div className="w-2 h-6 bg-blue-500 rounded-full"></div> Input Parameters</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
              <div className="relative">
                <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 ml-1">Train Number</label>
                <div className="p-1 rounded-2xl shadow-3d-inset bg-[#0d1326]">
                  <input 
                    type="text" 
                    value={trainNo} 
                    onChange={(e) => {
                      setTrainNo(e.target.value);
                      setShowTrainSuggest(true);
                    }} 
                    onFocus={() => setShowTrainSuggest(true)}
                    onBlur={() => setTimeout(() => setShowTrainSuggest(false), 200)}
                    className="w-full p-3 bg-transparent font-bold text-teal-400 outline-none placeholder-slate-400" 
                    placeholder="19038" 
                  />
                </div>
                {showTrainSuggest && trainSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-3 rounded-2xl max-h-60 overflow-y-auto shadow-3d-card bg-[#0d1326]">
                    {trainSuggestions.map((t, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 hover:bg-[#0d1326] cursor-pointer text-sm border-b border-teal-900 last:border-0 transition-colors"
                        onClick={() => {
                          setTrainNo(t.number);
                          setShowTrainSuggest(false);
                          fetchStatus(t.number);
                        }}
                      >
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-cyan-400 drop-shadow-sm">{t.number}</span>
                           <span className="text-teal-400 font-bold capitalize drop-shadow-sm">{t.name?.toLowerCase()}</span>
                        </div>
                        {(t.from_station_name && t.to_station_name) && (
                           <div className="text-xs text-teal-600 mt-1 uppercase flex items-center gap-1 font-medium">
                              <span>{t.from_station_name}</span>
                              <ArrowRight size={10} className="text-teal-600" />
                              <span>{t.to_station_name}</span>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 relative">
                <label className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 ml-1">Start Date / प्रस्थान की तिथि</label>
                <div 
                  className="p-4 rounded-2xl shadow-3d-inset bg-[#0d1326] cursor-pointer flex justify-between items-center hover:bg-[#121b36] transition-colors"
                  onClick={() => setShowDatePicker(true)}
                >
                  <span className="font-bold text-teal-400 text-lg tracking-wide">{selectedDate}</span>
                  <Calendar size={20} className="text-teal-600" />
                </div>
                
                {showDatePicker && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#121b36] p-6 rounded-3xl shadow-3d-card-dark w-full max-w-sm border border-teal-900/50">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-teal-300 uppercase tracking-wider">Select Journey Date</h3>
                        <button onClick={() => setShowDatePicker(false)} className="p-2 bg-[#0d1326] rounded-full text-slate-400 hover:text-white transition-colors shadow-3d-inset">
                          <X size={18} />
                        </button>
                      </div>
                      
                      <div className="bg-[#0d1326] rounded-2xl p-2 shadow-3d-inset mb-6">
                        <input 
                          type="date" 
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full p-4 bg-transparent text-xl font-black text-teal-400 outline-none cursor-pointer"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            const today = getTodayIST();
                            setSelectedDate(today);
                            setShowDatePicker(false);
                            fetchStatus(trainNo, today);
                          }}
                          className="flex-1 py-3 px-4 rounded-xl font-bold bg-[#0d1326] text-teal-400 hover:bg-teal-900/30 transition-colors shadow-3d-button uppercase tracking-wider text-sm"
                        >
                          Today
                        </button>
                        <button 
                          onClick={() => {
                            setShowDatePicker(false);
                            fetchStatus(trainNo, selectedDate);
                          }}
                          className="flex-1 py-3 px-4 rounded-xl font-extrabold bg-teal-500 text-teal-950 hover:bg-teal-400 transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)] uppercase tracking-wider text-sm"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              id="btn-fetch-train-sidebar"
              onClick={() => fetchStatus()}
              disabled={loading}
              className="mt-8 w-full bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 text-white py-4 px-6 rounded-2xl font-extrabold shadow-3d-button flex items-center justify-center gap-2 text-lg uppercase tracking-wider transition-all"
            >
              <Search size={20} className="drop-shadow-sm" />
              {loading ? 'Fetching Details...' : 'Check Live Status'}
            </button>
          </div>
          
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-3d-card-dark relative overflow-hidden flex-shrink-0 mt-8">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest drop-shadow-sm">AI Insights</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-300 italic font-medium">
                  {isSuccess 
                    ? `Train ${trainData.train_number} is currently ${trainData.is_run_day ? 'running' : 'not running on this day'}. Data sourced directly from IRCTC Live systems. AI prediction active.`
                    : "Enter a train number and start day to get live updates and AI-powered station arrival predictions."}
                </p>
             </div>
             {/* Decorative Background Grid */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>
        </section>

        <section className="flex-1 rounded-3xl shadow-3d-card p-4 lg:p-8 flex flex-col h-full lg:overflow-y-auto">
          {error && activeTab !== 'station_search' && (
            <div className="bg-red-950/40 backdrop-blur-sm shadow-3d-inset text-red-400 p-4 rounded-2xl flex items-center gap-3 mb-6 shrink-0 border border-red-900">
              <AlertCircle size={24} className="drop-shadow-sm shrink-0 text-red-500" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {activeTab === 'station_search' ? (
            <StationDisplay onTrainClick={handleTrainClick} initialStationCode={targetStationCode} initialStationName={targetStationName} />
          ) : isSuccess ? (
            <div className="space-y-6 flex-1 h-full flex flex-col">
              {trainData.is_mock && showMockBanner && (
                <div 
                  id="mock-warning-banner" 
                  className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-4 shrink-0 transition-all duration-500 animate-slide-in"
                >
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-800 text-sm">Demo / Offline Mode (Simulated Data)</h4>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      इस ट्रेन का लाइव स्टेटस इस समय सर्वर द्वारा प्राप्त नहीं किया जा सका (शायद ट्रेन आज चालू नहीं है, या ट्रेन नंबर गलत है)। आपके अनुभव के लिए एक डेमो/सिमुलेटेड लाइव रूट दिखाया जा रहा है।
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      The live scraper couldn't fetch real-time data for train <strong>{trainData.train_number}</strong> at the moment. Displaying simulated live data for demonstration.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowMockBanner(false)}
                    className="shrink-0 bg-[#0d1326] hover:bg-amber-100 text-amber-700 border border-amber-300 font-semibold px-4 py-1.5 rounded-lg text-sm shadow-sm transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Common Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">Live Now</span>
                    {trainData.is_run_day ? (
                      <span className="bg-green-950/40 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> RUNNING</span>
                    ) : (
                      <span className="bg-slate-100 text-teal-400 px-3 py-1 rounded-full text-xs font-bold">NOT RUNNING</span>
                    )}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-teal-300">{trainData.train_name || 'Unknown Train'}</h3>
                  <p className="text-teal-600 font-medium text-sm mt-1">Train No: {trainData.train_number} • Source: {trainData.source || 'N/A'} → Dest: {trainData.destination || 'N/A'}</p>
                </div>
              </div>

              {/* Tab Navigation Views */}
              {activeTab === 'dashboard' && (
              <div className="flex-1 overflow-y-auto">
                {!trainData.is_run_day && (
                  <div className="mb-8 bg-rose-950/40 backdrop-blur-sm shadow-3d-inset text-rose-300 p-6 rounded-3xl flex items-start gap-4 border border-rose-900">
                    <div className="bg-rose-950 text-rose-500 p-3 rounded-2xl shadow-3d shrink-0">
                      <AlertCircle size={24} className="drop-shadow-sm" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-rose-400 text-base drop-shadow-sm">Train Does Not Run on this Date / इस तिथि को ट्रेन संचालित नहीं होती है</h4>
                      <p className="text-sm text-rose-500 mt-2 leading-relaxed font-medium">
                        यह ट्रेन चुने गए प्रस्थान दिन (<strong>{trainData.train_start_date}</strong>) को Raigarh या इसके प्रस्थान स्टेशन से नहीं चलती है। नीचे दिखाया गया रूट केवल ट्रेन का सामान्य शेड्यूल (Time Table) है।
                      </p>
                      <p className="text-xs text-rose-600 mt-2 font-medium">
                        This train does not run on the selected date (<strong>{trainData.train_start_date}</strong>) from its source station. The timeline shown below is only the normal schedule of the train.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                   <div className="bg-[#0d1326] p-6 rounded-3xl shadow-3d flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                     <p className="text-xs text-teal-600 font-bold uppercase tracking-widest mb-2 drop-shadow-sm">Start Date</p>
                     <p className="font-extrabold text-teal-300 text-lg md:text-xl drop-shadow-sm">{trainData.train_start_date || 'N/A'}</p>
                   </div>
                   <div className="bg-[#0d1326] p-6 rounded-3xl shadow-3d flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                     <p className="text-xs text-teal-600 font-bold uppercase tracking-widest mb-2 drop-shadow-sm">Current Station</p>
                     <p className="font-extrabold text-cyan-400 text-lg md:text-xl drop-shadow-sm">{trainData.current_station_name || trainData.station_name || 'In Transit'}</p>
                   </div>
                   <div className="bg-[#0d1326] p-6 rounded-3xl shadow-3d flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                     <p className="text-xs text-teal-600 font-bold uppercase tracking-widest mb-2 drop-shadow-sm">Platform</p>
                     <div className="flex items-center gap-2">
                       <p className="font-extrabold text-teal-300 text-lg md:text-xl drop-shadow-sm">{(trainData.upcoming_stations && trainData.upcoming_stations[0]?.platform_number) || trainData.platform_number || 'TBD'}</p>
                       {(
                         (trainData.upcoming_stations && trainData.upcoming_stations[0] && (trainData.upcoming_stations[0].platform_changed || trainData.upcoming_stations[0].is_unusual_platform)) || 
                         trainData.platform_changed || trainData.is_unusual_platform
                       ) && (
                         <div className="relative flex items-center justify-center p-1 shadow-3d-button rounded-full bg-[#0d1326]" title="Unusual Platform / Changed">
                           <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-inner"></span>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="bg-[#0d1326] p-6 rounded-3xl shadow-3d flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                     <p className="text-xs text-teal-600 font-bold uppercase tracking-widest mb-2 drop-shadow-sm">Current Delay</p>
                     {(() => {
                        const delayVal = isNaN(Number(trainData.delay)) ? 0 : Number(trainData.delay);
                        let colorCls = 'text-green-600';
                        let txt = 'On Time';
                        if (delayVal > 0 && delayVal < 15) {
                           colorCls = 'text-amber-600';
                           txt = `${delayVal} Mins Late`;
                        } else if (delayVal >= 15) {
                           colorCls = 'text-red-600';
                           txt = `${delayVal} Mins Late`;
                        }
                        return (
                          <p className={`font-extrabold text-lg md:text-xl truncate max-w-full drop-shadow-sm ${colorCls}`}>{txt}</p>
                        );
                     })()}
                   </div>
                </div>

                {/* Status Message */}
                {(trainData.new_message || trainData.update_time || trainData.notification_date) && (
                <div className="mb-6 bg-cyan-950/40 border border-cyan-800 p-4 rounded-xl shadow-3d-inset">
                   <h4 className="text-sm font-bold text-cyan-400 mb-1 flex items-center gap-1"><Info size={16}/> Live Update</h4>
                   <p className="text-cyan-200 text-sm">
                     {trainData.new_message || trainData.status_as_of || `Train data last synced at: ${trainData.update_time || trainData.notification_date}`}
                   </p>
                </div>
                )}
                
                <div className="mt-8 border border-teal-950 rounded-xl overflow-hidden bg-[#0d1326] shadow-3d-inset">
                  <div className="bg-[#0a0f1a] px-4 py-3 border-b border-teal-950 text-sm font-bold flex items-center justify-between text-teal-500">
                    <span>Raw Output Inspector</span>
                    <Info size={16} className="text-teal-600"/>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs text-teal-400 max-h-64 overflow-y-auto font-mono">
                    {JSON.stringify(trainData, null, 2)}
                  </pre>
                </div>
              </div>
              )}

              {activeTab === 'schedules' && (
              <div className="flex-1 overflow-y-auto rounded-3xl bg-[#0d1326] shadow-3d-inset flex flex-col relative p-2">
                 <div className="bg-[#0d1326] px-6 py-4 rounded-2xl shadow-3d mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
                   <div className="text-base font-extrabold text-teal-400 drop-shadow-sm flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> Full Live Route Timeline</div>
                   <div className="relative w-full md:w-72 shrink-0">
                     <Search size={16} className="absolute left-4 top-3 text-teal-600" />
                     <div className="shadow-3d-inset rounded-xl bg-[#0d1326] p-1">
                       <input 
                         type="text" 
                         placeholder="Search station..." 
                         value={stationQuery}
                         onChange={(e) => setStationQuery(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 text-sm font-semibold border-none rounded-lg bg-transparent outline-none text-teal-400 placeholder-slate-400"
                       />
                     </div>
                   </div>
                 </div>
                 <div className="p-2 space-y-4">
                    {allStations.length > 0 ? allStations.map((station: any, idx: number) => {
                      if (stationQuery && !(station.station_name || station.stationName || '').toLowerCase().includes(stationQuery.toLowerCase())) {
                        return null;
                      }
                      const isActive = !station.isPast && (idx === 0 || allStations[idx-1].isPast);
                      return (
                      <div key={idx} className={`flex items-center p-4 rounded-2xl relative transition-all ${isActive ? 'bg-cyan-950/40 shadow-3d-inset border border-cyan-900' : 'bg-[#0d1326] shadow-3d hover:scale-[1.01]'}`}>
                         <div className="w-[60px] flex flex-col items-center justify-center shrink-0">
                              {station.isPast ? (
                               <div className="w-8 h-8 rounded-full bg-[#0d1326] shadow-3d flex items-center justify-center z-10"><div className="w-2.5 h-2.5 bg-slate-400 rounded-full shadow-inner"></div></div>
                            ) : isActive ? (
                               <div className="w-12 h-12 rounded-full bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 flex items-center justify-center ring-4 ring-blue-100 animate-pulse z-10 text-white shadow-3d-button"><Train size={20} className="drop-shadow-md"/></div>
                            ) : (
                               <div className="w-8 h-8 rounded-full bg-[#0d1326] shadow-3d flex items-center justify-center z-10"><div className="w-2.5 h-2.5 bg-slate-300 rounded-full shadow-inner"></div></div>
                            )}
                            {idx !== allStations.length - 1 && (
                               <div className={`absolute top-12 bottom-[-24px] w-1 rounded-full ${station.isPast ? 'bg-slate-300 shadow-inner' : 'bg-slate-200 border-l-2 border-dashed border-teal-800'}`}></div>
                            )}
                         </div>
                         <div className="ml-4 flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                            <div>
                              <p className={`font-extrabold ${isActive ? 'text-blue-800 text-lg uppercase tracking-tight drop-shadow-sm' : station.isPast ? 'text-teal-600' : 'text-teal-300 drop-shadow-sm'}`}>
                                {station.station_name || station.stationName}
                              </p>
                              <p className="text-xs text-teal-600 font-medium">Dist: {station.distance || station.distance_from_source || 0} km</p>
                            </div>
                            <div>
                              <p className="text-xs text-teal-600 font-bold uppercase">{station.isPast ? 'Actual Arr/Dep' : 'ETA/ETD'}</p>
                              <p className={`font-medium ${station.isPast ? 'text-teal-600 text-sm' : 'text-sm'}`}>
                                {station.timing || `${station.eta || station.arrival_time || 'N/A'} / ${station.etd || station.departure_time || 'N/A'}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-teal-600 font-bold uppercase">Platform</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className={`font-medium text-sm ${station.isPast ? 'text-teal-600' : 'text-cyan-400'}`}>
                                  PF - {station.platform_number || station.platform || 'TBD'}
                                </p>
                                {(station.platform_changed || station.is_unusual_platform) && !station.isPast && (
                                  <div className="relative flex items-center justify-center p-0.5" title="Unusual Platform / Changed">
                                    <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              {isActive && <div className="mb-1"><span className="bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">Approaching</span></div>}
                              <p className="text-xs text-teal-600 font-bold uppercase">Status</p>
                              {(() => {
                                 const delayVal = isNaN(Number(station.delay)) ? (isNaN(Number(station.arr_delay)) ? 0 : Number(station.arr_delay)) : Number(station.delay);
                                 let colorCls = station.isPast ? 'text-teal-600' : 'text-green-600';
                                 let txt = 'On Time';
                                 if (delayVal > 0 && delayVal < 15) {
                                    colorCls = station.isPast ? 'text-teal-600' : 'text-yellow-600';
                                    txt = `Late by ${delayVal} mins`;
                                 } else if (delayVal >= 15) {
                                    colorCls = station.isPast ? 'text-teal-600' : 'text-red-500';
                                    txt = `Late by ${delayVal} mins`;
                                 }
                                 return (
                                   <p className={`font-bold text-sm ${colorCls}`}>{txt}</p>
                                 );
                              })()}
                            </div>
                         </div>
                      </div>
                    )}) : (
                      <div className="p-8 text-center text-teal-600">No route timeline available.</div>
                    )}
                 </div>
              </div>
              )}

              {activeTab === 'station_info' && (() => {
                 const query = stationQuery.toLowerCase();
                 const filteredStations = allStations.map((st, i) => ({st, i})).filter(item => 
                    !query || (item.st.station_name || item.st.stationName || '').toLowerCase().includes(query)
                 );

                 const targetStation = ledStationIdx >= 0 && allStations[ledStationIdx] ? allStations[ledStationIdx] : (trainData.current_station_name ? { station_name: trainData.current_station_name, platform_number: trainData?.upcoming_stations?.[0]?.platform_number, delay: trainData.delay, eta: trainData?.upcoming_stations?.[0]?.eta, isPast: false } : trainData.upcoming_stations?.[0] || trainData);
                 
                 return (
              <div className="flex-1 flex flex-col justify-start items-center p-4 lg:py-8">
                 <div className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1326] p-4 rounded-xl border border-teal-900 shadow-sm">
                   <div className="font-bold text-teal-400 whitespace-nowrap flex items-center gap-2">
                     <Search size={16} className="text-teal-600" />
                     <input 
                       type="text" 
                       placeholder="Search station..."
                       value={stationQuery}
                       onChange={(e) => setStationQuery(e.target.value)}
                       className="p-1.5 border-b-2 border-teal-800 bg-transparent focus:border-blue-600 outline-none text-sm font-normal w-full sm:w-48"
                     />
                   </div>
                   <select 
                     className="w-full sm:w-auto flex-1 p-2 border border-teal-900 rounded-lg bg-[#0d1326] text-sm font-medium focus:ring-2 focus:ring-blue-500"
                     value={ledStationIdx} 
                     onChange={(e) => setLedStationIdx(Number(e.target.value))}
                   >
                     <option value={-1}>-- Current / Approaching Station --</option>
                     {filteredStations.map(({st, i}) => (
                       <option key={i} value={i}>{st.station_name || st.stationName} {st.isPast ? '(Departed)' : '(Upcoming)'}</option>
                     ))}
                   </select>
                 </div>
                 
                <div className="w-full max-w-4xl bg-black p-6 rounded-[2rem] border-[12px] border-slate-800 shadow-2xl overflow-hidden relative font-mono aspect-[21/9] flex flex-col justify-between shrink-0">
                  {/* Glass glare effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-30"></div>
                  {/* LED Dot pattern background overlay */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuNykiLz4KPC9zdmc+')] z-20 pointer-events-none"></div>
                  
                  {/* Info Header */}
                  <div className="flex justify-between text-orange-600 text-sm md:text-xl font-bold uppercase tracking-widest z-10 drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
                    <span>{trainData.train_number}</span>
                    <span className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></span>
                       LIVE TRACKING
                    </span>
                  </div>

                  {/* Scrolling LED Text */}
                  <div className="my-auto z-10 w-full overflow-hidden">
                     {(() => {
                        const delayNum = targetStation?.delay || 0;
                        let colorClass = "text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]";
                        if (delayNum === 0) {
                           colorClass = "text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,1)]";
                        } else if (delayNum < 15) {
                           colorClass = "text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]";
                        } else {
                           colorClass = "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]";
                        }
                        return (
                           <marquee className={`${colorClass} text-4xl md:text-[5rem] lg:text-[6rem] font-bold tracking-[0.2em] uppercase leading-none pb-4 pt-2`} scrollamount="12">
                             TR:- {trainData.train_name || trainData.train_number || 'UNKNOWN'}
                             &nbsp;&nbsp;•&nbsp;&nbsp; 
                             {targetStation?.station_name || targetStation?.stationName || 'IN TRANSIT'} 
                             &nbsp;&nbsp;•&nbsp;&nbsp; 
                             PF-{targetStation?.platform_number || targetStation?.platform || 'TBD'}
                             &nbsp;&nbsp;•&nbsp;&nbsp; 
                             {delayNum > 0 ? `DELAY ${delayNum}MIN` : 'ON TIME'}
                           </marquee>
                        );
                     })()}
                  </div>

                  {/* Info Footer */}
                  <div className="flex justify-between text-orange-600 text-xs md:text-base font-bold uppercase tracking-widest z-10 drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]">
                    <span>{ledStationIdx >= 0 ? (targetStation?.isPast ? 'DEPARTED' : 'UPCOMING') : `NXT: ${trainData.upcoming_stations?.[0]?.station_name || 'TBD'}`}</span>
                    <span>{targetStation?.isPast ? `DEP: ${targetStation?.actual_departure_time || targetStation?.departure_time || 'N/A'}` : `ETA: ${targetStation?.eta || targetStation?.arrival_time || 'TBD'}`}</span>
                  </div>
                </div>
                <p className="mt-8 text-teal-600 text-sm font-medium">Advanced LED Terminal Display Module ({targetStation?.station_code || ''})</p>
              </div>
              );
              })()}

              {activeTab === 'map' && (
                <div className="flex-1 bg-[#0d1326] rounded-xl border border-teal-900 overflow-hidden relative min-h-[500px] h-full">
                  <RouteMap stations={allStations} />
                </div>
              )}

            </div>
          ) : status ? (
             <div className="flex flex-col items-center justify-center text-teal-600 py-12 px-4 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-400" />
                </div>
                <p className="text-lg font-bold text-teal-400">{trainData?.message || "No data found"}</p>
                <p className="text-sm mt-2">Try selecting a different start day or check the train number.</p>
             </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-teal-600 py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50">
                <Train size={40} className="text-slate-300" />
              </div>
              <p className="text-lg font-medium text-teal-500">No Train Selected</p>
              <p className="text-sm mt-1">Enter a train number to view its real-time journey.</p>
            </div>
          )}
        </section>
        </>
        )}
      </main>

      <footer className="px-4 lg:px-8 py-3 bg-[#0d1326] border-t border-teal-900 flex flex-col sm:flex-row items-center justify-between text-xs text-teal-600 gap-2 relative z-10">
        <p>&copy; 2026 RailMitra AI Systems</p>
        <p className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> API Platform Synced</p>
      </footer>

      {/* Floating AI Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {isAiOpen && (
          <div className="w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[80vh] shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 origin-bottom-right">
            <RailMitraAi onAction={handleAiAction} onClose={() => setIsAiOpen(false)} />
          </div>
        )}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${isAiOpen ? 'bg-slate-800 text-white rotate-12 scale-90' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/30 ring-4 ring-white'}`}
          aria-label="Toggle AI Assistant"
        >
          <Bot size={28} />
        </button>
      </div>
    </div>
  );
}
