# Hospital Information System — Ophthalmology Department

A web-based **Hospital Information System** designed for an ophthalmology department, supporting patient registration, doctor workflows, appointment management, visit notes, file uploads, contact messages, and administrative dashboard monitoring.

The project focuses on applying healthcare software concepts to a realistic department-level workflow using a modern React-based frontend connected to REST API endpoints.

---

## Overview

This project simulates a digital healthcare system for an ophthalmology department.

The system supports multiple user roles, including **Admin**, **Doctor**, and **Patient**, and provides role-based access to healthcare workflows such as appointments, patient records, visit notes, medical uploads, and dashboard statistics.

The goal of the project was to understand how healthcare data can be organized inside a software system and how different users interact with a hospital information workflow.

---

## Key Features

- User authentication and registration
- Role-based system access
  - Admin
  - Doctor
  - Patient
- Ophthalmology department dashboard
- Appointment booking and status management
- Patient profile management
- Doctor profile management
- Visit note creation and patient history lookup
- Medical file upload support
- Contact message submission
- Admin/raw database view
- Dashboard statistics
- Responsive React-based user interface

---

## My Role

I contributed to the development of the healthcare workflow and software structure.

My responsibilities included:

- Designing and implementing parts of the patient workflow
- Supporting frontend interface development
- Working on healthcare data models and system logic
- Connecting UI actions with API service functions
- Helping organize appointment, patient, doctor, and visit-note flows
- Testing user interactions across different roles
- Contributing to the project as a healthcare software system prototype

---

## User Roles

| Role | Main Capabilities |
|---|---|
| Admin | View system dashboard, monitor records, access database/system data |
| Doctor | View appointments, manage patient interactions, save visit notes |
| Patient | Register, book appointments, view related interactions, submit contact messages |

---

## Core Modules

### Dashboard

Displays key department statistics such as:

- Today’s appointments
- Active doctors
- Registered patients
- Pending messages

### Appointments

Supports appointment booking and appointment status updates, including:

- Pending
- Confirmed
- Completed
- Cancelled

### Patient and Doctor Profiles

Stores structured profile data for patients and doctors, including names, contact details, specialization, and clinic information.

### Visit Notes

Supports clinical visit documentation, including:

- Chief complaint
- Diagnosis
- Treatment plan
- Follow-up date

### Uploads

Supports medical-related file uploads linked to patients or appointments.

Supported file types may include:

- Images
- PDFs
- DICOM files
- Other medical documents

### Contact Messages

Allows users or visitors to submit messages through a public contact workflow.

---

## Tech Stack

| Category | Tools / Technologies |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| UI / Visualization | Recharts |
| API Integration | REST API |
| Authentication Flow | Access and refresh token handling |
| Data Handling | TypeScript interfaces and service layer |
| Development Tools | Git, VS Code |

---

## System Workflow

```text
User Login / Registration
        ↓
Role Detection
        ↓
Role-Based Interface
        ↓
Dashboard / Appointments / Patients / Visit Notes / Messages
        ↓
REST API Service Layer
        ↓
Backend Endpoints and Database Records
        ↓
Updated Healthcare Workflow Data
```

---

## Data Models

The system uses structured data models for:

- User accounts
- Doctor profiles
- Patient profiles
- Appointments
- Visit notes
- Medical uploads
- Contact messages
- Dashboard statistics

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/AliIbrahim174/hospital-information-system-ophthalmology.git
cd hospital-information-system-ophthalmology
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure API base URL

Create or update your environment configuration according to the backend API location.

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

### 4. Run the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview production build

```bash
npm run preview
```

---

## Project Structure

Update this section according to the final repository structure.

Recommended structure:

```text
hospital-information-system-ophthalmology/
  README.md
  App.tsx
  types.ts
  package.json
  components/
    Dashboard.tsx
    Sidebar.tsx
    Login.tsx
    Register.tsx
    AppointmentsPage.tsx
    VisitNotesPage.tsx
    DatabaseView.tsx
    Home.tsx
  services/
    dataService.ts
```

---

## Course / Project Context

This project was developed as a healthcare software project focused on understanding how hospital information systems organize medical workflows, patient data, appointments, clinical notes, and administrative views.

The ophthalmology department was used as the main clinical context for the system.

---

## Learning Outcomes

This project strengthened my understanding of:

- Healthcare information systems
- Role-based healthcare workflows
- Frontend development with React and TypeScript
- REST API integration
- Authentication and token handling
- Appointment and patient data modeling
- Digital health system design
- Translating healthcare requirements into software modules

---

## Future Improvements

- Improve UI/UX design consistency
- Add stronger form validation
- Add complete backend documentation
- Add database schema diagrams
- Add role-based permission documentation
- Add test cases for major workflows
- Add deployment guide
- Improve medical file viewer support
- Add audit logs for healthcare actions

---

## License

This repository is currently shared for academic and portfolio purposes.

If this project is extended for public reuse, a formal open-source license such as MIT or BSD-3-Clause should be added.
