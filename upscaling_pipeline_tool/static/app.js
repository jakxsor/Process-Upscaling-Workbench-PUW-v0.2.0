    const sampleText = `Charge 1.82 kg of benzophenone, 1.97 kg of 2-ethylhexyl cyanoacetate, 0.15 kg of ammonium acetate catalyst, and 3.50 kg of cyclohexane to a stirred jacketed reactor fitted with a reflux condenser and a Dean-Stark trap. Heat the stirred mixture to reflux at 85 C. Maintain reflux for 18 to 24 h, removing the water formed by the Knoevenagel condensation azeotropically until no further water separates in the Dean-Stark trap. Cool the crude reaction mixture to 40 C. Wash the organic phase with 2.0 kg of water in two counter-current stages, allowing the phases to settle after each contact. Separate and discard the aqueous layer. Dry the washed organic phase over molecular sieves until the water content is below 0.1 percent. Evaporate the cyclohexane under vacuum at 100 to 200 mbar in a thin-film evaporator and recover the condensed solvent for reuse. Purify the crude octocrylene by short-path distillation at 1.5 mbar, collecting purified octocrylene of at least 98 percent purity as final product and sending heavy residues to disposal. [Industrial addition, no laboratory counterpart] Route the cyclohexane-rich vapor purge from the reactor and evaporator to a vent abatement train with a condenser and activated-carbon polishing, returning the recovered VOC by temperature-swing adsorption to the cyclohexane recovery column. [Industrial addition, no laboratory counterpart] Feed the recovered cyclohexane condensate to a dedicated solvent-recovery column and return the purified cyclohexane to the feed stage. [Industrial addition, no laboratory counterpart] Route the aqueous wash effluent and reaction water to an on-site wastewater treatment interface for neutralization and off-site discharge.`;
    // Screening heuristic, not a sourced engineering constant: a task must beat the next-longest task
    // by both an absolute margin (avoids flagging noise-level gaps on short processes, e.g. 0.1h ahead
    // of 0.05h) and a relative margin (avoids flagging trivial % differences on long processes) before
    // it is called a "critical" bottleneck instead of a "balanced" schedule. Not currently user-adjustable.
    const bottleneckThresholds = {
      minGapH: 1,
      minGapPercent: 15
    };

    const phenomenaOptions = [
      "M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LL)", "2phM(VS)", "2phM(LS)",
      "PC(VL)", "PC(LL)", "PC(VS)", "PC(LS)",
      "PT(VL)", "PT(LL)", "PT(VS)", "PT(LS)", "PT(MVL)", "PT(MLL)", "PT(MVV)",
      "PCh(V->L)", "PCh(L->V)", "PCh(L->S)", "PCh(S->L)",
      "PS(VL)", "PS(LL)", "PS(VS)", "PS(LS)", "PS(VV)",
      "R(L)", "R(V)", "R(S)",
      "ES(H)", "ES(C)", "ES(P)", "ES(E)", "ES(D)",
      "SD"
    ];

    const phenomenonGlossary = {
      "M(L)": "Mixing in liquid phase. Use this when the block requires homogenization, stirring, dilution, or controlled liquid addition.",
      "M(V)": "Mixing or flow-pattern control within a vapor phase.",
      "M(S)": "Solid handling or solid-phase mixing.",
      "2phM(VL)": "Two-phase mixing, vapor-liquid. Relevant for sparging, boiling contact, stripping, or reflux contact.",
      "2phM(LS)": "Two-phase mixing, liquid-solid. Relevant when solids, catalysts, salts, drying agents, or suspended particles contact a liquid.",
      "2phM(LL)": "Two-phase mixing, liquid-liquid. Relevant for washing, extraction, emulsion risk, or mass transfer between immiscible liquids.",
      "2phM(VS)": "Two-phase mixing, vapor-solid. Relevant for gas-solid contacting or solid exposure to vapor.",
      "R(L)": "Reaction in liquid phase. Use this when chemical transformation occurs primarily in the liquid bulk.",
      "R(V)": "Reaction in vapor phase. Use this when transformation occurs mainly through gaseous or vapor-phase species.",
      "R(S)": "Reaction involving a solid phase or solid-state transformation.",
      "ES(H)": "Energy supply, heating. Covers heat-up, reflux duty, evaporation duty, or maintaining a hot operating window.",
      "ES(C)": "Energy supply, cooling. Covers cool-down, quenching, condensation duty, or removal of heat for control.",
      "ES(P)": "Energy supply for pressurization or compression.",
      "ES(E)": "Energy release or expansion work.",
      "ES(D)": "Direct or special energy input such as microwave or ultrasound.",
      "PT(VL)": "Phase transition, vapor-liquid. Relevant for boiling, evaporation, condensation, reflux, or solvent removal.",
      "PT(LL)": "Phase transfer, liquid-liquid. Relevant when a solute moves between two liquid phases during washing or extraction.",
      "PT(VS)": "Phase transition, vapor-solid. Relevant for sublimation, desublimation, or vapor-solid uptake.",
      "PT(LS)": "Phase transition, liquid-solid. Relevant for crystallization, precipitation, dissolution, or solid formation from liquid.",
      "PT(MVL)": "Membrane-mediated vapor-liquid transfer.",
      "PT(MLL)": "Membrane-mediated liquid-liquid transfer.",
      "PT(MVV)": "Membrane-mediated vapor-vapor transfer.",
      "PCh(V->L)": "Whole-stream phase change from vapor to liquid, such as full condensation.",
      "PCh(L->V)": "Whole-stream phase change from liquid to vapor, such as evaporation.",
      "PCh(L->S)": "Whole-stream phase change from liquid to solid, such as freezing or solidification.",
      "PCh(S->L)": "Whole-stream phase change from solid to liquid, such as melting.",
      "PC(VL)": "Phase contact, vapor-liquid. Relevant for vapor-liquid contacting, condensation, stripping, scrubbing, or reflux.",
      "PC(LL)": "Phase contact, liquid-liquid. Relevant when two liquid phases must contact effectively before separation.",
      "PC(VS)": "Phase contact, vapor-solid. Relevant for gas-solid contact, adsorption, or drying contact.",
      "PC(LS)": "Phase contact, liquid-solid. Relevant for adsorption, drying salts, catalyst contact, or solid treatment of a liquid stream.",
      "PS(LL)": "Phase separation, liquid-liquid. Relevant for settling, decanting, interface control, or organic/aqueous split.",
      "PS(LS)": "Phase separation, liquid-solid. Relevant for filtration, cake removal, drying-agent removal, or slurry clarification.",
      "PS(VL)": "Phase separation, vapor-liquid. Relevant for condensers, decanters, vents, evaporation outlets, or vapor/liquid disengagement.",
      "PS(VS)": "Phase separation, vapor-solid. Relevant for dust removal, desublimation solids, or gas-solid disengagement.",
      "PS(VV)": "Phase separation, vapor-vapor. Relevant for vapor permeation or vapor stream split after membrane transfer.",
      "SD": "Stream dividing. Splitting a stream into two or more branches without changing temperature, pressure, or composition."
    };

    const behaviorPresets = {
      "unassigned": { task: "unassigned", phenomena: [], description: "Temporary state when the block purpose is not clear yet; no phenomena are assigned." },
      "charge and mix": { task: "reaction preparation", phenomena: ["M(L)", "2phM(LS)"], description: "Use for charging, dissolving, pre-mixing, or dosing feeds before the main transformation." },
      "heat/cool": { task: "thermal conditioning", phenomena: ["ES(H)", "ES(C)"], description: "Use when the block mainly changes or holds temperature without a standalone reaction or separation." },
      "reaction": { task: "reaction", phenomena: ["M(L)", "R(L)", "ES(H)"], description: "Use for product-forming chemical transformation with mixing and possible heat duty." },
      "reaction with in-situ removal": { task: "reaction", phenomena: ["M(L)", "R(L)", "ES(H)", "PT(VL)", "PS(VL)"], description: "Use when reaction and removal of a by-product/phase happen together, such as reflux or Dean-Stark water removal." },
      "liquid-liquid wash": { task: "washing", phenomena: ["2phM(LL)", "PT(LL)", "PS(LL)"], description: "Use for liquid-liquid contacting, extraction, washing, settling, decanting, or phase split." },
      "solid-liquid drying": { task: "drying", phenomena: ["PC(LS)", "PS(LS)"], description: "Use when a solid contacts or removes liquid/water, such as molecular sieves or drying agents." },
      "filtration": { task: "solid-liquid separation", phenomena: ["PS(LS)"], description: "Use for separating solids from liquid by filtration, clarification, or related solid-liquid split." },
      "solvent evaporation": { task: "solvent removal", phenomena: ["ES(H)", "PT(VL)", "PS(VL)"], description: "Use for evaporating/removing volatile solvent, especially with condenser or vacuum evidence." },
      "distillation purification": { task: "purification", phenomena: ["ES(H)", "PT(VL)", "PS(VL)"], description: "Use for vapor-liquid purification where volatility difference drives product/impurity separation." },
      "solvent recovery distillation": { task: "solvent recovery", phenomena: ["M(L)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"], description: "Use for a dedicated recovery column or solvent purification loop added during scale-up." },
      "vent gas treatment": { task: "vent abatement", phenomena: ["PT(VL)", "PS(VL)", "PC(VS)", "ES(C)"], description: "Use for condenser, adsorption, TSA, or polishing operations handling VOC vents." },
      "vent abatement": { task: "vent abatement", phenomena: ["PC(VL)", "PS(VL)"], description: "Use for vapor capture, condensation, adsorption, or treatment of emission/vent streams." },
      "wastewater interface": { task: "wastewater treatment", phenomena: ["PS(LL)"], description: "Use for aqueous waste routing, neutralization, or environmental boundary treatment." },
      "wastewater treatment": { task: "wastewater treatment", phenomena: ["M(L)", "R(L)"], description: "Use for neutralization or wastewater boundary treatment added to close waste handling." }
    };

    const unitCatalog = [
      { task: "reaction preparation", name: "Feed tank and dosing skid", feedPhases: ["L", "S", "LS"], phenomena: ["M(L)", "M(S)", "2phM(LS)"], outlet: "prepared feed", rationale: "Use for charging, pre-mixing, and controlled dosing before a reaction or downstream operation." },
      { task: "reaction preparation", name: "Inline/static mixer", feedPhases: ["L", "LL", "VL", "LS"], phenomena: ["M(L)", "2phM(LL)", "2phM(VL)", "2phM(LS)"], outlet: "mixed feed", rationale: "Use when the main task is homogenization or contact before another unit, not chemical conversion." },
      { task: "thermal conditioning", name: "Jacketed vessel heat/cool step", feedPhases: ["L", "S", "LS", "VL"], phenomena: ["ES(H)", "ES(C)"], outlet: "thermally conditioned stream", rationale: "Use when the operation is only heating, cooling, or holding temperature without reaction or separation duty." },
      { task: "thermal conditioning", name: "External loop heat exchanger", feedPhases: ["L", "VL"], phenomena: ["M(L)", "ES(H)", "ES(C)"], outlet: "temperature-controlled recirculating stream", rationale: "Use when scale-up may need higher heat-transfer area than a simple jacket provides." },
      { task: "thermal conditioning", name: "Condenser / cooler", feedPhases: ["V", "VL"], phenomena: ["ES(C)", "PCh(V->L)", "PT(VL)", "PS(VL)"], outlet: "cooled liquid or vapor-liquid outlet", rationale: "Use when cooling includes vapor condensation or reflux handling." },
      { task: "thermal conditioning", name: "Reboiler / heater", feedPhases: ["L", "VL"], phenomena: ["ES(H)", "PCh(L->V)", "PT(VL)"], outlet: "heated liquid or vapor-liquid outlet", rationale: "Use when heating includes vapor generation, reflux, or boil-up duty." },
      { task: "reaction", name: "Batch / semi-batch reactor", feedPhases: ["S", "V", "L", "VL", "LS", "VS"], phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(VS)", "R(L)", "R(V)", "R(S)", "ES(H)", "ES(C)"], outlet: "reaction outlet", rationale: "Industrial reactor class for batch or semi-batch transformation with optional multiphase mixing and heat removal/addition." },
      { task: "reaction", name: "Continuous stirred-tank reactor (CSTR)", feedPhases: ["L"], phenomena: ["M(L)", "R(L)", "ES(H)", "ES(C)"], outlet: "liquid outlet", rationale: "Continuous liquid-phase reaction option when residence time and mixing are compatible." },
      { task: "reaction", name: "Tubular reactor (PFR)", feedPhases: ["V"], phenomena: ["M(V)", "R(V)", "ES(H)", "ES(C)"], outlet: "vapor outlet", rationale: "Vapor-phase reactor class." },
      { task: "reaction", name: "Packed-bed reactor", feedPhases: ["S", "V", "VS"], phenomena: ["M(V)", "M(S)", "2phM(VS)", "R(V)", "R(S)", "ES(H)", "ES(C)"], outlet: "reacted outlet", rationale: "Industrial reactor class for solid/vapor contacting or packed catalyst systems." },
      { task: "wastewater treatment", name: "Wastewater treatment interface", feedPhases: ["L", "LL"], phenomena: ["M(L)", "2phM(LL)", "R(L)", "PC(LL)", "PS(LL)"], outlet: "treated aqueous discharge", rationale: "Boundary unit for neutralization, aqueous waste routing, and treatment interfaces that are not product-forming reactors." },
      { task: "separation", name: "Partial condensation / vaporization", feedPhases: ["V", "L", "VL"], phenomena: ["M(V)", "M(L)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"], outlet: "V or L depending on direction", rationale: "Industrial separation class for partial V/L phase change and disengagement." },
      { task: "separation", name: "Flash vaporization", feedPhases: ["L"], phenomena: ["M(L)", "PT(VL)", "PS(VL)"], outlet: "V + residual L", rationale: "Liquid feed vaporization option." },
      { task: "separation", name: "Distillation", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"], outlet: "V + L", rationale: "Vapor-liquid separation by staged contact, transition, and separation." },
      { task: "separation", name: "Extractive distillation", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"], outlet: "V + L", rationale: "Distillation variant with added separating agent." },
      { task: "separation", name: "Azeotropic distillation", feedPhases: ["V", "L", "VL", "LL"], phenomena: ["M(L)", "M(V)", "PC(VL)", "PT(VL)", "PS(VL)", "PC(LL)", "PS(LL)", "ES(H)", "ES(C)"], outlet: "V + L, possible LL", rationale: "Distillation variant where a liquid-liquid split can appear." },
      { task: "separation", name: "Absorption (gas absorption)", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "PT(VL)", "PS(VL)", "PC(VL)"], outlet: "enriched liquid outlet", rationale: "Gas absorption class." },
      { task: "separation", name: "Reboiled absorption", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)"], outlet: "V + L", rationale: "Absorption with reboiler duty." },
      { task: "separation", name: "Stripping", feedPhases: ["L"], phenomena: ["M(L)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)"], outlet: "vapor product", rationale: "Liquid feed stripping option." },
      { task: "separation", name: "Steam distillation", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(C)"], outlet: "V and/or L", rationale: "Steam distillation class." },
      { task: "separation", name: "Liquid-liquid extraction", feedPhases: ["L", "LL"], phenomena: ["M(L)", "PC(LL)", "PT(LL)", "PS(LL)"], outlet: "two liquid phases", rationale: "Liquid-liquid extraction class." },
      { task: "separation", name: "Decanter", feedPhases: ["L", "LL"], phenomena: ["M(L)", "PC(LL)", "PS(LL)"], outlet: "two liquid outlets", rationale: "Physical liquid-liquid disengagement class." },
      { task: "separation", name: "Evaporation", feedPhases: ["L"], phenomena: ["M(L)", "PT(VL)", "PS(VL)", "ES(H)"], outlet: "vapor + residual L", rationale: "Evaporation class." },
      { task: "separation", name: "Crystallization", feedPhases: ["L"], phenomena: ["M(L)", "PT(LS)", "PS(LS)", "ES(C)", "ES(H)"], outlet: "solid + mother liquor", rationale: "Liquid-to-solid separation class." },
      { task: "separation", name: "Desublimation", feedPhases: ["V"], phenomena: ["M(V)", "PT(VS)", "PS(VS)", "ES(C)"], outlet: "solid", rationale: "Vapor-to-solid separation class." },
      { task: "separation", name: "Drying", feedPhases: ["L", "S", "LS"], phenomena: ["M(L)", "M(S)", "PC(LS)", "PT(VL)", "PS(VL)", "ES(H)"], outlet: "vapor product", rationale: "Drying class for liquid/solid systems." },
      { task: "separation", name: "Microwave drying", feedPhases: ["S", "L", "LS"], phenomena: ["M(S)", "M(L)", "PC(LS)", "PT(VL)", "PS(VL)", "ES(D)"], outlet: "vapor product", rationale: "Drying variant with direct/special energy input." },
      { task: "separation", name: "Dividing wall column", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"], outlet: "V + L", rationale: "Intensified distillation class." },
      { task: "reaction + separation", name: "Reactive distillation", feedPhases: ["V", "L", "VL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "R(L)", "R(V)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"], outlet: "V + L", rationale: "Integrated reaction and vapor-liquid separation class." },
      { task: "separation", name: "Membrane pervaporation", feedPhases: ["V", "L", "VL", "MVL"], phenomena: ["M(L)", "M(V)", "PT(MVL)", "PS(VL)"], outlet: "permeate/retentate liquid context", rationale: "Membrane-mediated vapor-liquid transfer class." },
      { task: "separation", name: "Membrane vapor permeation", feedPhases: ["V", "MVV", "VV"], phenomena: ["M(V)", "PT(MVV)", "PS(VV)"], outlet: "vapor streams", rationale: "Membrane-mediated vapor-vapor separation class." },
      { task: "reaction + separation", name: "Membrane (pervaporation) reactor", feedPhases: ["V", "L", "VL", "MVL"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "R(L)", "R(V)", "PT(MVL)", "ES(H)", "ES(C)"], outlet: "V + L", rationale: "Reaction class integrated with membrane pervaporation." },
      { task: "reaction + separation", name: "Membrane-reactive distillation", feedPhases: ["V", "L", "VL", "LL", "MVL", "MLL", "MVV"], phenomena: ["M(L)", "M(V)", "2phM(VL)", "R(L)", "R(V)", "PC(VL)", "PT(VL)", "PS(VL)", "PT(MVL)", "PT(MVV)", "PT(MLL)", "PS(LL)", "PS(VV)", "ES(H)", "ES(C)"], outlet: "V + L", rationale: "Intensified reaction-separation class combining reactive distillation and membrane transfer." }
    ].map((unit, index) => ({ id: `UO${index + 1}`, source: "industrial-unit-operation-catalog", ...unit }));

    const streamRoles = {
      input: { title: "Inputs", addLabel: "+ Input", placeholder: "benzophenone", empty: "No feed stream yet." },
      output: { title: "Outputs", addLabel: "+ Output", placeholder: "reaction mixture", empty: "No product/intermediate stream yet." },
      waste: { title: "Waste / Emissions", addLabel: "+ Waste", placeholder: "brine waste", empty: "No waste or emission stream yet." }
    };
    const streamOutletMeta = {
      title: "Outlets",
      addLabel: "+ Outlet",
      placeholder: "product, recovered solvent, purge...",
      empty: "No product, recovery, waste, or emission outlet yet."
    };
    const streamEditorSections = ["input", "outlet"];
    const outletRoles = ["output", "waste"];
    const wasteFates = new Set(["purge", "vent", "wastewater", "solid waste", "loss", "unreacted reagent"]);
    const productFates = new Set(["product", "co-product"]);
    const recycleFates = new Set(["recycled input", "recovered solvent"]);

    const streamUnits = ["kg", "g", "t", "mol", "kmol", "L", "mL", "m3", "kg/kg product", "L/kg product", "%", "ppm"];
    const streamScalingModes = [
      "auto",
      "per kg product",
      "per batch",
      "recycle loop",
      "fixed loss %",
      "manual"
    ];

    const heuristicRuleLibrary = [
      { id: "H01", area: "reaction path", title: "Avoid hazardous route inventory", tags: ["hazard", "reaction"], severity: "medium", recommendation: "Prefer routes and operating policies that reduce toxic or hazardous storage and residence inventory." },
      { id: "H02", area: "reaction distribution", title: "Use excess reactant selectively", tags: ["reaction", "selectivity"], severity: "low", recommendation: "Consider excess of a less critical reactant when it helps consume a valuable, toxic, or hazardous reactant." },
      { id: "H03", area: "inerts", title: "Remove inerts when beneficial", tags: ["inert", "reaction", "separation"], severity: "low", recommendation: "Remove inerts before reaction when easy or catalyst-protective, unless they help absorb a large heat release." },
      { id: "H04", area: "purge", title: "Provide exits for accumulating species", tags: ["purge", "recycle", "accumulation"], severity: "medium", recommendation: "Add purge or drag streams for trace inerts, impurities, or side-products that would otherwise build up." },
      { id: "H05", area: "purge", title: "Do not purge valuable or hazardous species", tags: ["purge", "hazard", "valuable"], severity: "medium", recommendation: "Recover valuable species with separators and treat hazardous species rather than losing them in purge streams." },
      { id: "H06", area: "reversible byproducts", title: "Recycle reversible byproducts", tags: ["reversible", "recycle", "reaction"], severity: "low", recommendation: "For reversible byproducts, prefer recycle to extinction over direct purge when chemically plausible." },
      { id: "H07", area: "selectivity", title: "Tune operating window for selectivity", tags: ["reaction", "selectivity", "condition"], severity: "medium", recommendation: "Use temperature, pressure, and catalyst choices to favor the desired reaction path; request kinetics before locking the base case." },
      { id: "H08", area: "reaction-separation", title: "Drive reversible reactions by removal", tags: ["reversible", "reaction", "separation", "vl", "ll"], severity: "medium", recommendation: "For reversible or equilibrium-limited reactions, consider integrated product removal such as decanting, distillation, membrane removal, or stripping." },
      { id: "H09", area: "liquid separation", title: "Rank liquid-mixture separations", tags: ["liquid_separation", "ll", "vl"], severity: "low", recommendation: "For liquid mixtures, compare distillation, stripping, extraction, crystallization, adsorption, and related liquid-separation choices." },
      { id: "H10", area: "vapor-liquid separation", title: "Try condensation before complex vapor separation", tags: ["vapor", "vl", "cooling"], severity: "low", recommendation: "For vapor mixtures, first assess whether cooling-water condensation can create a simpler liquid separation problem." },
      { id: "H11", area: "vapor separation", title: "Rank vapor-mixture separations", tags: ["vapor", "gas_separation"], severity: "low", recommendation: "For vapor mixtures, compare partial condensation, absorption, adsorption, cryogenic separation, membranes, and related vapor-separation choices." },
      { id: "H12", area: "crystallization", title: "Crystallize inorganic solutes from concentrated solutions", tags: ["crystallization", "solid_liquid"], severity: "low", recommendation: "When dissolved inorganic material dominates, check whether crystallization is the practical separation route." },
      { id: "H13", area: "crystallization", title: "Control crystal size with supersaturation path", tags: ["crystallization", "solid_liquid", "condition"], severity: "low", recommendation: "When crystals are formed, record cooling/evaporation path, seed policy, and residence time because they control size and filtration behavior." },
      { id: "H14", area: "melt crystallization", title: "Use melt crystallization for suitable organics", tags: ["crystallization", "organic", "solid_liquid"], severity: "low", recommendation: "For organic separations with favorable melting behavior, include melt crystallization as an alternative to distillation." },
      { id: "H15", area: "solid-liquid separation", title: "Filter or settle solid-liquid systems", tags: ["solid_liquid", "filtration"], severity: "medium", recommendation: "For liquid-solid mixtures, check filtration, sedimentation, centrifugation, or clarification before assigning a generic separator." },
      { id: "H16", area: "solid washing", title: "Account for cake washing", tags: ["solid_liquid", "washing"], severity: "low", recommendation: "When solids are retained, include cake washing or displacement if soluble impurities materially affect product or waste." },
      { id: "H17", area: "drying", title: "Dry solids with moisture basis", tags: ["drying", "solid_liquid"], severity: "medium", recommendation: "For wet solids, require moisture loading, final moisture target, and drying mode before energy handoff." },
      { id: "H18", area: "particle separation", title: "Use particle properties for solids decisions", tags: ["solid_particle", "solid_liquid"], severity: "low", recommendation: "For solids handling, request particle size, density, shape, and cake behavior before choosing equipment." },
      { id: "H19", area: "adsorption", title: "Use adsorbents when selective uptake is dominant", tags: ["adsorption", "solid_liquid", "vapor"], severity: "low", recommendation: "When impurity removal is by selective uptake on a solid, model adsorbent capacity, regeneration, and breakthrough." },
      { id: "H20", area: "membranes", title: "Use membranes only with compatible driving force", tags: ["membrane", "separation"], severity: "low", recommendation: "For membrane alternatives, require phase pair, selectivity, driving force, fouling risk, and retentate/permeate fate." },
      { id: "H21", area: "exothermic reactor", title: "Manage highly exothermic reactions early", tags: ["exotherm", "reaction", "cooling"], severity: "high", recommendation: "For high heat release, consider excess reactant, inert diluent, cold shots, staged addition, or other distribution changes before finalizing the network." },
      { id: "H22", area: "exothermic reactor", title: "Use conventional cooling for milder exotherms", tags: ["reaction", "cooling", "heat_exchange"], severity: "medium", recommendation: "For lower heat release, compare jacket, coils, external loop cooler, and intercooling." },
      { id: "H23", area: "endothermic reactor", title: "Manage highly endothermic reactions early", tags: ["endotherm", "reaction", "heating"], severity: "medium", recommendation: "For high heat demand, consider excess reactant, inert heat carrier, hot shots, staged heating, or distribution changes." },
      { id: "H24", area: "endothermic reactor", title: "Use conventional heating for milder endotherms", tags: ["reaction", "heating", "heat_exchange"], severity: "low", recommendation: "For lower heat demand, compare jacket, coils, external loop heater, and interheaters." },
      { id: "H25", area: "heat exchange", title: "Prefer external heat exchange when not intrinsic", tags: ["heat_exchange", "heating", "cooling"], severity: "low", recommendation: "Unless heat exchange is intrinsic to a reactor or separator, handle process-stream heating/cooling in dedicated exchangers or utilities." },
      { id: "H26", area: "heat exchange", title: "Check temperature approach", tags: ["heat_exchange"], severity: "low", recommendation: "Record the minimum approach temperature assumption before using heat recovery or utility duties." },
      { id: "H27", area: "cooling utilities", title: "Use cooling water where feasible", tags: ["cooling", "condensation", "vl"], severity: "low", recommendation: "When cooling or condensation is required, test cooling-water feasibility before refrigeration or special utilities." },
      { id: "H28", area: "boiling", title: "Boil close-boiling liquids in dedicated exchangers", tags: ["boiling", "vl", "heating"], severity: "low", recommendation: "For boiling pure or close-boiling streams, separate exchanger design and allowable flux from the main process task." },
      { id: "H29", area: "furnace", title: "Use fired heating only when temperature demands it", tags: ["high_temperature", "heating"], severity: "medium", recommendation: "Escalate from exchangers/steam/oil to fired heating only when required temperature or duty makes it necessary." },
      { id: "H30", area: "thermal utility", title: "Select utility level explicitly", tags: ["heating", "cooling", "utility"], severity: "low", recommendation: "Assign steam, hot oil, cooling water, chilled water, or refrigeration level rather than leaving thermal utility implicit." },
      { id: "H31", area: "pressure drop", title: "Estimate exchanger pressure drops", tags: ["heat_exchange", "pressure"], severity: "low", recommendation: "Track pressure-drop assumptions for heat exchangers so pumping/compression duties can be estimated later." },
      { id: "H32", area: "heat integration", title: "Check process-process heat recovery", tags: ["heat_exchange", "utility"], severity: "low", recommendation: "Where hot and cold streams coexist, flag a heat-recovery opportunity before final utility accounting." },
      { id: "H33", area: "thermal safety", title: "Avoid excessive thermal exposure", tags: ["heat_sensitive", "heating", "vl"], severity: "medium", recommendation: "For heat-sensitive materials, prefer short residence, lower pressure, thin-film, wiped-film, or short-path alternatives where compatible." },
      { id: "H34", area: "gas pressure", title: "Use fans for small gas pressure rise", tags: ["gas_pressure", "vapor"], severity: "low", recommendation: "For small gas pressure increases, consider a fan before blower or compressor." },
      { id: "H35", area: "gas pressure", title: "Use blowers for moderate gas pressure rise", tags: ["gas_pressure", "vapor"], severity: "low", recommendation: "For moderate gas pressure increases, consider a blower and check gas temperature rise." },
      { id: "H36", area: "gas compression", title: "Use staged compression for high ratios", tags: ["gas_pressure", "vapor"], severity: "medium", recommendation: "For high gas pressure ratios, consider staged compression with intercooling and knock-out handling." },
      { id: "H37", area: "liquid pumping", title: "Choose pump class from head and flow", tags: ["liquid_pressure", "liquid"], severity: "low", recommendation: "For liquid pressure increase, use flow and head to choose centrifugal, rotary, or reciprocating pump classes." },
      { id: "H38", area: "slurry pumping", title: "Check slurry/solids pumping separately", tags: ["solid_liquid", "liquid_pressure"], severity: "medium", recommendation: "For slurries or solids-bearing liquids, require solids loading and abrasion/cake risk before selecting pump equipment." },
      { id: "H39", area: "pump operability", title: "Check NPSH and cavitation risk", tags: ["liquid_pressure", "vl"], severity: "low", recommendation: "For pumped liquids near boiling or under vacuum, flag NPSH, cavitation, and vapor-lock risk." },
      { id: "H40", area: "pressure reduction", title: "Use valves for simple liquid pressure letdown", tags: ["pressure_reduction", "liquid"], severity: "low", recommendation: "For simple pressure decrease without useful work recovery, pressure-control valves may be sufficient." },
      { id: "H41", area: "expansion", title: "Recover work when expansion is significant", tags: ["pressure_reduction", "vapor"], severity: "low", recommendation: "For large gas/vapor pressure drops, consider turbines or expanders when economics and operability justify recovery." },
      { id: "H42", area: "flash/letdown", title: "Account for flashing during letdown", tags: ["pressure_reduction", "vl"], severity: "medium", recommendation: "When pressure reduction crosses VLE limits, include flash separation, vent, and cooling consequences." },
      { id: "H43", area: "pump vs compression", title: "Pump liquid rather than compress vapor", tags: ["vapor", "liquid_pressure", "condensation"], severity: "medium", recommendation: "Where feasible without costly refrigeration, condense vapor, pump liquid, then revaporize rather than compress gas." },
      { id: "H44", area: "vacuum", title: "Choose vacuum system by pressure level", tags: ["vacuum", "vl"], severity: "medium", recommendation: "For vacuum operations, record target pressure and compare steam ejectors, liquid-ring pumps, dry pumps, or staged systems." },
      { id: "H45", area: "vacuum", title: "Condense before vacuum pumping", tags: ["vacuum", "condensation", "vl"], severity: "medium", recommendation: "Condense recoverable vapors upstream of vacuum equipment to reduce load and losses." },
      { id: "H46", area: "vacuum", title: "Handle non-condensables explicitly", tags: ["vacuum", "vent", "vapor"], severity: "medium", recommendation: "For vacuum or inerted systems, include non-condensable load, vent treatment, and air/inert leakage assumptions." },
      { id: "H47", area: "vacuum", title: "Avoid air ingress where hazardous", tags: ["vacuum", "hazard"], severity: "high", recommendation: "For flammable, oxidizable, or toxic systems under vacuum, check inerting, leak control, and abatement." },
      { id: "H48", area: "solids conveying", title: "Select granular-solid conveying route", tags: ["solid_particle", "solids_handling"], severity: "low", recommendation: "For granular solids, compare pneumatic, mechanical, gravity, or screw conveying and include dust/containment needs." },
      { id: "H49", area: "size reduction", title: "Use crushing/grinding only when needed", tags: ["solid_particle", "size_reduction"], severity: "low", recommendation: "If particle size must be reduced, specify target size and select crushing, milling, or grinding accordingly." },
      { id: "H50", area: "size enlargement", title: "Use agglomeration when handling improves", tags: ["solid_particle", "size_enlargement"], severity: "low", recommendation: "If fine powders cause handling, dust, or filtration issues, consider granulation, pelletizing, or agglomeration." },
      { id: "H51", area: "solid classification", title: "Separate solids by size when required", tags: ["solid_particle", "classification"], severity: "low", recommendation: "When particle-size distribution matters, include screening, classification, or elutriation." },
      { id: "H52", area: "gas-solid separation", title: "Remove entrained solids from gas", tags: ["vapor_solid", "solid_particle"], severity: "medium", recommendation: "For gas-solid streams, include cyclones, filters, scrubbers, or electrostatic collection as appropriate." },
      { id: "H53", area: "liquid-solid classification", title: "Use hydrocyclones or classifiers for liquid slurries", tags: ["solid_liquid", "classification"], severity: "low", recommendation: "For slurry classification or dewatering, compare hydrocyclones, centrifuges, screens, and filters." }
    ].map(rule => ({ source: "Seider-Seader-Lewin heuristics, paraphrased for computable screening", ...rule }));
    const lutzePhaseOptions = [
      ["unknown", "phase missing"],
      ["L", "L - liquid"],
      ["V", "V - vapor"],
      ["S", "S - solid"],
      ["VL", "VL - vapor-liquid"],
      ["LL", "LL - liquid-liquid"],
      ["VS", "VS - vapor-solid"],
      ["LS", "LS - liquid-solid"],
      ["MVL", "MVL - membrane vapor-liquid"],
      ["MLL", "MLL - membrane liquid-liquid"],
      ["MVV", "MVV - membrane vapor-vapor"],
      ["VV", "VV - vapor-vapor"]
    ];
    const streamPhases = lutzePhaseOptions.map(item => item[0]);
    const streamDataStatuses = ["reported", "calculated", "estimated", "assumed", "missing"];
    const streamFateOptions = [
      "unknown",
      "fresh input",
      "recycled input",
      "recovered solvent",
      "purge",
      "vent",
      "wastewater",
      "solid waste",
      "loss",
      "product",
      "co-product",
      "unreacted reagent",
      "intermediate"
    ];
    const streamTimingOptions = [
      "unspecified",
      "initial charge",
      "continuous feed",
      "later addition",
      "make-up",
      "recycle",
      "in-process intermediate",
      "final output",
      "waste purge",
      "vent/emission"
    ];
    const scheduleScaleOptions = ["unknown", "kinetics-bound", "roughly constant", "increases with scale", "decreases with scale", "equipment dependent"];
    const scheduleOverlapOptions = ["no", "yes"];
    const scaleTargetUnitOptions = ["kg/batch", "kg/day", "kg/year", "t/year"];
    const capacityUnitOptions = ["", "kg/batch", "m3", "kg/h", "L", "m2"];
    const scheduleOperationClassOptions = [
      "auto",
      "heating_cooling",
      "reaction_kinetic",
      "filtration",
      "drying",
      "pumping_transfer",
      "crystallization",
      "cleaning_turnaround",
      "generic"
    ];
    const operationScaleProfiles = {
      heating_cooling: {
        label: "Heating/cooling",
        sensitivity: "increases with scale",
        badge: "high",
        behavior: "Duration can increase because heat-transfer area does not scale as fast as vessel inventory.",
        defaultAction: "Keep input duration for schematic Gantt; flag heat-transfer data before quantitative correction.",
        missing: ["mass basis", "Cp", "initial/final T", "U or heat-transfer coefficient", "heat-transfer area", "utility temperature"],
        refs: "Perry; Piccinno et al."
      },
      reaction_kinetic: {
        label: "Kinetic reaction",
        sensitivity: "kinetics-bound",
        badge: "low",
        behavior: "Reaction time is usually kept if temperature, mixing, heat removal, and mass transfer remain adequate.",
        defaultAction: "Keep input reaction duration; flag transport or heat-removal risks instead of shrinking time by scale.",
        missing: ["reaction time", "conversion/yield", "temperature window", "mixing adequacy", "heat-removal risk"],
        refs: "Levenspiel"
      },
      filtration: {
        label: "Solid-liquid filtration",
        sensitivity: "increases with scale",
        badge: "medium-high",
        behavior: "Time depends on cake volume and available filter area; flux per area is often the key scale variable.",
        defaultAction: "Keep input duration for screening; flag solids/cake data before calculating filter time or area.",
        missing: ["slurry volume", "solid loading", "filter area", "pressure drop", "cake resistance", "particle size"],
        refs: "Anlauf"
      },
      drying: {
        label: "Drying",
        sensitivity: "increases with scale",
        badge: "high",
        behavior: "Inventory per effective drying area often increases, so drying time can become a schedule bottleneck.",
        defaultAction: "Keep input duration for schematic Gantt; flag wet inventory, endpoint, and drying-area data.",
        missing: ["wet inventory", "initial/final moisture", "drying area", "drying rate/curve", "temperature limit"],
        refs: "Havlik and Dlouhy"
      },
      pumping_transfer: {
        label: "Pumping/transfer",
        sensitivity: "roughly constant",
        badge: "low",
        behavior: "Duration is mainly volume divided by transfer rate; per-kg timing is often less scale-sensitive.",
        defaultAction: "Keep input duration unless transfer rate, line length, or hold-up constraints are specified.",
        missing: ["transfer volume", "flow rate", "line/hold-up constraints"],
        refs: "Piccinno et al."
      },
      crystallization: {
        label: "Crystallization",
        sensitivity: "equipment dependent",
        badge: "medium",
        behavior: "Nucleation, growth, cooling profile, and seeding can change product quality and hold time at scale.",
        defaultAction: "Keep input duration for screening; flag solubility and supersaturation path before quantitative correction.",
        missing: ["solubility curve", "cooling profile", "seed policy", "hold time", "particle size target"],
        refs: "Myerson"
      },
      cleaning_turnaround: {
        label: "Cleaning/turnaround",
        sensitivity: "equipment dependent",
        badge: "medium",
        behavior: "Turnaround can scale with surface area and plant procedure, and may cap batches per year.",
        defaultAction: "Keep as explicit schedule allowance; do not hide it inside reaction or separation time.",
        missing: ["cleaning time", "CIP/manual basis", "surface/contacted equipment", "changeover assumption"],
        refs: "Seider et al."
      },
      generic: {
        label: "Generic task",
        sensitivity: "unknown",
        badge: "unknown",
        behavior: "No operation-specific scaling behaviour assigned yet.",
        defaultAction: "Use input duration only and add an operation class when this task affects bottleneck logic.",
        missing: ["operation class", "duration basis"],
        refs: "framework assumption"
      }
    };

    const conditionPromptCatalog = [
      { id: "initial_temperature", label: "Initial temperature", phenomena: ["ES(H)", "ES(C)", "PT(VL)"], placeholder: "20", unit: "C", kind: "number" },
      { id: "target_temperature", label: "Target / final temperature", phenomena: ["ES(H)", "ES(C)", "PT(VL)"], placeholder: "85-90", unit: "C", kind: "number" },
      { id: "holding_time", label: "Holding time", phenomena: ["ES(H)", "ES(C)", "PT(VL)", "R(L)", "R(V)"], placeholder: "2", unit: "h", kind: "number" },
      { id: "holding_temperature", label: "Holding temperature", phenomena: ["ES(H)", "ES(C)", "PT(VL)", "R(L)", "R(V)"], placeholder: "85-90", unit: "C", kind: "number" },
      { id: "thermal_ramp", label: "Ramp / cooling time", phenomena: ["ES(H)", "ES(C)"], placeholder: "0.5", unit: "h", kind: "number", hint: "How long it takes to ramp up to the target/heating temperature, or to cool down toward the holding/final temperature." },
      { id: "thermal_mode", label: "Heating / cooling device", phenomena: ["ES(H)", "ES(C)"], placeholder: "jacket, coil, condenser, ice bath, heat exchanger...", disabled: true, hint: "Not wired into scaling calculations yet - placeholder for a future heating/cooling equipment model." },
      { id: "initial_pressure", label: "Initial pressure", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)"], placeholder: "1", units: ["atm", "bar", "mbar"], defaultUnit: "atm", kind: "number" },
      { id: "target_pressure", label: "Target / final pressure", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)"], placeholder: "50", units: ["mbar", "bar", "atm"], defaultUnit: "mbar", kind: "number" },
      { id: "mixing_time", label: "Mixing time", phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "0.5", unit: "h", kind: "number" },
      { id: "agitation_speed", label: "Agitation speed", phenomena: ["M(L)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "300", unit: "rpm", kind: "number", hint: "Literature ranges: lab stirred vessels ~200-1000 rpm; pilot/industrial tanks ~30-150 rpm (large impellers keep similar tip speed at much lower rpm); high-shear/rotor-stator ~1000-3000 rpm; anchor/helical ribbon on viscous fluids ~5-50 rpm." },
      { id: "contact_time", label: "Phase contact time", phenomena: ["PC(VL)", "PC(LL)", "PC(VS)", "PC(LS)", "PT(VL)", "PT(LL)", "PT(VS)", "PT(LS)", "2phM(VL)", "2phM(LL)", "2phM(LS)", "2phM(VS)"], placeholder: "0.25", unit: "h", kind: "number" },
      { id: "contact_device", label: "Contact device / geometry", phenomena: ["PC(VL)", "PC(LL)", "PC(VS)", "PC(LS)", "2phM(VL)", "2phM(LL)", "2phM(LS)", "2phM(VS)"], placeholder: "impeller, packed bed, static mixer, spray..." },
      { id: "agitation_note", label: "Agitation / mass-transfer note", phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)", "PC(LL)", "PC(LS)", "PC(VL)", "PC(VS)"], placeholder: "avoid emulsion, suspend solids, improve contact..." },
      { id: "reaction_time", label: "Reaction time", phenomena: ["R(L)", "R(V)"], placeholder: "2", unit: "h", kind: "number" },
      { id: "conversion_yield", label: "Conversion / yield", phenomena: ["R(L)", "R(V)"], placeholder: "95", unit: "%", kind: "conversion" },
      { id: "phase_ratio", label: "Phase ratio", phenomena: ["PT(LL)", "PS(LL)", "2phM(LL)", "PC(LL)"], placeholder: "organic:aqueous ratio, wash volume..." },
      { id: "transfer_endpoint", label: "Transfer / equilibrium endpoint", phenomena: ["PT(VL)", "PT(LL)", "PT(VS)", "PT(LS)", "PT(MVL)", "PT(MLL)", "PT(MVV)"], placeholder: "equilibrium reached, water removed, crystals formed..." },
      { id: "phase_change_time", label: "Phase-change time", phenomena: ["PCh(V->L)", "PCh(L->V)", "PCh(L->S)", "PCh(S->L)", "PT(VL)", "PT(LS)", "PT(VS)"], placeholder: "1", unit: "h", kind: "number" },
      { id: "phase_change_fraction", label: "Phase-change fraction", phenomena: ["PCh(V->L)", "PCh(L->V)", "PCh(L->S)", "PCh(S->L)", "PT(VL)", "PT(LS)", "PT(VS)"], placeholder: "80", unit: "%", kind: "number" },
      { id: "settling_time", label: "Settling / split time", phenomena: ["PS(LL)", "PS(VL)", "PS(VS)", "PS(LS)"], placeholder: "0.5", unit: "h", kind: "number" },
      { id: "separation_efficiency", label: "Separation efficiency", phenomena: ["PS(LL)", "PS(VL)", "PS(VS)", "PS(LS)"], placeholder: "95", unit: "%", kind: "number" },
      { id: "carryover_limit", label: "Carryover / entrainment limit", phenomena: ["PS(LL)", "PS(VL)", "PS(VS)", "PS(LS)"], placeholder: "low, <1%, visually clear..." },
      { id: "interface_risk", label: "Interface / emulsion risk", phenomena: ["PS(LL)", "2phM(LL)", "PC(LL)"], placeholder: "emulsion risk, interface control, rag layer..." },
      { id: "solid_loading", label: "Solid loading", phenomena: ["PS(LS)", "PC(LS)", "2phM(LS)"], placeholder: "10", units: ["kg", "% wt", "kg/kg product"], defaultUnit: "kg", kind: "number" },
      { id: "cake_or_particle_note", label: "Cake / particle note", phenomena: ["PS(LS)", "PC(LS)", "PT(LS)", "2phM(LS)"], placeholder: "cake compressibility, particle size, filter aid..." },
      { id: "solid_endpoint", label: "Solid separation endpoint", phenomena: ["PS(LS)", "PC(LS)"], placeholder: "clear filtrate, dry cake, salt removed..." },
      { id: "split_fraction", label: "Split fraction", phenomena: ["SD"], placeholder: "50", unit: "%", kind: "number" },
      { id: "split_basis", label: "Split basis", phenomena: ["SD"], placeholder: "mass split, volume split, purge ratio..." },
      { id: "waste_note", label: "Waste / handling note", phenomena: ["PS(LL)", "PS(LS)", "PS(VL)", "PC(LS)", "PC(VL)"], placeholder: "brine, wet solids, VOC, wastewater interface..." }
    ];

    const propertyPromptCatalog = [
      { id: "boiling_point", label: "Boiling point", phenomena: ["PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)"], unit: "C", placeholder: "solvent/product bp", reason: "Ranks evaporation, condensation, distillation, and solvent recovery options." },
      { id: "vapor_pressure", label: "Vapor pressure", phenomena: ["PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)"], unit: "mbar", placeholder: "at operating T", reason: "Clarifies vacuum operation, vent load, and volatile losses." },
      { id: "azeotrope_risk", label: "Azeotrope / difficult VLE", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)", "PCh(L->V)", "PCh(V->L)"], unit: "", placeholder: "no, yes, unknown, pressure-sensitive...", reason: "Flags when simple distillation or evaporation may need entrainer, pressure swing, membrane, or another intensified route." },
      { id: "degradation_temperature", label: "Degradation temperature", phenomena: ["ES(H)", "PT(VL)", "PCh(L->V)"], unit: "C", placeholder: "thermal limit", reason: "Checks whether heating, evaporation, or distillation is plausible." },
      { id: "miscibility", label: "Miscibility", phenomena: ["PT(LL)", "PS(LL)", "PC(LL)", "2phM(LL)"], unit: "", placeholder: "miscible, immiscible, partial", reason: "Distinguishes wash/extraction/decanter choices from single-liquid mixing." },
      { id: "density_difference", label: "Density difference", phenomena: ["PT(LL)", "PS(LL)", "PC(LL)"], unit: "kg/m3", placeholder: "organic vs aqueous", reason: "Needed for decanting and interface-settling plausibility." },
      { id: "partition_coefficient", label: "Partition coefficient", phenomena: ["PT(LL)", "PC(LL)"], unit: "", placeholder: "K or logP", reason: "Helps rank liquid-liquid extraction or washing intensity." },
      { id: "emulsion_risk", label: "Emulsion risk", phenomena: ["PS(LL)", "2phM(LL)", "PC(LL)"], unit: "", placeholder: "low, medium, high", reason: "Flags scale-up risk in liquid-liquid mixing and decanting." },
      { id: "solubility", label: "Solubility", phenomena: ["PT(LS)", "PS(LS)", "PCh(L->S)", "PCh(S->L)"], unit: "g/L", placeholder: "vs temperature if known", reason: "Supports crystallization, precipitation, and dissolution choices." },
      { id: "particle_size", label: "Particle size", phenomena: ["PS(LS)", "PC(LS)", "2phM(LS)"], unit: "um", placeholder: "d50 or range", reason: "Relevant for filtration, drying, suspension, and cake behavior." },
      { id: "cake_resistance", label: "Cake resistance / compressibility", phenomena: ["PS(LS)", "PC(LS)"], unit: "", placeholder: "low, medium, high", reason: "Flags solid-liquid separation scale-up difficulty." },
      { id: "separation_selectivity", label: "Selectivity / affinity", phenomena: ["PT(MVL)", "PT(MVV)", "PT(MLL)", "PC(LS)", "PC(LL)", "PS(LS)", "PS(LL)"], unit: "", placeholder: "selectivity, affinity, sorption preference", reason: "Supports membrane, adsorption, extraction, drying-agent, and other property-based separations when simple phase split is weak." },
      { id: "separating_agent", label: "Separating agent", phenomena: ["PT(VL)", "PS(VL)", "PT(LL)", "PC(LL)", "PT(MLL)", "PT(MVL)"], unit: "", placeholder: "entrainer, extractant, adsorbent, membrane", reason: "Documents the extra agent or material that makes an otherwise weak separation feasible." },
      { id: "heat_capacity", label: "Heat capacity Cp", phenomena: ["ES(H)", "ES(C)"], unit: "kJ/kg/K", placeholder: "mixture Cp", reason: "Needed by the energy bridge for heating/cooling duty." },
      { id: "density", label: "Density", phenomena: ["M(L)", "2phM(LL)", "2phM(LS)"], unit: "kg/m3", placeholder: "mixture density", reason: "Needed only when mixing, residence volume, settling, or equipment sizing depends on volume rather than just mass." },
      { id: "viscosity", label: "Viscosity", phenomena: ["M(L)", "2phM(LL)", "2phM(LS)", "PC(LL)", "PC(LS)"], unit: "mPa s", placeholder: "at operating T", reason: "Needed only for scale-sensitive mixing, pumping, mass transfer, emulsion risk, or phase separation." },
      { id: "hazard_note", label: "Hazard / compatibility note", phenomena: ["ES(H)", "PT(VL)", "PS(VL)", "PC(VL)", "PS(LL)", "PS(LS)"], unit: "", placeholder: "flammable, toxic, corrosive, incompatible...", reason: "Supports purge, vent, solvent recovery, and safety review." }
    ];

    const separationCore = globalThis.ProcessUpscalingSeparationCore;
    if (!separationCore) throw new Error("Separation core module failed to load.");
    const separationSubstanceRoles = separationCore.substanceRoles;
    const separationSubstanceFates = separationCore.substanceFates;
    const separationBinaryInsightOptions = separationCore.binaryInsightOptions;
    const separationThermalOptions = separationCore.thermalOptions;
    const separationPurePropertyDefs = separationCore.purePropertyDefs;
    const separationKbRules = separationCore.kbRules;
    const separationSharedPropertyFields = new Set([
      "pubchemCid",
      "pubchemUrl",
      "molecularFormula",
      "canonicalSmiles",
      "xlogp",
      "exactMass",
      "propertySource",
      "thermalSensitivity",
      "mw",
      "tb",
      "tm",
      "pvap",
      "solubilityParameter",
      "molarVolume",
      "criticalTemp",
      "vdwVolume",
      "molecularDiameter",
      "kineticDiameter"
    ]);
    const streamChemicalPropertyFields = [
      ...separationSharedPropertyFields,
      "density"
    ];
    globalThis.streamChemicalPropertyFields = streamChemicalPropertyFields;
    const streamChemicalPropertyDefs = [
      { id: "mw", label: "MW", unit: "g/mol", placeholder: "e.g. 84.16" },
      { id: "tb", label: "Boiling point", unit: "K", placeholder: "for V-L screen" },
      { id: "pvap", label: "Vapor pressure", unit: "Pa", placeholder: "at relevant T" },
      { id: "density", label: "Density", unit: "kg/m3", placeholder: "for volume sizing" },
      { id: "solubilityParameter", label: "Solubility parameter", unit: "", placeholder: "affinity screen" },
      { id: "molarVolume", label: "Molar volume", unit: "m3/kmol", placeholder: "size screen" }
    ];

    const state = {
      text: "",
      blocks: [],
      groups: {},
      links: [],
      scaleBasis: {
        targetProduct: "octocrylene",
        targetAmount: "1000",
        targetUnit: "kg/batch",
        referenceBlockId: "",
        basisAmount: "",
        basisUnit: "kg",
        mode: "batch",
        operatingDays: "250",
        hoursPerDay: "16",
        batchesPerDay: "1",
        batchDuration: "",
        scheduleMarginPercent: "0",
        oeePercent: "80",
        parallelUnits: "1",
        allowableCapacityUtilizationPercent: "85",
        productKgPerBatch: "",
        reactantsLoadingLPerKgProduct: "",
        solventLoadingLPerKgProduct: "",
        reactorWorkingFillPercent: "70",
        productMolecularWeightGmol: "",
        condensationWaterMolPerMol: "",
        confidence: "rough"
      },
      ruleChecks: [],
      aiRefine: null,
      heuristicDecisions: {},
      showDataReadiness: false,
      showConnections: false,
      measuredNodeHeights: {},
      stepEditorHeight: 165,
      groupStepEditorHeight: 400,
      boardCompact: false,
      pendingSplitGroupId: null,
      sourcePanelTab: "protocol",
      processRuleOptions: {
        sequence: true,
        mfa: true,
        phases: true,
        conditions: true,
        recycle: true,
        scale: true
      },
      showAllHeuristicRules: false,
      expandedHeuristicRuleIds: {},
      expandedScaleSections: {},
      expandedGanttRows: {},
      phenomenaGridExpanded: false,
      scheduleScenarioView: "conservative",
      pubchemStreamSuggestions: {},
      activeSeparationSimulatorGroupId: null,
      activeSeparationSimulatorMode: "full",
      activeConversionBlockId: null,
      activeInspectorTab: "inspect",
      selectedBlockId: null,
      selectedGroupId: null,
      selectedIds: [],
      manualBlockPoint: null,
      tutorialIndex: 0,
      menuBlockId: null,
      menuGroupId: null,
      menuStreamId: null,
      connectingFrom: null,
      connectDrag: null,
      lastSelection: null,
      lastSelectionAt: 0,
      zoom: 0.78,
      draftPos: { x: 24, y: 24 },
      focusEndpoint: null,
      flowsheetMode: "editable",
      flowsheetFit: true,
      drag: null,
      boardPan: null
    };

    const $ = id => document.getElementById(id);

    const undoStack = [];
    let flowsheetRequestSeq = 0;
    let boardDragFrame = null;
    let boardReflowDepth = 0;
    // Only resolveGroupVerticalOverlaps() when explicitly armed (sample load, Auto-Layout, the
    // Compact/Detailed toggle) - NOT on every render. It was previously unconditional, which meant
    // finishing an ordinary manual drag (also just a renderGroupFlow() call) could immediately
    // shove the box the user just placed far away from where they dropped it, if that position
    // happened to overlap a taller box above it. Manual placement should never be overridden.
    let pendingBoardReflow = false;
    let connectDragFrame = null;
    let stepEditorResizeDrag = null;
    let pubchemResolveState = null;
    const pubchemStreamSuggestTimers = new Map();
    const flowsheetLayoutVersion = "editable-train-v6";

    function undoSnapshot() {
      return JSON.stringify({
        text: state.text,
        blocks: state.blocks,
        groups: state.groups,
        links: state.links,
        scaleBasis: state.scaleBasis,
        heuristicDecisions: state.heuristicDecisions,
        activeInspectorTab: state.activeInspectorTab
      });
    }

    function pushUndo() {
      undoStack.push(undoSnapshot());
      if (undoStack.length > 50) undoStack.shift();
      updateUndoButton();
    }

    function dropLastUndo() {
      undoStack.pop();
      updateUndoButton();
    }

    function undoLast() {
      const snapshot = undoStack.pop();
      updateUndoButton();
      if (!snapshot) return;
      const data = JSON.parse(snapshot);
      state.text = data.text;
      state.blocks = data.blocks;
      state.groups = data.groups;
      state.links = data.links;
      state.scaleBasis = data.scaleBasis;
      state.heuristicDecisions = data.heuristicDecisions || {};
      state.selectedBlockId = null;
      state.selectedGroupId = null;
      state.selectedIds = [];
      state.connectingFrom = null;
      state.aiRefine = null;
      const source = $("sourceInput");
      if (source) source.value = state.text;
      renderAll();
    }

    function updateUndoButton() {
      const button = $("undoAction");
      if (button) button.disabled = !undoStack.length;
    }

    function nodeWidth(blockCount, kind = "group") {
      const count = Math.max(1, blockCount);
      if (state.boardCompact && kind !== "draft") return 240;
      if (kind === "draft") return Math.max(430, 78 + count * 258);
      return Math.max(560, 92 + count * 194);
    }

    const flowsheetCategoryIcon = {
      reactor: "⚗",
      separation: "⬡",
      utility: "⚙",
      storage: "◉",
      waste: "♻"
    };

    function boardBounds() {
      const draftBlocks = blocksInOrder().filter(block => !block.groupId);
      const boxes = [];
      if (draftBlocks.length) {
        boxes.push({
          x: state.draftPos.x,
          y: state.draftPos.y,
          w: nodeWidth(draftBlocks.length, "draft"),
          h: 300
        });
      }
      groupIdsInTextOrder().forEach(id => {
        const group = ensureGroup(id);
        const blocks = blocksForGroup(id);
        boxes.push({
          x: group.x,
          y: group.y,
          w: nodeWidth(blocks.length),
          h: state.measuredNodeHeights[id] || (state.boardCompact ? 200 : 380)
        });
      });
      state.links.forEach(link => {
        const a = endpointCenter(link.from);
        const b = endpointCenter(link.to);
        if (a) boxes.push({ x: a.x, y: a.y, w: 1, h: 1 });
        if (b) boxes.push({ x: b.x, y: b.y, w: 1, h: 1 });
      });
      const flow = $("groupFlow");
      const minWidth = flow ? Math.max(1900, flow.clientWidth / Math.max(0.1, state.zoom) + 700) : 2200;
      const minHeight = flow ? Math.max(1150, flow.clientHeight / Math.max(0.1, state.zoom) + 420) : 1300;
      if (!boxes.length) return { width: minWidth, height: minHeight };
      const maxX = Math.max(...boxes.map(box => box.x + box.w));
      const maxY = Math.max(...boxes.map(box => box.y + box.h));
      return {
        width: Math.max(minWidth, maxX + 520),
        height: Math.max(minHeight, maxY + 360)
      };
    }

    function groupDrawerBoardClearance() {
      if (!selectedGroup() && !selectedBlock()?.groupId) return 0;
      const drawerHeight = Number(state.groupStepEditorHeight || 520);
      return Math.max(520, Math.min(1120, drawerHeight + 340));
    }

    function boardWithDrawerClearance(board = boardBounds()) {
      return {
        width: board.width,
        height: board.height + groupDrawerBoardClearance()
      };
    }

    function nextBlockId() {
      const nums = state.blocks.map(b => Number(b.id.replace("B", ""))).filter(Number.isFinite);
      return `B${(nums.length ? Math.max(...nums) : 0) + 1}`;
    }

    function nextGroupId() {
      const nums = Object.keys(state.groups).map(g => Number(g.replace("G", ""))).filter(Number.isFinite);
      return `G${(nums.length ? Math.max(...nums) : 0) + 1}`;
    }

    function inferBehavior(text) {
      const t = text.toLowerCase();
      if (t.includes("dean-stark") || t.includes("water formed") || t.includes("equilibrium")) return "reaction with in-situ removal";
      if (t.includes("wash") || t.includes("brine") || t.includes("organic phase") || t.includes("organic layer")) return "liquid-liquid wash";
      if (t.includes("dry") || t.includes("mgso4") || t.includes("na2so4")) return "solid-liquid drying";
      if (t.includes("filter")) return "filtration";
      if (t.includes("remove cyclohexane") || t.includes("evaporat")) return "solvent evaporation";
      if (t.includes("distill") || t.includes("purify")) return "distillation purification";
      if (t.includes("heat") || t.includes("cool") || t.includes("reflux")) return "heat/cool";
      if (t.includes("charge") || t.includes("add")) return "charge and mix";
      if (t.includes("reaction") || t.includes("condensation")) return "reaction";
      return "unassigned";
    }

    function ensureGroup(groupId, task = "unassigned") {
      if (!state.groups[groupId]) {
        const count = Object.keys(state.groups).length;
        const columns = 4;
        state.groups[groupId] = {
          id: groupId,
          task,
          selectedUnit: "",
          schedule: scheduleDefaults(),
          properties: {},
          propertiesEditing: false,
          x: 520 + (count % columns) * 560,
          y: 90 + Math.floor(count / columns) * 330
        };
      }
      if (!state.groups[groupId].properties || typeof state.groups[groupId].properties !== "object" || Array.isArray(state.groups[groupId].properties)) {
        state.groups[groupId].properties = {};
      }
      if (!state.groups[groupId].schedule || typeof state.groups[groupId].schedule !== "object" || Array.isArray(state.groups[groupId].schedule)) {
        state.groups[groupId].schedule = scheduleDefaults();
      } else {
        state.groups[groupId].schedule = { ...scheduleDefaults(), ...state.groups[groupId].schedule };
      }
      state.groups[groupId].propertiesEditing = Boolean(state.groups[groupId].propertiesEditing);
      state.groups[groupId].conditionsEditing = Boolean(state.groups[groupId].conditionsEditing);
      if (typeof state.groups[groupId].selectionBasis !== "string") state.groups[groupId].selectionBasis = "";
      if (!state.groups[groupId].propertyPredictor || typeof state.groups[groupId].propertyPredictor !== "object" || Array.isArray(state.groups[groupId].propertyPredictor)) {
        state.groups[groupId].propertyPredictor = { mode: "skip", expanded: false };
      } else {
        const predictor = state.groups[groupId].propertyPredictor;
        predictor.mode = ["skip", "minimal", "binaryRatio"].includes(predictor.mode) ? predictor.mode : "skip";
        predictor.expanded = Boolean(predictor.expanded);
      }
      if (!state.groups[groupId].alternativeDecisions || typeof state.groups[groupId].alternativeDecisions !== "object" || Array.isArray(state.groups[groupId].alternativeDecisions)) {
        state.groups[groupId].alternativeDecisions = {};
      }
      if (!state.groups[groupId].conditionOverrides || typeof state.groups[groupId].conditionOverrides !== "object") {
        state.groups[groupId].conditionOverrides = {};
      }
      if (!state.groups[groupId].mfaOverrides || typeof state.groups[groupId].mfaOverrides !== "object") {
        state.groups[groupId].mfaOverrides = {};
      }
      state.groups[groupId].separationSimulator = normalizeSeparationSimulator(state.groups[groupId].separationSimulator);
      if (typeof state.groups[groupId].openOverrideKey !== "string") state.groups[groupId].openOverrideKey = "";
      state.groups[groupId].separationSupportExpanded = Boolean(state.groups[groupId].separationSupportExpanded);
      return state.groups[groupId];
    }

    function normalizeSeparationSimulator(value) {
      return separationCore.normalizeSeparationSimulator(value, streamPhases);
    }

    function normalizeLookupSummary(value) {
      return separationCore.normalizeLookupSummary(value);
    }

    function normalizeReactionBalance(value) {
      return separationCore.normalizeReactionBalance(value);
    }

    function normalizeSeparationSubstance(value, index = 0) {
      return separationCore.normalizeSeparationSubstance(value, index, streamPhases);
    }

    function canonicalChemicalKey(value) {
      return cleanSubstanceName(value).toLowerCase();
    }

    function substanceChemicalKey(substance) {
      const explicit = String(substance?.chemicalKey || "").trim().toLowerCase();
      if (explicit) return explicit;
      return canonicalChemicalKey(substance?.residualOf || substance?.name || "");
    }

    function applyChemicalKey(substance) {
      if (!substance) return "";
      const key = substanceChemicalKey(substance);
      if (key) substance.chemicalKey = key;
      return key;
    }

    function isUnreactedOrResidualName(value) {
      return /\b(unreacted|residual|leftover)\b/i.test(String(value || ""));
    }

    function nextSeparationSubstanceId(simulator) {
      return separationCore.nextSeparationSubstanceId(simulator);
    }

    function scheduleDefaults() {
      return {
        durationH: "",
        parallelUnits: "1",
        canOverlap: "no",
        capacityAmount: "",
        capacityUnit: "",
        operationClass: "auto",
        scaleSensitivity: "unknown",
        dependency: "previous",
        notes: ""
      };
    }

    async function createBlock(start, end, options = {}) {
      if (start === end) return;
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      if (state.blocks.some(block => isTextLinkedBlock(block) && rangesOverlap(lo, hi, block.start, block.end))) {
        await alertModal("Selection overlaps an existing block. Select unassigned text or use group actions.");
        return;
      }
      const text = state.text.slice(lo, hi).replace(/\s+/g, " ").trim();
      if (!text) return;
      pushUndo();
      const behavior = options.behavior && behaviorPresets[options.behavior] ? options.behavior : inferBehavior(text);
      const phenomena = phenomenaForBehaviorAndText(behavior, text);
      const inferredConditions = inferInitialConditions(text, phenomena);
      const block = {
        id: nextBlockId(),
        groupId: null,
        start: lo,
        end: hi,
        source: "protocol",
        text,
        behavior,
        phenomena,
        streams: [],
        notes: "",
        conditions: inferredConditions.values,
        conditionUnits: inferredConditions.units,
        conditionsEditing: false,
        phase: "",
        endpoint: "",
        status: "needs validation"
      };
      ensureBlockFlowFields(block);
      if (options.inputName) {
        block.streams.push(createStream("input", { id: nextStreamId(block), name: options.inputName, phase: options.inputPhase || "unknown" }));
      }
      if (options.outputName) {
        block.streams.push(createStream("output", { id: nextStreamId(block), name: options.outputName, phase: options.outputPhase || "unknown" }));
      }
      ensureBlockConditionFields(block);
      if (options.temperature) {
        block.conditions.target_temperature = options.temperature;
        block.conditionUnits.target_temperature = block.conditionUnits.target_temperature || "C";
      }
      if (options.time) {
        block.conditions.holding_time = options.time;
        block.conditionUnits.holding_time = block.conditionUnits.holding_time || "h";
      }
      if (options.agitation) {
        block.conditions.agitation_note = options.agitation;
      }
      if (options.endpoint) {
        block.endpoint = options.endpoint;
        if (phenomena.some(code => code.startsWith("PT("))) block.conditions.transfer_endpoint = block.conditions.transfer_endpoint || options.endpoint;
      }
      state.blocks.push(block);
      state.selectedBlockId = block.id;
      state.selectedIds = [block.id];
      state.focusEndpoint = block.id;
      renderAll();
    }

    function createManualBlock(options = {}) {
      pushUndo();
      const groupId = options.groupId || null;
      const block = {
        id: nextBlockId(),
        groupId,
        start: state.text.length,
        end: state.text.length,
        source: "manual",
        text: "",
        behavior: "unassigned",
        phenomena: [],
        streams: [],
        notes: "",
        conditions: {},
        conditionUnits: {},
        conditionsEditing: false,
        phase: "",
        endpoint: "",
        status: "manual draft"
      };
      ensureBlockFlowFields(block);
      ensureBlockConditionFields(block);
      state.blocks.push(block);
      if (!groupId && Number.isFinite(options.x) && Number.isFinite(options.y)) {
        state.draftPos = { x: options.x, y: options.y };
      }
      state.selectedBlockId = block.id;
      state.selectedIds = [block.id];
      state.selectedGroupId = null;
      state.focusEndpoint = groupId || block.id;
      hideTextSelectionMenu();
      hideGroupMenu();
      invalidateAiRefine();
      renderAll();
    }


    function phenomenaForBehaviorAndText(behavior, text) {
      const preset = behaviorPresets[behavior] || behaviorPresets.unassigned;
      const t = String(text || "").toLowerCase();
      // Was "\\bcool|..." / "\\bheat|..." - a literal backslash before "cool"/"heat" that can
      // never appear in plain text, so the bare imperative verb form ("Cool the mixture",
      // "Heat to reflux" - extremely common protocol phrasing) never matched; only the other
      // alternatives in each list (cooled/cooling, heated/heating, etc.) did.
      if (behavior === "heat/cool") {
        const hasCooling = /\bcool|cooled|cooling|quench|room temperature/.test(t);
        const hasHeating = /\bheat|heated|heating|reflux|boil|boiling|warm|evaporat|distill/.test(t);
        if (hasCooling && !hasHeating) return ["ES(C)"];
        if (hasHeating && !hasCooling) return ["ES(H)"];
      }
      // "Charge and mix" alone carries no thermal phenomenon, so a temperature stated in the same
      // sentence (e.g. "Charge the reagents at 25 C") previously had no condition field to land in
      // at all - not even to record that the charge happens at a controlled, non-ambient temperature.
      // Add a thermal phenomenon only when the text actually mentions temperature, so a plain
      // "Charge the reagents to the reactor" without any thermal detail doesn't get one for free.
      if (behavior === "charge and mix") {
        const hasCooling = /\bcool|cooled|cooling|chilled|chill|room temperature|ambient/.test(t);
        const hasHeating = /\bheat|heated|heating|warm|warmed/.test(t);
        const hasTemperatureValue = /\d+(?:\.\d+)?\s*(?:-|to|–)\s*\d+(?:\.\d+)?\s*°?\s*c\b|\d+(?:\.\d+)?\s*°?\s*c\b/i.test(text);
        if (hasCooling || hasHeating || hasTemperatureValue) {
          const thermal = hasCooling && !hasHeating ? "ES(C)" : "ES(H)";
          return [...preset.phenomena, thermal];
        }
      }
      return [...preset.phenomena];
    }

    function inferInitialConditions(text, phenomena) {
      const t = text.toLowerCase();
      const conditions = {};
      const units = {};
      const hasThermal = phenomena.some(code => ["ES(H)", "ES(C)", "PT(VL)"].includes(code));
      const temperatureMatch = text.match(/(\d+(?:\.\d+)?\s*(?:-|to|–)\s*\d+(?:\.\d+)?\s*°?\s*C|\d+(?:\.\d+)?\s*°?\s*C)/i);
      if (hasThermal && temperatureMatch) {
        conditions.target_temperature = temperatureMatch[1].replace(/°?\s*C/ig, "").replace(/\s+/g, " ").trim();
        units.target_temperature = "C";
      }
      const hasMixing = phenomena.some(code => code.startsWith("M(") || code.startsWith("2phM("));
      const hasSeparation = phenomena.some(code => code.startsWith("PS("));
      const hasReaction = phenomena.some(code => code.startsWith("R("));
      const duration = extractDurationHours(text);
      if (duration && hasReaction) {
        conditions.reaction_time = duration.value;
        units.reaction_time = "h";
      }
      if (duration && hasMixing && /stir|mix|agitat/i.test(text)) {
        conditions.mixing_time = duration.value;
        units.mixing_time = "h";
      }
      if (duration && hasSeparation && /settle|separat|split|decant/i.test(text)) {
        conditions.settling_time = duration.value;
        units.settling_time = "h";
      }
      return { values: conditions, units };
    }

    function extractDurationHours(text) {
      const match = String(text).match(/(\d+(?:[.,]\d+)?)\s*(?:(?:-|to|–)\s*(\d+(?:[.,]\d+)?))?\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/i);
      if (!match) return null;
      const lo = Number(match[1].replace(",", "."));
      const hi = match[2] ? Number(match[2].replace(",", ".")) : lo;
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
      const unit = match[3].toLowerCase();
      const raw = (lo + hi) / 2;
      const hours = unit.startsWith("min") ? raw / 60 : raw;
      return { value: formatNumber(hours), unit: "h" };
    }

    function rangesOverlap(a1, a2, b1, b2) {
      return Math.max(a1, b1) < Math.min(a2, b2);
    }

    function isTextLinkedBlock(block) {
      if (!block || block.source === "manual") return false;
      return Number.isFinite(block.start) && Number.isFinite(block.end) && block.end > block.start;
    }

    function selectedBlock() {
      const block = state.blocks.find(item => item.id === state.selectedBlockId) || null;
      if (block) {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
        if (typeof block.notes !== "string") block.notes = "";
      }
      return block;
    }

    function selectedGroup() {
      if (state.selectedGroupId && blocksForGroup(state.selectedGroupId).length) return groupModel(state.selectedGroupId);
      return null;
    }

    function selectedIdsCompleteGroupId() {
      const ids = new Set(state.selectedIds);
      if (!ids.size) return null;
      const selectedBlocks = state.blocks.filter(block => ids.has(block.id));
      const groupIds = Array.from(new Set(selectedBlocks.map(block => block.groupId).filter(Boolean)));
      if (groupIds.length !== 1) return null;
      const groupId = groupIds[0];
      const groupBlocks = blocksForGroup(groupId);
      if (groupBlocks.length <= 1) return null;
      if (selectedBlocks.length !== groupBlocks.length) return null;
      return groupBlocks.every(block => ids.has(block.id)) ? groupId : null;
    }

    function ensureBlockFlowFields(block) {
      if (!Array.isArray(block.streams)) {
        const legacy = [];
        [["input", block.inputs], ["output", block.outputs], ["waste", block.wastes]].forEach(([role, values]) => {
          if (!Array.isArray(values)) return;
          values.forEach(value => {
            const name = typeof value === "string" ? value : value?.name;
            if (!name) return;
            legacy.push(createStream(role, { name }));
          });
        });
        block.streams = legacy;
      }
      block.streams = block.streams.map((stream, index) => {
        const normalized = normalizeStream(stream);
        if (!normalized.id) normalized.id = `${block.id}-S${index + 1}`;
        return normalized;
      });
      block.inputs = streamNames(block, "input");
      block.outputs = streamNames(block, "output");
      block.wastes = streamNames(block, "waste");
      return block;
    }

    function ensureBlockConditionFields(block) {
      if (!block.conditions || typeof block.conditions !== "object" || Array.isArray(block.conditions)) {
        block.conditions = {};
      }
      if (!block.conditionUnits || typeof block.conditionUnits !== "object" || Array.isArray(block.conditionUnits)) {
        block.conditionUnits = {};
      }
      if (block.conditions.temperature_range && !block.conditions.target_temperature) {
        block.conditions.target_temperature = block.conditions.temperature_range;
      }
      if (block.conditions.temperature_hold && !block.conditions.holding_temperature) {
        block.conditions.holding_temperature = block.conditions.temperature_hold;
      }
      if (block.conditions.pressure && !block.conditions.target_pressure) {
        block.conditions.target_pressure = block.conditions.pressure;
      }
      conditionPromptCatalog.forEach(prompt => {
        const unit = defaultConditionUnit(prompt);
        if (unit && block.conditions[prompt.id] && !block.conditionUnits[prompt.id]) {
          block.conditionUnits[prompt.id] = unit;
        }
        if (unit && block.conditions[prompt.id]) {
          block.conditions[prompt.id] = normalizeConditionValue(block.conditions[prompt.id], unit);
        }
      });
      block.conditionsEditing = Boolean(block.conditionsEditing);
      return block;
    }

    function normalizeConditionValue(value, unit) {
      let text = String(value || "").trim();
      if (!text) return "";
      const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(`\\s*${escapedUnit}\\s*$`, "i"), "").trim();
      if (unit === "C") text = text.replace(/\s*°\s*$/i, "").trim();
      return text;
    }

    function nextStreamId(block) {
      const nums = (block.streams || [])
        .map(stream => Number(String(stream.id || "").replace(/[^\d]/g, "")))
        .filter(Number.isFinite);
      return `${block.id}-S${(nums.length ? Math.max(...nums) : 0) + 1}`;
    }

    function createStream(role, values = {}) {
      return normalizeStream({
        id: values.id || "",
        role,
        name: values.name || "",
        quantity: values.quantity || "",
        conversionBaseQuantity: values.conversionBaseQuantity || "",
        unit: values.unit || "kg",
        phase: values.phase || "unknown",
        status: values.status || "missing",
        timing: values.timing || defaultStreamTiming(role),
        fate: values.fate || defaultStreamFate(role, values.timing || defaultStreamTiming(role)),
        recoveryPercent: values.recoveryPercent || "",
        purgePercent: values.purgePercent || "",
        scalingMode: values.scalingMode || defaultStreamScalingMode(role, values.unit || "kg", values.fate || ""),
        loopId: values.loopId || "",
        destinationGroup: values.destinationGroup || "",
        makeupRequired: values.makeupRequired || "",
        accumulationRisk: values.accumulationRisk || "",
        note: values.note || "",
        ...Object.fromEntries(streamChemicalPropertyFields.map(field => [field, values[field] || values.chemicalProperties?.[field] || ""])),
        editing: Boolean(values.editing)
      });
    }

    function loadBaseExampleProject() {
      const makeBlock = (id, phrase, groupId, behavior, phenomena, streams, conditions = {}, conditionUnits = {}) => {
        const start = sampleText.indexOf(phrase);
        return {
          id,
          groupId,
          start: start >= 0 ? start : 0,
          end: start >= 0 ? start + phrase.length : phrase.length,
          text: phrase,
          behavior,
          phenomena,
          streams: streams.map((stream, index) => createStream(stream.role, { id: `${id}-S${index + 1}`, ...stream })),
          conditions,
          conditionUnits,
          conditionsEditing: false,
          phase: "",
          endpoint: "",
          status: "example basis"
        };
      };

      state.text = sampleText;
      $("sourceInput").value = sampleText;
      state.blocks = [
        makeBlock(
          "B1",
          "Charge 1.82 kg of benzophenone, 1.97 kg of 2-ethylhexyl cyanoacetate, 0.15 kg of ammonium acetate catalyst, and 3.50 kg of cyclohexane to a stirred jacketed reactor fitted with a reflux condenser and a Dean-Stark trap.",
          "G1",
          "charge and mix",
          ["M(L)", "2phM(LS)"],
          [
            { role: "input", name: "benzophenone", quantity: "1.82", unit: "kg", phase: "S", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch" },
            { role: "input", name: "2-ethylhexyl cyanoacetate", quantity: "1.97", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch" },
            { role: "input", name: "ammonium acetate catalyst", quantity: "0.15", unit: "kg", phase: "S", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch" },
            { role: "input", name: "cyclohexane", quantity: "3.50", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch", note: "solvent; industrial make-up partly covered by recycle loop CYHX" },
            { role: "output", name: "charged reaction mixture", quantity: "7.44", unit: "kg", phase: "LS", status: "calculated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" }
          ],
          { agitation_note: "stirred jacketed reactor" },
          {}
        ),
        makeBlock(
          "B2",
          "Heat the stirred mixture to reflux at 85 C.",
          "G1",
          "heat/cool",
          ["ES(H)", "M(L)"],
          [],
          { initial_temperature: "25", target_temperature: "85", thermal_mode: "jacket heating to reflux", agitation_note: "stirred mixture, heated to reflux" },
          { initial_temperature: "C", target_temperature: "C" }
        ),
        makeBlock(
          "B3",
          "Maintain reflux for 18 to 24 h, removing the water formed by the Knoevenagel condensation azeotropically until no further water separates in the Dean-Stark trap.",
          "G2",
          "reaction with in-situ removal",
          ["R(L)", "M(L)", "ES(H)", "PT(VL)", "PS(VL)", "PS(LL)"],
          [
            { role: "input", name: "charged reaction mixture", quantity: "7.44", unit: "kg", phase: "LS", status: "calculated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
            { role: "output", name: "crude octocrylene mixture", quantity: "7.21", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
            { role: "waste", name: "water of condensation", quantity: "0.18", unit: "kg", phase: "L", status: "calculated", timing: "waste purge", fate: "wastewater", scalingMode: "per batch", destinationGroup: "G9", note: "azeotropic removal via Dean-Stark decanter; sent to wastewater treatment interface (paper U9, SI Step 4: approx. 0.05 kg water/kg product, i.e. 18.0/361.5 stoichiometric)" },
            { role: "waste", name: "cyclohexane vapor to vent", quantity: "0.05", unit: "kg", phase: "V", status: "estimated", timing: "vent/emission", fate: "vent", scalingMode: "fixed loss %", destinationGroup: "G10", note: "route to vent abatement train (paper U7): condenser + activated carbon polishing (VOC compliance)" },
            { role: "waste", name: "reactor decanter cyclohexane purge", quantity: "0.30", unit: "kg", phase: "L", status: "assumed", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch", destinationGroup: "G8", note: "SI Step 4, first loop: 'the U2 reflux/decanter purge is routed together with the U5 thin-film evaporator overhead to the U8 distillation column' - most cyclohexane stays in the internal reflux loop, this is the purge fraction; quantity not given in the SI, assumed for illustration" }
          ],
          { reaction_time: "21", holding_temperature: "85", conversion_yield: "90", agitation_note: "refluxing stirred liquid", transfer_endpoint: "no further water separates in the Dean-Stark trap" },
          { reaction_time: "h", holding_temperature: "C", conversion_yield: "%" }
        ),
        makeBlock(
          "B4",
          "Cool the crude reaction mixture to 40 C.",
          "G3",
          "heat/cool",
          ["ES(C)"],
          [],
          { initial_temperature: "85", target_temperature: "40" },
          { initial_temperature: "C", target_temperature: "C" }
        ),
        makeBlock(
          "B5",
          "Wash the organic phase with 2.0 kg of water in two counter-current stages, allowing the phases to settle after each contact.",
          "G4",
          "liquid-liquid wash",
          ["2phM(LL)", "PC(LL)", "M(L)"],
          [
            { role: "input", name: "wash water", quantity: "2.0", unit: "kg", phase: "L", status: "reported", timing: "later addition", fate: "fresh input", scalingMode: "per batch" },
            { role: "output", name: "washed two-phase mixture", quantity: "9.21", unit: "kg", phase: "LL", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" }
          ],
          { mixing_time: "0.5", settling_time: "0.5", phase_ratio: "organic:aqueous approx. 7.2:2.0" },
          { mixing_time: "h", settling_time: "h" }
        ),
        makeBlock(
          "B6",
          "Separate and discard the aqueous layer.",
          "G4",
          "liquid-liquid wash",
          ["PS(LL)", "PT(LL)"],
          [
            { role: "output", name: "washed organic phase", quantity: "7.05", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
            { role: "waste", name: "aqueous waste", quantity: "2.16", unit: "kg", phase: "L", status: "estimated", timing: "waste purge", fate: "wastewater", scalingMode: "per batch", destinationGroup: "G9", note: "sent to wastewater treatment interface (paper U9); compliance unit, heuristic addition" }
          ],
          { separation_efficiency: "95", settling_time: "0.5", transfer_endpoint: "clear organic/aqueous split" },
          { separation_efficiency: "%", settling_time: "h" }
        ),
        makeBlock(
          "B7",
          "Dry the washed organic phase over molecular sieves until the water content is below 0.1 percent.",
          "G5",
          "solid-liquid drying",
          ["PC(LS)", "PT(LS)"],
          [
            { role: "input", name: "molecular sieves 4A", quantity: "0.10", unit: "kg", phase: "S", status: "assumed", timing: "later addition", fate: "fresh input", scalingMode: "per batch", note: "regenerable fixed-bed column at industrial scale" },
            { role: "output", name: "dry organic phase", quantity: "7.00", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
            { role: "waste", name: "spent sieves with adsorbed water", quantity: "0.15", unit: "kg", phase: "S", status: "estimated", timing: "waste purge", fate: "solid waste", scalingMode: "per batch", note: "regenerated on-site at scale; lab-scale disposal" }
          ],
          { transfer_endpoint: "water content below 0.1 percent", contact_time: "1" },
          { contact_time: "h" }
        ),
        makeBlock(
          "B8",
          "Evaporate the cyclohexane under vacuum at 100 to 200 mbar in a thin-film evaporator and recover the condensed solvent for reuse.",
          "G6",
          "solvent evaporation",
          ["PT(VL)", "PS(VL)", "PCh(L->V)", "ES(H)"],
          [
            { role: "output", name: "recovered cyclohexane condensate", quantity: "3.15", unit: "kg", phase: "L", status: "calculated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch", destinationGroup: "G8", note: "sent to the dedicated solvent-recovery column (paper U8) rather than direct reuse" },
            { role: "output", name: "crude octocrylene", quantity: "3.50", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
            { role: "waste", name: "cyclohexane loss", quantity: "0.35", unit: "kg", phase: "V", status: "calculated", timing: "vent/emission", fate: "vent", scalingMode: "fixed loss %", destinationGroup: "G10", note: "evaporator vent to abatement train (paper U7); make-up fresh cyclohexane required" }
          ],
          { target_pressure: "150", phase_change_time: "2", phase_change_fraction: "90", transfer_endpoint: "cyclohexane evaporated to target (90% phase-change fraction)" },
          { target_pressure: "mbar", phase_change_time: "h", phase_change_fraction: "%" }
        ),
        makeBlock(
          "B9",
          "Purify the crude octocrylene by short-path distillation at 1.5 mbar, collecting purified octocrylene of at least 98 percent purity as final product and sending heavy residues to disposal.",
          "G7",
          "distillation purification",
          ["PT(VL)", "PS(VL)", "ES(H)"],
          [
            { role: "output", name: "purified octocrylene", quantity: "3.00", unit: "kg", phase: "L", status: "reported", timing: "final output", fate: "product", scalingMode: "per kg product" },
            { role: "waste", name: "heavy residue", quantity: "0.35", unit: "kg", phase: "L", status: "estimated", timing: "waste purge", fate: "purge", scalingMode: "per batch", note: "heavies to incineration / off-site disposal" }
          ],
          { target_pressure: "1.5", separation_efficiency: "95", phase_change_time: "1.5", transfer_endpoint: "at least 98 percent purity" },
          { target_pressure: "mbar", separation_efficiency: "%", phase_change_time: "h" }
        ),
        makeBlock(
          "B10",
          "Route the cyclohexane-rich vapor purge from the reactor and evaporator to a vent abatement train with a condenser and activated-carbon polishing, returning the recovered VOC by temperature-swing adsorption to the cyclohexane recovery column.",
          "G10",
          "vent gas treatment",
          ["PT(VL)", "PS(VL)", "PC(VS)", "ES(C)"],
          [
            { role: "output", name: "recovered VOC (cyclohexane-rich, TSA)", quantity: "0.36", unit: "kg", phase: "L", status: "assumed", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch", destinationGroup: "G8", note: "SI Step 4, second loop: temperature-swing adsorption recovers cyclohexane from the U7 vent and returns it to U8 (the recovery column), not directly to U1; capture fraction assumed 90%, not quantified in the SI" },
            { role: "waste", name: "uncaptured VOC to atmosphere", quantity: "0.04", unit: "kg", phase: "V", status: "assumed", timing: "vent/emission", fate: "vent", scalingMode: "fixed loss %", note: "residual emission after abatement; compliance limit dependent, assumed value" }
          ],
          { capture_efficiency: "90", contact_time: "0.5", transfer_endpoint: "VOC captured to target (90% capture efficiency)" },
          { capture_efficiency: "%", contact_time: "h" }
        ),
        makeBlock(
          "B11",
          "Feed the recovered cyclohexane condensate to a dedicated solvent-recovery column and return the purified cyclohexane to the feed stage.",
          "G8",
          "solvent recovery distillation",
          ["M(L)", "2phM(VL)", "PC(VL)", "PT(VL)", "PS(VL)", "ES(H)", "ES(C)"],
          [
            { role: "output", name: "purified cyclohexane", quantity: "3.73", unit: "kg", phase: "L", status: "assumed", timing: "in-process intermediate", fate: "recovered solvent", recoveryPercent: "98", scalingMode: "recycle loop", loopId: "CYHX", destinationGroup: "G1", note: "SI Step 4, first loop: 'A recovery efficiency of at least 98% is targeted'; column combines the U2 decanter purge (0.30 kg, B3) + U5 evaporator overhead (3.15 kg, B8) + U7 TSA return (0.36 kg, B10) = 3.81 kg feed x 98% before recycling to U1" },
            { role: "waste", name: "column bottoms / heavies", quantity: "0.08", unit: "kg", phase: "L", status: "assumed", timing: "waste purge", fate: "purge", scalingMode: "per batch", note: "minor heavies purge from the recovery-column reboiler (2% of the 3.81 kg combined feed)" }
          ],
          { reflux_ratio: "2", column_stages: "8", agitation_note: "staged reflux in solvent-recovery column" },
          {}
        ),
        makeBlock(
          "B12",
          "Route the aqueous wash effluent and reaction water to an on-site wastewater treatment interface for neutralization and off-site discharge.",
          "G9",
          "wastewater treatment",
          ["M(L)"],
          [
            { role: "output", name: "treated effluent", quantity: "2.34", unit: "kg", phase: "L", status: "assumed", timing: "waste purge", fate: "wastewater", scalingMode: "per batch", note: "combines organic-wash aqueous waste (B6) and condensation water (B3); neutralized before off-site WWT discharge" }
          ],
          { neutralization_ph_target: "7", residence_time: "1", agitation_note: "neutralization tank, pH-controlled" },
          { residence_time: "h" }
        )
      ];
      state.groups = {
        G1: { id: "G1", task: "feed preparation and heat-up", selectedUnit: "Jacketed vessel heat/cool step", selectionBasis: "combined charge/mixing and heat-up in the same stirred jacketed reactor; preserves the protocol step while industrial feed tanks only support charging (paper U1, SI Table S3)", schedule: { durationH: "1.5", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "roughly constant", dependency: "previous", notes: "charge from feed tanks (paper U1) plus heat to reflux; receives recovered cyclohexane loop CYHX. Duration per SI Table S1 B2: ramp to reflux 0.5-1 h, plus charge time - set to 1.5 h so the single-train Gantt sums to the SI's stated ~28 h makespan (SI Step 6)." }, properties: { heat_capacity: { value: "1.8", unit: "kJ/kg/K", status: "assumed", note: "aromatic/aliphatic mixture Cp" }, density: { value: "870", unit: "kg/m3", status: "assumed", note: "" } }, propertiesEditing: false, x: 620, y: 90 },
        G2: { id: "G2", task: "Knoevenagel reaction with in-situ water removal", selectedUnit: "Batch / semi-batch reactor", selectionBasis: "liquid-phase reaction plus reflux/Dean-Stark removal; selected as the scale-up reactor class in paper U2 and SI Step 6", schedule: { durationH: "20", parallelUnits: "1", canOverlap: "no", capacityAmount: "15", capacityUnit: "m3", scaleSensitivity: "kinetics-bound", dependency: "previous", notes: "15 m3 semi-batch jacketed reactor with reflux condenser and Dean-Stark internal loop (paper U2); 18-24 h lab range represented as 20 h cycle-time screening value (SI Step 6: limiting cycle time CT = max(tau/N) is set by U2 at approx. 20 h, kinetics-bound); kinetic bottleneck, cannot be relieved by parallelization within one unit. Reactor sizing per SI Step 6: stoichiometric charge (1512 kg benzophenone + 1637 kg 2-EH cyanoacetate, approx. 3.2 m3) plus cyclohexane at 2.5 L/kg product (7.5 m3 for a 3000 kg batch) gives a 10.7 m3 total charge; at 70% working fill this requires an approx. 15 m3 reactor, matching the paper exactly." }, properties: { heat_capacity: { value: "1.9", unit: "kJ/kg/K", status: "assumed", note: "" }, viscosity: { value: "40", unit: "mPa s", status: "assumed", note: "crude viscosity rises with conversion; mixing-sensitive at scale" } }, propertiesEditing: false, x: 1180, y: 90 },
        G3: { id: "G3", task: "cooling before work-up", selectedUnit: "External loop heat exchanger", selectionBasis: "cooling is heat-transfer limited at scale; external loop is kept as a conservative equipment-dependent cooling option rather than only jacket cooling", schedule: { durationH: "1", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "cooling duty scales with V/A ratio; jacket alone may be insufficient at 5 m3. Duration per SI Table S1 B4: 'Cool to room temperature; To 25 C; 1 h'." }, properties: { heat_capacity: { value: "1.9", unit: "kJ/kg/K", status: "assumed", note: "" } }, propertiesEditing: false, x: 1740, y: 90 },
        G4: { id: "G4", task: "counter-current water wash", selectedUnit: "Liquid-liquid extraction", selectionBasis: "two-stage counter-current liquid-liquid contact plus settling maps directly to mixer-settler/liquid-liquid extraction (paper U3)", schedule: { durationH: "1.5", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "increases with scale", dependency: "previous", notes: "2-stage counter-current mixer-settler train (paper U3); emulsion and settling risk at scale; aqueous to WWT interface (paper U9)" }, properties: { density_difference: { value: "130", unit: "kg/m3", status: "assumed", note: "" }, emulsion_risk: { value: "medium", unit: "", status: "assumed", note: "watch LL scale-up" } }, propertiesEditing: false, x: 2300, y: 90 },
        G5: { id: "G5", task: "organic phase drying", selectedUnit: "Drying", selectionBasis: "fixed-bed molecular-sieve column: not derivable from protocol phenomena, chosen by drying/adsorption heuristic", schedule: { durationH: "1.5", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "fixed-bed 4A molecular-sieve column, regenerable (paper U4); not derivable from protocol phenomena alone - heuristic selection. Third recycle loop per SI Step 4: periodic regeneration of this molecular-sieve bed (water desorbed, bed returned to service) replaces the single-use lab desiccant and avoids a continuous wet-solid waste stream. Duration close to B7's stated contact_time of 1 h plus loading/unloading margin; sized so the single-train Gantt sums to the SI's ~28 h makespan." }, properties: {}, propertiesEditing: false, x: 2860, y: 90 },
        G6: { id: "G6", task: "cyclohexane evaporation and recovery", selectedUnit: "Evaporation", selectionBasis: "thin-film evaporator over flash: heat-sensitivity heuristic H33 for the ester product", schedule: { durationH: "2.5", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "thin-film evaporator chosen over flash by heat-sensitivity heuristic H33 (paper U5); overhead condensate sent to the cyclohexane recovery column (paper U8), not recycled directly. Duration close to B8's stated phase_change_time of 2 h plus vacuum draw margin; sized so the single-train Gantt sums to the SI's ~28 h makespan." }, properties: { boiling_point: { value: "81", unit: "C", status: "reported", note: "cyclohexane" }, heat_capacity: { value: "1.85", unit: "kJ/kg/K", status: "assumed", note: "" } }, propertiesEditing: false, x: 3420, y: 90 },
        G7: { id: "G7", task: "final purification", selectedUnit: "Distillation", selectionBasis: "short-path molecular distillation at 1.5 mbar: heat-sensitivity heuristic, minimize thermal exposure", schedule: { durationH: "2", parallelUnits: "1", canOverlap: "yes", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "short-path molecular distillation at 1.5 mbar chosen by heat-sensitivity heuristic (paper U6); secondary bottleneck (SI Step 6: 3-5 h, relievable by parallelization); heavies to incineration/boiler fuel" }, properties: { viscosity: { value: "180", unit: "mPa s", status: "assumed", note: "crude octocrylene at feed temperature" } }, propertiesEditing: false, x: 3980, y: 90 },
        G8: { id: "G8", task: "cyclohexane recovery column", selectedUnit: "Distillation", selectionBasis: "not derivable from protocol phenomena alone: industrial addition with no laboratory counterpart (paper U8, SI 3.iv)", schedule: { durationH: "3", parallelUnits: "1", canOverlap: "yes", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "principal recycle loop (SI Step 4): standard distillation column combining the U2 reflux/decanter purge (G2), the U5 evaporator overhead (G6), and the U7 TSA vent return (G10); recovers cyclohexane at >=98% and returns it to U1 (G1)" }, properties: {}, propertiesEditing: false, x: 3420, y: 520 },
        G9: { id: "G9", task: "wastewater treatment interface", selectedUnit: "Wastewater treatment interface", selectionBasis: "not derivable from protocol phenomena alone: compliance interface with no laboratory counterpart (paper U9, SI 3.iv)", schedule: { durationH: "1", parallelUnits: "1", canOverlap: "yes", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "neutralization tank + bio-WWT inlet (paper U9); collects the reactor condensation water (G2) and the aqueous/brine wash effluent (G4, including the NH4OAc catalyst, which is not recovered - SI Table S3 task T6)" }, properties: {}, propertiesEditing: false, x: 1740, y: 520 },
        G10: { id: "G10", task: "vent abatement", selectedUnit: "Partial condensation / vaporization", selectionBasis: "condenser plus activated-carbon polishing: not derivable from protocol phenomena alone, VOC compliance heuristic (paper U7, SI 3.iv)", schedule: { durationH: "1", parallelUnits: "1", canOverlap: "yes", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "cold-trap condenser and activated-carbon bed treating cyclohexane/NH3 vents from the reactor (G2) and evaporator (G6) (paper U7); second recycle loop (SI Step 4): cyclohexane recovered by temperature-swing adsorption (TSA) returns to G8, not directly to G1" }, properties: {}, propertiesEditing: false, x: 2280, y: 520 }
      };
      state.links = [
        { from: "G1", to: "G2" },
        { from: "G2", to: "G3" },
        { from: "G3", to: "G4" },
        { from: "G4", to: "G5" },
        { from: "G5", to: "G6" },
        { from: "G6", to: "G7" },
        { from: "G2", to: "G8" },
        { from: "G6", to: "G8" },
        { from: "G8", to: "G1" },
        { from: "G4", to: "G9" },
        { from: "G2", to: "G9" },
        { from: "G2", to: "G10" },
        { from: "G6", to: "G10" },
        { from: "G10", to: "G8" }
      ];
      state.scaleBasis = {
        targetProduct: "octocrylene",
        targetAmount: "750",
        targetUnit: "t/year",
        referenceBlockId: "B9",
        basisAmount: "3.0",
        basisUnit: "kg",
        mode: "batch",
        operatingDays: "250",
        hoursPerDay: "24",
        batchesPerDay: "1",
        batchDuration: "",
        oeePercent: "80",
        parallelUnits: "1",
        allowableCapacityUtilizationPercent: "85",
        productKgPerBatch: "",
        reactantsLoadingLPerKgProduct: "1.067",
        solventLoadingLPerKgProduct: "2.5",
        reactorWorkingFillPercent: "70",
        productMolecularWeightGmol: "361.5",
        condensationWaterMolPerMol: "1",
        confidence: "rough"
      };
      state.ruleChecks = [];
      state.aiRefine = null;
      state.selectedBlockId = null;
      state.selectedGroupId = "G2";
      state.selectedIds = ["B3"];
      state.menuBlockId = null;
      state.menuGroupId = null;
      state.menuStreamId = null;
      state.connectingFrom = null;
      state.lastSelection = null;
      state.zoom = 0.62;
      state.boardCompact = true;
      state.draftPos = { x: 24, y: 24 };
      state.focusEndpoint = "G2";
      state.activeInspectorTab = "inspect";
      renderAll();
      requestAnimationFrame(() => {
        centerSelection();
      });
    }

    function loadTripleReactantExampleProject() {
      const text = "Charge 1.00 kg of benzyl alcohol, 0.95 kg of acetic anhydride, and 1.10 kg of triethylamine to a stirred liquid-phase reactor. Hold at 65 C for 3 h to form benzyl acetate at 90 percent yield. After reaction, evaluate recovery of residual triethylamine, acetic anhydride, and benzyl alcohol from the benzyl acetate product-rich liquid.";
      const makeBlock = (id, phrase, groupId, behavior, phenomena, streams, conditions = {}, conditionUnits = {}) => {
        const start = text.indexOf(phrase);
        return {
          id,
          groupId,
          start: start >= 0 ? start : 0,
          end: start >= 0 ? start + phrase.length : phrase.length,
          text: phrase,
          behavior,
          phenomena,
          streams: streams.map((stream, index) => createStream(stream.role, { id: `${id}-S${index + 1}`, ...stream })),
          conditions,
          conditionUnits,
          conditionsEditing: false,
          phase: "",
          endpoint: "",
          status: "secondary demo"
        };
      };

      state.text = text;
      $("sourceInput").value = text;
      state.blocks = [
        makeBlock(
          "B1",
          "Charge 1.00 kg of benzyl alcohol, 0.95 kg of acetic anhydride, and 1.10 kg of triethylamine to a stirred liquid-phase reactor. Hold at 65 C for 3 h to form benzyl acetate at 90 percent yield.",
          "G1",
          "reaction",
          ["R(L)", "M(L)", "ES(H)"],
          [
            { role: "input", name: "benzyl alcohol", quantity: "1.00", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch" },
            { role: "input", name: "acetic anhydride", quantity: "0.95", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch" },
            { role: "input", name: "triethylamine", quantity: "1.10", unit: "kg", phase: "L", status: "reported", timing: "initial charge", fate: "fresh input", scalingMode: "per batch" },
            { role: "output", name: "benzyl acetate", quantity: "1.39", unit: "kg", phase: "L", status: "calculated", timing: "in-process intermediate", fate: "product", scalingMode: "per batch", note: "Theoretical product basis from limiting benzyl alcohol; conversion popup makes 90%, approx. 1.25 kg." }
          ],
          { conversion_yield: "90", target_temperature: "65", reaction_time: "3", mixing_mode: "stirred liquid phase" },
          { conversion_yield: "%", target_temperature: "C", reaction_time: "h" }
        ),
        makeBlock(
          "B2",
          "After reaction, evaluate recovery of residual triethylamine, acetic anhydride, and benzyl alcohol from the benzyl acetate product-rich liquid.",
          "G2",
          "distillation purification",
          ["PT(VL)", "PS(VL)", "ES(H)"],
          [
            { role: "output", name: "recovered triethylamine", quantity: "0.26", unit: "kg", phase: "L", status: "calculated", timing: "in-process intermediate", fate: "recovered solvent", scalingMode: "per batch", destinationGroup: "G1" },
            { role: "output", name: "recovered acetic anhydride", quantity: "0.10", unit: "kg", phase: "L", status: "calculated", timing: "in-process intermediate", fate: "recover", scalingMode: "per batch", destinationGroup: "G1" },
            { role: "output", name: "benzyl alcohol residue", quantity: "0.10", unit: "kg", phase: "L", status: "calculated", timing: "waste purge", fate: "recover", scalingMode: "per batch" },
            { role: "output", name: "benzyl acetate product", quantity: "1.25", unit: "kg", phase: "L", status: "estimated", timing: "final output", fate: "product", scalingMode: "per batch" }
          ],
          { separation_efficiency: "90", transfer_endpoint: "benzyl acetate product", target_temperature: "80" },
          { separation_efficiency: "%", target_temperature: "C" }
        )
      ];
      const reactionBlock = state.blocks.find(block => block.id === "B1");
      if (reactionBlock) {
        reactionBlock.conversionDetail = {
          productStreamId: "B1-S4",
          byproducts: []
        };
      }
      state.groups = {
        G1: {
          id: "G1",
          task: "three-reactant benzyl acetate reaction at 90 percent yield",
          selectedUnit: "Batch / semi-batch reactor",
          selectionBasis: "secondary demo: reaction group used to test multi-reactant residual handling and sequential Lutze separation pathways",
          schedule: { ...scheduleDefaults(), durationH: "3", scaleSensitivity: "kinetics-bound", notes: "demo only; verify stoichiometry before design use" },
          properties: { density: { value: "930", unit: "kg/m3", status: "assumed", note: "demo mixture density for automatic reactor sizing from MFA mass" } },
          propertiesEditing: false,
          x: 620,
          y: 120
        },
        G2: {
          id: "G2",
          task: "sequential residual reagent recovery",
          selectedUnit: "Distillation",
          selectionBasis: "secondary demo: staged recovery of residual triethylamine, acetic anhydride, and benzyl alcohol from benzyl acetate",
          schedule: { ...scheduleDefaults(), durationH: "2", scaleSensitivity: "equipment dependent", notes: "demo only" },
          properties: {},
          propertiesEditing: false,
          x: 1180,
          y: 120
        }
      };
      state.links = [{ from: "G1", to: "G2" }, { from: "G2", to: "G1" }];
      state.scaleBasis = {
        ...state.scaleBasis,
        targetProduct: "benzyl acetate",
        targetAmount: "1.25",
        targetUnit: "kg/batch",
        referenceBlockId: "B2",
        basisAmount: "1.25",
        basisUnit: "kg",
        mode: "batch",
        productKgPerBatch: "",
        reactantsLoadingLPerKgProduct: "",
        solventLoadingLPerKgProduct: "",
        reactorWorkingFillPercent: "70",
        productMolecularWeightGmol: "150.18",
        condensationWaterMolPerMol: ""
      };
      state.ruleChecks = [];
      state.aiRefine = null;
      state.selectedBlockId = null;
      state.selectedGroupId = "G1";
      state.selectedIds = ["B1"];
      state.menuBlockId = null;
      state.menuGroupId = null;
      state.menuStreamId = null;
      state.connectingFrom = null;
      state.lastSelection = null;
      state.zoom = 0.78;
      state.boardCompact = true;
      state.draftPos = { x: 24, y: 24 };
      state.focusEndpoint = "G1";
      state.activeInspectorTab = "inspect";
      loadTripleReactantSeparationDemo("G1");
      renderAll();
      requestAnimationFrame(() => {
        centerSelection();
      });
    }

    function loadMethylbenzeneExampleProject() {
      loadTripleReactantExampleProject();
    }

    function normalizeStream(stream) {
      const role = streamRoles[stream?.role] ? stream.role : (streamRoles[stream?.type] ? stream.type : "input");
      return {
        id: String(stream?.id || ""),
        role,
        name: String(stream?.name || stream?.material || ""),
        quantity: String(stream?.quantity || stream?.qty || ""),
        conversionBaseQuantity: String(stream?.conversionBaseQuantity || ""),
        unit: streamUnits.includes(stream?.unit) ? stream.unit : "kg",
        phase: streamPhases.includes(stream?.phase) ? stream.phase : "unknown",
        status: streamDataStatuses.includes(stream?.status) ? stream.status : "missing",
        timing: streamTimingOptions.includes(stream?.timing) ? stream.timing : defaultStreamTiming(role),
        fate: streamFateOptions.includes(stream?.fate) ? stream.fate : defaultStreamFate(role, streamTimingOptions.includes(stream?.timing) ? stream.timing : defaultStreamTiming(role)),
        recoveryPercent: String(stream?.recoveryPercent || ""),
        purgePercent: String(stream?.purgePercent || ""),
        scalingMode: streamScalingModes.includes(stream?.scalingMode) ? stream.scalingMode : defaultStreamScalingMode(role, stream?.unit, stream?.fate),
        loopId: String(stream?.loopId || ""),
        destinationGroup: String(stream?.destinationGroup || ""),
        makeupRequired: String(stream?.makeupRequired || ""),
        accumulationRisk: String(stream?.accumulationRisk || ""),
        note: String(stream?.note || ""),
        ...Object.fromEntries(streamChemicalPropertyFields.map(field => [field, String(stream?.[field] || stream?.chemicalProperties?.[field] || "")])),
        thermalSensitivity: separationThermalOptions.includes(stream?.thermalSensitivity || stream?.chemicalProperties?.thermalSensitivity)
          ? String(stream?.thermalSensitivity || stream?.chemicalProperties?.thermalSensitivity)
          : "unknown",
        editing: Boolean(stream?.editing)
      };
    }

    function streamSectionMeta(role) {
      return role === "outlet" ? streamOutletMeta : streamRoles[role];
    }

    function streamIsOutlet(stream) {
      return outletRoles.includes(stream?.role);
    }

    function streamRoleForFate(fate, currentRole = "output") {
      if (currentRole === "input") return "input";
      return wasteFates.has(fate) ? "waste" : "output";
    }

    function streamTone(stream, displayRole = "") {
      if (displayRole === "input" || stream?.role === "input") return "input";
      if (recycleFates.has(stream?.fate)) return "recycle";
      if (productFates.has(stream?.fate)) return "product";
      if (wasteFates.has(stream?.fate) || stream?.role === "waste") return "waste";
      return "output";
    }

    function mfaGroupsForDisplay(aggregates) {
      const byRole = new Map(aggregates.map(group => [group.role, group]));
      const outletItems = outletRoles.flatMap(role => byRole.get(role)?.items || []);
      return streamEditorSections.map(role => {
        if (role === "outlet") return { role, items: outletItems };
        return byRole.get(role) || { role, items: [] };
      });
    }

    function defaultStreamScalingMode(role, unit = "", fate = "") {
      if (unit === "kg/kg product" || unit === "L/kg product") return "per kg product";
      if (["recycled input", "recovered solvent"].includes(fate)) return "recycle loop";
      if (fate === "loss" || fate === "purge") return "fixed loss %";
      if (role === "output") return "per kg product";
      return "auto";
    }

    function defaultStreamFate(role, timing = "") {
      if (role === "input") return "fresh input";
      if (role === "output") return timing === "final output" ? "product" : "intermediate";
      if (role === "waste") return "wastewater";
      return "unknown";
    }

    function defaultStreamTiming(role) {
      if (role === "input") return "initial charge";
      if (role === "output") return "in-process intermediate";
      if (role === "waste") return "waste purge";
      return "unspecified";
    }

    function streamNames(block, role) {
      return (block.streams || [])
        .filter(stream => stream.role === role && stream.name.trim())
        .map(stream => stream.name.trim());
    }

    function streamCounts(block) {
      ensureBlockFlowFields(block);
      const counts = Object.keys(streamRoles).reduce((counts, role) => {
        counts[role] = block.streams.filter(stream => stream.role === role).length;
        return counts;
      }, {});
      counts.outlet = counts.output + counts.waste;
      return counts;
    }

    function phaseLabel(code) {
      return lutzePhaseOptions.find(item => item[0] === code)?.[1] || code || "phase missing";
    }

    function phaseOptionHtml(selected) {
      return lutzePhaseOptions
        .map(([value, label]) => `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`)
        .join("");
    }

    function blockPhaseContext(block) {
      ensureBlockFlowFields(block);
      const raw = new Set();
      const effectiveRaw = new Set();
      const components = new Set();
      const inputComponents = new Set();
      const phaseCounts = { L: 0, V: 0, S: 0 };
      const inputPhaseCounts = { L: 0, V: 0, S: 0 };
      block.streams.forEach(stream => {
        if (!stream.phase || stream.phase === "unknown") return;
        raw.add(stream.phase);
        effectiveRaw.add(stream.phase);
        const parts = phaseComponents(stream.phase);
        parts.forEach(part => {
          components.add(part);
          phaseCounts[part] = (phaseCounts[part] || 0) + 1;
          if (stream.role === "input") {
            inputComponents.add(part);
            inputPhaseCounts[part] = (inputPhaseCounts[part] || 0) + 1;
          }
        });
      });
      deriveEffectivePhases(effectiveRaw, phaseCounts, inputPhaseCounts);
      return { raw, effectiveRaw, components, inputComponents, phaseCounts, inputPhaseCounts, hasKnown: raw.size > 0 };
    }

    function deriveEffectivePhases(effectiveRaw, phaseCounts, inputPhaseCounts) {
      const total = key => phaseCounts[key] || 0;
      const feeds = key => inputPhaseCounts[key] || 0;
      if (effectiveRaw.has("LL") || feeds("L") >= 2 || total("L") >= 2) effectiveRaw.add("LL");
      if (effectiveRaw.has("VL") || (total("V") >= 1 && total("L") >= 1)) effectiveRaw.add("VL");
      if (effectiveRaw.has("LS") || (total("L") >= 1 && total("S") >= 1)) effectiveRaw.add("LS");
      if (effectiveRaw.has("VS") || (total("V") >= 1 && total("S") >= 1)) effectiveRaw.add("VS");
      if (effectiveRaw.has("MVL")) effectiveRaw.add("VL");
      if (effectiveRaw.has("MLL")) effectiveRaw.add("LL");
      if (effectiveRaw.has("MVV") || effectiveRaw.has("VV") || feeds("V") >= 2 || total("V") >= 2) effectiveRaw.add("VV");
    }

    function phaseComponents(phase) {
      const normalized = String(phase || "").replace(/^M/, "");
      return ["V", "L", "S"].filter(part => normalized.includes(part));
    }

    function sanitizeBlockPhenomena(block) {
      const context = blockPhaseContext(block);
      if (!context.hasKnown) return;
      block.phenomena = block.phenomena.filter(code => phenomenonCompatibleWithPhase(code, context));
    }

    function phenomenonCompatibleWithPhase(code, context) {
      if (!context.hasKnown) return true;
      if (code.startsWith("ES(") || code === "SD") return true;
      const pch = code.match(/^PCh\(([VLS])->([VLS])\)$/);
      if (pch) return context.components.has(pch[1]) || context.components.has(pch[2]);
      const match = code.match(/\(([^)]+)\)$/);
      if (!match) return true;
      const phase = match[1].replace(/^M/, "");
      const parts = phaseComponents(phase);
      if (!parts.length) return true;
      if (parts.length === 1) return context.components.has(parts[0]);
      return phaseContextHas(context, phase);
    }

    function phaseContextHas(context, phase) {
      const normalized = String(phase || "").replace(/^M/, "");
      if (!normalized) return true;
      if (context.effectiveRaw?.has(normalized)) return true;
      const parts = phaseComponents(normalized);
      if (!parts.length) return true;
      if (parts.length === 1) return context.components.has(parts[0]);
      return false;
    }

    function availablePhenomenaForBlock(block) {
      if (!block) return phenomenaOptions;
      const context = blockPhaseContext(block);
      return phenomenaOptions.filter(code => phenomenonCompatibleWithPhase(code, context));
    }

    function blocksInOrder() {
      return [...state.blocks].sort((a, b) => a.start - b.start || a.end - b.end);
    }

    function groupIdsInTextOrder() {
      const seen = new Set();
      const ids = [];
      blocksInOrder().forEach(block => {
        if (block.groupId && !seen.has(block.groupId)) {
          seen.add(block.groupId);
          ids.push(block.groupId);
        }
      });
      return ids;
    }

    function blocksForGroup(groupId) {
      return blocksInOrder().filter(block => block.groupId === groupId);
    }

    function groupModel(groupId) {
      if (!groupId) return null;
      const blocks = blocksForGroup(groupId);
      const group = ensureGroup(groupId);
      return {
        ...group,
        blocks,
        phenomena: Array.from(new Set(blocks.flatMap(block => block.phenomena))),
        text: blocks.map(block => block.text).join(" ")
      };
    }

    function matchesForGroup(group) {
      const phen = new Set(group.phenomena);
      const context = groupPhaseContext(group);
      return unitCatalog
        .map(unit => {
          const overlap = unit.phenomena.filter(item => phen.has(item));
          const sameTask = unit.task === group.task;
          const score = overlap.length + (sameTask ? 6 : 0);
          return { ...unit, overlap, sameTask, score };
        })
        .filter(unit => unit.score > 0)
        .filter(unit => unitTaskCompatibleWithGroup(unit, group))
        .filter(unit => unit.phenomena.every(code => phenomenonCompatibleWithPhase(code, context)))
        .filter(unit => unitOperationFeedPhaseCompatible(unit, context))
        .sort((a, b) => b.score - a.score || Number(b.sameTask) - Number(a.sameTask));
    }

    function unitOperationCandidatesForGroup(group) {
      if ((group.phenomena || []).length) return scoredUnitCandidates(matchesForGroup(group), group);
      const context = groupPhaseContext(group);
      return unitCatalog
        .map(unit => {
          const textScore = taskTextUnitScore(group, unit);
          const phaseScore = unitOperationFeedPhaseCompatible(unit, context) ? 1 : 0;
          const conditionScore = unitConditionScore(group, unit);
          const mfaScore = unitMfaTransitionScore(group, unit);
          const score = textScore + phaseScore + conditionScore + mfaScore;
          return { ...unit, overlap: [], sameTask: false, score, conditionScore, mfaScore, preliminary: true };
        })
        .filter(unit => unit.score > 0)
        .filter(unit => preliminaryUnitTaskCompatible(unit, group))
        .filter(unit => unitOperationFeedPhaseCompatible(unit, context))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    }

    function scoredUnitCandidates(candidates, group) {
      return candidates
        .map(candidate => {
          const conditionScore = unitConditionScore(group, candidate);
          const mfaScore = unitMfaTransitionScore(group, candidate);
          return { ...candidate, conditionScore, mfaScore, score: candidate.score + conditionScore + mfaScore };
        })
        .sort((a, b) => b.score - a.score || Number(b.sameTask) - Number(a.sameTask));
    }

    function taskTextUnitScore(group, unit) {
      const text = `${group.task || ""} ${group.text || ""}`.toLowerCase();
      const add = (pattern, task, names = []) => {
        if (!pattern.test(text)) return 0;
        return unit.task === task || names.some(name => unit.name.toLowerCase().includes(name)) ? 6 : 0;
      };
      return Math.max(
        add(/react|synth|condensation|knoevenagel|conversion/, "reaction"),
        add(/heat|warm|cool|reflux|temperature|thermal/, "thermal conditioning"),
        add(/wash|extract|decan|phase split|aqueous|organic/, "separation", ["extraction", "decanter"]),
        add(/distill|evaporat|solvent removal|recover|purif|strip|flash/, "separation", ["distillation", "evaporation", "flash", "stripping"]),
        add(/crystall|precipitat/, "separation", ["crystallization"]),
        add(/dry|moisture|molecular sieve|desiccant/, "separation", ["drying"]),
        add(/wastewater|effluent|neutral/, "wastewater treatment"),
        add(/vent|voc|emission|abatement|condenser|adsorption|carbon/, "separation", ["condensation", "absorption"])
      );
    }

    function preliminaryUnitTaskCompatible(unit, group) {
      const text = `${group.task || ""} ${group.text || ""}`.toLowerCase();
      if (/wastewater|effluent|neutral/.test(text)) return unit.task === "wastewater treatment" || unit.task === "separation";
      if (/react|synth|condensation|knoevenagel|conversion/.test(text)) return unit.task.startsWith("reaction") || unit.task === "thermal conditioning";
      if (/feed|charge|prepar|dosing|mix/.test(text)) return unit.task === "reaction preparation" || unit.task === "thermal conditioning";
      if (/heat|warm|cool|reflux|temperature|thermal/.test(text) && !/distill|evaporat|recover/.test(text)) return unit.task === "thermal conditioning";
      if (/wash|extract|decan|distill|evaporat|solvent removal|recover|purif|strip|flash|crystall|precipitat|dry|vent|voc|emission|abatement/.test(text)) return unit.task === "separation" || unit.task === "thermal conditioning";
      return true;
    }

    function unitConditionScore(group, unit) {
      const ids = new Set(aggregateGroupConditions(group).map(item => item.id));
      const unitText = `${unit.task} ${unit.name}`.toLowerCase();
      let score = 0;
      if ((ids.has("reaction_time") || ids.has("conversion_yield")) && /react/.test(unitText)) score += 3;
      if ((ids.has("target_temperature") || ids.has("holding_temperature") || ids.has("thermal_ramp")) && /thermal|heat|cool|reactor|reboiler|condenser|evapor|distill/.test(unitText)) score += 2;
      if ((ids.has("phase_change_time") || ids.has("target_pressure")) && /evapor|distill|flash|stripping|condenser|reboiler/.test(unitText)) score += 3;
      if ((ids.has("settling_time") || ids.has("separation_efficiency")) && /decanter|extraction|liquid-liquid|separation/.test(unitText)) score += 3;
      if ((ids.has("contact_time") || ids.has("agitation_note")) && /mixer|extraction|reactor|drying|adsorption/.test(unitText)) score += 1;
      if ((ids.has("solid_loading") || ids.has("cake_or_particle_note") || ids.has("solid_endpoint")) && /filter|crystall|dry|solid/.test(unitText)) score += 3;
      return score;
    }

    function unitMfaTransitionScore(group, unit) {
      const streams = group.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams.filter(stream => String(stream.name || "").trim());
      });
      const inputPhases = new Set(streams.filter(stream => stream.role === "input").map(stream => stream.phase).filter(Boolean));
      const outputPhases = new Set(streams.filter(stream => stream.role !== "input").map(stream => stream.phase).filter(Boolean));
      const unitText = `${unit.task} ${unit.name}`.toLowerCase();
      let score = 0;
      if (streams.some(stream => stream.role === "waste") && /separation|wastewater|decanter|distill|evapor|filter|dry/.test(unitText)) score += 1;
      if (inputPhases.has("L") && (outputPhases.has("V") || outputPhases.has("VL")) && /evapor|distill|flash|stripping|vapor|condenser/.test(unitText)) score += 2;
      if ((inputPhases.has("LL") || outputPhases.has("LL")) && /decanter|extraction|liquid-liquid/.test(unitText)) score += 2;
      if ((inputPhases.has("LS") || outputPhases.has("LS") || outputPhases.has("S")) && /filter|crystall|dry|solid/.test(unitText)) score += 2;
      return score;
    }

    function unitTaskCompatibleWithGroup(unit, group) {
      const phen = new Set(group.phenomena || []);
      const taskText = String(group.task || "").toLowerCase();
      const hasReaction = [...phen].some(code => code.startsWith("R("));
      const hasSeparation = [...phen].some(code => code.startsWith("PS(") || code.startsWith("PT(") || code.startsWith("PC(") || code.startsWith("PCh("));
      const hasThermal = [...phen].some(code => code === "ES(H)" || code === "ES(C)");
      const hasOnlyEnergy = phen.size > 0 && [...phen].every(code => code.startsWith("ES("));
      const hasOnlyMixing = phen.size > 0 && [...phen].every(code => code.startsWith("M(") || code.startsWith("2phM("));
      const isPrepTask = /feed|charge|prepar|heat-up|mix|dosing/.test(taskText);
      const isRecoveryOrPurificationTask = /recover|recovery|purif|distill|evaporat|solvent removal/.test(taskText);
      const isVentTask = /vent|abatement|voc|emission|condenser|adsorption|carbon/.test(taskText);
      if (/wastewater|waste treatment|effluent|neutral/i.test(group.task || "")) {
        return unit.task === "wastewater treatment" || unit.task === "separation" || unit.task === "thermal conditioning";
      }
      if (!hasReaction && unit.task.startsWith("reaction")) return false;
      if (hasOnlyEnergy) return unit.task === "thermal conditioning";
      if (group.task === "thermal conditioning") return unit.task === "thermal conditioning" || hasSeparation;
      if (group.task === "reaction preparation" || isPrepTask || hasOnlyMixing) {
        return unit.task === "reaction preparation" || (hasThermal && unit.task === "thermal conditioning");
      }
      if (hasReaction) return unit.task.startsWith("reaction") || unit.task === "thermal conditioning";
      if (isVentTask) return unit.task === "separation" || unit.task === "thermal conditioning";
      if (isRecoveryOrPurificationTask) return unit.task === "separation" || unit.task === "thermal conditioning";
      if (hasSeparation) return unit.task === "separation" || unit.task === "thermal conditioning";
      return unit.sameTask || unit.task === group.task;
    }

    function groupPhaseContext(group) {
      const synthetic = {
        streams: group.blocks.flatMap(block => {
          ensureBlockFlowFields(block);
          return block.streams;
        })
      };
      return blockPhaseContext(synthetic);
    }

    function unitOperationFeedPhaseCompatible(unit, context) {
      if (!context.hasKnown || !Array.isArray(unit.feedPhases) || !unit.feedPhases.length) return true;
      return unit.feedPhases.some(phase => phaseContextHas(context, phase));
    }

    function alternativeReason(candidate) {
      const fit = [];
      if (candidate.sameTask) fit.push("it matches the assigned task");
      if (candidate.overlap?.length) fit.push(`it covers ${candidate.overlap.join(", ")}`);
      const basis = fit.length ? fit.join(" and ") : "it is a related heuristic option";
      const feed = candidate.feedPhases?.length ? ` Typical feed phase: ${candidate.feedPhases.join(", ")}.` : "";
      const outlet = candidate.outlet ? ` Key outlet phase: ${candidate.outlet}.` : "";
      return `${candidate.rationale}${feed}${outlet} Use this when ${basis}.`;
    }

    function proposalBasisHtml(group, alternatives) {
      const context = groupPhaseContext(group);
      const phases = Array.from(context.effectiveRaw || []);
      return `
        <div class="proposal-basis">
          <span><strong>Ranking</strong> task class + MFA phase transition + conditions</span>
          <span><strong>Refinement</strong> Lutze phenomena and phase compatibility, when reviewed</span>
          <span><strong>Group phases</strong> ${escapeHtml(phases.length ? phases.join(", ") : "unknown")}</span>
          <span><strong>Candidates</strong> ${alternatives.length}</span>
        </div>
      `;
    }

    function groupUnitSuggestionReadiness(group) {
      const streams = group.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams
          .filter(stream => String(stream.name || "").trim())
          .map(stream => ({ ...stream, blockId: block.id }));
      });
      const roleCount = role => streams.filter(stream => stream.role === role).length;
      const materialStreams = streams.filter(stream => ["input", "output", "waste"].includes(stream.role));
      const missingPhaseCount = materialStreams.filter(stream => !stream.phase || stream.phase === "unknown").length;
      const taskReady = Boolean(group.task && group.task !== "unassigned");
      const mfaReady = roleCount("input") > 0 && (roleCount("output") > 0 || roleCount("waste") > 0);
      const phaseReady = materialStreams.length > 0 && missingPhaseCount === 0;
      const conditionsReady = aggregateGroupConditions(group).length > 0;
      const lutzeReady = group.phenomena.length > 0;
      const missing = [];
      if (!taskReady) missing.push("task definition");
      if (!mfaReady) missing.push("input + output/waste streams");
      if (!phaseReady) missing.push("stream phase labels");
      if (!conditionsReady) missing.push("conditions");
      const dataReady = taskReady && mfaReady && phaseReady && conditionsReady;
      return {
        taskReady,
        mfaReady,
        phaseReady,
        conditionsReady,
        lutzeReady,
        dataReady,
        ready: dataReady,
        missing,
        missingPhaseCount,
        streamCount: materialStreams.length
      };
    }

    function groupUnitSuggestionGateHtml(group, options = {}) {
      const readiness = groupUnitSuggestionReadiness(group);
      const groupState = ensureGroup(group.id);
      const showSuggestions = readiness.ready && groupState.unitSuggestionsExpanded && !options.board;
      const alternatives = showSuggestions ? unitOperationCandidatesForGroup(group).slice(0, 5) : [];
      const label = group.selectedUnit ? "Switch Unit Operation" : "Assign Unit Operation";
      const status = group.selectedUnit || (readiness.ready ? "ready to assign" : `needs ${readiness.missing.join(", ") || "task data"}`);
      if (options.board) {
        return `
          <button class="unit-action-button ${readiness.ready ? "ready" : ""}" data-suggest-unit-operation="${escapeAttr(group.id)}" ${readiness.ready ? "" : "disabled"}
            title="${escapeAttr(readiness.ready ? "Assign or switch the task unit operation from completed MFA, phase, and condition data." : `Complete ${readiness.missing.join(", ") || "task data"} before assigning a unit operation.`)}">
            ${escapeHtml(label)}
          </button>
        `;
      }
      return `
        <div class="unit-suggest-gate compact ${readiness.ready ? "ready" : "blocked"}">
          <div class="unit-suggest-main">
            <div>
              <strong>Unit Operation</strong>
              <span class="muted small">${escapeHtml(status)}</span>
            </div>
            <button class="unit-action-button ${readiness.ready ? "ready" : ""}" data-suggest-unit-operation="${escapeAttr(group.id)}" ${readiness.ready ? "" : "disabled"}
              title="${escapeAttr(readiness.ready ? "Assign or switch the task unit operation from completed MFA, phase, and condition data." : `Complete ${readiness.missing.join(", ") || "task data"} before assigning a unit operation.`)}">
              ${escapeHtml(label)}
            </button>
          </div>
          ${showSuggestions ? `
            <div class="unit-suggest-results">
              <div class="unit-suggest-result-head">
                <strong>Suggestions</strong>
                <span class="muted small">task + MFA/phases + conditions${readiness.lutzeReady ? " + Lutze" : ""}</span>
              </div>
              ${alternatives.length ? alternatives.map(candidate => `
                <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-unit="${escapeAttr(candidate.name)}" data-unit-group="${escapeAttr(group.id)}" data-tip="${escapeAttr(alternativeReason(candidate))}">
                  ${escapeHtml(candidate.name)}
                  ${candidateFitMetaHtml(candidate)}
                </button>
              `).join("") : `<div class="mfa-empty">No unit operation candidate matches the current task and phase context yet.</div>`}
            </div>
          ` : groupState.unitSuggestionsExpanded ? `
            <div class="mfa-empty">Suggestions are hidden until task, MFA, phases, and conditions are complete again.</div>
          ` : ""}
        </div>
      `;
    }

    function boardUnitOperationPickerHtml(group, limit = 4) {
      const readiness = groupUnitSuggestionReadiness(group);
      const groupState = ensureGroup(group.id);
      if (!readiness.ready || !groupState.unitSuggestionsExpanded) return "";
      const alternatives = unitOperationCandidatesForGroup(group).slice(0, limit);
      return `
        <div class="board-unit-picker">
          ${alternatives.length ? alternatives.map(candidate => `
            <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-unit="${escapeAttr(candidate.name)}" data-unit-group="${escapeAttr(group.id)}" data-tip="${escapeAttr(alternativeReason(candidate))}">
              ${escapeHtml(candidate.name)}
            </button>
          `).join("") : `<span class="muted small">No matching unit operation.</span>`}
        </div>
      `;
    }

    function candidateFitMetaHtml(candidate) {
      if (candidate.preliminary) {
        const evidence = [
          "task/phase",
          candidate.conditionScore ? "conditions" : "",
          candidate.mfaScore ? "MFA transition" : ""
        ].filter(Boolean).join(" + ");
        return `<span class="candidate-fit-meta">pre-Lutze suggestion; score ${candidate.score}; ${escapeHtml(evidence)}</span>`;
      }
      const overlap = candidate.overlap?.length ? candidate.overlap.join(", ") : "no direct overlap";
      const evidence = [
        overlap,
        candidate.conditionScore ? `conditions +${candidate.conditionScore}` : "",
        candidate.mfaScore ? `MFA +${candidate.mfaScore}` : ""
      ].filter(Boolean).join("; ");
      return `<span class="candidate-fit-meta">score ${candidate.score}; ${escapeHtml(evidence)}</span>`;
    }

    function selectionBasisStatus(group) {
      const text = String(group.selectionBasis || "");
      if (!text.trim()) return { label: "basis missing", className: "warn" };
      if (/paper|SI |Table|U\d+|KB|H\d+/i.test(text)) return { label: "paper-linked", className: "blue" };
      if (/heuristic|assum|not derivable|screen|property|scale/i.test(text)) return { label: "heuristic", className: "green" };
      return { label: "recorded", className: "green" };
    }

    function selectionBasisHtml(group) {
      if (!group.selectedUnit) return "";
      const status = selectionBasisStatus(group);
      return `
        <div class="selection-basis-row">
          <div class="row between">
            <div class="label">Selection basis - why ${escapeHtml(group.selectedUnit)}?</div>
            <span class="pill ${status.className}">${escapeHtml(status.label)}</span>
          </div>
          <input data-selection-basis="${escapeAttr(group.id)}" value="${escapeAttr(group.selectionBasis || "")}"
            placeholder="paper unit, heuristic rule, property screen, or scale-up assumption">
        </div>
      `;
    }

    function selectedUnitInCurrentRanking(group) {
      return Boolean(group.selectedUnit && unitOperationCandidatesForGroup(group).some(candidate => candidate.name === group.selectedUnit));
    }

    function selectedUnitSupportedByEvidence(group) {
      if (!group.selectedUnit) return false;
      if (selectedUnitInCurrentRanking(group)) return true;
      return selectionBasisStatus(group).className !== "warn";
    }

    function phenomenonTip(code) {
      return phenomenonGlossary[code] || "Phenomenological descriptor used to compare blocks with possible unit-operation alternatives.";
    }

    function phenomenonPill(code) {
      return `<span class="pill green tip" data-tip="${escapeAttr(phenomenonTip(code))}">${escapeHtml(code)}</span>`;
    }

    function phenomenonOptionButton(code, active, disabled) {
      return `<button class="phen-option tip ${active ? "active" : ""}" data-phen="${escapeAttr(code)}" data-tip="${escapeAttr(phenomenonTip(code))}" ${disabled ? "disabled" : ""}>${escapeHtml(code)}</button>`;
    }

    async function loadTextView() {
      if (state.blocks.length && !(await confirmModal("Loading the text view clears all current blocks, groups, and arrows. Continue?"))) return;
      pushUndo();
      state.text = $("sourceInput").value;
      state.blocks = [];
      state.groups = {};
      state.links = [];
      state.selectedBlockId = null;
      state.selectedGroupId = null;
      state.selectedIds = [];
      state.connectingFrom = null;
      state.lastSelection = null;
      state.aiRefine = null;
      state.zoom = 0.78;
      state.draftPos = { x: 24, y: 24 };
      state.focusEndpoint = null;
      renderAll();
    }

    // Walks only the text that actually exists in state.text, skipping each highlighted block's
    // own "B1"-style label and "x" delete button - both live inside the same <span> as the real
    // block text (see renderAnnotatedText) but aren't part of state.text. The previous
    // implementation used a plain Range spanning from the container start to the selection start
    // and took its .toString().length as the offset; that counted the label/button text too, so
    // every block already highlighted before the selection point added a few extra phantom
    // characters, shifting the computed start/end later and later into the document - visibly, a
    // selection landing a few characters short at the start and a few characters long at the end.
    function selectionOffsets() {
      const container = $("annotatedText");
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") return null;
      if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) return null;
      const range = selection.getRangeAt(0);
      const isDecoration = node => Boolean(node.parentElement?.closest(".annotated-block-label, .annotated-block-delete"));
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: node => (isDecoration(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
      });
      let offset = 0;
      let start = null;
      let end = null;
      let node;
      while ((node = walker.nextNode())) {
        if (node === range.startContainer) start = offset + range.startOffset;
        if (node === range.endContainer) end = offset + range.endOffset;
        offset += node.textContent.length;
        if (start !== null && end !== null) break;
      }
      if (start === null || end === null) return null;
      return { start, end, source: "annotated" };
    }

    async function createBlockFromSelection() {
      const offsets = selectionOffsets() || state.lastSelection || await sourceInputSelection();
      if (!offsets) {
        $("selectionInfo").textContent = "Select text in the loaded text view first, then create a block.";
        return;
      }
      await createBlock(offsets.start, offsets.end);
    }

    // Read-only: returns the current raw-textarea selection as character offsets, with no
    // side effects. Safe to call from passive tracking (rememberSelection, context menus) that
    // fire on every mouseup/keyup and must never mutate project state on their own.
    function sourceInputOffsets() {
      const source = $("sourceInput");
      if (source.selectionStart === source.selectionEnd) return null;
      return {
        start: Math.min(source.selectionStart, source.selectionEnd),
        end: Math.max(source.selectionStart, source.selectionEnd),
        source: "source"
      };
    }

    function storeTextSelection(offsets, stale = false) {
      if (!offsets) return false;
      state.lastSelection = offsets;
      state.lastSelectionAt = Date.now();
      $("selectionInfo").textContent = stale
        ? `Selected characters ${offsets.start}-${offsets.end}.`
        : `Selected characters ${offsets.start}-${offsets.end}.`;
      return true;
    }

    // Committing variant, used only where a selection is about to be turned into a block
    // (createBlockFromSelection). If the raw text was edited since the blocks/groups were built,
    // their character offsets no longer line up with it, so — same as loadTextView() — this asks
    // for confirmation before clearing them, instead of doing it silently as a side effect of
    // selecting text (previously this ran on every mouseup/keyup in the textarea, so editing a
    // typo and then merely adjusting the selection with Shift+Arrow could wipe the whole project
    // with no prompt and no way to tell what happened).
    async function sourceInputSelection() {
      const offsets = sourceInputOffsets();
      if (!offsets) return null;
      const source = $("sourceInput");
      if (state.text !== source.value) {
        if (!(await confirmModal("The protocol text has been edited since these blocks were created. Creating a block here will reload the text view and clear all current blocks, groups, and arrows. Continue?"))) return null;
        pushUndo();
        state.text = source.value;
        state.blocks = [];
        state.groups = {};
        state.links = [];
        state.selectedBlockId = null;
        state.selectedGroupId = null;
        state.selectedIds = [];
        state.aiRefine = null;
      }
      return offsets;
    }

    function rememberSelection() {
      const offsets = selectionOffsets() || sourceInputOffsets();
      if (storeTextSelection(offsets)) return;
      if (state.lastSelection && Date.now() - state.lastSelectionAt < 15000) return;
      state.lastSelection = null;
      state.lastSelectionAt = 0;
      $("selectionInfo").textContent = "No active text selection.";
    }

    function isTextContextMouseDown(event) {
      return event.button === 2 || (event.button === 0 && event.ctrlKey);
    }

    function isProtocolTextTarget(target) {
      const source = $("sourceInput");
      const annotated = $("annotatedText");
      return Boolean(target && (target === source || source.contains(target) || annotated.contains(target)));
    }

    function isExistingBlockTarget(target) {
      const element = target?.nodeType === Node.ELEMENT_NODE ? target : target?.parentElement;
      return Boolean(element?.closest?.("[data-block-id]"));
    }

    function handleTextSelectionRightMouseDown(event) {
      if (!isTextContextMouseDown(event)) return;
      if (!isProtocolTextTarget(event.target) || isExistingBlockTarget(event.target)) return;
      const offsets = selectionOffsets() || sourceInputOffsets();
      if (!offsets) return;
      event.preventDefault();
      event.stopPropagation();
      storeTextSelection(offsets);
      restoreTextSelection(offsets);
    }

    function handleTextSelectionContextMenu(event) {
      if (!isProtocolTextTarget(event.target) || isExistingBlockTarget(event.target)) return;
      const recentStored = state.lastSelection && Date.now() - state.lastSelectionAt < 15000 ? state.lastSelection : null;
      const offsets = selectionOffsets() || sourceInputOffsets() || recentStored;
      event.preventDefault();
      event.stopPropagation();
      if (offsets) {
        storeTextSelection(offsets);
        restoreTextSelection(offsets);
      }
      showTextSelectionMenu(event.clientX, event.clientY, { hasSelection: Boolean(offsets) });
    }

    function restoreTextSelection(offsets = state.lastSelection) {
      if (!offsets) return;
      if (offsets.source === "source") {
        const source = $("sourceInput");
        source.focus({ preventScroll: true });
        source.setSelectionRange(offsets.start, offsets.end);
        return;
      }
      if (offsets.source === "annotated") restoreAnnotatedSelection(offsets.start, offsets.end);
    }

    function restoreAnnotatedSelection(start, end) {
      const root = $("annotatedText");
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let pos = 0;
      let startSet = false;
      let node;
      while ((node = walker.nextNode())) {
        const next = pos + node.nodeValue.length;
        if (!startSet && start >= pos && start <= next) {
          range.setStart(node, start - pos);
          startSet = true;
        }
        if (startSet && end >= pos && end <= next) {
          range.setEnd(node, end - pos);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        pos = next;
      }
    }

    function renderAnnotatedText() {
      const root = $("annotatedText");
      if (!state.text) {
        root.innerHTML = `<span class="muted">Load text to start annotating blocks.</span>`;
        return;
      }

      const blocks = blocksInOrder().filter(isTextLinkedBlock);
      let html = "";
      let cursor = 0;
      let i = 0;
      while (i < blocks.length) {
        const block = blocks[i];
        const siblings = [block];
        while (i + siblings.length < blocks.length && blocks[i + siblings.length].start === block.start && blocks[i + siblings.length].end === block.end) {
          siblings.push(blocks[i + siblings.length]);
        }
        i += siblings.length;
        html += escapeHtml(state.text.slice(cursor, block.start));
        const classes = [
          "annotated-block",
          siblings.some(item => state.selectedIds.includes(item.id)) ? "selected" : "",
          siblings.some(item => state.selectedBlockId === item.id) ? "primary-selected" : ""
        ].filter(Boolean).join(" ");
        const extraLabel = siblings.length > 1 ? ` <span class="pill" title="${escapeAttr(siblings.slice(1).map(item => item.id).join(", "))} share this same text (e.g. parallel-unit copies) — manage them on the board">+${siblings.length - 1}</span>` : "";
        html += `<span class="${classes}" data-label="${escapeAttr(block.id)}" data-block-id="${block.id}" title="${escapeAttr(siblings.map(item => item.id).join(", "))} / ${escapeAttr(block.groupId || "ungrouped")}"><span class="annotated-block-label">${escapeHtml(block.id)}${extraLabel}</span><button class="annotated-block-delete" data-delete-block="${escapeAttr(block.id)}" title="Delete ${escapeAttr(block.id)}" aria-label="Delete ${escapeAttr(block.id)}">x</button>${escapeHtml(state.text.slice(block.start, block.end))}</span>`;
        cursor = block.end;
      }
      html += escapeHtml(state.text.slice(cursor));
      root.innerHTML = html;

      root.querySelectorAll("[data-block-id]").forEach(span => {
        span.addEventListener("click", event => {
          if (event.target.closest?.("[data-delete-block]")) return;
          if (state.connectingFrom && state.connectingFrom !== span.dataset.blockId) {
            addConnection(state.connectingFrom, span.dataset.blockId);
            return;
          }
          selectBlock(span.dataset.blockId, event.shiftKey);
        });
        span.addEventListener("contextmenu", event => {
          event.preventDefault();
          event.stopPropagation();
          if (!state.selectedIds.includes(span.dataset.blockId)) selectBlock(span.dataset.blockId, event.shiftKey);
          showBlockMenu(event.clientX, event.clientY, span.dataset.blockId);
        });
      });
      root.querySelectorAll("[data-delete-block]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          deleteBlock(button.dataset.deleteBlock);
        });
      });
    }

    function selectBlock(blockId, additive) {
      const block = state.blocks.find(item => item.id === blockId);
      if (!block) return;
      state.selectedBlockId = blockId;
      if (additive) {
        if (state.selectedIds.includes(blockId)) {
          state.selectedIds = state.selectedIds.filter(id => id !== blockId);
          if (!state.selectedIds.length) state.selectedIds = [blockId];
        } else {
          state.selectedIds.push(blockId);
        }
      } else {
        state.selectedIds = [blockId];
      }
      const completeGroupId = selectedIdsCompleteGroupId();
      if (completeGroupId) {
        state.selectedGroupId = completeGroupId;
        state.selectedBlockId = null;
        state.focusEndpoint = completeGroupId;
      } else {
        state.selectedGroupId = block.groupId && !additive ? block.groupId : null;
        state.focusEndpoint = block.groupId || block.id;
      }
      renderAll();
    }

    function selectGroup(groupId) {
      const blocks = blocksForGroup(groupId);
      state.selectedGroupId = groupId;
      state.selectedBlockId = null;
      state.selectedIds = blocks.map(block => block.id);
      state.focusEndpoint = groupId;
      renderAll();
    }

    function renderGroupFlow() {
      const root = $("groupFlow");
      $("zoomReadout").textContent = `${Math.round(state.zoom * 100)}%`;
      $("toggleCompact").textContent = state.boardCompact ? "Detailed" : "Compact";
      $("toggleCompact").classList.toggle("primary", state.boardCompact);
      if (!state.blocks.length) {
        root.classList.remove("has-group-drawer");
        root.innerHTML = `<div class="empty">Create blocks from highlighted text. They will appear here as Draft Blocks first.</div>`;
        return;
      }
      const groupIds = groupIdsInTextOrder();
      const draftBlocks = blocksInOrder().filter(block => !block.groupId);
      const board = boardBounds();
      const boardClearance = groupDrawerBoardClearance();
      const displayBoard = boardWithDrawerClearance(board);
      const draftHtml = draftBlocks.length ? `
        <section class="group-box draft" style="left:${state.draftPos.x}px; top:${state.draftPos.y}px; width:${nodeWidth(draftBlocks.length, "draft")}px" data-draft-box="true">
          <div class="group-head">
            <div class="row">
              <strong>Draft Blocks</strong>
              <span class="pill warn">not task-assigned</span>
            </div>
            <span class="pill">${draftBlocks.length} block${draftBlocks.length === 1 ? "" : "s"}</span>
          </div>
          <div class="muted small" style="margin-bottom:8px">These are text blocks. Shift-click two or more, then right-click and Combine Selected to create a task group.</div>
          <div class="block-strip">
            ${draftBlocks.map(block => blockCardHtml(block)).join("")}
          </div>
        </section>
      ` : "";
      const groupHtml = groupIds.map(groupId => {
        const group = groupModel(groupId);
        const unitReadiness = groupUnitSuggestionReadiness(group);
        const active = state.selectedGroupId === group.id;
        const contextActive = !active && group.blocks.some(block => state.selectedIds.includes(block.id));
        const boxClasses = `group-box tip ${state.boardCompact ? "compact" : ""} ${active ? "active" : ""} ${contextActive ? "context-active" : ""} ${state.connectingFrom === group.id ? "connecting" : ""}`;
        if (state.boardCompact) {
          const category = flowsheetUnitCategory(group);
          const icon = flowsheetCategoryIcon[category] || "◼";
          return `
            <section class="${boxClasses}" style="left:${group.x}px; top:${group.y}px; width:${nodeWidth(group.blocks.length)}px" data-group-box="${group.id}" data-node-id="${group.id}" data-tip="${escapeAttr(groupContentsTip(group))}">
              <span class="connect-handle" data-connect-handle="${escapeAttr(group.id)}" title="Drag to another group or block to connect them"></span>
              <div class="group-head">
                <div class="row">
                  <span class="compact-icon compact-icon-${category}">${icon}</span>
                  <strong>${escapeHtml(group.id)}</strong>
                </div>
                <span class="pill ${active ? "green" : ""}">${active ? "selected" : group.blocks.length}</span>
              </div>
              <div class="compact-body">
                <strong>${escapeHtml(group.selectedUnit || "no unit selected")}</strong>
                <span class="muted small">${escapeHtml(group.task)}</span>
                ${groupUnitSuggestionGateHtml(group, { board: true })}
                ${boardUnitOperationPickerHtml(group, 3)}
                <span class="compact-open-hint">Click to open group</span>
              </div>
            </section>
          `;
        }
        return `
          <section class="${boxClasses}" style="left:${group.x}px; top:${group.y}px; width:${nodeWidth(group.blocks.length)}px" data-group-box="${group.id}" data-node-id="${group.id}" data-tip="${escapeAttr(groupContentsTip(group))}">
            <span class="connect-handle" data-connect-handle="${escapeAttr(group.id)}" title="Drag to another group or block to connect them"></span>
            <div class="group-head">
              <div class="row">
                <strong>${escapeHtml(group.id)}</strong>
                <span class="pill blue">${escapeHtml(group.task)}</span>
                ${active ? `<span class="selected-group-badge">Selected</span>` : ""}
              </div>
              <div class="row">
                <button class="mini-button" data-select-group="${escapeAttr(group.id)}" title="Open this group below: summed MFA, aggregated conditions, unit alternatives, and selection basis">Open Group</button>
                <span class="pill">${group.blocks.length} block${group.blocks.length === 1 ? "" : "s"}</span>
              </div>
            </div>
            ${groupCompositeSummaryHtml(group)}
            <div class="block-strip composite">
              ${group.blocks.map(block => blockCardHtml(block)).join("")}
            </div>
            <div class="group-summary">
              <div class="label">Summed Phenomena</div>
              ${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted">No phenomena assigned.</span>`}
              ${groupMfaSummaryHtml(group)}
              ${groupConditionSummaryHtml(group)}
              ${state.showConnections && linksForGroup(group.id).length ? `<div class="group-connection-chips">${linksForGroup(group.id).map(link => `<span class="link-chip">${escapeHtml(formatLink(link, group.id))}</span>`).join("")}</div>` : ""}
              <div class="group-unit-summary">
                <div class="label">Unit Operation</div>
                <strong>${escapeHtml(group.selectedUnit || "not selected")}</strong>
                ${groupUnitSuggestionGateHtml(group, { board: true })}
                ${boardUnitOperationPickerHtml(group)}
                <span class="muted small">${unitReadiness.ready ? "Ready from task, MFA/phases, and conditions." : `Complete ${escapeHtml(unitReadiness.missing.join(", ") || "task data")} before assigning.`}</span>
              </div>
            </div>
          </section>
        `;
      }).join("");
      root.classList.toggle("has-group-drawer", boardClearance > 0);
      root.innerHTML = `
        <div class="board-space" style="width:${displayBoard.width * state.zoom}px; height:${displayBoard.height * state.zoom}px">
          <div class="board-canvas" style="width:${displayBoard.width}px; height:${displayBoard.height}px; transform:scale(${state.zoom})">
            ${renderLinksSvg(displayBoard)}
            ${draftHtml}
            ${groupHtml}
          </div>
        </div>
      `;

      root.querySelectorAll("[data-block-card]").forEach(card => {
        card.addEventListener("click", event => {
          if (state.connectingFrom && state.connectingFrom !== card.dataset.blockCard) {
            addConnection(state.connectingFrom, card.dataset.blockCard);
            return;
          }
          selectBlock(card.dataset.blockCard, event.shiftKey);
        });
        card.addEventListener("contextmenu", event => {
          event.preventDefault();
          event.stopPropagation();
          if (!state.selectedIds.includes(card.dataset.blockCard)) selectBlock(card.dataset.blockCard, event.shiftKey);
          showBlockMenu(event.clientX, event.clientY, card.dataset.blockCard);
        });
      });
      root.querySelectorAll("[data-delete-block]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          deleteBlock(button.dataset.deleteBlock);
        });
        button.addEventListener("mousedown", event => event.stopPropagation());
      });
      root.querySelectorAll("[data-assign-task]").forEach(button => {
        button.addEventListener("click", async event => {
          event.stopPropagation();
          await assignBlockToNewTask(button.dataset.assignTask);
        });
        button.addEventListener("mousedown", event => event.stopPropagation());
      });
      root.querySelectorAll("[data-connect-handle]").forEach(handle => {
        handle.addEventListener("pointerdown", event => {
          if (event.button !== 0) return;
          event.stopImmediatePropagation();
          startConnectDrag(event, handle.dataset.connectHandle);
        });
        if (!window.PointerEvent) {
          handle.addEventListener("mousedown", event => {
            if (event.button !== 0) return;
            startConnectDrag(event, handle.dataset.connectHandle);
          });
        }
        handle.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
        });
      });

      root.querySelectorAll("[data-group-box]").forEach(box => {
        box.addEventListener("click", event => {
          if (event.target.closest("[data-block-card]") || event.target.closest("[data-unit]") || event.target.closest("[data-select-group]") || event.target.closest("[data-suggest-unit-operation]")) return;
          if (state.connectingFrom && state.connectingFrom !== box.dataset.groupBox) {
            addConnection(state.connectingFrom, box.dataset.groupBox);
            return;
          }
          selectGroup(box.dataset.groupBox);
        });
        box.addEventListener("contextmenu", event => {
          event.preventDefault();
          event.stopPropagation();
          showGroupMenu(event.clientX, event.clientY, box.dataset.groupBox);
        });
        const startGroupBoxDrag = event => {
          if (event.button !== 0 || event.target.closest("[data-connect-handle]") || event.target.closest("[data-block-card]") || event.target.closest("button")) return;
          startDrag(event, box.dataset.groupBox, "group");
        };
        box.addEventListener("pointerdown", startGroupBoxDrag);
        if (!window.PointerEvent) box.addEventListener("mousedown", startGroupBoxDrag);
      });
      root.querySelectorAll("[data-select-group]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          selectGroup(button.dataset.selectGroup);
        });
      });
      root.querySelectorAll("[data-suggest-unit-operation]").forEach(button => {
        button.addEventListener("click", async event => {
          event.preventDefault();
          event.stopPropagation();
          const group = groupModel(button.dataset.suggestUnitOperation);
          const readiness = group ? groupUnitSuggestionReadiness(group) : null;
          if (!group || !readiness?.ready) {
            await alertModal(`Complete ${readiness?.missing.join(", ") || "task data"} before assigning a unit operation.`);
            return;
          }
          ensureGroup(group.id).unitSuggestionsExpanded = true;
          selectGroup(group.id);
        });
        button.addEventListener("mousedown", event => event.stopPropagation());
      });

      const draftBox = root.querySelector("[data-draft-box]");
      if (draftBox) {
        const startDraftDrag = event => {
          if (event.button !== 0 || event.target.closest("[data-connect-handle]") || event.target.closest("[data-block-card]") || event.target.closest("button")) return;
          startDrag(event, "draft", "draft");
        };
        draftBox.addEventListener("pointerdown", startDraftDrag);
        if (!window.PointerEvent) draftBox.addEventListener("mousedown", startDraftDrag);
      }

      root.querySelectorAll("[data-unit]").forEach(button => {
        button.addEventListener("click", () => {
          const group = groupModel(button.dataset.unitGroup);
          if (!group || !groupUnitSuggestionReadiness(group).ready) return;
          ensureGroup(group.id).selectedUnit = button.dataset.unit;
          ensureGroup(group.id).unitSuggestionsExpanded = false;
          renderAll();
        });
      });

      measureNodeHeightsAndRedrawLinks(root, displayBoard);
      if (pendingBoardReflow) {
        pendingBoardReflow = false;
        if (boardReflowDepth < 3 && resolveGroupVerticalOverlaps()) {
          boardReflowDepth += 1;
          renderGroupFlow();
          boardReflowDepth = 0;
          return;
        }
      }
      revealFocusedEndpoint();
    }

    function flowOrderIndex(id) {
      const resolved = resolvedEndpointId(id);
      const order = groupIdsInTextOrder();
      const idx = order.indexOf(resolved);
      return idx === -1 ? order.length : idx;
    }

    function isBackwardLink(link) {
      return flowOrderIndex(link.from) > flowOrderIndex(link.to);
    }

    // Flowsheet View modal functions moved to static/flowsheet.js, loaded before this file.

    function recycleLaneRoute(link, laneIndex) {
      const from = endpointRect(link.from);
      const to = endpointRect(link.to);
      if (!from || !to) return null;
      const laneY = Math.max(...allNodeRects().map(rect => rect.y + rect.h)) + 52 + laneIndex * 32;
      const startX = from.x + from.w * 0.35;
      const endX = to.x + to.w * 0.65;
      const points = [
        { x: startX, y: from.y + from.h },
        { x: startX, y: laneY },
        { x: endX, y: laneY },
        { x: endX, y: to.y + to.h }
      ];
      return { points, laneY, labelX: (startX + endX) / 2 };
    }

    // Straight center-to-center line, skipping connectionRoute's obstacle/placedSegments scoring
    // entirely (that scoring is O(links x groups) and was the main cost of a drag-time re-render -
    // see redrawBoardLinksOnly). Used only while a box is actively being dragged; the moment the
    // drag ends, renderGroupFlow() does a normal full-quality renderLinksSvg pass that snaps every
    // link back to its properly routed path.
    function fastConnectionRoute(fromId, toId) {
      const from = endpointRect(fromId);
      const to = endpointRect(toId);
      if (!from || !to) return null;
      const fromCenter = rectCenter(from);
      const toCenter = rectCenter(to);
      if (Math.abs(toCenter.x - fromCenter.x) < 1 && Math.abs(toCenter.y - fromCenter.y) < 1) return null;
      return { points: [fromCenter, toCenter] };
    }

    function renderLinksSvg(board, fastMode = false) {
      const nodeMasks = allNodeRects().map(rect => {
        const masked = shrinkRect(rect, 7);
        return `<rect x="${round(masked.x)}" y="${round(masked.y)}" width="${round(masked.w)}" height="${round(masked.h)}" rx="7" fill="black"></rect>`;
      }).join("");
      let recycleLane = 0;
      // Shared across the whole pass so each link, once routed, becomes something the next link's
      // scoring tries to avoid running alongside or through - see connectionRoute/routeScore.
      const placedSegments = [];
      const claimSegments = points => {
        for (let index = 0; index < points.length - 1; index += 1) {
          placedSegments.push({ a: points[index], b: points[index + 1] });
        }
      };
      const links = state.links.map(link => {
        if (isBackwardLink(link)) {
          const route = recycleLaneRoute(link, recycleLane++);
          if (!route) return "";
          claimSegments(route.points);
          const path = orthogonalPath(route.points);
          const start = route.points[0];
          return `
            <path d="${path}" stroke="#f2faf5" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
            <path d="${path}" stroke="#286d3f" stroke-width="2.4" stroke-dasharray="8 6" stroke-linecap="round" stroke-linejoin="round" fill="none" marker-end="url(#arrowHead)"></path>
            <circle cx="${round(start.x)}" cy="${round(start.y)}" r="3.6" fill="#f2faf5" stroke="#286d3f" stroke-width="1.8"></circle>
            <text x="${round(route.labelX)}" y="${round(route.laneY - 8)}" class="link-label recycle" text-anchor="middle">recycle ${escapeHtml(resolvedEndpointId(link.from))} → ${escapeHtml(resolvedEndpointId(link.to))}</text>
          `;
        }
        const route = fastMode ? fastConnectionRoute(link.from, link.to) : connectionRoute(link.from, link.to, placedSegments);
        if (!route) return "";
        if (!fastMode) claimSegments(route.points);
        const path = orthogonalPath(route.points);
        const start = route.points[0];
        return `
          <path d="${path}" stroke="#f2faf5" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" mask="url(#nodeTextMask)"></path>
          <path d="${path}" stroke="#286d3f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" marker-end="url(#arrowHead)" mask="url(#nodeTextMask)"></path>
          <circle cx="${round(start.x)}" cy="${round(start.y)}" r="3.6" fill="#f2faf5" stroke="#286d3f" stroke-width="1.8"></circle>
        `;
      }).join("");
      return `
        <svg class="link-layer" style="width:${board.width}px; height:${board.height}px" viewBox="0 0 ${board.width} ${board.height}">
          <defs>
            <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,7 L9,3.5 z" fill="#286d3f"></path>
            </marker>
            <mask id="nodeTextMask" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="${board.width}" height="${board.height}" fill="white"></rect>
              ${nodeMasks}
            </mask>
          </defs>
          ${links}
        </svg>
      `;
    }

    function endpointCenter(id) {
      const rect = endpointRect(id);
      return rect ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 } : null;
    }

    function endpointRect(id) {
      if (!id) return null;
      if (id.startsWith("G")) {
        return groupRect(id);
      }
      if (!id.startsWith("B")) return null;
      const block = state.blocks.find(item => item.id === id);
      if (!block) return null;
      if (block.groupId) return groupRect(block.groupId);
      return blockRect(block);
    }

    function groupRect(groupId) {
      const group = groupModel(groupId);
      if (!group) return null;
      return {
        x: group.x || 0,
        y: group.y || 0,
        w: nodeWidth(group.blocks.length),
        h: state.measuredNodeHeights[groupId] || 255
      };
    }

    function blockRect(block) {
      const siblings = block.groupId ? blocksForGroup(block.groupId) : blocksInOrder().filter(item => !item.groupId);
      const index = Math.max(0, siblings.findIndex(item => item.id === block.id));
      const base = block.groupId ? groupModel(block.groupId) : { ...state.draftPos };
      return {
        x: (base.x || 0) + 15 + index * 194,
        y: (base.y || 0) + (block.groupId ? 58 : 102),
        w: 172,
        h: (!block.groupId && state.measuredNodeHeights[block.id]) || 142
      };
    }

    function measureNodeHeightsAndRedrawLinks(root, board) {
      const canvas = root.querySelector(".board-canvas");
      if (!canvas) return;
      let changed = false;
      root.querySelectorAll("[data-group-box]").forEach(box => {
        const measured = box.getBoundingClientRect().height / Math.max(0.05, state.zoom);
        const id = box.dataset.groupBox;
        if (Math.abs((state.measuredNodeHeights[id] || 0) - measured) > 1) {
          state.measuredNodeHeights[id] = measured;
          changed = true;
        }
      });
      root.querySelectorAll('[data-draft-box] [data-block-card]').forEach(card => {
        const measured = card.getBoundingClientRect().height / Math.max(0.05, state.zoom);
        const id = card.dataset.blockCard;
        if (Math.abs((state.measuredNodeHeights[id] || 0) - measured) > 1) {
          state.measuredNodeHeights[id] = measured;
          changed = true;
        }
      });
      if (!changed) return;
      const svg = canvas.querySelector(".link-layer");
      if (svg) svg.outerHTML = renderLinksSvg(board);
    }

    // Detailed (non-compact) group boxes render their full content (block cards, phenomena,
    // MFA/condition summaries, alternatives) and have no fixed height, unlike compact boxes -
    // so a box can easily be taller than the fixed row gap used to place the row below it,
    // making the two rows visually overlap ("attaccati"). Once real heights are known (from
    // measureNodeHeightsAndRedrawLinks, called just before this), push any box down that a
    // shorter fixed gap left overlapping a taller box directly above it in the same column.
    function resolveGroupVerticalOverlaps() {
      if (state.boardCompact) return false;
      const ids = groupIdsInTextOrder();
      if (ids.length < 2) return false;
      const gap = 60;
      const items = ids
        .map(id => {
          const group = ensureGroup(id);
          return {
            group,
            x: group.x || 0,
            w: nodeWidth(blocksForGroup(id).length),
            h: state.measuredNodeHeights[id] || 380
          };
        })
        .sort((a, b) => (a.group.y - b.group.y) || (a.x - b.x));
      let changed = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < i; j++) {
          const above = items[j];
          const below = items[i];
          const xOverlap = above.x < below.x + below.w && below.x < above.x + above.w;
          if (!xOverlap) continue;
          const requiredY = above.group.y + above.h + gap;
          if (below.group.y < requiredY) {
            below.group.y = requiredY;
            changed = true;
          }
        }
      }
      return changed;
    }

    // placedSegments carries the already-drawn segments of every link rendered earlier in this
    // same pass (see renderLinksSvg), so a link routed later prefers a path that doesn't run
    // alongside or through one already chosen - without this, two links crossing the same gap
    // between rows independently pick the same shortest detour (an exact shared bounds.top/bottom
    // coordinate from routeCandidates) and render on top of each other.
    function connectionRoute(fromId, toId, placedSegments = []) {
      const from = endpointRect(fromId);
      const to = endpointRect(toId);
      if (!from || !to) return null;
      const fromCenter = rectCenter(from);
      const toCenter = rectCenter(to);
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;
      const startSide = connectionSide(from, to, dx, dy);
      const endSide = oppositeSide(startSide);
      const candidates = routeCandidates(from, to, startSide, endSide);
      const obstacles = routeObstacles(fromId, toId);
      const best = candidates
        .map(candidate => ({ ...candidate, points: compactRoute(candidate.points), score: routeScore(candidate.points, obstacles, placedSegments) + candidate.penalty }))
        .sort((a, b) => a.score - b.score)[0];
      const points = best?.points || candidates[0].points;
      return { points, startSide, endSide };
    }

    function routeCandidates(from, to, preferredStartSide, preferredEndSide) {
      const fromCenter = rectCenter(from);
      const toCenter = rectCenter(to);
      const distance = Math.abs(toCenter.x - fromCenter.x) + Math.abs(toCenter.y - fromCenter.y);
      const gap = Math.max(34, Math.min(72, distance * 0.1));
      const bounds = routeBounds(from, to);
      const candidates = [];
      const startSides = orderedSides(preferredStartSide);
      const endSides = orderedSides(preferredEndSide);
      startSides.forEach(startSide => {
        endSides.forEach(endSide => {
          const start = sidePoint(from, startSide, toCenter);
          const end = sidePoint(to, endSide, fromCenter);
          const startOut = offsetPoint(start, startSide, gap);
          const endOut = offsetPoint(end, endSide, gap);
          const penalty = (startSide === preferredStartSide ? 0 : 80) + (endSide === preferredEndSide ? 0 : 60);
          genericOrthogonalRoutes(start, startOut, endOut, end).forEach(points => {
            candidates.push({ points, penalty });
          });
          if (startSide === "left" || startSide === "right") {
            candidates.push({ points: [start, startOut, { x: startOut.x, y: bounds.top }, { x: endOut.x, y: bounds.top }, endOut, end], penalty: penalty + 25 });
            candidates.push({ points: [start, startOut, { x: startOut.x, y: bounds.bottom }, { x: endOut.x, y: bounds.bottom }, endOut, end], penalty: penalty + 25 });
          } else {
            candidates.push({ points: [start, startOut, { x: bounds.left, y: startOut.y }, { x: bounds.left, y: endOut.y }, endOut, end], penalty: penalty + 25 });
            candidates.push({ points: [start, startOut, { x: bounds.right, y: startOut.y }, { x: bounds.right, y: endOut.y }, endOut, end], penalty: penalty + 25 });
          }
        });
      });
      return candidates;
    }

    function orderedSides(preferred) {
      return [preferred, ...["right", "bottom", "left", "top"].filter(side => side !== preferred)];
    }

    function genericOrthogonalRoutes(start, startOut, endOut, end) {
      if (Math.abs(startOut.x - endOut.x) < 0.5 || Math.abs(startOut.y - endOut.y) < 0.5) {
        return [[start, startOut, endOut, end]];
      }
      return [
        [start, startOut, { x: endOut.x, y: startOut.y }, endOut, end],
        [start, startOut, { x: startOut.x, y: endOut.y }, endOut, end]
      ];
    }

    function routeBounds(from, to) {
      const related = [from, to, ...allNodeRects().filter(rect => rectBetween(rect, from, to))];
      const margin = 54;
      return {
        left: Math.max(18, Math.min(...related.map(rect => rect.x)) - margin),
        right: Math.max(...related.map(rect => rect.x + rect.w)) + margin,
        top: Math.max(18, Math.min(...related.map(rect => rect.y)) - margin),
        bottom: Math.max(...related.map(rect => rect.y + rect.h)) + margin
      };
    }

    function rectBetween(rect, a, b) {
      const minX = Math.min(a.x, b.x) - 80;
      const maxX = Math.max(a.x + a.w, b.x + b.w) + 80;
      const minY = Math.min(a.y, b.y) - 80;
      const maxY = Math.max(a.y + a.h, b.y + b.h) + 80;
      return rect.x < maxX && rect.x + rect.w > minX && rect.y < maxY && rect.y + rect.h > minY;
    }

    function routeObstacles(fromId, toId) {
      const fromResolved = resolvedEndpointId(fromId);
      const toResolved = resolvedEndpointId(toId);
      return allNodeRects()
        .filter(rect => rect.id !== fromResolved && rect.id !== toResolved)
        .map(rect => expandRect(rect, 22));
    }

    function allNodeRects() {
      const rects = [];
      blocksInOrder().filter(block => !block.groupId).forEach(block => {
        rects.push({ ...blockRect(block), id: block.id });
      });
      groupIdsInTextOrder().forEach(groupId => {
        const rect = groupRect(groupId);
        if (rect) rects.push({ ...rect, id: groupId });
      });
      return rects;
    }

    function connectionSide(from, to, dx, dy) {
      const gaps = {
        right: to.x - (from.x + from.w),
        left: from.x - (to.x + to.w),
        bottom: to.y - (from.y + from.h),
        top: from.y - (to.y + to.h)
      };
      const openHorizontal = Math.max(gaps.right, gaps.left);
      const openVertical = Math.max(gaps.bottom, gaps.top);
      if (openHorizontal >= 0 && openHorizontal >= openVertical) return gaps.right >= gaps.left ? "right" : "left";
      if (openVertical >= 0) return gaps.bottom >= gaps.top ? "bottom" : "top";
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          return "right";
        }
        return "left";
      }
      return dy >= 0 ? "bottom" : "top";
    }

    function sidePoint(rect, side, toward) {
      const pad = 18;
      if (side === "right") return { x: rect.x + rect.w, y: clamp(toward.y, rect.y + pad, rect.y + rect.h - pad) };
      if (side === "left") return { x: rect.x, y: clamp(toward.y, rect.y + pad, rect.y + rect.h - pad) };
      if (side === "bottom") return { x: clamp(toward.x, rect.x + pad, rect.x + rect.w - pad), y: rect.y + rect.h };
      return { x: clamp(toward.x, rect.x + pad, rect.x + rect.w - pad), y: rect.y };
    }

    function offsetPoint(point, side, amount) {
      if (side === "right") return { x: point.x + amount, y: point.y };
      if (side === "left") return { x: point.x - amount, y: point.y };
      if (side === "bottom") return { x: point.x, y: point.y + amount };
      return { x: point.x, y: point.y - amount };
    }

    function oppositeSide(side) {
      return { right: "left", left: "right", bottom: "top", top: "bottom" }[side] || "left";
    }

    function compactRoute(points) {
      const deduped = points.filter((point, index) => {
        if (!index) return true;
        const prev = points[index - 1];
        return Math.abs(point.x - prev.x) > 0.5 || Math.abs(point.y - prev.y) > 0.5;
      });
      return deduped.filter((point, index) => {
        if (index === 0 || index === deduped.length - 1) return true;
        const prev = deduped[index - 1];
        const next = deduped[index + 1];
        const sameX = Math.abs(prev.x - point.x) < 0.5 && Math.abs(point.x - next.x) < 0.5;
        const sameY = Math.abs(prev.y - point.y) < 0.5 && Math.abs(point.y - next.y) < 0.5;
        return !(sameX || sameY);
      });
    }

    function routeScore(points, obstacles, placedSegments = []) {
      const compacted = compactRoute(points);
      let score = routeLength(compacted) + Math.max(0, compacted.length - 2) * 18;
      for (let index = 0; index < compacted.length - 1; index += 1) {
        const segment = { a: compacted[index], b: compacted[index + 1] };
        obstacles.forEach(rect => {
          if (segmentIntersectsRect(segment, rect)) score += 12000;
        });
        placedSegments.forEach(placed => {
          score += segmentOverlapPenalty(segment, placed);
        });
      }
      return score;
    }

    // Penalizes a candidate segment for running right alongside (parallel, within
    // PARALLEL_PROXIMITY px) or crossing a segment some other already-routed link already claimed.
    // Parallel overlap is scored per px of shared length so two links forced through the same
    // narrow gap still separate as much as the gap allows, rather than snapping to one of two
    // identical "cheapest" coordinates; crossings get a small flat cost since some are usually
    // unavoidable in a real graph and shouldn't be chased at the expense of much longer routes.
    function segmentOverlapPenalty(a, b) {
      const PARALLEL_PROXIMITY = 16;
      const aVertical = Math.abs(a.a.x - a.b.x) < 0.5;
      const bVertical = Math.abs(b.a.x - b.b.x) < 0.5;
      if (aVertical && bVertical) {
        if (Math.abs(a.a.x - b.a.x) > PARALLEL_PROXIMITY) return 0;
        const overlap = Math.min(Math.max(a.a.y, a.b.y), Math.max(b.a.y, b.b.y)) - Math.max(Math.min(a.a.y, a.b.y), Math.min(b.a.y, b.b.y));
        return overlap > 0 ? overlap * 40 : 0;
      }
      if (!aVertical && !bVertical) {
        if (Math.abs(a.a.y - b.a.y) > PARALLEL_PROXIMITY) return 0;
        const overlap = Math.min(Math.max(a.a.x, a.b.x), Math.max(b.a.x, b.b.x)) - Math.max(Math.min(a.a.x, a.b.x), Math.min(b.a.x, b.b.x));
        return overlap > 0 ? overlap * 40 : 0;
      }
      if (aVertical === bVertical) return 0;
      const vert = aVertical ? a : b;
      const horiz = aVertical ? b : a;
      const vLo = Math.min(vert.a.y, vert.b.y);
      const vHi = Math.max(vert.a.y, vert.b.y);
      const hLo = Math.min(horiz.a.x, horiz.b.x);
      const hHi = Math.max(horiz.a.x, horiz.b.x);
      const crosses = horiz.a.y > vLo && horiz.a.y < vHi && vert.a.x > hLo && vert.a.x < hHi;
      return crosses ? 200 : 0;
    }

    function routeLength(points) {
      let total = 0;
      for (let index = 0; index < points.length - 1; index += 1) {
        total += Math.abs(points[index + 1].x - points[index].x) + Math.abs(points[index + 1].y - points[index].y);
      }
      return total;
    }

    function segmentIntersectsRect(segment, rect) {
      const minX = Math.min(segment.a.x, segment.b.x);
      const maxX = Math.max(segment.a.x, segment.b.x);
      const minY = Math.min(segment.a.y, segment.b.y);
      const maxY = Math.max(segment.a.y, segment.b.y);
      if (Math.abs(segment.a.y - segment.b.y) < 0.5) {
        const y = segment.a.y;
        return y > rect.y && y < rect.y + rect.h && maxX > rect.x && minX < rect.x + rect.w;
      }
      if (Math.abs(segment.a.x - segment.b.x) < 0.5) {
        const x = segment.a.x;
        return x > rect.x && x < rect.x + rect.w && maxY > rect.y && minY < rect.y + rect.h;
      }
      return false;
    }

    function expandRect(rect, amount) {
      return {
        ...rect,
        x: rect.x - amount,
        y: rect.y - amount,
        w: rect.w + amount * 2,
        h: rect.h + amount * 2
      };
    }

    function shrinkRect(rect, amount) {
      return {
        ...rect,
        x: rect.x + amount,
        y: rect.y + amount,
        w: Math.max(0, rect.w - amount * 2),
        h: Math.max(0, rect.h - amount * 2)
      };
    }

    function orthogonalPath(points, cornerRadius = 12) {
      if (!points.length) return "";
      if (points.length < 3 || !cornerRadius) {
        return points
          .map((point, index) => `${index ? "L" : "M"} ${round(point.x)} ${round(point.y)}`)
          .join(" ");
      }
      let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
      for (let i = 1; i < points.length - 1; i += 1) {
        const prev = points[i - 1];
        const corner = points[i];
        const next = points[i + 1];
        const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y);
        const outLen = Math.hypot(next.x - corner.x, next.y - corner.y);
        const r = Math.min(cornerRadius, inLen / 2, outLen / 2);
        if (r < 1) {
          path += ` L ${round(corner.x)} ${round(corner.y)}`;
          continue;
        }
        const inX = corner.x - ((corner.x - prev.x) / inLen) * r;
        const inY = corner.y - ((corner.y - prev.y) / inLen) * r;
        const outX = corner.x + ((next.x - corner.x) / outLen) * r;
        const outY = corner.y + ((next.y - corner.y) / outLen) * r;
        path += ` L ${round(inX)} ${round(inY)} Q ${round(corner.x)} ${round(corner.y)} ${round(outX)} ${round(outY)}`;
      }
      const last = points[points.length - 1];
      path += ` L ${round(last.x)} ${round(last.y)}`;
      return path;
    }

    function round(value) {
      return Math.round(value * 10) / 10;
    }

    function rectCenter(rect) {
      return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function blockCardHtml(block) {
      ensureBlockFlowFields(block);
      ensureBlockConditionFields(block);
      const counts = streamCounts(block);
      const flowCounts = [
        counts.input ? `I:${counts.input}` : "",
        counts.output ? `O:${counts.output}` : "",
        counts.waste ? `W:${counts.waste}` : ""
      ].filter(Boolean).join(" ");
      const conditionCount = conditionValuesForBlock(block).length;
      const hasNotes = Boolean(String(block.notes || "").trim());
      const bodyText = String(block.text || "").trim();
      const sourcePill = block.source === "manual" ? `<span class="pill">manual</span>` : "";
      const needsTask = !block.groupId;
      return `
        <article class="block-card tip ${state.selectedBlockId === block.id ? "selected" : ""} ${state.selectedIds.includes(block.id) ? "multi" : ""} ${state.connectingFrom === block.id ? "connecting" : ""} ${needsTask ? "needs-task" : ""}" data-block-card="${block.id}" data-node-id="${block.id}" data-tip="${escapeAttr(blockContentsTip(block))}">
          ${needsTask ? `<span class="connect-handle" data-connect-handle="${escapeAttr(block.id)}" title="Drag to another block or group to connect them"></span>` : ""}
          <div class="row between block-card-head">
            <strong>${block.id}</strong>
            <div class="row" style="gap:4px">
              ${sourcePill}
              <span class="pill accent">${escapeHtml(block.behavior)}</span>
              <button class="block-card-delete" data-delete-block="${escapeAttr(block.id)}" title="Delete this block">✕</button>
            </div>
          </div>
          <div class="block-text ${bodyText ? "" : "muted"}">${bodyText ? escapeHtml(bodyText) : "Empty manual block - add description when useful"}</div>
          <div>${block.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted small">No phenomena</span>`}</div>
          ${flowCounts ? `<div style="margin-top:6px"><span class="pill blue">${escapeHtml(flowCounts)}</span></div>` : ""}
          ${conditionCount || hasNotes ? `<div style="margin-top:6px">${conditionCount ? `<span class="pill green">C:${conditionCount}</span>` : ""}${hasNotes ? `<span class="pill">notes</span>` : ""}</div>` : ""}
          ${needsTask ? `<button class="assign-task-btn" data-assign-task="${escapeAttr(block.id)}" title="Convert this block into its own task group">Convert to Task</button>` : ""}
        </article>
      `;
    }

    function blockContentsTip(block) {
      ensureBlockFlowFields(block);
      const lines = [
        `${block.id} - ${block.behavior}`,
        `Source: ${block.source === "manual" ? "manual block, not linked to protocol text" : "protocol text"}`,
        `Phenomena: ${block.phenomena.length ? block.phenomena.join(", ") : "none"}`
      ];
      const streamLines = streamTipLines(block.streams);
      if (streamLines.length) {
        lines.push("", ...streamLines);
      } else {
        lines.push("", "MFA streams: none yet");
      }
      const conditionLines = conditionTipLines(block);
      if (conditionLines.length) lines.push("", "Conditions:", ...conditionLines);
      if (String(block.notes || "").trim()) lines.push("", "Notes:", String(block.notes || "").trim());
      return lines.join("\n");
    }

    function groupContentsTip(group) {
      const lines = [
        `${group.id} - ${group.task}`,
        `Blocks: ${group.blocks.map(block => block.id).join(", ") || "none"}`,
        `Phenomena: ${group.phenomena.length ? group.phenomena.join(", ") : "none"}`
      ];
      const streams = group.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams.map(stream => ({ ...stream, blockId: block.id }));
      });
      const streamLines = streamTipLines(streams);
      if (streamLines.length) {
        lines.push("", ...streamLines);
      } else {
        lines.push("", "MFA streams: none yet");
      }
      const conditionLines = groupConditionTipLines(group);
      if (conditionLines.length) lines.push("", "Group conditions:", ...conditionLines);
      return lines.join("\n");
    }

    function groupProcessSummary(group) {
      const taskLabels = Array.from(new Set(group.blocks
        .map(block => behaviorPresets[block.behavior]?.task || block.behavior)
        .filter(label => label && label !== "unassigned")));
      const counts = group.blocks.reduce((total, block) => {
        const current = streamCounts(block);
        return {
          input: total.input + current.input,
          output: total.output + current.output,
          waste: total.waste + current.waste
        };
      }, { input: 0, output: 0, waste: 0 });
      const conditions = aggregateGroupConditions(group)
        .slice(0, 3)
        .map(item => `${item.label}: ${item.effectiveDisplay || item.display}`);
      return {
        title: taskLabels.length ? taskLabels.join(" + ") : (group.task || "unassigned task"),
        meta: [
          `${group.blocks.length} block${group.blocks.length === 1 ? "" : "s"}`,
          `${group.phenomena.length} phenomena`,
          `${counts.input} in / ${counts.output} out / ${counts.waste} waste`
        ],
        conditions
      };
    }

    function groupCompositeSummaryHtml(group) {
      const summary = groupProcessSummary(group);
      return `
        <button class="group-composite-summary" data-select-group="${escapeAttr(group.id)}" title="Open the aggregated process view for ${escapeAttr(group.id)}">
          <span>
            <strong>Combined Process</strong>
            <span>${escapeHtml(summary.title)}</span>
          </span>
          <span class="group-composite-meta">${escapeHtml(summary.meta.join(" / "))}</span>
          ${summary.conditions.length ? `<span class="group-composite-conditions">${escapeHtml(summary.conditions.join(" / "))}</span>` : ""}
        </button>
      `;
    }

    function streamTipLines(streams) {
      return streamEditorSections.flatMap(role => {
        const items = role === "outlet"
          ? streams.filter(stream => streamIsOutlet(stream))
          : streams.filter(stream => stream.role === role);
        if (!items.length) return [];
        const header = streamSectionMeta(role).title;
        return [
          `${header}:`,
          ...items.slice(0, 5).map(stream => `- ${streamTipText(stream)}`),
          ...(items.length > 5 ? [`- +${items.length - 5} more`] : [])
        ];
      });
    }

    function streamTipText(stream) {
      const name = stream.name.trim() || "untitled stream";
      const quantity = stream.quantity.trim() ? `${stream.quantity.trim()} ${stream.unit}` : "quantity missing";
      const phase = stream.phase && stream.phase !== "unknown" ? `, ${phaseLabel(stream.phase)}` : "";
      const status = stream.status && stream.status !== "missing" ? `, ${stream.status}` : "";
      const timing = stream.timing && stream.timing !== "unspecified" ? `, ${stream.timing}` : "";
      const fate = stream.fate && stream.fate !== "unknown" ? `, ${stream.fate}` : "";
      const block = stream.blockId ? ` [${stream.blockId}]` : "";
      return `${name} - ${quantity}${phase}${timing}${fate}${status}${block}`;
    }

    function groupMfaSummaryHtml(group) {
      const aggregates = mfaGroupsForDisplay(aggregateGroupStreams(group)).filter(roleGroup => roleGroup.items.length);
      if (!aggregates.length) return "";
      return `
        <div class="group-mfa">
          <div class="label">Group MFA</div>
          ${aggregates.map(roleGroup => `
            <div class="group-mfa-role role-${escapeAttr(roleGroup.role)}">
              <strong>${escapeHtml(streamSectionMeta(roleGroup.role).title)}</strong>
              ${roleGroup.items.slice(0, 3).map(item => groupMfaItemHtml(item, group.id, false, roleGroup.role)).join("")}
              ${roleGroup.items.length > 3 ? `<span class="muted small">+${roleGroup.items.length - 3} more material groups</span>` : ""}
            </div>
          `).join("")}
        </div>
      `;
    }

    function groupMfaItemHtml(item, groupId, editable, role = "") {
      const total = item.totalText ? item.totalText : "not summed";
      const pillLabel = item.override ? `${escapeHtml(item.override.value)} ${escapeHtml(item.totalUnit || "")}`.trim() : escapeHtml(total);
      const tone = role === "outlet" ? streamTone({ role: item.role, fate: item.fates?.[0] }, role) : role;
      return `
        <div class="group-mfa-item ${tone ? `role-${escapeAttr(tone)}` : ""}">
          <div class="group-mfa-item-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="pill ${item.override ? "blue" : item.totalText ? "blue" : "warn"}">${pillLabel}</span>
          </div>
          ${item.fates?.length ? `<div class="mfa-label-meta">${item.fates.slice(0, 3).map(fate => `<span class="pill ${streamTone({ role: item.role, fate }) === "waste" ? "warn" : streamTone({ role: item.role, fate }) === "product" ? "green" : "blue"}">${escapeHtml(fate)}</span>`).join("")}</div>` : ""}
          <div class="group-mfa-lines">
            ${item.lines.slice(0, 4).map(line => `<span>${escapeHtml(line)}</span>`).join("")}
            ${item.lines.length > 4 ? `<span>+${item.lines.length - 4} more entries</span>` : ""}
          </div>
          ${overrideControlHtml(item, groupId, editable, "mfa", total)}
        </div>
      `;
    }

    function overrideControlHtml(item, groupId, editable, kind, computedDisplay) {
      if (!editable) {
        return item.override
          ? `<div class="muted small override-note">Override: ${escapeHtml(item.override.value)}${item.override.note ? ` — ${escapeHtml(item.override.note)}` : ""} <span class="muted">(computed: ${escapeHtml(computedDisplay)})</span></div>`
          : "";
      }
      const isOpen = groupId && ensureGroup(groupId).openOverrideKey === item.key;
      if (isOpen) {
        return `
          <div class="override-edit-row">
            <input data-override-value="${escapeAttr(item.key)}" data-override-group="${escapeAttr(groupId)}" data-override-kind="${kind}"
              value="${escapeAttr(item.override?.value || "")}" placeholder="override value">
            <input data-override-note="${escapeAttr(item.key)}" data-override-group="${escapeAttr(groupId)}" data-override-kind="${kind}"
              value="${escapeAttr(item.override?.note || "")}" placeholder="why override this (optional)">
            <button class="primary" data-save-override="${escapeAttr(item.key)}" data-override-group-save="${escapeAttr(groupId)}" data-override-kind="${kind}">Save</button>
            ${item.override ? `<button class="mini-button" data-clear-override="${escapeAttr(item.key)}" data-override-group="${escapeAttr(groupId)}" data-override-kind="${kind}">Clear</button>` : ""}
          </div>
        `;
      }
      return `
        <div class="override-toggle-row">
          ${item.override ? `<span class="muted small">Override: ${escapeHtml(item.override.value)}${item.override.note ? ` — ${escapeHtml(item.override.note)}` : ""} <span class="muted">(computed: ${escapeHtml(computedDisplay)})</span></span>` : ""}
          <button class="mini-button" data-open-override="${escapeAttr(item.key)}" data-override-group="${escapeAttr(groupId)}">${item.override ? "Edit override" : "Override"}</button>
        </div>
      `;
    }

    function groupConditionSummaryHtml(group) {
      const aggregates = aggregateGroupConditions(group);
      if (!aggregates.length) return "";
      return `
        <div class="group-mfa">
          <div class="label">Group Conditions</div>
          ${aggregates.slice(0, 4).map(item => groupConditionItemHtml(item, group.id, false)).join("")}
          ${aggregates.length > 4 ? `<span class="muted small">+${aggregates.length - 4} more conditions</span>` : ""}
        </div>
      `;
    }

    function groupConditionItemHtml(item, groupId, editable) {
      const pillLabel = item.effectiveDisplay || (item.override ? `${item.override.value} ${item.unit || ""}`.trim() : item.display);
      return `
        <div class="group-mfa-item">
          <div class="group-mfa-item-head">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="pill ${item.override ? "blue" : item.status === "summed_numeric_same_unit" || item.status === "common_value" ? "green" : "warn"}">${escapeHtml(pillLabel)}</span>
          </div>
          <div class="group-mfa-lines">
            ${item.lines.slice(0, 3).map(line => `<span>${escapeHtml(line)}</span>`).join("")}
            ${item.lines.length > 3 ? `<span>+${item.lines.length - 3} more entries</span>` : ""}
          </div>
          ${overrideControlHtml(item, groupId, editable, "condition", item.display)}
        </div>
      `;
    }

    function groupConditionProfileHtml(group, conditions) {
      const groupState = ensureGroup(group.id);
      if (!conditions.length) return `<div class="mfa-empty">No saved group conditions yet.</div>`;
      const families = groupConditionDisplayItems(conditions, conditionFamilyForPrompt);
      if (groupState.conditionsEditing) {
        return `
          <div class="group-condition-profile">
            ${families.map(family => `
              <div class="condition-family">
                <div class="condition-family-head">
                  <span>${escapeHtml(family.title)}</span>
                  <span class="pill">${family.items.length}</span>
                </div>
                <div class="condition-grid">
                  ${family.items.map(item => groupConditionEditCardHtml(group.id, item)).join("")}
                </div>
              </div>
            `).join("")}
            <div class="condition-actions">
              <button class="primary" data-save-group-conditions="${escapeAttr(group.id)}">Save Group Conditions</button>
            </div>
          </div>
        `;
      }
      return `
        <div class="group-condition-profile">
          ${families.map(family => `
            <div class="condition-family">
              <div class="condition-family-head">
                <span>${escapeHtml(family.title)}</span>
                <span class="pill">${family.items.length}</span>
              </div>
              <div class="condition-grid">
                ${family.items.map(item => groupConditionLabelCardHtml(item)).join("")}
              </div>
            </div>
          `).join("")}
          <div class="condition-actions">
            <button data-edit-group-conditions="${escapeAttr(group.id)}">${conditions.some(item => item.overrideApplied) ? "Edit Group Conditions" : "Edit Aggregated Conditions"}</button>
          </div>
        </div>
      `;
    }

    function groupConditionLabelCardHtml(item) {
      const source = item.lines.join("\n");
      return `
        <article class="condition-label-card group-condition-card tip" data-tip="${escapeAttr(source || "No source condition lines.")}">
          <strong>${escapeHtml(item.label)} ${item.overrideApplied ? `<span class="pill blue">edited</span>` : ""}</strong>
          <span>${escapeHtml(item.effectiveDisplay || item.display)}</span>
          <span class="pill ${item.status === "summed_numeric_same_unit" || item.status === "common_value" ? "green" : "warn"}">${escapeHtml(groupConditionStatusLabel(item))}</span>
        </article>
      `;
    }

    function groupConditionEditCardHtml(groupId, item) {
      const value = item.override?.value || item.value || "";
      const note = item.override?.note || "";
      return `
        <label class="condition-edit-card group-condition-card tip" data-tip="${escapeAttr(item.lines.join("\n"))}">
          <div class="condition-family-head property-need-head">
            <span>${escapeHtml(item.label)}</span>
            <span class="pill ${item.overrideApplied ? "blue" : ""}">${escapeHtml(groupConditionStatusLabel(item))}</span>
          </div>
          <div class="condition-input-row">
            <input data-group-condition-value="${escapeAttr(item.key)}" data-group-condition-group="${escapeAttr(groupId)}"
              value="${escapeAttr(value)}" placeholder="${escapeAttr(item.value || item.display)}">
            <span class="unit-badge">${escapeHtml(item.unit || "note")}</span>
          </div>
          <input data-group-condition-note="${escapeAttr(item.key)}" data-group-condition-group="${escapeAttr(groupId)}"
            value="${escapeAttr(note)}" placeholder="why edit this group condition (optional)">
        </label>
      `;
    }

    function groupConditionStatusLabel(item) {
      if (item.overrideApplied) return "edited group value";
      if (item.status === "summed_numeric_same_unit") return "summed";
      if (item.status === "common_value") return "same value";
      return "combined";
    }

    function aggregateGroupConditions(group) {
      const entries = group.blocks.flatMap(block => {
        ensureBlockConditionFields(block);
        return conditionValuesForBlock(block).map(item => ({
          ...item,
          blockId: block.id
        }));
      });
      const byCondition = new Map();
      entries.forEach(entry => {
        const key = `${entry.id}||${entry.unit || ""}`;
        if (!byCondition.has(key)) byCondition.set(key, []);
        byCondition.get(key).push(entry);
      });
      const overrides = ensureGroup(group.id).conditionOverrides;
      return Array.from(byCondition.values()).map(items => {
        const aggregated = aggregateConditionItems(items);
        const key = `${aggregated.id}||${aggregated.unit || ""}`;
        const override = overrides[key] || null;
        const effectiveValue = override?.value || aggregated.value || "";
        const effectiveDisplay = override?.value ? `${override.value} ${aggregated.unit || ""}`.trim() : aggregated.display;
        return { ...aggregated, key, override, effectiveValue, effectiveDisplay, overrideApplied: Boolean(override) };
      });
    }

    function aggregateConditionItems(items) {
      const first = items[0];
      const unit = first.unit || "";
      const additive = additiveConditionIds().has(first.id);
      const numericValues = items.map(item => parseStreamQuantity(item.value));
      const canSum = additive && unit && numericValues.every(value => Number.isFinite(value));
      const lines = items.map(item => `${item.blockId}: ${formatConditionValue(item)}`);
      if (canSum) {
        const total = numericValues.reduce((sum, value) => sum + value, 0);
        return {
          id: first.id,
          label: first.label,
          unit,
          display: `${formatNumber(total)} ${unit}`,
          value: formatNumber(total),
          status: "summed_numeric_same_unit",
          aggregationMode: "additive_duration_or_split_time",
          lines,
          entries: items.map(exportConditionEntry)
        };
      }
      const uniqueDisplays = Array.from(new Set(items.map(formatConditionValue)));
      const status = uniqueDisplays.length === 1 ? "common_value" : "sequence_or_conflict";
      const combinedDisplay = uniqueDisplays.length === 1 ? uniqueDisplays[0] : uniqueDisplays.join(" + ");
      return {
        id: first.id,
        label: first.label,
        unit,
        display: combinedDisplay,
        value: uniqueDisplays.length === 1 ? first.value : combinedDisplay,
        status,
        aggregationMode: status === "common_value" ? "same_condition_across_group" : "combined_group_condition",
        lines,
        entries: items.map(exportConditionEntry)
      };
    }

    function additiveConditionIds() {
      return new Set([
        "holding_time",
        "mixing_time",
        "thermal_ramp",
        "contact_time",
        "reaction_time",
        "phase_change_time",
        "settling_time"
      ]);
    }

    function exportConditionEntry(item) {
      return {
        blockId: item.blockId,
        id: item.id,
        label: item.label,
        value: item.value,
        unit: item.unit,
        display: formatConditionValue(item),
        kind: item.kind || "text",
        phenomena: item.phenomena
      };
    }

    function groupConditionTipLines(group) {
      return aggregateGroupConditions(group).flatMap(item => [
        `- ${item.label}: ${item.display} (${item.status})`,
        ...item.lines.slice(0, 3).map(line => `  ${line}`)
      ]);
    }

    function aggregateGroupStreams(group) {
      const streams = group.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams
          .filter(stream => stream.name.trim())
          .map(stream => ({ ...stream, blockId: block.id }));
      });
      const mfaOverrides = ensureGroup(group.id).mfaOverrides;
      return ["input", "output", "waste"].map(role => {
        const byMaterial = new Map();
        streams.filter(stream => stream.role === role).forEach(stream => {
          const key = stream.name.trim().toLowerCase();
          if (!byMaterial.has(key)) byMaterial.set(key, []);
          byMaterial.get(key).push(stream);
        });
        const items = Array.from(byMaterial.values()).map(materialStreams => {
          const aggregated = aggregateMaterialStreams(materialStreams);
          const key = `${role}||${aggregated.name.toLowerCase()}`;
          return { ...aggregated, role, key, override: mfaOverrides[key] || null };
        });
        return { role, items };
      }).filter(roleGroup => roleGroup.items.length);
    }

    function aggregateMaterialStreams(streams) {
      const name = streams[0].name.trim();
      const lineGroups = new Map();
      streams.forEach(stream => {
        const timing = stream.timing || "unspecified";
        const unit = stream.unit || "";
        const key = `${timing}||${unit}`;
        if (!lineGroups.has(key)) lineGroups.set(key, []);
        lineGroups.get(key).push(stream);
      });
      const lines = [];
      const totals = [];
      const fates = [...new Set(streams.map(stream => stream.fate).filter(fate => fate && fate !== "unknown"))];
      lineGroups.forEach(group => {
        const timing = group[0].timing || "unspecified";
        const unit = group[0].unit || "";
        const numeric = group.map(stream => parseStreamQuantity(stream.quantity));
        const canSum = numeric.every(value => Number.isFinite(value)) && unit;
        if (canSum) {
          const total = numeric.reduce((sum, value) => sum + value, 0);
          totals.push({ total, unit, timing });
          lines.push(`${timing}: ${formatNumber(total)} ${unit} (${group.map(stream => stream.blockId).join(", ")})`);
        } else {
          group.forEach(stream => {
            const quantity = stream.quantity ? `${stream.quantity} ${stream.unit}` : "quantity missing";
            lines.push(`${timing}: ${quantity} (${stream.blockId})`);
          });
        }
      });
      const total = groupTotalInfo(totals);
      return {
        name,
        lines,
        fates,
        totalText: total.text,
        totalValue: total.value,
        totalUnit: total.unit,
        aggregationStatus: total.text ? "summed_numeric_same_unit" : "not_summed",
        entries: streams.map(stream => ({
          blockId: stream.blockId,
          timing: stream.timing,
          quantity: stream.quantity,
          unit: stream.unit,
          phase: stream.phase,
          fate: stream.fate,
          status: stream.status,
          note: stream.note
        }))
      };
    }

    function groupTotalInfo(totals) {
      if (!totals.length) return { text: "", value: null, unit: "" };
      const units = new Set(totals.map(item => item.unit));
      if (units.size !== 1) return { text: "", value: null, unit: "" };
      const total = totals.reduce((sum, item) => sum + item.total, 0);
      const unit = totals[0].unit;
      return { text: `${formatNumber(total)} ${unit}`, value: formatNumber(total), unit };
    }

    function parseStreamQuantity(value) {
      const text = String(value || "").trim().replace(",", ".");
      if (!/^[-+]?\d+(?:\.\d+)?$/.test(text)) return NaN;
      return Number(text);
    }

    function formatNumber(value) {
      return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
    }

    function massToKg(value, unit) {
      const number = parseStreamQuantity(value);
      if (!Number.isFinite(number)) return NaN;
      if (unit === "kg") return number;
      if (unit === "g") return number / 1000;
      if (unit === "t") return number * 1000;
      return NaN;
    }

    function percentFactor(value, fallback = 100) {
      const parsed = parseStreamQuantity(value);
      const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
      return safe / 100;
    }

    function scaleBasisDefaults() {
      return {
        targetProduct: "",
        targetAmount: "",
        targetUnit: "kg/batch",
        referenceBlockId: "",
        basisAmount: "",
        basisUnit: "kg",
        mode: "batch",
        scheduleMethod: "auto",
        operatingDays: "250",
        hoursPerDay: "16",
        batchesPerDay: "1",
        batchDuration: "",
        oeePercent: "80",
        parallelUnits: "1",
        allowableCapacityUtilizationPercent: "85",
        productKgPerBatch: "",
        reactantsLoadingLPerKgProduct: "",
        solventLoadingLPerKgProduct: "",
        reactorWorkingFillPercent: "70",
        productMolecularWeightGmol: "",
        condensationWaterMolPerMol: "",
        confidence: "rough"
      };
    }

    function ensureScaleBasis() {
      state.scaleBasis = { ...scaleBasisDefaults(), ...(state.scaleBasis || {}) };
      if (!scaleTargetUnitOptions.includes(state.scaleBasis.targetUnit)) state.scaleBasis.targetUnit = "kg/batch";
      if (!["kg", "g", "t"].includes(state.scaleBasis.basisUnit)) state.scaleBasis.basisUnit = "kg";
      if (!["batch", "continuous"].includes(state.scaleBasis.mode)) state.scaleBasis.mode = "batch";
      if (!["auto", "duration", "batches_per_day"].includes(state.scaleBasis.scheduleMethod)) state.scaleBasis.scheduleMethod = "auto";
      if (!["rough", "estimated", "validated"].includes(state.scaleBasis.confidence)) state.scaleBasis.confidence = "rough";
      return state.scaleBasis;
    }

    function targetKgPerBatch(basis) {
      const target = parseStreamQuantity(basis.targetAmount);
      if (!Number.isFinite(target) || target <= 0) return NaN;
      const batchesPerDay = parseStreamQuantity(basis.batchesPerDay);
      const operatingDays = parseStreamQuantity(basis.operatingDays);
      if (basis.targetUnit === "kg/batch") return target;
      if (basis.targetUnit === "kg/day") {
        if (!Number.isFinite(batchesPerDay) || batchesPerDay <= 0) return NaN;
        return target / batchesPerDay;
      }
      if (basis.targetUnit === "kg/year" || basis.targetUnit === "t/year") {
        const annualKg = basis.targetUnit === "t/year" ? target * 1000 : target;
        const effectiveBatches = effectiveBatchesPerYear(basis);
        if (Number.isFinite(effectiveBatches) && effectiveBatches > 0) return annualKg / effectiveBatches;
        if (!Number.isFinite(batchesPerDay) || batchesPerDay <= 0 || !Number.isFinite(operatingDays) || operatingDays <= 0) return NaN;
        return annualKg / (batchesPerDay * operatingDays);
      }
      return NaN;
    }

    function targetKgPerYear(basis) {
      const target = parseStreamQuantity(basis.targetAmount);
      const operatingDays = parseStreamQuantity(basis.operatingDays);
      const batchesPerDay = parseStreamQuantity(basis.batchesPerDay);
      const perBatch = targetKgPerBatch(basis);
      if (basis.targetUnit === "t/year" && Number.isFinite(target)) return target * 1000;
      if (basis.targetUnit === "kg/year" && Number.isFinite(target)) return target;
      if (basis.targetUnit === "kg/day" && Number.isFinite(target) && Number.isFinite(operatingDays)) return target * operatingDays;
      if (basis.targetUnit === "kg/batch" && Number.isFinite(perBatch)) {
        const effectiveBatches = effectiveBatchesPerYear(basis);
        if (Number.isFinite(effectiveBatches) && effectiveBatches > 0) return perBatch * effectiveBatches;
        if (!Number.isFinite(operatingDays) || !Number.isFinite(batchesPerDay)) return NaN;
        return perBatch * operatingDays * batchesPerDay;
      }
      return NaN;
    }

    function targetKgPerHour(basis) {
      const perYear = targetKgPerYear(basis);
      const operatingDays = parseStreamQuantity(basis.operatingDays);
      const hoursPerDay = parseStreamQuantity(basis.hoursPerDay);
      if (!Number.isFinite(perYear) || !Number.isFinite(operatingDays) || !Number.isFinite(hoursPerDay) || operatingDays <= 0 || hoursPerDay <= 0) return NaN;
      return perYear / (operatingDays * hoursPerDay);
    }

    function effectiveBatchesPerYear(basis) {
      if (basis.scheduleMethod === "batches_per_day") return NaN;
      const duration = effectiveBatchDurationH(basis);
      const oee = percentFactor(basis.oeePercent, 100);
      const parallel = parseStreamQuantity(basis.parallelUnits);
      if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(oee) || oee <= 0 || !Number.isFinite(parallel) || parallel <= 0) return NaN;
      return 8760 * oee * parallel / duration;
    }

    function effectiveBatchDurationH(basis) {
      const manual = parseDurationHoursValue(basis.batchDuration);
      if (Number.isFinite(manual) && manual > 0) return manual;
      const gantt = taskScheduleModel({ useGlobalBasis: false });
      return Number.isFinite(gantt.estimatedCycleTimeH) && gantt.estimatedCycleTimeH > 0 ? gantt.estimatedCycleTimeH : NaN;
    }

    function scheduleModel(basis, targetBatchOverride = NaN) {
      const gantt = taskScheduleModel();
      const effectiveBatches = effectiveBatchesPerYear(basis);
      const targetBatch = Number.isFinite(targetBatchOverride) && targetBatchOverride > 0 ? targetBatchOverride : targetKgPerBatch(basis);
      const targetYear = targetKgPerYear(basis);
      const duration = effectiveBatchDurationH(basis);
      const oee = percentFactor(basis.oeePercent, 100);
      const parallel = parseStreamQuantity(basis.parallelUnits);
      const scheduleMargin = Math.max(0, parseStreamQuantity(basis.scheduleMarginPercent) || 0);
      const plantCycleTime = gantt.plantCycleTimeH;
      const conservativeBatches = Number.isFinite(duration) && duration > 0 && Number.isFinite(oee)
        ? 8760 * oee / duration
        : NaN;
      const overlappedBatches = Number.isFinite(plantCycleTime) && plantCycleTime > 0 && Number.isFinite(oee)
        ? 8760 * oee / plantCycleTime
        : NaN;
      return {
        method: Number.isFinite(effectiveBatches) ? "duration_OEE_parallel_units" : "batches_per_day_days_per_year",
        effectiveBatchesPerYear: Number.isFinite(effectiveBatches) ? formatNumber(effectiveBatches) : "",
        effectiveKgPerBatch: Number.isFinite(targetBatch) ? formatNumber(targetBatch) : "",
        annualCapacityKg: Number.isFinite(targetYear) ? formatNumber(targetYear) : "",
        batchDurationH: Number.isFinite(duration) ? formatNumber(duration) : "",
        batchMakespanH: Number.isFinite(duration) ? formatNumber(duration) : "",
        plantCycleTimeH: Number.isFinite(plantCycleTime) ? formatNumber(plantCycleTime) : "",
        conservativeBatchesPerYear: Number.isFinite(conservativeBatches) ? formatNumber(conservativeBatches) : "",
        overlappedBatchesPerYear: Number.isFinite(overlappedBatches) ? formatNumber(overlappedBatches) : "",
        conservativeKgPerYear: Number.isFinite(conservativeBatches) && Number.isFinite(targetBatch) ? formatNumber(conservativeBatches * targetBatch) : "",
        overlappedKgPerYear: Number.isFinite(overlappedBatches) && Number.isFinite(targetBatch) ? formatNumber(overlappedBatches * targetBatch) : "",
        oeePercent: Number.isFinite(oee) ? formatNumber(oee * 100) : "",
        parallelUnits: Number.isFinite(parallel) ? formatNumber(parallel) : "",
        scheduleMarginPercent: formatNumber(scheduleMargin)
      };
    }

    function parseDurationHoursValue(value) {
      const text = String(value || "").trim().replace(",", ".");
      if (!text) return NaN;
      const range = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)/i);
      if (range) {
        const lo = Number(range[1]);
        const hi = Number(range[2]);
        return Number.isFinite(lo) && Number.isFinite(hi) ? (lo + hi) / 2 : NaN;
      }
      const number = text.match(/[-+]?\d+(?:\.\d+)?/);
      return number ? Number(number[0]) : NaN;
    }

    function taskScheduleModel() {
      const tasks = groupIdsInTextOrder().map((groupId, index) => taskScheduleEntry(groupModel(groupId), index));
      const timed = tasks.filter(task => Number.isFinite(task.durationH) && task.durationH > 0);
      const ranked = [...timed].sort((a, b) => b.effectiveTimeH - a.effectiveTimeH);
      const maxEffective = ranked.length ? ranked[0].effectiveTimeH : NaN;
      const secondEffective = ranked[1]?.effectiveTimeH ?? 0;
      const bottleneckGapH = Number.isFinite(maxEffective) ? maxEffective - secondEffective : NaN;
      const bottleneckGapPercent = Number.isFinite(maxEffective) && maxEffective > 0 ? bottleneckGapH / maxEffective * 100 : NaN;
      const criticalBottleneck = ranked.length === 1
        ? Number.isFinite(maxEffective) && maxEffective >= bottleneckThresholds.minGapH
        : Number.isFinite(bottleneckGapH)
          && bottleneckGapH >= bottleneckThresholds.minGapH
          && Number.isFinite(bottleneckGapPercent)
          && bottleneckGapPercent >= bottleneckThresholds.minGapPercent;
      const bottleneck = criticalBottleneck ? ranked[0] : null;
      const bottleneckStatus = timed.length
        ? criticalBottleneck
          ? "critical"
          : "balanced"
        : "missing";
      let cursor = 0;
      tasks.forEach(task => {
        task.startH = Number.isFinite(task.effectiveTimeH) ? cursor : NaN;
        task.widthPercent = Number.isFinite(task.effectiveTimeH) && Number.isFinite(maxEffective) && maxEffective > 0
          ? Math.max(4, Math.min(100, task.effectiveTimeH / maxEffective * 100))
          : 0;
        task.isBottleneck = Boolean(bottleneck && task.groupId === bottleneck.groupId);
        if (Number.isFinite(task.effectiveTimeH) && task.canOverlap !== "yes") cursor += task.effectiveTimeH;
      });
      const estimatedCycleTimeH = timed.length ? tasks.reduce((sum, task) => {
        if (!Number.isFinite(task.effectiveTimeH) || task.canOverlap === "yes") return sum;
        return sum + task.effectiveTimeH;
      }, 0) : NaN;
      const oee = percentFactor(ensureScaleBasis().oeePercent, 100);
      const batchesPerYear = Number.isFinite(estimatedCycleTimeH) && estimatedCycleTimeH > 0 && Number.isFinite(oee)
        ? 8760 * oee / estimatedCycleTimeH
        : NaN;
      return {
        tasks,
        bottleneck,
        bottleneckCandidate: ranked[0] || null,
        bottleneckStatus,
        bottleneckGapH,
        bottleneckGapPercent,
        estimatedCycleTimeH,
        plantCycleTimeH: maxEffective,
        batchesPerYear,
        ready: timed.length > 0,
        missingDurationCount: tasks.filter(task => !Number.isFinite(task.durationH)).length
      };
    }

    function taskScheduleEntry(group, index) {
      const raw = ensureGroup(group.id);
      const schedule = raw.schedule;
      const inferred = inferGroupDurationInfo(group);
      const manualDuration = parseDurationHoursValue(schedule.durationH);
      const durationH = Number.isFinite(manualDuration) && manualDuration > 0 ? manualDuration : inferred.durationH;
      const parallel = Math.max(1, parseDurationHoursValue(schedule.parallelUnits) || 1);
      const hasManualOperationClass = schedule.operationClass && schedule.operationClass !== "auto" && scheduleOperationClassOptions.includes(schedule.operationClass);
      const operationClass = hasManualOperationClass
        ? schedule.operationClass
        : inferGroupOperationClass(group);
      const profile = operationScaleProfile(operationClass);
      const sensitivity = hasManualOperationClass
        ? profile.sensitivity
        : schedule.scaleSensitivity && schedule.scaleSensitivity !== "unknown"
        ? schedule.scaleSensitivity
        : profile.sensitivity || inferGroupScaleSensitivity(group);
      const scheduleMargin = Math.max(0, parseStreamQuantity(ensureScaleBasis().scheduleMarginPercent) || 0);
      const adjustedDurationH = Number.isFinite(durationH) ? durationH * (1 + scheduleMargin / 100) : NaN;
      const missingScaleData = operationScaleMissingData(group, operationClass);
      return {
        groupId: group.id,
        task: group.task || `Task ${index + 1}`,
        selectedUnit: group.selectedUnit || "",
        blocks: group.blocks.map(block => block.id),
        durationInput: schedule.durationH,
        durationH,
        adjustedDurationH,
        durationSource: Number.isFinite(manualDuration) && manualDuration > 0 ? "manual" : inferred.source,
        parallelUnits: parallel,
        canOverlap: scheduleOverlapOptions.includes(schedule.canOverlap) ? schedule.canOverlap : "no",
        capacityAmount: schedule.capacityAmount || "",
        capacityUnit: capacityUnitOptions.includes(schedule.capacityUnit) && schedule.capacityUnit
          ? schedule.capacityUnit
          : schedule.capacityAmount
          ? suggestedCapacityUnitForGroup(group)
          : "",
        operationClass,
        operationProfile: profile,
        scaleSensitivity: sensitivity,
        scheduleMarginPercent: scheduleMargin,
        correctionMode: Number.isFinite(durationH) ? "warning-only" : "missing duration",
        missingScaleData,
        dependency: schedule.dependency || "previous",
        notes: schedule.notes || "",
        // Kinetics-bound stages (reaction phenomena, or a heat/cool holding step manually flagged
        // as reaction-controlled) never divide by parallel units: for an ideal, well-mixed,
        // constant-volume batch, conversion vs. time is independent of reactor volume/geometry, so
        // running N parallel reactors raises throughput but does not shorten any single reaction's
        // time. Only surface/catalyst-limited or electrochemical reactions are the exception, and
        // those are out of scope here - flag them via Operation Class instead. Non-kinetics stages
        // (heat transfer, separation, equipment-limited) keep the existing 1/parallel scaling.
        effectiveTimeH: Number.isFinite(adjustedDurationH)
          ? (sensitivity === "kinetics-bound" ? adjustedDurationH : adjustedDurationH / parallel)
          : NaN,
        phenomena: group.phenomena
      };
    }

    function suggestedCapacityUnitForGroup(group) {
      const text = `${group.task || ""} ${group.selectedUnit || ""} ${group.text || ""}`.toLowerCase();
      if (/reactor|vessel|tank|cstr|batch|semi-batch/.test(text)) return "m3";
      if (/heat exchanger|exchange area|filter|membrane/.test(text)) return "m2";
      if (/continuous|pump|transfer|feed rate|flow rate/.test(text)) return "kg/h";
      return "kg/batch";
    }

    function inferGroupDurationInfo(group) {
      const conditionDurations = aggregateGroupConditions(group)
        .filter(item => additiveConditionIds().has(item.id) && (item.unit || "") === "h")
        .flatMap(item => item.entries || [])
        .map(entry => parseDurationHoursValue(entry.value))
        .filter(value => Number.isFinite(value) && value > 0);
      if (conditionDurations.length) {
        return { durationH: conditionDurations.reduce((sum, value) => sum + value, 0), source: "condition sum" };
      }
      const textDurations = extractDurationHoursAll(group.text);
      if (textDurations.length) {
        return { durationH: textDurations.reduce((sum, value) => sum + value, 0), source: "text duration" };
      }
      return { durationH: NaN, source: "missing" };
    }

    function extractDurationHoursAll(text) {
      const values = [];
      const regex = /(\d+(?:[.,]\d+)?)\s*(?:(?:-|to|–)\s*(\d+(?:[.,]\d+)?))?\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/gi;
      let match;
      while ((match = regex.exec(String(text || "")))) {
        const lo = Number(match[1].replace(",", "."));
        const hi = match[2] ? Number(match[2].replace(",", ".")) : lo;
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
        const unit = match[3].toLowerCase();
        const value = (lo + hi) / 2;
        values.push(unit.startsWith("min") ? value / 60 : value);
      }
      return values;
    }

    function inferGroupScaleSensitivity(group) {
      const phen = new Set(group.phenomena || []);
      const task = String(group.task || "").toLowerCase();
      if ([...phen].some(code => code.startsWith("R("))) return "kinetics-bound";
      if (task.includes("dry") || [...phen].some(code => ["PS(LS)", "PC(LS)", "2phM(LS)"].includes(code))) return "increases with scale";
      if ([...phen].some(code => ["ES(H)", "ES(C)"].includes(code))) return "increases with scale";
      if ([...phen].some(code => ["PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)"].includes(code))) return "equipment dependent";
      if ([...phen].some(code => ["PS(LL)", "PC(LL)", "PT(LL)", "2phM(LL)"].includes(code))) return "roughly constant";
      if ([...phen].some(code => code.startsWith("M(") || code.startsWith("2phM("))) return "roughly constant";
      return "unknown";
    }

    function operationScaleProfile(operationClass) {
      return operationScaleProfiles[operationClass] || operationScaleProfiles.generic;
    }

    function inferGroupOperationClass(group) {
      const phen = new Set(group.phenomena || []);
      const text = `${group.task || ""} ${group.text || ""} ${group.selectedUnit || ""}`.toLowerCase();
      if (/clean|turnaround|cip|washdown|rinse equipment|changeover/.test(text)) return "cleaning_turnaround";
      if (/crystalli[sz]|precipitat|nucleat|seed/.test(text)) return "crystallization";
      if (/dry|drying|sieve|moisture|desiccan|mgso4|na2so4/.test(text)) return "drying";
      if (/filtrat|filter|centrifug|cake/.test(text)) return "filtration";
      if ([...phen].some(code => code.startsWith("R("))) return "reaction_kinetic";
      if ([...phen].some(code => ["ES(H)", "ES(C)"].includes(code)) || /heat|cool|reflux|condens|jacket|coil|thermal|evapor|distill|solvent recover/.test(text)) return "heating_cooling";
      if (/pump|transfer|charge|feed|dose|move|line|pipe/.test(text)) return "pumping_transfer";
      if ([...phen].some(code => ["PS(LS)", "PC(LS)", "2phM(LS)"].includes(code))) return "filtration";
      return "generic";
    }

    function operationScaleMissingData(group, operationClass) {
      const profile = operationScaleProfile(operationClass);
      const missing = [];
      const need = (label, ok) => { if (!ok) missing.push(label); };
      const conditionMap = groupConditionMap(group);
      const thermal = thermalProfileForGroup(group);
      const hasStreams = group.blocks.some(block => {
        ensureBlockFlowFields(block);
        return block.streams.some(stream => Number.isFinite(massToKg(stream.quantity, stream.unit)) || Number.isFinite(parseStreamQuantity(stream.quantity)));
      });
      if (operationClass === "heating_cooling") {
        need("mass basis", hasStreams);
        need("Cp", propertyHasValue(group, "heat_capacity"));
        need("initial/final T", Number.isFinite(thermal.initialTemperature) && Number.isFinite(thermal.targetTemperature));
        need("heat-transfer device / utility", Boolean(conditionMap.thermal_mode));
        missing.push("U/A if quantitative correction is needed");
      } else if (operationClass === "reaction_kinetic") {
        need("reaction time", Boolean(conditionMap.reaction_time || conditionMap.holding_time));
        need("conversion/yield", Boolean(conditionMap.conversion_yield));
        if (group.phenomena.some(code => code.startsWith("M(") || code.startsWith("2phM("))) need("mixing adequacy", Boolean(conditionMap.mixing_time || conditionMap.agitation_speed || conditionMap.agitation_note));
        if (group.phenomena.some(code => ["ES(H)", "ES(C)"].includes(code))) need("heat-removal/thermal control note", Boolean(conditionMap.thermal_mode || conditionMap.thermal_ramp));
      } else if (operationClass === "filtration") {
        need("solid loading", Boolean(conditionMap.solid_loading));
        need("particle/cake behaviour", Boolean(conditionMap.cake_or_particle_note || propertyHasValue(group, "particle_size") || propertyHasValue(group, "cake_resistance")));
        missing.push("filter area / cake resistance if quantitative correction is needed");
      } else if (operationClass === "drying") {
        need("wet inventory", hasStreams);
        need("moisture endpoint", Boolean(conditionMap.solid_endpoint || conditionMap.transfer_endpoint));
        missing.push("drying area/rate if quantitative correction is needed");
      } else if (operationClass === "pumping_transfer") {
        need("transfer volume or mass", hasStreams);
        need("flow rate / transfer time", Boolean(conditionMap.contact_time || conditionMap.transfer_endpoint));
      } else if (operationClass === "crystallization") {
        need("solubility", propertyHasValue(group, "solubility"));
        need("cooling/supersaturation profile", Boolean(conditionMap.thermal_ramp || conditionMap.transfer_endpoint));
        need("seed/particle target", Boolean(conditionMap.cake_or_particle_note || propertyHasValue(group, "particle_size")));
      } else if (operationClass === "cleaning_turnaround") {
        need("cleaning/turnaround duration", Boolean(conditionMap.contact_time || conditionMap.holding_time));
        missing.push("surface/CIP basis if quantitative correction is needed");
      } else {
        missing.push(...profile.missing);
      }
      return [...new Set(missing)].slice(0, 6);
    }

    function candidateBasisStreams() {
      return blocksInOrder().flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams
          .filter(stream => stream.role === "output" && ["kg", "g", "t"].includes(stream.unit) && Number.isFinite(parseStreamQuantity(stream.quantity)))
          .map(stream => ({ block, stream }));
      });
    }

    function inferReferenceStream(basis) {
      const candidates = candidateBasisStreams();
      if (!candidates.length) return null;
      const product = String(basis.targetProduct || "").trim().toLowerCase();
      const byBlock = basis.referenceBlockId
        ? candidates.find(item => item.block.id === basis.referenceBlockId)
        : null;
      if (byBlock) return byBlock;
      if (product) {
        const byName = candidates.find(item => item.stream.name.toLowerCase().includes(product));
        if (byName) return byName;
      }
      const finalOutput = candidates.find(item => item.stream.timing === "final output");
      return finalOutput || candidates[candidates.length - 1];
    }

    function scaleModel() {
      const basis = ensureScaleBasis();
      const reference = inferReferenceStream(basis);
      const manualBasisKg = massToKg(basis.basisAmount, basis.basisUnit);
      const inferredBasisKg = reference ? massToKg(reference.stream.quantity, reference.stream.unit) : NaN;
      const basisKg = Number.isFinite(manualBasisKg) && manualBasisKg > 0 ? manualBasisKg : inferredBasisKg;
      const manualProductBatchKg = parseStreamQuantity(basis.productKgPerBatch);
      const targetBatchKg = Number.isFinite(manualProductBatchKg) && manualProductBatchKg > 0
        ? manualProductBatchKg
        : targetKgPerBatch(basis);
      const productFactor = Number.isFinite(targetBatchKg) && Number.isFinite(basisKg) && basisKg > 0 ? targetBatchKg / basisKg : NaN;
      const upstreamFactor = productFactor;
      const blocks = blocksInOrder().map(block => {
        ensureBlockFlowFields(block);
        return {
          blockId: block.id,
          groupId: block.groupId,
          streams: block.streams.map(stream => scaledStream(stream, block, productFactor, upstreamFactor, targetBatchKg))
        };
      });
      const rows = blocks.flatMap(block => block.streams);
      const reactorSizing = reactorSizingModel(basis, targetBatchKg, rows, reference);
      return {
        basis,
        reference: reference ? {
          blockId: reference.block.id,
          streamId: reference.stream.id,
          streamName: reference.stream.name,
          quantity: reference.stream.quantity,
          unit: reference.stream.unit
        } : null,
        target: {
          kgPerBatch: Number.isFinite(targetBatchKg) ? formatNumber(targetBatchKg) : "",
          kgPerHour: Number.isFinite(targetKgPerHour(basis)) ? formatNumber(targetKgPerHour(basis)) : "",
          kgPerYear: Number.isFinite(targetKgPerYear(basis)) ? formatNumber(targetKgPerYear(basis)) : ""
        },
        schedule: scheduleModel(basis, targetBatchKg),
        reactorSizing,
        factors: {
          productFactor: Number.isFinite(productFactor) ? formatNumber(productFactor) : "",
          upstreamFactor: Number.isFinite(upstreamFactor) ? formatNumber(upstreamFactor) : ""
        },
        blocks,
        rows,
        ready: Number.isFinite(productFactor)
      };
    }

    function reactorSizingGroupId(basis, reference) {
      const selected = selectedGroup();
      if (selected && reactionReactorLikeGroup(selected)) return selected.id;
      const referenceGroup = reference?.block?.groupId ? groupModel(reference.block.groupId) : null;
      if (referenceGroup && reactionReactorLikeGroup(referenceGroup)) return referenceGroup.id;
      const ids = groupIdsInTextOrder();
      const reactionId = ids.find(id => reactionReactorLikeGroup(groupModel(id)));
      if (reactionId) return reactionId;
      return ids.find(id => /reactor|vessel|tank|batch|semi-batch|cstr/i.test(`${ensureGroup(id).selectedUnit || ""} ${ensureGroup(id).task || ""}`)) || "";
    }

    function reactionReactorLikeGroup(group) {
      if (!group) return false;
      const text = `${group.task || ""} ${group.selectedUnit || ""} ${group.text || ""}`.toLowerCase();
      return (group.phenomena || []).some(code => code.startsWith("R(")) || /reactor|reaction|batch|semi-batch|cstr/.test(text);
    }

    function solventLikeScaleRow(row) {
      const text = `${row.name || ""} ${row.fate || ""}`.toLowerCase();
      return /solvent|cyclohexane|toluene|xylene|heptane|hexane|ethanol|methanol|acetone|acetonitrile|dichloromethane|dmf|dmso|thf/.test(text);
    }

    function reactorAutoChargeModel(basis, targetBatchKg, scaleRows = [], reference = null) {
      if (!Number.isFinite(targetBatchKg) || targetBatchKg <= 0 || !scaleRows.length) {
        return { ready: false, missing: ["target kg/batch and scaled MFA rows"] };
      }
      const groupId = reactorSizingGroupId(basis, reference);
      if (!groupId) return { ready: false, missing: ["reaction/reactor group"] };
      const group = groupModel(groupId) || ensureGroup(groupId);
      const rows = scaleRows.filter(row => row.groupId === groupId);
      const inputRows = rows.filter(row => row.role === "input");
      const basisRows = inputRows.length ? inputRows : rows.filter(row => row.role === "output");
      if (!basisRows.length) return { ready: false, groupId, missing: [`MFA input streams for ${groupId}`] };
      const densityKgM3 = groupDensityKgM3(group);
      const converted = basisRows
        .map(row => ({ row, ...rowVolumeM3(row, densityKgM3) }))
        .filter(item => Number.isFinite(item.value) && item.value >= 0);
      const missingDensity = basisRows.some(row => Number.isFinite(massToKg(row.scaledQuantity, row.scaledUnit))
        && !Number.isFinite(densityToKgM3(row.density, "kg/m3"))
        && !Number.isFinite(densityKgM3));
      if (!converted.length) {
        return {
          ready: false,
          groupId,
          missing: [missingDensity ? `density for ${groupId}` : `volume-bearing streams for ${groupId}`]
        };
      }
      const solventVolumeM3 = converted
        .filter(item => solventLikeScaleRow(item.row))
        .reduce((sum, item) => sum + item.value, 0);
      const reactantsVolumeM3 = converted
        .filter(item => !solventLikeScaleRow(item.row))
        .reduce((sum, item) => sum + item.value, 0);
      const totalChargeM3 = converted.reduce((sum, item) => sum + item.value, 0);
      return {
        ready: true,
        groupId,
        reactantsVolumeM3,
        solventVolumeM3,
        totalChargeM3,
        source: `auto from ${groupId} scaled MFA${Number.isFinite(densityKgM3) ? " + group density" : converted.some(item => /stream density/.test(item.source)) ? " + stream density" : ""}`,
        missing: missingDensity ? [`density for additional mass-only streams in ${groupId}`] : []
      };
    }

    // Returns the calculated MINIMUM working volume at the stated fill fraction, not an as-built
    // vessel size: real reactor selection adds a design margin (commonly ~10%) on top of this
    // figure and rounds up to the nearest standard manufacturer size.
    function reactorSizingModel(basis, targetBatchKg, scaleRows = [], reference = null) {
      const productBatchKg = Number.isFinite(targetBatchKg) && targetBatchKg > 0 ? targetBatchKg : NaN;
      // Both reactants and solvent are stored as L per kg product (recipe ratios, assumed scale-invariant),
      // not as fixed m3 totals, so the charge volume scales automatically with the target batch size instead
      // of silently going stale when the production target or cycle time changes.
      const reactantsLoadingLPerKg = parseStreamQuantity(basis.reactantsLoadingLPerKgProduct);
      const solventLoadingLPerKg = parseStreamQuantity(basis.solventLoadingLPerKgProduct);
      const workingFill = percentFactor(basis.reactorWorkingFillPercent, 70);
      const mw = parseStreamQuantity(basis.productMolecularWeightGmol);
      const waterStoich = parseStreamQuantity(basis.condensationWaterMolPerMol);
      const manualReactantsVolumeM3 = Number.isFinite(productBatchKg) && Number.isFinite(reactantsLoadingLPerKg) && reactantsLoadingLPerKg >= 0
        ? productBatchKg * reactantsLoadingLPerKg / 1000
        : NaN;
      const manualSolventVolumeM3 = Number.isFinite(productBatchKg) && Number.isFinite(solventLoadingLPerKg) && solventLoadingLPerKg >= 0
        ? productBatchKg * solventLoadingLPerKg / 1000
        : NaN;
      const manualReady = Number.isFinite(manualReactantsVolumeM3) || Number.isFinite(manualSolventVolumeM3);
      const autoCharge = manualReady ? { ready: false, missing: [] } : reactorAutoChargeModel(basis, productBatchKg, scaleRows, reference);
      const reactantsVolumeM3 = manualReady
        ? (Number.isFinite(manualReactantsVolumeM3) ? manualReactantsVolumeM3 : 0)
        : autoCharge.reactantsVolumeM3;
      const solventVolumeM3 = manualReady
        ? (Number.isFinite(manualSolventVolumeM3) ? manualSolventVolumeM3 : 0)
        : autoCharge.solventVolumeM3;
      const totalChargeM3 = manualReady
        ? reactantsVolumeM3 + solventVolumeM3
        : autoCharge.totalChargeM3;
      const source = manualReady
        ? "manual L/kg product recipe loadings"
        : autoCharge.ready
          ? autoCharge.source
          : "waiting for automatic MFA charge volume";
      const reactantsLoadingOut = Number.isFinite(reactantsLoadingLPerKg)
        ? reactantsLoadingLPerKg
        : Number.isFinite(productBatchKg) && Number.isFinite(reactantsVolumeM3)
          ? reactantsVolumeM3 * 1000 / productBatchKg
          : NaN;
      const solventLoadingOut = Number.isFinite(solventLoadingLPerKg)
        ? solventLoadingLPerKg
        : Number.isFinite(productBatchKg) && Number.isFinite(solventVolumeM3)
          ? solventVolumeM3 * 1000 / productBatchKg
          : NaN;
      const reactorVolumeM3 = Number.isFinite(totalChargeM3) && Number.isFinite(workingFill) && workingFill > 0
        ? totalChargeM3 / workingFill
        : NaN;
      const generatedWaterKg = Number.isFinite(productBatchKg) && Number.isFinite(mw) && mw > 0 && Number.isFinite(waterStoich) && waterStoich > 0
        ? productBatchKg * 18.015 * waterStoich / mw
        : NaN;
      const ready = Number.isFinite(reactorVolumeM3) || Number.isFinite(generatedWaterKg);
      return {
        productBatchKg: Number.isFinite(productBatchKg) ? formatNumber(productBatchKg) : "",
        reactantsLoadingLPerKgProduct: Number.isFinite(reactantsLoadingOut) ? formatNumber(reactantsLoadingOut) : "",
        reactantsVolumeM3: Number.isFinite(reactantsVolumeM3) ? formatNumber(reactantsVolumeM3) : "",
        solventLoadingLPerKgProduct: Number.isFinite(solventLoadingOut) ? formatNumber(solventLoadingOut) : "",
        solventVolumeM3: Number.isFinite(solventVolumeM3) ? formatNumber(solventVolumeM3) : "",
        totalChargeM3: Number.isFinite(totalChargeM3) ? formatNumber(totalChargeM3) : "",
        workingFillPercent: Number.isFinite(workingFill) ? formatNumber(workingFill * 100) : "",
        reactorVolumeM3: Number.isFinite(reactorVolumeM3) ? formatNumber(reactorVolumeM3) : "",
        generatedWaterKg: Number.isFinite(generatedWaterKg) ? formatNumber(generatedWaterKg) : "",
        source,
        autoGroupId: autoCharge.groupId || "",
        autoReady: Boolean(autoCharge.ready),
        ready,
        missing: [...new Set([
          Number.isFinite(productBatchKg) ? "" : "product kg/batch",
          manualReady || autoCharge.ready ? "" : "reactants/solvent loading or MFA volume",
          Number.isFinite(workingFill) ? "" : "working fill",
          Number.isFinite(mw) ? "" : "product MW for stoichiometric water",
          ...(autoCharge.missing || [])
        ].filter(Boolean))]
      };
    }

    function groupScaledLoadKg(scale, groupId) {
      const groupRows = (scale.rows || []).filter(row => row.groupId === groupId);
      const preferred = groupRows.filter(row => row.role === "input");
      const fallback = groupRows.filter(row => row.role === "output");
      const rows = preferred.length ? preferred : fallback;
      const values = rows.map(row => massToKg(row.scaledQuantity, row.scaledUnit)).filter(value => Number.isFinite(value) && value > 0);
      return values.length ? values.reduce((sum, value) => sum + value, 0) : NaN;
    }

    function volumeToM3(value, unit) {
      const number = parseStreamQuantity(value);
      if (!Number.isFinite(number)) return NaN;
      if (unit === "m3") return number;
      if (unit === "L") return number / 1000;
      if (unit === "mL") return number / 1000000;
      return NaN;
    }

    function densityToKgM3(value, unit = "kg/m3") {
      const number = parseStreamQuantity(value);
      if (!Number.isFinite(number) || number <= 0) return NaN;
      const normalized = String(unit || "kg/m3").toLowerCase().replace(/\s+/g, "");
      if (normalized === "kg/m3" || normalized === "kg/m^3" || normalized === "kgm-3") return number;
      if (normalized === "g/ml" || normalized === "g/cm3" || normalized === "g/cm^3") return number * 1000;
      if (normalized === "kg/l") return number * 1000;
      return NaN;
    }

    function groupDensityKgM3(group) {
      const density = group?.properties?.density;
      if (!density) return NaN;
      return densityToKgM3(density.value, density.unit);
    }

    function rowVolumeM3(row, densityKgM3) {
      const direct = volumeToM3(row.scaledQuantity, row.scaledUnit);
      if (Number.isFinite(direct)) return { value: direct, source: "direct MFA volume" };
      const massKg = massToKg(row.scaledQuantity, row.scaledUnit);
      const streamDensityKgM3 = densityToKgM3(row.density, "kg/m3");
      if (Number.isFinite(massKg) && Number.isFinite(streamDensityKgM3) && streamDensityKgM3 > 0) {
        return { value: massKg / streamDensityKgM3, source: "scaled MFA mass / stream density" };
      }
      if (Number.isFinite(massKg) && Number.isFinite(densityKgM3) && densityKgM3 > 0) {
        return { value: massKg / densityKgM3, source: "scaled MFA mass / group density" };
      }
      return { value: NaN, source: "" };
    }

    function groupScaledLoadVolumeM3(scale, groupId, group = groupModel(groupId)) {
      const groupRows = (scale.rows || []).filter(row => row.groupId === groupId);
      const preferred = groupRows.filter(row => row.role === "input");
      const fallback = groupRows.filter(row => row.role === "output");
      const rows = preferred.length ? preferred : fallback;
      const densityKgM3 = groupDensityKgM3(group);
      const converted = rows
        .map(row => ({ row, ...rowVolumeM3(row, densityKgM3) }))
        .filter(item => Number.isFinite(item.value) && item.value >= 0);
      const massRowsMissingDensity = rows.filter(row => Number.isFinite(massToKg(row.scaledQuantity, row.scaledUnit))
        && !Number.isFinite(densityToKgM3(row.density, "kg/m3"))
        && !Number.isFinite(densityKgM3));
      if (!converted.length) {
        return {
          value: NaN,
          unit: "m3",
          source: massRowsMissingDensity.length ? "needs group density for mass-to-volume" : "no volumetric MFA basis",
          missing: massRowsMissingDensity.length ? ["group density"] : ["volume stream or density-backed mass stream"]
        };
      }
      return {
        value: converted.reduce((sum, item) => sum + item.value, 0),
        unit: "m3",
        source: [...new Set(converted.map(item => item.source))].join(" + "),
        missing: massRowsMissingDensity.length ? ["density for additional mass-only streams"] : []
      };
    }

    function groupCapacityActual(task, scale, reactorSizing) {
      const capacityUnit = task.capacityUnit || "";
      const loadKg = groupScaledLoadKg(scale, task.groupId);
      if (capacityUnit === "kg/batch") return { value: loadKg, unit: "kg/batch", source: "scaled MFA load" };
      if (capacityUnit === "kg/h") {
        return Number.isFinite(loadKg) && Number.isFinite(task.effectiveTimeH) && task.effectiveTimeH > 0
          ? { value: loadKg / task.effectiveTimeH, unit: "kg/h", source: "scaled MFA load / effective time" }
          : { value: NaN, unit: "kg/h", source: "missing load or time" };
      }
      if (capacityUnit === "m3") {
        const group = groupModel(task.groupId) || ensureGroup(task.groupId);
        const groupVolume = groupScaledLoadVolumeM3(scale, task.groupId, group);
        if (Number.isFinite(groupVolume.value)) return groupVolume;
        const charge = parseStreamQuantity(reactorSizing.totalChargeM3);
        return Number.isFinite(charge)
          ? { value: charge, unit: "m3", source: "reactor sizing total charge", missing: groupVolume.missing || [] }
          : groupVolume;
      }
      if (capacityUnit === "L") {
        const group = groupModel(task.groupId) || ensureGroup(task.groupId);
        const groupVolume = groupScaledLoadVolumeM3(scale, task.groupId, group);
        if (Number.isFinite(groupVolume.value)) return { ...groupVolume, value: groupVolume.value * 1000, unit: "L" };
        const charge = parseStreamQuantity(reactorSizing.totalChargeM3);
        return Number.isFinite(charge)
          ? { value: charge * 1000, unit: "L", source: "reactor sizing total charge", missing: groupVolume.missing || [] }
          : { ...groupVolume, unit: "L" };
      }
      return { value: NaN, unit: capacityUnit, source: "capacity basis missing" };
    }

    function throughputDiagnosticsModel(scale, gantt = taskScheduleModel()) {
      const reactorSizing = scale.reactorSizing || reactorSizingModel(scale.basis, parseStreamQuantity(scale.target.kgPerBatch));
      const allowable = Math.max(1, parseStreamQuantity(scale.basis.allowableCapacityUtilizationPercent) || 85);
      const plantCycle = Number.isFinite(gantt.plantCycleTimeH) && gantt.plantCycleTimeH > 0 ? gantt.plantCycleTimeH : NaN;
      const rows = (gantt.tasks || []).map(task => {
        const capacity = parseStreamQuantity(task.capacityAmount);
        const actual = groupCapacityActual(task, scale, reactorSizing);
        const utilization = Number.isFinite(actual.value) && Number.isFinite(capacity) && capacity > 0
          ? actual.value / capacity * 100
          : NaN;
        const timeScore = Number.isFinite(task.effectiveTimeH) && Number.isFinite(plantCycle) ? task.effectiveTimeH / plantCycle : NaN;
        const combinedScore = Number.isFinite(timeScore) && Number.isFinite(utilization) ? timeScore * utilization / 100 : NaN;
        return {
          groupId: task.groupId,
          task: task.task,
          effectiveTimeH: task.effectiveTimeH,
          timeScore,
          capacityAmount: task.capacityAmount,
          capacityUnit: task.capacityUnit,
          actualValue: actual.value,
          actualUnit: actual.unit,
          actualSource: actual.source,
          actualMissing: actual.missing || [],
          utilizationPercent: utilization,
          combinedScore
        };
      });
      const withUtilization = rows.filter(row => Number.isFinite(row.utilizationPercent));
      const sizeBottleneck = withUtilization.slice().sort((a, b) => b.utilizationPercent - a.utilizationPercent)[0] || null;
      const throughputBottleneck = rows.filter(row => Number.isFinite(row.combinedScore)).sort((a, b) => b.combinedScore - a.combinedScore)[0] || null;
      return {
        allowableCapacityUtilizationPercent: allowable,
        timeBottleneck: gantt.bottleneck || gantt.bottleneckCandidate || null,
        sizeBottleneck,
        throughputBottleneck,
        rows
      };
    }

    function scaledStream(stream, block, productFactor, upstreamFactor, targetBatchKg) {
      const base = parseStreamQuantity(stream.quantity);
      const isFinalOutput = stream.role === "output" && stream.timing === "final output";
      const resolved = resolveStreamScaling(stream, base, isFinalOutput, productFactor, upstreamFactor, targetBatchKg);
      return {
        blockId: block.id,
        groupId: block.groupId,
        streamId: stream.id,
        role: stream.role,
        name: stream.name,
        phase: stream.phase,
        timing: stream.timing,
        fate: stream.fate,
        recoveryPercent: stream.recoveryPercent,
        purgePercent: stream.purgePercent,
        scalingMode: stream.scalingMode,
        loopId: stream.loopId,
        status: stream.status,
        baseQuantity: stream.quantity,
        baseUnit: stream.unit,
        appliedFactor: Number.isFinite(resolved.factor) ? formatNumber(resolved.factor) : "",
        scaledQuantity: Number.isFinite(resolved.quantity) ? formatNumber(resolved.quantity) : "",
        scaledUnit: resolved.unit || stream.unit,
        scalingStatus: resolved.status,
        ...streamChemicalPropertyPayloadWithDensity(stream)
      };
    }

    function resolveStreamScaling(stream, base, isFinalOutput, productFactor, upstreamFactor, targetBatchKg) {
      const mode = stream.scalingMode || defaultStreamScalingMode(stream.role, stream.unit, stream.fate);
      if (!Number.isFinite(base) || !stream.unit) return { quantity: NaN, unit: stream.unit, factor: NaN, status: "not_scaled" };
      if (mode === "manual") {
        return { quantity: base, unit: stream.unit, factor: 1, status: "manual_target_value" };
      }
      if (mode === "per batch") {
        return { quantity: base, unit: stream.unit, factor: 1, status: "per_batch_value" };
      }
      if (mode === "per kg product" || stream.unit === "kg/kg product" || stream.unit === "L/kg product") {
        if (!Number.isFinite(targetBatchKg)) return { quantity: NaN, unit: displayPerProductUnit(stream.unit), factor: NaN, status: "missing_product_batch_basis" };
        return {
          quantity: base * targetBatchKg,
          unit: displayPerProductUnit(stream.unit),
          factor: targetBatchKg,
          status: "per_kg_product_factor"
        };
      }
      const factor = isFinalOutput ? productFactor : upstreamFactor;
      const canScale = Number.isFinite(factor);
      return {
        quantity: canScale ? base * factor : NaN,
        unit: stream.unit,
        factor,
        status: canScale ? (isFinalOutput ? "product_target_factor" : mode === "recycle loop" ? "recycle_loop_gross_factor" : "upstream_yield_recovery_margin_factor") : "not_scaled"
      };
    }

    function displayPerProductUnit(unit) {
      if (unit === "kg/kg product") return "kg";
      if (unit === "L/kg product") return "L";
      return unit;
    }

    function scaledRowsByRole(model) {
      return ["input", "output", "waste"].map(role => ({
        role,
        rows: model.rows.filter(row => row.role === role)
      })).filter(group => group.rows.length);
    }

    function recycleSummary(scale = scaleModel()) {
      const scaledByStreamId = new Map((scale.rows || []).map(row => [row.streamId, row]));
      const streams = blocksInOrder().flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams
          .filter(stream => stream.name.trim())
          .map(stream => ({ ...stream, blockId: block.id, groupId: block.groupId }));
      });
      const byFate = new Map();
      const loops = new Map();
      const warnings = [];
      streams.forEach(stream => {
        const fate = stream.fate || "unknown";
        if (!byFate.has(fate)) byFate.set(fate, []);
        byFate.get(fate).push(stream);
        if (stream.loopId.trim()) {
          const key = stream.loopId.trim();
          if (!loops.has(key)) loops.set(key, []);
          loops.get(key).push(stream);
        }
        if (["recycled input", "recovered solvent"].includes(fate) && !stream.recoveryPercent.trim()) {
          warnings.push({
            severity: "medium",
            blockId: stream.blockId,
            streamId: stream.id,
            streamName: stream.name,
            issue: "Recovery percent missing for recycled/recovered stream."
          });
        }
        if (fate === "purge" && !stream.purgePercent.trim()) {
          warnings.push({
            severity: "medium",
            blockId: stream.blockId,
            streamId: stream.id,
            streamName: stream.name,
            issue: "Purge percent missing for purge stream."
          });
        }
        if (stream.accumulationRisk.trim() && !stream.purgePercent.trim() && !["purge", "wastewater", "solid waste", "vent", "loss"].includes(fate)) {
          warnings.push({
            severity: "low",
            blockId: stream.blockId,
            streamId: stream.id,
            streamName: stream.name,
            issue: "Accumulation risk noted without purge/loss destination."
          });
        }
      });
      const closures = streams
        .map(stream => recycleClosureEntry(stream, scaledByStreamId.get(stream.id)))
        .filter(Boolean);
      return {
        fates: Array.from(byFate.entries()).map(([fate, items]) => ({
          fate,
          count: items.length,
          streams: items.map(stream => recycleStreamEntry(stream))
        })),
        loops: Array.from(loops.entries()).map(([loopId, items]) => ({
          loopId,
          streams: items.map(stream => recycleStreamEntry(stream))
        })),
        closures,
        warnings
      };
    }

    function recycleClosureEntry(stream, scaledRow) {
      const recovery = parseStreamQuantity(stream.recoveryPercent);
      const purge = parseStreamQuantity(stream.purgePercent);
      const hasRecycleFate = ["recycled input", "recovered solvent"].includes(stream.fate);
      if (!hasRecycleFate && !Number.isFinite(recovery) && !Number.isFinite(purge)) return null;
      const gross = parseStreamQuantity(scaledRow?.scaledQuantity);
      const unit = scaledRow?.scaledUnit || stream.unit;
      if (!Number.isFinite(gross) || !unit || unit === "%") {
        return {
          blockId: stream.blockId,
          groupId: stream.groupId,
          streamId: stream.id,
          name: stream.name,
          loopId: stream.loopId,
          unit,
          status: "needs scaled quantity",
          gross: "",
          recovered: "",
          loss: "",
          makeup: "",
          purge: "",
          recoveryPercent: stream.recoveryPercent,
          purgePercent: stream.purgePercent
        };
      }
      const safeRecovery = Number.isFinite(recovery) ? Math.min(100, Math.max(0, recovery)) : NaN;
      const safePurge = Number.isFinite(purge) ? Math.min(100, Math.max(0, purge)) : NaN;
      const recovered = Number.isFinite(safeRecovery) ? gross * safeRecovery / 100 : NaN;
      const loss = Number.isFinite(safeRecovery) ? gross - recovered : NaN;
      const purgeAmount = Number.isFinite(safePurge) ? gross * safePurge / 100 : NaN;
      return {
        blockId: stream.blockId,
        groupId: stream.groupId,
        streamId: stream.id,
        name: stream.name,
        loopId: stream.loopId,
        unit,
        status: Number.isFinite(safeRecovery) || Number.isFinite(safePurge) ? "closed estimate" : "recovery/purge missing",
        gross: formatNumber(gross),
        recovered: Number.isFinite(recovered) ? formatNumber(recovered) : "",
        loss: Number.isFinite(loss) ? formatNumber(loss) : "",
        makeup: Number.isFinite(loss) ? formatNumber(loss) : "",
        purge: Number.isFinite(purgeAmount) ? formatNumber(purgeAmount) : "",
        recoveryPercent: stream.recoveryPercent,
        purgePercent: stream.purgePercent
      };
    }

    function recycleStreamEntry(stream) {
      return {
        blockId: stream.blockId,
        groupId: stream.groupId,
        streamId: stream.id,
        role: stream.role,
        name: stream.name,
        quantity: stream.quantity,
        unit: stream.unit,
        phase: stream.phase,
        fate: stream.fate,
        recoveryPercent: stream.recoveryPercent,
        purgePercent: stream.purgePercent,
        loopId: stream.loopId,
        destinationGroup: stream.destinationGroup,
        makeupRequired: stream.makeupRequired,
        accumulationRisk: stream.accumulationRisk,
        status: stream.status
      };
    }

    function energyBridgeModel(scale = scaleModel()) {
      return groupIdsInTextOrder().flatMap(groupId => {
        const group = groupModel(groupId);
        const phenomena = new Set(group.phenomena);
        const conditionMap = groupConditionMap(group);
        const rows = scale.rows.filter(row => row.groupId === groupId);
        const massBasis = groupMassBasis(rows);
        const events = [];
        if (phenomena.has("ES(H)")) events.push(energyEvent("heating", group, conditionMap, massBasis, rows, ["Cp", "heat loss factor"]));
        if (phenomena.has("ES(C)")) events.push(energyEvent("cooling", group, conditionMap, massBasis, rows, ["Cp", "cooling utility approach"]));
        if (phenomena.has("PCh(L->V)") || (phenomena.has("PT(VL)") && group.task.toLowerCase().includes("removal"))) {
          events.push(energyEvent("evaporation", group, conditionMap, massBasis, rows, ["latent heat", "boiling point or vapor pressure"]));
        }
        if (phenomena.has("PCh(V->L)") || (phenomena.has("PT(VL)") && group.task.toLowerCase().includes("condens"))) {
          events.push(energyEvent("condensation", group, conditionMap, massBasis, rows, ["latent heat", "condenser outlet temperature"]));
        }
        if (group.task.toLowerCase().includes("dry") || (phenomena.has("PC(LS)") && phenomena.has("ES(H)"))) {
          events.push(energyEvent("drying", group, conditionMap, massBasis, rows, ["water/solvent loading", "latent heat", "drying endpoint"]));
        }
        if (conditionMap.target_pressure) {
          events.push(energyEvent("vacuum / pressure control", group, conditionMap, massBasis, rows, ["vacuum level profile", "non-condensable load"]));
        }
        const hasMixingPhenomena = [...phenomena].some(code => code.startsWith("M(") || code.startsWith("2phM("));
        if (hasMixingPhenomena && mixingPhysicalPropertiesNeeded(group)) {
          events.push(energyEvent("mixing", group, conditionMap, massBasis, rows, ["viscosity", "density", "impeller geometry"]));
        }
        return events.filter(Boolean);
      });
    }

    function scaleUpAssessmentModel(scale = scaleModel()) {
      const energy = energyBridgeModel(scale);
      const recycle = recycleSummary(scale);
      const cards = [];
      groupIdsInTextOrder().forEach(groupId => {
        const group = groupModel(groupId);
        const phenomena = new Set(group.phenomena);
        const conditions = groupConditionMap(group);
        const properties = new Set(exportGroupProperties(group).filter(item => item.value || item.note).map(item => item.id));
        const rows = scale.rows.filter(row => row.groupId === groupId);
        const mass = groupMassBasis(rows);
        if (phenomena.has("ES(H)") || phenomena.has("ES(C)")) {
          const missing = [];
          if (!mass.value) missing.push("scaled mass");
          if (!conditions.target_temperature && !conditions.holding_temperature) missing.push("target/holding temperature");
          if (!properties.has("heat_capacity")) missing.push("Cp");
          cards.push(scaleRiskCard(group, "Heat-transfer scale-up", missing.length ? "medium" : "low", missing, "Check heating/cooling area, utility approach, heat-up/cool-down time, and temperature control strategy."));
        }
        if ([...phenomena].some(code => code.startsWith("M(") || code.startsWith("2phM("))) {
          const missing = [];
          if (!conditions.mixing_time) missing.push("mixing time");
          if (!conditions.agitation_speed) missing.push("agitation speed");
          const needsPhysicalProps = mixingPhysicalPropertiesNeeded(group);
          if (needsPhysicalProps && !properties.has("viscosity")) missing.push("viscosity");
          if (needsPhysicalProps && !properties.has("density")) missing.push("density");
          cards.push(scaleRiskCard(group, "Mixing scale-up", missing.length ? "medium" : "low", missing, needsPhysicalProps ? "Check whether lab agitation maps to industrial mixing time, power input, suspension, and mass transfer." : "For simple liquid blending, mixing time and mode are enough for framework-level screening; physical properties can be deferred unless scale sensitivity appears."));
        }
        if ([...phenomena].some(code => ["PS(LL)", "PT(LL)", "PC(LL)", "2phM(LL)"].includes(code))) {
          const missing = [];
          if (!conditions.settling_time) missing.push("settling time");
          if (!conditions.separation_efficiency) missing.push("separation efficiency");
          if (!properties.has("density_difference")) missing.push("density difference");
          if (!properties.has("miscibility")) missing.push("miscibility");
          if (!properties.has("emulsion_risk")) missing.push("emulsion risk");
          cards.push(scaleRiskCard(group, "Liquid-liquid scale-up", missing.length ? "high" : "medium", missing, "Check phase disengagement, interface control, emulsion risk, wash/extraction volume, and decanter feasibility."));
        }
        if ([...phenomena].some(code => ["PS(LS)", "PT(LS)", "PC(LS)", "2phM(LS)"].includes(code))) {
          const missing = [];
          if (!conditions.solid_loading) missing.push("solid loading");
          if (!properties.has("particle_size")) missing.push("particle size");
          if (!properties.has("cake_resistance")) missing.push("cake resistance/compressibility");
          cards.push(scaleRiskCard(group, "Solid-liquid scale-up", missing.length ? "medium" : "low", missing, "Check filtration/drying behavior, cake handling, salt loading, and solids transfer."));
        }
        if ([...phenomena].some(code => ["PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)"].includes(code))) {
          const missing = [];
          if (!conditions.target_pressure) missing.push("pressure/vacuum basis");
          if (!properties.has("boiling_point")) missing.push("boiling point");
          if (!properties.has("vapor_pressure")) missing.push("vapor pressure");
          if (!properties.has("degradation_temperature")) missing.push("degradation temperature");
          cards.push(scaleRiskCard(group, "Vapor-liquid / solvent-recovery scale-up", missing.length ? "medium" : "low", missing, "Check condenser/reboiler duty, vacuum feasibility, volatile losses, degradation, and solvent recovery route."));
        }
      });
      recycle.warnings.forEach(warning => {
        cards.push({
          groupId: "",
          task: "recycle/fate",
          title: "Recycle / purge closure",
          severity: warning.severity,
          missing: [warning.issue],
          recommendation: "Close solvent recovery, purge, make-up, and accumulation logic before relying on scaled inventories."
        });
      });
      energy.filter(event => event.missing.length).forEach(event => {
        cards.push({
          groupId: event.groupId,
          task: event.task,
          title: `${event.eventType} energy handoff`,
          severity: event.missing.includes("scaled mass basis") ? "high" : "medium",
          missing: event.missing,
          recommendation: "Complete the energy bridge fields before exporting to the energy calculation tool."
        });
      });
      return cards;
    }

    function scaleRiskCard(group, title, severity, missing, recommendation) {
      return {
        groupId: group.id,
        task: group.task,
        title,
        severity,
        missing,
        recommendation
      };
    }

    function heuristicReviewModel(scale = scaleModel()) {
      const ctx = heuristicContext(scale);
      const groupIds = groupIdsInTextOrder();
      // heuristicRuleGroupIds below needs every rule checked against every group's own context to
      // report which groups trigger it - but that context (a text/phenomena scan of that group's
      // blocks and streams) is the same for every rule, so it's built once per group here and reused,
      // instead of being rebuilt from scratch for every (rule, group) pair.
      const groupContexts = new Map(groupIds.map(groupId => [groupId, heuristicContext(scale, groupId)]));
      const triggered = heuristicRuleLibrary
        .map(rule => ({ rule, card: heuristicRuleCard(rule, ctx) }))
        .filter(item => item.card)
        .map(({ rule, card }) => ({ ...card, groupIds: heuristicRuleGroupIds(rule, groupIds, groupContexts) }))
        .sort((a, b) =>
          severityRank(a.severity) - severityRank(b.severity)
          || a.id.localeCompare(b.id));
      return {
        totalRules: heuristicRuleLibrary.length,
        triggered,
        library: heuristicRuleLibrary.map(rule => ({
          id: rule.id,
          area: rule.area,
          title: rule.title,
          tags: rule.tags,
          severity: rule.severity,
          recommendation: rule.recommendation,
          source: rule.source
        }))
      };
    }

    // Which task groups, evaluated on their own evidence alone, independently trigger this rule.
    // Lets the UI say "applies to G2, G6" instead of leaving a project-wide list with no indication
    // of where to actually act. A rule that only fires globally (its trigger comes from combining
    // evidence across groups, e.g. text mentioning "purge" in one group and "recycle" in another)
    // returns an empty list here and is shown as project-wide rather than mis-attributed to one group.
    function heuristicRuleGroupIds(rule, groupIds, groupContexts) {
      return groupIds.filter(groupId => Boolean(heuristicRuleCard(rule, groupContexts.get(groupId))));
    }

    // scopeGroupId narrows the evidence to one task group's own blocks/streams/conditions instead of
    // the whole project. Used to find out WHICH group actually triggered a rule (see
    // heuristicRuleGroupIds below); the unscoped call keeps the original project-wide behavior so
    // nothing about which rules trigger changes, only which ones can additionally be localized.
    function heuristicContext(scale, scopeGroupId = null) {
      const allBlocks = blocksInOrder().map(block => {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
        return block;
      });
      const allGroups = groupIdsInTextOrder().map(groupModel);
      const blocks = scopeGroupId ? allBlocks.filter(block => block.groupId === scopeGroupId) : allBlocks;
      const groups = scopeGroupId ? allGroups.filter(group => group.id === scopeGroupId) : allGroups;
      const textParts = [
        ...(scopeGroupId ? [] : [state.text]),
        ...blocks.map(block => `${block.text} ${block.behavior} ${block.endpoint || ""}`),
        ...blocks.flatMap(block => block.streams.map(stream => `${stream.name} ${stream.fate} ${stream.note} ${stream.accumulationRisk} ${stream.destinationGroup}`)),
        ...groups.map(group => `${group.task} ${group.selectedUnit || ""}`)
      ];
      const allText = textParts.join(" ").toLowerCase();
      const phenomena = new Set(groups.flatMap(group => group.phenomena || []));
      blocks.forEach(block => (block.phenomena || []).forEach(code => phenomena.add(code)));
      const phases = new Set(blocks.flatMap(block => block.streams.map(stream => stream.phase)).filter(Boolean));
      const fates = new Set(blocks.flatMap(block => block.streams.map(stream => stream.fate)).filter(Boolean));
      const groupConditions = groups.flatMap(group => aggregateGroupConditions(group));
      const properties = new Set(groups.flatMap(group => exportGroupProperties(group).filter(item => item.value || item.note).map(item => item.id)));
      const hasReaction = [...phenomena].some(code => code.startsWith("R("));
      const hasMixing = [...phenomena].some(code => code.startsWith("M(") || code.startsWith("2phM("));
      const hasLL = [...phenomena].some(code => ["PT(LL)", "PS(LL)", "PC(LL)", "2phM(LL)"].includes(code)) || phases.has("LL");
      const hasVL = [...phenomena].some(code => ["PT(VL)", "PS(VL)", "PC(VL)", "2phM(VL)", "PCh(L->V)", "PCh(V->L)"].includes(code)) || phases.has("VL");
      const hasLS = [...phenomena].some(code => ["PT(LS)", "PS(LS)", "PC(LS)", "2phM(LS)"].includes(code)) || phases.has("LS");
      const hasVS = [...phenomena].some(code => ["PT(VS)", "PS(VS)", "PC(VS)", "2phM(VS)"].includes(code)) || phases.has("VS");
      const hasVapor = hasVL || hasVS || phases.has("V") || /\bvapor|gas|vent|volatile|voc|conden|reflux|distill|evapor|vacuum\b/.test(allText);
      const hasLiquid = phases.has("L") || hasLL || hasVL || hasLS;
      const hasSolid = phases.has("S") || hasLS || hasVS || /\bsolid|crystal|filter|sieve|mgso4|na2so4|salt|cake|powder|slurry\b/.test(allText);
      const hasVacuum = /vacuum|reduced pressure|mbar|mmhg|1\.5/.test(allText) || groupConditions.some(item => item.id === "target_pressure");
      const hasRecycle = fates.has("recycled input") || fates.has("recovered solvent") || blocks.some(block => block.streams.some(stream => stream.loopId.trim()));
      const hasPurge = fates.has("purge") || fates.has("loss") || fates.has("vent") || /purge|drag stream|vent|loss/.test(allText);
      const hasHazard = /toxic|hazard|flammable|corrosive|voc|nh3|ammonia|carbon polish|activated carbon|abatement|explosive|air ingress/.test(allText) || properties.has("hazard_note");
      const hasHeatSensitive = /heat[- ]?sensitive|thermal degradation|degradation|short-path|thin-film|wiped-film/.test(allText) || properties.has("degradation_temperature");
      const hasReversible = /reversible|equilibrium|dean-stark|water removal|azeotrope|drive.*right|in-situ removal/.test(allText);
      const hasExotherm = /exotherm|heat release|cooling jacket|quench|cold shot/.test(allText);
      const hasEndotherm = /endotherm/.test(allText);
      const hasCrystallization = [...phenomena].some(code => ["PT(LS)", "PCh(L->S)", "PCh(S->L)"].includes(code)) || /crystal|crystalliz|precipitat/.test(allText);
      const hasDrying = /dry|drying|sieve|mgso4|na2so4|moisture|water <|karl/.test(allText);
      const hasAdsorption = /adsorb|activated carbon|carbon bed|molecular sieve|sieve/.test(allText);
      const hasMembrane = /membrane|pervaporation|permeat|retentate/.test(allText) || [...phenomena].some(code => code.includes("(M"));
      const hasHighTemperature = /400\s*C|750\s*F|furnace|fired|hot oil|190|210/.test(allText);
      const hasPressureChange = hasVacuum || /compress|pump|pressure|bar|atm|mbar|mmhg/.test(allText) || [...phenomena].some(code => ["ES(P)", "ES(E)"].includes(code));
      const tags = new Set();
      if (hasReaction) tags.add("reaction");
      if (hasMixing) tags.add("mixing");
      if (hasLL) tags.add("ll").add("liquid_separation");
      if (hasVL) tags.add("vl").add("liquid_separation");
      if (hasVapor) tags.add("vapor").add("gas_separation");
      if (hasLiquid) tags.add("liquid");
      if (hasSolid) tags.add("solid_particle").add("solids_handling");
      if (hasLS) tags.add("solid_liquid").add("filtration");
      if (hasVS) tags.add("vapor_solid");
      if (hasVacuum) tags.add("vacuum");
      if (hasRecycle) tags.add("recycle");
      if (hasPurge) tags.add("purge");
      if (hasHazard) tags.add("hazard").add("vent");
      if (hasHeatSensitive) tags.add("heat_sensitive");
      if (hasReversible) tags.add("reversible").add("separation");
      if (hasExotherm) tags.add("exotherm").add("cooling");
      if (hasEndotherm) tags.add("endotherm").add("heating");
      if (hasCrystallization) tags.add("crystallization");
      if (hasDrying) tags.add("drying");
      if (hasAdsorption) tags.add("adsorption");
      if (hasMembrane) tags.add("membrane");
      if (hasHighTemperature) tags.add("high_temperature");
      if (hasPressureChange) tags.add("pressure").add("pressure_reduction");
      if (hasVapor && hasPressureChange) tags.add("gas_pressure");
      if (hasLiquid && hasPressureChange) tags.add("liquid_pressure");
      if (hasVL || /condens|reflux/.test(allText)) tags.add("condensation");
      if (hasVL || /boil|evapor|reflux/.test(allText)) tags.add("boiling");
      if ([...phenomena].some(code => ["ES(H)", "ES(C)", "PT(VL)", "PCh(L->V)", "PCh(V->L)"].includes(code))) tags.add("heat_exchange").add("utility");
      if (/selectiv|yield|conversion|side reaction|byproduct/.test(allText)) tags.add("selectivity");
      if (/inert|nitrogen|n2|catalyst poison/.test(allText)) tags.add("inert");
      if (/valuable|product|solvent|octocrylene|cyclohexane/.test(allText)) tags.add("valuable");
      if (/wash|brine|water wash|cake wash/.test(allText)) tags.add("washing");
      return { tags, blocks, groups, phenomena, phases, fates, text: allText, scale };
    }

    function heuristicRuleCard(rule, ctx) {
      const matchedTags = rule.tags.filter(tag => ctx.tags.has(tag));
      if (!matchedTags.length || !heuristicRuleIsRelevant(rule, matchedTags)) return null;
      const evidence = heuristicEvidence(rule, matchedTags, ctx);
      return {
        id: rule.id,
        area: rule.area,
        title: rule.title,
        severity: rule.severity,
        confidence: heuristicRuleConfidence(rule, matchedTags),
        triggeredBy: matchedTags,
        evidence,
        recommendation: rule.recommendation,
        source: rule.source
      };
    }

    function heuristicRuleIsRelevant(rule, matchedTags) {
      const specificMatches = matchedTags.filter(tag => !genericHeuristicTags().has(tag));
      if (matchedTags.length >= 2) return true;
      if (specificMatches.length && rule.severity !== "low") return true;
      if (specificMatches.length && strongHeuristicTags().has(specificMatches[0])) return true;
      return false;
    }

    function heuristicRuleConfidence(rule, matchedTags) {
      const specificMatches = matchedTags.filter(tag => !genericHeuristicTags().has(tag));
      if (matchedTags.length >= 3 || specificMatches.length >= 2) return "strong";
      if (matchedTags.length >= 2 || specificMatches.length) return "focused";
      return "screening";
    }

    function genericHeuristicTags() {
      return new Set([
        "reaction",
        "mixing",
        "liquid",
        "vapor",
        "pressure",
        "heat_exchange",
        "utility",
        "liquid_separation",
        "gas_separation",
        "separation",
        "boiling",
        "condensation",
        "heating",
        "cooling"
      ]);
    }

    function strongHeuristicTags() {
      return new Set([
        "vacuum",
        "recycle",
        "purge",
        "hazard",
        "heat_sensitive",
        "reversible",
        "exotherm",
        "endotherm",
        "crystallization",
        "drying",
        "adsorption",
        "membrane",
        "high_temperature",
        "solid_liquid",
        "vapor_solid",
        "solid_particle",
        "solids_handling",
        "filtration",
        "washing",
        "selectivity",
        "inert",
        "valuable"
      ]);
    }

    function heuristicEvidence(rule, matchedTags, ctx) {
      const groupHits = ctx.groups
        .filter(group => (group.phenomena || []).some(code => heuristicPhenomenonTags(code).some(tag => matchedTags.includes(tag))))
        .map(group => group.id)
        .slice(0, 4);
      const phaseHits = [...ctx.phases].filter(Boolean).slice(0, 4);
      const parts = [];
      if (groupHits.length) parts.push(`groups ${groupHits.join(", ")}`);
      if (phaseHits.length) parts.push(`phases ${phaseHits.join(", ")}`);
      parts.push(`tags ${matchedTags.slice(0, 4).join(", ")}`);
      return parts.join("; ");
    }

    function heuristicPhenomenonTags(code) {
      const tags = [];
      if (code.startsWith("R(")) tags.push("reaction");
      if (code.startsWith("M(") || code.startsWith("2phM(")) tags.push("mixing");
      if (code.includes("LL")) tags.push("ll", "liquid_separation");
      if (code.includes("VL") || code === "PCh(L->V)" || code === "PCh(V->L)") tags.push("vl", "vapor", "heat_exchange");
      if (code.includes("LS")) tags.push("solid_liquid", "filtration");
      if (code.includes("VS")) tags.push("vapor_solid", "solid_particle");
      if (code === "ES(H)") tags.push("heating", "heat_exchange");
      if (code === "ES(C)") tags.push("cooling", "heat_exchange");
      if (code === "ES(P)") tags.push("pressure", "gas_pressure", "liquid_pressure");
      return tags;
    }

    function groupConditionMap(group) {
      return aggregateGroupConditions(group).reduce((acc, item) => {
        acc[item.id] = {
          ...item,
          value: item.effectiveValue || item.value,
          display: item.effectiveDisplay || item.display
        };
        return acc;
      }, {});
    }

    function groupMassBasis(rows) {
      const kgRows = rows.filter(row => row.scaledUnit === "kg" && Number.isFinite(parseStreamQuantity(row.scaledQuantity)));
      const preferred = kgRows.filter(row => row.role === "input");
      const source = preferred.length ? preferred : kgRows;
      if (!source.length) {
        return { value: "", unit: "", basis: "missing scaled kg stream", streamIds: [] };
      }
      const total = source.reduce((sum, row) => sum + parseStreamQuantity(row.scaledQuantity), 0);
      return {
        value: formatNumber(total),
        unit: "kg",
        basis: preferred.length ? "sum of scaled input streams" : "sum of scaled streams",
        streamIds: source.map(row => row.streamId)
      };
    }

    function energyEvent(type, group, conditionMap, massBasis, rows, propertyMissing) {
      const missing = [];
      if (!massBasis.value) missing.push("scaled mass basis");
      propertyMissing
        .filter(item => !groupHasPropertyForNeed(group, item))
        .forEach(item => missing.push(item));
      const initialTemperature = conditionMap.initial_temperature?.display || "";
      const targetTemperature = conditionMap.target_temperature?.display || conditionMap.holding_temperature?.display || "";
      if ((type === "heating" || type === "cooling") && !targetTemperature) missing.push("target temperature");
      const duration = conditionMap.holding_time?.display || conditionMap.reaction_time?.display || conditionMap.mixing_time?.display || conditionMap.phase_change_time?.display || conditionMap.settling_time?.display || "";
      const pressure = conditionMap.target_pressure?.display || conditionMap.initial_pressure?.display || "";
      return {
        groupId: group.id,
        task: group.task,
        eventType: type,
        massBasis,
        initialTemperature,
        targetTemperature,
        duration,
        pressure,
        streamSummary: energyStreamSummary(rows),
        phaseContext: Array.from(groupPhaseContext(group).effectiveRaw || []),
        phenomena: group.phenomena,
        dataStatus: missing.length ? "needs data" : "energy-ready skeleton",
        missing: Array.from(new Set(missing))
      };
    }

    function energyStreamSummary(rows) {
      const counts = rows.reduce((acc, row) => {
        acc[row.role] = (acc[row.role] || 0) + 1;
        return acc;
      }, {});
      const mainInputs = rows
        .filter(row => row.role === "input")
        .slice(0, 3)
        .map(row => `${row.name || row.streamId}${row.scaledQuantity ? ` ${row.scaledQuantity} ${row.scaledUnit}` : ""}`);
      return {
        counts,
        inputPreview: mainInputs,
        streamIds: rows.map(row => row.streamId)
      };
    }

    function groupHasPropertyForNeed(group, need) {
      const values = new Set(exportGroupProperties(group).filter(item => item.value || item.note).map(item => item.id));
      const text = String(need).toLowerCase();
      if (text.includes("cp")) return values.has("heat_capacity");
      if (text.includes("viscosity")) return values.has("viscosity");
      if (text.includes("density")) return values.has("density") || values.has("density_difference");
      if (text.includes("boiling point")) return values.has("boiling_point");
      if (text.includes("vapor pressure")) return values.has("vapor_pressure");
      if (text.includes("thermal limit") || text.includes("degradation")) return values.has("degradation_temperature");
      return false;
    }

    function conditionTipLines(block, blockId = "") {
      ensureBlockConditionFields(block);
      const values = conditionValuesForBlock(block);
      return values.slice(0, 6).map(item => {
        const prefix = blockId ? `[${blockId}] ` : "";
        return `- ${prefix}${item.label}: ${formatConditionValue(item)}`;
      });
    }

    function scaleSectionHtml(key, title, gridInnerHtml) {
      const expanded = Boolean(state.expandedScaleSections[key]);
      return `
        <div class="scale-section ${expanded ? "expanded" : "collapsed"}">
          <div class="scale-section-toggle-head" data-toggle-scale-section="${escapeAttr(key)}">
            <span>${escapeHtml(title)}</span>
            <span class="rule-card-chevron">${expanded ? "▾" : "▸"}</span>
          </div>
          ${expanded ? `<div class="scale-grid">${gridInnerHtml}</div>` : ""}
        </div>
      `;
    }

    function renderScaleBasisPanel() {
      const quickRoot = $("scaleQuickPanel");
      const root = $("scaleBasisPanel");
      const basis = ensureScaleBasis();
      const model = scaleModel();
      const referenceOptions = [
        `<option value="">auto from product/output</option>`,
        ...blocksInOrder().map(block => `<option value="${escapeAttr(block.id)}" ${basis.referenceBlockId === block.id ? "selected" : ""}>${escapeHtml(block.id)} - ${escapeHtml(block.behavior)}</option>`)
      ].join("");
      quickRoot.innerHTML = `
        <div class="scale-quick-grid">
          <label>
            <div class="label">Target product</div>
            <input data-scale-field="targetProduct" value="${escapeAttr(basis.targetProduct)}" placeholder="octocrylene">
          </label>
          <label>
            <div class="label">Amount</div>
            <input data-scale-field="targetAmount" value="${escapeAttr(basis.targetAmount)}" inputmode="decimal" placeholder="1000">
          </label>
          <label>
            <div class="label">Basis</div>
            <select data-scale-field="targetUnit">${optionHtml(scaleTargetUnitOptions, basis.targetUnit)}</select>
          </label>
        </div>
      `;
      const fieldLabel = (text, tip) => `<div class="label tip" data-tip="${escapeAttr(tip)}">${escapeHtml(text)}</div>`;
      const scheduleMethodOptions = [
        { value: "auto", label: "Auto (duration if available, else batches/day)" },
        { value: "duration", label: "Duration x OEE x parallel units" },
        { value: "batches_per_day", label: "Batches/day x operating days" }
      ];
      const batchesPerDayInactive = basis.scheduleMethod === "duration" || (basis.scheduleMethod === "auto" && model.schedule.method === "duration_OEE_parallel_units");
      root.innerHTML = `
        ${scaleSectionHtml("referenceBasis", "Reference basis", `
            <label class="scale-wide">
              ${fieldLabel("Reference output block", "Which existing block's output stream anchors the lab-scale recipe ratios (reactants/solvent per kg product). Leave on auto to use the block with a numeric product-like output.")}
              <select data-scale-field="referenceBlockId">${referenceOptions}</select>
            </label>
            <label>
              ${fieldLabel("Manual basis amount", "Override the reference block's own quantity for scaling ratios, without editing the block itself.")}
              <input data-scale-field="basisAmount" value="${escapeAttr(basis.basisAmount)}" inputmode="decimal" placeholder="optional">
            </label>
            <label>
              ${fieldLabel("Basis unit", "Unit for the manual basis amount above.")}
              <select data-scale-field="basisUnit">${optionHtml(["kg", "g", "t"], basis.basisUnit)}</select>
            </label>
        `)}

        ${scaleSectionHtml("operatingSchedule", "Operating schedule", `
            <label>
              ${fieldLabel("Mode", "Continuous processes skip the batches/day and batch-duration fields below.")}
              <select data-scale-field="mode">${optionHtml(["batch", "continuous"], basis.mode)}</select>
            </label>
            <label class="scale-wide">
              ${fieldLabel("Annual batches method", "Which calculation drives annual batches. Auto picks duration x OEE x parallel units whenever that data is available, otherwise falls back to batches/day. Force either method to override that automatic pick.")}
              <select data-scale-field="scheduleMethod">${scheduleMethodOptions.map(opt => `<option value="${escapeAttr(opt.value)}" ${opt.value === basis.scheduleMethod ? "selected" : ""}>${escapeHtml(opt.label)}</option>`).join("")}</select>
            </label>
            <label>
              ${fieldLabel("Batches/day", batchesPerDayInactive ? "Not used: the annual batches method above is set to (or auto-resolves to) duration x OEE x parallel units, so this field has no effect. Switch the method above to \"Batches/day x operating days\" to use it." : "Used to derive annual batches per the method selected above.")}
              <input data-scale-field="batchesPerDay" value="${escapeAttr(basis.batchesPerDay)}" inputmode="decimal" placeholder="1" ${batchesPerDayInactive ? "disabled" : ""}>
            </label>
            <label>
              ${fieldLabel("Days/year", "Used with batches/day for the batches/day method above, and to convert daily/annual targets to an hourly rate.")}
              <input data-scale-field="operatingDays" value="${escapeAttr(basis.operatingDays)}" inputmode="decimal" placeholder="250">
            </label>
            <label>
              ${fieldLabel("Hours/day", "Only used to display an hourly production rate; does not affect the batch or annual targets.")}
              <input data-scale-field="hoursPerDay" value="${escapeAttr(basis.hoursPerDay)}" inputmode="decimal" placeholder="16">
            </label>
            <label class="scale-wide">
              ${fieldLabel("Batch duration, h", "Manual override for the single-train batch cycle time. Leave blank to use the sum of task durations from the Gantt panel instead - this is the preferred, non-fallback path.")}
              <input data-scale-field="batchDuration" value="${escapeAttr(basis.batchDuration)}" inputmode="decimal" placeholder="optional">
            </label>
            <label>
              ${fieldLabel("Gantt margin, %", "Safety margin added to every task duration before computing cycle time and bottlenecks (e.g. undocumented setup/changeover time).")}
              <input data-scale-field="scheduleMarginPercent" value="${escapeAttr(basis.scheduleMarginPercent)}" inputmode="decimal" placeholder="0">
            </label>
            <label>
              ${fieldLabel("OEE, %", "Overall Equipment Effectiveness: fraction of calendar time (8760 h/year) the plant is actually producing after downtime, changeovers, and maintenance. Drives annual batch count together with batch duration and parallel units. Not the same as the equipment fill limit below, which is about size, not time.")}
              <input data-scale-field="oeePercent" value="${escapeAttr(basis.oeePercent)}" inputmode="decimal" placeholder="80">
            </label>
            <label>
              ${fieldLabel("Parallel units", "Number of identical trains running the same schedule in parallel. Multiplies the annual batch count from the duration-based method.")}
              <input data-scale-field="parallelUnits" value="${escapeAttr(basis.parallelUnits)}" inputmode="decimal" placeholder="1">
            </label>
            <label>
              ${fieldLabel("Equipment fill limit, %", "How full a single piece of equipment (e.g. reactor working volume) is allowed to run - used only to flag over-capacity tasks in the Bottleneck classification below. Distinct from OEE above, which is about time availability, not fill level.")}
              <input data-scale-field="allowableCapacityUtilizationPercent" value="${escapeAttr(basis.allowableCapacityUtilizationPercent)}" inputmode="decimal" placeholder="85">
            </label>
        `)}

        ${scaleSectionHtml("reactorSizing", "Reactor sizing / stoichiometric checks", `
            <label>
              ${fieldLabel("Product kg/batch override", "Overrides the batch size used only for the reactor-sizing check below. Does not change 'Target kg/batch' in Calculated basis, which is driven by the operating schedule instead - the two can disagree on purpose if you want to test a different reactor size.")}
              <input data-scale-field="productKgPerBatch" value="${escapeAttr(basis.productKgPerBatch)}" inputmode="decimal" placeholder="auto">
            </label>
            <label>
              ${fieldLabel("Reactants L/kg product", "Volume of reactants charged per kg of product, from the lab recipe. Scales automatically with batch size.")}
              <input data-scale-field="reactantsLoadingLPerKgProduct" value="${escapeAttr(basis.reactantsLoadingLPerKgProduct)}" inputmode="decimal" placeholder="e.g. 1.27">
            </label>
            <label>
              ${fieldLabel("Solvent L/kg product", "Volume of solvent charged per kg of product, from the lab recipe. Scales automatically with batch size.")}
              <input data-scale-field="solventLoadingLPerKgProduct" value="${escapeAttr(basis.solventLoadingLPerKgProduct)}" inputmode="decimal" placeholder="e.g. 1.51">
            </label>
            <label>
              ${fieldLabel("Working fill, %", "Standard design fill fraction for the reactor (70-80% typical for stirred batch/semi-batch vessels), leaving headspace for reflux/agitation.")}
              <input data-scale-field="reactorWorkingFillPercent" value="${escapeAttr(basis.reactorWorkingFillPercent)}" inputmode="decimal" placeholder="70">
            </label>
            <label>
              ${fieldLabel("Product MW, g/mol", "Product molecular weight, used only to estimate stoichiometric condensation water below.")}
              <input data-scale-field="productMolecularWeightGmol" value="${escapeAttr(basis.productMolecularWeightGmol)}" inputmode="decimal" placeholder="optional">
            </label>
            <label>
              ${fieldLabel("Water mol/mol product", "Moles of water released per mole of product formed, from the reaction stoichiometry.")}
              <input data-scale-field="condensationWaterMolPerMol" value="${escapeAttr(basis.condensationWaterMolPerMol)}" inputmode="decimal" placeholder="1">
            </label>
        `)}

        ${scaleSectionHtml("tracking", "Tracking", `
            <label>
              ${fieldLabel("Confidence", "How reliable the current scale-up numbers are, for your own tracking - rough (screening guess), estimated (some real data), or validated (measured/vendor-confirmed). Does not change any calculation.")}
              <select data-scale-field="confidence">${optionHtml(["rough", "estimated", "validated"], basis.confidence)}</select>
            </label>
        `)}
        ${scaleResultsHtml(model)}
      `;
      [quickRoot, root].forEach(container => {
        container.querySelectorAll("[data-scale-field]").forEach(field => {
          field.addEventListener("input", updateScaleField);
          field.addEventListener("change", rerenderScaleAfterEdit);
        });
      });
      root.querySelectorAll("[data-toggle-scale-section]").forEach(head => {
        head.addEventListener("click", () => {
          const key = head.dataset.toggleScaleSection;
          state.expandedScaleSections[key] = !state.expandedScaleSections[key];
          renderScaleBasisPanel();
        });
      });
      root.querySelectorAll("[data-schedule-scenario-view]").forEach(button => {
        button.addEventListener("click", () => {
          state.scheduleScenarioView = button.dataset.scheduleScenarioView;
          renderScaleBasisPanel();
        });
      });
      root.querySelectorAll("[data-toggle-gantt-row]").forEach(head => {
        head.addEventListener("click", () => {
          const groupId = head.dataset.toggleGanttRow;
          state.expandedGanttRows[groupId] = !state.expandedGanttRows[groupId];
          renderScaleBasisPanel();
        });
      });
      root.querySelectorAll("[data-scale-focus-group]").forEach(button => {
        button.addEventListener("click", () => focusGroupForEditing(button.dataset.scaleFocusGroup));
      });
      root.querySelectorAll("[data-add-density-basis]").forEach(button => {
        button.addEventListener("click", () => openDensityBasisEditor(button.dataset.addDensityBasis));
      });
      root.querySelectorAll("[data-schedule-field]").forEach(field => {
        field.addEventListener("input", updateGroupScheduleField);
        field.addEventListener("change", rerenderScaleAfterEdit);
      });
      root.querySelectorAll("[data-load-schedule-example]").forEach(button => {
        button.addEventListener("click", applyScheduleExample);
      });
      root.querySelectorAll("[data-split-n]").forEach(input => {
        input.addEventListener("input", () => {
          let n = Math.round(Number(input.value));
          if (!Number.isFinite(n) || n < 2) n = 2;
          if (n > 20) n = 20;
          const groupId = input.dataset.splitN;
          const baseDuration = Number(input.dataset.splitBaseDuration);
          const preview = [...root.querySelectorAll("[data-split-preview]")].find(el => el.dataset.splitPreview === groupId);
          const button = [...root.querySelectorAll("[data-split-bottleneck]")].find(el => el.dataset.splitBottleneck === groupId);
          const divideDuration = button?.dataset.splitDivideDuration === "true";
          if (preview) preview.textContent = bottleneckSplitPreviewText(baseDuration, n, divideDuration);
          if (button) button.dataset.splitCount = String(n);
        });
      });
      root.querySelectorAll("[data-split-bottleneck]").forEach(button => {
        button.addEventListener("click", async () => {
          const groupId = button.dataset.splitBottleneck;
          const n = Number(button.dataset.splitCount);
          const warn = button.dataset.splitConfirmKinetics === "true"
            ? `${groupId} is kinetics-bound: splitting will NOT reduce the per-batch reaction time, only raise throughput. `
            : "";
          const divideDuration = button.dataset.splitDivideDuration === "true";
          const durationText = divideDuration
            ? "The Gantt duration and time-like conditions are divided as a screening estimate."
            : "Per-unit durations are kept until you edit or validate sized-equipment times.";
          const ok = await confirmModal(`${warn}Split ${groupId} into ${n} parallel units? This creates ${n} new task groups (${groupId}-P1..P${n}), each with its own copy of every block in ${groupId} and 1/${n} of its material flow, wired in parallel between the same predecessor and successor. ${durationText} ${groupId} itself is removed. This can be undone.`);
          if (!ok) return;
          await splitGroupIntoParallelUnits(groupId, n, { divideDuration });
        });
      });
    }

    function focusGroupForEditing(groupId) {
      const blocks = blocksForGroup(groupId);
      if (!blocks.length) return;
      state.selectedBlockId = null;
      state.selectedGroupId = groupId;
      state.selectedIds = blocks.map(block => block.id);
      state.focusEndpoint = groupId;
      setInspectorTab("inspect");
      renderAll();
    }

    function openDensityBasisEditor(groupId) {
      const group = groupModel(groupId);
      if (!group) return;
      const groupState = ensureGroup(groupId);
      groupState.properties.density = normalizePropertyValue(groupState.properties.density, propertyPromptCatalog.find(item => item.id === "density"));
      groupState.properties.density.unit = groupState.properties.density.unit || "kg/m3";
      groupState.properties.density.status = groupState.properties.density.status === "missing" ? "assumed" : groupState.properties.density.status;
      groupState.properties.density.note = groupState.properties.density.note || "Needed for automatic reactor sizing from mass-based MFA.";
      groupState.propertiesEditing = true;
      state.selectedGroupId = groupId;
      state.selectedBlockId = null;
      state.selectedIds = group.blocks.map(block => block.id);
      state.focusEndpoint = groupId;
      setInspectorTab("inspect");
      setSourcePanelTab("board");
      renderAll();
    }
    function infoIconHtml(tip) {
      return `<span class="info-icon tip" data-tip="${escapeAttr(tip)}">ⓘ</span>`;
    }

    function compactDetailsHtml(title, bodyHtml, meta = "", open = false) {
      return `
        <details class="compact-details" ${open ? "open" : ""}>
          <summary>
            <strong>${escapeHtml(title)}</strong>
            ${meta ? `<span class="muted small">${escapeHtml(meta)}</span>` : ""}
          </summary>
          <div class="compact-details-body">${bodyHtml}</div>
        </details>
      `;
    }

    function scaleResultsHtml(model) {
      const reference = model.reference
        ? `${model.reference.blockId} / ${model.reference.streamName || model.reference.streamId}: ${model.reference.quantity} ${model.reference.unit}`
        : "No numeric output stream found yet.";
      const assessment = scaleUpAssessmentModel(model);
      const recycle = recycleSummary(model);
      const energy = energyBridgeModel(model);
      const gantt = taskScheduleModel();
      const throughput = throughputDiagnosticsModel(model, gantt);
      const metrics = [
        ["Reference", reference],
        ["Target kg/batch", model.target.kgPerBatch || "missing schedule/basis"],
        ["Target kg/year", model.target.kgPerYear || "missing annual basis"],
        ["Scale factor", model.factors.productFactor || "not available"]
      ];
      const rowGroups = scaledRowsByRole(model);
      return `
        <div class="scale-results">
          <div class="scale-metric">
            <span class="label">Calculated basis</span>
            <div class="scale-metric-grid">
              ${metrics.map(([label, value]) => `
                <div class="scale-mini-metric">
                  <span class="label">${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="scale-metric">
            <span class="label">Schedule scenarios${infoIconHtml("Conservative uses batch makespan (batches do not start before the previous batch leaves the train). Overlapped uses plant cycle time = max(task time / parallel units) - new batches can start at the limiting equipment cycle.")}</span>
            ${scheduleScenariosHtml(model.schedule)}
          </div>

          <div class="scale-metric">
            <span class="label">Reactor sizing / stoichiometric checks${infoIconHtml("Preferred path: enter reactants and solvent L/kg product from the recipe, then reactor volume = ((reactants + solvent) x product kg/batch / 1000) / working fill. If those recipe loading fields are blank, the tool tries an automatic MFA path: find the reaction/reactor group, scale its input streams to the production target, convert direct L/mL/m3 streams or mass streams with group density, then divide total charge by working fill. Water = product kg/batch x 18.015 / product MW x stoichiometric water coefficient. This is a screening minimum; real vessel selection adds design margin and rounds up to standard sizes.")}</span>
            ${reactorSizingHtml(model.reactorSizing)}
          </div>

          <div class="scale-metric">
            <div class="scale-section-title">
              <span>Gantt / Bottleneck${infoIconHtml("Critical bottleneck = largest effective task only when it is clearly above the next task. Adjusted time = input duration plus Gantt margin, divided by parallel units.")}</span>
              <button data-load-schedule-example="octocrylene" title="Overwrites every group's duration/capacity/notes with generic keyword-matched example values. Asks for confirmation first; can be undone.">Fill Example Durations</button>
            </div>
            ${gantt.ready ? ganttPanelHtml(gantt) : `<div class="mfa-empty">Add durations in group conditions or directly in the Gantt rows to estimate cycle time and bottlenecks.</div>`}
          </div>

          ${compactDetailsHtml(
            "Bottleneck classification",
            throughputDiagnosticsHtml(throughput),
            throughput.timeBottleneck ? `${throughput.timeBottleneck.groupId} time bottleneck` : "capacity and throughput checks"
          )}

          ${compactDetailsHtml(
            "Scaled MFA preview",
            rowGroups.length ? rowGroups.map(group => `
              <div class="scale-section">
                <div class="scale-section-title">${escapeHtml(streamRoles[group.role].title)}</div>
                ${group.rows.slice(0, 3).map(row => scaledFlowRowHtml(row)).join("")}
                ${group.rows.length > 3 ? `<span class="muted small">+${group.rows.length - 3} more streams in export</span>` : ""}
              </div>
            `).join("") : `<div class="mfa-empty">Add stream quantities to preview scaled MFA.</div>`,
            rowGroups.length ? `${rowGroups.reduce((sum, group) => sum + group.rows.length, 0)} streams` : "empty"
          )}

          ${compactDetailsHtml(
            "Scale-up assessment",
            `
            ${assessment.length ? assessment.slice(0, 8).map(scaleAssessmentCardHtml).join("") : `<div class="mfa-empty">Add grouped phenomena, streams, and conditions to generate scale-up risk cards.</div>`}
            ${assessment.length > 8 ? `<span class="muted small">+${assessment.length - 8} more assessment cards in export</span>` : ""}
            `,
            assessment.length ? `${assessment.length} cards` : "no risk cards"
          )}

          ${compactDetailsHtml(
            "Recycle / fate summary",
            `
            ${recycle.fates.length ? recycle.fates.slice(0, 5).map(item => `<div class="scaled-flow-row"><strong>${escapeHtml(item.fate)}</strong><span>${item.count} stream${item.count === 1 ? "" : "s"}</span></div>`).join("") : `<div class="mfa-empty">No stream fate data yet.</div>`}
            ${recycle.closures.length ? `
              <div class="event-label-group">
                <div class="event-label-head">
                  <strong>Recycle closure</strong>
                  <span class="pill">${recycle.closures.length}</span>
                </div>
                <div class="event-chip-grid">
                  ${recycle.closures.slice(0, 4).map(recycleClosureHtml).join("")}
                </div>
                ${recycle.closures.length > 4 ? `<span class="muted small">+${recycle.closures.length - 4} more closure rows in export</span>` : ""}
              </div>
            ` : ""}
            ${recycle.warnings.length ? `<span class="pill warn">${recycle.warnings.length} recycle warning${recycle.warnings.length === 1 ? "" : "s"}</span>` : ""}
            `,
            recycle.closures.length ? `${recycle.closures.length} closure rows` : `${recycle.fates.length} fate classes`
          )}
          ${compactDetailsHtml(
            "Energy bridge candidates",
            energy.length ? energyBridgeGroupsHtml(energy) : `<div class="mfa-empty">Assign thermal, mixing, pressure, or phase-change phenomena to generate energy bridge events.</div>`,
            energy.length ? `${energy.length} events` : "empty"
          )}
        </div>
      `;
    }

    function scheduleScenariosHtml(schedule) {
      const row = (label, makespan, batches, kgYear, note) => `
        <div class="scaled-flow-row">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(makespan || "missing")} h</span>
          <span>${escapeHtml(batches || "missing")} batches/year</span>
          <span>${escapeHtml(kgYear || "missing")} kg/year</span>
          <span class="muted small">${escapeHtml(note)}</span>
        </div>
      `;
      const view = state.scheduleScenarioView === "overlapped" ? "overlapped" : "conservative";
      const activeRow = view === "overlapped"
        ? row("Overlapped train", schedule.plantCycleTimeH, schedule.overlappedBatchesPerYear, schedule.overlappedKgPerYear, "new batches can start at the limiting equipment cycle")
        : row("Conservative single-train", schedule.batchMakespanH, schedule.conservativeBatchesPerYear, schedule.conservativeKgPerYear, "batches do not start before the previous batch leaves the train");
      return `
        <div class="schedule-scenario-toggle">
          <button class="mini-button ${view === "conservative" ? "chosen" : ""}" data-schedule-scenario-view="conservative">Conservative</button>
          <button class="mini-button ${view === "overlapped" ? "chosen" : ""}" data-schedule-scenario-view="overlapped">Overlapped</button>
        </div>
        ${activeRow}
      `;
    }

    function reactorSizingHtml(sizing) {
      if (!sizing || !sizing.ready) {
        return `<div class="mfa-empty">Add product kg/batch, reactants volume, solvent loading, working fill, and product MW to reproduce reactor size and stoichiometric water checks.</div>`;
      }
      const rows = [
        ["Product basis", sizing.productBatchKg ? `${sizing.productBatchKg} kg/batch` : "missing"],
        ["Reactants volume", sizing.reactantsVolumeM3 ? `${sizing.reactantsVolumeM3} m3` : "missing"],
        ["Solvent volume", sizing.solventVolumeM3 ? `${sizing.solventVolumeM3} m3` : "missing"],
        ["Total charge", sizing.totalChargeM3 ? `${sizing.totalChargeM3} m3` : "missing"],
        ["Working fill", sizing.workingFillPercent ? `${sizing.workingFillPercent}%` : "missing"],
        ["Required reactor volume", sizing.reactorVolumeM3 ? `${sizing.reactorVolumeM3} m3` : "missing"],
        ["Condensation water", sizing.generatedWaterKg ? `${sizing.generatedWaterKg} kg/batch` : "missing"]
      ];
      return `
        <div class="mfa-empty ${sizing.autoReady ? "ok" : ""}" style="margin-bottom:6px">
          Reactor sizing source: ${escapeHtml(sizing.source || "missing")}${sizing.autoGroupId ? ` (${escapeHtml(sizing.autoGroupId)})` : ""}.
          ${sizing.autoGroupId && (sizing.missing || []).some(item => /density/i.test(item)) ? `<button class="mini-button scale-inline-action" data-add-density-basis="${escapeAttr(sizing.autoGroupId)}">Add Density Basis</button>` : ""}
        </div>
        <div class="scale-metric-grid">
          ${rows.map(([label, value]) => `
            <div class="scale-mini-metric">
              <span class="label">${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>
        ${sizing.missing?.length ? `<span class="muted small">Missing for full check: ${escapeHtml(sizing.missing.join(", "))}</span>` : ""}
      `;
    }

    function throughputDiagnosticsHtml(model) {
      const time = model.timeBottleneck;
      const size = model.sizeBottleneck;
      const throughput = model.throughputBottleneck;
      const named = item => item ? `${item.groupId} - ${item.task || ""}` : "missing";
      const value = (item, kind) => {
        if (!item) return "missing";
        if (kind === "time") return Number.isFinite(item.effectiveTimeH) ? `${formatNumber(item.effectiveTimeH)} h effective` : "missing";
        if (kind === "size") return Number.isFinite(item.utilizationPercent) ? `${formatNumber(item.utilizationPercent)}% utilization` : "capacity data missing";
        if (kind === "throughput") return Number.isFinite(item.combinedScore) ? `${formatNumber(item.combinedScore * 100)} score` : "capacity data missing";
        return "";
      };
      const capacityRows = model.rows.filter(row => row.capacityAmount || row.capacityUnit);
      return `
        <div class="scale-metric-grid">
          <div class="scale-mini-metric">
            <span class="label">Time bottleneck</span>
            <strong>${escapeHtml(named(time))}</strong>
            <span class="muted small">${escapeHtml(value(time, "time"))}</span>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Size bottleneck</span>
            <strong>${escapeHtml(named(size))}</strong>
            <span class="muted small">${escapeHtml(value(size, "size"))}; limit ${escapeHtml(formatNumber(model.allowableCapacityUtilizationPercent))}%</span>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Throughput bottleneck</span>
            <strong>${escapeHtml(named(throughput))}</strong>
            <span class="muted small">${escapeHtml(value(throughput, "throughput"))}</span>
          </div>
        </div>
        ${capacityRows.length ? `
          <div class="scale-section">
            <div class="scale-section-title">Capacity checks</div>
            ${capacityRows.map(row => `
              <div class="scaled-flow-row">
                <strong>${escapeHtml(row.groupId)}</strong>
                <span>${Number.isFinite(row.actualValue) ? `${formatNumber(row.actualValue)} ${escapeHtml(row.actualUnit)}` : "actual missing"}</span>
                <span>${escapeHtml(row.capacityAmount || "capacity missing")} ${escapeHtml(row.capacityUnit || "")}</span>
                <span>${Number.isFinite(row.utilizationPercent) ? `${formatNumber(row.utilizationPercent)}%` : "not calculated"}</span>
                <span class="muted small">${escapeHtml(row.actualSource || "capacity basis missing")}${row.actualMissing?.length ? `; missing ${escapeHtml(row.actualMissing.join(", "))}` : ""}</span>
              </div>
            `).join("")}
          </div>
        ` : `<div class="mfa-empty">Add optional equipment capacity in Gantt rows to calculate size and throughput bottlenecks.</div>`}
      `;
    }

    function energyBridgeGroupsHtml(events) {
      const byType = new Map();
      events.forEach(event => {
        if (!byType.has(event.eventType)) byType.set(event.eventType, []);
        byType.get(event.eventType).push(event);
      });
      return Array.from(byType.entries()).map(([type, items]) => `
        <div class="event-label-group">
          <div class="event-label-head">
            <strong>${escapeHtml(type)}</strong>
            <span class="pill">${items.length} group${items.length === 1 ? "" : "s"}</span>
          </div>
          <div class="event-chip-grid">
            ${items.map(energyBridgeRowHtml).join("")}
          </div>
        </div>
      `).join("");
    }

    function heuristicRulesPanelHtml(heuristics) {
      const refine = state.aiRefine;
      return `
        <div class="scale-results">
          <div class="scale-metric">
            <span class="label">Heuristic Rules</span>
            <div class="scaled-flow-row">
              <strong>${heuristics.triggered.length} triggered / ${heuristics.totalRules} available</strong>
              <span>Matched from phenomena, phases, fates, conditions, properties, and source text.</span>
            </div>
            ${compactDetailsHtml(
              "Application criterion",
              `<div class="scaled-flow-row">
                <span>A rule appears when the match is specific enough: usually at least two rule tags, or one strong specific tag such as vacuum, recycle, purge, exotherm, crystallization, membrane, hazard, or heat sensitivity.</span>
                <span class="muted small">Generic single tags such as vapor, liquid, utility, pressure, or heat exchange are not enough by themselves.</span>
              </div>`,
              "why rules appear"
            )}
            <div class="heuristic-actions">
              <button data-toggle-heuristic-library="true">${state.showAllHeuristicRules ? "Hide full library" : `Show all ${heuristics.totalRules} rules`}</button>
              <button data-open-refine-modal="true" class="primary">Open Process Rule Check</button>
            </div>
          </div>
          ${compactDetailsHtml(
            "Process Rule Check",
            refine ? aiRefinePanelHtml(refine) : `<div class="mfa-empty">Rules have not been applied to the process yet. This uses the local checker; external AI is optional.</div>`,
            refine ? refine.topSeverity : "not run",
            Boolean(refine)
          )}
          <div class="scale-metric">
            <span class="label">Triggered Rule Cards</span>
            ${heuristics.triggered.length ? heuristics.triggered.map(heuristicCardHtml).join("") : `<div class="mfa-empty">Add grouped phenomena, streams, phases, and conditions to activate heuristic rules.</div>`}
          </div>
          ${state.showAllHeuristicRules ? `
            <div class="scale-metric">
              <span class="label">Full Heuristic Library</span>
              <div class="heuristic-library-grid">
                ${heuristics.library.map(rule => heuristicLibraryCardHtml(rule, heuristics.triggered.some(item => item.id === rule.id))).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }

    function renderHeuristicsPanel() {
      const root = $("heuristicsPanel");
      if (!root) return;
      root.innerHTML = heuristicRulesPanelHtml(heuristicReviewModel());
      root.querySelectorAll("[data-toggle-heuristic-library]").forEach(button => {
        button.addEventListener("click", () => {
          state.showAllHeuristicRules = !state.showAllHeuristicRules;
          renderHeuristicsPanel();
        });
      });
      root.querySelectorAll("[data-open-refine-modal]").forEach(button => {
        button.addEventListener("click", openAiRefineModal);
      });
      root.querySelectorAll("[data-toggle-heuristic-card]").forEach(head => {
        head.addEventListener("click", () => {
          const ruleId = head.dataset.toggleHeuristicCard;
          state.expandedHeuristicRuleIds[ruleId] = !state.expandedHeuristicRuleIds[ruleId];
          renderHeuristicsPanel();
        });
      });
      root.querySelectorAll("[data-heuristic-decision]").forEach(button => {
        button.addEventListener("click", () => {
          const ruleId = button.dataset.heuristicRule;
          const decision = button.dataset.heuristicDecision;
          const existing = state.heuristicDecisions[ruleId] || {};
          state.heuristicDecisions[ruleId] = {
            ...existing,
            decision: existing.decision === decision ? "" : decision,
            decidedAt: new Date().toISOString()
          };
          // Collapse the card back to a one-line summary once it has a decision, so the list
          // stays scannable as rules get worked through - re-expand to change/add a note.
          if (state.heuristicDecisions[ruleId].decision) state.expandedHeuristicRuleIds[ruleId] = false;
          renderHeuristicsPanel();
          renderWorkflowStepper();
        });
      });
      root.querySelectorAll("[data-heuristic-note]").forEach(input => {
        input.addEventListener("change", () => {
          const ruleId = input.dataset.heuristicNote;
          const existing = state.heuristicDecisions[ruleId] || {};
          state.heuristicDecisions[ruleId] = { ...existing, note: input.value.trim() };
        });
      });
    }

    function refreshReviewPanels() {
      const root = $("heuristicRuleCheckPanel");
      if (!root) return;
      const issues = state.ruleChecks || [];
      root.innerHTML = issues.length
        ? ruleCheckCardsHtml(issues)
        : `<div class="mfa-empty">Apply heuristic rules to the current process to generate pre-scale conflicts.</div>`;
    }

    function ruleCheckCardsHtml(issues) {
      return issues.map(issue => `
        <article class="rule-card ${escapeAttr(issue.severity)}">
          <span class="severity-pill">${escapeHtml(issue.severity)}</span>
          <strong>${escapeHtml(issue.title)}</strong>
          <span>${escapeHtml(issue.reason)}</span>
          <span class="muted small">Target: ${escapeHtml(issue.target)}. Suggested action: ${escapeHtml(issue.action)}</span>
        </article>
      `).join("");
    }

    function aiRefinePanelHtml(refine) {
      return `
        <div class="rule-card ${escapeAttr(refine.topSeverity)}" style="margin:8px 0">
          <span class="severity-pill">${escapeHtml(refine.topSeverity)}</span>
          <strong>${escapeHtml(refine.summary)}</strong>
          <span>${escapeHtml(refine.mode)}</span>
          ${refine.scope ? `<span class="muted small">Scopes: ${escapeHtml(refine.scope)}</span>` : ""}
          ${refine.conflicts.length
            ? refine.conflicts.slice(0, 5).map(item => `<span class="muted small">${escapeHtml(item.severity.toUpperCase())}: ${escapeHtml(item.title)} -> ${escapeHtml(item.action)}</span>`).join("")
            : `<span class="muted small">No high-priority conflicts detected from the current rule set.</span>`}
          ${refine.conflicts.length > 5 ? `<span class="muted small">+${refine.conflicts.length - 5} more conflicts in Review Results / export.</span>` : ""}
        </div>
      `;
    }

    function heuristicLibraryCardHtml(rule, active) {
      return `
        <article class="rule-card ${active ? escapeAttr(rule.severity) : "low"}">
          <span class="severity-pill">${active ? "active" : "library"}</span>
          <strong>${escapeHtml(`${rule.id} - ${rule.title}`)}</strong>
          <span>${escapeHtml(rule.recommendation)}</span>
          <span class="muted small">Area: ${escapeHtml(rule.area)}. Tags: ${escapeHtml(rule.tags.join(", "))}.</span>
        </article>
      `;
    }

    function scaleAssessmentCardHtml(item) {
      return `
        <div class="rule-card ${escapeAttr(item.severity)}">
          <span class="severity-pill">${escapeHtml(item.severity)}</span>
          <strong>${escapeHtml(item.groupId ? `${item.groupId} - ${item.title}` : item.title)}</strong>
          <span>${escapeHtml(item.recommendation)}</span>
          ${item.missing.length ? `<span class="muted small">Missing/check: ${escapeHtml(item.missing.slice(0, 4).join(", "))}</span>` : `<span class="muted small">No immediate missing fields for this level.</span>`}
        </div>
      `;
    }

    function ganttPanelHtml(gantt) {
      const bottleneckLabel = gantt.bottleneck
        ? gantt.bottleneck.groupId
        : gantt.bottleneckStatus === "balanced"
          ? "balanced"
          : "missing";
      const gapText = Number.isFinite(gantt.bottleneckGapH) && Number.isFinite(gantt.bottleneckGapPercent)
        ? `Gap to next task: ${formatNumber(gantt.bottleneckGapH)} h / ${formatNumber(gantt.bottleneckGapPercent)}%. Critical threshold: >=${formatNumber(bottleneckThresholds.minGapH)} h and >=${formatNumber(bottleneckThresholds.minGapPercent)}%.`
        : `Critical threshold: >=${formatNumber(bottleneckThresholds.minGapH)} h and >=${formatNumber(bottleneckThresholds.minGapPercent)}% above the next longest task.`;
      return `
        <div class="muted small" style="margin-bottom:8px">${escapeHtml(gapText)}</div>
        <div class="gantt-summary">
          <div class="scale-mini-metric">
            <span class="label">Gantt makespan</span>
            <strong>${Number.isFinite(gantt.estimatedCycleTimeH) ? `${formatNumber(gantt.estimatedCycleTimeH)} h` : "missing"}</strong>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Plant cycle</span>
            <strong>${Number.isFinite(gantt.plantCycleTimeH) ? `${formatNumber(gantt.plantCycleTimeH)} h` : "missing"}</strong>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Batches/year</span>
            <strong>${Number.isFinite(gantt.batchesPerYear) ? formatNumber(gantt.batchesPerYear) : "missing"}</strong>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Bottleneck</span>
            <strong>${escapeHtml(bottleneckLabel)}</strong>
          </div>
        </div>
        ${gantt.bottleneck ? bottleneckActionHtml(gantt.bottleneck) : balancedGanttActionHtml(gantt)}
        <div class="scale-results">
          ${gantt.tasks.map(ganttRowHtml).join("")}
        </div>
      `;
    }

    function balancedGanttActionHtml(gantt) {
      if (gantt.bottleneckStatus !== "balanced" || !gantt.bottleneckCandidate) return "";
      return `
        <div class="rule-card low" style="margin:8px 0">
          <span class="severity-pill">balanced</span>
          <strong>No critical bottleneck detected</strong>
          <span>${escapeHtml(gantt.bottleneckCandidate.groupId)} is currently the longest task, but it is too close to the next task to flag as a critical bottleneck.</span>
          <span class="muted small">Use this state as a rough balanced schedule. Split only if you have equipment/capacity evidence, not just because one bar is slightly longer.</span>
        </div>
      `;
    }

    function bottleneckSplitPreviewText(baseDuration, n, divideDuration = false) {
      if (!Number.isFinite(baseDuration) || baseDuration <= 0 || !Number.isFinite(n) || n < 2) return "";
      if (divideDuration) return `Screening estimate: first parallel lane counts about ${formatNumber(baseDuration / n)} h in the Gantt; each unit handles 1/${n} of material flow.`;
      return `Each unit keeps about ${formatNumber(baseDuration)} h unless you edit the sized-equipment duration; material load is split to 1/${n} per unit.`;
    }

    function bottleneckActionHtml(task) {
      const effective = Number.isFinite(task.effectiveTimeH) ? `${formatNumber(task.effectiveTimeH)} h` : "missing";
      const split = Number.isFinite(task.durationH) && task.durationH > 0
        ? `${formatNumber(task.adjustedDurationH || task.durationH)} h adjusted / ${formatNumber(task.parallelUnits)} unit${task.parallelUnits === 1 ? "" : "s"} = ${effective}`
        : effective;
      const baseDuration = Number.isFinite(task.adjustedDurationH) && task.adjustedDurationH > 0 ? task.adjustedDurationH : NaN;
      const baseParallel = Number.isFinite(task.parallelUnits) && task.parallelUnits > 0 ? task.parallelUnits : 1;
      const defaultN = Math.max(2, Math.ceil(baseParallel + 1));
      const isKineticsBound = task.scaleSensitivity === "kinetics-bound";
      const recommendation = isKineticsBound
        ? "Reaction time is set by kinetics, not reactor size or count: for an ideal, well-mixed, constant-volume batch, conversion vs. time is independent of scale, so parallel/larger reactors add throughput, not speed. Change the chemistry (temperature, catalyst, concentration) or operating mode to actually shorten this stage."
        : task.scaleSensitivity === "increases with scale" || task.scaleSensitivity === "equipment dependent"
          ? "Check equipment capacity, then test more parallel units or split the grouped task."
          : "Test one more parallel unit, or mark overlap only if the operation can physically run in parallel with the previous one.";
      const splitDividesDuration = !isKineticsBound;
      const canSplit = Number.isFinite(baseDuration);
      const pickerHtml = canSplit ? `
        <div class="bottleneck-split-picker">
          <label class="split-n-label">
            Split into
            <input type="number" min="2" max="20" step="1" value="${defaultN}" data-split-n="${escapeAttr(task.groupId)}" data-split-base-duration="${baseDuration}">
            parallel units
          </label>
          <span class="muted small" data-split-preview="${escapeAttr(task.groupId)}">${escapeHtml(bottleneckSplitPreviewText(baseDuration, defaultN, splitDividesDuration))}</span>
        </div>
      ` : "";
      const splitButton = canSplit ? (
        isKineticsBound ? `
          <div class="bottleneck-split-warning">
            <span class="muted small">Kinetics-bound: reaction time is kept fixed here and won't be divided. Splitting still adds throughput (1/${defaultN} material per unit) if more capacity is what you need.</span>
            ${pickerHtml}
            <button data-split-bottleneck="${escapeAttr(task.groupId)}" data-split-count="${defaultN}" data-split-divide-duration="false" class="mini-button">Split for throughput only</button>
          </div>
        ` : `
          <div class="bottleneck-split-controls">
            ${pickerHtml}
            <button data-split-bottleneck="${escapeAttr(task.groupId)}" data-split-count="${defaultN}" data-split-divide-duration="${splitDividesDuration ? "true" : "false"}" class="primary">Split ${escapeHtml(task.groupId)}</button>
          </div>
        `
      ) : "";
      return `
        <div class="rule-card medium" style="margin:8px 0">
          <span class="severity-pill">bottleneck</span>
          <strong>${escapeHtml(task.groupId)} controls the cycle time</strong>
          <span>${escapeHtml(split)}</span>
          <span class="muted small">${escapeHtml(recommendation)}</span>
          ${splitButton}
        </div>
      `;
    }

    function ganttRowHtml(task) {
      const duration = Number.isFinite(task.durationH) ? `${formatNumber(task.durationH)} h` : "missing duration";
      const adjusted = Number.isFinite(task.adjustedDurationH) && Math.abs(task.adjustedDurationH - task.durationH) > 0.0001
        ? `; adjusted ${formatNumber(task.adjustedDurationH)} h with ${formatNumber(task.scheduleMarginPercent)}% margin`
        : "";
      const effective = Number.isFinite(task.effectiveTimeH) ? `${formatNumber(task.effectiveTimeH)} h effective` : "not scheduled";
      const profile = task.operationProfile || operationScaleProfile(task.operationClass);
      const missing = task.missingScaleData || [];
      const scaleNote = missing.length
        ? `Needs: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`
        : "Core screening data present";
      const expanded = Boolean(state.expandedGanttRows[task.groupId]);
      const showDensityBasis = ["m3", "L"].includes(task.capacityUnit) || /reactor|vessel|tank|batch|semi-batch/i.test(`${task.selectedUnit} ${task.task}`);
      const densityButton = showDensityBasis
        ? `<button class="mini-button scale-density-button" data-add-density-basis="${escapeAttr(task.groupId)}">${propertyHasValue(groupModel(task.groupId) || ensureGroup(task.groupId), "density") ? "Edit Density Basis" : "Add Density Basis"}</button>`
        : "";
      return `
        <div class="gantt-row ${task.isBottleneck ? "bottleneck" : ""} ${expanded ? "expanded" : "collapsed"}">
          <div class="gantt-row-head" data-toggle-gantt-row="${escapeAttr(task.groupId)}">
            <div class="gantt-task-meta">
              <strong>${escapeHtml(task.groupId)} - ${escapeHtml(task.task)}</strong>
              <span>${escapeHtml(task.blocks.join(", "))}${task.selectedUnit ? ` / ${escapeHtml(task.selectedUnit)}` : ""}</span>
              <span class="muted small">${escapeHtml(duration)}${escapeHtml(adjusted)}; ${escapeHtml(effective)}; source: ${escapeHtml(task.durationSource)}</span>
              ${task.isBottleneck ? `<span class="pill warn">bottleneck</span>` : ""}
              ${scaleSensitivityBadgeHtml(task.scaleSensitivity)}
            </div>
            <div class="gantt-row-bar-col">
              <div class="gantt-bar-track" title="${escapeAttr(effective)}">
                <div class="gantt-bar" style="width:${task.widthPercent}%"></div>
              </div>
              <span class="rule-card-chevron">${expanded ? "▾" : "▸"}</span>
            </div>
          </div>
          ${expanded ? `
            <div>
              <div class="gantt-controls">
                <label><span>Duration h</span><input data-schedule-field="durationH" data-schedule-group="${escapeAttr(task.groupId)}" value="${escapeAttr(task.durationInput)}" placeholder="${Number.isFinite(task.durationH) ? formatNumber(task.durationH) : "h"}" title="Task duration in hours"></label>
                <label><span>Parallel</span><input data-schedule-field="parallelUnits" data-schedule-group="${escapeAttr(task.groupId)}" value="${escapeAttr(task.parallelUnits)}" placeholder="1" title="Parallel units"></label>
                <label><span>Capacity</span><input data-schedule-field="capacityAmount" data-schedule-group="${escapeAttr(task.groupId)}" value="${escapeAttr(task.capacityAmount)}" placeholder="optional" title="Optional equipment capacity for size bottleneck checks"></label>
                <label><span>Capacity unit</span><select data-schedule-field="capacityUnit" data-schedule-group="${escapeAttr(task.groupId)}" title="Optional capacity unit for size bottleneck checks">${optionHtml(capacityUnitOptions.filter(Boolean), task.capacityUnit || suggestedCapacityUnitForGroup(groupModel(task.groupId) || ensureGroup(task.groupId)))}</select></label>
                <label><span>Time vs. scale</span><select data-schedule-field="scaleSensitivity" data-schedule-group="${escapeAttr(task.groupId)}" title="How this task's time behaves with scale. Set to kinetics-bound if a heat/cool holding step is actually where a reaction runs - its Gantt time is then never divided by parallel units.">${scaleSensitivityOptionHtml(task.scaleSensitivity)}</select></label>
              </div>
              <div class="gantt-scale-note">
                <strong>${escapeHtml(profile.label)}</strong>
                <span class="pill ${profile.badge === "high" || profile.badge === "medium-high" ? "warn" : profile.badge === "low" ? "green" : "blue"}">${escapeHtml(profile.badge)} sensitivity</span>
                <span class="muted small">${escapeHtml(scaleNote)}</span>
                ${densityButton}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }

    function heuristicCardHtml(item) {
      const decision = state.heuristicDecisions?.[item.id] || {};
      const chosen = decision.decision || "";
      const expanded = Boolean(state.expandedHeuristicRuleIds[item.id]);
      const appliesTo = item.groupIds?.length ? `Applies to: ${item.groupIds.join(", ")}` : "Applies to: whole process";
      const decisionButton = (value, label) => `
        <button class="mini-button heuristic-decision-button ${chosen === value ? "chosen" : ""}" data-heuristic-decision="${escapeAttr(value)}" data-heuristic-rule="${escapeAttr(item.id)}">${label}</button>
      `;
      return `
        <div class="rule-card ${escapeAttr(item.severity)} ${chosen ? `decided-${escapeAttr(chosen)}` : ""} ${expanded ? "expanded" : "collapsed"}">
          <div class="rule-card-head" data-toggle-heuristic-card="${escapeAttr(item.id)}">
            <span class="severity-pill">${escapeHtml(item.severity)}</span>
            <strong>${escapeHtml(`${item.id} - ${item.title}`)}</strong>
            <span class="muted small rule-card-applies">${escapeHtml(appliesTo)}</span>
            ${chosen
              ? `<span class="pill ${chosen === "accepted" ? "green" : chosen === "rejected" ? "warn" : "blue"}">${escapeHtml(chosen)}</span>`
              : `<span class="pill warn">undecided</span>`}
            <span class="rule-card-chevron">${expanded ? "▾" : "▸"}</span>
          </div>
          ${expanded ? `
            <span>${escapeHtml(item.recommendation)}</span>
            <span class="muted small">Evidence: ${escapeHtml(item.evidence)}. Confidence: ${escapeHtml(item.confidence)}.</span>
            <div class="heuristic-decision-row">
              ${decisionButton("accepted", "Accept")}
              ${decisionButton("rejected", "Reject")}
              ${decisionButton("overridden", "Override")}
              <input type="text" class="heuristic-decision-note" data-heuristic-note="${escapeAttr(item.id)}"
                placeholder="why / what was done instead" value="${escapeAttr(decision.note || "")}">
            </div>
            ${chosen ? `<span class="muted small">Decision: ${escapeHtml(chosen)}${decision.note ? ` — ${escapeHtml(decision.note)}` : ""}</span>` : `<span class="muted small heuristic-undecided">Undecided — record accept/reject/override for traceability.</span>`}
          ` : ""}
        </div>
      `;
    }

    function energyBridgeRowHtml(item) {
      const mass = item.massBasis.value ? `${item.massBasis.value} ${item.massBasis.unit}` : "mass missing";
      const cpHint = item.missing.includes("Cp")
        ? `<span class="muted small">Cp goes in Phenomena/Group > Properties Refinement > Heat capacity Cp.</span>`
        : "";
      return `
        <div class="scaled-flow-row">
          <strong>${escapeHtml(item.groupId)} - ${escapeHtml(item.eventType)}</strong>
          <span>${escapeHtml(mass)}${item.targetTemperature ? `, target ${escapeHtml(item.targetTemperature)}` : ""}${item.duration ? `, ${escapeHtml(item.duration)}` : ""}</span>
          ${item.streamSummary?.inputPreview?.length ? `<span class="muted small">Inputs: ${escapeHtml(item.streamSummary.inputPreview.join("; "))}</span>` : ""}
          ${item.missing.length ? `<span class="muted small">Missing: ${escapeHtml(item.missing.slice(0, 3).join(", "))}</span>` : `<span class="muted small">Energy-ready skeleton</span>`}
          ${cpHint}
          <button class="event-edit-button" data-scale-focus-group="${escapeAttr(item.groupId)}">Edit data</button>
        </div>
      `;
    }

    function scaledFlowRowHtml(row) {
      const scaled = row.scaledQuantity ? `${row.scaledQuantity} ${row.scaledUnit}` : "not scaled";
      return `
        <div class="scaled-flow-row">
          <strong>${escapeHtml(row.name || "untitled stream")}</strong>
          <span>${escapeHtml(row.blockId)} - ${escapeHtml(row.baseQuantity || "missing")} ${escapeHtml(row.baseUnit || "")} -> ${escapeHtml(scaled)}</span>
          <span class="muted small">${escapeHtml(row.role)}, ${escapeHtml(row.timing)}, ${escapeHtml(phaseLabel(row.phase))}</span>
        </div>
      `;
    }

    function recycleClosureHtml(item) {
      const title = item.name || item.streamId;
      const gross = item.gross ? `${item.gross} ${item.unit}` : "gross missing";
      const recovered = item.recovered ? `recovered ${item.recovered} ${item.unit}` : "";
      const makeup = item.makeup ? `make-up/loss ${item.makeup} ${item.unit}` : "";
      const purge = item.purge ? `purge ${item.purge} ${item.unit}` : "";
      return `
        <div class="scaled-flow-row">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(gross)}</span>
          <span class="muted small">${escapeHtml([recovered, makeup, purge].filter(Boolean).join("; ") || item.status)}</span>
        </div>
      `;
    }

    function updateScaleField(event) {
      ensureScaleBasis();
      invalidateAiRefine();
      state.scaleBasis[event.target.dataset.scaleField] = event.target.value;
      renderExport();
    }

    function updateGroupScheduleField(event) {
      const group = ensureGroup(event.target.dataset.scheduleGroup);
      invalidateAiRefine();
      group.schedule[event.target.dataset.scheduleField] = event.target.value;
      if (event.target.dataset.scheduleField === "capacityAmount" && String(event.target.value || "").trim() && !group.schedule.capacityUnit) {
        group.schedule.capacityUnit = suggestedCapacityUnitForGroup(groupModel(group.id) || group);
      }
      renderExport();
    }

    function rerenderScaleAfterEdit(event) {
      invalidateAiRefine();
      if (event.target.dataset.scaleField) {
        ensureScaleBasis();
        state.scaleBasis[event.target.dataset.scaleField] = event.target.value;
      }
      if (event.target.dataset.scheduleField) {
        const group = ensureGroup(event.target.dataset.scheduleGroup);
        group.schedule[event.target.dataset.scheduleField] = event.target.value;
        if (event.target.dataset.scheduleField === "capacityAmount" && String(event.target.value || "").trim() && !group.schedule.capacityUnit) {
          group.schedule.capacityUnit = suggestedCapacityUnitForGroup(groupModel(group.id) || group);
        }
      }
      renderScaleBasisPanel();
      renderHeuristicsPanel();
      refreshReviewPanels();
      renderExport();
    }

    function invalidateAiRefine() {
      state.aiRefine = null;
    }

    async function applyScheduleExample() {
      if (!(await confirmModal("Fill every task group's duration, capacity, and schedule notes with generic keyword-matched example values? This overwrites the current per-group schedule data (including anything sourced from a real case study) with approximate placeholders. This can be undone."))) return;
      pushUndo();
      const groups = groupIdsInTextOrder().map(groupModel);
      const fallback = [
        { durationH: "0.5", operationClass: "pumping_transfer", scaleSensitivity: "roughly constant", capacityAmount: "", capacityUnit: "", notes: "charge/pre-mix" },
        { durationH: "20", operationClass: "reaction_kinetic", scaleSensitivity: "kinetics-bound", capacityAmount: "15", capacityUnit: "m3", notes: "Knoevenagel reflux/decanter, primary bottleneck" },
        { durationH: "2.5", operationClass: "pumping_transfer", scaleSensitivity: "roughly constant", capacityAmount: "", capacityUnit: "", notes: "aqueous/brine wash" },
        { durationH: "1", operationClass: "drying", scaleSensitivity: "increases with scale", capacityAmount: "", capacityUnit: "", notes: "drying/contact step" },
        { durationH: "4", operationClass: "heating_cooling", scaleSensitivity: "equipment dependent", capacityAmount: "", capacityUnit: "", notes: "solvent removal or final distillation" }
      ];
      groups.forEach((group, index) => {
        const text = `${group.task} ${group.text} ${group.selectedUnit || ""}`.toLowerCase();
        let preset = fallback[Math.min(index, fallback.length - 1)];
        if (/knoevenagel|reaction|reflux|dean/.test(text)) preset = fallback[1];
        else if (/wash|brine|aqueous|settler/.test(text)) preset = fallback[2];
        else if (/dry|sieve|mgso4|na2so4/.test(text)) preset = fallback[3];
        else if (/distill|solvent|evapor|purif|vacuum/.test(text)) preset = fallback[4];
        else if (/charge|feed|mix|prepar/.test(text)) preset = fallback[0];
        const stateGroup = ensureGroup(group.id);
        stateGroup.schedule = {
          ...stateGroup.schedule,
          durationH: preset.durationH,
          parallelUnits: "1",
          canOverlap: "no",
          capacityAmount: preset.capacityAmount,
          capacityUnit: preset.capacityUnit,
          operationClass: preset.operationClass,
          scaleSensitivity: preset.scaleSensitivity,
          // Flagged as a keyword-matched guess, not sourced data: without this prefix the note reads
          // identically to the paper-cited notes in the real sample (e.g. G2's "(paper U2)" citations),
          // and a user inspecting the export later has no way to tell an approximate fill from real data.
          notes: `Example fill (approximate, keyword-matched, not sourced) — ${preset.notes}`
        };
      });
      ensureScaleBasis();
      state.scaleBasis.targetAmount = "750";
      state.scaleBasis.targetUnit = "t/year";
      state.scaleBasis.oeePercent = "80";
      state.scaleBasis.scheduleMarginPercent = "0";
      state.scaleBasis.batchDuration = "";
      state.scaleBasis.allowableCapacityUtilizationPercent = "85";
      state.scaleBasis.reactantsLoadingLPerKgProduct = "1.067";
      state.scaleBasis.solventLoadingLPerKgProduct = "2.5";
      state.scaleBasis.reactorWorkingFillPercent = "70";
      state.scaleBasis.productMolecularWeightGmol = "361.5";
      state.scaleBasis.condensationWaterMolPerMol = "1";
      renderScaleBasisPanel();
      renderHeuristicsPanel();
      refreshReviewPanels();
      renderExport();
    }

    function runRuleChecks() {
      state.ruleChecks = buildRuleChecks();
      renderScaleBasisPanel();
      renderHeuristicsPanel();
      refreshReviewPanels();
      renderExport();
    }

    function runAiRefine(options = currentProcessRuleOptions()) {
      state.processRuleOptions = { ...state.processRuleOptions, ...options };
      const issues = buildRuleChecks();
      const heuristics = heuristicReviewModel();
      const selectedIssues = filterIssuesByRuleOptions(issues, state.processRuleOptions);
      const conflicts = aiRefineConflicts(selectedIssues, heuristics, state.processRuleOptions);
      state.ruleChecks = selectedIssues;
      state.aiRefine = {
        mode: "Local process rule application. This applies the active heuristics to the blocks, grouped MFA, phases, conditions, arrows, scale-up basis, and Gantt data already built.",
        scope: selectedRuleScopeText(state.processRuleOptions),
        summary: aiRefineSummary(conflicts, heuristics),
        topSeverity: conflicts[0]?.severity || "low",
        conflicts
      };
      renderScaleBasisPanel();
      renderHeuristicsPanel();
      refreshReviewPanels();
      renderExport();
    }

    function openAiRefineModal() {
      const modal = $("aiRefineModal");
      modal.hidden = false;
      setRuleScopeControls(state.processRuleOptions);
      runAiRefine(currentProcessRuleOptions());
      renderAiRefineModal();
    }

    function closeAiRefineModal() {
      $("aiRefineModal").hidden = true;
    }

    function renderAiRefineModal() {
      const local = $("aiRefineLocalResult");
      const refine = state.aiRefine;
      if (!local || !refine) return;
      setRuleScopeControls(state.processRuleOptions);
      local.innerHTML = `
        ${aiRefinePanelHtml(refine)}
        ${localProcessCommentaryHtml(refine)}
        ${refine.conflicts.length ? ruleCheckCardsHtml(refine.conflicts.map(item => ({
          severity: item.severity,
          title: item.title,
          reason: item.reason,
          target: item.target || "process rule application",
          action: item.action
        }))) : `<div class="mfa-empty">No conflicts from selected local process checks.</div>`}
      `;
    }

    function externalReviewHtml(text) {
      const parsed = parseMarkdownProblemTable(text);
      const tableHtml = parsed.length
        ? externalProblemTableHtml(parsed, "AI Problem Table", "Parsed from the external AI report.")
        : externalProblemTableHtml((state.aiRefine?.conflicts || []).slice(0, 10).map(processActionRowModel), "Reference Action Table", "The AI response did not contain a readable Markdown problem table, so this table mirrors the local triage while the AI text remains below.");
      return `
        ${tableHtml}
        <div class="external-report-text">${escapeHtml(stripMarkdownProblemTable(text || "No text returned by external API."))}</div>
      `;
    }

    function parseMarkdownProblemTable(text) {
      const lines = String(text || "").split(/\r?\n/);
      const rows = [];
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trim();
        if (!line.startsWith("|") || !/severity|target|evidence|suggested/i.test(line)) continue;
        const headers = splitMarkdownTableRow(line).map(normalizeHeader);
        const separator = lines[i + 1]?.trim() || "";
        if (!separator.startsWith("|") || !/---/.test(separator)) continue;
        for (let j = i + 2; j < lines.length; j += 1) {
          const rowLine = lines[j].trim();
          if (!rowLine.startsWith("|")) break;
          const cells = splitMarkdownTableRow(rowLine);
          if (cells.length < 3) continue;
          const row = {};
          headers.forEach((header, index) => {
            row[header] = cells[index] || "";
          });
          rows.push({
            priority: row.severity || "review",
            point: row.target || row.problem || row.issue || "Process point",
            evidence: row.evidence || row["why it matters"] || "",
            area: row.target || row.area || "External review",
            rule: row["rule or doubt"] || row.rule || row.doubt || "AI-supported process heuristic",
            action: row["suggested change"] || row.action || row.recommendation || "Review manually."
          });
        }
        break;
      }
      return rows.slice(0, 12);
    }

    function splitMarkdownTableRow(line) {
      return line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map(cell => cell.trim().replace(/<br\s*\/?>/gi, " "));
    }

    function normalizeHeader(header) {
      return String(header || "").toLowerCase().replace(/\*\*/g, "").trim();
    }

    function externalProblemTableHtml(rows, title, note) {
      if (!rows.length) return "";
      return `
        <div class="external-problem-panel">
          <div class="process-action-head">
            <strong>${escapeHtml(title)}</strong>
            <span class="muted small">${rows.length} point${rows.length === 1 ? "" : "s"}</span>
          </div>
          <div class="muted small">${escapeHtml(note)}</div>
          <div class="external-problem-list">
            ${rows.map(row => `
              <article class="external-problem-card ${escapeAttr(String(row.priority).toLowerCase())}">
                <div class="external-problem-top">
                  <span class="severity-pill">${escapeHtml(row.priority)}</span>
                  <strong>${escapeHtml(row.point)}</strong>
                </div>
                ${row.evidence ? `<p>${escapeHtml(row.evidence)}</p>` : ""}
                <div class="external-problem-meta">
                  <span><b>Area</b>${escapeHtml(row.area)}</span>
                  <span><b>Rule / doubt</b>${escapeHtml(row.rule)}</span>
                  <span><b>Proposed change</b>${escapeHtml(row.action)}</span>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      `;
    }

    function stripMarkdownProblemTable(text) {
      const lines = String(text || "").split(/\r?\n/);
      const output = [];
      let skipping = false;
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!skipping && trimmed.startsWith("|") && /severity|target|evidence|suggested/i.test(trimmed)) {
          skipping = true;
          continue;
        }
        if (skipping) {
          if (trimmed.startsWith("|") || /^[-|:\s]+$/.test(trimmed)) continue;
          skipping = false;
        }
        output.push(line);
      }
      return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    }

    function processActionRowModel(issue) {
      return {
        priority: issue.severity || "low",
        point: issue.title || "Process issue",
        evidence: issue.reason || "",
        area: processAreaLabel(issue),
        rule: ruleReferenceLabel(issue),
        action: issue.action || "Review and update the corresponding process data."
      };
    }

    function processAreaLabel(issue) {
      const scope = issue.scope || inferIssueScope(issue.title || "", issue.target || "", issue.reason || "");
      const labels = {
        sequence: "Sequence / arrows",
        mfa: "MFA streams",
        phases: "Phases / unit choice",
        conditions: "Conditions",
        recycle: "Recycle / purge",
        scale: "Scale-up / Gantt",
        general: "Process model"
      };
      const target = issue.target ? ` - ${issue.target}` : "";
      return `${labels[scope] || labels.general}${target}`;
    }

    function ruleReferenceLabel(issue) {
      const text = `${issue.title || ""} ${issue.reason || ""}`;
      const heuristic = text.match(/\bH\d{2}\b/);
      if (heuristic) return heuristic[0];
      if (/thermal reversal|temperature handoff|cool|heat/i.test(text)) return "Thermal sequence heuristic";
      if (/phase|unit.*compatible|alternative/i.test(text)) return "Phase-unit compatibility heuristic";
      if (/mfa|stream|quantity|material/i.test(text)) return "Material-balance heuristic";
      if (/recycle|purge|fate|accumul/i.test(text)) return "Recycle/purge closure heuristic";
      if (/bottleneck|duration|gantt|scale/i.test(text)) return "Scale-up scheduling heuristic";
      if (/condition|missing|endpoint|yield|conversion/i.test(text)) return "Data-completeness heuristic";
      return "General process heuristic";
    }

    function localProcessCommentaryHtml(refine) {
      const high = refine.conflicts.filter(item => item.severity === "high").length;
      const medium = refine.conflicts.filter(item => item.severity === "medium").length;
      const low = refine.conflicts.filter(item => item.severity === "low").length;
      const missing = refine.conflicts.filter(item => /missing|lacks|incomplete/i.test(`${item.title} ${item.reason}`)).length;
      const top = refine.conflicts[0];
      return `
        <div class="process-commentary">
          <div class="process-commentary-row">
            <strong>Process summary</strong>
            <span>${high} high / ${medium} medium / ${low} low issues in selected scopes.</span>
          </div>
          <div class="process-commentary-row">
            <strong>Missing data</strong>
            <span>${missing} item${missing === 1 ? "" : "s"} need more evidence before scale-up or scheduling.</span>
          </div>
          <div class="process-commentary-row">
            <strong>Top concern</strong>
            <span>${top ? escapeHtml(`${top.title}: ${top.action}`) : "No local inconsistency detected for the selected checks."}</span>
          </div>
        </div>
      `;
    }

    async function runExternalAiRefine() {
      const result = $("externalAiResult");
      const apiKey = $("aiApiKey").value.trim();
      const model = $("aiModel").value.trim();
      const endpoint = $("aiEndpoint").value.trim() || "https://api.openai.com/v1/responses";
      const reportStyle = $("aiReportStyle")?.value || "commentary_summary";
      const useWebReferences = $("aiUseWebReferences")?.checked !== false;
      const options = currentProcessRuleOptions();
      writeExportNow();
      result.className = "external-ai-result mfa-empty";
      const keySource = apiKey ? "temporary popup key" : "server OPENAI_API_KEY if configured";
      result.textContent = useWebReferences
        ? `Running external analysis with ${keySource}. Web references can take up to 3 minutes; if web search times out, the server will retry once without web references.`
        : `Running external analysis with ${keySource}. Web references disabled.`;
      let project = {};
      try {
        project = JSON.parse($("jsonOut").textContent || "{}");
      } catch {
        project = { text: state.text, error: "Could not parse export JSON." };
      }
      try {
        const response = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, model, endpoint, reportStyle, useWebReferences, options, project })
        });
        const payload = await response.json();
        if (!payload.ok) {
          result.className = "external-ai-result rule-card high";
          const details = payload.details ? `\n\nDetails: ${JSON.stringify(payload.details, null, 2)}` : "";
          result.textContent = `${payload.error || "External API analysis failed."}${details}`;
          return;
        }
        result.className = "external-ai-result rule-card low";
        result.innerHTML = externalReviewHtml(payload.text || "No text returned by external API.");
      } catch (error) {
        result.className = "external-ai-result rule-card high";
        result.textContent = `External API request failed: ${error.message}`;
      }
    }

    function currentProcessRuleOptions() {
      const controls = document.querySelectorAll("[data-rule-scope]");
      if (!controls.length) return { ...state.processRuleOptions };
      const options = { ...state.processRuleOptions };
      controls.forEach(control => {
        options[control.dataset.ruleScope] = control.checked;
      });
      return options;
    }

    function setRuleScopeControls(options) {
      document.querySelectorAll("[data-rule-scope]").forEach(control => {
        control.checked = options?.[control.dataset.ruleScope] !== false;
      });
    }

    function selectedRuleScopeText(options) {
      const labels = {
        sequence: "sequence/thermal",
        mfa: "MFA",
        phases: "phases/units",
        conditions: "conditions",
        recycle: "recycle/purge",
        scale: "scale-up/Gantt"
      };
      return Object.entries(labels)
        .filter(([key]) => options?.[key] !== false)
        .map(([, label]) => label)
        .join(", ") || "none selected";
    }

    function filterIssuesByRuleOptions(issues, options) {
      return issues.filter(issue => {
        const scope = issue.scope || "general";
        if (scope === "general") return true;
        return options?.[scope] !== false;
      });
    }

    function aiRefineConflicts(issues, heuristics, options = state.processRuleOptions) {
      const issueConflicts = issues
        .filter(issue => ["high", "medium"].includes(issue.severity) || /conflict|missing|bottleneck|incompatible|scale-sensitive/i.test(`${issue.title} ${issue.reason}`))
        .map(issue => ({
          severity: issue.severity,
          title: issue.target ? `${issue.target}: ${issue.title}` : issue.title,
          reason: issue.reason,
          target: issue.target,
          action: issue.action
        }));
      const heuristicConflicts = heuristics.triggered
        .filter(item => heuristicItemInSelectedScope(item, options))
        .filter(item => ["high", "medium"].includes(item.severity))
        .map(item => ({
          severity: item.severity,
          title: `${item.id}: ${item.title}`,
          reason: item.recommendation,
          action: `Review ${item.area}; evidence: ${item.evidence}.`
        }));
      const byKey = new Map();
      [...issueConflicts, ...heuristicConflicts].forEach(item => {
        const key = `${item.severity}|${item.title}|${item.action}`;
        if (!byKey.has(key)) byKey.set(key, item);
      });
      return Array.from(byKey.values()).sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
    }

    function heuristicItemInSelectedScope(item, options) {
      const text = `${item.area} ${item.title} ${item.recommendation} ${(item.tags || item.triggeredBy || []).join(" ")}`.toLowerCase();
      const scopeMatches = {
        sequence: /heat|cool|thermal|reaction|sequence|exotherm|endotherm/.test(text),
        mfa: /material|stream|purge|waste|valuable|recover|separation/.test(text),
        phases: /phase|liquid|vapor|solid|slurry|membrane|distillation|crystall|vacuum/.test(text),
        conditions: /temperature|pressure|condition|holding|residence|selectivity|utility/.test(text),
        recycle: /recycle|purge|accumul|recover|vent/.test(text),
        scale: /scale|equipment|bottleneck|residence|capacity|heat exchange|pump|compress/.test(text)
      };
      return Object.entries(scopeMatches).some(([scope, matched]) => matched && options?.[scope] !== false);
    }

    function aiRefineSummary(conflicts, heuristics) {
      const high = conflicts.filter(item => item.severity === "high").length;
      const medium = conflicts.filter(item => item.severity === "medium").length;
      if (high || medium) return `${high} high and ${medium} medium priority conflicts before scale-up`;
      return `${heuristics.triggered.length} heuristic rules screened with no high-priority conflict`;
    }

    function buildRuleChecks() {
      const issues = [];
      const model = scaleModel();
      const recycle = recycleSummary(model);
      const energyEvents = energyBridgeModel(model);
      const scaleAssessment = scaleUpAssessmentModel(model);
      const gantt = taskScheduleModel();
      if (!state.blocks.length) {
        issues.push(ruleIssue("high", "No process blocks", "The framework needs explicit block-level tasks before scale-up can be reviewed.", "project", "Create blocks from the source text."));
        return issues;
      }
      if (!model.ready) {
        issues.push(ruleIssue("high", "Scale basis incomplete", "A production target needs a numeric reference output or manual basis amount.", "scale-up basis", "Select a reference output block or enter a manual basis amount."));
      }
      if (!model.basis.targetProduct.trim()) {
        issues.push(ruleIssue("medium", "Target product missing", "Scale propagation is harder to audit without naming the product stream.", "scale-up basis", "Set the target product name."));
      }
      if (model.basis.mode !== "continuous" && model.schedule.method !== "duration_OEE_parallel_units" && !Number.isFinite(parseStreamQuantity(model.basis.batchesPerDay))) {
        issues.push(ruleIssue("medium", "Batch schedule missing", "Batch scale-up requires either batches/day (fallback) or a batch duration with OEE and parallel units (preferred once Gantt data exists) to convert between batch, daily, and annual bases.", "scale-up basis", "Enter batches/day, or add task durations so the duration-based method can take over."));
      }
      if (["kg/year", "t/year"].includes(model.basis.targetUnit) && model.schedule.method !== "duration_OEE_parallel_units" && !gantt.ready) {
        issues.push(ruleIssue("medium", "Duration/OEE schedule missing", "Annual production can be reconciled with case-study batch size only when batch duration, OEE, and parallel capacity are explicit.", "scale-up schedule", "Enter batch duration, OEE, and parallel units."));
      }
      if (state.blocks.length && groupIdsInTextOrder().length && gantt.missingDurationCount) {
        issues.push(ruleIssue("medium", "Task durations missing", `${gantt.missingDurationCount} grouped task${gantt.missingDurationCount === 1 ? "" : "s"} lack duration data for bottleneck analysis.`, "Gantt schedule", "Add duration h in group conditions or directly in the Gantt rows."));
      }
      if (gantt.bottleneck && ["increases with scale", "equipment dependent"].includes(gantt.bottleneck.scaleSensitivity)) {
        issues.push(ruleIssue("medium", "Scale-sensitive bottleneck", `${gantt.bottleneck.groupId} controls cycle time and is ${gantt.bottleneck.scaleSensitivity}.`, gantt.bottleneck.groupId, "Review equipment capacity, split into parallel units, or revise the selected unit operation."));
      }
      if (gantt.bottleneck && gantt.bottleneck.scaleSensitivity === "kinetics-bound") {
        issues.push(ruleIssue("low", "Kinetics-bound bottleneck", `${gantt.bottleneck.groupId} controls cycle time but may not improve simply by larger equipment.`, gantt.bottleneck.groupId, "Consider parallel reactors or process intensification rather than assuming duration shrinks at scale."));
      }
      state.blocks.forEach(block => {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
        if (!block.streams.length) {
          issues.push(ruleIssue("medium", "MFA streams missing", "This block cannot contribute to material balance or scale-up propagation.", block.id, "Add at least input/output/waste streams where material changes occur."));
        }
        block.streams.forEach(stream => {
          if (!stream.name.trim()) issues.push(ruleIssue("low", "Unnamed stream", "Unnamed streams are difficult to aggregate across groups.", `${block.id}/${stream.id}`, "Name the stream."));
          if (!stream.quantity.trim()) issues.push(ruleIssue("medium", "Quantity missing", "Scale-up propagation needs a reported, calculated, or assumed quantity.", `${block.id}/${stream.name || stream.id}`, "Enter quantity and unit."));
          if (!stream.phase || stream.phase === "unknown") issues.push(ruleIssue("medium", "Phase missing", "Phase is needed to filter phenomena and industrial alternatives.", `${block.id}/${stream.name || stream.id}`, "Assign the stream phase category."));
        });
        const phenomena = new Set(block.phenomena || []);
        const conditions = block.conditions || {};
        if ([...phenomena].some(code => code.startsWith("M(") || code.startsWith("2phM(")) && !conditions.mixing_time) {
          issues.push(ruleIssue("medium", "Mixing duration missing", "Mixing scale-up depends on contact time, regime, and geometry.", block.id, "Add mixing time and mixing mode."));
        }
        if ([...phenomena].some(code => code.startsWith("R(")) && !conditions.reaction_time) {
          issues.push(ruleIssue("medium", "Reaction time missing", "Residence time or holding time is needed before choosing batch, semi-batch, or continuous operation.", block.id, "Add reaction time or holding time."));
        }
        if ([...phenomena].some(code => code.startsWith("R(")) && !conditions.conversion_yield) {
          issues.push(ruleIssue("medium", "Yield/conversion missing", "Scale-up inputs and waste estimates depend on conversion or isolated yield.", block.id, "Add conversion/yield at block or scale basis level."));
        }
        if ((phenomena.has("ES(H)") || phenomena.has("ES(C)")) && !conditions.target_temperature && !conditions.holding_temperature) {
          issues.push(ruleIssue("medium", "Thermal endpoint missing", "Energy handoff needs initial/final or holding temperature.", block.id, "Add target temperature, holding temperature, or thermal endpoint."));
        }
        if ([...phenomena].some(code => code.startsWith("PS(")) && !conditions.separation_efficiency && !conditions.settling_time) {
          issues.push(ruleIssue("medium", "Separation performance missing", "Separation choices need split performance, settling time, carryover, or efficiency.", block.id, "Add separation efficiency, split fraction, or settling time."));
        }
        if ([...phenomena].some(code => ["PT(LL)", "PS(LL)", "PC(LL)", "PT(VL)", "PS(VL)", "PT(LS)", "PS(LS)"].includes(code))) {
          issues.push(ruleIssue("low", "Property refinement may be needed", "Several industrial alternatives can match the same phenomena, so chemical properties should refine the choice only when ambiguous.", block.id, "Add property notes when choosing between separation alternatives."));
        }
      });
      groupIdsInTextOrder().forEach(groupId => {
        const group = groupModel(groupId);
        const conditionAggregates = aggregateGroupConditions(group);
        const propertyPrompts = propertyPromptsForGroup(group);
        const propertyValues = propertyValuesForGroup(group);
        if (propertyPrompts.length && unitOperationCandidatesForGroup(group).length > 1 && !propertyValues.length) {
          issues.push(ruleIssue("low", "Optional property refinement available", "This group has multiple plausible alternatives; property data can improve ranking without being mandatory.", group.id, "Add properties only if you need to discriminate between alternatives."));
        }
        conditionAggregates
          .filter(item => item.status === "sequence_or_conflict")
          .forEach(item => {
            issues.push(ruleIssue("low", "Group condition kept separate", `${item.label} has multiple values across blocks and should be reviewed as sequence, range, or conflict before scale-up.`, group.id, "Review the grouped condition entries and decide whether they are sequential, alternative, or incompatible."));
          });
        if (!group.selectedUnit) {
          issues.push(ruleIssue("low", "No unit alternative selected", "The group has phenomena but no chosen industrial implementation yet.", group.id, "Select one unit alternative after checking phases and conditions."));
        }
        if (group.selectedUnit && !selectedUnitInCurrentRanking(group)) {
          if (selectedUnitSupportedByEvidence(group)) {
            issues.push(ruleIssue("low", "Selected unit outside algorithm ranking", "The selected industrial alternative is justified by its selection basis but is not produced by the current local ranking heuristic.", group.id, "Keep the paper/heuristic basis, or extend the local unit-operation catalog if this should be ranked automatically.", "phases"));
          } else {
            issues.push(ruleIssue("medium", "Selected unit no longer compatible", "The selected industrial alternative does not match the current grouped phenomena, phases, or task logic.", group.id, "Re-select a unit alternative or record a paper/heuristic selection basis.", "phases"));
          }
        }
        if (separationPredictorApplies(group)) {
          const predictor = propertySeparationPredictorModel(group);
          const selectedDecision = predictor.rows.find(row => row.name === group.selectedUnit);
          if (predictor.mode === "minimal" && selectedDecision?.decision === "reject") {
            issues.push(ruleIssue("medium", "Selected separation rejected by property screen", `${group.selectedUnit} is marked reject: ${selectedDecision.reason}`, group.id, `Review missing data (${selectedDecision.missing.join(", ") || "none"}) or override the decision with a written selection basis.`, "phases"));
          } else if (predictor.mode === "binaryRatio") {
            issues.push(ruleIssue("medium", "Binary-ratio screen needs component properties", "Binary-ratio mode is selected, but the current tool has no component-level property matrix or configured threshold set yet.", group.id, "Use Minimal qualitative mode for now, or add component properties and thresholds before treating the screen as Garg-like.", "phases"));
          } else if (predictor.mode === "skip" && matchesForGroup(group).filter(candidate => candidate.task === "separation" || candidate.task.includes("separation")).length > 1) {
            issues.push(ruleIssue("low", "Optional property screen skipped", "Multiple separation alternatives fit the grouped phenomena, but no property-based keep/weak/reject screen has been applied.", group.id, "Use Minimal qualitative mode if you need a defendable selected/rejected alternatives table.", "phases"));
          }
          const unsupportedProperties = propertyValues.filter(item => item.value && !item.note && item.status !== "reported");
          if (predictor.mode !== "skip" && unsupportedProperties.length) {
            issues.push(ruleIssue("low", "Property source note missing", `${unsupportedProperties.length} property value(s) are used without a source or assumption note.`, group.id, "Add a note/source for every estimated, assumed, or calculated property used by the separation screen.", "phases"));
          }
        }
        if (group.phenomena.some(code => code.startsWith("R(")) && group.phenomena.some(code => code.startsWith("PS(") || code.startsWith("PT("))) {
          issues.push(ruleIssue("low", "Integrated option candidate", "Reaction and separation phenomena appear in the same group, which can justify an intensified alternative if operating windows are compatible.", group.id, "Compare conventional reactor plus separator against an integrated reaction-separation option."));
        }
      });
      processSequenceChecks().forEach(issue => issues.push(issue));
      if (!state.links.length && state.blocks.length > 1) {
        issues.push(ruleIssue("low", "Process connectivity missing", "The checker cannot validate sequence, recycle, purge, or branch logic without arrows.", "board", "Draw arrows between blocks or groups."));
      }
      recycle.warnings.forEach(warning => {
        issues.push(ruleIssue(warning.severity, "Recycle / fate data missing", warning.issue, `${warning.blockId}/${warning.streamName || warning.streamId}`, "Complete stream fate, recovery, purge, loop, or destination fields."));
      });
      energyEvents
        .filter(event => event.missing.length)
        .forEach(event => {
          issues.push(ruleIssue("low", "Energy bridge needs data", `${event.eventType} event is missing ${event.missing.slice(0, 4).join(", ")}.`, event.groupId, "Add missing stream quantities, conditions, or property data before energy calculation."));
        });
      scaleAssessment
        .filter(item => ["high", "medium"].includes(item.severity))
        .forEach(item => {
          issues.push(ruleIssue(item.severity, "Scale-up risk needs review", `${item.title}: ${item.recommendation}`, item.groupId || item.task, "Complete the missing/check fields before treating the scaled process as robust."));
        });
      return issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
    }

    function processSequenceChecks() {
      const issues = [];
      const groups = new Map(groupIdsInTextOrder().map(groupId => [groupId, groupModel(groupId)]));
      const pairKeys = new Set();
      const ordered = orderedGroupIdsForRuleChecks().filter(groupId => groups.has(groupId));
      ordered.forEach((groupId, index) => {
        const group = groups.get(groupId);
        const thermal = thermalProfileForGroup(group);
        const hasHeating = group.phenomena.some(code => code === "ES(H)" || code === "PCh(L->V)");
        const hasCooling = group.phenomena.some(code => code === "ES(C)" || code === "PCh(V->L)" || code === "PCh(L->S)");
        if (hasHeating && hasCooling && group.blocks.length > 1) {
          issues.push(ruleIssue(
            "medium",
            "Grouped thermal steps need sequence review",
            `${group.id} contains both heating and cooling phenomena across multiple blocks. That can be valid, but the order and purpose must be explicit before scale-up energy and Gantt checks.`,
            group.id,
            "Keep them grouped only if one task owns both thermal operations; otherwise split the group or document the internal sequence.",
            "sequence"
          ));
        }
        if ((hasHeating || hasCooling) && !Number.isFinite(thermal.initialTemperature) && !Number.isFinite(thermal.targetTemperature)) {
          issues.push(ruleIssue(
            "medium",
            "Thermal step lacks numeric endpoints",
            `${group.id} has thermal phenomena but no usable initial/final temperature pair for energy handoff.`,
            group.id,
            "Add initial temperature and target/final temperature in the relevant block conditions.",
            "conditions"
          ));
        }
        const nextId = ordered[index + 1];
        if (nextId) pairKeys.add(`${groupId}->${nextId}`);
      });
      state.links.forEach(link => {
        const from = resolvedEndpointId(link.from);
        const to = resolvedEndpointId(link.to);
        if (from && to && from !== to && groups.has(from) && groups.has(to)) pairKeys.add(`${from}->${to}`);
      });
      pairKeys.forEach(key => {
        const [fromId, toId] = key.split("->");
        const from = groups.get(fromId);
        const to = groups.get(toId);
        if (!from || !to) return;
        issues.push(...thermalHandoffIssues(from, to));
        issues.push(...phaseHandoffIssues(from, to));
      });
      return issues;
    }

    function orderedGroupIdsForRuleChecks() {
      const ids = groupIdsInTextOrder();
      if (!state.links.length) return ids;
      const idSet = new Set(ids);
      const outgoing = new Map(ids.map(id => [id, []]));
      const incoming = new Map(ids.map(id => [id, 0]));
      state.links.forEach(link => {
        const from = resolvedEndpointId(link.from);
        const to = resolvedEndpointId(link.to);
        if (!idSet.has(from) || !idSet.has(to) || from === to) return;
        outgoing.get(from).push(to);
        incoming.set(to, incoming.get(to) + 1);
      });
      const queue = ids.filter(id => incoming.get(id) === 0);
      const ordered = [];
      while (queue.length) {
        const id = queue.shift();
        if (ordered.includes(id)) continue;
        ordered.push(id);
        outgoing.get(id).forEach(to => {
          incoming.set(to, incoming.get(to) - 1);
          if (incoming.get(to) === 0) queue.push(to);
        });
      }
      ids.forEach(id => {
        if (!ordered.includes(id)) ordered.push(id);
      });
      return ordered;
    }

    function thermalProfileForGroup(group) {
      const conditions = group.blocks.flatMap(block => {
        ensureBlockConditionFields(block);
        return conditionValuesForBlock(block).map(item => ({ ...item, blockId: block.id }));
      });
      const byId = id => conditions.filter(item => item.id === id);
      const firstNumeric = entries => entries.map(item => parseDurationHoursValue(item.value)).find(Number.isFinite);
      const lastNumeric = entries => [...entries].reverse().map(item => parseDurationHoursValue(item.value)).find(Number.isFinite);
      const initialTemperature = firstNumeric(byId("initial_temperature"));
      const targetTemperature = lastNumeric([...byId("target_temperature"), ...byId("holding_temperature")]);
      const hasHeating = group.phenomena.some(code => code === "ES(H)" || code === "PCh(L->V)");
      const hasCooling = group.phenomena.some(code => code === "ES(C)" || code === "PCh(V->L)" || code === "PCh(L->S)");
      let direction = "none";
      if (Number.isFinite(initialTemperature) && Number.isFinite(targetTemperature)) {
        if (targetTemperature > initialTemperature + 2) direction = "heating";
        else if (targetTemperature < initialTemperature - 2) direction = "cooling";
      }
      if (direction === "none") {
        if (hasHeating && !hasCooling) direction = "heating";
        else if (hasCooling && !hasHeating) direction = "cooling";
        else if (hasHeating && hasCooling) direction = "mixed";
      }
      return { initialTemperature, targetTemperature, direction, hasHeating, hasCooling };
    }

    function thermalHandoffIssues(from, to) {
      const issues = [];
      const a = thermalProfileForGroup(from);
      const b = thermalProfileForGroup(to);
      if (a.direction === "cooling" && b.direction === "heating") {
        issues.push(ruleIssue(
          "medium",
          "Thermal reversal in process sequence",
          `${from.id} cools the process and is followed by ${to.id} heating it again. This may be intentional, but it adds utility load and can increase thermal stress or degradation risk.`,
          `${from.id} -> ${to.id}`,
          "Confirm why cooling is required before reheating; otherwise reorder tasks, combine compatible operations, or add heat-recovery/holding logic.",
          "sequence"
        ));
      }
      if (a.direction === "heating" && b.direction === "cooling" && from.phenomena.some(code => code.startsWith("R(")) && !from.blocks.some(block => String(block.conditions?.thermal_ramp || "").trim())) {
        issues.push(ruleIssue(
          "low",
          "Cooling after reaction needs control basis",
          `${from.id} is a heated reaction-like task followed by ${to.id} cooling. At scale, cooling rate and heat removal may become limiting.`,
          `${from.id} -> ${to.id}`,
          "Record cooling ramp/control basis and check whether the following task can start before full cooling.",
          "sequence"
        ));
      }
      if (Number.isFinite(a.targetTemperature) && Number.isFinite(b.initialTemperature) && Math.abs(a.targetTemperature - b.initialTemperature) > 5) {
        issues.push(ruleIssue(
          "medium",
          "Temperature handoff mismatch",
          `${from.id} ends near ${formatNumber(a.targetTemperature)} C, while ${to.id} starts from ${formatNumber(b.initialTemperature)} C. The gap implies an unmodeled heating/cooling hold between tasks.`,
          `${from.id} -> ${to.id}`,
          "Add the missing thermal conditioning step, update endpoints, or merge the tasks if they are the same operating window.",
          "sequence"
        ));
      }
      return issues;
    }

    function phaseHandoffIssues(from, to) {
      const issues = [];
      const fromOutputs = from.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams.filter(stream => stream.role === "output" && stream.phase && stream.phase !== "unknown");
      });
      const toInputs = to.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams.filter(stream => stream.role === "input" && stream.phase && stream.phase !== "unknown");
      });
      if (!fromOutputs.length || !toInputs.length) return issues;
      const outPhases = new Set(fromOutputs.map(stream => stream.phase));
      const inPhases = new Set(toInputs.map(stream => stream.phase));
      const compatible = [...outPhases].some(phase => inPhases.has(phase) || phaseComponents(phase).some(part => inPhases.has(part)));
      if (!compatible) {
        issues.push(ruleIssue(
          "low",
          "Phase handoff should be checked",
          `${from.id} outputs ${[...outPhases].join(", ")} while ${to.id} inputs ${[...inPhases].join(", ")}. This may require an implicit phase change, separation, or transfer step.`,
          `${from.id} -> ${to.id}`,
          "Confirm the actual material handoff or add the missing operation before scale-up.",
          "phases"
        ));
      }
      return issues;
    }

    function inferIssueScope(title, target, reason) {
      const text = `${title} ${target} ${reason}`.toLowerCase();
      if (/gantt|bottleneck|scale|duration|oee|annual|batch schedule|production/.test(text)) return "scale";
      if (/recycle|purge|fate|recovered|make-up|accumul/.test(text)) return "recycle";
      if (/phase|unit|alternative|compatible|phenomena/.test(text)) return "phases";
      if (/temperature|thermal|pressure|condition|mixing duration|reaction time|yield|conversion|separation performance|endpoint/.test(text)) return "conditions";
      if (/mfa|stream|quantity|material|waste|input|output/.test(text)) return "mfa";
      if (/sequence|connectivity|arrow|handoff|follow/.test(text)) return "sequence";
      return "general";
    }

    function ruleIssue(severity, title, reason, target, action, scope = "") {
      return { severity, title, reason, target, action, scope: scope || inferIssueScope(title, target, reason) };
    }

    function severityRank(severity) {
      return { high: 0, medium: 1, low: 2 }[severity] ?? 3;
    }

    function renderInspector() {
      const block = selectedBlock();
      const hasBlock = Boolean(block);
      ["behaviorSelect", "blockText"].forEach(id => $(id).disabled = !hasBlock);
      $("selectedBlockInfo").innerHTML = block
        ? `<strong>${block.id}</strong> <span class="pill">${escapeHtml(block.groupId || "ungrouped")}</span>${block.source === "manual" ? `<span class="pill">manual</span>` : ""}<div class="muted small">${block.source === "manual" ? "Manual block not linked to protocol text. Use it for emerged scale-up operations, inferred separators, compliance steps, or assumptions." : "Edit this text when the extracted selection is missing a word or needs clearer wording."}</div>`
        : "No block selected.";
      $("behaviorSelect").value = block?.behavior || "unassigned";
      renderBehaviorPresetHelp(block?.behavior || "unassigned");
      $("blockText").value = block?.text || "";
      renderPhenomenaGrid(block);

      renderStepAuditPanel();
      renderHeuristicsPanel();
      renderScaleBasisPanel();
      refreshReviewPanels();
      renderExport();
    }

    function renderBehaviorPresetHelp(behavior) {
      const root = $("behaviorPresetHelp");
      if (!root) return;
      const preset = behaviorPresets[behavior] || behaviorPresets.unassigned;
      root.innerHTML = `
        <strong>${escapeHtml(preset.task)}</strong>
        <span>${escapeHtml(preset.description || "No preset description available.")}</span>
        <span class="pill">${escapeHtml(preset.phenomena.length ? preset.phenomena.join(", ") : "no phenomena")}</span>
      `;
    }

    function step13AuditModel() {
      const blocks = blocksInOrder();
      const groups = groupIdsInTextOrder().map(groupId => groupModel(groupId));
      const allStreams = blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams || [];
      });
      const missingPurpose = blocks.filter(block => !blockHasAssignedPurpose(block));
      const missingOutput = blocks.filter(block => blockExpectsStreams(block) && !streamCounts(block).output);
      const missingPhase = allStreams.filter(stream => !String(stream.phase || "").trim() || stream.phase === "unknown");
      const missingPhenomena = blocks.filter(block => !(block.phenomena || []).length);
      const ungrouped = blocks.filter(block => !block.groupId);
      const missingTaskOrUnit = groups.filter(group => !group.task || group.task === "unassigned" || !group.selectedUnit);
      const incompatibleUnit = groups.filter(group => group.selectedUnit && !selectedUnitSupportedByEvidence(group));
      const missingSelectionBasis = groups.filter(group => group.selectedUnit && unitOperationCandidatesForGroup(group).length > 1 && !String(group.selectionBasis || "").trim());

      const statusFor = issues => !blocks.length ? "todo" : issues.length ? "partial" : "done";
      return [
        {
          step: 1,
          title: "Block Data",
          status: statusFor([...missingPurpose, ...missingOutput, ...missingPhase]),
          summary: blocks.length
            ? `${blocks.length} block${blocks.length === 1 ? "" : "s"}, ${allStreams.length} stream${allStreams.length === 1 ? "" : "s"}`
            : "No blocks yet.",
          issues: [
            ...missingPurpose.map(block => ({ text: `${block.id}: purpose preset missing`, kind: "block", id: block.id })),
            ...missingOutput.map(block => ({ text: `${block.id}: output stream missing`, kind: "block", id: block.id })),
            ...missingPhase.map(stream => ({ text: `${stream.id || "stream"}: phase missing`, kind: "stream", id: stream.id }))
          ]
        },
        {
          step: 2,
          title: "Phenomena",
          status: statusFor(missingPhenomena),
          summary: blocks.length
            ? `${blocks.length - missingPhenomena.length}/${blocks.length} blocks mapped`
            : "Create blocks first.",
          issues: missingPhenomena.map(block => ({ text: `${block.id}: no phenomena assigned`, kind: "block", id: block.id }))
        },
        {
          step: 3,
          title: "Tasks & Unit Ops",
          status: !groups.length ? "todo" : [...ungrouped, ...missingTaskOrUnit, ...incompatibleUnit].length ? "partial" : "done",
          summary: groups.length
            ? `${groups.length} task group${groups.length === 1 ? "" : "s"}`
            : "No task groups yet.",
          issues: [
            ...ungrouped.map(block => ({ text: `${block.id}: not assigned to a group`, kind: "block", id: block.id })),
            ...missingTaskOrUnit.map(group => ({ text: `${group.id}: task or selected unit missing`, kind: "group", id: group.id })),
            ...incompatibleUnit.map(group => ({ text: `${group.id}: selected unit not supported by evidence`, kind: "group", id: group.id })),
            ...missingSelectionBasis.map(group => ({ text: `${group.id}: selection basis missing`, kind: "group", id: group.id, warningOnly: true }))
          ]
        }
      ];
    }

    function renderStepAuditPanel() {
      const root = $("stepAuditPanel");
      if (!root) return;
      const cards = step13AuditModel();
      root.innerHTML = cards.map(card => {
        const blockingIssues = card.issues.filter(issue => !issue.warningOnly);
        const first = card.issues[0];
        const statusLabel = card.status === "done" ? "done" : card.status === "partial" ? "needs work" : "todo";
        return `
          <article class="step-audit-card ${card.status}">
            <div class="step-audit-head">
              <strong>Step ${card.step}. ${escapeHtml(card.title)}</strong>
              <span class="pill ${card.status === "done" ? "green" : card.status === "partial" ? "warn" : ""}">${escapeHtml(statusLabel)}</span>
            </div>
            <div class="muted small">${escapeHtml(card.summary)}</div>
            <div class="step-audit-issues">
              ${card.issues.length
                ? card.issues.slice(0, 3).map(issue => `<button class="step-audit-issue ${issue.warningOnly ? "warning-only" : ""}" data-step-audit-kind="${escapeAttr(issue.kind)}" data-step-audit-id="${escapeAttr(issue.id)}">${escapeHtml(issue.text)}</button>`).join("")
                : `<span class="pill green">No open issue</span>`}
              ${card.issues.length > 3 ? `<span class="muted small">+${card.issues.length - 3} more</span>` : ""}
            </div>
            ${first ? `<button class="mini-button" data-step-audit-kind="${escapeAttr(first.kind)}" data-step-audit-id="${escapeAttr(first.id)}">${blockingIssues.length ? "Open first gap" : "Open warning"}</button>` : ""}
          </article>
        `;
      }).join("");
      root.querySelectorAll("[data-step-audit-kind]").forEach(button => {
        button.addEventListener("click", () => focusStepAuditTarget(button.dataset.stepAuditKind, button.dataset.stepAuditId));
      });
      // The audit panel lives in the "Board" source-tab, which isn't the default tab (Protocol is) -
      // surface the open-issue count on the tab button itself so it's not silently missed.
      const badge = $("boardTabAuditBadge");
      if (badge) {
        const openCount = cards.reduce((sum, card) => sum + card.issues.filter(issue => !issue.warningOnly).length, 0);
        badge.hidden = !openCount;
        badge.textContent = openCount;
      }
    }

    function focusStepAuditTarget(kind, id) {
      if (!id) return;
      if (kind === "group") {
        const group = groupModel(id);
        if (!group) return;
        state.selectedGroupId = id;
        state.selectedBlockId = null;
        state.selectedIds = group.blocks.map(block => block.id);
        state.focusEndpoint = id;
      } else if (kind === "stream") {
        const block = blocksInOrder().find(item => (item.streams || []).some(stream => stream.id === id));
        if (!block) return;
        state.selectedBlockId = block.id;
        state.selectedGroupId = null;
        state.selectedIds = [block.id];
        state.focusEndpoint = block.groupId || block.id;
        const stream = block.streams.find(item => item.id === id);
        if (stream) stream.editing = true;
      } else {
        const block = state.blocks.find(item => item.id === id);
        if (!block) return;
        state.selectedBlockId = block.id;
        state.selectedGroupId = null;
        state.selectedIds = [block.id];
        state.focusEndpoint = block.groupId || block.id;
      }
      setInspectorTab("inspect");
      setSourcePanelTab("board");
      renderAll();
    }


    function renderGroupProperties(group) {
      const root = $("groupProperties");
      if (!root) return;
      root.innerHTML = groupPropertiesPanelHtml(group);
      if (group) bindGroupPropertiesControls(root, group.id);
    }

    function groupPropertiesPanelHtml(group) {
      if (!group) {
        return `<span class="muted">No group selected.</span>`;
      }
      const prompts = propertyPromptsForGroup(group);
      const groupState = ensureGroup(group.id);
      const predictorHtml = propertyPredictorPanelHtml(group);
      if (!prompts.length && !predictorHtml) {
        return `<span class="muted">No property refinement needed for the current phenomena at framework level.</span>`;
      }
      if (groupState.propertiesEditing) {
        const promptGroups = propertyPromptGroups(prompts);
        return `
          ${predictorHtml}
          <section class="property-section">
            <div class="property-section-head">
              <div>
                <strong>Property Inputs</strong>
                <span>Fill only values that affect separation, scale-up, energy handoff, or safety.</span>
              </div>
              <button class="primary" data-save-properties="${escapeAttr(group.id)}">Save</button>
            </div>
            ${propertyMissingStripHtml(group, prompts)}
            ${promptGroups.map(grouping => propertyPromptFamilyHtml(groupState, grouping)).join("")}
          </section>
        `;
      }
      const values = propertyValuesForGroup(group);
      const neededCount = prompts.filter(prompt => propertyNeedLevel(prompt, group) !== "optional").length;
      return `
        ${predictorHtml}
        <section class="property-section">
          <div class="property-section-head">
            <div>
              <strong>Property Inputs</strong>
              <span>${values.length}/${prompts.length} filled, ${neededCount} framework-relevant</span>
            </div>
            <button data-edit-properties="${escapeAttr(group.id)}">${values.length ? "Edit" : "Add"}</button>
          </div>
          ${propertyMissingStripHtml(group, prompts)}
          ${values.length ? `<div class="property-label-grid">${values.map(propertyLabelHtml).join("")}</div>` : `<div class="mfa-empty">No property data entered yet. The tool will still run, but separation decisions remain lower-confidence.</div>`}
        </section>
      `;
    }

    function bindGroupPropertiesControls(root, groupId) {
      bindPropertyPredictorControls(root, groupId);
      root.querySelectorAll("[data-edit-properties]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.editProperties).propertiesEditing = true;
          renderAll();
        });
      });
      root.querySelectorAll("[data-save-properties]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.saveProperties).propertiesEditing = false;
          renderAll();
        });
      });
      root.querySelectorAll("[data-property-field]").forEach(field => {
        field.addEventListener("input", updateGroupPropertyField);
        field.addEventListener("change", updateGroupPropertyField);
      });
    }

    function propertyPredictorPanelHtml(group) {
      if (!separationPredictorApplies(group)) return "";
      const model = propertySeparationPredictorModel(group);
      const stateLabel = model.mode === "minimal"
        ? `${model.counts.keep} keep / ${model.counts.weak} weak / ${model.counts.reject} reject`
        : model.mode === "binaryRatio"
          ? "binary-ratio pending"
          : "skipped";
      const applies = groupSeparationFamilies(group);
      const familyLabel = applies.size ? Array.from(applies).map(item => item.toUpperCase()).join(", ") : "from alternatives";
      return `
        <section class="predictor-card">
          <div class="predictor-head">
            <div>
              <div class="label">Optional Property-Based Separation Screen</div>
              <div class="muted small">Screening only, not final equipment design. Use it when multiple separation alternatives remain plausible after the phenomena mapping.</div>
            </div>
            <span class="pill ${model.mode === "minimal" ? "blue" : model.mode === "binaryRatio" ? "warn" : ""}">${escapeHtml(stateLabel)}</span>
          </div>
          <div class="predictor-summary-grid">
            <span><strong>Scope</strong>${escapeHtml(familyLabel)}</span>
            <span><strong>Open data</strong>${model.unresolved}</span>
            <span><strong>Mode</strong>${escapeHtml(model.modeLabel)}</span>
            <span><strong>Threshold set</strong>${escapeHtml(model.thresholdSet)}</span>
          </div>
          <div class="predictor-controls">
            <label>
              <span class="label">Mode</span>
              <select data-predictor-mode="${escapeAttr(group.id)}">
                <option value="skip" ${model.mode === "skip" ? "selected" : ""}>Skipped</option>
                <option value="minimal" ${model.mode === "minimal" ? "selected" : ""}>Minimal qualitative</option>
                <option value="binaryRatio" ${model.mode === "binaryRatio" ? "selected" : ""}>Binary-ratio</option>
              </select>
            </label>
            <button data-toggle-predictor="${escapeAttr(group.id)}">${model.expanded ? "Hide table" : "Show table"}</button>
          </div>
          ${model.expanded ? propertyPredictorTableHtml(group, model) : `
            <div class="predictor-help">${model.mode === "skip"
              ? "Alternatives still come from phenomena and phase compatibility. Switch to Minimal qualitative when you want a keep/weak/reject rationale."
              : model.summary}</div>
          `}
        </section>
      `;
    }

    function propertyPredictorTableHtml(group, model) {
      if (!model.rows.length) return `<div class="mfa-empty">No alternatives available for this group yet.</div>`;
      return `
        <div class="predictor-table">
          ${model.rows.map(row => `
            <div class="predictor-row ${escapeAttr(row.decision)}">
              <div class="predictor-row-top">
                <strong>${escapeHtml(row.name)}</strong>
                <select data-alt-decision="${escapeAttr(row.name)}" data-alt-decision-group="${escapeAttr(group.id)}">
                  ${optionHtml(["auto", "keep", "weak", "reject"], row.manualDecision || "auto")}
                </select>
              </div>
              <div class="predictor-meta">
                <span class="pill ${row.decision === "keep" || row.decision === "selected" ? "green" : row.decision === "reject" ? "warn" : "blue"}">${escapeHtml(row.decision)}</span>
                <span class="pill ${row.confidence === "high" ? "green" : row.confidence === "medium" ? "blue" : row.confidence === "not screened" ? "" : "warn"}">${escapeHtml(row.confidence)}</span>
              </div>
              <div class="predictor-reason">${escapeHtml(row.reason)}</div>
              <div class="predictor-missing">${row.missing.length ? row.missing.map(item => `<span class="pill warn">${escapeHtml(item)}</span>`).join("") : `<span class="pill green">no missing property</span>`}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    function bindPropertyPredictorControls(root, groupId) {
      root.querySelectorAll("[data-predictor-mode]").forEach(select => {
        select.addEventListener("change", () => {
          pushUndo();
          const predictor = ensureGroup(select.dataset.predictorMode).propertyPredictor;
          predictor.mode = select.value;
          predictor.expanded = select.value === "minimal" || select.value === "binaryRatio" ? true : predictor.expanded;
          invalidateAiRefine();
          renderAll();
        });
      });
      root.querySelectorAll("[data-toggle-predictor]").forEach(button => {
        button.addEventListener("click", () => {
          const predictor = ensureGroup(button.dataset.togglePredictor).propertyPredictor;
          predictor.expanded = !predictor.expanded;
          renderAll();
        });
      });
      root.querySelectorAll("[data-alt-decision]").forEach(select => {
        select.addEventListener("change", () => {
          pushUndo();
          const groupState = ensureGroup(select.dataset.altDecisionGroup);
          const name = select.dataset.altDecision;
          if (select.value === "auto") {
            delete groupState.alternativeDecisions[name];
          } else {
            groupState.alternativeDecisions[name] = { decision: select.value };
          }
          invalidateAiRefine();
          renderAll();
        });
      });
    }

    function lutzeReactionSeparationLaunchHtml(group, model = separationSimulatorModel(group)) {
      const path = separationPathwayModel(group, model);
      const balance = path.balance;
      const missing = [];
      if (model.substances.length < 2) missing.push("substances");
      if (!balance.mainProduct) missing.push("main product");
      if (!Number.isFinite(balance.conversion)) missing.push("conversion/yield");
      if (!path.nextOptions.length) missing.push("property/binary evidence");
      const status = missing.length ? `Needs ${missing.join(", ")}` : `${path.nextOptions.length} route move${path.nextOptions.length === 1 ? "" : "s"} ready`;
      return `
        <section class="predictor-card lutze-launch-card">
          <div class="predictor-head">
            <div>
              <div class="label">Lutze Reaction-Separation</div>
              <div class="muted small">Open a draft pathway canvas for substance-separation moves. The main flowchart changes only when you apply the pathway.</div>
            </div>
            <span class="pill ${missing.length ? "warn" : "green"}">${escapeHtml(status)}</span>
          </div>
          <button class="primary lutze-launch-button" data-open-lutze-reaction-separation="${escapeAttr(group.id)}">Simulate Lutze Substance Separation</button>
        </section>
      `;
    }

    function ensureConversionDetail(block) {
      if (!block.conversionDetail || typeof block.conversionDetail !== "object" || Array.isArray(block.conversionDetail)) {
        block.conversionDetail = { productStreamId: "", byproducts: [] };
      }
      if (!Array.isArray(block.conversionDetail.byproducts)) block.conversionDetail.byproducts = [];
      block.conversionDetail.productBasisQuantity = String(block.conversionDetail.productBasisQuantity || "");
      block.conversionDetail.lastGeneratedSummary = String(block.conversionDetail.lastGeneratedSummary || "");
      return block.conversionDetail;
    }

    function conversionReactantStreams(block) {
      return (block.streams || []).filter(stream => stream.role === "input");
    }

    function conversionProductStream(block) {
      const detail = ensureConversionDetail(block);
      const outputs = (block.streams || []).filter(stream => stream.role === "output");
      if (!outputs.length) return null;
      return outputs.find(stream => stream.id === detail.productStreamId)
        || outputs.find(stream => stream.fate === "product")
        || outputs[0];
    }

    function conversionProductBasisQuantity(block, product) {
      const detail = ensureConversionDetail(block);
      const saved = conversionNumber(detail.productBasisQuantity);
      if (saved > 0) return saved;
      const streamBasis = conversionNumber(product?.conversionBaseQuantity);
      if (streamBasis > 0) return streamBasis;
      return conversionNumber(product?.quantity);
    }

    function conversionCalculationModel(block) {
      ensureBlockConditionFields(block);
      const detail = ensureConversionDetail(block);
      const percent = Math.max(0, Math.min(100, conversionNumber(block.conditions.conversion_yield || "95")));
      const leftoverPercent = 100 - percent;
      const reactants = conversionReactantStreams(block);
      const outputs = (block.streams || []).filter(stream => stream.role === "output");
      const product = conversionProductStream(block);
      let pooledLeftover = 0;
      const reactantRows = reactants.map(stream => {
        const qty = conversionNumber(stream.quantity);
        const used = qty * percent / 100;
        const leftover = qty * leftoverPercent / 100;
        pooledLeftover += leftover;
        return { stream, qty, used, leftover };
      });
      const productQty = product ? conversionProductBasisQuantity(block, product) : 0;
      const productMade = productQty * percent / 100;
      const productShortfall = productQty * leftoverPercent / 100;
      const byproductTotalPercent = detail.byproducts.reduce((sum, bp) => sum + conversionNumber(bp.percent), 0);
      const byproductRows = detail.byproducts.map(bp => ({ ...bp, mass: pooledLeftover * (conversionNumber(bp.percent) / 100) }));
      const wastePercent = Math.max(0, 100 - byproductTotalPercent);
      const wasteMass = pooledLeftover * (wastePercent / 100);
      const fallbackUnit = product?.unit || reactants[0]?.unit || "kg";
      return {
        detail,
        percent,
        leftoverPercent,
        reactants,
        outputs,
        product,
        reactantRows,
        productQty,
        productMade,
        productShortfall,
        pooledLeftover,
        byproductTotalPercent,
        byproductRows,
        wastePercent,
        wasteMass,
        fallbackUnit
      };
    }

    function syncGroupReactionBalanceFromConversionBlock(block) {
      if (!block?.groupId) return;
      const groupState = ensureGroup(block.groupId);
      const simulator = groupState.separationSimulator;
      simulator.reactionBalance = normalizeReactionBalance(simulator.reactionBalance);
      const conversion = String(block.conditions?.conversion_yield || "").trim();
      if (conversion) simulator.reactionBalance.conversionPercent = conversion;
      simulator.reactionBalance.basis = simulator.reactionBalance.basis || "conversion";
      const product = conversionProductStream(block);
      if (product?.name) {
        const productName = cleanSubstanceName(product.name).toLowerCase();
        const matchingSubstance = simulator.substances.find(item => cleanSubstanceName(item.name).toLowerCase() === productName);
        if (matchingSubstance) simulator.reactionBalance.mainProductId = matchingSubstance.id;
      }
    }

    function addConversionProductOutput(block) {
      ensureBlockFlowFields(block);
      const stream = createStream("output", {
        id: nextStreamId(block),
        name: inferMainProductNameFromOutputs(groupModel(block.groupId)) || "main product",
        quantity: "",
        unit: "kg",
        phase: "L",
        status: "estimated",
        timing: "in-process intermediate",
        fate: "product",
        scalingMode: "per batch",
        note: "Added from Conversion popup as selectable main product basis."
      });
      block.streams.push(stream);
      ensureConversionDetail(block).productStreamId = stream.id;
      syncLegacyStreamLists(block);
      return stream;
    }

    function conversionGeneratedStreamId(block, suffix) {
      return `${block.id}-CB-${suffix}`.replace(/[^A-Za-z0-9_-]/g, "-");
    }

    function upsertConversionStream(block, role, id, values) {
      ensureBlockFlowFields(block);
      let stream = block.streams.find(item => item.id === id);
      if (!stream) {
        stream = createStream(role, { id, ...values });
        block.streams.push(stream);
      } else {
        Object.assign(stream, createStream(role, { ...stream, ...values, id }));
      }
      return stream;
    }

    function upsertSeparationSubstanceForConversion(groupId, stream, role, fate, sourceBlockId, meta = {}) {
      const simulator = ensureGroup(groupId).separationSimulator;
      const cleanName = cleanSubstanceName(stream.name);
      const name = cleanSubstanceName(meta.residualOf || cleanName || stream.name);
      if (!name) return null;
      const key = canonicalChemicalKey(meta.residualOf || name);
      let substance = simulator.substances.find(item => substanceChemicalKey(item) === key || canonicalChemicalKey(item.name) === key);
      const residualNote = meta.residualOf
        ? `Unreacted residual generated by conversion balance; same chemical properties as ${meta.residualOf}; route to recovery, purge, or waste.`
        : "";
      if (!substance) {
        substance = normalizeSeparationSubstance({
          id: nextSeparationSubstanceId(simulator),
          name,
          role,
          fate,
          phase: stream.phase || "unknown",
          quantity: stream.quantity || "",
          unit: stream.unit || "",
          residualOf: meta.residualOf || "",
          residualSourceId: meta.residualSourceId || "",
          chemicalKey: key,
          source: `${sourceBlockId}/${stream.id}`,
          note: [stream.note, residualNote].filter(Boolean).join(" | "),
          ...streamChemicalPropertyPayload(stream)
        }, simulator.substances.length);
        simulator.substances.push(substance);
      } else {
        substance.role = role || substance.role;
        substance.fate = fate || substance.fate;
        substance.phase = stream.phase && stream.phase !== "unknown" ? stream.phase : substance.phase;
        substance.quantity = stream.quantity || substance.quantity;
        substance.unit = stream.unit || substance.unit;
        substance.chemicalKey = key || substance.chemicalKey;
        substance.residualOf = substance.residualOf || meta.residualOf || "";
        substance.residualSourceId = substance.residualSourceId || meta.residualSourceId || "";
        substance.source = mergeSubstanceText(substance.source, `${sourceBlockId}/${stream.id}`, "");
        if (stream.note && !String(substance.note || "").includes(stream.note)) {
          substance.note = [substance.note, stream.note].filter(Boolean).join(" | ");
        }
        if (residualNote && !String(substance.note || "").includes(residualNote)) {
          substance.note = [substance.note, residualNote].filter(Boolean).join(" | ");
        }
        mergeCandidateChemicalProperties(substance, stream);
      }
      applyChemicalKey(substance);
      propagateSeparationChemicalProperties(groupId, substance);
      return substance;
    }

    function applyConversionBalanceStreams(block) {
      if (!block) return;
      const calc = conversionCalculationModel(block);
      if (!calc.reactantRows.length && !calc.product) return;
      pushUndo();
      if (calc.product) {
        const basis = calc.productQty || conversionNumber(calc.product.quantity);
        calc.detail.productBasisQuantity = String(basis || "");
        calc.product.conversionBaseQuantity = String(basis || "");
        calc.product.quantity = formatNumber(calc.productMade);
        calc.product.status = "calculated";
        calc.product.fate = "product";
        calc.product.note = [
          calc.product.note,
          `Balanced from conversion popup: ${formatNumber(calc.percent)}% of ${formatNumber(basis)} ${calc.product.unit || "kg"} product basis gives ${formatNumber(calc.productMade)} ${calc.product.unit || "kg"}.`
        ].filter(Boolean).join(" ");
        if (block.groupId) {
          const productSubstance = upsertSeparationSubstanceForConversion(block.groupId, calc.product, "product", "product", block.id);
          const simulator = ensureGroup(block.groupId).separationSimulator;
          if (productSubstance) simulator.reactionBalance.mainProductId = productSubstance.id;
        }
      }
      calc.reactantRows.forEach(row => {
        if (!(row.leftover > 0)) return;
        const sourceName = cleanSubstanceName(row.stream.name) || row.stream.name || "reactant";
        const stream = upsertConversionStream(block, "waste", conversionGeneratedStreamId(block, `unreacted-${sourceName}`), {
          name: `unreacted ${sourceName}`,
          quantity: formatNumber(row.leftover),
          unit: row.stream.unit || "kg",
          phase: row.stream.phase || "unknown",
          status: "calculated",
          timing: "waste purge",
          fate: "purge",
          scalingMode: "per batch",
          note: `Auto-generated by Conversion balance: ${formatNumber(calc.leftoverPercent)}% of ${sourceName} remains unreacted; treat as recovery or waste candidate before Lutze separation.`,
          ...streamChemicalPropertyPayloadWithDensity(row.stream)
        });
        if (block.groupId) {
          upsertSeparationSubstanceForConversion(block.groupId, stream, "reactant", "recover", block.id, {
            residualOf: sourceName,
            residualSourceId: row.stream.id
          });
        }
      });
      calc.byproductRows.forEach((row, index) => {
        const name = String(row.name || "").trim();
        if (!name || !(row.mass > 0)) return;
        const stream = upsertConversionStream(block, "output", conversionGeneratedStreamId(block, `byproduct-${index + 1}`), {
          name,
          quantity: formatNumber(row.mass),
          unit: calc.fallbackUnit,
          phase: "unknown",
          status: "calculated",
          timing: "in-process intermediate",
          fate: "intermediate",
          scalingMode: "per batch",
          note: `Auto-generated by Conversion balance as coproduct/byproduct: ${formatNumber(conversionNumber(row.percent))}% of the unconverted reagent pool.`
        });
        if (block.groupId) upsertSeparationSubstanceForConversion(block.groupId, stream, "byproduct", "recover", block.id);
      });
      if (calc.wasteMass > 0) {
        upsertConversionStream(block, "waste", conversionGeneratedStreamId(block, "unassigned-waste"), {
          name: "unassigned reaction waste",
          quantity: formatNumber(calc.wasteMass),
          unit: calc.fallbackUnit,
          phase: "unknown",
          status: "calculated",
          timing: "waste purge",
          fate: "purge",
          scalingMode: "per batch",
          note: `Auto-generated by Conversion balance from unassigned residual pool: ${formatNumber(calc.wastePercent)}% of ${formatNumber(calc.pooledLeftover)} ${calc.fallbackUnit}.`
        });
      }
      if (block.groupId) {
        syncGroupReactionBalanceFromConversionBlock(block);
        ensureGroup(block.groupId).separationSimulator.pathway = { steps: [], selectedStepId: "", appliedAt: "" };
      }
      syncLegacyStreamLists(block);
      calc.detail.lastGeneratedSummary = `Balanced ${formatNumber(calc.percent)}% conversion: ${calc.reactantRows.filter(row => row.leftover > 0).length} residual reagent stream(s), ${calc.byproductRows.filter(row => String(row.name || "").trim() && row.mass > 0).length} coproduct/byproduct stream(s), ${calc.wasteMass > 0 ? "1" : "0"} waste stream.`;
      invalidateAiRefine();
      renderConversionModal();
      renderStepFlowInspector();
      if (typeof flowsheetUnitCategory === "function") {
        renderGroupFlow();
        renderStepAuditPanel();
      } else {
        renderAll();
      }
      renderExport();
    }

    function conversionNumber(value) {
      const n = parseFloat(String(value == null ? "" : value).replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    }

    function openConversionModal(blockId) {
      const block = state.blocks.find(item => item.id === blockId);
      if (!block) return;
      ensureBlockConditionFields(block);
      ensureConversionDetail(block);
      state.activeConversionBlockId = blockId;
      const modal = $("conversionModal");
      if (!modal) return;
      modal.hidden = false;
      renderConversionModal();
    }

    function closeConversionModal() {
      const modal = $("conversionModal");
      if (modal) modal.hidden = true;
      state.activeConversionBlockId = null;
    }

    function updateConversionPercent(block, rawValue) {
      const clamped = Math.max(0, Math.min(100, conversionNumber(rawValue)));
      ensureBlockConditionFields(block);
      block.conditions.conversion_yield = String(clamped);
      block.conditionUnits.conversion_yield = "%";
      syncGroupReactionBalanceFromConversionBlock(block);
      invalidateAiRefine();
      renderConversionModal();
      renderStepFlowInspector();
      renderExport();
    }

    function byproductColor(index) {
      const palette = ["#7c9cff", "#f2b84b", "#4bc9a8", "#e07a9e", "#9b8bf4"];
      return palette[index % palette.length];
    }

    function conversionStreamRowHtml(name, total, usedOrMade, leftover, unit, usedLabel) {
      const basis = total || (usedOrMade + leftover) || 1;
      const usedPct = basis ? Math.min(100, Math.max(0, (usedOrMade / basis) * 100)) : 0;
      const label = usedLabel === "made" ? "Made" : "Used";
      return `
        <div class="conversion-stream-row">
          <div class="conversion-stream-row-head">
            <strong>${escapeHtml(name)}</strong>
            <span class="muted small">${total ? total.toFixed(2) : "0"} ${escapeHtml(unit || "kg")} total</span>
          </div>
          <div class="conversion-bar">
            <span class="conversion-bar-seg used" style="width:${usedPct}%" title="${label}: ${usedOrMade.toFixed(2)} ${escapeAttr(unit || "kg")}"></span>
            <span class="conversion-bar-seg leftover" style="width:${100 - usedPct}%" title="Leftover: ${leftover.toFixed(2)} ${escapeAttr(unit || "kg")}"></span>
          </div>
          <div class="conversion-stream-row-numbers muted small">
            <span>${label}: ${usedOrMade.toFixed(2)} ${escapeHtml(unit || "kg")}</span>
            <span>Leftover: ${leftover.toFixed(2)} ${escapeHtml(unit || "kg")}</span>
          </div>
        </div>
      `;
    }

    function renderConversionModal() {
      const modal = $("conversionModal");
      const body = $("conversionModalBody");
      if (!modal || modal.hidden || !body) return;
      const block = state.blocks.find(item => item.id === state.activeConversionBlockId);
      if (!block) {
        body.innerHTML = `<div class="mfa-empty">No block selected.</div>`;
        return;
      }
      ensureBlockConditionFields(block);
      const calc = conversionCalculationModel(block);
      const { detail, percent, leftoverPercent, reactants, outputs, product, reactantRows, productQty, productMade, productShortfall, pooledLeftover, byproductRows, wastePercent, wasteMass, fallbackUnit } = calc;

      body.innerHTML = `
        <div class="conversion-modal-body">
          <div class="conversion-percent-row">
            <label>
              Conversion
              <div class="conversion-percent-controls">
                <input type="range" min="0" max="100" step="1" id="conversionPercentSlider" value="${percent}">
                <input type="number" min="0" max="100" step="1" id="conversionPercentNumber" value="${percent}">
                <span class="unit-badge">%</span>
              </div>
            </label>
            <div class="muted small">At ${percent}% conversion, ${percent}% of every reagent below reacts and ${percent}% of the product basis is made — the remaining ${leftoverPercent}% shows up as waste or byproducts.</div>
          </div>

          <div class="conversion-section">
            <div class="conversion-section-head">Reagents${!reactants.length ? ` <span class="muted small">(no input streams on this block yet — add them in MFA/streams)</span>` : ""}</div>
            ${reactantRows.map(row => conversionStreamRowHtml(row.stream.name || "(unnamed input)", row.qty, row.used, row.leftover, row.stream.unit, "used")).join("")}
          </div>

          <div class="conversion-section">
            <div class="conversion-section-head">
              <span>Product</span>
              <div class="conversion-product-tools">
              ${outputs.length ? `
                <select id="conversionProductSelect">
                  ${outputs.map(stream => `<option value="${escapeAttr(stream.id)}" ${product && stream.id === product.id ? "selected" : ""}>${escapeHtml(stream.name || stream.id)}</option>`).join("")}
                </select>
              ` : ""}
                <button type="button" class="mini-button" id="addConversionProduct">+ Product</button>
              </div>
            </div>
            ${product
              ? conversionStreamRowHtml(product.name || "(unnamed output)", productQty, productMade, productShortfall, product.unit, "made")
              : `<div class="muted small">No output stream to treat as the product yet — add one in MFA/streams.</div>`}
          </div>

          <div class="conversion-section">
            <div class="conversion-section-head">Waste / byproducts <span class="muted small">(split of the unconverted ${leftoverPercent}%, ${pooledLeftover.toFixed(2)} ${escapeHtml(fallbackUnit)})</span></div>
            <div class="conversion-summary-bar">
              ${byproductRows.map((row, i) => `<span class="conversion-bar-seg byproduct" style="width:${pooledLeftover ? (row.mass / pooledLeftover * 100) : 0}%; background:${byproductColor(i)}" title="${escapeAttr(row.name || "byproduct")}: ${row.mass.toFixed(2)} ${escapeAttr(fallbackUnit)}"></span>`).join("")}
              <span class="conversion-bar-seg waste" style="width:${pooledLeftover ? (wasteMass / pooledLeftover * 100) : 100}%" title="Waste: ${wasteMass.toFixed(2)} ${escapeAttr(fallbackUnit)}"></span>
            </div>
            <div class="conversion-byproduct-rows">
              ${detail.byproducts.map((bp, i) => `
                <div class="conversion-byproduct-row">
                  <span class="conversion-byproduct-swatch" style="background:${byproductColor(i)}"></span>
                  <input type="text" data-conversion-byproduct-name="${i}" value="${escapeAttr(bp.name)}" placeholder="byproduct name">
                  <input type="number" min="0" max="100" step="1" data-conversion-byproduct-percent="${i}" value="${escapeAttr(bp.percent)}">
                  <span class="unit-badge">% of leftover</span>
                  <span class="conversion-byproduct-mass muted small">${byproductRows[i].mass.toFixed(2)} ${escapeHtml(fallbackUnit)}</span>
                  <button type="button" class="mini-button" data-remove-conversion-byproduct="${i}">Remove</button>
                </div>
              `).join("")}
              <div class="conversion-byproduct-row conversion-byproduct-row-waste">
                <span class="conversion-byproduct-swatch waste"></span>
                <span class="muted small">Unassigned waste</span>
                <span class="muted small">${wastePercent}% of leftover</span>
                <span class="conversion-byproduct-mass muted small">${wasteMass.toFixed(2)} ${escapeHtml(fallbackUnit)}</span>
              </div>
            </div>
            <button type="button" class="mini-button" id="addConversionByproduct">+ Add byproduct</button>
          </div>

          <div class="row between" style="margin-top:12px">
            <span class="muted small">${escapeHtml(detail.lastGeneratedSummary || "Changes save automatically. Press Balance & Create Streams to write residuals into MFA and Lutze.")}</span>
            <button class="primary" id="conversionApplyBalance" ${reactants.length || product ? "" : "disabled"}>Balance &amp; Create Streams</button>
            <button class="primary" id="conversionModalDone">Done</button>
          </div>
        </div>
      `;

      $("conversionPercentSlider")?.addEventListener("input", event => updateConversionPercent(block, event.target.value));
      $("conversionPercentNumber")?.addEventListener("input", event => updateConversionPercent(block, event.target.value));
      $("conversionProductSelect")?.addEventListener("change", event => {
        const detail = ensureConversionDetail(block);
        detail.productStreamId = event.target.value;
        (block.streams || []).forEach(stream => {
          if (stream.id === detail.productStreamId) {
            stream.fate = "product";
            if (!stream.status || stream.status === "missing") stream.status = "estimated";
          }
        });
        syncLegacyStreamLists(block);
        syncGroupReactionBalanceFromConversionBlock(block);
        invalidateAiRefine();
        renderConversionModal();
      });
      $("addConversionProduct")?.addEventListener("click", () => {
        addConversionProductOutput(block);
        syncGroupReactionBalanceFromConversionBlock(block);
        invalidateAiRefine();
        renderConversionModal();
        renderStepFlowInspector();
        renderExport();
      });
      body.querySelectorAll("[data-conversion-byproduct-name]").forEach(input => {
        input.addEventListener("input", event => {
          const i = Number(event.target.dataset.conversionByproductName);
          ensureConversionDetail(block).byproducts[i].name = event.target.value;
          invalidateAiRefine();
        });
      });
      body.querySelectorAll("[data-conversion-byproduct-percent]").forEach(input => {
        input.addEventListener("input", event => {
          const i = Number(event.target.dataset.conversionByproductPercent);
          ensureConversionDetail(block).byproducts[i].percent = event.target.value;
          invalidateAiRefine();
          renderConversionModal();
        });
      });
      body.querySelectorAll("[data-remove-conversion-byproduct]").forEach(button => {
        button.addEventListener("click", () => {
          const i = Number(button.dataset.removeConversionByproduct);
          ensureConversionDetail(block).byproducts.splice(i, 1);
          invalidateAiRefine();
          renderConversionModal();
        });
      });
      $("addConversionByproduct")?.addEventListener("click", () => {
        ensureConversionDetail(block).byproducts.push({ id: `bp${Date.now().toString(36)}`, name: "", percent: "0" });
        invalidateAiRefine();
        renderConversionModal();
      });
      $("conversionApplyBalance")?.addEventListener("click", () => {
        applyConversionBalanceStreams(block);
      });
      $("conversionModalDone")?.addEventListener("click", () => {
        closeConversionModal();
        renderAll();
      });
    }

    function openSeparationSimulator(groupId) {
      const group = groupModel(groupId);
      if (!group) return;
      syncSeparationSimulatorSubstances(group);
      state.activeSeparationSimulatorGroupId = groupId;
      state.activeSeparationSimulatorMode = "full";
      ensureGroup(groupId).separationSimulator.tab = ensureGroup(groupId).separationSimulator.tab || "balance";
      const modal = $("separationSimulatorModal");
      if (!modal) return;
      document.body.classList.add("separation-simulator-open");
      modal.hidden = false;
      renderSeparationSimulatorModal();
    }

    function openLutzeReactionSeparation(groupId) {
      const group = groupModel(groupId);
      if (!group) return;
      syncSeparationSimulatorSubstances(group);
      state.activeSeparationSimulatorGroupId = groupId;
      state.activeSeparationSimulatorMode = "pathway";
      ensureGroup(groupId).separationSimulator.tab = "pathway";
      const modal = $("separationSimulatorModal");
      if (!modal) return;
      document.body.classList.add("separation-simulator-open");
      modal.hidden = false;
      renderSeparationSimulatorModal();
    }

    function closeSeparationSimulator() {
      const modal = $("separationSimulatorModal");
      if (modal) modal.hidden = true;
      document.body.classList.remove("separation-simulator-open");
      state.activeSeparationSimulatorGroupId = null;
      state.activeSeparationSimulatorMode = "full";
    }

    function renderSeparationSimulatorModal() {
      const modal = $("separationSimulatorModal");
      const body = $("separationSimulatorBody");
      if (!modal || modal.hidden || !body) return;
      const group = groupModel(state.activeSeparationSimulatorGroupId);
      if (!group) {
        body.innerHTML = `<div class="mfa-empty">No group selected.</div>`;
        return;
      }
      const groupState = ensureGroup(group.id);
      const simulator = groupState.separationSimulator;
      const model = separationSimulatorModel(group);
      const readiness = separationSimulatorReadiness(model);
      const pathwayMode = state.activeSeparationSimulatorMode === "pathway";
      const title = $("separationSimulatorTitle");
      const eyebrow = $("separationSimulatorEyebrow");
      if (title) title.textContent = pathwayMode ? "Lutze Reaction-Separation" : "Separation Simulator";
      if (eyebrow) eyebrow.textContent = pathwayMode ? "Substance pathway simulation" : "Optional KB3.1 sandbox";
      const tabs = pathwayMode
        ? [
          ["pathway", "1. Simulation"],
          ["substances", "2. Substances"],
          ["binary", "3. Binary Data"],
          ["balance", "4. Balance"]
        ]
        : [
          ["balance", "1. Reaction Balance"],
          ["substances", "2. Substances"],
          ["binary", "3. Binary Screening"],
          ["workup", "4. Workup Plan"],
          ["pathway", "5. Pathway Sandbox"],
          ["suggestions", "6. Suggestions"]
        ];
      body.innerHTML = `
        <div class="sep-sim-topline">
          <div>
            <div class="label">Group ${escapeHtml(group.id)}</div>
            <strong>${escapeHtml(group.task || "unassigned task")}</strong>
          </div>
          <div class="mfa-summary-strip">
            <span class="pill">${model.substances.length} substances</span>
            <span class="pill ${readiness.quantifiedCount === model.substances.length && model.substances.length ? "green" : "warn"}">${readiness.quantifiedCount}/${model.substances.length} quantified</span>
            <span class="pill blue">${model.pairs.length} pairs</span>
            <span class="pill ${readiness.actionableCount ? "green" : "warn"}">${readiness.actionableCount} actionable</span>
            <span class="pill">A1.1 + KB3.1</span>
          </div>
        </div>
        <div class="sep-sim-status ${escapeAttr(readiness.status)}">
          <strong>${escapeHtml(readiness.title)}</strong>
          <span>${escapeHtml(readiness.message)}</span>
        </div>
        ${paperComplianceBadgeHtml(model)}
        <div class="sep-sim-tabs" role="tablist" aria-label="Separation simulator tabs">
          ${tabs.map(([id, label]) => `<button class="sep-sim-tab ${simulator.tab === id ? "active" : ""}" data-sep-sim-tab="${id}">${label}</button>`).join("")}
        </div>
        ${simulator.tab === "balance" ? reactionBalanceHtml(group, model)
            : simulator.tab === "substances" ? separationSubstancesHtml(group, model)
              : simulator.tab === "binary" ? separationBinaryHtml(group, model)
                : simulator.tab === "workup" ? workupPlanHtml(group, model)
                  : simulator.tab === "pathway" ? separationPathwayHtml(group, model)
                    : separationSuggestionsHtml(group, model)}
      `;
      bindSeparationSimulatorControls(body, group.id);
    }

    function separationSimulatorReadiness(model) {
      return separationCore.separationSimulatorReadiness(model);
    }

    function paperComplianceBadgeHtml(model) {
      const hasPairs = model.pairs.length > 0;
      const kb31 = model.suggestions.filter(item => item.ruleId !== "NO-KB3.1-MATCH");
      const gated = kb31.filter(item => item.eligibility && item.selectable !== false);
      const translated = gated.filter(item => Array.isArray(item.unitCandidates) && item.unitCandidates.length);
      const guardStatus = gated.length ? "active" : "waiting";
      const item = (label, status, detail) => `
        <span class="paper-compliance-item ${escapeAttr(status)}" title="${escapeAttr(detail)}">
          <strong>${escapeHtml(label)}</strong>
          <em>${escapeHtml(status)}</em>
        </span>
      `;
      return `
        <div class="paper-compliance-badge" aria-label="Paper method compliance">
          <div class="paper-compliance-head">
            <div>
              <span class="label">Method Guard</span>
              <strong>${guardStatus === "active" ? "Gated suggestions active" : "Waiting for gated route"}</strong>
            </div>
            <span class="pill ${guardStatus === "active" ? "green" : "warn"}">${guardStatus === "active" ? `${gated.length} safe to test` : "not ready"}</span>
          </div>
          <div class="paper-compliance-guard">
            <span title="Only phase/phenomena-compatible KB3.1 routes can be tried.">gated routes only</span>
            <span title="The main flowsheet changes only after Apply Pathway.">manual apply</span>
            <span title="Editing a previous branch discards only downstream draft steps.">branch-safe edit</span>
            <span title="Current score is a screening score; EI ranking requires mass and energy balance.">EI not final</span>
          </div>
          <div class="paper-compliance-items">
            ${item("A1.1 binary matrix", hasPairs ? "done" : "waiting", hasPairs ? `${model.pairs.length} binary pair comparisons generated.` : "At least two substances are needed.")}
            ${item("KB3.1 PBB screen", kb31.length ? "partial" : "waiting", kb31.length ? `${kb31.length} PBB trigger(s) found from available properties.` : "No KB3.1 trigger yet.")}
            ${item("Feasibility gate", gated.length ? "done" : "waiting", gated.length ? `${gated.length} route(s) passed phase/phenomena checks.` : "No route has passed the gate yet.")}
            ${item("KB3.2 unit translation", translated.length ? "partial" : "waiting", translated.length ? `${translated.length} route(s) translated to candidate unit operations.` : "No translated unit candidates yet.")}
            ${item("EI ranking", "not implemented", "Enthalpy Index ranking requires mass and energy balance data.")}
          </div>
        </div>
      `;
    }

    function syncSeparationSimulatorSubstances(group) {
      const groupState = ensureGroup(group.id);
      const simulator = groupState.separationSimulator;
      const existing = new Map();
      simulator.substances.forEach(item => {
        const key = applyChemicalKey(item);
        if (key) existing.set(key, item);
      });
      inferredSeparationSubstances(group).forEach(candidate => {
        if (!candidate.name) return;
        const key = candidate.chemicalKey || canonicalChemicalKey(candidate.name);
        const current = existing.get(key);
        if (current) {
          current.role = preferredSubstanceRole(current.role, candidate.role);
          current.phase = mergeSubstanceText(current.phase, candidate.phase, "unknown");
          current.fate = candidate.residualOf ? candidate.fate : mergeSubstanceText(current.fate, candidate.fate, "unknown");
          mergeCandidateQuantityByChemicalState(current, candidate);
          current.source = mergeSubstanceText(current.source, candidate.source, "");
          current.residualOf = current.residualOf || candidate.residualOf || "";
          current.residualSourceId = current.residualSourceId || candidate.residualSourceId || "";
          current.chemicalKey = key;
          if (candidate.note && !String(current.note || "").includes(candidate.note)) {
            current.note = [current.note, candidate.note].filter(Boolean).join(" | ");
          }
          propagateSeparationChemicalProperties(group.id, current);
          return;
        }
        simulator.substances.push(normalizeSeparationSubstance({
          id: nextSeparationSubstanceId(simulator),
          ...candidate
        }, simulator.substances.length));
        existing.set(key, simulator.substances[simulator.substances.length - 1]);
      });
    }

    function inferredSeparationSubstances(group) {
      const ignored = /^(reaction mixture|crude reaction mixture|organic phase|aqueous phase|aqueous layer|organic layer|crude product|purified product|treated effluent|aqueous waste|column bottoms|heavies|uncaptured voc|wash water|water content|spent sieves|condensed solvent|recovered voc|heated reaction feed|washed organic phase|dried organic phase)$/i;
      const candidates = [];
      substanceSourceBlocksForGroup(group).forEach(block => {
        ensureBlockFlowFields(block);
        (block.streams || []).forEach(stream => {
          const name = cleanSubstanceName(stream.name);
          if (!name || ignored.test(name)) return;
          const residual = isUnreactedOrResidualName(stream.name);
          candidates.push({
            name,
            role: inferSubstanceRole(stream),
            phase: stream.phase || "unknown",
            fate: inferSubstanceFate(stream),
            quantity: String(stream.quantity || ""),
            unit: String(stream.unit || ""),
            residualOf: residual ? name : "",
            residualSourceId: residual ? stream.id || "" : "",
            chemicalKey: canonicalChemicalKey(name),
            source: `${block.id}/${stream.id || stream.role || "stream"}`,
            note: stream.note || "",
            ...streamChemicalPropertyPayload(stream)
          });
        });
      });
      return aggregateSeparationCandidates(candidates).slice(0, 12);
    }

    function streamChemicalPropertyPayload(stream) {
      return Object.fromEntries(streamChemicalPropertyFields
        .filter(field => field !== "density")
        .map(field => [field, String(stream?.[field] || "").trim()])
        .filter(([field, value]) => value && !(field === "thermalSensitivity" && value === "unknown")));
    }

    function streamChemicalPropertyPayloadWithDensity(stream) {
      return Object.fromEntries(streamChemicalPropertyFields
        .map(field => [field, String(stream?.[field] || "").trim()])
        .filter(([field, value]) => value && !(field === "thermalSensitivity" && value === "unknown")));
    }

    function mergeMissingStreamChemicalProperties(target, source, includeDensity = false) {
      if (!target || !source) return;
      const fields = streamChemicalPropertyFields.filter(field => includeDensity || field !== "density");
      fields.forEach(field => {
        const sourceValue = String(source[field] || "").trim();
        if (!sourceValue) return;
        const targetValue = String(target[field] || "").trim();
        if (!targetValue) target[field] = sourceValue;
      });
    }

    function aggregateSeparationCandidates(candidates) {
      const byName = new Map();
      candidates.forEach(candidate => {
        const key = candidate.chemicalKey || candidate.name.toLowerCase();
        if (!byName.has(key)) {
          byName.set(key, { ...candidate, sourceList: candidate.source ? [candidate.source] : [] });
          return;
        }
        const current = byName.get(key);
        current.role = preferredSubstanceRole(current.role, candidate.role);
        current.phase = mergeSubstanceText(current.phase, candidate.phase, "unknown");
        current.fate = candidate.residualOf ? candidate.fate : mergeSubstanceText(current.fate, candidate.fate, "unknown");
        mergeCandidateQuantityByChemicalState(current, candidate);
        if (candidate.note && !String(current.note || "").includes(candidate.note)) {
          current.note = [current.note, candidate.note].filter(Boolean).join(" | ");
        }
        mergeCandidateChemicalProperties(current, candidate);
        current.residualOf = current.residualOf || candidate.residualOf || "";
        current.residualSourceId = current.residualSourceId || candidate.residualSourceId || "";
        current.chemicalKey = current.chemicalKey || candidate.chemicalKey || key;
        if (candidate.source) current.sourceList.push(candidate.source);
        current.source = current.sourceList.join(", ");
      });
      return Array.from(byName.values()).map(({ sourceList, ...item }) => ({ ...item, source: sourceList.join(", ") }));
    }

    function mergeCandidateChemicalProperties(current, candidate) {
      separationSharedPropertyFields.forEach(field => {
        if (!String(current[field] || "").trim() && String(candidate[field] || "").trim()) {
          current[field] = String(candidate[field]);
        }
      });
    }

    function mergeCandidateQuantityByChemicalState(current, candidate) {
      if (candidate.residualOf) {
        current.quantity = candidate.quantity || current.quantity;
        current.unit = candidate.unit || current.unit;
        return;
      }
      if (current.residualOf) return;
      const mergedQuantity = mergeQuantity(current.quantity, current.unit, candidate.quantity, candidate.unit);
      current.quantity = mergedQuantity.quantity;
      current.unit = mergedQuantity.unit;
    }

    function preferredSubstanceRole(a, b) {
      const rank = { product: 8, solvent: 7, reactant: 6, byproduct: 5, catalyst: 4, impurity: 3, auxiliary: 2, unknown: 1 };
      return (rank[b] || 0) > (rank[a] || 0) ? b : a;
    }

    function mergeSubstanceText(a, b, empty = "") {
      const values = [a, b].filter(value => value && value !== empty);
      const unique = Array.from(new Set(values));
      if (!unique.length) return empty;
      if (unique.length === 1) return unique[0];
      if (unique.includes("LS")) return "LS";
      if (unique.includes("LL")) return "LL";
      if (unique.includes("VL")) return "VL";
      return unique[0];
    }

    function propagateSeparationChemicalProperties(groupId, sourceSubstance, changedField = "") {
      if (!sourceSubstance) return;
      if (changedField && !separationSharedPropertyFields.has(changedField)) return;
      const key = applyChemicalKey(sourceSubstance);
      if (!key) return;
      const simulator = ensureGroup(groupId).separationSimulator;
      simulator.substances.forEach(target => {
        if (!target || target.id === sourceSubstance.id) return;
        if (substanceChemicalKey(target) !== key && canonicalChemicalKey(target.name) !== key) return;
        target.chemicalKey = key;
        separationSharedPropertyFields.forEach(field => {
          const value = sourceSubstance[field];
          if (value !== undefined && value !== null && String(value).trim()) target[field] = value;
        });
      });
    }

    function mergeQuantity(aQty, aUnit, bQty, bUnit) {
      const a = parseStreamQuantity(aQty);
      const b = parseStreamQuantity(bQty);
      if (!String(aQty || "").trim()) return { quantity: String(bQty || ""), unit: String(bUnit || "") };
      if (!String(bQty || "").trim()) return { quantity: String(aQty || ""), unit: String(aUnit || "") };
      if (aUnit && bUnit && aUnit === bUnit && Number.isFinite(a) && Number.isFinite(b)) {
        return { quantity: formatNumber(a + b), unit: aUnit };
      }
      if (String(aQty).trim() === String(bQty).trim() && String(aUnit || "") === String(bUnit || "")) {
        return { quantity: String(aQty || ""), unit: String(aUnit || "") };
      }
      return {
        quantity: `${String(aQty || "").trim()} ${String(aUnit || "").trim()} + ${String(bQty || "").trim()} ${String(bUnit || "").trim()}`.replace(/\s+/g, " ").trim(),
        unit: ""
      };
    }

    function substanceSourceBlocksForGroup(group) {
      const groupIds = new Set([group.id]);
      state.links
        .filter(link => link.to === group.id && state.groups[link.from])
        .forEach(link => groupIds.add(link.from));
      return blocksInOrder().filter(block => groupIds.has(block.groupId));
    }

    function cleanSubstanceName(value) {
      const raw = String(value || "").toLowerCase();
      if (/charged reaction|reaction feed|reaction mixture|organic phase|aqueous phase|crude reaction|washed organic|dried organic/.test(raw)) return "";
      if (raw.includes("cyclohexane")) return "cyclohexane";
      if (raw.includes("octocrylene")) return "octocrylene";
      if (raw.includes("benzophenone")) return "benzophenone";
      if (raw.includes("2-ethylhexyl cyanoacetate")) return "2-ethylhexyl cyanoacetate";
      if (raw.includes("ammonium acetate")) return "ammonium acetate";
      if (raw.includes("water")) return "water";
      return String(value || "")
        .replace(/\([^)]*\)/g, "")
        .replace(/\b(crude|purified|recovered|condensed|unreacted|residual|vapor|rich|loss|purge|mixture|condensate|final|reactor|decanter|to vent)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function inferSubstanceRole(stream) {
      const text = `${stream.name || ""} ${stream.fate || ""} ${stream.note || ""}`.toLowerCase();
      if (/catalyst|nh4oac|ammonium acetate/.test(text)) return "catalyst";
      if (/solvent|cyclohexane/.test(text)) return "solvent";
      if (/water|by[- ]?product|condensation/.test(text)) return "byproduct";
      if (/product|octocrylene/.test(text)) return "product";
      if (stream.role === "input") return "reactant";
      if (stream.role === "waste") return "impurity";
      return "unknown";
    }

    function inferSubstanceFate(stream) {
      const fate = String(stream.fate || "").toLowerCase();
      if (fate.includes("product")) return "product";
      if (fate.includes("recover")) return "recycle";
      if (fate.includes("recycle")) return "recycle";
      if (fate.includes("vent")) return "vent";
      if (fate.includes("waste") || fate.includes("purge") || fate.includes("loss")) return "waste";
      if (fate.includes("intermediate")) return "intermediate";
      return "unknown";
    }

    function separationSimulatorModel(group) {
      return separationCore.separationSimulatorModel(ensureGroup(group.id).separationSimulator, streamPhases);
    }

    function reactionBalanceModel(group, model = separationSimulatorModel(group)) {
      return separationCore.reactionBalanceModel(group, model, ensureGroup(group.id).separationSimulator.reactionBalance);
    }

    function reactionConversionFraction(group, balance) {
      return separationCore.reactionConversionFraction(group, balance);
    }

    function reactionBalanceRow(item) {
      return separationCore.reactionBalanceRow(item);
    }

    function reactionMixtureRow(row, extent) {
      return separationCore.reactionMixtureRow(row, extent);
    }

    function workupPlanModel(group, model = separationSimulatorModel(group)) {
      return separationCore.workupPlanModel(group, model, ensureGroup(group.id).separationSimulator.reactionBalance);
    }

    function matchingSuggestionUnits(suggestions, targets, product, preferred) {
      return separationCore.matchingSuggestionUnits(suggestions, targets, product, preferred);
    }

    function workupStep(title, rows, units, reason) {
      return separationCore.workupStep(title, rows, units, reason);
    }

    function separationPairModel(a, b, simulator) {
      return separationCore.separationPairModel(a, b, simulator);
    }

    function separationPairKey(a, b) {
      return separationCore.separationPairKey(a, b);
    }

    function propertyRatio(a, b) {
      return separationCore.propertyRatio(a, b);
    }

    function numberFromText(value) {
      return separationCore.numberFromText(value);
    }

    function formatRatio(value) {
      return separationCore.formatRatio(value);
    }

    function separationSuggestionsForPair(pair) {
      return separationCore.separationSuggestionsForPair(pair);
    }

    function pairHasAnyData(pair) {
      return separationCore.pairHasAnyData(pair);
    }

    function separationMissingForPair(pair) {
      return separationCore.separationMissingForPair(pair);
    }

    function separationMissingForSuggestion(pair, rule) {
      return separationCore.separationMissingForSuggestion(pair, rule);
    }

    function separationSubstancesHtml(group, model) {
      const groupState = ensureGroup(group.id);
      const lookup = groupState.separationSimulator.lookupSummary;
      return `
        <section class="modal-section">
          <div class="sep-lookup-panel">
            <div>
              <div class="label">Substances</div>
              <div class="muted small">Quantities come from streams. PubChem only assists property completion; user-entered values are kept.</div>
            </div>
            <div class="sep-lookup-actions">
              <button data-sync-sep-substances="${escapeAttr(group.id)}">Sync From Streams</button>
              <button data-pubchem-autofill="${escapeAttr(group.id)}" title="Fetch basic PubChem properties for all named substances">Autofill PubChem</button>
              <button data-load-sep-demo="${escapeAttr(group.id)}" title="Replace simulator input with a two-component cyclohexane/octocrylene demo">Load Simple Demo</button>
              <button data-load-methylbenzene-demo="${escapeAttr(group.id)}" title="Load a four-component reaction-separation demo with three residual reagents">3-Reagent Demo</button>
              <button class="primary" data-add-sep-substance="${escapeAttr(group.id)}">Add Substance</button>
            </div>
            <div class="sep-lookup-summary ${escapeAttr(lookup.status)}">
              <strong>${escapeHtml(lookup.status === "idle" ? "Property source" : lookup.status)}</strong>
              <span>${escapeHtml(lookup.message || "PubChem can prefill MW, formula, SMILES, XLogP, exact mass, and best-effort Tm/Tb/Pvap annotations.")}</span>
            </div>
          </div>
          <div class="sep-substance-grid">
            ${groupState.separationSimulator.substances.length ? groupState.separationSimulator.substances.map(item => separationSubstanceRowHtml(group.id, item)).join("") : `<div class="mfa-empty">No substances yet. Sync from streams or add them manually.</div>`}
          </div>
        </section>
      `;
    }

    function loadSimpleSeparationDemo(groupId) {
      const simulator = ensureGroup(groupId).separationSimulator;
      simulator.substances = [
        normalizeSeparationSubstance({
          id: "CS1",
          name: "cyclohexane",
          role: "solvent",
          phase: "L",
          fate: "recycle",
          quantity: "3.50",
          unit: "kg",
          source: "simple demo",
          thermalSensitivity: "low",
          mw: "84.16",
          tb: "353.9",
          tm: "279.7",
          pvap: "13000",
          solubilityParameter: "16.8",
          molarVolume: "108.7",
          molecularDiameter: "0.60",
          kineticDiameter: "0.60",
          note: "volatile solvent demo component"
        }),
        normalizeSeparationSubstance({
          id: "CS2",
          name: "octocrylene",
          role: "product",
          phase: "L",
          fate: "product",
          quantity: "3.60",
          unit: "kg",
          source: "simple demo",
          thermalSensitivity: "high",
          mw: "361.5",
          tb: "480",
          tm: "280",
          pvap: "10",
          solubilityParameter: "19.2",
          molarVolume: "310",
          molecularDiameter: "1.25",
          kineticDiameter: "1.25",
          note: "heavy heat-sensitive product demo component"
        })
      ];
      simulator.pairInsights = {
        [separationPairKey("CS1", "CS2")]: {
          relativeVolatility: "40",
          azeotrope: "no",
          pressureSensitive: "no",
          miscibilityGap: "no",
          eutectic: "no",
          note: "Simple demo: large volatility contrast between solvent and product."
        }
      };
      simulator.tab = "suggestions";
      simulator.notes = "Simple demo loaded: volatile cyclohexane separated from heavy heat-sensitive octocrylene.";
    }

    function loadTripleReactantSeparationDemo(groupId) {
      const simulator = ensureGroup(groupId).separationSimulator;
      simulator.substances = [
        normalizeSeparationSubstance({
          id: "CS1",
          name: "benzyl alcohol",
          role: "reactant",
          phase: "L",
          fate: "recover",
          quantity: "1.00",
          unit: "kg",
          stoichCoeff: "1",
          source: "3-reagent demo",
          pubchemCid: "244",
          pubchemUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/244",
          molecularFormula: "C7H8O",
          canonicalSmiles: "C1=CC=C(C=C1)CO",
          xlogp: "1.1",
          exactMass: "108.0575",
          propertySource: "demo values for method testing",
          thermalSensitivity: "low",
          mw: "108.14",
          tb: "478.15",
          tm: "258.15",
          pvap: "13",
          solubilityParameter: "24.8",
          molarVolume: "103.8",
          molecularDiameter: "0.62",
          kineticDiameter: "0.62",
          note: "Residual benzyl alcohol after 90% yield; close-boiling/affinity-sensitive recovery candidate."
        }),
        normalizeSeparationSubstance({
          id: "CS2",
          name: "acetic anhydride",
          role: "reactant",
          phase: "L",
          fate: "recover",
          quantity: "0.95",
          unit: "kg",
          stoichCoeff: "1",
          source: "3-reagent demo",
          pubchemCid: "7918",
          pubchemUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/7918",
          molecularFormula: "C4H6O3",
          canonicalSmiles: "CC(=O)OC(=O)C",
          xlogp: "-0.3",
          exactMass: "102.0317",
          propertySource: "demo values for method testing",
          thermalSensitivity: "medium",
          mw: "102.09",
          tb: "412.95",
          tm: "200.15",
          pvap: "520",
          solubilityParameter: "20.3",
          molarVolume: "94.5",
          molecularDiameter: "0.54",
          kineticDiameter: "0.54",
          note: "Residual acylating reagent; more volatile than product and recover/purge candidate."
        }),
        normalizeSeparationSubstance({
          id: "CS3",
          name: "triethylamine",
          role: "reactant",
          phase: "L",
          fate: "recover",
          quantity: "1.10",
          unit: "kg",
          stoichCoeff: "1",
          source: "3-reagent demo",
          pubchemCid: "8471",
          pubchemUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/8471",
          molecularFormula: "C6H15N",
          canonicalSmiles: "CCN(CC)CC",
          xlogp: "1.4",
          exactMass: "101.1204",
          propertySource: "demo values for method testing",
          thermalSensitivity: "low",
          mw: "101.19",
          tb: "362.25",
          tm: "158.35",
          pvap: "7200",
          solubilityParameter: "18.7",
          molarVolume: "139.0",
          molecularDiameter: "0.68",
          kineticDiameter: "0.68",
          note: "Volatile base/reagent residue; should be proposed early for recovery."
        }),
        normalizeSeparationSubstance({
          id: "CS4",
          name: "benzyl acetate",
          role: "product",
          phase: "L",
          fate: "product",
          quantity: "",
          unit: "kg",
          stoichCoeff: "1",
          source: "3-reagent demo",
          pubchemCid: "8785",
          pubchemUrl: "https://pubchem.ncbi.nlm.nih.gov/compound/8785",
          molecularFormula: "C9H10O2",
          canonicalSmiles: "CC(=O)OCC1=CC=CC=C1",
          xlogp: "1.96",
          exactMass: "150.0681",
          propertySource: "demo values for method testing",
          thermalSensitivity: "medium",
          mw: "150.18",
          tb: "485.95",
          tm: "221.15",
          pvap: "20",
          solubilityParameter: "19.1",
          molarVolume: "148.0",
          molecularDiameter: "0.72",
          kineticDiameter: "0.72",
          note: "Main product. Product mass is calculated from limiting reagent and conversion/yield."
        })
      ];
      simulator.reactionBalance = normalizeReactionBalance({
        conversionPercent: "90",
        basis: "yield",
        limiting: "CS1",
        mainProductId: "CS4",
        note: "Three-reagent demo for pathway testing: benzyl acetate product formed from limiting benzyl alcohol; residual reagents are separated sequentially."
      });
      simulator.pairInsights = {
        [separationPairKey("CS1", "CS4")]: {
          relativeVolatility: "1.4",
          azeotrope: "no",
          pressureSensitive: "no",
          miscibilityGap: "no",
          eutectic: "no",
          note: "Benzyl alcohol/product is a close-boiling residue pair; affinity or careful polishing may be needed."
        },
        [separationPairKey("CS2", "CS4")]: {
          relativeVolatility: "6",
          azeotrope: "no",
          pressureSensitive: "no",
          miscibilityGap: "no",
          eutectic: "no",
          note: "Acetic anhydride is more volatile than benzyl acetate."
        },
        [separationPairKey("CS3", "CS4")]: {
          relativeVolatility: "25",
          azeotrope: "no",
          pressureSensitive: "no",
          miscibilityGap: "no",
          eutectic: "no",
          note: "Triethylamine is the most volatile residual reagent and should usually be recovered early."
        }
      };
      simulator.lookupSummary = normalizeLookupSummary({
        status: "done",
        message: "Loaded three-reagent reaction-separation demo with product and residual reagent properties.",
        lastUpdated: new Date().toISOString()
      });
      simulator.pathway = { steps: [], selectedStepId: "", appliedAt: "" };
      simulator.tab = "pathway";
      simulator.notes = "Three-reagent demo loaded: residual triethylamine, acetic anhydride, and benzyl alcohol separated from benzyl acetate.";
    }

    function loadMethylbenzeneSeparationDemo(groupId) {
      loadTripleReactantSeparationDemo(groupId);
    }

    function separationSubstanceRowHtml(groupId, substance) {
      const s = normalizeSeparationSubstance(substance);
      return `
        <article class="sep-substance-card">
          <div class="sep-card-head">
            <input data-sep-sub-field="name" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(s.name)}" placeholder="compound name">
            <div class="sep-card-actions">
              <button data-fetch-pubchem="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" title="Fetch basic molecular properties from PubChem">Fetch</button>
              <button class="delete-stream" data-remove-sep-substance="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" title="Remove substance">x</button>
            </div>
          </div>
          ${separationSubstanceBadgesHtml(s)}
          <div class="sep-substance-meta">
            <label><span class="label">Role</span><select data-sep-sub-field="role" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationSubstanceRoles, s.role)}</select></label>
            <label><span class="label">Phase</span><select data-sep-sub-field="phase" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}">${phaseOptionHtml(s.phase)}</select></label>
            <label><span class="label">Fate</span><select data-sep-sub-field="fate" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationSubstanceFates, s.fate)}</select></label>
            <label><span class="label">Quantity</span><input data-sep-sub-field="quantity" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(s.quantity)}" placeholder="amount"></label>
            <label><span class="label">Unit</span><input data-sep-sub-field="unit" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(s.unit)}" placeholder="kg, mol..."></label>
            <label><span class="label">Stoich</span><input data-sep-sub-field="stoichCoeff" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(s.stoichCoeff)}" placeholder="1"></label>
            <label><span class="label">Thermal</span><select data-sep-sub-field="thermalSensitivity" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationThermalOptions, s.thermalSensitivity)}</select></label>
          </div>
          <div class="sep-property-grid">
            ${separationPurePropertyDefs.map(def => `
              <label class="sep-property-cell">
                <span class="label">${escapeHtml(def.label)}${def.unit ? ` <em>${escapeHtml(def.unit)}</em>` : ""}</span>
                <input data-sep-sub-field="${escapeAttr(def.id)}" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(s[def.id])}" placeholder="${escapeAttr(def.thresholdLabel)}">
              </label>
            `).join("")}
          </div>
          ${s.source || s.pubchemCid || s.molecularFormula ? `<div class="sep-source-line">
            ${s.source ? `<span>Stream: ${escapeHtml(s.source)}</span>` : ""}
            ${s.pubchemCid ? `<span class="pubchem">PubChem CID: ${escapeHtml(s.pubchemCid)}</span>` : ""}
            ${s.molecularFormula ? `<span>Formula: ${escapeHtml(s.molecularFormula)}</span>` : ""}
            ${s.xlogp ? `<span>XLogP: ${escapeHtml(s.xlogp)}</span>` : ""}
            ${s.propertySource ? `<span>Source: ${escapeHtml(s.propertySource)}</span>` : ""}
          </div>` : ""}
          <input data-sep-sub-field="note" data-sep-sub-id="${escapeAttr(s.id)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(s.note)}" placeholder="source, assumption, property method...">
        </article>
      `;
    }

    function separationSubstanceBadgesHtml(substance) {
      const residualOf = String(substance.residualOf || "").trim();
      const key = substanceChemicalKey(substance);
      const badges = [];
      if (residualOf) {
        badges.push(`<span class="pill warn">unreacted residual</span>`);
        badges.push(`<span class="pill blue">same properties as ${escapeHtml(residualOf)}</span>`);
        badges.push(`<span class="pill green">separate, recover or purge</span>`);
      } else if (key && key !== canonicalChemicalKey(substance.name)) {
        badges.push(`<span class="pill blue">properties linked to ${escapeHtml(key)}</span>`);
      }
      return badges.length ? `<div class="sep-substance-tags">${badges.join("")}</div>` : "";
    }

    function reactionBalanceHtml(group, model) {
      const result = reactionBalanceModel(group, model);
      const balance = result.balance;
      const reactantOptions = ["auto", ...result.rows.filter(row => row.role === "reactant").map(row => row.id)];
      const productRows = result.rows.filter(row => row.role === "product" || row.role === "coproduct");
      const productOptions = ["auto", ...productRows.map(row => row.id)];
      return `
        <section class="modal-section">
          <div>
            <div class="label">Reaction Balance</div>
            <div class="muted small">Select the main product, add co-products if needed, then conversion/yield estimates unreacted residuals for waste or recovery handling.</div>
          </div>
          <div class="sep-balance-controls">
            <label><span class="label">Conversion / yield %</span><input data-reaction-balance-field="conversionPercent" data-sep-group="${escapeAttr(group.id)}" value="${escapeAttr(balance.conversionPercent)}" placeholder="auto from group, e.g. 90"></label>
            <label><span class="label">Basis</span><select data-reaction-balance-field="basis" data-sep-group="${escapeAttr(group.id)}">${optionHtml(["conversion", "yield", "assumption"], balance.basis)}</select></label>
            <label><span class="label">Limiting reagent</span><select data-reaction-balance-field="limiting" data-sep-group="${escapeAttr(group.id)}">${optionHtml(reactantOptions, balance.limiting || "auto")}</select></label>
            <label><span class="label">Main product</span><select data-reaction-balance-field="mainProductId" data-sep-group="${escapeAttr(group.id)}">${reactionProductOptionHtml(productOptions, productRows, balance.mainProductId || "auto")}</select></label>
          </div>
          <div class="sep-balance-product-actions">
            <button type="button" data-add-reaction-product="${escapeAttr(group.id)}">+ Add Main Product</button>
            <button type="button" data-add-reaction-coproduct="${escapeAttr(group.id)}">+ Add Co-product</button>
            <span class="muted small">${productRows.length ? `${productRows.length} product-like substance${productRows.length === 1 ? "" : "s"} available` : "No product selected yet; add one or sync from output streams."}</span>
          </div>
          <div class="sep-result-summary">
            <span><strong>${Number.isFinite(result.conversion) ? `${formatNumber(result.conversion * 100)}%` : "missing"}</strong> conversion/yield</span>
            <span><strong>${result.limiting ? escapeHtml(result.limiting.name) : "missing"}</strong> limiting reagent</span>
            <span><strong>${result.mainProduct ? escapeHtml(result.mainProduct.name) : "missing"}</strong> main product</span>
            <span><strong>${result.status}</strong> balance status</span>
          </div>
          ${reactionBalanceRecognitionHtml(result)}
          ${result.issues.length ? `<div class="sep-sim-status partial"><strong>Missing balance inputs</strong><span>${result.issues.map(escapeHtml).join(", ")}</span></div>` : ""}
          ${result.residualRows.length ? `
            <div class="sep-residual-box">
              <div>
                <strong>Unreacted residuals</strong>
                <span class="muted small">${escapeHtml(formatResidualSummary(result))}</span>
              </div>
              <button type="button" class="primary-mini" data-apply-residual-waste="${escapeAttr(group.id)}">Apply as waste/recovery streams</button>
            </div>
          ` : ""}
          <div class="sep-balance-table">
            ${result.rows.map(row => `
              <div class="sep-balance-row">
                <div>
                  <strong>${escapeHtml(row.name)}</strong>
                  <span class="muted small">${escapeHtml(row.role)} · stoich ${escapeHtml(row.stoich || "-")}</span>
                </div>
                <span>${formatReactionMass(row.initialMassKg)}</span>
                <span>${formatReactionMass(row.finalMassKg)}</span>
                <span class="pill ${row.confidence === "estimated" ? "blue" : "warn"}">${escapeHtml(row.confidence)}</span>
                <span class="muted small">${escapeHtml(row.basis)}</span>
              </div>
            `).join("")}
          </div>
          <label><span class="label">Balance note</span><input data-reaction-balance-field="note" data-sep-group="${escapeAttr(group.id)}" value="${escapeAttr(balance.note)}" placeholder="stoichiometry assumption, excess reagent, selectivity note..."></label>
        </section>
      `;
    }

    function formatReactionMass(value) {
      return Number.isFinite(value) ? `${formatNumber(value)} kg` : "missing";
    }

    function reactionProductOptionHtml(options, rows, selected) {
      return options.map(value => {
        const row = rows.find(item => item.id === value);
        const label = value === "auto" ? "auto" : `${row?.name || value}${row?.role === "coproduct" ? " (co-product)" : ""}`;
        return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
      }).join("");
    }

    function formatResidualSummary(result) {
      const percent = Number.isFinite(result.conversion) ? formatNumber(Math.max(0, 100 - result.conversion * 100)) : "unknown";
      const parts = result.residualRows
        .slice(0, 3)
        .map(row => `${row.name}: ${formatReactionMass(row.finalMassKg)}`);
      return `${percent}% unconverted basis; ${parts.join(", ")}${result.residualRows.length > 3 ? "..." : ""}`;
    }

    function reactionBalanceRecognitionHtml(result) {
      const mainProductRows = result.mainProduct ? [result.mainProduct] : [];
      const coproductRows = result.rows.filter(row => row.role === "coproduct");
      const byproductRows = result.rows.filter(row => row.role === "byproduct");
      const reactantRows = result.rows.filter(row => row.role === "reactant");
      return `
        <div class="sep-recognition-grid">
          ${reactionBalanceRecognitionColumnHtml("Main Product", mainProductRows, "product", "selected product basis")}
          ${reactionBalanceRecognitionColumnHtml("Co-products / Byproducts", [...coproductRows, ...byproductRows], "byproduct", "formed or removed separately")}
          ${reactionBalanceRecognitionColumnHtml("Reactants", reactantRows, "reactant", "unconverted fraction can become waste/recovery")}
        </div>
      `;
    }

    function reactionBalanceRecognitionColumnHtml(title, rows, tone, empty) {
      return `
        <div class="sep-recognition-column ${escapeAttr(tone)}">
          <div class="sep-recognition-title">${escapeHtml(title)}</div>
          ${rows.length ? rows.map(row => reactionBalanceRecognitionItemHtml(row)).join("") : `<div class="muted small">${escapeHtml(empty)}</div>`}
        </div>
      `;
    }

    function reactionBalanceRecognitionItemHtml(row) {
      const isResidual = row.role === "reactant" && Number.isFinite(row.finalMassKg) && row.finalMassKg > 0.000001;
      const amount = isResidual
        ? `${formatReactionMass(row.finalMassKg)} unreacted`
        : `${formatReactionMass(row.finalMassKg)} final`;
      return `
        <div class="sep-recognition-item role-${escapeAttr(row.role)}">
          <div>
            <strong>${escapeHtml(row.name || "unnamed substance")}</strong>
            <span class="muted small">${escapeHtml(row.role)} · ${escapeHtml(row.basis)}</span>
          </div>
          <span class="pill ${isResidual ? "warn" : row.role === "product" || row.role === "coproduct" ? "green" : "blue"}">${escapeHtml(amount)}</span>
        </div>
      `;
    }

    function addReactionProductSubstance(groupId, role) {
      const simulator = ensureGroup(groupId).separationSimulator;
      pushUndo();
      const productName = role === "coproduct" ? "" : inferMainProductNameFromOutputs(groupModel(groupId)) || "";
      const existing = productName
        ? simulator.substances.find(item => item.name.trim().toLowerCase() === productName.trim().toLowerCase())
        : null;
      if (existing) {
        existing.role = role;
        existing.fate = "product";
        applyChemicalKey(existing);
        if (role === "product") simulator.reactionBalance.mainProductId = existing.id;
        simulator.tab = "balance";
        invalidateAiRefine();
        renderSeparationSimulatorModal();
        renderExport();
        return;
      }
      const substance = normalizeSeparationSubstance({
        id: nextSeparationSubstanceId(simulator),
        name: productName,
        role,
        fate: "product",
        phase: inferMainProductPhaseFromOutputs(groupModel(groupId)) || "unknown",
        unit: "kg",
        chemicalKey: canonicalChemicalKey(productName),
        source: productName ? "group output stream" : "manual reaction balance",
        note: role === "coproduct" ? "Co-product added manually in reaction balance." : "Main product added from reaction balance."
      }, simulator.substances.length);
      simulator.substances.push(substance);
      if (role === "product") simulator.reactionBalance.mainProductId = substance.id;
      simulator.tab = "balance";
      invalidateAiRefine();
      renderSeparationSimulatorModal();
      renderExport();
    }

    function inferMainProductNameFromOutputs(group) {
      if (!group) return "";
      const outputs = group.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams.filter(stream => stream.role === "output" && String(stream.name || "").trim());
      });
      const product = outputs.find(stream => /product|final|purified/i.test(`${stream.name} ${stream.fate} ${stream.timing}`)) || outputs[0];
      return product?.name || "";
    }

    function inferMainProductPhaseFromOutputs(group) {
      if (!group) return "";
      const outputs = group.blocks.flatMap(block => {
        ensureBlockFlowFields(block);
        return block.streams.filter(stream => stream.role === "output" && String(stream.phase || "").trim() && stream.phase !== "unknown");
      });
      return outputs[0]?.phase || "";
    }

    function applyReactionResidualWasteStreams(groupId) {
      const group = groupModel(groupId);
      if (!group?.blocks?.length) return;
      const result = reactionBalanceModel(group);
      if (!result.residualRows.length) return;
      pushUndo();
      const target = group.blocks[group.blocks.length - 1];
      ensureBlockFlowFields(target);
      result.residualRows.forEach(row => {
        const name = `unreacted ${row.name}`;
        const existing = target.streams.some(stream => stream.role === "waste" && stream.name.trim().toLowerCase() === name.toLowerCase());
        if (existing) return;
        const stream = createStream("waste", {
          id: nextStreamId(target),
          name,
          quantity: formatNumber(row.finalMassKg),
          unit: "kg",
          phase: row.phase || "unknown",
          status: "calculated",
          timing: "waste purge",
          fate: "waste",
          scalingMode: "per batch",
          note: `Auto-generated from reaction balance: ${Number.isFinite(result.conversion) ? formatNumber(result.conversion * 100) : "unknown"}% conversion/yield leaves residual ${row.name}. Treat as waste or recovery candidate.`
        });
        target.streams.push(stream);
      });
      syncLegacyStreamLists(target);
      invalidateAiRefine();
      renderAll();
    }

    function workupPlanHtml(group, model) {
      const plan = workupPlanModel(group, model);
      return `
        <section class="modal-section">
          <div>
            <div class="label">Workup Plan</div>
            <div class="muted small">Preliminary sequence based on reaction residue estimate, roles, quantity, thermal sensitivity, and binary separation suggestions.</div>
          </div>
          ${plan.balance.issues.length ? `<div class="sep-sim-status partial"><strong>Plan is assumption-heavy</strong><span>${plan.balance.issues.map(escapeHtml).join(", ")}</span></div>` : ""}
          <div class="sep-workup-list">
            ${plan.steps.length ? plan.steps.map((step, index) => `
              <article class="sep-workup-step">
                <div class="sep-workup-index">${index + 1}</div>
                <div>
                  <div class="sep-binary-head">
                    <strong>${escapeHtml(step.title)}</strong>
                    <span>${step.rows.map(row => `<span class="pill">${escapeHtml(row.name)}</span>`).join("")}</span>
                  </div>
                  <div class="predictor-reason">${escapeHtml(step.reason)}</div>
                  <div class="sep-unit-actions">
                    ${step.units.map(unit => `<button data-sep-apply-candidate="${escapeAttr(unit)}" data-sep-group="${escapeAttr(group.id)}">${escapeHtml(unit)}</button>`).join("")}
                  </div>
                </div>
              </article>
            `).join("") : `<div class="mfa-empty">Add roles, quantities, MW, and conversion/yield to generate a preliminary workup sequence.</div>`}
          </div>
        </section>
      `;
    }

    function separationBinaryHtml(group, model) {
      return `
        <section class="modal-section">
          <div>
            <div class="label">Binary Screening Matrix</div>
            <div class="muted small">Ratios are computed as max(A,B)/min(A,B), following A1.1. Binary insights are entered per pair because azeotrope, miscibility gap, eutectic, and relative volatility are mixture properties.</div>
          </div>
          <div class="sep-binary-table">
            ${model.pairs.length ? model.pairs.map(pair => separationBinaryRowHtml(group.id, pair)).join("") : `<div class="mfa-empty">At least two confirmed substances are required.</div>`}
          </div>
        </section>
      `;
    }

    function separationBinaryRowHtml(groupId, pair) {
      const shownRatios = ["mw", "tb", "tm", "pvap", "solubilityParameter", "molecularDiameter"]
        .map(id => {
          const def = separationPurePropertyDefs.find(item => item.id === id);
          return `<span class="pill ${Number.isFinite(pair.ratios[id]) ? "blue" : ""}">${escapeHtml(def.label)} ${escapeHtml(formatRatio(pair.ratios[id]))}</span>`;
        }).join("");
      const variants = binaryRouteVariants(groupId, pair);
      return `
        <article class="sep-binary-row">
          <div class="sep-binary-head">
            <strong>${escapeHtml(pair.a.name)} / ${escapeHtml(pair.b.name)}</strong>
            <span>${shownRatios}</span>
          </div>
          <div class="sep-binary-inputs">
            <label><span class="label">Relative volatility</span><input data-sep-pair-field="relativeVolatility" data-sep-pair-key="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(pair.insights.relativeVolatility)}" placeholder="alpha"></label>
            <label><span class="label">Azeotrope</span><select data-sep-pair-field="azeotrope" data-sep-pair-key="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationBinaryInsightOptions, pair.insights.azeotrope)}</select></label>
            <label><span class="label">Pressure sensitive</span><select data-sep-pair-field="pressureSensitive" data-sep-pair-key="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationBinaryInsightOptions, pair.insights.pressureSensitive)}</select></label>
            <label><span class="label">Miscibility gap</span><select data-sep-pair-field="miscibilityGap" data-sep-pair-key="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationBinaryInsightOptions, pair.insights.miscibilityGap)}</select></label>
            <label><span class="label">Eutectic</span><select data-sep-pair-field="eutectic" data-sep-pair-key="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}">${optionHtml(separationBinaryInsightOptions, pair.insights.eutectic)}</select></label>
          </div>
          <input data-sep-pair-field="note" data-sep-pair-key="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}" value="${escapeAttr(pair.insights.note)}" placeholder="binary VLE/LLE/SLE note or source">
          <div class="sep-route-variants">
            <div class="sep-route-title">
              <strong>Route variants</strong>
              <span class="muted small">Possible graph changes, not applied automatically.</span>
            </div>
            ${variants.length ? variants.map(variant => `
              <article class="sep-route-card ${escapeAttr(variant.level)}">
                <div class="sep-route-card-head">
                  <strong>${escapeHtml(variant.title)}</strong>
                  <span class="pill ${variant.level === "supported" ? "green" : variant.level === "partial" ? "blue" : "warn"}">${escapeHtml(variant.level)} · ${escapeHtml(formatMathScore(variant.score))}</span>
                </div>
                <div class="sep-route-mini-flow" aria-label="Route preview">
                  <span>${escapeHtml(groupId)}</span>
                  <span>-></span>
                  <span>${escapeHtml(variant.flowLabel || "separator")}</span>
                  <span>-></span>
                  <span>downstream</span>
                </div>
                <div class="sep-route-flow">${escapeHtml(variant.graphPreview)}</div>
                ${pbbTranslationSummaryHtml(variant)}
                ${binaryMathSummaryHtml(variant)}
                <div class="predictor-missing">
                  ${variant.drivers.map(driver => `<span class="pill blue">${escapeHtml(driver)}</span>`).join("")}
                  ${variant.missing.map(item => `<span class="pill warn">${escapeHtml(item)}</span>`).join("")}
                </div>
                <div class="sep-unit-actions">
                  ${variant.units.map(unit => `<button data-sep-apply-candidate="${escapeAttr(unit)}" data-sep-group="${escapeAttr(groupId)}" ${variant.selectable === false ? "disabled" : ""}>${escapeHtml(unit)}</button>`).join("")}
                  <button class="primary-mini" data-sep-insert-route="${escapeAttr(variant.id)}" data-sep-route-pair="${escapeAttr(pair.key)}" data-sep-group="${escapeAttr(groupId)}" ${variant.selectable === false ? "disabled" : ""}>Insert route</button>
                </div>
              </article>
            `).join("") : `<div class="mfa-empty">Add BP/Pvap, MW/size, miscibility, or affinity data to preview alternative graph routes.</div>`}
          </div>
        </article>
      `;
    }

    function binaryRouteVariants(groupId, pair) {
      return separationCore.binaryRouteVariants(groupId, pair);
    }

    function strongestSuggestionLevel(items) {
      return separationCore.strongestSuggestionLevel(items);
    }

    function prioritizedUnits(items, preferred) {
      return separationCore.prioritizedUnits(items, preferred);
    }

    function uniqueFlat(groups) {
      return separationCore.uniqueFlat(groups);
    }

    function preferredVolatileComponent(pair) {
      return separationCore.preferredVolatileComponent(pair);
    }

    function preferredSolidComponent(pair) {
      return separationCore.preferredSolidComponent(pair);
    }

    function preferredLargeComponent(pair) {
      return separationCore.preferredLargeComponent(pair);
    }

    function routeVariantId(title) {
      return separationCore.routeVariantId(title);
    }

    function routeVariantPhenomena(variant) {
      return separationCore.routeVariantPhenomena(variant);
    }

    function routeVariantBehavior(variant) {
      return separationCore.routeVariantBehavior(variant);
    }

    function formatMathScore(score) {
      const value = Number(score);
      return Number.isFinite(value) && value > 0 ? `screening ${Math.round(value)}/100` : "screening pending";
    }

    function binaryMathSummaryHtml(variant) {
      const comparisons = Array.isArray(variant.comparisons) ? variant.comparisons.filter(item => item && item.label).slice(0, 4) : [];
      if (!comparisons.length) return "";
      return `
        <div class="binary-math-summary">
          <span class="binary-math-score">${escapeHtml(formatMathScore(variant.score))}</span>
          ${comparisons.map(comparison => `
            <span class="binary-math-chip ${comparison.met ? "met" : "weak"}" title="${escapeAttr(comparison.basis || "binary comparison")}">
              ${escapeHtml(comparison.label)} ${escapeHtml(formatMathValue(comparison.value))} ${escapeHtml(comparison.operator || ">=")} ${escapeHtml(formatMathValue(comparison.threshold))}
            </span>
          `).join("")}
        </div>
      `;
    }

    function pbbTranslationSummaryHtml(item) {
      const pbbs = Array.isArray(item.pbb) && item.pbb.length ? item.pbb : Array.isArray(item.principlePbbs) ? item.principlePbbs : [];
      const units = Array.isArray(item.unitCandidates) ? item.unitCandidates.slice(0, 4) : [];
      if (!pbbs.length && !units.length && !item.possibleOutletPhase && !item.agentAdded) return "";
      return `
        <div class="sep-paper-chain">
          <div>
            <span class="label">KB3.1 PBBs</span>
            <span>${pbbs.length ? pbbs.map(code => `<span class="pill blue">${escapeHtml(code)}</span>`).join("") : `<span class="pill warn">PBB pending</span>`}</span>
          </div>
          <div>
            <span class="label">KB3.2 Units</span>
            <span>${units.length ? units.map(candidate => `<span class="pill green" title="${escapeAttr([candidate.source, candidate.feedPhase ? `feed ${candidate.feedPhase}` : "", candidate.outletPhase ? `outlet ${candidate.outletPhase}` : ""].filter(Boolean).join("; "))}">${escapeHtml(candidate.name)}</span>`).join("") : `<span class="pill warn">translation pending</span>`}</span>
          </div>
          <div>
            ${item.possibleOutletPhase ? `<span class="pill">outlet ${escapeHtml(item.possibleOutletPhase)}</span>` : ""}
            ${item.agentAdded ? `<span class="pill">agent ${escapeHtml(item.agentAdded)}</span>` : ""}
            ${item.translationBasis ? `<span class="pill">${escapeHtml(item.translationBasis)}</span>` : ""}
          </div>
        </div>
      `;
    }

    function formatMathValue(value) {
      if (value === null || value === undefined || value === "" || Number.isNaN(value)) return "missing";
      if (typeof value === "number") return formatRatio(value);
      return String(value);
    }

    function lutzeRouteNarrative(groupId, pair, variant, split = null, stepIndex = null) {
      const resolvedSplit = split || pathwaySplitTargets(pair, variant, null);
      const separated = resolvedSplit.separated?.map(item => item.name).filter(Boolean).join(", ") || preferredSeparatedName(pair, variant);
      const retained = resolvedSplit.retained?.map(item => item.name).filter(Boolean).join(", ") || "the remaining product-rich stream";
      const unit = (variant.units || []).find(item => item !== "Review candidate unit") || variant.flowLabel || "candidate separator";
      const pbb = (variant.pbb || []).length ? `KB3.1 selected ${variant.pbb.join(", ")}` : "KB3.1 PBB selection pending";
      const candidates = (variant.unitCandidates || []).map(item => item.name).filter(Boolean);
      const translation = candidates.length ? `KB3.2 maps this PBB set to ${candidates.slice(0, 4).join(", ")}` : "KB3.2 unit translation pending";
      const scoreText = Number(variant.score) > 0 ? `screening score ${Math.round(Number(variant.score))}/100` : "screening score pending";
      const drivers = routeNarrativeDrivers(variant);
      const missing = (variant.missing || []).length ? ` Remaining checks: ${(variant.missing || []).join("; ")}.` : "";
      const prefix = stepIndex ? `Separation step ${stepIndex}` : "Proposed separation";
      return `${prefix}: use ${unit} to separate ${separated} from ${retained} in ${groupId}. Method trace: ${pbb} for binary pair ${pair.a.name} / ${pair.b.name}${drivers ? ` because ${drivers}` : ""}; ${translation}. ${scoreText}. EI ranking is not calculated here and requires mass and energy balance data.${missing}`;
    }

    function preferredSeparatedName(pair, variant) {
      const title = String(variant.title || "").toLowerCase();
      if (/volatility|thermal|distill|evapor|flash|v-l/.test(title)) return preferredVolatileComponent(pair).name;
      if (/crystall/.test(title)) return preferredSolidComponent(pair).name;
      if (/affinity|size|membrane|selective/.test(title)) return preferredLargeComponent(pair).name;
      return pair.a.name;
    }

    function routeNarrativeDrivers(variant) {
      const comparisons = Array.isArray(variant.comparisons)
        ? variant.comparisons.filter(item => item && item.met).slice(0, 3)
        : [];
      if (comparisons.length) {
        return comparisons
          .map(item => `${item.label} ${formatMathValue(item.value)} ${item.operator || ">="} ${formatMathValue(item.threshold)}`)
          .join("; ");
      }
      return (variant.drivers || []).slice(0, 3).join("; ");
    }

    function separationPathwayModel(group, model = separationSimulatorModel(group)) {
      return separationCore.separationPathwayModel(group, model, ensureGroup(group.id).separationSimulator.reactionBalance, ensureGroup(group.id).separationSimulator.pathway);
    }

    function pathwaySplitTargets(pair, variant, mainProduct) {
      return separationCore.pathwaySplitTargets(pair, variant, mainProduct);
    }

    function expandedRouteSplit(pair, variant, components, mainProduct = null) {
      const base = Array.isArray(components) && components.length ? components : [pair.a, pair.b];
      const split = pathwaySplitTargets(pair, variant, mainProduct);
      const separatedIds = new Set(split.separated.map(item => item.id));
      return {
        separated: split.separated,
        retained: base.filter(item => !separatedIds.has(item.id))
      };
    }

    function routeFeedNameForSplit(split, fallback = "mixture") {
      const components = [...(split?.separated || []), ...(split?.retained || [])];
      const names = components.map(item => item.name).filter(Boolean);
      return names.length ? `${names.join(" / ")} mixture` : fallback;
    }

    function routeRetainedName(split) {
      const names = (split?.retained || []).map(item => item.name).filter(Boolean);
      if (!names.length) return "retained stream";
      if (names.length === 1) return `${names[0]} retained stream`;
      return `${names.join(" / ")} retained mixture`;
    }

    function routeQuantityForSubstances(substances) {
      const rows = (substances || []).filter(item => String(item.quantity || "").trim());
      if (!rows.length) return { quantity: "", unit: "" };
      const units = new Set(rows.map(item => String(item.unit || "").trim()).filter(Boolean));
      if (units.size === 1) {
        const unit = Array.from(units)[0];
        const values = rows.map(item => conversionNumber(item.quantity));
        if (values.every(value => Number.isFinite(value))) {
          return { quantity: formatNumber(values.reduce((sum, value) => sum + value, 0)), unit };
        }
      }
      if (rows.length === 1) return { quantity: rows[0].quantity, unit: rows[0].unit || "" };
      return { quantity: rows.map(item => `${item.quantity} ${item.unit || ""}`.trim()).join(" + "), unit: "" };
    }

    function routeOutletMeta(variant) {
      const title = String(variant.title || "").toLowerCase();
      if (/volatility|thermal|distill|evapor|flash|v-l/.test(title)) {
        return { separatedLabel: "volatile recovery", retainedLabel: "heavier retained mixture", separatedPhase: "VL", retainedPhase: "L" };
      }
      if (/crystall/.test(title)) return { separatedLabel: "solid-rich cut", retainedLabel: "mother liquor", separatedPhase: "S", retainedPhase: "L" };
      if (/affinity|size|membrane|selective/.test(title)) return { separatedLabel: "selective cut", retainedLabel: "retained mixture", separatedPhase: "unknown", retainedPhase: "unknown" };
      return { separatedLabel: "separated stream", retainedLabel: "retained mixture", separatedPhase: "unknown", retainedPhase: "unknown" };
    }

    function routeVariantOutputStreams(pair, variant, blockId, narrative = "", split = null) {
      const resolvedSplit = split || expandedRouteSplit(pair, variant, [pair.a, pair.b], null);
      const meta = routeOutletMeta(variant);
      const streams = [];
      resolvedSplit.separated.forEach((item, index) => {
        streams.push(createStream("output", {
          id: `${blockId}-S${index + 2}`,
          name: `${item.name} ${meta.separatedLabel}`,
          quantity: item.quantity || "",
          unit: item.unit || "",
          phase: meta.separatedPhase,
          status: "proposed",
          fate: item.fate && item.fate !== "unknown" ? item.fate : "intermediate",
          note: narrative || `Route variant output for ${item.name}; confirm recovery, purity, and destination.`,
          ...streamChemicalPropertyPayloadWithDensity(item)
        }));
      });
      if (resolvedSplit.retained.length) {
        const retainedQuantity = routeQuantityForSubstances(resolvedSplit.retained);
        const retainedPureProperties = resolvedSplit.retained.length === 1
          ? streamChemicalPropertyPayloadWithDensity(resolvedSplit.retained[0])
          : {};
        streams.push(
          createStream("output", {
            id: `${blockId}-S${streams.length + 2}`,
            name: `${routeRetainedName(resolvedSplit)} ${meta.retainedLabel}`,
            quantity: retainedQuantity.quantity,
            unit: retainedQuantity.unit,
            phase: meta.retainedPhase,
            status: "proposed",
            fate: resolvedSplit.retained.some(item => item.fate === "product") ? "product" : "intermediate",
            note: narrative || `Retained mixture for the next separation step: ${resolvedSplit.retained.map(item => item.name).join(", ")}.`,
            ...retainedPureProperties
          })
        );
      }
      return streams;
    }

    function insertSeparationRoute(groupId, pairKey, routeId) {
      const sourceGroup = groupModel(groupId);
      if (!sourceGroup) return;
      const model = separationSimulatorModel(sourceGroup);
      const path = separationPathwayModel(sourceGroup, model);
      const pair = model.pairs.find(item => item.key === pairKey);
      if (!pair) return;
      const variant = binaryRouteVariants(groupId, pair).find(item => item.id === routeId);
      if (!variant) return;

      pushUndo();
      const newGroupId = nextGroupId();
      const newBlockId = nextBlockId();
      const selectedUnit = (variant.units || []).find(unit => unit !== "Review candidate unit") || "";
      const sourceState = ensureGroup(groupId);
      const newGroup = ensureGroup(newGroupId, "separation");
      const split = expandedRouteSplit(pair, variant, model.substances, path.mainProduct);
      const narrative = lutzeRouteNarrative(groupId, pair, variant, split);
      const downstream = state.links
        .filter(link => resolvedEndpointId(link.from) === groupId && state.groups[resolvedEndpointId(link.to)])
        .map(link => ensureGroup(resolvedEndpointId(link.to)));
      newGroup.task = `${variant.title}: ${pair.a.name} / ${pair.b.name}`;
      newGroup.selectedUnit = selectedUnit;
      newGroup.selectionBasis = [
        `Inserted from Separation Simulator binary screening for ${pair.a.name} / ${pair.b.name}.`,
        narrative,
        variant.drivers.length ? `Drivers: ${variant.drivers.join("; ")}.` : "",
        variant.missing.length ? `Missing checks: ${variant.missing.join("; ")}.` : "Property threshold screen complete enough for a first-pass route theory.",
        "Review before treating this as a paper-confirmed industrial design."
      ].filter(Boolean).join(" ");
      newGroup.schedule = { ...scheduleDefaults(), notes: `Proposed separator inserted after ${groupId}; duration and sizing are placeholders until equipment data are entered.` };
      newGroup.properties = {};
      newGroup.propertiesEditing = false;
      newGroup.x = Number.isFinite(sourceState.x) ? sourceState.x + 560 : 1080;
      newGroup.y = Number.isFinite(sourceState.y) ? sourceState.y + 330 : 420;
      if (downstream.length === 1 && Number.isFinite(downstream[0].x) && Math.abs(downstream[0].x - newGroup.x) < 260 && Math.abs(downstream[0].y - newGroup.y) < 240) {
        downstream[0].x += 560;
      }

      const phenomena = routeVariantPhenomena(variant);
      state.blocks.push({
        id: newBlockId,
        groupId: newGroupId,
        start: state.text.length,
        end: state.text.length,
        text: narrative,
        behavior: routeVariantBehavior(variant),
        phenomena,
        phase: "",
        endpoint: "",
        conditions: {},
        conditionUnits: {},
        conditionsEditing: false,
        streams: [
          createStream("input", {
            id: `${newBlockId}-S1`,
            name: `${routeFeedNameForSplit(split)} from ${groupId}`,
            phase: "mixture",
            status: "proposed",
            fate: "intermediate",
            note: narrative
          }),
          ...routeVariantOutputStreams(pair, variant, newBlockId, narrative, split)
        ]
      });

      const outgoing = state.links.filter(link => resolvedEndpointId(link.from) === groupId);
      const otherLinks = state.links.filter(link => resolvedEndpointId(link.from) !== groupId);
      otherLinks.push({ from: groupId, to: newGroupId });
      outgoing.forEach(link => {
        const to = resolvedEndpointId(link.to);
        if (to && to !== newGroupId) otherLinks.push({ from: newGroupId, to: link.to });
      });
      state.links = otherLinks.filter((link, index, links) => links.findIndex(item => item.from === link.from && item.to === link.to) === index);

      const sourceSimulator = ensureGroup(groupId).separationSimulator;
      sourceSimulator.notes = [
        sourceSimulator.notes,
        `Inserted ${newGroupId}: ${variant.title} for ${pair.a.name} / ${pair.b.name}${selectedUnit ? ` using ${selectedUnit}` : ""}.`
      ].filter(Boolean).join("\n");
      state.selectedGroupId = newGroupId;
      state.selectedBlockId = null;
      state.selectedIds = [];
      state.focusEndpoint = newGroupId;
      state.activeInspectorTab = "scale";
      closeSeparationSimulator();
      invalidateAiRefine();
      renderAll();
    }

    function separationPathwayHtml(group, model) {
      const path = separationPathwayModel(group, model);
      const readiness = separationSimulatorReadiness(model);
      return `
        <section class="modal-section pathway-sandbox">
          <div class="pathway-head">
            <div>
              <div class="label">Lutze Reaction-Separation Sandbox</div>
              <div class="muted small">Draft alternative separation pathways from the post-reaction mixture. The main flowsheet changes only after Apply Pathway.</div>
            </div>
            <div class="sep-unit-actions">
              <button data-sync-sep-substances="${escapeAttr(group.id)}">Sync Substances</button>
              <button data-pubchem-autofill="${escapeAttr(group.id)}">Fetch PubChem</button>
              <button data-sep-sim-tab="binary">Binary Data</button>
              <button data-pathway-undo="${escapeAttr(group.id)}" ${path.steps.length ? "" : "disabled"}>Undo Last</button>
              <button data-pathway-reset="${escapeAttr(group.id)}" ${path.steps.length ? "" : "disabled"}>Reset</button>
              <button class="primary" data-pathway-apply="${escapeAttr(group.id)}" ${path.steps.length && path.editIndex < 0 ? "" : "disabled"}>Apply Pathway to Main Flowsheet</button>
            </div>
          </div>
          <div class="sep-sim-status ${escapeAttr(readiness.status)}">
            <strong>${escapeHtml(path.mainProduct ? `Main product: ${path.mainProduct.name}` : "Main product not selected")}</strong>
            <span>${escapeHtml(path.active.length ? `${path.active.length} component${path.active.length === 1 ? "" : "s"} remain in the draft mixture.` : "No active mixture components remain.")}</span>
          </div>
          ${pathwayRouteReferenceHtml(group.id, path)}
          <div class="pathway-layout">
            <div class="pathway-canvas-panel">
              <div class="pathway-canvas">
                ${pathwayCanvasHtml(group, path)}
              </div>
              ${pathwaySelectedStepHtml(path)}
            </div>
            <div class="pathway-options-panel">
              <div class="condition-family-head">
                <span>${path.editIndex >= 0 ? "Replacement Moves" : "Next Separation Moves"}</span>
                <span class="pill">${path.nextOptions.length}</span>
              </div>
              ${path.editIndex >= 0 ? `<div class="sep-sim-status partial"><strong>Editing from step ${path.editIndex + 1}</strong><span>Choosing a route here replaces this branch and discards ${path.discardedSteps.length} downstream step${path.discardedSteps.length === 1 ? "" : "s"}.</span></div>` : ""}
              ${path.nextOptions.length ? path.nextOptions.map(option => pathwayOptionCardHtml(group.id, option)).join("") : `
                <div class="mfa-empty">
                  ${path.active.length <= 1 ? "Pathway is reduced to one main stream. Apply it or reset to test another route." : "No route can be drawn yet. Sync substances, fetch PubChem properties, then complete binary data for azeotrope/miscibility where needed."}
                </div>
              `}
            </div>
          </div>
          <details class="pathway-secondary-details">
            <summary>Binary matrix and balance details</summary>
            <div class="pathway-balance-strip">
              ${reactionBalanceRecognitionHtml(path.balance)}
            </div>
            ${pathwayPairPriorityHtml(path)}
          </details>
        </section>
      `;
    }

    function pathwayRouteReferenceHtml(groupId, path) {
      const selected = path.steps.find(step => step.id === path.pathway.selectedStepId) || path.steps[path.steps.length - 1];
      const option = path.nextOptions[0] || null;
      if (path.editIndex >= 0 && path.editingStep) {
        return `
          <div class="pathway-route-reference">
            <div class="pathway-route-reference-main">
              <span class="label">Editing Branch From Step ${path.editIndex + 1}</span>
              <strong>${escapeHtml(path.editingStep.unit || path.editingStep.title || "selected separation route")}</strong>
              <span class="muted small">Pick a replacement route below. The mixture is recalculated from before this step.</span>
            </div>
            <div class="pathway-route-reference-meta">
              <span class="pill warn">${path.discardedSteps.length} step${path.discardedSteps.length === 1 ? "" : "s"} will be replaced</span>
              <button data-pathway-cancel-edit="${escapeAttr(groupId)}">Cancel Edit</button>
            </div>
            ${pbbTranslationSummaryHtml(path.editingStep)}
          </div>
        `;
      }
      if (!selected && !option) {
        return `
          <div class="pathway-route-reference empty">
            <div>
              <span class="label">Route Reference</span>
              <strong>No candidate route yet</strong>
            </div>
            <span class="muted small">Complete substances, phases and binary data to unlock a gated route.</span>
          </div>
        `;
      }
      if (selected) {
        return `
          <div class="pathway-route-reference">
            <div class="pathway-route-reference-main">
              <span class="label">Selected Route Reference</span>
              <strong>${escapeHtml(selected.unit || selected.title || "selected separation route")}</strong>
              <span class="muted small">${escapeHtml(selected.separated.map(item => item.name).join(", ") || "target pending")} separated; ${escapeHtml(selected.retained.map(item => item.name).join(", ") || "remaining mixture")} retained.</span>
            </div>
            <div class="pathway-route-reference-meta">
              <span class="pill green">${escapeHtml(formatMathScore(selected.score))}</span>
              ${selected.possibleOutletPhase ? `<span class="pill">outlet ${escapeHtml(selected.possibleOutletPhase)}</span>` : ""}
              ${selected.agentAdded ? `<span class="pill">agent ${escapeHtml(selected.agentAdded)}</span>` : ""}
            </div>
            ${pbbTranslationSummaryHtml(selected)}
          </div>
        `;
      }
      return `
        <div class="pathway-route-reference">
          <div class="pathway-route-reference-main">
            <span class="label">Recommended Next Route</span>
            <strong>${escapeHtml(option.unit || option.variant.title)}</strong>
            <span class="muted small">${escapeHtml(option.pairLabel)} · separate ${escapeHtml(option.separated.map(item => item.name).join(", "))}; retain ${escapeHtml(option.retained.map(item => item.name).join(", "))}</span>
          </div>
          <div class="pathway-route-reference-meta">
            <span class="pill ${option.variant.level === "supported" ? "green" : "blue"}">${escapeHtml(option.variant.level)} · ${escapeHtml(formatMathScore(option.variant.score))}</span>
            <button class="primary-mini" data-pathway-try-option="${escapeAttr(option.id)}" data-sep-group="${escapeAttr(groupId)}">Try Route</button>
          </div>
          ${pbbTranslationSummaryHtml(option.variant)}
        </div>
      `;
    }

    function pathwayPairPriorityHtml(path) {
      return `
        <div class="sep-route-variants">
          <div class="sep-route-title">
            <strong>Binary Pair Priority</strong>
            <span class="muted small">All active pairwise comparisons ranked before drawing the next separation.</span>
            <span class="pill">${path.pairPriorities.length} pairs</span>
          </div>
          ${path.pairPriorities.length ? path.pairPriorities.map((item, index) => `
            <article class="sep-route-card ${escapeAttr(item.level)}">
              <div class="sep-route-card-head">
                <strong>${index + 1}. ${escapeHtml(item.pairLabel)}</strong>
                <span class="pill ${item.priority === "high" ? "green" : item.priority === "medium" ? "blue" : "warn"}">${escapeHtml(item.priority)} · ${escapeHtml(formatMathScore(item.score))}</span>
              </div>
              <div class="predictor-reason">${escapeHtml(item.bestRoute ? `Prioritize ${item.bestRoute}${item.bestUnit ? ` via ${item.bestUnit}` : ""}. ${item.reason}` : item.reason)}</div>
              ${pbbTranslationSummaryHtml(item)}
              <div class="predictor-missing">
                ${item.mainProductPair ? `<span class="pill green">main-product pair</span>` : `<span class="pill">secondary pair</span>`}
                ${item.drivers.slice(0, 3).map(driver => `<span class="pill blue">${escapeHtml(driver)}</span>`).join("")}
                ${item.missing.slice(0, 3).map(missing => `<span class="pill warn">${escapeHtml(missing)}</span>`).join("")}
              </div>
            </article>
          `).join("") : `<div class="mfa-empty">No active binary pairs remain.</div>`}
        </div>
      `;
    }

    function pathwayCanvasHtml(group, path) {
      return `
        <div class="pathway-node source">
          <span class="pill blue">${escapeHtml(group.id)}</span>
          <strong>Post-reaction mixture</strong>
          <span class="muted small">${path.balance.status === "estimated" ? "reaction balance estimated" : "complete balance inputs first"}</span>
        </div>
        ${path.steps.map((step, index) => `
          <div class="pathway-arrow">-></div>
          <button class="pathway-node separator ${path.pathway.selectedStepId === step.id ? "selected" : ""} ${path.pathway.editFromStepId === step.id ? "editing" : ""}" data-pathway-select-step="${escapeAttr(step.id)}" data-sep-group="${escapeAttr(group.id)}">
            <span class="pill">${index + 1}</span>
            <strong>${escapeHtml(step.unit || step.title || "separation route")}</strong>
            <span class="muted small">${escapeHtml(step.title || "KB3.1 route")} · ${escapeHtml(step.separated.map(item => item.name).join(", ") || "target pending")}</span>
          </button>
          <div class="pathway-outlet">
            ${step.separated.map(item => `<span class="pill green">${escapeHtml(item.name)} separated</span>`).join("") || `<span class="pill warn">separation target pending</span>`}
          </div>
        `).join("")}
        <div class="pathway-arrow">-></div>
        <div class="pathway-node residue">
          <strong>${path.active.length <= 1 ? "Final active stream" : "Remaining mixture"}</strong>
          <span class="muted small">${path.active.map(item => item.name).join(", ") || "empty"}</span>
        </div>
      `;
    }

    function pathwaySelectedStepHtml(path) {
      const selected = path.steps.find(step => step.id === path.pathway.selectedStepId) || path.steps[path.steps.length - 1];
      if (!selected) {
        return `<div class="pathway-info-panel"><strong>No route tried yet</strong><span class="muted small">Choose a next separation move to draw an alternative pathway.</span></div>`;
      }
      return `
        <div class="pathway-info-panel">
          <strong>${escapeHtml(selected.title || selected.unit || "Selected route")}</strong>
          <span class="muted small">Unit: ${escapeHtml(selected.unit || "not fixed")}</span>
          <span class="muted small">Screening score: ${escapeHtml(formatMathScore(selected.score))}</span>
          <span class="muted small">Separates: ${escapeHtml(selected.separated.map(item => item.name).join(", ") || "pending")}</span>
          <span class="muted small">Retains: ${escapeHtml(selected.retained.map(item => item.name).join(", ") || "pending")}</span>
          ${pbbTranslationSummaryHtml(selected)}
          <div class="predictor-missing">
            ${selected.drivers.map(line => `<span class="pill green">${escapeHtml(line)}</span>`).join("")}
            ${selected.missing.map(line => `<span class="pill warn">${escapeHtml(line)}</span>`).join("")}
          </div>
        </div>
      `;
    }

    function pathwayOptionCardHtml(groupId, option) {
      const path = separationPathwayModel(groupModel(groupId));
      const replacing = path.editIndex >= 0;
      return `
        <article class="pathway-option-card ${escapeAttr(option.variant.level)}">
          <div class="sep-route-card-head">
            <strong>${escapeHtml(option.unit || option.variant.title)}</strong>
            <span class="pill ${option.variant.level === "supported" ? "green" : option.variant.level === "partial" ? "blue" : "warn"}">${escapeHtml(option.variant.level)} · ${escapeHtml(formatMathScore(option.variant.score))}</span>
          </div>
          <div class="muted small">${escapeHtml(option.pairLabel)}</div>
          <div class="pathway-option-target">
            <span class="pill green">separate ${escapeHtml(option.separated.map(item => item.name).join(", "))}</span>
            <span class="pill blue">retain ${escapeHtml(option.retained.map(item => item.name).join(", "))}</span>
          </div>
          <div class="predictor-missing">
            ${option.variant.pbb.slice(0, 4).map(code => `<span class="pill blue">${escapeHtml(code)}</span>`).join("")}
            ${option.variant.drivers.slice(0, 2).map(driver => `<span class="pill green">${escapeHtml(driver)}</span>`).join("")}
          </div>
          <button class="primary-mini" data-pathway-try-option="${escapeAttr(option.id)}" data-sep-group="${escapeAttr(groupId)}">${replacing ? "Replace From Here" : "Try This Route"}</button>
        </article>
      `;
    }

    function tryPathwayRoute(groupId, optionId) {
      const group = groupModel(groupId);
      if (!group) return;
      const path = separationPathwayModel(group);
      const option = path.nextOptions.find(item => item.id === optionId);
      if (!option) return;
      pushUndo();
      const simulator = ensureGroup(groupId).separationSimulator;
      const replacing = path.editIndex >= 0;
      if (replacing) {
        simulator.pathway.steps = simulator.pathway.steps.slice(0, path.editIndex);
      }
      const step = {
        id: `PW${Date.now().toString(36)}${simulator.pathway.steps.length + 1}`,
        pairKey: option.pairKey,
        routeId: option.routeId,
        title: option.variant.title,
        unit: option.unit,
        separatedIds: option.separated.map(item => item.id),
        retainedIds: option.retained.map(item => item.id),
        drivers: option.variant.drivers,
        missing: option.variant.missing,
        pbb: option.variant.pbb || [],
        possibleOutletPhase: option.variant.possibleOutletPhase || "",
        agentAdded: option.variant.agentAdded || "",
        translationBasis: option.variant.translationBasis || "",
        unitCandidates: option.variant.unitCandidates || [],
        score: option.variant.score,
        note: option.variant.graphPreview
      };
      simulator.pathway.steps.push(step);
      simulator.pathway.selectedStepId = step.id;
      simulator.pathway.editFromStepId = "";
      simulator.tab = "pathway";
      renderSeparationSimulatorModal();
      renderExport();
    }

    function undoPathwayRoute(groupId) {
      const simulator = ensureGroup(groupId).separationSimulator;
      if (!simulator.pathway.steps.length) return;
      pushUndo();
      simulator.pathway.steps.pop();
      simulator.pathway.selectedStepId = simulator.pathway.steps.length ? simulator.pathway.steps[simulator.pathway.steps.length - 1].id : "";
      simulator.pathway.editFromStepId = "";
      simulator.tab = "pathway";
      renderSeparationSimulatorModal();
      renderExport();
    }

    function resetPathway(groupId) {
      const simulator = ensureGroup(groupId).separationSimulator;
      if (!simulator.pathway.steps.length) return;
      pushUndo();
      simulator.pathway.steps = [];
      simulator.pathway.selectedStepId = "";
      simulator.pathway.editFromStepId = "";
      simulator.pathway.appliedAt = "";
      simulator.tab = "pathway";
      renderSeparationSimulatorModal();
      renderExport();
    }

    function selectPathwayStep(groupId, stepId) {
      const simulator = ensureGroup(groupId).separationSimulator;
      simulator.pathway.selectedStepId = stepId;
      simulator.pathway.editFromStepId = stepId;
      renderSeparationSimulatorModal();
    }

    function cancelPathwayEdit(groupId) {
      const simulator = ensureGroup(groupId).separationSimulator;
      simulator.pathway.editFromStepId = "";
      renderSeparationSimulatorModal();
    }

    function applyPathwayToMainFlowsheet(groupId) {
      const sourceGroup = groupModel(groupId);
      if (!sourceGroup) return;
      const model = separationSimulatorModel(sourceGroup);
      const path = separationPathwayModel(sourceGroup, model);
      if (!path.steps.length) return;
      if (path.editIndex >= 0) return;
      pushUndo();
      const sourceState = ensureGroup(groupId);
      const outgoing = state.links.filter(link => resolvedEndpointId(link.from) === groupId);
      state.links = state.links.filter(link => resolvedEndpointId(link.from) !== groupId);
      let previousGroupId = groupId;
      let lastGroupId = groupId;
      path.steps.forEach((step, index) => {
        const pair = model.pairs.find(item => item.key === step.pairKey);
        if (!pair) return;
        const variant = binaryRouteVariants(groupId, pair).find(item => item.id === step.routeId);
        if (!variant) return;
        const newGroupId = nextGroupId();
        const newBlockId = nextBlockId();
        const newGroup = ensureGroup(newGroupId, "separation");
        const split = {
          separated: step.separated?.length ? step.separated : step.separatedIds.map(id => model.substances.find(item => item.id === id)).filter(Boolean),
          retained: step.retained?.length ? step.retained : step.retainedIds.map(id => model.substances.find(item => item.id === id)).filter(Boolean)
        };
        const narrative = lutzeRouteNarrative(sourceGroup.id, pair, variant, split, index + 1);
        newGroup.task = `${step.title || variant.title}: ${pair.a.name} / ${pair.b.name}`;
        newGroup.selectedUnit = step.unit || (variant.units || []).find(unit => unit !== "Review candidate unit") || "";
        newGroup.selectionBasis = [
          `Applied from Lutze Reaction-Separation pathway for ${sourceGroup.id}.`,
          narrative,
          step.drivers.length ? `Drivers: ${step.drivers.join("; ")}.` : "",
          step.missing.length ? `Missing checks: ${step.missing.join("; ")}.` : "No high-priority missing checks recorded in the pathway."
        ].filter(Boolean).join(" ");
        newGroup.schedule = { ...scheduleDefaults(), notes: `Draft pathway separator ${index + 1}; verify equipment sizing and mass split before scale-up.` };
        newGroup.properties = {};
        newGroup.x = Number.isFinite(sourceState.x) ? sourceState.x + 560 * (index + 1) : 1080 + 560 * index;
        newGroup.y = Number.isFinite(sourceState.y) ? sourceState.y + 260 + 40 * index : 420 + 40 * index;
        state.blocks.push({
          id: newBlockId,
          groupId: newGroupId,
          start: state.text.length,
          end: state.text.length,
          text: narrative,
          behavior: routeVariantBehavior(variant),
          phenomena: routeVariantPhenomena(variant),
          phase: "",
          endpoint: "",
          conditions: {},
          conditionUnits: {},
          conditionsEditing: false,
          streams: [
            createStream("input", {
              id: `${newBlockId}-S1`,
              name: `${routeFeedNameForSplit(split)} pathway feed from ${previousGroupId}`,
              phase: "mixture",
              status: "proposed",
              fate: "intermediate",
              note: narrative
            }),
            ...routeVariantOutputStreams(pair, variant, newBlockId, narrative, split)
          ]
        });
        state.links.push({ from: previousGroupId, to: newGroupId });
        previousGroupId = newGroupId;
        lastGroupId = newGroupId;
      });
      outgoing.forEach(link => {
        const to = resolvedEndpointId(link.to);
        if (to && to !== lastGroupId) state.links.push({ from: lastGroupId, to: link.to });
      });
      state.links = state.links.filter((link, index, links) => links.findIndex(item => item.from === link.from && item.to === link.to) === index);
      ensureGroup(groupId).separationSimulator.pathway.appliedAt = new Date().toISOString();
      state.selectedGroupId = lastGroupId;
      state.selectedBlockId = null;
      state.selectedIds = [];
      state.focusEndpoint = lastGroupId;
      closeSeparationSimulator();
      invalidateAiRefine();
      renderAll();
    }

    function separationSuggestionsHtml(group, model) {
      const readiness = separationSimulatorReadiness(model);
      const actionable = model.suggestions
        .filter(item => item.ruleId !== "NO-KB3.1-MATCH" && item.eligibility !== "not eligible")
        .sort((a, b) => Number(a.selectable === false) - Number(b.selectable === false) || suggestionLevelRank(a.level) - suggestionLevelRank(b.level) || a.pairLabel.localeCompare(b.pairLabel));
      const blocked = model.suggestions.filter(item => item.ruleId === "NO-KB3.1-MATCH" || item.eligibility === "not eligible");
      const grouped = new Map();
      actionable.forEach(item => {
        if (!grouped.has(item.pairLabel)) grouped.set(item.pairLabel, []);
        grouped.get(item.pairLabel).push(item);
      });
      return `
        <section class="modal-section">
          <div>
            <div class="label">Suggestions</div>
            <div class="muted small">The simulator proposes theories only. Use Apply as Candidate when you intentionally want to test one unit operation in the group.</div>
          </div>
          <div class="sep-result-summary">
            <span><strong>${readiness.actionableCount}</strong> gated route theories</span>
            <span><strong>${readiness.supportedCount}</strong> supported</span>
            <span><strong>${blocked.length}</strong> waiting/rejected</span>
          </div>
          <div class="sep-suggestions">
            ${grouped.size ? Array.from(grouped.entries()).map(([pairLabel, items]) => `
              <div class="sep-suggestion-pair">
                <div class="condition-family-head"><span>${escapeHtml(pairLabel)}</span><span class="pill">${items.length}</span></div>
                ${items.map(item => separationSuggestionCardHtml(group.id, item)).join("")}
              </div>
            `).join("") : `<div class="mfa-empty">No actionable route yet. Add boiling point, vapor pressure, melting point, solubility parameter, or binary insights such as azeotrope/miscibility gap.</div>`}
          </div>
          ${blocked.length ? `
            <details class="sep-missing-details">
              <summary>${blocked.length} binary pair${blocked.length === 1 ? "" : "s"} with missing data</summary>
              <div class="sep-missing-grid">
                ${blocked.map(item => `
                  <div class="sep-missing-row">
                    <strong>${escapeHtml(item.pairLabel)}</strong>
                    <span>
                      ${(item.blockers || []).map(line => `<span class="pill warn">${escapeHtml(line)}</span>`).join("")}
                      ${item.missing.map(missing => `<span class="pill warn">${escapeHtml(missing)}</span>`).join("")}
                    </span>
                  </div>
                `).join("")}
              </div>
            </details>
          ` : ""}
          ${ensureGroup(group.id).separationSimulator.notes ? `
            <div class="mfa-note">
              <strong>Saved simulator notes</strong>
              <span>${escapeHtml(ensureGroup(group.id).separationSimulator.notes)}</span>
            </div>
          ` : ""}
        </section>
      `;
    }

    function suggestionLevelRank(level) {
      return separationCore.suggestionLevelRank(level);
    }

    function separationSuggestionCardHtml(groupId, item) {
      const units = item.units.length ? item.units : ["add data before selecting a unit"];
      const selectable = item.selectable !== false;
      const status = item.eligibility || item.level;
      return `
        <article class="predictor-row ${item.level === "supported" ? "keep" : item.level === "blocked" || !selectable ? "reject" : "weak"}">
          <div class="predictor-row-top">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="pill ${item.level === "supported" ? "green" : item.level === "blocked" || !selectable ? "warn" : "blue"}">${escapeHtml(status)} · ${escapeHtml(formatMathScore(item.score))}</span>
          </div>
          <div class="predictor-reason">${escapeHtml(item.note)}</div>
          <div class="predictor-meta">
            <span class="pill">${escapeHtml(item.source)}</span>
            ${item.routeFamily ? `<span class="pill blue">${escapeHtml(item.routeFamily)}</span>` : ""}
          </div>
          ${pbbTranslationSummaryHtml(item)}
          <div class="predictor-missing">
            ${item.evidence.length ? item.evidence.map(line => `<span class="pill green">${escapeHtml(line)}</span>`).join("") : `<span class="pill warn">no threshold matched yet</span>`}
            ${(item.eligibilityReasons || []).map(line => `<span class="pill blue">${escapeHtml(line)}</span>`).join("")}
            ${(item.blockers || []).map(line => `<span class="pill warn">${escapeHtml(line)}</span>`).join("")}
            ${item.missing.length ? item.missing.map(line => `<span class="pill warn">${escapeHtml(line)}</span>`).join("") : ""}
          </div>
          <div class="sep-unit-actions">
            ${units.map(unit => `
              <button data-sep-apply-candidate="${escapeAttr(unit)}" data-sep-group="${escapeAttr(groupId)}" ${item.units.length && selectable ? "" : "disabled"}>${escapeHtml(unit)}</button>
            `).join("")}
            <button data-sep-add-note="${escapeAttr(item.pairKey)}" data-sep-note-rule="${escapeAttr(item.ruleId)}" data-sep-group="${escapeAttr(groupId)}">Add as note</button>
          </div>
        </article>
      `;
    }

    function bindSeparationSimulatorControls(root, groupId) {
      root.querySelectorAll("[data-sep-sim-tab]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(groupId).separationSimulator.tab = button.dataset.sepSimTab;
          renderSeparationSimulatorModal();
        });
      });
      root.querySelectorAll("[data-sync-sep-substances]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          syncSeparationSimulatorSubstances(groupModel(button.dataset.syncSepSubstances));
          renderSeparationSimulatorModal();
          renderExport();
        });
      });
      root.querySelectorAll("[data-add-sep-substance]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          const simulator = ensureGroup(button.dataset.addSepSubstance).separationSimulator;
          simulator.substances.push(normalizeSeparationSubstance({ id: nextSeparationSubstanceId(simulator), name: "" }, simulator.substances.length));
          renderSeparationSimulatorModal();
          renderExport();
        });
      });
      root.querySelectorAll("[data-load-sep-demo]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          loadSimpleSeparationDemo(button.dataset.loadSepDemo);
          renderSeparationSimulatorModal();
          renderExport();
        });
      });
      root.querySelectorAll("[data-load-methylbenzene-demo]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          loadMethylbenzeneSeparationDemo(button.dataset.loadMethylbenzeneDemo);
          renderSeparationSimulatorModal();
          renderExport();
        });
      });
      root.querySelectorAll("[data-fetch-pubchem]").forEach(button => {
        button.addEventListener("click", async () => {
          await fetchPubChemForSubstance(button.dataset.sepGroup, button.dataset.fetchPubchem, button);
        });
      });
      root.querySelectorAll("[data-pubchem-autofill]").forEach(button => {
        button.addEventListener("click", async () => {
          await autofillPubChemForGroup(button.dataset.pubchemAutofill, button);
        });
      });
      root.querySelectorAll("[data-remove-sep-substance]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          const simulator = ensureGroup(button.dataset.sepGroup).separationSimulator;
          simulator.substances = simulator.substances.filter(item => item.id !== button.dataset.removeSepSubstance);
          renderSeparationSimulatorModal();
          renderExport();
        });
      });
      root.querySelectorAll("[data-sep-sub-field]").forEach(input => {
        input.addEventListener("input", updateSeparationSubstanceField);
        input.addEventListener("change", updateSeparationSubstanceField);
        input.addEventListener("change", renderSeparationSimulatorModal);
      });
      root.querySelectorAll("[data-sep-pair-field]").forEach(input => {
        input.addEventListener("input", updateSeparationPairField);
        input.addEventListener("change", updateSeparationPairField);
        input.addEventListener("change", renderSeparationSimulatorModal);
      });
      root.querySelectorAll("[data-reaction-balance-field]").forEach(input => {
        input.addEventListener("input", updateReactionBalanceField);
        input.addEventListener("change", updateReactionBalanceField);
        input.addEventListener("change", renderSeparationSimulatorModal);
      });
      root.querySelectorAll("[data-add-reaction-product]").forEach(button => {
        button.addEventListener("click", () => addReactionProductSubstance(button.dataset.addReactionProduct, "product"));
      });
      root.querySelectorAll("[data-add-reaction-coproduct]").forEach(button => {
        button.addEventListener("click", () => addReactionProductSubstance(button.dataset.addReactionCoproduct, "coproduct"));
      });
      root.querySelectorAll("[data-apply-residual-waste]").forEach(button => {
        button.addEventListener("click", () => applyReactionResidualWasteStreams(button.dataset.applyResidualWaste));
      });
      root.querySelectorAll("[data-pathway-try-option]").forEach(button => {
        button.addEventListener("click", () => tryPathwayRoute(button.dataset.sepGroup, button.dataset.pathwayTryOption));
      });
      root.querySelectorAll("[data-pathway-undo]").forEach(button => {
        button.addEventListener("click", () => undoPathwayRoute(button.dataset.pathwayUndo));
      });
      root.querySelectorAll("[data-pathway-reset]").forEach(button => {
        button.addEventListener("click", () => resetPathway(button.dataset.pathwayReset));
      });
      root.querySelectorAll("[data-pathway-select-step]").forEach(button => {
        button.addEventListener("click", () => selectPathwayStep(button.dataset.sepGroup, button.dataset.pathwaySelectStep));
      });
      root.querySelectorAll("[data-pathway-cancel-edit]").forEach(button => {
        button.addEventListener("click", () => cancelPathwayEdit(button.dataset.pathwayCancelEdit));
      });
      root.querySelectorAll("[data-pathway-apply]").forEach(button => {
        button.addEventListener("click", async () => {
          const groupId = button.dataset.pathwayApply;
          if (!(await confirmModal(`Apply this Lutze Reaction-Separation pathway after ${groupId}? This creates new separator groups in the main flowsheet.`))) return;
          applyPathwayToMainFlowsheet(groupId);
        });
      });
      root.querySelectorAll("[data-sep-apply-candidate]").forEach(button => {
        button.addEventListener("click", async () => {
          const unit = button.dataset.sepApplyCandidate;
          const groupId = button.dataset.sepGroup;
          if (!(await confirmModal(`Set the selected unit for ${groupId} to "${unit}"? This overrides the current unit choice.`))) return;
          pushUndo();
          ensureGroup(groupId).selectedUnit = unit;
          renderAll();
        });
      });
      root.querySelectorAll("[data-sep-insert-route]").forEach(button => {
        button.addEventListener("click", async () => {
          const groupId = button.dataset.sepGroup;
          if (!(await confirmModal(`Insert a new separation group into the flowsheet after ${groupId}? This adds a new block and group to the graph, which you can undo or delete afterward.`))) return;
          insertSeparationRoute(groupId, button.dataset.sepRoutePair, button.dataset.sepInsertRoute);
        });
      });
      root.querySelectorAll("[data-sep-add-note]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          const groupState = ensureGroup(button.dataset.sepGroup);
          const group = groupModel(button.dataset.sepGroup);
          const suggestion = separationSimulatorModel(group).suggestions.find(item => item.pairKey === button.dataset.sepAddNote && item.ruleId === button.dataset.sepNoteRule);
          if (suggestion) {
            const line = `${suggestion.pairLabel}: ${suggestion.label} (${suggestion.source}); PBBs ${suggestion.pbb.join(", ") || "pending"}; units ${suggestion.units.join(", ") || "pending"}; evidence ${suggestion.evidence.join("; ") || "missing"}.`;
            groupState.separationSimulator.notes = [groupState.separationSimulator.notes, line].filter(Boolean).join("\n");
          }
          renderSeparationSimulatorModal();
          renderExport();
        });
      });
    }

    // PubChem lookup/resolve-modal functions moved to static/pubchem.js, loaded before this file.

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function updateSeparationSubstanceField(event) {
      const groupState = ensureGroup(event.target.dataset.sepGroup);
      const substance = groupState.separationSimulator.substances.find(item => item.id === event.target.dataset.sepSubId);
      if (!substance) return;
      const field = event.target.dataset.sepSubField;
      substance[field] = event.target.value;
      if (field === "name" && !String(substance.residualOf || "").trim()) {
        substance.chemicalKey = canonicalChemicalKey(substance.name);
      }
      if (separationSharedPropertyFields.has(field)) {
        propagateSeparationChemicalProperties(event.target.dataset.sepGroup, substance, field);
      }
      invalidateAiRefine();
      renderExport();
    }

    function updateSeparationPairField(event) {
      const groupState = ensureGroup(event.target.dataset.sepGroup);
      const key = event.target.dataset.sepPairKey;
      if (!groupState.separationSimulator.pairInsights[key]) groupState.separationSimulator.pairInsights[key] = {};
      groupState.separationSimulator.pairInsights[key][event.target.dataset.sepPairField] = event.target.value;
      invalidateAiRefine();
      renderExport();
    }

    function updateReactionBalanceField(event) {
      const groupState = ensureGroup(event.target.dataset.sepGroup);
      groupState.separationSimulator.reactionBalance[event.target.dataset.reactionBalanceField] = event.target.value;
      invalidateAiRefine();
      renderExport();
    }

    function separationPredictorApplies(group) {
      const phen = new Set(group.phenomena || []);
      if ([...phen].some(code => code.startsWith("PS(") || code.startsWith("PT(") || code.startsWith("PC(") || code.startsWith("PCh("))) return true;
      return matchesForGroup(group).some(candidate => candidate.task === "separation" || candidate.task.includes("separation"));
    }

    function postReactionSeparationSupportApplies(group, model = separationSimulatorModel(group)) {
      const phen = new Set(group.phenomena || []);
      const groupText = [
        group.task,
        ...(group.blocks || []).map(block => `${block.task || ""} ${block.text || ""}`)
      ].join(" ").toLowerCase();
      const hasReaction = [...phen].some(code => code.startsWith("R(")) || /react|reaction|synth|condensation|reactor/.test(groupText);
      const hasSeparationEvidence = [...phen].some(code => code.startsWith("PS(") || code.startsWith("PT(") || code.startsWith("PC(") || code.startsWith("PCh("));
      const hasChemicalMixture = model.substances.length >= 2;
      const hasReactionFates = model.substances.some(item => ["product", "byproduct", "impurity"].includes(item.role));
      return hasReaction && (hasSeparationEvidence || hasChemicalMixture || hasReactionFates);
    }

    function propertySeparationPredictorModel(group) {
      const groupState = ensureGroup(group.id);
      const mode = groupState.propertyPredictor.mode || "skip";
      const candidates = matchesForGroup(group).slice(0, 8);
      const rows = candidates.map(candidate => propertyDecisionForCandidate(group, candidate, mode));
      const counts = rows.reduce((acc, row) => {
        if (row.decision === "keep" || row.decision === "selected") acc.keep += 1;
        else if (row.decision === "reject") acc.reject += 1;
        else acc.weak += 1;
        return acc;
      }, { keep: 0, weak: 0, reject: 0 });
      const unresolved = rows.filter(row => row.missing.length).length;
      return {
        groupId: group.id,
        mode,
        modeLabel: propertyScreenModeLabel(mode),
        algorithmMode: mode,
        screeningBasis: propertyScreeningBasis(group, mode),
        thresholdSet: mode === "binaryRatio" ? "not configured (KB3.1/Table S.10 required)" : "minimal qualitative rules",
        componentPairs: inferredComponentPairsForGroup(group),
        sourceRequired: Boolean(mode !== "skip"),
        expanded: Boolean(groupState.propertyPredictor.expanded),
        counts,
        unresolved,
        summary: rows.length
          ? `${rows.length} alternatives screened; ${unresolved} need more data for a stronger decision.`
          : "No alternatives to screen yet.",
        rows
      };
    }

    function propertyDecisionForCandidate(group, candidate, mode) {
      const groupState = ensureGroup(group.id);
      const manualDecision = groupState.alternativeDecisions?.[candidate.name]?.decision || "auto";
      const auto = mode === "minimal"
        ? minimalPropertyDecision(group, candidate)
        : mode === "binaryRatio"
          ? binaryRatioPlaceholderDecision(group, candidate)
          : {
            decision: group.selectedUnit === candidate.name ? "selected" : "weak",
            confidence: "not screened",
            reason: "Optional property-based separation screen skipped; candidate comes from phenomena, task, and phase compatibility.",
            missing: minimalMissingForCandidate(group, candidate).slice(0, 3)
          };
      if (manualDecision && manualDecision !== "auto") {
        return {
          ...auto,
          name: candidate.name,
          decision: manualDecision,
          confidence: "manual",
          reason: `Manual override: ${manualDecision}. Auto result was ${auto.decision}: ${auto.reason}`,
          manualDecision
        };
      }
      return { ...auto, name: candidate.name, manualDecision: "auto" };
    }

    function propertyScreenModeLabel(mode) {
      if (mode === "minimal") return "Minimal qualitative";
      if (mode === "binaryRatio") return "Binary-ratio";
      return "Skipped";
    }

    function propertyScreeningBasis(group, mode) {
      const families = groupSeparationFamilies(group);
      const familyText = families.size ? Array.from(families).map(item => item.toUpperCase()).join(", ") : "candidate alternatives";
      if (mode === "minimal") {
        return `Qualitative keep/weak/reject screen using group phenomena, phase context, selected unit, and entered property evidence (${familyText}).`;
      }
      if (mode === "binaryRatio") {
        return "Binary-ratio mode selected, but component-level property matrix and thresholds are not configured yet; rows are flagged as pending data.";
      }
      return "No property-based screening applied; alternatives are ranked only by task, phenomena, and phase compatibility.";
    }

    function inferredComponentPairsForGroup(group) {
      const names = [];
      group.blocks.forEach(block => {
        ensureBlockFlowFields(block);
        (block.streams || [])
          .filter(stream => stream.role !== "waste" && stream.name && stream.name.trim())
          .forEach(stream => names.push(stream.name.trim()));
      });
      const unique = Array.from(new Set(names)).slice(0, 8);
      const pairs = [];
      for (let i = 0; i < unique.length; i += 1) {
        for (let j = i + 1; j < unique.length; j += 1) {
          pairs.push({ componentA: unique[i], componentB: unique[j], status: "inferred stream-name pair" });
        }
      }
      return pairs.slice(0, 12);
    }

    function binaryRatioPlaceholderDecision(group, candidate) {
      const missing = minimalMissingForCandidate(group, candidate);
      const pairCount = inferredComponentPairsForGroup(group).length;
      return {
        decision: group.selectedUnit === candidate.name ? "weak" : "weak",
        confidence: "not screened",
        reason: pairCount
          ? "Binary-ratio screening requires component-level property values and a threshold set; inferred stream-name pairs are available but not enough for Garg-like screening."
          : "Binary-ratio screening requires explicit mixture components, component-level property values, and a threshold set.",
        missing: [...new Set(["component property matrix", "threshold set", ...missing])].slice(0, 4)
      };
    }

    function minimalPropertyDecision(group, candidate) {
      const phen = new Set(group.phenomena || []);
      const family = candidateSeparationFamily(candidate);
      const groupFamilies = groupSeparationFamilies(group);
      const missing = minimalMissingForCandidate(group, candidate);
      const selectedBoost = group.selectedUnit === candidate.name;
      const candidateName = candidate.name.toLowerCase();
      const prop = id => normalizedGroupProperty(group, id);
      const propText = id => `${prop(id).value} ${prop(id).note}`.toLowerCase();
      const miscibility = propText("miscibility");
      const azeotrope = propText("azeotrope_risk");
      const has = id => propertyHasValue(group, id);
      const hasSelectivity = has("separation_selectivity") || has("partition_coefficient");
      const hasAgent = has("separating_agent");

      if (family === "vl" && groupFamilies.has("ll") && !groupFamilies.has("vl")) {
        return {
          decision: selectedBoost ? "weak" : "reject",
          confidence: "medium",
          reason: "This option relies mainly on V-L driving force, while the group evidence is L-L contact/separation.",
          missing: ["boiling point gap", "VLE/azeotrope check"]
        };
      }
      if (family === "ll" && groupFamilies.has("vl") && !groupFamilies.has("ll")) {
        return {
          decision: selectedBoost ? "weak" : "reject",
          confidence: "medium",
          reason: "This option relies mainly on L-L phase split/contact, while the group evidence is V-L phase transition/separation.",
          missing: ["miscibility", "partition preference"]
        };
      }
      if (family === "ls" && !groupFamilies.has("ls") && (groupFamilies.has("vl") || groupFamilies.has("ll"))) {
        return {
          decision: selectedBoost ? "weak" : "reject",
          confidence: "medium",
          reason: "Solid-liquid evidence is not present in the grouped phenomena or stream phases.",
          missing: ["solid loading", "particle/cake behavior"]
        };
      }

      if (family === "ll") {
        if (/\bimmiscible\b|partial|two phase|two-phase|ll/.test(miscibility)) {
          return {
            decision: "keep",
            confidence: has("density_difference") || has("partition_coefficient") ? "high" : "medium",
            reason: "L-L split/contact is consistent with the group and miscibility supports a liquid-liquid route.",
            missing
          };
        }
        if (/\bmiscible\b|single phase|single-phase/.test(miscibility) && !hasAgent) {
          return {
            decision: selectedBoost ? "weak" : "reject",
            confidence: "high",
            reason: "Reported miscibility weakens a decanter/extraction choice unless a separating agent or phase split is created.",
            missing: ["separating agent or miscibility gap evidence"]
          };
        }
        return {
          decision: "weak",
          confidence: "medium",
          reason: "L-L phenomena fit, but miscibility/partition evidence is not yet sufficient to justify keep vs reject.",
          missing
        };
      }

      if (family === "vl") {
        if (/yes|azeotrope|difficult|pressure/.test(azeotrope) && /distillation|evaporation|flash/.test(candidateName) && !/extractive|azeotropic|membrane|entrainer/.test(candidateName) && !hasAgent) {
          return {
            decision: selectedBoost ? "weak" : "reject",
            confidence: "medium",
            reason: "Azeotrope or difficult VLE evidence makes a simple V-L alternative weak; consider an intensified or entrainer-based option.",
            missing: ["pressure sensitivity", "separating agent check"]
          };
        }
        return {
          decision: has("boiling_point") || has("vapor_pressure") ? "keep" : "weak",
          confidence: has("boiling_point") && (has("vapor_pressure") || has("azeotrope_risk")) ? "high" : "medium",
          reason: "V-L phenomena fit; boiling point, vapor pressure, and VLE notes determine whether this is robust or only plausible.",
          missing
        };
      }

      if (family === "ls") {
        return {
          decision: has("solubility") || has("solid_loading") || has("particle_size") || has("cake_resistance") ? "keep" : "weak",
          confidence: has("particle_size") || has("cake_resistance") ? "medium" : "low",
          reason: "Solid-liquid phenomena fit, but equipment choice depends on solids loading, solubility, and cake/particle behavior.",
          missing
        };
      }

      if (family === "membrane") {
        return {
          decision: hasSelectivity ? "keep" : "weak",
          confidence: hasSelectivity ? "medium" : "low",
          reason: "Membrane alternatives need selectivity or affinity evidence; keep as an intensified option when conventional separation is weak.",
          missing: missing.length ? missing : ["selectivity / affinity", "fouling risk"]
        };
      }

      return {
        decision: candidate.sameTask || candidate.overlap?.length ? "weak" : "reject",
        confidence: "low",
        reason: "No specific property-screening rule matched this alternative; keep only if manually justified by process context.",
        missing: missing.length ? missing : ["selection basis"]
      };
    }

    function groupSeparationFamilies(group) {
      const phen = new Set(group.phenomena || []);
      const context = groupPhaseContext(group);
      const families = new Set();
      if ([...phen].some(code => code.includes("VL") || code === "PCh(L->V)" || code === "PCh(V->L)") || phaseContextHas(context, "VL")) families.add("vl");
      if ([...phen].some(code => code.includes("LL")) || phaseContextHas(context, "LL")) families.add("ll");
      if ([...phen].some(code => code.includes("LS") || code === "PCh(L->S)" || code === "PCh(S->L)") || phaseContextHas(context, "LS")) families.add("ls");
      if ([...phen].some(code => code.includes("MV"))) families.add("membrane");
      return families;
    }

    function candidateSeparationFamily(candidate) {
      const text = `${candidate.name} ${candidate.task} ${candidate.phenomena?.join(" ") || ""}`.toLowerCase();
      if (/membrane|pervaporation|permeation/.test(text)) return "membrane";
      if (/liquid-liquid|decanter|extraction|mixer-settler|\bll\b|pc\(ll\)|ps\(ll\)|pt\(ll\)/.test(text)) return "ll";
      if (/filtration|crystallization|drying|solid|molecular sieve|\bls\b|pc\(ls\)|ps\(ls\)|pt\(ls\)/.test(text)) return "ls";
      if (/distillation|evaporation|flash|condensation|stripping|absorption|reboil|\bvl\b|pc\(vl\)|ps\(vl\)|pt\(vl\)/.test(text)) return "vl";
      return "other";
    }

    function minimalMissingForCandidate(group, candidate) {
      const family = candidateSeparationFamily(candidate);
      const name = candidate.name.toLowerCase();
      const missing = [];
      const need = (id, label) => { if (!propertyHasValue(group, id)) missing.push(label); };
      if (family === "ll") {
        need("miscibility", "miscibility");
        if (/decanter|settler|liquid-liquid/.test(name)) need("density_difference", "density gap");
        if (/extraction|wash|mixer-settler/.test(name)) need("partition_coefficient", "partition preference");
        if (/extract|agent|solvent/.test(name)) need("separating_agent", "separating agent");
      } else if (family === "vl") {
        need("boiling_point", "boiling point gap");
        need("azeotrope_risk", "VLE/azeotrope check");
        if (/extractive|azeotropic|entrainer/.test(name)) need("separating_agent", "entrainer / separating agent");
        if (/vacuum|distillation|evaporation|thin|short-path|solvent|purification/.test(name)) need("degradation_temperature", "thermal limit");
      } else if (family === "ls") {
        if (/crystall/.test(name)) need("solubility", "solubility");
        if (/filter|dry|solid|sieve/.test(name)) need("solid_loading", "solid loading");
        if (/filter|centrif|dry/.test(name)) need("particle_size", "particle/cake behavior");
      } else if (family === "membrane") {
        need("separation_selectivity", "selectivity / affinity");
        missing.push("fouling risk");
      }
      return [...new Set(missing)].slice(0, 4);
    }

    function normalizedGroupProperty(group, id) {
      const prompt = propertyPromptCatalog.find(item => item.id === id) || { id, unit: "" };
      return normalizePropertyValue(ensureGroup(group.id).properties[id], prompt);
    }

    function propertyHasValue(group, id) {
      const value = normalizedGroupProperty(group, id);
      if (Boolean(String(value.value || "").trim() || String(value.note || "").trim()) && value.status !== "missing") return true;
      const conditions = groupConditionMap(group);
      return Boolean(String(conditions[id] || "").trim());
    }

    function propertyPromptsForGroup(group) {
      const phenomena = new Set(group.phenomena || []);
      const groupState = ensureGroup(group.id);
      return propertyPromptCatalog
        .filter(prompt => prompt.phenomena.some(code => phenomena.has(code)) || Boolean(groupState.properties?.[prompt.id]) || propertyNeededForFramework(prompt, group))
        .filter(prompt => propertyNeededForFramework(prompt, group));
    }

    function propertyNeededForFramework(prompt, group) {
      const phen = new Set(group.phenomena || []);
      const conditions = groupConditionMap(group);
      const text = `${group.task || ""} ${group.text || ""} ${group.selectedUnit || ""}`.toLowerCase();
      if (["boiling_point", "vapor_pressure", "azeotrope_risk", "degradation_temperature"].includes(prompt.id)) {
        return [...phen].some(code => ["PT(VL)", "PS(VL)", "PCh(L->V)", "PCh(V->L)"].includes(code))
          || Boolean(conditions.target_pressure)
          || /vacuum|evapor|distill|solvent|volatile|reflux|conden/.test(text);
      }
      if (["miscibility", "density_difference", "partition_coefficient", "emulsion_risk"].includes(prompt.id)) {
        return [...phen].some(code => ["PT(LL)", "PS(LL)", "PC(LL)", "2phM(LL)"].includes(code));
      }
      if (["solubility", "particle_size", "cake_resistance"].includes(prompt.id)) {
        return [...phen].some(code => ["PT(LS)", "PS(LS)", "PC(LS)", "2phM(LS)", "PCh(L->S)", "PCh(S->L)"].includes(code));
      }
      if (prompt.id === "separation_selectivity") {
        return [...phen].some(code => ["PT(MVL)", "PT(MVV)", "PT(MLL)", "PC(LS)", "PC(LL)", "PS(LS)", "PS(LL)"].includes(code))
          || /membrane|adsorb|affinity|selectiv|extract|wash|drying agent|molecular sieve/.test(text);
      }
      if (prompt.id === "separating_agent") {
        return [...phen].some(code => ["PT(MVL)", "PT(MLL)", "PC(LL)", "PT(LL)", "PS(LL)"].includes(code))
          || /entrainer|extractant|separating agent|adsorbent|molecular sieve|membrane|extractive|azeotropic/.test(text);
      }
      if (prompt.id === "heat_capacity") {
        return phen.has("ES(H)") || phen.has("ES(C)");
      }
      if (prompt.id === "density") {
        return mixingPhysicalPropertiesNeeded(group) || [...phen].some(code => ["2phM(LL)", "2phM(LS)", "PS(LL)", "PS(LS)"].includes(code));
      }
      if (prompt.id === "viscosity") {
        return mixingPhysicalPropertiesNeeded(group) || [...phen].some(code => ["2phM(LL)", "2phM(LS)", "PC(LL)", "PC(LS)", "PS(LL)", "PS(LS)"].includes(code));
      }
      if (prompt.id === "hazard_note") {
        return Boolean(conditions.target_pressure)
          || [...phen].some(code => ["PT(VL)", "PS(VL)", "PC(VL)", "PS(LL)", "PS(LS)", "PCh(L->V)"].includes(code))
          || /hazard|flamm|toxic|corrosive|vacuum|vent|waste|purge/.test(text);
      }
      return true;
    }

    function mixingPhysicalPropertiesNeeded(group) {
      const phen = new Set(group.phenomena || []);
      const schedule = ensureGroup(group.id).schedule || {};
      const text = `${group.task || ""} ${group.text || ""} ${group.selectedUnit || ""} ${schedule.scaleSensitivity || ""}`.toLowerCase();
      const hasMixing = [...phen].some(code => code.startsWith("M(") || code.startsWith("2phM("));
      if (!hasMixing) return false;
      if ([...phen].some(code => code.startsWith("2phM(") || code.startsWith("PC(") || code.startsWith("PT("))) return true;
      if (/vigorous|suspension|dispersion|emulsion|mass transfer|viscous|slurry|scale|equipment dependent|increases with scale|reactor|cstr|impeller/.test(text)) return true;
      return false;
    }

    function propertyNeedLevel(prompt, group) {
      if (["heat_capacity", "boiling_point", "vapor_pressure", "azeotrope_risk", "miscibility", "density_difference", "particle_size", "cake_resistance", "separation_selectivity"].includes(prompt.id)) return "needed";
      if (["separating_agent", "partition_coefficient"].includes(prompt.id)) return "risk";
      if (["density", "viscosity"].includes(prompt.id)) return mixingPhysicalPropertiesNeeded(group) ? "needed" : "optional";
      if (["degradation_temperature", "emulsion_risk", "hazard_note"].includes(prompt.id)) return "risk";
      return "optional";
    }

    function propertyValuesForGroup(group) {
      const groupState = ensureGroup(group.id);
      return propertyPromptsForGroup(group)
        .map(prompt => {
          const saved = normalizePropertyValue(groupState.properties[prompt.id], prompt);
          return { ...prompt, ...saved, needLevel: propertyNeedLevel(prompt, group) };
        })
        .filter(item => item.value || item.note);
    }

    function propertyMissingStripHtml(group, prompts) {
      const missing = prompts
        .filter(prompt => propertyNeedLevel(prompt, group) !== "optional" && !propertyHasValue(group, prompt.id))
        .map(prompt => prompt.label);
      if (!missing.length) return `<div class="property-readiness ok"><strong>Ready</strong><span>Required separation properties are present or inherited from conditions.</span></div>`;
      return `
        <div class="property-readiness">
          <strong>Missing for stronger decisions</strong>
          <span>${missing.slice(0, 6).map(item => `<span class="pill warn">${escapeHtml(item)}</span>`).join("")}${missing.length > 6 ? `<span class="pill">${missing.length - 6} more</span>` : ""}</span>
        </div>
      `;
    }

    function propertyFamilyForPrompt(prompt) {
      if (["boiling_point", "vapor_pressure", "azeotrope_risk", "degradation_temperature"].includes(prompt.id)) {
        return { id: "vl", title: "Vapor-Liquid / Volatility" };
      }
      if (["miscibility", "density_difference", "partition_coefficient", "emulsion_risk"].includes(prompt.id)) {
        return { id: "ll", title: "Liquid-Liquid" };
      }
      if (["solubility", "particle_size", "cake_resistance"].includes(prompt.id)) {
        return { id: "ls", title: "Solid-Liquid / Solids" };
      }
      if (["separation_selectivity", "separating_agent"].includes(prompt.id)) {
        return { id: "affinity", title: "Affinity / Separating Agent" };
      }
      if (["heat_capacity", "density", "viscosity"].includes(prompt.id)) {
        return { id: "physical", title: "Physical / Energy" };
      }
      return { id: "risk", title: "Risk / Compatibility" };
    }

    function propertyPromptGroups(prompts) {
      const order = ["vl", "ll", "ls", "affinity", "physical", "risk"];
      const byFamily = new Map();
      prompts.forEach(prompt => {
        const family = propertyFamilyForPrompt(prompt);
        if (!byFamily.has(family.id)) byFamily.set(family.id, { ...family, items: [] });
        byFamily.get(family.id).items.push(prompt);
      });
      return Array.from(byFamily.values()).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    function propertyPromptFamilyHtml(groupState, family) {
      return `
        <div class="condition-family property-family">
          <div class="condition-family-head">
            <span>${escapeHtml(family.title)}</span>
            <span class="pill">${family.items.length}</span>
          </div>
          <div class="condition-grid property-edit-grid">
            ${family.items.map(prompt => propertyEditHtml(groupState, prompt)).join("")}
          </div>
        </div>
      `;
    }

    function normalizePropertyValue(value, prompt) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { value: "", unit: prompt.unit || "", status: "missing", note: "" };
      }
      return {
        value: String(value.value || ""),
        unit: String(value.unit || prompt.unit || ""),
        status: streamDataStatuses.includes(value.status) ? value.status : "missing",
        note: String(value.note || "")
      };
    }

    function propertyEditHtml(group, prompt) {
      const value = normalizePropertyValue(group.properties[prompt.id], prompt);
      const level = propertyNeedLevel(prompt, group);
      return `
        <article class="condition-edit-card tip" data-tip="${escapeAttr(prompt.reason)}">
          <div class="condition-family-head property-need-head"><span>${escapeHtml(prompt.label)}</span><span class="pill ${level === "needed" ? "warn" : level === "risk" ? "blue" : ""}">${escapeHtml(level)}</span></div>
          <div class="condition-input-row">
            <input data-property-field="value" data-property-id="${escapeAttr(prompt.id)}" data-property-group="${escapeAttr(group.id)}" value="${escapeAttr(value.value)}" placeholder="${escapeAttr(prompt.placeholder)}">
            <input data-property-field="unit" data-property-id="${escapeAttr(prompt.id)}" data-property-group="${escapeAttr(group.id)}" value="${escapeAttr(value.unit)}" placeholder="unit">
          </div>
          <select data-property-field="status" data-property-id="${escapeAttr(prompt.id)}" data-property-group="${escapeAttr(group.id)}">${optionHtml(streamDataStatuses, value.status)}</select>
          <input data-property-field="note" data-property-id="${escapeAttr(prompt.id)}" data-property-group="${escapeAttr(group.id)}" value="${escapeAttr(value.note)}" placeholder="source, assumption, condition...">
        </article>
      `;
    }

    function propertyLabelHtml(item) {
      const display = [item.value, item.unit].filter(Boolean).join(" ") || item.note;
      return `
        <article class="condition-label-card tip" data-tip="${escapeAttr(item.reason)}">
          <strong>${escapeHtml(item.label)} <span class="pill">${escapeHtml(item.needLevel || "optional")}</span></strong>
          <span>${escapeHtml(display)}</span>
          <span class="pill ${item.status === "missing" ? "warn" : "blue"}">${escapeHtml(item.status)}</span>
        </article>
      `;
    }

    function updateGroupPropertyField(event) {
      const group = ensureGroup(event.target.dataset.propertyGroup);
      const prompt = propertyPromptCatalog.find(item => item.id === event.target.dataset.propertyId);
      if (!prompt) return;
      const current = normalizePropertyValue(group.properties[prompt.id], prompt);
      invalidateAiRefine();
      current[event.target.dataset.propertyField] = event.target.value;
      group.properties[prompt.id] = current;
      renderExport();
    }

    function renderPhenomenaGrid(block) {
      if (block) sanitizeBlockPhenomena(block);
      const container = $("phenomenaGridSection");
      if (!container) return;
      const expanded = Boolean(state.phenomenaGridExpanded);

      if (!expanded) {
        const assigned = block ? block.phenomena : [];
        container.innerHTML = `
          <div class="phen-summary-head">
            <div class="label">Phenomena On This Block</div>
            <button class="mini-button" data-toggle-phenomena-grid="true">Edit phenomena</button>
          </div>
          <div class="phen-summary-chips">
            ${assigned.length ? assigned.map(phenomenonPill).join("") : `<span class="muted small">No phenomena assigned yet.</span>`}
          </div>
        `;
        container.querySelectorAll("[data-toggle-phenomena-grid]").forEach(button => {
          button.addEventListener("click", () => {
            state.phenomenaGridExpanded = true;
            renderPhenomenaGrid(selectedBlock());
          });
        });
        return;
      }

      const options = availablePhenomenaForBlock(block);
      const phaseContext = block ? blockPhaseContext(block) : null;
      const phaseHint = block && !phaseContext.hasKnown
        ? `<div class="muted small" style="margin-bottom:6px">Add stream phases to filter Lutze-compatible phenomena.</div>`
        : "";
      container.innerHTML = `
        <div class="phen-summary-head">
          <div class="label">Phenomena On This Block</div>
          <button class="mini-button primary" data-toggle-phenomena-grid="false">Done</button>
        </div>
        ${phaseHint}
        <div class="phen-grid">
          ${options.map(phen => phenomenonOptionButton(phen, block?.phenomena.includes(phen), !block)).join("")}
        </div>
      `;
      container.querySelectorAll("[data-toggle-phenomena-grid]").forEach(button => {
        button.addEventListener("click", () => {
          state.phenomenaGridExpanded = false;
          renderPhenomenaGrid(selectedBlock());
        });
      });
      container.querySelectorAll("[data-phen]").forEach(button => {
        button.addEventListener("click", () => {
          const block = selectedBlock();
          if (!block) return;
          const phen = button.dataset.phen;
          if (!phenomenonCompatibleWithPhase(phen, blockPhaseContext(block))) return;
          block.phenomena = block.phenomena.includes(phen)
            ? block.phenomena.filter(item => item !== phen)
            : [...block.phenomena, phen];
          invalidateAiRefine();
          renderAll();
        });
      });
    }

    function stepEditorMode(root) {
      return root?.classList.contains("group-aggregate-drawer") ? "group" : "block";
    }

    function stepEditorConfig(mode) {
      if (mode === "group") {
        return { key: "groupStepEditorHeight", min: 320, fallback: 400 };
      }
      return { key: "stepEditorHeight", min: 115, fallback: 165 };
    }

    function applyStepFlowEditorSize(root, resizable = true, mode = "block") {
      if (!root) return;
      root.classList.toggle("resizable", Boolean(resizable));
      root.classList.toggle("group-aggregate-drawer", resizable && mode === "group");
      if (resizable) {
        const config = stepEditorConfig(mode);
        state[config.key] = Math.max(config.min, Math.min(stepEditorMaxHeight(mode), state[config.key] || config.fallback));
        root.style.height = `${state[config.key]}px`;
      } else {
        root.style.height = "";
      }
    }

    function rememberStepFlowEditorHeight() {
      const root = $("stepFlowInspector");
      if (!root?.classList.contains("resizable")) return;
      const height = Math.round(root.getBoundingClientRect().height);
      if (Number.isFinite(height) && height > 0) {
        const mode = stepEditorMode(root);
        const config = stepEditorConfig(mode);
        state[config.key] = Math.max(config.min, Math.min(stepEditorMaxHeight(mode), height));
      }
    }

    function stepEditorMaxHeight(mode = "block") {
      if (mode === "group") return Math.max(420, Math.min(900, window.innerHeight - 70));
      return Math.max(180, Math.min(700, window.innerHeight - 220));
    }

    function setStepEditorHeight(height) {
      const root = $("stepFlowInspector");
      if (!root?.classList.contains("resizable")) return;
      const mode = stepEditorMode(root);
      const config = stepEditorConfig(mode);
      const next = Math.max(config.min, Math.min(stepEditorMaxHeight(mode), Math.round(height)));
      state[config.key] = next;
      root.style.height = `${next}px`;
    }

    function startStepEditorResize(event) {
      const handle = event.target.closest("[data-step-flow-resize]");
      if (!handle) return;
      if (event.button !== undefined && event.button !== 0) return;
      const root = $("stepFlowInspector");
      if (!root?.classList.contains("resizable")) return;
      event.preventDefault();
      event.stopPropagation();
      stepEditorResizeDrag = {
        startY: event.clientY,
        startHeight: root.getBoundingClientRect().height
      };
      document.body.classList.add("step-flow-resizing");
      handle.setPointerCapture?.(event.pointerId);
    }

    function moveStepEditorResize(event) {
      if (!stepEditorResizeDrag) return;
      event.preventDefault();
      const delta = stepEditorResizeDrag.startY - event.clientY;
      setStepEditorHeight(stepEditorResizeDrag.startHeight + delta);
    }

    function stopStepEditorResize() {
      if (!stepEditorResizeDrag) return;
      stepEditorResizeDrag = null;
      document.body.classList.remove("step-flow-resizing");
      rememberStepFlowEditorHeight();
    }

    function renderStepFlowInspector() {
      const root = $("stepFlowInspector");
      const block = selectedBlock();
      if (!block) {
        const group = selectedGroup();
        if (group) {
          renderGroupAggregateStepInspector(root, group);
          return;
        }
        root.className = "step-flow-inspector empty";
        applyStepFlowEditorSize(root, false);
        root.innerHTML = `
          <span class="step-flag"><span class="step-flag-num">4</span><span class="step-flag-label">Network &amp; MFA</span></span>
          <div>Select a block to edit quantified MFA, or click Open Group on a group to see summed MFA, conditions, and unit alternatives.</div>
        `;
        return;
      }
      ensureBlockFlowFields(block);
      ensureBlockConditionFields(block);
      const counts = streamCounts(block);
      const editorMode = block.groupId ? "group" : "block";
      root.className = "step-flow-inspector";
      applyStepFlowEditorSize(root, true, editorMode);
      root.innerHTML = `
        <div class="step-flow-resize-handle" data-step-flow-resize title="Drag up or down to resize this editor over the flowchart"></div>
        <div class="step-flow-head">
          <div>
            <span class="step-flag"><span class="step-flag-num">4</span><span class="step-flag-label">Network &amp; MFA</span></span>
            <div class="label">Step MFA Editor</div>
            <strong>${escapeHtml(block.id)}</strong>
            <span class="pill">${escapeHtml(block.behavior)}</span>
          </div>
          <div class="mfa-summary-strip">
            <span class="pill blue">I:${counts.input}</span>
            <span class="pill green">Out:${counts.outlet}</span>
            ${conversionQuickActionHtml(block)}
            <span>material balance basis: per selected block</span>
          </div>
        </div>
        <div class="mfa-grid stream-editor-grid">
          ${streamEditorSections.map(role => streamSectionHtml(block, role)).join("")}
        </div>
        ${conditionPanelHtml(block)}
        ${blockLutzeReactionSeparationLaunchHtml(block)}
      `;
      root.querySelectorAll("[data-add-stream]").forEach(button => {
        button.addEventListener("click", () => {
          const current = selectedBlock();
          if (!current) return;
          ensureBlockFlowFields(current);
          pushUndo();
          const addRole = button.dataset.addStream === "outlet" ? "output" : button.dataset.addStream;
          const stream = createStream(addRole, { editing: true });
          stream.id = nextStreamId(current);
          current.streams.push(stream);
          syncLegacyStreamLists(current);
          renderAll();
        });
      });
      root.querySelectorAll("[data-copy-inputs-to-outputs]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          copyInputsToOutputs(selectedBlock());
        });
      });
      root.querySelectorAll("[data-copy-input-stream-to-output]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          copyOneInputToOutput(selectedBlock(), button.dataset.copyInputStreamToOutput);
        });
      });
      root.querySelectorAll("[data-apply-stream-suggestion]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          applyStreamSuggestion(button.dataset.applyStreamSuggestion, button.dataset);
        });
      });
      root.querySelectorAll("[data-apply-stream-pubchem-suggestion]").forEach(button => {
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          applyStreamPubChemSuggestion(button.dataset.applyStreamPubchemSuggestion, button.dataset.pubchemSuggestionName);
        });
      });
      root.querySelectorAll("[data-fetch-stream-pubchem]").forEach(button => {
        button.addEventListener("click", async event => {
          event.preventDefault();
          event.stopPropagation();
          await fetchPubChemForStream(button.dataset.fetchStreamPubchem, button);
        });
      });
      root.querySelectorAll("[data-remove-stream]").forEach(button => {
        button.addEventListener("click", () => {
          const current = selectedBlock();
          if (!current) return;
          pushUndo();
          current.streams = current.streams.filter(stream => stream.id !== button.dataset.removeStream);
          syncLegacyStreamLists(current);
          renderAll();
        });
      });
      root.querySelectorAll("[data-save-stream]").forEach(button => {
        button.addEventListener("click", async () => {
          const current = selectedBlock();
          if (!current) return;
          const stream = current.streams.find(item => item.id === button.dataset.saveStream);
          if (!stream) return;
          if (!stream.phase || stream.phase === "unknown") {
            await alertModal("Select the Lutze phase category before saving this stream.");
            return;
          }
          stream.editing = false;
          syncLegacyStreamLists(current);
          renderAll();
        });
      });
      root.querySelectorAll("[data-stream-label]").forEach(label => {
        label.addEventListener("contextmenu", event => {
          event.preventDefault();
          event.stopPropagation();
          showStreamMenu(event.clientX, event.clientY, label.dataset.streamLabel);
        });
        label.addEventListener("dblclick", () => {
          editStream(label.dataset.streamLabel);
        });
      });
      root.querySelectorAll("[data-stream-field]").forEach(field => {
        field.addEventListener("input", updateStreamField);
        field.addEventListener("change", updateStreamField);
      });
      root.querySelectorAll("[data-open-condition-family]").forEach(section => {
        section.addEventListener("click", event => {
          if (event.target.closest("[data-open-conversion-modal], button, input, select, textarea")) return;
          const current = selectedBlock();
          if (!current) return;
          current.openConditionFamily = section.dataset.openConditionFamily;
          renderStepFlowInspector();
        });
      });
      root.querySelectorAll("[data-save-condition-family]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          const current = selectedBlock();
          if (!current) return;
          current.openConditionFamily = null;
          renderAll();
        });
      });
      root.querySelectorAll("[data-condition-field]").forEach(field => {
        field.addEventListener("input", updateConditionField);
      });
      root.querySelectorAll("[data-condition-unit]").forEach(field => {
        field.addEventListener("change", updateConditionUnit);
      });
      root.querySelectorAll("[data-open-conversion-modal]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          openConversionModal(button.dataset.openConversionModal);
        });
      });
      root.querySelectorAll("[data-open-lutze-reaction-separation]").forEach(button => {
        button.addEventListener("click", () => openLutzeReactionSeparation(button.dataset.openLutzeReactionSeparation));
      });
    }

    function blockLutzeReactionSeparationLaunchHtml(block) {
      if (!block?.groupId) return "";
      const group = groupModel(block.groupId);
      if (!group) return "";
      const model = separationSimulatorModel(group);
      if (!postReactionSeparationSupportApplies(group, model)) return "";
      return lutzeReactionSeparationLaunchHtml(group, model);
    }

    function renderGroupAggregateStepInspector(root, group) {
      const mfa = aggregateGroupStreams(group);
      const mfaByRole = mfaGroupsForDisplay(mfa);
      const conditions = aggregateGroupConditions(group);
      const separationModel = separationSimulatorModel(group);
      const showPostReactionSupport = postReactionSeparationSupportApplies(group, separationModel);
      const mfaCount = mfa.reduce((sum, roleGroup) => sum + roleGroup.items.length, 0);
      root.className = "step-flow-inspector";
      applyStepFlowEditorSize(root, true, "group");
      root.innerHTML = `
        <div class="step-flow-resize-handle" data-step-flow-resize title="Drag up or down to resize this editor over the flowchart"></div>
        <div class="step-flow-head">
          <div>
            <span class="step-flag"><span class="step-flag-num">4</span><span class="step-flag-label">Network &amp; MFA</span></span>
            <div class="label">Group Aggregate View</div>
            <strong>${escapeHtml(group.id)}</strong>
            <span class="pill blue">${escapeHtml(group.task)}</span>
            <div class="drawer-head-phenomena">
              ${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted small">No phenomena assigned.</span>`}
            </div>
          </div>
          <div class="mfa-summary-strip">
            <span class="pill">${group.blocks.length} blocks</span>
            <span class="pill green">${group.phenomena.length} phenomena</span>
            <span class="pill blue">${mfaCount} MFA groups</span>
            <span class="pill warn">${conditions.length} conditions</span>
          </div>
        </div>
        <div class="group-drawer-work-grid">
          <div class="group-drawer-section-label">
            <strong>Material & Conditions</strong>
          </div>
          <div class="mfa-grid group-mfa-grid">
            ${mfaByRole.map(roleGroup => `
              <section class="mfa-section role-${escapeAttr(roleGroup.role)}">
                <div class="mfa-section-head">
                  <strong>${escapeHtml(streamSectionMeta(roleGroup.role).title)}</strong>
                  <span class="pill">${roleGroup.items.length}</span>
                </div>
                <div class="mfa-rows">
                  ${roleGroup.items.length
                    ? roleGroup.items.map(item => groupMfaItemHtml(item, group.id, true, roleGroup.role)).join("")
                    : `<div class="mfa-empty">${escapeHtml(streamSectionMeta(roleGroup.role).empty)}</div>`}
                </div>
              </section>
            `).join("")}
          </div>
          <div class="condition-panel group-drawer-panel">
            <div class="condition-head">
              <strong>Group Condition Profile</strong>
              <span class="muted small">composite values, editable when needed</span>
            </div>
            <div class="condition-body">
              ${groupConditionProfileHtml(group, conditions)}
            </div>
          </div>
          ${showPostReactionSupport ? `
            <div class="group-drawer-section-label post-reaction-support-label">
              <div>
                <strong>Lutze Reaction-Separation</strong>
                <span>Run the substance-separation sandbox only when you want to test post-reaction pathway variants.</span>
              </div>
            </div>
            ${lutzeReactionSeparationLaunchHtml(group, separationModel)}
          ` : ""}
        </div>
      `;
      root.querySelectorAll("[data-group-task-aggregate]").forEach(input => {
        input.addEventListener("input", () => {
          ensureGroup(input.dataset.groupTaskAggregate).task = input.value;
          invalidateAiRefine();
          renderGroupFlow();
          renderStepAuditPanel();
          renderExport();
        });
        input.addEventListener("change", renderAll);
      });
      root.querySelectorAll("[data-review-lutze]").forEach(button => {
        button.addEventListener("click", () => {
          const group = groupModel(button.dataset.reviewLutze);
          if (!group) return;
          const target = group.blocks.find(block => !(block.phenomena || []).length) || group.blocks[0];
          if (target) {
            state.selectedBlockId = target.id;
            state.selectedGroupId = group.id;
            state.selectedIds = [target.id];
          } else {
            state.selectedBlockId = null;
            state.selectedGroupId = group.id;
            state.selectedIds = [];
          }
          setInspectorTab("inspect");
          renderAll();
        });
      });
      root.querySelectorAll("[data-suggest-unit-operation]").forEach(button => {
        button.addEventListener("click", () => {
          const target = ensureGroup(button.dataset.suggestUnitOperation);
          target.unitSuggestionsExpanded = true;
          renderStepFlowInspector();
        });
      });
      root.querySelectorAll("[data-open-block-from-group]").forEach(button => {
        button.addEventListener("click", () => selectBlock(button.dataset.openBlockFromGroup, false));
      });
      root.querySelectorAll("[data-unit]").forEach(button => {
        button.addEventListener("click", async () => {
          const unit = button.dataset.unit;
          const groupId = button.dataset.unitGroup;
          const group = groupModel(groupId);
          const readiness = group ? groupUnitSuggestionReadiness(group) : null;
          if (!readiness?.ready) {
            await alertModal(`Complete ${readiness?.missing.join(", ") || "task data"} before selecting a unit operation.`);
            return;
          }
          if (!(await confirmModal(`Set the selected unit for ${groupId} to "${unit}"? This overrides the current unit choice.`))) return;
          pushUndo();
          ensureGroup(groupId).selectedUnit = unit;
          renderAll();
        });
      });
      root.querySelectorAll("[data-selection-basis]").forEach(input => {
        input.addEventListener("change", () => {
          ensureGroup(input.dataset.selectionBasis).selectionBasis = input.value.trim();
          renderExport();
        });
      });
      root.querySelectorAll("[data-open-lutze-reaction-separation]").forEach(button => {
        button.addEventListener("click", () => openLutzeReactionSeparation(button.dataset.openLutzeReactionSeparation));
      });
      bindGroupPropertiesControls(root, group.id);
      root.querySelectorAll("[data-edit-group-conditions]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.editGroupConditions).conditionsEditing = true;
          renderStepFlowInspector();
        });
      });
      root.querySelectorAll("[data-save-group-conditions]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.saveGroupConditions).conditionsEditing = false;
          renderAll();
        });
      });
      root.querySelectorAll("[data-group-condition-value], [data-group-condition-note]").forEach(input => {
        input.addEventListener("input", updateGroupConditionOverrideField);
        input.addEventListener("change", updateGroupConditionOverrideField);
      });
      root.querySelectorAll("[data-open-override]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.overrideGroup).openOverrideKey = button.dataset.openOverride;
          renderStepFlowInspector();
        });
      });
      root.querySelectorAll("[data-save-override]").forEach(button => {
        button.addEventListener("click", () => {
          const groupState = ensureGroup(button.dataset.overrideGroupSave);
          const key = button.dataset.saveOverride;
          const kind = button.dataset.overrideKind;
          const valueInput = [...root.querySelectorAll("[data-override-value]")].find(el => el.dataset.overrideValue === key);
          const noteInput = [...root.querySelectorAll("[data-override-note]")].find(el => el.dataset.overrideNote === key);
          const value = valueInput?.value.trim() || "";
          const note = noteInput?.value.trim() || "";
          const store = kind === "mfa" ? groupState.mfaOverrides : groupState.conditionOverrides;
          if (value) store[key] = { value, note }; else delete store[key];
          groupState.openOverrideKey = "";
          renderAll();
        });
      });
      root.querySelectorAll("[data-clear-override]").forEach(button => {
        button.addEventListener("click", () => {
          const groupState = ensureGroup(button.dataset.overrideGroup);
          const kind = button.dataset.overrideKind;
          const store = kind === "mfa" ? groupState.mfaOverrides : groupState.conditionOverrides;
          delete store[button.dataset.clearOverride];
          groupState.openOverrideKey = "";
          renderAll();
        });
      });
    }

    function updateGroupConditionOverrideField(event) {
      const input = event.target;
      const groupId = input.dataset.groupConditionGroup;
      const key = input.dataset.groupConditionValue || input.dataset.groupConditionNote;
      const groupState = ensureGroup(groupId);
      const root = $("stepFlowInspector");
      const valueInput = [...root.querySelectorAll("[data-group-condition-value]")].find(el => el.dataset.groupConditionValue === key);
      const noteInput = [...root.querySelectorAll("[data-group-condition-note]")].find(el => el.dataset.groupConditionNote === key);
      const value = valueInput?.value.trim() || "";
      const note = noteInput?.value.trim() || "";
      invalidateAiRefine();
      if (value || note) {
        groupState.conditionOverrides[key] = { value, note };
      } else {
        delete groupState.conditionOverrides[key];
      }
      renderExport();
    }

    function conditionPanelHtml(block) {
      const prompts = conditionPromptsForBlock(block);
      const values = conditionValuesForBlock(block, prompts);
      const promptGroups = conditionPromptGroups(prompts);
      const valueGroups = conditionValueGroups(values);
      const contextLabel = block.groupId
        ? `group context: ${block.groupId}`
        : "block context";
      if (!prompts.length) {
        return `
          <section class="condition-panel">
            <div class="condition-head">
              <strong>Phenomenon Conditions</strong>
              <span class="muted small">assign phenomena to generate condition prompts</span>
            </div>
          </section>
        `;
      }
      const valuesByFamily = new Map(valueGroups.map(group => [group.id, group]));
      const openFamily = block.openConditionFamily || null;
      return `
        <section class="condition-panel">
          <div class="condition-head">
            <strong>Phenomenon Conditions</strong>
            <span class="muted small">${values.length}/${prompts.length} filled, ${escapeHtml(contextLabel)} — open one section at a time</span>
          </div>
          <div class="condition-body">
            ${promptGroups.map(group => {
              const saved = valuesByFamily.get(group.id);
              const savedCount = saved ? saved.items.length : 0;
              const isOpen = openFamily === group.id;
              if (isOpen) {
                return `
                  <div class="condition-family open">
                    <div class="condition-family-head">
                      <span>${escapeHtml(group.title)}</span>
                      <button class="primary" data-save-condition-family="${escapeAttr(group.id)}">Save & Close</button>
                    </div>
                    <div class="condition-grid">
                      ${group.items.map(prompt => conditionEditCardHtml(block, prompt)).join("")}
                    </div>
                  </div>
                `;
              }
              return `
                <div class="condition-family collapsed" data-open-condition-family="${escapeAttr(group.id)}" title="Click to open and edit this section">
                  <div class="condition-family-head">
                    <span>${escapeHtml(group.title)}</span>
                    <span class="pill ${savedCount ? "green" : ""}">${savedCount ? `${savedCount} saved` : "empty"}</span>
                  </div>
                  ${savedCount ? `
                    <div class="condition-chip-row">
                      ${saved.items.map(item => conditionCollapsedChipHtml(block, item)).join("")}
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }

    function conversionQuickActionHtml(block) {
      const hasReaction = (block.phenomena || []).some(code => code.startsWith("R(")) || Boolean(block.conditions?.conversion_yield);
      if (!hasReaction) return "";
      const value = String(block.conditions?.conversion_yield || "").trim();
      const label = value ? `Edit conversion ${value}%` : "Set conversion";
      return `<button type="button" class="conversion-quick-button" data-open-conversion-modal="${escapeAttr(block.id)}">${escapeHtml(label)}</button>`;
    }

    function conditionCollapsedChipHtml(block, item) {
      if (item.kind === "conversion") {
        return `
          <button type="button" class="condition-chip condition-chip-button" data-open-conversion-modal="${escapeAttr(block.id)}" title="Edit conversion, product, byproducts, and residual waste split">
            <strong>${escapeHtml(item.label)}</strong> ${escapeHtml(formatConditionValue(item))}
          </button>
        `;
      }
      return `<span class="condition-chip"><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(formatConditionValue(item))}</span>`;
    }

    function conditionPromptsForBlock(block) {
      ensureBlockConditionFields(block);
      const phenomena = conditionContextPhenomena(block);
      return conditionPromptCatalog
        .filter(prompt => essentialConditionIds().has(prompt.id))
        .filter(prompt => conditionPromptApplies(prompt, phenomena));
    }

    function essentialConditionIds() {
      return new Set([
        "initial_temperature",
        "target_temperature",
        "holding_time",
        "holding_temperature",
        "thermal_ramp",
        "thermal_mode",
        "initial_pressure",
        "target_pressure",
        "mixing_time",
        "agitation_speed",
        "contact_time",
        "contact_device",
        "reaction_time",
        "conversion_yield",
        "phase_ratio",
        "transfer_endpoint",
        "phase_change_time",
        "phase_change_fraction",
        "settling_time",
        "separation_efficiency",
        "interface_risk",
        "solid_loading",
        "solid_endpoint",
        "split_fraction",
        "split_basis"
      ]);
    }

    function conditionContextPhenomena(block) {
      const codes = new Set(block.phenomena || []);
      if (block.groupId) {
        const group = groupModel(block.groupId);
        (group.phenomena || []).forEach(code => codes.add(code));
      }
      return codes;
    }

    function conditionPromptApplies(prompt, phenomena) {
      if (prompt.phenomena.some(code => phenomena.has(code))) return true;
      const codes = [...phenomena];
      const family = conditionFamilyForPrompt(prompt);
      if (family.id === "mixing") return codes.some(isMixingPhenomenon);
      if (family.id === "thermal") return codes.some(isThermalPhenomenon);
      if (family.id === "pressure") return codes.some(isVaporPressurePhenomenon);
      if (family.id === "reaction") return codes.some(code => code.startsWith("R("));
      if (family.id === "contact") return codes.some(isContactOrTransferPhenomenon);
      if (family.id === "ll-separation") return codes.some(isLiquidLiquidPhenomenon);
      if (family.id === "solid-separation") return codes.some(isSolidLiquidPhenomenon);
      if (family.id === "phase-separation") return codes.some(code => code.startsWith("PS(") || code.startsWith("PCh(") || code.startsWith("PT("));
      if (family.id === "split") return phenomena.has("SD");
      if (family.id === "waste") return codes.some(code => code.startsWith("PS(") || code.startsWith("PC("));
      return false;
    }

    function isMixingPhenomenon(code) {
      return code.startsWith("M(") || code.startsWith("2phM(");
    }

    function isThermalPhenomenon(code) {
      return ["ES(H)", "ES(C)", "PCh(L->V)", "PCh(V->L)", "PCh(L->S)", "PCh(S->L)"].includes(code) || code === "PT(VL)";
    }

    function isVaporPressurePhenomenon(code) {
      return ["PT(VL)", "PS(VL)", "PC(VL)", "PCh(L->V)", "PCh(V->L)", "ES(P)", "ES(E)"].includes(code);
    }

    function isContactOrTransferPhenomenon(code) {
      return code.startsWith("PC(") || code.startsWith("PT(") || code.startsWith("2phM(");
    }

    function isLiquidLiquidPhenomenon(code) {
      return ["PT(LL)", "PS(LL)", "PC(LL)", "2phM(LL)", "PT(MLL)"].includes(code);
    }

    function isSolidLiquidPhenomenon(code) {
      return ["PT(LS)", "PS(LS)", "PC(LS)", "2phM(LS)", "PCh(L->S)", "PCh(S->L)"].includes(code);
    }

    function conditionFamilyForPrompt(prompt) {
      if (["mixing_time", "agitation_speed"].includes(prompt.id)) {
        return { id: "mixing", title: "Mixing / Addition" };
      }
      if (["initial_temperature", "target_temperature", "holding_time", "holding_temperature", "thermal_ramp", "thermal_mode"].includes(prompt.id)) {
        return { id: "thermal", title: "Thermal / Holding" };
      }
      if (["initial_pressure", "target_pressure"].includes(prompt.id)) {
        return { id: "pressure", title: "Pressure / Vapor Handling" };
      }
      if (["reaction_time", "conversion_yield"].includes(prompt.id)) {
        return { id: "reaction", title: "Reaction" };
      }
      if (["contact_time", "contact_device", "agitation_note", "transfer_endpoint", "phase_change_time", "phase_change_fraction"].includes(prompt.id)) {
        return { id: "contact", title: "Contact / Transfer" };
      }
      if (["phase_ratio", "interface_risk"].includes(prompt.id)) {
        return { id: "ll-separation", title: "Liquid-Liquid" };
      }
      if (["solid_loading", "cake_or_particle_note", "solid_endpoint"].includes(prompt.id)) {
        return { id: "solid-separation", title: "Solid-Liquid / Solids" };
      }
      if (["settling_time", "separation_efficiency", "carryover_limit"].includes(prompt.id)) {
        return { id: "phase-separation", title: "Separation Performance" };
      }
      if (["split_fraction", "split_basis"].includes(prompt.id)) {
        return { id: "split", title: "Stream Split" };
      }
      if (["waste_note"].includes(prompt.id)) {
        return { id: "waste", title: "Waste / Handling" };
      }
      return { id: "other", title: "Other Conditions" };
    }

    function conditionPromptGroups(prompts) {
      return groupConditionDisplayItems(prompts, conditionFamilyForPrompt);
    }

    function conditionValueGroups(values) {
      return groupConditionDisplayItems(values, conditionFamilyForPrompt);
    }

    function groupConditionDisplayItems(items, familyFn) {
      const order = ["mixing", "thermal", "pressure", "reaction", "contact", "ll-separation", "solid-separation", "phase-separation", "split", "waste", "other"];
      const byFamily = new Map();
      items.forEach(item => {
        const family = familyFn(item);
        if (!byFamily.has(family.id)) byFamily.set(family.id, { ...family, items: [] });
        byFamily.get(family.id).items.push(item);
      });
      return Array.from(byFamily.values()).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    function conditionValuesForBlock(block, prompts = conditionPromptsForBlock(block)) {
      ensureBlockConditionFields(block);
      return prompts
        .map(prompt => ({
          ...prompt,
          value: String(block.conditions[prompt.id] || "").trim(),
          unit: block.conditionUnits[prompt.id] || defaultConditionUnit(prompt)
        }))
        .filter(item => item.value);
    }

    function conditionEditCardHtml(block, prompt) {
      const value = block.conditions[prompt.id] || "";
      const unit = block.conditionUnits[prompt.id] || defaultConditionUnit(prompt);
      if (prompt.kind === "conversion") {
        const detail = block.conversionDetail;
        const summary = value
          ? `Conversion: ${escapeHtml(value)}%${detail?.byproducts?.length ? ` · ${detail.byproducts.length} byproduct${detail.byproducts.length > 1 ? "s" : ""}` : ""}`
          : "Set conversion...";
        return `
          <label class="condition-edit-card">
            <div class="label">${escapeHtml(prompt.label)}</div>
            <div class="condition-input-row">
              <button type="button" class="conversion-open-button" data-open-conversion-modal="${escapeAttr(block.id)}">${summary}</button>
            </div>
            <div class="muted small condition-hint">Opens a popup to split reagents/product between converted, waste, and byproducts.</div>
          </label>
        `;
      }
      if (prompt.disabled) {
        return `
          <label class="condition-edit-card condition-edit-card-disabled">
            <div class="label">${escapeHtml(prompt.label)} <span class="pill">coming soon</span></div>
            <div class="condition-input-row">
              <input value="${escapeAttr(value)}" placeholder="${escapeAttr(prompt.placeholder)}" disabled title="${escapeAttr(prompt.hint || "")}">
              ${conditionUnitControlHtml(prompt, unit)}
            </div>
            ${prompt.hint ? `<div class="muted small condition-hint">${escapeHtml(prompt.hint)}</div>` : ""}
          </label>
        `;
      }
      return `
        <label class="condition-edit-card">
          <div class="label">${escapeHtml(prompt.label)}</div>
          <div class="condition-input-row">
            <input data-condition-field="${escapeAttr(prompt.id)}" value="${escapeAttr(value)}" placeholder="${escapeAttr(prompt.placeholder)}" ${prompt.kind === "number" ? "inputmode=\"decimal\"" : ""} ${prompt.hint ? `title="${escapeAttr(prompt.hint)}"` : ""}>
            ${conditionUnitControlHtml(prompt, unit)}
          </div>
          ${prompt.hint ? `<div class="muted small condition-hint">${escapeHtml(prompt.hint)}</div>` : ""}
        </label>
      `;
    }

    function conditionUnitControlHtml(prompt, unit) {
      if (Array.isArray(prompt.units)) {
        return `<select data-condition-unit="${escapeAttr(prompt.id)}">${prompt.units.map(item => `<option value="${escapeAttr(item)}" ${item === unit ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>`;
      }
      if (prompt.unit) {
        return `<span class="unit-badge">${escapeHtml(prompt.unit)}</span>`;
      }
      return `<span class="unit-badge">note</span>`;
    }

    function defaultConditionUnit(prompt) {
      return prompt.defaultUnit || prompt.unit || "";
    }

    function conditionLabelHtml(item) {
      return `
        <article class="condition-label-card" data-condition-label="${escapeAttr(item.id)}" title="Right-click to edit conditions">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(formatConditionValue(item))}</span>
        </article>
      `;
    }

    function updateConditionField(event) {
      const current = selectedBlock();
      if (!current) return;
      ensureBlockConditionFields(current);
      invalidateAiRefine();
      current.conditions[event.target.dataset.conditionField] = event.target.value;
      renderExport();
    }

    function updateConditionUnit(event) {
      const current = selectedBlock();
      if (!current) return;
      ensureBlockConditionFields(current);
      invalidateAiRefine();
      current.conditionUnits[event.target.dataset.conditionUnit] = event.target.value;
      renderExport();
    }

    function formatConditionValue(item) {
      return item.unit ? `${item.value} ${item.unit}` : item.value;
    }

    function streamSectionHtml(block, role) {
      const meta = streamSectionMeta(role);
      const streams = role === "outlet"
        ? block.streams.filter(stream => streamIsOutlet(stream))
        : block.streams.filter(stream => stream.role === role);
      const canCopyInputs = role === "outlet" && block.streams.some(stream => stream.role === "input" && String(stream.name || "").trim());
      return `
        <section class="mfa-section role-${escapeAttr(role)}">
          <div class="mfa-section-head">
            <strong>${escapeHtml(meta.title)}</strong>
            <div class="mfa-section-actions">
              ${canCopyInputs ? `<button class="mini-button" data-copy-inputs-to-outputs="${escapeAttr(block.id)}" title="Copy input streams as output/intermediate streams when material passes through this step">Copy inputs</button>` : ""}
              <button data-add-stream="${role}" title="Add ${escapeAttr(meta.title)} stream">${escapeHtml(meta.addLabel)}</button>
            </div>
          </div>
          <div class="mfa-rows">
            ${streams.length ? streams.map(stream => streamRowHtml(stream, meta.placeholder, role, block)).join("") : `<div class="mfa-empty">${escapeHtml(meta.empty)}</div>`}
          </div>
        </section>
      `;
    }

    function streamRowHtml(stream, placeholder, role = stream.role, block = null) {
      if (!stream.editing) return streamLabelHtml(stream, block);
      const sid = escapeAttr(stream.id);
      const hasAdvanced = Boolean(stream.recoveryPercent || stream.purgePercent || stream.loopId || stream.destinationGroup || stream.makeupRequired || stream.accumulationRisk);
      const hasChemical = streamHasChemicalProperties(stream);
      const actualRole = role === "outlet" ? (stream.role || "output") : role;
      const tone = streamTone(stream, role);
      const suggestionRole = role === "outlet" ? "outlet" : actualRole;
      const showConversionShortcut = streamNeedsConversionShortcut(stream, actualRole, block);
      return `
        <div class="mfa-row role-${escapeAttr(tone)}" data-stream-id="${sid}">
          <label class="stream-field span-2">
            <span class="stream-field-label">Material / stream</span>
            <div class="stream-name-row">
              <input data-stream-field="name" data-stream-id="${sid}" value="${escapeAttr(stream.name)}" placeholder="${escapeAttr(placeholder)}" autocomplete="off">
              <button type="button" class="mini-button" data-fetch-stream-pubchem="${sid}" title="Fetch optional pure-component properties for Lutze/scale-up support">PubChem</button>
            </div>
            ${streamSuggestionRailHtml(block, stream, suggestionRole)}
            ${streamPubChemSuggestionRailHtml(stream)}
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Amount</span>
            <input data-stream-field="quantity" data-stream-id="${sid}" value="${escapeAttr(stream.quantity)}" placeholder="amount" inputmode="decimal">
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Unit</span>
            <select data-stream-field="unit" data-stream-id="${sid}">${optionHtml(streamUnits, stream.unit)}</select>
          </label>
          ${showConversionShortcut ? `
            <div class="stream-conversion-shortcut span-2">
              <span>Quantity should come from conversion/yield for this reaction stream.</span>
              <button type="button" class="mini-button" data-open-conversion-modal="${escapeAttr(block.id)}">Use conversion</button>
            </div>
          ` : ""}
          <label class="stream-field">
            <span class="stream-field-label">Phase</span>
            <select data-stream-field="phase" data-stream-id="${sid}">${phaseOptionHtml(stream.phase)}</select>
          </label>
          ${actualRole !== "input" ? `
            <label class="stream-field">
              <span class="stream-field-label">Outlet type</span>
              <select data-stream-field="fate" data-stream-id="${sid}">${optionHtml(streamFateOptions.filter(item => item !== "fresh input"), stream.fate)}</select>
            </label>
          ` : ""}
          <label class="stream-field">
            <span class="stream-field-label">Data status</span>
            <select data-stream-field="status" data-stream-id="${sid}">${optionHtml(streamDataStatuses, stream.status)}</select>
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Timing</span>
            <select data-stream-field="timing" data-stream-id="${sid}">${optionHtml(streamTimingOptions, stream.timing)}</select>
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Scaling</span>
            <select data-stream-field="scalingMode" data-stream-id="${sid}">${optionHtml(streamScalingModes, stream.scalingMode)}</select>
          </label>
          <details class="stream-advanced span-2" ${hasAdvanced ? "open" : ""}>
            <summary>Fate, recycle & notes${hasAdvanced ? " •" : ""}</summary>
            <div class="stream-advanced-grid">
              ${actualRole === "input" ? `
                <label class="stream-field">
                  <span class="stream-field-label">Fate</span>
                  <select data-stream-field="fate" data-stream-id="${sid}">${optionHtml(streamFateOptions, stream.fate)}</select>
                </label>
              ` : ""}
              <label class="stream-field">
                <span class="stream-field-label">Recovery %</span>
                <input data-stream-field="recoveryPercent" data-stream-id="${sid}" value="${escapeAttr(stream.recoveryPercent)}" placeholder="90" inputmode="decimal">
              </label>
              <label class="stream-field">
                <span class="stream-field-label">Purge %</span>
                <input data-stream-field="purgePercent" data-stream-id="${sid}" value="${escapeAttr(stream.purgePercent)}" placeholder="5" inputmode="decimal">
              </label>
              <label class="stream-field">
                <span class="stream-field-label">Loop id</span>
                <input data-stream-field="loopId" data-stream-id="${sid}" value="${escapeAttr(stream.loopId)}" placeholder="e.g. CYHX">
              </label>
              <label class="stream-field span-2">
                <span class="stream-field-label">Destination</span>
                <input data-stream-field="destinationGroup" data-stream-id="${sid}" value="${escapeAttr(stream.destinationGroup)}" placeholder="destination group, treatment, recovery...">
              </label>
              <label class="stream-field span-2">
                <span class="stream-field-label">Make-up</span>
                <input data-stream-field="makeupRequired" data-stream-id="${sid}" value="${escapeAttr(stream.makeupRequired)}" placeholder="make-up amount or basis...">
              </label>
              <label class="stream-field span-2">
                <span class="stream-field-label">Accumulation risk</span>
                <input data-stream-field="accumulationRisk" data-stream-id="${sid}" value="${escapeAttr(stream.accumulationRisk)}" placeholder="impurity build-up concern...">
              </label>
              <label class="stream-field span-2">
                <span class="stream-field-label">Note</span>
                <input data-stream-field="note" data-stream-id="${sid}" value="${escapeAttr(stream.note)}" placeholder="assumption, source, balance note...">
              </label>
            </div>
          </details>
          <details class="stream-advanced stream-chemical span-2" ${hasChemical ? "open" : ""}>
            <summary>Chemical properties for Lutze / sizing${hasChemical ? " •" : ""}</summary>
            <div class="stream-advanced-grid">
              <label class="stream-field">
                <span class="stream-field-label">Thermal sensitivity</span>
                <select data-stream-field="thermalSensitivity" data-stream-id="${sid}">${optionHtml(separationThermalOptions, stream.thermalSensitivity)}</select>
              </label>
              ${streamChemicalPropertyDefs.map(def => `
                <label class="stream-field">
                  <span class="stream-field-label">${escapeHtml(def.label)}${def.unit ? ` (${escapeHtml(def.unit)})` : ""}</span>
                  <input data-stream-field="${escapeAttr(def.id)}" data-stream-id="${sid}" value="${escapeAttr(stream[def.id])}" placeholder="${escapeAttr(def.placeholder)}" inputmode="decimal">
                </label>
              `).join("")}
              <label class="stream-field">
                <span class="stream-field-label">Formula</span>
                <input data-stream-field="molecularFormula" data-stream-id="${sid}" value="${escapeAttr(stream.molecularFormula)}" placeholder="optional">
              </label>
              <label class="stream-field">
                <span class="stream-field-label">PubChem CID</span>
                <input data-stream-field="pubchemCid" data-stream-id="${sid}" value="${escapeAttr(stream.pubchemCid)}" placeholder="optional">
              </label>
              <label class="stream-field span-2">
                <span class="stream-field-label">Property source</span>
                <input data-stream-field="propertySource" data-stream-id="${sid}" value="${escapeAttr(stream.propertySource)}" placeholder="manual, PubChem, supplier SDS...">
              </label>
            </div>
          </details>
          <div class="mfa-edit-actions span-2">
            <button class="delete-stream" data-remove-stream="${sid}" title="Remove stream">Delete</button>
            <button class="primary" data-save-stream="${sid}">Save</button>
          </div>
        </div>
      `;
    }

    function streamHasChemicalProperties(stream) {
      return streamChemicalPropertyFields.some(field => {
        const value = String(stream?.[field] || "").trim();
        return value && !(field === "thermalSensitivity" && value === "unknown");
      })
        || String(stream?.thermalSensitivity || "unknown") !== "unknown";
    }

    function streamPubChemSuggestionRailHtml(stream) {
      const key = stream.id;
      const stateEntry = state.pubchemStreamSuggestions?.[key];
      if (!stateEntry) return "";
      if (stateEntry.status === "running") {
        return `<div class="stream-suggestion-rail pubchem"><span>PubChem</span><span class="muted small">searching...</span></div>`;
      }
      if (stateEntry.status === "error") {
        return `<div class="stream-suggestion-rail pubchem"><span>PubChem</span><span class="muted small">${escapeHtml(stateEntry.message || "no candidates")}</span></div>`;
      }
      const candidates = stateEntry.candidates || [];
      if (!candidates.length) return "";
      return `
        <div class="stream-suggestion-rail pubchem">
          <span>PubChem</span>
          ${candidates.slice(0, 5).map(item => `
            <button type="button" class="stream-suggestion-chip pubchem"
              data-apply-stream-pubchem-suggestion="${escapeAttr(stream.id)}"
              data-pubchem-suggestion-name="${escapeAttr(item.name)}"
              title="${escapeAttr(item.formula ? `Formula ${item.formula}` : item.source || "PubChem candidate")}">
              ${escapeHtml(item.name)}
            </button>
          `).join("")}
        </div>
      `;
    }

    function streamSuggestionRailHtml(block, stream, role) {
      const suggestions = streamSuggestionCandidates(block, role, stream);
      if (!suggestions.length) return "";
      return `
        <div class="stream-suggestion-rail">
          <span>From description</span>
          ${suggestions.map(item => `
            <button type="button" class="stream-suggestion-chip ${escapeAttr(item.tone || "")}"
              data-apply-stream-suggestion="${escapeAttr(stream.id)}"
              data-suggestion-name="${escapeAttr(item.name)}"
              data-suggestion-quantity="${escapeAttr(item.quantity || "")}"
              data-suggestion-unit="${escapeAttr(item.unit || "")}"
              data-suggestion-phase="${escapeAttr(item.phase || "")}"
              title="${escapeAttr(item.reason || "Use this stream name")}">
              ${escapeHtml(item.name)}
            </button>
          `).join("")}
        </div>
      `;
    }

    function streamSuggestionCandidates(block, role, stream = null) {
      if (!block) return [];
      const query = String(stream?.name || "").trim().toLowerCase();
      const text = String(block.text || "");
      const candidates = [];
      const existingKeys = existingStreamSuggestionKeys(block, role, stream?.id || "");
      const phraseRoles = role === "outlet" ? ["output", "waste"] : [role];
      materialMentionsFromText(text).forEach(item => {
        candidates.push({
          ...item,
          tone: role === "input" ? "input" : "",
          reason: item.quantity ? `Detected in source text: ${item.quantity} ${item.unit}` : "Detected in source text"
        });
      });
      phraseRoles.forEach(phraseRole => {
        phraseSuggestionsFromText(text, phraseRole).forEach(name => {
          const label = role === "outlet" ? `outlet/${phraseRole}` : phraseRole;
          candidates.push({ name, tone: phraseRole, reason: `Suggested ${label} phrase from block description` });
        });
      });
      if (role === "output" || role === "outlet") {
        (block.streams || [])
          .filter(item => item.role === "input" && String(item.name || "").trim())
          .forEach(item => candidates.push({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            phase: item.phase,
            tone: "pass",
            reason: "Input stream copied as pass-through/intermediate output"
          }));
      }
      const seen = new Set();
      return candidates
        .map(item => ({ ...item, name: normalizeSuggestionName(item.name) }))
        .filter(item => item.name && (!query || item.name.toLowerCase().includes(query)))
        .filter(item => !existingKeys.has(streamSuggestionKey(item.name)))
        .filter(item => {
          const key = streamSuggestionKey(item.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 5);
    }

    function streamSuggestionKey(value) {
      const normalized = normalizeSuggestionName(value);
      return (cleanSubstanceName(normalized) || normalized).toLowerCase();
    }

    function existingStreamSuggestionKeys(block, role, currentStreamId = "") {
      ensureBlockFlowFields(block);
      return new Set((block.streams || [])
        .filter(item => (role === "outlet" ? streamIsOutlet(item) : item.role === role) && item.id !== currentStreamId)
        .map(item => streamSuggestionKey(item.name))
        .filter(Boolean));
    }

    function materialMentionsFromText(text) {
      const unitPattern = "(kg|g|t|mol|kmol|L|mL|m3|%)";
      const results = [];
      const regex = new RegExp(`\\b(\\d+(?:[.,]\\d+)?)\\s*${unitPattern}\\s+(?:of\\s+)?([^,.;]+?)(?=\\s+(?:and|to|into|in|with|at|under|for|from|as|until|using)\\b|[,.;]|$)`, "gi");
      let match;
      while ((match = regex.exec(text))) {
        const raw = match[3]
          .replace(/\b(?:catalyst|solvent|feed|solution|mixture)\b/gi, "")
          .trim();
        const name = cleanSubstanceName(raw) || raw;
        if (name) results.push({ name, quantity: match[1].replace(",", "."), unit: match[2] });
      }
      return results;
    }

    function phraseSuggestionsFromText(text, role) {
      const patterns = role === "input"
        ? [/\b(?:charge|add|feed|combine)\s+([^.;]+?)(?=\s+(?:to|into|with|at|under)\b|[.;]|$)/gi]
        : role === "output"
          ? [/\b(?:form|forms|formed|produce|produces|produced|collect|collecting|recover|recovering|return|returning)\s+(?:the\s+|a\s+|an\s+)?([^.;,]+?)(?=\s+(?:at|as|to|from|for|with|under|and|in|of)\b|[,.;]|$)/gi]
          : [/\b(?:discard|purge|vent|send|sending|dispose|remove)\s+(?:the\s+|a\s+|an\s+)?([^.;,]+?)(?=\s+(?:to|from|for|with|under|and|in|of)\b|[,.;]|$)/gi];
      const names = [];
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text))) {
          const parts = match[1].split(/\s*,\s*|\s+\band\b\s+/i);
          parts.forEach(part => {
            const name = cleanSubstanceName(part) || part.trim();
            if (name) names.push(name);
          });
        }
      });
      return names;
    }

    function normalizeSuggestionName(value) {
      return String(value || "")
        .replace(/^\d+(?:[.,]\d+)?\s*(?:kg|g|t|mol|kmol|L|mL|m3|%)\s+(?:of\s+)?/i, "")
        .replace(/\b(?:of|the|a|an)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function applyStreamSuggestion(streamId, dataset) {
      const current = selectedBlock();
      if (!current) return;
      ensureBlockFlowFields(current);
      const stream = current.streams.find(item => item.id === streamId);
      if (!stream) return;
      pushUndo();
      stream.name = dataset.suggestionName || stream.name;
      if (!String(stream.quantity || "").trim() && dataset.suggestionQuantity) stream.quantity = dataset.suggestionQuantity;
      if ((!String(stream.unit || "").trim() || stream.unit === "kg") && dataset.suggestionUnit) stream.unit = dataset.suggestionUnit;
      if ((!stream.phase || stream.phase === "unknown") && dataset.suggestionPhase) stream.phase = dataset.suggestionPhase;
      if (!stream.status || stream.status === "missing") stream.status = "estimated";
      syncLegacyStreamLists(current);
      invalidateAiRefine();
      renderStepFlowInspector();
      renderExport();
    }

    function applyStreamPubChemSuggestion(streamId, name) {
      const current = selectedBlock();
      if (!current) return;
      ensureBlockFlowFields(current);
      const stream = current.streams.find(item => item.id === streamId);
      if (!stream || !name) return;
      pushUndo();
      stream.name = name;
      stream.status = stream.status === "missing" ? "estimated" : stream.status;
      delete state.pubchemStreamSuggestions?.[streamId];
      syncLegacyStreamLists(current);
      invalidateAiRefine();
      renderStepFlowInspector();
      renderExport();
    }

    function scheduleStreamPubChemSuggestions(streamId, query) {
      const clean = String(query || "").trim();
      if (!streamId || clean.length < 3 || typeof lookupPubChem !== "function") {
        delete state.pubchemStreamSuggestions?.[streamId];
        return;
      }
      if (pubchemStreamSuggestTimers.has(streamId)) clearTimeout(pubchemStreamSuggestTimers.get(streamId));
      pubchemStreamSuggestTimers.set(streamId, setTimeout(async () => {
        const currentQuery = String(selectedBlock()?.streams?.find(item => item.id === streamId)?.name || "").trim();
        if (currentQuery !== clean) return;
        state.pubchemStreamSuggestions[streamId] = { status: "running", candidates: [], message: "" };
        renderStepFlowInspector();
        try {
          const data = await lookupPubChem(clean, { mode: "search" });
          state.pubchemStreamSuggestions[streamId] = {
            status: data.suggestions?.length ? "ready" : "error",
            candidates: data.suggestions || [],
            message: data.suggestions?.length ? "" : "No PubChem candidates."
          };
        } catch (error) {
          state.pubchemStreamSuggestions[streamId] = { status: "error", candidates: [], message: error.message };
        }
        renderStepFlowInspector();
      }, 450));
    }

    async function fetchPubChemForStream(streamId, button = null) {
      const current = selectedBlock();
      if (!current || typeof lookupPubChem !== "function" || typeof applyPubChemLookup !== "function") return;
      ensureBlockFlowFields(current);
      const stream = current.streams.find(item => item.id === streamId);
      if (!stream || !String(stream.name || "").trim()) {
        await alertModal("Add a compound name before fetching PubChem properties.");
        return;
      }
      const previousText = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = "Fetching...";
      }
      try {
        const data = await lookupPubChem(stream.name);
        if (!data.ok) {
          state.pubchemStreamSuggestions[streamId] = {
            status: data.suggestions?.length ? "ready" : "error",
            candidates: data.suggestions || [],
            message: data.suggestions?.length ? "Choose a candidate name, then fetch again." : data.error || "PubChem lookup failed."
          };
          renderStepFlowInspector();
          if (!data.suggestions?.length) await alertModal(data.error || "PubChem lookup failed.");
          return;
        }
        pushUndo();
        applyPubChemLookup(stream, data);
        stream.status = stream.status === "missing" ? "estimated" : stream.status;
        delete state.pubchemStreamSuggestions?.[streamId];
        syncLegacyStreamLists(current);
        invalidateAiRefine();
        renderStepFlowInspector();
        renderExport();
      } catch (error) {
        await alertModal(`PubChem lookup failed: ${error.message}`);
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = previousText || "PubChem";
        }
      }
    }

    function copyInputsToOutputs(block) {
      if (!block) return;
      ensureBlockFlowFields(block);
      const inputs = block.streams.filter(stream => stream.role === "input" && String(stream.name || "").trim());
      if (!inputs.length) return;
      pushUndo();
      const existing = new Map(block.streams
        .filter(stream => stream.role === "output")
        .map(stream => [
          cleanSubstanceName(stream.name).toLowerCase() || String(stream.name || "").trim().toLowerCase(),
          stream
        ])
        .filter(([key]) => key));
      inputs.forEach(input => {
        const key = cleanSubstanceName(input.name).toLowerCase() || String(input.name || "").trim().toLowerCase();
        if (existing.has(key)) {
          mergeMissingStreamChemicalProperties(existing.get(key), input, true);
          return;
        }
        const output = createStream("output", {
          id: nextStreamId(block),
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          phase: input.phase,
          status: input.status === "reported" ? "reported" : "estimated",
          timing: "in-process intermediate",
          fate: "intermediate",
          scalingMode: input.scalingMode === "per batch" ? "per batch" : "auto",
          note: `Copied from input ${input.id || input.name}; use this for pass-through or same-material transformation steps.`,
          ...streamChemicalPropertyPayloadWithDensity(input)
        });
        block.streams.push(output);
        existing.set(key, output);
      });
      syncLegacyStreamLists(block);
      invalidateAiRefine();
      renderStepFlowInspector();
      renderExport();
    }

    function copyOneInputToOutput(block, streamId) {
      if (!block) return;
      ensureBlockFlowFields(block);
      const input = block.streams.find(stream => stream.id === streamId && stream.role === "input" && String(stream.name || "").trim());
      if (!input) return;
      const key = cleanSubstanceName(input.name).toLowerCase() || String(input.name || "").trim().toLowerCase();
      const existing = block.streams.find(stream => {
        if (stream.role !== "output") return false;
        const outputKey = cleanSubstanceName(stream.name).toLowerCase() || String(stream.name || "").trim().toLowerCase();
        return outputKey && outputKey === key;
      });
      pushUndo();
      if (existing) {
        mergeMissingStreamChemicalProperties(existing, input, true);
        existing.editing = true;
        state.menuStreamId = existing.id;
      } else {
        const stream = createStream("output", {
          id: nextStreamId(block),
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          phase: input.phase,
          status: input.status === "reported" ? "reported" : "estimated",
          timing: "in-process intermediate",
          fate: "intermediate",
          scalingMode: input.scalingMode === "per batch" ? "per batch" : "auto",
          note: `Copied from input ${input.id || input.name}; use this for pass-through or same-material transformation steps.`,
          ...streamChemicalPropertyPayloadWithDensity(input),
          editing: true
        });
        block.streams.push(stream);
      }
      syncLegacyStreamLists(block);
      invalidateAiRefine();
      renderStepFlowInspector();
      renderExport();
    }

    function streamNeedsConversionShortcut(stream, role, block) {
      if (!block || role === "input") return false;
      const hasReaction = (block.phenomena || []).some(code => code.startsWith("R(")) || Boolean(block.conditions?.conversion_yield);
      if (!hasReaction) return false;
      const unit = String(stream.unit || "").trim();
      const hasMassUnit = ["kg", "g", "t"].includes(unit);
      return !String(stream.quantity || "").trim() || !hasMassUnit;
    }

    function streamLabelHtml(stream, block = null) {
      const title = stream.name.trim() || "Untitled stream";
      const amount = [stream.quantity, stream.unit].filter(Boolean).join(" ") || "quantity missing";
      const canCopyToOutput = block && stream.role === "input" && String(stream.name || "").trim();
      const propertyBadges = streamChemicalSummaryHtml(stream);
      return `
        <article class="mfa-label-card role-${escapeAttr(streamTone(stream))}" data-stream-label="${escapeAttr(stream.id)}" title="Right-click to edit this stream">
          <div class="mfa-label-top">
            <strong>${escapeHtml(title)}</strong>
            <span class="pill ${stream.status === "missing" ? "warn" : "blue"}">${escapeHtml(stream.status)}</span>
          </div>
          <div class="mfa-label-meta">
            <span>${escapeHtml(amount)}</span>
            <span class="pill">${escapeHtml(stream.scalingMode)}</span>
            <span class="pill">${escapeHtml(stream.timing)}</span>
            <span class="pill">${escapeHtml(phaseLabel(stream.phase))}</span>
            <span class="pill ${stream.fate === "unknown" ? "warn" : "green"}">${escapeHtml(stream.fate)}</span>
          </div>
          ${stream.recoveryPercent || stream.purgePercent || stream.loopId ? `<div class="mfa-label-meta">${stream.recoveryPercent ? `<span>recovery ${escapeHtml(stream.recoveryPercent)}%</span>` : ""}${stream.purgePercent ? `<span>purge ${escapeHtml(stream.purgePercent)}%</span>` : ""}${stream.loopId ? `<span>loop ${escapeHtml(stream.loopId)}</span>` : ""}</div>` : ""}
          ${propertyBadges}
          ${stream.note.trim() ? `<div class="mfa-label-note">${escapeHtml(stream.note)}</div>` : ""}
          ${canCopyToOutput ? `<div class="mfa-label-actions"><button type="button" class="mini-button" data-copy-input-stream-to-output="${escapeAttr(stream.id)}">Use as output</button></div>` : ""}
        </article>
      `;
    }

    function streamChemicalSummaryHtml(stream) {
      const badges = [];
      if (stream.mw) badges.push(`MW ${stream.mw}`);
      if (stream.tb) badges.push(`Tb ${stream.tb} K`);
      if (stream.pvap) badges.push(`Pvap ${stream.pvap}`);
      if (stream.density) badges.push(`rho ${stream.density}`);
      if (stream.pubchemCid) badges.push(`CID ${stream.pubchemCid}`);
      if (!badges.length) return "";
      return `<div class="mfa-label-meta chemical">${badges.slice(0, 4).map(item => `<span class="pill blue">${escapeHtml(item)}</span>`).join("")}${badges.length > 4 ? `<span class="pill">+${badges.length - 4}</span>` : ""}</div>`;
    }

    function optionHtml(values, selected) {
      return values.map(value => `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
    }

    function scaleSensitivityOptionHtml(selected) {
      return scheduleScaleOptions.map(value => {
        const label = value === "unknown" ? "Auto (inferred from phenomena)" : value;
        return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
      }).join("");
    }

    // Surfaces the "Time vs. scale" value on the collapsed Gantt row too, since that select only
    // renders once a row is expanded (ganttRowHtml) - without this badge the value is invisible
    // until a user clicks to expand every row.
    function scaleSensitivityBadgeHtml(value) {
      if (!value || value === "unknown") return "";
      const tone = value === "kinetics-bound" ? "warn"
        : value === "increases with scale" || value === "equipment dependent" ? "blue"
        : "green";
      return `<span class="pill ${tone}" title="Time vs. scale">${escapeHtml(value)}</span>`;
    }

    function scheduleOperationClassOptionHtml(selected) {
      return scheduleOperationClassOptions.map(value => {
        const label = value === "auto" ? "Auto" : operationScaleProfile(value).label;
        return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
      }).join("");
    }

    function updateStreamField(event) {
      const current = selectedBlock();
      if (!current) return;
      ensureBlockFlowFields(current);
      const stream = current.streams.find(item => item.id === event.target.dataset.streamId);
      if (!stream) return;
      invalidateAiRefine();
      stream[event.target.dataset.streamField] = event.target.value;
      if (event.target.dataset.streamField === "name") {
        scheduleStreamPubChemSuggestions(stream.id, stream.name);
      }
      if (event.target.dataset.streamField === "unit" && ["kg/kg product", "L/kg product"].includes(stream.unit) && stream.scalingMode === "auto") {
        stream.scalingMode = "per kg product";
      }
      if (event.target.dataset.streamField === "fate") {
        const nextRole = streamRoleForFate(stream.fate, stream.role);
        if (nextRole !== stream.role) {
          stream.role = nextRole;
          if (stream.role === "waste" && stream.timing === "in-process intermediate") stream.timing = defaultStreamTiming("waste");
          if (stream.role === "output" && stream.timing === "waste purge") stream.timing = defaultStreamTiming("output");
          if (stream.scalingMode === "auto") stream.scalingMode = defaultStreamScalingMode(stream.role, stream.unit, stream.fate);
        }
      }
      if (event.target.dataset.streamField === "fate" && ["recycled input", "recovered solvent"].includes(stream.fate) && stream.scalingMode === "auto") {
        stream.scalingMode = "recycle loop";
      }
      if (event.target.dataset.streamField === "phase") sanitizeBlockPhenomena(current);
      syncLegacyStreamLists(current);
      renderExport();
      renderGroupFlow();
    }

    function syncLegacyStreamLists(block) {
      block.inputs = streamNames(block, "input");
      block.outputs = streamNames(block, "output");
      block.wastes = streamNames(block, "waste");
    }

    function renderGroupAlternatives(group) {
      if (!$("groupAlternatives")) return;
      if (!group) {
        $("groupAlternatives").innerHTML = `<span class="muted">No group selected.</span>`;
        return;
      }
      const readiness = groupUnitSuggestionReadiness(group);
      if (!readiness.ready) {
        $("groupAlternatives").innerHTML = `
          <div class="mfa-empty">
            Unit-operation suggestions are locked until ${escapeHtml(readiness.missing.join(", ") || "task data")} are complete.
          </div>
        `;
        return;
      }
      const candidates = unitOperationCandidatesForGroup(group).slice(0, 6);
      const basisNote = group.selectedUnit && candidates.length > 1 ? `
        <div class="muted small" style="margin-top:6px">
          ${group.selectionBasis
            ? `Selection basis: "${escapeHtml(group.selectionBasis)}"`
            : `Multiple candidates fit — open the group aggregate view above to record why ${escapeHtml(group.selectedUnit)} was chosen.`}
        </div>
      ` : "";
      $("groupAlternatives").innerHTML = `
        <div class="unit-suggest-result-head">
          <strong>Data-Based Unit Operation Suggestions</strong>
          <span class="muted small">${readiness.lutzeReady ? "after Lutze review" : "pre-Lutze"}</span>
        </div>
        ${candidates.length ? candidates.map(candidate => `
          <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-inspector-unit="${escapeAttr(candidate.name)}" data-tip="${escapeAttr(alternativeReason(candidate))}">
            ${escapeHtml(candidate.name)}
            <span class="pill ${candidate.preliminary ? "warn" : candidate.sameTask ? "blue" : "green"}">${candidate.preliminary ? "pre-Lutze" : candidate.sameTask ? "same task" : "Lutze fit"}</span>
          </button>
        `).join("") : `<span class="muted">No candidates match the completed task data.</span>`}
      ` + basisNote;
      document.querySelectorAll("[data-inspector-unit]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(group.id).selectedUnit = button.dataset.inspectorUnit;
          renderAll();
        });
      });
    }

    function applyBehavior(behavior) {
      const block = selectedBlock();
      if (!block) return;
      pushUndo();
      const preset = behaviorPresets[behavior] || behaviorPresets.unassigned;
      block.behavior = behavior;
      block.phenomena = phenomenaForBehaviorAndText(behavior, block.text);
      if (block.groupId) ensureGroup(block.groupId).task = preset.task;
      renderAll();
    }

    function hasLinkBetween(fromId, toId) {
      return state.links.some(link => resolvedEndpointId(link.from) === fromId && resolvedEndpointId(link.to) === toId);
    }

    function autoConnectGroups() {
      pushUndo();
      const order = groupIdsInTextOrder();
      let added = 0;
      for (let i = 0; i < order.length - 1; i += 1) {
        if (!hasLinkBetween(order[i], order[i + 1])) {
          state.links.push({ from: order[i], to: order[i + 1] });
          added += 1;
        }
      }
      blocksInOrder().forEach(block => {
        (block.streams || []).forEach(stream => {
          const dest = String(stream.destinationGroup || "").trim().toUpperCase();
          if (!/^G\d+$/.test(dest) || !state.groups[dest]) return;
          const from = resolvedEndpointId(block.groupId || block.id);
          if (!from || from === dest || !from.startsWith("G")) return;
          if (!hasLinkBetween(from, dest)) {
            state.links.push({ from, to: dest });
            added += 1;
          }
        });
      });
      if (!added) dropLastUndo();
      renderAll();
      $("connectionStatus").textContent = added
        ? `Auto-connect: ${added} arrow${added === 1 ? "" : "s"} added (text order + declared recycle destinations).`
        : "Auto-connect: nothing to add — network already connected.";
    }

    function networkClosureModel() {
      const issues = [];
      const groupIds = groupIdsInTextOrder();
      const lastGroupId = groupIds[groupIds.length - 1];
      const outgoing = new Set();
      state.links.forEach(link => outgoing.add(resolvedEndpointId(link.from)));
      let hasProduct = false;
      blocksInOrder().forEach(block => {
        const owner = block.groupId;
        (block.streams || []).forEach(stream => {
          if (stream.role === "input") return;
          const name = stream.name.trim() || "unnamed stream";
          if (stream.fate === "product") hasProduct = true;
          if (stream.fate === "unknown") {
            issues.push({ groupId: owner || block.id, text: `${name}: fate not assigned` });
            return;
          }
          if (stream.fate === "intermediate" && owner && owner !== lastGroupId && !outgoing.has(owner)) {
            issues.push({ groupId: owner, text: `${name}: intermediate with no outgoing arrow` });
          }
          if (["recovered solvent", "recycled input"].includes(stream.fate)) {
            const dest = String(stream.destinationGroup || "").trim().toUpperCase();
            if (!dest) {
              issues.push({ groupId: owner || block.id, text: `${name}: recycle without destination group` });
            } else if (/^G\d+$/.test(dest) && !state.groups[dest]) {
              issues.push({ groupId: owner || block.id, text: `${name}: declared destination ${dest} no longer exists` });
            } else if (/^G\d+$/.test(dest) && state.groups[dest] && owner && !hasLinkBetween(owner, dest)) {
              issues.push({ groupId: owner, text: `${name}: recycle to ${dest} declared but arrow missing (use Auto-Connect)` });
            }
          }
        });
      });
      if (groupIds.length && !hasProduct) {
        issues.push({ groupId: lastGroupId, text: "no stream anywhere has fate 'product' — the network has no final product outlet" });
      }
      const seen = new Set();
      return issues.filter(issue => {
        const key = `${issue.groupId}|${issue.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function renderNetworkClosure() {
      const root = $("networkClosure");
      if (!root) return;
      if (!state.blocks.length) {
        root.innerHTML = "";
        return;
      }
      const issues = networkClosureModel();
      if (!issues.length) {
        root.innerHTML = `<span class="closure-chip ok">✓ Network closed: every outlet has a destination</span>`;
        return;
      }
      const shown = issues.slice(0, 4);
      root.innerHTML = `
        <span class="label" style="margin:0">Network closure</span>
        ${shown.map(issue => `<span class="closure-chip">${escapeHtml(issue.groupId)}: ${escapeHtml(issue.text)}</span>`).join("")}
        ${issues.length > shown.length ? `<span class="muted small">+${issues.length - shown.length} more</span>` : ""}
      `;
    }

    function cleanupGroupIfEmpty(groupId) {
      if (!groupId) return;
      if (blocksForGroup(groupId).length) return;
      delete state.groups[groupId];
      state.links = state.links.filter(link => link.from !== groupId && link.to !== groupId);
      if (state.selectedGroupId === groupId) state.selectedGroupId = null;
    }

    async function deleteBlock(blockId) {
      const block = state.blocks.find(item => item.id === blockId);
      if (!block) return;
      if (!(await confirmModal(`Are you sure you want to delete block ${blockId}? Its streams, phenomena, and conditions will be removed too.`))) return;
      pushUndo();
      const groupId = block.groupId;
      state.blocks = state.blocks.filter(item => item.id !== blockId);
      state.links = state.links.filter(link => link.from !== blockId && link.to !== blockId);
      cleanupGroupIfEmpty(groupId);
      state.selectedIds = state.selectedIds.filter(id => id !== blockId);
      if (state.selectedBlockId === blockId) state.selectedBlockId = state.selectedIds[0] || null;
      invalidateAiRefine();
      renderAll();
    }

    function removeBlockFromGroup(blockId) {
      const block = state.blocks.find(item => item.id === blockId);
      if (!block || !block.groupId) return;
      pushUndo();
      const groupId = block.groupId;
      block.groupId = null;
      cleanupGroupIfEmpty(groupId);
      invalidateAiRefine();
      renderAll();
    }

    async function mergeSelectedBlocks() {
      const ids = state.selectedIds.filter(id => state.blocks.some(block => block.id === id));
      const blocks = blocksInOrder().filter(block => ids.includes(block.id));
      if (blocks.length < 2) {
        await alertModal("Shift-click at least two blocks, then merge.");
        return;
      }
      const lo = Math.min(...blocks.map(block => block.start));
      const hi = Math.max(...blocks.map(block => block.end));
      if (state.blocks.some(block => !ids.includes(block.id) && rangesOverlap(lo, hi, block.start, block.end))) {
        await alertModal("Cannot merge: another block lies between the selected blocks. Merge only adjacent blocks.");
        return;
      }
      pushUndo();
      const target = blocks[0];
      const others = blocks.slice(1);
      ensureBlockFlowFields(target);
      ensureBlockConditionFields(target);
      target.start = lo;
      target.end = hi;
      target.text = state.text.slice(lo, hi).replace(/\s+/g, " ").trim();
      others.forEach(source => {
        ensureBlockFlowFields(source);
        ensureBlockConditionFields(source);
        source.streams.forEach(stream => {
          stream.id = nextStreamId(target);
          target.streams.push(stream);
        });
        (source.phenomena || []).forEach(code => {
          if (!target.phenomena.includes(code)) target.phenomena.push(code);
        });
        Object.entries(source.conditions || {}).forEach(([key, value]) => {
          if (String(value || "").trim() && !String(target.conditions[key] || "").trim()) {
            target.conditions[key] = value;
            if (source.conditionUnits?.[key]) target.conditionUnits[key] = source.conditionUnits[key];
          }
        });
        if (!target.endpoint && source.endpoint) target.endpoint = source.endpoint;
      });
      const removedIds = new Set(others.map(block => block.id));
      const removedGroups = new Set(others.map(block => block.groupId).filter(Boolean));
      state.blocks = state.blocks.filter(block => !removedIds.has(block.id));
      state.links = state.links.filter(link => !removedIds.has(link.from) && !removedIds.has(link.to));
      removedGroups.forEach(groupId => cleanupGroupIfEmpty(groupId));
      sanitizeBlockPhenomena(target);
      syncLegacyStreamLists(target);
      state.selectedBlockId = target.id;
      state.selectedIds = [target.id];
      invalidateAiRefine();
      renderAll();
    }

    // Replacement for window.confirm()/window.prompt(): those silently return false/null in some
    // embedding webviews (VS Code's included) instead of throwing, so callers relying on them fail
    // with no visible error. These use the in-page #confirmModal instead, and are promise-based so
    // call sites just `await` them.
    let activeConfirmCancel = null;

    function confirmModal(message, { okLabel = "OK", cancelLabel = "Cancel" } = {}) {
      return new Promise(resolve => {
        const modal = $("confirmModal");
        const okBtn = $("confirmModalOk");
        const cancelBtn = $("confirmModalCancel");
        $("confirmModalMessage").textContent = message;
        $("confirmModalPromptRow").hidden = true;
        okBtn.textContent = okLabel;
        cancelBtn.textContent = cancelLabel;
        modal.hidden = false;
        const cleanup = result => {
          modal.hidden = true;
          okBtn.removeEventListener("click", onOk);
          cancelBtn.removeEventListener("click", onCancel);
          modal.removeEventListener("mousedown", onBackdrop);
          activeConfirmCancel = null;
          resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onBackdrop = event => { if (event.target === modal) cleanup(false); };
        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        modal.addEventListener("mousedown", onBackdrop);
        activeConfirmCancel = onCancel;
      });
    }

    function promptModal(message, defaultValue = "") {
      return new Promise(resolve => {
        const modal = $("confirmModal");
        const okBtn = $("confirmModalOk");
        const cancelBtn = $("confirmModalCancel");
        const row = $("confirmModalPromptRow");
        const input = $("confirmModalPromptInput");
        $("confirmModalMessage").textContent = message;
        row.hidden = false;
        input.value = defaultValue;
        okBtn.textContent = "OK";
        cancelBtn.textContent = "Cancel";
        modal.hidden = false;
        input.focus();
        input.select();
        const cleanup = result => {
          modal.hidden = true;
          row.hidden = true;
          okBtn.removeEventListener("click", onOk);
          cancelBtn.removeEventListener("click", onCancel);
          modal.removeEventListener("mousedown", onBackdrop);
          activeConfirmCancel = null;
          resolve(result);
        };
        const onOk = () => cleanup(input.value);
        const onCancel = () => cleanup(null);
        const onBackdrop = event => { if (event.target === modal) cleanup(null); };
        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        modal.addEventListener("mousedown", onBackdrop);
        activeConfirmCancel = onCancel;
      });
    }

    // Replacement for window.alert() — same silent-no-op risk in some embedding webviews as
    // confirm()/prompt() above. Reuses #confirmModal with Cancel hidden, since an alert only has
    // one way out (acknowledge).
    function alertModal(message) {
      return new Promise(resolve => {
        const modal = $("confirmModal");
        const okBtn = $("confirmModalOk");
        const cancelBtn = $("confirmModalCancel");
        $("confirmModalMessage").textContent = message;
        $("confirmModalPromptRow").hidden = true;
        okBtn.textContent = "OK";
        cancelBtn.hidden = true;
        modal.hidden = false;
        const cleanup = () => {
          modal.hidden = true;
          cancelBtn.hidden = false;
          okBtn.removeEventListener("click", onOk);
          modal.removeEventListener("mousedown", onBackdrop);
          activeConfirmCancel = null;
          resolve();
        };
        const onOk = () => cleanup();
        const onBackdrop = event => { if (event.target === modal) cleanup(); };
        okBtn.addEventListener("click", onOk);
        modal.addEventListener("mousedown", onBackdrop);
        activeConfirmCancel = onOk;
      });
    }

    function openSplitGroupModal(groupId) {
      const group = groupModel(groupId);
      if (!group) return;
      const entry = taskScheduleEntry(group, 0);
      const baseDuration = Number.isFinite(entry.adjustedDurationH) && entry.adjustedDurationH > 0 ? entry.adjustedDurationH : NaN;
      const suggestion = Math.max(2, Math.ceil((Number.isFinite(entry.parallelUnits) ? entry.parallelUnits : 1) + 1));
      state.pendingSplitGroupId = groupId;
      $("splitGroupIdLabel").textContent = groupId;
      const nInput = $("splitGroupN");
      nInput.value = String(suggestion);
      nInput.dataset.splitBaseDuration = Number.isFinite(baseDuration) ? String(baseDuration) : "";
      const divideDuration = $("splitGroupDivideDuration");
      const warning = $("splitGroupWarning");
      if (entry.scaleSensitivity === "kinetics-bound") {
        divideDuration.checked = false;
        divideDuration.disabled = true;
        warning.hidden = false;
        warning.textContent = `${groupId} is kinetics-bound: for an ideal, well-mixed, constant-volume batch, conversion vs. time doesn't depend on reactor volume, so parallel reactors add throughput, not speed. Its Gantt time is kept at the single-unit value and won't be divided. If this stage is the bottleneck, change the chemistry or operating mode instead.`;
      } else {
        divideDuration.checked = true;
        divideDuration.disabled = false;
        warning.hidden = true;
        warning.textContent = "";
      }
      renderSplitGroupPreview();
      $("splitGroupModal").hidden = false;
    }

    function renderSplitGroupPreview() {
      const nInput = $("splitGroupN");
      const preview = $("splitGroupPreview");
      if (!nInput || !preview) return;
      let n = Math.round(Number(nInput.value));
      if (!Number.isFinite(n) || n < 2) n = 2;
      const baseDuration = Number(nInput.dataset.splitBaseDuration);
      const groupId = state.pendingSplitGroupId || "";
      const divideDuration = $("splitGroupDivideDuration")?.checked === true;
      preview.textContent = Number.isFinite(baseDuration) && baseDuration > 0
        ? `${bottleneckSplitPreviewText(baseDuration, n, divideDuration)} Creates ${groupId}-P1..P${n}, wired in parallel between the same predecessor and successor. ${groupId} itself is removed. This can be undone.`
        : `No duration is set yet. Creates ${groupId}-P1..P${n}, each with 1/${n} of the material flow. ${groupId} itself is removed. This can be undone.`;
    }

    function closeSplitGroupModal() {
      $("splitGroupModal").hidden = true;
      state.pendingSplitGroupId = null;
    }

    async function confirmSplitGroupModal() {
      const groupId = state.pendingSplitGroupId;
      if (!groupId) return;
      let n = Math.round(Number($("splitGroupN").value));
      if (!Number.isFinite(n) || n < 2) n = 2;
      const divideDuration = $("splitGroupDivideDuration")?.checked === true;
      closeSplitGroupModal();
      await splitGroupIntoParallelUnits(groupId, n, { divideDuration });
    }

    async function splitGroupIntoParallelUnits(groupId, n, options = {}) {
      const group = groupModel(groupId);
      if (!group || !Number.isFinite(n) || n < 2) return;
      const baseState = ensureGroup(groupId);
      const baseEntry = taskScheduleEntry(group, 0);
      // Reaction time doesn't shrink with parallel reactors (see the effectiveTimeH note above),
      // so never bake a divided duration into the split-off copies of a kinetics-bound group, even
      // if divideDuration was requested.
      const divideDuration = Boolean(options.divideDuration) && baseEntry.scaleSensitivity !== "kinetics-bound";
      const originalDurationH = parseDurationHoursValue(baseState.schedule.durationH);
      const splitDurationText = divideDuration && Number.isFinite(originalDurationH) && originalDurationH > 0
        ? formatNumber(originalDurationH / n)
        : baseState.schedule.durationH;
      const originalBlocks = group.blocks;
      const proposedGroupIds = Array.from({ length: n }, (_, i) => `${groupId}-P${i + 1}`);
      const proposedBlockIds = proposedGroupIds.flatMap((newGroupId, i) => originalBlocks.map(block => `${block.id}-P${i + 1}`));
      const groupCollision = proposedGroupIds.some(id => state.groups[id] || state.blocks.some(block => block.groupId === id));
      const blockCollision = proposedBlockIds.some(id => state.blocks.some(block => block.id === id));
      if (groupCollision || blockCollision) {
        await alertModal(`Cannot split ${groupId}: one or more ${groupId}-P* groups already exist. Rename or remove the previous split before splitting this group again.`);
        return;
      }
      pushUndo();
      const incoming = state.links.filter(link => resolvedEndpointId(link.to) === groupId);
      const outgoing = state.links.filter(link => resolvedEndpointId(link.from) === groupId);
      const otherLinks = state.links.filter(link => resolvedEndpointId(link.to) !== groupId && resolvedEndpointId(link.from) !== groupId);
      const newGroupIds = [];

      for (let i = 1; i <= n; i += 1) {
        const newGroupId = proposedGroupIds[i - 1];
        newGroupIds.push(newGroupId);
        const newGroup = ensureGroup(newGroupId, baseState.task);
        newGroup.selectedUnit = baseState.selectedUnit;
        newGroup.selectionBasis = baseState.selectionBasis;
        newGroup.properties = JSON.parse(JSON.stringify(baseState.properties || {}));
        newGroup.schedule = {
          ...baseState.schedule,
          durationH: splitDurationText,
          parallelUnits: "1",
          // Only the first parallel unit counts toward the additive cycle-time sum; the rest
          // are marked as overlapping with it so N simultaneous units are not counted N times.
          canOverlap: i === 1 ? (baseState.schedule.canOverlap || "no") : "yes",
          notes: [baseState.schedule.notes, `Parallel unit ${i}/${n}, split from ${groupId}; ${formatNumber(1 / n * 100)}% of the original material flow.${divideDuration ? " Gantt duration was divided as a screening estimate." : " Per-unit duration is kept until a sized-equipment estimate is entered."}`].filter(Boolean).join(" ")
        };
        newGroup.conditionOverrides = JSON.parse(JSON.stringify(baseState.conditionOverrides || {}));
        newGroup.mfaOverrides = {};
        newGroup.openOverrideKey = "";
        newGroup.x = baseState.x;
        newGroup.y = baseState.y + (i - 1) * 300;

        originalBlocks.forEach(block => {
          const clone = JSON.parse(JSON.stringify(block));
          clone.id = `${block.id}-P${i}`;
          clone.groupId = newGroupId;
          clone.conditionsEditing = false;
          clone.openConditionFamily = null;
          clone.streams = (block.streams || []).map((stream, idx) => {
            const qty = parseStreamQuantity(stream.quantity);
            return {
              ...stream,
              id: `${clone.id}-S${idx + 1}`,
              quantity: Number.isFinite(qty) ? formatNumber(qty / n) : stream.quantity,
              note: [stream.note, `1/${n} of ${block.id} flow (parallel unit ${i} of ${n}).`].filter(Boolean).join(" "),
              editing: false
            };
          });
          if (divideDuration) {
            const additiveIds = additiveConditionIds();
            Object.keys(clone.conditions || {}).forEach(conditionId => {
              if (!additiveIds.has(conditionId)) return;
              const raw = parseDurationHoursValue(clone.conditions[conditionId]);
              if (Number.isFinite(raw) && raw > 0) clone.conditions[conditionId] = formatNumber(raw / n);
            });
          }
          state.blocks.push(clone);
        });
      }

      newGroupIds.forEach(newGroupId => {
        incoming.forEach(link => otherLinks.push({ from: link.from, to: newGroupId }));
        outgoing.forEach(link => otherLinks.push({ from: newGroupId, to: link.to }));
      });
      state.links = otherLinks;

      const originalBlockIds = new Set(originalBlocks.map(block => block.id));
      state.blocks = state.blocks.filter(block => !originalBlockIds.has(block.id));
      delete state.groups[groupId];

      state.selectedBlockId = null;
      state.selectedGroupId = newGroupIds[0];
      state.selectedIds = [];
      state.focusEndpoint = newGroupIds[0];
      state.activeInspectorTab = "scale";
      invalidateAiRefine();
      renderAll();
    }

    function combineSelected() {
      const ids = state.selectedIds.filter(id => state.blocks.some(block => block.id === id));
      if (ids.length < 2) return;
      pushUndo();
      const groupId = nextGroupId();
      ensureGroup(groupId, "unassigned");
      ids.forEach(id => {
        const block = state.blocks.find(item => item.id === id);
        block.groupId = groupId;
      });
      const group = groupModel(groupId);
      state.groups[groupId].task = inferGroupTask(group);
      state.selectedBlockId = null;
      state.selectedGroupId = groupId;
      state.selectedIds = ids;
      state.focusEndpoint = groupId;
      renderAll();
    }

    function inferGroupTask(group) {
      const counts = {};
      group.blocks.forEach(block => {
        const presetTask = behaviorPresets[block.behavior]?.task || "unassigned";
        counts[presetTask] = (counts[presetTask] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unassigned";
    }

    function splitSelectedToNewGroup() {
      const block = selectedBlock();
      if (!block) return;
      pushUndo();
      const groupId = nextGroupId();
      const task = behaviorPresets[block.behavior]?.task || "unassigned";
      ensureGroup(groupId, task);
      block.groupId = groupId;
      state.selectedIds = [block.id];
      state.selectedGroupId = groupId;
      state.focusEndpoint = groupId;
      renderAll();
    }

    // One-click path for a single draft (ungrouped) block, offered directly on its card (see the
    // red "Convert to Task" button in blockCardHtml) instead of requiring shift-click + right-click +
    // Combine Selected. Creates a new one-block task group, same as splitSelectedToNewGroup, but
    // works from a block id directly so it doesn't depend on the block being selected first.
    async function assignBlockToNewTask(blockId) {
      const block = state.blocks.find(item => item.id === blockId);
      if (!block || block.groupId) return;
      if (!(await confirmModal("Convert this block into its own task group? You can rename the task or combine it with other blocks afterward."))) return;
      pushUndo();
      const groupId = nextGroupId();
      const task = behaviorPresets[block.behavior]?.task || "unassigned";
      ensureGroup(groupId, task);
      block.groupId = groupId;
      state.selectedBlockId = null;
      state.selectedIds = [block.id];
      state.selectedGroupId = groupId;
      state.focusEndpoint = groupId;
      renderAll();
    }

    function assignSelectedToGroup(groupId) {
      if (!groupId) return;
      pushUndo();
      ensureGroup(groupId);
      const ids = state.selectedIds.length ? state.selectedIds : [state.selectedBlockId];
      ids.filter(Boolean).forEach(id => {
        const block = state.blocks.find(item => item.id === id);
        if (block) block.groupId = groupId;
      });
      state.selectedBlockId = null;
      state.selectedGroupId = groupId;
      state.selectedIds = blocksForGroup(groupId).map(block => block.id);
      state.focusEndpoint = groupId;
      renderAll();
    }

    function renderContextMenuOptions() {
      const ids = groupIdsInTextOrder();
      $("ctxGroupSelect").innerHTML = ids.map(id => `<option value="${id}">${id}</option>`).join("");
      $("ctxCombine").disabled = state.selectedIds.length < 2;
      $("ctxAssignGroup").disabled = ids.length === 0;
      $("ctxMergeBlocks").disabled = state.selectedIds.length < 2;
      const menuBlock = state.blocks.find(item => item.id === state.menuBlockId);
      $("ctxRemoveFromGroup").disabled = !menuBlock?.groupId;
      $("ctxSplitBlockGroup").disabled = !menuBlock?.groupId;
    }

    function linksForGroup(groupId) {
      return state.links.filter(link => resolvedEndpointId(link.from) === groupId || resolvedEndpointId(link.to) === groupId);
    }

    function formatLink(link, currentGroupId) {
      const from = resolvedEndpointId(link.from);
      const to = resolvedEndpointId(link.to);
      if (from === currentGroupId && to === currentGroupId) return `self`;
      if (from === currentGroupId) return `-> ${link.to}`;
      return `${link.from} ->`;
    }

    function renderLinkControls() {
      const endpointCount = state.blocks.length + groupIdsInTextOrder().length;
      $("connectionStatus").textContent = state.connectingFrom
        ? `Arrow mode: click the target block or group for ${state.connectingFrom}. Press Esc to cancel.`
        : endpointCount < 2
          ? "Create at least two blocks/groups to draw arrows."
          : "Right-click a block or group to start an arrow.";
      $("linkSummary").innerHTML = state.links.length
        ? `
          <button class="mini-button" id="toggleConnectionList">${state.showConnections ? "Hide connections" : `Show connections (${state.links.length})`}</button>
          ${state.showConnections ? `<div class="connection-list">${state.links.map((link, index) => `<span class="link-chip">${escapeHtml(link.from)} -> ${escapeHtml(link.to)} <button class="pill danger" data-remove-link="${index}">x</button></span>`).join("")}</div>` : `<span class="muted small">${state.links.length} arrow${state.links.length === 1 ? "" : "s"} hidden.</span>`}
        `
        : `<span class="muted small">No arrows yet.</span>`;

      $("toggleConnectionList")?.addEventListener("click", () => {
        state.showConnections = !state.showConnections;
        renderAll();
      });

      document.querySelectorAll("[data-remove-link]").forEach(button => {
        button.addEventListener("click", () => {
          pushUndo();
          state.links.splice(Number(button.dataset.removeLink), 1);
          renderAll();
        });
      });
    }

    function addConnection(from, to) {
      if (!from || !to) return;
      const resolvedFrom = resolvedEndpointId(from);
      const resolvedTo = resolvedEndpointId(to);
      if (resolvedFrom === resolvedTo) {
        state.connectingFrom = null;
        renderAll();
        return;
      }
      if (!state.links.some(link => resolvedEndpointId(link.from) === resolvedFrom && resolvedEndpointId(link.to) === resolvedTo)) {
        pushUndo();
        state.links.push({ from: resolvedFrom, to: resolvedTo });
      }
      state.connectingFrom = null;
      renderAll();
    }

    function resolvedEndpointId(id) {
      if (!id || !id.startsWith("B")) return id;
      const block = state.blocks.find(item => item.id === id);
      return block?.groupId || id;
    }

    function startDrag(event, id, kind) {
      if (state.connectDrag || event.target?.closest?.("[data-connect-handle]")) return;
      event.preventDefault();
      event.stopPropagation();
      const rect = $("groupFlow").getBoundingClientRect();
      const current = kind === "draft" ? state.draftPos : ensureGroup(id);
      state.drag = {
        id,
        kind,
        pointerId: Number.isFinite(event.pointerId) ? event.pointerId : null,
        moved: false,
        startClientX: event.clientX,
        startClientY: event.clientY,
        offsetX: (event.clientX - rect.left + $("groupFlow").scrollLeft) / state.zoom - current.x,
        offsetY: (event.clientY - rect.top + $("groupFlow").scrollTop) / state.zoom - current.y
      };
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      $("groupFlow")?.classList.add("board-dragging");
    }

    function dragLimits() {
      const board = boardBounds();
      return {
        maxX: Math.max(8000, board.width + 600),
        maxY: Math.max(4000, board.height + 600)
      };
    }

    function currentDragElement() {
      const root = $("groupFlow");
      if (!root || !state.drag) return null;
      if (state.drag.kind === "draft") return root.querySelector("[data-draft-box]");
      return Array.from(root.querySelectorAll("[data-group-box]")).find(box => box.dataset.groupBox === state.drag.id) || null;
    }

    function updateDraggedNodePosition() {
      const box = currentDragElement();
      if (!box || !state.drag) return;
      const current = state.drag.kind === "draft" ? state.draftPos : ensureGroup(state.drag.id);
      box.style.left = `${current.x}px`;
      box.style.top = `${current.y}px`;
    }

    function redrawBoardLinksOnly() {
      const root = $("groupFlow");
      const canvas = root?.querySelector(".board-canvas");
      const svg = canvas?.querySelector(".link-layer");
      if (!canvas || !svg) return;
      const board = boardWithDrawerClearance();
      const space = root.querySelector(".board-space");
      if (space) {
        space.style.width = `${board.width * state.zoom}px`;
        space.style.height = `${board.height * state.zoom}px`;
      }
      canvas.style.width = `${board.width}px`;
      canvas.style.height = `${board.height}px`;
      svg.outerHTML = renderLinksSvg(board, Boolean(state.drag));
    }

    function scheduleDragRender() {
      if (boardDragFrame) return;
      boardDragFrame = requestAnimationFrame(() => {
        boardDragFrame = null;
        updateDraggedNodePosition();
        redrawBoardLinksOnly();
      });
    }

    function dragMove(event) {
      if (!state.drag) return;
      if (state.drag.pointerId !== null && event.pointerId !== state.drag.pointerId) return;
      if (state.drag.pointerId !== null && event.type?.startsWith?.("mouse")) return;
      const movement = Math.abs(event.clientX - state.drag.startClientX) + Math.abs(event.clientY - state.drag.startClientY);
      if (!state.drag.moved && movement < 5) return;
      state.drag.moved = true;
      event.preventDefault();
      event.stopPropagation();
      const rect = $("groupFlow").getBoundingClientRect();
      const limits = dragLimits();
      const x = Math.max(0, Math.min(limits.maxX, (event.clientX - rect.left + $("groupFlow").scrollLeft) / state.zoom - state.drag.offsetX));
      const y = Math.max(0, Math.min(limits.maxY, (event.clientY - rect.top + $("groupFlow").scrollTop) / state.zoom - state.drag.offsetY));
      if (state.drag.kind === "draft") {
        state.draftPos = { x, y };
      } else {
        const group = ensureGroup(state.drag.id);
        group.x = x;
        group.y = y;
      }
      scheduleDragRender();
    }

    function dragEnd(event = {}) {
      if (!state.drag) return;
      if (state.drag.pointerId !== null && event.pointerId !== state.drag.pointerId) return;
      if (state.drag.pointerId !== null && event.type?.startsWith?.("mouse")) return;
      const moved = state.drag.moved;
      if (boardDragFrame) {
        cancelAnimationFrame(boardDragFrame);
        boardDragFrame = null;
      }
      state.drag = null;
      $("groupFlow")?.classList.remove("board-dragging");
      if (moved) renderGroupFlow();
    }

    function boardPanBlockedTarget(target) {
      return target?.closest?.("[data-block-card], [data-group-box], [data-draft-box], [data-connect-handle], button, input, textarea, select, summary, details, .context-menu, .step-flow-inspector");
    }

    function startBoardPan(event) {
      if (event.button !== 0 || state.drag || state.connectDrag || boardPanBlockedTarget(event.target)) return;
      const flow = $("groupFlow");
      if (!flow?.contains(event.target)) return;
      event.preventDefault();
      hideBlockMenu();
      hideGroupMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
      state.boardPan = {
        pointerId: Number.isFinite(event.pointerId) ? event.pointerId : null,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startScrollLeft: flow.scrollLeft,
        startScrollTop: flow.scrollTop
      };
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      flow.classList.add("board-panning");
    }

    function boardPanMove(event) {
      if (!state.boardPan) return;
      if (state.boardPan.pointerId !== null && event.pointerId !== state.boardPan.pointerId) return;
      if (state.boardPan.pointerId !== null && event.type?.startsWith?.("mouse")) return;
      const flow = $("groupFlow");
      if (!flow) return;
      event.preventDefault();
      flow.scrollLeft = Math.max(0, state.boardPan.startScrollLeft - (event.clientX - state.boardPan.startClientX));
      flow.scrollTop = Math.max(0, state.boardPan.startScrollTop - (event.clientY - state.boardPan.startClientY));
    }

    function boardPanEnd(event = {}) {
      if (!state.boardPan) return;
      if (state.boardPan.pointerId !== null && event.pointerId !== state.boardPan.pointerId) return;
      if (state.boardPan.pointerId !== null && event.type?.startsWith?.("mouse")) return;
      state.boardPan = null;
      $("groupFlow")?.classList.remove("board-panning");
    }

    // Drag-to-connect: mousedown on a .connect-handle starts this instead of a box-move drag
    // (see the handle's own mousedown binding, which stops propagation before startDrag's board
    // listener sees it). Reuses state.connectingFrom for the "connecting" glow class and Escape/
    // outside-click cleanup already wired up for the older click-to-connect flow (right-click a
    // box -> Start Arrow -> click a target), so both ways of making a connection stay in sync and
    // either can cancel the other.
    function startConnectDrag(event, fromId) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      state.drag = null;
      if (boardDragFrame) {
        cancelAnimationFrame(boardDragFrame);
        boardDragFrame = null;
      }
      const point = boardPointFromEvent(event);
      state.connectDrag = {
        fromId,
        pointerId: Number.isFinite(event.pointerId) ? event.pointerId : null,
        x: point.x,
        y: point.y,
        startClientX: event.clientX,
        startClientY: event.clientY,
        moved: false
      };
      state.connectingFrom = fromId;
      event.currentTarget?.setPointerCapture?.(event.pointerId);
      $("groupFlow")?.classList.add("connect-dragging");
      renderConnectDragPreview();
    }

    function connectDragMove(event) {
      if (!state.connectDrag) return;
      if (state.connectDrag.pointerId !== null && event.pointerId !== state.connectDrag.pointerId) return;
      if (state.connectDrag.pointerId !== null && event.type?.startsWith?.("mouse")) return;
      event.preventDefault();
      event.stopPropagation();
      const point = boardPointFromEvent(event);
      state.connectDrag.x = point.x;
      state.connectDrag.y = point.y;
      const movement = Math.abs(event.clientX - state.connectDrag.startClientX) + Math.abs(event.clientY - state.connectDrag.startClientY);
      if (movement >= 4) state.connectDrag.moved = true;
      scheduleConnectDragRender();
    }

    function scheduleConnectDragRender() {
      if (connectDragFrame) return;
      connectDragFrame = requestAnimationFrame(() => {
        connectDragFrame = null;
        renderConnectDragPreview();
      });
    }

    function renderConnectDragPreview() {
      if (!state.connectDrag) return;
      const svg = $("groupFlow")?.querySelector(".link-layer");
      const fromRect = endpointRect(state.connectDrag.fromId);
      if (!svg || !fromRect) return;
      const start = rectCenter(fromRect);
      let preview = svg.querySelector("#connectDragPreviewLine");
      if (!preview) {
        preview = document.createElementNS("http://www.w3.org/2000/svg", "line");
        preview.id = "connectDragPreviewLine";
        preview.setAttribute("stroke", "var(--accent)");
        preview.setAttribute("stroke-width", "2.4");
        preview.setAttribute("stroke-dasharray", "6 5");
        preview.setAttribute("stroke-linecap", "round");
        preview.setAttribute("pointer-events", "none");
        svg.appendChild(preview);
      }
      preview.setAttribute("x1", start.x);
      preview.setAttribute("y1", start.y);
      preview.setAttribute("x2", state.connectDrag.x);
      preview.setAttribute("y2", state.connectDrag.y);
    }

    function connectDragEnd(event) {
      if (!state.connectDrag) return;
      if (state.connectDrag.pointerId !== null && event.pointerId !== state.connectDrag.pointerId) return;
      if (state.connectDrag.pointerId !== null && event.type?.startsWith?.("mouse")) return;
      if (connectDragFrame) {
        cancelAnimationFrame(connectDragFrame);
        connectDragFrame = null;
      }
      const fromId = state.connectDrag.fromId;
      const moved = state.connectDrag.moved;
      state.connectDrag = null;
      $("groupFlow")?.classList.remove("connect-dragging");
      const toId = connectTargetFromPoint(event.clientX, event.clientY, fromId);
      if (toId && toId !== fromId) {
        addConnection(fromId, toId);
      } else if (!moved) {
        state.connectingFrom = fromId;
        renderGroupFlow();
      } else {
        state.connectingFrom = null;
        renderGroupFlow();
      }
    }

    function connectTargetFromPoint(clientX, clientY, fromId = "") {
      const target = document.elementFromPoint(clientX, clientY);
      const blockCard = target?.closest("[data-block-card]");
      const groupBox = target?.closest("[data-group-box]");
      const groupId = groupBox?.dataset.groupBox || "";
      const blockId = blockCard?.dataset.blockCard || "";
      if (blockId && resolvedEndpointId(blockId) !== resolvedEndpointId(fromId)) return blockId;
      if (groupId && resolvedEndpointId(groupId) !== resolvedEndpointId(fromId)) return groupId;
      return "";
    }

    // Some embedding webviews (VS Code's Electron webview included) can fire a synthetic "click" right
    // after "contextmenu", which would otherwise hit the document-level outside-click handler below and
    // close a menu the instant it opens. Every show*Menu() call stamps this, and the outside-click
    // handler ignores clicks that land within the same short window instead of trusting event identity.
    let lastMenuOpenAt = 0;
    function markMenuJustOpened() {
      lastMenuOpenAt = Date.now();
    }

    function showBlockMenu(x, y, blockId) {
      markMenuJustOpened();
      state.menuBlockId = blockId;
      renderContextMenuOptions();
      hideGroupMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
      const menu = $("blockMenu");
      menu.hidden = false;
      positionContextMenu(menu, x, y);
    }

    function hideBlockMenu() {
      $("blockMenu").hidden = true;
      state.menuBlockId = null;
    }

    function showGroupMenu(x, y, groupId) {
      markMenuJustOpened();
      state.menuGroupId = groupId;
      const blocks = blocksForGroup(groupId);
      state.selectedGroupId = groupId;
      state.selectedBlockId = null;
      state.selectedIds = blocks.map(block => block.id);
      state.focusEndpoint = groupId;
      renderContextMenuOptions();
      hideBlockMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
      const menu = $("groupMenu");
      menu.hidden = false;
      positionContextMenu(menu, x, y);
      renderInspector();
      renderStepFlowInspector();
      renderExport();
    }

    function hideGroupMenu() {
      $("groupMenu").hidden = true;
      state.menuGroupId = null;
    }

    function showStreamMenu(x, y, streamId) {
      markMenuJustOpened();
      state.menuStreamId = streamId;
      hideBlockMenu();
      hideGroupMenu();
      hideTextSelectionMenu();
      const menu = $("streamMenu");
      menu.hidden = false;
      positionContextMenu(menu, x, y);
    }

    function hideStreamMenu() {
      $("streamMenu").hidden = true;
      state.menuStreamId = null;
    }

    function showTextSelectionMenu(x, y, options = {}) {
      markMenuJustOpened();
      hideBlockMenu();
      hideGroupMenu();
      hideStreamMenu();
      state.manualBlockPoint = options.point || null;
      const menu = $("textSelectionMenu");
      const createFromText = $("ctxCreateBlockFromText");
      if (createFromText) {
        createFromText.disabled = options.hasSelection === false;
        createFromText.title = options.hasSelection === false ? "Select protocol text first, or use New Empty Block." : "";
      }
      menu.hidden = false;
      positionContextMenu(menu, x, y);
    }

    function hideTextSelectionMenu() {
      const menu = $("textSelectionMenu");
      if (menu) menu.hidden = true;
      state.manualBlockPoint = null;
    }

    function boardPointFromEvent(event) {
      const root = $("groupFlow");
      const rect = root.getBoundingClientRect();
      return {
        x: Math.max(0, (event.clientX - rect.left + root.scrollLeft) / state.zoom),
        y: Math.max(0, (event.clientY - rect.top + root.scrollTop) / state.zoom)
      };
    }

    function handleBoardContextMenu(event) {
      if (event.target.closest("[data-block-card], [data-group-box], button, input, textarea, select, .context-menu")) return;
      event.preventDefault();
      event.stopPropagation();
      showTextSelectionMenu(event.clientX, event.clientY, { hasSelection: false, point: boardPointFromEvent(event) });
    }

    function positionContextMenu(menu, x, y) {
      const margin = 10;
      const width = menu.offsetWidth || 275;
      const height = Math.min(menu.scrollHeight || 120, window.innerHeight - margin * 2);
      menu.style.maxHeight = `${Math.max(120, window.innerHeight - margin * 2)}px`;
      menu.style.left = `${Math.max(margin, Math.min(x, window.innerWidth - width - margin))}px`;
      menu.style.top = `${Math.max(margin, Math.min(y, window.innerHeight - height - margin))}px`;
    }

    function closeFloatingActions() {
      state.connectingFrom = null;
      state.drag = null;
      state.boardPan = null;
      $("groupFlow")?.classList.remove("board-dragging");
      $("groupFlow")?.classList.remove("board-panning");
      $("groupFlow")?.classList.remove("connect-dragging");
      if (state.connectDrag) {
        state.connectDrag = null;
        $("groupFlow")?.querySelector(".link-layer")?.querySelector("#connectDragPreviewLine")?.remove();
      }
      hideBlockMenu();
      hideGroupMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
    }

    function streamOwner(streamId) {
      const block = state.blocks.find(item => {
        ensureBlockFlowFields(item);
        return item.streams.some(stream => stream.id === streamId);
      }) || null;
      const stream = block?.streams.find(item => item.id === streamId) || null;
      return { block, stream };
    }

    function editStream(streamId) {
      const { block, stream } = streamOwner(streamId);
      if (!block || !stream) return;
      state.selectedBlockId = block.id;
      state.selectedGroupId = null;
      state.selectedIds = [block.id];
      stream.editing = true;
      hideStreamMenu();
      renderAll();
    }

    function deleteStream(streamId) {
      const { block } = streamOwner(streamId);
      if (!block) return;
      pushUndo();
      block.streams = block.streams.filter(stream => stream.id !== streamId);
      syncLegacyStreamLists(block);
      hideStreamMenu();
      invalidateAiRefine();
      renderAll();
    }

    function removeLinksForGroup(groupId) {
      state.links = state.links.filter(link => link.from !== groupId && link.to !== groupId);
      renderAll();
    }

    function removeLinksForEndpoint(endpointId) {
      state.links = state.links.filter(link => link.from !== endpointId && link.to !== endpointId);
      renderAll();
    }

    function autoLayoutGroups() {
      const ids = groupIdsInTextOrder();
      const draftBlocks = blocksInOrder().filter(block => !block.groupId);
      if (!ids.length && !draftBlocks.length) return;
      pushUndo();
      const columns = ids.length <= 5 ? ids.length || 1 : Math.min(5, Math.ceil(Math.sqrt(ids.length * 1.45)));
      const gapX = state.boardCompact ? 340 : 560;
      const gapY = state.boardCompact ? 245 : 330;
      const startX = draftBlocks.length ? 520 : 80;
      const startY = 90;
      ids.forEach((id, index) => {
        const group = ensureGroup(id);
        group.x = startX + (index % columns) * gapX;
        group.y = startY + Math.floor(index / columns) * gapY;
      });
      if (draftBlocks.length) state.draftPos = { x: 24, y: 90 };
      state.focusEndpoint = ids[0] || null;
      pendingBoardReflow = true;
      renderAll();
      fitBoard();
    }

    function resetView() {
      state.zoom = 0.78;
      applyZoomToBoard();
      $("groupFlow").scrollTo({ left: 0, top: 0, behavior: "smooth" });
    }

    function revealFocusedEndpoint() {
      const endpoint = state.focusEndpoint;
      if (!endpoint) return;
      state.focusEndpoint = null;
      const rect = endpointRect(endpoint);
      const flow = $("groupFlow");
      if (!rect || !flow) return;
      const padding = 84;
      const left = rect.x * state.zoom;
      const top = rect.y * state.zoom;
      const right = (rect.x + rect.w) * state.zoom;
      const bottom = (rect.y + rect.h) * state.zoom;
      const viewLeft = flow.scrollLeft;
      const viewTop = flow.scrollTop;
      const viewRight = viewLeft + flow.clientWidth;
      const hasGroupDrawer = Boolean(selectedGroup() || selectedBlock()?.groupId);
      const drawerOverlap = hasGroupDrawer ? Math.min(flow.clientHeight * 0.62, Math.max(260, (state.groupStepEditorHeight || 520) - 230)) : 0;
      const usableHeight = Math.max(220, flow.clientHeight - drawerOverlap);
      const viewBottom = viewTop + usableHeight;
      const visible = left >= viewLeft + padding
        && top >= viewTop + padding
        && right <= viewRight - padding
        && bottom <= viewBottom - padding;
      if (visible) return;
      if (typeof flow.scrollTo !== "function") return;
      flow.scrollTo({
        left: Math.max(0, left - flow.clientWidth * 0.32),
        top: Math.max(0, top - usableHeight * 0.32),
        behavior: "smooth"
      });
    }

    function centerSelection() {
      const block = selectedBlock();
      const endpoint = block?.groupId || block?.id || state.selectedGroupId || groupIdsInTextOrder()[0];
      const center = endpointCenter(endpoint) || { x: 0, y: 0 };
      $("groupFlow").scrollTo({
        left: Math.max(0, center.x * state.zoom - $("groupFlow").clientWidth / 2),
        top: Math.max(0, center.y * state.zoom - $("groupFlow").clientHeight / 2),
        behavior: "smooth"
      });
    }

    function setZoom(nextZoom, anchor = "center") {
      const flow = $("groupFlow");
      const oldZoom = state.zoom;
      const clamped = Math.max(0.25, Math.min(2.6, nextZoom));
      if (Math.abs(oldZoom - clamped) < 0.001) return;
      const anchorPoint = zoomAnchorPoint(flow, anchor, oldZoom);
      state.zoom = clamped;
      applyZoomToBoard();
      if (anchorPoint) {
        flow.scrollTo({
          left: Math.max(0, anchorPoint.boardX * state.zoom - anchorPoint.viewX),
          top: Math.max(0, anchorPoint.boardY * state.zoom - anchorPoint.viewY)
        });
      }
    }

    function applyZoomToBoard() {
      $("zoomReadout").textContent = `${Math.round(state.zoom * 100)}%`;
      const flow = $("groupFlow");
      const space = flow.querySelector(".board-space");
      const canvas = flow.querySelector(".board-canvas");
      if (!space || !canvas) return;
      const board = boardWithDrawerClearance(boardBounds());
      space.style.width = `${board.width * state.zoom}px`;
      space.style.height = `${board.height * state.zoom}px`;
      canvas.style.width = `${board.width}px`;
      canvas.style.height = `${board.height}px`;
      canvas.style.transform = `scale(${state.zoom})`;
      const svg = canvas.querySelector(".link-layer");
      if (svg) {
        svg.style.width = `${board.width}px`;
        svg.style.height = `${board.height}px`;
        svg.setAttribute("viewBox", `0 0 ${board.width} ${board.height}`);
      }
    }

    function zoomAnchorPoint(flow, anchor, oldZoom) {
      if (anchor === "none") return null;
      if (anchor && typeof anchor === "object") {
        const rect = flow.getBoundingClientRect();
        const viewX = clamp(anchor.clientX - rect.left, 0, flow.clientWidth);
        const viewY = clamp(anchor.clientY - rect.top, 0, flow.clientHeight);
        return {
          viewX,
          viewY,
          boardX: (flow.scrollLeft + viewX) / oldZoom,
          boardY: (flow.scrollTop + viewY) / oldZoom
        };
      }
      const viewX = flow.clientWidth / 2;
      const viewY = flow.clientHeight / 2;
      return {
        viewX,
        viewY,
        boardX: (flow.scrollLeft + viewX) / oldZoom,
        boardY: (flow.scrollTop + viewY) / oldZoom
      };
    }

    function handleGraphWheel(event) {
      const flow = $("groupFlow");
      if (!flow.contains(event.target)) return;
      if (!(event.ctrlKey || event.metaKey || event.altKey)) return;
      event.preventDefault();
      const delta = Math.max(-140, Math.min(140, event.deltaY));
      const factor = Math.exp(-delta * 0.012);
      setZoom(state.zoom * factor, { clientX: event.clientX, clientY: event.clientY });
    }

    function showHoverTip(event) {
      const target = event.target.closest?.(".tip[data-tip]");
      if (!target) return;
      const tip = $("hoverTip");
      tip.textContent = target.dataset.tip;
      tip.hidden = false;
      moveHoverTip(event);
    }

    function moveHoverTip(event) {
      const tip = $("hoverTip");
      if (tip.hidden) return;
      const margin = 14;
      const width = Math.min(390, window.innerWidth * 0.78);
      const left = Math.min(window.innerWidth - width - margin, event.clientX + 14);
      const top = Math.min(window.innerHeight - tip.offsetHeight - margin, event.clientY + 16);
      tip.style.left = `${Math.max(margin, left)}px`;
      tip.style.top = `${Math.max(margin, top)}px`;
    }

    function hideHoverTip(event) {
      if (event.relatedTarget?.closest?.(".tip[data-tip]")) return;
      $("hoverTip").hidden = true;
    }

    function fitBoard() {
      const flow = $("groupFlow");
      const ids = groupIdsInTextOrder();
      const draftBlocks = blocksInOrder().filter(block => !block.groupId);
      const boxes = [];
      if (draftBlocks.length) boxes.push({ x: state.draftPos.x, y: state.draftPos.y, w: nodeWidth(draftBlocks.length, "draft"), h: 300 });
      ids.forEach(id => {
        const group = ensureGroup(id);
        boxes.push({ x: group.x, y: group.y, w: nodeWidth(blocksForGroup(id).length), h: 340 });
      });
      if (!boxes.length) return;
      const minX = Math.min(...boxes.map(b => b.x));
      const minY = Math.min(...boxes.map(b => b.y));
      const maxX = Math.max(...boxes.map(b => b.x + b.w));
      const maxY = Math.max(...boxes.map(b => b.y + b.h));
      const zoomX = flow.clientWidth / Math.max(700, maxX - minX + 260);
      const zoomY = flow.clientHeight / Math.max(480, maxY - minY + 240);
      setZoom(Math.min(1.1, Math.max(0.35, Math.min(zoomX, zoomY))), "none");
      flow.scrollTo({
        left: Math.max(0, minX * state.zoom - 80),
        top: Math.max(0, minY * state.zoom - 80),
        behavior: "smooth"
      });
    }

    // Chevrons point in the direction each toggle collapses its panel toward, matching the panel's
    // side (left panel collapses left, right/inspector panel collapses right) - replaces the old
    // shared ◐/◑ pair that only themeToggle's glyphs (☀/☾) were distinct from.
    function updateProtocolToggleIcon() {
      const collapsed = $("appMain").classList.contains("protocol-collapsed");
      const button = $("toggleProtocolPanel");
      button.textContent = collapsed ? "›" : "‹";
      button.setAttribute("aria-label", collapsed ? "Show protocol panel" : "Hide protocol panel");
      button.setAttribute("aria-pressed", collapsed ? "true" : "false");
    }

    function updateInspectorToggleIcon() {
      const collapsed = $("appMain").classList.contains("inspector-collapsed");
      const button = $("toggleInspector");
      button.textContent = collapsed ? "‹" : "›";
      button.setAttribute("aria-label", collapsed ? "Show Phenomena/Group panel" : "Hide Phenomena/Group panel");
      button.setAttribute("aria-pressed", collapsed ? "true" : "false");
    }

    function toggleInspector() {
      $("appMain").classList.toggle("inspector-collapsed");
      updateInspectorToggleIcon();
    }

    function toggleProtocolPanel() {
      $("appMain").classList.toggle("protocol-collapsed");
      updateProtocolToggleIcon();
    }

    function setSourcePanelTab(tab) {
      state.sourcePanelTab = tab === "board" ? "board" : "protocol";
      $("sourceProtocolTab").hidden = state.sourcePanelTab !== "protocol";
      $("sourceBoardTab").hidden = state.sourcePanelTab !== "board";
      document.querySelectorAll("[data-source-tab]").forEach(button => {
        const selected = button.dataset.sourceTab === state.sourcePanelTab;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
      });
    }

    // Tutorial (guided tour) functions moved to static/tutorial.js, loaded before this file.

    function setInspectorTab(tab) {
      state.activeInspectorTab = ["inspect", "heuristics", "scale"].includes(tab) ? tab : "inspect";
      renderInspectorTabs();
    }

    function openScalePanel() {
      if ($("appMain").classList.contains("inspector-collapsed")) {
        $("appMain").classList.remove("inspector-collapsed");
        updateInspectorToggleIcon();
      }
      setInspectorTab("scale");
    }

    function renderInspectorTabs() {
      const active = ["inspect", "heuristics", "scale"].includes(state.activeInspectorTab) ? state.activeInspectorTab : "inspect";
      $("appMain").classList.toggle("scale-focused", active === "scale");
      $("appMain").classList.toggle("heuristic-focused", active === "heuristics");
      document.querySelectorAll("[data-inspector-tab]").forEach(button => {
        const selected = button.dataset.inspectorTab === active;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
      });
      $("inspectPanelTab").hidden = active !== "inspect";
      $("heuristicsPanelTab").hidden = active !== "heuristics";
      $("scalePanelTab").hidden = active !== "scale";
    }

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
          set(4, "partial", `${closureIssues.length} outlet${closureIssues.length === 1 ? "" : "s"} not closed — see Network closure under Board Controls.`);
        } else {
          set(4, "done", "Network closed: every outlet routed, recycles connected, product outlet present.");
        }
      }

      const heuristics = heuristicReviewModel();
      const decisions = state.heuristicDecisions || {};
      const decided = heuristics.triggered.filter(item => decisions[item.id]?.decision).length;
      if (!heuristics.triggered.length) {
        set(5, blocks.length ? "todo" : "todo", "No heuristic rules triggered yet. Add phenomena, phases, and conditions.");
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
          <button class="workflow-step ${info.status}" data-workflow-step="${step.id}" title="${escapeAttr(`Step ${step.id}. ${step.paperName} — ${info.hint}`)}">
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
        item("Yield / conversion", "important",
          blocks.length ? reactionBlocks.every(block => hasCondition(block, ["conversion_yield"])) && reactionBlocks.length > 0 : false,
          "Record conversion/yield on each reaction block (conversion_yield condition)."),
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
          "No phase-transition/change/separation phenomena assigned yet — check evaporation, crystallization, splits."),
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
          "Reaction blocks should record conversion/yield; transfer blocks should record an observable completion cue."),
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
          note: stream.note || "",
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
      const rules = [
        [/methylbenzene|toluene/, "toluene"],
        [/cyclohexane/, "cyclohexane"],
        [/benzaldehyde/, "benzaldehyde"],
        [/benzophenone/, "benzophenone"],
        [/2-ethylhexyl cyanoacetate/, "2-ethylhexyl cyanoacetate"],
        [/ammonium acetate/, "ammonium acetate"],
        [/molecular sieves|sieve 4a|sieves 4a/, "molecular sieve, zeolite 4A"],
        [/wash water|water of condensation|\bwater\b/, "water"],
        [/wastewater|aqueous waste|treated effluent/, "wastewater"],
        [/uncaptured voc|voc/, "volatile organic compounds"],
        [/heavy residue|column bottoms|heavies|organic residue/, "organic residues"]
      ];
      const match = rules.find(([pattern]) => pattern.test(raw));
      if (match) return { name: match[1], source: "rule" };
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
      const role = stream.role;
      const producedInternally = producedKeys.has(lcaNameKey(stream.name));
      if (role === "input") {
        if (["recycled input", "recovered solvent"].includes(fate)) return "internal_recycle_input";
        if (fate === "intermediate" || producedInternally) return "internal_input";
        return "technosphere_input";
      }
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

    // Project JSON export functions moved to static/export.js, loaded before this file.

    function renderAll() {
      state.blocks.forEach(block => {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
        if (typeof block.notes !== "string") block.notes = "";
        sanitizeBlockPhenomena(block);
      });
      renderAnnotatedText();
      renderLinkControls();
      renderGroupFlow();
      renderStepFlowInspector();
      renderInspector();
      renderContextMenuOptions();
      setSourcePanelTab(state.sourcePanelTab);
      renderInspectorTabs();
      renderWorkflowStepper();
      renderDataReadiness();
      renderNetworkClosure();
      renderSeparationSimulatorModal();
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c]));
    }

    function escapeAttr(value) {
      return escapeHtml(value).replace(/`/g, "&#096;");
    }

    $("behaviorSelect").innerHTML = Object.entries(behaviorPresets)
      .map(([name, preset]) => `<option value="${escapeAttr(name)}" title="${escapeAttr(`${preset.description} Task: ${preset.task}. Phenomena: ${preset.phenomena.join(", ") || "none"}.`)}">${escapeHtml(name)}</option>`)
      .join("");

    function closeLoadExampleMenu() {
      $("loadExampleMenu").hidden = true;
      $("loadExampleToggle").setAttribute("aria-expanded", "false");
    }
    $("loadExampleToggle").addEventListener("click", () => {
      const willOpen = $("loadExampleMenu").hidden;
      $("loadExampleMenu").hidden = !willOpen;
      $("loadExampleToggle").setAttribute("aria-expanded", String(willOpen));
    });
    document.addEventListener("click", event => {
      if (!$("loadExampleMenu").hidden && !event.target.closest(".header-dropdown")) closeLoadExampleMenu();
    });
    $("loadSample").addEventListener("click", async () => {
      closeLoadExampleMenu();
      if (state.blocks.length && !(await confirmModal("Load the octocrylene case? This replaces all current blocks, groups, and arrows."))) return;
      if (state.blocks.length) pushUndo();
      loadBaseExampleProject();
    });
    $("loadMethylbenzeneCase")?.addEventListener("click", async () => {
      closeLoadExampleMenu();
      if (state.blocks.length && !(await confirmModal("Load the 3-reagent reaction-separation case? This replaces all current blocks, groups, and arrows."))) return;
      if (state.blocks.length) pushUndo();
      loadTripleReactantExampleProject();
    });
    function currentTheme() {
      const saved = document.documentElement.getAttribute("data-theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    function applyThemeToggleIcon() {
      $("themeToggle").textContent = currentTheme() === "dark" ? "☾" : "☀";
    }
    $("themeToggle").addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      applyThemeToggleIcon();
    });
    applyThemeToggleIcon();
    updateProtocolToggleIcon();
    updateInspectorToggleIcon();
    $("loadTextSide").addEventListener("click", loadTextView);
    $("undoAction").addEventListener("click", undoLast);
    $("autoConnect").addEventListener("click", autoConnectGroups);
    $("toggleReadiness").addEventListener("click", () => {
      state.showDataReadiness = !state.showDataReadiness;
      renderDataReadiness();
    });
    $("workflowStepper").addEventListener("click", event => {
      const button = event.target.closest("[data-workflow-step]");
      if (!button) return;
      const step = workflowSteps.find(item => item.id === Number(button.dataset.workflowStep));
      if (!step) return;
      if ($("appMain").classList.contains("inspector-collapsed")) {
        $("appMain").classList.remove("inspector-collapsed");
        updateInspectorToggleIcon();
      }
      setInspectorTab(step.tab);
      renderWorkflowStepper();
    });
    $("createBlockSide").addEventListener("click", createBlockFromSelection);
    $("openScaleTop")?.addEventListener("click", openScalePanel);
    $("clearProject").addEventListener("click", async () => {
      if (!state.blocks.length) return;
      if (!(await confirmModal("Clear all blocks, groups, and arrows? This cannot be undone with more than one step back."))) return;
      pushUndo();
      state.blocks = [];
      state.groups = {};
      state.links = [];
      state.draftPos = { x: 24, y: 24 };
      state.connectingFrom = null;
      state.focusEndpoint = null;
      state.zoom = 0.78;
      state.selectedIds = [];
      state.selectedBlockId = null;
      state.selectedGroupId = null;
      state.ruleChecks = [];
      state.aiRefine = null;
      renderAll();
    });
    $("exportJson").addEventListener("click", downloadProjectJson);
    document.querySelectorAll("[data-source-tab]").forEach(button => {
      button.addEventListener("click", () => setSourcePanelTab(button.dataset.sourceTab));
    });
    $("openTutorial").addEventListener("click", () => openTutorial());
    $("tutorialSkip").addEventListener("click", closeTutorial);
    $("tutorialPrev").addEventListener("click", () => {
      state.tutorialIndex = Math.max(0, state.tutorialIndex - 1);
      renderTutorialStep();
    });
    $("tutorialNext").addEventListener("click", () => {
      if (state.tutorialIndex >= tutorialSteps.length - 1) {
        closeTutorial();
        return;
      }
      state.tutorialIndex += 1;
      renderTutorialStep();
    });
    $("tutorialOverlay").addEventListener("click", event => {
      if (event.target === $("tutorialOverlay")) closeTutorial();
    });
    window.addEventListener("resize", () => {
      if ($("tutorialOverlay").hidden) return;
      positionTutorialStep(tutorialSteps[state.tutorialIndex] || tutorialSteps[0]);
    });
    $("refineProject").addEventListener("click", runRuleChecks);
    $("refineProjectAi").addEventListener("click", openAiRefineModal);
    $("closeAiRefineModal").addEventListener("click", closeAiRefineModal);
    $("openFlowsheet").addEventListener("click", openFlowsheetModal);
    $("closeFlowsheetModal").addEventListener("click", closeFlowsheetModal);
    $("closeSeparationSimulator")?.addEventListener("click", closeSeparationSimulator);
    $("closeConversionModal")?.addEventListener("click", () => { closeConversionModal(); renderAll(); });
    $("conversionModal")?.addEventListener("click", event => {
      if (event.target === $("conversionModal")) { closeConversionModal(); renderAll(); }
    });
    $("flowsheetEditableMode").addEventListener("click", () => {
      state.flowsheetMode = "editable";
      renderFlowsheetModal();
    });
    $("fitFlowsheetView").addEventListener("click", () => {
      state.flowsheetFit = !state.flowsheetFit;
      renderFlowsheetModal();
    });
    $("flowsheetShowStreamLabels")?.addEventListener("change", event => {
      state.flowsheetShowStreamLabels = event.target.checked;
      renderFlowsheetModal();
    });
    if ($("flowsheetTechnicalMode")) {
      $("flowsheetTechnicalMode").addEventListener("click", () => {
        state.flowsheetMode = "technical";
        renderFlowsheetModal();
      });
    }
    $("downloadFlowsheet").addEventListener("click", downloadFlowsheetSvg);
    $("resetFlowsheetLayout").addEventListener("click", () => {
      pushUndo();
      groupIdsInTextOrder().forEach(groupId => {
        const groupState = ensureGroup(groupId);
        delete groupState.flowsheetX;
        delete groupState.flowsheetY;
        delete groupState.flowsheetLayoutVersion;
      });
      state.flowsheetFit = true;
      renderFlowsheetModal();
    });
    $("flowsheetModal").addEventListener("click", event => {
      if (event.target === $("flowsheetModal")) closeFlowsheetModal();
    });
    $("separationSimulatorModal")?.addEventListener("click", event => {
      if (event.target === $("separationSimulatorModal")) closeSeparationSimulator();
    });
    $("closeSplitGroupModal").addEventListener("click", closeSplitGroupModal);
    $("cancelSplitGroup").addEventListener("click", closeSplitGroupModal);
    $("confirmSplitGroup").addEventListener("click", confirmSplitGroupModal);
    $("splitGroupN").addEventListener("input", renderSplitGroupPreview);
    $("splitGroupDivideDuration").addEventListener("change", renderSplitGroupPreview);
    $("splitGroupModal").addEventListener("click", event => {
      if (event.target === $("splitGroupModal")) closeSplitGroupModal();
    });
    $("rerunLocalRuleApplication").addEventListener("click", () => {
      runAiRefine(currentProcessRuleOptions());
      renderAiRefineModal();
    });
    document.querySelectorAll("[data-rule-scope]").forEach(control => {
      control.addEventListener("change", () => {
        state.processRuleOptions = currentProcessRuleOptions();
        runAiRefine(state.processRuleOptions);
        renderAiRefineModal();
      });
    });
    $("runExternalAiRefine").addEventListener("click", runExternalAiRefine);
    $("resetView").addEventListener("click", resetView);
    $("autoLayout").addEventListener("click", autoLayoutGroups);
    $("toggleCompact").addEventListener("click", () => {
      state.boardCompact = !state.boardCompact;
      $("toggleCompact").textContent = state.boardCompact ? "Detailed" : "Compact";
      $("toggleCompact").classList.toggle("primary", state.boardCompact);
      pendingBoardReflow = true;
      renderAll();
    });
    $("boardCenter").addEventListener("click", centerSelection);
    $("zoomOut").addEventListener("click", () => setZoom(state.zoom / 1.35));
    $("zoomIn").addEventListener("click", () => setZoom(state.zoom * 1.35));
    $("zoomFit").addEventListener("click", fitBoard);
    $("toggleInspector").addEventListener("click", toggleInspector);
    $("toggleProtocolPanel").addEventListener("click", toggleProtocolPanel);
    $("stepFlowInspector").addEventListener("pointerdown", startStepEditorResize);
    $("stepFlowInspector").addEventListener("mouseup", rememberStepFlowEditorHeight);
    $("stepFlowInspector").addEventListener("pointerup", rememberStepFlowEditorHeight);
    $("stepFlowInspector").addEventListener("touchend", rememberStepFlowEditorHeight);
    window.addEventListener("pointermove", moveStepEditorResize);
    window.addEventListener("pointerup", stopStepEditorResize);
    window.addEventListener("pointercancel", stopStepEditorResize);
    window.addEventListener("mouseup", rememberStepFlowEditorHeight);
    window.addEventListener("touchend", rememberStepFlowEditorHeight);
    $("groupFlow").addEventListener("wheel", handleGraphWheel, { passive: false });
    $("groupFlow").addEventListener("contextmenu", handleBoardContextMenu);
    $("groupFlow").addEventListener("pointerdown", startBoardPan);
    if (!window.PointerEvent) $("groupFlow").addEventListener("mousedown", startBoardPan);
    document.querySelectorAll("[data-inspector-tab]").forEach(button => {
      button.addEventListener("click", () => setInspectorTab(button.dataset.inspectorTab));
    });

    $("annotatedText").addEventListener("mouseup", rememberSelection);
    $("annotatedText").addEventListener("pointerup", rememberSelection);
    $("annotatedText").addEventListener("keyup", rememberSelection);
    $("annotatedText").addEventListener("mousedown", handleTextSelectionRightMouseDown);
    $("annotatedText").addEventListener("contextmenu", handleTextSelectionContextMenu);
    $("sourceInput").addEventListener("mouseup", rememberSelection);
    $("sourceInput").addEventListener("pointerup", rememberSelection);
    $("sourceInput").addEventListener("select", rememberSelection);
    $("sourceInput").addEventListener("keyup", rememberSelection);
    $("sourceInput").addEventListener("mousedown", handleTextSelectionRightMouseDown);
    $("sourceInput").addEventListener("contextmenu", handleTextSelectionContextMenu);
    document.addEventListener("mousedown", handleTextSelectionRightMouseDown, true);
    document.addEventListener("contextmenu", handleTextSelectionContextMenu, true);
    document.addEventListener("selectionchange", () => {
      const anchor = window.getSelection()?.anchorNode || null;
      if (document.activeElement === $("sourceInput") || (anchor && $("annotatedText").contains(anchor))) {
        rememberSelection();
      }
    });

    $("behaviorSelect").addEventListener("change", event => {
      renderBehaviorPresetHelp(event.target.value);
      applyBehavior(event.target.value);
    });
    $("blockText").addEventListener("input", event => {
      const block = selectedBlock();
      if (!block) return;
      block.text = event.target.value;
      invalidateAiRefine();
      renderGroupFlow();
      renderStepAuditPanel();
      renderExport();
    });
    $("groupTask")?.addEventListener("input", event => {
      const group = selectedGroup();
      if (!group) return;
      ensureGroup(group.id).task = event.target.value;
      renderAll();
    });

    $("ctxCombine").addEventListener("click", () => {
      combineSelected();
      hideBlockMenu();
    });
    $("ctxNewGroup").addEventListener("click", () => {
      splitSelectedToNewGroup();
      hideBlockMenu();
    });
    $("ctxAssignGroup").addEventListener("click", () => {
      assignSelectedToGroup($("ctxGroupSelect").value);
      hideBlockMenu();
    });
    $("ctxStartBlockConnection").addEventListener("click", () => {
      state.connectingFrom = state.menuBlockId;
      hideBlockMenu();
      renderAll();
    });
    $("ctxDeleteBlock").addEventListener("click", () => {
      const blockId = state.menuBlockId;
      hideBlockMenu();
      deleteBlock(blockId);
    });
    $("ctxRemoveFromGroup").addEventListener("click", () => {
      const blockId = state.menuBlockId;
      hideBlockMenu();
      removeBlockFromGroup(blockId);
    });
    $("ctxSplitBlockGroup").addEventListener("click", () => {
      const block = state.blocks.find(item => item.id === state.menuBlockId);
      const groupId = block?.groupId;
      hideBlockMenu();
      if (groupId) openSplitGroupModal(groupId);
    });
    $("ctxMergeBlocks").addEventListener("click", () => {
      hideBlockMenu();
      mergeSelectedBlocks();
    });
    $("ctxRemoveBlockLinks").addEventListener("click", () => {
      removeLinksForEndpoint(state.menuBlockId);
      hideBlockMenu();
    });
    $("ctxStartConnection").addEventListener("click", () => {
      state.connectingFrom = state.menuGroupId;
      hideGroupMenu();
      renderAll();
    });
    $("ctxRemoveLinks").addEventListener("click", () => {
      removeLinksForGroup(state.menuGroupId);
      hideGroupMenu();
    });
    $("ctxAddManualBlockToGroup").addEventListener("click", () => {
      const groupId = state.menuGroupId;
      if (groupId) createManualBlock({ groupId });
    });
    $("ctxSplitGroup").addEventListener("click", () => {
      const groupId = state.menuGroupId;
      hideGroupMenu();
      if (groupId) openSplitGroupModal(groupId);
    });
    $("ctxEditStream").addEventListener("click", () => {
      editStream(state.menuStreamId);
    });
    $("ctxDeleteStream").addEventListener("click", () => {
      deleteStream(state.menuStreamId);
    });
    $("textSelectionMenu").addEventListener("mousedown", event => {
      event.preventDefault();
    });
    $("ctxCreateBlockFromText").addEventListener("click", () => {
      hideTextSelectionMenu();
      createBlockFromSelection();
    });
    $("ctxCreateManualBlock").addEventListener("click", () => {
      const point = state.manualBlockPoint || {};
      createManualBlock(point);
    });
    $("closePubchemResolve").addEventListener("click", closePubChemResolveModal);
    $("pubchemResolveModal").addEventListener("click", event => {
      if (event.target === $("pubchemResolveModal")) closePubChemResolveModal();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!$("pubchemResolveModal").hidden) {
          closePubChemResolveModal();
          return;
        }
        if (!$("aiRefineModal").hidden) {
          closeAiRefineModal();
          return;
        }
        if (!$("separationSimulatorModal").hidden) {
          closeSeparationSimulator();
          return;
        }
        if (!$("conversionModal").hidden) {
          closeConversionModal();
          renderAll();
          return;
        }
        if (!$("flowsheetModal").hidden) {
          closeFlowsheetModal();
          return;
        }
        if (!$("splitGroupModal").hidden) {
          closeSplitGroupModal();
          return;
        }
        if (!$("confirmModal").hidden && activeConfirmCancel) {
          activeConfirmCancel();
          return;
        }
        closeFloatingActions();
        renderAll();
        return;
      }
      const editingField = ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !editingField) {
        event.preventDefault();
        undoLast();
      }
    });
    document.addEventListener("click", event => {
      if (event.target.closest(".context-menu")) return;
      const anyMenuOpen = !$("blockMenu").hidden || !$("groupMenu").hidden || !$("streamMenu").hidden || !$("textSelectionMenu").hidden;
      if (!anyMenuOpen) return;
      if (Date.now() - lastMenuOpenAt < 250) return;
      hideBlockMenu();
      hideGroupMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
    });
    document.addEventListener("mouseover", showHoverTip);
    document.addEventListener("mousemove", moveHoverTip);
    document.addEventListener("mouseout", hideHoverTip);
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("pointermove", boardPanMove);
    document.addEventListener("pointerup", boardPanEnd);
    document.addEventListener("pointercancel", boardPanEnd);
    document.addEventListener("mousemove", boardPanMove);
    document.addEventListener("mouseup", boardPanEnd);
    document.addEventListener("pointermove", connectDragMove);
    document.addEventListener("pointerup", connectDragEnd);
    document.addEventListener("pointercancel", connectDragEnd);
    document.addEventListener("mousemove", connectDragMove);
    document.addEventListener("mouseup", connectDragEnd);

    loadBaseExampleProject();
    if (window.location.hash === "#flowsheet") {
      requestAnimationFrame(openFlowsheetModal);
    }
