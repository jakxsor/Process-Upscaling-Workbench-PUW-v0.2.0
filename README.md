# Process Upscaling Workbench

[![Validation](https://github.com/jakxsor/upscaling-pipeline-tool/actions/workflows/validation.yml/badge.svg)](https://github.com/jakxsor/upscaling-pipeline-tool/actions/workflows/validation.yml)

A local browser-based implementation of a phenomena-based scale-up workflow for
translating laboratory synthesis protocols into traceable process blocks, task
groups, material-flow assumptions, unit-operation candidates, and preliminary
scale-up checks.

## About This Repository

This repository implements the phenomena-based upscaling framework described
in:

> Majo, M., Sorani, J., Nowack, B., Hischier, R. "Generalized Scale-Up
> Methodology for Chemicals and Materials in Prospective LCA." [journal,
> publication details to be added]

The built-in octocrylene example reproduces the case study in Section 3 and
the Supplementary Information of that paper (nine unit operations, three
recycle loops, ~15 m³ reactor, 750 t/yr target).

If you use this tool in your work, please cite the paper above.

The tool is designed to support a phenomena-based upscaling framework. It helps
the user move from free text to blocks, phenomena, task groups, unit-operation
alternatives, material-flow assumptions, heuristic checks, preliminary scale-up,
and schematic Gantt bottleneck review.

It is not a final equipment design tool. It performs deterministic calculations
where the inputs are available, and otherwise reports missing data, assumptions,
and low-confidence scale-up risks.

## What It Does

- Create annotated protocol blocks from selected text.
- Assign behaviour presets and phenomena to each block.
- Add quantified MFA streams: inputs and outlets, including products,
  intermediate streams, waste, emissions, recoveries, and recycle candidates.
- Combine blocks into task groups while preserving block-level information.
- Aggregate group-level MFA and operating conditions.
- Use phase categories to avoid incompatible phenomenon/unit-operation choices.
- Suggest industrial unit-operation alternatives from grouped phenomena.
- Show heuristic-rule checks before numerical scale-up.
- Add optional property refinement only when it helps separation, energy, mixing,
  sizing, or ambiguous alternatives.
- Run an optional Lutze-inspired post-reaction separation sandbox using
  pairwise substance comparisons, property evidence, and phase compatibility.
- Define a scale-up basis: target product, production target, yield, recovery,
  design margin, OEE, operating schedule, and parallel units.
- Scale MFA quantities to batch, hourly, and annual views.
- Build a schematic Gantt chart and identify bottlenecks.
- Show a Gantt evidence layer with operation class, expected scale behaviour,
  missing data, schedule margin, and compact references.
- Optionally run an external OpenAI-compatible process review using a temporary
  API key or server-side `OPENAI_API_KEY`.

## Reliability Level

The current version is suitable for:

- reproducible early-stage screening;
- framework demonstration;
- identifying missing data before scale-up;
- comparing task grouping and unit-operation alternatives;
- producing a transparent scaled MFA skeleton;
- finding schematic bottlenecks from declared or extracted task durations.

The current version is not intended to:

- replace reactor, filter, dryer, distillation, or heat-exchanger design;
- automatically convert lab durations into validated industrial durations;
- infer physical properties or kinetic data without user-provided evidence;
- claim a fully optimized separation train from limited property data;
- apply proposed AI changes automatically.

## Methodological Scope

The software is intended as a paper-companion and screening implementation. It
keeps assumptions visible and separates entered, calculated, estimated, and
assumed values. The output should be interpreted as a traceable scale-up
proposal, not as validated process design.

The unit-operation suggestion layer is deterministic. It uses the task class,
MFA role/phase context, operating conditions, and optional Lutze-style
separation evidence when available. Suggestions are gated until the task has
enough material streams, phase labels, and conditions to make the choice
auditable.

The Lutze Reaction-Separation sandbox is optional. It compares active
post-reaction substances pairwise and proposes draft separation moves from
property contrasts and phase compatibility. The main flowchart is unchanged
until the user explicitly applies a selected pathway. The sandbox does not
perform rigorous thermodynamic modelling, equipment sizing, or economic
optimization.

For scheduling, the tool uses:

```text
adjusted duration = input duration x (1 + Gantt margin %)
effective duration = adjusted duration / parallel units
bottleneck = task with the largest effective duration
cycle time = sum of non-overlapping effective durations
```

For campaign scheduling, the UI also shows an overlapped scenario:

```text
plant cycle time = max(task effective duration)
overlapped batches/year = 8760 x OEE / plant cycle time
```

The overlapped scenario is an upper-throughput screening case. It assumes that
equipment, buffers, cleaning, operators, and material stability allow staggered
batches.

If operation-specific data are missing, the Gantt keeps the input duration and
reports the missing data needed for quantitative correction.

## Requirements

- Python 3.9 or newer is recommended.
- Python packages listed in `upscaling_pipeline_tool/requirements.txt`.
- A modern browser.

The Flowsheet View uses the built-in editable SVG renderer. A legacy
`pyflowsheet` endpoint is still present for experimentation, but it is not the
main user-facing view.

## Quick Start

From the repository root:

```bash
python3 -m pip install -r upscaling_pipeline_tool/requirements.txt
python3 start.py
```

The launcher opens the browser automatically. If it does not, open:

```text
http://127.0.0.1:8787
```

You can still choose a specific port manually:

```bash
python3 start.py --port 8787
```

For headless or remote checks:

```bash
python3 start.py --no-browser
```

## Windows Instructions

1. Install Python from:

```text
https://www.python.org/downloads/windows/
```

During installation, enable:

```text
Add Python to PATH
```

2. Download this repository:

```text
Code -> Download ZIP
```

Then extract the ZIP.

3. Open PowerShell in the extracted folder, where `run_upscaling_tool.py` is
located.

4. Run:

```powershell
python -m pip install -r upscaling_pipeline_tool/requirements.txt
python start.py
```

If `python` is not recognized, use:

```powershell
py -m pip install -r upscaling_pipeline_tool/requirements.txt
py start.py
```

5. Open the browser at:

```text
http://127.0.0.1:8787
```

## Optional AI Review

The app works without an API key.

For the external process review, either paste a temporary key in the popup or
start the server with an environment variable.

macOS/Linux:

```bash
export OPENAI_API_KEY="your_key_here"
python3 run_upscaling_tool.py --port 8787
```

Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your_key_here"
python run_upscaling_tool.py --port 8787
```

Do not commit API keys to the repository.

## Workflow

1. Paste or load the source protocol.
2. Select text and create blocks.
3. Assign behaviour presets, phenomena, phases, conditions, and MFA streams.
4. Combine related blocks into task groups.
5. Choose unit-operation alternatives and record the selection basis.
6. Run heuristic checks and optional Lutze separation screening where useful.
7. Define the scale-up basis and review scaled MFA results.
8. Use the Gantt panel to inspect cycle time, bottlenecks, schedule margin, and
   missing operation-specific scale-up data.
9. Export JSON for traceability or downstream analysis.

## Validation Checks

The repository includes lightweight regression checks for the current
paper-support workflow. They can be run from the repository root without a
Node package install:

```bash
node --check upscaling_pipeline_tool/static/app.js
node --check upscaling_pipeline_tool/static/flowsheet.js
node scripts/check_complete_separation_flow.js
node scripts/check_separation_simulator.js
node scripts/check_property_screening.js
node scripts/check_flowsheet_view.js
python3 -m py_compile start.py run_upscaling_tool.py upscaling_pipeline_tool/app.py upscaling_pipeline_tool/pyflowsheet_renderer.py
```

These checks cover the built-in example, conversion balance propagation,
Lutze-style pathway generation, binary-pair ranking, applied separation route
insertion, and flowsheet rendering. They are regression checks for the software
workflow, not experimental validation of the chemical process.

## Built-In Example

The app includes an octocrylene benchmark case that can be loaded from the UI.
It demonstrates:

- grouped reaction and work-up operations;
- cyclohexane recovery/recycle;
- reaction conversion balance with product, byproduct, and unreacted reagent
  streams;
- optional post-reaction Lutze pathway screening;
- scaled MFA from a lab basis to annual production;
- heuristic review;
- scale-up/Gantt bottleneck screening.

Pre-filled values are a mix of paper/case-study values and labelled engineering
screening assumptions. They should be reviewed before using exported results in
new studies.

## Data Sources

The optional pure-component property lookup (compound search/autocomplete and
property prefill) queries the [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
PUG-REST/PUG-View API live, per compound, on user request. PubChem is
maintained by the National Library of Medicine (NLM), part of the US National
Institutes of Health (NIH). Data returned is shown with its PubChem CID and a
link back to the source record; nothing is bulk-downloaded or redistributed as
a standalone dataset.

If you reuse or publish results derived from that data, PubChem requests
acknowledgment of NLM, e.g.:

> Kim S, Chen J, Cheng T, Gindulyte A, He J, He S, Li Q, Shoemaker BA,
> Thiessen PA, Yu B, Zaslavsky L, Zhang J, Bolton EE. PubChem 2025 update.
> Nucleic Acids Res. 2025;53(D1):D1516-D1525. https://doi.org/10.1093/nar/gkae1059

## Code Layout

```text
run_upscaling_tool.py              Entry point
upscaling_pipeline_tool/app.py     Local HTTP server and HTML shell
upscaling_pipeline_tool/static/    Client-side app and styling
upscaling_pipeline_tool/README.md  Package-level notes
```

Local backup snapshots may exist under `saved_states/`, but that directory is
ignored by git.
