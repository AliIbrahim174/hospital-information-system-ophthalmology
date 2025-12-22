export type UserRole = 'Admin' | 'Doctor' | 'Patient';

export interface UserAccount {
  user_id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export interface DoctorProfile {
  doctor_id: number;   // this is the UserAccount.id (PK/FK via OneToOne)
  full_name: string;
  phone: string;
  clinic_room: string;
  specialization: string;
}


export interface PatientProfile {
  patient_id: string; // FK to User.user_id
  full_name: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  phone: string;
}

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string; // ISO datetime
  status: AppointmentStatus;
  reason: string;
  // Hydrated fields for UI convenience
  patientName?: string;
  doctorName?: string;
}

export interface VisitNote {
  visit_id: string;
  appointment_id: string;
  patient_id: string; // Added for robust history lookup
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  follow_up_date?: string;
}

export interface Upload {
  upload_id: string;
  patient_id: string;
  appointment_id?: string;
  file_path: string;
  file_type: 'Image' | 'PDF' | 'DICOM' | string;
  uploaded_at: string;
  description: string;
}

export interface ContactMessage {
  message_id: string;
  user_id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'New' | 'Read' | 'Replied';
}

export interface DashboardStats {
  totalAppointmentsToday: number;
  activeDoctors: number;
  patientsRegistered: number;
  pendingMessages: number;
}

export type VisitNoteCreate = {
  appointment_id: number;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  follow_up_date?: string | null;
};

export interface UploadComment {
  reply_id: number;
  upload_id: number;
  created_by_id: number;
  created_by_email: string;
  created_by_role: string;
  message: string;
  created_at: string;
}
