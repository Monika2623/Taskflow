TaskFlow – Smart Task Management System

TaskFlow is a Django-based Task Management System with a React frontend and PostgreSQL (pgAdmin 4) as the database.
It allows users to create, update, delete, and track tasks efficiently. The system provides a clean and user-friendly interface to organize work, boost productivity, and manage teams.


Project Overview
TaskFlow is a full-stack task management system where users can:
Track tasks by status and deadlines
Manage tasks across teams
Get visual insights via dashboards and charts
The backend is powered by Django and PostgreSQL, and the frontend is built with React + TypeScript + Tailwind CSS.

Features
User Authentication – Login & Logout
Task Management – Create, update, delete tasks
Mark Status – Complete/incomplete tasks
Deadlines – Assign due dates
Dashboard – Overview of tasks
Team Management – Assign tasks to users and roles
Calendar & Reports – Visualize tasks & performance
Drag-and-Drop Board – Kanban style interface
PostgreSQL Database – Data stored securely

Tech Stack
Backend: Django, Python
Frontend: React, TypeScript, Tailwind CSS
Database: PostgreSQL (pgAdmin 4)
Version Control: Git & GitHub
Charts & UI: Recharts, React Beautiful DnD

Backend Setup (Django)
Run these commands from the repo root using Git Bash:
set -euo pipefail
cd "$(dirname "$0")"
cd backend
python3 -m venv .venv || py -3 -m venv .venv || python -m venv .venv
VENV_PY=".venv/Scripts/python.exe"
"$VENV_PY" -m ensurepip --upgrade
"$VENV_PY" -m pip install --upgrade pip setuptools wheel
"$VENV_PY" -m pip install -r requirements.txt
"$VENV_PY" manage.py migrate
"$VENV_PY" manage.py createsuperuser --username admin --email admin@example.com
"$VENV_PY" manage.py runserver 0.0.0.0:8000

Auth Endpoints
POST /api/token/ – { "username": "admin", "password": "..." }
POST /api/token/refresh/
API Endpoints (JWT Required)
/api/users/
/api/tasks/
/api/activities/

Frontend Setup (React)
Clone the repository:
git clone https://Monika2623//Taskflow.git
cd Taskflow/frontend


Install dependencies:
npm install


Start the development server:
npm run dev


Open your browser at: http://localhost:3000

Frontend Features
Drag-and-drop Kanban Board
Task stats with marquee effect
Team management with user roles
Calendar and reports with dynamic charts
Static JSON data is used for sample tasks, users, and activities. It’s easy to replace JSON with real API calls later.

Database Setup (PostgreSQL / pgAdmin 4)
Open pgAdmin 4 and create a new database:
Name: taskflow_db
User: postgres
Password: your_password

Update Django settings.py with your DB credentials:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'taskflow_db',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}


Run migrations:
python manage.py migrate


Start the development server:
python manage.py runserver

Open your browser and visit:
👉 http://127.0.0.1:8000/ 
