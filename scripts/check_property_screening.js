#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "upscaling_pipeline_tool", "static", "app.js");
const source = fs.readFileSync(appPath, "utf8");

const checks = [
  {
    label: "operating basis UI wording",
    pattern: /Operating Basis/
  },
  {
    label: "group panel separates pure and binary evidence",
    pattern: /Pure-component and binary data stay in Substances or Lutze\/Garg/
  },
  {
    label: "aggregate predictor disabled",
    pattern: /function separationPredictorApplies\(_group\) \{\s*return false;/
  },
  {
    label: "scale-up uses Lutze component volatility evidence",
    pattern: /component volatility or VLE evidence in Lutze/
  },
  {
    label: "scale-up uses Lutze binary phase-split evidence",
    pattern: /binary phase-split evidence in Lutze/
  },
  {
    label: "component evidence helper",
    pattern: /function groupHasComponentPropertyEvidence/
  },
  {
    label: "binary evidence helper",
    pattern: /function groupHasBinaryInsightEvidence/
  }
];

const missing = checks.filter(check => !check.pattern.test(source));

if (missing.length) {
  console.error("Property screening regression check failed:");
  missing.forEach(check => console.error(`- ${check.label}`));
  process.exit(1);
}

console.log(`Property screening regression check passed (${checks.length} checks).`);
