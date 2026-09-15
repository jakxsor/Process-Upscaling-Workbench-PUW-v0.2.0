    // Workflow step and data-readiness metrics. These functions are deliberately
    // separated from app.js because they are derived status calculations used by
    // both the UI and exports.

    // Every step has a physical home in the layout, and for half of them it is not
    // the right-hand panel: step 1 is the protocol panel on the left, steps 3 and 4
    // are the board in the middle. `home.region` says which panel to open and where
    // to scroll; `home.el` is the element to highlight once we get there.
    const workflowSteps = [
      { id: 1, name: "Blocks", paperName: "Block building", tab: "inspect",
        home: { region: "protocol", el: "protocolPanel" } },
      { id: 2, name: "Phenomena", paperName: "Phenomena definition", tab: "inspect",
        home: { region: "inspector", el: "phenomenaGridSection" } },
      { id: 3, name: "Unit Ops", paperName: "Unit operation deduction", tab: "inspect",
        home: { region: "board", el: "groupFlow" } },
      { id: 4, name: "Network", paperName: "Network establishment", tab: "inspect",
        home: { region: "board", el: "stepFlowInspector" } },
      { id: 5, name: "Heuristics", paperName: "Heuristic rules application", tab: "heuristics",
        home: { region: "inspector", el: "heuristicsPanelTab" } },
      { id: 6, name: "Schedule", paperName: "Preliminary scheduling", tab: "scale",
        home: { region: "inspector", el: "scalePanelTab" } }
    ];

    // Brief outline on the region the user was just sent to, so a click that scrolls
    // the board rather than switching tabs still reads as "you are here now".
    function flashWorkflowTarget(elementId) {
      // Clicking two steps in quick succession would otherwise leave both regions
      // glowing, which points at two places at once.
      document.querySelectorAll(".workflow-step-target").forEach(el => el.classList.remove("workflow-step-target"));
      const target = $(elementId);
      if (!target) return;
      void target.offsetWidth;
      target.classList.add("workflow-step-target");
      window.setTimeout(() => target.classList.remove("workflow-step-target"), 1600);
    }

    // Step 3's whole point is the unit-operation proposals, which appear on a group
    // box only after its picker is expanded. Land the user on the first group still
    // waiting for a unit, with the proposals already open.
    function revealFirstPendingUnitOperation() {
      const groups = groupIdsInTextOrder().map(groupId => groupModel(groupId)).filter(Boolean);
      if (!groups.length) return false;
      const pending = groups.find(group => !group.selectedUnit) || groups[0];
      state.selectedGroupId = pending.id;
      state.selectedBlockId = null;
      state.focusEndpoint = pending.id;
      if (groupUnitSuggestionReadiness(pending).ready) {
        ensureGroup(pending.id).unitSuggestionsExpanded = true;
      }
      return true;
    }

    function goToWorkflowStep(step) {
      if (!step) return;
      const home = step.home || { region: "inspector", el: null };
      const main = $("appMain");

      if (home.region === "protocol") {
        if (main.classList.contains("protocol-collapsed")) {
          main.classList.remove("protocol-collapsed");
          updateProtocolToggleIcon();
        }
      } else if (home.region === "inspector") {
        if (main.classList.contains("inspector-collapsed")) {
          main.classList.remove("inspector-collapsed");
          updateInspectorToggleIcon();
        }
        setInspectorTab(step.tab);
      }

      if (home.region === "board" && step.id === 3) revealFirstPendingUnitOperation();

      renderAll();

      if (home.region === "board") {
        centerSelection();
        $(home.el)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      if (home.el) flashWorkflowTarget(home.el);
    }

    function blockExpectsStreams(block) {
      const phenomena = block.phenomena || [];
      if (!phenomena.length) return true;
      return !phenomena.every(code => code.startsWith("ES(") || code.startsWith("M(") || code.startsWith("2phM"));
    }

    function blockHasAssignedPurpose(block) {
      const behavior = String(block.behavior || "").trim();
      return Boolean(behavior) && behavior !== "unassigned";
    }

    function workflowStepStatuses() {
      return memoInPass("workflowStepStatuses", undefined, () => workflowStepStatusesUncached());
    }

    function workflowStepStatusesUncached() {
      const blocks = blocksInOrder();
      const groupIds = groupIdsInTextOrder();
      const groups = groupIds.map(groupId => groupModel(groupId));

      const statuses = {};
      const set = (id, status, hint) => { statuses[id] = { status, hint }; };

      if (!blocks.length) {
        set(1, "todo", "Select protocol text and create the first block.");
      } else {
        const missingPurpose = blocks.filter(block => !blockHasAssignedPurpose(block));
        const missingOutputs = blocks.filter(block => {
          if (!blockExpectsStreams(block)) return false;
          const counts = streamCounts(block);
          return !counts.output;
        });
        if (missingPurpose.length || missingOutputs.length) {
          const parts = [];
          if (missingPurpose.length) parts.push(`${missingPurpose.length} block${missingPurpose.length === 1 ? "" : "s"} without a purpose preset`);
          if (missingOutputs.length) parts.push(`${missingOutputs.length} material block${missingOutputs.length === 1 ? "" : "s"} without output stream`);
          set(1, "partial", parts.join("; ") + ".");
        } else {
          set(1, "done", `${blocks.length} blocks with purpose and required output streams.`);
        }
      }

      if (!blocks.length) {
        set(2, "todo", "Create blocks first, then assign phenomena.");
      } else {
        const missingPhen = blocks.filter(block => !(block.phenomena || []).length);
        if (missingPhen.length === blocks.length) {
          set(2, "todo", "Assign at least 1-2 phenomena per block (paper Table 3).");
        } else if (missingPhen.length) {
          set(2, "partial", `${missingPhen.length} block${missingPhen.length === 1 ? "" : "s"} without phenomena.`);
        } else {
          set(2, "done", "Every block has phenomena assigned.");
        }
      }

      if (!groups.length) {
        set(3, "todo", "Combine blocks into task groups, then pick unit operations.");
      } else {
        const missingUnit = groups.filter(group => !group.selectedUnit || !group.task || group.task === "unassigned");
        const incompatibleUnit = groups.filter(group => group.selectedUnit && !selectedUnitSupportedByEvidence(group));
        if (missingUnit.length === groups.length) {
          set(3, "todo", "Assign a task and select a unit operation for each group.");
        } else if (missingUnit.length) {
          set(3, "partial", `${missingUnit.length} group${missingUnit.length === 1 ? "" : "s"} without task or selected unit.`);
        } else if (incompatibleUnit.length) {
          set(3, "partial", `${incompatibleUnit.length} selected unit${incompatibleUnit.length === 1 ? "" : "s"} not supported by the current phenomena/task evidence.`);
        } else {
          set(3, "done", `${groups.length} groups with selected unit operations.`);
        }
      }

      const ungrouped = blocks.filter(block => !block.groupId);
      if (!groups.length) {
        set(4, "todo", "Group blocks and connect them with arrows to close the network.");
      } else {
        const linkedIds = new Set();
        state.links.forEach(link => { linkedIds.add(link.from); linkedIds.add(link.to); });
        const unconnected = groupIds.filter(groupId => groups.length > 1 && !linkedIds.has(groupId));
        const closureIssues = networkClosureModel();
        if (ungrouped.length || unconnected.length) {
          const parts = [];
          if (ungrouped.length) parts.push(`${ungrouped.length} draft block${ungrouped.length === 1 ? "" : "s"} not in a group`);
          if (unconnected.length) parts.push(`${unconnected.length} group${unconnected.length === 1 ? "" : "s"} without arrows (try Auto-Connect)`);
          set(4, "partial", parts.join("; ") + ".");
        } else if (closureIssues.length) {
          set(4, "partial", `${closureIssues.length} outlet${closureIssues.length === 1 ? "" : "s"} not closed - try Auto-Connect or draw the missing arrow.`);
        } else {
          set(4, "done", "Network closed: every outlet routed, recycles connected, product outlet present.");
        }
      }

      const heuristics = heuristicReviewModel();
      const decisions = state.heuristicDecisions || {};
      const decided = heuristics.triggered.filter(item => decisions[item.id]?.decision).length;
      if (!heuristics.triggered.length) {
        set(5, "todo", "No heuristic rules triggered yet. Add phenomena, phases, and conditions.");
      } else if (decided < heuristics.triggered.length) {
        set(5, decided ? "partial" : "todo", `${decided}/${heuristics.triggered.length} triggered rules decided (accept/reject/override).`);
      } else {
        set(5, "done", `All ${heuristics.triggered.length} triggered rules decided.`);
      }

      const basis = state.scaleBasis || {};
      const missingDuration = groups.filter(group => !parseStreamQuantity(group.schedule?.durationH));
      if (!groups.length || !basis.targetAmount) {
        set(6, "todo", "Define the scale-up basis (target amount, schedule) and task durations.");
      } else if (missingDuration.length) {
        set(6, "partial", `${missingDuration.length} group${missingDuration.length === 1 ? "" : "s"} without duration for the Gantt.`);
      } else {
        set(6, "done", "Scale basis and task durations defined. Review schedule balance in Scale-Up tab.");
      }

      // Compact counters for the panel badges. The hints above are full sentences,
      // too long for a badge, so each step also gets a few words of live tally.
      const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
      const withPhenomena = blocks.filter(block => (block.phenomena || []).length).length;
      const withUnit = groups.filter(group => group.selectedUnit).length;
      const linkedPairs = new Set((state.links || []).map(link => `${link.from}>${link.to}`)).size;
      const shortLabels = {
        1: blocks.length ? plural(blocks.length, "block") : "no blocks yet",
        2: blocks.length ? `${withPhenomena}/${blocks.length} with phenomena` : "no blocks yet",
        3: groups.length ? `${withUnit}/${groups.length} units chosen` : "no task groups yet",
        4: groups.length ? plural(linkedPairs, "arrow") : "no task groups yet",
        5: heuristics.triggered.length ? `${decided}/${heuristics.triggered.length} rules decided` : "no rules triggered yet",
        6: groups.length ? `${groups.length - missingDuration.length}/${groups.length} durations set` : "no task groups yet"
      };
      Object.keys(shortLabels).forEach(id => {
        if (statuses[id]) statuses[id].short = shortLabels[id];
      });

      return statuses;
    }

    // The panel badges ("1 Block Creation", "3 Unit Ops & Task Assignment", ...) were
    // fixed HTML, so the number never changed and carried no information once you had
    // read it. They now track the same statuses as the stepper.
    function renderStepFlags() {
      const flags = document.querySelectorAll("[data-step-flag]");
      if (!flags.length) return;
      const statuses = workflowStepStatuses();
      flags.forEach(flag => {
        const id = Number(flag.dataset.stepFlag);
        const info = statuses[id];
        if (!info) return;
        const step = workflowSteps.find(item => item.id === id);
        flag.classList.toggle("done", info.status === "done");
        flag.classList.toggle("partial", info.status === "partial");
        const marker = flag.querySelector(".step-flag-num");
        if (marker) marker.textContent = info.status === "done" ? "✓" : String(id);
        const note = flag.querySelector(".step-flag-note");
        if (note) note.textContent = info.short || "";
        if (step) flag.setAttribute("aria-label", `Step ${id}, ${step.paperName}: ${info.hint || ""}`);
      });
    }

    function renderWorkflowStepper() {
      renderStepFlags();
      const root = $("workflowStepper");
      if (!root) return;
      const statuses = workflowStepStatuses();
      const whereLabel = { protocol: "protocol panel, left", board: "process board, centre", inspector: "right-hand panel" };
      root.innerHTML = workflowSteps.map(step => {
        const info = statuses[step.id] || { status: "todo", hint: "" };
        const where = whereLabel[step.home?.region] || whereLabel.inspector;
        return `
          <button class="workflow-step ${info.status}" data-workflow-step="${step.id}" title="${escapeAttr(`Step ${step.id}: ${step.paperName}. ${info.hint}`)}">
            <span class="workflow-step-marker">${info.status === "done" ? "✓" : step.id}</span>
            <span class="workflow-step-name">${escapeHtml(step.name)}</span>
          </button>
        `;
      }).join(`<span class="workflow-step-arrow">→</span>`);
      const firstOpen = workflowSteps.find(step => (statuses[step.id] || {}).status !== "done");
      const hintTarget = firstOpen || workflowSteps[workflowSteps.length - 1];
      const hintInfo = statuses[hintTarget.id] || { hint: "" };
      root.insertAdjacentHTML("beforeend", `
        <span class="workflow-stepper-hint">
          <strong>Step ${hintTarget.id}. ${escapeHtml(hintTarget.paperName)}:</strong> ${escapeHtml(hintInfo.hint || "")}
        </span>
      `);
    }

    function dataReadinessModel() {
      return memoInPass("dataReadinessModel", undefined, () => dataReadinessModelUncached());
    }

    function dataReadinessModelUncached() {
      const blocks = blocksInOrder();
      const groupIds = groupIdsInTextOrder();
      const groups = groupIds.map(groupId => groupModel(groupId));
      const allStreams = blocks.flatMap(block => block.streams || []);
      const hasCondition = (block, ids) => ids.some(id => String(block.conditions?.[id] || "").trim());
      const blocksWith = predicate => blocks.filter(predicate);
      const phen = block => block.phenomena || [];
      const conditionText = block => Object.values(block.conditions || {}).map(value => String(value || "")).join(" ");
      const hasAnyTimeEvidence = block => hasCondition(block, ["holding_time", "mixing_time", "thermal_ramp", "contact_time", "reaction_time", "phase_change_time", "settling_time", "residence_time"]);

      const reactionBlocks = blocksWith(block => phen(block).some(code => code.startsWith("R(")));
      const thermalBlocks = blocksWith(block => phen(block).some(code => code === "ES(H)" || code === "ES(C)"));
      const mixingBlocks = blocksWith(block => phen(block).some(code => code.startsWith("M(") || code.startsWith("2phM")));
      const pressureRelevantCodes = new Set(["ES(P)", "ES(E)", "PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)"]);
      const pressureBlocks = blocksWith(block =>
        phen(block).some(code => pressureRelevantCodes.has(code))
        && /vacuum|pressure|mbar|mmhg|\bbar\b|distill|evaporat|flash|short-path|thin-film/i.test(`${block.text || ""} ${conditionText(block)}`)
      );

      const item = (name, level, ok, note) => ({ name, level, ok, note });

      const synthesis = [
        item("Reaction type and objective", "critical",
          !blocks.length ? false : reactionBlocks.length > 0 || groups.some(group => /react|synth|precip/i.test(group.task || "")),
          reactionBlocks.length ? `${reactionBlocks.length} block(s) carry reaction phenomena.` : "No block carries a reaction phenomenon yet."),
        item("Stoichiometry", "important", null,
          "Not machine-checkable: confirm a balanced or semi-balanced reaction is recorded in block notes."),
        item("Reaction yield", "important",
          blocks.length ? reactionBlocks.every(block => hasCondition(block, ["conversion_yield"])) && reactionBlocks.length > 0 : false,
          "Record reaction yield on each reaction block; add conversion and selectivity in separation screening when residuals are calculated."),
        item("Input materials (identity + quantity)", "critical",
          blocks.length ? allStreams.some(s => s.role === "input") && allStreams.filter(s => s.role === "input").every(s => String(s.quantity || "").trim() && String(s.unit || "").trim()) : false,
          "Declare fresh inputs with quantity and unit; intermediates flow implicitly between linked blocks."),
        item("Output materials (products, by-products, wastes)", "critical",
          blocks.length ? blocks.filter(blockExpectsStreams).every(block => (block.streams || []).some(s => s.role === "output")) : false,
          "Every material-handling block needs at least one output stream."),
        item("Solvents / auxiliaries (identity and role)", "important", null,
          "Not machine-checkable: confirm solvents and auxiliaries appear as named input streams."),
        item("Phase of each stream", "critical",
          allStreams.length ? allStreams.every(s => String(s.phase || "").trim() && s.phase !== "unknown") : false,
          "Assign solid/liquid/vapor phase to every stream."),
        item("Phase changes observed", "important",
          blocks.length ? blocks.some(block => phen(block).some(code => code.startsWith("PT(") || code.startsWith("PCh") || code.startsWith("PS("))) : false,
          "No phase-transition/change/separation phenomena assigned yet - check evaporation, crystallization, splits."),
        item("Temperature", "important",
          thermalBlocks.length ? thermalBlocks.every(block => hasCondition(block, ["target_temperature", "holding_temperature", "initial_temperature"])) : blocks.length > 0,
          "Blocks with heating/cooling need a temperature value or range."),
        item("Pressure (if relevant)", "optional",
          pressureBlocks.length ? pressureBlocks.every(block => hasCondition(block, ["target_pressure", "initial_pressure"])) : true,
          "Vacuum, distillation, evaporation, flash, or pressure-changing blocks should record pressure or pressure-control evidence."),
        item("Time evidence in protocol blocks", "important",
          blocks.length ? blocks.some(hasAnyTimeEvidence) : false,
          "Record protocol-level time evidence where it exists; Gantt durations are checked separately in Scale-Up."),
        item("Agitation / mixing", "important",
          mixingBlocks.length ? mixingBlocks.every(block => hasCondition(block, ["mixing_time", "agitation_speed", "agitation_note"])) : blocks.length > 0,
          "Blocks with mixing phenomena need a qualitative mixing descriptor.")
      ];

      const processes = [
        item("Sequence of steps (ordered blocks)", "critical",
          blocks.length > 0 && blocks.every(block => block.groupId),
          "Create blocks for the whole protocol and assign each to a task group."),
        item("Step purpose (reaction / separation / purification)", "critical",
          blocks.length ? blocks.every(blockHasAssignedPurpose) : false,
          "Give every block a behavior preset that states its purpose."),
        item("Endpoints (observable cues)", "important",
          blocks.length ? blocks.every(block => {
            const codes = phen(block);
            const needsReactionEvidence = codes.some(code => code.startsWith("R("));
            const needsTransferEvidence = codes.some(code => code.startsWith("PT("));
            if (!needsReactionEvidence && !needsTransferEvidence) return true;
            return (!needsReactionEvidence || hasCondition(block, ["conversion_yield"])) && (!needsTransferEvidence || hasCondition(block, ["transfer_endpoint"]));
          }) : false,
          "Reaction blocks should record reaction yield; transfer blocks should record an observable completion cue."),
        item("Dominant phenomena per step (>= 1-2 per block)", "critical",
          blocks.length ? blocks.every(block => phen(block).length >= 1) : false,
          "Assign at least one phenomenon per block (paper Table 3)."),
        item("Multiphase indication", "important",
          blocks.length ? blocks.some(block => phen(block).some(code => code.includes("2ph") || code.startsWith("PC(") || code.startsWith("PS("))) || (allStreams.length > 0 && allStreams.every(s => (s.phase || "L") === (allStreams[0]?.phase || "L"))) : false,
          "If two phases coexist anywhere, mark two-phase mixing/contact/separation phenomena."),
        item("Task definition per group", "critical",
          groups.length ? groups.every(group => group.task && group.task !== "unassigned") : false,
          "Name the task of every group (reaction, washing, purification...)."),
        item("Candidate unit operations (>= 1 per task)", "critical",
          groups.length ? groups.every(group => group.selectedUnit || (groupUnitSuggestionReadiness(group).ready && unitOperationCandidatesForGroup(group).length)) : false,
          "Complete task MFA, phases, and conditions before accepting candidate unit operations.")
      ];

      const categories = [
        { name: "Step 1. Protocol data", items: synthesis },
        { name: "Step 2-3. Phenomena and unit tasks", items: processes }
      ];
      const flat = categories.flatMap(category => category.items);
      const missingCritical = flat.filter(entry => entry.level === "critical" && entry.ok === false).length;
      const missingImportant = flat.filter(entry => entry.level === "important" && entry.ok === false).length;
      const confirmCount = flat.filter(entry => entry.ok === null).length;
      return { categories, missingCritical, missingImportant, confirmCount };
    }

    function renderDataReadiness() {
      const summary = $("dataReadinessSummary");
      const panel = $("dataReadinessPanel");
      if (!summary || !panel) return;
      // One "Data quality" line instead of three cards (readiness, provenance, inventory): the
      // three summaries read as one sentence, and the detail of all three opens with one button.
      const hasStreams = state.blocks.some(block => (block.streams || []).some(stream => String(stream.name || "").trim()));
      const toggle = $("toggleReadiness");
      const details = $("dataQualityDetails");
      if (!hasStreams) {
        summary.textContent = "Appears once material streams are declared (step 4).";
        summary.className = "muted small";
        panel.hidden = true;
        if (details) details.hidden = true;
        if (toggle) toggle.hidden = true;
        return;
      }
      if (toggle) toggle.hidden = false;
      const model = dataReadinessModel();
      const provenance = dataProvenanceModel();
      const reportedPercent = provenance.total ? Math.round((provenance.counts.reported || 0) / provenance.total * 100) : 0;
      const parts = [];
      if (model.missingCritical) parts.push(`${model.missingCritical} critical missing`);
      if (model.missingImportant) parts.push(`${model.missingImportant} important missing`);
      if (model.confirmCount) parts.push(`${model.confirmCount} to confirm`);
      if (!parts.length) parts.push("required values present");
      parts.push(`${reportedPercent}% reported`);
      state.showLcaReadiness = state.showDataReadiness;
      const inventoryIssues = renderLcaReadiness();
      if (Number.isFinite(inventoryIssues)) parts.push(`${inventoryIssues} inventory issue${inventoryIssues === 1 ? "" : "s"}`);
      summary.textContent = `${parts.join(" · ")}.`;
      summary.className = model.missingCritical ? "small readiness-summary critical" : model.missingImportant ? "small readiness-summary important" : "small readiness-summary ok";
      panel.hidden = !state.showDataReadiness;
      if (details) details.hidden = !state.showDataReadiness;
      if (toggle) toggle.textContent = state.showDataReadiness ? "Hide" : "Details";
      renderDataProvenance();
      if (!state.showDataReadiness) return;
      panel.innerHTML = model.categories.map(category => `
        <div class="readiness-category">
          <div class="label">${escapeHtml(category.name)}</div>
          ${category.items.map(entry => `
            <div class="readiness-row ${entry.level} ${entry.ok === true ? "ok" : entry.ok === false ? "missing" : "confirm"}">
              <span class="readiness-mark">${entry.ok === true ? "✓" : entry.ok === false ? "✕" : "?"}</span>
              <span class="readiness-name">${escapeHtml(entry.name)}</span>
              <span class="readiness-level">${entry.level}</span>
              <span class="readiness-note">${escapeHtml(entry.note)}</span>
            </div>
          `).join("")}
        </div>
      `).join("");
    }

    // Inventory (LCI) readiness on screen. buildLcaBridge() already derives the reference product,
    // technosphere inputs, emissions, waste treatments, mapping candidates and an issue list, but
    // it was only reachable through the export: the first sight of "N streams have no amount" was
    // a spreadsheet. Same inputs as the export builder, computed only while the inspect tab shows.
    function lcaReadinessSnapshot() {
      if (typeof buildLcaBridge !== "function" || typeof exportBlock !== "function") return null;
      const blocks = blocksInOrder().map(block => {
        ensureBlockFlowFields(block);
        return exportBlock(block);
      });
      if (!blocks.length) return null;
      const groups = groupIdsInTextOrder().map(groupId => {
        const group = groupModel(groupId);
        return {
          groupId: group.id,
          task: group.task,
          blocks: group.blocks.map(block => block.id),
          phenomena: group.phenomena,
          selectedUnit: group.selectedUnit
        };
      });
      const scale = scaleModel();
      return buildLcaBridge(blocks, groups, scale, recycleSummary(scale), energyBridgeModel(scale));
    }

    function renderLcaReadiness() {
      const summary = $("lcaReadinessSummary");
      const panel = $("lcaReadinessPanel");
      const toggle = $("toggleLcaReadiness");
      if (!summary || !panel) return NaN;
      if (state.activeInspectorTab && state.activeInspectorTab !== "inspect") return NaN;
      let bridge = null;
      try {
        bridge = lcaReadinessSnapshot();
      } catch (error) {
        console.error("Inventory readiness could not be computed", error);
      }
      if (!bridge) {
        summary.textContent = "No streams yet.";
        summary.className = "muted small";
        panel.hidden = true;
        if (toggle) toggle.textContent = "Details";
        return NaN;
      }
      const issues = bridge.readiness?.issues || [];
      const counts = `${bridge.externalInputs.length} input${bridge.externalInputs.length === 1 ? "" : "s"}, ${bridge.emissions.length} emission${bridge.emissions.length === 1 ? "" : "s"}, ${bridge.wasteTreatments.length} waste treatment${bridge.wasteTreatments.length === 1 ? "" : "s"}`;
      summary.textContent = issues.length
        ? `${issues.length} inventory issue${issues.length === 1 ? "" : "s"}; ${counts}.`
        : `Ready for mapping; ${counts}.`;
      summary.className = issues.length ? "small readiness-summary important" : "small readiness-summary ok";
      panel.hidden = !state.showLcaReadiness;
      if (toggle) toggle.textContent = state.showLcaReadiness ? "Hide" : "Details";
      if (!state.showLcaReadiness) return issues.length;
      const product = bridge.referenceProduct;
      const productName = product ? (product.name || product.canonicalName || product.rawName || "product") : "";
      const productKg = product?.amount?.kg;
      const candidates = bridge.mappingCandidates || [];
      panel.innerHTML = `
        <div class="readiness-category">
          <div class="label">Reference product</div>
          <div class="muted small">${product
            ? escapeHtml(`${productName}${Number.isFinite(productKg) ? ` - ${productKg} kg` : ""}`)
            : "Not identified. Declare an output stream with fate \"product\" and set the scale-up target product."}</div>
        </div>
        <div class="readiness-category">
          <div class="label">Before openLCA mapping</div>
          ${issues.length
            ? issues.map(issue => `
              <div class="readiness-row important missing">
                <span class="readiness-mark">✕</span>
                <span class="readiness-note">${escapeHtml(issue)}</span>
              </div>`).join("")
            : `<div class="muted small">No blocking issues.</div>`}
        </div>
        <div class="readiness-category">
          <div class="label">Mapping candidates</div>
          <div class="muted small">${candidates.length} flow${candidates.length === 1 ? "" : "s"} with a suggested database name. The final dataset choice stays manual; the LCI Excel export carries the full list.</div>
        </div>
      `;
    }

    // A different axis from dataReadinessModel above: that one asks "is this value present at all",
    // this one asks "of the values that ARE present, how much is real (reported) vs. a stand-in
    // (calculated/estimated/assumed)". Both matter for a prospective-LCA tool's traceability claim,
    // but only completeness had a visible summary before this.
    function dataProvenanceModel() {
      const streams = blocksInOrder().flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams || [];
      });
      const counts = {};
      streamDataStatuses.forEach(status => { counts[status] = 0; });
      streams.forEach(stream => {
        const status = streamDataStatuses.includes(stream.status) ? stream.status : "missing";
        counts[status] = (counts[status] || 0) + 1;
      });
      return { total: streams.length, counts };
    }

    function renderDataProvenance() {
      const el = $("dataProvenanceSummary");
      if (!el) return;
      const model = dataProvenanceModel();
      if (!model.total) {
        el.innerHTML = `<span class="muted small">No streams yet.</span>`;
        return;
      }
      const order = ["reported", "calculated", "estimated", "assumed", "manual override", "missing"];
      const present = order.filter(status => model.counts[status]);
      const slug = status => status.replace(/\s+/g, "-");
      const summary = present.map(status => `${status}: ${model.counts[status]}`).join(", ");
      el.innerHTML = `
        <div class="data-provenance-bar" role="img" aria-label="${escapeAttr(`Stream data provenance for ${model.total} streams. ${summary}.`)}">
          ${present.map(status => `<span class="data-provenance-seg status-${escapeAttr(slug(status))}" style="flex-grow:${model.counts[status]}" title="${escapeAttr(status)}: ${model.counts[status]} of ${model.total}" aria-hidden="true"></span>`).join("")}
        </div>
        <div class="data-provenance-legend">
          ${present.map(status => `<span class="data-provenance-chip status-${escapeAttr(slug(status))}">${escapeHtml(status)} ${model.counts[status]}</span>`).join("")}
        </div>
      `;
    }
