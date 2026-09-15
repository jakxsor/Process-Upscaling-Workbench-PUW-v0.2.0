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
assert(appHtml.includes("flowsheetCleanPreset") && appHtml.includes("flowsheetAuditPreset"), "Flowsheet view should expose Clean/Audit presets");
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

console.log("Flowsheet view regression check passed.");
`;

eval(`${examplesSource}\n${catalogSource}\n${core}\n${appSource}\n${flowsheetSource}\n${flowsheetUiSource}\n${setupSource}\n${testSource}`);
