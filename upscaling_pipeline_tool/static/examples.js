(function (root) {
  const octocryleneExampleBasis = (() => {
    const productKg = 1;
    const productMw = 361.48;
    const endpointConversionPercent = 99.5;
    const reactedMol = productKg * 1000 / productMw;
    const chargedMol = reactedMol / (endpointConversionPercent / 100);
    const mass = (mol, mw, digits = 6) => (mol * mw / 1000).toFixed(digits);
    const cyclohexaneChargeL = 2.5;
    const solventRecoveryTarget = 0.98;
    return Object.freeze({
      productKg: String(productKg),
      productMw: String(productMw),
      endpointConversionPercent: String(endpointConversionPercent),
      benzophenoneKg: mass(chargedMol, 182.22, 8),
      cyanoacetateKg: mass(chargedMol, 197.28, 8),
      unreactedBenzophenoneKg: mass(chargedMol - reactedMol, 182.22),
      unreactedCyanoacetateKg: mass(chargedMol - reactedMol, 197.28),
      reactionWaterKg: mass(reactedMol, 18.015),
      washWaterL: "2.0",
      cyclohexaneChargeL: String(cyclohexaneChargeL),
      cyclohexaneRecoveredL: (cyclohexaneChargeL * solventRecoveryTarget).toFixed(2),
      cyclohexaneMakeupL: (cyclohexaneChargeL * (1 - solventRecoveryTarget)).toFixed(2),
      solventRecoveryPercent: String(solventRecoveryTarget * 100)
    });
  })();

  // Readability-normalized cyclohexane route from SI Table S1. Calculated charges and industrial
  // equipment choices stay in the MFA and scale-up layers instead of being presented as protocol facts.
  const octocryleneExampleSteps = Object.freeze({
    B1: "Equip a four-necked round-bottom flask with a mechanical stirrer, thermometer, reflux condenser, and Dean-Stark trap. Under a nitrogen blanket at 25 °C, charge benzophenone, 2-ethylhexyl cyanoacetate, ammonium acetate, and cyclohexane (2.5 L per kg of target product), then begin stirring.",
    B2: "Heat the stirred suspension to cyclohexane reflux at 85-90 °C over 0.5-1 h. Continue until the benzophenone has dissolved and stable reflux is established.",
    B3: "Maintain reflux at 85-90 °C for 18-24 h under nitrogen. Continuously collect the reaction water in the Dean-Stark trap and return the cyclohexane phase to the flask. End the reaction when water collection ceases and residual benzophenone is below 0.5%.",
    B4: "Cool the reaction mixture to 25 °C over approximately 1 h.",
    B5: "Extract the crude mixture with ethyl acetate. Wash the organic phase with water (2 L per kg of target product), allow the phases to separate, and remove the aqueous phase.",
    B6: "Wash the retained organic phase with saturated sodium chloride solution. Allow the phases to separate, then remove the aqueous brine phase.",
    B7: "Dry the organic phase over anhydrous magnesium sulfate or sodium sulfate until the water content is below 500 ppm, then filter off the drying agent.",
    B8: "Concentrate the filtrate under reduced pressure to remove cyclohexane and residual ethyl acetate.",
    B9: "Purify the crude octocrylene by vacuum distillation at approximately 1.5 mmHg and a head temperature of approximately 210 °C. Collect the light-yellow, viscous product fraction.",
    B10: "[Industrial addition] Route cyclohexane-rich vents from the reactor and evaporator to a condenser and activated-carbon polishing system.",
    B11: "[Industrial addition] Combine the cyclohexane recovery feeds in a dedicated distillation column, target at least 98 percent recovery, and return purified cyclohexane to feed preparation.",
    B12: "[Industrial addition] Route reaction water, aqueous wash, brine, and molecular-sieve regeneration water to the wastewater-treatment interface."
  });
  const sampleText = Object.entries(octocryleneExampleSteps)
    .filter(([id]) => Number(id.slice(1)) <= 9)
    .map(([, text]) => text)
    .join("\n\n");

  // Biodiesel by base-catalysed transesterification of a vegetable oil (triolein basis). The
  // procedure and its numbers are the textbook ones: 6:1 methanol-to-oil molar ratio, 1 wt% NaOH
  // on oil, 60 degC, 1 h (Freedman, Pryde and Mounts, J. Am. Oil Chem. Soc. 61 (1984) 1638;
  // Van Gerpen, Fuel Processing Technology 86 (2005) 1097); product quality per EN 14214.
  const biodieselExampleSteps = Object.freeze({
    B1: "Dissolve 10 g of sodium hydroxide in 217 g of methanol (6:1 molar ratio of methanol to oil) with stirring at 25 °C to prepare the sodium methoxide solution.",
    B2: "Charge 1.00 kg of refined vegetable oil (triolein basis, 1.13 mol) to a jacketed stirred reactor and heat to 60 °C. Add the methoxide solution and stir at 600 rpm for 1 h at 60 °C and atmospheric pressure.",
    B3: "Stop stirring and transfer the mixture to a separating vessel. Allow the phases to settle for 1.5 h at 50 °C and draw off the lower glycerol-rich phase.",
    B4: "Recover the excess methanol from the ester phase by distillation at 65-70 °C under reduced pressure (200 mbar).",
    B5: "Wash the ester phase three times with 0.3 L of warm water at 50 °C, settling for 0.5 h after each wash and discarding the aqueous phase.",
    B6: "Dry the washed ester under vacuum (50 mbar) at 105 °C for 0.5 h until the water content is below 500 mg/kg.",
    B7: "Filter the dried methyl ester through a 5 µm filter and collect the biodiesel product (ester content at least 96.5 percent by mass, EN 14214).",
    B8: "[Industrial addition] Recover methanol from the glycerol-rich phase in a dedicated column and return it to methoxide preparation.",
    B9: "[Industrial addition] Neutralize the crude glycerol phase for valorization and route wash water and drying condensate to the wastewater-treatment interface."
  });
  const biodieselSampleText = Object.entries(biodieselExampleSteps)
    .filter(([id]) => Number(id.slice(1)) <= 7)
    .map(([, text]) => text)
    .join("\n\n");

  root.ProcessUpscalingExamples = Object.freeze({
    octocryleneExampleBasis,
    octocryleneExampleSteps,
    sampleText,
    biodieselExampleSteps,
    biodieselSampleText
  });
})(globalThis);
