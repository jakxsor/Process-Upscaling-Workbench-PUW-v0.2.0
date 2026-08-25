    // Guided tour of the main workflow. Split out of app.js for navigability; loaded as a plain
    // <script> before app.js (see app.py) so these functions share the same global scope as the
    // rest of the app. Depends on: $, state, escapeHtml, confirmModal, pushUndo, renderAll,
    // blocksForGroup, fitBoard, centerSelection, ensureGroup, selectGroup, groupModel,
    // groupIdsInTextOrder, separationSimulatorModel, binaryRouteVariants, insertSeparationRoute,
    // openSeparationSimulator, closeSeparationSimulator, renderSeparationSimulatorModal,
    // closeFlowsheetModal, openFlowsheetModal, setSourcePanelTab, setInspectorTab, runRuleChecks,
    // loadMethylbenzeneExampleProject — all defined in app.js.

    function tutorialCenterFlowchart(groupId = "G1") {
      closeSeparationSimulator();
      closeFlowsheetModal();
      state.boardCompact = true;
      if (state.groups[groupId]) {
        state.selectedGroupId = groupId;
        state.selectedBlockId = null;
        state.selectedIds = blocksForGroup(groupId).map(block => block.id);
        state.focusEndpoint = groupId;
      }
      renderAll();
      requestAnimationFrame(() => {
        fitBoard();
        window.setTimeout(() => centerSelection(), 120);
      });
    }

    function tutorialOpenSeparationSimulator(tab = "binary") {
      closeFlowsheetModal();
      state.boardCompact = true;
      const groupId = "G1";
      if (!state.groups[groupId]) return;
      ensureGroup(groupId).separationSimulator.tab = tab;
      selectGroup(groupId);
      openSeparationSimulator(groupId);
      ensureGroup(groupId).separationSimulator.tab = tab;
      renderSeparationSimulatorModal();
    }

    function tutorialInsertFirstSeparationRoute() {
      closeFlowsheetModal();
      closeSeparationSimulator();
      const existing = groupIdsInTextOrder()
        .map(groupModel)
        .find(group => /volatility route|methylbenzene\s*\/\s*benzaldehyde|benzaldehyde\s*\/\s*methylbenzene/i.test(`${group.task} ${group.selectionBasis}`));
      if (existing && existing.id !== "G1") {
        tutorialCenterFlowchart(existing.id);
        return;
      }
      const group = groupModel("G1");
      if (!group) return;
      const model = separationSimulatorModel(group);
      const pair = model.pairs.find(item => binaryRouteVariants("G1", item).some(variant => variant.id === "volatility-route")) || model.pairs[0];
      const variant = pair ? binaryRouteVariants("G1", pair).find(item => item.id === "volatility-route") || binaryRouteVariants("G1", pair)[0] : null;
      if (!pair || !variant) {
        tutorialCenterFlowchart("G1");
        return;
      }
      insertSeparationRoute("G1", pair.key, variant.id);
      state.boardCompact = true;
      requestAnimationFrame(() => {
        fitBoard();
        window.setTimeout(() => centerSelection(), 120);
      });
    }

    // Every step walks through the same loaded example (methylbenzene oxidation -> distillation,
    // see loadMethylbenzeneExampleProject) so the tour shows real, populated panels instead of
    // empty ones. Several panels (Heuristics, Scale-Up) are only rendered lazily by their own
    // "Run Check"/"Apply Rules" actions rather than by the general renderAll(), so steps that land
    // on those tabs carry an `action` that triggers the same render path a user would.
    const tutorialSteps = [
      { target: "header h1", title: "1. Worked Example", body: "This tutorial loads a small reaction and separation case: methylbenzene is oxidized to benzaldehyde at 90 percent yield, then residual methylbenzene is recovered.", details: ["The tour is interactive: some steps can center the board, open the simulator, or insert a candidate separation route.", "The inserted route is a hypothesis generated from property screening, not a paper-confirmed design."], action: () => tutorialCenterFlowchart("G1"), cta: "Center board", ctaAction: () => tutorialCenterFlowchart("G1") },
      { target: "#sourceInput", title: "2. Source Protocol", body: "The workflow starts from editable text. The protocol text is kept larger here so it is easier to follow while blocks are created and audited.", details: ["Select text to create a protocol block.", "Use manual empty blocks when a required industrial step is not written in the protocol."], action: () => { closeSeparationSimulator(); setSourcePanelTab("protocol"); } },
      { target: "#annotatedText", title: "3. Traceable Blocks", body: "B1 is the reaction evidence and B2 is the recovery/distillation evidence. The highlights let you move between source text, blocks, groups, MFA, and unit choices without losing traceability.", details: ["Click a highlight to select it.", "Right-click a highlight to create or manage blocks."], action: () => setSourcePanelTab("protocol") },
      { target: "#groupFlow", title: "4. Before Simulation", body: "This is the current process graph before adding any simulated separation. G1 is the reaction; G2 is the residual methylbenzene recovery. The recycle arrow from G2 back to G1 means recovered methylbenzene is reused.", details: ["Compact view is useful for clicking and understanding task groups quickly.", "The blue/green aura marks the group currently selected."], action: () => tutorialCenterFlowchart("G1"), cta: "Fit flowchart", ctaAction: () => tutorialCenterFlowchart("G1") },
      { target: "#stepFlowInspector", title: "5. Group Aggregate", body: "Clicking a group opens the aggregate drawer. Here the tool sums the selected group's block streams, phenomena, and conditions so you can edit missing words or quantities before trusting downstream suggestions.", details: ["This is where small text corrections matter: one missing material name can change the simulator inputs.", "The drawer remains editable; the board now has extra scroll room when it is open."], action: () => { closeSeparationSimulator(); setInspectorTab("inspect"); selectGroup("G1"); } },
      { target: "#separationSimulatorBody", title: "6. Separation Simulator", body: "The simulator reads substances from the selected reaction group and asks whether property differences justify a candidate separation route.", details: ["For this demo it compares methylbenzene and benzaldehyde.", "The logic uses reaction balance, pure properties, binary screening, and KB3.1-style route rules."], action: () => tutorialOpenSeparationSimulator("balance"), cta: "Open binary screen", ctaAction: () => tutorialOpenSeparationSimulator("binary") },
      { target: "#separationSimulatorBody", title: "7. Binary Screening", body: "Binary screening is where boiling point, vapor pressure, molecular weight, miscibility, azeotrope, or affinity data become route theories. The tool should suggest alternatives, not silently decide the flowsheet.", details: ["Supported routes show why they triggered.", "Missing fields remain visible so you know what is still assumption."], action: () => tutorialOpenSeparationSimulator("binary"), cta: "Show suggestions", ctaAction: () => tutorialOpenSeparationSimulator("suggestions") },
      { target: "#separationSimulatorBody", title: "8. Apply As Candidate", body: "This step shows the after-state. Applying the route inserts a new candidate separation group into the graph, with its own block, phenomena, unit suggestion, streams, and selection basis.", details: ["This is deliberately a candidate route.", "You can delete or revise it later if the property data do not justify it."], action: () => tutorialOpenSeparationSimulator("suggestions"), cta: "Insert route", ctaAction: tutorialInsertFirstSeparationRoute },
      { target: "#groupFlow", title: "9. After Simulation", body: "The graph now includes the inserted separator candidate. Compare this to the earlier before-state: the simulator has changed the process structure, not just written a note.", details: ["The new group remains clickable and editable like any other task.", "Review links, MFA quantities, and unit choice before using it in scale-up."], action: tutorialInsertFirstSeparationRoute, cta: "Center route", ctaAction: () => centerSelection() },
      { target: "#inspectorPanel", title: "10. Phenomena/Group", body: "The right panel explains and edits what is selected. Use it to confirm phenomena, task assignment, unit alternatives, and why a group exists.", details: ["For inserted routes, check the selection basis first.", "If the evidence is weak, keep it as hypothesis or remove it."], action: () => { closeSeparationSimulator(); setInspectorTab("inspect"); } },
      { target: "#heuristicsPanel", title: "11. Heuristic Rules", body: "Heuristics check the process before scale-up: missing data, unsupported unit choices, recycle/purge issues, and scale-sensitive assumptions.", details: ["The rules are filtered to the actual phenomena, phases, stream fates, and conditions in the project."], action: () => { closeSeparationSimulator(); setInspectorTab("heuristics"); runRuleChecks(); } },
      { target: "#scaleQuickPanel", title: "12. Scale-Up Target", body: "The scale panel sets target product, amount, basis, Gantt timing, parallel units, and capacity hints. This is separate from the simulator: simulation proposes structure; scale-up checks whether that structure has usable numbers.", details: ["For the demo the target is 0.90 kg/batch benzaldehyde.", "Capacity and duration should be completed before quantitative LCA or equipment claims."], action: () => setInspectorTab("scale") },
      { target: "#flowsheetHost", title: "13. Flowsheet View", body: "The flowsheet view turns the current groups and streams into a presentation diagram. Use it after you are happy with the graph structure.", details: ["It is generated from the current model, so inserted candidate routes appear here too."], action: () => { closeSeparationSimulator(); openFlowsheetModal(); } },
      { target: "#exportJson", title: "14. Export", body: "Export writes the project JSON, including blocks, phenomena, network, separation simulator results, scale-up data, and the new LCA bridge draft.", details: ["The LCA bridge is mapping-ready, not direct openLCA JSON-LD.", "Use it later to connect foreground streams to ecoinvent/openLCA datasets."], action: () => closeFlowsheetModal() }
    ];

    async function openTutorial(index = 0) {
      if (state.blocks.length) {
        if (!(await confirmModal("This tutorial walks through a worked example (methylbenzene oxidation, then distillation) and will replace the current project. Continue?"))) return;
        pushUndo();
      }
      loadMethylbenzeneExampleProject();
      tutorialCenterFlowchart("G1");
      state.tutorialIndex = Math.max(0, Math.min(index, tutorialSteps.length - 1));
      $("tutorialOverlay").hidden = false;
      renderTutorialStep();
    }

    function closeTutorial() {
      $("tutorialOverlay").hidden = true;
      closeFlowsheetModal();
      if (tutorialSettleFrame) cancelAnimationFrame(tutorialSettleFrame);
      tutorialSettleFrame = null;
    }

    function renderTutorialStep() {
      const step = tutorialSteps[state.tutorialIndex] || tutorialSteps[0];
      step.action?.();
      const target = document.querySelector(step.target);
      if (target) target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      positionTutorialStep(step);
      watchTutorialScrollSettle(step);
    }

    // scrollIntoView({behavior:"smooth"}) has no completion event, and its duration varies with
    // distance, so a single requestAnimationFrame after calling it (the previous approach) measured
    // the target mid-scroll — the spotlight/card could land hundreds of px off from steps that
    // needed to scroll far (e.g. the Phenomena/Group, Heuristics, or Scale-Up steps). Keep repositioning every
    // frame until the target's rect stops moving for a few consecutive frames, which tracks a scroll
    // of any length without depending on a fixed delay or on 'scrollend' support.
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
      const rect = target ? target.getBoundingClientRect() : { left: 24, top: 90, width: 220, height: 90 };
      const pad = 8;
      spotlight.style.left = `${Math.max(8, rect.left - pad)}px`;
      spotlight.style.top = `${Math.max(8, rect.top - pad)}px`;
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
        ? () => {
          step.ctaAction();
          window.setTimeout(() => positionTutorialStep(tutorialSteps[state.tutorialIndex] || tutorialSteps[0]), 180);
        }
        : null;
      const cardWidth = Math.min(410, window.innerWidth - 32);
      const placeRight = rect.right + 18 + cardWidth < window.innerWidth;
      const placeLeft = rect.left - 18 - cardWidth > 0;
      card.style.width = `${cardWidth}px`;
      card.style.left = `${placeRight ? rect.right + 18 : placeLeft ? rect.left - cardWidth - 18 : Math.max(16, (window.innerWidth - cardWidth) / 2)}px`;
      card.style.top = `${Math.max(16, Math.min(rect.top, window.innerHeight - 260))}px`;
    }
