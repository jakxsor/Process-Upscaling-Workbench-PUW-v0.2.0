    // Workflow step and data-readiness metrics. These functions are deliberately
    // separated from app.js because they are derived status calculations used by
    // both the UI and exports.

    const workflowSteps = [
      { id: 1, name: "Blocks", paperName: "Block building", tab: "inspect" },
      { id: 2, name: "Phenomena", paperName: "Phenomena definition", tab: "inspect" },
      { id: 3, name: "Unit Ops", paperName: "Unit operation deduction", tab: "inspect" },
      { id: 4, name: "Network", paperName: "Network establishment", tab: "inspect" },
      { id: 5, name: "Heuristics", paperName: "Heuristic rules application", tab: "heuristics" },
      { id: 6, name: "Schedule", paperName: "Preliminary scheduling", tab: "scale" }
    ];

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

      return statuses;
    }

    function renderWorkflowStepper() {
      const root = $("workflowStepper");
      if (!root) return;
      const statuses = workflowStepStatuses();
      root.innerHTML = workflowSteps.map(step => {
        const info = statuses[step.id] || { status: "todo", hint: "" };
        return `
          <button class="workflow-step ${info.status}" data-workflow-step="${step.id}" title="${escapeAttr(`Step ${step.id}. ${step.paperName} - ${info.hint}`)}">
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
      const model = dataReadinessModel();
      const parts = [];
      if (model.missingCritical) parts.push(`${model.missingCritical} critical missing`);
      if (model.missingImportant) parts.push(`${model.missingImportant} important missing`);
      if (model.confirmCount) parts.push(`${model.confirmCount} to confirm manually`);
      summary.textContent = parts.length ? parts.join(", ") + "." : "All checkable items covered.";
      summary.className = model.missingCritical ? "small readiness-summary critical" : model.missingImportant ? "small readiness-summary important" : "small readiness-summary ok";
      panel.hidden = !state.showDataReadiness;
      $("toggleReadiness").textContent = state.showDataReadiness ? "Hide" : "Details";
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
