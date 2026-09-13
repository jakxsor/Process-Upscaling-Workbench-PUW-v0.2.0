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

  root.ProcessUpscalingExamples = Object.freeze({
    octocryleneExampleBasis,
    octocryleneExampleSteps,
    sampleText
  });
})(globalThis);
