import React, { useEffect, useMemo, useState } from "react";
import { dataService } from "../services/dataService";
import { Appointment, Upload, PatientProfile } from "../types";

type Props = {
  currentUser: { name: string; role: string; id: string } | null;
};

// local type (in case you didn’t add it to types.ts yet)
type UploadComment = {
  reply_id: number;
  upload_id: number;
  created_by_id: number;
  created_by_email: string;
  created_by_role: string;
  message: string;
  created_at: string;
};

const InstrumentTracker: React.FC<Props> = ({ currentUser }) => {
  const role = currentUser?.role || "Guest";
  const userId = Number(currentUser?.id || 0);

  const isPatient = role === "Patient";
  const isDoctor = role === "Doctor";
  const isAdmin = role === "Admin";

  const canPickPatient = isDoctor || isAdmin;
  const canReply = isDoctor || isAdmin;

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");

  const [files, setFiles] = useState<Upload[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("scan");
  const [description, setDescription] = useState<string>("");

  // Comments UI
  const [activeUploadId, setActiveUploadId] = useState<number | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<UploadComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentErr, setCommentErr] = useState<string>("");

  // Doctor: only patients from their appointments (no data leaks)
  const doctorPatients = useMemo(() => {
    if (!isDoctor) return [];
    const mine = appointments.filter((a) => Number(a.doctor_id) === userId);

    const map = new Map<number, { id: number; name: string }>();
    for (const a of mine) {
      const pid = Number(a.patient_id);
      const pname = (a as any).patientName || `Patient ${pid}`;
      if (!map.has(pid)) map.set(pid, { id: pid, name: pname });
    }
    return Array.from(map.values());
  }, [appointments, isDoctor, userId]);

  const myAppointments = useMemo(() => {
    if (!selectedPatientId) return [];
    const pid = Number(selectedPatientId);

    if (isDoctor) {
      return appointments.filter(
        (a) => Number(a.doctor_id) === userId && Number(a.patient_id) === pid
      );
    }
    if (isAdmin) {
      return appointments.filter((a) => Number(a.patient_id) === pid);
    }
    return [];
  }, [appointments, selectedPatientId, isDoctor, isAdmin, userId]);

  const loadBootstrap = async () => {
    setMsg("");
    setLoading(true);
    try {
      if (isPatient) return;

      const appts = await dataService.getAppointments();
      setAppointments(Array.isArray(appts) ? appts : [appts]);

      if (isAdmin) {
        const ps = await dataService.getPatients();
        setPatients(ps);
      }
    } catch (e: any) {
      console.error(e);
      setMsg("Failed to load supporting data.");
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (patientId: string) => {
    setMsg("");
    setLoading(true);
    try {
      const data = await dataService.getPatientFiles(patientId);
      setFiles(Array.isArray(data) ? data : [data]);
    } catch (e: any) {
      console.error(e);
      setMsg("Failed to load files (permissions or backend error).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Patient: auto-load their own files
  useEffect(() => {
    if (isPatient && userId) {
      loadFiles(String(userId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPatient, userId]);

  // Doctor: auto-select first patient
  useEffect(() => {
    if (isDoctor && !selectedPatientId && doctorPatients.length > 0) {
      setSelectedPatientId(String(doctorPatients[0].id));
      setSelectedAppointmentId("");
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, doctorPatients.length]);

  // When a patient is selected, auto-load their files
  useEffect(() => {
    if (!canPickPatient) return;
    if (!selectedPatientId) return;
    loadFiles(selectedPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  const handleRefresh = async () => {
    if (isPatient) return loadFiles(String(userId));
    if (!selectedPatientId) return setMsg("Pick a patient first.");
    return loadFiles(selectedPatientId);
  };

  const handleUpload = async () => {
    setMsg("");
    if (!fileToUpload) return setMsg("Pick a file first.");

    try {
      setLoading(true);

      const payload: any = {
        file: fileToUpload,
        file_type: fileType,
        description: description?.trim() || "",
        appointment_id: selectedAppointmentId || null,
      };

      if (!isPatient) {
        if (!selectedPatientId) return setMsg("Pick a patient first.");
        payload.patient_id = selectedPatientId;
      }

      await dataService.saveUpload(payload);

      setFileToUpload(null);
      setDescription("");
      setMsg("Upload successful ✅");

      await handleRefresh();
    } catch (e: any) {
      console.error(e);
      setMsg("Upload failed. Check backend permissions and request payload.");
    } finally {
      setLoading(false);
    }
  };

  const openComments = async (uploadId: number) => {
    setCommentsOpen(true);
    setActiveUploadId(uploadId);
    setCommentErr("");
    setCommentText("");
    setComments([]);
    setCommentsLoading(true);

    try {
      const list = await dataService.listUploadComments(String(uploadId));
      setComments(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error(e);
      setCommentErr("Failed to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentsOpen(false);
    setActiveUploadId(null);
    setComments([]);
    setCommentText("");
    setCommentErr("");
  };

  const sendComment = async () => {
    setCommentErr("");
    if (!canReply) return setCommentErr("Only doctors/admin can reply.");
    if (!activeUploadId) return setCommentErr("No upload selected.");
    if (!commentText.trim()) return setCommentErr("Write a reply first.");

    try {
      await dataService.addUploadComment(String(activeUploadId), commentText.trim());
      setCommentText("");

      // refresh thread
      const list = await dataService.listUploadComments(String(activeUploadId));
      setComments(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error(e);
      setCommentErr("Failed to send reply.");
    }
  };

  const renderPatientPicker = () => {
    if (!canPickPatient) return null;

    if (isDoctor) {
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Select Patient</label>
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2"
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setSelectedAppointmentId("");
              setFiles([]);
              closeComments();
            }}
          >
            <option value="">Choose...</option>
            {doctorPatients.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name} (#{p.id})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Doctor can only see patients that have appointments with them.
          </p>
        </div>
      );
    }

    // Admin
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Select Patient</label>
        <select
          className="w-full border border-slate-200 rounded-xl px-3 py-2"
          value={selectedPatientId}
          onChange={(e) => {
            setSelectedPatientId(e.target.value);
            setSelectedAppointmentId("");
            setFiles([]);
            closeComments();
          }}
        >
          <option value="">Choose...</option>
          {patients.map((p: any) => {
            const pid = String(p.patient_id ?? p.user_id ?? "");
            return (
              <option key={pid} value={pid}>
                {p.full_name || `Patient ${pid}`} (#{pid})
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  const renderAppointmentPicker = () => {
    // Patient: allow manual appointment_id entry
    if (isPatient) {
      return (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Appointment ID (optional)
          </label>
          <input
            className="w-full border border-slate-200 rounded-xl px-3 py-2"
            placeholder="e.g., 1"
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">
            Optional. Link this file to an appointment if you know the ID.
          </p>
        </div>
      );
    }

    // Doctor/Admin: choose from patient appointments
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Link to Appointment (optional)
        </label>
        <select
          className="w-full border border-slate-200 rounded-xl px-3 py-2"
          value={selectedAppointmentId}
          onChange={(e) => setSelectedAppointmentId(e.target.value)}
          disabled={!selectedPatientId}
        >
          <option value="">None</option>
          {myAppointments.map((a: any) => (
            <option key={String(a.id ?? a.appointment_id)} value={String(a.id ?? a.appointment_id)}>
              #{String(a.id ?? a.appointment_id)} • {new Date(a.scheduled_at).toLocaleString()} • {a.reason}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800">Scans & Documents</h2>
        <p className="text-slate-500 mt-1">
          {isPatient
            ? "Upload your scans and view doctor replies."
            : isDoctor
            ? "Browse patient uploads (only your patients) and reply."
            : "Admin can browse uploads and reply."}
        </p>

        {msg && (
          <div className="mt-4 p-3 rounded-xl border bg-slate-50 text-slate-700">{msg}</div>
        )}
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {renderPatientPicker()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderAppointmentPicker()}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">File Type</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <option value="scan">scan</option>
              <option value="report">report</option>
              <option value="image">image</option>
              <option value="other">other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <input
            className="w-full border border-slate-200 rounded-xl px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., OCT scan"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <input type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} />

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              onClick={handleUpload}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-60"
              disabled={loading}
            >
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Files list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Uploaded Files</h3>
          <div className="text-xs text-slate-500">
            {isPatient ? `Patient #${userId}` : selectedPatientId ? `Patient #${selectedPatientId}` : ""}
          </div>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-slate-400 italic">No files found.</div>
        ) : (
          <div className="space-y-4">
            {files.map((u: any) => {
              const uploadId = Number(u.upload_id ?? u.id ?? 0);
              const fileUrl = u.file_path || "";

              return (
                <div key={String(uploadId)} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800">{u.description || "File"}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {u.file_type || "unknown"} • Uploaded:{" "}
                        {u.uploaded_at ? new Date(u.uploaded_at).toLocaleString() : "—"}
                      </div>
                      {u.appointment_id && (
                        <div className="text-xs text-slate-500">Appointment: #{u.appointment_id}</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {fileUrl ? (
                        <a
                          className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm"
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-sm">
                          No URL
                        </span>
                      )}

                      <button
                        onClick={() => openComments(uploadId)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                      >
                        Notes / Replies
                      </button>
                    </div>
                  </div>

                  {/* Small hint under each upload */}
                  <div className="mt-3 text-xs text-slate-500">
                    {isPatient
                      ? "Doctors can reply to this file with notes."
                      : "You can open the file and add a medical reply."}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments modal */}
      {commentsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 relative">
            <button
              onClick={closeComments}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50"
              title="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-800">Upload Notes</h3>
            <p className="text-slate-500 text-sm mt-1">Upload #{activeUploadId}</p>

            {commentErr && (
              <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700">
                {commentErr}
              </div>
            )}

            <div className="mt-4 border border-slate-200 rounded-xl bg-slate-50 max-h-[320px] overflow-auto p-3 space-y-3">
              {commentsLoading ? (
                <div className="text-slate-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-slate-400 italic">No notes yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.reply_id} className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-800">
                        {c.created_by_role} • {c.created_by_email}
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="text-slate-700 text-sm mt-2 whitespace-pre-wrap">{c.message}</div>
                  </div>
                ))
              )}
            </div>

            {/* Reply box (Doctor/Admin only) */}
            <div className="mt-4">
              {canReply ? (
                <>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Add Reply
                  </label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 min-h-[90px]"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write your medical note / instruction..."
                  />
                  <button
                    onClick={sendComment}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 transition"
                  >
                    Send Reply
                  </button>
                </>
              ) : (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  Patients can read replies here. Only doctors/admin can send notes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstrumentTracker;
