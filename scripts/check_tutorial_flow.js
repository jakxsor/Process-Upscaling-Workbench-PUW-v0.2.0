#!/usr/bin/env node
"use strict";

const fs = require("fs");
const assert = require("assert");

let appSource = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
const coreSource = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
const workflowReadinessSource = fs.readFileSync("upscaling_pipeline_tool/static/workflow_readiness.js", "utf8");
const examplesSource = fs.readFileSync("upscaling_pipeline_tool/static/examples.js", "utf8");
const catalogSource = fs.readFileSync("upscaling_pipeline_tool/static/process_catalogs.js", "utf8");
const tutorialSource = fs.readFileSync("upscaling_pipeline_tool/static/tutorial.js", "utf8");
const appHtml = fs.readFileSync("upscaling_pipeline_tool/app.py", "utf8");
const cssSource = fs.readFileSync("upscaling_pipeline_tool/static/style.css", "utf8");

assert(appHtml.includes("tutorialArrow"), "Tutorial overlay should include the animated arrow element");
assert(cssSource.includes(".tutorial-arrow"), "Tutorial arrow should be styled");
assert(cssSource.includes(".tutorial-overlay") && cssSource.includes("background: transparent"), "Tutorial overlay should let the spotlight create the visible focus area");
assert(tutorialSource.includes("right click"), "Tutorial should explain the right-click block creation path");
assert(tutorialSource.includes("automatic"), "Tutorial should warn that automatic extraction may be wrong");
assert(tutorialSource.includes("Convert To Task"), "Tutorial should include the block-to-task step");
assert(tutorialSource.includes("Part 2"), "Tutorial should include the post-task material/Lutze section");
assert(tutorialSource.includes("Part 3"), "Tutorial should include the Lutze pathway section");
assert(tutorialSource.includes("Part 4"), "Tutorial should include the heuristic/scale-up section");
assert(tutorialSource.includes("Flowsheet View"), "Tutorial should end with the flowsheet step");
assert(appHtml.includes("openQuickTutorial") && appHtml.includes("openFullTutorial"), "Header should expose separate quick and full tutorial entries");
assert(tutorialSource.includes("tutorialCardPlacement") && tutorialSource.includes("tutorialAnchorPoint"), "Tutorial should place the card beside large targets and point the arrow at an anchor");
assert(cssSource.includes(".tutorial-anchor-ring"), "The anchor ring on large targets should be styled");
assert(tutorialSource.includes("Add example substances"), "Tutorial should teach adding material rows after task creation");
assert(tutorialSource.includes("Open Lutze"), "Tutorial should teach opening the Lutze scene");
assert(tutorialSource.includes("Create recovery task"), "Tutorial should teach creating a separate recovery task");
assert(tutorialSource.includes("Assign Unit In G1"), "Tutorial should teach assigning a unit operation inside G1");
assert(tutorialSource.includes("Switch G1 Unit"), "Tutorial should teach switching the selected G1 unit");
assert(tutorialSource.includes("Reaction Menu"), "Tutorial should teach the reaction/conversion menu");
assert(tutorialSource.includes("Save Reaction Balance"), "Tutorial should teach saving reviewed reaction-effluent components before opening Lutze");
assert(tutorialSource.includes("Same Group Or New Task"), "Tutorial should explain when G2 is optional versus necessary");
assert(!tutorialSource.includes('target: "[data-open-conversion-modal]"'), "Reaction menu tutorial target should not depend on a generic conversion button selector");
assert(tutorialSource.includes("Heuristic Rules"), "Tutorial should teach heuristic rule review");
assert(tutorialSource.includes("Scale-Up Target"), "Tutorial should teach scale-up setup");
assert(!tutorialSource.includes("setSourcePanelTab"), "Tutorial should not call removed source-tab helpers");

const marker = "$(\"behaviorSelect\").innerHTML";
appSource = appSource.slice(0, appSource.indexOf(marker));

const setupSource = `
const elements = new Map();
const storage = new Map();
function fakeElement(id = "") {
  return {
    id,
    value: "",
    hidden: false,
    disabled: false,
    textContent: "",
    innerHTML: "",
    className: "",
    clientWidth: 1200,
    clientHeight: 760,
    scrollLeft: 0,
    scrollTop: 0,
    files: [],
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    focus() {},
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
    scrollIntoView() {},
    scrollTo() {},
    getBoundingClientRect() {
      if (id === "tutorialCard") return { left: 780, right: 1190, top: 120, bottom: 330, width: 410, height: 210 };
      return { left: 90, right: 520, top: 140, bottom: 260, width: 430, height: 120 };
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    contains() { return false; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    appendChild() {},
    remove() {},
    click() {}
  };
}
function elementById(id) {
  if (!elements.has(id)) elements.set(id, fakeElement(id));
  return elements.get(id);
}
globalThis.document = {
  body: fakeElement("body"),
  createElement: () => fakeElement(),
  getElementById: elementById,
  querySelector(selector) {
    if (selector === "[data-block-card]") return state.blocks.length ? fakeElement("block-card") : null;
    if (selector === "[data-assign-task]") return state.blocks.some(block => !block.groupId) ? fakeElement("assign-task") : null;
    if (selector === '[data-add-group-task-stream="input"]') return Object.keys(state.groups).length ? fakeElement("add-task-input") : null;
    if (selector === "[data-suggest-unit-operation]") return Object.keys(state.groups).length ? fakeElement("unit-options") : null;
    if (selector === '[data-suggest-unit-operation="G1"]') return state.groups.G1 ? fakeElement("unit-options-g1") : null;
    if (selector === '[data-suggest-unit-operation="G2"]') return state.groups.G2 ? fakeElement("unit-options-g2") : null;
    if (selector === "[data-open-conversion-modal]") return state.blocks.some(block => block.conditions?.conversion_yield) ? fakeElement("open-conversion") : null;
    if (selector === "#conversionModalBody") return elementById("conversionModalBody");
    if (selector === ".conversion-basis-section") return $("conversionModal").hidden ? null : fakeElement("conversion-basis-section");
    if (selector === "#conversionApplyBalance") return $("conversionModal").hidden ? null : elementById("conversionApplyBalance");
    if (selector === ".conversion-preview-section") return $("conversionModal").hidden ? null : fakeElement("conversion-preview-section");
    if (selector === "[data-open-lutze-reaction-separation]") return Object.keys(state.groups).length ? fakeElement("lutze-launch") : null;
    if (selector === ".pathway-mode-switch") return $("separationSimulatorModal").hidden ? null : fakeElement("pathway-mode-switch");
    if (selector === ".pathway-alternative-grid") return $("separationSimulatorModal").hidden ? null : fakeElement("pathway-alternative-grid");
    if (selector === ".pathway-options-panel") return $("separationSimulatorModal").hidden ? null : fakeElement("pathway-options-panel");
    if (selector === "[data-pathway-try-option]") return $("separationSimulatorModal").hidden ? null : fakeElement("pathway-try-option");
    if (selector === ".pathway-canvas") return $("separationSimulatorModal").hidden ? null : fakeElement("pathway-canvas");
    if (selector === "[data-pathway-apply]") return $("separationSimulatorModal").hidden ? null : fakeElement("pathway-apply");
    if (selector === ".group-mfa-grid") return state.blocks.some(block => block.streams?.length) ? fakeElement("group-mfa-grid") : null;
    if (selector === ".stream-chemical") return state.blocks.some(block => block.streams?.some(stream => stream.mw)) ? fakeElement("stream-chemical") : null;
    if (selector === ".unit-suggest-results") return Object.values(state.groups).some(group => group.unitSuggestionsExpanded) ? fakeElement("unit-suggest-results") : null;
    if (selector.startsWith("#")) return elementById(selector.slice(1));
    if (selector === "header h1") return fakeElement("heading");
    return fakeElement(selector);
  },
  querySelectorAll() { return []; }
};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 800,
  setTimeout(callback) { if (typeof callback === "function") callback(); return 1; }
};
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};
globalThis.requestAnimationFrame = callback => { if (typeof callback === "function") callback(); return 1; };
globalThis.cancelAnimationFrame = () => {};
var renderAll = () => {};
var renderExport = () => {};
var renderSeparationSimulatorModal = () => {};
var closeSeparationSimulator = () => {};
var closeFlowsheetModal = () => {};
var openLutzeReactionSeparation = groupId => {
  state.activeSeparationSimulatorGroupId = groupId;
  state.activeSeparationSimulatorMode = "pathway";
  $("separationSimulatorModal").hidden = false;
};
var separationPathwayModel = group => {
  const simulator = ensureGroup(group.id).separationSimulator;
  return {
    steps: simulator.pathway?.steps || [],
    nextOptions: simulator.pathway?.steps?.length ? [] : [
      { id: "tutorial-route-1" },
      { id: "tutorial-route-2" },
      { id: "tutorial-route-3" }
    ]
  };
};
var tryPathwayRoute = (groupId, optionId) => {
  const simulator = ensureGroup(groupId).separationSimulator;
  simulator.pathway.steps = simulator.pathway.steps || [];
  if (!simulator.pathway.steps.length) simulator.pathway.steps.push({ id: "PW1", optionId });
  simulator.pathway.selectedStepId = "PW1";
  simulator.tab = "pathway";
};
var applyPathwayToMainFlowsheet = groupId => {
  const simulator = ensureGroup(groupId).separationSimulator;
  if (simulator.pathway.appliedAt) return;
  simulator.pathway.appliedAt = "test-applied";
  const newBlock = {
    id: nextBlockId(),
    groupId: "G3",
    start: state.text.length,
    end: state.text.length,
    source: "tutorial",
    text: "Tutorial Lutze route applied to main flowsheet.",
    behavior: "distillation purification",
    phenomena: ["PT(VL)", "PS(VL)"],
    streams: []
  };
  state.blocks.push(newBlock);
  ensureGroup("G3", "separation").task = "Lutze proposed separator";
  if (!state.links.some(link => link.from === groupId && link.to === "G3")) state.links.push({ from: groupId, to: "G3" });
  $("separationSimulatorModal").hidden = true;
};
var runRuleChecks = () => { state.ruleChecks = [{ id: "tutorial-check", severity: "medium", title: "Tutorial review check" }]; };
var setInspectorTab = tab => { state.activeInspectorTab = ["inspect", "heuristics", "scale"].includes(tab) ? tab : "inspect"; };
var updateProtocolToggleIcon = () => {};
var updateInspectorToggleIcon = () => {};
var restoreTextSelection = () => {};
var fitBoard = () => {};
var centerSelection = () => {};
var confirmCount = 0;
var nextConfirmResult = true;
var confirmModal = async () => { confirmCount += 1; return nextConfirmResult; };
`;

const testSource = `
async function flushTutorialStart() {
  await Promise.resolve();
  await Promise.resolve();
}

(async () => {
  await openTutorial(0);
  await flushTutorialStart();
  assert.strictEqual(tutorialSteps.length, 34, "Tutorial should include block creation, G1 unit assignment, reaction residuals, Lutze, heuristics, and scale-up");
  // The tour opens short by default, one step per part of the method; the full route is one click away.
  assert.strictEqual($("tutorialProgress").textContent, "1 / 8 · short tour", "The tutorial should open as the short tour");
  assert.strictEqual(tutorialNextIndex(0), 3, "The short tour should skip from Build From Text to Create Block");
  state.tutorialFull = true;
  await renderTutorialStep();
  assert.strictEqual($("tutorialProgress").textContent, "1 / 34", "The full tour should count every step");
  assert.strictEqual(tutorialNextIndex(0), 1, "The full tour should visit every step in order");
  state.tutorialFull = false;
  await renderTutorialStep();
  assert.strictEqual($("tutorialArrow").hidden, false, "Tutorial should show an arrow toward the active control");

  state.blocks = [{ id: "B99", groupId: null, start: 0, end: 4, source: "protocol", text: "old", behavior: "unassigned", phenomena: [], streams: [] }];
  await openTutorial(0);
  await flushTutorialStart();
  assert.strictEqual(confirmCount, 1, "Tutorial should ask for confirmation before replacing existing work");
  assert.strictEqual($("tutorialOverlay").hidden, false, "Tutorial should open after confirming replacement");
  assert.strictEqual(state.blocks.length, 0, "Confirmed tutorial start should reset previous blocks before teaching block creation");
  assert.strictEqual($("sourceInput").value, tutorialProtocolText, "Confirmed tutorial start should load the tutorial source text");

  await tutorialEnsureBlock();
  assert.strictEqual(state.blocks.length, 1, "Tutorial should create one block from the highlighted sentence");
  assert.strictEqual(state.blocks[0].behavior, "reaction", "Tutorial block should infer a reaction");
  assert(state.blocks[0].phenomena.includes("R(L)"), "Tutorial block should infer liquid-phase reaction");
  assert.strictEqual(state.blocks[0].groupId, null, "Created block should remain draft until converted");

  await tutorialEnsureTask();
  assert.strictEqual(Object.keys(state.groups).length, 1, "Tutorial should convert the draft block to one task");
  assert.strictEqual(state.blocks[0].groupId, "G1", "Converted block should be assigned to G1");
  assert.strictEqual(state.groups.G1.task, "reaction", "Task name should follow the inferred block preset");

  await tutorialEnsureMaterials();
  assert.strictEqual(state.blocks[0].streams.length, 4, "Tutorial should add reactant/product material rows");
  assert(state.blocks[0].streams.every(stream => stream.phase === "L"), "Tutorial material rows should include phase labels");
  assert(state.blocks[0].streams.every(stream => stream.mw), "Tutorial material rows should include chemical property evidence");
  assert.strictEqual(state.groups.G1.task, "benzyl acetate reaction at 90 percent yield", "Material scene should label the richer reaction task");
  assert.strictEqual(state.groups.G1.separationSimulator.reactionBalance.conversionPercent, "90", "Tutorial should prepare Lutze conversion/yield basis");

  await tutorialShowG1UnitOptions();
  assert.strictEqual(state.groups.G1.unitSuggestionsExpanded, true, "Tutorial should show unit-operation options inside G1");
  assert(unitOperationCandidatesForGroup(groupModel("G1")).some(candidate => /reactor/i.test(candidate.name)), "G1 options should include reactor choices");

  await tutorialAssignG1Unit();
  assert(/reactor/i.test(state.groups.G1.selectedUnit), "Tutorial should assign a credible reactor unit in G1");
  assert.strictEqual(state.groups.G1.unitSuggestionsExpanded, false, "Assigning the reactor should collapse G1 suggestions");

  await tutorialSwitchG1UnitOptions();
  assert(/reactor/i.test(state.groups.G1.selectedUnit), "Switch flow should preserve the selected G1 unit");
  assert.strictEqual(state.groups.G1.unitSuggestionsExpanded, true, "Switch flow should reopen G1 alternatives");

  await tutorialFocusReactionBlock();
  assert.strictEqual(state.selectedBlockId, state.blocks[0].id, "Tutorial should focus the reaction block before the conversion menu");
  assert.strictEqual(state.selectedGroupId, null, "Reaction menu prep should not leave the whole group selected");

  state.tutorialIndex = 14;
  await renderTutorialStep();
  assert($("tutorialTitle").textContent.includes("Reaction Menu"), "Displayed step 15 should be the reaction menu");
  assert.strictEqual(tutorialSteps[14].target, "[data-block-card]", "Displayed step 15 should target the reaction block card");
  closeTutorial();
  assert(JSON.parse(localStorage.getItem(tutorialResumeStorageKey)).index === 14, "Closing midway should save the tutorial step");
  await openTutorial();
  await flushTutorialStart();
  assert.strictEqual(state.tutorialIndex, 14, "Opening the tutorial should offer and continue from the saved step");
  assert($("tutorialTitle").textContent.includes("Reaction Menu"), "Resumed tutorial should render the saved step");

  await tutorialOpenReactionMenu();
  assert.strictEqual($("conversionModal").hidden, false, "Tutorial should open the reaction conversion menu");
  assert.strictEqual(state.activeConversionBlockId, state.blocks[0].id, "Reaction menu should target the reaction block");

  await tutorialApplyReactionBalance();
  assert(state.blocks[0].streams.some(stream => /unreacted/i.test(stream.name)), "Reaction balance should generate residual reagent streams");
  assert.strictEqual($("conversionModal").hidden, false, "Tutorial should keep the reaction menu visible after balancing streams");

  await tutorialEnsureMaterials();
  assert(state.blocks[0].streams.some(stream => /unreacted/i.test(stream.name)), "Refreshing tutorial materials should preserve generated residual streams");

  await tutorialShowUnitOptions();
  assert.strictEqual(state.groups.G2.unitSuggestionsExpanded, true, "Tutorial should open recovery unit-operation options");
  assert(unitOperationCandidatesForGroup(groupModel("G2")).length >= 3, "Recovery scene should expose several unit-operation candidates");
  assert((boardUnitOperationPickerHtml(groupModel("G2")).match(/alt-button/g) || []).length >= 3, "Recovery board picker should render several visible options");

  await tutorialOpenLutzeScene();
  assert.strictEqual(state.activeSeparationSimulatorGroupId, "G1", "Tutorial should open Lutze on the reaction task");
  assert.strictEqual(state.activeSeparationSimulatorMode, "pathway", "Tutorial should open the pathway-mode Lutze scene");

  await tutorialTryFirstLutzeRoute();
  assert.strictEqual(state.groups.G1.separationSimulator.pathway.steps.length, 1, "Tutorial should preview a Lutze route");

  await tutorialEnsureAppliedLutzePathway();
  assert.strictEqual(state.groups.G1.separationSimulator.pathway.appliedAt, "test-applied", "Tutorial should apply a Lutze route to the graph");
  assert(state.groups.G3, "Applied Lutze route should create a proposed downstream separator task");

  await tutorialPrepareHeuristics();
  assert.strictEqual(state.activeInspectorTab, "heuristics", "Tutorial should switch to heuristic review");

  await tutorialPrepareScaleUp();
  assert.strictEqual(state.activeInspectorTab, "scale", "Tutorial should switch to scale-up");
  assert.strictEqual(state.scaleBasis.targetProduct, "benzyl acetate", "Tutorial scale-up should fill the product target");
  assert.strictEqual(state.scaleBasis.targetAmount, "250", "Tutorial scale-up should fill a target amount");

  state.tutorialIndex = 5;
  await renderTutorialStep();
  assert($("tutorialTitle").textContent.includes("Edit Phenomena"), "Tutorial should include a phenomena editing step");
  assert.strictEqual($("tutorialArrow").hidden, false, "Phenomena step should keep the animated arrow visible");

  await openTutorial(0);
  await flushTutorialStart();
  for (let i = 0; i < tutorialSteps.length; i += 1) {
    state.tutorialIndex = i;
    await renderTutorialStep();
    assert.strictEqual($("tutorialTitle").textContent, tutorialSteps[i].title, "Every tutorial step should render without throwing");
  }
  assert($("tutorialTitle").textContent.includes("Tutorial Complete"), "Sequential tutorial rendering should reach the final step");
  closeTutorial({ complete: true });
  assert.strictEqual(localStorage.getItem(tutorialResumeStorageKey), null, "Completing the tutorial should clear saved resume state");

  console.log("Tutorial flow regression check passed.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
`;

eval(`${examplesSource}\n${catalogSource}\n${coreSource}\n${workflowReadinessSource}\n${setupSource}\n${appSource}\n${tutorialSource}\n${testSource}`);
