#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

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
renderExport = () => {};

loadBaseExampleProject();

const g2 = groupModel("G2");
const g3 = groupModel("G3");
syncSeparationSimulatorSubstances(g2);

assert(postReactionSeparationSupportApplies(g2), "G2 should expose post-reaction separation support");
assert(!postReactionSeparationSupportApplies(g3), "G3 cooling-only group should not expose post-reaction separation support");

const g2Root = fakeElement();
renderGroupAggregateStepInspector(g2Root, g2);
assert(g2Root.innerHTML.includes("Post-Reaction Separation Support"), "G2 drawer should render post-reaction separation support");
assert(g2Root.innerHTML.includes("Separation Simulator"), "G2 drawer should offer the separation simulator");

const g3Root = fakeElement();
renderGroupAggregateStepInspector(g3Root, g3);
assert(!g3Root.innerHTML.includes("Post-Reaction Separation Support"), "G3 drawer should not render separation support");
assert(!g3Root.innerHTML.includes("Separation Simulator"), "G3 drawer should not offer the separation simulator");

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

loadMethylbenzeneSeparationDemo("G2");
const methylState = ensureGroup("G2").separationSimulator;
const methylModel = separationSimulatorModel(g2);
const methylBalance = reactionBalanceModel(g2, methylModel);
const methylVariants = binaryRouteVariants("G2", methylModel.pairs[0]);
const methylUnits = new Set(methylModel.suggestions
  .filter(item => item.ruleId !== "NO-KB3.1-MATCH")
  .flatMap(item => item.units));

assert.strictEqual(methylState.tab, "binary", "Methylbenzene demo should open on Binary Screening");
assert.deepStrictEqual(methylModel.substances.map(item => item.name), ["methylbenzene", "benzaldehyde"], "Methylbenzene demo should stay separate from octocrylene demo");
assert(Math.abs(methylBalance.conversion - 0.9) < 0.0001, "Methylbenzene demo should use 90% yield/conversion basis");
assert(methylUnits.has("Evaporation") || methylUnits.has("Distillation"), "Methylbenzene demo should suggest standard V-L separation");
assert(methylVariants.some(item => item.title === "Volatility route"), "Methylbenzene demo should expose a volatility route variant");
assert(methylVariants.some(item => item.graphPreview.includes("methylbenzene leaves as volatile/recovery stream")), "Methylbenzene route should preview recovery of volatile methylbenzene");

loadMethylbenzeneExampleProject();
const loadedGroup = groupModel("G1");
const loadedModel = separationSimulatorModel(loadedGroup);
const loadedVariants = binaryRouteVariants("G1", loadedModel.pairs[0]);
assert.strictEqual(state.text.includes("methylbenzene"), true, "Top-level methylbenzene case should load source text");
assert.deepStrictEqual(loadedModel.substances.map(item => item.name), ["methylbenzene", "benzaldehyde"], "Top-level methylbenzene case should prefill simulator substances");
assert(loadedVariants.some(item => item.graphPreview.includes("G1 -> V-L separator")), "Top-level methylbenzene case should preview a G1 graph variant");

const volatilityRoute = loadedVariants.find(item => item.title === "Volatility route");
insertSeparationRoute("G1", loadedModel.pairs[0].key, volatilityRoute.id);
const insertedGroup = groupModel("G3");
assert(insertedGroup, "Inserting a route should create a new separator group");
assert.strictEqual(insertedGroup.task.includes("Volatility route"), true, "Inserted group should retain the route title");
assert.strictEqual(insertedGroup.selectedUnit.length > 0, true, "Inserted group should receive a candidate unit");
assert(insertedGroup.blocks.some(block => block.text.includes("methylbenzene / benzaldehyde")), "Inserted group should contain a proposed route block");
assert(state.links.some(link => link.from === "G1" && link.to === "G3"), "Inserted route should connect source group to separator");
assert(state.links.some(link => link.from === "G3" && link.to === "G2"), "Inserted route should reconnect separator to previous downstream group");

console.log("Complete separation flow check passed.");
`;

eval(source);
