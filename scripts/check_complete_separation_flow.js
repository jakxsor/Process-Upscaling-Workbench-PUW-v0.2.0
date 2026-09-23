#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const heuristicRulesSource = fs.readFileSync("upscaling_pipeline_tool/static/heuristic_rules.js", "utf8");
const workflowReadinessSource = fs.readFileSync("upscaling_pipeline_tool/static/workflow_readiness.js", "utf8");
const examplesSource = fs.readFileSync("upscaling_pipeline_tool/static/examples.js", "utf8");
const catalogSource = fs.readFileSync("upscaling_pipeline_tool/static/process_catalogs.js", "utf8");
let source = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
const cssSource = fs.readFileSync("upscaling_pipeline_tool/static/style.css", "utf8");
assert(cssSource.includes(".stream-editor-grid {\n      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);"), "Stream editor should give Inputs and Outlets equal horizontal space");
const marker = "$(\"behaviorSelect\").innerHTML";
source = source.slice(0, source.indexOf(marker));

source += `
globalThis.requestAnimationFrame = () => {};
globalThis.window = { innerHeight: 900 };
function fakeElement() {
  return {
    value: "",
    hidden: false,
    textContent: "",
    innerHTML: "",
    className: "",
    clientWidth: 1000,
    clientHeight: 800,
    scrollLeft: 0,
    scrollTop: 0,
    scrollTo() {},
    getBoundingClientRect() { return { height: 430 }; },
    classList: { toggle() {}, contains() { return false; }, remove() {}, add() {} },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    setAttribute() {},
    style: {}
  };
}
globalThis.document = {
  body: { classList: { add() {}, remove() {} } },
  getElementById() { return fakeElement(); },
  querySelectorAll() { return []; }
};
renderAll = () => {};
var renderExport = () => {};
var exportGroupProperties = group => Object.entries(group?.properties || {}).map(([id, value]) => ({ id, ...(value || {}) }));

loadBaseExampleProject();

const baseHeuristics = heuristicReviewModel(scaleModel());
assert(baseHeuristics.triggered.length <= 25, "The octocrylene example should show a focused heuristic shortlist, not " + baseHeuristics.triggered.length + "/" + baseHeuristics.totalRules + ": " + baseHeuristics.triggered.map(item => item.id).join(","));
assert.strictEqual(state.blocks.find(block => block.id === "B10").source, "scale-up addition", "Vent treatment must remain distinguishable from protocol-derived blocks");
assert.strictEqual(state.blocks.find(block => block.id === "B11").source, "scale-up addition", "Solvent recovery must remain distinguishable from protocol-derived blocks");
assert.strictEqual(state.blocks.find(block => block.id === "B12").source, "scale-up addition", "Wastewater treatment must remain distinguishable from protocol-derived blocks");
const sourceBlocks = state.blocks.filter(block => block.source === "protocol").sort((a, b) => a.start - b.start);
assert.strictEqual(state.text, sampleText, "The Protocol panel must contain only the normalized B1-B9 protocol mapping");
sourceBlocks.forEach((block, index) => {
  assert.strictEqual(state.text.slice(block.start, block.end), block.text, block.id + " must link to its exact source excerpt");
  if (index > 0) assert(block.start >= sourceBlocks[index - 1].end, block.id + " must not overlap the previous source annotation");
});
state.blocks.filter(block => block.source === "scale-up addition").forEach(block => {
  assert.strictEqual(block.start, block.end, block.id + " must not claim a span in the laboratory protocol");
});
assert(!state.text.includes("[Industrial addition]"), "Industrial additions must stay out of the source protocol text");
assert(!state.text.includes("chosen solvent") && !state.text.includes("85-140"), "The selected cyclohexane route must not retain ambiguous multi-route wording");
assert(state.text.includes("2.5 L per kg") && state.text.includes("18-24 h"), "The normalized protocol must retain conditions reported in SI Table S1");

const g2 = groupModel("G2");
const g3 = groupModel("G3");
syncSeparationSimulatorSubstances(g2);

const scale = scaleModel();
const benchmarkGantt = taskScheduleModel();
const throughput = throughputDiagnosticsModel(scale, benchmarkGantt);
assert.strictEqual(benchmarkGantt.missingDurationCount, 0, "Every octocrylene task carries a duration: the six the SI does not quantify are labelled engineering estimates (equipment throughputs), not blanks");
assert(Math.abs(benchmarkGantt.plantCycleTimeH - 20) < 0.01, "Octocrylene example should retain the 20 h kinetics-bound plant cycle");
assert(Math.abs(conversionNumber(scale.schedule.effectiveBatchesPerYear) - 250) < 0.01, "Octocrylene calendar and OEE should reconcile to approximately 250 batches/year");
assert(Math.abs(conversionNumber(scale.target.kgPerBatch) - 3000) < 0.01, "The 750 t/year target should reconcile with the 3000 kg manuscript batch");
const g2Capacity = throughput.rows.find(row => row.groupId === "G2" && row.capacityUnit === "m3");
assert(g2Capacity, "G2 should expose a volumetric capacity check");
assert(Math.abs(g2Capacity.actualValue - 7.5) < 0.01, "G2 capacity should use the reported 2.5 L/kg solvent charge as a lower bound before missing reactant volumes");
assert.strictEqual(g2Capacity.actualSource, "reactor sizing total charge", "G2 should disclose the source of its volumetric load");
assert(throughputDiagnosticsHtml(throughput).includes("reactor sizing total charge"), "Capacity UI should show the source of volumetric checks");
assert.strictEqual(scale.reactorSizing.source, "partial manual L/kg product loadings (lower bound)", "Octocrylene reactor sizing should disclose that reactant volume is still missing");
assert(scale.reactorSizing.missing.includes("reactants loading"), "Octocrylene reactor sizing should not present the solvent-only lower bound as a complete charge");
assert(Math.abs(conversionNumber(scale.reactorSizing.reactorVolumeM3) - 10.714) < 0.03, "Solvent alone should require at least 10.7 m3 at 70% working fill");
assert(g2Capacity.utilizationPercent > 100, "The test should expose the contradiction between the reported 5 m3 reactor and 7.5 m3 solvent charge");
state.expandedGanttRows.G2 = true;
const completeGanttHtml = ganttPanelHtml(taskScheduleModel());
assert(completeGanttHtml.includes("Add Density Basis"), "Volumetric reactor Gantt rows should expose the density-basis action");
assert(completeGanttHtml.includes("Conservative batches/year") && completeGanttHtml.includes("complete dependency path"), "Gantt summary should distinguish conservative makespan throughput from plant cycle");
assert(completeGanttHtml.includes("gantt-timeline-legend") && completeGanttHtml.includes("feed preparation and dosing"), "Gantt timeline should expose its legend and task names");
assert(completeGanttHtml.includes("data-toggle-gantt-decision") && completeGanttHtml.includes("Review options"), "Bottleneck remediation should stay available in a compact expandable control");
assert(!completeGanttHtml.includes("Fill Example Durations"), "With every octocrylene duration declared (SI values or labelled estimates), the generic example-duration filler must not be offered");
assert(renderScaleBasisPanel.toString().includes("scale-equipment-basis") && renderScaleBasisPanel.toString().includes("Annual capacity"), "Scale-up should separate reactor fill from calendar inputs and disclose their calculation impact");
assert(!candidateFitMetaHtml(unitOperationCandidatesForGroup(g2)[0]).includes("score"), "Unit-operation evidence must not expose an invented numeric score");
openDensityBasisEditor("G2");
assert.strictEqual(ensureGroup("G2").properties.density.unit, "kg/m3", "Density action should prepare the group density unit");
assert.strictEqual(ensureGroup("G2").propertiesEditing, true, "Density action should open the group properties editor");
const oneCubicMeter = groupScaledLoadVolumeM3(
  { rows: [{ groupId: "GX", role: "input", scaledQuantity: "870", scaledUnit: "kg" }] },
  "GX",
  { properties: { density: { value: "870", unit: "kg/m3" } } }
);
assert(Math.abs(oneCubicMeter.value - 1) < 0.0001, "Group volumetric load should convert mass through group density");

assert(postReactionSeparationSupportApplies(g2), "G2 should expose post-reaction separation support");
// Separation tasks with no reaction of their own screen the mixture that enters them; a task
// without a separation phenomenon (feed preparation) still gets nothing.
["G3", "G5", "G6"].forEach(id => assert(postReactionSeparationSupportApplies(groupModel(id)), id + " separation task should expose the separation screening without a reaction"));
assert(!postReactionSeparationSupportApplies(groupModel("G1")), "G1 feed preparation has no separation phenomenon and should not expose the screening");
const g3Mixture = inferredSeparationSubstances(g3);
assert(g3Mixture.length >= 2, "G3 should gather a mixture from its own streams and the upstream outlets");
assert(g3Mixture.some(item => item.name === "octocrylene" && item.role === "product"), "In a separation-only task the scale-up target product takes the product role");
assert(!g3Mixture.some(item => item.role === "reactant"), "A separation-only task has no reactants");

const g2Root = fakeElement();
renderGroupAggregateStepInspector(g2Root, g2);
assert(!g2Root.innerHTML.includes("<strong>Group Task</strong>"), "Group drawer should not spend a full panel on task assignment");
assert(g2Root.innerHTML.includes("R(L)") && g2Root.innerHTML.includes("PS(LL)"), "Group drawer header should keep the compact phenomena list");
assert(groupUnitSuggestionGateHtml(g2, { board: true }).includes('data-suggest-unit-operation="G2"'), "Task board card should expose the compact unit-operation action");
assert(groupUnitSuggestionGateHtml(g2, { board: true }).includes("Assign Unit Operation") || groupUnitSuggestionGateHtml(g2, { board: true }).includes("Switch Unit Operation"), "Unit-operation action should be a direct task-level button");
assert(!g2Root.innerHTML.includes("Review Lutze Again"), "Unit-operation gate should not duplicate the Lutze review action");
assert(g2Root.innerHTML.includes("Lutze/Garg screening"), "G2 drawer should render the focused Lutze/Garg screening entry point");
assert(g2Root.innerHTML.includes("Basic") && g2Root.innerHTML.includes("Advanced"), "G2 drawer should make the Basic/Advanced separation hierarchy explicit");
assert(!g2Root.innerHTML.includes("route moves") && !g2Root.innerHTML.includes("binary pairs"), "G2 drawer launcher should not duplicate Lutze details");
assert(!g2Root.innerHTML.includes("Separation Alternatives"), "G2 drawer should not expose separation alternatives directly");
assert(g2Root.innerHTML.includes("Outlets"), "Group drawer should expose the unified outlets MFA section");
assert(g2Root.innerHTML.includes(">water<"), "Unified outlets should still include the reaction-water waste stream");
assert(g2Root.innerHTML.includes("Task-level editor"), "Group drawer should make task-level material editing explicit");
assert(g2Root.innerHTML.includes("Task timetable") && g2Root.innerHTML.includes("Open timetable"), "Group drawer should expose a compact task-level timetable launcher");
assert(taskTimetableHtml(g2).includes("data-timetable-duration"), "Task timetable should expose editable event durations");
assert(taskTimetableHtml.toString().includes("Start with"), "Task timetable should expose quick alignment when multiple timed events exist");
assert(taskTimetableHtml.toString().includes("data-timetable-start"), "Task timetable should expose editable start times for partial overlaps");
assert(g2Root.innerHTML.includes("+ Task input") && g2Root.innerHTML.includes("+ Task outlet"), "Group drawer should expose task-level stream add actions");
assert(g2Root.innerHTML.includes("source-chip"), "Group aggregate MFA rows should expose source block chips");
assert(renderGroupFlow.toString().includes("data-open-group-board"), "Flowchart group cards should expose an explicit open-group button");
assert(renderGroupFlow.toString().includes("data-compact-group-board"), "Detailed flowchart group cards should expose a compact-return button");
assert(renderGroupFlow.toString().includes("groupBoardOverviewHtml(group)"), "Detailed flowchart group cards should render the reduced board overview");
assert(renderGroupFlow.toString().includes("compact-meta"), "Compact flowchart group cards should keep lightweight block/phenomena counts");
assert(renderGroupFlow.toString().includes("Edit task materials"), "Compact flowchart cards should provide the explicit task-material edit action");
assert(renderGroupFlow.toString().includes("Back to compact"), "Detailed flowchart cards should provide the explicit compact-return action");
assert(renderGroupFlow.toString().includes("unitCategoryBadgeHtml(group"), "Flowchart cards should expose a compact unit-category micro badge");
const transferOnlyBlock = { id: "BTX", groupId: "", phenomena: ["PT(LL)"], conditions: {}, conditionUnits: {} };
const transferOnlyPromptIds = conditionPromptsForBlock(transferOnlyBlock).map(item => item.id);
assert(transferOnlyPromptIds.includes("transfer_endpoint") && transferOnlyPromptIds.includes("phase_ratio"), "Liquid-liquid transfer should retain its decision-relevant endpoint and phase ratio");
assert(!transferOnlyPromptIds.includes("contact_time") && !transferOnlyPromptIds.includes("phase_change_time") && !transferOnlyPromptIds.includes("solid_loading"), "Liquid-liquid transfer should not expose unrelated contact, phase-change, or solid-liquid fields");
const contextualDurations = inferInitialConditions("Stir the charge briefly. Hold at 65 C for 3 h to complete the reaction.", ["M(L)", "R(L)", "ES(H)"]);
assert.strictEqual(contextualDurations.values.reaction_time, "3", "Condition gathering should associate a nearby hold duration with reaction time");
assert.strictEqual(contextualDurations.values.mixing_time, undefined, "Condition gathering should not copy an unrelated reaction duration into mixing time");
const explicitMixingDuration = inferInitialConditions("Stir for 30 min, then transfer the charge.", ["M(L)"]);
assert.strictEqual(explicitMixingDuration.values.mixing_time, "0.5", "Condition gathering should normalize an explicitly stated mixing duration");
const gatheredOperatingData = inferInitialConditions("Heat from 25 to 80 °C, stir at 450 rpm, then distill under 200 mbar for 1.25 h.", ["ES(H)", "M(L)", "PT(VL)", "PCh(L->V)"]);
assert.deepStrictEqual(
  [gatheredOperatingData.values.initial_temperature, gatheredOperatingData.values.target_temperature, gatheredOperatingData.values.agitation_speed, gatheredOperatingData.values.target_pressure, gatheredOperatingData.values.phase_change_time],
  ["25", "80", "450", "200", "1.25"],
  "Condition gathering should extract explicit thermal, agitation, pressure, and phase-change data"
);
const gatheredYield = inferInitialConditions("React for 2 h to obtain 87% yield.", ["R(L)"]);
assert.strictEqual(gatheredYield.values.conversion_yield, "87", "Condition gathering should retain an explicitly reported reaction yield");
assert(groupBoardOverviewHtml(g2).includes("group-mini-block"), "Detailed flowchart group cards should keep internal blocks as compact clickable chips");
assert(groupBoardOverviewHtml(g2).includes("source block"), "Detailed flowchart internal block chips should be labeled as source evidence");
const taskEditTarget = groupTaskEditBlock(g2);
const taskEditBefore = taskEditTarget.streams.length;
addGroupTaskStream("G2", "outlet");
assert.strictEqual(taskEditTarget.streams.length, taskEditBefore + 1, "Task-level stream add should store the new row on a source block");
assert.strictEqual(taskEditTarget.streams.at(-1).editing, true, "Task-level stream add should open the new material row for editing");
assert.strictEqual(state.selectedBlockId, taskEditTarget.id, "Task-level stream add should focus the source block that stores the row");
taskEditTarget.streams.pop();
syncLegacyStreamLists(taskEditTarget);
selectGroup("G2");
state.boardCompact = true;
openGroupFromBoard("G2");
assert.strictEqual(state.boardCompact, false, "Opening a group from compact flowchart cards should switch to detailed board view");
assert.strictEqual(state.selectedGroupId, "G2", "Opening a group from the flowchart should select that group");
compactGroupFromBoard("G2");
assert.strictEqual(state.boardCompact, true, "Returning from detailed flowchart cards should switch to compact board view");
state.boardCompact = false;

ensureGroup("G2").separationSupportExpanded = true;
renderGroupAggregateStepInspector(g2Root, g2);
assert(g2Root.innerHTML.includes("Lutze/Garg screening"), "G2 drawer should keep the focused pathway-screening button");
assert(g2Root.innerHTML.includes("Operating Basis"), "G2 drawer should render the group operating-basis panel");
assert(!g2Root.innerHTML.includes("Optional Property-Based Separation Screen"), "G2 drawer should not render the old aggregate property screen");
assert(!g2Root.innerHTML.includes('data-predictor-mode="G2"'), "G2 operating-basis panel should not expose aggregate predictor controls");
assert(g2Root.innerHTML.includes('data-save-properties="G2"') || g2Root.innerHTML.includes('data-edit-properties="G2"'), "G2 drawer should expose property editing controls");
assert(g2Root.innerHTML.includes('data-property-field="value"'), "G2 property editor should expose property value inputs");

const g3Root = fakeElement();
renderGroupAggregateStepInspector(g3Root, g3);
assert(!g3Root.innerHTML.includes("Post-Reaction Separation Support"), "G3 drawer should not render separation support");
assert(g3Root.innerHTML.includes("Lutze/Garg screening"), "G3 separation task should offer the screening without a reaction of its own");

const simulator = ensureGroup("G2").separationSimulator;
const propertySet = {
  "cyclohexane": { mw: "84.16", tb: "353.9", tm: "279.7", pvap: "13000", solubilityParameter: "16.8", molarVolume: "108.7", molecularDiameter: "0.60", kineticDiameter: "0.60", thermalSensitivity: "low" },
  "octocrylene": { mw: "361.5", tb: "480", tm: "280", pvap: "10", solubilityParameter: "19.2", molarVolume: "310", molecularDiameter: "1.25", kineticDiameter: "1.25", thermalSensitivity: "high" },
  "water": { mw: "18.02", tb: "373.15", tm: "273.15", pvap: "3167", solubilityParameter: "47.9", molarVolume: "18", molecularDiameter: "0.28", kineticDiameter: "0.265", thermalSensitivity: "low" },
  "benzophenone": { mw: "182.22", tb: "578", tm: "321", pvap: "0.01", solubilityParameter: "20.1", molarVolume: "160", molecularDiameter: "0.78", kineticDiameter: "0.78", thermalSensitivity: "medium" },
  "2-ethylhexyl cyanoacetate": { mw: "197.27", tb: "395", tm: "220", pvap: "20", solubilityParameter: "18.7", molarVolume: "195", molecularDiameter: "0.82", kineticDiameter: "0.82", thermalSensitivity: "medium" },
  "ammonium acetate": { mw: "77.08", tb: "390", tm: "387", pvap: "0.1", solubilityParameter: "31", molarVolume: "60", molecularDiameter: "0.50", kineticDiameter: "0.50", thermalSensitivity: "medium" }
};

simulator.substances.forEach(item => {
  const values = propertySet[item.name.toLowerCase()];
  assert(values, "Missing test properties for " + item.name);
  Object.assign(item, values);
  if (!item.quantity) item.quantity = "1";
  if (!item.unit) item.unit = "kg";
});

let completeModel = separationSimulatorModel(g2);
completeModel.pairs.forEach(pair => {
  const pairNames = [pair.a.name, pair.b.name].sort().join(" / ");
  simulator.pairInsights[pair.key] = {
    relativeVolatility: pairNames === "cyclohexane / octocrylene" ? "40" : "",
    azeotrope: "no",
    pressureSensitive: "no",
    miscibilityGap: "no",
    eutectic: "no",
    note: "complete test matrix"
  };
});

completeModel = separationSimulatorModel(g2);
const readiness = separationSimulatorReadiness(completeModel);
const actionable = completeModel.suggestions.filter(item => item.ruleId !== "NO-KB3.1-MATCH");
const matched = actionable.filter(item => item.level === "matched");
const units = new Set(actionable.flatMap(item => item.units));

assert.strictEqual(readiness.status, "ready", "Complete G2 data should move readiness to ready");
assert(actionable.length > 0, "Complete G2 data should produce actionable route theories");
assert(matched.length > 0, "Complete G2 data should produce explicit KB3.1 threshold matches");
assert(units.has("Evaporation") || units.has("Distillation"), "Complete G2 data should suggest a V-L route");
assert(units.has("Short-path distillation") || units.has("Wiped-film evaporator"), "Heat-sensitive product should suggest gentle thermal separation");

const workup = workupPlanModel(g2, completeModel);
const stepTitles = workup.steps.map(step => step.title);
assert(Math.abs(workup.balance.yield - 0.995) < 0.0001, "G2 workup should derive yield from the explicit endpoint-proxy conversion and selectivity assumptions");
assert(Math.abs(workup.balance.conversion - 0.995) < 0.0001, "G2 workup should preserve the endpoint-proxy conversion used to generate residual reagents");
assert(stepTitles.includes("Remove reaction byproduct / separate phase"), "Workup should remove byproduct early");
assert(stepTitles.includes("Recover bulk solvent"), "Workup should recover solvent before final polishing");
assert(stepTitles.includes("Remove or recover residual reactants"), "Workup should flag residual reactants after incomplete conversion");
assert(stepTitles.includes("Final product polishing"), "Workup should include final product polishing");

loadSimpleSeparationDemo("G2");
const demoState = ensureGroup("G2").separationSimulator;
const demoModel = separationSimulatorModel(g2);
const demoReadiness = separationSimulatorReadiness(demoModel);
const demoUnits = new Set(demoModel.suggestions
  .filter(item => item.ruleId !== "NO-KB3.1-MATCH")
  .flatMap(item => item.units));

assert.strictEqual(demoState.tab, "suggestions", "Simple demo should open directly on Suggestions");
assert.deepStrictEqual(demoModel.substances.map(item => item.name), ["cyclohexane", "octocrylene"], "Simple demo should use two visible components");
assert.strictEqual(demoReadiness.status, "ready", "Simple demo should be ready");
assert(demoUnits.has("Evaporation") || demoUnits.has("Distillation"), "Simple demo should suggest solvent/product V-L separation");
assert(demoUnits.has("Short-path distillation") || demoUnits.has("Wiped-film evaporator"), "Simple demo should suggest a gentle thermal product route");

const demoVariants = binaryRouteVariants("G2", demoModel.pairs[0]);
assert(demoVariants.some(item => item.title === "Volatility route"), "Binary screening should expose a volatility route variant");
assert(demoVariants.some(item => item.graphPreview.includes("V-L separator")), "Route variant should preview a graph change");
assert(demoVariants.some(item => item.units.includes("Evaporation") || item.units.includes("Distillation")), "Route variant should include applicable unit assets");

loadTripleReactantSeparationDemo("G2");
const tripleState = ensureGroup("G2").separationSimulator;
const tripleModel = separationSimulatorModel(g2);
const tripleBalance = reactionBalanceModel(g2, tripleModel);
const productPairs = tripleModel.pairs.filter(pair => [pair.a.name, pair.b.name].includes("benzyl acetate"));
const tripleUnits = new Set(tripleModel.suggestions
  .filter(item => item.ruleId !== "NO-KB3.1-MATCH")
  .flatMap(item => item.units));

assert.strictEqual(tripleState.tab, "pathway", "3-reagent demo should open on Pathway Sandbox");
assert.deepStrictEqual(tripleModel.substances.map(item => item.name), ["benzyl alcohol", "acetic anhydride", "triethylamine", "benzyl acetate", "triethylammonium acetate"], "3-reagent demo should keep three residual reagents, product, and stoichiometric salt byproduct");
assert.strictEqual(tripleBalance.mainProduct.name, "benzyl acetate", "3-reagent demo should select benzyl acetate as main product");
assert(Math.abs(tripleBalance.conversion - 0.9) < 0.0001, "3-reagent demo should use 90% yield/conversion basis");
assert.strictEqual(tripleBalance.residualRows.length, 3, "3-reagent demo should estimate three residual reactant streams");
assert.strictEqual(tripleModel.pairs.length, 10, "5 substances should produce 10 pairwise binary comparisons");
assert.deepStrictEqual(tripleModel.substances.map(item => item.quantity), ["0.100", "0.100", "0.258", "1.250", "1.342"], "3-reagent demo should display the post-reaction mixture rather than initial feed quantities");
assert.deepStrictEqual(tripleModel.substances.slice(0, 3).map(item => item.reactionFeedQuantity), ["1.00", "0.95", "1.10"], "Reaction balance should retain the initial feed basis behind displayed residual quantities");
assert(tripleModel.substances.every(item => separationPurePropertyDefs.every(def => String(item[def.id] || "").trim())), "3-reagent demo should fill every proposed pure-property screening field");
assert.strictEqual(Object.keys(tripleState.pairInsights).length, 10, "3-reagent demo should prefill every binary-pair evidence row");
assert(tripleModel.pairs.every(pair => pair.propertyChecks.pvap.comparable), "All demo vapor-pressure comparisons should use the same explicit temperature basis");
assert.strictEqual(productPairs.length, 4, "3-reagent demo should create four product-facing binary pairs including the salt byproduct");
assert.strictEqual(tripleBalance.rows.find(item => item.name === "triethylammonium acetate").role, "byproduct", "Balanced demo should classify the acid-capture salt as a byproduct");
assert(Math.abs(tripleBalance.rows.find(item => item.name === "triethylammonium acetate").finalMassKg - 1.342) < 0.01, "Balanced demo should generate the salt from reaction extent");
assert(tripleModel.suggestions.some(item => item.pairLabel.includes("triethylamine") && item.pairLabel.includes("benzyl acetate") && item.evidence.length), "Triethylamine/product pair should expose the KB3.1 threshold evidence that triggered it");
assert(tripleUnits.has("Evaporation") || tripleUnits.has("Distillation") || tripleUnits.has("Liquid-liquid extraction"), "3-reagent demo should suggest separation assets");
const triplePath = separationPathwayModel(g2, tripleModel);
assert.strictEqual(triplePath.pairPriorities.length, 10, "Pathway should rank every active binary pair");
assert(triplePath.pairPriorities[0].mainProductPair, "Pathway should prioritize a product-facing binary pair first");
assert(["high", "medium"].includes(triplePath.pairPriorities[0].priority), "Best binary pair should receive an explicit priority label");
const triplePathHtml = separationPathwayHtml(g2, tripleModel);
assert(triplePathHtml.includes("Candidate pathways") && triplePathHtml.includes("Build step by step"), "Pathway UI should separate screened candidates from manual route building");
assert(triplePathHtml.includes("Screening basis") && triplePathHtml.includes("phase-compatible routes") && triplePathHtml.includes("EI requires mass and energy balance data"), "Candidate mode should disclose its KB3.1 screen and the unavailable EI ranking");
assert(triplePathHtml.includes("Most complete KB3.1 match") && triplePathHtml.includes("Use as editable draft"), "Pathway UI should identify the candidate with strongest categorical KB3.1 coverage");
assert(!triplePathHtml.includes("/100") && !triplePathHtml.includes("rule fit") && !triplePathHtml.includes("Lean route"), "Pathway UI should not expose invented numeric scores or misleading optimization labels");
assert(!triplePathHtml.includes("Binary Pair Priority") && !triplePathHtml.includes("Method Coverage"), "Primary pathway view should omit the old dense method panels");
const pathwayTrackHtml = separationProcessTrackHtml("G2", tripleState, tripleModel, triplePath);
assert(pathwayTrackHtml.includes("Reaction") && pathwayTrackHtml.includes("Mixture") && pathwayTrackHtml.includes("Pathway") && pathwayTrackHtml.includes("Scale-up"), "Focused Lutze mode should expose the reaction-to-scale-up progress track");
ensureGroup("G2").separationSimulator.pathway.viewMode = "manual";
const tripleManualHtml = separationPathwayHtml(g2, separationSimulatorModel(g2));
assert(tripleManualHtml.includes("Choose the next separation") && tripleManualHtml.includes("Highest-priority screening candidate") === false, "Manual mode should focus on one stepwise route builder without a duplicate recommendation panel");
assert.strictEqual((tripleManualHtml.match(/class="pathway-option-card/g) || []).length, 3, "Manual pathway mode should initially show only the top three next steps");
assert(tripleManualHtml.includes("Show 7 more candidates") && tripleManualHtml.includes("Evidence details"), "Manual pathway mode should preserve lower-priority routes and detailed evidence behind progressive disclosure");
ensureGroup("G2").separationSimulator.pathway.viewMode = "guided";
assert(paperComplianceBadgeHtml(tripleModel).includes("Energy ranking") && paperComplianceBadgeHtml(tripleModel).includes("Enthalpy Index"), "Simulator should expose the paper-compliance badge with the energy ranking named in plain words and the paper term in its detail");
assert(paperComplianceBadgeHtml(tripleModel).includes("Method Coverage"), "Simulator should expose method coverage");
assert(paperComplianceBadgeHtml(tripleModel).includes("changes only when a pathway is applied"), "Method coverage should state that the flowsheet changes only when a pathway is applied");
assert(paperComplianceBadgeHtml(tripleModel).includes("screening priority, not an energy result"), "Method coverage should avoid presenting screening priority as an energy ranking");
assert(!/A1\.1 binary matrix|KB3\.1 PBB screen|KB3\.2 unit translation/.test(paperComplianceBadgeHtml(tripleModel).replace(/title="[^"]*"/g, "")), "Paper section codes belong in the chip tooltips, not in the visible labels");
assert(triplePath.nextOptions.every(option => option.variant.unitCandidates.length), "Selectable pathway options should carry KB3.2 unit-operation candidates");

loadTripleReactantExampleProject();
const loadedGroup = groupModel("G1");
const reactionSchedule = groupTimeSchedule(loadedGroup);
assert.strictEqual(reactionSchedule.rows.length, 4, "3-reagent demo should schedule ramp, mixing, holding, and reaction events");
assert(Math.abs(reactionSchedule.totalH - 3.5) < 0.0001, "Partially overlapping reaction events should produce a 3.5 h task duration");
assert(reactionSchedule.overlapCount > 0, "3-reagent demo should visibly demonstrate concurrent events");
assert.strictEqual(inferGroupDurationInfo(loadedGroup).source, "task timetable", "Scale-up should take inferred task duration from the timetable");
const loadedReactionBlock = state.blocks.find(block => block.id === "B1");
const loadedModel = separationSimulatorModel(loadedGroup);
const loadedScale = scaleModel();
const loadedPair = loadedModel.pairs.find(pair => [pair.a.name, pair.b.name].includes("triethylamine") && [pair.a.name, pair.b.name].includes("benzyl acetate"));
const loadedVariants = binaryRouteVariants("G1", loadedPair);
const liquidOnlyCrystallization = loadedVariants.find(item => item.title === "Crystallization route");
assert.strictEqual(state.text.includes("benzyl acetate"), true, "Top-level 3-reagent case should load source text");
assert(!liquidOnlyCrystallization || (liquidOnlyCrystallization.level === "partial" && liquidOnlyCrystallization.missing.some(item => item.includes("solid phase"))), "A melting-point ratio alone must not present liquid-mixture crystallization as a supported route");
assert.strictEqual(loadedScale.reactorSizing.source, "auto from G1 scaled MFA + group density", "3-reagent demo should auto-size the reactor from scaled MFA and density");
assert.strictEqual(loadedScale.reactorSizing.autoGroupId, "G1", "3-reagent auto-sizing should target the reaction group");
assert.strictEqual(loadedScale.reference.streamName, "benzyl acetate product", "Scale-up should choose the target product inside the selected reference block, not the block's first recovered output");
assert(Math.abs(conversionNumber(loadedScale.reactorSizing.reactorVolumeM3) - 0.005) < 0.002, "3-reagent demo should calculate a working-fill reactor volume from MFA inputs");
assert.strictEqual(conversionReactantStreams(loadedReactionBlock).length, 3, "Top-level 3-reagent case should expose three selectable conversion reagents");
assert.strictEqual(loadedReactionBlock.streams.filter(stream => stream.name.startsWith("unreacted ")).length, 3, "Top-level example should already contain the three separated stoichiometric residual streams");
// The stoichiometric salt is no longer dumped straight out of the reactor as waste: it leaves with
// the reaction mixture as an in-process intermediate and is only removed downstream, in the
// salt-rich phase of the separation step, which is how a dissolved salt actually behaves. Both ends
// of that route are asserted, so the byproduct still cannot silently disappear from the balance.
assert(
  loadedReactionBlock.streams.some(stream =>
    stream.name === "triethylammonium acetate salt" && stream.fate === "intermediate" && stream.destinationGroup),
  "Reaction block should carry the stoichiometric salt as an intermediate routed downstream"
);
assert(
  blocksInOrder().some(block => (block.streams || []).some(stream =>
    stream.name.includes("triethylammonium acetate salt") && stream.role === "waste")),
  "The stoichiometric salt should leave the process as waste at the separation step"
);
assert(["initial_temperature", "target_temperature", "holding_temperature", "thermal_ramp", "thermal_mode", "agitation_speed"].every(field => loadedReactionBlock.conditions[field]), "Reaction example should prefill temperature-control and mixing checks");
assert.strictEqual(loadedReactionBlock.conversionDetail.productStreamId, "B1-S4", "Top-level 3-reagent case should preselect the product in Conversion");
assert.strictEqual(loadedReactionBlock.conversionDetail.productAmountMode, "from reactants", "Stoichiometric demo product should be calculated from reaction inputs");
assert.strictEqual(conversionProductStream(loadedReactionBlock).name, "benzyl acetate", "Top-level 3-reagent case should expose benzyl acetate as the Conversion product");
// The product stream now carries its actual amount in quantity, with the 100% theoretical basis kept
// alongside it in conversionBaseQuantity, rather than storing the theoretical figure in quantity and
// applying conversion at display time. The relationship under test is unchanged: the actual amount
// is the theoretical basis at the declared 90% conversion.
const loadedProductStream = conversionProductStream(loadedReactionBlock);
assert(
  Math.abs(conversionNumber(loadedProductStream.conversionBaseQuantity) * 0.9 - conversionNumber(loadedProductStream.quantity)) < 0.01,
  "Product amount should be the theoretical basis taken at the declared 90% conversion"
);
const loadedConversion = conversionCalculationModel(loadedReactionBlock);
assert.strictEqual(loadedConversion.conversionPercent, 90, "Conversion modal should load explicit reactant conversion");
assert.strictEqual(loadedConversion.selectivityPercent, 100, "Conversion modal should load explicit product selectivity");
assert(loadedReactionBlock.conversionDetail.reactionEquation.includes("benzyl alcohol") && loadedReactionBlock.conversionDetail.reactionEquation.includes("benzyl acetate"), "Reaction example should preserve a user-visible equation");
assert(loadedReactionBlock.streams.filter(stream => stream.name.startsWith("unreacted ")).every(stream => stream.role === "output" && stream.fate === "intermediate"), "Unreacted reagents should remain reaction-effluent components until separation");
const actualProductBlock = {
  id: "BT",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BT-S1", name: "reactant A", quantity: "1", unit: "kg", phase: "L" }),
    createStream("output", { id: "BT-S2", name: "actual product", quantity: "0.90", unit: "kg", phase: "L", fate: "product" })
  ],
  conditions: { conversion_yield: "90" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BT-S2", productAmountMode: "actual", byproducts: [] }
};
let actualCalc = conversionCalculationModel(actualProductBlock);
assert(Math.abs(actualCalc.productMade - 0.9) < 0.0001, "Actual produced product amount should not be multiplied by yield again");
assert(Math.abs(actualCalc.productQty - 1.0) < 0.0001, "Actual produced amount should back-calculate the theoretical product basis");
actualProductBlock.streams.find(stream => stream.id === "BT-S2").quantity = "100";
actualProductBlock.conversionDetail.productAmountMode = "actual";
actualCalc = conversionCalculationModel(actualProductBlock);
assert(Math.abs(actualCalc.productMade - 100) < 0.0001, "100 kg entered as reported product at 90% conversion should preview 100 kg product");
assert(Math.abs(actualCalc.productQty - 111.111) < 0.002, "100 kg reported product at 90% conversion should back-calculate 111.111 kg theoretical basis");
assert(conversionPreviewTableHtml(actualCalc).includes("actual product"), "Conversion preview should render simulated output rows before applying");
actualProductBlock.conversionDetail.productAmountMode = "theoretical";
actualCalc = conversionCalculationModel(actualProductBlock);
assert(Math.abs(actualCalc.productMade - 90) < 0.0001, "100 kg entered as theoretical basis at 90% conversion should preview 90 kg product");
const balancedYieldEditBlock = {
  id: "BYE",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BYE-S1", name: "reactant A", quantity: "1", unit: "kg", phase: "L" }),
    createStream("output", { id: "BYE-S2", name: "product P", quantity: "100", unit: "kg", phase: "L", fate: "product" })
  ],
  conditions: { conversion_yield: "90" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BYE-S2", productAmountMode: "actual", byproducts: [] }
};
applyConversionBalanceStreams(balancedYieldEditBlock);
assert.strictEqual(balancedYieldEditBlock.conversionDetail.productAmountMode, "theoretical", "After balance, product edits should retain the theoretical basis so yield changes can recalculate production");
updateConversionPercent(balancedYieldEditBlock, "75");
assert(Math.abs(conversionCalculationModel(balancedYieldEditBlock).productMade - 83.333) < 0.002, "Lowering yield after balance should reduce the calculated product amount from the saved theoretical basis");
const stoichProductBlock = {
  id: "BST",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BST-S1", name: "excess A", quantity: "1.5", unit: "mol", phase: "L", stoichCoeff: "1", mw: "100" }),
    createStream("input", { id: "BST-S2", name: "limiting B", quantity: "1", unit: "mol", phase: "L", stoichCoeff: "1", mw: "80" }),
    createStream("output", { id: "BST-S3", name: "product P", quantity: "0.95", unit: "mol", phase: "L", fate: "product", stoichCoeff: "1", mw: "180" })
  ],
  conditions: { conversion_yield: "95" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BST-S3", productAmountMode: "actual", balanceMethod: "stoichiometric", byproducts: [] }
};
const stoichCalc = conversionCalculationModel(stoichProductBlock);
const excessRow = stoichCalc.reactantRows.find(row => row.stream.name === "excess A");
const limitingRow = stoichCalc.reactantRows.find(row => row.stream.name === "limiting B");
assert.strictEqual(stoichCalc.stoichReady, true, "Stoichiometric balance should be ready for mol inputs and coefficients");
assert.strictEqual(limitingRow.limiting, true, "Stoichiometric balance should identify the limiting reagent");
assert(Math.abs(excessRow.leftover - 0.55) < 0.0001, "Stoichiometric balance should leave 0.55 mol of the excess reagent");
assert(Math.abs(limitingRow.leftover - 0.05) < 0.0001, "Stoichiometric balance should leave 0.05 mol of the limiting reagent");
assert(Math.abs(excessRow.leftoverKg - 0.055) < 0.0001, "Stoichiometric residual should convert excess reagent mol to kg using MW");
assert(!conversionPreviewTableHtml(stoichCalc).includes("data-stage-conversion-residual"), "Reaction preview should avoid a second per-row save workflow");
applyConversionBalanceStreams(stoichProductBlock);
const generatedStoichExcess = stoichProductBlock.streams.find(stream => stream.name === "unreacted excess A");
assert.strictEqual(generatedStoichExcess.unit, "kg", "Saved stoichiometric residual should be written as kg for MFA/Lutze");
assert(Math.abs(conversionNumber(generatedStoichExcess.quantity) - 0.055) < 0.0001, "Saved excess residual should use MW-converted kg amount");
assert(generatedStoichExcess.note.includes("0.55 mol"), "Saved residual note should preserve the original molar trace");
actualProductBlock.conversionDetail = {
  productStreamId: "BT-S2",
  productAmountMode: "actual",
  byproducts: [
    { id: "bp-actual", name: "formed side product", basis: "actual", amount: "0.20", unit: "kg", role: "byproduct" },
    { id: "bp-residual", name: "recoverable residual fraction", basis: "residual pool %", percent: "20", role: "residual" }
  ]
};
actualCalc = conversionCalculationModel(actualProductBlock);
assert(Math.abs(actualCalc.byproductRows.find(row => row.id === "bp-actual").mass - 0.2) < 0.0001, "Actual byproduct amount should be independent from the unconverted reagent pool");
assert(Math.abs(actualCalc.byproductRows.find(row => row.id === "bp-residual").mass - 0.02) < 0.0001, "Residual outlet percent should be normalized on the unconverted reagent pool");
assert(Math.abs(actualCalc.wasteMass - 0.08) < 0.0001, "Only residual-pool allocations should reduce the unrouted residual remainder");
const residualAllocationBlock = {
  id: "BRA",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BRA-S1", name: "reactant A", quantity: "1", unit: "kg", phase: "L" }),
    createStream("input", { id: "BRA-S2", name: "reactant B", quantity: "1", unit: "kg", phase: "L" }),
    createStream("output", { id: "BRA-S3", name: "product P", quantity: "1.8", unit: "kg", phase: "L", fate: "product" })
  ],
  conditions: { conversion_yield: "90" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: {
    productStreamId: "BRA-S3",
    productAmountMode: "actual",
    byproducts: [{ id: "BRA-RO1", name: "recoverable residual cut", basis: "residual pool %", percent: "25", role: "residual" }]
  }
};
const residualAllocationCalc = conversionCalculationModel(residualAllocationBlock);
assert(Math.abs(residualAllocationCalc.unroutedResidualFraction - 0.75) < 0.0001, "Named residual outlets should reduce the individual unrouted residual fraction");
applyConversionBalanceStreams(residualAllocationBlock);
const residualAllocationA = residualAllocationBlock.streams.find(stream => stream.name === "unreacted reactant A");
const residualCut = residualAllocationBlock.streams.find(stream => stream.name === "recoverable residual cut");
assert(Math.abs(conversionNumber(residualAllocationA.quantity) - 0.075) < 0.0001, "Individual residual streams should be reduced by residual-pool outlet allocations");
assert(residualCut && residualCut.role === "waste" && residualCut.fate === "purge", "Named residual outlet should be written as a purge/recovery outlet, not as a formed byproduct");
const fromReactantsBlock = {
  ...actualProductBlock,
  streams: [
    createStream("input", { id: "BR-S1", name: "reactant A", quantity: "1", unit: "kg", phase: "L", mw: "100" }),
    createStream("output", { id: "BR-S2", name: "product B", quantity: "", unit: "kg", phase: "L", fate: "product", mw: "200" })
  ],
  conversionDetail: { productStreamId: "BR-S2", productAmountMode: "from reactants", byproducts: [] }
};
const fromReactantsCalc = conversionCalculationModel(fromReactantsBlock);
assert(Math.abs(fromReactantsCalc.productQty - 2.0) < 0.0001, "Reactant-derived mode should estimate 100% product basis from limiting reactant and MW");
assert(Math.abs(fromReactantsCalc.productMade - 1.8) < 0.0001, "Reactant-derived mode should apply yield only after calculating theoretical basis");
fromReactantsBlock.conversionDetail.productAmountMode = "";
assert.strictEqual(conversionProductAmountMode(fromReactantsBlock, fromReactantsBlock.streams[1]), "from reactants", "Blank product quantity should default to reactant-derived calculation rather than actual zero product");
const stoichProductCoeffBlock = {
  id: "BPC",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BPC-S1", name: "reactant A", quantity: "2", unit: "mol", phase: "L", stoichCoeff: "1", mw: "100" }),
    createStream("output", { id: "BPC-S2", name: "product P", quantity: "", unit: "kg", phase: "L", fate: "product", stoichCoeff: "2", mw: "50" })
  ],
  conditions: { conversion_yield: "100" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BPC-S2", productAmountMode: "from reactants", balanceMethod: "stoichiometric", byproducts: [] }
};
const stoichProductCoeffCalc = conversionCalculationModel(stoichProductCoeffBlock);
assert.strictEqual(stoichProductCoeffCalc.stoichReady, true, "Product coefficient case should have ready stoichiometric reagent data");
assert(Math.abs(stoichProductCoeffCalc.productQty - 0.2) < 0.0001, "Product coefficient and product MW should affect product mass from reactants");
const autoStoichBlock = JSON.parse(JSON.stringify(actualProductBlock));
autoStoichBlock.streams[0].stoichCoeff = "1";
autoStoichBlock.streams[0].mw = "100";
autoStoichBlock.streams[1].stoichCoeff = "1";
autoStoichBlock.streams[1].mw = "200";
setConversionBalanceMethod(autoStoichBlock, "stoichiometric");
assert.strictEqual(autoStoichBlock.conversionDetail.productAmountMode, "from reactants", "Selecting stoichiometric balance should switch product mass to automatic input-derived mode");
assert(Math.abs(conversionCalculationModel(autoStoichBlock).productMade - 1.8) < 0.0001, "Automatic stoichiometric mode should calculate product kg from input moles, MW, coefficients, and yield");
autoStoichBlock.streams[0].mw = "";
const incompleteStoich = conversionCalculationModel(autoStoichBlock);
assert.strictEqual(incompleteStoich.canCalculateFromReactants, false, "Stoichiometric mode must not invent product kg when a required reagent MW is missing");
assert(incompleteStoich.stoichGaps.some(gap => gap.includes("MW")), "Stoichiometric model should identify the exact missing MW field");
assert(conversionNavigationHtml(incompleteStoich, "outputs").includes("needs-attention") && conversionNavigationHtml(incompleteStoich, "outputs").includes(">!</span>"), "Reaction-input navigation should show a persistent exclamation mark when stoichiometric data are incomplete");
assert(conversionAutomaticProductHtml(incompleteStoich).includes("Product calculation needs reaction-input data"), "Incomplete automatic balance should provide a direct route to Reaction inputs");
const nonReactiveInputBlock = {
  id: "BNR",
  groupId: "",
  text: "React A in toluene with palladium catalyst to form P.",
  behavior: "reaction",
  phenomena: ["R(L)", "M(L)"],
  streams: [
    createStream("input", { id: "BNR-S1", name: "reactant A", quantity: "1", unit: "mol", phase: "L", stoichCoeff: "1", mw: "100" }),
    createStream("input", { id: "BNR-S2", name: "toluene solvent", quantity: "2", unit: "kg", phase: "L" }),
    createStream("input", { id: "BNR-S3", name: "palladium catalyst", quantity: "0.05", unit: "kg", phase: "S" }),
    createStream("output", { id: "BNR-S4", name: "product P", quantity: "0.09", unit: "kg", phase: "L", fate: "product", stoichCoeff: "1", mw: "100" })
  ],
  conditions: { conversion_yield: "90" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BNR-S4", productAmountMode: "actual", balanceMethod: "stoichiometric", byproducts: [] }
};
const nonReactiveCalc = conversionCalculationModel(nonReactiveInputBlock);
assert.strictEqual(nonReactiveCalc.reactantRows.length, 1, "Only reactants should enter conversion stoichiometry");
assert.strictEqual(nonReactiveCalc.nonReactiveRows.length, 2, "Solvent/catalyst inputs should stay non-reactive in conversion");
assert.strictEqual(streamReactionRole(createStream("input", { id: "ETH", name: "ethanol" })), "reactant", "Common solvent names should not be excluded unless the stream is explicitly marked as solvent");
const roleMentions = materialMentionsFromText("Dissolve in 10 mL toluene and add 0.1 g palladium catalyst and 1 mol ethanol.");
assert.strictEqual(roleMentions.find(item => item.name === "toluene")?.reactionRole, "solvent", "Protocol phrasing should classify solvent-like mentions as solvent");
assert.strictEqual(roleMentions.find(item => item.name === "palladium")?.reactionRole, "catalyst", "Protocol phrasing should classify catalyst-labelled mentions as catalyst");
assert.strictEqual(roleMentions.find(item => item.name === "ethanol")?.reactionRole, "", "Plain chemical mentions should not be guessed as non-reactive by name alone");
assert(streamSuggestionRailHtml({ text: "Dissolve in 10 mL toluene.", streams: [] }, createStream("input", { id: "SUG-S1", name: "", reactionRole: "reactant" }), "input").includes('data-suggestion-reaction-role="solvent"'), "Input suggestions should carry the inferred reaction role into the UI");
assert(conversionPreviewTableHtml(nonReactiveCalc).includes("Non-reactive"), "Conversion preview should show non-reactive inputs without consuming them");
applyConversionBalanceStreams(nonReactiveInputBlock);
assert(nonReactiveInputBlock.streams.some(stream => stream.name === "unreacted reactant A"), "Reactive residual should be generated");
assert(!nonReactiveInputBlock.streams.some(stream => stream.name === "unreacted toluene solvent"), "Solvent should not be generated as unreacted waste");
assert(streamRowHtml(nonReactiveInputBlock.streams.find(stream => stream.name === "toluene solvent"), "reactant", "input", nonReactiveInputBlock).includes("Reaction role"), "Input editor should expose reaction role classification");
const impossibleProductBlock = {
  id: "BIMP",
  groupId: "",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BIMP-S1", name: "A", quantity: "100", unit: "mol", phase: "L", stoichCoeff: "1", mw: "100" }),
    createStream("input", { id: "BIMP-S2", name: "B", quantity: "100", unit: "mol", phase: "L", stoichCoeff: "1", mw: "100" }),
    createStream("output", { id: "BIMP-S3", name: "P", quantity: "10", unit: "kg", phase: "L", fate: "product", stoichCoeff: "1", mw: "100" })
  ],
  conditions: { conversion_yield: "95" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BIMP-S3", productAmountMode: "actual", balanceMethod: "stoichiometric", byproducts: [] }
};
assert(conversionValidationIssues(conversionCalculationModel(impossibleProductBlock)).some(issue => issue.severity === "error" && issue.text.includes("exceeds the stoichiometric maximum")), "Stoichiometric conversion should reject product/yield bases that exceed reagent capacity");
const esterificationClosureBlock = {
  id: "BEST",
  groupId: "",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BEST-S1", name: "acetic acid", quantity: "1", unit: "mol", phase: "L", stoichCoeff: "1", mw: "60.052" }),
    createStream("input", { id: "BEST-S2", name: "ethanol", quantity: "1.5", unit: "mol", phase: "L", stoichCoeff: "1", mw: "46.069" }),
    createStream("input", { id: "BEST-S3", name: "toluene solvent", quantity: "1", unit: "kg", phase: "L" }),
    createStream("input", { id: "BEST-S4", name: "sulfuric acid catalyst", quantity: "0.01", unit: "kg", phase: "L" }),
    createStream("output", { id: "BEST-S5", name: "ethyl acetate", quantity: "", unit: "kg", phase: "L", fate: "product", stoichCoeff: "1", mw: "88.106" })
  ],
  conditions: { conversion_yield: "90" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: {
    productStreamId: "BEST-S5",
    productAmountMode: "from reactants",
    balanceMethod: "stoichiometric",
    byproducts: [{ id: "BEST-BP1", name: "water", basis: "generated by stoichiometry", stoichCoeff: "1", mw: "18.015", unit: "kg", role: "byproduct" }]
  }
};
const esterificationClosure = conversionCalculationModel(esterificationClosureBlock);
assert.strictEqual(esterificationClosure.reactantRows.length, 2, "Esterification example should keep ethanol as a reagent, not a guessed solvent");
assert.strictEqual(esterificationClosure.nonReactiveRows.length, 2, "Esterification example should keep explicit solvent/catalyst non-reactive");
assert(Math.abs(esterificationClosure.byproductRows.find(row => row.name === "water").mass - 0.0162135) < 0.0001, "Stoichiometric byproduct should be calculated from reaction extent and MW");
assert.strictEqual(esterificationClosure.massClosure.status, "closed", "Esterification example should close when water byproduct is declared");
assert(!conversionValidationIssues(esterificationClosure).some(issue => issue.text.includes("flat bases")), "Stoichiometric byproduct should not trigger the flat byproduct warning");
const esterificationApplyBlock = JSON.parse(JSON.stringify(esterificationClosureBlock));
applyConversionBalanceStreams(esterificationApplyBlock);
const generatedWater = esterificationApplyBlock.streams.find(stream => stream.name === "water");
// Stoichiometric byproducts are materialised as in-process intermediates travelling with the
// reaction mixture, not as waste declared at the reactor: the water of an esterification leaves with
// the mixture and is only removed downstream. What still matters, and is asserted here, is that
// applying the balance writes the byproduct into the MFA at all, with its computed mass.
assert(
  generatedWater && generatedWater.fate === "intermediate" && conversionNumber(generatedWater.quantity) > 0,
  "Stoichiometric water byproduct should be written into the MFA as an in-process intermediate on apply"
);
assert(Math.abs(conversionNumber(generatedWater.quantity) - 0.0162135) < 0.001, "Applied stoichiometric byproduct stream should use the calculated mass rounded for MFA display");
const esterificationMissingWaterBlock = {
  ...esterificationClosureBlock,
  conversionDetail: { ...esterificationClosureBlock.conversionDetail, byproducts: [] }
};
assert.strictEqual(conversionCalculationModel(esterificationMissingWaterBlock).massClosure.status, "open", "Reaction mass closure should open when a stoichiometric byproduct is missing");
const esterificationMissingByproductMwBlock = {
  ...esterificationClosureBlock,
  conversionDetail: {
    ...esterificationClosureBlock.conversionDetail,
    byproducts: [{ id: "BEST-BP2", name: "water", basis: "generated by stoichiometry", stoichCoeff: "1", unit: "kg", role: "byproduct" }]
  }
};
assert(conversionValidationIssues(conversionCalculationModel(esterificationMissingByproductMwBlock)).some(issue => issue.text.includes("needs MW")), "Stoichiometric byproduct should warn when MW is missing for mass units");
const hydrogenationClosureBlock = {
  id: "BHYD",
  groupId: "",
  behavior: "reaction",
  phenomena: ["R(L)", "M(L)"],
  streams: [
    createStream("input", { id: "BHYD-S1", name: "styrene", quantity: "1", unit: "mol", phase: "L", stoichCoeff: "1", mw: "104.15" }),
    createStream("input", { id: "BHYD-S2", name: "hydrogen", quantity: "1.2", unit: "mol", phase: "V", stoichCoeff: "1", mw: "2.016" }),
    createStream("input", { id: "BHYD-S3", name: "Pd/C catalyst", quantity: "0.02", unit: "kg", phase: "S" }),
    createStream("output", { id: "BHYD-S4", name: "ethylbenzene", quantity: "", unit: "kg", phase: "L", fate: "product", stoichCoeff: "1", mw: "106.17" })
  ],
  conditions: { conversion_yield: "95" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BHYD-S4", productAmountMode: "from reactants", balanceMethod: "stoichiometric", byproducts: [] }
};
const hydrogenationClosure = conversionCalculationModel(hydrogenationClosureBlock);
assert.strictEqual(hydrogenationClosure.nonReactiveRows.length, 1, "Hydrogenation catalyst should be non-reactive");
assert.strictEqual(hydrogenationClosure.massClosure.status, "closed", "Hydrogenation example should close from product plus unreacted reagents");
const unavailableReactantCalcBlock = {
  ...fromReactantsBlock,
  streams: [
    createStream("input", { id: "BU-S1", name: "reactant A", quantity: "1", unit: "kg", phase: "L" }),
    createStream("output", { id: "BU-S2", name: "reported product", quantity: "1.89", unit: "kg", phase: "L", fate: "product" })
  ],
  conversionDetail: { productStreamId: "BU-S2", productAmountMode: "from reactants", byproducts: [] }
};
const unavailableReactantCalc = conversionCalculationModel(unavailableReactantCalcBlock);
assert.strictEqual(unavailableReactantCalc.requestedProductMode, "from reactants", "The model should remember when reactant-derived mode was requested");
assert.strictEqual(unavailableReactantCalc.productMode, "actual", "Reactant-derived mode without MW should fall back to reported product amount when product quantity exists");
assert(Math.abs(unavailableReactantCalc.productMade - 1.89) < 0.0001, "Fallback from unavailable reactant calculation should keep the reported product amount");
assert(conversionValidationIssues(unavailableReactantCalc).some(issue => issue.severity === "warn"), "Unavailable reactant-derived mode should surface a warning");
assert(conversionYieldBasisStatementHtml(unavailableReactantCalc, "1.89").includes("amount obtained at 90% yield"), "Yield statement should bind reported product quantity to the selected yield");
assert(renderConversionModal.toString().includes("Reaction performance basis"), "Conversion modal should start with the reaction-performance basis section");
assert(renderConversionModal.toString().includes("reactionConversionPercent") && renderConversionModal.toString().includes("reactionSelectivityPercent"), "Conversion modal should edit yield, conversion, and selectivity separately");
assert(conversionNavigationHtml(loadedConversion, "performance").includes("Performance") && conversionNavigationHtml(loadedConversion, "performance").includes("Reaction inputs") && conversionNavigationHtml(loadedConversion, "performance").includes("Review &amp; save"), "Reaction balance should expose a three-step navigation with an explicit final action");
assert(renderConversionModal.toString().includes("conversion-step-actions") && renderConversionModal.toString().includes("Review effluent components before saving"), "Reaction balance should keep contextual Back, Continue, and Save actions in a stable workflow action bar");
assert(renderConversionModal.toString().includes("Reference amount"), "Conversion modal should expose editable product reference amount");
assert(streamDataStatuses.includes("manual override"), "Stream data status should support explicit manual overrides");
assert(conversionDataQualityHtml(unavailableReactantCalc).includes("Conversion data provenance"), "Conversion modal should expose compact data provenance");
assert(renderConversionModal.toString().indexOf("Reaction inputs") < renderConversionModal.toString().indexOf("Reaction effluent composition"), "Reaction balance should classify inputs before showing the effluent preview");
assert(renderConversionModal.toString().includes("conversionAdvancedControlsHtml"), "Conversion modal should move product stoichiometry fields into an advanced section");
assert(conversionAdvancedControlsHtml(conversionCalculationModel(stoichProductCoeffBlock)).includes("Product coeff"), "Advanced conversion controls should expose editable product stoichiometric coefficient");
assert(conversionAdvancedControlsHtml(conversionCalculationModel(stoichProductCoeffBlock)).includes("Product MW"), "Advanced conversion controls should expose editable product MW");
assert(renderConversionModal.toString().includes("Reaction effluent composition"), "Reaction balance should show the shared effluent components before saving");
assert(renderConversionModal.toString().includes("Save reaction balance") && renderConversionModal.toString().indexOf("conversion-apply-bar") < renderConversionModal.toString().indexOf("Optional outlets"), "Reaction balance should expose its primary save action at the top of the final step");
assert(conversionOutletBasisOptions("generated by stoichiometry").includes("Generated by stoichiometry"), "Conversion outlets should support stoichiometrically generated byproducts");
assert(renderConversionModal.toString().includes("data-conversion-byproduct-stoich"), "Conversion modal should expose byproduct stoichiometric coefficient inputs");
assert(renderConversionModal.toString().includes("data-conversion-byproduct-mw"), "Conversion modal should expose byproduct MW inputs");
setConversionProductQuantity(unavailableReactantCalcBlock, "10");
assert.strictEqual(unavailableReactantCalcBlock.conversionDetail.productAmountMode, "actual", "Editing quantity after unavailable reactant-derived mode should persist the reported-amount fallback");
assert.strictEqual(unavailableReactantCalcBlock.streams.find(stream => stream.id === "BU-S2").quantity, "10", "Reported-amount fallback should edit the product quantity");
const inferredTheoreticalBlock = {
  id: "BI",
  behavior: "reaction",
  phenomena: ["R(L)"],
  streams: [
    createStream("input", { id: "BI-S1", name: "reactant A", quantity: "10", unit: "kg", phase: "L" }),
    createStream("output", { id: "BI-S2", name: "product C", quantity: "9", conversionBaseQuantity: "10", unit: "kg", phase: "L", fate: "product" })
  ],
  conditions: { conversion_yield: "90" },
  conditionUnits: { conversion_yield: "%" },
  conversionDetail: { productStreamId: "BI-S2", productAmountMode: "", byproducts: [] }
};
assert.strictEqual(conversionProductAmountMode(inferredTheoreticalBlock, inferredTheoreticalBlock.streams[1]), "theoretical", "Saved conversion basis should infer theoretical mode");
setConversionProductQuantity(inferredTheoreticalBlock, "20");
assert.strictEqual(inferredTheoreticalBlock.conversionDetail.productAmountMode, "theoretical", "Editing an inferred theoretical product should persist the inferred mode");
assert.strictEqual(inferredTheoreticalBlock.conversionDetail.productBasisQuantity, "20", "Editing an inferred theoretical product should update the theoretical basis, not the produced amount");
assert(Math.abs(conversionCalculationModel(inferredTheoreticalBlock).productMade - 18) < 0.0001, "Edited theoretical basis should recalculate produced product");
assert(blockLutzeReactionSeparationLaunchHtml(loadedReactionBlock).includes("Lutze/Garg screening"), "Grouped reaction task block should expose the screening launcher");
const draftInputStream = createStream("input", { id: "B1-SD", name: "", editing: true });
assert(!streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes('data-suggestion-name="benzyl alcohol"'), "Input editor should not suggest materials already present as inputs in this step");
assert(streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes("Chemical properties for Lutze / sizing"), "Stream editor should expose optional chemical properties for Lutze and sizing");
assert(streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes("stream-field span-4"), "Stream editor should give the material field the full stream-card width");
assert(!streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes('stream-chemical span-2" open'), "New empty streams should not auto-open the chemical properties panel");
assert(streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes("data-fetch-stream-pubchem"), "Stream editor should expose a PubChem fetch action");
assert(!streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes("Fate, recycle & notes"), "Stream editor should not expose the old noisy routing section title");
assert(!streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes("Routing / notes"), "Stream editor should remove routing and notes from the visible stream form");
assert(renderConversionModal.toString().includes("conversionAnalysisHtml"), "Conversion modal should render a compact conversion analysis section");
assert(conversionAnalysisHtml(conversionCalculationModel(nonReactiveInputBlock)).includes("non-reactive"), "Conversion analysis should summarize non-reactive input count");
assert(conversionAnalysisHtml(conversionCalculationModel(nonReactiveInputBlock)).includes("title="), "Conversion analysis should expose hover explanations");
const draftOutletStream = createStream("output", { id: "B1-SO", name: "", editing: true });
assert(streamSectionHtml(loadedReactionBlock, "outlet").includes("+ Outlet"), "Block editor should expose one unified outlet add action");
assert(streamSectionHtml(loadedReactionBlock, "input").includes('data-stream-section-role="input"'), "Input stream section should expose a stable scroll-restore role");
assert(streamSectionHtml(loadedReactionBlock, "outlet").includes('data-stream-section-role="outlet"'), "Outlet stream section should expose a stable scroll-restore role");
assert(streamRowHtml(draftOutletStream, "product", "outlet", loadedReactionBlock).includes("Outlet type"), "Outlet editor should classify product, recovery, and waste outlets in one place");
assert.strictEqual(streamRoleForFate("vent", "output"), "waste", "Vent outlets should keep waste semantics internally");
assert.strictEqual(streamRoleForFate("product", "waste"), "output", "Product outlets should keep output semantics internally");
assert(renderStepFlowInspector.toString().includes("captureStepFlowStreamViewport"), "Step flow inspector should preserve stream scroll/focus across rerenders");
assert(renderStepFlowInspector.toString().includes("restoreStepFlowStreamViewport"), "Step flow inspector should restore stream scroll/focus after rerenders");
assert(applyStreamSuggestion.toString().includes("pendingStepStreamFocusId"), "Applying a stream suggestion should keep the edited stream in view");
const benzylInput = loadedReactionBlock.streams.find(stream => stream.role === "input" && stream.name === "benzyl alcohol");
benzylInput.mw = "108.14";
benzylInput.tb = "478.15";
benzylInput.density = "1044";
syncSeparationSimulatorSubstances(loadedGroup);
const benzylSubstance = separationSimulatorModel(loadedGroup).substances.find(item => item.name === "benzyl alcohol");
assert.strictEqual(benzylSubstance.mw, "108.14", "Lutze substances should inherit MW entered on MFA streams");
assert.strictEqual(benzylSubstance.tb, "478.15", "Lutze substances should inherit boiling point entered on MFA streams");
assert(streamRowHtml(loadedReactionBlock.streams.find(stream => stream.role === "input" && stream.name === "benzyl alcohol"), "reactant", "input", loadedReactionBlock).includes("Use as output"), "Saved input cards should remain reusable as outputs");
const outputsBeforeCopy = loadedReactionBlock.streams.filter(stream => stream.role === "output").length;
copyInputsToOutputs(loadedReactionBlock);
assert(loadedReactionBlock.streams.filter(stream => stream.role === "output").length >= outputsBeforeCopy, "Copy inputs should reuse matching reaction-effluent components instead of duplicating them");
assert(loadedReactionBlock.streams.some(stream => stream.role === "output" && cleanSubstanceName(stream.name) === "triethylamine"), "Copy inputs should preserve or reuse each input material in outputs");
assert.strictEqual(loadedReactionBlock.streams.find(stream => stream.role === "output" && cleanSubstanceName(stream.name) === "benzyl alcohol").mw, "108.14", "Copy inputs should preserve stream chemical properties");
const outputCountBeforeSingleCopy = loadedReactionBlock.streams.filter(stream => stream.role === "output").length;
copyOneInputToOutput(loadedReactionBlock, "B1-S1");
assert.strictEqual(loadedReactionBlock.streams.filter(stream => stream.role === "output").length, outputCountBeforeSingleCopy, "Copying one already-present input should edit the existing output rather than duplicating it");
assert(conditionPanelHtml(loadedReactionBlock).includes("condition-chip") && !conditionPanelHtml(loadedReactionBlock).includes("condition-chip-button"), "Collapsed conditions should summarize yield without duplicating the reaction-balance action");
assert(conversionQuickActionHtml(loadedReactionBlock).includes("Reaction balance · 90% yield"), "Reaction block header should expose a direct reaction-balance action");
updateConversionPercent(loadedReactionBlock, "75");
assert.strictEqual(ensureGroup("G1").separationSimulator.reactionBalance.yieldPercent, "75", "Editing reported reaction yield should sync the group reaction balance without overwriting conversion");
updateConversionPercent(loadedReactionBlock, "90");
assert.strictEqual(ensureConversionDetail(loadedReactionBlock).balanceMethod, "stoichiometric", "3-reagent demo should use a stoichiometric reaction balance");
assert(ensureConversionDetail(loadedReactionBlock).byproducts.some(item => item.name === "triethylammonium acetate" && item.basis === "generated by stoichiometry"), "3-reagent demo should declare the balanced salt byproduct");
applyConversionBalanceStreams(loadedReactionBlock);
const balancedProduct = conversionProductStream(loadedReactionBlock);
const generatedResiduals = loadedReactionBlock.streams.filter(stream => stream.role === "output" && stream.name.startsWith("unreacted "));
const generatedByproduct = loadedReactionBlock.streams.find(stream => stream.role === "output" && stream.name === "triethylammonium acetate");
const generatedWaste = loadedReactionBlock.streams.find(stream => stream.role === "waste" && stream.name === "unassigned reaction waste");
const balancedModel = separationSimulatorModel(groupModel("G1"));
assert(Math.abs(conversionNumber(balancedProduct.quantity) - 1.25) < 0.01, "Balance action should write the formed product amount into the output stream");
assert.strictEqual(generatedResiduals.length, 3, "Balance action should create one residual stream for each unreacted reagent");
assert(generatedByproduct && Math.abs(conversionNumber(generatedByproduct.quantity) - 1.343) < 0.01, "Balance action should create the stoichiometric salt byproduct stream");
assert(!generatedWaste, "Balance action should not create a generic unassigned waste stream that duplicates the residual reagents");
assert(balancedModel.substances.some(item => item.name === "triethylammonium acetate" && item.role === "byproduct"), "Balance action should pass declared byproducts into Lutze substances");
const linkedBalanceHtml = reactionBalanceHtml(groupModel("G1"), balancedModel);
assert(linkedBalanceHtml.includes("Linked to B1") && linkedBalanceHtml.includes("data-edit-linked-reaction"), "Lutze should point back to the linked Reaction Balance instead of exposing a second source of truth");
assert(!linkedBalanceHtml.includes("data-save-residual-components"), "Linked Lutze reaction context should not expose a duplicate residual-save action");
const balancedBenzylAlcohol = balancedModel.substances.find(item => item.name === "benzyl alcohol");
assert(Math.abs(conversionNumber(balancedBenzylAlcohol.quantity) - 0.1) < 0.001, "Lutze reactant quantity should update to the unreacted residual after balancing");
assert.strictEqual(balancedBenzylAlcohol.reactionFeedQuantity, "1.00", "Lutze should retain the original reaction-feed basis behind a generated residual");
assert(Math.abs(reactionBalanceModel(groupModel("G1"), balancedModel).rows.find(item => item.name === "benzyl alcohol").finalMassKg - 0.1) < 0.001, "Lutze reaction balance should not apply conversion a second time to a displayed residual quantity");
assert.strictEqual(balancedBenzylAlcohol.residualOf, "benzyl alcohol", "Lutze should tag unreacted material as a residual of the canonical chemical");
assert.strictEqual(balancedBenzylAlcohol.chemicalKey, "benzyl alcohol", "Residual substance should keep the canonical chemical key");
assert.strictEqual(generatedResiduals.find(stream => stream.name === "unreacted benzyl alcohol").mw, "108.14", "Generated unreacted effluent component should inherit pure-component properties from the reactant");
assert.strictEqual(generatedResiduals.find(stream => stream.name === "unreacted benzyl alcohol").density, "1044", "Generated unreacted effluent component should inherit density from the reactant");
assert(separationSubstanceRowHtml("G1", balancedBenzylAlcohol).includes("same properties as benzyl alcohol"), "Residual substance cards should show that chemical properties are shared");
assert(separationSubstanceRowHtml("G1", balancedBenzylAlcohol).includes("sep-substance-core") && separationSubstanceRowHtml("G1", balancedBenzylAlcohol).includes("sep-substance-advanced"), "Substance cards should keep decision fields visible and move scientific properties behind progressive disclosure");
assert(separationSubstanceRowHtml("G1", balancedBenzylAlcohol).includes("Pvap measurement T"), "Substance cards should expose vapor-pressure measurement temperature");
assert(separationSubstanceRowHtml("G1", balancedBenzylAlcohol).includes("Property evidence"), "Substance cards should expose property provenance status");
syncSeparationSimulatorSubstances(groupModel("G1"));
assert(Math.abs(conversionNumber(ensureGroup("G1").separationSimulator.substances.find(item => item.name === "benzyl alcohol").quantity) - 0.1) < 0.001, "Sync should not sum initial feed mass with the post-conversion residual quantity");
const duplicateResidual = normalizeSeparationSubstance({ id: "CSX", name: "unreacted benzyl alcohol", residualOf: "benzyl alcohol", chemicalKey: "benzyl alcohol", role: "reactant", fate: "recover" });
ensureGroup("G1").separationSimulator.substances.push(duplicateResidual);
balancedBenzylAlcohol.tb = "480";
propagateSeparationChemicalProperties("G1", balancedBenzylAlcohol, "tb");
assert.strictEqual(ensureGroup("G1").separationSimulator.substances.find(item => item.id === "CSX").tb, "480", "Editing a pure property should propagate to linked residual substances");
const outputMissingMass = createStream("output", { id: "B1-SX", name: "test product", quantity: "", unit: "L", phase: "L", editing: true });
assert(streamRowHtml(outputMissingMass, "product", "output", loadedReactionBlock).includes("Use conversion"), "Reaction outputs with missing/non-mass quantity should expose the conversion shortcut");
assert.deepStrictEqual(loadedModel.substances.map(item => item.name), ["benzyl alcohol", "acetic anhydride", "triethylamine", "benzyl acetate", "triethylammonium acetate"], "Top-level 3-reagent case should prefill balanced simulator substances");
assert(loadedVariants.some(item => item.graphPreview.includes("G1 -> V-L separator")), "Top-level 3-reagent case should preview a G1 graph variant");

const volatilityRoute = loadedVariants.find(item => item.title === "Volatility route");
assert(volatilityRoute.unitCandidates.some(item => item.source === "KB3.2/Table S.11"), "Route variants should translate PBBs through KB3.2 unit-operation candidates");
insertSeparationRoute("G1", loadedPair.key, volatilityRoute.id);
const insertedGroup = groupModel("G3");
assert(insertedGroup, "Inserting a route should create a new separator group");
assert.strictEqual(insertedGroup.task.includes("Volatility route"), true, "Inserted group should retain the route title");
assert.strictEqual(insertedGroup.selectedUnit.length > 0, true, "Inserted group should receive a candidate unit");
assert(insertedGroup.blocks.some(block => block.text.includes("triethylamine / benzyl acetate")), "Inserted group should contain a proposed route block");
assert(insertedGroup.blocks.some(block => block.text.includes("Method trace: KB3.1 selected") && block.text.includes("KB3.1 evidence status") && block.text.includes("EI ranking is not available")), "Inserted route block should preserve threshold provenance and disclose that EI is unavailable");
const insertedRouteBlock = insertedGroup.blocks[0];
assert(insertedRouteBlock.streams.filter(stream => stream.role === "input").length >= 2, "Inserted LUTZE route should preserve each feed component as its own input stream");
assert(!insertedRouteBlock.streams.some(stream => /mixture/i.test(stream.name)), "Inserted LUTZE route should not replace real components with an aggregate mixture stream");
assert(insertedGroup.selectionBasis.includes("use") && insertedGroup.selectionBasis.includes("to separate"), "Inserted route selection basis should include the narrative rationale");
assert(state.links.some(link => link.from === "G1" && link.to === "G3"), "Inserted route should connect source group to separator");
assert(state.links.some(link => link.from === "G3" && link.to === "G2"), "Inserted route should reconnect separator to previous downstream group");

loadTripleReactantExampleProject();
const pathwayGroup = groupModel("G1");
let pathwayModel = separationSimulatorModel(pathwayGroup);
let pathwayStart = separationPathwayModel(pathwayGroup, pathwayModel);
assert(pathwayStart.nextOptions.length > 0, "Pathway sandbox should expose a first route option");
assert(pathwayStart.nextOptions[0].separated.some(component => component.role === "reactant"), "Pathway should prioritize a product/reactant separation before secondary non-product pairs");
assert.strictEqual(pathwayStart.status, "in_progress", "A fresh unresolved mixture should be in progress");
assert.strictEqual(pathwayStart.canApply, false, "A fresh pathway should not be applicable");
assert(pathwayStart.alternatives.length >= 2, "Pathway screening should generate multiple alternatives");
assert(pathwayStart.alternatives.every(item => item.metrics && item.steps.length), "Each alternative should expose steps and comparison metrics");
assert(pathwayStart.alternatives.every(item => item.steps.every(step => ["matched", "partial", "hypothesis", "blocked"].includes(step.evidenceLevel))), "Pathway steps should retain their LUTZE evidence level independently from split-direction confidence");
assert(pathwayStart.alternatives.every(item => item.metrics.routeReadySteps === item.steps.filter(step => step.evidenceLevel === "matched").length), "Route-ready metrics should remain independent from product-stream direction confidence");
assert(pathwayStart.alternatives.some(item => item.metrics.thermalOperationSteps >= item.metrics.thermalExposureProxySteps), "Pathway metrics should distinguish thermal operations from the operation-name exposure proxy");
const evidenceAlternative = pathwayStart.alternatives.find(item => item.profile === "evidence");
assert(evidenceAlternative, "Generated alternatives should expose a KB3.1 evidence-coverage candidate");
assert(evidenceAlternative.metrics.routeReadySteps / evidenceAlternative.metrics.stepCount >= Math.max(...pathwayStart.alternatives.map(item => item.metrics.routeReadySteps / item.metrics.stepCount)), "Best evidence coverage should maximize the visible route-ready share");
assert(pathwayStart.alternatives.every(item => !("evidenceScore" in item.metrics) && item.steps.every(step => !("score" in step))), "Generated pathways should not retain the invented numeric score internally");
usePathwayAlternative("G1", pathwayStart.alternatives[0].id);
let generatedPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(generatedPath.status, "complete", "Selecting a complete generated alternative should resolve the pathway");
assert.strictEqual(generatedPath.canApply, true, "A complete generated alternative should be applicable");
resetPathway("G1");
pathwayStart = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
const groupCountBeforeIncompleteApply = Object.keys(state.groups).length;
tryPathwayRoute("G1", pathwayStart.nextOptions[0].id);
const oneStepPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(oneStepPath.canApply, false, "A one-step unresolved pathway should not be applicable");
applyPathwayToMainFlowsheet("G1");
assert.strictEqual(Object.keys(state.groups).length, groupCountBeforeIncompleteApply, "Applying an incomplete pathway should not mutate the flowsheet");
resetPathway("G1");
["triethylammonium acetate", "triethylamine", "acetic anhydride", "benzyl alcohol"].forEach((name, index) => {
  const option = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup)).nextOptions
    .find(item => item.separated.some(component => component.name === name));
  assert(option, "Pathway sandbox should expose a route to separate " + name);
  tryPathwayRoute("G1", option.id);
  const afterStep = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
  assert.strictEqual(afterStep.steps.length, index + 1, "Trying route " + (index + 1) + " should add one draft step");
});
const pathwayAfterTry = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(pathwayAfterTry.steps.length, 4, "Pathway sandbox should support four sequential separations");
assert.deepStrictEqual(pathwayAfterTry.active.map(item => item.name), ["benzyl acetate"], "After four routes only the product should remain active");
assert.strictEqual(pathwayAfterTry.status, "complete", "A resolved product-only stream should complete the pathway");
assert.strictEqual(pathwayAfterTry.canApply, true, "A complete pathway should enable controlled application");
assert(pathwayAfterTry.steps[0].retained.map(item => item.name).includes("benzyl alcohol"), "First pathway split should retain all non-separated components, not just the binary pair counterpart");
assert(separationPathwayHtml(pathwayGroup, separationSimulatorModel(pathwayGroup)).includes("Build step by step"), "Pathway tab should render the manual screening workspace");
selectPathwayStep("G1", pathwayAfterTry.steps[0].id);
let editPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(editPath.editIndex, 0, "Selecting the first pathway node should enter edit-from-step mode");
assert.strictEqual(editPath.active.length, 5, "Editing from the first step should recalculate options from the original reaction mixture");
assert(separationPathwayHtml(pathwayGroup, separationSimulatorModel(pathwayGroup)).includes("Editing step 1"), "Pathway UI should explain branch replacement mode");
const replacementOption = editPath.nextOptions.find(item => item.separated.some(component => component.name === "acetic anhydride"));
assert(replacementOption, "Branch edit should expose an alternative first separation route");
tryPathwayRoute("G1", replacementOption.id);
let replacedPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(replacedPath.steps.length, 1, "Replacing from the first step should discard downstream draft steps");
assert(replacedPath.steps[0].separated.some(component => component.name === "acetic anhydride"), "Replacement route should become the new first step");
assert.strictEqual(replacedPath.pathway.editFromStepId, "", "Replacement should exit branch edit mode");
["triethylammonium acetate", "triethylamine", "benzyl alcohol"].forEach(name => {
  const option = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup)).nextOptions
    .find(item => item.separated.some(component => component.name === name));
  assert(option, "Pathway sandbox should expose a regenerated route to separate " + name);
  tryPathwayRoute("G1", option.id);
});
replacedPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(replacedPath.steps.length, 4, "Regenerated branch should again support four sequential separations");
assert.deepStrictEqual(replacedPath.active.map(item => item.name), ["benzyl acetate"], "Regenerated branch should still reduce to the product stream");
applyPathwayToMainFlowsheet("G1");
const pathwayInsertedGroup = groupModel("G3");
assert(pathwayInsertedGroup, "Applying a pathway should create a separator group");
assert(pathwayInsertedGroup.selectionBasis.includes("Lutze/Garg separation screening pathway"), "Applied pathway group should preserve provenance");
assert(pathwayInsertedGroup.selectionBasis.includes("Separation step 1") && pathwayInsertedGroup.selectionBasis.includes("KB3.1 evidence status") && pathwayInsertedGroup.selectionBasis.includes("EI ranking is not available"), "Applied pathway group should include threshold provenance and the EI limitation");
assert(pathwayInsertedGroup.blocks.some(block => block.text.includes("to separate acetic anhydride from") && block.text.includes("benzyl acetate")), "Applied pathway block should state what is separated and retained after branch replacement");
const firstPathwayBlock = pathwayInsertedGroup.blocks[0];
const firstPathwayInputs = firstPathwayBlock.streams.filter(stream => stream.role === "input");
// A separated fraction whose substance fate is "waste" leaves as a waste row, not an output, so the
// flowsheet draws it as a boundary outlet and the LCI bridge classifies it; every other component
// stays an individual output. Together they still carry every active component of the split.
const firstPathwayOutputs = firstPathwayBlock.streams.filter(stream => stream.role === "output" || stream.role === "waste");
const expectedFirstComponents = pathwayModel.substances.map(item => item.name).sort();
assert.deepStrictEqual(firstPathwayInputs.map(stream => stream.name).sort(), expectedFirstComponents, "Applied pathway feed should carry every active component as an individual input stream");
assert.deepStrictEqual(firstPathwayOutputs.map(stream => stream.name).sort(), expectedFirstComponents, "Applied pathway split should keep separated and retained components as individual outlet streams");
firstPathwayBlock.streams.filter(stream => stream.role === "waste").forEach(stream => {
  assert(["purge", "wastewater", "solid waste", "vent"].includes(stream.fate), "A separated waste fraction must carry a stream waste fate the flowsheet and LCI understand, got " + stream.fate);
});
assert(!firstPathwayBlock.streams.some(stream => ["waste", "recover", "recycle", "keep with mixture"].includes(stream.fate)), "Sandbox substance fates must be translated to stream fates on apply");
assert(!firstPathwayBlock.streams.some(stream => /mixture/i.test(stream.name)), "Applied pathway block should not create a synthetic summed-mixture material");
assert(Math.abs(firstPathwayInputs.reduce((sum, stream) => sum + conversionNumber(stream.quantity), 0) - firstPathwayOutputs.reduce((sum, stream) => sum + conversionNumber(stream.quantity), 0)) < 0.0001, "Component-level pathway streams should preserve the proposed total quantity across the split");
const separatedAceticAnhydride = firstPathwayBlock.streams.find(stream => (stream.role === "output" || stream.role === "waste") && stream.name.includes("acetic anhydride"));
assert.strictEqual(separatedAceticAnhydride.mw, "102.09", "Applied Lutze pathway output should preserve pure-component MW");
assert.strictEqual(separatedAceticAnhydride.pubchemCid, "7918", "Applied Lutze pathway output should preserve PubChem identity");
assert(state.links.some(link => link.from === "G1" && link.to === "G3"), "Applied pathway should connect source group to first separator");
assert(groupModel("G4"), "Applying a 4-step pathway should create a second separator group");
assert(groupModel("G5"), "Applying a 4-step pathway should create a third separator group");
assert(groupModel("G6"), "Applying a 4-step pathway should create a fourth separator group");
assert(state.links.some(link => link.from === "G3" && link.to === "G4"), "Applied pathway should connect first and second separators");
assert(state.links.some(link => link.from === "G4" && link.to === "G5"), "Applied pathway should connect second and third separators");
assert(state.links.some(link => link.from === "G5" && link.to === "G6"), "Applied pathway should connect third and fourth separators");
assert(state.links.some(link => link.from === "G6" && link.to === "G2"), "Applied pathway should reconnect final separator to downstream group");
const secondPathwayInputs = groupModel("G4").blocks[0].streams.filter(stream => stream.role === "input");
assert.strictEqual(secondPathwayInputs.length, 4, "The second pathway step should receive the four components retained by the first split, not one summed stream");
assert(secondPathwayInputs.every(stream => stream.mw), "Pure-component MW values should propagate into the next LUTZE subprocess inputs");

// Phenomena that the declared phases cannot carry are reported, never pruned: the octocrylene
// distillation (B9) keeps its PT(VL)/PS(VL) although its streams are declared liquid, the
// conflict is listed on the block, and Data Quality names the block.
loadBaseExampleProject();
const octoStill = state.blocks.find(block => block.id === "B9");
assert(octoStill.phenomena.includes("PT(VL)") && octoStill.phenomena.includes("PS(VL)"), "Declared vapour-liquid phenomena must survive rendering even when the streams are declared liquid");
assert.deepStrictEqual(phenomenaPhaseConflicts(octoStill), ["PT(VL)", "PS(VL)"], "The vapour-liquid phenomena on the liquid-only still should be reported as phase conflicts");
assert(/vapour/.test(phenomenonConflictTip("PT(VL)", octoStill)), "The conflict tip should say which phase is missing");
const octoReadiness = dataReadinessModel().categories.flatMap(category => category.items).find(item => item.name === "Phenomena consistent with stream phases");
assert(octoReadiness && octoReadiness.ok === false && /B9/.test(octoReadiness.note), "Data Quality should flag B9's phase conflicts, got " + JSON.stringify(octoReadiness));
octoStill.streams.push(createStream("output", { id: "B9-vapour-test", name: "octocrylene distillate", quantity: "1", unit: "kg", phase: "V", status: "estimated", timing: "in-process intermediate", fate: "intermediate" }));
assert.deepStrictEqual(phenomenaPhaseConflicts(octoStill), [], "Declaring a vapour stream should clear the conflict without touching the phenomena list");

// Declared ranges stay ranges. The octocrylene wash (2-3 h) and distillation (3-5 h) schedule
// at their midpoints, and the makespan is also reported across the bounds.
const r23 = parseDurationHoursRange("2-3");
assert(r23.isRange && r23.min === 2 && r23.max === 3 && r23.mid === 2.5, "2-3 should parse as a range with midpoint 2.5");
assert(parseDurationHoursRange("18 to 24").mid === 21 && !parseDurationHoursRange("20").isRange, "'18 to 24' is a range; '20' is not");
const octoGantt = taskScheduleModel();
assert(octoGantt.rangedTaskIds.includes("G3") && octoGantt.rangedTaskIds.includes("G6"), "G3 and G6 carry declared duration ranges, got " + JSON.stringify(octoGantt.rangedTaskIds));
assert(octoGantt.makespanRangeH && octoGantt.makespanRangeH.min < octoGantt.estimatedCycleTimeH && octoGantt.estimatedCycleTimeH < octoGantt.makespanRangeH.max, "The makespan should be bracketed by the schedule at the lower and upper bounds: " + JSON.stringify(octoGantt.makespanRangeH) + " around " + octoGantt.estimatedCycleTimeH);
const octoScheduleStrings = scheduleModel(ensureScaleBasis());
assert(/–/.test(octoScheduleStrings.batchMakespanRangeH), "The scale schedule should carry the makespan range as text, got " + JSON.stringify(octoScheduleStrings.batchMakespanRangeH));

// Biodiesel case: a recognisable transesterification with literature quantities. It must load in
// process order, balance stoichiometrically, expose the screening on the reactor and on the
// decanter, recycle methanol, and give the Lutze screening enough property data for a pathway.
loadBiodieselExampleProject();
assert.deepStrictEqual(groupIdsInTextOrder(), ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"], "Biodiesel case should load eight groups in process order");
const bioReaction = state.blocks.find(block => block.id === "B2");
const bioFame = bioReaction.streams.find(stream => stream.role === "output" && stream.name === "methyl oleate");
assert(Math.abs(conversionNumber(bioFame.quantity) - 0.9795) < 0.002, "Methyl oleate mass should follow 97.5% conversion of 1 kg triolein: 3 x 1.1294 mol x 0.975 x 296.49 g/mol");
const bioBalance = reactionBalanceModel(groupModel("G2"));
assert(bioBalance && bioBalance.mainProduct && bioBalance.mainProduct.name === "methyl oleate", "Biodiesel reaction balance should recognise methyl oleate as the main product");
assert(postReactionSeparationSupportApplies(groupModel("G2")), "Biodiesel reactor should expose the separation screening");
assert(postReactionSeparationSupportApplies(groupModel("G3")), "Biodiesel decanter should expose the separation screening without a reaction of its own");
const bioPath = separationPathwayModel(groupModel("G2"), separationSimulatorModel(groupModel("G2")));
assert(bioPath.alternatives.length >= 1, "Biodiesel case should produce at least one complete screening pathway from its property data, got " + bioPath.alternatives.length + " (" + bioPath.status + ": " + bioPath.unresolved.join("; ") + ")");
assert(state.links.some(link => link.from === "G7" && link.to === "G1") && state.links.some(link => link.from === "G4" && link.to === "G1"), "Recovered methanol should recycle to methoxide preparation from both recovery units");
const bioInputs = bioReaction.streams.filter(stream => stream.role === "input").reduce((sum, stream) => sum + conversionNumber(stream.quantity), 0);
const bioOutputs = bioReaction.streams.filter(stream => stream.role === "output").reduce((sum, stream) => sum + conversionNumber(stream.quantity), 0);
assert(Math.abs(bioInputs - bioOutputs) < 0.001, "Biodiesel reactor streams should balance to the gram: in " + bioInputs.toFixed(4) + " kg, out " + bioOutputs.toFixed(4) + " kg");

// Reaction-only biodiesel: the downstream train is built with the screening. The recommended
// pathway must be the plant's two separations: methanol by volatility and the glycerol phase by
// decanting, with the catalyst leaving in the glycerol phase (a decanter splits phases, not
// components). A vapour-pressure ratio between two non-volatile liquids (glycerol against the
// ester, both far below 100 Pa) must not earn a "matched" volatility route.
loadBiodieselExampleProject({ reactionOnly: true });
assert.deepStrictEqual(groupIdsInTextOrder(), ["G1", "G2"], "The reaction-only biodiesel variant should load the make-up and the reactor only");
assert.deepStrictEqual(state.links.map(link => link.from + "->" + link.to), ["G1->G2"]);
// Opening the screening syncs the substances from the reactor streams, as the user's path does.
syncSeparationSimulatorSubstances(groupModel("G2"));
const bioOnlyModel = separationSimulatorModel(groupModel("G2"));
assert.strictEqual(bioOnlyModel.substances.find(item => item.name === "methanol").fate, "recycle", "Excess methanol leaving the reactor as unreacted reagent should be assigned to recycle after sync");
assert.strictEqual(bioOnlyModel.substances.find(item => item.name === "glycerol").fate, "recover", "The glycerol co-product should be recovered separately, not kept in the product");
const glycerolEsterPair = bioOnlyModel.pairs.find(pair => pair.key === separationPairKey("CS1", "CS2"));
const glycerolVolatility = separationSuggestionsForPair(glycerolEsterPair).find(item => item.ruleId === "KB3.1-VL-BP-PVAP");
assert(glycerolVolatility && glycerolVolatility.level !== "matched" && glycerolVolatility.missing.some(text => /below 100 Pa/.test(text)), "Glycerol/methyl oleate volatility should be review-required, both being non-volatile at 25 degC: " + JSON.stringify(glycerolVolatility && { level: glycerolVolatility.level, missing: glycerolVolatility.missing }));
const bioOnlyPath = separationPathwayModel(groupModel("G2"), bioOnlyModel);
const bioBest = bioOnlyPath.alternatives[0];
assert(bioBest && bioBest.status === "complete", "The first recommended biodiesel pathway should be complete");
const bioVolatile = bioBest.steps.find(step => /volatility/i.test(step.title));
const bioDecant = bioBest.steps.find(step => /liquid-liquid/i.test(step.title));
assert(bioVolatile && bioVolatile.separatedIds.join(",") === "CS3", "One step should take the excess methanol off by volatility, got " + JSON.stringify(bioBest.steps.map(step => [step.title, step.separatedIds])));
assert(bioDecant && bioDecant.separatedIds.includes("CS2") && bioDecant.separatedIds.includes("CS5"), "The decanter step should take glycerol and the catalyst together, got " + JSON.stringify(bioDecant && bioDecant.separatedIds));
assert(!bioBest.steps.some(step => step.separatedIds.includes("CS4")), "Unconverted glycerides are kept with the ester and must not be separated");
usePathwayAlternative("G2", bioBest.id);
applyPathwayToMainFlowsheet("G2");
const bioApplied = groupIdsInTextOrder();
assert.strictEqual(bioApplied.length, 4, "Applying the two-step pathway should add two separation groups, got " + bioApplied.join(","));
const bioUnits = bioApplied.map(id => state.groups[id].selectedUnit);
assert(bioUnits.some(unit => /evaporation|flash|distillation/i.test(unit)) && bioUnits.includes("Decanter"), "The applied train should contain a volatility unit and a decanter, got " + bioUnits.join(" | "));
const bioDecantGroup = bioApplied.map(id => state.groups[id]).find(group => group.selectedUnit === "Decanter");
assert(bioDecantGroup.task.includes("glycerol + sodium hydroxide from methyl oleate"), "The decanter task should be named by what leaves and what stays, got " + bioDecantGroup.task);
assert(state.links.some(link => link.from === "G2" && link.to === "G3") && state.links.some(link => link.from === "G3" && link.to === "G4"), "The applied separators should chain from the reactor");

// Project substance table: one row per substance across every stream, conflicts reported, and a
// value entered once reaching every stream and the screening substances.
loadBiodieselExampleProject();
const substanceRows = projectSubstanceTableModel();
const methanolRow = substanceRows.find(row => row.name === "methanol");
assert(methanolRow && methanolRow.streamCount >= 8 && methanolRow.fields.mw.value === "32.04", "Methanol should be one row covering its streams with the declared MW, got " + JSON.stringify(methanolRow && { streams: methanolRow.streamCount, mw: methanolRow.fields.mw.value }));
assert(substanceRows.filter(row => row.lutzeComplete).length >= 2, "Methanol and glycerol carry MW, Tb, Tm and Pvap and should count as screening-complete");
assert(substanceRows.every(row => !row.conflicts.length), "The biodiesel case declares every property consistently: " + JSON.stringify(substanceRows.filter(row => row.conflicts.length).map(row => [row.name, row.conflicts])));
const methanolStreamB2 = state.blocks.find(block => block.id === "B2").streams.find(stream => stream.name === "methanol");
methanolStreamB2.density = "800";
withRenderPass(() => {
  const conflicted = projectSubstanceTableModel().find(row => row.name === "methanol");
  assert(conflicted.conflicts.includes("density") && conflicted.fields.density.values.length === 2, "A density differing on one methanol stream should be reported as a conflict");
});
applyProjectSubstanceProperty("methanol", "density", "792");
assert(state.blocks.every(block => block.streams.filter(stream => stream.name === "methanol").every(stream => stream.density === "792")), "Applying a property should reach every methanol stream");
applyProjectSubstanceProperty("methanol", "tb", "338");
assert(ensureGroup("G2").separationSimulator.substances.find(item => item.name === "methanol").tb === "338", "Applying a property should reach the screening substance of the same key");
withRenderPass(() => {
  assert(!projectSubstanceTableModel().find(row => row.name === "methanol").conflicts.length, "Unifying the value should clear the conflict");
});

console.log("Complete separation flow check passed.");
`;

eval(`${examplesSource}\n${catalogSource}\n${core}\n${heuristicRulesSource}\n${workflowReadinessSource}\n${source}`);
