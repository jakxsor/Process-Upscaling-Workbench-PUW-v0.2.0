# Changelog

Dates are the release date. This project follows semantic versioning loosely:
while the version stays below 1.0 the saved-project format may still change.

## 0.2.0 - unreleased

First tagged and archived release, prepared to accompany the methodology paper.
Everything below is relative to the untagged 0.1.0 working state.

### The worked example is now numerically complete

- The quantities the octocrylene supporting information names but does not
  report are entered as engineering estimates: catalyst charge, extraction
  solvent, brine, reactor and evaporator vent losses, the Dean-Stark purge,
  molecular-sieve regeneration water, the aggregated wastewater, the
  distillation residue, and the six unit durations outside the reactor. All
  nine unit balances close.
- The distillation residue (Knoevenagel heavies: self-condensation and
  Michael adducts) is entered at 3% of the crude, the mid-point of the 2-5 wt%
  typical for this chemistry and the authors' chosen value; it is formed in
  the reactor and carried unchanged through extraction, drying and
  evaporation, closing the last open unit balance (G6).
- Each estimate carries the published source it was derived from, shown on
  hover over its status and under its note, editable, exported with the project
  and written as a column in the life cycle inventory workbook. Sources include
  the batch process vent equations of 40 CFR 63.1257 with their derivation in
  EPA-453/R-93-017, the ecoinvent gap-filling rule of Hischier et al. 2005, the
  fine-chemical defaults of Geisler et al. 2004, the fugitive solvent ceiling of
  Directive 2010/75/EU, and the octocrylene process patent.
- Where the literature disagrees with a value, the source says so rather than
  the value changing silently. Two such disagreements are recorded: the catalyst
  loading, and a solvent recovery more optimistic than the published best case.

### Flowsheet

- The plant boundary closes. A waste or vent stream with no destination unit
  leaves through an off-page connector grouped by destination, numbered in the
  stream table and totalled in a discharge box beside the product.
- Zoom controls, with the mouse wheel and with buttons.
- PowerPoint export keeps equipment shapes instead of drawing plain rectangles.
  Each unit is one group carrying its symbol as a vector picture with a bitmap
  fallback, and each stream is one group carrying its arrow and label. Text is
  sized in drawing units, so labels no longer overflow on a large flowsheet.

### Separation screening

- Two entry points, Basic for the guided pathway screening and Advanced for the
  diagnostic sandbox, with a mode switch inside the modal.
- Applying a pathway now translates the sandbox's substance fates into stream
  fates, so a separated waste fraction becomes a waste row that the flowsheet
  draws as a discharge and the inventory classifies, instead of a silent
  intermediate.

### Data quality

- Uncertainty follows provenance and propagates into totals, balances, scaled
  rows and the inventory export.
- Figures are shown with the precision their provenance supports.
- One substance table per project: a property is entered once and conflicts
  between streams are reported.
- Declared duration ranges stay ranges, and the makespan and plant cycle are
  reported as minimum, middle and maximum.

### Easier to follow

Changes from a UI study of every main screen, measured on the live app.

- The stepper row carries the three findings a scale-up reader opens the tool
  for: reactor fit, cycle time with its bottleneck, and what the inventory
  still lacks. Each is a link to where it is settled.
- Steps are numbered once, in the stepper. The right-hand tab badges and the
  numbers inside the panel flags are gone.
- The protocol textarea folds once blocks exist, since the annotated view is
  then the working copy of the same text.
- Phenomena read as plain words first, code second: "Heating ES(H)". The
  separation screening names its method chips by what they check and moves
  the paper's section codes into their tooltips.
- The board toolbar keeps help, connections and a View menu; compact and
  auto-arrange moved into the menu.
- The tutorial opens as a short tour of eight steps, one per part of the
  method, with the full 34-step tour one click away.
- The required reactor volume is shown at the precision the scale basis
  declares, like every other scaled figure, instead of to five digits.
- Clearing a project now also clears its provenance bar and inventory
  readiness, which stayed painted from the previous project.

### Board and inspector fixes

- The group drawer (Network & MFA) no longer opens partly below the visible
  window on ordinary screen heights; it stays within the viewport and scrolls
  through its full content.
- A group box that grows once opened (its unit picker expanding, for
  instance) now pushes the boxes below it out of the way instead of drawing
  on top of them.
- Operating Basis names the group it belongs to and states plainly that it is
  a manually entered mixture value, not an average computed from the
  substances in Substances - composition and temperature dependence the tool
  cannot infer from a name alone.
- Substances moved out of the sidebar, where its nine columns overflowed the
  narrow panel, into a popup opened by right-clicking the board. Its four
  rarely filled columns (Pvap T, solubility parameter, molar volume, CID)
  collapse behind a toggle, and the substance name stays visible while
  scrolling through the rest.

### Known gaps

- The heuristic rules match on keywords in free text, so wording in a note can
  change which rules fire. A declared trigger and criteria field is the fix.
- No measured batch-condenser vent dataset exists in the open literature, so
  vent losses can be calculated by a prescribed method but never validated
  against measurement.

## 0.1.0

Initial working state, never tagged: protocol text to blocks, task groups,
material flow accounting, unit-operation candidates, heuristic checks, scale-up
basis, Gantt bottleneck review, and the first exports.
