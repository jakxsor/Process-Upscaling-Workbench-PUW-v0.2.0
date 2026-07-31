# Upscaling Pipeline Tool

This workspace is now organized around the local upscaling workflow tool.

The active app lives in:

```text
upscaling_pipeline_tool/
```

It supports:

- creating text blocks from a protocol description;
- assigning behavior presets and phenomenological descriptors;
- combining blocks into task groups;
- drawing flowchart-style arrows between draft blocks, groups, and assigned blocks;
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

The current scale-up tool snapshot is saved here:

```text
saved_states/upscaling_tool_20260729_170627/
```

## Dependencies

No external Python dependencies are required. The app uses the Python standard library.
