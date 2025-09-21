# Taskflow – Smart Task Management System  

Project Overview  
Taskflow is a **Django-based Task Management System** with **PostgreSQL (pgAdmin 4)** as the database.  
It allows users to create, update, delete, and track tasks efficiently.  
The application provides a clean and user-friendly interface to organize work and boost productivity.  

---

## Features  
- **User Authentication** –  Login, Logout  
- **Task Management** – Create, update, delete tasks  
- **Mark Status** – Mark tasks as complete/incomplete  
- **Deadlines** – Add due dates to tasks  
- **Dashboard** – Overview of all tasks in one place  
- **PostgreSQL Database** – Data stored securely with pgAdmin 4  

---

## Tech Stack  
- **Backend**: Django, Python  
- **Database**: PostgreSQL (managed with pgAdmin 4)  
- **Frontend**: Django Templates (HTML, CSS, JS)  
- **Version Control**: Git & GitHub  

---

## ⚙️ Installation & Setup  

### 1. Clone the Repository  
```bash
git clone https://Monika2623//Taskflow.git
cd Taskflow/backend
2. Create Virtual Environment
bash
Copy code
python -m venv .venv
source .venv/bin/activate    # for Linux/Mac
.venv\Scripts\activate       # for Windows
3. Install Dependencies
bash
Copy code
pip install -r requirements.txt
4. Configure PostgreSQL Database
Open pgAdmin 4

Create a new database:

Name: taskflow_db

User: postgres

Password: your_password

Update settings.py in Django with your DB credentials:

python
Copy code
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
5. Run Migrations
bash
Copy code
python manage.py migrate
6. Start Development Server
bash
Copy code
python manage.py runserver
Open your browser and visit:
👉 http://127.0.0.1:8000/ 
