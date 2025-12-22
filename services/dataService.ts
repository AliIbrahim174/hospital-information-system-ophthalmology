import {
  UserAccount,
  DoctorProfile,
  PatientProfile,
  Appointment,
  VisitNote,
  VisitNoteCreate,
  Upload,
  ContactMessage,
  DashboardStats,
  UserRole,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

// =========================
// Token storage
// =========================
const ACCESS_KEY = "his_access";
const REFRESH_KEY = "his_refresh";

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

function setAccessToken(access: string): void {
  localStorage.setItem(ACCESS_KEY, access);
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// =========================
// Token refresh
// =========================
async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.access) {
      setAccessToken(data.access);
      return data.access;
    }
    return null;
  } catch {
    return null;
  }
}

// =========================
// apiFetch helper
// =========================
type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean; // for public endpoints (contact, register, login)
  _retry?: boolean;   // internal guard
};

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, _retry, ...fetchOptions } = options;

  const token = skipAuth ? null : getAccessToken();

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  // Attach JWT unless explicitly skipped
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // JSON default unless FormData
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  // If 401 and token-related: try refresh once then retry
  if (res.status === 401 && !skipAuth && !_retry) {
    const text = await res.text();

    const looksTokenRelated =
      text.includes("token_not_valid") ||
      text.toLowerCase().includes("token is expired") ||
      text.toLowerCase().includes("token_not_valid");

    if (looksTokenRelated) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        return apiFetch<T>(path, { ...options, _retry: true });
      }
      clearTokens();
    }

    throw new Error(`API 401: ${text}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  // Some endpoints may return empty body
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;

  return (await res.text()) as unknown as T;
}

// =========================
// Appointment status types
// =========================
export type AppointmentStatusValue = "Pending" | "Confirmed" | "Completed" | "Cancelled";

// =========================
// DataService
// =========================
class DataService {
  // ---------- Auth ----------
  async login(email: string, pass: string): Promise<UserAccount | null> {
    try {
      const tokens = await apiFetch<{ access: string; refresh: string }>("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
        skipAuth: true,
      });

      setTokens(tokens.access, tokens.refresh);

      const me = await apiFetch<UserAccount>("/api/accounts/me/", { method: "GET" });
      return me;
    } catch (e) {
      console.error(e);
      clearTokens();
      return null;
    }
  }

  async register(email: string, pass: string, role: UserRole, name: string): Promise<UserAccount> {
    return await apiFetch<UserAccount>("/api/accounts/register/", {
      method: "POST",
      body: JSON.stringify({ email, password: pass, role, name }),
      skipAuth: true,
    });
  }

  logout(): void {
    clearTokens();
  }

  // ---------- Getters ----------
  async getDoctors(): Promise<DoctorProfile[]> {
    return await apiFetch<DoctorProfile[]>("/api/accounts/doctors/", { method: "GET" });
  }

  async getPatients(): Promise<PatientProfile[]> {
    return await apiFetch<PatientProfile[]>("/api/accounts/patients/", { method: "GET" });
  }

  async getAppointments(): Promise<Appointment[]> {
    return await apiFetch<Appointment[]>("/api/appointments/", { method: "GET" });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return await apiFetch<DashboardStats>("/api/dashboard/stats/", { method: "GET" });
  }

  async getPatientFiles(patientId: string): Promise<Upload[]> {
    return await apiFetch<Upload[]>(`/api/uploads/list/?patient_id=${patientId}`, { method: "GET" });
  }

  async getMessages(): Promise<ContactMessage[]> {
    return await apiFetch<ContactMessage[]>("/api/contact/messages/", { method: "GET" });
  }

  // ---------- Actions ----------
  async bookAppointment(appt: Omit<Appointment, "appointment_id" | "status">): Promise<Appointment> {
    const payload = {
      doctor_id: Number(appt.doctor_id),
      scheduled_at: appt.scheduled_at,
      reason: appt.reason || "",
    };

    return await apiFetch<Appointment>("/api/appointments/book/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Core status update (used by doctor + patient helpers)
  async updateAppointmentStatus(
    appointmentId: number,
    status: AppointmentStatusValue
  ): Promise<Appointment> {
    return await apiFetch<Appointment>(`/api/appointments/${appointmentId}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Doctor convenience
  async markAppointmentCompleted(appointmentId: number): Promise<Appointment> {
    return await this.updateAppointmentStatus(appointmentId, "Completed");
  }

  // Patient convenience
  async cancelAppointment(appointmentId: number): Promise<Appointment> {
    return await this.updateAppointmentStatus(appointmentId, "Cancelled");
  }

  async saveVisitNote(note: VisitNoteCreate): Promise<VisitNote> {
    const payload = {
      appointment_id: Number(note.appointment_id),
      chief_complaint: note.chief_complaint || "",
      diagnosis: note.diagnosis || "",
      treatment_plan: note.treatment_plan || "",
      follow_up_date: note.follow_up_date || null,
    };

    return await apiFetch<VisitNote>("/api/records/visit-notes/save/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getVisitNotesByPatient(patientId: string): Promise<VisitNote[]> {
    return await apiFetch<VisitNote[]>(`/api/records/visit-notes/?patient_id=${patientId}`, {
      method: "GET",
    });
  }

  async getLastVisitNoteByPatient(patientId: string): Promise<VisitNote | null> {
    return await apiFetch<VisitNote | null>(`/api/records/visit-notes/last/?patient_id=${patientId}`, {
      method: "GET",
    });
  }

  async saveUpload(upload: {
    patient_id?: string;
    appointment_id?: string | null;
    file: File;
    file_type?: string;
    description?: string;
  }): Promise<Upload> {
    const form = new FormData();
    form.append("file", upload.file);
    if (upload.file_type) form.append("file_type", upload.file_type);
    if (upload.description) form.append("description", upload.description);
    if (upload.appointment_id) form.append("appointment_id", String(upload.appointment_id));
    if (upload.patient_id) form.append("patient_id", String(upload.patient_id));

    return await apiFetch<Upload>("/api/uploads/", {
      method: "POST",
      body: form,
    });
  }

  async submitContactMessage(payload: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<ContactMessage> {
    return await apiFetch<ContactMessage>("/api/contact/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  }

  async getRawData(): Promise<Record<string, any[]>> {
    return await apiFetch<Record<string, any[]>>("/api/admin/raw-data/", { method: "GET" });
  }

  // ---------- Upload comments (only if backend exists) ----------
  async listUploadComments(uploadId: string): Promise<any[]> {
    return await apiFetch<any[]>(`/api/uploads/${uploadId}/comments/`, { method: "GET" });
  }

  async addUploadComment(uploadId: string, message: string): Promise<any> {
    return await apiFetch<any>(`/api/uploads/${uploadId}/comments/`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }
}

export const dataService = new DataService();
