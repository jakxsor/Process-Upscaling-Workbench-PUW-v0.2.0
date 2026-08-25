#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "upscaling_pipeline_tool", "static", "app.js");
const source = fs.readFileSync(appPath, "utf8");

const checks = [
  {
    label: "optional screen UI wording",
    pattern: /Optional Property-Based Separation Screen/
  },
  {
    label: "minimal qualitative mode",
    pattern: /Minimal qualitative/
  },
  {
    label: "binary-ratio mode option",
    pattern: /value="binaryRatio"/
  },
  {
    label: "binary-ratio safeguard issue",
    pattern: /Binary-ratio screen needs component properties/
  },
  {
    label: "algorithm mode exported",
    pattern: /algorithmMode: mode/
  },
  {
    label: "screening basis exported",
    pattern: /screeningBasis: propertyScreeningBasis/
  },
  {
    label: "threshold set exported",
    pattern: /thresholdSet: mode === "binaryRatio"/
  },
  {
    label: "component pairs exported",
    pattern: /componentPairs: inferredComponentPairsForGroup/
  },
  {
    label: "property source requirement exported",
    pattern: /sourceRequired: Boolean/
  },
  {
    label: "screening limitation visible",
    pattern: /Screening only, not final equipment design/
  }
];

const missing = checks.filter(check => !check.pattern.test(source));

if (missing.length) {
  console.error("Property screening regression check failed:");
  missing.forEach(check => console.error(`- ${check.label}`));
  process.exit(1);
}

console.log(`Property screening regression check passed (${checks.length} checks).`);
