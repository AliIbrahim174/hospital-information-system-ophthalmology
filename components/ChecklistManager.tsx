import React, { useState, useEffect } from 'react';
import { VisitNote } from '../types';
import { dataService } from '../services/dataService';

const ChecklistManager: React.FC = () => {
  const patientId = 'p1'; // Ahmed Youssef
  const patientName = 'Ahmed Youssef';
  const mockApptId = 'appt-demo-1';

  const [note, setNote] = useState<Partial<VisitNote>>({
      chief_complaint: '',
      diagnosis: '',
      treatment_plan: '',
      follow_up_date: ''
  });

  const [history, setHistory] = useState<VisitNote[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Initial fetch of history
    setHistory(dataService.getVisitNotesByPatient(patientId));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newNote = dataService.saveVisitNote({
          appointment_id: mockApptId,
          patient_id: patientId,
          chief_complaint: note.chief_complaint || '',
          diagnosis: note.diagnosis || '',
          treatment_plan: note.treatment_plan || '',
          follow_up_date: note.follow_up_date
      });

      // Update local history
      setHistory([...history, newNote]);
      
      alert('Consultation Note Saved Successfully!');
      
      // Clear form
      setNote({
          chief_complaint: '',
          diagnosis: '',
          treatment_plan: '',
          follow_up_date: ''
      });
  };

  const handleLoadLast = () => {
      const lastNote = dataService.getLastVisitNoteByPatient(patientId);
      if (lastNote) {
          setNote({
              chief_complaint: lastNote.chief_complaint,
              diagnosis: lastNote.diagnosis,
              treatment_plan: lastNote.treatment_plan,
              follow_up_date: lastNote.follow_up_date
          });
          alert('Last visit data loaded!');
      } else {
          alert('No previous visits found for this patient.');
      }
  };

  const handleSelectHistory = (h: VisitNote) => {
      setNote({
          chief_complaint: h.chief_complaint,
          diagnosis: h.diagnosis,
          treatment_plan: h.treatment_plan,
          follow_up_date: h.follow_up_date
      });
      setShowHistory(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Medical History Modal */}
      {showHistory && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
                      <h3 className="text-xl font-bold">Medical History: {patientName}</h3>
                      <button onClick={() => setShowHistory(false)} className="text-2xl font-bold hover:text-slate-200">&times;</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <p className="text-xs text-slate-500 mb-2 italic">Tip: Click on a previous visit to retrieve its data into the current form.</p>
                      {history.length > 0 ? history.map((h, i) => (
                          <div 
                            key={h.visit_id} 
                            onClick={() => handleSelectHistory(h)}
                            className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group"
                          >
                              <span className="absolute top-4 right-4 text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">VISIT #{history.length - i}</span>
                              <div className="space-y-3">
                                  <div>
                                      <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Chief Complaint</label>
                                      <p className="text-slate-800 font-medium italic">"{h.chief_complaint}"</p>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Diagnosis</label>
                                      <p className="text-slate-900 font-bold">{h.diagnosis}</p>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Treatment & Notes</label>
                                      <p className="text-slate-700 text-sm leading-relaxed">{h.treatment_plan}</p>
                                  </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-200 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <span>📥</span> Click to retrieve this visit data
                              </div>
                          </div>
                      )).reverse() : (
                          <div className="text-center py-12 text-slate-400 italic">
                                No medical records found for this patient.
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                       <button 
                         onClick={() => setShowHistory(false)}
                         className="px-8 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-all"
                       >
                           Close
                       </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Doctor Consultation</h2>
            <p className="text-slate-500">Record visit details for Patient: <span className="font-semibold text-blue-600">{patientName}</span></p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg text-blue-800 text-sm font-medium">
            Session ID: #VST-9982
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex gap-4">
             <button 
                type="button" 
                onClick={handleLoadLast}
                className="px-4 py-2 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
             >
                Load Last Visit
             </button>
             <button 
                type="button" 
                onClick={() => setShowHistory(true)}
                className="px-4 py-2 bg-white border border-slate-300 rounded shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
             >
                View Medical History
             </button>
        </div>

        <div className="p-8 space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    Chief Complaint <span className="text-red-500">*</span>
                </label>
                <textarea 
                    value={note.chief_complaint}
                    onChange={(e) => setNote({...note, chief_complaint: e.target.value})}
                    placeholder="e.g., Patient reports gradual loss of vision in right eye..."
                    className="w-full h-24 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Diagnosis <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        value={note.diagnosis}
                        onChange={(e) => setNote({...note, diagnosis: e.target.value})}
                        placeholder="e.g., Diabetic Retinopathy"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                    />
                </div>
                <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">
                        Follow-up Date
                    </label>
                    <input 
                        type="date"
                        value={note.follow_up_date}
                        onChange={(e) => setNote({...note, follow_up_date: e.target.value})}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    Treatment Plan & Notes <span className="text-red-500">*</span>
                </label>
                <textarea 
                    value={note.treatment_plan}
                    onChange={(e) => setNote({...note, treatment_plan: e.target.value})}
                    placeholder="e.g., Prescribed Anti-VEGF injections. Advised strict blood sugar control."
                    className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    required
                />
            </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">
                Draft
             </button>
             <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-medium flex items-center gap-2">
                <span>💾</span> Finalize Consultation
             </button>
        </div>
      </form>
    </div>
  );
};

export default ChecklistManager;