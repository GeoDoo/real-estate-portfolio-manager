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

def run_tests():
    """Run all tests."""
    print("🧪 Running tests...")
    try:
        subprocess.run(["python", "-m", "pytest", "tests/", "-v"], check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def start_dev_server():
    """Start development server."""
    print("🚀 Starting development server...")
    print("📝 Server will be available at: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop")
    
    try:
        subprocess.run(["python", "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Development server stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        return False
    return True

def show_help():
    """Show help message."""
    print(__doc__)

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