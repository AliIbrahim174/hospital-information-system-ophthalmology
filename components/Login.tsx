import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (user: { name: string; role: string; id: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Patient');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLoginMode) {
        const user = await dataService.login(email, password);
        if (!user) {
          setError('Invalid email or password.');
          return;
        }

        // For now, show something reasonable as "name"
        const displayName = email.split('@')[0] || 'User';

        onLogin({
          name: displayName,
          role: user.role,
          id: String(user.user_id),
        });
      } else {
        // Register
        await dataService.register(email, password, role, name || email.split('@')[0] || 'User');
        setSuccess('Account created successfully. Please login.');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        <div className="bg-blue-600 p-8 text-center relative">
          <div className="text-5xl mb-4">👁️</div>
          <h1 className="text-3xl font-bold text-white mb-2">EyeCare HIS</h1>
          <p className="text-blue-100">Ophthalmology Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
              {success}
            </div>
          )}

          {!isLoginMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('Patient')}
                    className={`py-2 rounded-lg border ${
                      role === 'Patient'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Doctor')}
                    className={`py-2 rounded-lg border ${
                      role === 'Doctor'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    Doctor
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Please wait...' : isLoginMode ? 'Login' : 'Register'}
          </button>

          <p className="text-center text-sm text-slate-600">
            {isLoginMode ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={toggleMode} className="text-blue-600 font-semibold hover:underline">
              {isLoginMode ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
