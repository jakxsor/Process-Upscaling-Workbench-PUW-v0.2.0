(function (root) {
  "use strict";

  async function lookup(name, options = {}) {
    const response = await fetch("/api/pubchem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...options })
    });
    return response.json();
  }

  function applyLookup(substance, data) {
    const props = data.properties || {};
    const mapped = data.mapped || {};
    const fill = (field, value) => {
      if (value === undefined || value === null || value === "") return;
      if (!String(substance[field] || "").trim()) substance[field] = String(value);
    };
    fill("mw", mapped.mw);
    fill("tm", mapped.tm);
    fill("tb", mapped.tb);
    fill("pvap", mapped.pvap);
    fill("pvapTemperature", mapped.pvapTemperature);
    fill("pvapTemperatureUnit", mapped.pvapTemperatureUnit);
    fill("molecularFormula", props.MolecularFormula);
    fill("canonicalSmiles", props.CanonicalSMILES || props.SMILES || props.ConnectivitySMILES || props.IsomericSMILES);
    fill("xlogp", props.XLogP);
    fill("exactMass", props.ExactMass);
    substance.pubchemCid = data.cid ? String(data.cid) : substance.pubchemCid || "";
    substance.pubchemUrl = data.url || substance.pubchemUrl || "";
    substance.propertySource = "PubChem PUG-REST/PUG-View";
    substance.propertyStatus = "database";

    const rawEvidence = [];
    const experimental = data.experimental || {};
    if (experimental.melting_point?.length) rawEvidence.push(`Tm raw ${experimental.melting_point[0]}`);
    if (experimental.boiling_point?.length) rawEvidence.push(`Tb raw ${experimental.boiling_point[0]}`);
    if (experimental.vapor_pressure?.length) rawEvidence.push(`Pvap raw ${experimental.vapor_pressure[0]}`);
    const line = `PubChem CID ${data.cid || "unknown"} autofill; confirm thermal/phase values before design use${rawEvidence.length ? ` (${rawEvidence.join("; ")})` : ""}.`;
    if (!String(substance.note || "").includes("PubChem CID")) {
      substance.note = [substance.note, line].filter(Boolean).join(" | ");
    }
  }

  root.ProcessUpscalingPubChemCore = {
    lookup,
    applyLookup
  };
})(globalThis);
