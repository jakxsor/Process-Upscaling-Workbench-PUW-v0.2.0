const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const workflowReadinessSource = fs.readFileSync("upscaling_pipeline_tool/static/workflow_readiness.js", "utf8");
let source = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
const marker = "$(\"behaviorSelect\").innerHTML";
source = source.slice(0, source.indexOf(marker));

source += `
globalThis.requestAnimationFrame = () => {};
globalThis.document = {
  getElementById() {
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
      classList: { toggle() {}, contains() { return false; }, remove() {}, add() {} },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      setAttribute() {},
      style: {}
    };
  }
};
renderAll = () => {};
renderExport = () => {};

loadBaseExampleProject();
assert.strictEqual(Object.keys(state.groups).length, 9, "Octocrylene example should map to paper U1-U9");
assert(!state.groups.G10, "Octocrylene example should not create a tenth unit operation");
assert.deepStrictEqual(state.blocks.filter(block => ["B2", "B3", "B4"].includes(block.id)).map(block => block.groupId), ["G2", "G2", "G2"], "heat, reaction, and cooling should stay in the paper U2 reactor group");
assert.strictEqual(state.groups.G3.task, "aqueous and brine wash", "G3 should be the paper U3 mixer-settler wash train");
state.blocks.forEach(block => {
  assert((block.streams || []).some(stream => stream.role === "input"), block.id + " should have at least one input stream in the Octocrylene example");
  assert((block.streams || []).some(stream => stream.role !== "input"), block.id + " should have at least one outlet stream in the Octocrylene example");
});
let group = groupModel("G2");
syncSeparationSimulatorSubstances(group);
syncSeparationSimulatorSubstances(group);
let model = separationSimulatorModel(group);
let names = model.substances.map(item => item.name);
assert(names.includes("benzophenone"), "G2 should include post-conversion benzophenone residual");
assert(names.includes("2-ethylhexyl cyanoacetate"), "G2 should include post-conversion 2-ethylhexyl cyanoacetate residual");
assert(names.includes("cyclohexane"), "G2 should include cyclohexane");
assert(names.includes("octocrylene"), "G2 should include octocrylene");
assert(names.includes("water"), "G2 should include water");
assert(!names.includes("charged reaction"), "G2 should not treat charged reaction mixture as a pure substance");
assert.strictEqual(model.substances.find(item => item.name === "water").role, "byproduct", "water should be inferred as byproduct");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").quantity, "0.308", "benzophenone residual quantity should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").unit, "kg", "benzophenone residual unit should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "2-ethylhexyl cyanoacetate").quantity, "0.333", "2-ethylhexyl cyanoacetate residual quantity should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").residualOf, "benzophenone", "benzophenone should be tagged as a residual of the original chemical");
assert.strictEqual(model.substances.find(item => item.name === "2-ethylhexyl cyanoacetate").residualOf, "2-ethylhexyl cyanoacetate", "2-ethylhexyl cyanoacetate should be tagged as a residual of the original chemical");
assert.strictEqual(model.substances.find(item => item.name === "water").quantity, "0.15", "water byproduct quantity should be prefilled");
assert(model.substances.find(item => item.name === "cyclohexane").source.includes("B1"), "cyclohexane should keep source stream traceability");
const ventStream = state.blocks.find(block => block.id === "B10").streams.find(stream => stream.name === "cyclohexane-rich vent stream");
assert.strictEqual(streamPubChemLookupName(ventStream), "cyclohexane", "Process stream labels should fetch PubChem through a pure-compound lookup name");
assert(streamRowHtml({ ...ventStream, editing: true }, "material", "input", state.blocks.find(block => block.id === "B10")).includes("PubChem lookup name"), "Stream editor should expose the PubChem lookup name field");
const octoConversion = conversionCalculationModel(state.blocks.find(block => block.id === "B3"));
assert.strictEqual(octoConversion.stoichReady, true, "Octocrylene conversion should resolve stoichiometry from upstream reagent inputs");
assert.strictEqual(octoConversion.stoichLimitingName, "2-ethylhexyl cyanoacetate", "Octocrylene conversion should identify the limiting reagent from MW and coefficients");
assert(Math.abs(octoConversion.reactantRows.find(row => row.stream.name === "benzophenone").leftoverKg - 0.3077) < 0.001, "Octocrylene conversion should compute benzophenone residual in kg");

state.blocks = [{ id: "B99", start: 0, end: 1, groupId: "GT", streams: [], phenomena: [], conditions: {} }];
state.groups = {
  GT: {
    id: "GT",
    task: "separation theory test",
    selectedUnit: "",
    schedule: scheduleDefaults(),
    properties: {},
    separationSimulator: {
      tab: "suggestions",
      substances: [
        { id: "CS1", name: "cyclohexane", role: "solvent", phase: "L", fate: "recycle", thermalSensitivity: "low", mw: "84.16", tb: "353.9", tm: "279.7", pvap: "13000" },
        { id: "CS2", name: "octocrylene", role: "product", phase: "L", fate: "product", thermalSensitivity: "high", mw: "361.5", tb: "480", tm: "280", pvap: "10" }
      ],
      pairInsights: {},
      notes: ""
    }
  }
};
group = groupModel("GT");
model = separationSimulatorModel(group);
const ruleIds = model.suggestions.map(item => item.ruleId);
assert(ruleIds.includes("KB3.1-VL-BP-PVAP"), "property ratios should trigger V-L separation suggestions");
assert(ruleIds.includes("SCREEN-THERMAL-SENSITIVE"), "heat-sensitive product should trigger thin-film/short-path suggestions");
assert(model.suggestions.some(item => item.units.includes("Evaporation")), "suggestions should include evaporation");
assert(model.suggestions.some(item => item.units.includes("Short-path distillation")), "suggestions should include short-path distillation");
assert(model.suggestions.some(item => item.ruleId === "KB3.1-VL-BP-PVAP" && item.selectable === true), "V-L route should pass the phase/phenomena eligibility gate");
const vlSuggestion = model.suggestions.find(item => item.ruleId === "KB3.1-VL-BP-PVAP" && item.selectable === true);
assert(vlSuggestion.principlePbbs.includes("PT(VL)") && vlSuggestion.principlePbbs.includes("PS(VL)"), "V-L suggestion should expose KB3.1 principle PBBs");
assert(vlSuggestion.unitCandidates.some(item => item.source === "KB3.2/Table S.11"), "V-L suggestion should expose KB3.2 unit-operation candidates");

state.blocks = [{ id: "B98", start: 0, end: 1, groupId: "GV", streams: [], phenomena: [], conditions: {} }];
state.groups = {
  GV: {
    id: "GV",
    task: "incompatible liquid split test",
    selectedUnit: "",
    schedule: scheduleDefaults(),
    properties: {},
    separationSimulator: {
      tab: "suggestions",
      substances: [
        { id: "CS1", name: "vapor A", role: "reactant", phase: "V", fate: "recover", thermalSensitivity: "low", mw: "44" },
        { id: "CS2", name: "vapor B", role: "product", phase: "V", fate: "product", thermalSensitivity: "low", mw: "58" }
      ],
      pairInsights: {},
      notes: ""
    }
  }
};
state.groups.GV.separationSimulator.pairInsights[separationPairKey("CS1", "CS2")] = {
  relativeVolatility: "",
  azeotrope: "unknown",
  pressureSensitive: "unknown",
  miscibilityGap: "yes",
  eutectic: "unknown",
  note: "contradictory test matrix"
};
const vaporModel = separationSimulatorModel(groupModel("GV"));
const llGate = vaporModel.suggestions.find(item => item.ruleId === "KB3.1-LL-GAP");
assert(llGate, "miscibility insight should still be diagnosed");
assert.strictEqual(llGate.eligibility, "not eligible", "L-L suggestion should be rejected for vapor-only phases");
assert.strictEqual(llGate.selectable, false, "Rejected L-L suggestion should not be selectable");
assert(!binaryRouteVariants("GV", vaporModel.pairs[0]).some(item => item.title === "Liquid-liquid split route"), "Rejected L-L suggestion should not become a route variant");

state.blocks = [{
  id: "B100",
  start: 0,
  end: 1,
  groupId: "GR",
  source: "manual",
  text: "reaction balance test",
  behavior: "reaction",
  streams: [],
  phenomena: ["R(L)"],
  conditions: {},
  conditionUnits: {}
}];
state.groups = {
  GR: {
    id: "GR",
    task: "reaction",
    selectedUnit: "",
    schedule: scheduleDefaults(),
    properties: {},
    separationSimulator: {
      tab: "balance",
      substances: [
        { id: "CS1", name: "reactant A", role: "reactant", phase: "L", fate: "recover", quantity: "1", unit: "kg", stoichCoeff: "1", mw: "100" },
        { id: "CS2", name: "reactant B", role: "reactant", phase: "L", fate: "recover", quantity: "1", unit: "kg", stoichCoeff: "1", mw: "100" },
        { id: "CS3", name: "main product", role: "product", phase: "L", fate: "product", quantity: "", unit: "kg", stoichCoeff: "1", mw: "200" }
      ],
      pairInsights: {},
      reactionBalance: { conversionPercent: "95", basis: "conversion", limiting: "auto", mainProductId: "CS3", note: "" },
      lookupSummary: {},
      notes: ""
    }
  }
};
group = groupModel("GR");
const balance = reactionBalanceModel(group);
assert.strictEqual(balance.mainProduct.name, "main product", "reaction balance should use selected main product");
assert(Math.abs(balance.residualRows.find(row => row.name === "reactant A").finalMassKg - 0.05) < 0.0001, "95% conversion should leave 5% reactant A residual");
assert(Math.abs(balance.residualRows.find(row => row.name === "reactant B").finalMassKg - 0.05) < 0.0001, "95% conversion should leave 5% reactant B residual");
const balanceHtml = reactionBalanceHtml(group, separationSimulatorModel(group));
assert(balanceHtml.includes("Main Product"), "reaction balance UI should identify the main product group");
assert(balanceHtml.includes("Co-products / Byproducts"), "reaction balance UI should identify co-products and byproducts");
assert(balanceHtml.includes("Reactants"), "reaction balance UI should identify reactants before residual waste generation");
assert(balanceHtml.includes("0.05 kg unreacted"), "reaction balance UI should show unreacted reactant portions");
applyReactionResidualWasteStreams("GR");
const residualWaste = state.blocks[0].streams.filter(stream => stream.role === "waste" && stream.name.startsWith("unreacted "));
assert.strictEqual(residualWaste.length, 2, "residual reactants should be written as waste/recovery streams");
assert(residualWaste.every(stream => stream.status === "calculated"), "residual streams should be calculated");

console.log("Separation simulator regression check passed.");
`;

eval(`${core}\n${workflowReadinessSource}\n${source}`);
