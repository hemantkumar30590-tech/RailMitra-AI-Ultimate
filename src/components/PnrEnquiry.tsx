import { useState } from 'react';
import { Search, Utensils, Info, CheckCircle2 } from 'lucide-react';

export default function PnrEnquiry({ onTrainClick }: { onTrainClick?: (no: string) => void }) {
  const [pnr, setPnr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);

  const fetchPnr = async () => {
    if (pnr.length !== 10) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/pnr-status?pnr=${pnr}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PNR check failed");
      setResult({
        pnr: data.pnr || pnr,
        train_no: data.train_no || "—",
        train_name: data.train_name || "Train",
        from: data.from || "—",
        to: data.to || "—",
        date: data.date || new Date().toLocaleDateString("en-GB"),
        class: data.class || "—",
        chart_status: data.chart_status || "Unknown",
        passengers: data.passengers?.length
          ? data.passengers
          : [{ s_no: 1, booking_status: "—", current_status: "—" }],
        source: data.source,
      });
    } catch (e: any) {
      setResult({
        pnr,
        train_no: "—",
        train_name: "PNR unavailable",
        from: "—",
        to: "—",
        date: new Date().toLocaleDateString("en-GB"),
        class: "—",
        chart_status: e.message || "Lookup failed",
        passengers: [],
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <div className="rounded-3xl shadow-3d-card p-6 lg:p-8 mb-6 shrink-0 bg-[#0d1326]">
        <h2 className="text-xl font-extrabold text-teal-300 mb-6 drop-shadow-sm flex items-center gap-2">
          PNR Enquiry & Food Delivery
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 p-2 rounded-2xl shadow-3d-inset bg-[#0d1326]">
            <input 
              type="text" 
              placeholder="Enter 10-digit PNR Number" 
              value={pnr}
              maxLength={10}
              onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent border-none text-teal-400 font-bold outline-none uppercase placeholder:normal-case py-2 px-3 placeholder-slate-400"
            />
          </div>
          <button 
            onClick={fetchPnr}
            disabled={pnr.length !== 10 || loading}
            className="w-full sm:w-auto bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-900 text-white py-4 px-8 rounded-2xl font-extrabold shadow-3d-button flex items-center justify-center gap-2 text-base uppercase tracking-wider transition-all disabled:opacity-75"
          >
            <Search size={20} className="drop-shadow-sm" />
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-3xl shadow-3d-card p-6 lg:p-8 flex flex-col xl:flex-row gap-8 items-start flex-1 overflow-y-auto bg-[#0d1326]">
          <div className="w-full xl:w-2/3 shrink-0">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-1 drop-shadow-sm">PNR Number</h3>
                  <p className="text-2xl font-extrabold text-cyan-400 drop-shadow-sm">{result.pnr}</p>
               </div>
               <div className="bg-green-950/40 text-green-400 px-4 py-2 rounded-xl text-sm font-extrabold shadow-3d-button border-none">
                  {result.chart_status}
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-[#0d1326] p-4 rounded-2xl shadow-3d flex flex-col items-center text-center">
                 <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1 drop-shadow-sm">Train</p>
                 <p 
                   onClick={() => onTrainClick?.(result.train_no)}
                   className="font-extrabold text-cyan-400 hover:underline cursor-pointer drop-shadow-sm"
                 >
                   {result.train_no} - <span className="text-teal-300">{result.train_name}</span>
                 </p>
               </div>
               <div className="bg-[#0d1326] p-4 rounded-2xl shadow-3d flex flex-col items-center text-center">
                 <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1 drop-shadow-sm">Boarding Date</p>
                 <p className="font-extrabold text-teal-300 drop-shadow-sm">{result.date}</p>
               </div>
               <div className="bg-[#0d1326] p-4 rounded-2xl shadow-3d flex flex-col items-center text-center">
                 <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1 drop-shadow-sm">From - To</p>
                 <p className="font-extrabold text-teal-300 drop-shadow-sm">{result.from} → {result.to}</p>
               </div>
               <div className="bg-[#0d1326] p-4 rounded-2xl shadow-3d flex flex-col items-center text-center">
                 <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mb-1 drop-shadow-sm">Class</p>
                 <p className="font-extrabold text-teal-300 drop-shadow-sm">{result.class}</p>
               </div>
            </div>

            <h4 className="font-bold text-teal-300 mb-3 border-b border-slate-100 pb-2">Passenger Information</h4>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0d1326] text-teal-600 text-sm uppercase tracking-wider">
                      <th className="p-3 rounded-l-lg font-bold">Passenger</th>
                      <th className="p-3 font-bold">Booking Status</th>
                      <th className="p-3 rounded-r-lg font-bold">Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.passengers.map((p: any) => (
                      <tr key={p.s_no} className="border-b last:border-0 border-slate-100">
                        <td className="p-3 font-medium text-teal-300">Passenger {p.s_no}</td>
                        <td className="p-3 text-sm text-teal-500">{p.booking_status}</td>
                        <td className="p-3 text-sm font-bold text-green-600">{p.current_status}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-orange-800 text-sm">
                <Info size={20} className="shrink-0 text-orange-500"/>
                <p>{result.source === "irctc27" ? "Live PNR data via RapidAPI (irctc27)." : result.error ? "PNR lookup failed — check key/quota or try again." : "PNR status from railway API."}</p>
            </div>
          </div>

          <div className="w-full xl:w-1/3 bg-orange-50 rounded-2xl p-6 border border-orange-100 flex flex-col h-full shrink-0">
             <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shrink-0">
                <Utensils size={24} />
             </div>
             <h3 className="text-xl font-bold text-teal-300 mb-2">Order Food in Train</h3>
             <p className="text-sm text-teal-500 mb-6 leading-relaxed">
               Get popular meals delivered right to your seat. Choose your upcoming station and enjoy hot and fresh food on your journey.
             </p>
             
             {!ordered ? (
               <div className="flex-1 flex flex-col h-full">
                 <div className="bg-[#0d1326] rounded-xl p-4 border border-orange-100 shadow-sm mb-4 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => !foodModalOpen && setFoodModalOpen(true)}>
                    <div className="flex justify-between items-start">
                       <div>
                         <h4 className="font-bold text-teal-300">Veg Deluxe Thali</h4>
                         <p className="text-xs text-teal-600 mt-1">Paneer Butter Masala, Dal Makhani, 4 Roti, Rice, Sweet</p>
                       </div>
                       <span className="font-bold text-green-600">₹250</span>
                    </div>
                 </div>
                 <div className="bg-[#0d1326] rounded-xl p-4 border border-orange-100 shadow-sm mb-6 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => !foodModalOpen && setFoodModalOpen(true)}>
                    <div className="flex justify-between items-start">
                       <div>
                         <h4 className="font-bold text-teal-300">Egg Biryani Combo</h4>
                         <p className="text-xs text-teal-600 mt-1">Authentic Egg Biryani + Raita + Cold Drink</p>
                       </div>
                       <span className="font-bold text-green-600">₹180</span>
                    </div>
                 </div>
                 
                 <div className="mt-auto pt-4 border-t border-orange-100">
                   <button 
                     onClick={() => setFoodModalOpen(true)}
                     className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                   >
                     Browse Full Menu & Order
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 size={48} className="text-green-500 mb-3" />
                  <h4 className="font-bold text-green-800 text-lg mb-1">Order Confirmed!</h4>
                  <p className="text-sm text-green-400">Your food will be delivered at the upcoming station. Seat: B2 / 34</p>
                  <button onClick={() => setOrdered(false)} className="mt-4 text-xs font-bold text-teal-600 underline">Order something else</button>
               </div>
             )}
          </div>
        </div>
      )}

      {foodModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-[#0d1326] max-w-md w-full rounded-2xl shadow-xl overflow-hidden flex flex-col">
              <div className="bg-zinc-900 p-4 text-white flex justify-between items-center shrink-0">
                 <h3 className="font-bold flex items-center gap-2"><Utensils size={18}/> Delivery at Station: CNB</h3>
                 <button onClick={() => setFoodModalOpen(false)} className="text-teal-600 hover:text-white">✕</button>
              </div>
              <div className="p-6">
                 <p className="text-sm text-teal-500 mb-4">You are confirming an order for <span className="font-bold text-teal-300">PNR {pnr}</span>. Select payment method below.</p>
                 <div className="border border-teal-900 rounded-lg p-3 mb-4 bg-[#0d1326]">
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="radio" name="payment" defaultChecked className="accent-blue-600" />
                       <span className="font-bold text-sm">Cash on Delivery</span>
                    </label>
                 </div>
                 <button 
                   onClick={() => {
                     setOrdered(true);
                     setFoodModalOpen(false);
                   }}
                   className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={18} />
                   Confirm Order
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
