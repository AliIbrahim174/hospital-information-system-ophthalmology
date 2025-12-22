import React, { useState } from 'react';

const protocols = [
    {
        id: 1,
        title: "Surgical Hand Antisepsis",
        category: "Hygiene",
        content: "All surgical staff must perform a surgical hand scrub using an antimicrobial soap or an alcohol-based hand rub before donning sterile gloves. Scrub time should be 2-5 minutes depending on product instructions.",
        lastUpdated: "2023-09-12"
    },
    {
        id: 2,
        title: "Sharps Safety & Disposal",
        category: "Safety",
        content: "Pass sharp instruments using a neutral zone (hands-free technique). Do not hand sharps directly hand-to-hand. Dispose of needles immediately after use in the designated red sharps container. Never recap used needles.",
        lastUpdated: "2023-11-05"
    },
    {
        id: 3,
        title: "Universal Protocol (Time Out)",
        category: "Procedural",
        content: "The final Time Out must occur immediately before skin incision. It must involve the entire team. Verbal confirmation of patient, site, and procedure is mandatory. Any team member can stop the process if a discrepancy is found.",
        lastUpdated: "2023-08-20"
    },
    {
        id: 4,
        title: "Sterile Field Maintenance",
        category: "Infection Control",
        content: "Only sterile items are used within the sterile field. Sterile persons are gowned and gloved. Tables are sterile only at table level. If sterility is in doubt, consider it contaminated.",
        lastUpdated: "2023-10-01"
    }
];

const SOPViewer: React.FC = () => {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Standard Operating Procedures (SOP)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-3">
                    {protocols.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                                selectedId === p.id 
                                ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.category}</span>
                            <h3 className={`font-semibold mt-1 ${selectedId === p.id ? 'text-blue-700' : 'text-slate-700'}`}>{p.title}</h3>
                        </button>
                    ))}
                </div>

                <div className="md:col-span-2">
                    {selectedId ? (
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-full">
                            {(() => {
                                const p = protocols.find(i => i.id === selectedId);
                                if (!p) return null;
                                return (
                                    <>
                                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                            <h3 className="text-2xl font-bold text-slate-800">{p.title}</h3>
                                            <span className="text-sm text-slate-400">Updated: {p.lastUpdated}</span>
                                        </div>
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-lg text-slate-700 leading-relaxed">{p.content}</p>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                                            <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
                                                Download PDF
                                            </button>
                                            <button className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
                                                Share
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12">
                            <span className="text-4xl mb-4">📋</span>
                            <p>Select a protocol from the list to view details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SOPViewer;