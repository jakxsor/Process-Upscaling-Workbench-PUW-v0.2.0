# Upscaling Pipeline Tool

Dedicated local tool for building an upscaling workflow from source text:

- select source text and create blocks;
- add block-level MFA inputs, outputs, and waste/emission streams with quantity, unit, phase, data status, and notes;
- track stream fate, recycle loops, recovery percentage, purge percentage, make-up needs, and accumulation risks;
- add operating-condition fields generated from the phenomena assigned to each block;
- aggregate group-level conditions, summing additive durations where valid and keeping conflicting/ranged operating values separate;
- assign behavior presets and phenomena;
- combine blocks into groups;
- connect draft blocks, groups, and assigned blocks on a flowchart board;
- switch the right project panel between the block inspector and the scale-up view;
- inspect unit-operation alternatives with heuristic explanations;
- define a production scale-up basis and propagate block MFA quantities to batch, hourly, and annual values;
- generate recycle/fate summaries and energy-bridge candidates for downstream energy calculations;
- add optional property refinement only when phase separation, energy, mixing, or ambiguous alternatives make it useful;
- run a rule-based Refine / Check review for missing scale data, phase gaps, condition gaps, connectivity, and ambiguous separation choices.

## Run

From `/Users/jacoposorani/work_search_tool`:

```bash
python3 upscaling_pipeline_tool/app.py --port 8787
```

Then open:

```bash
open http://127.0.0.1:8787
```

## Notes

This tool uses only the Python standard library.

`app.py` is just the HTTP server and the HTML skeleton. Styling lives in
`static/style.css` and all client-side logic lives in `static/app.js`,
served at `/style.css` and `/app.js`.

The previous working version was saved under:

```text
saved_states/upscaling_tool_20260729_170627/
saved_states/upscaling_tool_20260729_173443/
saved_states/upscaling_tool_20260729_174035/
saved_states/upscaling_tool_20260730_scaleup_basis_checker/
```
