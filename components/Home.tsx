import React, { useState } from "react";

type Props = {
  onGoLogin: () => void;
  onGoRegister: () => void;
  onGoContact: () => void;
};

const Home: React.FC<Props> = ({ onGoLogin, onGoRegister, onGoContact }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-3xl font-bold text-slate-800">Ophthalmology Department HIS</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          A hospital information system simulation for managing ophthalmology patients, appointments,
          visit notes, and scans. Built with a React frontend and Django + PostgreSQL backend.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGoLogin}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            Login
          </button>

          <button
            onClick={onGoRegister}
            className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition font-semibold"
          >
            Register
          </button>

          <button
            onClick={onGoContact}
            className="bg-slate-100 text-slate-700 px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 transition font-semibold"
          >
            Contact Us
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xl">📅</div>
            <p className="font-bold text-slate-800 mt-1">Appointments</p>
            <p className="text-sm text-slate-600 mt-1">Book and manage patient-doctor schedules.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xl">📝</div>
            <p className="font-bold text-slate-800 mt-1">Visit Notes</p>
            <p className="text-sm text-slate-600 mt-1">Doctors record diagnosis and treatment plans.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xl">🖼️</div>
            <p className="font-bold text-slate-800 mt-1">Scans & Uploads</p>
            <p className="text-sm text-slate-600 mt-1">Upload OCT / eye scans securely.</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Visitor mode: no patient data is shown until login.
        </p>
      </div>
    </div>
  );
};

export default Home;
