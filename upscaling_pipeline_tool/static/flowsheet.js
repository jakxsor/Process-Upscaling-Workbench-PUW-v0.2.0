    // Flowsheet View modal: builds the presentational PFD-style SVG diagram from the current
    // groups/streams, its unit shapes, auto-layout, and drag/edit interactions. Split out of
    // app.js for navigability; loaded as a plain <script> before app.js (see app.py) so these
    // functions share the same global scope as the rest of the app. Depends on: $, state,
    // escapeHtml, escapeAttr, formatNumber, massToKg, resolvedEndpointId, isBackwardLink,
    // orthogonalPath, groupIdsInTextOrder, groupModel, ensureGroup, inferGroupOperationClass,
    // aggregateGroupConditions, groupContentsTip, promptModal, renderAll, buildProjectExport,
    // flowsheetRequestSeq, flowsheetLayoutVersion — all defined in app.js.

    const flowsheetCategoryStyle = {
      reactor: { fill: "#fff8f7", stroke: "#cf4b42", label: "Reactor" },
      separation: { fill: "#f5f9ff", stroke: "#1671c2", label: "Separation" },
      utility: { fill: "#fffaf0", stroke: "#b97916", label: "Utility" },
      // Deliberately not green - the Feed/Product terminator boxes (below) already use #25834a/
      // #f4fbf6, so a storage unit next to a terminator would otherwise read as the same category.
      storage: { fill: "#f1fbfa", stroke: "#0f766e", label: "Storage" },
      waste: { fill: "#faf8f5", stroke: "#8b7057", label: "Waste" }
    };

    function flowsheetUnitCategory(group) {
      const name = String(group.selectedUnit || "").toLowerCase();
      if (/reactor/.test(name)) return "reactor";
      if (/distillation|evaporat|dry|extraction|decanter|filtration|crystalliz|absorption|membrane|strip|flash|column/.test(name)) return "separation";
      if (/wwt|waste|abatement|scrubber|neutraliz|carbon/.test(name)) return "waste";
      if (/exchanger|condenser|cooler|heater|utility/.test(name)) return "utility";
      if (/tank|vessel|storage|silo|feed/.test(name)) return "storage";
      const opClass = inferGroupOperationClass(group);
      if (opClass === "reaction_kinetic") return "reactor";
      if (["filtration", "drying", "crystallization"].includes(opClass)) return "separation";
      if (opClass === "heating_cooling") return "utility";
      return "separation";
    }

    function flowsheetUnitSubcategory(group) {
      const category = flowsheetUnitCategory(group);
      const name = String(group.selectedUnit || "").toLowerCase();
      if (category === "reactor") return "reactor";
      if (category === "storage") return "tank";
      if (category === "waste") return "waste_treatment";
      if (/exchanger|condenser|cooler|heater/.test(name)) return "heat_exchanger";
      if (category === "utility") return "utility_box";
      if (/mixer.?settler|decanter|liquid.?liquid extraction/.test(name)) return "mixer_settler";
      if (/thin.?film|wiped.?film|evaporat/.test(name)) return "evaporator";
      if (/dry|sieve|adsor|fixed.?bed/.test(name)) return "drying_column";
      if (/distill|short.?path|rectif/.test(name)) return "distillation";
      return "generic";
    }

    function flowsheetShapeMarkup(subcategory, x, y, w, h, stroke) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const shellFill = "#fff";
      if (subcategory === "reactor") {
        const bodyTop = y + h * 0.2;
        const bodyBottom = y + h * 0.9;
        const domeRy = h * 0.18;
        const left = x + w * 0.14;
        const right = x + w * 0.72;
        const coilX = x + w * 0.78;
        return `
          <path d="M ${left} ${bodyBottom} L ${left} ${bodyTop} A ${w * 0.29} ${domeRy} 0 0 1 ${right} ${bodyTop} L ${right} ${bodyBottom} Z" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></path>
          <rect x="${cx - w * 0.035}" y="${y + 2}" width="${w * 0.07}" height="${h * 0.13}" rx="3" fill="${shellFill}" stroke="${stroke}" stroke-width="1.6"></rect>
          <line x1="${cx}" y1="${y + h * 0.14}" x2="${cx}" y2="${bodyBottom - h * 0.1}" stroke="${stroke}" stroke-width="1.6"></line>
          <path d="M ${cx - w * 0.2} ${bodyBottom - h * 0.12} C ${cx - w * 0.1} ${bodyBottom - h * 0.2}, ${cx - w * 0.02} ${bodyBottom - h * 0.05}, ${cx} ${bodyBottom - h * 0.12} C ${cx + w * 0.1} ${bodyBottom - h * 0.2}, ${cx + w * 0.18} ${bodyBottom - h * 0.05}, ${cx + w * 0.24} ${bodyBottom - h * 0.12}" fill="none" stroke="${stroke}" stroke-width="1.5"></path>
          <path d="M ${coilX} ${y + h * 0.36} h ${w * 0.12} v ${h * 0.07} h ${-w * 0.12} v ${h * 0.07} h ${w * 0.12} v ${h * 0.07} h ${-w * 0.12} v ${h * 0.07} h ${w * 0.12}" fill="none" stroke="${stroke}" stroke-width="1.4"></path>
        `;
      }
      if (subcategory === "tank") {
        const top = y + h * 0.28;
        const bottom = y + h * 0.74;
        const left = x + w * 0.08;
        const right = x + w * 0.88;
        const rx = (bottom - top) / 2;
        return `
          <path d="M ${left + rx} ${top} L ${right - rx} ${top} A ${rx} ${rx} 0 0 1 ${right - rx} ${bottom} L ${left + rx} ${bottom} A ${rx} ${rx} 0 0 1 ${left + rx} ${top}" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></path>
          <line x1="${right - rx}" y1="${top}" x2="${right - rx}" y2="${bottom}" stroke="${stroke}" stroke-width="1.1"></line>
        `;
      }
      if (subcategory === "mixer_settler") {
        const top = y + h * 0.24;
        const bottom = y + h * 0.72;
        const left = x + w * 0.08;
        const right = x + w * 0.84;
        const capR = (bottom - top) / 2;
        return `
          <path d="M ${left} ${top} L ${right - capR} ${top} A ${capR} ${capR} 0 0 1 ${right - capR} ${bottom} L ${left} ${bottom} Z" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></path>
          <line x1="${left + (right - left) * 0.42}" y1="${top}" x2="${left + (right - left) * 0.42}" y2="${bottom}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="4 3"></line>
          <line x1="${left + 18}" y1="${cy}" x2="${right - capR - 10}" y2="${cy}" stroke="${stroke}" stroke-width="1.1"></line>
          <text x="${cx}" y="${cy - 8}" font-size="8.5" fill="${stroke}" text-anchor="middle">organic</text>
          <text x="${cx}" y="${cy + 15}" font-size="8.5" fill="${stroke}" text-anchor="middle">aqueous</text>
        `;
      }
      if (subcategory === "evaporator") {
        const top = y + h * 0.18;
        const bottom = y + h * 0.82;
        const left = x + w * 0.16;
        const right = x + w * 0.8;
        const capR = (bottom - top) / 2;
        const hatches = [];
        for (let i = 0; i < 8; i += 1) {
          const hx = left + 10 + i * ((right - left - 20) / 7);
          hatches.push(`<line x1="${hx}" y1="${top + 2}" x2="${hx}" y2="${bottom - 2}" stroke="${stroke}" stroke-width="1"></line>`);
        }
        return `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="${capR}" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></rect>${hatches.join("")}<line x1="${right}" y1="${cy}" x2="${x + w * 0.92}" y2="${cy}" stroke="${stroke}" stroke-width="1.3"></line>`;
      }
      if (subcategory === "drying_column") {
        const left = x + w * 0.34;
        const right = x + w * 0.66;
        const top = y + h * 0.1;
        const bottom = y + h * 0.9;
        const lines = [0.28, 0.46, 0.64, 0.82].map(f => `<line x1="${left}" y1="${top + (bottom - top) * f}" x2="${right}" y2="${top + (bottom - top) * f}" stroke="${stroke}" stroke-width="1"></line>`).join("");
        return `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="3" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></rect>${lines}<line x1="${left - 12}" y1="${top + 8}" x2="${right + 12}" y2="${top + 8}" stroke="${stroke}" stroke-width="1.4"></line>`;
      }
      if (subcategory === "distillation") {
        const top = y + h * 0.14;
        const bottom = y + h * 0.84;
        const halfTop = w * 0.11;
        const halfBottom = w * 0.055;
        const trayLines = (tcx) => [0.3, 0.48, 0.66].map(f => `<line x1="${tcx - halfBottom * 0.8}" y1="${top + (bottom - top) * f}" x2="${tcx + halfBottom * 0.8}" y2="${top + (bottom - top) * f}" stroke="${stroke}" stroke-width="1"></line>`).join("");
        const trapezoid = (tcx) => `M ${tcx - halfTop} ${top} L ${tcx + halfTop} ${top} L ${tcx + halfBottom} ${bottom} L ${tcx - halfBottom} ${bottom} Z`;
        return `
          <path d="${trapezoid(x + w * 0.38)}" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></path>
          ${trayLines(x + w * 0.38)}
          <path d="${trapezoid(x + w * 0.66)}" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></path>
          ${trayLines(x + w * 0.66)}
        `;
      }
      if (subcategory === "heat_exchanger") {
        const left = x + w * 0.12;
        const top = y + h * 0.25;
        const ww = w * 0.76;
        const hh = h * 0.42;
        const tubes = [0.22, 0.38, 0.54, 0.7].map(f => `<line x1="${left + 12}" y1="${top + hh * f}" x2="${left + ww - 12}" y2="${top + hh * f}" stroke="${stroke}" stroke-width="1"></line>`).join("");
        return `<rect x="${left}" y="${top}" width="${ww}" height="${hh}" rx="7" fill="${shellFill}" stroke="${stroke}" stroke-width="2"></rect>${tubes}<line x1="${left + ww * 0.2}" y1="${top - 18}" x2="${left + ww * 0.2}" y2="${top}" stroke="${stroke}" stroke-width="1.2"></line><line x1="${left + ww * 0.78}" y1="${top + hh}" x2="${left + ww * 0.78}" y2="${top + hh + 18}" stroke="${stroke}" stroke-width="1.2"></line>`;
      }
      if (subcategory === "waste_treatment") {
        return `<rect x="${x + w * 0.08}" y="${y + h * 0.18}" width="${w * 0.84}" height="${h * 0.62}" rx="4" fill="${shellFill}" stroke="${stroke}" stroke-width="1.8"></rect><path d="M ${x + w * 0.18} ${y + h * 0.52} C ${x + w * 0.34} ${y + h * 0.42}, ${x + w * 0.48} ${y + h * 0.62}, ${x + w * 0.64} ${y + h * 0.52} C ${x + w * 0.72} ${y + h * 0.47}, ${x + w * 0.8} ${y + h * 0.5}, ${x + w * 0.86} ${y + h * 0.55}" fill="none" stroke="${stroke}" stroke-width="1.2"></path>`;
      }
      return `<rect x="${x + w * 0.08}" y="${y + h * 0.16}" width="${w * 0.84}" height="${h * 0.64}" rx="6" fill="${shellFill}" stroke="${stroke}" stroke-width="1.8"></rect>`;
    }

    function flowsheetGroupStreams(group) {
      const streams = group.blocks.flatMap(block => (block.streams || []).filter(stream => stream.name.trim()));
      const isProduct = streams.some(stream => stream.role === "output" && stream.fate === "product");
      const wasteStreams = streams.filter(stream => ["wastewater", "solid waste", "purge", "loss"].includes(stream.fate));
      const ventStreams = streams.filter(stream => stream.fate === "vent");
      const recycleStreams = streams.filter(stream => ["recycled input", "recovered solvent"].includes(stream.fate) && stream.destinationGroup.trim());
      const outputStreams = streams.filter(stream => stream.role === "output");
      const inputStreams = streams.filter(stream => stream.role === "input");
      const totalOutputKg = outputStreams.reduce((sum, stream) => {
        const kg = massToKg(stream.quantity, stream.unit);
        return sum + (Number.isFinite(kg) ? kg : 0);
      }, 0);
      return { isProduct, wasteStreams, ventStreams, recycleStreams, outputStreams, inputStreams, totalOutputKg };
    }

    function flowsheetGroupSpecs(group) {
      const conditions = aggregateGroupConditions(group);
      const byId = id => conditions.find(item => item.id === id);
      const temp = byId("target_temperature") || byId("holding_temperature") || byId("initial_temperature");
      const pressure = byId("target_pressure") || byId("initial_pressure");
      const duration = byId("reaction_time") || byId("holding_time") || byId("phase_change_time") || byId("contact_time");
      const lines = [];
      if (temp) lines.push(temp.display);
      if (pressure) lines.push(pressure.display);
      if (duration) lines.push(`${duration.display} hold`);
      return lines;
    }

    function flowsheetCanOverlap(group) {
      const schedule = group?.schedule || {};
      return String(schedule.canOverlap || "").toLowerCase() === "yes"
        || /overlap|parallel|concurrent/i.test(String(schedule.dependency || ""))
        || /-P[2-9]\d*$/i.test(String(group?.id || ""));
    }

    function flowsheetStageBaseId(id) {
      return String(id || "").replace(/-P\d+$/i, "");
    }

    function flowsheetAutoLayout(groupIds) {
      const baseIds = [];
      groupIds.forEach(groupId => {
        const baseId = flowsheetStageBaseId(groupId);
        if (!baseIds.includes(baseId)) baseIds.push(baseId);
      });
      const groupOrder = new Map(groupIds.map((id, index) => [id, index]));
      const baseEdges = [];
      state.links.forEach(link => {
        const from = resolvedEndpointId(link.from);
        const to = resolvedEndpointId(link.to);
        if (!groupOrder.has(from) || !groupOrder.has(to)) return;
        if (isBackwardLink({ from, to })) return;
        const fromBase = flowsheetStageBaseId(from);
        const toBase = flowsheetStageBaseId(to);
        if (fromBase === toBase) return;
        baseEdges.push([fromBase, toBase]);
      });

      const stageByBase = new Map(baseIds.map(id => [id, 0]));
      if (!baseEdges.length) {
        baseIds.forEach((id, index) => stageByBase.set(id, index));
      } else {
        for (let pass = 0; pass < Math.max(1, baseIds.length); pass += 1) {
          baseEdges.forEach(([fromBase, toBase]) => {
            stageByBase.set(toBase, Math.max(stageByBase.get(toBase) || 0, (stageByBase.get(fromBase) || 0) + 1));
          });
        }
        baseIds.forEach((id, index) => {
          const participates = baseEdges.some(([fromBase, toBase]) => fromBase === id || toBase === id);
          if (!participates) {
            stageByBase.set(id, Math.max(index, ...Array.from(stageByBase.values())) + 1);
          }
        });
      }

      // A base id is a "confluence" node when it receives forward edges from more than one
      // distinct upstream stage - e.g. a shared recovery/vent/WWT unit fed by several process
      // stages. Its own stage number is usually unique (nothing else lands on that column), so
      // the plain collision-based row bump below never fires for it and it stays on row 0 -
      // same row as the main chain it actually cuts across. Force confluence nodes off row 0
      // so their connectors get routed as cross-row (with obstacle-avoiding detours) instead of
      // being drawn as a same-row straight line through the intervening boxes.
      const incomingStagesByBase = new Map();
      baseEdges.forEach(([fromBase, toBase]) => {
        if (!incomingStagesByBase.has(toBase)) incomingStagesByBase.set(toBase, new Set());
        incomingStagesByBase.get(toBase).add(stageByBase.get(fromBase));
      });
      const confluenceBases = new Set(
        Array.from(incomingStagesByBase.entries())
          .filter(([, stages]) => stages.size > 1)
          .map(([base]) => base)
      );

      const rowByStage = new Map();
      const rowById = new Map();
      const stageById = new Map();
      groupIds.forEach(groupId => {
        const baseId = flowsheetStageBaseId(groupId);
        const stage = stageByBase.get(baseId) || 0;
        const minRow = confluenceBases.has(baseId) ? 1 : 0;
        const row = Math.max(minRow, rowByStage.get(stage) || 0);
        rowByStage.set(stage, row + 1);
        stageById.set(groupId, stage);
        rowById.set(groupId, row);
      });
      return { stageById, rowById, rowByStage };
    }

    function flowsheetFlowTooltip(fromBox, toBox, magnitudeKg) {
      const header = `${fromBox.id} -> ${toBox.id}`;
      const massLine = Number.isFinite(magnitudeKg) && magnitudeKg > 0 ? `~${formatNumber(magnitudeKg)} kg/batch (from ${fromBox.id} outputs)` : "quantity not available";
      const substances = fromBox.outputStreams.filter(s => !["wastewater", "solid waste", "purge", "loss", "vent"].includes(s.fate)).slice(0, 6)
        .map(s => `- ${s.name}: ${s.quantity || "?"} ${s.unit || ""}`.trim());
      return [header, massLine, ...(substances.length ? ["Substances:", ...substances] : [])].join("\n");
    }

    function buildFlowsheetModel() {
      const groupIds = groupIdsInTextOrder();
      const layout = flowsheetAutoLayout(groupIds);
      const boxW = 224;
      const boxH = 184;
      const stageGapX = 82;
      const rowGapY = 286;
      const originX = 286;
      const originY = 132;
      const groups = groupIds.map((groupId, index) => {
        const group = groupModel(groupId);
        const stored = ensureGroup(groupId);
        const category = flowsheetUnitCategory(group);
        const subcategory = flowsheetUnitSubcategory(group);
        const meta = flowsheetGroupStreams(group);
        const specs = flowsheetGroupSpecs(group);
        const tip = groupContentsTip(group);
        const stage = layout.stageById.get(groupId) ?? index;
        const stageRow = layout.rowById.get(groupId) || 0;
        const auto = {
          x: originX + stage * (boxW + stageGapX),
          y: originY + stageRow * rowGapY
        };
        const useStored = stored.flowsheetLayoutVersion === flowsheetLayoutVersion && Number.isFinite(stored.flowsheetX) && Number.isFinite(stored.flowsheetY);
        const x = useStored ? stored.flowsheetX : auto.x;
        const y = useStored ? stored.flowsheetY : auto.y;
        return {
          id: group.id,
          unitNumber: index + 1,
          task: group.task || "unassigned",
          selectedUnit: group.selectedUnit || "unassigned unit",
          category,
          subcategory,
          specs,
          tip,
          x,
          y,
          symbolCenterY: y + 62,
          stage,
          stageRow,
          concurrent: stageRow > 0 || flowsheetCanOverlap(group),
          w: boxW,
          h: boxH,
          ...meta
        };
      });
      const byId = new Map(groups.map(item => [item.id, item]));
      const forwardLinks = [];
      const recycleLinks = [];
      state.links.forEach(link => {
        const from = resolvedEndpointId(link.from);
        const to = resolvedEndpointId(link.to);
        if (!byId.has(from) || !byId.has(to)) return;
        if (isBackwardLink(link)) recycleLinks.push({ from, to });
        else forwardLinks.push({ from, to });
      });
      if (!state.links.length && groups.length > 1) {
        for (let i = 0; i < groups.length - 1; i += 1) {
          forwardLinks.push({ from: groups[i].id, to: groups[i + 1].id });
        }
      }
      const maxOutputKg = Math.max(0, ...groups.map(item => item.totalOutputKg || 0));
      const maxWasteVent = Math.max(0, ...groups.map(item => Math.max(item.wasteStreams.length, item.ventStreams.length)));
      const stubLaneH = 34;
      const wasteAreaH = maxWasteVent ? 22 + maxWasteVent * stubLaneH : 0;
      const maxBoxBottom = groups.length ? Math.max(...groups.map(item => item.y + item.h + 104)) : originY + boxH;
      const minBoxLeft = groups.length ? Math.min(...groups.map(item => item.x)) : 120;
      const maxBoxRight = groups.length ? Math.max(...groups.map(item => item.x + item.w)) : 900;
      const recycleLaneBaseY = maxBoxBottom + wasteAreaH + 54;
      const recycleLaneCount = recycleLinks.length;
      const feedBox = groups.length ? {
        id: "feeds",
        x: Math.max(34, minBoxLeft - 228),
        y: groups[0].y + 22,
        w: 178,
        h: Math.max(118, Math.min(204, 54 + groups[0].inputStreams.slice(0, 4).length * 34))
      } : null;
      const lastGroup = groups[groups.length - 1];
      const productBox = lastGroup ? {
        id: "product",
        x: maxBoxRight + 54,
        y: lastGroup.y + 36,
        w: 190,
        h: 92
      } : null;
      const maxDiagramRight = Math.max(maxBoxRight, productBox ? productBox.x + productBox.w : 0);
      const width = Math.max(1880, maxDiagramRight + 120);
      const height = Math.max(660, recycleLaneCount ? recycleLaneBaseY + recycleLaneCount * 34 + 74 : maxBoxBottom + wasteAreaH + 118);
      return { groups, byId, forwardLinks, recycleLinks, feedBox, productBox, width, height, boxW, boxH, wasteAreaH, recycleLaneBaseY, maxOutputKg };
    }

    function flowsheetBoxCenter(box) {
      return { x: box.x + box.w / 2, y: Number.isFinite(box.symbolCenterY) ? box.symbolCenterY : box.y + box.h / 2 };
    }

    function flowsheetPort(from, to, offset = 12) {
      const fromCenter = flowsheetBoxCenter(from);
      const toCenter = flowsheetBoxCenter(to);
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0
          ? { x: from.x + from.w + offset, y: fromCenter.y }
          : { x: from.x - offset, y: fromCenter.y };
      }
      return dy >= 0
        ? { x: fromCenter.x, y: from.y + from.h + offset }
        : { x: fromCenter.x, y: from.y - offset };
    }

    function flowsheetRectsIntersectBand(rect, x1, x2, y1, y2) {
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      return rect.x < right && rect.x + rect.w > left && rect.y < bottom && rect.y + rect.h > top;
    }

    function flowsheetConnectorPoints(model, from, to) {
      const pad = 4;
      const fromPt = flowsheetPort(from, to, 10);
      const toPt = flowsheetPort(to, from, 14);
      const others = model.groups.filter(box => box.id !== from.id && box.id !== to.id);
      const mostlyHorizontal = Math.abs(fromPt.x - toPt.x) >= Math.abs(fromPt.y - toPt.y);
      const sameRow = Math.abs(fromPt.y - toPt.y) < 3;
      const sameColumn = Math.abs(fromPt.x - toPt.x) < 3;
      if (mostlyHorizontal && sameRow) {
        const blocked = others.some(box => flowsheetRectsIntersectBand(box, fromPt.x, toPt.x, fromPt.y - pad, fromPt.y + pad));
        if (!blocked) return [fromPt, toPt];
      }
      if (!mostlyHorizontal && sameColumn) {
        const blocked = others.some(box => flowsheetRectsIntersectBand(box, fromPt.x - pad, fromPt.x + pad, fromPt.y, toPt.y));
        if (!blocked) return [fromPt, toPt];
      }
      if (mostlyHorizontal) {
        let midX = (fromPt.x + toPt.x) / 2;
        const direction = toPt.x >= fromPt.x ? 1 : -1;
        const hitsObstacle = () => others.some(box => flowsheetRectsIntersectBand(box, midX - pad, midX + pad, fromPt.y, toPt.y));
        let guard = 0;
        while (hitsObstacle() && guard < 7) {
          midX += direction * 48;
          guard += 1;
        }
        return [fromPt, { x: midX, y: fromPt.y }, { x: midX, y: toPt.y }, toPt];
      }
      let midY = (fromPt.y + toPt.y) / 2;
      const direction = toPt.y >= fromPt.y ? 1 : -1;
      const hitsObstacle = () => others.some(box => flowsheetRectsIntersectBand(box, fromPt.x, toPt.x, midY - pad, midY + pad));
      let guard = 0;
      while (hitsObstacle() && guard < 7) {
        midY += direction * 42;
        guard += 1;
      }
      return [fromPt, { x: fromPt.x, y: midY }, { x: toPt.x, y: midY }, toPt];
    }

    function buildFlowsheetSvg() {
      const model = buildFlowsheetModel();
      if (!model.groups.length) {
        return { svg: "", empty: true };
      }
      const defs = `
        <defs>
          <marker id="fsArrow" markerWidth="13" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L12,6 L0,12 z" fill="#172027"></path>
          </marker>
          <marker id="fsArrowGreen" markerWidth="13" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L12,6 L0,12 z" fill="#286d3f"></path>
          </marker>
          <marker id="fsArrowOrange" markerWidth="13" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L12,6 L0,12 z" fill="#965d00"></path>
          </marker>
          <marker id="fsArrowGrey" markerWidth="13" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L12,6 L0,12 z" fill="#657480"></path>
          </marker>
        </defs>
      `;

      const sankeyWidth = (kg) => {
        if (!Number.isFinite(kg) || kg <= 0 || model.maxOutputKg <= 0) return 2.2;
        return Math.min(4.8, Math.max(2.2, (kg / model.maxOutputKg) * 3.1 + 1.7));
      };

      const flowPathMarkup = (points, strokeWidth, tooltip, marker = "url(#fsArrow)", color = "#172027", dash = "") => {
        const d = orthogonalPath(points, 14);
        return `
          <path d="${d}" stroke="#ffffff" stroke-width="${strokeWidth + 5}" stroke-linejoin="round" stroke-linecap="round" fill="none"></path>
          <path class="tip" data-tip="${escapeAttr(tooltip)}" d="${d}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" fill="none" ${dash ? `stroke-dasharray="${dash}"` : ""} ${marker ? `marker-end="${marker}"` : ""}></path>
        `;
      };

      const renderedForward = new Set();
      const forwardLinkKey = (fromId, toId) => `${fromId}->${toId}`;
      const forwardGroups = [];
      const fanoutBySourceStage = new Map();
      const faninByTargetStage = new Map();
      model.forwardLinks.forEach(link => {
        const from = model.byId.get(link.from);
        const to = model.byId.get(link.to);
        if (!from || !to) return;
        const sourceKey = `${from.id}|${to.stage}`;
        const targetKey = `${to.id}|${from.stage}`;
        if (!fanoutBySourceStage.has(sourceKey)) fanoutBySourceStage.set(sourceKey, { from, targets: [] });
        fanoutBySourceStage.get(sourceKey).targets.push(to);
        if (!faninByTargetStage.has(targetKey)) faninByTargetStage.set(targetKey, { to, sources: [] });
        faninByTargetStage.get(targetKey).sources.push(from);
      });

      fanoutBySourceStage.forEach(entry => {
        const targets = Array.from(new Map(entry.targets.map(target => [target.id, target])).values());
        if (targets.length < 2) return;
        const from = entry.from;
        const strokeWidth = sankeyWidth(from.totalOutputKg);
        const source = { x: from.x + from.w + 12, y: flowsheetBoxCenter(from).y };
        const targetPorts = targets
          .sort((a, b) => a.y - b.y)
          .map(target => ({ target, point: { x: target.x - 14, y: flowsheetBoxCenter(target).y } }));
        const manifoldX = Math.min(...targetPorts.map(item => item.point.x)) - 46;
        forwardGroups.push(flowPathMarkup([source, { x: manifoldX, y: source.y }], strokeWidth, `split from ${from.id}`, "", "#172027"));
        const yValues = [source.y, ...targetPorts.map(item => item.point.y)];
        forwardGroups.push(flowPathMarkup([{ x: manifoldX, y: Math.min(...yValues) }, { x: manifoldX, y: Math.max(...yValues) }], strokeWidth, `parallel manifold from ${from.id}`, "", "#172027"));
        targetPorts.forEach(({ target, point }) => {
          forwardGroups.push(flowPathMarkup([{ x: manifoldX, y: point.y }, point], strokeWidth, flowsheetFlowTooltip(from, target, from.totalOutputKg), "url(#fsArrow)", "#172027"));
          renderedForward.add(forwardLinkKey(from.id, target.id));
        });
      });

      faninByTargetStage.forEach(entry => {
        const sources = Array.from(new Map(entry.sources.map(source => [source.id, source])).values())
          .filter(source => !renderedForward.has(forwardLinkKey(source.id, entry.to.id)));
        if (sources.length < 2) return;
        const to = entry.to;
        const sourcePorts = sources
          .sort((a, b) => a.y - b.y)
          .map(source => ({ source, point: { x: source.x + source.w + 12, y: flowsheetBoxCenter(source).y } }));
        const target = { x: to.x - 14, y: flowsheetBoxCenter(to).y };
        const manifoldX = Math.max(...sourcePorts.map(item => item.point.x)) + 46;
        sourcePorts.forEach(({ source, point }) => {
          forwardGroups.push(flowPathMarkup([point, { x: manifoldX, y: point.y }], sankeyWidth(source.totalOutputKg), flowsheetFlowTooltip(source, to, source.totalOutputKg), "", "#172027"));
          renderedForward.add(forwardLinkKey(source.id, to.id));
        });
        const yValues = [target.y, ...sourcePorts.map(item => item.point.y)];
        forwardGroups.push(flowPathMarkup([{ x: manifoldX, y: Math.min(...yValues) }, { x: manifoldX, y: Math.max(...yValues) }], 2.8, `combine into ${to.id}`, "", "#172027"));
        forwardGroups.push(flowPathMarkup([{ x: manifoldX, y: target.y }, target], 2.8, `combined feed to ${to.id}`, "url(#fsArrow)", "#172027"));
      });

      model.forwardLinks.forEach(link => {
        if (renderedForward.has(forwardLinkKey(link.from, link.to))) return;
        const from = model.byId.get(link.from);
        const to = model.byId.get(link.to);
        if (!from || !to) return;
        const points = flowsheetConnectorPoints(model, from, to);
        const strokeWidth = sankeyWidth(from.totalOutputKg);
        const tooltip = flowsheetFlowTooltip(from, to, from.totalOutputKg);
        forwardGroups.push(flowPathMarkup(points, strokeWidth, tooltip, "url(#fsArrow)", "#172027"));
      });
      const forwardPaths = forwardGroups.join("");

      let recycleIndex = 0;
      const recyclePaths = model.recycleLinks.map(link => {
        const from = model.byId.get(link.from);
        const to = model.byId.get(link.to);
        const laneY = model.recycleLaneBaseY + recycleIndex * 34;
        recycleIndex += 1;
        const startX = from.x + from.w * 0.3;
        const endX = to.x + to.w * 0.7;
        const points = [
          { x: startX, y: from.y + from.h },
          { x: startX, y: laneY },
          { x: endX, y: laneY },
          { x: endX, y: to.y + to.h }
        ];
        const d = orthogonalPath(points, 12);
        const recycleKg = from.recycleStreams.reduce((sum, s) => {
          const kg = massToKg(s.quantity, s.unit);
          return sum + (Number.isFinite(kg) ? kg : 0);
        }, 0);
        const strokeWidth = Math.max(2, sankeyWidth(recycleKg) * 0.75);
        const recycleTooltip = [
          `recycle ${link.from} -> ${link.to}`,
          from.recycleStreams.length
            ? from.recycleStreams.map(s => `- ${s.name}: ${s.quantity || "?"} ${s.unit || ""}`.trim()).join("\n")
            : "quantity not available"
        ].join("\n");
        return `
          <path d="${d}" stroke="#ffffff" stroke-width="${strokeWidth + 4}" stroke-linecap="round" fill="none"></path>
          <path class="tip" data-tip="${escapeAttr(recycleTooltip)}" d="${d}" stroke="#25834a" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="7 5" fill="none" marker-end="url(#fsArrowGreen)"></path>
          <text x="${(startX + endX) / 2}" y="${laneY - 6}" font-size="11" fill="#286d3f" text-anchor="middle">recycle ${escapeHtml(link.from)} to ${escapeHtml(link.to)}</text>
        `;
      }).join("");

      const feedStreams = model.groups[0]?.inputStreams?.filter(stream => stream.name.trim()) || [];
      const feedBoxMarkup = model.feedBox && model.groups.length ? (() => {
        const box = model.feedBox;
        const first = model.groups[0];
        const listed = feedStreams.slice(0, 4);
        const names = listed.length ? listed : [{ name: "feed inputs", quantity: "", unit: "" }];
        const feedRows = names.map((stream, i) => {
          const rowY = box.y + 34 + i * 30;
          const label = `${stream.name}${stream.quantity ? ` ${stream.quantity} ${stream.unit || ""}` : ""}`.trim();
          return `
            <rect x="${box.x + 10}" y="${rowY - 14}" width="${box.w - 20}" height="23" rx="11.5" fill="#fff" stroke="#25834a" stroke-width="1.2"></rect>
            <text x="${box.x + box.w / 2}" y="${rowY + 1}" font-size="10.5" font-weight="600" fill="#172027" text-anchor="middle">${escapeHtml(label.length > 25 ? `${label.slice(0, 24)}...` : label)}</text>
          `;
        }).join("");
        const pathRows = names.map((stream, i) => {
          const start = { x: box.x + box.w, y: box.y + 34 + i * 30 };
          const end = { x: first.x - 14, y: first.y + Math.min(first.h - 24, 38 + i * 22) };
          const midX = (start.x + end.x) / 2;
          const d = orthogonalPath([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end], 10);
          const tip = `${stream.name || "feed"} -> ${first.id}`;
          return `
            <path d="${d}" stroke="#fff" stroke-width="5" fill="none"></path>
            <path class="tip" data-tip="${escapeAttr(tip)}" d="${d}" stroke="#657480" stroke-width="1.7" fill="none" marker-end="url(#fsArrowGrey)"></path>
          `;
        }).join("");
        return `
          ${pathRows}
          <g class="flowsheet-feed-node">
            <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="6" fill="#f4fbf6" stroke="#25834a" stroke-width="1.6"></rect>
            <text x="${box.x + 10}" y="${box.y + 18}" font-size="11" font-weight="800" fill="#25834a">FEED / STORAGE</text>
            ${feedRows}
          </g>
        `;
      })() : "";

      const productMarkup = model.productBox && model.groups.length ? (() => {
        const box = model.productBox;
        // The group with the actual fate:"product" output stream, not just whichever group
        // happens to be last in text order - upscaling additions appended after the real
        // purification step (vent abatement, solvent recovery, WWT) would otherwise become
        // "last" and the arrow would be drawn from the wrong unit with no product data.
        const last = model.groups.find(group => group.isProduct) || model.groups[model.groups.length - 1];
        const start = flowsheetPort(last, box, 10);
        const end = flowsheetPort(box, last, 14);
        const midX = (start.x + end.x) / 2;
        const d = orthogonalPath([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end], 12);
        const productStreams = last.outputStreams.filter(stream => stream.fate === "product" || /product|octocrylene/i.test(stream.name)).slice(0, 2);
        const label = productStreams[0]?.name || "final product";
        const qty = productStreams[0]?.quantity ? `${productStreams[0].quantity} ${productStreams[0].unit || ""}`.trim() : "";
        return `
          <path d="${d}" stroke="#fff" stroke-width="7" fill="none"></path>
          <path class="tip" data-tip="${escapeAttr(`${last.id} -> product\n${label}${qty ? `: ${qty}` : ""}`)}" d="${d}" stroke="#172027" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round" fill="none" marker-end="url(#fsArrow)"></path>
          <g class="flowsheet-product-node">
            <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="4" fill="#e9f7ed" stroke="#25834a" stroke-width="1.8"></rect>
            <text x="${box.x + box.w / 2}" y="${box.y + 36}" font-size="15" font-weight="800" fill="#172027" text-anchor="middle">${escapeHtml(wrapSvgText(label, 20)[0] || "Product")}</text>
            ${qty ? `<text x="${box.x + box.w / 2}" y="${box.y + 58}" font-size="11" font-weight="700" fill="#25834a" text-anchor="middle">${escapeHtml(qty)}</text>` : ""}
          </g>
        `;
      })() : "";

      const boxes = model.groups.map(box => {
        const style = flowsheetCategoryStyle[box.category];
        const center = flowsheetBoxCenter(box);
        const wasteVentHtml = [...box.wasteStreams.map(s => ({ ...s, kind: "waste" })), ...box.ventStreams.map(s => ({ ...s, kind: "vent" }))]
          .map((stream, i) => {
            const color = stream.kind === "waste" ? { line: "#965d00", marker: "url(#fsArrowOrange)" } : { line: "#657480", marker: "url(#fsArrowGrey)" };
            const leftSide = i % 2 === 1;
            const stubX = box.x + box.w * (leftSide ? 0.24 : 0.76);
            const stubY = box.y + box.h + 62 + Math.floor(i / 2) * 42;
            const labelX = stubX + (leftSide ? -18 : 18);
            const labelAnchor = leftSide ? "end" : "start";
            const label = `${stream.kind}: ${stream.name}`;
            return `
              <path d="M ${stubX} ${box.y + box.h} L ${stubX} ${stubY}" stroke="${color.line}" stroke-width="2" stroke-dasharray="${stream.kind === "vent" ? "4 4" : "none"}" fill="none" marker-end="${color.marker}"></path>
              <text x="${labelX}" y="${stubY + 4}" font-size="10" fill="${color.line}" text-anchor="${labelAnchor}">${escapeHtml(label.length > 34 ? `${label.slice(0, 33)}...` : label)}</text>
            `;
          }).join("");
        const strokeColor = box.isProduct ? "#286d3f" : style.stroke;
        const specsLine = [box.specs.join(" / "), box.totalOutputKg > 0 ? `${formatNumber(box.totalOutputKg)} kg/batch` : ""].filter(Boolean).join(" — ");
        const dragTip = `${box.tip}\n\nDrag to move. Double-click to edit the unit description.`;
        const symbolY = box.y + 10;
        const symbolH = 118;
        const tagY = box.y + 142;
        const unitLines = wrapSvgText(box.selectedUnit, 28);
        const taskLine = wrapSvgText(box.task, 38)[0] || "";
        return `
          <g class="flowsheet-unit" data-flowsheet-group="${escapeAttr(box.id)}">
            ${box.concurrent ? `<rect x="${box.x - 24}" y="${box.y - 24}" width="${box.w + 20}" height="${box.h + 20}" rx="7" fill="#eef2f4" stroke="#9aa7b0" stroke-width="1" opacity="0.55"></rect>` : ""}
            <rect x="${box.x - 10}" y="${box.y - 10}" width="${box.w + 20}" height="${box.h + 20}" rx="6" fill="#ffffff" stroke="#d6e0e5" stroke-width="1" opacity="0.86"></rect>
            <rect x="${box.x - 10}" y="${box.y - 10}" width="4" height="${box.h + 20}" rx="2" fill="${strokeColor}"></rect>
            ${flowsheetShapeMarkup(box.subcategory, box.x, symbolY, box.w, symbolH, strokeColor)}
            <rect x="${box.x + 16}" y="${tagY - 12}" width="${box.w - 32}" height="${box.h - symbolH - 18}" rx="3" fill="${style.fill}" stroke="${strokeColor}" stroke-width="0.8" opacity="0.9"></rect>
            <text x="${box.x + box.w / 2}" y="${tagY}" font-size="12" font-weight="900" text-anchor="middle" fill="${strokeColor}">U${box.unitNumber} ${escapeHtml(box.id)}</text>
            <text x="${box.x + box.w / 2}" y="${tagY + 17}" font-size="11.5" font-weight="800" text-anchor="middle" fill="#172027">
              ${unitLines.slice(0, 2).map((line, i) => `<tspan x="${box.x + box.w / 2}" dy="${i === 0 ? 0 : 13}">${escapeHtml(line)}</tspan>`).join("")}
            </text>
            ${specsLine ? `<text x="${box.x + box.w / 2}" y="${box.y + box.h + 18}" font-size="10.5" font-weight="700" text-anchor="middle" fill="${style.stroke}">${escapeHtml(specsLine.length > 54 ? `${specsLine.slice(0, 53)}...` : specsLine)}</text>` : ""}
            <text x="${box.x + box.w / 2}" y="${box.y + box.h + 34}" font-size="10.2" text-anchor="middle" fill="#657480">${escapeHtml(taskLine)}</text>
            ${box.concurrent ? `<text x="${box.x + box.w - 8}" y="${box.y + 6}" font-size="9.5" font-weight="800" text-anchor="end" fill="#6c7680">concurrent</text>` : ""}
            ${box.isProduct ? `<text x="${box.x + box.w / 2}" y="${box.y + box.h + 50}" font-size="11" font-weight="700" text-anchor="middle" fill="#286d3f">final product</text>` : ""}
            ${wasteVentHtml}
            <rect class="flowsheet-drag-handle tip" data-tip="${escapeAttr(dragTip)}" x="${box.x - 12}" y="${box.y - 12}" width="${box.w + 24}" height="${box.h + 62}" fill="transparent"></rect>
          </g>
        `;
      }).join("");

      const legendLineItems = [
        { label: "Process", color: "#172027", dash: "none" },
        { label: "Recycle", color: "#286d3f", dash: "7 5" },
        { label: "Waste", color: "#965d00", dash: "none" },
        { label: "Vent/VOC", color: "#657480", dash: "4 4" }
      ];
      const legendCategoryItems = Object.values(flowsheetCategoryStyle);
      const drawingHeight = model.height + 88;
      const titleBlockX = Math.max(620, model.width - 470);

      const svg = `
        <svg class="flowsheet-svg" width="${model.width}" height="${drawingHeight}" viewBox="0 0 ${model.width} ${drawingHeight}" xmlns="http://www.w3.org/2000/svg">
          ${defs}
          <rect x="0" y="0" width="${model.width}" height="${drawingHeight}" fill="#ffffff"></rect>
          <rect x="18" y="18" width="${model.width - 36}" height="${drawingHeight - 36}" fill="none" stroke="#172027" stroke-width="1.2"></rect>
          <text x="36" y="48" font-size="18" font-weight="900" fill="#172027">Generated Process Flowsheet</text>
          <text x="36" y="68" font-size="11" fill="#657480">Draft PFD generated from the current block/group model. Hover units and streams for MFA and condition details.</text>
          ${feedBoxMarkup}
          ${forwardPaths}
          ${recyclePaths}
          ${boxes}
          ${productMarkup}
          <g transform="translate(36, ${drawingHeight - 52})">
            ${legendLineItems.map((item, i) => `
              <line x1="${i * 130}" y1="0" x2="${i * 130 + 26}" y2="0" stroke="${item.color}" stroke-width="2.4" stroke-dasharray="${item.dash}"></line>
              <text x="${i * 130 + 32}" y="4" font-size="11" fill="#172027">${escapeHtml(item.label)}</text>
            `).join("")}
            ${legendCategoryItems.map((item, i) => `
              <rect x="${i * 102}" y="18" width="14" height="14" rx="2" fill="${item.fill}" stroke="${item.stroke}"></rect>
              <text x="${i * 102 + 20}" y="30" font-size="11" fill="#172027">${escapeHtml(item.label)}</text>
            `).join("")}
          </g>
          <g transform="translate(${titleBlockX}, ${drawingHeight - 92})">
            <rect x="0" y="0" width="440" height="56" fill="#fff" stroke="#172027" stroke-width="0.9"></rect>
            <line x1="0" y1="27" x2="440" y2="27" stroke="#172027" stroke-width="0.7"></line>
            <line x1="120" y1="0" x2="120" y2="56" stroke="#172027" stroke-width="0.7"></line>
            <line x1="285" y1="27" x2="285" y2="56" stroke="#172027" stroke-width="0.7"></line>
            <text x="10" y="18" font-size="10" font-weight="800" fill="#172027">DRAWING</text>
            <text x="130" y="18" font-size="10" fill="#172027">Scale-up support flowsheet</text>
            <text x="10" y="45" font-size="10" font-weight="800" fill="#172027">BASIS</text>
            <text x="130" y="45" font-size="10" fill="#172027">${model.groups.length} grouped operations</text>
            <text x="296" y="45" font-size="10" fill="#172027">Rev. draft</text>
          </g>
        </svg>
      `;
      return { svg, empty: false, width: model.width, height: drawingHeight };
    }

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

    async function renderPyflowsheetSvg() {
      const project = buildProjectExport();
      const response = await fetch("/api/flowsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.ok || !data.svg) throw new Error(data.error || "pyflowsheet returned no SVG");
      return data;
    }

    function renderFlowsheetModeButtons() {
      const editable = $("flowsheetEditableMode");
      const technical = $("flowsheetTechnicalMode");
      if (state.flowsheetMode === "technical" && !technical) state.flowsheetMode = "editable";
      if (editable) editable.classList.add("primary");
      if (technical) technical.classList.toggle("primary", state.flowsheetMode === "technical");
      const fit = $("fitFlowsheetView");
      if (fit) {
        fit.classList.toggle("primary", state.flowsheetFit);
        fit.textContent = state.flowsheetFit ? "Actual Size" : "Fit View";
        fit.title = state.flowsheetFit
          ? "Show the generated flowsheet at its actual SVG size"
          : "Fit the generated flowsheet inside the modal for overview";
      }
      $("resetFlowsheetLayout").disabled = false;
    }

    async function renderFlowsheetModal() {
      const host = $("flowsheetHost");
      if (!host) return;
      const requestSeq = ++flowsheetRequestSeq;
      renderFlowsheetModeButtons();
      host.classList.toggle("technical-mode", state.flowsheetMode === "technical");
      host.classList.toggle("editable-mode", state.flowsheetMode !== "technical");
      host.classList.toggle("fit-mode", state.flowsheetFit && state.flowsheetMode !== "technical");
      const result = buildFlowsheetSvg();
      if (state.flowsheetMode !== "technical") {
        host.innerHTML = result.empty
          ? `<div class="mfa-empty">No task groups yet — combine blocks into groups first, then open the Flowsheet View.</div>`
          : `<div class="flowsheet-render-status ok">Editable flowsheet board. Drag units, double-click unit labels, and hover arrows/units for details.</div>${result.svg}`;
        if (!result.empty) wireFlowsheetInteractions(host);
        if (!result.empty) requestAnimationFrame(() => host.scrollTo({ left: 0, top: 0 }));
        return;
      }
      host.innerHTML = result.empty
        ? `<div class="mfa-empty">No task groups yet — combine blocks into groups first, then open the Flowsheet View.</div>`
        : `<div class="flowsheet-render-status">Rendering technical PFD...</div>${result.svg}`;
      if (!result.empty) wireFlowsheetInteractions(host);
      if (result.empty) return;
      try {
        const data = await renderPyflowsheetSvg();
        if (requestSeq !== flowsheetRequestSeq || $("flowsheetModal").hidden) return;
        host.innerHTML = `
          <div class="flowsheet-render-status ok">Technical PFD rendered with ${escapeHtml(data.renderer || "Python renderer")} (${data.unitCount || 0} units). Parallel/split steps are stacked in the same stage and connected with explicit inlet/outlet arrows.</div>
          ${data.svg}
        `;
        const svg = host.querySelector("svg");
        if (svg) svg.classList.add("flowsheet-svg", "pyflowsheet-svg");
        requestAnimationFrame(() => host.scrollTo({ left: 0, top: 0 }));
      } catch (err) {
        if (requestSeq !== flowsheetRequestSeq) return;
        const banner = host.querySelector(".flowsheet-render-status");
        if (banner) {
          banner.className = "flowsheet-render-status warn";
          banner.textContent = `Technical renderer unavailable; showing interactive fallback. ${err.message || err}`;
        }
      }
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
      state.flowsheetMode = "editable";
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
