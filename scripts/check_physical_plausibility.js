#!/usr/bin/env node
"use strict";

// Behavioural checks on the calculation layer: not "does this string exist in the source" but
// "does the model return a physically possible answer". Every assertion here corresponds to a real
// defect class that previously shipped silently - a schedule whose makespan contradicted its own
// task times, and a reactor sizing that returned a lab-sized vessel for an industrial target while
// reporting no missing data. Silent wrong answers are the failure mode that matters for a tool that
// feeds an LCA inventory, because nothing looks broken.

const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const lcaBridgeSource = fs.readFileSync("upscaling_pipeline_tool/static/lca_bridge.js", "utf8");
const readinessSource = fs.readFileSync("upscaling_pipeline_tool/static/workflow_readiness.js", "utf8");
const exportSource = fs.readFileSync("upscaling_pipeline_tool/static/export.js", "utf8");
const persistenceSource = fs.readFileSync("upscaling_pipeline_tool/static/project_persistence.js", "utf8");
const examplesSource = fs.readFileSync("upscaling_pipeline_tool/static/examples.js", "utf8");
const catalogSource = fs.readFileSync("upscaling_pipeline_tool/static/process_catalogs.js", "utf8");
let appSource = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");

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
      value: "", hidden: false, textContent: "", innerHTML: "", className: "", disabled: false,
      files: [], clientWidth: 1200, clientHeight: 800, scrollLeft: 0, scrollTop: 0, scrollTo() {},
      getBoundingClientRect() { return { height: 430 }; },
      classList: { toggle() {}, contains() { return false; }, remove() {}, add() {} },
      querySelector() { return null; }, querySelectorAll() { return []; },
      addEventListener() {}, setAttribute() {}, style: {}
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
const num = value => parseStreamQuantity(value);

// ---------------------------------------------------------------- schedule consistency
const gantt = taskScheduleModel();
const timed = gantt.tasks.filter(task => Number.isFinite(task.effectiveTimeH) && task.effectiveTimeH > 0);
assert(timed.length, "The example should produce timed tasks");

const longestTask = Math.max(...timed.map(task => task.effectiveTimeH));
assert(
  gantt.estimatedCycleTimeH >= longestTask - 1e-6,
  \`Makespan (\${gantt.estimatedCycleTimeH} h) cannot be shorter than the longest single task (\${longestTask} h)\`
);

const byId = new Map(gantt.tasks.map(task => [task.groupId, task]));
gantt.tasks.forEach(task => {
  (task.resolvedPredecessorIds || []).forEach(predId => {
    const pred = byId.get(predId);
    if (!pred) return;
    assert(
      task.startH >= pred.gatingFinishH - 1e-6,
      \`\${task.groupId} starts at \${task.startH} h, before its predecessor \${predId} releases it at \${pred.gatingFinishH} h\`
    );
  });
});

gantt.tasks.forEach(task => {
  assert(
    !Number.isFinite(task.finishH) || task.finishH <= gantt.estimatedCycleTimeH + 1e-6,
    \`\${task.groupId} finishes at \${task.finishH} h, after the reported makespan \${gantt.estimatedCycleTimeH} h\`
  );
  if (task.onCriticalPath) {
    assert(
      Math.abs(task.slackH) < 1e-3,
      \`\${task.groupId} is flagged critical but carries \${task.slackH} h of slack\`
    );
  }
});

const cyclic = gantt.cyclicDependencyGroupIds || [];
assert.strictEqual(cyclic.length, 0, \`The shipped example should not declare dependency cycles (got \${cyclic.join(", ")})\`);

// ---------------------------------------------------------------- reactor sizing plausibility
const scale = scaleModel();
const sizing = scale.reactorSizing;
const productBatchKg = num(sizing.productBatchKg);
const chargeM3 = num(sizing.totalChargeM3);
const reactorM3 = num(sizing.reactorVolumeM3);

// ---------------------------------------------------------------- scale-up basis consistency
const originalScaleBasis = JSON.parse(JSON.stringify(state.scaleBasis));
const plannedBatchKg = num(scale.target.kgPerBatch);
const plannedFactor = num(scale.factors.productFactor);
state.scaleBasis.productKgPerBatch = String(plannedBatchKg / 2);
const sizingOverrideScale = scaleModel();
assert(Math.abs(num(sizingOverrideScale.target.kgPerBatch) - plannedBatchKg) < 1e-6, "Sizing batch override must not change the production-plan kg/batch");
assert(Math.abs(num(sizingOverrideScale.factors.productFactor) - plannedFactor) < 1e-6, "Sizing batch override must not change the MFA scale factor");
assert(Math.abs(num(sizingOverrideScale.reactorSizing.productBatchKg) - plannedBatchKg / 2) < 1e-6, "Sizing batch override must still drive the equipment what-if calculation");

state.scaleBasis = JSON.parse(JSON.stringify(originalScaleBasis));
state.scaleBasis.productKgPerBatch = "";
[state.scaleBasis.productMolecularWeightGmol, state.scaleBasis.condensationWaterMolPerMol] = ["", ""];
const reactionDerivedScale = scaleModel();
assert(Number.isFinite(num(reactionDerivedScale.reactorSizing.productMolecularWeightGmol)), "Product MW should be derived from Reaction Balance when no scale-up override is set");
assert(Number.isFinite(num(reactionDerivedScale.reactorSizing.waterMolPerMol)), "Water stoichiometry should be derived from Reaction Balance when no scale-up override is set");

state.scaleBasis = JSON.parse(JSON.stringify(originalScaleBasis));
state.scaleBasis.productKgPerBatch = "";
const calendarBaseline = scaleModel();
state.scaleBasis.operatingDays = String(num(originalScaleBasis.operatingDays) / 2);
const shortCalendarScale = scaleModel();
assert(Math.abs(num(shortCalendarScale.schedule.effectiveBatchesPerYear) * 2 - num(calendarBaseline.schedule.effectiveBatchesPerYear)) < 0.01, "Halving operating days must halve annual batch capacity");
assert(Math.abs(num(shortCalendarScale.target.kgPerBatch) - num(calendarBaseline.target.kgPerBatch) * 2) < 0.01, "Halving calendar availability must double the required batch size for a fixed annual target");

state.scaleBasis = JSON.parse(JSON.stringify(originalScaleBasis));
state.scaleBasis.productKgPerBatch = "";
state.scaleBasis.parallelUnits = "2";
const parallelScale = scaleModel();
assert(Math.abs(num(parallelScale.schedule.effectiveBatchesPerYear) - num(calendarBaseline.schedule.effectiveBatchesPerYear) * 2) < 0.01, "Two complete trains must double annual batch capacity");
assert(Math.abs(num(parallelScale.target.kgPerBatch) * 2 - num(calendarBaseline.target.kgPerBatch)) < 0.01, "Two complete trains must halve required kg/batch for a fixed annual target");

state.scaleBasis = JSON.parse(JSON.stringify(originalScaleBasis));
state.scaleBasis.productKgPerBatch = "";
["conservative", "overlapped"].forEach(scenario => {
  state.scaleBasis.planningScenario = scenario;
  const scenarioScale = scaleModel();
  const projected = scenario === "overlapped" ? num(scenarioScale.schedule.overlappedKgPerYear) : num(scenarioScale.schedule.conservativeKgPerYear);
  assert(Math.abs(projected - num(scenarioScale.target.kgPerYear)) < 0.1, scenario + " planning must reconcile projected and target annual output");
});
state.scaleBasis = JSON.parse(JSON.stringify(originalScaleBasis));

if (sizing.ready && Number.isFinite(reactorM3) && Number.isFinite(chargeM3)) {
  assert(
    reactorM3 >= chargeM3 - 1e-6,
    \`Reactor volume (\${reactorM3} m3) cannot be smaller than the charge it holds (\${chargeM3} m3)\`
  );
  // Mass balance: the charge cannot weigh less than the product batch drawn from it. A charge
  // density of 2000 kg/m3 is a deliberately generous ceiling for organic process liquids, so this
  // only fires when the numbers are off by orders of magnitude, which is exactly the lab-vs-
  // industrial scale mix-up it exists to catch.
  if (Number.isFinite(productBatchKg) && productBatchKg > 0 && chargeM3 > 0) {
    const generousChargeMassKg = chargeM3 * 2000;
    assert(
      generousChargeMassKg >= productBatchKg,
      \`Charge of \${chargeM3} m3 cannot yield a \${productBatchKg} kg batch even at 2000 kg/m3 - MFA rows look lab-scale\`
    );
  }
}

// the auto path must refuse rather than invent a number when the MFA rows are still lab-scale
state.scaleBasis.reactantsLoadingLPerKgProduct = "";
state.scaleBasis.solventLoadingLPerKgProduct = "";
const reactorGroupId = reactorSizingGroupId(ensureScaleBasis(), scaleModel().reference) || "G2";
ensureGroup(reactorGroupId).properties.density = { value: "870", unit: "kg/m3", status: "assumed", note: "" };
const autoSizing = scaleModel().reactorSizing;
if (autoSizing.ready) {
  const autoCharge = num(autoSizing.totalChargeM3);
  const autoBatch = num(autoSizing.productBatchKg);
  if (Number.isFinite(autoCharge) && autoCharge > 0 && Number.isFinite(autoBatch) && autoBatch > 0) {
    assert(
      autoCharge * 2000 >= autoBatch,
      \`Automatic sizing reported ready with a \${autoCharge} m3 charge for a \${autoBatch} kg batch - impossible by mass balance\`
    );
  }
} else {
  assert(
    (autoSizing.missing || []).length > 0,
    "Automatic sizing that is not ready must say what is missing instead of failing silently"
  );
}

console.log("Physical plausibility check passed.");
`;

eval(`${examplesSource}\n${catalogSource}\n${core}\n${lcaBridgeSource}\n${readinessSource}\n${exportSource}\n${persistenceSource}\n${appSource}\n${setupSource}\n${testSource}`);
