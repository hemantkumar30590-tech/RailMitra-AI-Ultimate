import { useState, useEffect, useRef } from "react";
import Speedometer from "./Speedometer";
import { Search, Info, Train, AlertCircle, X, Navigation, Maximize, Minimize, Clock, Volume2, Square } from "lucide-react";

export default function StationDisplay({ onTrainClick }: { onTrainClick?: (no: string) => void }) {
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [stationSuggestions, setStationSuggestions] = useState<any[]>([]);
  const [showStationSuggest, setShowStationSuggest] = useState(false);
  const [arrivals, setArrivals] = useState<any[]>([]);

  const isAnnouncingRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingTrainNo, setPlayingTrainNo] = useState<string | null>(null);

  const stopAudio = () => {
      isAnnouncingRef.current = false;
      setPlayingTrainNo(null);
      if (activeAudioRef.current) {
          activeAudioRef.current.pause();
          activeAudioRef.current.src = "";
          activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
      }
  };

  const formatDelayDisplay = (delayMins: number) => {
      if (delayMins < 60) return `${delayMins}M`;
      const h = Math.floor(delayMins / 60);
      const m = delayMins % 60;
      return m > 0 ? `${h}H ${m}M` : `${h}H`;
  };

  const formatTrainNameForTTS = (name: string) => {
      let n = name.toUpperCase();
      n = n.replace(/\bJN\b/g, 'Junction');
      n = n.replace(/\bEXP\b/g, 'Express');
      n = n.replace(/\bSF\b/g, 'Superfast');
      n = n.replace(/\bPASS\b/g, 'Passenger');
      n = n.replace(/\bSPL\b/g, 'Special');
      n = n.replace(/\bCANTT\b/g, 'Cantt');
      return n.toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getAnnouncementTexts = (train: any, skipIntro: boolean = false) => {
    const trainNo = train.train_no?.split('').join(' ') || '';
    let pf = train.platform || train.platform_number;
    if (pf === "0" || pf === 0) pf = null;
    const delay = train.delayMins || 0;

    let sourceName = formatTrainNameForTTS(train.source_name || "");
    let destName = formatTrainNameForTTS(train.destination_name || "");
    let viaName = formatTrainNameForTTS(train.via || "");
    let trainName = formatTrainNameForTTS(train.train_name || "");

    const parts = [];
    // Only add intro if not skipping
    if (!skipIntro) {
      parts.push(`यात्री कृपया ध्यान दें।`);
    }
    
    let trainInfoSet = [];
    if (sourceName && destName) {
        trainInfoSet.push(`${sourceName} से ${destName} जा रही, गाड़ी संख्या ${trainNo}`);
    } else if (trainName) {
        trainInfoSet.push(`${trainName}, गाड़ी संख्या ${trainNo}`);
    }

    if (delay > 0) {
        const hours = Math.floor(delay / 60);
        const minutes = delay % 60;
        let delayMsg = "अपने निर्धारित समय से ";
        if (hours > 0) delayMsg += `${hours} घंटे `;
        if (minutes > 0) delayMsg += `${minutes} मिनट `;
        delayMsg += "की देरी से चल रही है।";
        trainInfoSet.push(delayMsg);
    } else {
        trainInfoSet.push(`अपने निर्धारित समय पर चल रही है।`);
    }
    parts.push(trainInfoSet.join(", "));

    let isArrivingSoon = true;
    let formatArrTime = "";
    if (train.arrival_time) {
        const [hh, mm] = train.arrival_time.split(':').map(Number);
        if (!isNaN(hh) && !isNaN(mm)) {
            const now = new Date();
            const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istNow = new Date(utcNow + (330 * 60000));
            let arrMins = hh * 60 + mm;
            let nowMins = istNow.getHours() * 60 + istNow.getMinutes();
            
            let diff = arrMins - nowMins;
            if (diff < -720) diff += 1440; 
            
            if (diff > 30) {
                isArrivingSoon = false;
            }
            
            let hh12 = hh % 12 || 12;
            let ampm = hh < 12 ? 'सुबह' : (hh < 17 ? 'दोपहर' : (hh < 20 ? 'शाम' : 'रात'));
            formatArrTime = `${ampm} ${hh12} बजकर ${mm} मिनट पर`;
        }
    }

    if (pf && pf !== '-') {
         if (isArrivingSoon) {
             parts.push(`और कुछ ही समय में, प्लेटफ़ॉर्म क्रमांक, ${pf}, पर आ रही है।`);
         } else {
             if (formatArrTime) {
                  parts.push(`और लगभग ${formatArrTime}, प्लेटफ़ॉर्म क्रमांक, ${pf}, पर आएगी।`);
             } else {
                  parts.push(`और प्लेटफ़ॉर्म क्रमांक, ${pf}, पर आएगी।`);
             }
         }
    } else {
         parts.push(`और प्लेटफ़ॉर्म क्रमांक की घोषणा, शीघ्र ही की जाएगी।`);
    }
    
    return parts;
  };

  const playTTS = async (text: string): Promise<void> => {
      return new Promise((resolve) => {
          if (!text.trim() || !isAnnouncingRef.current) {
              resolve(); 
              return;
          }

          const safeResolve = () => {
              if (activeAudioRef.current) {
                  activeAudioRef.current.onended = null;
                  activeAudioRef.current.onerror = null;
                  activeAudioRef.current = null;
              }
              resolve();
          };

          const doFallback = () => {
              if (!isAnnouncingRef.current) {
                  safeResolve(); return;
              }
              if (!('speechSynthesis' in window)) {
                  safeResolve(); return;
              }
              const doSpeak = () => {
                  const utterance = new SpeechSynthesisUtterance(text);
                  const voices = window.speechSynthesis.getVoices();
                  
                  const hindiVoice = 
                      voices.find(v => v.lang.includes('hi') && (v.name.includes('Swara') || v.name.includes('Aditi') || v.name.includes('Lekha') || v.name.includes('Kalpana'))) ||
                      voices.find(v => v.lang.includes('hi') && v.name.toLowerCase().includes('female')) ||
                      voices.find(v => v.lang.includes('hi') && !v.name.toLowerCase().includes('hemant') && !v.name.toLowerCase().includes('madhur')) ||
                      voices.find(v => v.lang.includes('hi-IN')) ||
                      voices.find(v => v.lang.includes('hi'));
                      
                  if (hindiVoice) utterance.voice = hindiVoice;
                  utterance.lang = 'hi-IN';
                  utterance.rate = 0.9;
                  utterance.pitch = 1.25; 
                  
                  utterance.onend = safeResolve;
                  utterance.onerror = safeResolve;
                  
                  window.speechSynthesis.speak(utterance);
              };
              if (window.speechSynthesis.getVoices().length === 0) {
                  window.speechSynthesis.onvoiceschanged = doSpeak;
              } else {
                  doSpeak();
              }
          };

          try {
              const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=hi-IN&q=${encodeURIComponent(text)}`;
              const audio = new Audio(url);
              activeAudioRef.current = audio;
              
              audio.playbackRate = 1.0; 
              audio.onended = safeResolve;
              audio.onerror = doFallback;
              audio.play().catch(doFallback);
          } catch(e) {
              doFallback();
          }
      });
  };

  // Function to announce individual train
  const announceTrain = async (e: any, train: any) => {
    e.stopPropagation(); 
    if (isAnnouncingRef.current) {
        stopAudio();
    }
    
    isAnnouncingRef.current = true;
    setPlayingTrainNo(train.train_no);
    
    // Play Indian Railway Chime Sound before announcement
    try {
        const chime = new Audio("https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg");
        activeAudioRef.current = chime;
        chime.volume = 0.3;
        await new Promise<void>((resolve) => {
            const finish = () => {
                if (activeAudioRef.current === chime) activeAudioRef.current = null;
                resolve();
            }
            chime.onended = finish;
            chime.onerror = finish;
            chime.play().catch(finish);
            setTimeout(finish, 3000); // safety fallback
        });
    } catch(e) {}

    if (!isAnnouncingRef.current) return;

    const parts = getAnnouncementTexts(train);
    // Combine parts to ensure one full sentence per train
    const fullText = parts.join(' ');
    await playTTS(fullText);
    
    if (isAnnouncingRef.current) {
        setPlayingTrainNo(null);
        isAnnouncingRef.current = false;
    }
  };

  // Function to announce all trains
  const announceAllTrains = async () => {
    if (isAnnouncingRef.current) {
        stopAudio();
    }
    
    isAnnouncingRef.current = true;
    setPlayingTrainNo("ALL");

    // Play Indian Railway Chime Sound before announcement
    try {
        const chime = new Audio("https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg");
        activeAudioRef.current = chime;
        chime.volume = 0.3;
        await new Promise<void>((resolve) => {
            const finish = () => {
                if (activeAudioRef.current === chime) activeAudioRef.current = null;
                resolve();
            }
            chime.onended = finish;
            chime.onerror = finish;
            chime.play().catch(finish);
            setTimeout(finish, 3000);
        });
    } catch(e) {}

    if (!isAnnouncingRef.current) return;
    
    // Announce intro
    await playTTS(`यात्री कृपया ध्यान दें, आने वाली ट्रेनों की जानकारी इस प्रकार है।`);
    
    for (const train of arrivals) {
        if (!isAnnouncingRef.current) break; 
        setPlayingTrainNo(train.train_no);
        const parts = getAnnouncementTexts(train, true); // Skip redundant intro!
        // Combined announce text with clear pauses
        const announceText = parts.join(' ');
        await playTTS(announceText); 
        
        if (!isAnnouncingRef.current) break;
        await new Promise(r => setTimeout(r, 1000)); // Increased pause between trains
    }
    
    if (isAnnouncingRef.current) {
        setPlayingTrainNo(null);
        isAnnouncingRef.current = false;
    }
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    const timer = setTimeout(() => {
      if (stationCode.length >= 2) {
        fetch(`/api/search-stations?q=${stationCode}`)
          .then(r => r.json())
          .then(d => setStationSuggestions(d.results || []))
          .catch(() => setStationSuggestions([]));
      } else {
        setStationSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [stationCode]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track selected train for full details modal
  const [selectedTrain, setSelectedTrain] = useState<any | null>(null);
  const [trainDetails, setTrainDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !isFullscreen) {
      if (boardRef.current?.requestFullscreen) {
        boardRef.current.requestFullscreen().catch(() => {
           setIsFullscreen(true); // CSS fallback
        });
      } else {
        setIsFullscreen(true); // CSS fallback
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
           setIsFullscreen(false);
        });
      } else {
         setIsFullscreen(false);
      }
    }
  };

  const welcomeAnnouncement = async (name: string) => {
    if (isAnnouncingRef.current) {
        stopAudio();
    }
    isAnnouncingRef.current = true;
    
    try {
        const chime = new Audio("https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg");
        activeAudioRef.current = chime;
        chime.volume = 0.3;
        await new Promise<void>((resolve) => {
            const finish = () => {
                if (activeAudioRef.current === chime) activeAudioRef.current = null;
                resolve();
            }
            chime.onended = finish;
            chime.onerror = finish;
            chime.play().catch(finish);
            setTimeout(finish, 3000); // 3 sec max
        });
    } catch(e) {}
    
    if (!isAnnouncingRef.current) return;
    
    const titleCaseName = formatTrainNameForTTS(name);
    await playTTS(`${titleCaseName} रेलवे स्टेशन में आपका स्वागत है।`);
    
    if (isAnnouncingRef.current) {
        isAnnouncingRef.current = false;
    }
  };

  const fetchStationArrivals = async (overrideCode?: string | any, overrideName?: string) => {
    const codeToUse = typeof overrideCode === 'string' ? overrideCode : stationCode;
    const nameToUse = typeof overrideName === 'string' ? overrideName : stationName;
    if (!codeToUse) return;
    
    // Welcome announcement starts immediately to preserve interaction context
    const nameToAnnounce = nameToUse || codeToUse;
    welcomeAnnouncement(nameToAnnounce);

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/station-arrivals?stationCode=${codeToUse.toUpperCase()}`);
      const data = await res.json();
      if (data.data) {
        // Deduplicate trains based on train_no to avoid double information
        const uniqueArrivals: any[] = [];
        const seen = new Set();
        for (const train of data.data) {
           if (!seen.has(train.train_no)) {
               seen.add(train.train_no);
               uniqueArrivals.push(train);
           }
        }
        setArrivals(uniqueArrivals);
      } else {
        setArrivals([]);
        setError(data.message || "Failed to fetch arrivals");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainDetails = async (trainNo: string) => {
    setDetailsLoading(true);
    setTrainDetails(null);
    try {
      // In a real app we'd fetch full schedule. For now, since we only have train ID
      // we could use our existing endpoint, or simply show metadata!
      const res = await fetch(`/api/train-status?trainNo=${trainNo}&startDay=1`);
      const data = await res.json();
      if (data.success) {
        setTrainDetails(data);
      } else {
        setTrainDetails({ error: data.message || "Could not load train details." });
      }
    } catch (err) {
      setTrainDetails({ error: "Failed to fetch details." });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleTrainClick = (train: any) => {
    if (onTrainClick) {
       onTrainClick(train.train_no);
    } else {
       setSelectedTrain(train);
       fetchTrainDetails(train.train_no);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="rounded-3xl shadow-3d-card p-6 lg:p-8 mb-6 shrink-0 bg-[#0d1326]">
        <h2 className="text-xl font-extrabold text-teal-300 mb-6 drop-shadow-sm">Station Live Board</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-auto flex-1">
            <div className="flex items-center gap-2 w-full p-2 rounded-2xl shadow-3d-inset bg-[#0d1326]">
              <Search size={20} className="text-teal-600 ml-2" />
              <input 
                type="text" 
                placeholder="Station Code (e.g. NDLS, BCT)" 
                value={stationCode} 
                onChange={(e) => {
                  setStationCode(e.target.value);
                  setStationName(""); // Reset manual if typed
                  setShowStationSuggest(true);
                }}
                onFocus={() => setShowStationSuggest(true)}
                onBlur={() => setTimeout(() => setShowStationSuggest(false), 200)}
                className="bg-transparent border-none focus:ring-0 text-sm md:text-base font-bold outline-none uppercase placeholder:normal-case w-full text-teal-400 py-2 placeholder-slate-400"
              />
            </div>
            {showStationSuggest && stationSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-3 rounded-2xl max-h-60 overflow-y-auto shadow-3d-card bg-[#0d1326]">
                {stationSuggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 hover:bg-[#0d1326] cursor-pointer text-sm border-b border-teal-900 last:border-0 transition-colors"
                    onClick={() => {
                      setStationCode(s.code);
                      setStationName(s.name);
                      setShowStationSuggest(false);
                      fetchStationArrivals(s.code, s.name);
                    }}
                  >
                    <span className="font-bold text-cyan-400 uppercase drop-shadow-sm">{s.code}</span> - <span className="text-teal-400 font-bold capitalize drop-shadow-sm">{s.name?.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            id="btn-fetch-station"
            onClick={fetchStationArrivals}
            disabled={loading}
            className="w-full md:w-auto bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 text-white py-4 px-8 rounded-2xl font-extrabold shadow-3d-button flex items-center justify-center gap-2 text-base uppercase tracking-wider transition-all disabled:opacity-75"
          >
            {loading ? "Loading..." : "Get Live Trains"}
          </button>
        </div>
      </div>

      {error ? (
         <div className="bg-red-950/40 backdrop-blur-sm shadow-3d-inset text-red-400 p-4 rounded-2xl flex items-center gap-3 mb-6 shrink-0 border border-red-900">
           <AlertCircle size={24} className="drop-shadow-sm shrink-0 text-red-500" />
           <p className="font-bold">{error}</p>
         </div>
      ) : arrivals.length > 0 ? (
        <div ref={boardRef} className={`flex-1 flex flex-col items-center w-full ${isFullscreen ? 'fixed inset-0 z-[100] bg-[#050505] p-0 m-0' : 'h-[75vh] lg:h-auto'}`}>
          {/* Outer realistic 3D frame */}
          <div 
            className={`w-full h-full bg-[#111] overflow-hidden relative font-mono flex flex-col shrink-0 transition-all 
              ${isFullscreen ? 'p-4 md:p-8 rounded-none border-none' : 'p-4 md:p-6 rounded-[2rem] border-[16px] border-[#2a2a2a] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_5px_15px_rgba(0,0,0,0.9),inset_0_0_0_2px_rgba(255,255,255,0.1)] min-h-[500px]'}`}
            style={!isFullscreen ? {
              background: 'linear-gradient(135deg, #111 0%, #050505 100%)',
              boxShadow: '15px 15px 30px #020308, -15px -15px 30px #121a2c, inset 0 0 20px rgba(0,0,0,0.9), 0 0 0 16px #333, 0 0 0 18px #111'
            } : {}}
          >
            {/* Glass reflection overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0 rounded-t-xl"></div>
            
            {/* LED Dot pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuNykiLz4KPC9zdmc+')] z-0 pointer-events-none opacity-50 mix-blend-multiply"></div>

            {/* Inner screen border/shadow */}
            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] pointer-events-none z-10"></div>

             {/* Header - Airport Style */}
            <div className="flex justify-between items-center text-orange-500 text-sm md:text-2xl font-bold uppercase tracking-widest z-20 border-b-2 border-orange-900/50 pb-4 mb-4 gap-2 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)] relative">
              <span className="truncate flex items-center gap-3">
                 <div className="bg-orange-950/40 p-2 rounded-lg border border-orange-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),0_1px_2px_rgba(255,255,255,0.1)]">
                   <Train className="text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" size={28} />
                 </div>
                 {stationCode.toUpperCase()} DEPARTURES & ARRIVALS
              </span>
              <div className="flex items-center gap-4 shrink-0">
                 <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/60 rounded-xl border border-[#333] shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
                    <span className="text-orange-600/80 text-xs font-black">IST</span>
                    <span className="text-orange-400 font-mono drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]">
                      {new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                    </span>
                 </div>
                 <button onClick={playingTrainNo ? stopAudio : announceAllTrains} className="text-orange-500 hover:text-orange-300 transition-colors bg-gradient-to-b from-[#333] to-[#111] p-2.5 rounded-xl border border-[#444] border-b-black shadow-[0_4px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-[2px] active:shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(0,0,0,0.9)] relative z-20 group" title={playingTrainNo ? "Stop Announcement" : "Announce All Trains"}>
                    {playingTrainNo ? <Square size={20} fill="currentColor" className="drop-shadow-[0_0_5px_currentColor] group-hover:drop-shadow-[0_0_8px_currentColor]" /> : <Volume2 size={20} className="drop-shadow-[0_0_5px_currentColor] group-hover:drop-shadow-[0_0_8px_currentColor]" />}
                 </button>
                 <button onClick={toggleFullscreen} className="text-orange-500 hover:text-orange-300 transition-colors bg-gradient-to-b from-[#333] to-[#111] p-2.5 rounded-xl border border-[#444] border-b-black shadow-[0_4px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] active:translate-y-[2px] active:shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(0,0,0,0.9)] relative z-20 group">
                    {isFullscreen ? <Minimize size={20} className="drop-shadow-[0_0_5px_currentColor] group-hover:drop-shadow-[0_0_8px_currentColor]" /> : <Maximize size={20} className="drop-shadow-[0_0_5px_currentColor] group-hover:drop-shadow-[0_0_8px_currentColor]" />}
                 </button>
              </div>
            </div>

            {/* List of trains */}
            <div className="flex flex-col gap-2 z-10 overflow-hidden relative h-full animate-flicker">
              
              {/* Scrolling Container */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scroll pb-10">
                 <div className="flex flex-col min-w-full w-full">
                 
                    {/* Table Header */}
                    <div className="grid grid-cols-[60px_1fr_75px_40px_75px_24px] md:grid-cols-[100px_1fr_100px_80px_130px_32px] gap-1 md:gap-4 text-orange-600/80 text-[10px] md:text-sm font-bold uppercase border-b-2 border-[#1a1a1a] pb-2 mb-2 px-1 md:px-2 sticky top-0 bg-[#0a0a0c] z-20 drop-shadow-[0_0_5px_rgba(234,88,12,0.4)] shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                      <div className="truncate">Train</div>
                      <div>Destination / Name</div>
                      <div className="text-center">Time</div>
                      <div className="text-center">Plat</div>
                      <div className="text-right">Status</div>
                      <div></div>
                    </div>

                    {/* Inner wrapper for continuous scroll */}
                    <div className="flex flex-col gap-1 w-full pb-4 animate-[scroll-up_40s_linear_infinite] pause-on-hover px-1">
                      {[...arrivals, ...arrivals].map((train, i) => {
                         const delay = train.delayMins || 0;
                         let statusColor = "text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
                         let statusText = "ON TIME";
                         
                         let schTime = train.scheduled_arrival_time?.slice(0, 5) || train.arrival_time?.slice(0, 5) || '--:--';
                         let actTime = train.arrival_time?.slice(0, 5) || '--:--';

                         // Calculate mock actual time based on delay if not explicitly provided
                         if (delay > 0 && !train.scheduled_arrival_time) {
                             const parts = actTime.split(':');
                             if (parts.length === 2 && !isNaN(Number(parts[0]))) {
                                const ms = (parseInt(parts[0]) * 60 + parseInt(parts[1]) + delay) % 1440;
                                const h = Math.floor(ms / 60).toString().padStart(2, '0');
                                const m = (ms % 60).toString().padStart(2, '0');
                                actTime = `${h}:${m}`;
                             }
                         }
                         
                         if (delay > 0 && delay <= 15) {
                            statusColor = "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]";
                            statusText = `DELAY ${formatDelayDisplay(delay)}`;
                         } else if (delay > 15) {
                            statusColor = "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";
                            statusText = `LATE ${formatDelayDisplay(delay)}`;
                         }

                         return (
                          <div 
                            key={i} 
                            onClick={() => handleTrainClick(train)}
                            className="grid grid-cols-[60px_1fr_75px_40px_75px_24px] md:grid-cols-[100px_1fr_100px_80px_130px_32px] gap-1 md:gap-4 items-center text-[10px] md:text-xl font-bold uppercase tracking-wider py-4 md:py-5 px-3 md:px-4 rounded-2xl border border-[#222] shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] bg-gradient-to-b from-[#151515] to-[#0a0a0a] cursor-pointer hover:border-orange-900/50 transition-colors mb-3"
                          >
                            <div className="text-orange-400 font-mono text-[10px] md:text-lg drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]">{train.train_no}</div>
                            
                            <div className="text-orange-100 text-[10px] md:text-sm leading-tight break-words whitespace-normal drop-shadow-[0_0_8px_rgba(255,237,213,0.5)]">
                              {train.train_name}
                            </div>

                            <div className="text-center font-mono flex flex-col justify-center">
                               {delay > 0 ? (
                                 <>
                                   <span className="text-orange-700/80 text-[9px] md:text-xs line-through decoration-orange-700/80">{schTime}</span>
                                   <span className="text-yellow-400 text-[10px] md:text-lg drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">{actTime}</span>
                                 </>
                               ) : (
                                 <span className="text-orange-300 text-[10px] md:text-lg drop-shadow-[0_0_8px_rgba(253,186,116,0.6)]">{schTime}</span>
                               )}
                            </div>
                            
                            <div className="text-center">
                               <span className="inline-block bg-[#1a1a1a] border border-[#333] text-orange-500 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-lg font-mono shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)]">
                                 {train.platform || train.platform_number || '-'}
                               </span>
                            </div>

                            <div className={`text-right ${statusColor} font-mono tracking-tighter text-xs md:text-base`}>
                               {statusText}
                            </div>
                            
                            <div className="text-right flex justify-end">
                               <button 
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     if (playingTrainNo === train.train_no) {
                                         stopAudio();
                                     } else {
                                         announceTrain(e, train);
                                     }
                                 }}
                                 className={`p-1.5 md:p-2 rounded-full border ${playingTrainNo === train.train_no ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5),inset_0_0_5px_rgba(249,115,22,0.5)]' : 'bg-orange-950/30 border-orange-900/50 text-orange-600 hover:text-orange-400 hover:border-orange-500/50 shadow-[0_0_5px_rgba(249,115,22,0.1)]'} transition-all z-20 relative`}
                                 title={playingTrainNo === train.train_no ? "Stop Announcement" : "Play Announcement"}
                               >
                                 {playingTrainNo === train.train_no ? <Square className="w-3 h-3 md:w-4 md:h-4 drop-shadow-[0_0_5px_currentColor]" fill="currentColor" /> : <Volume2 className="w-3 h-3 md:w-4 md:h-4 drop-shadow-[0_0_3px_currentColor]" />}
                               </button>
                            </div>
                          </div>
                         )
                      })}
                    </div>
                 </div>
              </div>
              
              {/* Bottom Ticker */}
              <div className="absolute bottom-0 left-0 right-0 bg-red-950 border-t-2 border-red-900/50 flex py-1.5 md:py-2 px-2 z-30">
                 <span className="bg-red-600 text-white text-xs md:text-sm font-bold px-2 py-0.5 rounded shrink-0 z-10 flex items-center shadow-[0_0_10px_rgba(220,38,38,0.8)]">ALERT</span>
                 <marquee className="text-red-400 font-mono text-xs md:text-sm font-bold tracking-widest pl-4 drop-shadow-[0_0_5px_rgba(248,113,113,0.6)] flex items-center" scrollamount="6">
                    WELCOME TO {stationCode.toUpperCase()} JUNCTION. PLEASE MIND THE GAP BETWEEN THE TRAIN AND THE PLATFORM. PASSENGERS ARE REQUESTED NOT TO LEAVE THEIR LUGGAGE UNATTENDED. REPORT ANY SUSPICIOUS ACTIVITY TO RAILWAY POLICE. BEWARE OF PICKPOCKETS.
                 </marquee>
              </div>
            </div>
            
          </div>
          {!isFullscreen && (
             <p className="mt-8 text-teal-600 text-sm font-medium">Station Master Board LED System • Click any train for details</p>
          )}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-teal-600 py-12">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50">
             <Train size={40} className="text-slate-300" />
           </div>
           <p className="text-lg font-medium text-teal-500">Search for a Station</p>
           <p className="text-sm mt-1">Enter a station code (e.g. NDLS) to view the live LED board.</p>
        </div>
      )}

      {/* Train Details Modal */}
      {selectedTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#0d1326] rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-[#0d1326]/50">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-blue-100 text-cyan-400 font-bold px-3 py-1 rounded-md text-sm">{selectedTrain.train_no}</span>
                      <span className="bg-slate-200 text-teal-400 font-bold px-2 py-1 rounded text-xs uppercase tracking-wider">PF: {selectedTrain.platform && selectedTrain.platform !== "0" && selectedTrain.platform !== 0 ? selectedTrain.platform : '-'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-teal-300">{selectedTrain.train_name}</h3>
                 </div>
                 <button onClick={() => setSelectedTrain(null)} className="p-2 bg-[#0d1326] rounded-full text-teal-600 hover:text-teal-500 hover:bg-slate-100 shadow-sm border border-teal-900 transition-all">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                 {detailsLoading ? (
                    <div className="flex flex-col gap-3 items-center justify-center py-12 text-cyan-400">
                       <Train size={32} className="animate-pulse" />
                       <span className="font-medium animate-pulse">Tracking train...</span>
                    </div>
                 ) : trainDetails?.error ? (
                    <div className="text-red-500 bg-red-50 p-4 rounded-lg flex items-center gap-3">
                       <AlertCircle size={20} />
                       <span className="font-medium">{trainDetails.error}</span>
                    </div>
                 ) : trainDetails ? (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-[#0d1326] rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                             <span className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">Source</span>
                             <span className="text-teal-300 font-bold text-lg">{trainDetails.source}</span>
                          </div>
                          <div className="bg-[#0d1326] rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                             <span className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">Destination</span>
                             <span className="text-teal-300 font-bold text-lg">{trainDetails.destination}</span>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-4 border border-cyan-900 flex flex-col items-center justify-center text-center col-span-2 md:col-span-2 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                             <span className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Navigation size={12}/> Current Status</span>
                             <span className="text-blue-800 font-bold text-lg">{trainDetails.current_station_name}</span>
                             <span className="text-cyan-400 text-xs font-medium mt-1">{trainDetails.new_message}</span>
                          </div>
                          {trainDetails.estimated_speed_kmhr > 0 && (
                             <div className="col-span-2 md:col-span-2">
                                <Speedometer speed={trainDetails.estimated_speed_kmhr} />
                             </div>
                          )}
                       </div>

                       <div>
                          <h4 className="font-bold text-teal-300 mb-4 flex items-center gap-2">
                             <Clock size={16} className="text-teal-600"/>
                             Route Progress
                          </h4>
                          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                             {/* Show next upcoming station */}
                             {trainDetails.upcoming_stations?.slice(0, 4).map((st: any, idx: number) => {
                                 let delayColor = "text-green-600 bg-green-50 border-green-200";
                                 let delayText = "On Time";
                                 const delayVal = isNaN(Number(st.delay)) ? 0 : Number(st.delay);
                                 if (delayVal > 0 && delayVal < 15) {
                                    delayColor = "text-yellow-600 bg-yellow-50 border-yellow-200";
                                    delayText = `Late ${formatDelayDisplay(delayVal)}`;
                                 } else if (delayVal >= 15) {
                                    delayColor = "text-red-600 bg-red-50 border-red-200";
                                    delayText = `Late ${formatDelayDisplay(delayVal)}`;
                                 }
                                 
                                 return (
                               <div key={idx} className="relative flex items-center md:justify-between gap-4 py-2">
                                  <div className="md:w-1/2 flex md:justify-end">
                                     <div className="hidden md:block text-right">
                                        <p className="font-bold text-teal-300">{st.station_name}</p>
                                        <p className="text-xs text-teal-600 font-medium">{st.distance_km} km • <span className="text-teal-500 font-bold">PF: {st.platform || st.platform_number || '-'}</span></p>
                                     </div>
                                  </div>
                                  <div className="w-10 h-10 rounded-full bg-[#0d1326] border-4 border-slate-100 shrink-0 flex items-center justify-center z-10 shadow-sm relative">
                                     {idx === 0 ? <Train size={16} className="text-blue-500 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                                  </div>
                                  <div className="md:w-1/2 flex-1">
                                     <div className="md:hidden mb-1 flex justify-between items-center">
                                        <p className="font-bold text-teal-300 text-sm truncate">{st.station_name}</p>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-teal-500 rounded">PF: {st.platform || st.platform_number || '-'}</span>
                                     </div>
                                     <div className="bg-[#0d1326] border border-slate-100 rounded-lg p-2.5 inline-block min-w-[140px] shadow-sm">
                                        <div className="flex flex-col gap-1">
                                           <div className="flex justify-between items-center text-xs">
                                              <span className="text-teal-600 uppercase font-bold tracking-widest text-[9px]">Sch / Act</span>
                                           </div>
                                           <div className="flex items-center gap-2">
                                             <span className="text-teal-600 font-medium line-through decoration-slate-300 text-xs">{st.scheduled_arrival_time || st.arrival_time}</span>
                                             <span className="font-bold text-teal-300 font-mono text-sm">{st.eta || st.arrival_time}</span>
                                           </div>
                                           <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block w-max border ${delayColor}`}>
                                               {delayText}
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                             )})}
                          </div>
                          {trainDetails.upcoming_stations?.length > 4 && (
                             <div className="text-center mt-4">
                                <span className="text-teal-600 text-sm font-medium">+{trainDetails.upcoming_stations.length - 4} more stops</span>
                             </div>
                          )}
                       </div>
                    </div>
                 ) : null}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
