# End-To-End User Workflow Audit

Date: 2026-08-05

## Current Version Saved

This audit describes the current saved version after interaction hardening, flowsheet overview controls, and Gantt split fixes.

## 1. Source Text And Block Creation

Status: usable, but still fragile for new users.

Issues:
- The user must understand the difference between source text selection and annotated text selection.
- Right-click block creation works, but the UI does not strongly explain when the selection is still active.
- Overlapping block prevention is correct, but the error is abrupt.

Recommended improvements:
- Add a small persistent "selected text" chip near the Create Block button.
- Add inline states: no selection, valid selection, overlaps existing block.
- Add a clearer "Create block from right-click selection" confirmation near the cursor.

## 2. Draft Blocks, Groups, And Right-Click Actions

Status: improved, but still interaction-heavy.

Fixed now:
- Right-clicking a group now selects that group and refreshes the menu context.
- Right-clicking a block inside a group now exposes "Split This Task Group".
- Context menus close when clicking elsewhere.

Remaining issues:
- The user needs to remember whether they are acting on a block or on its task group.
- Shift multi-select works but is not visually explained enough.
- The context menu is long and mixes grouping, arrows, scale-up, and destructive editing.

Recommended improvements:
- Split context menus into grouped sections with clearer separators.
- Add disabled-button tooltips explaining why an action is disabled.
- Show a small group badge on every block card when it belongs to a group.

## 3. MFA Inputs, Outputs, Waste, Phases

Status: functionally useful and aligned with the paper goal.

Fixed now:
- Stream edit/delete no longer depends only on the currently selected block; it finds the stream owner robustly.

Remaining issues:
- The inspector is dense and can feel like a form rather than a guided MFA model.
- Phase is essential but easy to miss until save time.
- Stream fate, scaling mode, and timing can look redundant to a new user.

Recommended improvements:
- Make phase and quantity the first visible row for every stream.
- Hide advanced stream fields by default.
- Add one-line validation badges: mass OK, phase missing, fate missing, recycle incomplete.

## 4. Conditions And Properties

Status: powerful, but too broad.

Issues:
- Conditions are shown by phenomenon family, which is correct technically but hard for a user who thinks in unit operations.
- Some fields are essential only for specific operations, but the UI still presents many possible fields.

Recommended improvements:
- Show an "essential only" mode by default.
- Add operation-specific condition templates: reaction, heat/cool, filtration, drying, extraction, distillation.
- Keep property refinement optional and attached only to separation/energy uncertainty.

## 5. Heuristic Rules

Status: useful for screening, not yet polished.

Issues:
- Triggered rules are helpful, but the user needs a clearer distinction between local deterministic checks and external AI review.
- External AI depends on model/output behavior and can still fail if no text is returned.

Recommended improvements:
- Keep local rule check as the default.
- Make external AI "second opinion" only.
- Default to short report and no web reference unless the user explicitly asks for external references.

## 6. Scale-Up And Gantt

Status: substantially improved after this fix.

Fixed now:
- Gantt split can divide task duration as a bottleneck-time screening estimate.
- Kinetics-bound groups still show a warning, but the UI no longer blocks duration division.
- Scale-Up summary has fewer repeated fields.

Remaining issues:
- The tool still needs to label split mode clearly on resulting Gantt rows.
- The difference between "throughput split" and "time split" should be shown after splitting.
- There is no one-click "undo split" except global undo.

Recommended improvements:
- Add split-mode labels on split groups.
- Add "Undo Split" for the most recent split.
- Add a small bottleneck explanation panel: why this is bottleneck, what changed after split, and what remains limiting.

## 7. Flowsheet View

Status: visually improved, still not a full PFD engine.

Issues:
- Fit View makes the whole process visible, but text becomes small.
- Actual Size is better for editing, but needs scrolling.
- Routing is custom and can still create awkward arrows for complex networks.

Recommended improvements:
- Integrate ELK for layout/routing, while keeping the current SVG chemical-equipment symbols.
- Add manual "snap to lane" and "align selected units" controls.
- Add stream visibility toggles: process, recycle, waste, vent.

## 8. Export And Paper Support

Status: useful for traceability.

Issues:
- Export is detailed, but too raw for paper-facing supplementary output.
- There is no "paper summary" export yet.

Recommended improvements:
- Add "Export paper summary" with: blocks, groups, MFA, heuristic checks, scale-up basis, Gantt, bottleneck actions.
- Add confidence labels to every result: reported, assumed, screening, missing.

## Highest-Priority Next Fixes

1. Add Playwright interaction tests.
2. Add split-mode labels after Gantt split.
3. Reduce default inspector density with essential-only views.
4. Add ELK-based layout experiment behind a toggle.
5. Add paper-summary export.
