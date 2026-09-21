# Tool Review: Framework Fidelity And Interface

Date: 2026-09-12
Branch: `fix/ui-scheduling-and-test-layer` (reviewed at `5c6a0c6`, fixes applied on top)
Companion to `audit_user_workflow_v1.md` (2026-08-05).

Full report with screenshots: https://claude.ai/code/artifact/68f8baa9-22d5-4565-be07-90a1b2f993eb

## Verdict

The methodological engine is substantially complete and faithful to the six-step
framework. The validation suite passes end to end. Against the project's own
design document (`workshop.md`) two structural gaps remain: the criteria-and-values
layer is absent, and (before this pass) case-study vocabulary was wired into
general inference.

The interface weakness was concentrated in one place: the process board opened at
35% zoom and could not fit its own content on any screen size tested. That is
fixed in this pass (see "Applied").

## Framework Fidelity, Layer By Layer

| Step | Status | Note |
| --- | --- | --- |
| 1 Block building | complete | character offsets preserved from text to block |
| 2 Phenomena definition | complete | 36 building blocks with glossary, 20-odd presets |
| 3 Unit operation deduction | complete | Jaccard-scored, phase-gated; evidence now shown inline on the board |
| 4 Network establishment | complete | streams with role, phase, fate, timing, provenance; stoichiometric balance |
| 5 Heuristic rules application | schema gap | 53 rules, decisions recorded per rule; no trigger/affected-criteria/confidence fields |
| 6 Preliminary scheduling | complete | dependency makespan, campaign scenarios, honest "not scheduled" |
| Criteria of interest and values | absent | zero occurrences in the codebase; `workshop.md` makes it first-class |
| Inventory export for assessment | on screen now | bridge was export-only; now an Inventory Readiness card |

The tool commits to six steps plus a result, which is the narrative the manuscript
audit recommends.

## Findings (ranked) And Status

| # | Finding | Status |
| --- | --- | --- |
| F1 | Board opens at 35% zoom and never fits its content (canvas sized from viewport/zoom, one column per stage, fit floor 0.35) | fixed: 1280x800 59%, 1600x1000 84%, 1920x1080 95%, all groups in view, no scrollbars |
| F2 | Zooming in from the fitted view lands on empty canvas | fixed: zoom anchors on the selected group |
| F3 | Criteria-and-values layer absent; rule schema lacks affected criteria, values, confidence | open (needs domain content from the authors) |
| F4 | Case-study names wired into inference at six sites | fixed: declared-substance vocabulary, fate-based tags, wording-based mixture detection |
| F5 | Inventory readiness invisible until the Excel export | fixed: Inventory Readiness card in the inspector |
| F6 | Step-5 modal gives the API form equal weight; 75 issues on the reference example, duplicates | fixed: single column, external review folded, duplicates merged, design conflicts split from data gaps |
| F7 | Type scale systematically small (285 declarations at 11px or less) | partly: panel utilities and compact node text one step larger |
| F8 | Compact toggle contradicts its own state | fixed: pressed-state pair |
| F9 | Tutorial dialog reads as destructive; nothing points to the tutorial | fixed: snapshot saved first and the dialog says so; first-run pointer still open |
| F10 | Ranking evidence hover-only on the board; list capped at four | fixed: rank and evidence inline, show-more control |
| F11 | False precision in derived figures | fixed: display rounding (model strings unchanged) |
| F12 | Optional export libraries block startup | fixed: renderers import on first use; 503 with a clear message |
| F13 | 698 functions in one file; no dark mode; stale theme comment | open |
| F14 | No browser interaction tests | fixed: `scripts/check_browser_smoke.js` (Playwright, skips when unavailable) |

## Observations For The Authors

- On the example, G4 (organic phase drying, selected unit "Drying") ranks
  Crystallization, Decanter and Liquid-liquid extraction as candidates and does not
  list Drying at all: the group's phenomena are PC(LS) and PS(LS), which the
  catalogue's drying entry does not cover. Worth a look at the catalogue entry.
- The reference example still reports 27 design conflicts and 15 data gaps after
  deduplication. If the flagship case should read close to clean, the severity of
  the "Scale-up risk needs review" family and the thermal-sequence checks needs
  calibration by someone who can judge the chemistry.
- The criteria-and-values layer (F3) is the largest stated-versus-built gap and the
  one most visible to a referee. The smallest credible version is three fields on
  each of the 53 rules (affected criteria, affected values, confidence) and a
  project-priorities selector that reorders the triggered list.

## Still Open From The August Audit

Split-mode labels after a Gantt split; a dedicated undo for the last split; a
paper-summary export; a layout-engine experiment behind a toggle.

## Addendum, 2026-09-14: second pass

Applied on top of `9af42a7` (the examples/catalog refactor from the other
session), with the three non-board commits from the parked branch
cherry-picked first.

- Flowsheet reads the group-aggregated MFA (intra-group hand-offs excluded),
  converts volumes with declared densities, numbers every stream, prints a
  stream table and a title block, offers a basis selector (lab / scaled / per
  kg), reports the per-unit balance, and exports the drawn routes, labels and
  table to PowerPoint.
- The octocrylene example declares densities and handbook Tb/Tm/Pvap for its
  well-characterised substances; the Lutze screening now produces three
  candidate pathways for G2 instead of "blocked by missing data", and a blocked
  screening names the missing properties and substances.
- Reaction Balance shows yield, conversion and selectivity side by side with a
  live consistency check and the scaled-target equivalent.
- The Gantt timeline keeps every task on its row (hatched when no duration)
  and draws the next batch as a ghost at the plant cycle time in the
  overlapped scenario.
- The board layout is the original one; the grid layout from the first pass
  stays parked on `review-fixes-20260912`.
