#!/usr/bin/env python3
"""
Development script for the real estate portfolio manager backend.
Usage: python run.py <command>

Commands:
    dev         - Start development server
    test        - Run all tests
    help        - Show this help message
"""

import sys
import subprocess
import os
from app import create_app, db

# Helper to get venv bin path
VENV_BIN = os.path.join(os.path.dirname(__file__), 'venv', 'bin')
PYTHON_BIN = os.path.join(VENV_BIN, 'python')
ALEMBIC_BIN = os.path.join(VENV_BIN, 'alembic')

os.environ.setdefault("FRONTEND_URL", "http://localhost")

def run_tests():
    """Run all tests."""
    print("🧪 Running tests...")
    try:
        subprocess.run([PYTHON_BIN, "-m", "pytest", "tests/", "-v"], check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def start_dev_server():
    """Start development server."""
    print("🚀 Starting development server...")
    print("📝 Server will be available at: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop")

    try:
        subprocess.run([PYTHON_BIN, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Development server stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        return False
    return True

def show_help():
    """Show help message."""
    print(__doc__)

def run_migrate():
    """Autogenerate a new Alembic migration."""
    print("📦 Generating new Alembic migration...")
    try:
        subprocess.run([ALEMBIC_BIN, "revision", "--autogenerate", "-m", "'Auto migration'"], check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def run_upgrade():
    """Apply all Alembic migrations (upgrade to head)."""
    print("⬆️  Applying Alembic migrations (upgrade head)...")
    try:
        subprocess.run([ALEMBIC_BIN, "upgrade", "head"], check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def run_downgrade():
    """Revert the last Alembic migration (downgrade -1)."""
    print("⬇️  Reverting last Alembic migration (downgrade -1)...")
    try:
        subprocess.run([ALEMBIC_BIN, "downgrade", "-1"], check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def init_db():
    """Initialize the database tables."""
    print("🗄️  Initializing database tables...")
    app = create_app()
    with app.app_context():
        db.create_all()
    print("✅ Database initialized!")
    return True

def main():
    if len(sys.argv) != 2:
        print("❌ Usage: python run.py <command>")
        print("Use 'python run.py help' to see available commands")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "dev":
        success = start_dev_server()
    elif command == "test":
        success = run_tests()
    elif command == "migrate":
        success = run_migrate()
    elif command == "upgrade":
        success = run_upgrade()
    elif command == "downgrade":
        success = run_downgrade()
    elif command == "initdb":
        success = init_db()
    elif command == "help":
        show_help()
        success = True
    else:
        print(f"❌ Unknown command: {command}")
        print("Use 'python run.py help' to see available commands")
        sys.exit(1)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 