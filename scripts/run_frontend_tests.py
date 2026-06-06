import os
import shutil
import subprocess
import sys

HERE = os.path.abspath(os.path.dirname(__file__))
FRONTEND = os.path.normpath(os.path.join(HERE, "..", "src", "frontend"))

if not os.path.isdir(FRONTEND):
    print(f"[run_frontend_tests] diretório não encontrado: {FRONTEND}", file=sys.stderr)
    sys.exit(2)

script = sys.argv[1] if len(sys.argv) > 1 else "test:unit"

# Em Windows, npm é npm.cmd; shutil.which encontra o executável correto.
npm = shutil.which("npm") or shutil.which("npm.cmd")
if not npm:
    print("[run_frontend_tests] 'npm' não encontrado no PATH.", file=sys.stderr)
    sys.exit(3)

os.chdir(FRONTEND)
# shell=True só no Windows porque npm é um .cmd e precisa do interpretador.
sys.exit(subprocess.call([npm, "run", script], shell=(os.name == "nt")))
