### Backend setup (Git Bash)

Run these commands from the repo root using Git Bash:

```bash
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
```

Auth endpoints:
- `POST /api/token/` with `{ "username": "admin", "password": "..." }`
- `POST /api/token/refresh/`

API endpoints (JWT required):
- `/api/users/`
- `/api/tasks/`
- `/api/activities/`


