import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
}

const appointmentTrendData = [
  { name: 'Mon', count: 0 },
  { name: 'Tue', count: 0 },
  { name: 'Wed', count: 0 },
  { name: 'Thu', count: 0 },
  { name: 'Fri', count: 0 },
  { name: 'Sat', count: 0 },
];

const patientGrowthData = [
  { name: 'Week 1', newPatients: 0 },
  { name: 'Week 2', newPatients: 0 },
  { name: 'Week 3', newPatients: 0 },
  { name: 'Week 4', newPatients: 0 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800">Clinic Administration Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="text-slate-500 text-sm font-medium">Appointments Today</div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-blue-600">
              {stats.totalAppointmentsToday}
            </span>
            <span className="text-slate-400 text-sm mb-1">Scheduled</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="text-slate-500 text-sm font-medium">Active Doctors</div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-slate-800">{stats.activeDoctors}</span>
            <span className="text-green-500 text-sm font-medium mb-1">● Online</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="text-slate-500 text-sm font-medium">Registered Patients</div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-indigo-600">{stats.patientsRegistered}</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full mb-1">+5 this week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="text-slate-500 text-sm font-medium">New Messages</div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold text-rose-500">{stats.pendingMessages}</span>
            <span className="text-slate-400 text-xs mb-2">Unread</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Appointment Volume (Weekly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Registrations</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="newPatients" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
        <span className="text-blue-500 text-xl mt-0.5">ℹ️</span>
        <div>
          <h4 className="font-semibold text-blue-800">System Notification</h4>
          <p className="text-sm text-blue-700">Dr. Sarah Nabil has requested a schedule change for next Tuesday. Please review in the Doctors panel.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;