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

The built-in octocrylene example is a source-reconciled software fixture for the
case study in Section 3 and the Supplementary Information: nine protocol-derived
blocks plus three explicit scale-up additions, nine task groups, a cyclohexane
recycle target, a 20 h limiting plant cycle, and a 750 t/yr target at roughly 250
batches/yr. It also exposes the SI's unresolved capacity conflict: 3000 kg of
product requires 7.5 m³ of cyclohexane alone at 2.5 L/kg, which cannot fit in the
stated 5 m³ reactor before reactants and freeboard are considered.

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
- Calculate reaction-stage product and residual masses from reactive-input
  quantities, molecular weights, stoichiometric coefficients, and declared yield.
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
- Close the plant boundary on the flowsheet: every waste or vent stream without a
  destination unit leaves through an off-page connector (to wastewater
  treatment, to waste treatment, to air), one per unit and boundary, numbered in
  the stream table and totalled in a discharge box next to the product; the
  PowerPoint export carries them.
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

In Stoichiometric Balance mode, the selected product amount is calculated from
the limiting-reagent extent and product coefficient, then multiplied by the
declared yield. Conversion controls unreacted reagent quantities; selectivity is
kept as a separate consistency assumption. Missing amounts, coefficients, MW,
or supported units block saving rather than being silently replaced by a valid
number. This is a reaction-stage material balance, not a kinetic model.

The Lutze Reaction-Separation sandbox is optional. It compares active
post-reaction substances pairwise and proposes draft separation moves from
property contrasts and phase compatibility. The main flowchart is unchanged
until the user explicitly applies a selected pathway. The sandbox does not
perform rigorous thermodynamic modelling, equipment sizing, or economic
optimization.

For scheduling, the tool uses:

```text
adjusted duration = input duration x (1 + Gantt margin %)
effective duration = adjusted duration / parallel units, except kinetics-bound stages
kinetics-bound effective duration = adjusted duration
batch makespan = latest finish in the explicit task-dependency graph
plant cycle time = largest task effective duration
bottleneck = longest zero-slack task on the dependency critical path
```

For campaign scheduling, the UI also shows an overlapped scenario:

```text
productive hours/year = operating days x operating hours/day x OEE
overlapped batches/year = productive hours/year x parallel trains / plant cycle time
conservative batches/year = productive hours/year x parallel trains / batch makespan
```

The overlapped scenario is an upper-throughput screening case. It assumes that
equipment, buffers, cleaning, operators, and material stability allow staggered
batches.

If operation-specific data are missing, the Gantt keeps the input duration and
reports the missing data needed for quantitative correction.

## Requirements

- Python 3.9 or newer is recommended.
- Python packages listed in `upscaling_pipeline_tool/requirements.txt` when present.
- A modern browser.

The Flowsheet View uses the built-in editable SVG renderer and editable
PowerPoint export path.

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

Optional editable install for development:

```bash
python3 -m pip install -e .
process-upscaling-workbench --no-browser
```

## Deploy on Render

The repository includes a `render.yaml` Blueprint for deploying the workbench as
a Render web service.

1. Push the repository to GitHub or another Git provider connected to Render.
2. In Render, choose **New > Blueprint** and select this repository.
3. Render will use:

```text
buildCommand: pip install -r upscaling_pipeline_tool/requirements.txt
startCommand: python3 -m upscaling_pipeline_tool.app --host 0.0.0.0
```

The app reads Render's `PORT` environment variable automatically. The Blueprint
uses the Frankfurt region and the free web-service plan by default.

The app works without secrets. To enable server-side AI review, add
`OPENAI_API_KEY` as a Render environment variable in the service settings. Do not
commit API keys to the repository.

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
9. Save snapshots from the Work menu, or export JSON as a portable reloadable
   project backup.
10. Export LCI Excel for review/openLCA mapping, or downstream JSON for custom
   tooling.

## Saving And Exporting

The Work menu stores autosave and manual snapshots in the current browser.
`Export JSON` downloads a portable `upscaling-project.json` file with both the
derived analysis tables and a reloadable `projectState` section; use `Import
JSON` to reopen that file later. `LCI Excel` is a review workbook for inventory
mapping and is not a direct openLCA JSON-LD package.

## Validation Checks

The repository includes lightweight regression checks for the current
paper-support workflow. They can be run from the repository root without a
Node package install:

```bash
python3 scripts/validate.py
```

The validation runner checks every served JavaScript file, compiles the Python
entry points, and runs the workflow, physical-plausibility, project import,
UI-wiring, PubChem, LCI Excel, PowerPoint export, and optional browser smoke
regressions. It automatically prefers the local `.venv` interpreter when
present so the export dependencies are available.

The individual commands are:

```bash
node --check upscaling_pipeline_tool/static/app.js
node --check upscaling_pipeline_tool/static/examples.js
node --check upscaling_pipeline_tool/static/flowsheet.js
node --check upscaling_pipeline_tool/static/flowsheet_ui.js
node --check upscaling_pipeline_tool/static/lca_bridge.js
node --check upscaling_pipeline_tool/static/process_catalogs.js
node --check upscaling_pipeline_tool/static/workflow_readiness.js
node scripts/check_complete_separation_flow.js
node scripts/check_separation_simulator.js
node scripts/check_property_screening.js
node scripts/check_flowsheet_view.js
node scripts/check_project_persistence.js
node scripts/check_tutorial_flow.js
python3 scripts/check_flowsheet_pptx_export.py
python3 scripts/check_lci_xlsx_export.py
python3 -m py_compile start.py run_upscaling_tool.py upscaling_pipeline_tool/app.py upscaling_pipeline_tool/pptx_renderer.py upscaling_pipeline_tool/xlsx_renderer.py
node scripts/check_browser_smoke.js
```

The last line is a browser smoke check. It drives the served application in
headless Chromium and asserts what the static checks cannot see: the page loads
without a runtime error, the process board opens legible with every group inside
the panel, the rule check produces a local report, the inventory readiness card
renders, and the flowsheet opens. It needs Playwright and a Chromium build and
prints `SKIP` (exit 0) when either is missing:

```bash
npm install --no-save playwright@1.54.0
npx playwright install chromium
node scripts/check_browser_smoke.js
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

Reported values, deterministic calculations, estimates, and missing data are
labelled separately. The benzophenone <0.5% endpoint is used only as an explicit
99.5% screening-conversion proxy to demonstrate residual-stream generation; it is
not presented as a reported yield. The quantities the SI names but does not
report (catalyst loading, extraction-solvent and brine volumes, vent losses,
drying-regeneration water, the six unit durations outside the reactor, wash and
distillation) are entered as engineering estimates, each with its method and
source on the stream or task note (textbook catalyst loading, laboratory wash
practice, vapour-liquid equilibrium for the vents, equipment throughputs for the
durations), so that every unit balance closes and the LCI carries an emission to
air. They stay labelled "estimated" until replaced from the authors' notebook.
The one deliberate blank is the distillation residue: its quantity follows from
the distillation yield, which the authors hold, and entering it moves the 1 kg
product basis. Thermal properties of the two case-specific esters come from the
SCCS opinion on octocrylene (SCCS/1627/21) and supplier data for 2-ethylhexyl
cyanoacetate, since PubChem carries none for either.

A second, fully quantified case is the base-catalysed transesterification of a
vegetable oil (triolein basis) to biodiesel: 6:1 methanol-to-oil molar ratio,
1 wt% NaOH, 60 °C, 1 h, 97.5 % conversion (Freedman, Pryde and Mounts, JAOCS
61, 1984, 1638; Van Gerpen, Fuel Processing Technology 86, 2005, 1097), with
glycerol-phase decanting, methanol recovery and recycle, water washing, vacuum
drying and polishing filtration to EN 14214. Every stream carries a mass, a
phase, a provenance status and handbook properties (NIST WebBook, CRC,
PubChem), so the reaction balance closes, the flowsheet balances per unit, and
the Lutze/Garg screening has the Tb, Tm, vapour-pressure and solubility data
it needs. Methanol phase partition and wash losses are typical engineering
values, labelled estimated. The same menu offers the case as "screen with
Lutze": the make-up and the reactor alone, with the quantified effluent and the
known phase behaviour, so the downstream train is built with the Lutze/Garg
screening. Its first recommended pathway is the plant's own pair of separations,
methanol by volatility and the glycerol phase (catalyst included) by decanting,
and applying it puts both units on the board for comparison with the full case.

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
