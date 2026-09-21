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

    function flowsheetCheckIssuesForBox(box) {
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
      if (box.balance?.status === "off") issues.push(`mass balance off by ${box.balance.deltaPercent > 0 ? "+" : ""}${flowsheetKgText(box.balance.deltaPercent)}%`);
      if (box.balance?.status === "open") issues.push(`${box.balance.unknown} stream${box.balance.unknown === 1 ? "" : "s"} without a usable mass`);
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
          <div class="flowsheet-detail-empty">Select a unit on the diagram to inspect streams, conditions, and data gaps.</div>
        `;
        return;
      }
      const issues = flowsheetCheckIssuesForBox(selected);
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
          <span><strong>${flowsheetKgText(selected.balance?.inKg || 0, selected.balance?.provenance)}</strong> kg in</span>
          <span><strong>${flowsheetKgText(selected.balance?.outKg || 0, selected.balance?.provenance)}</strong> kg out</span>
          <span><strong>${selected.balance
            ? selected.balance.status === "closed" ? "closed"
              : selected.balance.status === "open" ? `${selected.balance.unknown} n.q.`
              : selected.balance.status === "off" ? `${selected.balance.deltaPercent > 0 ? "+" : ""}${flowsheetKgText(selected.balance.deltaPercent)}%${selected.balance.withinUncertainty ? " (within the declared uncertainty)" : ""}`
              : "no data"
            : "-"}</strong> balance</span>
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
          <div class="flowsheet-detail-section-head">Checks</div>
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
      state.flowsheetViewPreset = preset === "clean" ? "clean" : "detailed";
      const clean = state.flowsheetViewPreset === "clean";
      state.flowsheetShowStreamLabels = !clean;
      state.flowsheetShowAuxiliaryArrows = !clean;
      state.flowsheetShowUnitDetails = !clean;
      state.flowsheetShowStreamTable = !clean;
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
      const detailedPreset = $("flowsheetDetailedPreset");
      if (cleanPreset) cleanPreset.classList.toggle("primary", state.flowsheetViewPreset === "clean");
      if (detailedPreset) detailedPreset.classList.toggle("primary", state.flowsheetViewPreset !== "clean");
      const basisSelect = $("flowsheetBasisSelect");
      if (basisSelect) basisSelect.value = flowsheetBasisKey();
      const tableToggle = $("flowsheetStreamTableToggle");
      if (tableToggle) tableToggle.checked = state.flowsheetShowStreamTable !== false;
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
      applyFlowsheetZoom();
      if (!result.empty && !state.selectedFlowsheetGroupId) requestAnimationFrame(() => host.scrollTo({ left: 0, top: 0 }));
    }

    // Zoom is independent of the Fit/Actual Size toggle: it resizes the rendered SVG in place
    // (width in px, height auto so the viewBox keeps the aspect ratio) rather than the CSS
    // width:100% used by fit-mode, so the two never fight over the element's inline style.
    function flowsheetZoomScale(svg) {
      const natural = Number(svg?.getAttribute("width")) || 1;
      const rendered = svg?.getBoundingClientRect().width || natural;
      return rendered / natural;
    }

    function flowsheetZoomAnchorPoint(host, svg, anchor) {
      const rect = host.getBoundingClientRect();
      const viewX = anchor && typeof anchor === "object" ? clamp(anchor.clientX - rect.left, 0, host.clientWidth) : host.clientWidth / 2;
      const viewY = anchor && typeof anchor === "object" ? clamp(anchor.clientY - rect.top, 0, host.clientHeight) : host.clientHeight / 2;
      const scale = flowsheetZoomScale(svg) || 1;
      return {
        viewX,
        viewY,
        naturalX: (host.scrollLeft + viewX) / scale,
        naturalY: (host.scrollTop + viewY) / scale
      };
    }

    function setFlowsheetZoom(nextZoom, anchor = "center") {
      const host = $("flowsheetHost");
      const svg = host?.querySelector("svg.flowsheet-svg");
      const clamped = Math.max(0.3, Math.min(3, nextZoom));
      if (Math.abs(state.flowsheetZoom - clamped) < 0.001) return;
      const anchorPoint = svg && host ? flowsheetZoomAnchorPoint(host, svg, anchor) : null;
      state.flowsheetZoom = clamped;
      state.flowsheetFit = false;
      applyFlowsheetZoom();
      renderFlowsheetModeButtons();
      if (anchorPoint) {
        host.scrollTo({
          left: Math.max(0, anchorPoint.naturalX * state.flowsheetZoom - anchorPoint.viewX),
          top: Math.max(0, anchorPoint.naturalY * state.flowsheetZoom - anchorPoint.viewY)
        });
      }
    }

    function resetFlowsheetZoom() {
      state.flowsheetZoom = 1;
      state.flowsheetFit = false;
      applyFlowsheetZoom();
      renderFlowsheetModeButtons();
    }

    function applyFlowsheetZoom() {
      const readout = $("flowsheetZoomReadout");
      if (readout) readout.textContent = `${Math.round(state.flowsheetZoom * 100)}%`;
      const host = $("flowsheetHost");
      if (!host) return;
      host.classList.toggle("fit-mode", state.flowsheetFit);
      const svg = host.querySelector("svg.flowsheet-svg");
      if (!svg) return;
      if (state.flowsheetFit) {
        svg.style.width = "";
        svg.style.height = "";
        return;
      }
      const naturalWidth = Number(svg.getAttribute("width")) || svg.getBoundingClientRect().width;
      svg.style.width = `${naturalWidth * state.flowsheetZoom}px`;
      svg.style.height = "";
    }

    function handleFlowsheetWheel(event) {
      const host = $("flowsheetHost");
      if (!host || !host.contains(event.target)) return;
      if (!(event.ctrlKey || event.metaKey || event.altKey)) return;
      event.preventDefault();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1);
      const normalized = Math.sign(pixels) * Math.min(Math.abs(pixels) / 100, 1);
      const factor = Math.exp(-normalized * 0.16);
      setFlowsheetZoom(state.flowsheetZoom * factor, { clientX: event.clientX, clientY: event.clientY });
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
          if (state.selectedFlowsheetGroupId === groupId) return;
          state.selectedFlowsheetGroupId = groupId;
          host.querySelectorAll(".flowsheet-unit.selected").forEach(unit => unit.classList.remove("selected"));
          unitGroup.classList.add("selected");
          renderFlowsheetDetailsPanel();
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
      state.flowsheetZoom = 1;
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

    // The export carries the routes the SVG actually drew, the arrow labels, the stream table and
    // the title block, so the slide is a conversion of the drawing rather than a second drawing.
    function buildFlowsheetPowerPointExport() {
      const rendered = buildFlowsheetSvg();
      const model = rendered.model || buildFlowsheetModel();
      const geometry = rendered.geometry || {};
      const labelFor = link => {
        const from = model.byId.get(link.from);
        const to = model.byId.get(link.to);
        if (!from || !to) return link.tag || "";
        if (!link.kind || link.kind === "process") return flowsheetProcessLabelForLink(from, to, link);
        if (link.kind === "recycle") return `${link.tag ? `${link.tag} ` : ""}recycle ${link.from} to ${link.to}${(link.directStreams || []).length ? `: ${flowsheetStreamsLabel(link.directStreams)}` : ""}`;
        return `${flowsheetAuxStyle(link.kind).label}: ${flowsheetLinkStreamSummary(link)}`;
      };
      const withGeometry = link => ({
        ...link,
        points: geometry[`${link.from}->${link.to}:${link.kind || "process"}`] || null,
        label: labelFor(link)
      });
      return {
        title: "Generated Process Flowsheet",
        basis: flowsheetProductBasisText(model),
        width: model.width,
        height: rendered.height || model.height + 88,
        productGroupId: model.productGroupId,
        feedBox: model.feedBox,
        feedStreams: model.feedStreams || [],
        productBox: model.productBox,
        dischargeBox: state.flowsheetShowAuxiliaryArrows === false ? null : model.dischargeBox || null,
        streamTable: rendered.streamTable || [],
        tableTop: rendered.tableTop,
        legendY: rendered.legendY,
        titleBlock: rendered.titleBlock,
        groups: model.groups.map(group => ({
          detailLines: flowsheetUnitDetailLines(group),
          balance: group.balance,
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
          recycleStreams: group.recycleStreams,
          isProduct: Boolean(group.isProduct),
          layout: group.exportLayout ? {
            accent: group.exportLayout.accent,
            tagTop: group.exportLayout.tagTop,
            tagHeight: group.exportLayout.tagHeight,
            unitLines: group.exportLayout.unitLines,
            footerLine: group.exportLayout.footerLine,
            taskLine: group.exportLayout.taskLine,
            taskY: group.exportLayout.taskY,
            productY: group.exportLayout.productY
          } : null,
          // The PNG is added asynchronously by attachFlowsheetSymbolImages before upload.
          symbol: group.exportLayout ? { ...group.exportLayout.symbolFrame, svg: flowsheetStandaloneSymbolSvg(group), png: "" } : null,
          boundaryOutlets: state.flowsheetShowAuxiliaryArrows === false ? [] : (group.boundaryOutlets || []).map(outlet => ({
            id: outlet.id,
            short: outlet.short,
            label: outlet.label,
            kind: outlet.kind,
            tag: outlet.tag,
            kg: outlet.kg,
            unknown: outlet.unknown,
            streams: outlet.streams,
            points: geometry[`${group.id}->${outlet.id}:boundary`] || null
          }))
        })),
        forwardLinks: model.forwardLinks.map(withGeometry),
        auxiliaryLinks: state.flowsheetShowAuxiliaryArrows === false ? [] : model.auxiliaryLinks.map(withGeometry),
        recycleLinks: state.flowsheetShowAuxiliaryArrows === false ? [] : model.recycleLinks.map(withGeometry)
      };
    }

    // Rasterises each unit symbol at 4x so the slide stays sharp when printed. The SVG travels too:
    // current PowerPoint shows the vector and can convert it to editable shapes, older viewers fall
    // back to the PNG. A symbol that fails to decode is simply left out of the slide.
    async function attachFlowsheetSymbolImages(flowsheet, scale = 4) {
      for (const group of flowsheet.groups) {
        const symbol = group.symbol;
        if (!symbol?.svg) continue;
        try {
          const image = new Image();
          image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(symbol.svg)}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(symbol.w * scale);
          canvas.height = Math.ceil(symbol.h * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          symbol.png = canvas.toDataURL("image/png");
        } catch (err) {
          group.symbol = null;
        }
      }
      return flowsheet;
    }

    async function downloadFlowsheetPptx() {
      const button = $("downloadFlowsheetPptx");
      const originalLabel = button?.textContent || "";
      if (button) button.disabled = true;
      if (button) button.textContent = "Exporting...";
      try {
        const flowsheet = buildFlowsheetPowerPointExport();
        if (!flowsheet.groups.length) throw new Error("Create at least one task group before exporting PowerPoint.");
        await attachFlowsheetSymbolImages(flowsheet);
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
