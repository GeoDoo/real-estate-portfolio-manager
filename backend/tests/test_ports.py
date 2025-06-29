import os
import re
import pytest

# Allow these files/lines to contain port numbers (config, env, comments)
ALLOWED_PATTERNS = [
    re.compile(r'os\.environ\.get\("FRONTEND_URL"'),
    re.compile(r'os\.environ\.get\("BACKEND_PORT"'),
    re.compile(r'FRONTEND_URL\s*=.*'),
    re.compile(r'BACKEND_PORT\s*=.*'),
    re.compile(r'#'),  # allow comments
]

FORBIDDEN_PATTERNS = [
    re.compile(r'localhost:3000'),
    re.compile(r'localhost:5050'),
    re.compile(r'(?<![A-Za-z])3000(?![A-Za-z0-9])'),
    re.compile(r'(?<![A-Za-z])5050(?![A-Za-z0-9])'),
]

def is_allowed(line):
    return any(p.search(line) for p in ALLOWED_PATTERNS)

def test_no_hardcoded_ports():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for root, _, files in os.walk(backend_dir):
        # Skip venv, site-packages, dist-packages, and hidden directories
        if any(skip in root for skip in ["/venv", "site-packages", "dist-packages", "/.venv", "__pypackages__"]):
            continue
        for fname in files:
            if fname.endswith('.py') and fname != os.path.basename(__file__):
                path = os.path.join(root, fname)
                with open(path, encoding='utf-8') as f:
                    for lineno, line in enumerate(f, 1):
                        if is_allowed(line):
                            continue
                        for pattern in FORBIDDEN_PATTERNS:
                            if pattern.search(line):
                                pytest.fail(f"Hardcoded port found in {path}:{lineno}: {line.strip()}") 