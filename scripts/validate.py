#!/usr/bin/env python3
"""Run the local validation suite with the right project interpreter."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

JS_SYNTAX_FILES = sorted((ROOT / "upscaling_pipeline_tool" / "static").glob("*.js"))
PY_SYNTAX_FILES = [
    ROOT / "start.py",
    ROOT / "run_upscaling_tool.py",
    *sorted((ROOT / "upscaling_pipeline_tool").glob("*.py")),
]
NODE_CHECKS = [
    "scripts/check_complete_separation_flow.js",
    "scripts/check_separation_simulator.js",
    "scripts/check_property_screening.js",
    "scripts/check_flowsheet_view.js",
    "scripts/check_project_persistence.js",
    "scripts/check_tutorial_flow.js",
    "scripts/check_physical_plausibility.js",
    "scripts/check_ui_wiring.js",
]
OPTIONAL_NODE_CHECKS = [
    "scripts/check_browser_smoke.js",
]
PYTHON_CHECKS = [
    "scripts/check_lci_xlsx_export.py",
    "scripts/check_flowsheet_pptx_export.py",
    "scripts/check_pubchem_lookup.py",
    "scripts/check_server_payload.py",
]


def project_python() -> str:
    """Prefer the local virtual environment so optional export deps are available."""
    candidates = [
        ROOT / ".venv" / "bin" / "python",
        ROOT / ".venv" / "Scripts" / "python.exe",
        ROOT / ".venv311" / "bin" / "python",
        ROOT / ".venv311" / "Scripts" / "python.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return sys.executable


def run(label: str, command: list[str]) -> None:
    print(f"\n==> {label}", flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    py = project_python()
    try:
        for path in JS_SYNTAX_FILES:
            run(f"JavaScript syntax: {path.relative_to(ROOT)}", ["node", "--check", str(path)])

        run("Python syntax", [py, "-m", "py_compile", *map(str, PY_SYNTAX_FILES)])

        for check in NODE_CHECKS:
            run(check, ["node", check])

        for check in OPTIONAL_NODE_CHECKS:
            run(f"{check} (optional browser smoke)", ["node", check])

        for check in PYTHON_CHECKS:
            run(check, [py, check])
    except FileNotFoundError as exc:
        missing = exc.filename or str(exc)
        print(f"\nValidation could not start because `{missing}` was not found.", file=sys.stderr)
        if missing == "node":
            print("Install Node.js 22 or newer, then run this command again.", file=sys.stderr)
        return 127
    except subprocess.CalledProcessError as exc:
        return int(exc.returncode)

    print("\nValidation suite passed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
