    const sampleText = `Charge 1.82 kg of benzophenone, 1.97 kg of 2-ethylhexyl cyanoacetate, 0.15 kg of ammonium acetate catalyst, and 3.50 kg of cyclohexane to a stirred jacketed reactor fitted with a reflux condenser and a Dean-Stark trap. Heat the stirred mixture to reflux at 85 C. Maintain reflux for 18 to 24 h, removing the water formed by the Knoevenagel condensation azeotropically until no further water separates in the Dean-Stark trap. Cool the crude reaction mixture to 40 C. Wash the organic phase with 2.0 kg of water in two counter-current stages, allowing the phases to settle after each contact. Separate and discard the aqueous layer. Dry the washed organic phase over molecular sieves until the water content is below 0.1 percent. Evaporate the cyclohexane under vacuum at 100 to 200 mbar in a thin-film evaporator and recover the condensed solvent for reuse. Purify the crude octocrylene by short-path distillation at 1.5 mbar, collecting purified octocrylene of at least 98 percent purity as final product and sending heavy residues to disposal.`;

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
      "unassigned": { task: "unassigned", phenomena: [] },
      "charge and mix": { task: "reaction preparation", phenomena: ["M(L)", "2phM(LS)"] },
      "heat/cool": { task: "thermal conditioning", phenomena: ["ES(H)", "ES(C)"] },
      "reaction": { task: "reaction", phenomena: ["M(L)", "R(L)", "ES(H)"] },
      "reaction with in-situ removal": { task: "reaction", phenomena: ["M(L)", "R(L)", "ES(H)", "PT(VL)", "PS(VL)"] },
      "liquid-liquid wash": { task: "washing", phenomena: ["2phM(LL)", "PT(LL)", "PS(LL)"] },
      "solid-liquid drying": { task: "drying", phenomena: ["PC(LS)", "PS(LS)"] },
      "filtration": { task: "solid-liquid separation", phenomena: ["PS(LS)"] },
      "solvent evaporation": { task: "solvent removal", phenomena: ["ES(H)", "PT(VL)", "PS(VL)"] },
      "distillation purification": { task: "purification", phenomena: ["ES(H)", "PT(VL)", "PS(VL)"] },
      "vent abatement": { task: "vent abatement", phenomena: ["PC(VL)", "PS(VL)"] },
      "wastewater interface": { task: "wastewater treatment", phenomena: ["PS(LL)"] }
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
      { id: "thermal_ramp", label: "Thermal ramp / control", phenomena: ["ES(H)", "ES(C)"], placeholder: "slow heat-up, controlled cooling, quench rate...", kind: "text" },
      { id: "thermal_mode", label: "Heating / cooling device", phenomena: ["ES(H)", "ES(C)"], placeholder: "jacket, coil, condenser, ice bath, heat exchanger..." },
      { id: "thermal_endpoint", label: "Thermal endpoint", phenomena: ["ES(H)", "ES(C)", "PT(VL)"], placeholder: "reach reflux, cool to RT, solvent removed..." },
      { id: "initial_pressure", label: "Initial pressure", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)"], placeholder: "1", units: ["atm", "bar", "mbar"], defaultUnit: "atm", kind: "number" },
      { id: "target_pressure", label: "Target / final pressure", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)"], placeholder: "50", units: ["mbar", "bar", "atm"], defaultUnit: "mbar", kind: "number" },
      { id: "pressure_control", label: "Pressure control", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)"], placeholder: "vacuum ramp, condenser pressure, vent control..." },
      { id: "vapor_handling", label: "Vapor handling", phenomena: ["PT(VL)", "PS(VL)", "PC(VL)"], placeholder: "condenser, Dean-Stark, vent, carbon polish..." },
      { id: "mixing_mode", label: "Mixing mode", phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "stirred tank, high shear, inline mixer..." },
      { id: "mixing_time", label: "Mixing time", phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "0.5", unit: "h", kind: "number" },
      { id: "agitation_speed", label: "Agitation speed", phenomena: ["M(L)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "300", unit: "rpm", kind: "number", hint: "Literature ranges: lab stirred vessels ~200-1000 rpm; pilot/industrial tanks ~30-150 rpm (large impellers keep similar tip speed at much lower rpm); high-shear/rotor-stator ~1000-3000 rpm; anchor/helical ribbon on viscous fluids ~5-50 rpm." },
      { id: "mixing_intensity", label: "Mixing intensity / regime", phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "gentle, vigorous, suspension, dispersion..." },
      { id: "addition_mode", label: "Addition mode", phenomena: ["M(L)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "batch charge, semi-batch dosing, controlled feed..." },
      { id: "addition_time", label: "Addition / dosing time", phenomena: ["M(L)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)"], placeholder: "1", unit: "h", kind: "number", hint: "How long you spend adding/dosing this stream into the vessel (e.g. dropwise over 1 h) - distinct from mixing time (how long you keep stirring after) and reaction time (how long the reaction runs)." },
      { id: "contact_time", label: "Phase contact time", phenomena: ["PC(VL)", "PC(LL)", "PC(VS)", "PC(LS)", "PT(VL)", "PT(LL)", "PT(VS)", "PT(LS)", "2phM(VL)", "2phM(LL)", "2phM(LS)", "2phM(VS)"], placeholder: "0.25", unit: "h", kind: "number" },
      { id: "contact_device", label: "Contact device / geometry", phenomena: ["PC(VL)", "PC(LL)", "PC(VS)", "PC(LS)", "2phM(VL)", "2phM(LL)", "2phM(LS)", "2phM(VS)"], placeholder: "impeller, packed bed, static mixer, spray..." },
      { id: "agitation_note", label: "Agitation / mass-transfer note", phenomena: ["M(L)", "M(V)", "M(S)", "2phM(VL)", "2phM(LS)", "2phM(LL)", "2phM(VS)", "PC(LL)", "PC(LS)", "PC(VL)", "PC(VS)"], placeholder: "avoid emulsion, suspend solids, improve contact..." },
      { id: "reaction_time", label: "Reaction time", phenomena: ["R(L)", "R(V)"], placeholder: "2", unit: "h", kind: "number" },
      { id: "conversion_yield", label: "Conversion / yield", phenomena: ["R(L)", "R(V)"], placeholder: "95", unit: "%", kind: "number" },
      { id: "reaction_endpoint", label: "Reaction endpoint", phenomena: ["R(L)", "R(V)"], placeholder: "water removed, GC conversion, color change..." },
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
        yieldPercent: "100",
        recoveryPercent: "100",
        designMarginPercent: "0",
        confidence: "rough"
      },
      ruleChecks: [],
      aiRefine: null,
      heuristicDecisions: {},
      showDataReadiness: false,
      showConnections: false,
      measuredNodeHeights: {},
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
      activeInspectorTab: "inspect",
      selectedBlockId: null,
      selectedGroupId: null,
      selectedIds: [],
      tutorialIndex: 0,
      menuBlockId: null,
      menuGroupId: null,
      menuStreamId: null,
      connectingFrom: null,
      lastSelection: null,
      lastSelectionAt: 0,
      zoom: 0.78,
      draftPos: { x: 24, y: 24 },
      focusEndpoint: null,
      drag: null
    };

    const $ = id => document.getElementById(id);

    const undoStack = [];
    let flowsheetRequestSeq = 0;

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

    function nodeWidth(blockCount) {
      if (state.boardCompact) return 200;
      return Math.max(430, 92 + Math.max(1, blockCount) * 194);
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
          w: nodeWidth(draftBlocks.length),
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
          h: 380
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
        state.groups[groupId] = {
          id: groupId,
          task,
          selectedUnit: "",
          schedule: scheduleDefaults(),
          properties: {},
          propertiesEditing: false,
          x: 520 + count * 480,
          y: 90 + (count % 2) * 260
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
        predictor.mode = ["skip", "minimal"].includes(predictor.mode) ? predictor.mode : "skip";
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
      if (typeof state.groups[groupId].openOverrideKey !== "string") state.groups[groupId].openOverrideKey = "";
      return state.groups[groupId];
    }

    function scheduleDefaults() {
      return {
        durationH: "",
        parallelUnits: "1",
        canOverlap: "no",
        operationClass: "auto",
        scaleSensitivity: "unknown",
        dependency: "previous",
        notes: ""
      };
    }

    function createBlock(start, end, options = {}) {
      if (start === end) return;
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      if (state.blocks.some(block => rangesOverlap(lo, hi, block.start, block.end))) {
        alert("Selection overlaps an existing block. Select unassigned text or use group actions.");
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
        text,
        behavior,
        phenomena,
        streams: [],
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
        if (phenomena.some(code => code.startsWith("ES("))) block.conditions.thermal_endpoint = block.conditions.thermal_endpoint || options.endpoint;
        else if (phenomena.some(code => code.startsWith("R("))) block.conditions.reaction_endpoint = block.conditions.reaction_endpoint || options.endpoint;
        else if (phenomena.some(code => code.startsWith("PT("))) block.conditions.transfer_endpoint = block.conditions.transfer_endpoint || options.endpoint;
      }
      state.blocks.push(block);
      state.selectedBlockId = block.id;
      state.selectedIds = [block.id];
      state.focusEndpoint = block.id;
      renderAll();
    }


    function phenomenaForBehaviorAndText(behavior, text) {
      const preset = behaviorPresets[behavior] || behaviorPresets.unassigned;
      const t = String(text || "").toLowerCase();
      if (behavior === "heat/cool") {
        const hasCooling = /\\bcool|cooled|cooling|quench|room temperature/.test(t);
        const hasHeating = /\\bheat|heated|heating|reflux|boil|boiling|warm|evaporat|distill/.test(t);
        if (hasCooling && !hasHeating) return ["ES(C)"];
        if (hasHeating && !hasCooling) return ["ES(H)"];
      }
      return [...preset.phenomena];
    }

    function inferInitialConditions(text, phenomena) {
      const t = text.toLowerCase();
      const conditions = {};
      const units = {};
      const hasThermal = phenomena.some(code => ["ES(H)", "ES(C)", "PT(VL)"].includes(code));
      const hasPressure = phenomena.some(code => ["PT(VL)", "PS(VL)", "PC(VL)"].includes(code));
      const temperatureMatch = text.match(/(\d+(?:\.\d+)?\s*(?:-|to|–)\s*\d+(?:\.\d+)?\s*°?\s*C|\d+(?:\.\d+)?\s*°?\s*C)/i);
      if (hasThermal && temperatureMatch) {
        conditions.target_temperature = temperatureMatch[1].replace(/°?\s*C/ig, "").replace(/\s+/g, " ").trim();
        units.target_temperature = "C";
      }
      if (hasThermal && t.includes("room temperature")) conditions.thermal_endpoint = conditions.thermal_endpoint || "cool/reach room temperature";
      if (hasThermal && t.includes("reflux")) {
        conditions.thermal_endpoint = "reach reflux";
      }
      if (hasThermal && (t.includes("cool") || t.includes("cooled"))) {
        conditions.thermal_ramp = "cooling step";
      }
      if (hasPressure && t.includes("vacuum")) conditions.pressure_control = "vacuum operation";
      if (hasPressure && t.includes("dean-stark")) conditions.vapor_handling = "Dean-Stark water removal";
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

    function selectedBlock() {
      const block = state.blocks.find(item => item.id === state.selectedBlockId) || null;
      if (block) {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
      }
      return block;
    }

    function selectedGroup() {
      if (state.selectedGroupId && blocksForGroup(state.selectedGroupId).length) return groupModel(state.selectedGroupId);
      const block = selectedBlock();
      return block?.groupId ? groupModel(block.groupId) : null;
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
          { mixing_mode: "stirred jacketed reactor", addition_mode: "batch charge", addition_time: "0.5" },
          { addition_time: "h" }
        ),
        makeBlock(
          "B2",
          "Heat the stirred mixture to reflux at 85 C.",
          "G1",
          "heat/cool",
          ["ES(H)", "M(L)"],
          [],
          { initial_temperature: "25", target_temperature: "85", thermal_mode: "jacket heating to reflux", thermal_endpoint: "stable reflux at 85 C" },
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
            { role: "waste", name: "water of condensation", quantity: "0.18", unit: "kg", phase: "L", status: "calculated", timing: "waste purge", fate: "wastewater", scalingMode: "per batch", note: "azeotropic removal via Dean-Stark decanter; cyclohexane returns to reactor" },
            { role: "waste", name: "cyclohexane vapor to vent", quantity: "0.05", unit: "kg", phase: "V", status: "estimated", timing: "vent/emission", fate: "vent", scalingMode: "fixed loss %", note: "route to vent condenser + activated carbon polishing (VOC compliance, heuristic addition)" }
          ],
          { reaction_time: "21", holding_temperature: "85", mixing_mode: "refluxing stirred liquid", conversion_yield: "90", reaction_endpoint: "no further water separates in the trap" },
          { reaction_time: "h", holding_temperature: "C", conversion_yield: "%" }
        ),
        makeBlock(
          "B4",
          "Cool the crude reaction mixture to 40 C.",
          "G3",
          "heat/cool",
          ["ES(C)"],
          [],
          { initial_temperature: "85", target_temperature: "40", thermal_ramp: "controlled cooling before work-up", thermal_endpoint: "40 C" },
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
          { mixing_mode: "two-stage counter-current mixer-settler", mixing_time: "0.5", settling_time: "0.5", phase_ratio: "organic:aqueous approx. 7.2:2.0" },
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
            { role: "waste", name: "aqueous waste", quantity: "2.16", unit: "kg", phase: "L", status: "estimated", timing: "waste purge", fate: "wastewater", scalingMode: "per batch", note: "neutralization tank + off-site WWT interface (compliance unit, heuristic addition)" }
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
            { role: "output", name: "recovered cyclohexane", quantity: "3.15", unit: "kg", phase: "L", status: "calculated", timing: "in-process intermediate", fate: "recovered solvent", recoveryPercent: "90", scalingMode: "recycle loop", loopId: "CYHX", destinationGroup: "G1", note: "returns to feed preparation; industrial recovery via dedicated distillation column" },
            { role: "output", name: "crude octocrylene", quantity: "3.50", unit: "kg", phase: "L", status: "estimated", timing: "in-process intermediate", fate: "intermediate", scalingMode: "per batch" },
            { role: "waste", name: "cyclohexane loss", quantity: "0.35", unit: "kg", phase: "V", status: "calculated", timing: "vent/emission", fate: "loss", scalingMode: "fixed loss %", note: "make-up fresh cyclohexane required" }
          ],
          { target_pressure: "150", pressure_control: "vacuum thin-film evaporation", vapor_handling: "condenser before vacuum system, vent to abatement", phase_change_time: "2", phase_change_fraction: "90" },
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
        )
      ];
      state.groups = {
        G1: { id: "G1", task: "feed preparation and heat-up", selectedUnit: "Jacketed vessel heat/cool step", schedule: { durationH: "2", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "roughly constant", dependency: "previous", notes: "charge from feed tanks (paper U1) plus heat to reflux; receives recovered cyclohexane loop CYHX" }, properties: { heat_capacity: { value: "1.8", unit: "kJ/kg/K", status: "assumed", note: "aromatic/aliphatic mixture Cp" }, density: { value: "870", unit: "kg/m3", status: "assumed", note: "" } }, propertiesEditing: false, x: 620, y: 90 },
        G2: { id: "G2", task: "Knoevenagel reaction with in-situ water removal", selectedUnit: "Batch / semi-batch reactor", schedule: { durationH: "21", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "kinetics-bound", dependency: "previous", notes: "5 m3 semi-batch jacketed reactor with reflux condenser and Dean-Stark internal loop (paper U2); kinetic bottleneck, cannot be relieved by parallelization" }, properties: { heat_capacity: { value: "1.9", unit: "kJ/kg/K", status: "assumed", note: "" }, viscosity: { value: "40", unit: "mPa s", status: "assumed", note: "crude viscosity rises with conversion; mixing-sensitive at scale" } }, propertiesEditing: false, x: 1180, y: 90 },
        G3: { id: "G3", task: "cooling before work-up", selectedUnit: "External loop heat exchanger", schedule: { durationH: "2", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "cooling duty scales with V/A ratio; jacket alone may be insufficient at 5 m3" }, properties: { heat_capacity: { value: "1.9", unit: "kJ/kg/K", status: "assumed", note: "" } }, propertiesEditing: false, x: 1740, y: 90 },
        G4: { id: "G4", task: "counter-current water wash", selectedUnit: "Liquid-liquid extraction", schedule: { durationH: "1.5", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "increases with scale", dependency: "previous", notes: "2-stage counter-current mixer-settler train (paper U3); emulsion and settling risk at scale; aqueous to WWT interface (paper U9)" }, properties: { density_difference: { value: "130", unit: "kg/m3", status: "assumed", note: "" }, emulsion_risk: { value: "medium", unit: "", status: "assumed", note: "watch LL scale-up" } }, propertiesEditing: false, x: 2300, y: 90 },
        G5: { id: "G5", task: "organic phase drying", selectedUnit: "Drying", selectionBasis: "fixed-bed molecular-sieve column: not derivable from protocol phenomena, chosen by drying/adsorption heuristic", schedule: { durationH: "2", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "fixed-bed 4A molecular-sieve column, regenerable (paper U4); not derivable from protocol phenomena alone - heuristic selection" }, properties: {}, propertiesEditing: false, x: 2860, y: 90 },
        G6: { id: "G6", task: "cyclohexane evaporation and recovery", selectedUnit: "Evaporation", selectionBasis: "thin-film evaporator over flash: heat-sensitivity heuristic H33 for the ester product", schedule: { durationH: "3", parallelUnits: "1", canOverlap: "no", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "thin-film evaporator chosen over flash by heat-sensitivity heuristic H33 (paper U5); recovered cyclohexane to solvent-recovery column (paper U8), loop CYHX to G1" }, properties: { boiling_point: { value: "81", unit: "C", status: "reported", note: "cyclohexane" }, heat_capacity: { value: "1.85", unit: "kJ/kg/K", status: "assumed", note: "" } }, propertiesEditing: false, x: 3420, y: 90 },
        G7: { id: "G7", task: "final purification", selectedUnit: "Distillation", selectionBasis: "short-path molecular distillation at 1.5 mbar: heat-sensitivity heuristic, minimize thermal exposure", schedule: { durationH: "2", parallelUnits: "1", canOverlap: "yes", scaleSensitivity: "equipment dependent", dependency: "previous", notes: "short-path molecular distillation at 1.5 mbar chosen by heat-sensitivity heuristic (paper U6); secondary bottleneck, can be parallelized; vents to abatement (paper U7)" }, properties: { viscosity: { value: "180", unit: "mPa s", status: "assumed", note: "crude octocrylene at feed temperature" } }, propertiesEditing: false, x: 3980, y: 90 }
      };
      state.links = [
        { from: "G1", to: "G2" },
        { from: "G2", to: "G3" },
        { from: "G3", to: "G4" },
        { from: "G4", to: "G5" },
        { from: "G5", to: "G6" },
        { from: "G6", to: "G7" },
        { from: "G6", to: "G1" }
      ];
      state.scaleBasis = {
        targetProduct: "octocrylene",
        targetAmount: "750000",
        targetUnit: "kg/year",
        referenceBlockId: "B9",
        basisAmount: "3.0",
        basisUnit: "kg",
        mode: "batch",
        operatingDays: "250",
        hoursPerDay: "24",
        batchesPerDay: "1",
        batchDuration: "28",
        oeePercent: "80",
        parallelUnits: "1",
        yieldPercent: "90",
        recoveryPercent: "95",
        designMarginPercent: "10",
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
      state.draftPos = { x: 24, y: 24 };
      state.focusEndpoint = "G2";
      state.activeInspectorTab = "inspect";
      renderAll();
      requestAnimationFrame(() => {
        centerSelection();
      });
    }

    function normalizeStream(stream) {
      const role = streamRoles[stream?.role] ? stream.role : (streamRoles[stream?.type] ? stream.type : "input");
      return {
        id: String(stream?.id || ""),
        role,
        name: String(stream?.name || stream?.material || ""),
        quantity: String(stream?.quantity || stream?.qty || ""),
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
        editing: Boolean(stream?.editing)
      };
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
      return Object.keys(streamRoles).reduce((counts, role) => {
        counts[role] = block.streams.filter(stream => stream.role === role).length;
        return counts;
      }, {});
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

    function unitTaskCompatibleWithGroup(unit, group) {
      const phen = new Set(group.phenomena || []);
      const hasReaction = [...phen].some(code => code.startsWith("R("));
      const hasSeparation = [...phen].some(code => code.startsWith("PS(") || code.startsWith("PT(") || code.startsWith("PC(") || code.startsWith("PCh("));
      const hasOnlyEnergy = phen.size > 0 && [...phen].every(code => code.startsWith("ES("));
      const hasOnlyMixing = phen.size > 0 && [...phen].every(code => code.startsWith("M(") || code.startsWith("2phM("));
      if (!hasReaction && unit.task.startsWith("reaction")) return false;
      if (hasOnlyEnergy) return unit.task === "thermal conditioning";
      if (group.task === "thermal conditioning") return unit.task === "thermal conditioning" || hasSeparation;
      if (group.task === "reaction preparation" || hasOnlyMixing) return unit.task === "reaction preparation";
      if (hasReaction) return unit.task.startsWith("reaction") || unit.task === "thermal conditioning";
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

    function phenomenonTip(code) {
      return phenomenonGlossary[code] || "Phenomenological descriptor used to compare blocks with possible unit-operation alternatives.";
    }

    function phenomenonPill(code) {
      return `<span class="pill green tip" data-tip="${escapeAttr(phenomenonTip(code))}">${escapeHtml(code)}</span>`;
    }

    function phenomenonOptionButton(code, active, disabled) {
      return `<button class="phen-option tip ${active ? "active" : ""}" data-phen="${escapeAttr(code)}" data-tip="${escapeAttr(phenomenonTip(code))}" ${disabled ? "disabled" : ""}>${escapeHtml(code)}</button>`;
    }

    function loadTextView() {
      if (state.blocks.length && !confirm("Loading the text view clears all current blocks, groups, and arrows. Continue?")) return;
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

    function selectionOffsets() {
      const container = $("annotatedText");
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") return null;
      if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) return null;
      const range = selection.getRangeAt(0);
      const pre = range.cloneRange();
      pre.selectNodeContents(container);
      pre.setEnd(range.startContainer, range.startOffset);
      const start = pre.toString().length;
      const end = start + range.toString().length;
      return { start, end, source: "annotated" };
    }

    function createBlockFromSelection() {
      const offsets = selectionOffsets() || state.lastSelection || sourceInputSelection();
      if (!offsets) {
        $("selectionInfo").textContent = "Select text in the loaded text view first, then create a block.";
        return;
      }
      createBlock(offsets.start, offsets.end);
    }

    function sourceInputSelection() {
      const source = $("sourceInput");
      if (document.activeElement !== source) return null;
      if (source.selectionStart === source.selectionEnd) return null;
      if (state.text !== source.value) {
        state.text = source.value;
        state.blocks = [];
        state.groups = {};
        state.links = [];
        state.selectedBlockId = null;
        state.selectedGroupId = null;
        state.selectedIds = [];
        state.aiRefine = null;
      }
      return {
        start: Math.min(source.selectionStart, source.selectionEnd),
        end: Math.max(source.selectionStart, source.selectionEnd),
        source: "source"
      };
    }

    function rememberSelection() {
      const offsets = selectionOffsets() || sourceInputSelection();
      state.lastSelection = offsets;
      state.lastSelectionAt = offsets ? Date.now() : 0;
      $("selectionInfo").textContent = offsets
        ? `Selected characters ${offsets.start}-${offsets.end}.`
        : "No active text selection.";
    }

    function handleTextSelectionRightMouseDown(event) {
      if (event.button !== 2) return;
      if (event.target.closest?.("[data-block-id]")) return;
      const offsets = selectionOffsets() || sourceInputSelection();
      if (!offsets) return;
      event.preventDefault();
      state.lastSelection = offsets;
      state.lastSelectionAt = Date.now();
      $("selectionInfo").textContent = `Selected characters ${offsets.start}-${offsets.end}.`;
      restoreTextSelection(offsets);
    }

    function handleTextSelectionContextMenu(event) {
      if (event.target.closest?.("[data-block-id]")) return;
      const recentStored = state.lastSelection && Date.now() - state.lastSelectionAt < 2500 ? state.lastSelection : null;
      const offsets = selectionOffsets() || sourceInputSelection() || recentStored;
      if (!offsets) return;
      event.preventDefault();
      state.lastSelection = offsets;
      state.lastSelectionAt = Date.now();
      $("selectionInfo").textContent = `Selected characters ${offsets.start}-${offsets.end}.`;
      restoreTextSelection(offsets);
      showTextSelectionMenu(event.clientX, event.clientY);
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

      const blocks = blocksInOrder();
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
      state.selectedBlockId = blockId;
      const block = state.blocks.find(item => item.id === blockId);
      state.selectedGroupId = block?.groupId || null;
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
      if (!state.blocks.length) {
        root.innerHTML = `<div class="empty">Create blocks from highlighted text. They will appear here as Draft Blocks first.</div>`;
        return;
      }
      const groupIds = groupIdsInTextOrder();
      const draftBlocks = blocksInOrder().filter(block => !block.groupId);
      const board = boardBounds();
      const draftHtml = draftBlocks.length ? `
        <section class="group-box draft" style="left:${state.draftPos.x}px; top:${state.draftPos.y}px; width:${nodeWidth(draftBlocks.length)}px" data-draft-box="true">
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
        const candidates = matchesForGroup(group).slice(0, 4);
        const active = state.selectedGroupId === group.id || group.blocks.some(block => state.selectedIds.includes(block.id));
        const boxClasses = `group-box tip ${state.boardCompact ? "compact" : ""} ${active ? "active" : ""} ${state.connectingFrom === group.id ? "connecting" : ""}`;
        if (state.boardCompact) {
          const category = flowsheetUnitCategory(group);
          const icon = flowsheetCategoryIcon[category] || "◼";
          return `
            <section class="${boxClasses}" style="left:${group.x}px; top:${group.y}px; width:${nodeWidth(group.blocks.length)}px" data-group-box="${group.id}" data-node-id="${group.id}" data-tip="${escapeAttr(groupContentsTip(group))}">
              <div class="group-head">
                <div class="row">
                  <span class="compact-icon compact-icon-${category}">${icon}</span>
                  <strong>${escapeHtml(group.id)}</strong>
                </div>
                <span class="pill">${group.blocks.length}</span>
              </div>
              <div class="compact-body">
                <strong>${escapeHtml(group.selectedUnit || "no unit selected")}</strong>
                <span class="muted small">${escapeHtml(group.task)}</span>
              </div>
            </section>
          `;
        }
        return `
          <section class="${boxClasses}" style="left:${group.x}px; top:${group.y}px; width:${nodeWidth(group.blocks.length)}px" data-group-box="${group.id}" data-node-id="${group.id}" data-tip="${escapeAttr(groupContentsTip(group))}">
            <div class="group-head">
              <div class="row">
                <strong>${escapeHtml(group.id)}</strong>
                <span class="pill blue">${escapeHtml(group.task)}</span>
              </div>
              <div class="row">
                <button class="mini-button" data-select-group="${escapeAttr(group.id)}" title="Open this group below: summed MFA, aggregated conditions, unit alternatives, and selection basis">Inspect Group</button>
                <span class="pill">${group.blocks.length} block${group.blocks.length === 1 ? "" : "s"}</span>
              </div>
            </div>
            <div class="block-strip">
              ${group.blocks.map(block => blockCardHtml(block)).join("")}
            </div>
            <div class="group-summary">
              <div class="label">Summed Phenomena</div>
              ${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted">No phenomena assigned.</span>`}
              ${groupMfaSummaryHtml(group)}
              ${groupConditionSummaryHtml(group)}
              ${state.showConnections && linksForGroup(group.id).length ? `<div class="group-connection-chips">${linksForGroup(group.id).map(link => `<span class="link-chip">${escapeHtml(formatLink(link, group.id))}</span>`).join("")}</div>` : ""}
              <div class="label" style="margin-top:8px">Alternatives</div>
              <div class="alt-grid">
                ${candidates.length ? candidates.map(candidate => `
                  <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-unit="${escapeAttr(candidate.name)}" data-unit-group="${group.id}" data-tip="${escapeAttr(alternativeReason(candidate))}">
                    ${escapeHtml(candidate.name)}
                  </button>
                `).join("") : `<span class="muted">Assign phenomena to get alternatives.</span>`}
              </div>
            </div>
          </section>
        `;
      }).join("");
      root.innerHTML = `
        <div class="board-space" style="width:${board.width * state.zoom}px; height:${board.height * state.zoom}px">
          <div class="board-canvas" style="width:${board.width}px; height:${board.height}px; transform:scale(${state.zoom})">
            ${renderLinksSvg(board)}
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

      root.querySelectorAll("[data-group-box]").forEach(box => {
        box.addEventListener("click", event => {
          if (event.target.closest("[data-block-card]") || event.target.closest("[data-unit]") || event.target.closest("[data-select-group]")) return;
          if (state.connectingFrom && state.connectingFrom !== box.dataset.groupBox) {
            addConnection(state.connectingFrom, box.dataset.groupBox);
            return;
          }
          selectGroup(box.dataset.groupBox);
        });
        box.addEventListener("contextmenu", event => {
          event.preventDefault();
          showGroupMenu(event.clientX, event.clientY, box.dataset.groupBox);
        });
        box.addEventListener("mousedown", event => {
          if (event.button !== 0 || event.target.closest("[data-block-card]") || event.target.closest("button")) return;
          startDrag(event, box.dataset.groupBox, "group");
        });
      });
      root.querySelectorAll("[data-select-group]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          selectGroup(button.dataset.selectGroup);
        });
      });

      const draftBox = root.querySelector("[data-draft-box]");
      if (draftBox) {
        draftBox.addEventListener("mousedown", event => {
          if (event.button !== 0 || event.target.closest("[data-block-card]") || event.target.closest("button")) return;
          startDrag(event, "draft", "draft");
        });
      }

      root.querySelectorAll("[data-unit]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.unitGroup).selectedUnit = button.dataset.unit;
          renderAll();
        });
      });

      measureNodeHeightsAndRedrawLinks(root, board);
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

    const flowsheetCategoryStyle = {
      reactor: { fill: "#fff8f7", stroke: "#cf4b42", label: "Reactor" },
      separation: { fill: "#f5f9ff", stroke: "#1671c2", label: "Separation" },
      utility: { fill: "#fffaf0", stroke: "#b97916", label: "Utility" },
      storage: { fill: "#f4fbf6", stroke: "#25834a", label: "Storage" },
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

    function flowsheetFlowTooltip(fromBox, toBox, magnitudeKg) {
      const header = `${fromBox.id} -> ${toBox.id}`;
      const massLine = Number.isFinite(magnitudeKg) && magnitudeKg > 0 ? `~${formatNumber(magnitudeKg)} kg/batch (from ${fromBox.id} outputs)` : "quantity not available";
      const substances = fromBox.outputStreams.filter(s => !["wastewater", "solid waste", "purge", "loss", "vent"].includes(s.fate)).slice(0, 6)
        .map(s => `- ${s.name}: ${s.quantity || "?"} ${s.unit || ""}`.trim());
      return [header, massLine, ...(substances.length ? ["Substances:", ...substances] : [])].join("\n");
    }

    function buildFlowsheetModel() {
      const groupIds = groupIdsInTextOrder();
      const boxW = 248;
      const boxH = 190;
      const gapX = 78;
      const topY = 138;
      const lowerY = 428;
      const maxTopRow = groupIds.length > 5 ? 5 : groupIds.length;
      const topStartX = 300;
      const lowerStartX = topStartX + Math.max(0, maxTopRow - 2) * (boxW + gapX);
      const autoPosition = (index) => {
        if (index < maxTopRow) {
          return { x: topStartX + index * (boxW + gapX), y: topY };
        }
        const lowerIndex = index - maxTopRow;
        return { x: Math.max(topStartX, lowerStartX - lowerIndex * (boxW + gapX)), y: lowerY };
      };
      const groups = groupIds.map((groupId, index) => {
        const group = groupModel(groupId);
        const stored = ensureGroup(groupId);
        const category = flowsheetUnitCategory(group);
        const subcategory = flowsheetUnitSubcategory(group);
        const meta = flowsheetGroupStreams(group);
        const specs = flowsheetGroupSpecs(group);
        const tip = groupContentsTip(group);
        const auto = autoPosition(index);
        const x = Number.isFinite(stored.flowsheetX) ? stored.flowsheetX : auto.x;
        const y = Number.isFinite(stored.flowsheetY) ? stored.flowsheetY : auto.y;
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
      const maxBoxBottom = groups.length ? Math.max(...groups.map(item => item.y + item.h)) : topY + boxH;
      const minBoxLeft = groups.length ? Math.min(...groups.map(item => item.x)) : 120;
      const maxBoxRight = groups.length ? Math.max(...groups.map(item => item.x + item.w)) : 900;
      const recycleLaneBaseY = maxBoxBottom + wasteAreaH + 54;
      const recycleLaneCount = recycleLinks.length;
      const feedBox = groups.length ? {
        id: "feeds",
        x: Math.max(34, minBoxLeft - 250),
        y: topY + 4,
        w: 178,
        h: Math.max(118, Math.min(204, 54 + groups[0].inputStreams.slice(0, 4).length * 34))
      } : null;
      const lastGroup = groups[groups.length - 1];
      const productBox = lastGroup ? {
        id: "product",
        x: lastGroup.y > topY + 100 ? Math.max(34, lastGroup.x - 238) : maxBoxRight + 76,
        y: lastGroup.y + 28,
        w: 190,
        h: 92
      } : null;
      const maxDiagramRight = Math.max(maxBoxRight, productBox ? productBox.x + productBox.w : 0);
      const width = Math.max(1180, maxDiagramRight + 90);
      const height = Math.max(660, recycleLaneCount ? recycleLaneBaseY + recycleLaneCount * 34 + 74 : maxBoxBottom + wasteAreaH + 118);
      return { groups, byId, forwardLinks, recycleLinks, feedBox, productBox, width, height, boxW, boxH, wasteAreaH, recycleLaneBaseY, maxOutputKg };
    }

    function flowsheetBoxCenter(box) {
      return { x: box.x + box.w / 2, y: Number.isFinite(box.symbolCenterY) ? box.symbolCenterY : box.y + box.h / 2 };
    }

    function flowsheetPort(from, to, source = true) {
      const fromCenter = flowsheetBoxCenter(from);
      const toCenter = flowsheetBoxCenter(to);
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        if ((source && dx >= 0) || (!source && dx < 0)) {
          return { x: from.x + from.w, y: fromCenter.y };
        }
        return { x: from.x, y: fromCenter.y };
      }
      if ((source && dy >= 0) || (!source && dy < 0)) {
        return { x: fromCenter.x, y: from.y + from.h };
      }
      return { x: fromCenter.x, y: from.y };
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
      const fromPt = flowsheetPort(from, to, true);
      const toPt = flowsheetPort(to, from, false);
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
          <marker id="fsArrow" markerWidth="9" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0.5 L0,7.5 L8,4 z" fill="#172027"></path>
          </marker>
          <marker id="fsArrowGreen" markerWidth="9" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0.5 L0,7.5 L8,4 z" fill="#286d3f"></path>
          </marker>
          <marker id="fsArrowOrange" markerWidth="9" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0.5 L0,7.5 L8,4 z" fill="#965d00"></path>
          </marker>
          <marker id="fsArrowGrey" markerWidth="9" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0.5 L0,7.5 L8,4 z" fill="#657480"></path>
          </marker>
        </defs>
      `;

      const sankeyWidth = (kg) => {
        if (!Number.isFinite(kg) || kg <= 0 || model.maxOutputKg <= 0) return 2.2;
        return Math.min(4.8, Math.max(2.2, (kg / model.maxOutputKg) * 3.1 + 1.7));
      };

      const forwardPaths = model.forwardLinks.map(link => {
        const from = model.byId.get(link.from);
        const to = model.byId.get(link.to);
        const points = flowsheetConnectorPoints(model, from, to);
        const d = orthogonalPath(points, 14);
        const strokeWidth = sankeyWidth(from.totalOutputKg);
        const tooltip = flowsheetFlowTooltip(from, to, from.totalOutputKg);
        return `
          <path d="${d}" stroke="#ffffff" stroke-width="${strokeWidth + 5}" stroke-linejoin="round" stroke-linecap="round" fill="none"></path>
          <path class="tip" data-tip="${escapeAttr(tooltip)}" d="${d}" stroke="#172027" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" fill="none" marker-end="url(#fsArrow)"></path>
        `;
      }).join("");

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
          const end = { x: first.x, y: first.y + Math.min(first.h - 24, 38 + i * 22) };
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
        const last = model.groups[model.groups.length - 1];
        const start = flowsheetPort(last, box, true);
        const end = flowsheetPort(box, last, false);
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
            const stubY = box.y + box.h + 24 + i * 44;
            const stubX = box.x + 24 + (i % 2) * (box.w - 48);
            return `
              <path d="M ${stubX} ${box.y + box.h} L ${stubX} ${stubY}" stroke="${color.line}" stroke-width="2" stroke-dasharray="${stream.kind === "vent" ? "4 4" : "none"}" fill="none" marker-end="${color.marker}"></path>
              <text x="${stubX}" y="${stubY + 13}" font-size="10" fill="${color.line}" text-anchor="middle">${escapeHtml(stream.kind)}: ${escapeHtml(stream.name)}</text>
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
        <svg class="flowsheet-svg" viewBox="0 0 ${model.width} ${drawingHeight}" xmlns="http://www.w3.org/2000/svg">
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

    async function renderFlowsheetModal() {
      const host = $("flowsheetHost");
      if (!host) return;
      const requestSeq = ++flowsheetRequestSeq;
      const result = buildFlowsheetSvg();
      host.innerHTML = result.empty
        ? `<div class="mfa-empty">No task groups yet — combine blocks into groups first, then open the Flowsheet View.</div>`
        : `<div class="flowsheet-render-status">Rendering technical PFD with pyflowsheet...</div>${result.svg}`;
      if (!result.empty) wireFlowsheetInteractions(host);
      if (result.empty) return;
      try {
        const data = await renderPyflowsheetSvg();
        if (requestSeq !== flowsheetRequestSeq || $("flowsheetModal").hidden) return;
        host.innerHTML = `
          <div class="flowsheet-render-status ok">Technical PFD rendered with ${escapeHtml(data.renderer || "Python renderer")} (${data.unitCount || 0} units). Concurrent steps are drawn as overlapping units when schedule overlap is enabled.</div>
          ${data.svg}
        `;
        const svg = host.querySelector("svg");
        if (svg) svg.classList.add("flowsheet-svg", "pyflowsheet-svg");
      } catch (err) {
        if (requestSeq !== flowsheetRequestSeq) return;
        const banner = host.querySelector(".flowsheet-render-status");
        if (banner) {
          banner.className = "flowsheet-render-status warn";
          banner.textContent = `pyflowsheet renderer unavailable; showing interactive fallback. ${err.message || err}`;
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
            }
            drag = null;
            renderFlowsheetModal();
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
        unitGroup.addEventListener("dblclick", event => {
          event.preventDefault();
          const groupState = ensureGroup(groupId);
          const nextLabel = prompt(`Edit the unit description shown for ${groupId}:`, groupState.selectedUnit || "");
          if (nextLabel === null) return;
          groupState.selectedUnit = nextLabel.trim();
          renderFlowsheetModal();
          renderAll();
        });
      });
    }

    function openFlowsheetModal() {
      $("flowsheetModal").hidden = false;
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

    function renderLinksSvg(board) {
      const nodeMasks = allNodeRects().map(rect => {
        const masked = shrinkRect(rect, 7);
        return `<rect x="${round(masked.x)}" y="${round(masked.y)}" width="${round(masked.w)}" height="${round(masked.h)}" rx="7" fill="black"></rect>`;
      }).join("");
      let recycleLane = 0;
      const links = state.links.map(link => {
        if (isBackwardLink(link)) {
          const route = recycleLaneRoute(link, recycleLane++);
          if (!route) return "";
          const path = orthogonalPath(route.points);
          const start = route.points[0];
          return `
            <path d="${path}" stroke="#f2faf5" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
            <path d="${path}" stroke="#286d3f" stroke-width="2.4" stroke-dasharray="8 6" stroke-linecap="round" stroke-linejoin="round" fill="none" marker-end="url(#arrowHead)"></path>
            <circle cx="${round(start.x)}" cy="${round(start.y)}" r="3.6" fill="#f2faf5" stroke="#286d3f" stroke-width="1.8"></circle>
            <text x="${round(route.labelX)}" y="${round(route.laneY - 8)}" class="link-label recycle" text-anchor="middle">recycle ${escapeHtml(resolvedEndpointId(link.from))} → ${escapeHtml(resolvedEndpointId(link.to))}</text>
          `;
        }
        const route = connectionRoute(link.from, link.to);
        if (!route) return "";
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

    function connectionRoute(fromId, toId) {
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
        .map(candidate => ({ ...candidate, points: compactRoute(candidate.points), score: routeScore(candidate.points, obstacles) + candidate.penalty }))
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

    function horizontalRoute(start, startOut, endOut, end) {
      const offsetsCross = (start.x <= end.x && startOut.x >= endOut.x) || (start.x >= end.x && startOut.x <= endOut.x);
      if (offsetsCross && Math.abs(start.y - end.y) < 34) return [start, end];
      const midX = (startOut.x + endOut.x) / 2;
      if (Math.abs(startOut.y - endOut.y) < 12) return [start, startOut, endOut, end];
      return [start, startOut, { x: midX, y: startOut.y }, { x: midX, y: endOut.y }, endOut, end];
    }

    function verticalRoute(start, startOut, endOut, end) {
      const offsetsCross = (start.y <= end.y && startOut.y >= endOut.y) || (start.y >= end.y && startOut.y <= endOut.y);
      if (offsetsCross && Math.abs(start.x - end.x) < 34) return [start, end];
      const midY = (startOut.y + endOut.y) / 2;
      if (Math.abs(startOut.x - endOut.x) < 12) return [start, startOut, endOut, end];
      return [start, startOut, { x: startOut.x, y: midY }, { x: endOut.x, y: midY }, endOut, end];
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

    function routeScore(points, obstacles) {
      const compacted = compactRoute(points);
      let score = routeLength(compacted) + Math.max(0, compacted.length - 2) * 18;
      for (let index = 0; index < compacted.length - 1; index += 1) {
        const segment = { a: compacted[index], b: compacted[index + 1] };
        obstacles.forEach(rect => {
          if (segmentIntersectsRect(segment, rect)) score += 12000;
        });
      }
      return score;
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
      return `
        <article class="block-card tip ${state.selectedBlockId === block.id ? "selected" : ""} ${state.selectedIds.includes(block.id) ? "multi" : ""} ${state.connectingFrom === block.id ? "connecting" : ""}" data-block-card="${block.id}" data-node-id="${block.id}" data-tip="${escapeAttr(blockContentsTip(block))}">
          <div class="row between">
            <strong>${block.id}</strong>
            <div class="row" style="gap:4px">
              <span class="pill accent">${escapeHtml(block.behavior)}</span>
              <button class="block-card-delete" data-delete-block="${escapeAttr(block.id)}" title="Delete this block">✕</button>
            </div>
          </div>
          <div class="block-text">${escapeHtml(block.text)}</div>
          <div>${block.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted small">No phenomena</span>`}</div>
          ${flowCounts ? `<div style="margin-top:6px"><span class="pill blue">${escapeHtml(flowCounts)}</span></div>` : ""}
          ${conditionCount ? `<div style="margin-top:6px"><span class="pill green">C:${conditionCount}</span></div>` : ""}
        </article>
      `;
    }

    function blockContentsTip(block) {
      ensureBlockFlowFields(block);
      const lines = [
        `${block.id} - ${block.behavior}`,
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

    function streamTipLines(streams) {
      const roleOrder = ["input", "output", "waste"];
      return roleOrder.flatMap(role => {
        const items = streams.filter(stream => stream.role === role);
        if (!items.length) return [];
        const header = streamRoles[role].title;
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
      const aggregates = aggregateGroupStreams(group);
      if (!aggregates.length) return "";
      return `
        <div class="group-mfa">
          <div class="label">Group MFA</div>
          ${aggregates.map(roleGroup => `
            <div class="group-mfa-role">
              <strong>${escapeHtml(streamRoles[roleGroup.role].title)}</strong>
              ${roleGroup.items.slice(0, 3).map(item => groupMfaItemHtml(item, group.id, false)).join("")}
              ${roleGroup.items.length > 3 ? `<span class="muted small">+${roleGroup.items.length - 3} more material groups</span>` : ""}
            </div>
          `).join("")}
        </div>
      `;
    }

    function groupMfaItemHtml(item, groupId, editable) {
      const total = item.totalText ? item.totalText : "not summed";
      const pillLabel = item.override ? `${escapeHtml(item.override.value)} ${escapeHtml(item.totalUnit || "")}`.trim() : escapeHtml(total);
      return `
        <div class="group-mfa-item">
          <div class="group-mfa-item-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="pill ${item.override ? "blue" : item.totalText ? "blue" : "warn"}">${pillLabel}</span>
          </div>
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
        "addition_time",
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
          return { ...aggregated, key, override: mfaOverrides[key] || null };
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

    function kgToUnit(value, unit) {
      if (!Number.isFinite(value)) return NaN;
      if (unit === "kg") return value;
      if (unit === "g") return value * 1000;
      if (unit === "t") return value / 1000;
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
        operatingDays: "250",
        hoursPerDay: "16",
        batchesPerDay: "1",
        batchDuration: "",
        oeePercent: "80",
        parallelUnits: "1",
        yieldPercent: "100",
        recoveryPercent: "100",
        designMarginPercent: "0",
        confidence: "rough"
      };
    }

    function ensureScaleBasis() {
      state.scaleBasis = { ...scaleBasisDefaults(), ...(state.scaleBasis || {}) };
      if (!["kg/batch", "kg/day", "t/year"].includes(state.scaleBasis.targetUnit)) state.scaleBasis.targetUnit = "kg/batch";
      if (!["kg", "g", "t"].includes(state.scaleBasis.basisUnit)) state.scaleBasis.basisUnit = "kg";
      if (!["batch", "semi-batch", "continuous"].includes(state.scaleBasis.mode)) state.scaleBasis.mode = "batch";
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
      if (basis.targetUnit === "t/year") {
        const effectiveBatches = effectiveBatchesPerYear(basis);
        if (Number.isFinite(effectiveBatches) && effectiveBatches > 0) return (target * 1000) / effectiveBatches;
        if (!Number.isFinite(batchesPerDay) || batchesPerDay <= 0 || !Number.isFinite(operatingDays) || operatingDays <= 0) return NaN;
        return (target * 1000) / (batchesPerDay * operatingDays);
      }
      return NaN;
    }

    function targetKgPerYear(basis) {
      const target = parseStreamQuantity(basis.targetAmount);
      const operatingDays = parseStreamQuantity(basis.operatingDays);
      const batchesPerDay = parseStreamQuantity(basis.batchesPerDay);
      const perBatch = targetKgPerBatch(basis);
      if (basis.targetUnit === "t/year" && Number.isFinite(target)) return target * 1000;
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

    function scheduleModel(basis) {
      const effectiveBatches = effectiveBatchesPerYear(basis);
      const targetBatch = targetKgPerBatch(basis);
      const targetYear = targetKgPerYear(basis);
      const duration = effectiveBatchDurationH(basis);
      const oee = percentFactor(basis.oeePercent, 100);
      const parallel = parseStreamQuantity(basis.parallelUnits);
      const scheduleMargin = Math.max(0, parseStreamQuantity(basis.scheduleMarginPercent) || 0);
      return {
        method: Number.isFinite(effectiveBatches) ? "duration_OEE_parallel_units" : "batches_per_day_days_per_year",
        effectiveBatchesPerYear: Number.isFinite(effectiveBatches) ? formatNumber(effectiveBatches) : "",
        effectiveKgPerBatch: Number.isFinite(targetBatch) ? formatNumber(targetBatch) : "",
        annualCapacityKg: Number.isFinite(targetYear) ? formatNumber(targetYear) : "",
        batchDurationH: Number.isFinite(duration) ? formatNumber(duration) : "",
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
      const maxEffective = timed.length ? Math.max(...timed.map(task => task.effectiveTimeH)) : NaN;
      const bottleneck = timed.find(task => Math.abs(task.effectiveTimeH - maxEffective) < 0.0001) || null;
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
        estimatedCycleTimeH,
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
        operationClass,
        operationProfile: profile,
        scaleSensitivity: sensitivity,
        scheduleMarginPercent: scheduleMargin,
        correctionMode: Number.isFinite(durationH) ? "warning-only" : "missing duration",
        missingScaleData,
        dependency: schedule.dependency || "previous",
        notes: schedule.notes || "",
        effectiveTimeH: Number.isFinite(adjustedDurationH) ? adjustedDurationH / parallel : NaN,
        phenomena: group.phenomena
      };
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
        need("heat-transfer device / utility", Boolean(conditionMap.thermal_mode || conditionMap.vapor_handling));
        missing.push("U/A if quantitative correction is needed");
      } else if (operationClass === "reaction_kinetic") {
        need("reaction time", Boolean(conditionMap.reaction_time || conditionMap.holding_time));
        need("conversion/yield", Boolean(conditionMap.conversion_yield || ensureScaleBasis().yieldPercent));
        if (group.phenomena.some(code => code.startsWith("M(") || code.startsWith("2phM("))) need("mixing adequacy", Boolean(conditionMap.mixing_mode || conditionMap.agitation_note));
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
      const targetBatchKg = targetKgPerBatch(basis);
      const productFactor = Number.isFinite(targetBatchKg) && Number.isFinite(basisKg) && basisKg > 0 ? targetBatchKg / basisKg : NaN;
      const yieldFactor = percentFactor(basis.yieldPercent, 100);
      const recoveryFactor = percentFactor(basis.recoveryPercent, 100);
      const marginFactor = 1 + Math.max(0, parseStreamQuantity(basis.designMarginPercent) || 0) / 100;
      const upstreamFactor = Number.isFinite(productFactor) ? productFactor * marginFactor / Math.max(0.0001, yieldFactor * recoveryFactor) : NaN;
      const blocks = blocksInOrder().map(block => {
        ensureBlockFlowFields(block);
        return {
          blockId: block.id,
          groupId: block.groupId,
          streams: block.streams.map(stream => scaledStream(stream, block, productFactor, upstreamFactor, targetBatchKg))
        };
      });
      const rows = blocks.flatMap(block => block.streams);
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
        schedule: scheduleModel(basis),
        factors: {
          productFactor: Number.isFinite(productFactor) ? formatNumber(productFactor) : "",
          upstreamFactor: Number.isFinite(upstreamFactor) ? formatNumber(upstreamFactor) : "",
          yieldFactor: formatNumber(yieldFactor),
          recoveryFactor: formatNumber(recoveryFactor),
          marginFactor: formatNumber(marginFactor)
        },
        blocks,
        rows,
        ready: Number.isFinite(productFactor)
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
        scalingStatus: resolved.status
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
        if (conditionMap.target_pressure || conditionMap.pressure_control || conditionMap.vapor_handling) {
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
          if (!conditions.mixing_mode) missing.push("mixing mode/geometry");
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
          if (!conditions.target_pressure && !conditions.pressure_control) missing.push("pressure/vacuum basis");
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
      const triggered = heuristicRuleLibrary
        .map(rule => heuristicRuleCard(rule, ctx))
        .filter(Boolean)
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

    function heuristicContext(scale) {
      const blocks = blocksInOrder().map(block => {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
        return block;
      });
      const groups = groupIdsInTextOrder().map(groupModel);
      const textParts = [
        state.text,
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
      const hasVacuum = /vacuum|reduced pressure|mbar|mmhg|1\.5/.test(allText) || groupConditions.some(item => item.id === "target_pressure" || item.id === "pressure_control");
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
      const pressure = conditionMap.target_pressure?.display || conditionMap.initial_pressure?.display || conditionMap.pressure_control?.display || "";
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
            <select data-scale-field="targetUnit">${optionHtml(["kg/batch", "kg/day", "t/year"], basis.targetUnit)}</select>
          </label>
        </div>
      `;
      root.innerHTML = `
        <div class="scale-section">
          <div class="scale-section-title">Reference basis</div>
          <div class="scale-grid">
            <label class="scale-wide">
              <div class="label">Reference output block</div>
              <select data-scale-field="referenceBlockId">${referenceOptions}</select>
            </label>
            <label>
              <div class="label">Manual basis amount</div>
              <input data-scale-field="basisAmount" value="${escapeAttr(basis.basisAmount)}" inputmode="decimal" placeholder="optional">
            </label>
            <label>
              <div class="label">Basis unit</div>
              <select data-scale-field="basisUnit">${optionHtml(["kg", "g", "t"], basis.basisUnit)}</select>
            </label>
          </div>
        </div>

        <div class="scale-section">
          <div class="scale-section-title">Operating schedule</div>
          <div class="scale-grid">
            <label>
              <div class="label">Mode</div>
              <select data-scale-field="mode">${optionHtml(["batch", "semi-batch", "continuous"], basis.mode)}</select>
            </label>
            <label>
              <div class="label">Batches/day</div>
              <input data-scale-field="batchesPerDay" value="${escapeAttr(basis.batchesPerDay)}" inputmode="decimal" placeholder="1">
            </label>
            <label>
              <div class="label">Days/year</div>
              <input data-scale-field="operatingDays" value="${escapeAttr(basis.operatingDays)}" inputmode="decimal" placeholder="250">
            </label>
            <label>
              <div class="label">Hours/day</div>
              <input data-scale-field="hoursPerDay" value="${escapeAttr(basis.hoursPerDay)}" inputmode="decimal" placeholder="16">
            </label>
            <label class="scale-wide">
              <div class="label">Batch duration, h</div>
              <input data-scale-field="batchDuration" value="${escapeAttr(basis.batchDuration)}" inputmode="decimal" placeholder="optional">
            </label>
            <label>
              <div class="label">Gantt margin, %</div>
              <input data-scale-field="scheduleMarginPercent" value="${escapeAttr(basis.scheduleMarginPercent)}" inputmode="decimal" placeholder="0">
            </label>
            <label>
              <div class="label">OEE, %</div>
              <input data-scale-field="oeePercent" value="${escapeAttr(basis.oeePercent)}" inputmode="decimal" placeholder="80">
            </label>
            <label>
              <div class="label">Parallel units</div>
              <input data-scale-field="parallelUnits" value="${escapeAttr(basis.parallelUnits)}" inputmode="decimal" placeholder="1">
            </label>
          </div>
        </div>

        <div class="scale-section">
          <div class="scale-section-title">Corrections</div>
          <div class="scale-grid">
            <label>
              <div class="label">Yield, %</div>
              <input data-scale-field="yieldPercent" value="${escapeAttr(basis.yieldPercent)}" inputmode="decimal" placeholder="100">
            </label>
            <label>
              <div class="label">Recovery, %</div>
              <input data-scale-field="recoveryPercent" value="${escapeAttr(basis.recoveryPercent)}" inputmode="decimal" placeholder="100">
            </label>
            <label>
              <div class="label">Design margin, %</div>
              <input data-scale-field="designMarginPercent" value="${escapeAttr(basis.designMarginPercent)}" inputmode="decimal" placeholder="0">
            </label>
            <label>
              <div class="label">Confidence</div>
              <select data-scale-field="confidence">${optionHtml(["rough", "estimated", "validated"], basis.confidence)}</select>
            </label>
          </div>
        </div>
        ${scaleResultsHtml(model)}
      `;
      [quickRoot, root].forEach(container => {
        container.querySelectorAll("[data-scale-field]").forEach(field => {
          field.addEventListener("input", updateScaleField);
          field.addEventListener("change", rerenderScaleAfterEdit);
        });
      });
      root.querySelectorAll("[data-scale-focus-group]").forEach(button => {
        button.addEventListener("click", () => focusGroupForEditing(button.dataset.scaleFocusGroup));
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
          if (preview) preview.textContent = bottleneckSplitPreviewText(baseDuration, n);
          const button = [...root.querySelectorAll("[data-split-bottleneck]")].find(el => el.dataset.splitBottleneck === groupId);
          if (button) button.dataset.splitCount = String(n);
        });
      });
      root.querySelectorAll("[data-split-bottleneck]").forEach(button => {
        button.addEventListener("click", () => {
          const groupId = button.dataset.splitBottleneck;
          const n = Number(button.dataset.splitCount);
          const warn = button.dataset.splitConfirmKinetics === "true"
            ? `${groupId} is kinetics-bound: splitting will NOT reduce the per-batch reaction time, only raise throughput. `
            : "";
          if (!confirm(`${warn}Split ${groupId} into ${n} parallel units? This creates ${n} new task groups (${groupId}-P1..P${n}), each with its own copy of every block in ${groupId} and 1/${n} of its material flow, wired in parallel between the same predecessor and successor. ${groupId} itself is removed. This can be undone.`)) return;
          splitGroupIntoParallelUnits(groupId, n);
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
    function scaleResultsHtml(model) {
      const reference = model.reference
        ? `${model.reference.blockId} / ${model.reference.streamName || model.reference.streamId}: ${model.reference.quantity} ${model.reference.unit}`
        : "No numeric output stream found yet.";
      const assessment = scaleUpAssessmentModel(model);
      const recycle = recycleSummary(model);
      const energy = energyBridgeModel(model);
      const gantt = taskScheduleModel();
      const metrics = [
        ["Reference", reference],
        ["Target kg/batch", model.target.kgPerBatch || "missing schedule/basis"],
        ["Target kg/h", model.target.kgPerHour || "missing operating hours"],
        ["Target kg/year", model.target.kgPerYear || "missing annual basis"],
        ["Batches/year", model.schedule.effectiveBatchesPerYear || `${model.basis.batchesPerDay || "?"} x ${model.basis.operatingDays || "?"}`],
        ["Schedule method", model.schedule.method],
        ["Product factor", model.factors.productFactor || "not available"],
        ["Upstream factor", model.factors.upstreamFactor || "not available"]
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
            <div class="scale-section-title">
              <span>Gantt / Bottleneck</span>
              <button data-load-schedule-example="octocrylene" title="Fill current groups with Octocrylene-like test durations">Example</button>
            </div>
            ${gantt.ready ? ganttPanelHtml(gantt) : `<div class="mfa-empty">Add durations in group conditions or directly in the Gantt rows to estimate cycle time and bottlenecks.</div>`}
          </div>

          <div class="scale-metric">
            <span class="label">Scaled MFA preview</span>
            ${rowGroups.length ? rowGroups.map(group => `
              <div class="scale-section">
                <div class="scale-section-title">${escapeHtml(streamRoles[group.role].title)}</div>
                ${group.rows.slice(0, 3).map(row => scaledFlowRowHtml(row)).join("")}
                ${group.rows.length > 3 ? `<span class="muted small">+${group.rows.length - 3} more streams in export</span>` : ""}
              </div>
            `).join("") : `<div class="mfa-empty">Add stream quantities to preview scaled MFA.</div>`}
          </div>

          <div class="scale-metric">
            <span class="label">Scale-up assessment</span>
            ${assessment.length ? assessment.slice(0, 8).map(scaleAssessmentCardHtml).join("") : `<div class="mfa-empty">Add grouped phenomena, streams, and conditions to generate scale-up risk cards.</div>`}
            ${assessment.length > 8 ? `<span class="muted small">+${assessment.length - 8} more assessment cards in export</span>` : ""}
          </div>

          <div class="scale-metric">
            <span class="label">Recycle / fate summary</span>
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
          </div>
          <div class="scale-metric">
            <span class="label">Energy bridge candidates</span>
            ${energy.length ? energyBridgeGroupsHtml(energy) : `<div class="mfa-empty">Assign thermal, mixing, pressure, or phase-change phenomena to generate energy bridge events.</div>`}
          </div>
        </div>
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
            <div class="mfa-empty" style="margin-bottom:8px">
              Pre-scale screening. Only rules triggered by the current synthesis are shown here; the full ${heuristics.totalRules}-rule library remains in the JSON export.
            </div>
            <div class="scaled-flow-row">
              <strong>${heuristics.triggered.length} triggered / ${heuristics.totalRules} available</strong>
              <span>Rules are matched from phenomena, phases, stream fates, conditions, properties, and source text.</span>
            </div>
            <div class="scaled-flow-row">
              <strong>Application criterion</strong>
              <span>A rule appears when the match is specific enough: usually at least two rule tags, or one strong specific tag such as vacuum, recycle, purge, exotherm, crystallization, membrane, hazard, or heat sensitivity.</span>
              <span class="muted small">Generic single tags such as vapor, liquid, utility, pressure, or heat exchange are not enough by themselves. Context tags come from group phenomena, Lutze phases, stream fate, conditions, properties, selected unit alternatives, and keywords.</span>
            </div>
            <div class="heuristic-actions">
              <button data-toggle-heuristic-library="true">${state.showAllHeuristicRules ? "Hide full library" : `Show all ${heuristics.totalRules} rules`}</button>
              <button data-open-refine-modal="true" class="primary">Open Process Rule Check</button>
            </div>
          </div>
          <div class="scale-metric">
            <span class="label">Process Rule Check</span>
            ${refine ? aiRefinePanelHtml(refine) : `<div class="mfa-empty">Rules have not been applied to the process yet. This uses the local checker; external AI is optional.</div>`}
          </div>
          <div class="scale-metric">
            <span class="label">Triggered Rule Cards</span>
            ${heuristics.triggered.length ? heuristics.triggered.slice(0, 12).map(heuristicCardHtml).join("") : `<div class="mfa-empty">Add grouped phenomena, streams, phases, and conditions to activate heuristic rules.</div>`}
            ${heuristics.triggered.length > 12 ? `<span class="muted small">+${heuristics.triggered.length - 12} more heuristic cards in export</span>` : ""}
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
      renderRuleCheckPanel();
      const clone = $("heuristicRuleCheckPanel");
      if (!clone) return;
      const issues = state.ruleChecks || [];
      clone.innerHTML = issues.length
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
      return `
        <div class="mfa-empty" style="margin-bottom:8px">
          Bottleneck = the task with the largest adjusted effective time. Adjusted time = input duration plus Gantt margin, divided by parallel units. The cycle time sums tasks that cannot overlap.
        </div>
        <div class="gantt-summary">
          <div class="scale-mini-metric">
            <span class="label">Cycle time</span>
            <strong>${Number.isFinite(gantt.estimatedCycleTimeH) ? `${formatNumber(gantt.estimatedCycleTimeH)} h` : "missing"}</strong>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Batches/year</span>
            <strong>${Number.isFinite(gantt.batchesPerYear) ? formatNumber(gantt.batchesPerYear) : "missing"}</strong>
          </div>
          <div class="scale-mini-metric">
            <span class="label">Bottleneck</span>
            <strong>${gantt.bottleneck ? escapeHtml(gantt.bottleneck.groupId) : "missing"}</strong>
          </div>
        </div>
        ${gantt.bottleneck ? bottleneckActionHtml(gantt.bottleneck) : ""}
        <div class="scale-results">
          ${gantt.tasks.map(ganttRowHtml).join("")}
        </div>
      `;
    }

    function bottleneckSplitPreviewText(baseDuration, n) {
      if (!Number.isFinite(baseDuration) || baseDuration <= 0 || !Number.isFinite(n) || n < 2) return "";
      return `Each of the ${n} parallel units would run about ${formatNumber(baseDuration / n)} h (currently ${formatNumber(baseDuration)} h as one unit).`;
    }

    function bottleneckActionHtml(task) {
      const effective = Number.isFinite(task.effectiveTimeH) ? `${formatNumber(task.effectiveTimeH)} h` : "missing";
      const split = Number.isFinite(task.durationH) && task.durationH > 0
        ? `${formatNumber(task.adjustedDurationH || task.durationH)} h adjusted / ${formatNumber(task.parallelUnits)} unit${task.parallelUnits === 1 ? "" : "s"} = ${effective}`
        : effective;
      const baseDuration = Number.isFinite(task.adjustedDurationH) && task.adjustedDurationH > 0 ? task.adjustedDurationH : NaN;
      const baseParallel = Number.isFinite(task.parallelUnits) && task.parallelUnits > 0 ? task.parallelUnits : 1;
      const defaultN = Math.max(2, Math.ceil(baseParallel + 1));
      const recommendation = task.scaleSensitivity === "kinetics-bound"
        ? "Use parallel reactors or process intensification; larger equipment alone may not reduce this time."
        : task.scaleSensitivity === "increases with scale" || task.scaleSensitivity === "equipment dependent"
          ? "Check equipment capacity, then test more parallel units or split the grouped task."
          : "Test one more parallel unit, or mark overlap only if the operation can physically run in parallel with the previous one.";
      const isKineticsBound = task.scaleSensitivity === "kinetics-bound";
      const canSplit = Number.isFinite(baseDuration);
      const pickerHtml = canSplit ? `
        <div class="bottleneck-split-picker">
          <label class="split-n-label">
            Split into
            <input type="number" min="2" max="20" step="1" value="${defaultN}" data-split-n="${escapeAttr(task.groupId)}" data-split-base-duration="${baseDuration}">
            parallel units
          </label>
          <span class="muted small" data-split-preview="${escapeAttr(task.groupId)}">${escapeHtml(bottleneckSplitPreviewText(baseDuration, defaultN))}</span>
        </div>
      ` : "";
      const splitButton = canSplit ? (
        isKineticsBound ? `
          <div class="bottleneck-split-warning">
            <span class="muted small">This stage is kinetics-bound: splitting it into parallel units does not shorten the per-batch reaction time (kinetics depend on time, not equipment size) — it only raises throughput. Do not use this to relieve the cycle-time bottleneck; see the paper's octocrylene case, where the kinetics-bound reactor "cannot be relieved by parallelization".</span>
            ${pickerHtml}
            <button data-split-bottleneck="${escapeAttr(task.groupId)}" data-split-count="${defaultN}" data-split-confirm-kinetics="true" class="mini-button">Split anyway (for throughput, not cycle time)</button>
          </div>
        ` : `
          <div class="bottleneck-split-controls">
            ${pickerHtml}
            <button data-split-bottleneck="${escapeAttr(task.groupId)}" data-split-count="${defaultN}" class="primary">Split ${escapeHtml(task.groupId)}</button>
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
      return `
        <div class="gantt-row ${task.isBottleneck ? "bottleneck" : ""}">
          <div class="gantt-task-meta">
            <strong>${escapeHtml(task.groupId)} - ${escapeHtml(task.task)}</strong>
            <span>${escapeHtml(task.blocks.join(", "))}${task.selectedUnit ? ` / ${escapeHtml(task.selectedUnit)}` : ""}</span>
            <span class="muted small">${escapeHtml(duration)}${escapeHtml(adjusted)}; ${escapeHtml(effective)}; source: ${escapeHtml(task.durationSource)}</span>
            ${task.isBottleneck ? `<span class="pill warn">bottleneck</span>` : ""}
          </div>
          <div>
            <div class="gantt-bar-track" title="${escapeAttr(effective)}">
              <div class="gantt-bar" style="width:${task.widthPercent}%"></div>
            </div>
            <div class="gantt-controls">
              <input data-schedule-field="durationH" data-schedule-group="${escapeAttr(task.groupId)}" value="${escapeAttr(task.durationInput)}" placeholder="${Number.isFinite(task.durationH) ? formatNumber(task.durationH) : "h"}" title="Task duration in hours">
              <input data-schedule-field="parallelUnits" data-schedule-group="${escapeAttr(task.groupId)}" value="${escapeAttr(task.parallelUnits)}" placeholder="1" title="Parallel units">
              <select data-schedule-field="operationClass" data-schedule-group="${escapeAttr(task.groupId)}" title="Operation class used for scale-behaviour evidence">${scheduleOperationClassOptionHtml(ensureGroup(task.groupId).schedule.operationClass || "auto")}</select>
              <select data-schedule-field="canOverlap" data-schedule-group="${escapeAttr(task.groupId)}" title="Can this task overlap the previous task?">${optionHtml(scheduleOverlapOptions, task.canOverlap)}</select>
            </div>
            <div class="gantt-evidence">
              <div class="gantt-evidence-head">
                <strong>${escapeHtml(profile.label)}</strong>
                <span class="pill ${profile.badge === "high" || profile.badge === "medium-high" ? "warn" : profile.badge === "low" ? "green" : "blue"}">${escapeHtml(profile.badge)} sensitivity</span>
                <span class="pill">${escapeHtml(task.correctionMode)}</span>
              </div>
              <span>${escapeHtml(profile.behavior)}</span>
              <span class="muted small">${escapeHtml(profile.defaultAction)}</span>
              <span class="muted small">For calculation/check: ${missing.length ? escapeHtml(missing.join(", ")) : "minimum evidence present for this screening level"}.</span>
              <span class="muted small">Refs: ${escapeHtml(profile.refs)}.</span>
            </div>
          </div>
        </div>
      `;
    }

    function heuristicCardHtml(item) {
      const decision = state.heuristicDecisions?.[item.id] || {};
      const chosen = decision.decision || "";
      const decisionButton = (value, label) => `
        <button class="mini-button heuristic-decision-button ${chosen === value ? "chosen" : ""}" data-heuristic-decision="${escapeAttr(value)}" data-heuristic-rule="${escapeAttr(item.id)}">${label}</button>
      `;
      return `
        <div class="rule-card ${escapeAttr(item.severity)} ${chosen ? `decided-${escapeAttr(chosen)}` : ""}">
          <span class="severity-pill">${escapeHtml(item.severity)}</span>
          <strong>${escapeHtml(`${item.id} - ${item.title}`)}</strong>
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
        </div>
      `;
    }

    function energyBridgeRowHtml(item) {
      const mass = item.massBasis.value ? `${item.massBasis.value} ${item.massBasis.unit}` : "mass missing";
      const cpHint = item.missing.includes("Cp")
        ? `<span class="muted small">Cp goes in Inspector > Properties Refinement > Heat capacity Cp.</span>`
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
      }
      renderScaleBasisPanel();
      renderHeuristicsPanel();
      refreshReviewPanels();
      renderExport();
    }

    function invalidateAiRefine() {
      state.aiRefine = null;
    }

    function applyScheduleExample() {
      const groups = groupIdsInTextOrder().map(groupModel);
      const fallback = [
        { durationH: "0.5", operationClass: "pumping_transfer", scaleSensitivity: "roughly constant", notes: "charge/pre-mix" },
        { durationH: "20", operationClass: "reaction_kinetic", scaleSensitivity: "kinetics-bound", notes: "Knoevenagel reflux/decanter, primary bottleneck" },
        { durationH: "2.5", operationClass: "pumping_transfer", scaleSensitivity: "roughly constant", notes: "aqueous/brine wash" },
        { durationH: "1", operationClass: "drying", scaleSensitivity: "increases with scale", notes: "drying/contact step" },
        { durationH: "4", operationClass: "heating_cooling", scaleSensitivity: "equipment dependent", notes: "solvent removal or final distillation" }
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
          operationClass: preset.operationClass,
          scaleSensitivity: preset.scaleSensitivity,
          notes: preset.notes
        };
      });
      ensureScaleBasis();
      state.scaleBasis.targetAmount = "750";
      state.scaleBasis.targetUnit = "t/year";
      state.scaleBasis.oeePercent = "80";
      state.scaleBasis.scheduleMarginPercent = "0";
      state.scaleBasis.batchDuration = "";
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

    function processActionTableHtml(conflicts) {
      if (!conflicts.length) return "";
      const rows = conflicts.slice(0, 14).map(processActionRowModel);
      return `
        <div class="process-action-table-wrap">
          <div class="process-action-head">
            <strong>Action Table</strong>
            <span class="muted small">${rows.length} priority point${rows.length === 1 ? "" : "s"} to analyze in the process.</span>
          </div>
          <div class="muted small">Built deterministically from local rule checks, heuristic triggers, grouped MFA, phases, conditions, links, scale-up basis, and Gantt data. It is a triage table, not an automatic process edit.</div>
          <table class="process-action-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Point To Analyze</th>
                <th>Process Area</th>
                <th>Rule / Doubt</th>
                <th>Act On</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td><span class="severity-pill">${escapeHtml(row.priority)}</span></td>
                  <td><strong>${escapeHtml(row.point)}</strong><span>${escapeHtml(row.evidence)}</span></td>
                  <td>${escapeHtml(row.area)}</td>
                  <td>${escapeHtml(row.rule)}</td>
                  <td>${escapeHtml(row.action)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${conflicts.length > rows.length ? `<div class="muted small">+${conflicts.length - rows.length} more lower-priority points in the cards below.</div>` : ""}
        </div>
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
      renderExport();
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

    function renderRuleCheckPanel() {
      const root = $("ruleCheckPanel");
      const issues = state.ruleChecks || [];
      if (!issues.length) {
        root.innerHTML = `<div class="mfa-empty">Run Check to generate scale-up and heuristic review cards.</div>`;
        return;
      }
      root.innerHTML = ruleCheckCardsHtml(issues);
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
      if (model.basis.mode !== "continuous" && !Number.isFinite(parseStreamQuantity(model.basis.batchesPerDay))) {
        issues.push(ruleIssue("medium", "Batch schedule missing", "Batch scale-up requires batches per day to convert between batch, daily, and annual bases.", "scale-up basis", "Enter batches/day."));
      }
      if (model.basis.targetUnit === "t/year" && model.schedule.method !== "duration_OEE_parallel_units" && !gantt.ready) {
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
        if (propertyPrompts.length && matchesForGroup(group).length > 1 && !propertyValues.length) {
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
        if (group.selectedUnit && !matchesForGroup(group).some(candidate => candidate.name === group.selectedUnit)) {
          issues.push(ruleIssue("medium", "Selected unit no longer compatible", "The selected industrial alternative does not match the current grouped phenomena, phases, or task logic.", group.id, "Re-select a unit alternative after checking the grouped phases and phenomena.", "phases"));
        }
        if (separationPredictorApplies(group)) {
          const predictor = propertySeparationPredictorModel(group);
          const selectedDecision = predictor.rows.find(row => row.name === group.selectedUnit);
          if (predictor.mode === "minimal" && selectedDecision?.decision === "reject") {
            issues.push(ruleIssue("medium", "Selected separation rejected by property screen", `${group.selectedUnit} is marked reject: ${selectedDecision.reason}`, group.id, `Review missing data (${selectedDecision.missing.join(", ") || "none"}) or override the decision with a written selection basis.`, "phases"));
          } else if (predictor.mode === "skip" && matchesForGroup(group).filter(candidate => candidate.task === "separation" || candidate.task.includes("separation")).length > 1) {
            issues.push(ruleIssue("low", "Property predictor skipped", "Multiple separation alternatives fit the grouped phenomena, but no property-based keep/weak/reject screen has been applied.", group.id, "Use Minimal predictor if you need a defendable selected/rejected alternatives table.", "phases"));
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
        ? `<strong>${block.id}</strong> <span class="pill">${escapeHtml(block.groupId || "ungrouped")}</span>`
        : "No block selected.";
      $("behaviorSelect").value = block?.behavior || "unassigned";
      $("blockText").value = block?.text || "";
      renderPhenomenaGrid(block);

      const group = selectedGroup();
      $("groupTask").disabled = !group;
      const groupConditions = group ? aggregateGroupConditions(group) : [];
      const groupMfa = group ? aggregateGroupStreams(group) : [];
      const conditionStatus = groupConditions.length
        ? groupConditions.map(item => item.status).includes("sequence_or_conflict")
          ? `<span class="pill warn">conditions kept separate</span>`
          : `<span class="pill green">conditions aggregated</span>`
        : `<span class="muted small">No group conditions yet.</span>`;
      $("selectedGroupInfo").innerHTML = group
        ? `<strong>${escapeHtml(group.id)}</strong><div style="margin-top:6px">Blocks: ${group.blocks.map(item => `<span class="pill">${item.id}</span>`).join("")}</div><div style="margin-top:6px">${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted">No phenomena.</span>`}</div><div style="margin-top:6px">${conditionStatus} ${groupConditions.length ? `<span class="pill">${groupConditions.length} condition${groupConditions.length === 1 ? "" : "s"}</span>` : ""} ${groupMfa.length ? `<span class="pill blue">${groupMfa.reduce((sum, role) => sum + role.items.length, 0)} MFA group${groupMfa.reduce((sum, role) => sum + role.items.length, 0) === 1 ? "" : "s"}</span>` : ""}</div><div class="muted small" style="margin-top:6px">Click Inspect Group on the board for the full MFA and conditions detail.</div>`
        : "This block is not assigned to a task group yet.";
      $("groupTask").value = group?.task || "";
      renderGroupAlternatives(group);
      renderGroupProperties(group);
      renderHeuristicsPanel();
      renderScaleBasisPanel();
      refreshReviewPanels();
      renderExport();
    }


    function renderGroupProperties(group) {
      const root = $("groupProperties");
      if (!group) {
        root.innerHTML = `<span class="muted">No group selected.</span>`;
        return;
      }
      const prompts = propertyPromptsForGroup(group);
      const groupState = ensureGroup(group.id);
      const predictorHtml = propertyPredictorPanelHtml(group);
      if (!prompts.length && !predictorHtml) {
        root.innerHTML = `<span class="muted">No property refinement needed for the current phenomena at framework level.</span>`;
        return;
      }
      if (groupState.propertiesEditing) {
        const promptGroups = propertyPromptGroups(prompts);
        root.innerHTML = `
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
      } else {
        const values = propertyValuesForGroup(group);
        const neededCount = prompts.filter(prompt => propertyNeedLevel(prompt, group) !== "optional").length;
        root.innerHTML = `
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
      bindPropertyPredictorControls(root, group.id);
      root.querySelectorAll("[data-edit-properties]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.editProperties).propertiesEditing = true;
          renderInspector();
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
        : "skipped";
      const applies = groupSeparationFamilies(group);
      const familyLabel = applies.size ? Array.from(applies).map(item => item.toUpperCase()).join(", ") : "from alternatives";
      return `
        <section class="predictor-card">
          <div class="predictor-head">
            <div>
              <div class="label">Separation Property Screen</div>
              <div class="muted small">Checks only the alternatives that depend on phase split, volatility, solids, affinity, or an added separating agent.</div>
            </div>
            <span class="pill ${model.mode === "minimal" ? "blue" : ""}">${escapeHtml(stateLabel)}</span>
          </div>
          <div class="predictor-summary-grid">
            <span><strong>Scope</strong>${escapeHtml(familyLabel)}</span>
            <span><strong>Open data</strong>${model.unresolved}</span>
            <span><strong>Mode</strong>${model.mode === "minimal" ? "screening" : "not screened"}</span>
          </div>
          <div class="predictor-controls">
            <label>
              <span class="label">Mode</span>
              <select data-predictor-mode="${escapeAttr(group.id)}">
                <option value="skip" ${model.mode === "skip" ? "selected" : ""}>Skip</option>
                <option value="minimal" ${model.mode === "minimal" ? "selected" : ""}>Minimal</option>
              </select>
            </label>
            <button data-toggle-predictor="${escapeAttr(group.id)}">${model.expanded ? "Hide table" : "Show table"}</button>
          </div>
          ${model.expanded ? propertyPredictorTableHtml(group, model) : `
            <div class="predictor-help">${model.mode === "skip"
              ? "Alternatives still come from phenomena and phase compatibility. Switch to Minimal when you want a keep/weak/reject rationale."
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
          predictor.expanded = select.value === "minimal" ? true : predictor.expanded;
          invalidateAiRefine();
          renderAll();
        });
      });
      root.querySelectorAll("[data-toggle-predictor]").forEach(button => {
        button.addEventListener("click", () => {
          const predictor = ensureGroup(button.dataset.togglePredictor).propertyPredictor;
          predictor.expanded = !predictor.expanded;
          renderInspector();
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

    function separationPredictorApplies(group) {
      const phen = new Set(group.phenomena || []);
      if ([...phen].some(code => code.startsWith("PS(") || code.startsWith("PT(") || code.startsWith("PC(") || code.startsWith("PCh("))) return true;
      return matchesForGroup(group).some(candidate => candidate.task === "separation" || candidate.task.includes("separation"));
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
        : {
            decision: group.selectedUnit === candidate.name ? "selected" : "weak",
            confidence: "not screened",
            reason: "Property predictor skipped; candidate comes from phenomena, task, and phase compatibility.",
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
          || Boolean(conditions.target_pressure || conditions.pressure_control || conditions.vapor_handling)
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
        return Boolean(conditions.target_pressure || conditions.pressure_control || conditions.vapor_handling)
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
      const options = availablePhenomenaForBlock(block);
      const phaseContext = block ? blockPhaseContext(block) : null;
      const phaseHint = block && !phaseContext.hasKnown
        ? `<div class="muted small" style="margin-bottom:6px">Add stream phases to filter Lutze-compatible phenomena.</div>`
        : "";
      $("phenomenaGrid").innerHTML = phaseHint + options.map(phen => {
        const active = block?.phenomena.includes(phen);
        return phenomenonOptionButton(phen, active, !block);
      }).join("");
      document.querySelectorAll("[data-phen]").forEach(button => {
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
        root.innerHTML = "Select a block to edit quantified MFA, or click Inspect Group on a group to see summed MFA, conditions, and unit alternatives.";
        return;
      }
      ensureBlockFlowFields(block);
      ensureBlockConditionFields(block);
      const counts = streamCounts(block);
      root.className = "step-flow-inspector";
      root.innerHTML = `
        <div class="step-flow-head">
          <div>
            <div class="label">Step MFA Inspector</div>
            <strong>${escapeHtml(block.id)}</strong>
            <span class="pill">${escapeHtml(block.behavior)}</span>
          </div>
          <div class="mfa-summary-strip">
            <span class="pill blue">I:${counts.input}</span>
            <span class="pill">O:${counts.output}</span>
            <span class="pill warn">W:${counts.waste}</span>
            <span>material balance basis: per selected block</span>
          </div>
        </div>
        <div class="mfa-grid">
          ${Object.keys(streamRoles).map(role => streamSectionHtml(block, role)).join("")}
        </div>
        ${conditionPanelHtml(block)}
      `;
      root.querySelectorAll("[data-add-stream]").forEach(button => {
        button.addEventListener("click", () => {
          const current = selectedBlock();
          if (!current) return;
          ensureBlockFlowFields(current);
          pushUndo();
          const stream = createStream(button.dataset.addStream, { editing: true });
          stream.id = nextStreamId(current);
          current.streams.push(stream);
          syncLegacyStreamLists(current);
          renderAll();
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
        button.addEventListener("click", () => {
          const current = selectedBlock();
          if (!current) return;
          const stream = current.streams.find(item => item.id === button.dataset.saveStream);
          if (!stream) return;
          if (!stream.phase || stream.phase === "unknown") {
            alert("Select the Lutze phase category before saving this stream.");
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
        section.addEventListener("click", () => {
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
    }

    function renderGroupAggregateStepInspector(root, group) {
      const mfa = aggregateGroupStreams(group);
      const conditions = aggregateGroupConditions(group);
      const alternatives = matchesForGroup(group).slice(0, 4);
      const mfaCount = mfa.reduce((sum, roleGroup) => sum + roleGroup.items.length, 0);
      root.className = "step-flow-inspector";
      root.innerHTML = `
        <div class="step-flow-head">
          <div>
            <div class="label">Group Aggregate Inspector</div>
            <strong>${escapeHtml(group.id)}</strong>
            <span class="pill blue">${escapeHtml(group.task)}</span>
          </div>
          <div class="mfa-summary-strip">
            <span class="pill">${group.blocks.length} blocks</span>
            <span class="pill green">${group.phenomena.length} phenomena</span>
            <span class="pill blue">${mfaCount} MFA groups</span>
            <span class="pill warn">${conditions.length} conditions</span>
          </div>
        </div>
        <div class="condition-panel">
          <div class="condition-head">
            <strong>Summed Phenomena</strong>
            <span class="muted small">union of all block phenomena in this task group</span>
          </div>
          <div class="condition-body">
            <div>${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted">No phenomena assigned.</span>`}</div>
          </div>
        </div>
        <div class="mfa-grid">
          ${mfa.length ? mfa.map(roleGroup => `
            <section class="mfa-section">
              <div class="mfa-section-head">
                <strong>${escapeHtml(streamRoles[roleGroup.role].title)}</strong>
                <span class="pill">${roleGroup.items.length}</span>
              </div>
              <div class="mfa-rows">
                ${roleGroup.items.map(item => groupMfaItemHtml(item, group.id, true)).join("")}
              </div>
            </section>
          `).join("") : `<div class="mfa-empty">No quantified group streams yet.</div>`}
        </div>
        <div class="condition-panel">
          <div class="condition-head">
            <strong>Group Condition Profile</strong>
            <span class="muted small">composite group values, editable like a block-level condition set</span>
          </div>
          <div class="condition-body">
            ${groupConditionProfileHtml(group, conditions)}
          </div>
        </div>
        <div class="condition-panel">
          <div class="condition-head">
            <strong>Task Alternatives</strong>
            <span class="muted small">filtered by grouped phenomena and phases</span>
          </div>
          <div class="condition-body">
            <div class="alt-grid">
              ${alternatives.length ? alternatives.map(candidate => `
                <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-unit="${escapeAttr(candidate.name)}" data-unit-group="${escapeAttr(group.id)}" data-tip="${escapeAttr(alternativeReason(candidate))}">
                  ${escapeHtml(candidate.name)}
                </button>
              `).join("") : `<span class="muted">No alternatives for current group data.</span>`}
            </div>
            ${group.selectedUnit && alternatives.length > 1 ? `
              <div class="selection-basis-row">
                <div class="label">Selection basis — why ${escapeHtml(group.selectedUnit)}?</div>
                <input data-selection-basis="${escapeAttr(group.id)}" value="${escapeAttr(group.selectionBasis || "")}"
                  placeholder="deciding rule, e.g. thin-film for heat sensitivity (H33)">
              </div>
            ` : ""}
            ${propertyPredictorPanelHtml(group)}
          </div>
        </div>
      `;
      root.querySelectorAll("[data-unit]").forEach(button => {
        button.addEventListener("click", () => {
          ensureGroup(button.dataset.unitGroup).selectedUnit = button.dataset.unit;
          renderAll();
        });
      });
      root.querySelectorAll("[data-selection-basis]").forEach(input => {
        input.addEventListener("change", () => {
          ensureGroup(input.dataset.selectionBasis).selectionBasis = input.value.trim();
          renderExport();
        });
      });
      bindPropertyPredictorControls(root, group.id);
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
                      ${saved.items.map(item => `<span class="condition-chip"><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(formatConditionValue(item))}</span>`).join("")}
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </section>
      `;
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
        "thermal_endpoint",
        "initial_pressure",
        "target_pressure",
        "pressure_control",
        "vapor_handling",
        "mixing_mode",
        "mixing_time",
        "agitation_speed",
        "mixing_intensity",
        "addition_mode",
        "addition_time",
        "contact_time",
        "contact_device",
        "reaction_time",
        "conversion_yield",
        "reaction_endpoint",
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
      if (["mixing_mode", "mixing_time", "agitation_speed", "mixing_intensity", "addition_mode", "addition_time"].includes(prompt.id)) {
        return { id: "mixing", title: "Mixing / Addition" };
      }
      if (["initial_temperature", "target_temperature", "holding_time", "holding_temperature", "thermal_ramp", "thermal_mode", "thermal_endpoint"].includes(prompt.id)) {
        return { id: "thermal", title: "Thermal / Holding" };
      }
      if (["initial_pressure", "target_pressure", "pressure_control", "vapor_handling"].includes(prompt.id)) {
        return { id: "pressure", title: "Pressure / Vapor Handling" };
      }
      if (["reaction_time", "conversion_yield", "reaction_endpoint"].includes(prompt.id)) {
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

    function conditionPromptFamilyHtml(block, group) {
      return `
        <div class="condition-family">
          <div class="condition-family-head">
            <span>${escapeHtml(group.title)}</span>
            <span class="pill">${group.items.length}</span>
          </div>
          <div class="condition-grid">
            ${group.items.map(prompt => conditionEditCardHtml(block, prompt)).join("")}
          </div>
        </div>
      `;
    }

    function conditionValueFamilyHtml(group) {
      return `
        <div class="condition-family">
          <div class="condition-family-head">
            <span>${escapeHtml(group.title)}</span>
            <span class="pill">${group.items.length}</span>
          </div>
          <div class="condition-grid">
            ${group.items.map(item => conditionLabelHtml(item)).join("")}
          </div>
        </div>
      `;
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
      const meta = streamRoles[role];
      const streams = block.streams.filter(stream => stream.role === role);
      return `
        <section class="mfa-section">
          <div class="mfa-section-head">
            <strong>${escapeHtml(meta.title)}</strong>
            <button data-add-stream="${role}" title="Add ${escapeAttr(meta.title)} stream">${escapeHtml(meta.addLabel)}</button>
          </div>
          <div class="mfa-rows">
            ${streams.length ? streams.map(stream => streamRowHtml(stream, meta.placeholder)).join("") : `<div class="mfa-empty">${escapeHtml(meta.empty)}</div>`}
          </div>
        </section>
      `;
    }

    function streamRowHtml(stream, placeholder) {
      if (!stream.editing) return streamLabelHtml(stream);
      const sid = escapeAttr(stream.id);
      const hasAdvanced = Boolean(stream.recoveryPercent || stream.purgePercent || stream.loopId || stream.destinationGroup || stream.makeupRequired || stream.accumulationRisk);
      return `
        <div class="mfa-row" data-stream-id="${sid}">
          <label class="stream-field span-2">
            <span class="stream-field-label">Material / stream</span>
            <input data-stream-field="name" data-stream-id="${sid}" value="${escapeAttr(stream.name)}" placeholder="${escapeAttr(placeholder)}">
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Amount</span>
            <input data-stream-field="quantity" data-stream-id="${sid}" value="${escapeAttr(stream.quantity)}" placeholder="amount" inputmode="decimal">
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Unit</span>
            <select data-stream-field="unit" data-stream-id="${sid}">${optionHtml(streamUnits, stream.unit)}</select>
          </label>
          <label class="stream-field">
            <span class="stream-field-label">Phase</span>
            <select data-stream-field="phase" data-stream-id="${sid}">${phaseOptionHtml(stream.phase)}</select>
          </label>
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
              <label class="stream-field">
                <span class="stream-field-label">Fate</span>
                <select data-stream-field="fate" data-stream-id="${sid}">${optionHtml(streamFateOptions, stream.fate)}</select>
              </label>
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
          <div class="mfa-edit-actions span-2">
            <button class="delete-stream" data-remove-stream="${sid}" title="Remove stream">Delete</button>
            <button class="primary" data-save-stream="${sid}">Save</button>
          </div>
        </div>
      `;
    }

    function streamLabelHtml(stream) {
      const title = stream.name.trim() || "Untitled stream";
      const amount = [stream.quantity, stream.unit].filter(Boolean).join(" ") || "quantity missing";
      return `
        <article class="mfa-label-card" data-stream-label="${escapeAttr(stream.id)}" title="Right-click to edit this stream">
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
          ${stream.note.trim() ? `<div class="mfa-label-note">${escapeHtml(stream.note)}</div>` : ""}
        </article>
      `;
    }

    function optionHtml(values, selected) {
      return values.map(value => `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
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
      if (event.target.dataset.streamField === "unit" && ["kg/kg product", "L/kg product"].includes(stream.unit) && stream.scalingMode === "auto") {
        stream.scalingMode = "per kg product";
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
      if (!group) {
        $("groupAlternatives").innerHTML = `<span class="muted">No group selected.</span>`;
        return;
      }
      const candidates = matchesForGroup(group).slice(0, 6);
      const basisNote = group.selectedUnit && candidates.length > 1 ? `
        <div class="muted small" style="margin-top:6px">
          ${group.selectionBasis
            ? `Selection basis: "${escapeHtml(group.selectionBasis)}"`
            : `Multiple candidates fit — click Inspect Group above to record why ${escapeHtml(group.selectedUnit)} was chosen.`}
        </div>
      ` : "";
      $("groupAlternatives").innerHTML = (candidates.length ? candidates.map(candidate => `
        <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-inspector-unit="${escapeAttr(candidate.name)}" data-tip="${escapeAttr(alternativeReason(candidate))}">
          ${escapeHtml(candidate.name)}
          <span class="pill ${candidate.sameTask ? "blue" : "warn"}">${candidate.sameTask ? "same task" : "related"}</span>
        </button>
      `).join("") : `<span class="muted">Assign phenomena to get alternatives.</span>`) + basisNote;
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

    function deleteBlock(blockId) {
      const block = state.blocks.find(item => item.id === blockId);
      if (!block) return;
      if (!confirm(`Are you sure you want to delete block ${blockId}? Its streams, phenomena, and conditions will be removed too.`)) return;
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

    function mergeSelectedBlocks() {
      const ids = state.selectedIds.filter(id => state.blocks.some(block => block.id === id));
      const blocks = blocksInOrder().filter(block => ids.includes(block.id));
      if (blocks.length < 2) {
        alert("Shift-click at least two blocks, then merge.");
        return;
      }
      const lo = Math.min(...blocks.map(block => block.start));
      const hi = Math.max(...blocks.map(block => block.end));
      if (state.blocks.some(block => !ids.includes(block.id) && rangesOverlap(lo, hi, block.start, block.end))) {
        alert("Cannot merge: another block lies between the selected blocks. Merge only adjacent blocks.");
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
      const warning = $("splitGroupWarning");
      if (entry.scaleSensitivity === "kinetics-bound") {
        warning.hidden = false;
        warning.textContent = `${groupId} is kinetics-bound: splitting will NOT reduce the per-batch reaction time (kinetics depend on time, not equipment size) — it only raises throughput.`;
      } else {
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
      preview.textContent = Number.isFinite(baseDuration) && baseDuration > 0
        ? `Each of the ${n} parallel units would run about ${formatNumber(baseDuration / n)} h (currently ${formatNumber(baseDuration)} h as one unit). Creates ${groupId}-P1..P${n}, each with 1/${n} of the material flow, wired in parallel between the same predecessor and successor. ${groupId} itself is removed. This can be undone.`
        : `No duration set yet, so time cannot be split proportionally. Creates ${groupId}-P1..P${n}, each with 1/${n} of the material flow. ${groupId} itself is removed. This can be undone.`;
    }

    function closeSplitGroupModal() {
      $("splitGroupModal").hidden = true;
      state.pendingSplitGroupId = null;
    }

    function confirmSplitGroupModal() {
      const groupId = state.pendingSplitGroupId;
      if (!groupId) return;
      let n = Math.round(Number($("splitGroupN").value));
      if (!Number.isFinite(n) || n < 2) n = 2;
      closeSplitGroupModal();
      splitGroupIntoParallelUnits(groupId, n);
    }

    function splitGroupIntoParallelUnits(groupId, n) {
      const group = groupModel(groupId);
      if (!group || !Number.isFinite(n) || n < 2) return;
      pushUndo();
      const baseState = ensureGroup(groupId);
      const originalBlocks = group.blocks;
      const incoming = state.links.filter(link => resolvedEndpointId(link.to) === groupId);
      const outgoing = state.links.filter(link => resolvedEndpointId(link.from) === groupId);
      const otherLinks = state.links.filter(link => resolvedEndpointId(link.to) !== groupId && resolvedEndpointId(link.from) !== groupId);
      const newGroupIds = [];
      const originalDurationH = parseDurationHoursValue(baseState.schedule.durationH);
      const splitDurationText = Number.isFinite(originalDurationH) && originalDurationH > 0
        ? formatNumber(originalDurationH / n)
        : baseState.schedule.durationH;

      for (let i = 1; i <= n; i += 1) {
        const newGroupId = `${groupId}-P${i}`;
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
          notes: [baseState.schedule.notes, `Parallel unit ${i}/${n}, split from ${groupId} to relieve its bottleneck; ${formatNumber(1 / n * 100)}% of the original flow and duration.`].filter(Boolean).join(" ")
        };
        newGroup.conditionOverrides = {};
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
          const additiveIds = additiveConditionIds();
          Object.keys(clone.conditions || {}).forEach(conditionId => {
            if (!additiveIds.has(conditionId)) return;
            const raw = parseDurationHoursValue(clone.conditions[conditionId]);
            if (Number.isFinite(raw) && raw > 0) {
              clone.conditions[conditionId] = formatNumber(raw / n);
            }
          });
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
      if (resolvedEndpointId(from) === resolvedEndpointId(to)) {
        state.connectingFrom = null;
        renderAll();
        return;
      }
      if (!state.links.some(link => link.from === from && link.to === to)) {
        pushUndo();
        state.links.push({ from, to });
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
      const rect = $("groupFlow").getBoundingClientRect();
      const current = kind === "draft" ? state.draftPos : ensureGroup(id);
      state.drag = {
        id,
        kind,
        offsetX: (event.clientX - rect.left + $("groupFlow").scrollLeft) / state.zoom - current.x,
        offsetY: (event.clientY - rect.top + $("groupFlow").scrollTop) / state.zoom - current.y
      };
      event.preventDefault();
    }

    function dragMove(event) {
      if (!state.drag) return;
      const rect = $("groupFlow").getBoundingClientRect();
      const x = Math.max(0, Math.min(3150, (event.clientX - rect.left + $("groupFlow").scrollLeft) / state.zoom - state.drag.offsetX));
      const y = Math.max(0, Math.min(2000, (event.clientY - rect.top + $("groupFlow").scrollTop) / state.zoom - state.drag.offsetY));
      if (state.drag.kind === "draft") {
        state.draftPos = { x, y };
      } else {
        const group = ensureGroup(state.drag.id);
        group.x = x;
        group.y = y;
      }
      renderGroupFlow();
    }

    function dragEnd() {
      state.drag = null;
    }

    function showBlockMenu(x, y, blockId) {
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
      state.menuGroupId = groupId;
      hideBlockMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
      const menu = $("groupMenu");
      menu.hidden = false;
      positionContextMenu(menu, x, y);
    }

    function hideGroupMenu() {
      $("groupMenu").hidden = true;
      state.menuGroupId = null;
    }

    function showStreamMenu(x, y, streamId) {
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

    function showTextSelectionMenu(x, y) {
      hideBlockMenu();
      hideGroupMenu();
      hideStreamMenu();
      const menu = $("textSelectionMenu");
      menu.hidden = false;
      positionContextMenu(menu, x, y);
    }

    function hideTextSelectionMenu() {
      const menu = $("textSelectionMenu");
      if (menu) menu.hidden = true;
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
      hideBlockMenu();
      hideGroupMenu();
      hideStreamMenu();
      hideTextSelectionMenu();
    }

    function editStream(streamId) {
      const block = selectedBlock();
      if (!block) return;
      const stream = block.streams.find(item => item.id === streamId);
      if (!stream) return;
      stream.editing = true;
      hideStreamMenu();
      renderStepFlowInspector();
    }

    function deleteStream(streamId) {
      const block = selectedBlock();
      if (!block) return;
      pushUndo();
      block.streams = block.streams.filter(stream => stream.id !== streamId);
      syncLegacyStreamLists(block);
      hideStreamMenu();
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
      const viewBottom = viewTop + flow.clientHeight;
      const visible = left >= viewLeft + padding
        && top >= viewTop + padding
        && right <= viewRight - padding
        && bottom <= viewBottom - padding;
      if (visible) return;
      if (typeof flow.scrollTo !== "function") return;
      flow.scrollTo({
        left: Math.max(0, left - flow.clientWidth * 0.32),
        top: Math.max(0, top - flow.clientHeight * 0.32),
        behavior: "smooth"
      });
    }

    function centerSelection() {
      const block = selectedBlock();
      const endpoint = block?.groupId || block?.id || groupIdsInTextOrder()[0];
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
      const board = boardBounds();
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
      if (draftBlocks.length) boxes.push({ x: state.draftPos.x, y: state.draftPos.y, w: nodeWidth(draftBlocks.length), h: 300 });
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

    function toggleInspector() {
      $("appMain").classList.toggle("inspector-collapsed");
      $("toggleInspector").textContent = $("appMain").classList.contains("inspector-collapsed") ? "◑" : "◐";
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

    const tutorialSteps = [
      { target: "#sourceInput", title: "1. Source Protocol", body: "Paste the lab protocol here. The workflow starts from text, so every block remains traceable to the original synthesis description." },
      { target: "#createBlockSide", title: "2. Create Blocks", body: "Select one operation in the protocol, then create a block. Blocks are the smallest editable units of the process." },
      { target: "#annotatedText", title: "3. Annotated Text", body: "Created blocks appear highlighted in the text. You can inspect them, delete them, or use right-click actions from this linked view." },
      { target: "#groupFlow", title: "4. Board And Flowchart", body: "Blocks and task groups appear on this board. Drag them, combine related blocks, and draw arrows to build the process network." },
      { target: "#inspectorPanel", title: "5. Inspector", body: "Use the right panel to edit phenomena, task assignment, MFA streams, operating conditions, unit alternatives, and separation properties." },
      { target: "[data-inspector-tab='heuristics']", title: "6. Heuristic Rules", body: "Apply process-synthesis rules to detect missing data, conflicts, risky choices, and choices that need justification." },
      { target: "[data-inspector-tab='scale']", title: "7. Scale-Up And Gantt", body: "Set production target, yield, recovery, schedule assumptions, Gantt durations, and review bottlenecks with scale-behaviour evidence." },
      { target: "#openFlowsheet", title: "8. Flowsheet View", body: "Open a cleaner P&ID-style diagram generated from the current groups and streams. Use it for presentation and layout checking." },
      { target: "#exportJson", title: "9. Export", body: "Export the project as JSON for traceability, reporting, or downstream tools." }
    ];

    function openTutorial(index = 0) {
      state.tutorialIndex = Math.max(0, Math.min(index, tutorialSteps.length - 1));
      $("tutorialOverlay").hidden = false;
      renderTutorialStep();
    }

    function closeTutorial() {
      $("tutorialOverlay").hidden = true;
    }

    function renderTutorialStep() {
      const step = tutorialSteps[state.tutorialIndex] || tutorialSteps[0];
      const target = document.querySelector(step.target);
      if (target) target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      requestAnimationFrame(() => positionTutorialStep(step));
    }

    function positionTutorialStep(step) {
      const overlay = $("tutorialOverlay");
      if (overlay.hidden) return;
      const target = document.querySelector(step.target);
      const card = $("tutorialCard");
      const spotlight = $("tutorialSpotlight");
      const rect = target ? target.getBoundingClientRect() : { left: 24, top: 90, width: 220, height: 90 };
      const pad = 8;
      spotlight.style.left = `${Math.max(8, rect.left - pad)}px`;
      spotlight.style.top = `${Math.max(8, rect.top - pad)}px`;
      spotlight.style.width = `${Math.min(window.innerWidth - 16, rect.width + pad * 2)}px`;
      spotlight.style.height = `${Math.min(window.innerHeight - 16, rect.height + pad * 2)}px`;
      $("tutorialProgress").textContent = `${state.tutorialIndex + 1} / ${tutorialSteps.length}`;
      $("tutorialTitle").textContent = step.title;
      $("tutorialBody").textContent = step.body;
      $("tutorialPrev").disabled = state.tutorialIndex === 0;
      $("tutorialNext").textContent = state.tutorialIndex === tutorialSteps.length - 1 ? "Finish" : "Next";
      const cardWidth = Math.min(360, window.innerWidth - 32);
      const placeRight = rect.right + 18 + cardWidth < window.innerWidth;
      const placeLeft = rect.left - 18 - cardWidth > 0;
      card.style.width = `${cardWidth}px`;
      card.style.left = `${placeRight ? rect.right + 18 : placeLeft ? rect.left - cardWidth - 18 : Math.max(16, (window.innerWidth - cardWidth) / 2)}px`;
      card.style.top = `${Math.max(16, Math.min(rect.top, window.innerHeight - 260))}px`;
    }

    function setInspectorTab(tab) {
      state.activeInspectorTab = ["inspect", "heuristics", "scale"].includes(tab) ? tab : "inspect";
      renderInspectorTabs();
    }

    function openScalePanel() {
      if ($("appMain").classList.contains("inspector-collapsed")) {
        $("appMain").classList.remove("inspector-collapsed");
        $("toggleInspector").textContent = "◐";
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

    function workflowStepStatuses() {
      const blocks = blocksInOrder();
      const groupIds = groupIdsInTextOrder();
      const groups = groupIds.map(groupId => groupModel(groupId));

      const statuses = {};
      const set = (id, status, hint) => { statuses[id] = { status, hint }; };

      if (!blocks.length) {
        set(1, "todo", "Select protocol text and create the first block.");
      } else {
        const missingStreams = blocks.filter(block => {
          if (!blockExpectsStreams(block)) return false;
          const counts = streamCounts(block);
          return !counts.input && !counts.output;
        });
        if (missingStreams.length) {
          set(1, "partial", `${missingStreams.length} block${missingStreams.length === 1 ? "" : "s"} missing input or output streams.`);
        } else {
          set(1, "done", `${blocks.length} blocks with streams defined.`);
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
        if (missingUnit.length === groups.length) {
          set(3, "todo", "Assign a task and select a unit operation for each group.");
        } else if (missingUnit.length) {
          set(3, "partial", `${missingUnit.length} group${missingUnit.length === 1 ? "" : "s"} without task or selected unit.`);
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
        set(6, "done", "Scale basis and task durations defined. Review bottleneck in Scale-Up tab.");
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

      const reactionBlocks = blocksWith(block => phen(block).some(code => code.startsWith("R(")));
      const thermalBlocks = blocksWith(block => phen(block).some(code => code === "ES(H)" || code === "ES(C)"));
      const mixingBlocks = blocksWith(block => phen(block).some(code => code.startsWith("M(") || code.startsWith("2phM")));
      const pressureBlocks = blocksWith(block => phen(block).some(code => code === "ES(P)" || code === "ES(E)"));

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
          "Blocks with pressurization/expansion should record a qualitative pressure."),
        item("Time (per step)", "important",
          groups.length ? groups.every(group => parseStreamQuantity(group.schedule?.durationH)) : false,
          "Give each task group an order-of-magnitude duration."),
        item("Agitation / mixing", "important",
          mixingBlocks.length ? mixingBlocks.every(block => hasCondition(block, ["mixing_time", "mixing_intensity", "mixing_mode", "agitation_speed", "agitation_note"])) : blocks.length > 0,
          "Blocks with mixing phenomena need a qualitative mixing descriptor.")
      ];

      const linkedIds = new Set();
      state.links.forEach(link => { linkedIds.add(link.from); linkedIds.add(link.to); });
      const processes = [
        item("Sequence of steps (ordered blocks)", "critical",
          blocks.length > 0 && blocks.every(block => block.groupId),
          "Create blocks for the whole protocol and assign each to a task group."),
        item("Step purpose (reaction / separation / purification)", "critical",
          blocks.length ? blocks.every(block => String(block.behavior || "").trim()) : false,
          "Give every block a behavior preset that states its purpose."),
        item("Endpoints (observable cues)", "important",
          blocks.length ? blocks.every(block => hasCondition(block, ["thermal_endpoint", "reaction_endpoint", "transfer_endpoint"]) || !phen(block).some(code => code.startsWith("R(") || code.startsWith("PT("))) : false,
          "Reaction/transfer blocks should record an observable completion cue."),
        item("Dominant phenomena per step (>= 1-2 per block)", "critical",
          blocks.length ? blocks.every(block => phen(block).length >= 1) : false,
          "Assign at least one phenomenon per block (paper Table 3)."),
        item("Multiphase indication", "important",
          blocks.length ? blocks.some(block => phen(block).some(code => code.includes("2ph") || code.startsWith("PC(") || code.startsWith("PS("))) || allStreams.every(s => (s.phase || "L") === (allStreams[0]?.phase || "L")) : false,
          "If two phases coexist anywhere, mark two-phase mixing/contact/separation phenomena."),
        item("Task definition per group", "critical",
          groups.length ? groups.every(group => group.task && group.task !== "unassigned") : false,
          "Name the task of every group (reaction, washing, purification...)."),
        item("Candidate unit operations (>= 1 per task)", "critical",
          groups.length ? groups.every(group => group.selectedUnit || matchesForGroup(group).length) : false,
          "Each group needs at least one candidate unit operation from the knowledge base."),
        item("Stream connectivity (input/output links)", "critical",
          groups.length > 1 ? groupIds.every(groupId => linkedIds.has(groupId)) : groups.length === 1,
          "Connect all groups with arrows so the flowsheet is a closed network."),
        item("Recycling / wastes identified", "important",
          allStreams.some(s => s.role === "waste") || allStreams.some(s => /recycle/i.test(s.fate || "")),
          "Identify at least waste streams and candidate recycle loops qualitatively.")
      ];

      const scheduling = [
        item("Scale-sensitive operations identified", "important",
          groups.length ? groups.every(group => String(group.schedule?.scaleSensitivity || "").trim()) : false,
          "Classify each task (heating/cooling, drying, filtration are typically scale-sensitive)."),
        item("Task duration estimates", "important",
          groups.length ? groups.every(group => parseStreamQuantity(group.schedule?.durationH)) : false,
          "Rough per-task durations enable the Gantt and bottleneck analysis."),
        item("Parallelization potential", "optional",
          groups.length ? groups.every(group => String(group.schedule?.canOverlap || "").trim()) : false,
          "Mark which tasks can overlap or run on parallel units.")
      ];

      const categories = [
        { name: "Synthesis steps", items: synthesis },
        { name: "Processes and tasks", items: processes },
        { name: "Scheduling and optimization", items: scheduling }
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
      return {
        workflow: "source text -> annotated blocks -> material inputs/outputs/waste -> behavior presets -> phenomenon groups -> task/unit alternatives -> heuristic rule application -> scale-up basis -> scaled MFA -> Gantt bottleneck check",
        text: state.text,
        workflowStepStatus: workflowStepStatuses(),
        scaleUp: {
          basis: scale.basis,
          reference: scale.reference,
          target: scale.target,
          schedule: scale.schedule,
          factors: scale.factors,
          scaledMfa: scale.blocks,
          scaledRows: scale.rows,
          ready: scale.ready,
          assessment: scaleAssessment,
          heuristicReview,
          ganttSchedule
        },
        recycleSummary: recycle,
        energyBridge,
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

    function renderExport() {
      $("jsonOut").textContent = JSON.stringify(buildProjectExport(), null, 2);
    }

    function exportBlock(block) {
      return {
        id: block.id,
        groupId: block.groupId,
        start: block.start,
        end: block.end,
        text: block.text,
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
        note: stream.note
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
          reason: prompt.reason,
          phenomena: prompt.phenomena
        };
      }).filter(item => item.value || item.note || item.status !== "missing");
    }

    function renderAll() {
      state.blocks.forEach(block => {
        ensureBlockFlowFields(block);
        ensureBlockConditionFields(block);
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

    $("behaviorSelect").innerHTML = Object.keys(behaviorPresets).map(name => `<option value="${name}">${name}</option>`).join("");

    $("loadSample").addEventListener("click", () => {
      if (state.blocks.length && !confirm("Load the octocrylene case? This replaces all current blocks, groups, and arrows.")) return;
      if (state.blocks.length) pushUndo();
      loadBaseExampleProject();
    });
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
        $("toggleInspector").textContent = "◐";
      }
      setInspectorTab(step.tab);
      renderWorkflowStepper();
    });
    $("createBlockSide").addEventListener("click", createBlockFromSelection);
    $("openScaleTop").addEventListener("click", openScalePanel);
    $("clearProject").addEventListener("click", () => {
      if (!state.blocks.length) return;
      if (!confirm("Clear all blocks, groups, and arrows? This cannot be undone with more than one step back.")) return;
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
    $("exportJson").addEventListener("click", renderExport);
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
    $("refineProject").addEventListener("click", runRuleChecks);
    $("refineProjectAi").addEventListener("click", openAiRefineModal);
    $("closeAiRefineModal").addEventListener("click", closeAiRefineModal);
    $("openFlowsheet").addEventListener("click", openFlowsheetModal);
    $("closeFlowsheetModal").addEventListener("click", closeFlowsheetModal);
    $("downloadFlowsheet").addEventListener("click", downloadFlowsheetSvg);
    $("resetFlowsheetLayout").addEventListener("click", () => {
      pushUndo();
      groupIdsInTextOrder().forEach(groupId => {
        const groupState = ensureGroup(groupId);
        delete groupState.flowsheetX;
        delete groupState.flowsheetY;
      });
      renderFlowsheetModal();
    });
    $("flowsheetModal").addEventListener("click", event => {
      if (event.target === $("flowsheetModal")) closeFlowsheetModal();
    });
    $("closeSplitGroupModal").addEventListener("click", closeSplitGroupModal);
    $("cancelSplitGroup").addEventListener("click", closeSplitGroupModal);
    $("confirmSplitGroup").addEventListener("click", confirmSplitGroupModal);
    $("splitGroupN").addEventListener("input", renderSplitGroupPreview);
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
    $("toggleCompact").addEventListener("click", () => {
      state.boardCompact = !state.boardCompact;
      $("toggleCompact").textContent = state.boardCompact ? "Detailed View" : "Compact View";
      $("toggleCompact").classList.toggle("primary", state.boardCompact);
      renderAll();
    });
    $("boardCenter").addEventListener("click", centerSelection);
    $("zoomOut").addEventListener("click", () => setZoom(state.zoom / 1.35));
    $("zoomIn").addEventListener("click", () => setZoom(state.zoom * 1.35));
    $("zoomFit").addEventListener("click", fitBoard);
    $("toggleInspector").addEventListener("click", toggleInspector);
    $("groupFlow").addEventListener("wheel", handleGraphWheel, { passive: false });
    document.querySelectorAll("[data-inspector-tab]").forEach(button => {
      button.addEventListener("click", () => setInspectorTab(button.dataset.inspectorTab));
    });

    $("annotatedText").addEventListener("mouseup", rememberSelection);
    $("annotatedText").addEventListener("keyup", rememberSelection);
    $("annotatedText").addEventListener("mousedown", handleTextSelectionRightMouseDown);
    $("annotatedText").addEventListener("contextmenu", handleTextSelectionContextMenu);
    $("sourceInput").addEventListener("mouseup", rememberSelection);
    $("sourceInput").addEventListener("keyup", rememberSelection);
    $("sourceInput").addEventListener("mousedown", handleTextSelectionRightMouseDown);
    $("sourceInput").addEventListener("contextmenu", handleTextSelectionContextMenu);

    $("behaviorSelect").addEventListener("change", event => applyBehavior(event.target.value));
    $("blockText").addEventListener("input", event => {
      const block = selectedBlock();
      if (!block) return;
      block.text = event.target.value;
      renderAll();
    });
    $("groupTask").addEventListener("input", event => {
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

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!$("aiRefineModal").hidden) {
          closeAiRefineModal();
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
    document.addEventListener("mouseover", showHoverTip);
    document.addEventListener("mousemove", moveHoverTip);
    document.addEventListener("mouseout", hideHoverTip);
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);

    loadBaseExampleProject();
