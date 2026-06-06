#!/usr/bin/env python3
"""
fake_robot.py — Simulador de firmware para o pipeline de telemetria.

Envia POST /telemetria conforme src/contrato_telemetria.md, a 1 Hz,
percorrendo um caminho determinístico no labirinto 4x4/8x8/16x16 e
encerrando com race_status=finished + event=race_ended (ou error com --fail).
"""

from __future__ import annotations
import argparse
import random
import sys
import time
from datetime import datetime, timezone
from typing import List, Tuple
import requests

CELL_SIZE_MM = 180.0
GRAVIDADE_MS2 = 9.81
DEFAULT_URL = "http://localhost:8000/telemetria"


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def gerar_caminho_spiral(size: int) -> List[Tuple[int, int]]:
    path: List[Tuple[int, int]] = []
    goal_x, goal_y = size // 2 - 1, size // 2 - 1
    x, y = 0, size - 1
    path.append((x, y))
    while y > goal_y:
        y -= 1
        path.append((x, y))
    while x < goal_x:
        x += 1
        path.append((x, y))
    return path


def cell_to_mm(cell_x: int, cell_y: int) -> Tuple[float, float]:
    return (cell_x + 0.5) * CELL_SIZE_MM, (cell_y + 0.5) * CELL_SIZE_MM


def construir_known_walls(size: int, path_cells: List[Tuple[int, int]]) -> List[List[List[bool]]]:
    """Matriz walls[x][y] = [N,E,S,W]. Perímetro = True; passagens livres = False."""
    walls = [[[False] * 4 for _ in range(size)] for _ in range(size)]
    visited = set(path_cells)
    for x in range(size):
        for y in range(size):
            if y == 0:        walls[x][y][0] = True
            if x == size - 1: walls[x][y][1] = True
            if y == size - 1: walls[x][y][2] = True
            if x == 0:        walls[x][y][3] = True
    dx = [0, 1, 0, -1]
    dy = [-1, 0, 1, 0]
    aberto = set()
    for i in range(1, len(path_cells)):
        a, b = path_cells[i - 1], path_cells[i]
        aberto.add((a, b))
        aberto.add((b, a))
    for (cx, cy) in visited:
        for d in range(4):
            nx, ny = cx + dx[d], cy + dy[d]
            if nx < 0 or nx >= size or ny < 0 or ny >= size:
                continue
            if ((cx, cy), (nx, ny)) not in aberto:
                walls[cx][cy][d] = True
    return walls


def montar_pacote_running(robot_id, maze_type, path_cells, elapsed_ms,
                          bateria_v, velocidade_mm_s, orientation_deg) -> dict:
    path = []
    for cx, cy in path_cells:
        x_mm, y_mm = cell_to_mm(cx, cy)
        path.append({
            "x": round(x_mm, 1),
            "y": round(y_mm, 1),
            "z": round(GRAVIDADE_MS2 + random.uniform(-0.05, 0.05), 2),
        })
    cx, cy = path_cells[-1]
    x_mm, y_mm = cell_to_mm(cx, cy)
    return {
        "robot_id": robot_id,
        "timestamp": iso_now(),
        "maze_type": maze_type,
        "current_position": {
            "x": round(x_mm, 1), "y": round(y_mm, 1),
            "z": round(GRAVIDADE_MS2 + random.uniform(-0.05, 0.05), 2),
            "orientation": orientation_deg,
        },
        "path_traversed": path,
        "battery_voltage_v": round(bateria_v, 2),
        "speed_mm_s": round(velocidade_mm_s, 1),
        "elapsed_time_ms": elapsed_ms,
        "race_status": "running",
    }


def montar_pacote_finished(base, elapsed_ms, bateria_v, objetivo_cell, size, path_cells) -> dict:
    pacote = {
        **base,
        "timestamp": iso_now(),
        "speed_mm_s": 0.0,
        "elapsed_time_ms": elapsed_ms,
        "battery_voltage_v": round(bateria_v, 2),
        "race_status": "finished",
        "event": "race_ended",
        "message": "Corrida finalizada com sucesso!",
        "known_walls": construir_known_walls(size, path_cells),
    }
    ox, oy = cell_to_mm(*objetivo_cell)
    pacote["objective_location"] = {"x": round(ox, 1), "y": round(oy, 1), "z": GRAVIDADE_MS2}
    return pacote


def montar_pacote_error(base, elapsed_ms, bateria_v, motivo) -> dict:
    return {
        **base,
        "timestamp": iso_now(),
        "speed_mm_s": 0.0,
        "elapsed_time_ms": elapsed_ms,
        "battery_voltage_v": round(bateria_v, 2),
        "race_status": "error",
        "event": "error_occurred",
        "message": motivo,
    }


def post(url, payload):
    try:
        r = requests.post(url, json=payload, timeout=2.0)
        if r.status_code != 200:
            print(f"  [WARN] backend respondeu {r.status_code}: {r.text[:120]}")
    except requests.RequestException as exc:
        print(f"  [ERR] falha ao enviar pacote: {exc}", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser(description="Simula um micromouse enviando telemetria.")
    ap.add_argument("--maze", choices=["4x4", "8x8", "16x16"], default="4x4")
    ap.add_argument("--robot-id", default="micromouse_01")
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--interval", type=float, default=1.0)
    ap.add_argument("--bateria-inicial", type=float, default=8.0)
    ap.add_argument("--bateria-final", type=float, default=7.1)
    ap.add_argument("--fail", action="store_true", help="Termina com race_status=error (CT-21)")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)
    size = int(args.maze.split("x")[0])
    caminho = gerar_caminho_spiral(size)
    objetivo = caminho[-1]
    total = len(caminho)

    print(f"-> Robo {args.robot_id} | labirinto {args.maze} | {total} celulas")
    print(f"-> URL: {args.url}  intervalo: {args.interval}s")
    if args.fail:
        print("-> Modo FAIL: enviara pacote de erro ao final (nada deve ser persistido).")

    inicio = time.time()
    pacote_base = None

    for i, _ in enumerate(caminho, start=1):
        elapsed_ms = int((time.time() - inicio) * 1000)
        progresso = i / total
        bateria_v = args.bateria_inicial + (args.bateria_final - args.bateria_inicial) * progresso
        velocidade = 0.0 if i == total else 120.0 + random.uniform(-15, 15)
        orientacao = 90.0 if i == 1 else 0.0
        pacote = montar_pacote_running(
            robot_id=args.robot_id, maze_type=args.maze,
            path_cells=caminho[:i], elapsed_ms=elapsed_ms,
            bateria_v=bateria_v, velocidade_mm_s=velocidade, orientation_deg=orientacao,
        )
        pacote_base = pacote
        print(f"  [{i:>3}/{total}] running pos={caminho[i-1]} v={velocidade:.0f}mm/s bat={bateria_v:.2f}V")
        post(args.url, pacote)
        if i < total:
            time.sleep(args.interval)

    elapsed_final = int((time.time() - inicio) * 1000)
    if args.fail:
        err = montar_pacote_error(pacote_base, elapsed_final, args.bateria_final, "Sensor frontal travado")
        print("\n-> Enviando pacote ERROR (buffer deve ser descartado, nada persiste)")
        post(args.url, err)
    else:
        fim = montar_pacote_finished(pacote_base, elapsed_final, args.bateria_final, objetivo, size, caminho)
        fim["success"] = True
        print(f"\n-> Enviando pacote FINISHED com known_walls ({size}x{size}) - dispara persistencia")
        post(args.url, fim)

    print("Sessao encerrada.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
