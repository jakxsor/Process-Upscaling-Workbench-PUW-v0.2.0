# Interaction And Gantt Split Audit

Date: 2026-08-05

## Findings Fixed

- Group right-click did not update the selected group context before showing the group menu. This made actions feel detached from the clicked group.
- Group context menu options were not refreshed when opened from a group.
- Stream edit/delete depended on the currently selected block. If selection changed, stream actions could silently do nothing.
- Floating context menus stayed open until an action or Escape, which could leave stale menus over the board.
- Gantt split semantics were ambiguous. The tool now exposes two modes:
  - throughput split: split material flow and keep declared duration;
  - bottleneck-time screening split: split material flow and divide Gantt/time-like durations.

## Current Intended Gantt Logic

- Kinetics-bound reaction stages default to throughput split only.
- Heating/cooling, drying, filtration, and equipment-dependent bottlenecks may use bottleneck-time screening split.
- The split still remains a screening estimate, not validated equipment design.

## Remaining Risks

- No automated browser interaction test suite is present. Manual/headless screenshots catch rendering regressions but not all click paths.
- The board and flowsheet still use custom layout/routing. A layout engine such as ELK should be evaluated before adding more routing complexity.
- Dragging in fit-mode flowsheet is scaled correctly by the current code, but precision may feel less direct than in actual-size mode.
- AI external review depends on the API returning written text; reasoning-only outputs cannot be rendered as a report.

## Recommended Next Fixes

- Add Playwright tests for: right-click group, split modal, stream edit, block creation from text selection, and flowsheet modal controls.
- Add an explicit "split mode" column/label in the Gantt row after a split.
- Add an "Undo split" action for recently split groups instead of relying only on global undo.
- Replace custom flowsheet auto-layout with ELK-based positions while keeping the current SVG equipment symbols.
