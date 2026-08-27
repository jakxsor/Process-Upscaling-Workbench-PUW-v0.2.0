#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
let source = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
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

assert(postReactionSeparationSupportApplies(g2), "G2 should expose post-reaction separation support");
assert(!postReactionSeparationSupportApplies(g3), "G3 cooling-only group should not expose post-reaction separation support");

const g2Root = fakeElement();
renderGroupAggregateStepInspector(g2Root, g2);
assert(g2Root.innerHTML.includes("Lutze Reaction-Separation"), "G2 drawer should render the focused Lutze reaction-separation entry point");
assert(g2Root.innerHTML.includes("Simulate Lutze Substance Separation"), "G2 drawer should offer one focused Lutze simulation button");
assert(!g2Root.innerHTML.includes("Separation Alternatives"), "G2 drawer should not expose separation alternatives directly");

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

loadTripleReactantExampleProject();
const loadedGroup = groupModel("G1");
const loadedReactionBlock = state.blocks.find(block => block.id === "B1");
const loadedModel = separationSimulatorModel(loadedGroup);
const loadedPair = loadedModel.pairs.find(pair => [pair.a.name, pair.b.name].includes("triethylamine") && [pair.a.name, pair.b.name].includes("benzyl acetate"));
const loadedVariants = binaryRouteVariants("G1", loadedPair);
assert.strictEqual(state.text.includes("benzyl acetate"), true, "Top-level 3-reagent case should load source text");
assert.strictEqual(conversionReactantStreams(loadedReactionBlock).length, 3, "Top-level 3-reagent case should expose three selectable conversion reagents");
assert.strictEqual(loadedReactionBlock.conversionDetail.productStreamId, "B1-S4", "Top-level 3-reagent case should preselect the product in Conversion");
assert.strictEqual(conversionProductStream(loadedReactionBlock).name, "benzyl acetate", "Top-level 3-reagent case should expose benzyl acetate as the Conversion product");
assert(Math.abs(conversionNumber(conversionProductStream(loadedReactionBlock).quantity) * 0.9 - 1.25) < 0.01, "Conversion popup should derive the 90% product amount from the theoretical product basis");
assert(conditionPanelHtml(loadedReactionBlock).includes("condition-chip-button"), "Saved conversion should remain directly editable from the collapsed condition summary");
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
assert(generatedWaste, "Balance action should create the unassigned waste stream");
assert(balancedModel.substances.some(item => item.name === "light ester byproduct" && item.role === "byproduct"), "Balance action should pass declared byproducts into Lutze substances");
assert(Math.abs(conversionNumber(balancedModel.substances.find(item => item.name === "benzyl alcohol").quantity) - 0.1) < 0.001, "Lutze reactant quantity should update to the unreacted residual after balancing");
assert.deepStrictEqual(loadedModel.substances.map(item => item.name), ["benzyl alcohol", "acetic anhydride", "triethylamine", "benzyl acetate"], "Top-level 3-reagent case should prefill simulator substances");
assert(loadedVariants.some(item => item.graphPreview.includes("G1 -> V-L separator")), "Top-level 3-reagent case should preview a G1 graph variant");

const volatilityRoute = loadedVariants.find(item => item.title === "Volatility route");
insertSeparationRoute("G1", loadedPair.key, volatilityRoute.id);
const insertedGroup = groupModel("G3");
assert(insertedGroup, "Inserting a route should create a new separator group");
assert.strictEqual(insertedGroup.task.includes("Volatility route"), true, "Inserted group should retain the route title");
assert.strictEqual(insertedGroup.selectedUnit.length > 0, true, "Inserted group should receive a candidate unit");
assert(insertedGroup.blocks.some(block => block.text.includes("triethylamine / benzyl acetate")), "Inserted group should contain a proposed route block");
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
assert(separationPathwayHtml(pathwayGroup, separationSimulatorModel(pathwayGroup)).includes("Lutze Reaction-Separation Sandbox"), "Pathway tab should render the sandbox");
applyPathwayToMainFlowsheet("G1");
const pathwayInsertedGroup = groupModel("G3");
assert(pathwayInsertedGroup, "Applying a pathway should create a separator group");
assert(pathwayInsertedGroup.selectionBasis.includes("Lutze Reaction-Separation pathway"), "Applied pathway group should preserve provenance");
assert(state.links.some(link => link.from === "G1" && link.to === "G3"), "Applied pathway should connect source group to first separator");
assert(groupModel("G4"), "Applying a 3-step pathway should create a second separator group");
assert(groupModel("G5"), "Applying a 3-step pathway should create a third separator group");
assert(state.links.some(link => link.from === "G3" && link.to === "G4"), "Applied pathway should connect first and second separators");
assert(state.links.some(link => link.from === "G4" && link.to === "G5"), "Applied pathway should connect second and third separators");
assert(state.links.some(link => link.from === "G5" && link.to === "G2"), "Applied pathway should reconnect final separator to downstream group");

console.log("Complete separation flow check passed.");
`;

eval(`${core}\n${source}`);
