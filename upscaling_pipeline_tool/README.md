# Process Upscaling Workbench Package

This folder contains the local Python web app used by the repository root
launcher.

## Purpose

The app supports a phenomena-based scale-up workflow from protocol text to:

- annotated blocks;
- grouped phenomena and task logic;
- quantified MFA inputs and outlets, including products, intermediates, waste,
  emissions, recoveries, and recycle candidates;
- unit-operation alternatives;
- heuristic-rule review;
- optional Lutze-inspired post-reaction separation pathway screening;
- production scale-up assumptions;
- schematic Gantt bottleneck analysis with scale-behaviour evidence.

It is intended as a paper-companion implementation for early-stage framework
support and transparent screening, not for final equipment design.

The separation simulator is an optional refinement layer. It reads substances
from the task MFA/conversion balance, compares active components pairwise, ranks
binary separation priorities, and lets the user draft a separation pathway before
applying it to the main flowsheet. It explicitly flags missing property evidence
and should not be treated as rigorous thermodynamic or equipment design.

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

For headless runs:

```bash
python3 start.py --no-browser
```

## Validation

From the repository root:

```bash
node --check upscaling_pipeline_tool/static/app.js
node scripts/check_complete_separation_flow.js
node scripts/check_separation_simulator.js
python3 -m py_compile start.py run_upscaling_tool.py upscaling_pipeline_tool/app.py
```

The broader validation commands are listed in the root `README.md`.

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
