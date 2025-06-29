# Real Estate Portfolio Manager

## Backend

- Install dependencies:
  ```sh
  ./backend/venv/bin/pip install -r backend/requirements.txt
  ```
- Init database:
  ```sh
  ./backend/venv/bin/python backend/run.py initdb
  ```
- Run server:
  ```sh
  ./backend/venv/bin/python backend/run.py dev
  ```
- Run tests:
  ```sh
  ./backend/venv/bin/python backend/run.py test
  # If you see 'ModuleNotFoundError: No module named app', run:
  PYTHONPATH=$(pwd) ./venv/bin/python -m pytest tests/
  ```
- CORS: All origins allowed for local dev. For production, edit `backend/app.py`.

## Frontend

- Install dependencies:
  ```sh
  cd frontend && npm install
  ```
- Run frontend:
  ```sh
  npm run dev
  ```
