#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const lcaBridgeSource = fs.readFileSync("upscaling_pipeline_tool/static/lca_bridge.js", "utf8");
const workflowReadinessSource = fs.readFileSync("upscaling_pipeline_tool/static/workflow_readiness.js", "utf8");
const exportSource = fs.readFileSync("upscaling_pipeline_tool/static/export.js", "utf8");
const persistenceSource = fs.readFileSync("upscaling_pipeline_tool/static/project_persistence.js", "utf8");
let appSource = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
const appHtml = fs.readFileSync("upscaling_pipeline_tool/app.py", "utf8");

assert(appHtml.includes("workMenuToggle"), "Header should expose the Work persistence menu");
assert(appHtml.includes("importJsonFile"), "Work menu should include a JSON file input");
assert(appHtml.includes('src="/project_persistence.js"'), "project_persistence.js should be wired into the page");
assert(appHtml.includes('src="/lca_bridge.js"'), "lca_bridge.js should be wired into the page");
assert(appHtml.includes('src="/workflow_readiness.js"'), "workflow_readiness.js should be wired into the page");
assert(exportSource.includes("projectState: buildProjectStateExport()"), "Project JSON should include a reloadable projectState");
assert(persistenceSource.includes("function applyProjectStateSnapshot("), "Project persistence should be able to restore snapshots");

const marker = "$(\"behaviorSelect\").innerHTML";
appSource = appSource.slice(0, appSource.indexOf(marker));

const setupSource = `
const localStore = new Map();
globalThis.localStorage = {
  getItem(key) { return localStore.has(key) ? localStore.get(key) : null; },
  setItem(key, value) { localStore.set(key, String(value)); },
  removeItem(key) { localStore.delete(key); }
};
globalThis.requestAnimationFrame = () => {};
globalThis.window = { innerHeight: 900 };
globalThis.document = {
  body: { classList: { add() {}, remove() {} }, appendChild() {} },
  createElement() { return { href: "", download: "", click() {}, remove() {} }; },
  getElementById() {
    return {
      value: "",
      hidden: false,
      textContent: "",
      innerHTML: "",
      className: "",
      disabled: false,
      files: [],
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
globalThis.URL = { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} };
globalThis.Blob = function Blob(parts, opts) { return { parts, opts }; };
var renderAll = () => {};
var renderExport = () => {};
var renderSavedWorkMenu = () => {};
var confirmModal = async () => true;
var alertModal = async message => { throw new Error(message); };
`;

const testSource = `
loadBaseExampleProject();
const exported = buildProjectExport();
assert.strictEqual(exported.exportSchemaVersion, "upscaling-project-v1");
assert(exported.projectState, "Project export should contain a projectState snapshot");
assert(exported.projectState.blocks.length > 0, "Snapshot should preserve blocks");
assert(Object.keys(exported.projectState.groups).length > 0, "Snapshot should preserve groups");

state.text = "";
state.blocks = [];
state.groups = {};
state.links = [];
applyProjectStateSnapshot(exported.projectState, { pushUndo: false });
assert.strictEqual(state.blocks.length, exported.projectState.blocks.length, "Snapshot restore should reload blocks");
assert.strictEqual(Object.keys(state.groups).length, Object.keys(exported.projectState.groups).length, "Snapshot restore should reload groups");

saveLocalProjectSnapshot();
const saved = JSON.parse(localStorage.getItem(projectSnapshotsKey));
assert.strictEqual(saved.length, 1, "Manual save should create one local snapshot");
assert(saved[0].project.projectState.blocks.length > 0, "Saved snapshot should carry reloadable state");

const reconstructed = projectStateFromExport({
  text: "legacy project",
  blocks: [{ id: "B1", groupId: "G1", streams: [], phenomena: [] }],
  groups: [{ groupId: "G1", task: "legacy task", selectedUnit: "reactor", properties: [{ id: "density", value: "1", unit: "kg/L" }] }],
  links: [{ from: "G1", to: "G2" }],
  scaleUp: { basis: { targetProduct: "legacy product" } }
});
assert.strictEqual(reconstructed.text, "legacy project");
assert.strictEqual(reconstructed.groups.G1.task, "legacy task");
assert.strictEqual(reconstructed.groups.G1.properties.density.value, "1");

loadTripleReactantExampleProject();
const tripleExport = buildProjectExport();
state.text = "";
state.blocks = [];
state.groups = {};
state.links = [];
applyProjectStateSnapshot(tripleExport.projectState, { pushUndo: false });
const restoredTriple = separationSimulatorModel(groupModel("G1"));
assert.strictEqual(restoredTriple.substances.find(item => item.name === "benzyl alcohol").reactionFeedQuantity, "1.00", "Project JSON should preserve the hidden feed basis behind post-reaction residuals");
assert.strictEqual(restoredTriple.substances.find(item => item.name === "benzyl acetate").reactionGenerated, true, "Project JSON should preserve generated-product balance semantics");
assert.strictEqual(state.blocks.find(block => block.id === "B1").conversionDetail.conversionPercent, "90", "Project JSON should preserve explicit conversion separately from yield");
assert.strictEqual(state.blocks.find(block => block.id === "B1").conversionDetail.selectivityPercent, "100", "Project JSON should preserve explicit selectivity");
assert.strictEqual(state.groups.G1.timeOffsets["B1::reaction_time"], "0.5", "Project JSON should preserve editable task timetable starts");

console.log("Project persistence regression check passed.");
`;

eval(`${core}\n${lcaBridgeSource}\n${workflowReadinessSource}\n${exportSource}\n${persistenceSource}\n${appSource}\n${setupSource}\n${testSource}`);
