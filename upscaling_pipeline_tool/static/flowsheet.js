    // Flowsheet View modal: builds the presentational PFD-style SVG diagram from the current
    // groups/streams, its unit shapes, auto-layout, and drag/edit interactions. Split out of
    // app.js for navigability; loaded as a plain <script> before app.js (see app.py) so these
    // functions share the same global scope as the rest of the app. Depends on: $, state,
    // escapeHtml, escapeAttr, formatNumber, massToKg, resolvedEndpointId, isBackwardLink,
    // orthogonalPath, groupIdsInTextOrder, groupModel, ensureGroup, inferGroupOperationClass,
    // aggregateGroupConditions, groupContentsTip, promptModal, renderAll, buildProjectExport,
    // flowsheetLayoutVersion — defined in app.js.

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

    // An input stream counts as "external" (a fresh reagent/utility charge, not the bulk material
    // already implied by the main process-train arrow) when no other visualized group's outputs
    // has a same-named stream. The main train arrow itself carries no per-substance identity (it's
    // drawn from totalOutputKg, see flowsheetFlowTooltip), so this name match is how we avoid
    // drawing a second arrow for material the reader already sees arriving via the black arrow.
    function flowsheetExternalInputStreams(group, allGroups) {
      const upstreamNames = new Set();
      allGroups.forEach(other => {
        if (other.id === group.id) return;
        (other.outputStreams || []).forEach(stream => {
          const name = stream.name.trim().toLowerCase();
          if (name) upstreamNames.add(name);
        });
      });
      return (group.inputStreams || []).filter(stream => {
        const name = stream.name.trim().toLowerCase();
        const fate = String(stream.fate || "").toLowerCase();
        const timing = String(stream.timing || "").toLowerCase();
        return name && !upstreamNames.has(name) && (fate === "fresh input" || timing === "later addition");
      });
    }

    function flowsheetStreamsBetweenGroups(fromBox, toBox) {
      const targetInputNames = new Set((toBox.inputStreams || [])
        .map(stream => String(stream.name || "").trim().toLowerCase())
        .filter(Boolean));
      const direct = flowsheetDirectStreamsToGroup(fromBox.group || groupModel(fromBox.id), toBox.id);
      const matched = (fromBox.outputStreams || []).filter(stream => targetInputNames.has(String(stream.name || "").trim().toLowerCase()));
      return direct.length ? direct : matched;
    }

    function flowsheetStreamListKg(streams) {
      return (streams || []).reduce((sum, stream) => {
        const kg = massToKg(stream.quantity, stream.unit);
        return sum + (Number.isFinite(kg) ? kg : 0);
      }, 0);
    }

    function flowsheetProcessMagnitudeKg(fromBox, toBox) {
      const routedKg = flowsheetStreamListKg(flowsheetStreamsBetweenGroups(fromBox, toBox));
      return routedKg > 0 ? routedKg : fromBox.totalOutputKg;
    }

    function flowsheetProcessLabelText(fromBox, toBox) {
      const streams = flowsheetStreamsBetweenGroups(fromBox, toBox);
      if (!streams.length) return flowsheetConnectorLabelText(fromBox);
      const primary = streams.reduce((best, stream) => {
        const kg = massToKg(stream.quantity, stream.unit);
        const bestKg = massToKg(best.quantity, best.unit);
        return (Number.isFinite(kg) ? kg : -Infinity) > (Number.isFinite(bestKg) ? bestKg : -Infinity) ? stream : best;
      }, streams[0]);
      const qty = primary.quantity ? `${primary.quantity} ${primary.unit || ""}`.trim() : "";
      return `${primary.name}${qty ? `, ${qty}` : ""}`;
    }

    function flowsheetProcessTooltip(fromBox, toBox) {
      const streams = flowsheetStreamsBetweenGroups(fromBox, toBox);
      const magnitudeKg = flowsheetProcessMagnitudeKg(fromBox, toBox);
      const substances = (streams.length ? streams : fromBox.outputStreams)
        .filter(s => !["wastewater", "solid waste", "purge", "loss", "vent"].includes(s.fate))
        .slice(0, 6)
        .map(s => `- ${s.name}: ${s.quantity || "?"} ${s.unit || ""}`.trim());
      return [
        `${fromBox.id} -> ${toBox.id}`,
        Number.isFinite(magnitudeKg) && magnitudeKg > 0 ? `~${formatNumber(magnitudeKg)} kg/batch routed` : "quantity not available",
        ...(substances.length ? ["Routed material:", ...substances] : [])
      ].join("\n");
    }

    function flowsheetProcessTooltipForLink(fromBox, toBox, link) {
      if (!link || !(link.directStreams || []).length) return flowsheetProcessTooltip(fromBox, toBox);
      const magnitudeKg = flowsheetStreamListKg(link.directStreams);
      const substances = link.directStreams
        .filter(s => !["wastewater", "solid waste", "purge", "loss", "vent"].includes(s.fate))
        .slice(0, 6)
        .map(s => `- ${s.name}: ${s.quantity || "?"} ${s.unit || ""}`.trim());
      return [
        `${fromBox.id} -> ${toBox.id}`,
        Number.isFinite(magnitudeKg) && magnitudeKg > 0 ? `~${formatNumber(magnitudeKg)} kg/batch routed` : "quantity not available",
        ...(substances.length ? ["Routed material:", ...substances] : [])
      ].join("\n");
    }

    function flowsheetProcessLabelForLink(fromBox, toBox, link) {
      if (!link || !(link.directStreams || []).length) return flowsheetProcessLabelText(fromBox, toBox);
      const streams = link.directStreams;
      const primary = streams.reduce((best, stream) => {
        const kg = massToKg(stream.quantity, stream.unit);
        const bestKg = massToKg(best.quantity, best.unit);
        return (Number.isFinite(kg) ? kg : -Infinity) > (Number.isFinite(bestKg) ? bestKg : -Infinity) ? stream : best;
      }, streams[0]);
      const qty = primary.quantity ? `${primary.quantity} ${primary.unit || ""}`.trim() : "";
      return `${primary.name}${qty ? `, ${qty}` : ""}`;
    }

    function flowsheetMagnitudeForLink(fromBox, toBox, link) {
      const routedKg = link && (link.directStreams || []).length ? flowsheetStreamListKg(link.directStreams) : NaN;
      return routedKg > 0 ? routedKg : flowsheetProcessMagnitudeKg(fromBox, toBox);
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

    function flowsheetStreamLabel(stream) {
      const name = String(stream?.name || "").trim();
      if (!name) return "";
      const qty = String(stream?.quantity || "").trim();
      const unit = String(stream?.unit || "").trim();
      return `${name}${qty ? ` ${qty}${unit ? ` ${unit}` : ""}` : ""}`;
    }

    function flowsheetClipText(text, maxChars, minChars = 8) {
      const normalized = String(text || "").replace(/\s+/g, " ").trim();
      if (!normalized || normalized.length <= maxChars) return normalized;
      if (maxChars < minChars + 3) return "";
      const limit = Math.max(minChars, maxChars - 3);
      const prefix = normalized.slice(0, limit);
      const wordBreak = Math.max(prefix.lastIndexOf(" "), prefix.lastIndexOf("/"), prefix.lastIndexOf("-"));
      const clipped = wordBreak >= minChars ? prefix.slice(0, wordBreak).trim() : prefix.trim();
      return clipped ? `${clipped}...` : "";
    }

    function flowsheetCompactStreamLabel(stream, maxChars, includeQuantity = true) {
      const name = String(stream?.name || "").trim();
      if (!name) return "";
      const qty = String(stream?.quantity || "").trim();
      const unit = String(stream?.unit || "").trim();
      const full = `${name}${includeQuantity && qty ? ` ${qty}${unit ? ` ${unit}` : ""}` : ""}`.trim();
      const clippedFull = flowsheetClipText(full, maxChars);
      if (clippedFull) return clippedFull;
      return flowsheetClipText(name, maxChars);
    }

    function flowsheetTopStreamSummary(streams, label, limit = 1) {
      const items = (streams || [])
        .filter(stream => String(stream?.name || "").trim())
        .slice(0, limit)
        .map(flowsheetStreamLabel)
        .filter(Boolean);
      if (!items.length) return "";
      const extra = streams.length > limit ? ` +${streams.length - limit}` : "";
      return `${label}: ${items.join(", ")}${extra}`;
    }

    function flowsheetEquipmentSizeLine(group) {
      const schedule = group?.schedule || {};
      const amount = String(schedule.capacityAmount || "").trim();
      const unit = String(schedule.capacityUnit || "").trim();
      if (!amount || !unit) return "";
      return `Equipment: ${amount} ${unit}`;
    }

    function flowsheetDirectStreamsToGroup(group, toId) {
      const dest = String(toId || "").trim().toUpperCase();
      if (!group || !dest) return [];
      return group.blocks.flatMap(block => (block.streams || []).filter(stream => (
        String(stream.destinationGroup || "").trim().toUpperCase() === dest
          && String(stream.name || "").trim()
      )));
    }

    function flowsheetLinkKind(fromBox, toBox, link) {
      if (!fromBox || !toBox) return "process";
      if (isBackwardLink({ from: link.from, to: link.to })) return "recycle";
      const directStreams = flowsheetDirectStreamsToGroup(fromBox.group, toBox.id);
      const toText = `${toBox.task || ""} ${toBox.selectedUnit || ""}`.toLowerCase();
      const directFates = directStreams.map(stream => String(stream.fate || "").toLowerCase());
      if (directFates.some(fate => fate === "vent") || /\bvent\b|voc|abatement|scrubber|carbon/.test(toText)) return "vent";
      if (directFates.some(fate => ["wastewater", "solid waste", "purge", "loss"].includes(fate)) || toBox.category === "waste") return "waste";
      if (directStreams.length && (directFates.some(fate => ["recovered solvent", "recycled input"].includes(fate)) || /recovery|recover/.test(toText))) return "recovery";
      return "process";
    }

    function flowsheetPublicationLayout(groupIds, rawById, linkMeta) {
      const processLinks = linkMeta.filter(link => link.kind === "process");
      const processIds = new Set();
      processLinks.forEach(link => {
        processIds.add(link.from);
        processIds.add(link.to);
      });
      if (!processIds.size && groupIds.length) groupIds.forEach(id => processIds.add(id));

      const stageById = new Map(groupIds.map((id, index) => [id, processIds.has(id) ? index : 0]));
      if (processLinks.length) {
        groupIds.forEach(id => stageById.set(id, 0));
        for (let pass = 0; pass < Math.max(1, groupIds.length); pass += 1) {
          processLinks.forEach(link => {
            stageById.set(link.to, Math.max(stageById.get(link.to) || 0, (stageById.get(link.from) || 0) + 1));
          });
        }
      }
      const maxProcessStage = Math.max(0, ...Array.from(processIds).map(id => stageById.get(id) || 0));
      groupIds.forEach((id, index) => {
        if (processIds.has(id)) return;
        const incomingAux = linkMeta.filter(link => link.to === id && link.kind !== "process" && link.kind !== "recycle");
        const sourceStages = incomingAux.map(link => stageById.get(link.from)).filter(Number.isFinite);
        if (sourceStages.length) {
          const avgStage = sourceStages.reduce((sum, value) => sum + value, 0) / sourceStages.length;
          stageById.set(id, Math.max(1, Math.min(maxProcessStage, Math.round(avgStage) + 1)));
        } else {
          stageById.set(id, Math.min(maxProcessStage + 1, index));
        }
      });

      const rowById = new Map();
      const occupied = new Set();
      groupIds.forEach(id => {
        const raw = rawById.get(id);
        const text = `${raw?.task || ""} ${raw?.selectedUnit || ""}`.toLowerCase();
        let row = 0;
        if (!processIds.has(id)) {
          if (/\bvent\b|voc|abatement|scrubber|carbon/.test(text)) row = 1;
          else row = 2;
        }
        const stage = stageById.get(id) || 0;
        while (occupied.has(`${stage}:${row}`)) row += 1;
        occupied.add(`${stage}:${row}`);
        rowById.set(id, row);
      });
      return { stageById, rowById };
    }

    function flowsheetUnitDetailLines(box) {
      const materialLine = [
        flowsheetTopStreamSummary(box.inputStreams, "In"),
        flowsheetTopStreamSummary(box.outputStreams, "Out")
      ].filter(Boolean).join(" | ");
      return [
        box.equipmentSizeLine,
        box.totalOutputKg > 0 ? `Load: ${formatNumber(box.totalOutputKg)} kg/batch out` : "",
        (box.specs || []).length ? `Operating: ${box.specs.join(" / ")}` : "",
        materialLine ? `MFA: ${materialLine}` : ""
      ].filter(Boolean).slice(0, 3);
    }

    function flowsheetUnitDetailsMarkup(box, x, y, width) {
      if (state.flowsheetShowUnitDetails !== true) return "";
      const lines = flowsheetUnitDetailLines(box);
      if (!lines.length) return "";
      const maxChars = Math.max(18, Math.min(30, Math.floor((width - 8) / 5.4)));
      return lines.map((line, index) => {
        const clipped = flowsheetClipText(line, maxChars, 12);
        return `<text x="${x}" y="${y + index * 12}" font-size="9.4" font-weight="650" fill="#40515d">${escapeHtml(clipped)}</text>`;
      }).join("");
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

    // Topological stage/row assignment shared by the Flowsheet View (flowsheetAutoLayout) and the
    // interactive board's "Auto-Layout" (autoLayoutGroups, in app.js) - both want the same
    // left-to-right process order, they just turn stage/row into different pixel gaps afterwards.
    // Returns levels/order only, not absolute coordinates - callers own gapX/gapY/origin.
    function topologicalGroupOrder(groupIds) {
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

    function flowsheetAutoLayout(groupIds) {
      return topologicalGroupOrder(groupIds);
    }

    // Picks the single most representative output stream to print on a connector arrow (by mass,
    // excluding waste/vent/purge which get their own stub arrows) - a full stream list would be
    // unreadable at this scale, but the hover tooltip (flowsheetFlowTooltip) still has everything.
    // Not truncated here - the available space varies per connector (adjacent boxes only leave a
    // narrow gap, a routed detour leaves much more), so flowsheetConnectorLabelMarkup fits it later.
    function flowsheetConnectorLabelText(fromBox) {
      const candidates = (fromBox.outputStreams || [])
        .filter(stream => stream.name.trim() && !["wastewater", "solid waste", "purge", "loss", "vent"].includes(stream.fate));
      if (!candidates.length) return "";
      const primary = candidates.reduce((best, stream) => {
        const kg = massToKg(stream.quantity, stream.unit);
        const bestKg = massToKg(best.quantity, best.unit);
        return (Number.isFinite(kg) ? kg : -Infinity) > (Number.isFinite(bestKg) ? bestKg : -Infinity) ? stream : best;
      }, candidates[0]);
      const qty = primary.quantity ? `${primary.quantity} ${primary.unit || ""}`.trim() : "";
      return `${primary.name}${qty ? `, ${qty}` : ""}`;
    }

    // Prints a stream label directly on the diagram instead of only in the hover tooltip - the
    // exported/downloaded SVG has no hover, so without this the substance/quantity data is lost
    // the moment the diagram leaves the browser (e.g. dropped into a paper figure).
    // Adjacent unit boxes only leave ~50-60px of the connector visible between them (the rest of
    // the "gap" is the box footprints on either side), so the label is truncated to the actual
    // free pixel width of its segment - a fixed character cap either overlapped the neighboring
    // box (short segments) or wasted the room on long routed detours.
    function flowsheetConnectorLabelMarkup(points, text, color) {
      if (!text || state.flowsheetShowStreamLabels === false) return "";
      let best = null;
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        if (Math.abs(a.y - b.y) > 1) continue;
        const len = Math.abs(b.x - a.x);
        if (!best || len > best.len) best = { len, left: Math.min(a.x, b.x), y: a.y };
      }
      if (!best || best.len < 86) return "";
      const avgCharPx = 5.6; // approx glyph width at font-size 9.5, font-weight 700
      const maxChars = Math.max(10, Math.floor((best.len - 22) / avgCharPx));
      const compact = flowsheetClipText(String(text).split(",")[0], maxChars, 8) || flowsheetClipText(text, maxChars, 8);
      if (!compact) return "";
      const labelW = Math.min(best.len - 10, compact.length * avgCharPx + 14);
      const x = best.left + 6;
      // Left-anchored at the segment's own start and backed by a small white tag so it does not
      // read as text printed through the connector line.
      return `
        <g class="flowsheet-link-label">
          <title>${escapeHtml(text)}</title>
          <rect x="${x - 3}" y="${best.y - 21}" width="${labelW}" height="16" rx="3" fill="#ffffff" opacity="0.94" stroke="#d6e0e5" stroke-width="0.7"></rect>
          <text x="${x + 3}" y="${best.y - 9}" font-size="9.3" font-weight="800" text-anchor="start" fill="${color}">${escapeHtml(compact)}</text>
        </g>
      `;
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
      const boxW = 224;
      const boxH = state.flowsheetShowUnitDetails === true ? 224 : 184;
      // Publication view: leave real corridors between process units and reserve lower rows for
      // waste, vent, recovery and recycle service loops so arrows do not cross equipment boxes.
      const stageGapX = 188;
      const rowGapY = 318;
      const originX = 286;
      const originY = 154;
      const rawGroups = groupIds.map((groupId, index) => {
        const group = groupModel(groupId);
        const category = flowsheetUnitCategory(group);
        const subcategory = flowsheetUnitSubcategory(group);
        const meta = flowsheetGroupStreams(group);
        const specs = flowsheetGroupSpecs(group);
        const tip = groupContentsTip(group);
        return {
          id: group.id,
          group,
          unitNumber: index + 1,
          task: group.task || "unassigned",
          selectedUnit: group.selectedUnit || "unassigned unit",
          category,
          subcategory,
          specs,
          equipmentSizeLine: flowsheetEquipmentSizeLine(group),
          tip,
          ...meta
        };
      });
      const rawById = new Map(rawGroups.map(item => [item.id, item]));
      const linkMeta = [];
      const seenLinks = new Set();
      state.links.forEach(link => {
        const from = resolvedEndpointId(link.from);
        const to = resolvedEndpointId(link.to);
        const fromBox = rawById.get(from);
        const toBox = rawById.get(to);
        if (!fromBox || !toBox) return;
        const key = `${from}->${to}`;
        if (from === to || seenLinks.has(key)) return;
        seenLinks.add(key);
        const directStreams = flowsheetDirectStreamsToGroup(fromBox.group, to);
        linkMeta.push({ from, to, kind: flowsheetLinkKind(fromBox, toBox, { from, to }), directStreams });
      });
      const layout = flowsheetPublicationLayout(groupIds, rawById, linkMeta);
      const groups = rawGroups.map((raw, index) => {
        const stored = ensureGroup(raw.id);
        const stage = layout.stageById.get(raw.id) ?? index;
        const stageRow = layout.rowById.get(raw.id) || 0;
        const auto = {
          x: originX + stage * (boxW + stageGapX),
          y: originY + stageRow * rowGapY
        };
        const useStored = stored.flowsheetLayoutVersion === flowsheetLayoutVersion && Number.isFinite(stored.flowsheetX) && Number.isFinite(stored.flowsheetY);
        const x = useStored ? stored.flowsheetX : auto.x;
        const y = useStored ? stored.flowsheetY : auto.y;
        return {
          id: raw.id,
          unitNumber: raw.unitNumber,
          task: raw.task,
          selectedUnit: raw.selectedUnit,
          category: raw.category,
          subcategory: raw.subcategory,
          specs: raw.specs,
          equipmentSizeLine: raw.equipmentSizeLine,
          tip: raw.tip,
          x,
          y,
          symbolCenterY: y + 62,
          stage,
          stageRow,
          concurrent: stageRow > 0 || flowsheetCanOverlap(raw.group),
          w: boxW,
          h: boxH,
          isService: stageRow > 0,
          ...flowsheetGroupStreams(raw.group)
        };
      });
      const byId = new Map(groups.map(item => [item.id, item]));
      const forwardLinks = [];
      const recycleLinks = [];
      const auxiliaryLinks = [];
      linkMeta.forEach(link => {
        if (!byId.has(link.from) || !byId.has(link.to)) return;
        if (link.kind === "recycle") recycleLinks.push(link);
        else if (link.kind === "process") forwardLinks.push(link);
        else auxiliaryLinks.push(link);
      });
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
      const productGroup = groups.find(group => group.outputStreams.some(stream => (
        stream.fate === "product" && /final output/i.test(String(stream.timing || ""))
      ))) || groups.find(group => group.outputStreams.some(stream => (
        stream.fate === "product" && /purified|at least/i.test(String(stream.note || ""))
      ))) || groups.find(group => group.isProduct) || groups[groups.length - 1];
      const productBox = productGroup ? {
        id: "product",
        x: productGroup.x + productGroup.w + 70,
        y: productGroup.y + 42,
        w: 190,
        h: 92
      } : null;
      const maxDiagramRight = Math.max(maxBoxRight, productBox ? productBox.x + productBox.w : 0);
      const width = Math.max(1880, maxDiagramRight + 120);
      const height = Math.max(660, recycleLaneCount ? recycleLaneBaseY + recycleLaneCount * 34 + 74 : maxBoxBottom + wasteAreaH + 118);
      return { groups, byId, forwardLinks, auxiliaryLinks, recycleLinks, feedBox, productBox, productGroupId: productGroup?.id || "", width, height, boxW, boxH, wasteAreaH, recycleLaneBaseY, maxOutputKg };
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

    function flowsheetAuxStyle(kind) {
      if (kind === "vent") return { color: "#657480", marker: "url(#fsArrowGrey)", dash: "4 4", label: "vent" };
      if (kind === "recovery") return { color: "#25834a", marker: "url(#fsArrowGreen)", dash: "6 4", label: "recovery" };
      return { color: "#965d00", marker: "url(#fsArrowOrange)", dash: "", label: "waste" };
    }

    function flowsheetAuxConnectorPoints(from, to, laneIndex) {
      const startFraction = 0.34 + (laneIndex % 3) * 0.16;
      const endFraction = 0.32 + (laneIndex % 3) * 0.18;
      const downward = to.y > from.y + from.h * 0.4;
      const start = downward
        ? { x: from.x + from.w * startFraction, y: from.y + from.h + 8 }
        : { x: from.x + from.w + 10, y: flowsheetBoxCenter(from).y };
      const end = downward
        ? { x: to.x + to.w * endFraction, y: to.y - 10 }
        : { x: to.x - 12, y: flowsheetBoxCenter(to).y };
      if (downward) {
        const preferredLane = to.y - 54 - laneIndex * 24;
        const minLane = from.y + from.h + 40 + laneIndex * 10;
        const laneY = Math.min(to.y - 34, Math.max(minLane, preferredLane));
        return compactRoute([start, { x: start.x, y: laneY }, { x: end.x, y: laneY }, end]);
      }
      const laneY = Math.max(from.y + from.h, to.y + to.h) + 70 + laneIndex * 28;
      return compactRoute([
        { x: from.x + from.w * startFraction, y: from.y + from.h + 8 },
        { x: from.x + from.w * startFraction, y: laneY },
        { x: to.x + to.w * endFraction, y: laneY },
        { x: to.x + to.w * endFraction, y: to.y + to.h + 10 }
      ]);
    }

    function flowsheetLinkStreamSummary(link) {
      const streams = link.directStreams || [];
      if (!streams.length) return "";
      const totalKg = streams.reduce((sum, stream) => {
        const kg = massToKg(stream.quantity, stream.unit);
        return sum + (Number.isFinite(kg) ? kg : 0);
      }, 0);
      const first = streams[0];
      const name = streams.length > 1 ? `${first.name} +${streams.length - 1}` : first.name;
      return `${name}${totalKg > 0 ? `, ${formatNumber(totalKg)} kg/batch` : ""}`;
    }

    function flowsheetAuxTooltip(from, to, link) {
      const streams = (link.directStreams || []).map(stream => {
        const qty = stream.quantity ? `${stream.quantity} ${stream.unit || ""}`.trim() : "?";
        return `- ${stream.name}: ${qty}`;
      });
      return [
        `${link.kind} ${from.id} -> ${to.id}`,
        streams.length ? "Routed substances:" : "No destination-tagged stream was found.",
        ...streams
      ].join("\n");
    }

    function flowsheetProductBasisText(model) {
      const productGroup = model.byId.get(model.productGroupId);
      const productStream = productGroup?.outputStreams?.find(stream => (
        stream.fate === "product" && /final output/i.test(String(stream.timing || ""))
      )) || productGroup?.outputStreams?.find(stream => stream.fate === "product");
      const productKg = productStream ? massToKg(productStream.quantity, productStream.unit) : NaN;
      const productName = productStream?.name || state.scaleBasis?.targetProduct || "product";
      const target = state.scaleBasis?.targetAmount && state.scaleBasis?.targetUnit
        ? `; scale target ${state.scaleBasis.targetAmount} ${state.scaleBasis.targetUnit}`
        : "";
      return Number.isFinite(productKg) && productKg > 0
        ? `Mass basis: ${formatNumber(productKg)} kg ${productName}/batch; line widths and stream labels use routed kg/batch${target}.`
        : `Mass basis: routed kg/batch where available${target}.`;
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

      const flowPathMarkup = (points, strokeWidth, tooltip, marker = "url(#fsArrow)", color = "#172027", dash = "", labelText = "") => {
        const d = orthogonalPath(points, 14);
        return `
          <path d="${d}" stroke="#ffffff" stroke-width="${strokeWidth + 5}" stroke-linejoin="round" stroke-linecap="round" fill="none"></path>
          <path class="tip" data-tip="${escapeAttr(tooltip)}" d="${d}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" fill="none" ${dash ? `stroke-dasharray="${dash}"` : ""} ${marker ? `marker-end="${marker}"` : ""}></path>
          ${flowsheetConnectorLabelMarkup(points, labelText, color)}
        `;
      };

      const renderedForward = new Set();
      const forwardLinkKey = (fromId, toId) => `${fromId}->${toId}`;
      const forwardLinkByKey = new Map(model.forwardLinks.map(link => [forwardLinkKey(link.from, link.to), link]));
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
          const link = forwardLinkByKey.get(forwardLinkKey(from.id, target.id));
          const branchKg = flowsheetMagnitudeForLink(from, target, link);
          forwardGroups.push(flowPathMarkup([{ x: manifoldX, y: point.y }, point], sankeyWidth(branchKg), flowsheetProcessTooltipForLink(from, target, link), "url(#fsArrow)", "#172027", "", flowsheetProcessLabelForLink(from, target, link)));
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
          const link = forwardLinkByKey.get(forwardLinkKey(source.id, to.id));
          const branchKg = flowsheetMagnitudeForLink(source, to, link);
          forwardGroups.push(flowPathMarkup([point, { x: manifoldX, y: point.y }], sankeyWidth(branchKg), flowsheetProcessTooltipForLink(source, to, link), "", "#172027", "", flowsheetProcessLabelForLink(source, to, link)));
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
        const magnitudeKg = flowsheetProcessMagnitudeKg(from, to);
        const strokeWidth = sankeyWidth(magnitudeKg);
        const tooltip = flowsheetProcessTooltip(from, to);
        forwardGroups.push(flowPathMarkup(points, strokeWidth, tooltip, "url(#fsArrow)", "#172027", "", flowsheetProcessLabelText(from, to)));
      });
      const forwardPaths = forwardGroups.join("");

      const showAuxiliaryArrows = state.flowsheetShowAuxiliaryArrows !== false;
      const auxLaneCounter = new Map();
      const auxiliaryPaths = (showAuxiliaryArrows ? model.auxiliaryLinks : []).map(link => {
        const from = model.byId.get(link.from);
        const to = model.byId.get(link.to);
        if (!from || !to) return "";
        const laneKey = `${Math.min(from.stageRow, to.stageRow)}:${Math.max(from.stageRow, to.stageRow)}:${link.kind}`;
        const laneIndex = auxLaneCounter.get(laneKey) || 0;
        auxLaneCounter.set(laneKey, laneIndex + 1);
        const style = flowsheetAuxStyle(link.kind);
        const points = flowsheetAuxConnectorPoints(from, to, laneIndex);
        const totalKg = (link.directStreams || []).reduce((sum, stream) => {
          const kg = massToKg(stream.quantity, stream.unit);
          return sum + (Number.isFinite(kg) ? kg : 0);
        }, 0);
        const strokeWidth = Math.max(1.8, Math.min(3.2, totalKg > 0 && model.maxOutputKg > 0 ? (totalKg / model.maxOutputKg) * 2.2 + 1.5 : 2));
        return flowPathMarkup(
          points,
          strokeWidth,
          flowsheetAuxTooltip(from, to, link),
          style.marker,
          style.color,
          style.dash,
          `${style.label}: ${flowsheetLinkStreamSummary(link)}`
        );
      }).join("");

      let recycleIndex = 0;
      const recyclePaths = (showAuxiliaryArrows ? model.recycleLinks : []).map(link => {
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
        const recycleStreams = (link.directStreams || []).length ? link.directStreams : from.recycleStreams;
        const recycleKg = recycleStreams.reduce((sum, s) => {
          const kg = massToKg(s.quantity, s.unit);
          return sum + (Number.isFinite(kg) ? kg : 0);
        }, 0);
        const strokeWidth = Math.max(2, sankeyWidth(recycleKg) * 0.75);
        const recycleTooltip = [
          `recycle ${link.from} -> ${link.to}`,
          recycleStreams.length
            ? recycleStreams.map(s => `- ${s.name}: ${s.quantity || "?"} ${s.unit || ""}`.trim()).join("\n")
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
          const compact = flowsheetCompactStreamLabel(stream, 24);
          return `
            <rect x="${box.x + 10}" y="${rowY - 14}" width="${box.w - 20}" height="23" rx="11.5" fill="#fff" stroke="#25834a" stroke-width="1.2"></rect>
            <text x="${box.x + box.w / 2}" y="${rowY + 1}" font-size="10.5" font-weight="650" fill="#172027" text-anchor="middle"><title>${escapeHtml(label)}</title>${escapeHtml(compact || "feed")}</text>
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
        const last = model.byId.get(model.productGroupId) || model.groups.find(group => group.isProduct) || model.groups[model.groups.length - 1];
        const start = flowsheetPort(last, box, 10);
        const end = flowsheetPort(box, last, 14);
        const midX = (start.x + end.x) / 2;
        const d = orthogonalPath([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end], 12);
        const targetProduct = String(state.scaleBasis?.targetProduct || "").trim().toLowerCase();
        const productStreams = last.outputStreams.filter(stream => stream.fate === "product"
          || /product/i.test(stream.name)
          || (targetProduct && String(stream.name || "").toLowerCase().includes(targetProduct))).slice(0, 2);
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

      const firstGroupId = model.groups[0]?.id;
      const boxes = model.groups.map(box => {
        const style = flowsheetCategoryStyle[box.category];
        const center = flowsheetBoxCenter(box);
        const allLocalWasteVentStreams = [
          ...box.wasteStreams.map(s => ({ ...s, kind: "waste" })),
          ...box.ventStreams.map(s => ({ ...s, kind: "vent" }))
        ].filter(stream => !String(stream.destinationGroup || "").trim());
        const localWasteVentStreams = allLocalWasteVentStreams.slice(0, 2);
        const hiddenLocalStreamCount = Math.max(0, allLocalWasteVentStreams.length - localWasteVentStreams.length);
        const wasteVentHtml = (showAuxiliaryArrows ? localWasteVentStreams : [])
          .map((stream, i) => {
            const color = stream.kind === "waste" ? { line: "#965d00", marker: "url(#fsArrowOrange)" } : { line: "#657480", marker: "url(#fsArrowGrey)" };
            const leftSide = i % 2 === 1;
            const stubX = box.x + box.w * (leftSide ? 0.24 : 0.76);
            const stubY = box.y + box.h + 62 + Math.floor(i / 2) * 42;
            const labelX = stubX + (leftSide ? -18 : 18);
            const labelAnchor = leftSide ? "end" : "start";
            const label = `${stream.kind}: ${stream.name}`;
            const compact = `${stream.kind}: ${flowsheetClipText(stream.name, 20, 8) || "outlet"}`;
            return `
              <path d="M ${stubX} ${box.y + box.h} L ${stubX} ${stubY}" stroke="${color.line}" stroke-width="2" stroke-dasharray="${stream.kind === "vent" ? "4 4" : "none"}" fill="none" marker-end="${color.marker}"></path>
              <text x="${labelX}" y="${stubY + 4}" font-size="8.8" font-weight="700" fill="${color.line}" text-anchor="${labelAnchor}"><title>${escapeHtml(label)}</title>${escapeHtml(compact)}</text>
            `;
          }).join("") + (showAuxiliaryArrows && hiddenLocalStreamCount ? `<text x="${box.x + box.w / 2}" y="${box.y + box.h + 112}" font-size="8.8" font-weight="800" fill="#657480" text-anchor="middle">+${hiddenLocalStreamCount} local outlet${hiddenLocalStreamCount === 1 ? "" : "s"} in tooltip</text>` : "");
        // G1 already gets a dedicated feed box/arrows (feedBoxMarkup below) for its inputs. Every
        // other unit's fresh reagent/utility charges (e.g. cooling water into a mid-train exchanger)
        // previously had no arrow anywhere on the diagram, even though they exist in the MFA data -
        // draw a small labeled inlet stub for those. Restricted to the top row (stageRow 0) since
        // that's the only row with guaranteed free space above the box to route into.
        const extraInlets = showAuxiliaryArrows && box.id !== firstGroupId && box.stageRow === 0
          ? flowsheetExternalInputStreams(box, model.groups).slice(0, 2)
          : [];
        const inletHtml = extraInlets.map((stream, i) => {
          const stubX = box.x + box.w * (extraInlets.length > 1 ? 0.26 + i * 0.48 : 0.5);
          const stubYStart = box.y - 46;
          const label = `in: ${stream.name}${stream.quantity ? ` ${stream.quantity} ${stream.unit || ""}` : ""}`.trim();
          const compact = `in: ${flowsheetCompactStreamLabel(stream, 17, false) || "feed"}`;
          return `
            <path d="M ${stubX} ${stubYStart} L ${stubX} ${box.y}" stroke="#657480" stroke-width="1.6" fill="none" marker-end="url(#fsArrowGrey)"></path>
            <text x="${stubX}" y="${stubYStart - 4}" font-size="9.3" fill="#657480" text-anchor="middle"><title>${escapeHtml(label)}</title>${escapeHtml(compact)}</text>
          `;
        }).join("");
        const strokeColor = box.isProduct ? "#286d3f" : style.stroke;
        const mainOutgoing = model.forwardLinks.find(link => link.from === box.id);
        const mainTarget = mainOutgoing ? model.byId.get(mainOutgoing.to) : null;
        const mainLoadKg = mainTarget ? flowsheetProcessMagnitudeKg(box, mainTarget) : 0;
        const footerLine = [
          mainLoadKg > 0 ? `${formatNumber(mainLoadKg)} kg/batch main route` : "",
          (box.specs || [])[0] || ""
        ].filter(Boolean).join(" - ");
        const dragTip = `${box.tip}\n\nDrag to move. Double-click to edit the unit description.`;
        const symbolY = box.y + 10;
        const showUnitDetails = state.flowsheetShowUnitDetails === true;
        const symbolH = showUnitDetails ? 108 : 118;
        const tagY = box.y + (showUnitDetails ? 132 : 142);
        const tagHeight = box.h - symbolH - (showUnitDetails ? 14 : 18);
        const unitLines = wrapSvgText(box.selectedUnit, showUnitDetails ? 24 : 28);
        const taskLine = flowsheetClipText(box.task, 38, 12);
        const selected = state.selectedFlowsheetGroupId === box.id;
        return `
          <g class="flowsheet-unit ${selected ? "selected" : ""}" data-flowsheet-group="${escapeAttr(box.id)}">
            ${box.concurrent ? `<rect x="${box.x - 24}" y="${box.y - 24}" width="${box.w + 20}" height="${box.h + 20}" rx="7" fill="#eef2f4" stroke="#9aa7b0" stroke-width="1" opacity="0.55"></rect>` : ""}
            ${selected ? `<rect x="${box.x - 16}" y="${box.y - 16}" width="${box.w + 32}" height="${box.h + 32}" rx="8" fill="none" stroke="#1671c2" stroke-width="3" opacity="0.82"></rect>` : ""}
            <rect x="${box.x - 10}" y="${box.y - 10}" width="${box.w + 20}" height="${box.h + 20}" rx="6" fill="#ffffff" stroke="#d6e0e5" stroke-width="1" opacity="0.86"></rect>
            <rect x="${box.x - 10}" y="${box.y - 10}" width="4" height="${box.h + 20}" rx="2" fill="${strokeColor}"></rect>
            ${flowsheetShapeMarkup(box.subcategory, box.x, symbolY, box.w, symbolH, strokeColor)}
            <rect x="${box.x + 16}" y="${tagY - 12}" width="${box.w - 32}" height="${tagHeight}" rx="3" fill="${style.fill}" stroke="${strokeColor}" stroke-width="0.8" opacity="0.9"></rect>
            <text x="${box.x + box.w / 2}" y="${tagY}" font-size="12" font-weight="900" text-anchor="middle" fill="${strokeColor}">U${box.unitNumber} ${escapeHtml(box.id)}</text>
            <text x="${box.x + box.w / 2}" y="${tagY + 17}" font-size="11.5" font-weight="800" text-anchor="middle" fill="#172027">
              ${unitLines.slice(0, showUnitDetails ? 1 : 2).map((line, i) => `<tspan x="${box.x + box.w / 2}" dy="${i === 0 ? 0 : 13}">${escapeHtml(line)}</tspan>`).join("")}
            </text>
            ${flowsheetUnitDetailsMarkup(box, box.x + 24, tagY + 37, box.w - 48)}
            ${!showUnitDetails && footerLine ? `<text x="${box.x + box.w / 2}" y="${box.y + box.h + 18}" font-size="10.5" font-weight="700" text-anchor="middle" fill="${style.stroke}"><title>${escapeHtml(footerLine)}</title>${escapeHtml(flowsheetClipText(footerLine, 46, 12))}</text>` : ""}
            <text x="${box.x + box.w / 2}" y="${box.y + box.h + (showUnitDetails ? 18 : 34)}" font-size="10.2" text-anchor="middle" fill="#657480"><title>${escapeHtml(box.task)}</title>${escapeHtml(taskLine)}</text>
            ${box.concurrent ? `<text x="${box.x + box.w - 8}" y="${box.y + 6}" font-size="9.5" font-weight="800" text-anchor="end" fill="#6c7680">concurrent</text>` : ""}
            ${box.isProduct ? `<text x="${box.x + box.w / 2}" y="${box.y + box.h + (showUnitDetails ? 34 : 50)}" font-size="11" font-weight="700" text-anchor="middle" fill="#286d3f">final product</text>` : ""}
            ${wasteVentHtml}
            ${inletHtml}
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
          <text x="36" y="68" font-size="11" fill="#657480">Draft PFD generated from declared task links. Main train is black; service/recovery/waste loops are routed on separate lanes.</text>
          <text x="36" y="88" font-size="11" font-weight="700" fill="#40515d">${escapeHtml(flowsheetProductBasisText(model))}</text>
          ${feedBoxMarkup}
          ${forwardPaths}
          ${auxiliaryPaths}
          ${recyclePaths}
          ${boxes}
          ${productMarkup}
          <g transform="translate(36, ${drawingHeight - 70})">
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
      return {
        svg,
        empty: false,
        width: model.width,
        height: drawingHeight,
        groupCount: model.groups.length,
        forwardLinkCount: model.forwardLinks.length,
        recycleLinkCount: model.recycleLinks.length
      };
    }
