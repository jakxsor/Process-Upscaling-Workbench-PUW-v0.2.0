#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
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

loadBaseExampleProject();

const g2 = groupModel("G2");
const g3 = groupModel("G3");
syncSeparationSimulatorSubstances(g2);

const scale = scaleModel();
const throughput = throughputDiagnosticsModel(scale, taskScheduleModel());
const g2Capacity = throughput.rows.find(row => row.groupId === "G2" && row.capacityUnit === "m3");
assert(g2Capacity, "G2 should expose a volumetric capacity check");
assert(Math.abs(g2Capacity.actualValue - 10.689) < 0.02, "G2 m3 capacity should use the reactor charge volume from the paper-scale sizing basis");
assert.strictEqual(g2Capacity.actualSource, "reactor sizing total charge", "G2 should disclose the source of its volumetric load");
assert(throughputDiagnosticsHtml(throughput).includes("reactor sizing total charge"), "Capacity UI should show the source of volumetric checks");
assert.strictEqual(scale.reactorSizing.source, "manual L/kg product recipe loadings", "Octocrylene reactor sizing should disclose manual paper-linked loading inputs");
assert(Math.abs(conversionNumber(scale.reactorSizing.reactorVolumeM3) - 15.27) < 0.03, "Octocrylene reactor sizing should reproduce the 15 m3-class reactor");
state.expandedGanttRows.G2 = true;
assert(ganttPanelHtml(taskScheduleModel()).includes("Add Density Basis"), "Volumetric reactor Gantt rows should expose the density-basis action");
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
assert(!postReactionSeparationSupportApplies(g3), "G3 cooling-only group should not expose post-reaction separation support");

const g2Root = fakeElement();
renderGroupAggregateStepInspector(g2Root, g2);
assert(!g2Root.innerHTML.includes("<strong>Group Task</strong>"), "Group drawer should not spend a full panel on task assignment");
assert(g2Root.innerHTML.includes("R(L)") && g2Root.innerHTML.includes("PS(LL)"), "Group drawer header should keep the compact phenomena list");
assert(groupUnitSuggestionGateHtml(g2, { board: true }).includes('data-suggest-unit-operation="G2"'), "Task board card should expose the compact unit-operation action");
assert(groupUnitSuggestionGateHtml(g2, { board: true }).includes("Assign Unit Operation") || groupUnitSuggestionGateHtml(g2, { board: true }).includes("Switch Unit Operation"), "Unit-operation action should be a direct task-level button");
assert(!g2Root.innerHTML.includes("Review Lutze Again"), "Unit-operation gate should not duplicate the Lutze review action");
assert(g2Root.innerHTML.includes("Lutze Reaction-Separation"), "G2 drawer should render the focused Lutze reaction-separation entry point");
assert(g2Root.innerHTML.includes("Simulate Lutze Substance Separation"), "G2 drawer should offer one focused Lutze simulation button");
assert(!g2Root.innerHTML.includes("Separation Alternatives"), "G2 drawer should not expose separation alternatives directly");
assert(g2Root.innerHTML.includes("Outlets"), "Group drawer should expose the unified outlets MFA section");
assert(g2Root.innerHTML.includes("water of condensation"), "Unified outlets should still include waste/emission streams");
assert(renderGroupFlow.toString().includes("data-open-group-board"), "Flowchart group cards should expose an explicit open-group button");
assert(renderGroupFlow.toString().includes("data-compact-group-board"), "Detailed flowchart group cards should expose a compact-return button");
assert(renderGroupFlow.toString().includes("groupBoardOverviewHtml(group)"), "Detailed flowchart group cards should render the reduced board overview");
assert(renderGroupFlow.toString().includes("compact-meta"), "Compact flowchart group cards should keep lightweight block/phenomena counts");
assert(renderGroupFlow.toString().includes("Open detailed group"), "Compact flowchart cards should provide the explicit detailed-open action");
assert(renderGroupFlow.toString().includes("Back to compact"), "Detailed flowchart cards should provide the explicit compact-return action");
assert(renderGroupFlow.toString().includes("unitCategoryBadgeHtml(group"), "Flowchart cards should expose a compact unit-category micro badge");
assert(groupBoardOverviewHtml(g2).includes("group-mini-block"), "Detailed flowchart group cards should keep internal blocks as compact clickable chips");
state.boardCompact = true;
openGroupFromBoard("G2");
assert.strictEqual(state.boardCompact, false, "Opening a group from compact flowchart cards should switch to detailed board view");
assert.strictEqual(state.selectedGroupId, "G2", "Opening a group from the flowchart should select that group");
compactGroupFromBoard("G2");
assert.strictEqual(state.boardCompact, true, "Returning from detailed flowchart cards should switch to compact board view");
state.boardCompact = false;

ensureGroup("G2").separationSupportExpanded = true;
renderGroupAggregateStepInspector(g2Root, g2);
assert(g2Root.innerHTML.includes("Simulate Lutze Substance Separation"), "G2 drawer should keep the focused Lutze simulation button");
assert(!g2Root.innerHTML.includes("Optional Property-Based Separation Screen"), "G2 drawer should not render the property screen");

const g3Root = fakeElement();
renderGroupAggregateStepInspector(g3Root, g3);
assert(!g3Root.innerHTML.includes("Post-Reaction Separation Support"), "G3 drawer should not render separation support");
assert(!g3Root.innerHTML.includes("Lutze Reaction-Separation"), "G3 drawer should not offer the Lutze reaction-separation simulator");

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
const supported = actionable.filter(item => item.level === "supported");
const units = new Set(actionable.flatMap(item => item.units));

assert.strictEqual(readiness.status, "ready", "Complete G2 data should move readiness to ready");
assert(actionable.length > 0, "Complete G2 data should produce actionable route theories");
assert(supported.length > 0, "Complete G2 data should produce supported route theories");
assert(units.has("Evaporation") || units.has("Distillation"), "Complete G2 data should suggest a V-L route");
assert(units.has("Short-path distillation") || units.has("Wiped-film evaporator"), "Heat-sensitive product should suggest gentle thermal separation");

const workup = workupPlanModel(g2, completeModel);
const stepTitles = workup.steps.map(step => step.title);
assert(Math.abs(workup.balance.conversion - 0.9) < 0.0001, "G2 workup should inherit 90% conversion/yield from group conditions");
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
assert.deepStrictEqual(tripleModel.substances.map(item => item.name), ["benzyl alcohol", "acetic anhydride", "triethylamine", "benzyl acetate"], "3-reagent demo should keep three residual reagents plus product");
assert.strictEqual(tripleBalance.mainProduct.name, "benzyl acetate", "3-reagent demo should select benzyl acetate as main product");
assert(Math.abs(tripleBalance.conversion - 0.9) < 0.0001, "3-reagent demo should use 90% yield/conversion basis");
assert.strictEqual(tripleBalance.residualRows.length, 3, "3-reagent demo should estimate three residual reactant streams");
assert.strictEqual(tripleModel.pairs.length, 6, "4 substances should produce 6 pairwise binary comparisons");
assert.strictEqual(productPairs.length, 3, "3-reagent demo should create three product/reagent binary pairs");
assert(tripleModel.suggestions.some(item => item.pairLabel.includes("triethylamine") && item.pairLabel.includes("benzyl acetate") && item.score >= 60), "Triethylamine/product pair should receive a numeric KB3.1 score");
assert(tripleUnits.has("Evaporation") || tripleUnits.has("Distillation") || tripleUnits.has("Liquid-liquid extraction"), "3-reagent demo should suggest separation assets");
const triplePath = separationPathwayModel(g2, tripleModel);
assert.strictEqual(triplePath.pairPriorities.length, 6, "Pathway should rank every active binary pair");
assert(triplePath.pairPriorities[0].mainProductPair, "Pathway should prioritize a product-facing binary pair first");
assert(["high", "medium"].includes(triplePath.pairPriorities[0].priority), "Best binary pair should receive an explicit priority label");
const triplePathHtml = separationPathwayHtml(g2, tripleModel);
assert(triplePathHtml.includes("Recommended Next Route"), "Pathway UI should show the route reference directly under the main-product status");
assert(triplePathHtml.includes("Binary matrix and balance details"), "Pathway UI should keep detailed binary matrix information secondary");
assert(triplePathHtml.includes("Binary Pair Priority"), "Pathway UI should show the binary pair priority table");
assert(triplePathHtml.includes("KB3.1 PBBs"), "Pathway UI should show KB3.1 PBB selection before unit operation translation");
assert(paperComplianceBadgeHtml(tripleModel).includes("EI ranking"), "Simulator should expose the paper-compliance badge and EI limitation");
assert(paperComplianceBadgeHtml(tripleModel).includes("Method Guard"), "Simulator should expose the method safety guard");
assert(paperComplianceBadgeHtml(tripleModel).includes("manual apply"), "Method guard should state that flowsheet application is manual");
assert(paperComplianceBadgeHtml(tripleModel).includes("EI not final"), "Method guard should avoid presenting screening score as EI ranking");
assert(triplePath.nextOptions.every(option => option.variant.unitCandidates.length), "Selectable pathway options should carry KB3.2 unit-operation candidates");

loadTripleReactantExampleProject();
const loadedGroup = groupModel("G1");
const loadedReactionBlock = state.blocks.find(block => block.id === "B1");
const loadedModel = separationSimulatorModel(loadedGroup);
const loadedScale = scaleModel();
const loadedPair = loadedModel.pairs.find(pair => [pair.a.name, pair.b.name].includes("triethylamine") && [pair.a.name, pair.b.name].includes("benzyl acetate"));
const loadedVariants = binaryRouteVariants("G1", loadedPair);
assert.strictEqual(state.text.includes("benzyl acetate"), true, "Top-level 3-reagent case should load source text");
assert.strictEqual(loadedScale.reactorSizing.source, "auto from G1 scaled MFA + group density", "3-reagent demo should auto-size the reactor from scaled MFA and density");
assert.strictEqual(loadedScale.reactorSizing.autoGroupId, "G1", "3-reagent auto-sizing should target the reaction group");
assert(Math.abs(conversionNumber(loadedScale.reactorSizing.reactorVolumeM3) - 0.005) < 0.002, "3-reagent demo should calculate a working-fill reactor volume from MFA inputs");
assert.strictEqual(conversionReactantStreams(loadedReactionBlock).length, 3, "Top-level 3-reagent case should expose three selectable conversion reagents");
assert.strictEqual(loadedReactionBlock.conversionDetail.productStreamId, "B1-S4", "Top-level 3-reagent case should preselect the product in Conversion");
assert.strictEqual(loadedReactionBlock.conversionDetail.productAmountMode, "theoretical", "Demo product amount should be marked as a 100% theoretical basis");
assert.strictEqual(conversionProductStream(loadedReactionBlock).name, "benzyl acetate", "Top-level 3-reagent case should expose benzyl acetate as the Conversion product");
assert(Math.abs(conversionNumber(conversionProductStream(loadedReactionBlock).quantity) * 0.9 - 1.25) < 0.01, "Conversion popup should derive the 90% product amount from the theoretical product basis");
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
assert(conversionPreviewTableHtml(stoichCalc).includes("data-stage-conversion-residual"), "Conversion preview should allow simulated residuals to be staged as reagents");
stageAllConversionResiduals(stoichProductBlock);
assert.strictEqual(ensureConversionDetail(stoichProductBlock).stagedResidualStreamIds.length, 2, "All simulated residuals should stage as residual reagents");
assert(conversionStagedResidualsHtml(conversionCalculationModel(stoichProductBlock)).includes("Save residual reagents"), "Staged residual reagents should appear below the preview before saving");
saveStagedConversionResiduals(stoichProductBlock);
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
stageAllConversionResiduals(nonReactiveInputBlock);
assert.deepStrictEqual(ensureConversionDetail(nonReactiveInputBlock).stagedResidualStreamIds, ["BNR-S1"], "Only reactive residuals should be staged");
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
    byproducts: [{ id: "BEST-BP1", name: "water", basis: "actual", amount: "0.0162135", unit: "kg", role: "byproduct" }]
  }
};
const esterificationClosure = conversionCalculationModel(esterificationClosureBlock);
assert.strictEqual(esterificationClosure.reactantRows.length, 2, "Esterification example should keep ethanol as a reagent, not a guessed solvent");
assert.strictEqual(esterificationClosure.nonReactiveRows.length, 2, "Esterification example should keep explicit solvent/catalyst non-reactive");
assert.strictEqual(esterificationClosure.massClosure.status, "closed", "Esterification example should close when water byproduct is declared");
const esterificationMissingWaterBlock = {
  ...esterificationClosureBlock,
  conversionDetail: { ...esterificationClosureBlock.conversionDetail, byproducts: [] }
};
assert.strictEqual(conversionCalculationModel(esterificationMissingWaterBlock).massClosure.status, "open", "Reaction mass closure should open when a stoichiometric byproduct is missing");
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
assert(renderConversionModal.toString().includes("Reaction yield basis"), "Conversion modal should start with the product/yield basis section");
assert(renderConversionModal.toString().includes("Product amount"), "Conversion modal should expose editable product amount");
assert(renderConversionModal.toString().includes("conversionAdvancedControlsHtml"), "Conversion modal should move product stoichiometry fields into an advanced section");
assert(conversionAdvancedControlsHtml(conversionCalculationModel(stoichProductCoeffBlock)).includes("Product coeff"), "Advanced conversion controls should expose editable product stoichiometric coefficient");
assert(conversionAdvancedControlsHtml(conversionCalculationModel(stoichProductCoeffBlock)).includes("Product MW"), "Advanced conversion controls should expose editable product MW");
assert(renderConversionModal.toString().includes("Simulated streams before apply"), "Conversion modal should show the simulated streams before saving");
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
assert(blockLutzeReactionSeparationLaunchHtml(loadedReactionBlock).includes("Simulate Lutze Substance Separation"), "Grouped reaction task block should expose the Lutze simulator launcher");
const draftInputStream = createStream("input", { id: "B1-SD", name: "", editing: true });
assert(!streamRowHtml(draftInputStream, "reactant", "input", loadedReactionBlock).includes("benzyl alcohol"), "Input editor should not suggest materials already present as inputs in this step");
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
assert(loadedReactionBlock.streams.filter(stream => stream.role === "output").length >= outputsBeforeCopy + 3, "Copy inputs should create pass-through output streams for each input");
assert(loadedReactionBlock.streams.some(stream => stream.role === "output" && stream.name === "triethylamine"), "Copy inputs should preserve input stream names in outputs");
assert.strictEqual(loadedReactionBlock.streams.find(stream => stream.role === "output" && stream.name === "benzyl alcohol").mw, "108.14", "Copy inputs should preserve stream chemical properties");
const outputCountBeforeSingleCopy = loadedReactionBlock.streams.filter(stream => stream.role === "output").length;
copyOneInputToOutput(loadedReactionBlock, "B1-S1");
assert.strictEqual(loadedReactionBlock.streams.filter(stream => stream.role === "output").length, outputCountBeforeSingleCopy, "Copying one already-present input should edit the existing output rather than duplicating it");
assert(conditionPanelHtml(loadedReactionBlock).includes("condition-chip-button"), "Saved conversion should remain directly editable from the collapsed condition summary");
assert(conversionQuickActionHtml(loadedReactionBlock).includes("Edit conversion 90%"), "Reaction block header should expose a direct Edit conversion action");
updateConversionPercent(loadedReactionBlock, "75");
assert.strictEqual(ensureGroup("G1").separationSimulator.reactionBalance.conversionPercent, "75", "Editing block conversion should sync the group reaction balance");
updateConversionPercent(loadedReactionBlock, "90");
ensureConversionDetail(loadedReactionBlock).byproducts = [{ id: "bp-test", name: "light ester byproduct", percent: "20" }];
applyConversionBalanceStreams(loadedReactionBlock);
const balancedProduct = conversionProductStream(loadedReactionBlock);
const generatedResiduals = loadedReactionBlock.streams.filter(stream => stream.role === "waste" && stream.name.startsWith("unreacted "));
const generatedByproduct = loadedReactionBlock.streams.find(stream => stream.role === "output" && stream.name === "light ester byproduct");
const generatedWaste = loadedReactionBlock.streams.find(stream => stream.role === "waste" && stream.name === "unassigned reaction waste");
const balancedModel = separationSimulatorModel(groupModel("G1"));
assert(Math.abs(conversionNumber(balancedProduct.quantity) - 1.25) < 0.01, "Balance action should write the formed product amount into the output stream");
assert.strictEqual(generatedResiduals.length, 3, "Balance action should create one residual stream for each unreacted reagent");
assert(generatedByproduct, "Balance action should create declared coproduct/byproduct streams");
assert(!generatedWaste, "Balance action should not create a generic unassigned waste stream that duplicates the residual reagents");
assert(balancedModel.substances.some(item => item.name === "light ester byproduct" && item.role === "byproduct"), "Balance action should pass declared byproducts into Lutze substances");
const balancedBenzylAlcohol = balancedModel.substances.find(item => item.name === "benzyl alcohol");
assert(Math.abs(conversionNumber(balancedBenzylAlcohol.quantity) - 0.1) < 0.001, "Lutze reactant quantity should update to the unreacted residual after balancing");
assert.strictEqual(balancedBenzylAlcohol.residualOf, "benzyl alcohol", "Lutze should tag unreacted material as a residual of the canonical chemical");
assert.strictEqual(balancedBenzylAlcohol.chemicalKey, "benzyl alcohol", "Residual substance should keep the canonical chemical key");
assert.strictEqual(generatedResiduals.find(stream => stream.name === "unreacted benzyl alcohol").mw, "108.14", "Generated unreacted waste stream should inherit pure-component properties from the reactant");
assert.strictEqual(generatedResiduals.find(stream => stream.name === "unreacted benzyl alcohol").density, "1044", "Generated unreacted waste stream should inherit density from the reactant");
assert(separationSubstanceRowHtml("G1", balancedBenzylAlcohol).includes("same properties as benzyl alcohol"), "Residual substance cards should show that chemical properties are shared");
syncSeparationSimulatorSubstances(groupModel("G1"));
assert(Math.abs(conversionNumber(ensureGroup("G1").separationSimulator.substances.find(item => item.name === "benzyl alcohol").quantity) - 0.1) < 0.001, "Sync should not sum initial feed mass with the post-conversion residual quantity");
const duplicateResidual = normalizeSeparationSubstance({ id: "CSX", name: "unreacted benzyl alcohol", residualOf: "benzyl alcohol", chemicalKey: "benzyl alcohol", role: "reactant", fate: "recover" });
ensureGroup("G1").separationSimulator.substances.push(duplicateResidual);
balancedBenzylAlcohol.tb = "480";
propagateSeparationChemicalProperties("G1", balancedBenzylAlcohol, "tb");
assert.strictEqual(ensureGroup("G1").separationSimulator.substances.find(item => item.id === "CSX").tb, "480", "Editing a pure property should propagate to linked residual substances");
const outputMissingMass = createStream("output", { id: "B1-SX", name: "test product", quantity: "", unit: "L", phase: "L", editing: true });
assert(streamRowHtml(outputMissingMass, "product", "output", loadedReactionBlock).includes("Use conversion"), "Reaction outputs with missing/non-mass quantity should expose the conversion shortcut");
assert.deepStrictEqual(loadedModel.substances.map(item => item.name), ["benzyl alcohol", "acetic anhydride", "triethylamine", "benzyl acetate"], "Top-level 3-reagent case should prefill simulator substances");
assert(loadedVariants.some(item => item.graphPreview.includes("G1 -> V-L separator")), "Top-level 3-reagent case should preview a G1 graph variant");

const volatilityRoute = loadedVariants.find(item => item.title === "Volatility route");
assert(volatilityRoute.unitCandidates.some(item => item.source === "KB3.2/Table S.11"), "Route variants should translate PBBs through KB3.2 unit-operation candidates");
insertSeparationRoute("G1", loadedPair.key, volatilityRoute.id);
const insertedGroup = groupModel("G3");
assert(insertedGroup, "Inserting a route should create a new separator group");
assert.strictEqual(insertedGroup.task.includes("Volatility route"), true, "Inserted group should retain the route title");
assert.strictEqual(insertedGroup.selectedUnit.length > 0, true, "Inserted group should receive a candidate unit");
assert(insertedGroup.blocks.some(block => block.text.includes("triethylamine / benzyl acetate")), "Inserted group should contain a proposed route block");
assert(insertedGroup.blocks.some(block => block.text.includes("Method trace: KB3.1 selected") && block.text.includes("screening score") && block.text.includes("EI ranking is not calculated")), "Inserted route block should include an automatic method-trace narrative");
assert(insertedGroup.selectionBasis.includes("use") && insertedGroup.selectionBasis.includes("to separate"), "Inserted route selection basis should include the narrative rationale");
assert(state.links.some(link => link.from === "G1" && link.to === "G3"), "Inserted route should connect source group to separator");
assert(state.links.some(link => link.from === "G3" && link.to === "G2"), "Inserted route should reconnect separator to previous downstream group");

loadTripleReactantExampleProject();
const pathwayGroup = groupModel("G1");
let pathwayModel = separationSimulatorModel(pathwayGroup);
let pathwayStart = separationPathwayModel(pathwayGroup, pathwayModel);
assert(pathwayStart.nextOptions.length > 0, "Pathway sandbox should expose a first route option");
assert(pathwayStart.nextOptions[0].separated.some(component => component.name === "triethylamine"), "Pathway should rank the strongest product/reactant binary separation first");
["triethylamine", "acetic anhydride", "benzyl alcohol"].forEach((name, index) => {
  const option = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup)).nextOptions
    .find(item => item.separated.some(component => component.name === name));
  assert(option, "Pathway sandbox should expose a route to separate " + name);
  tryPathwayRoute("G1", option.id);
  const afterStep = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
  assert.strictEqual(afterStep.steps.length, index + 1, "Trying route " + (index + 1) + " should add one draft step");
});
const pathwayAfterTry = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(pathwayAfterTry.steps.length, 3, "Pathway sandbox should support three sequential separations");
assert.deepStrictEqual(pathwayAfterTry.active.map(item => item.name), ["benzyl acetate"], "After three routes only the product should remain active");
assert(pathwayAfterTry.steps[0].retained.map(item => item.name).includes("benzyl alcohol"), "First pathway split should retain all non-separated components, not just the binary pair counterpart");
assert(separationPathwayHtml(pathwayGroup, separationSimulatorModel(pathwayGroup)).includes("Lutze Reaction-Separation Sandbox"), "Pathway tab should render the sandbox");
selectPathwayStep("G1", pathwayAfterTry.steps[0].id);
let editPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(editPath.editIndex, 0, "Selecting the first pathway node should enter edit-from-step mode");
assert.strictEqual(editPath.active.length, 4, "Editing from the first step should recalculate options from the original reaction mixture");
assert(separationPathwayHtml(pathwayGroup, separationSimulatorModel(pathwayGroup)).includes("Editing Branch From Step 1"), "Pathway UI should explain branch replacement mode");
const replacementOption = editPath.nextOptions.find(item => item.separated.some(component => component.name === "acetic anhydride"));
assert(replacementOption, "Branch edit should expose an alternative first separation route");
tryPathwayRoute("G1", replacementOption.id);
let replacedPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(replacedPath.steps.length, 1, "Replacing from the first step should discard downstream draft steps");
assert(replacedPath.steps[0].separated.some(component => component.name === "acetic anhydride"), "Replacement route should become the new first step");
assert.strictEqual(replacedPath.pathway.editFromStepId, "", "Replacement should exit branch edit mode");
["triethylamine", "benzyl alcohol"].forEach(name => {
  const option = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup)).nextOptions
    .find(item => item.separated.some(component => component.name === name));
  assert(option, "Pathway sandbox should expose a regenerated route to separate " + name);
  tryPathwayRoute("G1", option.id);
});
replacedPath = separationPathwayModel(pathwayGroup, separationSimulatorModel(pathwayGroup));
assert.strictEqual(replacedPath.steps.length, 3, "Regenerated branch should again support three sequential separations");
assert.deepStrictEqual(replacedPath.active.map(item => item.name), ["benzyl acetate"], "Regenerated branch should still reduce to the product stream");
applyPathwayToMainFlowsheet("G1");
const pathwayInsertedGroup = groupModel("G3");
assert(pathwayInsertedGroup, "Applying a pathway should create a separator group");
assert(pathwayInsertedGroup.selectionBasis.includes("Lutze Reaction-Separation pathway"), "Applied pathway group should preserve provenance");
assert(pathwayInsertedGroup.selectionBasis.includes("Separation step 1") && pathwayInsertedGroup.selectionBasis.includes("screening score") && pathwayInsertedGroup.selectionBasis.includes("EI ranking is not calculated"), "Applied pathway group should include the automatic method-trace narrative");
assert(pathwayInsertedGroup.blocks.some(block => block.text.includes("to separate acetic anhydride from") && block.text.includes("benzyl acetate")), "Applied pathway block should state what is separated and retained after branch replacement");
const firstPathwayBlock = pathwayInsertedGroup.blocks[0];
assert(firstPathwayBlock.streams.find(stream => stream.role === "input").name.includes("benzyl alcohol") && firstPathwayBlock.streams.find(stream => stream.role === "input").name.includes("benzyl acetate"), "Applied pathway feed should carry the full active mixture into the separator");
assert(firstPathwayBlock.streams.some(stream => stream.role === "output" && stream.name.includes("triethylamine") && stream.name.includes("retained mixture")), "Applied pathway retained outlet should list the remaining mixture components after branch replacement");
const separatedAceticAnhydride = firstPathwayBlock.streams.find(stream => stream.role === "output" && stream.name.includes("acetic anhydride"));
assert.strictEqual(separatedAceticAnhydride.mw, "102.09", "Applied Lutze pathway output should preserve pure-component MW");
assert.strictEqual(separatedAceticAnhydride.pubchemCid, "7918", "Applied Lutze pathway output should preserve PubChem identity");
assert(state.links.some(link => link.from === "G1" && link.to === "G3"), "Applied pathway should connect source group to first separator");
assert(groupModel("G4"), "Applying a 3-step pathway should create a second separator group");
assert(groupModel("G5"), "Applying a 3-step pathway should create a third separator group");
assert(state.links.some(link => link.from === "G3" && link.to === "G4"), "Applied pathway should connect first and second separators");
assert(state.links.some(link => link.from === "G4" && link.to === "G5"), "Applied pathway should connect second and third separators");
assert(state.links.some(link => link.from === "G5" && link.to === "G2"), "Applied pathway should reconnect final separator to downstream group");

console.log("Complete separation flow check passed.");
`;

eval(`${core}\n${source}`);
