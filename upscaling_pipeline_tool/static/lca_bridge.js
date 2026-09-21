    // LCI/openLCA bridge model. The workbook/export layer calls buildLcaBridge()
    // from export.js; keep the model generation here so app.js can stay focused
    // on the interactive workbench UI.

    function buildLcaBridge(blocks, groups, scale, recycle, energyBridge) {
      const entries = lcaStreamEntries(blocks, groups);
      const product = lcaReferenceProduct(entries, scale);
      const foregroundProcesses = groups.map(group => lcaForegroundProcess(group, entries));
      const externalInputs = entries.filter(entry => entry.lcaRole === "technosphere_input").map(lcaExchange);
      const internalFlows = entries.filter(entry => entry.lcaRole.startsWith("internal_") || entry.lcaRole === "foreground_intermediate").map(lcaExchange);
      const emissions = entries.filter(entry => entry.lcaRole === "emission_to_air" || entry.lcaRole === "emission_unclassified").map(lcaExchange);
      const wasteTreatments = entries.filter(entry => entry.lcaRole === "wastewater_treatment" || entry.lcaRole === "solid_waste_treatment" || entry.lcaRole === "purge_treatment" || entry.lcaRole === "waste_treatment_unclassified").map(lcaExchange);
      const mappingCandidates = lcaMappingCandidates([...externalInputs, ...emissions, ...wasteTreatments]);
      const issues = lcaBridgeIssues(product, entries, mappingCandidates, energyBridge);
      return {
        schemaVersion: "lca-bridge-v0.1",
        status: "draft_mapping_only",
        purpose: "Intermediate export for building a foreground LCA model. This is not openLCA JSON-LD yet.",
        openLcaCompatibility: {
          directImport: false,
          reason: "openLCA needs its own JSON-LD/IPC objects with database UUIDs, flow types, units, providers, and locations.",
          nextStep: "Use mappingCandidates to choose openLCA/ecoinvent flows, then generate openLCA JSON-LD or push through openLCA IPC."
        },
        namePolicy: {
          rawNamePreserved: true,
          canonicalNameIsSuggestion: true,
          internalMixturesAreNotMappedToEcoinvent: true,
          finalMappingRequiresManualDatasetChoice: true
        },
        referenceProduct: product,
        foregroundProcesses,
        externalInputs,
        internalFlows,
        emissions,
        wasteTreatments,
        utilityPlaceholders: lcaUtilityPlaceholders(energyBridge),
        recycleSummary: recycle,
        mappingCandidates,
        readiness: {
          canStartOpenLcaMapping: Boolean(product && mappingCandidates.length),
          issueCount: issues.length,
          issues
        }
      };
    }

    function lcaStreamEntries(blocks, groups) {
      const groupById = new Map(groups.map(group => [group.groupId, group]));
      const producedKeys = new Set();
      blocks.forEach(block => {
        (block.streams || [])
          .filter(stream => stream.role === "output" && stream.name)
          .forEach(stream => producedKeys.add(lcaNameKey(stream.name)));
      });
      return blocks.flatMap(block => (block.streams || []).filter(stream => stream.name).map(stream => {
        const group = groupById.get(block.groupId) || {};
        const nameInfo = lcaCanonicalName(stream.name);
        const amount = lcaAmount(stream);
        const entry = {
          id: `${block.id}:${stream.id}`,
          blockId: block.id,
          groupId: block.groupId || "",
          processName: block.groupId ? `${block.groupId} - ${group.task || "unassigned task"}` : `${block.id} - draft block`,
          task: group.task || "",
          selectedUnit: group.selectedUnit || "",
          streamId: stream.id,
          streamRole: stream.role,
          rawName: stream.name,
          canonicalName: nameInfo.name,
          canonicalSource: nameInfo.source,
          amount,
          phase: stream.phase,
          phaseLabel: stream.phaseLabel,
          fate: stream.fate,
          destinationGroup: stream.destinationGroup || "",
          status: stream.status,
          uncertaintyPercent: typeof streamUncertaintyPercent === "function" ? streamUncertaintyPercent(stream.status) : NaN,
          note: stream.note || "",
          source: stream.source || "",
          lcaRole: lcaRoleForStream(stream, producedKeys)
        };
        return {
          ...entry,
          openLcaHint: lcaOpenLcaHint(entry),
          candidateQueries: lcaCandidateQueries(entry)
        };
      }));
    }

    function lcaNameKey(name) {
      return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    function lcaCanonicalName(name) {
      const raw = lcaNameKey(name);
      // Generic flow classes are recognised by wording; named substances come from what the
      // project itself declared (PubChem CID, molar mass or a reaction role), so "recovered
      // cyclohexane" and "cyclohexane" share one inventory flow in any protocol, not only in the
      // two example cases whose substance names used to be listed here.
      const rules = [
        [/molecular sieves|sieve 4a|sieves 4a/, "molecular sieve, zeolite 4A"],
        [/wastewater|aqueous waste|treated effluent/, "wastewater"],
        [/uncaptured voc|\bvoc\b/, "volatile organic compounds"],
        [/heavy residue|column bottoms|heavies|organic residue/, "organic residues"],
        [/wash water|water of condensation|\bwater\b/, "water"]
      ];
      const match = rules.find(([pattern]) => pattern.test(raw));
      if (match) return { name: match[1], source: "rule" };
      const vocabulary = typeof projectSubstanceVocabulary === "function" ? projectSubstanceVocabulary() : [];
      const declared = vocabulary.find(name => substanceNamePattern(name).test(raw));
      if (declared) return { name: declared, source: "declared_substance" };
      const cleaned = raw
        .replace(/\b(crude|purified|recovered|residual|charged|product-rich|rich|liquid|vapor|condensate|mixture|phase|stream)\b/g, " ")
        .replace(/\b(to vent|loss|purge|waste|final output|in-process intermediate)\b/g, " ")
        .replace(/[()/,-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { name: cleaned || String(name || "").trim(), source: cleaned && cleaned !== raw ? "cleaned_name" : "raw_name" };
    }

    function lcaAmount(stream) {
      const numeric = parseStreamQuantity(stream.quantity);
      const kg = massToKg(stream.quantity, stream.unit);
      return {
        value: Number.isFinite(numeric) ? numeric : null,
        unit: stream.unit || "",
        kg: Number.isFinite(kg) ? kg : null,
        basis: String(stream.unit || "").includes("/kg product") ? "per kg product" : "as entered",
        status: Number.isFinite(numeric) ? (Number.isFinite(kg) ? "mass_kg_convertible" : "numeric_non_mass_or_relative") : "missing_or_non_numeric"
      };
    }

    function lcaRoleForStream(stream, producedKeys) {
      const fate = String(stream.fate || "").toLowerCase();
      let role = stream.role;
      const producedInternally = producedKeys.has(lcaNameKey(stream.name));
      if (role === "input") {
        if (["recycled input", "recovered solvent"].includes(fate)) return "internal_recycle_input";
        if (fate === "intermediate" || producedInternally) return "internal_input";
        return "technosphere_input";
      }
      // A waste fate decides before the role does: an output row that leaves as vent, wastewater,
      // solid waste or purge is a discharge, the same way the flowsheet draws it.
      if (role === "output" && ["vent", "wastewater", "solid waste", "purge", "loss"].includes(fate)) role = "waste";
      if (role === "output") {
        if (fate === "product") return "reference_product";
        if (["recovered solvent", "recycled input", "recover", "recycle"].includes(fate)) return "internal_recycle_output";
        if (fate === "intermediate") return "foreground_intermediate";
        return "foreground_output_unclassified";
      }
      if (fate === "vent") return "emission_to_air";
      if (fate === "wastewater") return "wastewater_treatment";
      if (fate === "solid waste") return "solid_waste_treatment";
      if (fate === "purge" || fate === "loss") return "purge_treatment";
      return role === "waste" ? "waste_treatment_unclassified" : "unclassified";
    }

    function lcaOpenLcaHint(entry) {
      if (entry.lcaRole === "emission_to_air" || entry.lcaRole === "emission_unclassified") {
        return { flowType: "ELEMENTARY_FLOW", compartment: "air", providerNeeded: false };
      }
      if (entry.lcaRole.includes("waste") || entry.lcaRole.includes("treatment") || entry.lcaRole === "purge_treatment") {
        return { flowType: "WASTE_FLOW", providerNeeded: true };
      }
      return { flowType: "PRODUCT_FLOW", providerNeeded: entry.lcaRole === "technosphere_input" };
    }

    function lcaCandidateQueries(entry) {
      const name = entry.canonicalName || entry.rawName;
      if (entry.lcaRole === "technosphere_input") {
        return [`market for ${name}`, `${name} production`, name];
      }
      if (entry.lcaRole === "wastewater_treatment") {
        return ["treatment of wastewater, average", "wastewater treatment"];
      }
      if (entry.lcaRole === "solid_waste_treatment") {
        return [`treatment of spent ${name}`, `treatment of ${name}`];
      }
      if (entry.lcaRole === "purge_treatment" || entry.lcaRole === "waste_treatment_unclassified") {
        return [`treatment of ${name}`, `market for waste ${name}`];
      }
      if (entry.lcaRole === "emission_to_air") {
        return [`${name}, emission to air`, name];
      }
      return [];
    }

    function lcaExchange(entry) {
      return {
        id: entry.id,
        groupId: entry.groupId,
        blockId: entry.blockId,
        processName: entry.processName,
        rawName: entry.rawName,
        canonicalName: entry.canonicalName,
        canonicalSource: entry.canonicalSource,
        amount: entry.amount,
        phase: entry.phase,
        fate: entry.fate,
        lcaRole: entry.lcaRole,
        openLcaHint: entry.openLcaHint,
        candidateQueries: entry.candidateQueries,
        destinationGroup: entry.destinationGroup,
        status: entry.status,
        uncertaintyPercent: Number.isFinite(entry.uncertaintyPercent) ? entry.uncertaintyPercent : null,
        note: entry.note
      };
    }

    function lcaForegroundProcess(group, entries) {
      const processEntries = entries.filter(entry => entry.groupId === group.groupId);
      return {
        processId: group.groupId,
        processName: `${group.groupId} - ${group.task || "unassigned task"}`,
        task: group.task,
        selectedUnit: group.selectedUnit || "",
        blocks: group.blocks,
        phenomena: group.phenomena,
        openLcaType: "foreground_process",
        exchanges: processEntries.map(lcaExchange)
      };
    }

    function lcaReferenceProduct(entries, scale) {
      const products = entries.filter(entry => entry.lcaRole === "reference_product");
      const preferred = products.find(entry => lcaNameKey(entry.rawName) === lcaNameKey(scale?.basis?.targetProduct)) || products[products.length - 1] || null;
      if (!preferred) return null;
      return {
        rawName: preferred.rawName,
        canonicalName: preferred.canonicalName,
        amount: preferred.amount,
        groupId: preferred.groupId,
        blockId: preferred.blockId,
        targetProductFromScaleBasis: scale?.basis?.targetProduct || "",
        openLcaHint: { flowType: "PRODUCT_FLOW", providerNeeded: false }
      };
    }

    function lcaMappingCandidates(exchanges) {
      const byKey = new Map();
      exchanges.forEach(exchange => {
        const key = `${exchange.lcaRole}||${exchange.canonicalName}`;
        if (!byKey.has(key)) {
          byKey.set(key, {
            canonicalName: exchange.canonicalName,
            lcaRole: exchange.lcaRole,
            openLcaHint: exchange.openLcaHint,
            candidateQueries: exchange.candidateQueries,
            occurrences: []
          });
        }
        byKey.get(key).occurrences.push({
          groupId: exchange.groupId,
          blockId: exchange.blockId,
          rawName: exchange.rawName,
          amount: exchange.amount
        });
      });
      return Array.from(byKey.values()).map(candidate => ({
        ...candidate,
        mappingStatus: "unmapped",
        selectedOpenLcaFlowId: "",
        selectedProviderId: "",
        selectedLocation: ""
      }));
    }

    function lcaUtilityPlaceholders(energyBridge) {
      return (energyBridge || []).map(event => ({
        groupId: event.groupId,
        task: event.task,
        eventType: event.eventType,
        dataStatus: event.dataStatus,
        massBasis: event.massBasis,
        missing: event.missing,
        lcaRole: "utility_placeholder",
        mappingStatus: "needs utility calculation and provider mapping",
        candidateQueries: lcaUtilityQueries(event.eventType)
      }));
    }

    function lcaUtilityQueries(eventType) {
      if (/cooling|condensation/i.test(eventType)) return ["market for cooling water", "cooling energy"];
      if (/heating|evaporation|drying/i.test(eventType)) return ["market for heat, district or industrial", "steam production", "natural gas burned in industrial furnace"];
      if (/mixing|vacuum|pressure/i.test(eventType)) return ["market for electricity, medium voltage", "electricity supply"];
      return ["market for electricity, medium voltage"];
    }

    function lcaBridgeIssues(product, entries, mappingCandidates, energyBridge) {
      const issues = [];
      if (!product) issues.push("No reference product stream with fate 'product' was found.");
      const missingAmounts = entries.filter(entry => ["technosphere_input", "reference_product", "emission_to_air", "wastewater_treatment", "solid_waste_treatment", "purge_treatment"].includes(entry.lcaRole) && entry.amount.status === "missing_or_non_numeric");
      if (missingAmounts.length) issues.push(`${missingAmounts.length} LCA-relevant stream(s) have missing or non-numeric amounts.`);
      const nonMass = entries.filter(entry => ["technosphere_input", "reference_product", "emission_to_air", "wastewater_treatment", "solid_waste_treatment", "purge_treatment"].includes(entry.lcaRole) && entry.amount.value !== null && entry.amount.kg === null);
      if (nonMass.length) issues.push(`${nonMass.length} LCA-relevant stream(s) are not directly convertible to kg.`);
      if (mappingCandidates.length) issues.push(`${mappingCandidates.length} external/waste/emission mapping candidate(s) still need openLCA/ecoinvent dataset choices.`);
      const energyMissing = (energyBridge || []).filter(event => event.missing?.length);
      if (energyMissing.length) issues.push(`${energyMissing.length} energy/utility placeholder(s) need duty calculation before LCA inventory export.`);
      return issues;
    }
