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

eval(`${core}\n${lcaBridgeSource}\n${readinessSource}\n${exportSource}\n${persistenceSource}\n${appSource}\n${setupSource}\n${testSource}`);
