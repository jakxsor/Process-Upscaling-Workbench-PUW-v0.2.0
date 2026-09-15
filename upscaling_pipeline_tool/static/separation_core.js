(function (root) {
  "use strict";

  const substanceRoles = ["unknown", "reactant", "product", "coproduct", "byproduct", "solvent", "catalyst", "impurity", "auxiliary"];
  const substanceFates = ["unknown", "recover", "product", "waste", "recycle", "vent", "intermediate", "keep with mixture"];
  const binaryInsightOptions = ["unknown", "no", "yes"];
  const thermalOptions = ["unknown", "low", "medium", "high"];
  const purePropertyDefs = [
    { id: "mw", label: "MW", unit: "g/mol", thresholdLabel: "MW ratio" },
    { id: "tb", label: "Tb", unit: "K", thresholdLabel: "Tb ratio" },
    { id: "tm", label: "Tm", unit: "K", thresholdLabel: "Tm ratio" },
    { id: "pvap", label: "Pvap", unit: "Pa", thresholdLabel: "Pvap ratio" },
    { id: "solubilityParameter", label: "Sol. parameter", unit: "", thresholdLabel: "solubility parameter ratio" },
    { id: "molarVolume", label: "Molar volume", unit: "m3/kmol", thresholdLabel: "molar volume ratio" },
    { id: "molecularDiameter", label: "Mol. diameter", unit: "nm", thresholdLabel: "molecular diameter ratio" },
    { id: "vdwVolume", label: "VdW volume", unit: "", thresholdLabel: "Van der Waals volume ratio" },
    { id: "criticalTemp", label: "Critical T", unit: "K", thresholdLabel: "critical-temperature ratio" }
  ];

  function numberFromText(value) {
    const match = String(value ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
  }

  function formatRatio(value) {
    return Number.isFinite(value) ? formatNumber(value) : "missing";
  }

  function massToKg(value, unit) {
    const number = numberFromText(value);
    if (!Number.isFinite(number)) return NaN;
    if (unit === "kg") return number;
    if (unit === "g") return number / 1000;
    if (unit === "t") return number * 1000;
    return NaN;
  }

  const kbRules = [
    {
      id: "KB3.1-VL-BP-PVAP",
      label: "Volatility difference",
      source: "A1.1 + KB3.1/Table S.10",
      test: data => data.ratios.tb >= 1.23 || data.ratios.pvap >= 10,
      evidence: data => [
        data.ratios.tb >= 1.23 ? `Tb ratio ${formatRatio(data.ratios.tb)} >= 1.23` : "",
        data.ratios.pvap >= 10 ? `Pvap ratio ${formatRatio(data.ratios.pvap)} >= 10` : ""
      ].filter(Boolean),
      pbb: ["PT(VL)", "PS(VL)"],
      units: ["Flash vaporization", "Evaporation", "Distillation", "Partial condensation / vaporization"],
      level: "matched",
      note: "A vapor-liquid split is plausible when volatility contrast is large enough."
    },
    {
      id: "KB3.1-AZEO",
      label: "Azeotrope present",
      source: "S2.2 mixture analysis + KB3.1/Table S.10",
      test: data => data.insights.azeotrope === "yes",
      evidence: () => ["binary azeotrope = yes"],
      pbb: ["2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(C)", "ES(H)", "PC(LL)", "PS(LL)"],
      units: ["Azeotropic distillation", "Extractive distillation", "Membrane pervaporation", "Liquid-liquid extraction"],
      level: "matched",
      note: "Azeotropes weaken simple distillation and justify intensified or agent-assisted alternatives."
    },
    {
      id: "KB3.1-PRESSURE-SENSITIVE-AZEO",
      label: "Pressure-sensitive azeotrope",
      source: "S2.2 mixture analysis + KB3.1/Table S.10",
      test: data => data.insights.azeotrope === "yes" && data.insights.pressureSensitive === "yes",
      evidence: () => ["azeotrope = yes", "pressure sensitive = yes"],
      pbb: ["2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(D)", "ES(C)", "ES(H)"],
      units: ["Pressure-swing distillation", "Azeotropic distillation", "Membrane-reactive distillation"],
      level: "matched",
      note: "Pressure sensitivity opens a pressure-swing or intensified V-L route."
    },
    {
      id: "KB3.1-LL-GAP",
      label: "Liquid-liquid split",
      source: "S2.2 mixture analysis + KB3.1/Table S.10",
      test: data => data.insights.miscibilityGap === "yes",
      evidence: () => ["miscibility gap = yes"],
      pbb: ["PC(LL)", "PT(LL)", "PS(LL)"],
      units: ["Decanter", "Liquid-liquid extraction"],
      level: "matched",
      note: "A liquid-liquid phase split can support decanting or extraction."
    },
    {
      id: "KB3.1-LS-MELTING",
      label: "Melting point difference",
      source: "A1.1 + KB3.1/Table S.10",
      test: data => data.ratios.tm >= 1.20 || data.insights.eutectic === "yes",
      evidence: data => [
        data.ratios.tm >= 1.20 ? `Tm ratio ${formatRatio(data.ratios.tm)} >= 1.20` : "",
        data.insights.eutectic === "yes" ? "eutectic = yes" : ""
      ].filter(Boolean),
      pbb: ["PT(LS)", "PS(LS)", "ES(C/H)"],
      units: ["Crystallization", "Melt crystallization"],
      level: "partial",
      note: "A solid-liquid route becomes plausible when melting/eutectic behavior creates a separable solid phase."
    },
    {
      id: "KB3.1-LS-SIZE",
      label: "Liquid-solid molecular-size contrast",
      source: "paper-derived: A1.1 + KB3.1/Table S.10",
      test: data => data.ratios.molecularDiameter >= 2 && data.ratios.mw >= 1.90,
      evidence: data => [
        `molecular diameter ratio ${formatRatio(data.ratios.molecularDiameter)} >= 2.00`,
        `MW ratio ${formatRatio(data.ratios.mw)} >= 1.90`
      ],
      pbb: ["PC(LS)", "PS(LS)"],
      units: ["Membrane crystallization"],
      level: "partial",
      note: "The Table S.10 liquid-solid size criteria are kept separate from vapor and liquid membrane criteria."
    },
    {
      id: "KB3.1-MEMBRANE-VAPOR",
      label: "Vapor membrane size contrast",
      source: "paper-derived: A1.1 + KB3.1/Table S.10",
      test: data => data.ratios.vdwVolume >= 1.07 && data.ratios.criticalTemp >= 1.10,
      evidence: data => [
        `VdW volume ratio ${formatRatio(data.ratios.vdwVolume)} >= 1.07`,
        `critical-temperature ratio ${formatRatio(data.ratios.criticalTemp)} >= 1.10`
      ],
      pbb: ["PT(MVV)", "PS(VV)"],
      units: ["Membrane vapor permeation"],
      level: "partial",
      note: "Vapor membrane screening requires both size and critical-temperature evidence."
    },
    {
      id: "KB3.1-MEMBRANE-LIQUID",
      label: "Liquid membrane affinity contrast",
      source: "paper-derived: A1.1 + KB3.1/Table S.10",
      test: data => data.ratios.molarVolume >= 1.02 && data.ratios.solubilityParameter >= 1.00,
      evidence: data => [
        `molar volume ratio ${formatRatio(data.ratios.molarVolume)} >= 1.02`,
        `solubility parameter ratio ${formatRatio(data.ratios.solubilityParameter)} >= 1.00`
      ],
      pbb: ["PT(MVL)", "PS(VL)"],
      units: ["Membrane pervaporation"],
      level: "partial",
      note: "Liquid membrane screening requires both molar-volume and affinity evidence."
    },
    {
      id: "SCREEN-RVOL-LOW",
      label: "Simple distillation weak",
      source: "KB3.1/Table S.10 screening interpretation",
      test: data => numberFromText(data.insights.relativeVolatility) > 0 && numberFromText(data.insights.relativeVolatility) <= 1.05,
      evidence: data => [`relative volatility ${formatRatio(numberFromText(data.insights.relativeVolatility))} <= 1.05`],
      pbb: ["PT(MVV)", "PT(MVL)", "PT(MLL)", "PS(VV)", "PS(VL)", "PS(LL)"],
      units: ["Extractive distillation", "Azeotropic distillation", "Membrane pervaporation", "Liquid-liquid extraction"],
      level: "partial",
      note: "Low relative volatility means simple distillation should be treated as weak unless another driver is present."
    },
    {
      id: "SCREEN-THERMAL-SENSITIVE",
      label: "Thermal sensitivity constraint",
      source: "local extension: KB3.1-informed scale-up screening",
      test: data => data.components.some(component => component.thermalSensitivity === "high") && (data.ratios.tb >= 1.23 || data.ratios.pvap >= 10),
      evidence: data => [`high thermal sensitivity: ${data.components.filter(component => component.thermalSensitivity === "high").map(component => component.name).join(", ")}`],
      pbb: ["PT(VL)", "PS(VL)", "ES(H)"],
      units: ["Thin-film evaporation", "Wiped-film evaporation", "Short-path distillation", "Vacuum distillation"],
      level: "partial",
      note: "V-L separation may still be plausible, but residence time and pressure should be constrained."
    }
  ];

  const kb32UnitOperationRules = [
    { id: "KB3.2-PARTIAL-VAP", ruleIds: ["KB3.1-VL-BP-PVAP"], name: "Partial condensation / vaporization", source: "paper-derived: KB3.2/Table S.11", feedPhase: "V and/or L", pbb: ["PT(VL)", "PS(VL)"], outletPhase: "V or L", agentAdded: "ESA", outlets: 1 },
    { id: "KB3.2-FLASH", ruleIds: ["KB3.1-VL-BP-PVAP"], name: "Flash vaporization", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["PT(VL)", "PS(VL)"], outletPhase: "V", agentAdded: "pressure reduction", outlets: 2 },
    { id: "KB3.2-EVAP", ruleIds: ["KB3.1-VL-BP-PVAP", "SCREEN-THERMAL-SENSITIVE"], name: "Evaporation", source: "paper-derived with local thermal extension", feedPhase: "L", pbb: ["M", "PT(VL)", "PS(VL)", "ES(H)"], outletPhase: "V", agentAdded: "ESA", outlets: 1 },
    { id: "KB3.2-DISTILL", ruleIds: ["KB3.1-VL-BP-PVAP"], name: "Distillation", source: "paper-derived: KB3.2/Table S.11", feedPhase: "V and/or L", pbb: ["M", "2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(C)", "ES(H)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-AZEO", ruleIds: ["KB3.1-AZEO", "SCREEN-RVOL-LOW"], name: "Azeotropic distillation", source: "paper-derived: KB3.2/Table S.11", feedPhase: "V and/or L", pbb: ["M", "PC(VL)", "PT(VL)", "PS(VL)", "PC(LL)", "PS(LL)", "ES(C)", "ES(H)"], outletPhase: "V and L", agentAdded: "MSA + ESA", outlets: 2 },
    { id: "KB3.2-EXTRACTIVE", ruleIds: ["KB3.1-AZEO", "SCREEN-RVOL-LOW"], name: "Extractive distillation", source: "paper-derived: KB3.2/Table S.11", feedPhase: "V and/or L", pbb: ["M", "2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(C)", "ES(H)"], outletPhase: "V and L", agentAdded: "MSA + ESA", outlets: 2 },
    { id: "KB3.2-PRESSURE-SWING", ruleIds: ["KB3.1-PRESSURE-SENSITIVE-AZEO"], name: "Pressure-swing distillation", source: "paper-derived: KB3.2/Table S.11", feedPhase: "V and/or L", pbb: ["2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(D)", "ES(C)", "ES(H)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-LLE", ruleIds: ["KB3.1-LL-GAP", "KB3.1-AZEO", "SCREEN-RVOL-LOW"], name: "Liquid-liquid extraction", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["M", "PC(LL)", "PT(LL)", "PS(LL)"], outletPhase: "L", agentAdded: "MSA", outlets: 2 },
    { id: "KB3.2-DECANTER", ruleIds: ["KB3.1-LL-GAP"], name: "Decanter", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["M", "PC(LL)", "PS(LL)"], outletPhase: "L", agentAdded: "none", outlets: 2 },
    { id: "KB3.2-CRYST", ruleIds: ["KB3.1-LS-MELTING"], name: "Crystallization", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["M", "PT(LS)", "PS(LS)", "ES(C/H)"], outletPhase: "S and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-MELT-CRYST", ruleIds: ["KB3.1-LS-MELTING"], name: "Melt crystallization", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["M", "PT(LS)", "PS(LS)", "ES(C/H)"], outletPhase: "S and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-MEMBRANE-CRYST", ruleIds: ["KB3.1-LS-SIZE"], name: "Membrane crystallization", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["PC(LS)", "PS(LS)"], outletPhase: "S and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-PERVAP", ruleIds: ["KB3.1-MEMBRANE-LIQUID", "KB3.1-AZEO", "SCREEN-RVOL-LOW"], name: "Membrane pervaporation", source: "paper-derived: KB3.2/Table S.11", feedPhase: "L", pbb: ["M", "PT(MVL)", "PS(VL)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-VAPOR-PERM", ruleIds: ["KB3.1-MEMBRANE-VAPOR"], name: "Membrane vapor permeation", source: "paper-derived: KB3.2/Table S.11", feedPhase: "V", pbb: ["M", "PT(MVV)", "PS(VV)"], outletPhase: "V", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-THIN-FILM", ruleIds: ["SCREEN-THERMAL-SENSITIVE"], name: "Thin-film evaporation", source: "local extension: scale-up screening", feedPhase: "L", pbb: ["M", "PT(VL)", "PS(VL)", "ES(H)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-WIPED-FILM", ruleIds: ["SCREEN-THERMAL-SENSITIVE"], name: "Wiped-film evaporation", source: "local extension: scale-up screening", feedPhase: "L", pbb: ["M", "PT(VL)", "PS(VL)", "ES(H)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-SHORT-PATH", ruleIds: ["SCREEN-THERMAL-SENSITIVE"], name: "Short-path distillation", source: "local extension: scale-up screening", feedPhase: "L", pbb: ["M", "2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 },
    { id: "KB3.2-VACUUM", ruleIds: ["SCREEN-THERMAL-SENSITIVE"], name: "Vacuum distillation", source: "local extension: scale-up screening", feedPhase: "V and/or L", pbb: ["M", "2phM", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)"], outletPhase: "V and L", agentAdded: "ESA", outlets: 2 }
  ];

  function normalizeLookupSummary(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return {
      status: ["idle", "running", "done", "partial", "error"].includes(source.status) ? source.status : "idle",
      message: String(source.message || ""),
      lastUpdated: String(source.lastUpdated || "")
    };
  }

  function normalizeReactionBalance(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const legacyBasis = ["conversion", "yield", "assumption"].includes(source.basis) ? source.basis : "conversion";
    const legacyPercent = String(source.conversionPercent ?? "");
    return {
      conversionPercent: legacyBasis === "yield" && source.yieldPercent === undefined ? "" : legacyPercent,
      selectivityPercent: String(source.selectivityPercent ?? ""),
      yieldPercent: String(source.yieldPercent ?? (legacyBasis === "yield" ? legacyPercent : "")),
      basis: legacyBasis,
      limiting: String(source.limiting || "auto"),
      mainProductId: String(source.mainProductId || "auto"),
      note: String(source.note || "")
    };
  }

  function normalizeSeparationSubstance(value, index = 0, streamPhases = []) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const field = id => String(source[id] ?? "");
    return {
      id: String(source.id || `CS${index + 1}`),
      name: field("name"),
      role: substanceRoles.includes(source.role) ? source.role : "unknown",
      phase: streamPhases.includes(source.phase) ? source.phase : "unknown",
      fate: substanceFates.includes(source.fate) ? source.fate : "unknown",
      quantity: field("quantity"),
      unit: field("unit"),
      reactionFeedQuantity: field("reactionFeedQuantity"),
      reactionFeedUnit: field("reactionFeedUnit"),
      reactionGenerated: Boolean(source.reactionGenerated),
      stoichCoeff: field("stoichCoeff"),
      residualOf: field("residualOf"),
      residualSourceId: field("residualSourceId"),
      chemicalKey: field("chemicalKey"),
      source: field("source"),
      pubchemCid: field("pubchemCid"),
      pubchemUrl: field("pubchemUrl"),
      molecularFormula: field("molecularFormula"),
      canonicalSmiles: field("canonicalSmiles"),
      xlogp: field("xlogp"),
      exactMass: field("exactMass"),
      propertySource: field("propertySource"),
      propertyStatus: ["unknown", "reported", "experimental", "database", "estimated", "assumption"].includes(source.propertyStatus) ? source.propertyStatus : "unknown",
      thermalSensitivity: thermalOptions.includes(source.thermalSensitivity) ? source.thermalSensitivity : "unknown",
      mw: field("mw"),
      tb: field("tb"),
      tm: field("tm"),
      pvap: field("pvap"),
      pvapTemperature: field("pvapTemperature"),
      pvapTemperatureUnit: ["K", "C", "F"].includes(source.pvapTemperatureUnit) ? source.pvapTemperatureUnit : "K",
      solubilityParameter: field("solubilityParameter"),
      molarVolume: field("molarVolume"),
      criticalTemp: field("criticalTemp"),
      vdwVolume: field("vdwVolume"),
      molecularDiameter: field("molecularDiameter"),
      kineticDiameter: field("kineticDiameter"),
      note: field("note")
    };
  }

  function normalizeSeparationSimulator(value, streamPhases = []) {
    const base = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return {
      tab: ["balance", "substances", "binary", "workup", "pathway", "suggestions"].includes(base.tab) ? base.tab : "balance",
      substances: Array.isArray(base.substances) ? base.substances.map((item, index) => normalizeSeparationSubstance(item, index, streamPhases)) : [],
      pairInsights: base.pairInsights && typeof base.pairInsights === "object" && !Array.isArray(base.pairInsights) ? base.pairInsights : {},
      reactionBalance: normalizeReactionBalance(base.reactionBalance),
      pathway: normalizeSeparationPathway(base.pathway),
      lookupSummary: normalizeLookupSummary(base.lookupSummary),
      notes: String(base.notes || "")
    };
  }

  function normalizeSeparationPathway(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const steps = Array.isArray(source.steps) ? source.steps.map((step, index) => ({
      id: String(step.id || `PW${index + 1}`),
      pairKey: String(step.pairKey || ""),
      routeId: String(step.routeId || ""),
      title: String(step.title || ""),
      unit: String(step.unit || ""),
      separatedIds: Array.isArray(step.separatedIds) ? step.separatedIds.map(String).filter(Boolean) : [],
      retainedIds: Array.isArray(step.retainedIds) ? step.retainedIds.map(String).filter(Boolean) : [],
      drivers: Array.isArray(step.drivers) ? step.drivers.map(String).filter(Boolean) : [],
      missing: Array.isArray(step.missing) ? step.missing.map(String).filter(Boolean) : [],
      pbb: Array.isArray(step.pbb) ? step.pbb.map(String).filter(Boolean) : [],
      possibleOutletPhase: String(step.possibleOutletPhase || ""),
      agentAdded: String(step.agentAdded || ""),
      translationBasis: String(step.translationBasis || ""),
      unitCandidates: Array.isArray(step.unitCandidates) ? step.unitCandidates.map(candidate => ({
        id: String(candidate.id || candidate.name || ""),
        name: String(candidate.name || ""),
        source: String(candidate.source || ""),
        sourceClass: String(candidate.sourceClass || ""),
        feedPhase: String(candidate.feedPhase || ""),
        outletPhase: String(candidate.outletPhase || ""),
        pbb: Array.isArray(candidate.pbb) ? candidate.pbb.map(String).filter(Boolean) : [],
        agentAdded: String(candidate.agentAdded || ""),
        outlets: Number.isFinite(Number(candidate.outlets)) ? Number(candidate.outlets) : 0
      })).filter(candidate => candidate.name) : [],
      evidenceLevel: step.evidenceLevel === "supported"
        ? "matched"
        : ["matched", "partial", "hypothesis", "blocked"].includes(step.evidenceLevel)
          ? step.evidenceLevel
          : step.directionConfidence === "supported" ? "matched" : "partial",
      directionConfidence: step.directionConfidence === "supported"
        ? "inferred"
        : ["inferred", "review", "manual"].includes(step.directionConfidence) ? step.directionConfidence : "review",
      methodSources: Array.isArray(step.methodSources) ? step.methodSources.map(String).filter(Boolean) : [],
      note: String(step.note || "")
    })) : [];
    return {
      steps,
      viewMode: source.viewMode === "manual" ? "manual" : "guided",
      selectedStepId: String(source.selectedStepId || (steps.length ? steps[steps.length - 1].id : "") || ""),
      selectedAlternativeId: String(source.selectedAlternativeId || ""),
      editFromStepId: String(source.editFromStepId || ""),
      appliedAt: String(source.appliedAt || "")
    };
  }

  function nextSeparationSubstanceId(simulator) {
    const nums = (simulator.substances || [])
      .map(item => Number(String(item.id || "").replace("CS", "")))
      .filter(Number.isFinite);
    return `CS${(nums.length ? Math.max(...nums) : 0) + 1}`;
  }

  function separationSimulatorModel(simulator, streamPhases = []) {
    const substances = simulator.substances
      .map((item, index) => normalizeSeparationSubstance(item, index, streamPhases))
      .filter(item => item.name.trim());
    const pairs = [];
    for (let i = 0; i < substances.length; i += 1) {
      for (let j = i + 1; j < substances.length; j += 1) {
        pairs.push(separationPairModel(substances[i], substances[j], simulator));
      }
    }
    const suggestions = pairs.flatMap(pair => separationSuggestionsForPair(pair));
    return { substances, pairs, suggestions };
  }

  function separationSimulatorReadiness(model) {
    const quantifiedCount = model.substances.filter(item => item.quantity && item.unit).length;
    const propertyCount = model.substances.filter(item => purePropertyDefs.some(def => String(item[def.id] || "").trim())).length;
    const actionableCount = model.suggestions.filter(suggestionIsSelectable).length;
    const routeReadyCount = model.suggestions.filter(item => suggestionIsSelectable(item) && item.level === "matched").length;
    const blockedCount = model.suggestions.filter(item => !suggestionIsSelectable(item)).length;
    if (actionableCount) {
      return {
        status: routeReadyCount ? "ready" : "partial",
        title: routeReadyCount ? "Route-ready KB3.1 screens available" : "Threshold-only candidates need review",
        message: `${actionableCount} gated KB3.1 route${actionableCount === 1 ? "" : "s"} passed phase/phenomena checks. Review evidence and missing data before applying a candidate.`,
        quantifiedCount,
        propertyCount,
        actionableCount,
        routeReadyCount,
        blockedCount
      };
    }
    if (model.substances.length < 2) {
      return {
        status: "blocked",
        title: "Needs at least two substances",
        message: "Sync from streams or add substances manually before binary screening can start.",
        quantifiedCount,
        propertyCount,
        actionableCount,
        routeReadyCount,
        blockedCount
      };
    }
    return {
      status: "blocked",
      title: "Waiting for property evidence",
      message: "Substances and binary pairs are present, but no KB3.1 threshold is triggered yet. Add pure-component properties or binary mixture insights.",
      quantifiedCount,
      propertyCount,
      actionableCount,
      routeReadyCount,
      blockedCount
    };
  }

  function separationPairModel(a, b, simulator) {
    const key = separationPairKey(a.id, b.id);
    const stored = simulator.pairInsights[key] || {};
    const insights = {
      relativeVolatility: String(stored.relativeVolatility || ""),
      azeotrope: binaryInsightOptions.includes(stored.azeotrope) ? stored.azeotrope : "unknown",
      pressureSensitive: binaryInsightOptions.includes(stored.pressureSensitive) ? stored.pressureSensitive : "unknown",
      miscibilityGap: binaryInsightOptions.includes(stored.miscibilityGap) ? stored.miscibilityGap : "unknown",
      eutectic: binaryInsightOptions.includes(stored.eutectic) ? stored.eutectic : "unknown",
      note: String(stored.note || "")
    };
    const ratios = {};
    purePropertyDefs.forEach(def => {
      ratios[def.id] = propertyRatio(a[def.id], b[def.id]);
    });
    const propertyChecks = {
      pvap: vaporPressureConditionCheck(a, b)
    };
    if (!propertyChecks.pvap.comparable) ratios.pvap = null;
    return { key, a, b, components: [a, b], insights, ratios, propertyChecks };
  }

  function separationPairKey(a, b) {
    return [String(a), String(b)].sort().join("||");
  }

  function propertyRatio(a, b) {
    const va = numberFromText(a);
    const vb = numberFromText(b);
    if (!Number.isFinite(va) || !Number.isFinite(vb) || va <= 0 || vb <= 0) return null;
    return Math.max(va, vb) / Math.min(va, vb);
  }

  function temperatureToKelvin(value, unit = "K") {
    const number = numberFromText(value);
    if (!Number.isFinite(number)) return NaN;
    if (unit === "C") return number + 273.15;
    if (unit === "F") return (number - 32) * 5 / 9 + 273.15;
    return number;
  }

  function vaporPressureConditionCheck(a, b) {
    const hasValues = Number.isFinite(numberFromText(a.pvap)) && Number.isFinite(numberFromText(b.pvap));
    const ta = temperatureToKelvin(a.pvapTemperature, a.pvapTemperatureUnit);
    const tb = temperatureToKelvin(b.pvapTemperature, b.pvapTemperatureUnit);
    if (!hasValues) return { comparable: false, status: "missing", reason: "Pvap required for both components" };
    if (!Number.isFinite(ta) || !Number.isFinite(tb)) {
      return { comparable: false, status: "missing-condition", reason: "Pvap measurement temperature required for both components" };
    }
    const differenceK = Math.abs(ta - tb);
    if (differenceK > 2) {
      return {
        comparable: false,
        status: "incompatible-condition",
        reason: `Pvap temperatures differ by ${formatNumber(differenceK)} K`,
        temperaturesK: [ta, tb]
      };
    }
    return {
      comparable: true,
      status: "comparable",
      reason: `Pvap values compared near ${formatNumber((ta + tb) / 2)} K`,
      temperaturesK: [ta, tb]
    };
  }

  function separationSuggestionsForPair(pair) {
    const matched = kbRules
      .filter(rule => rule.test(pair))
      .map(rule => {
        const missing = separationMissingForSuggestion(pair, rule);
        const math = binaryMathForRule(pair, rule, missing);
        const eligibility = routeEligibilityForRule(pair, rule, missing, math);
        const unitCandidates = eligibility.selectable ? unitOperationCandidatesForRule(rule) : [];
        return {
          pairKey: pair.key,
          pairLabel: `${pair.a.name} / ${pair.b.name}`,
          ruleId: rule.id,
          label: rule.label,
          source: rule.source,
          sourceClass: String(rule.source || "").startsWith("local extension") ? "local extension" : "paper-derived",
          evidence: rule.evidence(pair),
          pbb: rule.pbb,
          principlePbbs: rule.pbb,
          possibleFeedPhase: possibleFeedPhaseForRule(rule.id),
          possibleOutletPhase: possibleOutletPhaseForRule(rule.id),
          agentAdded: agentAddedForRule(rule.id),
          unitCandidates,
          units: unitCandidates.length ? unitCandidates.map(item => item.name) : rule.units,
          translationBasis: unitCandidates.length ? "KB3.2 unit-operation translation" : "KB3.1 PBB screening only",
          level: eligibility.level,
          eligibility: eligibility.status,
          selectable: eligibility.selectable,
          routeFamily: eligibility.family,
          eligibilityReasons: eligibility.reasons,
          blockers: eligibility.blockers,
          note: rule.note,
          missing,
          strength: math.strength,
          comparisons: math.comparisons
        };
      })
      .sort((a, b) => suggestionLevelRank(a.level) - suggestionLevelRank(b.level) || a.missing.length - b.missing.length || a.label.localeCompare(b.label));
    if (matched.length) return matched;
    return [{
      pairKey: pair.key,
      pairLabel: `${pair.a.name} / ${pair.b.name}`,
      ruleId: "NO-KB3.1-MATCH",
      label: "No KB3.1 threshold match yet",
      source: "A1.1 + KB3.1/Table S.10",
      evidence: [],
      pbb: [],
      principlePbbs: [],
      possibleFeedPhase: "",
      possibleOutletPhase: "",
      agentAdded: "",
      unitCandidates: [],
      units: [],
      translationBasis: "KB3.1 PBB screening only",
      level: pairHasAnyData(pair) ? "hypothesis" : "blocked",
      eligibility: pairHasAnyData(pair) ? "hypothesis" : "not eligible",
      selectable: false,
      routeFamily: "unknown",
      eligibilityReasons: pairHasAnyData(pair) ? ["some properties are present, but no KB3.1 threshold is met"] : [],
      blockers: pairHasAnyData(pair) ? ["no KB3.1 threshold matched"] : ["missing binary/property evidence"],
      note: "Add pure-component values or binary mixture insights before proposing a defendable separation route.",
      missing: separationMissingForPair(pair),
      strength: null,
      comparisons: []
    }];
  }

  function suggestionIsSelectable(item) {
    return Boolean(item && item.ruleId !== "NO-KB3.1-MATCH" && item.selectable !== false && item.level !== "blocked" && item.eligibility !== "not eligible");
  }

  function binaryMathForRule(pair, rule, missing = []) {
    const comparisons = binaryRuleComparisons(pair, rule.id);
    const evaluated = comparisons.map(comparison => ({ ...comparison, strength: comparisonStrength(comparison) }));
    const strengths = evaluated.map(item => item.strength).filter(Number.isFinite);
    return {
      strength: strengths.length ? Math.max(...strengths) : null,
      comparisons: evaluated
    };
  }

  function binaryRuleComparisons(pair, ruleId) {
    const rows = [];
    const ratio = (id, label, threshold, operator = ">=") => rows.push({
      kind: "ratio",
      id,
      label,
      value: pair.ratios[id],
      threshold,
      operator,
      met: thresholdMet(pair.ratios[id], threshold, operator),
      basis: "max(A,B)/min(A,B)"
    });
    const insight = (id, label, expected = "yes") => rows.push({
      kind: "binary",
      id,
      label,
      value: pair.insights[id],
      threshold: expected,
      operator: "=",
      met: pair.insights[id] === expected,
      basis: "binary mixture insight"
    });
    const thermal = () => rows.push({
      kind: "binary",
      id: "thermalSensitivity",
      label: "High thermal sensitivity",
      value: pair.components.some(component => component.thermalSensitivity === "high") ? "yes" : "no",
      threshold: "yes",
      operator: "=",
      met: pair.components.some(component => component.thermalSensitivity === "high"),
      basis: "component flag"
    });

    if (ruleId === "KB3.1-VL-BP-PVAP") {
      ratio("tb", "Boiling point ratio", 1.23);
      ratio("pvap", "Vapor pressure ratio", 10);
    } else if (ruleId === "KB3.1-AZEO") {
      insight("azeotrope", "Azeotrope");
      ratio("pvap", "Vapor pressure ratio", 10);
      ratio("solubilityParameter", "Solubility parameter ratio", 1.11);
    } else if (ruleId === "KB3.1-PRESSURE-SENSITIVE-AZEO") {
      insight("azeotrope", "Azeotrope");
      insight("pressureSensitive", "Pressure-sensitive azeotrope");
    } else if (ruleId === "KB3.1-LL-GAP") {
      insight("miscibilityGap", "Miscibility gap");
      ratio("solubilityParameter", "Solubility parameter ratio", 1.20);
    } else if (ruleId === "KB3.1-LS-MELTING") {
      ratio("tm", "Melting point ratio", 1.20);
      insight("eutectic", "Eutectic");
    } else if (ruleId === "KB3.1-LS-SIZE") {
      ratio("molecularDiameter", "Molecular diameter ratio", 2.00);
      ratio("mw", "Molecular-weight ratio", 1.90);
    } else if (ruleId === "KB3.1-MEMBRANE-VAPOR") {
      ratio("vdwVolume", "Van der Waals volume ratio", 1.07);
      ratio("criticalTemp", "Critical-temperature ratio", 1.10);
    } else if (ruleId === "KB3.1-MEMBRANE-LIQUID") {
      ratio("molarVolume", "Molar-volume ratio", 1.02);
      ratio("solubilityParameter", "Solubility parameter ratio", 1.00);
    } else if (ruleId === "SCREEN-RVOL-LOW") {
      const alpha = numberFromText(pair.insights.relativeVolatility);
      rows.push({
        kind: "ratio",
        id: "relativeVolatility",
        label: "Relative volatility",
        value: Number.isFinite(alpha) ? alpha : null,
        threshold: 1.05,
        operator: "<=",
        met: Number.isFinite(alpha) && alpha > 0 && alpha <= 1.05,
        basis: "binary mixture insight"
      });
    } else if (ruleId === "SCREEN-THERMAL-SENSITIVE") {
      thermal();
      ratio("tb", "Boiling point ratio", 1.23);
      ratio("pvap", "Vapor pressure ratio", 10);
    }
    return rows;
  }

  function thresholdMet(value, threshold, operator = ">=") {
    if (!Number.isFinite(value) || !Number.isFinite(threshold)) return false;
    if (operator === "<=") return value <= threshold;
    return value >= threshold;
  }

  function comparisonStrength(comparison) {
    if (comparison.kind === "binary") return comparison.met ? 1 : null;
    const value = Number(comparison.value);
    const threshold = Number(comparison.threshold);
    if (!Number.isFinite(value) || !Number.isFinite(threshold) || threshold <= 0) return null;
    if (comparison.operator === "<=") return value > 0 ? threshold / value : null;
    return value / threshold;
  }

  function pairHasAnyData(pair) {
    return Object.values(pair.ratios).some(Number.isFinite)
      || Object.entries(pair.insights).some(([key, value]) => key !== "note" && value && value !== "unknown")
      || Boolean(pair.insights.note.trim());
  }

  function separationMissingForPair(pair) {
    const missing = [];
    if (!Number.isFinite(pair.ratios.tb)) missing.push("Tb for both components");
    if (!Number.isFinite(pair.ratios.pvap)) missing.push(pair.propertyChecks?.pvap?.reason || "Pvap for both components at comparable temperature");
    if (!Number.isFinite(pair.ratios.tm)) missing.push("Tm for both components");
    if (!Number.isFinite(pair.ratios.solubilityParameter)) missing.push("solubility parameter for both components");
    if (pair.insights.azeotrope === "unknown") missing.push("azeotrope yes/no");
    if (pair.insights.miscibilityGap === "unknown") missing.push("miscibility gap yes/no");
    return missing.slice(0, 5);
  }

  // Below this vapour pressure at the comparison temperature a component is, for screening
  // purposes, non-volatile: a Pvap ratio between two such components (glycerol at 0.02 Pa
  // against a methyl ester at 0.0002 Pa) says nothing about a vapour-liquid split at process
  // conditions, so it cannot carry a "matched" volatility route on its own.
  const usableVaporPressurePa = 100;

  function bothEssentiallyNonVolatile(pair) {
    const values = pair.components.map(component => numberFromText(component.pvap));
    return values.every(value => Number.isFinite(value) && value >= 0 && value < usableVaporPressurePa);
  }

  function separationMissingForSuggestion(pair, rule) {
    const missing = [];
    if (rule.id.includes("VL") || rule.id.includes("AZEO")) {
      if (pair.insights.azeotrope === "unknown") missing.push("azeotrope yes/no");
      if (!Number.isFinite(pair.ratios.tb)) missing.push("Tb ratio");
      if (!Number.isFinite(pair.ratios.pvap)) missing.push(pair.propertyChecks?.pvap?.reason || "Pvap ratio at comparable temperature");
      if (rule.id === "KB3.1-VL-BP-PVAP" && !(pair.ratios.tb >= 1.23) && bothEssentiallyNonVolatile(pair)) {
        missing.push(`both components below ${usableVaporPressurePa} Pa at the comparison temperature: compare vapour pressures at process temperature`);
      }
    }
    if (rule.id.includes("LL") && pair.insights.miscibilityGap === "unknown") missing.push("miscibility gap");
    if (rule.id.includes("LS") && !Number.isFinite(pair.ratios.tm) && pair.insights.eutectic === "unknown") missing.push("Tm ratio or eutectic");
    if (rule.id === "KB3.1-LS-MELTING") {
      const hasSolidPhase = pair.components.some(component => /S/.test(String(component.phase || "").toUpperCase()));
      if (!hasSolidPhase && pair.insights.eutectic !== "yes") missing.push("observed solid phase or measured SLE/eutectic evidence");
    }
    if (rule.id === "KB3.1-LS-SIZE" && (!Number.isFinite(pair.ratios.molecularDiameter) || !Number.isFinite(pair.ratios.mw))) missing.push("molecular diameter and MW ratios");
    if (rule.id === "KB3.1-MEMBRANE-VAPOR" && (!Number.isFinite(pair.ratios.vdwVolume) || !Number.isFinite(pair.ratios.criticalTemp))) missing.push("VdW volume and critical-temperature ratios");
    if (rule.id === "KB3.1-MEMBRANE-LIQUID" && (!Number.isFinite(pair.ratios.molarVolume) || !Number.isFinite(pair.ratios.solubilityParameter))) missing.push("molar-volume and solubility-parameter ratios");
    return [...new Set(missing)].slice(0, 4);
  }

  function routeEligibilityForRule(pair, rule, missing = [], math = {}) {
    const family = routeFamilyForRule(rule.id);
    const compatibility = routeFamilyCompatibility(pair, family);
    const reasons = [...compatibility.reasons];
    const blockers = [...compatibility.blockers];
    const evidence = rule.evidence(pair);
    const hasThresholdEvidence = (math.comparisons || []).some(item => item.met) || evidence.length > 0;
    if (blockers.length) {
      return {
        status: "not eligible",
        level: "blocked",
        selectable: false,
        family,
        reasons,
        blockers
      };
    }
    if (!hasThresholdEvidence) {
      return {
        status: "hypothesis",
        level: "hypothesis",
        selectable: false,
        family,
        reasons,
        blockers: ["no property or binary threshold matched"]
      };
    }
    if (missing.length) reasons.push("the KB threshold matched, but route feasibility still needs review data");
    const hasConfirmedSolidBasis = family === "LS"
      && (pair.components.some(component => /S/.test(String(component.phase || "").toUpperCase())) || pair.insights.eutectic === "yes");
    const baseLevel = rule.id === "KB3.1-LS-MELTING" && hasConfirmedSolidBasis ? "matched" : rule.level;
    const level = baseLevel === "matched" && missing.length ? "partial" : baseLevel;
    return {
      status: level === "matched" ? "rule matched" : "review required",
      level,
      selectable: true,
      family,
      reasons,
      blockers
    };
  }

  function routeFamilyForRule(ruleId) {
    if (ruleId === "KB3.1-VL-BP-PVAP" || ruleId === "KB3.1-AZEO" || ruleId === "KB3.1-PRESSURE-SENSITIVE-AZEO" || ruleId === "SCREEN-THERMAL-SENSITIVE") return "VL";
    if (ruleId === "KB3.1-LL-GAP") return "LL";
    if (ruleId === "KB3.1-LS-MELTING" || ruleId === "KB3.1-LS-SIZE") return "LS";
    if (ruleId === "KB3.1-MEMBRANE-VAPOR") return "VV";
    if (ruleId === "KB3.1-MEMBRANE-LIQUID" || ruleId === "SCREEN-RVOL-LOW") return "AFFINITY";
    return "unknown";
  }

  function unitOperationCandidatesForRule(rule) {
    return kb32UnitOperationRules
      .filter(item => item.ruleIds.includes(rule.id))
      .map(item => {
        const localExtension = rule.id.startsWith("SCREEN-") || String(item.source || "").startsWith("local extension");
        return {
          id: item.id,
          name: item.name,
          source: localExtension ? "local extension: scale-up screening" : "KB3.2/Table S.11",
          sourceClass: localExtension ? "local extension" : "paper-derived",
          feedPhase: item.feedPhase,
          outletPhase: item.outletPhase,
          pbb: item.pbb,
          agentAdded: item.agentAdded,
          outlets: item.outlets
        };
      });
  }

  function possibleFeedPhaseForRule(ruleId) {
    const candidates = kb32UnitOperationRules.filter(item => item.ruleIds.includes(ruleId)).map(item => item.feedPhase);
    if (candidates.length) return [...new Set(candidates)].join(" / ");
    const family = routeFamilyForRule(ruleId);
    if (family === "VL" || family === "AFFINITY") return "V and/or L";
    if (family === "VV") return "V";
    if (family === "LL" || family === "LS") return "L";
    return "";
  }

  function possibleOutletPhaseForRule(ruleId) {
    const candidates = kb32UnitOperationRules.filter(item => item.ruleIds.includes(ruleId)).map(item => item.outletPhase);
    if (candidates.length) return [...new Set(candidates)].join(" / ");
    const family = routeFamilyForRule(ruleId);
    if (family === "VL") return "V and L";
    if (family === "VV") return "V";
    if (family === "LL") return "L";
    if (family === "LS") return "S and L";
    return "";
  }

  function agentAddedForRule(ruleId) {
    const candidates = kb32UnitOperationRules.filter(item => item.ruleIds.includes(ruleId)).map(item => item.agentAdded);
    return candidates.length ? [...new Set(candidates)].join(" / ") : "";
  }

  function routeFamilyCompatibility(pair, family) {
    const phases = pair.components.map(component => String(component.phase || "unknown").toUpperCase());
    const known = phases.filter(phase => phase && phase !== "UNKNOWN");
    const hasUnknown = known.length !== phases.length;
    const hasLiquidLike = phases.some(phase => phase === "L" || phase.includes("L"));
    const hasVaporOnly = known.length && known.every(phase => phase === "V" || phase === "VV");
    const hasSolidOnly = known.length && known.every(phase => phase === "S" || phase === "SS");
    const hasSolidLike = phases.some(phase => phase === "S" || phase.includes("S"));
    const reasons = [];
    const blockers = [];
    if (hasUnknown) blockers.push("phase required for both substances before this route can be screened");
    if (family === "VL") {
      if (hasSolidOnly) blockers.push("both substances are marked solid; V-L route needs liquid/vapor handling basis");
      else reasons.push(hasLiquidLike ? "liquid/vapor-compatible phases" : "V-L route requires phase confirmation");
    } else if (family === "VV") {
      if (!hasUnknown && !hasVaporOnly) blockers.push("vapor membrane route requires a vapor feed basis");
      else if (hasVaporOnly) reasons.push("vapor-vapor phase basis available");
    } else if (family === "LL") {
      if (hasVaporOnly) blockers.push("both substances are marked vapor; L-L split is not phase-compatible");
      else if (!hasLiquidLike && !hasUnknown) blockers.push("L-L split needs a liquid phase basis");
      else reasons.push("liquid-liquid phase basis available or declared by miscibility data");
    } else if (family === "LS") {
      if (hasVaporOnly) blockers.push("both substances are marked vapor; L-S route is not phase-compatible");
      else reasons.push(hasSolidLike || hasLiquidLike ? "solid-liquid phase basis available or can be generated" : "L-S route requires phase confirmation");
    } else if (family === "AFFINITY") {
      if (hasSolidOnly) blockers.push("both substances are marked solid; membrane/affinity route needs a fluid phase basis");
      else reasons.push(hasLiquidLike ? "fluid/affinity route basis available" : "affinity route requires phase confirmation");
    }
    return { reasons: [...new Set(reasons)], blockers: [...new Set(blockers)] };
  }

  function reactionBalanceModel(group, simulatorModel, balanceSource) {
    const balance = normalizeReactionBalance(balanceSource);
    const conversion = reactionConversionFraction(group, balance);
    const selectivity = reactionSelectivityFraction(balance);
    const yieldFraction = reactionYieldFraction(balance, conversion, selectivity);
    const rows = simulatorModel.substances.map(item => reactionBalanceRow(item));
    const reactants = rows.filter(row => row.role === "reactant" && row.stoich > 0 && Number.isFinite(row.initialMol));
    const manualLimiting = balance.limiting && balance.limiting !== "auto"
      ? reactants.find(row => row.id === balance.limiting || row.name === balance.limiting)
      : null;
    const limiting = manualLimiting || reactants
      .map(row => ({ ...row, extentCapacity: row.initialMol / row.stoich }))
      .sort((a, b) => a.extentCapacity - b.extentCapacity)[0] || null;
    const limitingCapacity = limiting ? limiting.initialMol / limiting.stoich : NaN;
    const reactantExtent = Number.isFinite(limitingCapacity) && Number.isFinite(conversion) ? limitingCapacity * conversion : NaN;
    const productExtent = Number.isFinite(limitingCapacity) && Number.isFinite(yieldFraction) ? limitingCapacity * yieldFraction : NaN;
    const mainProduct = mainProductRow(rows, balance);
    const balancedRows = rows.map(row => reactionMixtureRow(row, reactantExtent, mainProduct, productExtent));
    const residualRows = balancedRows.filter(row => row.role === "reactant" && Number.isFinite(row.finalMassKg) && row.finalMassKg > 0.000001);
    const issues = [];
    if (!reactants.length) issues.push("reactant amounts with MW");
    if (!Number.isFinite(conversion)) issues.push("conversion percent");
    const reportedYield = numberFromText(balance.yieldPercent);
    if (Number.isFinite(reportedYield) && Number.isFinite(conversion) && reportedYield / 100 > conversion + 1e-9) {
      issues.push("yield cannot exceed conversion on the same molar basis");
    }
    if (!Number.isFinite(yieldFraction) && !rows.some(row => ["product", "coproduct"].includes(row.role) && Number.isFinite(row.initialMol) && row.initialMol > 0)) {
      issues.push("yield or selectivity percent for product estimate");
    }
    if (!limiting) issues.push("limiting reagent");
    if (!mainProduct) issues.push("main product selection");
    const balancedMainProduct = mainProduct
      ? balancedRows.find(row => row.id === mainProduct.id) || mainProduct
      : null;
    return {
      balance,
      conversion,
      selectivity,
      yield: yieldFraction,
      limiting,
      extent: reactantExtent,
      productExtent,
      mainProduct: balancedMainProduct,
      rows: balancedRows,
      residualRows,
      issues,
      status: issues.length ? "partial" : "estimated"
    };
  }

  function mainProductRow(rows, balance) {
    const products = rows.filter(row => row.role === "product" || row.role === "coproduct");
    if (!products.length) return null;
    if (balance.mainProductId && balance.mainProductId !== "auto") {
      const selected = products.find(row => row.id === balance.mainProductId || row.name === balance.mainProductId);
      if (selected) return selected;
    }
    return products.find(row => row.role === "product") || products[0];
  }

  function reactionConversionFraction(group, balance) {
    const manual = numberFromText(balance.conversionPercent);
    if (Number.isFinite(manual) && manual >= 0 && manual <= 100) return manual / 100;
    return NaN;
  }

  function reactionSelectivityFraction(balance) {
    const value = numberFromText(balance.selectivityPercent);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value / 100 : NaN;
  }

  function reactionYieldFraction(balance, conversion, selectivity) {
    const value = numberFromText(balance.yieldPercent);
    if (Number.isFinite(value) && value >= 0 && value <= 100) {
      const fraction = value / 100;
      return Number.isFinite(conversion) && fraction > conversion + 1e-9 ? NaN : fraction;
    }
    if (Number.isFinite(conversion) && Number.isFinite(selectivity)) return conversion * selectivity;
    return NaN;
  }

  function reactionBalanceRow(item) {
    const mw = numberFromText(item.mw);
    const hasFeedBasis = String(item.reactionFeedQuantity || "").trim() !== "";
    const balanceQuantity = hasFeedBasis ? item.reactionFeedQuantity : item.quantity;
    const balanceUnit = hasFeedBasis ? item.reactionFeedUnit || item.unit : item.unit;
    const quantity = numberFromText(balanceQuantity);
    const unit = String(balanceUnit || "").toLowerCase();
    let initialMol = NaN;
    if (Number.isFinite(quantity) && Number.isFinite(mw) && mw > 0) {
      if (unit === "kg") initialMol = quantity * 1000 / mw;
      else if (unit === "g") initialMol = quantity / mw;
      else if (unit === "mol") initialMol = quantity;
      else if (unit === "kmol") initialMol = quantity * 1000;
    }
    const defaultStoich = ["reactant", "product", "coproduct", "byproduct"].includes(item.role) ? 1 : 0;
    const parsedStoich = numberFromText(item.stoichCoeff);
    return {
      ...item,
      mw,
      initialMol,
      stoich: Number.isFinite(parsedStoich) ? parsedStoich : defaultStoich,
      initialMassKg: massToKg(balanceQuantity, balanceUnit),
      balanceQuantity: String(balanceQuantity || ""),
      balanceUnit: String(balanceUnit || "")
    };
  }

  function reactionMixtureRow(row, extent, mainProduct = null, productExtent = extent) {
    let finalMol = row.initialMol;
    let basis = "passes through";
    if (row.role === "reactant" && Number.isFinite(extent) && row.stoich > 0) {
      finalMol = Number.isFinite(row.initialMol) ? Math.max(0, row.initialMol - extent * row.stoich) : NaN;
      basis = "unreacted component in reaction effluent";
    } else if ((row.role === "product" || row.role === "coproduct" || row.role === "byproduct") && Number.isFinite(productExtent) && row.stoich > 0) {
      finalMol = !row.reactionGenerated && Number.isFinite(row.initialMol) && row.initialMol > 0
        ? row.initialMol
        : productExtent * row.stoich;
      basis = row.id === mainProduct?.id ? "main product formed estimate" : `${row.role} formed estimate`;
    } else if (row.role === "solvent") {
      basis = "bulk solvent passthrough";
    } else if (row.role === "catalyst") {
      basis = "catalyst/additive passthrough";
    }
    const finalMassKg = Number.isFinite(finalMol) && Number.isFinite(row.mw) ? finalMol * row.mw / 1000 : row.initialMassKg;
    return { ...row, finalMol, finalMassKg, basis, confidence: Number.isFinite(finalMassKg) ? "estimated" : "missing data" };
  }

  function workupPlanModel(group, simulatorModel, balanceSource) {
    const balance = reactionBalanceModel(group, simulatorModel, balanceSource);
    const rows = balance.rows;
    const suggestions = simulatorModel.suggestions.filter(suggestionIsSelectable);
    const product = rows.find(row => row.role === "product");
    const steps = [];
    const coproducts = rows.filter(row => row.role === "coproduct");
    const byproducts = rows.filter(row => row.role === "byproduct" || /water|salt|gas/i.test(row.name));
    if (byproducts.length) steps.push(workupStep("Remove reaction byproduct / separate phase", byproducts, ["Dean-Stark trap", "Decanter", "Liquid-liquid split"], "Generated by reaction; remove early if it forms a separate phase or drives equilibrium."));
    const solvents = rows.filter(row => row.role === "solvent");
    if (solvents.length) steps.push(workupStep("Recover bulk solvent", solvents, matchingSuggestionUnits(suggestions, solvents, product, ["Evaporation", "Distillation", "Flash vaporization", "Vacuum distillation"]), "Bulk volatile solvent usually dominates mass and should be removed before polishing the product."));
    const residualReactants = rows.filter(row => row.role === "reactant" && Number.isFinite(row.finalMol) && row.finalMol > 0.001);
    if (residualReactants.length) steps.push(workupStep("Remove or recover residual reactants", residualReactants, matchingSuggestionUnits(suggestions, residualReactants, product, ["Distillation", "Liquid-liquid extraction", "Crystallization", "Membrane pervaporation"]), "Conversion below 100% leaves unreacted material; recover it before final product specification if feasible."));
    const catalysts = rows.filter(row => row.role === "catalyst");
    if (catalysts.length) steps.push(workupStep("Purge catalyst / inorganic additive", catalysts, ["Wash", "Adsorption", "Filtration"], "Catalysts and salts usually need a dedicated purge or wash."));
    if (coproducts.length) steps.push(workupStep("Recover co-product stream", coproducts, matchingSuggestionUnits(suggestions, coproducts, product, ["Distillation", "Crystallization", "Liquid-liquid extraction", "Evaporation"]), "Co-products are product-like streams; keep them separate from waste if they have value or specification."));
    if (product) steps.push(workupStep("Final product polishing", [product], product.thermalSensitivity === "high" ? ["Short-path distillation", "Wiped-film evaporation", "Vacuum distillation"] : ["Distillation", "Crystallization", "Final evaporation"], product.thermalSensitivity === "high" ? "Product is heat-sensitive; prefer short residence time and reduced pressure." : "Final step targets product purity after bulk removals."));
    return { balance, steps };
  }

  function matchingSuggestionUnits(suggestions, targets, product, preferred) {
    const names = new Set(targets.map(row => row.name));
    if (product?.name) names.add(product.name);
    const units = suggestions
      .filter(item => [...names].some(name => item.pairLabel.includes(name)))
      .flatMap(item => item.units)
      .filter(unit => preferred.some(pref => unit.includes(pref) || pref.includes(unit)));
    return [...new Set(units)].slice(0, 4);
  }

  function workupStep(title, rows, units, reason) {
    return { title, rows, units: units.length ? [...new Set(units)].slice(0, 4) : ["Review candidate unit"], reason };
  }

  function binaryRouteVariants(groupId, pair) {
    const variants = [];
    const suggestions = separationSuggestionsForPair(pair).filter(suggestionIsSelectable);
    const matchedBy = ruleId => suggestions.filter(item => item.ruleId === ruleId);
    const volatility = matchedBy("KB3.1-VL-BP-PVAP");
    if (volatility.length) {
      const volatile = preferredVolatileComponent(pair);
      const retained = volatile.id === pair.a.id ? pair.b : pair.a;
      const math = routeMathSummary(volatility);
      variants.push({
        id: routeVariantId("Volatility route"),
        title: "Volatility route",
        level: strongestSuggestionLevel(volatility),
        strength: math.strength,
        comparisons: math.comparisons,
        units: prioritizedUnits(volatility, ["Evaporation", "Distillation", "Flash vaporization", "Partial condensation / vaporization"]),
        pbb: uniqueFlat(volatility.map(item => item.pbb)),
        unitCandidates: uniqueUnitCandidates(volatility),
        possibleOutletPhase: combinedOutletPhase(volatility),
        agentAdded: combinedAgentAdded(volatility),
        translationBasis: "KB3.1 PBBs translated through KB3.2",
        selectable: true,
        flowLabel: "V-L separator",
        drivers: volatility.flatMap(item => item.evidence).slice(0, 4),
        missing: uniqueFlat(volatility.map(item => item.missing)),
        graphPreview: `${groupId} -> V-L separator; ${volatile.name} leaves as volatile/recovery stream, ${retained.name} continues as heavier liquid/product-rich stream.`
      });
    }
    const thermal = matchedBy("SCREEN-THERMAL-SENSITIVE");
    if (thermal.length) {
      const sensitive = pair.components.find(component => component.thermalSensitivity === "high") || pair.b;
      const math = routeMathSummary(thermal);
      variants.push({
        id: routeVariantId("Gentle thermal route"),
        title: "Gentle thermal route",
        level: strongestSuggestionLevel(thermal),
        strength: math.strength,
        comparisons: math.comparisons,
        units: prioritizedUnits(thermal, ["Short-path distillation", "Wiped-film evaporation", "Thin-film evaporation", "Vacuum distillation"]),
        pbb: uniqueFlat(thermal.map(item => item.pbb)),
        unitCandidates: uniqueUnitCandidates(thermal),
        possibleOutletPhase: combinedOutletPhase(thermal),
        agentAdded: combinedAgentAdded(thermal),
        translationBasis: "KB3.1 PBBs translated through KB3.2",
        selectable: true,
        flowLabel: "gentle separator",
        drivers: thermal.flatMap(item => item.evidence).slice(0, 4),
        missing: uniqueFlat(thermal.map(item => item.missing)),
        graphPreview: `${groupId} -> low-residence thermal separator; protect ${sensitive.name}, remove the more volatile/light component under reduced pressure.`
      });
    }
    const liquid = matchedBy("KB3.1-LL-GAP");
    if (liquid.length) {
      const math = routeMathSummary(liquid);
      variants.push({
        id: routeVariantId("Liquid-liquid split route"),
        title: "Liquid-liquid split route",
        level: strongestSuggestionLevel(liquid),
        strength: math.strength,
        comparisons: math.comparisons,
        units: prioritizedUnits(liquid, ["Decanter", "Liquid-liquid extraction"]),
        pbb: uniqueFlat(liquid.map(item => item.pbb)),
        unitCandidates: uniqueUnitCandidates(liquid),
        possibleOutletPhase: combinedOutletPhase(liquid),
        agentAdded: combinedAgentAdded(liquid),
        translationBasis: "KB3.1 PBBs translated through KB3.2",
        selectable: true,
        flowLabel: "L-L separator",
        drivers: liquid.flatMap(item => item.evidence).slice(0, 4),
        missing: uniqueFlat(liquid.map(item => item.missing)),
        graphPreview: `${groupId} -> L-L split; route phase enriched in ${pair.a.name} separately from phase enriched in ${pair.b.name}.`
      });
    }
    const solid = [
      ...matchedBy("KB3.1-LS-MELTING"),
      ...matchedBy("KB3.1-LS-SIZE")
    ];
    if (solid.length) {
      const crystallizing = preferredSolidComponent(pair);
      const math = routeMathSummary(solid);
      variants.push({
        id: routeVariantId("Crystallization route"),
        title: "Crystallization route",
        level: strongestSuggestionLevel(solid),
        strength: math.strength,
        comparisons: math.comparisons,
        units: prioritizedUnits(solid, ["Crystallization", "Melt crystallization"]),
        pbb: uniqueFlat(solid.map(item => item.pbb)),
        unitCandidates: uniqueUnitCandidates(solid),
        possibleOutletPhase: combinedOutletPhase(solid),
        agentAdded: combinedAgentAdded(solid),
        translationBasis: "KB3.1 PBBs translated through KB3.2",
        selectable: true,
        flowLabel: "crystallizer/filter",
        drivers: solid.flatMap(item => item.evidence).slice(0, 4),
        missing: uniqueFlat(solid.map(item => item.missing)),
        graphPreview: `${groupId} -> crystallizer/filter; isolate ${crystallizing.name} as solid-rich cut and send mother liquor downstream.`
      });
    }
    const affinity = [
      ...matchedBy("KB3.1-MEMBRANE-VAPOR"),
      ...matchedBy("KB3.1-MEMBRANE-LIQUID")
    ];
    if (affinity.length) {
      const larger = preferredLargeComponent(pair);
      const math = routeMathSummary(affinity);
      variants.push({
        id: routeVariantId("Affinity / size-selective route"),
        title: "Affinity / size-selective route",
        level: strongestSuggestionLevel(affinity),
        strength: math.strength,
        comparisons: math.comparisons,
        units: prioritizedUnits(affinity, ["Membrane pervaporation", "Membrane vapor permeation", "Liquid-liquid extraction"]),
        pbb: uniqueFlat(affinity.map(item => item.pbb)),
        unitCandidates: uniqueUnitCandidates(affinity),
        possibleOutletPhase: combinedOutletPhase(affinity),
        agentAdded: combinedAgentAdded(affinity),
        translationBasis: "KB3.1 PBBs translated through KB3.2",
        selectable: true,
        flowLabel: "selective separator",
        drivers: affinity.flatMap(item => item.evidence).slice(0, 4),
        missing: uniqueFlat(affinity.map(item => item.missing)),
        graphPreview: `${groupId} -> selective separator; use MW/size/affinity contrast to split ${larger.name} from the smaller or more permeable component.`
      });
    }
    const weakDistillation = matchedBy("SCREEN-RVOL-LOW");
    if (weakDistillation.length) {
      const math = routeMathSummary(weakDistillation);
      variants.push({
        id: routeVariantId("Avoid simple distillation route"),
        title: "Avoid simple distillation route",
        level: strongestSuggestionLevel(weakDistillation),
        strength: math.strength,
        comparisons: math.comparisons,
        units: prioritizedUnits(weakDistillation, ["Extractive distillation", "Azeotropic distillation", "Membrane pervaporation", "Liquid-liquid extraction"]),
        pbb: uniqueFlat(weakDistillation.map(item => item.pbb)),
        unitCandidates: uniqueUnitCandidates(weakDistillation),
        possibleOutletPhase: combinedOutletPhase(weakDistillation),
        agentAdded: combinedAgentAdded(weakDistillation),
        translationBasis: "KB3.1 PBBs translated through KB3.2",
        selectable: true,
        flowLabel: "assisted separator",
        drivers: weakDistillation.flatMap(item => item.evidence).slice(0, 4),
        missing: uniqueFlat(weakDistillation.map(item => item.missing)),
        graphPreview: `${groupId} -> assisted/intensified separator; add an agent or selective barrier instead of a simple V-L column.`
      });
    }
    if (!variants.length && pairHasAnyData(pair)) {
      variants.push({
        id: routeVariantId("Hypothesis route pending"),
        title: "Hypothesis route pending",
        level: "hypothesis",
        strength: null,
        comparisons: [],
        units: ["Review candidate unit"],
        pbb: [],
        unitCandidates: [],
        possibleOutletPhase: "",
        agentAdded: "",
        translationBasis: "KB3.1 PBB screening only",
        selectable: false,
        flowLabel: "review separator",
        drivers: Object.entries(pair.ratios)
          .filter(([, value]) => Number.isFinite(value))
          .slice(0, 3)
          .map(([key, value]) => `${key} ratio ${formatRatio(value)}`),
        missing: separationMissingForPair(pair),
        graphPreview: `${groupId} would need an inserted separator, but current property thresholds do not yet justify a specific route.`
      });
    }
    return variants.slice(0, 5);
  }

  function routeMathSummary(suggestions) {
    const comparisons = suggestions.flatMap(item => item.comparisons || []);
    const strengths = suggestions.map(item => item.strength).filter(Number.isFinite);
    return {
      strength: strengths.length ? Math.max(...strengths) : null,
      comparisons
    };
  }

  function strongestSuggestionLevel(items) {
    return items.map(item => item.level).sort((a, b) => suggestionLevelRank(a) - suggestionLevelRank(b))[0] || "hypothesis";
  }

  function suggestionLevelRank(level) {
    if (level === "matched") return 0;
    if (level === "partial") return 1;
    if (level === "hypothesis") return 2;
    return 3;
  }

  function prioritizedUnits(items, preferred) {
    const units = uniqueFlat(items.map(item => item.units));
    const sorted = [
      ...preferred.filter(unit => units.includes(unit)),
      ...units.filter(unit => !preferred.includes(unit))
    ];
    return sorted.slice(0, 4);
  }

  function uniqueUnitCandidates(items) {
    const seen = new Set();
    return items
      .flatMap(item => item.unitCandidates || [])
      .filter(candidate => {
        const key = candidate.id || candidate.name;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function combinedOutletPhase(items) {
    return [...new Set(items.map(item => item.possibleOutletPhase).filter(Boolean))].join(" / ");
  }

  function combinedAgentAdded(items) {
    return [...new Set(items.map(item => item.agentAdded).filter(Boolean))].join(" / ");
  }

  function uniqueFlat(groups) {
    return [...new Set(groups.flat().filter(Boolean))];
  }

  function preferredVolatileComponent(pair) {
    const pvapA = numberFromText(pair.a.pvap);
    const pvapB = numberFromText(pair.b.pvap);
    if (Number.isFinite(pvapA) && Number.isFinite(pvapB) && pvapA !== pvapB) return pvapA > pvapB ? pair.a : pair.b;
    const tbA = numberFromText(pair.a.tb);
    const tbB = numberFromText(pair.b.tb);
    if (Number.isFinite(tbA) && Number.isFinite(tbB) && tbA !== tbB) return tbA < tbB ? pair.a : pair.b;
    return pair.a.role === "solvent" ? pair.a : pair.b;
  }

  function preferredSolidComponent(pair) {
    const tmA = numberFromText(pair.a.tm);
    const tmB = numberFromText(pair.b.tm);
    if (Number.isFinite(tmA) && Number.isFinite(tmB) && tmA !== tmB) return tmA > tmB ? pair.a : pair.b;
    return pair.a.role === "product" ? pair.a : pair.b;
  }

  function preferredLargeComponent(pair) {
    const mwA = numberFromText(pair.a.mw);
    const mwB = numberFromText(pair.b.mw);
    if (Number.isFinite(mwA) && Number.isFinite(mwB) && mwA !== mwB) return mwA > mwB ? pair.a : pair.b;
    const dA = numberFromText(pair.a.molecularDiameter);
    const dB = numberFromText(pair.b.molecularDiameter);
    if (Number.isFinite(dA) && Number.isFinite(dB) && dA !== dB) return dA > dB ? pair.a : pair.b;
    return pair.a.role === "product" ? pair.a : pair.b;
  }

  function routeVariantId(title) {
    return String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "route";
  }

  function routeVariantPhenomena(variant) {
    const title = String(variant.title || "").toLowerCase();
    const unit = String((variant.units || [])[0] || "").toLowerCase();
    if (/liquid-liquid|extraction|decanter|l-l/.test(`${title} ${unit}`)) return ["PT(LL)", "PS(LL)", "PC(LL)"];
    if (/crystall|filter|solid/.test(`${title} ${unit}`)) return ["PT(LS)", "PS(LS)", "PCh(L->S)", "ES(C)"];
    if (/membrane|affinity|selective|pervaporation/.test(`${title} ${unit}`)) return ["PT(MVL)", "PS(VL)", "PC(VL)"];
    if (/thermal|distill|evapor|flash|vapor|v-l|volatil/.test(`${title} ${unit}`)) return ["PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)", "ES(H)", "ES(C)"];
    return uniqueFlat([variant.pbb || [], ["PT(VL)", "PS(VL)"]]).slice(0, 5);
  }

  function routeVariantBehavior(variant) {
    const title = String(variant.title || "").toLowerCase();
    const unit = String((variant.units || [])[0] || "").toLowerCase();
    if (/liquid-liquid|extraction|decanter|l-l/.test(`${title} ${unit}`)) return "liquid-liquid wash";
    if (/crystall|filter|solid/.test(`${title} ${unit}`)) return "filtration";
    if (/distill|purif/.test(`${title} ${unit}`)) return "distillation purification";
    if (/evapor|flash|vapor|thermal/.test(`${title} ${unit}`)) return "solvent evaporation";
    return "separation";
  }

  function separationPathwayModel(groupInput, simulatorModel, balanceSource, pathwaySource) {
    const group = groupInput && typeof groupInput === "object" ? groupInput : { id: String(groupInput || ""), blocks: [] };
    const groupId = group.id || String(groupInput || "");
    const pathway = normalizeSeparationPathway(pathwaySource);
    const balance = reactionBalanceModel(group, simulatorModel, balanceSource);
    const mainProduct = balance.mainProduct || mainProductRow(simulatorModel.substances.map(item => reactionBalanceRow(item)), balance.balance);
    const allById = new Map(simulatorModel.substances.map(item => [item.id, item]));
    const steps = pathway.steps.map(step => {
      const pair = simulatorModel.pairs.find(item => item.key === step.pairKey);
      const variant = pair ? binaryRouteVariants(groupId, pair).find(item => item.id === step.routeId && item.selectable !== false) : null;
      return {
        ...step,
        valid: Boolean(pair && variant),
        separated: step.separatedIds.map(id => allById.get(id)).filter(Boolean),
        retained: step.retainedIds.map(id => allById.get(id)).filter(Boolean)
      };
    });
    const editIndex = pathway.editFromStepId ? steps.findIndex(step => step.id === pathway.editFromStepId) : -1;
    const optionStepSource = editIndex >= 0 ? pathway.steps.slice(0, editIndex) : pathway.steps;
    const resolvedIds = new Set();
    optionStepSource.forEach(step => step.separatedIds.forEach(id => resolvedIds.add(id)));
    const active = simulatorModel.substances.filter(item => !resolvedIds.has(item.id));
    const activeIds = new Set(active.map(item => item.id));
    const activePairs = simulatorModel.pairs.filter(pair => activeIds.has(pair.a.id) && activeIds.has(pair.b.id));
    const pairPriorities = binaryPairPriorities(groupId, activePairs, mainProduct);
    const nextOptions = pathwayOptionsForActive(groupId, simulatorModel, active, mainProduct);
    const outcome = pathwayOutcome(simulatorModel.substances, active, mainProduct, steps);
    const hasMissingEvidence = activePairs.some(pair => separationMissingForPair(pair).length > 0);
    // What is actually missing, per property and per substance, so a blocked screening can say
    // "Tb missing for X and Y" instead of repeating the outcome checks.
    const lacks = prop => active.filter(item => !Number.isFinite(parseFloat(item[prop]))).map(item => item.name);
    const propertyGaps = { tb: lacks("tb"), pvap: lacks("pvap"), tm: lacks("tm") };
    const missingEvidence = activePairs
      .map(pair => ({ pair: `${pair.a.name} / ${pair.b.name}`, missing: separationMissingForPair(pair) }))
      .filter(item => item.missing.length);
    const status = pathwayStatus(pathway, outcome, nextOptions, editIndex, hasMissingEvidence);
    const alternatives = editIndex >= 0 ? [] : generatePathwayAlternatives(groupId, simulatorModel, mainProduct);
    return {
      groupId,
      pathway,
      balance,
      mainProduct,
      steps,
      editIndex,
      editingStep: editIndex >= 0 ? steps[editIndex] : null,
      discardedSteps: editIndex >= 0 ? steps.slice(editIndex) : [],
      active,
      resolved: simulatorModel.substances.filter(item => resolvedIds.has(item.id)),
      pairPriorities,
      nextOptions,
      alternatives,
      outcome,
      unresolved: outcome.unresolved,
      propertyGaps,
      missingEvidence,
      status,
      complete: status === "complete" || status === "applied",
      canApply: status === "complete" && steps.length > 0 && editIndex < 0
    };
  }

  function pathwayOptionsForActive(groupId, simulatorModel, active, mainProduct) {
    const activeIds = new Set(active.map(item => item.id));
    const ranked = simulatorModel.pairs
      .filter(pair => activeIds.has(pair.a.id) && activeIds.has(pair.b.id))
      .flatMap(pair => binaryRouteVariants(groupId, pair)
        .filter(variant => variant.selectable !== false)
        .map(variant => {
          const split = pathwaySplitTargets(pair, variant, mainProduct);
          const separated = [...split.separated, ...phaseCompanions(simulatorModel, active, split.separated, mainProduct, variant)];
          const separatedIds = new Set(separated.map(item => item.id));
          return {
            id: `${pair.key}::${variant.id}`,
            pairKey: pair.key,
            routeId: variant.id,
            pairLabel: `${pair.a.name} / ${pair.b.name}`,
            variant,
            unit: (variant.units || []).find(unit => unit !== "Review candidate unit") || "",
            separated,
            retained: active.filter(item => !separatedIds.has(item.id)),
            directionConfidence: pathwaySplitConfidence(pair, variant, mainProduct)
          };
        }))
      .filter(option => option.separated.length && !option.separated.some(item => item.id === mainProduct?.id))
      .sort((a, b) => pathwayOptionRank(a, mainProduct) - pathwayOptionRank(b, mainProduct)
        || (Number(b.variant.strength) || 0) - (Number(a.variant.strength) || 0)
        || a.pairLabel.localeCompare(b.pairLabel));
    const firstPerTarget = [];
    const targetIds = new Set();
    ranked.forEach(option => {
      const key = option.separated.map(item => item.id).sort().join(",");
      if (!targetIds.has(key)) {
        targetIds.add(key);
        firstPerTarget.push(option);
      }
    });
    const selectedIds = new Set(firstPerTarget.map(option => option.id));
    return [...firstPerTarget, ...ranked.filter(option => !selectedIds.has(option.id))].slice(0, 10);
  }

  // A decanter splits phases, not components. Whatever is declared miscible with the phase that
  // leaves and immiscible with the product phase leaves with it: the base catalyst follows the
  // glycerol phase in the biodiesel case instead of earning a second decanter of its own. Only
  // declared miscibility insights count; nothing is inferred from properties.
  function phaseCompanions(simulatorModel, active, separated, mainProduct, variant) {
    if (!mainProduct || !/liquid-liquid/i.test(String(variant.title || ""))) return [];
    const insightFor = (a, b) => (simulatorModel.pairs.find(pair => pair.key === separationPairKey(a.id, b.id)) || {}).insights || {};
    const separatedIds = new Set(separated.map(item => item.id));
    return active.filter(item => !separatedIds.has(item.id)
      && item.id !== mainProduct.id
      && !pathwayAcceptsInProductStream(item, mainProduct)
      && insightFor(item, mainProduct).miscibilityGap === "yes"
      && separated.some(leaving => insightFor(item, leaving).miscibilityGap === "no"));
  }

  function pathwaySplitConfidence(pair, variant, mainProduct) {
    const targetPair = mainProduct && pair.components.some(item => item.id === mainProduct.id);
    if (targetPair && variant.level === "matched" && !(variant.missing || []).length) return "inferred";
    if (targetPair || variant.level === "matched") return "review";
    return "manual";
  }

  function pathwayAcceptsInProductStream(component, mainProduct) {
    if (component.id === mainProduct?.id) return true;
    return ["product", "keep with mixture", "intermediate"].includes(component.fate);
  }

  function pathwayOutcome(allSubstances, active, mainProduct, steps = []) {
    const activeIds = new Set(active.map(item => item.id));
    const separated = allSubstances.filter(item => !activeIds.has(item.id));
    const unresolved = [];
    if (!mainProduct) unresolved.push("select a main product");
    if (mainProduct && !activeIds.has(mainProduct.id)) unresolved.push("main product is not retained in the final stream");
    steps.filter(step => step.valid === false).forEach((step, index) => unresolved.push(`step ${index + 1}: route evidence is no longer valid`));
    allSubstances.filter(item => item.fate === "unknown").forEach(item => unresolved.push(`${item.name}: destination not assigned`));
    active.filter(item => !pathwayAcceptsInProductStream(item, mainProduct))
      .forEach(item => unresolved.push(`${item.name}: still present but assigned to ${item.fate || "unknown"}`));
    const resolvedSeparated = separated.filter(item => item.fate !== "unknown");
    return {
      complete: Boolean(mainProduct) && !unresolved.length,
      active,
      separated,
      resolvedSeparated,
      unresolved: [...new Set(unresolved)],
      destinationCoverage: allSubstances.length
        ? allSubstances.filter(item => item.fate !== "unknown").length / allSubstances.length
        : 0,
      stepCount: steps.length
    };
  }

  function pathwayStatus(pathway, outcome, nextOptions, editIndex = -1, hasMissingEvidence = false) {
    if (pathway.appliedAt && outcome.complete) return "applied";
    if (outcome.complete) return "complete";
    if (!outcome.active.length || !outcome.active.some(item => item.role === "product" || item.role === "coproduct")) return "not_started";
    if (editIndex >= 0 || nextOptions.length) return "in_progress";
    const missingData = outcome.active.some(item => item.phase === "unknown")
      || outcome.active.some(item => item.fate === "unknown")
      || hasMissingEvidence;
    return missingData ? "blocked_missing_data" : "blocked_no_route";
  }

  function pathwayStepFromOption(option, id) {
    return {
      id,
      pairKey: option.pairKey,
      routeId: option.routeId,
      title: option.variant.title,
      unit: option.unit,
      separatedIds: option.separated.map(item => item.id),
      retainedIds: option.retained.map(item => item.id),
      drivers: option.variant.drivers || [],
      missing: option.variant.missing || [],
      pbb: option.variant.pbb || [],
      possibleOutletPhase: option.variant.possibleOutletPhase || "",
      agentAdded: option.variant.agentAdded || "",
      translationBasis: option.variant.translationBasis || "",
      unitCandidates: option.variant.unitCandidates || [],
      evidenceLevel: option.variant.level || "partial",
      directionConfidence: option.directionConfidence || "review",
      methodSources: [...new Set((option.variant.unitCandidates || []).map(item => item.source).filter(Boolean))],
      note: option.variant.graphPreview || ""
    };
  }

  function pathwayMetrics(steps) {
    const missingChecks = steps.reduce((sum, step) => sum + (step.missing || []).length, 0);
    const routeReadySteps = steps.filter(step => step.evidenceLevel === "matched").length;
    const partialSteps = steps.filter(step => step.evidenceLevel === "partial").length;
    const hypothesisSteps = steps.filter(step => step.evidenceLevel === "hypothesis" || step.evidenceLevel === "blocked").length;
    const inferredDirectionSteps = steps.filter(step => step.directionConfidence === "inferred").length;
    const addedAgentSteps = steps.filter(step => /MSA|solvent|entrainer/i.test(step.agentAdded || "")).length;
    const thermalOperationPattern = /thermal|distill|evapor|flash|condens|crystalli|pervapor|sublim|heat|cool|reflux/i;
    const thermalExposureProxyPattern = /distill|evapor|flash|reboil|high[- ]?temperature/i;
    const thermalOperationSteps = steps.filter(step => thermalOperationPattern.test(`${step.title || ""} ${step.unit || ""}`)).length;
    const thermalExposureProxySteps = steps.filter(step => thermalExposureProxyPattern.test(`${step.title || ""} ${step.unit || ""}`)).length;
    return {
      stepCount: steps.length,
      missingChecks,
      routeReadySteps,
      partialSteps,
      hypothesisSteps,
      inferredDirectionSteps,
      addedAgentSteps,
      thermalOperationSteps,
      thermalExposureProxySteps
    };
  }

  function comparePathwayAlternatives(a, b, profile) {
    const completeOrder = Number(b.status === "complete") - Number(a.status === "complete");
    if (completeOrder) return completeOrder;
    const routeReadyShare = item => item.metrics.stepCount ? item.metrics.routeReadySteps / item.metrics.stepCount : 0;
    const fields = profile === "msa"
      ? [["addedAgentSteps", 1], ["missingChecks", 1], ["thermalExposureProxySteps", 1], ["stepCount", 1]]
      : profile === "thermal-proxy"
        ? [["thermalExposureProxySteps", 1], ["missingChecks", 1], ["addedAgentSteps", 1], ["stepCount", 1]]
        : [["missingChecks", 1], ["hypothesisSteps", 1], ["partialSteps", 1], ["addedAgentSteps", 1], ["stepCount", 1]];
    if (profile === "evidence") {
      const coverageOrder = routeReadyShare(b) - routeReadyShare(a);
      if (coverageOrder) return coverageOrder;
    }
    for (const [field, direction] of fields) {
      const order = (a.metrics[field] - b.metrics[field]) * direction;
      if (order) return order;
    }
    return 0;
  }

  function generatePathwayAlternatives(groupId, simulatorModel, mainProduct, limit = 3) {
    if (!mainProduct || simulatorModel.substances.length < 2) return [];
    const maxDepth = Math.min(Math.max(1, simulatorModel.substances.length - 1), 8);
    let frontier = [{ active: simulatorModel.substances, steps: [] }];
    const candidates = [];
    for (let depth = 0; depth < maxDepth && frontier.length; depth += 1) {
      const expanded = [];
      frontier.forEach((state, stateIndex) => {
        const options = pathwayOptionsForActive(groupId, simulatorModel, state.active, mainProduct).slice(0, 6);
        if (!options.length) candidates.push(state);
        options.forEach((option, optionIndex) => {
          const step = pathwayStepFromOption(option, `ALT${depth + 1}-${stateIndex + 1}-${optionIndex + 1}`);
          const next = { active: option.retained, steps: [...state.steps, step] };
          const outcome = pathwayOutcome(simulatorModel.substances, next.active, mainProduct, next.steps);
          if (outcome.complete) candidates.push(next);
          else expanded.push(next);
        });
      });
      const seen = new Set();
      frontier = expanded
        .sort((a, b) => pathwayMetrics(a.steps).missingChecks - pathwayMetrics(b.steps).missingChecks
          || comparePathwayAlternatives(
            { metrics: pathwayMetrics(a.steps), status: "incomplete" },
            { metrics: pathwayMetrics(b.steps), status: "incomplete" },
            "evidence"
          ))
        .filter(item => {
          const signature = `${item.active.map(component => component.id).sort().join(",")}::${item.steps.map(step => step.routeId).join("|")}`;
          if (seen.has(signature)) return false;
          seen.add(signature);
          return true;
        })
        .slice(0, 24);
    }
    candidates.push(...frontier);
    const prepared = candidates
      .filter(item => item.steps.length)
      .map((item, index) => {
        const outcome = pathwayOutcome(simulatorModel.substances, item.active, mainProduct, item.steps);
        return {
          id: `PA${index + 1}`,
          status: outcome.complete ? "complete" : "incomplete",
          steps: item.steps,
          active: item.active,
          outcome,
          metrics: pathwayMetrics(item.steps)
        };
      });
    const profiles = [["evidence", "Most complete KB3.1 match"]];
    if (new Set(prepared.map(item => item.metrics.addedAgentSteps)).size > 1) profiles.push(["msa", "Lowest MSA use"]);
    if (new Set(prepared.map(item => item.metrics.thermalExposureProxySteps)).size > 1) profiles.push(["thermal-proxy", "Fewer thermal separation steps"]);
    const chosen = [];
    const signatures = new Set();
    profiles.forEach(([profile, label]) => {
      const candidate = [...prepared].sort((a, b) => comparePathwayAlternatives(a, b, profile))
        .find(item => {
          const signature = item.steps.map(step => `${step.routeId}:${step.separatedIds.join(",")}`).join("|");
          return !signatures.has(signature);
        });
      if (!candidate) return;
      const signature = candidate.steps.map(step => `${step.routeId}:${step.separatedIds.join(",")}`).join("|");
      signatures.add(signature);
      chosen.push({ ...candidate, id: `PA${chosen.length + 1}`, label, profile });
    });
    [...prepared]
      .sort((a, b) => comparePathwayAlternatives(a, b, "evidence"))
      .forEach(candidate => {
        if (chosen.length >= limit) return;
        const signature = candidate.steps.map(step => `${step.routeId}:${step.separatedIds.join(",")}`).join("|");
        if (signatures.has(signature)) return;
        signatures.add(signature);
        chosen.push({ ...candidate, id: `PA${chosen.length + 1}`, label: "Other screened candidate", profile: "alternative" });
      });
    return chosen.slice(0, limit);
  }

  function binaryPairPriorities(groupId, pairs, mainProduct) {
    return pairs.map(pair => {
      const variants = binaryRouteVariants(groupId, pair)
        .filter(variant => variant.selectable !== false)
        .sort((a, b) => suggestionLevelRank(a.level) - suggestionLevelRank(b.level) || a.missing.length - b.missing.length || a.title.localeCompare(b.title));
      const best = variants[0] || null;
      const mainId = mainProduct?.id || "";
      const touchesMain = mainId && (pair.a.id === mainId || pair.b.id === mainId);
      const opposite = touchesMain ? (pair.a.id === mainId ? pair.b : pair.a) : null;
      const roleWeight = touchesMain && opposite?.role === "reactant" ? 3
        : touchesMain && opposite && opposite.role !== "product" ? 2
          : touchesMain ? 1
            : 0;
      const priority = best && roleWeight >= 2 && best.level === "matched" ? "high"
        : best && (roleWeight >= 1 || best.level === "matched") ? "medium"
          : best ? "low"
            : "needs data";
      const noMatch = separationSuggestionsForPair(pair).find(item => item.ruleId === "NO-KB3.1-MATCH");
      return {
        pairKey: pair.key,
        pairLabel: `${pair.a.name} / ${pair.b.name}`,
        priority,
        roleWeight,
        mainProductPair: Boolean(touchesMain),
        bestRoute: best ? best.title : "",
        bestUnit: best ? (best.units || []).find(unit => unit !== "Review candidate unit") || "" : "",
        level: best ? best.level : noMatch?.level || "blocked",
        pbb: best ? best.pbb || [] : [],
        possibleOutletPhase: best ? best.possibleOutletPhase || "" : "",
        agentAdded: best ? best.agentAdded || "" : "",
        translationBasis: best ? best.translationBasis || "" : "",
        unitCandidates: best ? best.unitCandidates || [] : [],
        drivers: best ? best.drivers || [] : [],
        missing: best ? best.missing || [] : noMatch?.missing || separationMissingForPair(pair),
        reason: best
          ? `${touchesMain ? "separates a non-product from the selected main product" : "secondary pair after product-facing cuts"}; ${best.graphPreview}`
          : "no selectable route has passed the Lutze/KB3.1 gate yet"
      };
    }).sort((a, b) => b.roleWeight - a.roleWeight
      || suggestionLevelRank(a.level) - suggestionLevelRank(b.level)
      || a.missing.length - b.missing.length
      || a.pairLabel.localeCompare(b.pairLabel));
  }

  function pathwayOptionRank(option, mainProduct) {
    const mainId = mainProduct?.id || "";
    const separatesReactantFromMain = mainId
      && option.retained.some(item => item.id === mainId)
      && option.separated.some(item => item.role === "reactant");
    const separatesNonProductFromMain = mainId
      && option.retained.some(item => item.id === mainId)
      && option.separated.some(item => item.id !== mainId);
    const roleRank = separatesReactantFromMain ? 0 : separatesNonProductFromMain ? 1 : 2;
    const evidenceRank = suggestionLevelRank(option.variant.level);
    const missingRank = (option.variant.missing || []).length;
    return roleRank * 100 + evidenceRank * 10 + missingRank;
  }

  function pathwaySplitTargets(pair, variant, mainProduct) {
    const mainId = mainProduct?.id || "";
    let separated = [];
    let retained = [];
    if (mainId && pair.a.id === mainId) {
      separated = [pair.b];
      retained = [pair.a];
    } else if (mainId && pair.b.id === mainId) {
      separated = [pair.a];
      retained = [pair.b];
    } else {
      const title = String(variant.title || "").toLowerCase();
      let first = pair.a;
      if (/volatility|thermal|distill|evapor|flash|v-l/.test(title)) first = preferredVolatileComponent(pair);
      else if (/crystall/.test(title)) first = preferredSolidComponent(pair);
      else if (/affinity|size|membrane|selective/.test(title)) first = preferredLargeComponent(pair);
      separated = [first];
      retained = [first.id === pair.a.id ? pair.b : pair.a];
    }
    return {
      separated,
      retained
    };
  }

  root.ProcessUpscalingSeparationCore = {
    substanceRoles,
    substanceFates,
    binaryInsightOptions,
    thermalOptions,
    purePropertyDefs,
    kbRules,
    kb32UnitOperationRules,
    normalizeLookupSummary,
    normalizeReactionBalance,
    normalizeSeparationSubstance,
    normalizeSeparationSimulator,
    normalizeSeparationPathway,
    nextSeparationSubstanceId,
    separationSimulatorModel,
    separationSimulatorReadiness,
    separationPairModel,
    separationPairKey,
    propertyRatio,
    temperatureToKelvin,
    vaporPressureConditionCheck,
    numberFromText,
    formatRatio,
    separationSuggestionsForPair,
    suggestionIsSelectable,
    binaryMathForRule,
    binaryRuleComparisons,
    thresholdMet,
    comparisonStrength,
    pairHasAnyData,
    separationMissingForPair,
    separationMissingForSuggestion,
    routeEligibilityForRule,
    routeFamilyForRule,
    unitOperationCandidatesForRule,
    possibleFeedPhaseForRule,
    possibleOutletPhaseForRule,
    agentAddedForRule,
    routeFamilyCompatibility,
    reactionBalanceModel,
    mainProductRow,
    reactionConversionFraction,
    reactionSelectivityFraction,
    reactionYieldFraction,
    reactionBalanceRow,
    reactionMixtureRow,
    workupPlanModel,
    matchingSuggestionUnits,
    workupStep,
    binaryRouteVariants,
    routeMathSummary,
    strongestSuggestionLevel,
    suggestionLevelRank,
    prioritizedUnits,
    uniqueUnitCandidates,
    combinedOutletPhase,
    combinedAgentAdded,
    uniqueFlat,
    preferredVolatileComponent,
    preferredSolidComponent,
    preferredLargeComponent,
    routeVariantId,
    routeVariantPhenomena,
    routeVariantBehavior,
    separationPathwayModel,
    pathwayOptionsForActive,
    pathwaySplitConfidence,
    pathwayAcceptsInProductStream,
    pathwayOutcome,
    pathwayStatus,
    pathwayStepFromOption,
    pathwayMetrics,
    comparePathwayAlternatives,
    generatePathwayAlternatives,
    binaryPairPriorities,
    pathwayOptionRank,
    pathwaySplitTargets
  };
})(globalThis);
