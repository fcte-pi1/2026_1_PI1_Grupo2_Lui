"""Sobe o ambiente do backend (FastAPI/uvicorn).
"""

import os
import subprocess
import sys

HERE = os.path.abspath(os.path.dirname(__file__))
BACKEND = os.path.normpath(os.path.join(HERE, "..", "src", "backend"))

if not os.path.isdir(BACKEND):
    print(f"[run_backend] diretorio nao encontrado: {BACKEND}", file=sys.stderr)
    sys.exit(2)

os.chdir(BACKEND)

host = os.environ.get("HOST", "127.0.0.1")
port = os.environ.get("PORT", "8000")

cmd = [sys.executable, "-m", "uvicorn", "app:app", "--host", host, "--port", port]
cmd += sys.argv[1:]  # repassa flags extras (ex.: --reload)

print(f"[run_backend] http://{host}:{port}  (cwd={BACKEND})")
sys.exit(subprocess.call(cmd))
