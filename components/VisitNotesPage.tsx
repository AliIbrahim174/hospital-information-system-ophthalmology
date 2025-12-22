import React, { useEffect, useMemo, useState } from "react";
import { dataService } from "../services/dataService";
import { Appointment, VisitNote } from "../types";

type Props = {
  currentUser: { name: string; role: string; id: string } | null;
};

const VisitNotesPage: React.FC<Props> = ({ currentUser }) => {
  const role = currentUser?.role || "Guest";
  const patientId = String(currentUser?.id || "");

  const [notes, setNotes] = useState<VisitNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("");

  const isPatient = role === "Patient";
  const isAdmin = role === "Admin";
  const isDoctor = role === "Doctor";

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      if (!patientId) {
        setNotes([]);
        setAppointments([]);
        setMsg("No patient id found.");
        return;
      }

      // Patient reads their own notes
      // Admin/Doctor can still open this, but we’ll mainly show it to patients in Sidebar
      const [n, a] = await Promise.all([
        dataService.getVisitNotesByPatient(patientId),
        dataService.getAppointments(),
      ]);

      setNotes(Array.isArray(n) ? n : (n ? [n as any] : []));
      setAppointments(Array.isArray(a) ? a : (a ? [a as any] : []));
    } catch (e: any) {
      console.error(e);
      setMsg("Failed to load visit notes. Check backend + permissions.");
      setNotes([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Build a lookup map: appointment_id OR id -> appointment
  const apptById = useMemo(() => {
    const map = new Map<number, Appointment>();
    for (const appt of appointments) {
      const key = Number((appt as any).appointment_id ?? (appt as any).id ?? 0);
      if (key) map.set(key, appt);
    }
    return map;
  }, [appointments]);

  // Sort newest first (if created_at exists). Otherwise keep as is.
  const sortedNotes = useMemo(() => {
    const copy = [...notes];
    copy.sort((a: any, b: any) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
    return copy;
  }, [notes]);

  const formatWhen = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  if (!currentUser) {
    return <div className="p-6 text-slate-600">Please login.</div>;
  }

  // If you want: allow admin/doctor too.
  // For now, we show it mainly for patients in the sidebar.
  if (!isPatient && !isAdmin && !isDoctor) {
    return <div className="p-6 text-slate-600">Not available for your role.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800">My Visit Notes</h2>
        <p className="text-slate-500 mt-1">
          These are the doctor’s notes from your consultations (diagnosis, plan, follow-up).
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition"
          >
            Refresh
          </button>
          {msg && <div className="text-sm text-red-600">{msg}</div>}
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-slate-600">Loading visit notes...</div>
      ) : sortedNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-slate-400 italic">
          No visit notes yet. (A doctor must create a note for an appointment first.)
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotes.map((note: any, idx) => {
            const visitId = note.visit_id ?? note.id ?? idx;
            const apptId = Number(note.appointment_id ?? note.appointment ?? 0);
            const appt = apptById.get(apptId);

            return (
              <div
                key={String(visitId)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">
                      Appointment #{apptId || "?"}
                      {appt?.scheduled_at ? ` • ${formatWhen(appt.scheduled_at)}` : ""}
                    </div>
                    <div className="font-bold text-slate-800 mt-1">
                      {(appt as any)?.doctorName ? `Dr. ${(appt as any).doctorName}` : "Doctor Visit Note"}
                    </div>
                    {(appt as any)?.reason && (
                      <div className="text-slate-600 text-sm mt-1">Reason: {(appt as any).reason}</div>
                    )}
                  </div>

                  {note.follow_up_date && (
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 h-fit">
                      Follow-up: {note.follow_up_date}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Chief Complaint</div>
                    <div className="text-slate-800">{note.chief_complaint || "-"}</div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Diagnosis</div>
                    <div className="text-slate-800">{note.diagnosis || "-"}</div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Treatment Plan</div>
                    <div className="text-slate-800 whitespace-pre-wrap">{note.treatment_plan || "-"}</div>
                  </div>

                  {note.created_at && (
                    <div className="text-xs text-slate-400 mt-2">
                      Created: {formatWhen(note.created_at)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VisitNotesPage;
