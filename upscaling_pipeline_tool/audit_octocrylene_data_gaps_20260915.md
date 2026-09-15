# Octocrylene Case: Data Gaps And How To Close Them

Date: 2026-09-15
Branch: `fix/ui-scheduling-and-test-layer` (case as loaded by `loadBaseExampleProject` at `ca10c3e`)
Companion to `audit_ui_review_20260912.md`. The biodiesel case added at `ca10c3e` is the
fully quantified counter-example: every technique below is applied there.

Shareable page: https://claude.ai/code/artifact/c94900b3-9c74-4950-8f1f-0ed3f7c75481

## Verdict

The octocrylene case is complete in structure (12 blocks, 9 units, 37 phenomena, every
stream with role, phase, fate and provenance) and incomplete in numbers. On the 1 kg
product basis, 32 stream rows carry no quantity (26 once the internal hand-offs between
blocks of the same unit are excluded), 6 of 9 units carry no duration, the two
case-specific esters and the catalyst lack the boiling point, melting point or vapour
pressure that the Lutze screening reads, and the three mixture streams have no
properties at all. None of these gaps needs new experiments. Three come from the SI or
the authors' notebook, the rest from stoichiometry, solubility data, handbook
properties and standard emission estimation. One decision of the authors (the
distillation yield) closes the only gap that changes the product basis.

Filling the first six items in the table below closes 30 of the 32 blank rows, because
the same substance repeats along the train.

## Missing quantities, by root cause

| # | Substance / stream | Blank rows | Where it appears | How to find the number | Proposed value (per kg product) |
| --- | --- | --- | --- | --- | --- |
| 1 | Ammonium acetate charge | 11 | B1 in/out, B2, B3, B4, B5 waste, B12 in | The SI names the catalyst without a quantity. First ask the authors for the notebook charge. Failing that, use the textbook loading for Knoevenagel condensations of ketones with NH4OAc, 10 to 30 mol% on the cyanoacetate (Jones, Org. React. 15, 1967, 204; Tietze and Beifuss, Comprehensive Organic Synthesis vol. 2, 1991). Charged cyanoacetate is 2.780 mol on this basis. | 0.043 kg at 20 mol% (0.556 mol x 77.08 g/mol); range 0.021 to 0.107 kg for 10 to 50 mol%. Status "estimated". It leaves in the 2 L wash: NH4OAc solubility in water is about 1480 g/L, so the whole charge dissolves. |
| 2 | Ethyl acetate charge | 8 | B5 in, B5 to B8 intermediates, B8 condensate | The SI requires an EtOAc extraction but gives no volume. Ask the authors; laboratory practice is 1 to 3 volumes of the reaction mixture. At plant scale the extraction is redundant, since cyclohexane already is the organic phase, and it creates a recovery problem: cyclohexane and ethyl acetate form a minimum-boiling azeotrope (about 72 degC, 56 wt% EtOAc), so the G8 column cannot return pure cyclohexane once EtOAc is in the loop. | Either drop EtOAc at scale (0 kg, note the deviation from the SI), or 1.0 L = 0.902 kg (density 902 kg/m3) as a placeholder, status "estimated", and route the G5 condensate to G8 as a mixed solvent. |
| 3 | Saturated brine wash | 3 | B6 in, B6 waste, B12 in | Not reported. Laboratory practice is one volume equal to the water wash. Saturated NaCl at 25 degC is 26.4 wt%, density 1200 kg/m3. | 1.0 L = 1.20 kg (0.317 kg NaCl + 0.883 kg water), status "estimated". At scale a coalescer or a second water wash usually replaces the brine wash. |
| 4 | Cyclohexane in vents (reactor, evaporator, abatement in/out) | 5 | B3 vent, B8 vent, B10 in/out/waste | Vent loss is not measured in the SI; estimate it from vapour-liquid equilibrium: nitrogen sweep rate x cyclohexane mole fraction at the condenser outlet (Pvap/P) x batch time, the method of the US EPA alternative control techniques document on VOC emissions from batch processes (1994). Example for the 3000 kg manuscript batch: 0.5 m3/h N2 for 20 h = 10 Nm3; a condenser at 10 degC gives Pvap = 6.3 kPa (NIST Antoine), y = 0.062, 0.66 m3 of vapour = 28 mol = 2.4 kg per batch. | 0.0008 kg before abatement (status "estimated", record the sweep rate and condenser temperature used); 0.0001 kg emitted after a cold condenser plus activated carbon at 90% capture; the difference is recovered solvent in B10. Both are far below the 0.05 L loss allowance already in the case. |
| 5 | Cyclohexane in the Dean-Stark liquid purge | 1 | B3 waste to U8 | This is the cyclohexane dissolved in the 0.050 kg of reaction water drawn off the trap. Solubility of cyclohexane in water is 55 mg/L at 25 degC. | 3 mg, so 0.00001 kg (effectively zero); enter it as such so the balance closes instead of showing an unknown. |
| 6 | Molecular-sieve regeneration water | 2 | B7 waste, B12 in | It equals the water carried by the organic phase into the bed minus the 500 ppm endpoint. Water solubility is 3.3 wt% in ethyl acetate and 0.01 wt% in cyclohexane at 20 degC, plus typically 0.1 to 0.5 wt% entrained droplets after a decanter. A Karl Fischer titration before the bed replaces the estimate. | 0.040 kg with 0.902 kg EtOAc present (0.030 dissolved + 0.012 entrained - 0.002 left in the product); 0.008 kg without EtOAc. Status "estimated". |
| 7 | Uncharacterised distillation residue | 1 | B9 purge | The SI reports a heavy fraction with neither quantity nor composition. It is the crude minus the distillate, so it follows from the distillation yield, which the authors should have. Knoevenagel heavies (self-condensation and Michael adducts, coloured oligomers) are typically 2 to 5 wt% of the crude. | Ask for the distillation yield. Placeholder 0.030 kg (3%), status "estimated"; then the reagent charges must be raised by 1/0.97 (benzophenone 0.522 kg, cyanoacetate 0.565 kg) or the basis redefined as 1 kg of crude. This is the only gap that moves the product basis. |
| 8 | Wastewater total | 1 | B12 out | A derived number: the sum of the aqueous inputs once items 1, 3 and 6 are set. | 3.33 kg (0.050 reaction water + 1.994 wash + 0.043 NH4OAc + 1.20 brine + 0.040 regeneration water). Status "calculated". |

Items 4 and 5 look small because they are. Their value is that the vent and purge
rows stop reading "missing", so the unit balances of G2, G5 and G7 can close and the
LCA bridge can carry an emission to air with a number.

## Missing durations

The Gantt currently schedules G2 (20 h), G3 (2 to 3 h) and G6 (3 to 5 h) and marks
six units "not scheduled". With the reactor as the 20 h bottleneck and the overlapped
campaign scenario, the plant cycle stays at 20 h whatever the other units take, which
is why the SI's 250 batches per year reconcile. The durations below make the Gantt
honest without changing that result.

| Unit | Task | How to find the duration | Proposal |
| --- | --- | --- | --- |
| G1 | Feed preparation and dosing | Charging rate of the dosing skid for the 3000 kg batch (about 1.5 t benzophenone and 1.6 t cyanoacetate plus 7.5 m3 cyclohexane). One hour is the usual allowance for a solids charge and a solvent transfer. | 1 h, "roughly constant" |
| G4 | Organic-phase drying | Fixed-bed contact time: about 10 m3 of organic phase per batch without EtOAc (2.9 m3 product + 7.5 m3 cyclohexane) through a 2 to 3 m3 sieve bed at a liquid hourly space velocity of 2 per hour. | 2 h, "increases with scale" |
| G5 | Solvent evaporation | Evaporator capacity: 5.8 t cyclohexane per batch (plus 2.7 t EtOAc if kept) at a thin-film evaporator rate of about 1 t/h. | 8 h with EtOAc, 6 h without, "equipment dependent" |
| G7 | Vent abatement | Runs for as long as the reactor and evaporator vent; it is a continuous service. | 20 h, overlap "yes" |
| G8 | Cyclohexane recovery column | 5.8 t per batch at a column throughput of about 1 t/h. | 6 h, overlap "yes" |
| G9 | Wastewater interface | Transfer to the treatment plant; nominal. | 1 h, overlap "yes" |

## Ranges that the tool reads as midpoints

The protocol keeps the SI's ranges: 85 to 90 degC, 18 to 24 h, 0.5 to 1 h ramp,
2 to 3 h wash, 3 to 5 h distillation, 40 to 50 degC and 100 to 200 mbar in the
evaporator, 190 to 210 degC at the still head. The scheduler and the scale-up read
the midpoint of each. That is defensible for screening, but the authors should
state the set-point they scaled with (the case already assumes 20 h for the reaction),
or the ranges should be kept as intervals with the midpoint marked as such. The
latter is on the precision backlog of the 2026-09-14 addendum.

## Missing physical properties (Lutze screening inputs)

| Substance | Have | Missing | Source |
| --- | --- | --- | --- |
| 2-ethylhexyl cyanoacetate (CAS 13361-34-7) | MW, density 985 | Tb, Tm, Pvap | No NIST entry. Supplier SDS and the ECHA registration dossier give a reduced-pressure boiling point (about 120 degC at 5 mmHg); extrapolate to 1 atm and 25 degC with the Clausius-Clapeyron form or EPI Suite MPBPWIN, and mark the result "estimated". Tm: liquid at room temperature; enter the pour point from the SDS if given. |
| Octocrylene (CAS 6197-30-4) | MW, density 1050 | Tb, Tm, Pvap | The SI's own still head, about 210 degC at 1.5 mmHg, is the best data point; extrapolate to 1 atm the same way. The ECHA dossier lists an estimated vapour pressure around 1e-6 Pa at 25 degC and no crystallisation above -10 degC. Enter Tm as "not observed above 263 K" rather than a number. |
| Ammonium acetate | MW, Tm 387 K, density 1170 | Tb, Pvap | Decomposes at about 114 degC; there is no boiling point. Enter Pvap as negligible and note the decomposition so the screening does not propose distilling it. |
| Saturated brine, wastewater, organic residue | density (brine 1200) | everything else | Mixtures. Give wastewater a density of 1000 kg/m3 so its rows convert to kg; leave Tb/Tm blank and let the screening treat both aqueous streams as water with dissolved salt. The residue stays uncharacterised until the authors analyse it (GC-MS of the still bottoms). |

## Where the numbers come from, in order of preference

1. The SI tables and experimental section, then the authors' notebook (items 1, 2, 3,
   7 and every duration).
2. Stoichiometry and closure through the tool's Reaction Balance and per-unit
   flowsheet balances (item 8 and the reagent charges, already done).
3. Property databases: NIST WebBook and PubChem for pure components, the ECHA
   registration dossiers for the two case-specific esters, CRC Handbook or DIPPR for
   densities and solubilities.
4. Engineering practice for loadings and equipment rates: Perry's Chemical Engineers'
   Handbook, Green and Southard, and the tool's own heuristics (wash volumes, bed
   space velocities, evaporator and column throughputs).
5. Emission estimation from vapour-liquid equilibrium and sweep rates (US EPA batch
   process guidance) for anything that leaves through a vent.

Every value entered from levels 3 to 5 should carry the status "estimated" and a note
naming the method, as the biodiesel case does, so the provenance bar in Data Quality
stays truthful.

## Observations for the authors, from running the case

- The KB3.1 ranking on G2 proposes crystallisation to remove cyclohexane from the
  product. It follows from the melting points (cyclohexane 279.6 K against an
  unknown Tm for octocrylene); entering the octocrylene data above removes the
  proposal.
- The board's phase filter silently drops phenomena that are incompatible with the
  declared stream phases (B9 loses PT(VL) and PS(VL) because its streams are all
  declared liquid). Declare the distillate as vapour, or wait for the "warn instead of
  delete" fix on the backlog.
- The G4 unit candidates do not offer "Drying" although the selected unit is Drying,
  because the block declares PC(LS)/PS(LS) rather than an adsorption phenomenon. Adding
  PC(LS) is right; the candidate list is a catalogue gap, not a data gap.
