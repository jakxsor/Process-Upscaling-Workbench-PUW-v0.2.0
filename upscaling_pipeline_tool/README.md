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
python3 -m pip install -r upscaling_pipeline_tool/requirements.txt
python3 run_upscaling_tool.py --port 8787
```

Windows PowerShell:

```powershell
python -m pip install -r upscaling_pipeline_tool/requirements.txt
python run_upscaling_tool.py --port 8787
```

or:

```powershell
py -m pip install -r upscaling_pipeline_tool/requirements.txt
py run_upscaling_tool.py --port 8787
```

Then open:

```text
http://127.0.0.1:8787
```

## Files

```text
app.py            HTTP server and HTML shell
pyflowsheet_renderer.py  Legacy optional renderer endpoint
static/app.js     Client-side tool logic
static/style.css  UI styling
workshop.md       Workshop notes
```

The user-facing Flowsheet View uses the built-in editable SVG renderer. The
`pyflowsheet` endpoint is retained only as a legacy experiment and is not shown
as a main UI mode.
