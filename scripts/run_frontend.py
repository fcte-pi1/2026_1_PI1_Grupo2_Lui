"""Sobe o ambiente de desenvolvimento do frontend (Create React App).
"""

import os
import shutil
import subprocess
import sys

HERE = os.path.abspath(os.path.dirname(__file__))
FRONTEND = os.path.normpath(os.path.join(HERE, "..", "src", "frontend"))

if not os.path.isdir(FRONTEND):
    print(f"[run_frontend] diretorio nao encontrado: {FRONTEND}", file=sys.stderr)
    sys.exit(2)

script = sys.argv[1] if len(sys.argv) > 1 else "start"

# Em Windows, npm e' npm.cmd; shutil.which encontra o executavel correto.
npm = shutil.which("npm") or shutil.which("npm.cmd")
if not npm:
    print("[run_frontend] 'npm' nao encontrado no PATH.", file=sys.stderr)
    sys.exit(3)

os.chdir(FRONTEND)
print(f"[run_frontend] npm run {script}  (cwd={FRONTEND})")
# shell=True so' no Windows porque npm e' um .cmd e precisa do interpretador.
sys.exit(subprocess.call([npm, "run", script], shell=(os.name == "nt")))
