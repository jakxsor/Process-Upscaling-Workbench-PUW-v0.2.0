    // Project JSON export. Split out of app.js for navigability; loaded as a plain <script> before
    // app.js (see app.py) so these functions share the same global scope as the rest of the app.
    // Depends on: $, state, blocksInOrder, ensureBlockFlowFields, scaleModel, groupIdsInTextOrder,
    // groupModel, propertySeparationPredictorModel, aggregateGroupConditions, aggregateGroupStreams,
    // recycleSummary, energyBridgeModel, scaleUpAssessmentModel, heuristicReviewModel,
    // taskScheduleModel, throughputDiagnosticsModel, buildLcaBridge, workflowStepStatuses,
    // dataReadinessModel, conditionValuesForBlock, phaseLabel, propertyPromptsForGroup,
    // normalizePropertyValue, ensureGroup, separationSimulatorModel, binaryRouteVariants,
    // reactionBalanceModel, workupPlanModel — all defined in app.js.

    function buildProjectExport() {
      const blocks = blocksInOrder().map(block => {
        ensureBlockFlowFields(block);
        return exportBlock(block);
      });
      const scale = scaleModel();
      const groups = groupIdsInTextOrder().map(groupId => {
        const group = groupModel(groupId);
        return {
          groupId: group.id,
          task: group.task,
          blocks: group.blocks.map(block => block.id),
          phenomena: group.phenomena,
          selectedUnit: group.selectedUnit,
          selectionBasis: group.selectionBasis || "",
          propertyPredictor: propertySeparationPredictorModel(group),
          separationSimulator: exportSeparationSimulator(group),
          schedule: group.schedule,
          properties: exportGroupProperties(group),
          conditionAggregation: aggregateGroupConditions(group),
          mfaAggregation: aggregateGroupStreams(group).map(roleGroup => ({
            role: roleGroup.role,
            items: roleGroup.items.map(item => ({
              name: item.name,
              total: item.totalText,
              totalValue: item.totalValue,
              totalUnit: item.totalUnit,
              aggregationStatus: item.aggregationStatus,
              override: item.override,
              lines: item.lines,
              entries: item.entries
            }))
          }))
        };
      });
      const materialFlow = blocks.map(block => ({
        blockId: block.id,
        streams: block.streams,
        inputs: block.inputs,
        outputs: block.outputs,
        wastes: block.wastes
      }));
      const recycle = recycleSummary(scale);
      const energyBridge = energyBridgeModel(scale);
      const scaleAssessment = scaleUpAssessmentModel(scale);
      const heuristicReview = heuristicReviewModel(scale);
      const ganttSchedule = taskScheduleModel();
      const throughputDiagnostics = throughputDiagnosticsModel(scale, ganttSchedule);
      const lcaBridge = buildLcaBridge(blocks, groups, scale, recycle, energyBridge);
      return {
        workflow: "source text -> annotated blocks -> material inputs/outputs/waste -> behavior presets -> phenomenon groups -> task/unit alternatives -> heuristic rule application -> scale-up basis -> scaled MFA -> Gantt bottleneck check",
        text: state.text,
        workflowStepStatus: workflowStepStatuses(),
        scaleUp: {
          basis: scale.basis,
          reference: scale.reference,
          target: scale.target,
          schedule: scale.schedule,
          reactorSizing: scale.reactorSizing,
          factors: scale.factors,
          scaledMfa: scale.blocks,
          scaledRows: scale.rows,
          ready: scale.ready,
          assessment: scaleAssessment,
          heuristicReview,
          ganttSchedule,
          throughputDiagnostics
        },
        recycleSummary: recycle,
        energyBridge,
        lcaBridge,
        ruleChecks: state.ruleChecks,
        aiRefine: state.aiRefine,
        dataReadiness: dataReadinessModel(),
        heuristicDecisions: state.heuristicDecisions,
        blocks,
        materialFlow,
        groups,
        links: state.links
      };
    }

    let renderExportTimer = null;

    // Writes the export JSON immediately, bypassing the debounce below. Use this (not renderExport)
    // anywhere the fresh JSON is read back synchronously right after, e.g. before sending it to the
    // external AI review endpoint — a debounced write there would send stale project data.
    function writeExportNow() {
      if (renderExportTimer) {
        clearTimeout(renderExportTimer);
        renderExportTimer = null;
      }
      $("jsonOut").textContent = JSON.stringify(buildProjectExport(), null, 2);
    }

    // The visible JSON preview card was removed from the UI (it was the only way to get data
    // out - select-all-copy from a giant text blob), but #jsonOut itself stays in the DOM
    // (hidden) since other code reads it back (see the AI Refine flow above). The header
    // "Export JSON" button now triggers an actual file download instead.
    function downloadProjectJson() {
      writeExportNow();
      const text = $("jsonOut").textContent || "{}";
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "upscaling-project.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    // Debounced: called on every keystroke by the various update*Field handlers, so coalesce rapid
    // typing into a single rebuild of the full project export instead of re-serializing on each key.
    function renderExport() {
      if (renderExportTimer) clearTimeout(renderExportTimer);
      renderExportTimer = setTimeout(writeExportNow, 200);
    }

    function exportBlock(block) {
      return {
        id: block.id,
        groupId: block.groupId,
        start: block.start,
        end: block.end,
        source: block.source || "protocol",
        text: block.text,
        notes: block.notes || "",
        behavior: block.behavior,
        phenomena: block.phenomena,
        streams: block.streams.map(stream => exportStream(stream)),
        conditions: conditionValuesForBlock(block).map(item => exportCondition(item)),
        inputs: block.inputs,
        outputs: block.outputs,
        wastes: block.wastes,
        phase: block.phase,
        endpoint: block.endpoint,
        status: block.status
      };
    }

    function exportStream(stream) {
      return {
        id: stream.id,
        role: stream.role,
        name: stream.name,
        quantity: stream.quantity,
        unit: stream.unit,
        phase: stream.phase,
        phaseLabel: phaseLabel(stream.phase),
        timing: stream.timing,
        status: stream.status,
        fate: stream.fate,
        recoveryPercent: stream.recoveryPercent,
        purgePercent: stream.purgePercent,
        loopId: stream.loopId,
        destinationGroup: stream.destinationGroup,
        makeupRequired: stream.makeupRequired,
        accumulationRisk: stream.accumulationRisk,
        note: stream.note,
        chemicalProperties: Object.fromEntries((globalThis.streamChemicalPropertyFields || [])
          .map(field => [field, stream[field] || ""])
          .filter(([, value]) => String(value || "").trim()))
      };
    }

    function exportCondition(item) {
      return {
        id: item.id,
        label: item.label,
        value: item.value,
        unit: item.unit,
        display: formatConditionValue(item),
        kind: item.kind || "text",
        phenomena: item.phenomena
      };
    }

    function exportGroupProperties(group) {
      return propertyPromptsForGroup(group).map(prompt => {
        const saved = normalizePropertyValue(ensureGroup(group.id).properties[prompt.id], prompt);
        return {
          id: prompt.id,
          label: prompt.label,
          value: saved.value,
          unit: saved.unit,
          status: saved.status,
          note: saved.note,
          sourceRequired: Boolean(saved.value && !saved.note && saved.status !== "reported"),
          reason: prompt.reason,
          phenomena: prompt.phenomena
        };
      }).filter(item => item.value || item.note || item.status !== "missing");
    }

    function exportSeparationSimulator(group) {
      const groupState = ensureGroup(group.id);
      const model = separationSimulatorModel(group);
      return {
        source: "Garg et al. accepted manuscript: Algorithm A1.1 + KB3.1/Table S.10, implemented as optional hypothesis screening",
        substances: model.substances,
        binaryPairs: model.pairs.map(pair => ({
          pairKey: pair.key,
          componentA: pair.a.name,
          componentB: pair.b.name,
          ratios: pair.ratios,
          insights: pair.insights,
          routeVariants: binaryRouteVariants(group.id, pair)
        })),
        suggestions: model.suggestions,
        reactionBalance: reactionBalanceModel(group, model),
        workupPlan: workupPlanModel(group, model),
        notes: groupState.separationSimulator.notes || ""
      };
    }
