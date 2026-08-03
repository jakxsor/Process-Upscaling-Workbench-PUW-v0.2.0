# Upscaling Pipeline Tool

This workspace is now organized around the local upscaling workflow tool.

The active app lives in:

```text
upscaling_pipeline_tool/
```

It supports:

- creating text blocks from a protocol description;
- adding quantified MFA streams to each block: inputs, outputs, waste/emissions, quantity, unit, phase, data status, and notes;
- assigning stream timing/role so grouped operations can aggregate compatible streams without losing later additions, recycles, or intermediate transfers;
- tracking stream fate, recycle loops, recovery percentage, purge percentage, make-up needs, and accumulation risks;
- using Lutze phase categories for streams and filtering out incompatible phenomenon/unit-operation combinations;
- recording phenomenon-driven operating conditions with structured value/unit fields for temperature, holding time, pressure, conversion, and loading;
- capturing phenomenon-specific descriptors such as mixing time, agitation speed, contact time, separation efficiency, carryover limits, and split fractions;
- aggregating group-level conditions, summing additive durations where valid and keeping conflicting/ranged operating values separate;
- defining a scale-up basis with target product, target amount, operating schedule, yield, recovery, and design margin;
- propagating stream quantities into scaled MFA rows for batch, hourly, and annual production views;
- generating a scale-up assessment for heat transfer, mixing, phase separation, vapor-liquid operations, solids handling, recycle closure, and energy handoff risks;
- generating recycle/fate summaries and energy-bridge candidates for downstream energy calculations;
- adding optional property refinement only when phase separation, energy, mixing, or ambiguous alternatives make it useful;
- screening separation alternatives with a property-based keep/weak/reject layer while keeping manual overrides traceable;
- running a rule-based Refine / Check pass for missing scale data, phase gaps, condition gaps, unit-choice ambiguity, connectivity, and scale-sensitive risks;
- optionally running an external OpenAI-compatible process review from a temporary popup API key or server-side `OPENAI_API_KEY`;
- showing a Gantt evidence layer with operation class, expected scale behaviour, schedule margin, missing data, and references;
- assigning behavior presets and phenomenological descriptors;
- combining blocks into task groups;
- drawing flowchart-style arrows between draft blocks, groups, and assigned blocks;
- switching the right project panel between the block inspector and the scale-up view;
- inspecting unit-operation alternatives with heuristic explanations;
- showing hover explanations for phenomena such as `M(L)`, `2phM(LL)`, `ES(H)`, `PT(VL)`, and `PS(LS)`.

## Run

```bash
python3 run_upscaling_tool.py --port 8787
```

Then open:

```bash
open http://127.0.0.1:8787
```

Equivalent direct command:

```bash
python3 upscaling_pipeline_tool/app.py --port 8787
```

## Saved State

Recent scale-up tool snapshots are saved under:

```text
saved_states/upscaling_tool_*/
```

These snapshots are local backups and are intentionally ignored by git for new saves.

## Dependencies

No external Python dependencies are required. The app uses the Python standard library.

## Code Layout

`upscaling_pipeline_tool/app.py` holds the HTTP server and HTML skeleton
only. CSS and client-side JS were split out into
`upscaling_pipeline_tool/static/style.css` and
`upscaling_pipeline_tool/static/app.js`, served at `/style.css` and
`/app.js` respectively.
