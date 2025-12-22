import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InstrumentTracker from './components/InstrumentTracker';
import ChecklistManager from './components/ChecklistManager';
import IncidentReporter from './components/IncidentReporter';
import DatabaseView from './components/DatabaseView';
import Login from './components/Login';
import AppointmentsPage from './components/AppointmentsPage';
import { dataService } from './services/dataService';
import { DashboardStats } from './types';
import Home from "./components/Home";
import Register from "./components/Register";
import VisitNotesPage from './components/VisitNotesPage';

const EMPTY_STATS: DashboardStats = {
  totalAppointmentsToday: 0,
  activeDoctors: 0,
  patientsRegistered: 0,
  pendingMessages: 0,
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleLogin = (user: { name: string; role: string; id: string }) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    dataService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    setStats(EMPTY_STATS);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    // only admin/doctor should hit dashboard stats
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Doctor') return;

    (async () => {
      try {
        setStatsLoading(true);
        const s = await dataService.getDashboardStats();
        setStats(s);
      } catch (e) {
        console.error(e);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [isLoggedIn, currentUser?.role]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return statsLoading ? (
          <div className="p-6 text-slate-600">Loading dashboard stats...</div>
        ) : (
          <Dashboard stats={stats} />
        );
      case 'appointments':
        return <AppointmentsPage currentUser={currentUser} />;
      case 'patients':
        return <InstrumentTracker currentUser={currentUser} />;
      case 'consultation':
        return <ChecklistManager />;
      case 'messages':
        return <IncidentReporter currentUser={currentUser} />;
      case 'system':
        return <DatabaseView />;
        case 'notes':
          return <VisitNotesPage currentUser={currentUser} />;

      default:
        return <Dashboard stats={stats} />;
    }
  };

if (!isLoggedIn) {
  if (activeTab === "login") return <Login onLogin={handleLogin} />;
  if (activeTab === "register") return <Register onGoLogin={() => setActiveTab("login")} />;
  if (activeTab === "messages") return <IncidentReporter />;

  return (
    <Home
      onGoLogin={() => setActiveTab("login")}
      onGoRegister={() => setActiveTab("register")}
      onGoContact={() => setActiveTab("messages")}
    />
  );
}



  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser?.role} />

        <main className="flex-1 p-8 overflow-auto pt-20 md:pt-8">
        <header className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Ophthalmology Department</h1>
              <p className="text-slate-500 text-sm mt-1">Hospital Information System Dashboard</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  {currentUser?.role === 'Doctor' ? '👨‍⚕️' : currentUser?.role === 'Patient' ? '👤' : '🛡️'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-green-600 font-medium">● {currentUser?.role || 'Guest'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-100 transition font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
