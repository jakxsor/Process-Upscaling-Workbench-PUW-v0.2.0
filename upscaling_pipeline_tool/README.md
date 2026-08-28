# Process Upscaling Workbench Package

This folder contains the local Python web app used by the repository root
launcher.

## Purpose

The app supports a phenomena-based scale-up workflow from protocol text to:

- annotated blocks;
- grouped phenomena and task logic;
- quantified MFA inputs, outputs, waste, phases, and fates;
- unit-operation alternatives;
- heuristic-rule review;
- optional property-based separation screening;
- production scale-up assumptions;
- schematic Gantt bottleneck analysis with scale-behaviour evidence.

It is intended for early-stage framework support and transparent screening, not
for final equipment design.

The property-based separation screen is an optional refinement layer. The current
implementation provides a qualitative keep/weak/reject screen from entered
properties and explicitly flags missing evidence. The `Binary-ratio` mode is
reserved for a future component-level property matrix and threshold set.

## Run From Repository Root

macOS/Linux:

```bash
python3 -m pip install -r upscaling_pipeline_tool/requirements.txt
python3 start.py
```

Windows PowerShell:

```powershell
python -m pip install -r upscaling_pipeline_tool/requirements.txt
python start.py
```

or:

```powershell
py -m pip install -r upscaling_pipeline_tool/requirements.txt
py start.py
```

The launcher opens the browser automatically. If needed, open:

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
