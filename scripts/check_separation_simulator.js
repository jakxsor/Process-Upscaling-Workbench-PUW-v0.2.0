const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const workflowReadinessSource = fs.readFileSync("upscaling_pipeline_tool/static/workflow_readiness.js", "utf8");
const examplesSource = fs.readFileSync("upscaling_pipeline_tool/static/examples.js", "utf8");
const catalogSource = fs.readFileSync("upscaling_pipeline_tool/static/process_catalogs.js", "utf8");
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
assert.strictEqual(state.groups.G3.task, "ethyl acetate extraction, aqueous wash, and brine wash", "G3 should retain every work-up operation named for the cyclohexane route");
state.blocks.forEach(block => {
  assert((block.streams || []).some(stream => stream.role === "input"), block.id + " should have at least one input stream in the Octocrylene example");
  assert((block.streams || []).some(stream => stream.role !== "input"), block.id + " should have at least one outlet stream in the Octocrylene example");
});
const pseudoMaterialName = /charged reaction|reaction mixture|reaction solution|organic phase|reflux-ready|solvent-free crude|recovery basis|vent stream|aqueous wash|brine-washed|wet organic|dried organic/i;
const pseudoMaterialStreams = state.blocks.flatMap(block => (block.streams || [])
  .filter(stream => pseudoMaterialName.test(stream.name))
  .map(stream => block.id + "/" + stream.id + ": " + stream.name));
assert.deepStrictEqual(pseudoMaterialStreams, [], "Octocrylene streams must use chemical/material identities; process state belongs in notes and block context");
const b2MaterialNames = new Set(state.blocks.find(block => block.id === "B2").streams.map(stream => stream.name));
assert.deepStrictEqual([...b2MaterialNames].sort(), ["2-ethylhexyl cyanoacetate", "ammonium acetate", "benzophenone", "cyclohexane"], "Heat-up should carry component rows instead of an aggregate reaction-mixture row");
const b3Residual = state.blocks.find(block => block.id === "B3").streams.find(stream => stream.role === "output" && stream.name === "benzophenone");
assert.strictEqual(b3Residual.residualOf, "benzophenone", "Residual identity must be stored as metadata instead of encoded in the material name");
const g2Mfa = aggregateGroupStreams(groupModel("G2"));
const g2Inputs = g2Mfa.find(group => group.role === "input").items;
const g2Outputs = g2Mfa.find(group => group.role === "output").items;
assert(!g2Inputs.some(item => item.name === "octocrylene"), "Post-reaction pass-through must not appear as a fresh G2 task input");
assert.strictEqual(g2Inputs.find(item => item.name === "cyclohexane").totalText, "2.5 L", "G2 boundary MFA must not count cyclohexane again at every internal step");
assert.strictEqual(g2Outputs.find(item => item.name === "octocrylene").totalText, "1 kg", "G2 boundary MFA must expose one terminal product inventory");
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
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").quantity, "0.002533", "benzophenone residual should be generated from the explicit endpoint-proxy conversion basis");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").unit, "kg", "benzophenone residual unit should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "2-ethylhexyl cyanoacetate").quantity, "0.002742", "2-ethylhexyl cyanoacetate residual should be generated from the same stoichiometric basis");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").residualOf, "benzophenone", "benzophenone should be tagged as a residual of the original chemical");
assert.strictEqual(model.substances.find(item => item.name === "2-ethylhexyl cyanoacetate").residualOf, "2-ethylhexyl cyanoacetate", "2-ethylhexyl cyanoacetate should be tagged as a residual of the original chemical");
assert.strictEqual(model.substances.find(item => item.name === "water").quantity, "0.04984", "water byproduct should reproduce the SI value of approximately 0.05 kg/kg product at four significant figures");
assert(model.substances.find(item => item.name === "cyclohexane").source.includes("B1"), "cyclohexane should keep source stream traceability");
const ventStream = state.blocks.find(block => block.id === "B10").streams.find(stream => stream.role === "input" && stream.name === "cyclohexane");
assert.strictEqual(streamPubChemLookupName(ventStream), "cyclohexane", "Process stream labels should fetch PubChem through a pure-compound lookup name");
assert(streamRowHtml({ ...ventStream, editing: true }, "material", "input", state.blocks.find(block => block.id === "B10")).includes("PubChem lookup name"), "Stream editor should expose the PubChem lookup name field");
const octoConversion = conversionCalculationModel(state.blocks.find(block => block.id === "B3"));
assert.strictEqual(octoConversion.stoichReady, true, "Octocrylene conversion should resolve stoichiometry from upstream reagent inputs");
assert(["benzophenone", "2-ethylhexyl cyanoacetate"].includes(octoConversion.stoichLimitingName), "The equimolar Octocrylene basis should resolve one reagent as numerically limiting after display rounding");
assert(Math.abs(octoConversion.reactantRows.find(row => row.stream.name === "benzophenone").leftoverKg - 0.002533) < 0.00001, "Octocrylene conversion should compute benzophenone residual from the endpoint-proxy conversion basis");
assert.strictEqual(octoConversion.massClosure.status, "closed", "Octocrylene reactive inputs must close against product, reaction water, and unreacted reagents");
assert.strictEqual(octoConversion.yieldStatus, "calculated", "The endpoint-proxy result must not be presented as a reported yield");
// The SI names these auxiliaries without a quantity. They are entered as engineering estimates
// and must say so: status "estimated" with the method on the note, never "reported".
const catalystFeed = state.blocks.find(block => block.id === "B1").streams.find(stream => stream.name === "ammonium acetate");
assert.strictEqual(catalystFeed.quantity, "0.043", "Catalyst loading is 20 mol% NH4OAc on 2.780 mol cyanoacetate = 0.043 kg per kg product");
assert.strictEqual(catalystFeed.status, "estimated", "The unreported catalyst loading must be labelled as an estimate");
assert(catalystFeed.note.includes("mol%"), "The catalyst note must name the loading basis");

// Citations: an unreported quantity carries the published source it was derived from, separately
// from its prose note, so the figure can be checked without reading the code.
const allStreams = state.blocks.flatMap(block => block.streams.map(stream => ({ block: block.id, ...stream })));
const sourceText = stream => String(stream.source || "");
const citedWith = text => allStreams.filter(stream => sourceText(stream).includes(text));

assert(sourceText(catalystFeed).includes("Org. React.") && sourceText(catalystFeed).includes("2010/0048937"), "The catalyst source must cite both the generic Knoevenagel review and the octocrylene process patent that contradicts the loading");
assert(sourceText(catalystFeed).includes("0.7-1.2 mol per mol") && sourceText(catalystFeed).includes("likely low"), "The catalyst source must state the contested loading and that the entered value is probably low");

[
  ["63.1257(d)(2)(i)(B)", "the filled-vessel purging equation for a swept reactor vent"],
  ["63.1257(d)(2)(i)(E)", "the vacuum-system equation for the evaporator exhaust"],
  ["63.1257(d)(2)(i)(G)", "the air-drying equation for sieve regeneration"]
].forEach(([equation, label]) => {
  assert(citedWith(equation).length > 0, "Some stream must cite " + label + " (" + equation + ")");
});

const emitted = allStreams.find(stream => stream.fate === "vent" && stream.role === "waste" && !stream.destinationGroup);
assert(sourceText(emitted).includes("2010/75/EU"), "The emission to air must cite the regulatory ceiling it is checked against");
assert(sourceText(emitted).includes("doi:10.1065"), "The emission to air must cite the ecoinvent screening default it is compared with");

const recycleRow = allStreams.find(stream => stream.fate === "recycled input");
assert(sourceText(recycleRow).includes("BF02978569"), "The 98% solvent recovery must cite the published fine-chemical defaults");
assert(sourceText(recycleRow).includes("optimistic bound"), "The 98% recovery source must say it is more optimistic than the published best case");

// Every estimate is traceable on hover: a row where the number enters the process carries its own
// source, and a pass-through copy of it resolves that same source instead of duplicating it.
const estimated = state.blocks.flatMap(block => block.streams
  .filter(stream => stream.status === "estimated")
  .map(stream => ({ block: block.id, stream })));
const uncitedOrigins = estimated
  .filter(entry => entry.stream.role === "input" && entry.stream.fate === "fresh input" && !sourceText(entry.stream).trim())
  .map(entry => entry.block + "/" + entry.stream.name);
assert.deepStrictEqual(uncitedOrigins, [], "Every estimated fresh charge must cite a source where it enters the process");
const unresolved = estimated
  .filter(entry => !streamDisplaySource(entry.stream).text)
  .map(entry => entry.block + "/" + entry.stream.role + "/" + entry.stream.name);
assert.deepStrictEqual(unresolved, [], "Every estimated row must show a source on hover, its own or its origin's");

const carriedCatalyst = state.blocks.find(block => block.id === "B3").streams.find(stream => stream.name === "ammonium acetate");
const carriedSource = streamDisplaySource(carriedCatalyst);
assert(!sourceText(carriedCatalyst).trim(), "A pass-through catalyst row should not duplicate the citation in its data");
assert(carriedSource.text.includes("2010/0048937") && carriedSource.inheritedFrom.includes("B1"), "A pass-through catalyst row must show the reactor charge's citation on hover, got " + JSON.stringify(carriedSource.inheritedFrom));

// A row fed by several cited origins (the combined vent gas) must still fit the fixed-height hover
// tip: each origin is cut to its leading citation and the reader is pointed to the full rows.
const combinedVent = state.blocks.find(block => block.id === "B10").streams.find(stream => stream.role === "input" && stream.name === "cyclohexane");
const combinedSource = streamDisplaySource(combinedVent);
assert(combinedSource.inheritedFrom.length > 1, "The combined vent row should draw on more than one cited origin, got " + JSON.stringify(combinedSource.inheritedFrom));
assert(combinedSource.text.length < 900, "A multi-origin citation must stay short enough for the hover tip, got " + combinedSource.text.length + " characters");
assert(combinedSource.text.includes("63.1257") && combinedSource.text.includes("Full reasoning on the rows at"), "The trimmed multi-origin citation must keep each leading citation and point to the full rows");
const ethylAcetateFeed = state.blocks.find(block => block.id === "B5").streams.find(stream => stream.name === "ethyl acetate");
assert.strictEqual(ethylAcetateFeed.status, "estimated", "The unreported ethyl acetate volume must be labelled as an estimate");
assert(/azeotrope/.test(ethylAcetateFeed.note), "The ethyl acetate note must flag the cyclohexane azeotrope that makes it a scale-up decision");
const brineFeed = state.blocks.find(block => block.id === "B6").streams.find(stream => stream.name === "saturated sodium chloride brine");
assert.strictEqual(brineFeed.status, "estimated", "The unreported brine volume must be labelled as an estimate");
// The one gap left open on purpose: the still residue follows from the distillation yield the
// authors hold, and entering it would move the 1 kg product basis.
const stillResidue = state.blocks.find(block => block.id === "B9").streams.find(stream => stream.name === "uncharacterized organic residue");
assert.strictEqual(stillResidue.status, "missing", "The distillation residue stays missing until the authors supply the distillation yield");
["G1", "G4", "G5", "G7", "G8", "G9"].forEach(id => {
  const schedule = state.groups[id].schedule;
  assert(Number.isFinite(Number(schedule.durationH)) && Number(schedule.durationH) > 0, id + " carries an estimated duration");
  assert(/^Estimated, not reported/.test(schedule.notes), id + " duration must be labelled as an estimate in its notes");
});
const recoveryBlock = state.blocks.find(block => block.id === "B11");
const recoveryFeedL = Number(recoveryBlock.streams.find(stream => stream.role === "input").quantity);
const recoveredL = Number(recoveryBlock.streams.find(stream => stream.fate === "recovered solvent").quantity);
const lossL = Number(recoveryBlock.streams.find(stream => stream.fate === "loss").quantity);
assert(Math.abs(recoveryFeedL - recoveredL - lossL) < 1e-9, "The 98% cyclohexane target case must close in liters");
const octoReactionBalance = reactionBalanceModel(group, separationSimulatorModel(group));
assert(Math.abs(octoReactionBalance.mainProduct.finalMassKg - 1) < 0.00001, "LUTZE should receive the balanced 1 kg main-product row, not the uncalculated source row");
assert.strictEqual(octoReactionBalance.mainProduct.basis, "main product formed estimate", "LUTZE should explain the calculated main-product basis");

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

const noTemperatureSimulator = separationCore.normalizeSeparationSimulator({
  substances: [
    { id: "CS1", name: "volatile", role: "solvent", phase: "L", fate: "recover", tb: "350", pvap: "10000" },
    { id: "CS2", name: "product", role: "product", phase: "L", fate: "product", tb: "350", pvap: "10" }
  ],
  reactionBalance: { mainProductId: "CS2" }
}, streamPhases);
let conditionedModel = separationCore.separationSimulatorModel(noTemperatureSimulator, streamPhases);
assert.strictEqual(conditionedModel.pairs[0].ratios.pvap, null, "Pvap ratio should be blocked when measurement temperatures are missing");
assert.strictEqual(conditionedModel.pairs[0].propertyChecks.pvap.status, "missing-condition", "Pvap comparison should explain the missing condition");
noTemperatureSimulator.substances[0].pvapTemperature = "298.15";
noTemperatureSimulator.substances[1].pvapTemperature = "298.15";
conditionedModel = separationCore.separationSimulatorModel(noTemperatureSimulator, streamPhases);
assert.strictEqual(conditionedModel.pairs[0].ratios.pvap, 1000, "Pvap ratio should be available at matching temperatures");
noTemperatureSimulator.substances[1].pvapTemperature = "320";
conditionedModel = separationCore.separationSimulatorModel(noTemperatureSimulator, streamPhases);
assert.strictEqual(conditionedModel.pairs[0].ratios.pvap, null, "Pvap ratio should be blocked at incompatible temperatures");
assert.strictEqual(conditionedModel.pairs[0].propertyChecks.pvap.status, "incompatible-condition", "Pvap mismatch should be explicit");

const unknownPhaseSimulator = separationCore.normalizeSeparationSimulator({
  substances: [
    { id: "CS1", name: "volatile", role: "solvent", phase: "unknown", fate: "recover", tb: "300" },
    { id: "CS2", name: "product", role: "product", phase: "L", fate: "product", tb: "500" }
  ]
}, streamPhases);
const unknownPhaseModel = separationCore.separationSimulatorModel(unknownPhaseSimulator, streamPhases);
const unknownPhaseRoute = unknownPhaseModel.suggestions.find(item => item.ruleId === "KB3.1-VL-BP-PVAP");
assert(unknownPhaseRoute, "A property trigger should still be diagnosed when phase is missing");
assert.strictEqual(unknownPhaseRoute.selectable, false, "Missing phase should block route selection");

const blockedSimulator = separationCore.normalizeSeparationSimulator({
  substances: [
    { id: "CS1", name: "residual A", role: "reactant", phase: "L", fate: "recover" },
    { id: "CS2", name: "residual B", role: "reactant", phase: "L", fate: "waste" },
    { id: "CS3", name: "target", role: "product", phase: "L", fate: "product" }
  ],
  reactionBalance: { mainProductId: "CS3" }
}, streamPhases);
const blockedModel = separationCore.separationSimulatorModel(blockedSimulator, streamPhases);
const blockedPath = separationCore.separationPathwayModel({ id: "GB", blocks: [] }, blockedModel, blockedSimulator.reactionBalance, blockedSimulator.pathway);
assert.strictEqual(blockedPath.status, "blocked_missing_data", "A mixture with unresolved components and missing evidence should be blocked by data quality");
assert.strictEqual(blockedPath.complete, false, "No available route must not be interpreted as pathway completion");
assert.strictEqual(blockedPath.canApply, false, "A blocked pathway must not be applicable");
const invalidAlphaPair = blockedModel.pairs[0];
invalidAlphaPair.insights.relativeVolatility = "0";
assert(!separationCore.separationSuggestionsForPair(invalidAlphaPair).some(item => item.ruleId === "SCREEN-RVOL-LOW"), "Zero relative volatility must not trigger the low-alpha rule");

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
      reactionBalance: { conversionPercent: "80", selectivityPercent: "50", yieldPercent: "", basis: "conversion", limiting: "auto", mainProductId: "CS3", note: "" },
      lookupSummary: {},
      notes: ""
    }
  }
};
group = groupModel("GR");
const balance = reactionBalanceModel(group);
assert.strictEqual(balance.mainProduct.name, "main product", "reaction balance should use selected main product");
assert(Math.abs(balance.residualRows.find(row => row.name === "reactant A").finalMassKg - 0.2) < 0.0001, "80% conversion should leave 20% reactant A residual");
assert(Math.abs(balance.residualRows.find(row => row.name === "reactant B").finalMassKg - 0.2) < 0.0001, "80% conversion should leave 20% reactant B residual");
assert(Math.abs(balance.yield - 0.4) < 0.0001, "Yield should be derived from conversion times selectivity when no reported yield is supplied");
assert(Math.abs(balance.rows.find(row => row.name === "main product").finalMassKg - 0.8) < 0.0001, "Product estimate should use yield rather than reactant conversion");
const invalidBalance = separationCore.reactionBalanceModel(group, separationSimulatorModel(group), {
  conversionPercent: "80",
  yieldPercent: "90",
  limiting: "auto",
  mainProductId: "CS3"
});
assert(Number.isNaN(invalidBalance.yield), "Yield above conversion should not be used for product formation");
assert(invalidBalance.issues.some(item => item.includes("yield cannot exceed conversion")), "Invalid conversion/yield relation should be reported");
const balanceHtml = reactionBalanceHtml(group, separationSimulatorModel(group));
assert(balanceHtml.includes("Main Product"), "reaction balance UI should identify the main product group");
assert(balanceHtml.includes("Co-products / Byproducts"), "reaction balance UI should identify co-products and byproducts");
assert(balanceHtml.includes("Reactants"), "reaction balance UI should identify reactants before residual-component review");
assert(balanceHtml.includes("0.2 kg unreacted"), "reaction balance UI should show unreacted reactant portions");
saveReactionResidualComponents("GR");
const residualComponents = state.blocks[0].streams.filter(stream => stream.role === "output" && stream.name.startsWith("unreacted "));
assert.strictEqual(residualComponents.length, 2, "user-confirmed residual reactants should remain reaction-effluent components");
assert(residualComponents.every(stream => stream.status === "calculated" && stream.fate === "intermediate"), "residual components should be calculated without automatic waste classification");

console.log("Separation simulator regression check passed.");
`;

eval(`${examplesSource}\n${catalogSource}\n${core}\n${workflowReadinessSource}\n${source}`);
