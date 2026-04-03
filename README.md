# Job Tracker

Job Tracker is a full-stack web application designed to help users manage and track their job search process efficiently. It provides features for searching jobs, tracking applications, and monitoring application statuses, all in one place.

## Purpose

- **Centralized Job Search Management:** Organize all your job applications, and job search activities in a single platform.
- **Application Tracking:** Keep track of jobs you've applied to, their statuses, and history.
- **User Authentication:** Register, log in, and manage your profile securely.

## Project Structure

- **backend/**: Node.js/Express REST API for authentication, job management, application tracking, and file uploads.
- **frontend/**: React + TypeScript single-page application for the user interface.

## How to Use

### Prerequisites

- Node.js and npm installed
- (Optional) XAMPP for local database management
- PostgreSQL (if using the provided db.sql)

### 1. Clone the Repository

```
git clone https://github.com/rcalday/job_tracker.git
cd job_tracker
```

### 2. Backend Setup

```
cd backend
npm install
```

- Configure your database connection in `db.js` as needed.
- Start the backend server:

```
node app.js
```

### 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

- The frontend will be available at `http://localhost:5173` (or as shown in your terminal).

### 4. Usage

- Register a new account or log in.
- Search for jobs, add applications, and track their status.
- View your dashboard for an overview of your job search progress.

## Deployment

- The project includes a `vercel.json` for deploying the frontend to Vercel.
- Backend can be deployed to any Node.js-compatible server.

## License

This project is for personal and educational use. Modify and extend as needed for your own job search management.
