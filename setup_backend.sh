#!/usr/bin/env bash
set -euo pipefail

# Run from repo root
cd "$(dirname "$0")"

mkdir -p backend
cd backend

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v py >/dev/null 2>&1; then
  PY="py -3"
else
  PY=python
fi

echo "Using Python: $PY"
$PY -m venv .venv

VENV_PY=".venv/Scripts/python.exe"
"$VENV_PY" -m ensurepip --upgrade
"$VENV_PY" -m pip install --upgrade pip setuptools wheel
"$VENV_PY" -m pip install django djangorestframework django-cors-headers djangorestframework-simplejwt

"$VENV_PY" -m django startproject config .
"$VENV_PY" manage.py startapp core

echo "Django project created at $(pwd)"


