# Upscaling Pipeline Tool

Dedicated local tool for building an upscaling workflow from source text:

- select source text and create blocks;
- assign behavior presets and phenomena;
- combine blocks into groups;
- connect draft blocks, groups, and assigned blocks on a flowchart board;
- inspect unit-operation alternatives with heuristic explanations.

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

The previous working version was saved under:

```text
saved_states/upscaling_tool_20260729_170627/
```
