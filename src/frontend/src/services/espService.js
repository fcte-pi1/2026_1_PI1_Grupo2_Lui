const API_BASE = 'http://localhost:8000';


export async function sendConnectCommand() {
  const response = await fetch(`${API_BASE}/esp/conectar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'connect',
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${response.status}`);
  }

  return response.json();
}
