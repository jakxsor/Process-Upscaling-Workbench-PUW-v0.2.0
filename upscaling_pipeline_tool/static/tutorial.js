// Guided block-building tutorial. Loaded as a plain <script> before app.js so these helpers share
// the same global scope as the app state and render functions.

const tutorialProtocolText = [
  "Charge 1.00 kg of benzyl alcohol, 0.95 kg of acetic anhydride, and 1.10 kg of triethylamine to a stirred liquid-phase reactor.",
  "Carry out the acetylation reaction at 65 C for 3 h to form benzyl acetate at 90 percent yield.",
  "After reaction, recover residual triethylamine, acetic anhydride, and benzyl alcohol from the benzyl acetate product-rich liquid."
].join("\n");

const tutorialSelectionText = "Carry out the acetylation reaction at 65 C for 3 h to form benzyl acetate at 90 percent yield.";
const tutorialRecoveryText = "After reaction, recover residual triethylamine, acetic anhydride, and benzyl alcohol from the benzyl acetate product-rich liquid.";
const tutorialResumeStorageKey = "upscalingPipelineTutorialResume";

const tutorialMaterialRows = [
  { role: "input", name: "benzyl alcohol", quantity: "1.00", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch", reactionRole: "reactant", stoichCoeff: "1", pubchemQuery: "benzyl alcohol", pubchemCid: "244", molecularFormula: "C7H8O", thermalSensitivity: "low", mw: "108.14", tb: "478.15", pvap: "13", density: "1045", solubilityParameter: "24.8", molarVolume: "103.8" },
  { role: "input", name: "acetic anhydride", quantity: "0.95", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch", reactionRole: "reactant", stoichCoeff: "1", pubchemQuery: "acetic anhydride", pubchemCid: "7918", molecularFormula: "C4H6O3", thermalSensitivity: "medium", mw: "102.09", tb: "412.95", pvap: "520", density: "1080", solubilityParameter: "20.3", molarVolume: "94.5" },
  { role: "input", name: "triethylamine", quantity: "1.10", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch", reactionRole: "reactant", stoichCoeff: "1", pubchemQuery: "triethylamine", pubchemCid: "8471", molecularFormula: "C6H15N", thermalSensitivity: "low", mw: "101.19", tb: "362.25", pvap: "7200", density: "726", solubilityParameter: "18.7", molarVolume: "139.0" },
  { role: "output", name: "benzyl acetate", quantity: "1.25", conversionBaseQuantity: "1.3887", unit: "kg", phase: "L", status: "calculated", timing: "in-process intermediate", fate: "product", scalingMode: "per batch", stoichCoeff: "1", pubchemQuery: "benzyl acetate", pubchemCid: "8785", molecularFormula: "C9H10O2", thermalSensitivity: "medium", mw: "150.18", tb: "485.95", pvap: "20", density: "1054", solubilityParameter: "19.1", molarVolume: "148.0" }
];

const tutorialRecoveryRows = [
  { role: "input", name: "benzyl acetate product-rich liquid", quantity: "3.25", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
  { role: "output", name: "triethylamine overhead recovery", quantity: "0.20", unit: "kg", phase: "V", status: "estimated", timing: "in-process intermediate", fate: "recovered solvent", scalingMode: "per batch", destinationGroup: "G1", recoveryPercent: "95" },
  { role: "output", name: "acetic anhydride recovery cut", quantity: "0.08", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "recover", scalingMode: "per batch", destinationGroup: "G1", recoveryPercent: "90" },
  { role: "output", name: "benzyl acetate product", quantity: "1.25", unit: "kg", phase: "L", status: "estimated", timing: "final output", fate: "product", scalingMode: "per batch" },
  { role: "waste", name: "benzyl alcohol residue", quantity: "0.10", unit: "kg", phase: "L", status: "estimated", timing: "waste purge", fate: "purge", scalingMode: "per batch", purgePercent: "100" }
];

function tutorialRevealPanels() {
  const main = $("appMain");
  if (main) {
    main.classList.remove("protocol-collapsed", "inspector-collapsed");
    main.classList.remove("scale-focused", "heuristic-focused");
  }
  if (typeof updateProtocolToggleIcon === "function") updateProtocolToggleIcon();
  if (typeof updateInspectorToggleIcon === "function") updateInspectorToggleIcon();
  if (typeof closeConversionModal === "function") closeConversionModal();
  closeSeparationSimulator();
  closeFlowsheetModal();
  setInspectorTab("inspect");
}

function tutorialStoredResume() {
  try {
    const parsed = JSON.parse(localStorage.getItem(tutorialResumeStorageKey) || "null");
    if (!parsed || !Number.isInteger(parsed.index)) return null;
    if (parsed.index <= 0 || parsed.index >= tutorialSteps.length - 1) return null;
    return parsed;
  } catch (_err) {
    return null;
  }
}

function tutorialSaveResume() {
  if (state.tutorialIndex <= 0 || state.tutorialIndex >= tutorialSteps.length - 1) {
    tutorialClearResume();
    return;
  }
  try {
    const step = tutorialSteps[state.tutorialIndex] || tutorialSteps[0];
    localStorage.setItem(tutorialResumeStorageKey, JSON.stringify({
      index: state.tutorialIndex,
      title: step.title,
      savedAt: new Date().toISOString()
    }));
  } catch (_err) {
    // Private browsing or locked storage should not break closing the tutorial.
  }
}

function tutorialClearResume() {
  try {
    localStorage.removeItem(tutorialResumeStorageKey);
  } catch (_err) {
    // Ignore storage failures; resume is a convenience only.
  }
}

function tutorialProjectIsLoaded() {
  return state.text === tutorialProtocolText && state.blocks.some(block => block.text === tutorialSelectionText);
}

function tutorialSelectionOffsets() {
  const start = tutorialProtocolText.indexOf(tutorialSelectionText);
  return { start, end: start + tutorialSelectionText.length, source: "annotated" };
}

function tutorialRecoveryOffsets() {
  const start = tutorialProtocolText.indexOf(tutorialRecoveryText);
  return { start, end: start + tutorialRecoveryText.length, source: "annotated" };
}

function tutorialResetProject() {
  tutorialRevealPanels();
  state.text = "";
  state.blocks = [];
  state.groups = {};
  state.links = [];
  state.selectedBlockId = null;
  state.selectedGroupId = null;
  state.selectedIds = [];
  state.connectingFrom = null;
  state.lastSelection = null;
  state.focusEndpoint = null;
  state.aiRefine = null;
  state.ruleChecks = [];
  state.zoom = 0.78;
  state.draftPos = { x: 24, y: 24 };
  state.boardCompact = false;
  $("sourceInput").value = tutorialProtocolText;
  renderAll();
}

function tutorialLoadTextView() {
  tutorialRevealPanels();
  $("sourceInput").value = tutorialProtocolText;
  if (state.text !== tutorialProtocolText) {
    state.text = tutorialProtocolText;
    state.blocks = [];
    state.groups = {};
    state.links = [];
    state.selectedBlockId = null;
    state.selectedGroupId = null;
    state.selectedIds = [];
    state.lastSelection = null;
    state.focusEndpoint = null;
    state.zoom = 0.78;
    state.draftPos = { x: 24, y: 24 };
    renderAll();
  } else {
    renderAll();
  }
}

function tutorialHighlightText() {
  tutorialLoadTextView();
  const offsets = tutorialSelectionOffsets();
  storeTextSelection(offsets);
  requestAnimationFrame(() => restoreTextSelection(offsets));
}

function tutorialHighlightRecoveryText() {
  tutorialLoadTextView();
  const offsets = tutorialRecoveryOffsets();
  storeTextSelection(offsets);
  requestAnimationFrame(() => restoreTextSelection(offsets));
}

async function tutorialEnsureBlock() {
  tutorialHighlightText();
  let block = state.blocks.find(item => item.text === tutorialSelectionText);
  if (!block) {
    const offsets = tutorialSelectionOffsets();
    await createBlock(offsets.start, offsets.end);
    block = state.blocks.find(item => item.text === tutorialSelectionText);
  }
  if (block) {
    state.phenomenaGridExpanded = true;
    selectBlock(block.id, false);
    requestAnimationFrame(() => restoreTextSelection(tutorialSelectionOffsets()));
  }
}

async function tutorialEnsureTask() {
  await tutorialEnsureBlock();
  const block = state.blocks.find(item => item.text === tutorialSelectionText);
  if (!block) return;
  if (!block.groupId) {
    state.selectedBlockId = block.id;
    state.selectedIds = [block.id];
    splitSelectedToNewGroup();
  } else {
    selectGroup(block.groupId);
  }
  state.boardCompact = false;
  requestAnimationFrame(() => {
    fitBoard();
    window.setTimeout(() => centerSelection(), 120);
  });
}

function tutorialReactionBlock() {
  return state.blocks.find(item => item.text === tutorialSelectionText) || state.blocks[0] || null;
}

async function tutorialOpenGroupDrawer() {
  await tutorialEnsureTask();
  const block = tutorialReactionBlock();
  if (!block?.groupId) return;
  selectGroup(block.groupId);
}

async function tutorialEnsureMaterials({ editRows = false } = {}) {
  await tutorialEnsureTask();
  const block = tutorialReactionBlock();
  if (!block) return;
  ensureBlockFlowFields(block);
  block.behavior = "reaction";
  block.phenomena = ["M(L)", "R(L)", "ES(H)"];
  block.conditions = {
    ...block.conditions,
    conversion_yield: "90",
    target_temperature: "65",
    reaction_time: "3",
    mixing_mode: "stirred liquid phase"
  };
  block.conditionUnits = {
    ...block.conditionUnits,
    conversion_yield: "%",
    target_temperature: "°C",
    reaction_time: "h"
  };
  const preservedGeneratedStreams = (block.streams || []).filter(stream => (
    stream.residualOf ||
    stream.status === "calculated" ||
    /\bconversion balance|unreacted|residual\b/i.test(`${stream.name || ""} ${stream.note || ""}`)
  ));
  block.streams = [
    ...tutorialMaterialRows.map((row, index) => createStream(row.role, {
    id: `${block.id}-S${index + 1}`,
    ...row,
    editing: editRows
    })),
    ...preservedGeneratedStreams.filter(stream => !tutorialMaterialRows.some((_, index) => stream.id === `${block.id}-S${index + 1}`))
  ];
  block.conversionDetail = {
    productStreamId: `${block.id}-S4`,
    productAmountMode: "theoretical",
    productBasisQuantity: "1.3887",
    balanceMethod: "stoichiometric",
    reactionEquation: "benzyl alcohol + acetic anhydride + triethylamine -> benzyl acetate + triethylammonium acetate",
    effluentName: "benzyl acetate reaction effluent",
    conversionPercent: "90",
    conversionStatus: "assumed",
    selectivityPercent: "100",
    selectivityStatus: "assumed",
    byproducts: [{
      id: "tutorial-triethylammonium-acetate",
      name: "triethylammonium acetate",
      basis: "generated by stoichiometry",
      stoichCoeff: "1",
      mw: "161.24",
      unit: "kg",
      role: "byproduct"
    }],
    lastGeneratedSummary: "Tutorial example ready for user review: actual product plus calculated reaction-effluent components."
  };
  syncLegacyStreamLists(block);
  const group = ensureGroup(block.groupId || "G1", "reaction");
  group.task = "benzyl acetate reaction at 90 percent yield";
  group.selectionBasis = "tutorial example: reaction block with material rows, phase labels, conversion/yield, and chemical properties";
  group.properties = {
    ...group.properties,
    density: { value: "930", unit: "kg/m3", status: "assumed", note: "tutorial mixture density for rough reactor sizing" }
  };
  if (typeof group.unitSuggestionsExpanded !== "boolean") group.unitSuggestionsExpanded = false;
  group.separationSupportExpanded = true;
  if (typeof group.selectedUnit !== "string") group.selectedUnit = "";
  const simulator = ensureGroup(group.id).separationSimulator;
  const needsLutzeDemo = !simulator?.substances?.length || simulator.substances.length < tutorialMaterialRows.length;
  if (needsLutzeDemo && typeof loadTripleReactantSeparationDemo === "function") {
    loadTripleReactantSeparationDemo(group.id);
  } else if (typeof syncSeparationSimulatorSubstances === "function") {
    syncSeparationSimulatorSubstances(groupModel(group.id) || group);
  }
  selectGroup(group.id);
}

async function tutorialEnsureRecoveryTask() {
  await tutorialEnsureMaterials();
  const reaction = tutorialReactionBlock();
  if (!reaction?.groupId) return;
  let block = state.blocks.find(item => item.text === tutorialRecoveryText);
  if (!block) {
    block = {
      id: nextBlockId(),
      groupId: "G2",
      start: tutorialProtocolText.indexOf(tutorialRecoveryText),
      end: tutorialProtocolText.indexOf(tutorialRecoveryText) + tutorialRecoveryText.length,
      source: "protocol",
      text: tutorialRecoveryText,
      behavior: "distillation purification",
      phenomena: ["M(L)", "PT(VL)", "PS(VL)", "PC(VL)", "ES(H)", "ES(C)"],
      streams: [],
      notes: "Tutorial recovery task added to compare multiple downstream separation options.",
      conditions: { target_temperature: "80", target_pressure: "100", separation_efficiency: "90", phase_change_time: "1.5" },
      conditionUnits: { target_temperature: "°C", target_pressure: "mbar", separation_efficiency: "%", phase_change_time: "h" },
      conditionsEditing: false,
      phase: "",
      endpoint: "benzyl acetate product-rich liquid split into recovery and product streams",
      status: "tutorial example"
    };
    ensureBlockFlowFields(block);
    ensureBlockConditionFields(block);
    state.blocks.push(block);
  }
  block.groupId = "G2";
  block.behavior = "distillation purification";
  block.phenomena = ["M(L)", "PT(VL)", "PS(VL)", "PC(VL)", "ES(H)", "ES(C)"];
  block.streams = tutorialRecoveryRows.map((row, index) => createStream(row.role, {
    id: `${block.id}-S${index + 1}`,
    ...row,
    editing: false
  }));
  syncLegacyStreamLists(block);
  const group = ensureGroup("G2", "residual reagent recovery");
  group.task = "residual reagent recovery";
  group.selectionBasis = "tutorial example: downstream separation task used to compare multiple recovery options before committing to a flowsheet route";
  group.unitSuggestionsExpanded = false;
  group.selectedUnit = "";
  group.properties = {
    ...group.properties,
    density: { value: "980", unit: "kg/m3", status: "assumed", note: "tutorial product-rich liquid density" }
  };
  if (!state.links.some(link => link.from === reaction.groupId && link.to === "G2")) {
    state.links.push({ from: reaction.groupId, to: "G2" });
  }
  state.boardCompact = true;
  selectGroup("G2");
}

async function tutorialShowMaterialRows() {
  await tutorialEnsureMaterials();
  selectGroup(tutorialReactionBlock()?.groupId || "G1");
}

async function tutorialShowChemicalProperties() {
  await tutorialEnsureMaterials({ editRows: true });
  const block = tutorialReactionBlock();
  if (block) selectBlock(block.id, false);
}

async function tutorialShowG1UnitOptions() {
  await tutorialEnsureMaterials();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  ensureGroup(groupId).unitSuggestionsExpanded = true;
  selectGroup(groupId);
}

async function tutorialAssignG1Unit() {
  await tutorialShowG1UnitOptions();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  const group = groupModel(groupId);
  const candidates = group ? unitOperationCandidatesForGroup(group) : [];
  const preferred = candidates.find(item => /batch|semi-batch/i.test(item.name)) || candidates[0];
  if (preferred) {
    ensureGroup(groupId).selectedUnit = preferred.name;
    ensureGroup(groupId).unitSuggestionsExpanded = false;
  }
  selectGroup(groupId);
  if (typeof renderAll === "function") renderAll();
}

async function tutorialSwitchG1UnitOptions() {
  await tutorialAssignG1Unit();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  ensureGroup(groupId).unitSuggestionsExpanded = true;
  selectGroup(groupId);
}

async function tutorialFocusReactionBlock() {
  await tutorialAssignG1Unit();
  const block = tutorialReactionBlock();
  if (!block) return;
  if (typeof closeConversionModal === "function") closeConversionModal();
  state.selectedBlockId = block.id;
  state.selectedGroupId = null;
  state.selectedIds = [block.id];
  state.focusEndpoint = block.groupId || block.id;
  state.boardCompact = false;
  if (typeof renderAll === "function") renderAll();
  requestAnimationFrame(() => {
    fitBoard();
    window.setTimeout(() => centerSelection(), 120);
  });
}

async function tutorialOpenReactionMenu() {
  await tutorialFocusReactionBlock();
  const block = tutorialReactionBlock();
  if (!block) return;
  if (typeof openConversionModal === "function") openConversionModal(block.id);
}

async function tutorialShowConversionApply() {
  await tutorialOpenReactionMenu();
  state.conversionView = "outputs";
  if (typeof renderConversionModal === "function") renderConversionModal();
}

async function tutorialApplyReactionBalance() {
  await tutorialOpenReactionMenu();
  const block = tutorialReactionBlock();
  if (!block) return;
  if (typeof applyConversionBalanceStreams === "function") applyConversionBalanceStreams(block);
  if (typeof openConversionModal === "function") openConversionModal(block.id);
}

async function tutorialShowUnitOptions() {
  await tutorialEnsureRecoveryTask();
  const groupId = "G2";
  ensureGroup(groupId).unitSuggestionsExpanded = true;
  selectGroup(groupId);
}

async function tutorialShowLutzeLaunch() {
  await tutorialEnsureRecoveryTask();
  if (typeof closeConversionModal === "function") closeConversionModal();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  ensureGroup(groupId).unitSuggestionsExpanded = false;
  selectGroup(groupId);
}

async function tutorialOpenLutzeScene() {
  await tutorialEnsureRecoveryTask();
  if (typeof closeConversionModal === "function") closeConversionModal();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  openLutzeReactionSeparation(groupId);
}

async function tutorialTryFirstLutzeRoute() {
  await tutorialOpenLutzeScene();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  ensureGroup(groupId).separationSimulator.pathway.viewMode = "manual";
  const group = groupModel(groupId);
  if (!group || typeof separationPathwayModel !== "function" || typeof tryPathwayRoute !== "function") return;
  const path = separationPathwayModel(group);
  if (!path.steps?.length && path.nextOptions?.length) {
    tryPathwayRoute(groupId, path.nextOptions[0].id);
  }
  ensureGroup(groupId).separationSimulator.tab = "pathway";
  if (typeof renderSeparationSimulatorModal === "function") renderSeparationSimulatorModal();
}

async function tutorialShowManualLutzeMode() {
  await tutorialOpenLutzeScene();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  ensureGroup(groupId).separationSimulator.pathway.viewMode = "manual";
  if (typeof renderSeparationSimulatorModal === "function") renderSeparationSimulatorModal();
}

async function tutorialEnsureAppliedLutzePathway() {
  await tutorialTryFirstLutzeRoute();
  const groupId = tutorialReactionBlock()?.groupId || "G1";
  const simulator = ensureGroup(groupId).separationSimulator;
  const group = groupModel(groupId);
  const path = group && typeof separationPathwayModel === "function" ? separationPathwayModel(group) : null;
  if (path && !path.canApply && path.alternatives?.length && typeof usePathwayAlternative === "function") {
    usePathwayAlternative(groupId, path.alternatives.find(item => item.status === "complete")?.id || path.alternatives[0].id);
  }
  if (!simulator.pathway?.appliedAt && typeof applyPathwayToMainFlowsheet === "function") {
    applyPathwayToMainFlowsheet(groupId);
  }
  state.boardCompact = true;
  if (typeof renderAll === "function") renderAll();
}

function tutorialScheduleForGroup(group, index) {
  const text = `${group.task || ""} ${group.selectedUnit || ""}`.toLowerCase();
  if (/reaction|reactor|acetylation/.test(text)) {
    return { durationH: "3", capacityAmount: "6", capacityUnit: "m3", operationClass: "reaction_kinetic", scaleSensitivity: "kinetics-bound", notes: "Tutorial schedule: reaction hold time from protocol; verify heat transfer and agitation at scale." };
  }
  if (/distill|evapor|flash|thermal|recovery/.test(text)) {
    return { durationH: "2", capacityAmount: "4", capacityUnit: "m3", operationClass: "heating_cooling", scaleSensitivity: "equipment dependent", notes: "Tutorial schedule: recovery/separation placeholder for scale-up screening." };
  }
  return { durationH: index <= 1 ? "1" : "1.5", capacityAmount: "", capacityUnit: "", operationClass: "separation", scaleSensitivity: "equipment dependent", notes: "Tutorial schedule: draft pathway separator; replace with measured or vendor data before publication." };
}

async function tutorialPrepareHeuristics() {
  await tutorialEnsureAppliedLutzePathway();
  closeSeparationSimulator();
  setInspectorTab("heuristics");
  if (typeof runRuleChecks === "function") runRuleChecks();
  else if (typeof renderAll === "function") renderAll();
}

async function tutorialPrepareScaleUp() {
  await tutorialPrepareHeuristics();
  const basis = ensureScaleBasis();
  Object.assign(basis, {
    targetProduct: "benzyl acetate",
    targetAmount: "250",
    targetUnit: "kg/batch",
    referenceBlockId: tutorialRecoveryBlock()?.id || tutorialReactionBlock()?.id || "",
    basisAmount: "1.25",
    basisUnit: "kg",
    mode: "batch",
    scheduleMethod: "duration",
    operatingDays: "250",
    hoursPerDay: "16",
    oeePercent: "80",
    parallelUnits: "1",
    allowableCapacityUtilizationPercent: "85",
    productKgPerBatch: "250",
    reactorWorkingFillPercent: "70",
    productMolecularWeightGmol: "150.18",
    confidence: "rough"
  });
  groupIdsInTextOrder().forEach((groupId, index) => {
    const group = ensureGroup(groupId);
    group.schedule = { ...scheduleDefaults(), ...group.schedule, ...tutorialScheduleForGroup(group, index) };
  });
  state.expandedScaleSections = { ...state.expandedScaleSections, referenceBasis: true, operatingSchedule: true, reactorSizing: true };
  setInspectorTab("scale");
  if (typeof renderAll === "function") renderAll();
}

function tutorialRecoveryBlock() {
  return state.blocks.find(item => item.text === tutorialRecoveryText) || null;
}

const tutorialSteps = [
  {
    target: "#sourceInput",
    title: "Part 1 · 1. Build From Text",
    body: "Start by pasting or writing the lab protocol. The tool never replaces your judgement: it only helps turn written operations into editable process blocks.",
    details: ["This example uses one short protocol so the full path is visible.", "Every automatic extraction should be checked before it becomes a task."],
    action: tutorialResetProject,
    cta: "Load example text",
    ctaAction: tutorialLoadTextView
  },
  {
    target: "#loadTextSide",
    title: "Part 1 · 2. Load Text View",
    body: "Load Text View copies the protocol into the annotated area below. That is the surface where selections become traceable blocks.",
    details: ["You can still edit the source text first.", "Loading a different text intentionally starts a fresh block set."],
    action: tutorialLoadTextView,
    cta: "Load text",
    ctaAction: tutorialLoadTextView
  },
  {
    target: "#annotatedText",
    title: "Part 1 · 3. Select One Operation",
    body: "Select the sentence that describes one physical operation. Here the reaction sentence is highlighted because it should become a separate block.",
    details: ["Keep blocks small enough to represent one operation.", "Overly long blocks make phenomena and mass-flow checks weaker."],
    action: tutorialHighlightText
  },
  {
    target: "#createBlockSide",
    title: "Part 1 · 4. Create Block",
    body: "Click Create Block From Selection to create the block. You can do the same thing with right click on the selected text and Create Block From Selection.",
    details: ["The block keeps a link back to this exact text range.", "This is the point where text becomes structured process evidence."],
    action: tutorialHighlightText,
    cta: "Create block",
    ctaAction: tutorialEnsureBlock
  },
  {
    target: "[data-block-card]",
    title: "Part 1 · 5. Automatic Reading",
    body: "The block opens on the board and in the right panel. The tool has automatically guessed behavior, conditions, and phenomena from the selected sentence.",
    details: ["Automatic guesses can be wrong or incomplete.", "Treat them as a first draft, not as final process knowledge."],
    action: tutorialEnsureBlock
  },
  {
    target: "#phenomenaGridSection",
    title: "Part 1 · 6. Edit Phenomena",
    body: "Use the right panel to change the preset or add and remove individual phenomena. This is where you correct the automatic reading before downstream logic uses it.",
    details: ["For this step, reaction, liquid mixing, heating, temperature, time, and yield are detected from the selected sentence.", "If mixing, phase contact, reaction, filtration, or separation are missing, adjust them here."],
    action: tutorialEnsureBlock
  },
  {
    target: "[data-assign-task]",
    title: "Part 1 · 7. Convert To Task",
    body: "When you are confident the block and phenomena are correct, convert it to a task. A task is the unit the network, MFA, scale-up, and flowchart views can reason over.",
    details: ["Use one block per task for simple cases.", "Combine multiple blocks only when they really belong to the same process operation."],
    action: tutorialEnsureBlock,
    cta: "Convert to task",
    ctaAction: tutorialEnsureTask
  },
  {
    target: "#groupFlow",
    title: "Part 1 Complete",
    body: "The created task is now part of the process graph. From here the next job is to add substances, quantities, phases, and product/reagent roles so the later views have real data.",
    details: ["Part 1 order: text, block, verified phenomena, task.", "Part 2 starts from this task and adds the material basis used by unit-operation suggestions, scale-up, LCI, and Lutze."],
    action: tutorialEnsureTask,
    cta: "Center task",
    ctaAction: () => centerSelection()
  },
  {
    target: "[data-add-group-task-stream=\"input\"]",
    title: "Part 2 · 1. Add Substances",
    body: "Open the task drawer and add material rows. Inputs are reactants, solvent, catalyst, or auxiliary feeds; outlets are product, recovery, waste, purge, or intermediate streams.",
    details: ["You can add rows one by one with + Task input and + Task outlet.", "For the tutorial, the next button fills a complete small reaction set so you can see the downstream logic."],
    action: tutorialOpenGroupDrawer,
    cta: "Add example substances",
    ctaAction: tutorialShowMaterialRows
  },
  {
    target: ".group-mfa-grid",
    title: "Part 2 · 2. Material Basis",
    body: "Now the task has named substances, amounts, units, phases, and reaction roles. This is the auditable MFA basis used by the rest of the tool.",
    details: ["Benzyl alcohol, acetic anhydride, and triethylamine are inputs.", "Benzyl acetate is marked as the product outlet; 90 percent yield leaves residual reactants for recovery screening."],
    action: tutorialShowMaterialRows
  },
  {
    target: ".stream-chemical",
    title: "Part 2 · 3. Properties",
    body: "Chemical properties can be entered manually or helped by PubChem. Lutze and property screening need fields such as MW, boiling point, vapor pressure, density, and thermal sensitivity.",
    details: ["Property values are evidence fields, not magic truth.", "Missing values stay visible so you know which route suggestions are weak."],
    action: tutorialShowChemicalProperties
  },
  {
    target: "[data-suggest-unit-operation=\"G1\"]",
    title: "Part 2 · 4. Assign Unit In G1",
    body: "A task can contain several pieces of evidence and still stay in G1 when they belong to the same physical operation. Here G1 has reaction text, materials, conditions, and product basis together.",
    details: ["Assign Unit Operation unlocks only after the task has MFA, phase labels, and operating conditions.", "Use it to choose equipment for the current task before creating extra downstream tasks."],
    action: tutorialEnsureMaterials,
    cta: "Show G1 units",
    ctaAction: tutorialShowG1UnitOptions
  },
  {
    target: ".board-unit-picker",
    title: "Part 2 · 5. Choose Reactor",
    body: "The options are ranked from the task type, streams, phases, phenomena, and conditions. For this liquid reaction, a batch or semi-batch reactor is a credible first equipment class.",
    details: ["This is still editable: it records the selected unit, not a final design.", "The same control later becomes Switch Unit Operation if you want to revise the choice."],
    action: tutorialShowG1UnitOptions,
    cta: "Assign reactor",
    ctaAction: tutorialAssignG1Unit
  },
  {
    target: "[data-suggest-unit-operation=\"G1\"]",
    title: "Part 2 · 6. Switch G1 Unit",
    body: "After one unit is selected, the button changes from assign to switch. Use this when better evidence suggests CSTR, PFR, packed bed, or another reactor class.",
    details: ["Switching the unit does not delete the MFA or reaction data.", "It only changes the equipment hypothesis attached to G1."],
    action: tutorialAssignG1Unit,
    cta: "Show switch options",
    ctaAction: tutorialSwitchG1UnitOptions
  },
  {
    target: "[data-block-card]",
    title: "Part 2 · 7. Reaction Menu",
    body: "The reaction menu belongs to the reaction block inside G1. Open it when you want yield, product basis, reactant roles, byproducts, and residual outlets checked together.",
    details: ["Only streams marked as reactants enter the stoichiometric conversion balance.", "Solvent, catalyst, auxiliary, and inert streams remain tracked but are not consumed as reagents."],
    action: tutorialFocusReactionBlock,
    cta: "Open reaction menu",
    ctaAction: tutorialOpenReactionMenu
  },
  {
    target: ".conversion-basis-section",
    title: "Part 2 · 8. Yield Basis",
    body: "The reaction balance keeps the reported product amount separate from its theoretical basis. You choose whether the source reports an actual amount, a theoretical amount, or enough reactant data to calculate it.",
    details: ["Here benzyl acetate is the main product.", "Yield, conversion, and selectivity are checked together, but remain user-reviewed assumptions."],
    action: tutorialOpenReactionMenu
  },
  {
    target: "#conversionApplyBalance",
    title: "Part 2 · 9. Save Reaction Balance",
    body: "The final review shows the product and the components expected in the shared reaction effluent. Save reaction balance writes this reviewed material inventory; LUTZE remains a separate downstream decision.",
    details: ["Residuals are not automatically final waste: they can become recovery, recycle, purge, or downstream separation feeds.", "After saving, review the separation in LUTZE to assign physical outlets."],
    action: tutorialShowConversionApply,
    cta: "Save reaction balance",
    ctaAction: tutorialApplyReactionBalance
  },
  {
    target: "#annotatedText",
    title: "Part 2 · 10. Same Group Or New Task",
    body: "Do not create G2 by habit. Keep work in G1 when it is the same reactor operation; create a new task only when the text describes a separate downstream operation, equipment, or decision point.",
    details: ["This protocol has a separate recovery sentence, so the tutorial creates a recovery task after G1.", "In another case, multiple source blocks can stay grouped in G1 if they represent one coherent unit operation."],
    action: tutorialHighlightRecoveryText,
    cta: "Create recovery task",
    ctaAction: tutorialEnsureRecoveryTask
  },
  {
    target: "[data-suggest-unit-operation=\"G2\"]",
    title: "Part 2 · 11. Recovery Unit Options",
    body: "Now the recovery task has enough evidence to compare real separation choices, not only reactor choices.",
    details: ["It includes liquid feed, volatile recovery, product outlet, waste residue, pressure, temperature, and efficiency evidence.", "That richer basis unlocks several candidate unit operations."],
    action: tutorialEnsureRecoveryTask,
    cta: "Show unit options",
    ctaAction: tutorialShowUnitOptions
  },
  {
    target: ".board-unit-picker",
    title: "Part 2 · 12. Compare Options",
    body: "Now you should see several options for the recovery task. They are candidates, not final design choices: compare why each one was suggested before selecting equipment.",
    details: ["Typical alternatives here include distillation/evaporation-style recovery and related thermal separation options.", "The purpose is to compare routes before committing them to the main flowsheet."],
    action: tutorialShowUnitOptions
  },
  {
    target: "[data-open-lutze-reaction-separation]",
    title: "Part 3 · 1. Lutze Support",
    body: "When a reaction leaves product mixed with residual reagents or recoverable components, open Lutze/Garg Separation Screening before changing the main graph.",
    details: ["The workspace keeps conversion, selectivity, yield, phases, binary evidence, and properties distinct.", "The main flowchart changes only after a complete pathway is reviewed and applied."],
    action: tutorialShowLutzeLaunch,
    cta: "Open Lutze",
    ctaAction: tutorialOpenLutzeScene
  },
  {
    target: "#separationSimulatorBody",
    title: "Part 3 · 2. Lutze Scene",
    body: "The objective stays at the top: the product to retain and the component destinations. Use Mixture & objective only when these inputs need correction.",
    details: ["The pathway workspace stays separate from mixture editing.", "Nothing changes in the main graph until a complete draft is applied."],
    action: tutorialOpenLutzeScene
  },
  {
    target: ".pathway-mode-switch",
    title: "Part 3 · 3. Choose A Pathway Mode",
    body: "Recommended pathways calculates complete drafts in the background. Build step by step lets you choose each separation yourself.",
    details: ["Recommended drafts are ranked by phase compatibility, evidence, missing checks, route length, added agents, and thermal exposure.", "Any recommended pathway becomes editable before it is applied."],
    action: tutorialOpenLutzeScene
  },
  {
    target: ".pathway-alternative-grid",
    title: "Part 3 · 4. Recommended Pathways",
    body: "Each card is a complete route profile: strongest evidence, fewer operations, or lower thermal exposure. These are screening alternatives, not process simulation results.",
    details: ["Compare the full sequence and its evidence score.", "Use as editable draft moves a recommendation into the manual builder."],
    action: tutorialOpenLutzeScene
  },
  {
    target: ".pathway-options-panel",
    title: "Part 3 · 5. Build Step By Step",
    body: "Manual mode lists at least one next move for each separable component before showing extra variants. Choose one operation at a time to draw your own sequence.",
    details: ["Each option states what leaves and what remains in the product-rich stream.", "You can select an existing step to replace that branch."],
    action: tutorialShowManualLutzeMode,
    cta: "Try first route",
    ctaAction: tutorialTryFirstLutzeRoute
  },
  {
    target: ".pathway-canvas",
    title: "Part 3 · 6. Preview Pathway",
    body: "The canvas now shows the draft separation sequence: post-reaction mixture, route step, separated outlet, and remaining stream.",
    details: ["At this point the route is still a proposal.", "Check the selected unit, separated compounds, retained compounds, and missing property warnings."],
    action: tutorialTryFirstLutzeRoute
  },
  {
    target: "[data-pathway-apply]",
    title: "Part 3 · 7. Apply Pathway",
    body: "Apply Pathway converts the Lutze preview into editable separation tasks in the main process graph.",
    details: ["This is the moment a sandbox route becomes process structure.", "After applying, review the inserted tasks, streams, and assumptions before using them in scale-up or export."],
    action: tutorialTryFirstLutzeRoute,
    cta: "Apply preview",
    ctaAction: tutorialEnsureAppliedLutzePathway
  },
  {
    target: "#groupFlow",
    title: "Part 3 Complete",
    body: "The applied Lutze route is back in the process graph as editable tasks. The remaining steps check whether the process evidence is coherent enough for reporting.",
    details: ["Everything inserted from Lutze is deliberately labelled as proposed.", "Before publication, replace placeholders with experimental, literature, or vendor-backed values."],
    action: tutorialEnsureAppliedLutzePathway
  },
  {
    target: "#heuristicsPanel",
    title: "Part 4 · 1. Heuristic Rules",
    body: "Heuristic rules review the current graph for missing basis data, weak assumptions, scale-up risks, recycle logic, and export readiness.",
    details: ["The first three audit-only prompts are intentionally skipped in this guided path.", "Use these findings as a structured review list before treating the model as publishable."],
    action: tutorialPrepareHeuristics,
    cta: "Run checks",
    ctaAction: tutorialPrepareHeuristics
  },
  {
    target: "#heuristicRuleCheckPanel",
    title: "Part 4 · 2. Review Findings",
    body: "The findings panel is where you decide what to accept, reject, override, or fix. Those decisions become part of the traceable work log.",
    details: ["A warning is not automatically a design error.", "For publication, unresolved warnings should have a note explaining the evidence or limitation."],
    action: tutorialPrepareHeuristics
  },
  {
    target: "#scaleQuickPanel",
    title: "Part 4 · 3. Scale-Up Target",
    body: "Scale-up starts with a target product and production basis. The example uses benzyl acetate so the material rows, product basis, schedule, and bottleneck checks line up.",
    details: ["Changing the target recalculates flows from the lab basis.", "Use batch, daily, or annual basis depending on what your study reports."],
    action: tutorialPrepareScaleUp
  },
  {
    target: "#scaleBasisPanel",
    title: "Part 4 · 4. Scale-Up Decision",
    body: "Choose the planning scenario, calendar, production trains, and working fill. The panel then summarizes the production plan, equipment sizing, and the three most important review areas.",
    details: ["Conservative uses the complete batch makespan; Overlapped uses the limiting equipment cycle.", "Reference, schedule, and sizing overrides remain available under Advanced assumptions."],
    action: tutorialPrepareScaleUp
  },
  {
    target: "#workMenuToggle",
    title: "Tutorial Complete",
    body: "You now have the full loop: text to block, block to task, material basis, recovery task, unit options, Lutze pathway, heuristic review, scale-up, and export-ready state.",
    details: ["Save the project JSON when you want to reload the editable work later.", "Use the LCI/openLCA/PowerPoint exports only after checking assumptions and unresolved warnings."],
    action: tutorialPrepareScaleUp
  }
];

async function openTutorial(index = 0) {
  try {
    let startIndex = Math.max(0, Math.min(index, tutorialSteps.length - 1));
    const explicitIndex = arguments.length > 0;
    const saved = explicitIndex ? null : tutorialStoredResume();
    if (saved) {
      const stepNumber = saved.index + 1;
      const resume = await confirmModal(
        `Continue the tutorial from step ${stepNumber} (${saved.title || "saved step"})? Choose Restart to start from the beginning.`,
        { okLabel: "Continue", cancelLabel: "Restart" }
      );
      if (resume) {
        startIndex = saved.index;
      } else {
        tutorialClearResume();
        startIndex = 0;
      }
    }
    const canReuseCurrentTutorialProject = startIndex > 0 && tutorialProjectIsLoaded();
    if (state.blocks.length && !canReuseCurrentTutorialProject) {
      if (!(await confirmModal("This tutorial will replace the current project with a short guided example. Continue?"))) return;
      pushUndo();
    }
    if (!canReuseCurrentTutorialProject || startIndex === 0) tutorialResetProject();
    state.tutorialIndex = startIndex;
    window.setTimeout(() => {
      Promise.resolve()
        .then(async () => {
          $("tutorialOverlay").hidden = false;
          await renderTutorialStep();
        })
        .catch(async error => {
          console.error("Tutorial failed to start", error);
          await alertModal("The tutorial could not start. Please refresh the page and try again.");
        });
    }, 0);
  } catch (error) {
    console.error("Tutorial failed to start", error);
    await alertModal("The tutorial could not start. Please refresh the page and try again.");
  }
}

function closeTutorial(options = {}) {
  const complete = Boolean(options.complete) || state.tutorialIndex >= tutorialSteps.length - 1;
  if (complete) tutorialClearResume();
  else tutorialSaveResume();
  $("tutorialOverlay").hidden = true;
  const arrow = $("tutorialArrow");
  if (arrow) arrow.hidden = true;
  if (typeof closeConversionModal === "function") closeConversionModal();
  closeFlowsheetModal();
  closeSeparationSimulator();
  if (tutorialSettleFrame) cancelAnimationFrame(tutorialSettleFrame);
  tutorialSettleFrame = null;
}

async function renderTutorialStep() {
  const step = tutorialSteps[state.tutorialIndex] || tutorialSteps[0];
  await Promise.resolve(step.action?.());
  const target = document.querySelector(step.target);
  tutorialScrollTargetIntoView(target);
  positionTutorialStep(step);
  watchTutorialScrollSettle(step);
}

function tutorialScrollTargetIntoView(target) {
  if (!target) return;
  const scroller = target.closest?.(".modal-body");
  target.scrollIntoView?.({ block: "center", inline: "center", behavior: scroller ? "auto" : "smooth" });
  if (!scroller) return;
  const targetRect = target.getBoundingClientRect?.();
  const scrollerRect = scroller.getBoundingClientRect?.();
  if (!targetRect || !scrollerRect || !Number.isFinite(scroller.scrollTop)) return;
  const delta = targetRect.top - scrollerRect.top - (scrollerRect.height - targetRect.height) / 2;
  scroller.scrollTo?.({ top: Math.max(0, scroller.scrollTop + delta), behavior: "auto" });
}

let tutorialSettleFrame = null;
function watchTutorialScrollSettle(step) {
  if (tutorialSettleFrame) cancelAnimationFrame(tutorialSettleFrame);
  let lastRect = null;
  let stableFrames = 0;
  const tick = () => {
    if ($("tutorialOverlay").hidden) { tutorialSettleFrame = null; return; }
    const target = document.querySelector(step.target);
    const rect = target ? target.getBoundingClientRect() : null;
    const unchanged = lastRect && rect && rect.top === lastRect.top && rect.left === lastRect.left;
    stableFrames = unchanged ? stableFrames + 1 : 0;
    lastRect = rect;
    positionTutorialStep(step);
    if (stableFrames >= 4) { tutorialSettleFrame = null; return; }
    tutorialSettleFrame = requestAnimationFrame(tick);
  };
  tutorialSettleFrame = requestAnimationFrame(tick);
}

function positionTutorialStep(step) {
  const overlay = $("tutorialOverlay");
  if (overlay.hidden) return;
  const target = document.querySelector(step.target);
  const card = $("tutorialCard");
  const spotlight = $("tutorialSpotlight");
  const arrow = $("tutorialArrow");
  const rect = target ? target.getBoundingClientRect() : { left: 24, top: 90, width: 220, height: 90, right: 244, bottom: 180 };
  const pad = 8;
  const safeLeft = Math.max(8, rect.left - pad);
  const safeTop = Math.max(8, rect.top - pad);
  spotlight.style.left = `${safeLeft}px`;
  spotlight.style.top = `${safeTop}px`;
  spotlight.style.width = `${Math.min(window.innerWidth - 16, rect.width + pad * 2)}px`;
  spotlight.style.height = `${Math.min(window.innerHeight - 16, rect.height + pad * 2)}px`;

  $("tutorialProgress").textContent = `${state.tutorialIndex + 1} / ${tutorialSteps.length}`;
  $("tutorialTitle").textContent = step.title;
  $("tutorialBody").textContent = step.body;
  $("tutorialDetail").innerHTML = (step.details || []).map(item => `<span>${escapeHtml(item)}</span>`).join("");
  $("tutorialPrev").disabled = state.tutorialIndex === 0;
  $("tutorialNext").textContent = state.tutorialIndex === tutorialSteps.length - 1 ? "Finish" : "Next";

  const actionButton = $("tutorialDo");
  actionButton.hidden = !step.cta;
  actionButton.textContent = step.cta || "Show";
  actionButton.onclick = step.ctaAction
    ? async () => {
      await Promise.resolve(step.ctaAction());
      window.setTimeout(() => positionTutorialStep(tutorialSteps[state.tutorialIndex] || tutorialSteps[0]), 180);
    }
    : null;

  const cardWidth = Math.min(410, window.innerWidth - 32);
  const placeRight = rect.right + 18 + cardWidth < window.innerWidth;
  const placeLeft = rect.left - 18 - cardWidth > 0;
  card.style.width = `${cardWidth}px`;
  card.style.left = `${placeRight ? rect.right + 18 : placeLeft ? rect.left - cardWidth - 18 : Math.max(16, (window.innerWidth - cardWidth) / 2)}px`;
  // The clamp used to assume a 260px card, but cards run 250-302px depending on how
  // much body and detail text a step carries. Whenever the step's target sat low
  // enough for the clamp to bind, the bottom of the card - which is where Back/Next
  // live - was pushed past the bottom of the window, and since the overlay is fixed
  // the user cannot scroll to it: the tutorial simply stops advancing. Measure the
  // card instead of guessing, and keep a 16px margin below it.
  const cardHeight = card.getBoundingClientRect().height || 260;
  card.style.top = `${Math.max(16, Math.min(rect.top, window.innerHeight - cardHeight - 16))}px`;

  positionTutorialArrow(target, card, arrow);
}

function positionTutorialArrow(target, card, arrow) {
  if (!target || !arrow) {
    if (arrow) arrow.hidden = true;
    return;
  }
  const cardRect = card.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + Math.min(targetRect.height / 2, 92);
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;
  const fromLeft = targetX < cardCenterX;
  const startX = fromLeft ? cardRect.left : cardRect.right;
  const startY = Math.max(cardRect.top + 36, Math.min(cardCenterY, cardRect.bottom - 36));
  const deltaX = targetX - startX;
  const deltaY = targetY - startY;
  const length = Math.max(56, Math.hypot(deltaX, deltaY) - 18);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  arrow.hidden = false;
  arrow.style.left = `${startX}px`;
  arrow.style.top = `${startY}px`;
  arrow.style.width = `${length}px`;
  arrow.style.transform = `rotate(${angle}deg)`;
}
