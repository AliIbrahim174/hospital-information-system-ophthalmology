import React, { useEffect, useMemo, useState } from "react";
import { dataService } from "../services/dataService";
import { Appointment, DoctorProfile, VisitNoteCreate } from "../types";

type Props = {
  currentUser: { name: string; role: string; id: string } | null;
};

const SPECIALTIES = ["All", "General", "Retina", "Glaucoma", "Cataract", "Cornea"];

const normStatus = (s: any) => String(s || "").toLowerCase().trim();

const AppointmentsPage: React.FC<Props> = ({ currentUser }) => {
  const role = currentUser?.role || "Guest";
  const userId = Number(currentUser?.id || 0);

  const isPatient = role === "Patient";
  const isDoctor = role === "Doctor";
  const isAdmin = role === "Admin";

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // booking form (patient)
  const [specialty, setSpecialty] = useState<string>("All");
  const [doctorId, setDoctorId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [actionMsg, setActionMsg] = useState<string>("");

  // visit note modal (doctor)
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string>("");

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [noteForm, setNoteForm] = useState<VisitNoteCreate>({
    appointment_id: 0,
    chief_complaint: "",
    diagnosis: "",
    treatment_plan: "",
    follow_up_date: "",
  });

  const apptIdOf = (a: any) => Number(a?.appointment_id ?? a?.id ?? 0);

  const loadAll = async () => {
    setLoading(true);
    setActionMsg("");
    try {
      const [d, a] = await Promise.all([dataService.getDoctors(), dataService.getAppointments()]);
      setDoctors(d);
      setAppointments(Array.isArray(a) ? a : [a]);
    } catch (e: any) {
      console.error(e);
      setActionMsg("Failed to load appointments/doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doctorsFiltered = useMemo(() => {
    if (specialty === "All") return doctors;
    return doctors.filter(
      (d) => (d.specialization || "").toLowerCase() === specialty.toLowerCase()
    );
  }, [doctors, specialty]);

  const myAppointments = useMemo(() => {
    if (isPatient) return appointments.filter((a) => Number(a.patient_id) === userId);
    if (isDoctor) return appointments.filter((a) => Number(a.doctor_id) === userId);
    if (isAdmin) return appointments;
    return [];
  }, [appointments, isPatient, isDoctor, isAdmin, userId]);

  const formatWhen = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const book = async () => {
    setActionMsg("");
    if (!doctorId) return setActionMsg("Pick a doctor first.");
    if (!scheduledAt) return setActionMsg("Pick date & time.");
    if (!reason.trim()) return setActionMsg("Write a reason.");

    const iso = new Date(scheduledAt).toISOString();

    try {
      await dataService.bookAppointment({
        doctor_id: Number(doctorId),
        scheduled_at: iso,
        reason: reason.trim(),
      } as any);

      setReason("");
      setScheduledAt("");
      setDoctorId("");
      setActionMsg("Appointment requested ✅");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setActionMsg("Booking failed. Check backend console and request payload.");
    }
  };

  const openNote = (appt: Appointment) => {
    setSelectedAppt(appt);
    setNoteError("");
    setNoteForm({
      appointment_id: apptIdOf(appt),
      chief_complaint: "",
      diagnosis: "",
      treatment_plan: "",
      follow_up_date: "",
    });
    setNoteOpen(true);
  };

  const saveNote = async () => {
    if (!selectedAppt) return;

    setNoteError("");
    if (!noteForm.chief_complaint.trim()) return setNoteError("Chief complaint is required.");
    if (!noteForm.diagnosis.trim()) return setNoteError("Diagnosis is required.");
    if (!noteForm.treatment_plan.trim()) return setNoteError("Treatment plan is required.");

    try {
      setNoteSaving(true);

      const payload: VisitNoteCreate = {
        appointment_id: Number(noteForm.appointment_id),
        chief_complaint: noteForm.chief_complaint.trim(),
        diagnosis: noteForm.diagnosis.trim(),
        treatment_plan: noteForm.treatment_plan.trim(),
        follow_up_date: noteForm.follow_up_date ? noteForm.follow_up_date : null,
      };

      await dataService.saveVisitNote(payload);

      setNoteOpen(false);
      setSelectedAppt(null);
      setActionMsg("Visit note saved ✅");
      await loadAll();
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message || "");
      if (msg.includes("400") || msg.toLowerCase().includes("unique")) {
        setNoteError("A note already exists for this appointment.");
      } else {
        setNoteError("Failed to save note. Check backend response.");
      }
    } finally {
      setNoteSaving(false);
    }
  };

  const markCompleted = async (a: any) => {
    try {
      const id = apptIdOf(a);
      await dataService.markAppointmentCompleted(id);
      setActionMsg("Marked as Completed ✅");
      await loadAll();
    } catch (e) {
      console.error(e);
      setActionMsg("Failed to update status ❌");
    }
  };

  const cancelAppt = async (a: any) => {
    try {
      const id = apptIdOf(a);
      const ok = window.confirm("Cancel this appointment?");
      if (!ok) return;
      await dataService.cancelAppointment(id);
      setActionMsg("Appointment cancelled ✅");
      await loadAll();
    } catch (e) {
      console.error(e);
      setActionMsg("Failed to cancel ❌");
    }
  };

  if (loading) return <div className="p-6 text-slate-600">Loading appointments...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {isPatient ? "Appointments Manager" : isDoctor ? "My Schedule" : "All Appointments"}
        </h2>
        <p className="text-slate-500 mt-1">
          {isPatient
            ? "Manage your bookings and see specialists"
            : isDoctor
            ? "View and manage your upcoming consultations"
            : "Admin view of all bookings"}
        </p>

        {actionMsg && (
          <div className="mt-4 p-3 rounded-xl border bg-slate-50 text-slate-700">{actionMsg}</div>
        )}
      </div>

      {/* PATIENT: booking form */}
      {isPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Book New Appointment</h3>

            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Specialty</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Doctor</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Choose...</option>
              {doctorsFiltered.map((d) => (
                <option key={String((d as any).doctor_id)} value={String((d as any).doctor_id)}>
                  {d.full_name} - {d.specialization || "General"}
                </option>
              ))}
            </select>

            <label className="block text-sm font-semibold text-slate-700 mb-1">Date &amp; Time</label>
            <input
              type="datetime-local"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />

            <label className="block text-sm font-semibold text-slate-700 mb-1">Reason</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Retina checkup"
            />

            <button
              onClick={book}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 transition"
            >
              Request Appointment
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">My Bookings</h3>

            {myAppointments.length === 0 ? (
              <div className="text-slate-400 italic">No bookings yet.</div>
            ) : (
              <div className="space-y-4">
                {myAppointments.map((a: any, idx) => {
                  const st = normStatus(a.status);
                  const cancellable = st === "pending" || st === "confirmed";

                  return (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800">{a.doctorName || "Doctor"}</div>
                          <div className="text-slate-500 text-sm">{formatWhen(a.scheduled_at)}</div>
                          <div className="text-slate-600 text-sm">{a.reason}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                            {a.status}
                          </div>

                          {/* Cancel disappears once Completed/Cancelled */}
                          {cancellable && (
                            <button
                              onClick={() => cancelAppt(a)}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCTOR */}
      {isDoctor && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Appointments</h3>

          {myAppointments.length === 0 ? (
            <div className="text-slate-400 italic">No appointments assigned.</div>
          ) : (
            <div className="space-y-4">
              {myAppointments.map((a: any, idx) => {
                const st = normStatus(a.status);
                const canComplete = st === "pending" || st === "confirmed";
                const isCancelled = st === "cancelled";
                const isCompleted = st === "completed";

                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{a.patientName || "Patient"}</div>
                      <div className="text-slate-500 text-sm">{formatWhen(a.scheduled_at)}</div>
                      <div className="text-slate-600 text-sm">{a.reason}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        {a.status}
                      </div>

                      {/* Complete disappears after Completed/Cancelled */}
                      {canComplete && (
                        <button
                          onClick={() => markCompleted(a)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
                        >
                          Mark Completed
                        </button>
                      )}

                      {/* Notes: disabled if Cancelled (optional but sane) */}
                      <button
                        onClick={() => openNote(a)}
                        disabled={isCancelled}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold transition"
                        title={
                          isCancelled
                            ? "Cancelled appointment"
                            : isCompleted
                            ? "Add note for completed visit"
                            : "Add note"
                        }
                      >
                        Add Visit Note
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADMIN */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">All Appointments</h3>

          {appointments.length === 0 ? (
            <div className="text-slate-400 italic">No appointments found.</div>
          ) : (
            <div className="space-y-4">
              {appointments.map((a: any, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 flex justify-between">
                  <div>
                    <div className="font-bold text-slate-800">
                      {a.doctorName || `Doctor #${a.doctor_id}`} •{" "}
                      {a.patientName || `Patient #${a.patient_id}`}
                    </div>
                    <div className="text-slate-500 text-sm">{formatWhen(a.scheduled_at)}</div>
                    <div className="text-slate-600 text-sm">{a.reason}</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 h-fit">
                    {a.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTE MODAL */}
      {noteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setNoteOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50"
              title="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-800">Create Visit Note</h3>
            <p className="text-slate-500 text-sm mt-1">
              Appointment #{noteForm.appointment_id} • Patient:{" "}
              {(selectedAppt as any)?.patientName || "Patient"}
            </p>

            {noteError && (
              <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700">
                {noteError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Chief Complaint
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  value={noteForm.chief_complaint}
                  onChange={(e) => setNoteForm((p) => ({ ...p, chief_complaint: e.target.value }))}
                  placeholder="e.g., blurred vision"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  value={noteForm.diagnosis}
                  onChange={(e) => setNoteForm((p) => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="e.g., suspected retinal issue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Treatment Plan
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 min-h-[90px]"
                  value={noteForm.treatment_plan}
                  onChange={(e) => setNoteForm((p) => ({ ...p, treatment_plan: e.target.value }))}
                  placeholder="e.g., OCT scan + follow-up"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Follow-up Date (optional)
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  value={(noteForm.follow_up_date as string) || ""}
                  onChange={(e) => setNoteForm((p) => ({ ...p, follow_up_date: e.target.value }))}
                />
              </div>

              <button
                onClick={saveNote}
                disabled={noteSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl py-3 transition"
              >
                {noteSaving ? "Saving..." : "Save Visit Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
