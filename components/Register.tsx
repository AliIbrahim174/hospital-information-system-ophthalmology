import React, { useState } from "react";
import { dataService } from "../services/dataService";
import { UserRole } from "../types";

type Props = {
  onGoLogin: () => void;
};

const Register: React.FC<Props> = ({ onGoLogin }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("Patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!name.trim()) return setErr("Please enter your full name.");
    if (!email.trim()) return setErr("Please enter an email.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");

    try {
      setLoading(true);
      await dataService.register(email.trim(), password, role, name.trim());
      setMsg("Account created successfully. Now login with your email and password.");
      // optional: auto go to login after a second
      // setTimeout(() => onGoLogin(), 800);
    } catch (e: any) {
      setErr(e?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
        <p className="text-slate-500 text-sm mt-1">
          Register as a patient or doctor. Admin accounts are created by the system.
        </p>

        {err && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., Patient Three"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Doctor accounts will get a DoctorProfile auto-created.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="name@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Minimum 8 characters"
              type="password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-700 transition font-semibold disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <button onClick={onGoLogin} className="text-blue-600 font-semibold hover:underline">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
