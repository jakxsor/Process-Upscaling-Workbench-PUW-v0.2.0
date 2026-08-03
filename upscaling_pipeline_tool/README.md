# Upscaling Pipeline Tool Package

This folder contains the local Python web app used by the repository root
launcher.

## Purpose

The app supports a phenomena-based scale-up workflow from protocol text to:

- annotated blocks;
- grouped phenomena and task logic;
- quantified MFA inputs, outputs, waste, phases, and fates;
- unit-operation alternatives;
- heuristic-rule review;
- property-based separation screening;
- production scale-up assumptions;
- schematic Gantt bottleneck analysis with scale-behaviour evidence.

It is intended for early-stage framework support and transparent screening, not
for final equipment design.

## Run From Repository Root

macOS/Linux:

```bash
python3 run_upscaling_tool.py --port 8787
```

Windows PowerShell:

```powershell
python run_upscaling_tool.py --port 8787
```

or:

```powershell
py run_upscaling_tool.py --port 8787
```

Then open:

```text
http://127.0.0.1:8787
```

## Files

```text
app.py            HTTP server and HTML shell
static/app.js     Client-side tool logic
static/style.css  UI styling
workshop.md       Workshop notes
```

The tool uses only the Python standard library. No package installation is
required for normal local use.
