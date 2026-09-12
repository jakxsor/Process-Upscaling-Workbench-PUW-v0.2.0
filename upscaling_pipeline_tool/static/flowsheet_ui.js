    // Flowchart modal UI, interactions, details panel, and browser exports.
    function wrapSvgText(text, maxChars) {
      const words = String(text || "").split(/\s+/);
      const lines = [];
      let current = "";
      words.forEach(word => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > maxChars && current) {
          lines.push(current);
          current = word;
        } else {
          current = next;
        }
      });
      if (current) lines.push(current);
      return lines.slice(0, 3);
    }

    function flowsheetStreamDetailRows(streams, title) {
      const rows = (streams || []).filter(stream => String(stream?.name || "").trim()).slice(0, 7);
      if (!rows.length) return "";
      return `
        <div class="flowsheet-detail-section">
          <div class="flowsheet-detail-section-head">${escapeHtml(title)}</div>
          <div class="flowsheet-detail-rows">
            ${rows.map(stream => {
              const full = flowsheetStreamLabel(stream);
              const phase = stream.phase && stream.phase !== "unknown" ? stream.phase : "";
              const fate = stream.fate && stream.fate !== "unknown" ? stream.fate : "";
              return `
                <div class="flowsheet-detail-row" title="${escapeAttr(full)}">
                  <strong>${escapeHtml(flowsheetClipText(stream.name, 34, 10))}</strong>
                  <span>${escapeHtml([stream.quantity ? `${stream.quantity} ${stream.unit || ""}`.trim() : "", phase, fate].filter(Boolean).join(" / ") || "quantity not set")}</span>
                </div>
              `;
            }).join("")}
            ${(streams || []).length > rows.length ? `<div class="muted small">+${(streams || []).length - rows.length} more in project data</div>` : ""}
          </div>
        </div>
      `;
    }

    function flowsheetAuditIssuesForBox(box) {
      const streams = [
        ...(box.inputStreams || []),
        ...(box.outputStreams || []),
        ...(box.wasteStreams || []),
        ...(box.ventStreams || []),
        ...(box.recycleStreams || [])
      ];
      const issues = [];
      if (!String(box.selectedUnit || "").trim() || box.selectedUnit === "unassigned") issues.push("unit operation missing");
      if (!streams.length) issues.push("no streams mapped");
      if (streams.some(stream => !String(stream.quantity || "").trim())) issues.push("stream quantity missing");
      if (streams.some(stream => !String(stream.phase || "").trim() || stream.phase === "unknown")) issues.push("stream phase unknown");
      return issues;
    }

    function renderFlowsheetDetailsPanel() {
      const root = $("flowsheetDetailsPanel");
      if (!root) return;
      const model = buildFlowsheetModel();
      const selected = state.selectedFlowsheetGroupId ? model.byId.get(state.selectedFlowsheetGroupId) : null;
      if (state.selectedFlowsheetGroupId && !selected) state.selectedFlowsheetGroupId = "";
      if (!model.groups.length) {
        root.innerHTML = `<div class="flowsheet-detail-empty">No grouped unit data yet.</div>`;
        return;
      }
      if (!selected) {
        const routeCount = model.forwardLinks.length;
        const auxCount = model.auxiliaryLinks.length + model.recycleLinks.length;
        root.innerHTML = `
          <div class="flowsheet-detail-title">Flowsheet Summary</div>
          <div class="flowsheet-detail-kpis">
            <span><strong>${model.groups.length}</strong> units</span>
            <span><strong>${routeCount}</strong> process links</span>
            <span><strong>${auxCount}</strong> aux/recycle links</span>
          </div>
          <div class="flowsheet-detail-empty">Select a unit on the diagram to inspect streams, conditions, and audit gaps.</div>
        `;
        return;
      }
      const issues = flowsheetAuditIssuesForBox(selected);
      const selectedGroup = groupModel(selected.id);
      root.innerHTML = `
        <div class="flowsheet-detail-title-row">
          <div>
            <div class="flowsheet-detail-eyebrow">U${selected.unitNumber} ${escapeHtml(selected.id)}</div>
            <div class="flowsheet-detail-title">${escapeHtml(flowsheetClipText(selected.selectedUnit, 44, 12) || "Unassigned unit")}</div>
          </div>
          <button class="mini-button" data-flowsheet-edit-unit="${escapeAttr(selected.id)}">Edit</button>
        </div>
        <div class="flowsheet-detail-task">${escapeHtml(selected.task || "No task label")}</div>
        <div class="flowsheet-detail-kpis">
          <span><strong>${formatNumber(selected.totalOutputKg || 0)}</strong> kg/batch out</span>
          <span><strong>${selected.stage + 1}</strong> stage</span>
        </div>
        ${(selected.specs || []).length ? `
          <div class="flowsheet-detail-section">
            <div class="flowsheet-detail-section-head">Operating</div>
            <div class="flowsheet-detail-tags">${selected.specs.slice(0, 5).map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>
          </div>
        ` : ""}
        ${flowsheetStreamDetailRows(selected.inputStreams, "Inputs")}
        ${flowsheetStreamDetailRows(selected.outputStreams, "Outputs")}
        ${flowsheetStreamDetailRows(selected.wasteStreams, "Waste")}
        ${flowsheetStreamDetailRows(selected.ventStreams, "Vents")}
        ${flowsheetStreamDetailRows(selected.recycleStreams, "Recycle")}
        <div class="flowsheet-detail-section">
          <div class="flowsheet-detail-section-head">Audit</div>
          ${issues.length
            ? `<div class="flowsheet-detail-tags warn">${issues.map(issue => `<span>${escapeHtml(issue)}</span>`).join("")}</div>`
            : `<div class="flowsheet-detail-tags ok"><span>no obvious display gaps</span></div>`}
        </div>
        ${selectedGroup?.blocks?.length ? `<div class="muted small">${selectedGroup.blocks.length} source block${selectedGroup.blocks.length === 1 ? "" : "s"} in this group.</div>` : ""}
      `;
      root.querySelector("[data-flowsheet-edit-unit]")?.addEventListener("click", async buttonEvent => {
        const groupId = buttonEvent.currentTarget.dataset.flowsheetEditUnit;
        const groupState = ensureGroup(groupId);
        const nextLabel = await promptModal(`Edit the unit description shown for ${groupId}:`, groupState.selectedUnit || "");
        if (nextLabel === null) return;
        groupState.selectedUnit = nextLabel.trim();
        renderFlowsheetModal();
        renderAll();
      });
    }

    function applyFlowsheetViewPreset(preset) {
      state.flowsheetViewPreset = preset === "clean" ? "clean" : "audit";
      const clean = state.flowsheetViewPreset === "clean";
      state.flowsheetShowStreamLabels = !clean;
      state.flowsheetShowAuxiliaryArrows = !clean;
      state.flowsheetShowUnitDetails = !clean;
      renderFlowsheetModal();
      renderExport();
    }

    function renderFlowsheetModeButtons() {
      const editable = $("flowsheetEditableMode");
      if (editable) editable.classList.add("primary");
      const fit = $("fitFlowsheetView");
      if (fit) {
        fit.classList.toggle("primary", state.flowsheetFit);
        fit.textContent = state.flowsheetFit ? "Actual Size" : "Fit View";
        fit.title = state.flowsheetFit
          ? "Show the generated flowsheet at its actual SVG size"
          : "Fit the generated flowsheet inside the modal for overview";
      }
      const cleanPreset = $("flowsheetCleanPreset");
      const auditPreset = $("flowsheetAuditPreset");
      if (cleanPreset) cleanPreset.classList.toggle("primary", state.flowsheetViewPreset === "clean");
      if (auditPreset) auditPreset.classList.toggle("primary", state.flowsheetViewPreset !== "clean");
    }

    function renderFlowsheetModal() {
      const host = $("flowsheetHost");
      if (!host) return;
      renderFlowsheetModeButtons();
      renderFlowsheetDetailsPanel();
      host.classList.add("editable-mode");
      host.classList.toggle("fit-mode", state.flowsheetFit);
      const result = buildFlowsheetSvg();
      const linkNote = !result.empty && !state.links.length && result.groupCount > 1
        ? `<div class="flowsheet-render-status warn">No declared process arrows yet. The flowsheet is showing units, feed, and product only; use board arrows or Auto-Connect, then review the links.</div>`
        : "";
      host.innerHTML = result.empty
        ? `<div class="mfa-empty">No task groups yet — combine blocks into groups first, then open the Flowsheet View.</div>`
        : `${linkNote}<div class="flowsheet-render-status ok">Editable flowsheet board. Drag units, double-click unit labels, and hover arrows/units for details.</div>${result.svg}`;
      const pptxButton = $("downloadFlowsheetPptx");
      if (pptxButton) {
        pptxButton.disabled = result.empty;
        pptxButton.title = result.empty
          ? "Create at least one task group before exporting an editable PowerPoint flowsheet"
          : "Download an editable PowerPoint slide made from native shapes, lines, and text boxes";
      }
      if (!result.empty) wireFlowsheetInteractions(host);
      if (!result.empty && !state.selectedFlowsheetGroupId) requestAnimationFrame(() => host.scrollTo({ left: 0, top: 0 }));
    }

    function wireFlowsheetInteractions(host) {
      const svg = host.querySelector("svg.flowsheet-svg");
      if (!svg) return;
      host.querySelectorAll(".flowsheet-unit").forEach(unitGroup => {
        const groupId = unitGroup.dataset.flowsheetGroup;
        let drag = null;
        unitGroup.addEventListener("mousedown", event => {
          if (event.button !== 0) return;
          event.preventDefault();
          const model = buildFlowsheetModel();
          const box = model.byId.get(groupId);
          if (!box) return;
          const rect = svg.getBoundingClientRect();
          const scale = rect.width > 0 ? model.width / rect.width : 1;
          drag = {
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: box.x,
            startY: box.y,
            scale,
            moved: false
          };
          const onMove = moveEvent => {
            if (!drag) return;
            const dx = (moveEvent.clientX - drag.startClientX) * drag.scale;
            const dy = (moveEvent.clientY - drag.startClientY) * drag.scale;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) drag.moved = true;
            unitGroup.setAttribute("transform", `translate(${dx}, ${dy})`);
          };
          const onUp = upEvent => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            if (!drag) return;
            if (drag.moved) {
              const dx = (upEvent.clientX - drag.startClientX) * drag.scale;
              const dy = (upEvent.clientY - drag.startClientY) * drag.scale;
              const groupState = ensureGroup(groupId);
              groupState.flowsheetX = drag.startX + dx;
              groupState.flowsheetY = drag.startY + dy;
              groupState.flowsheetLayoutVersion = flowsheetLayoutVersion;
              drag = null;
              renderFlowsheetModal();
              return;
            }
            unitGroup.removeAttribute("transform");
            drag = null;
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
        unitGroup.addEventListener("click", () => {
          state.selectedFlowsheetGroupId = groupId;
          renderFlowsheetModal();
        });
        unitGroup.addEventListener("dblclick", async event => {
          event.preventDefault();
          const groupState = ensureGroup(groupId);
          const nextLabel = await promptModal(`Edit the unit description shown for ${groupId}:`, groupState.selectedUnit || "");
          if (nextLabel === null) return;
          groupState.selectedUnit = nextLabel.trim();
          renderFlowsheetModal();
          renderAll();
        });
      });
    }

    function openFlowsheetModal() {
      $("flowsheetModal").hidden = false;
      state.flowsheetFit = true;
      renderFlowsheetModal();
    }

    function closeFlowsheetModal() {
      $("flowsheetModal").hidden = true;
    }

    function downloadFlowsheetSvg() {
      const visibleSvg = $("flowsheetHost")?.querySelector("svg");
      const svgText = visibleSvg ? visibleSvg.outerHTML : buildFlowsheetSvg().svg;
      if (!svgText) return;
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "flowsheet.svg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function buildFlowsheetPowerPointExport() {
      const model = buildFlowsheetModel();
      return {
        title: "Generated Process Flowsheet",
        basis: flowsheetProductBasisText(model),
        width: model.width,
        height: model.height + 88,
        productGroupId: model.productGroupId,
        feedBox: model.feedBox,
        productBox: model.productBox,
        groups: model.groups.map(group => ({
          id: group.id,
          unitNumber: group.unitNumber,
          task: group.task,
          selectedUnit: group.selectedUnit,
          category: group.category,
          subcategory: group.subcategory,
          specs: group.specs,
          x: group.x,
          y: group.y,
          w: group.w,
          h: group.h,
          stage: group.stage,
          stageRow: group.stageRow,
          concurrent: group.concurrent,
          totalOutputKg: group.totalOutputKg,
          inputStreams: group.inputStreams,
          outputStreams: group.outputStreams,
          wasteStreams: group.wasteStreams,
          ventStreams: group.ventStreams,
          recycleStreams: group.recycleStreams
        })),
        forwardLinks: model.forwardLinks,
        auxiliaryLinks: state.flowsheetShowAuxiliaryArrows === false ? [] : model.auxiliaryLinks,
        recycleLinks: state.flowsheetShowAuxiliaryArrows === false ? [] : model.recycleLinks
      };
    }

    async function downloadFlowsheetPptx() {
      const button = $("downloadFlowsheetPptx");
      const originalLabel = button?.textContent || "";
      if (button) button.disabled = true;
      if (button) button.textContent = "Exporting...";
      try {
        const flowsheet = buildFlowsheetPowerPointExport();
        if (!flowsheet.groups.length) throw new Error("Create at least one task group before exporting PowerPoint.");
        const response = await fetch("/api/flowsheet-pptx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: buildProjectExport(),
            flowsheet
          })
        });
        if (!response.ok) {
          let message = `HTTP ${response.status}`;
          try {
            const data = await response.json();
            if (data.error) message = data.error;
          } catch (err) {}
          throw new Error(message);
        }
        const blob = await response.blob();
        if (!blob.size) throw new Error("PowerPoint export returned an empty file.");
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("presentationml.presentation")) {
          throw new Error("PowerPoint export returned an unexpected file type.");
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "flowsheet-editable.pptx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        const message = `Could not export PowerPoint: ${err.message || err}`;
        await alertModal(message);
      } finally {
        if (button) button.disabled = false;
        if (button) button.textContent = originalLabel || "Export PowerPoint";
      }
    }
