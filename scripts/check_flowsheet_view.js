#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const examplesSource = fs.readFileSync("upscaling_pipeline_tool/static/examples.js", "utf8");
const catalogSource = fs.readFileSync("upscaling_pipeline_tool/static/process_catalogs.js", "utf8");
let appSource = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
const appHtml = fs.readFileSync("upscaling_pipeline_tool/app.py", "utf8");
const flowsheetSource = fs.readFileSync("upscaling_pipeline_tool/static/flowsheet.js", "utf8");
const flowsheetUiSource = fs.readFileSync("upscaling_pipeline_tool/static/flowsheet_ui.js", "utf8");
assert(flowsheetSource.includes("translate(36, ${drawingHeight - 70})"), "Flowsheet legend should sit higher than the bottom border");
assert(appHtml.includes("flowsheet.css") && appHtml.includes("flowsheet_ui.js"), "Flowsheet view should load split CSS and UI modules");
assert(appHtml.includes("flowsheet-layer-controls"), "Flowsheet layer toggles should live in the compact layer-control row");
assert(appHtml.includes("flowsheetCleanPreset") && appHtml.includes("flowsheetDetailedPreset"), "Flowsheet view should expose Clean/Detailed presets");
assert(appHtml.includes("flowsheetDetailsPanel"), "Flowsheet view should include the click-through details panel");
assert(!appHtml.includes("flowsheetTechnicalMode") && !appHtml.includes("Technical PFD"), "Technical PFD should not be exposed in the flowsheet options");
assert(!appHtml.includes("resetFlowsheetLayout") && !appHtml.includes("Reset Layout"), "Reset Layout should not be exposed in the flowsheet options");
assert(!appHtml.includes("flowsheet-toolbar-check"), "Flowsheet layer toggles should not clutter the modal toolbar");
assert(appHtml.includes("downloadFlowsheetPptx"), "Flowsheet modal should expose editable PowerPoint export");
assert(flowsheetUiSource.includes("function downloadFlowsheetPptx()"), "Flowsheet UI module should implement PowerPoint download");
assert(appSource.includes("downloadFlowsheetPptx"), "PowerPoint download button should be wired");
const marker = "$(\"behaviorSelect\").innerHTML";
appSource = appSource.slice(0, appSource.indexOf(marker));

const setupSource = `
globalThis.requestAnimationFrame = () => {};
globalThis.window = { innerHeight: 900 };
globalThis.document = {
  body: { classList: { add() {}, remove() {} } },
  getElementById() {
    return {
      value: "",
      hidden: false,
      textContent: "",
      innerHTML: "",
      className: "",
      clientWidth: 1200,
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
  },
  querySelectorAll() { return []; }
};
renderAll = () => {};
var renderExport = () => {};
`;

const testSource = `
loadBaseExampleProject();
assert.deepStrictEqual(
  groupIdsInTextOrder(),
  ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"],
  "Scale-up additions should sort after the source protocol groups, not before G1"
);
let baseModel = buildFlowsheetModel();
const byGroup = Object.fromEntries(baseModel.groups.map(group => [group.id, group]));
["G1", "G2", "G3", "G4", "G5", "G6"].forEach((id, index) => {
  assert.strictEqual(byGroup[id].stage, index, id + " should stay on the main left-to-right process train");
  assert.strictEqual(byGroup[id].stageRow, 0, id + " should stay on the main flowsheet row");
});
["G7", "G8", "G9"].forEach(id => {
  assert(byGroup[id].stageRow > 0, id + " should render in a service lane below the main process row");
  assert(byGroup[id].x >= byGroup.G2.x, id + " should not be shoved to the feed side of the flowsheet");
});

// G7's task names its duty "condensation", not "condenser"; the subcategory match must catch the
// noun form and the verbal form alike, or it falls back to the plain-rectangle generic symbol.
assert.strictEqual(byGroup.G7.subcategory, "heat_exchanger", "A unit named by its condensation duty should still draw as a heat exchanger, got " + byGroup.G7.subcategory);

// The main-train label used to name whichever component was heaviest - cyclohexane, the solvent,
// on every arrow - instead of the product a reader is actually tracking through the process.
const mainTrainLabel = flowsheetProcessLabelText(byGroup.G2, byGroup.G3);
assert(mainTrainLabel.includes("octocrylene"), "A main-train connector carrying the declared target product should name it, got: " + mainTrainLabel);

// Two auxiliary loops from the same unit into the same service row (a recovery loop and a waste
// loop) used to share lane 0 because the lane counter was keyed by (row pair, kind): same offset,
// same label position, one printed on top of the other.
const auxSvgResult = buildFlowsheetSvg();
const recoveryPoints = auxSvgResult.geometry["G2->G8:recovery"];
const wastePoints = auxSvgResult.geometry["G2->G9:waste"];
assert(recoveryPoints && wastePoints, "Both the G2 recovery loop and the G2 waste loop should have routed geometry");
assert(Math.abs(recoveryPoints[1].y - wastePoints[1].y) >= 20, "A recovery loop and a waste loop from the same unit must not share a lane: recovery y=" + recoveryPoints[1].y + ", waste y=" + wastePoints[1].y);
state.links = [];
state.flowsheetShowAuxiliaryArrows = false;
state.flowsheetShowUnitDetails = false;
let model = buildFlowsheetModel();
assert.strictEqual(model.forwardLinks.length, 0, "Flowsheet should not invent process arrows when no links are declared");
assert.strictEqual(model.recycleLinks.length, 0, "Flowsheet should not invent recycle arrows when no links are declared");
let result = buildFlowsheetSvg();
assert.strictEqual(result.forwardLinkCount, 0, "Rendered flowsheet should disclose zero declared forward links");
assert(!result.svg.includes("kind: waste") && !result.svg.includes("in:"), "Auxiliary inlet/waste stubs should be hidden by default");
assert(!result.svg.includes("Size:"), "Unit details should be hidden by default for a clean figure");

state.flowsheetShowAuxiliaryArrows = true;
result = buildFlowsheetSvg();
assert(result.svg.includes("kind: waste") || result.svg.includes("in:"), "Auxiliary inlet/waste stubs should be available when explicitly enabled");

state.flowsheetShowUnitDetails = true;
result = buildFlowsheetSvg();
assert(!result.svg.includes("Size:"), "Unit details should not label operating conditions or throughput as size");
assert(result.svg.includes("Load:") || result.svg.includes("Operating:"), "Unit details should expose compact process-engineering detail lines when enabled");
assert(result.svg.includes("MFA:") || result.svg.includes("In:") || result.svg.includes("Out:"), "Unit details should expose compact material summaries when enabled");

state.links = [
  { from: "G1", to: "G2" },
  { from: "G1", to: "G2" },
  { from: "B1", to: "B2" }
];
model = buildFlowsheetModel();
assert.strictEqual(model.forwardLinks.length, 1, "Flowsheet should deduplicate links that resolve to the same group pair");

const pptxModel = buildFlowsheetPowerPointExport();
assert.strictEqual(pptxModel.groups.length, model.groups.length, "PowerPoint export should include editable unit groups");
assert.strictEqual(pptxModel.forwardLinks.length, model.forwardLinks.length, "PowerPoint export should preserve process links");
assert(pptxModel.width > 0 && pptxModel.height > 0, "PowerPoint export should include diagram dimensions");

// The biodiesel case must draw with the product leaving the drying/filtration unit and a closed
// reactor balance on its declared masses.
loadBiodieselExampleProject();
const bioModel = buildFlowsheetModel();
assert.strictEqual(bioModel.productGroupId, "G6", "Biodiesel product should leave the drying and filtration unit");
const bioReactor = bioModel.byId.get("G2");
assert(bioReactor && bioReactor.balance && bioReactor.balance.status === "closed", "Biodiesel reactor mass balance should close on the declared data: " + JSON.stringify(bioReactor && bioReactor.balance));
assert(bioModel.recycleLinks.length >= 1, "Biodiesel flowsheet should draw the methanol recycle");

// Figures follow provenance: a calculated total prints three significant figures, an estimated
// one two, a total inherits its weakest contributor, and the integer part is never rounded.
assert.strictEqual(significantText(0.50662742, 4), "0.5066");
assert.strictEqual(significantText(0.002533, 3), "0.00253");
assert.strictEqual(significantText(0.0413, 2), "0.041");
assert.strictEqual(significantText(4444.44, 2), "4444", "the integer part is never rounded away");
assert.strictEqual(significantText(0, 3), "0");
assert.strictEqual(weakestProvenance(["reported", "calculated", "estimated"]), "estimated");
assert.strictEqual(weakestProvenance(["reported", "reported"]), "reported");
assert.strictEqual(weakestProvenance([]), "missing");
assert.strictEqual(flowsheetKgText(1.22715, "calculated"), "1.23");
assert.strictEqual(flowsheetKgText(0.04134, "estimated"), "0.041");
assert.strictEqual(flowsheetKgText(0.9795, "reported"), "0.9795");
const bioTableRows = flowsheetStreamTableRows(bioModel);
const bioReactorRow = bioTableRows.find(row => row.from === "G2" && row.to === "G3");
assert(bioReactorRow && bioReactorRow.provenance === "calculated", "The reactor outlet row should carry the weakest provenance of its streams (calculated), got " + JSON.stringify(bioReactorRow && bioReactorRow.provenance));
const bioWashRow = bioTableRows.find(row => row.from === "G5" && row.to === "G6");
assert(bioWashRow && bioWashRow.provenance === "estimated", "The washed-ester row includes an estimated loss and should say so");
assert(bioReactor.balance.provenance === "calculated", "The reactor balance provenance should be calculated");

// Uncertainty by provenance: 2 / 5 / 20 / 30 percent combined in quadrature; an imbalance
// smaller than the combined uncertainty of both sides is reported as such.
assert.strictEqual(streamUncertaintyPercent("reported"), 2);
assert.strictEqual(streamUncertaintyPercent("estimated"), 20);
assert(Number.isNaN(streamUncertaintyPercent("missing")), "A missing value has no uncertainty");
assert(Math.abs(combinedUncertaintyKg([{ kg: 1, status: "reported" }, { kg: 1, status: "estimated" }]) - Math.sqrt(0.02 ** 2 + 0.2 ** 2)) < 1e-9, "Uncertainties combine in quadrature");
assert(Number.isFinite(bioReactorRow.uncertaintyKg) && bioReactorRow.uncertaintyKg > 0 && bioReactorRow.uncertaintyKg < 0.1, "The reactor outlet row should carry a combined uncertainty, got " + bioReactorRow.uncertaintyKg);
const offInputs = [createStream("input", { name: "a", quantity: "1", unit: "kg", status: "estimated" })];
const offOutlets = [createStream("output", { name: "a", quantity: "1.1", unit: "kg", status: "estimated" })];
const offBalance = flowsheetUnitBalance(offInputs, offOutlets);
assert(offBalance.status === "off" && offBalance.withinUncertainty === true, "A 10% imbalance between two estimated streams is off but within their combined uncertainty: " + JSON.stringify(offBalance));
const tightBalance = flowsheetUnitBalance([createStream("input", { name: "a", quantity: "1", unit: "kg", status: "reported" })], [createStream("output", { name: "a", quantity: "1.1", unit: "kg", status: "reported" })]);
assert(tightBalance.status === "off" && tightBalance.withinUncertainty === false, "The same imbalance between two reported streams is a real finding");

console.log("Flowsheet view regression check passed.");
`;

eval(`${examplesSource}\n${catalogSource}\n${core}\n${appSource}\n${flowsheetSource}\n${flowsheetUiSource}\n${setupSource}\n${testSource}`);
