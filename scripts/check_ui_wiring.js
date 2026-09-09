#!/usr/bin/env node
"use strict";

// Static wiring checks for the two ways UI silently rots in this codebase, both of which shipped
// unnoticed before:
//
//   1. Dead panels - a render function writes into $("someId") but no such element exists any more,
//      because a redesign dropped the container while every render function survived. The panel
//      then renders into nothing, forever, without an error. (This is what made Cp/density
//      impossible to enter and turned "Add Density Basis" into a no-op button.)
//
//   2. Zombie controls - a template emits data-something="..." for a clickable element, but nothing
//      ever queries [data-something] to bind a handler, so the control looks live and does nothing.
//
// Both are found by comparing what the templates emit against what the code looks up, so this runs
// as plain static analysis: no browser, no new dependencies.

const fs = require("fs");
const path = require("path");

const staticDir = "upscaling_pipeline_tool/static";
const jsFiles = fs.readdirSync(staticDir).filter(name => name.endsWith(".js")).map(name => path.join(staticDir, name));
// Comments are stripped before anything is matched: this codebase documents its wiring heavily, and
// a comment mentioning [data-something] would otherwise satisfy the "is it queried" test and hide a
// control whose real handler had been removed - which is precisely the failure this check exists to
// catch. Full-line comments only, so that "https://" inside string literals survives intact.
const stripComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^[ \t]*\/\/.*$/gm, "");

const jsSources = Object.fromEntries(jsFiles.map(file => [file, stripComments(fs.readFileSync(file, "utf8"))]));
const allJs = Object.values(jsSources).join("\n");
const appHtml = fs.readFileSync("upscaling_pipeline_tool/app.py", "utf8");

const failures = [];

// ---------------------------------------------------------------- 1. dead render targets
// Only ids the code actually writes into matter: $("x").innerHTML = / .textContent = , or a
// render helper that takes $("x") as its root. A bare $("x") that is only read or guarded is fine.
const writtenIds = new Set();
const writePatterns = [
  /\$\("([A-Za-z0-9_-]+)"\)\.innerHTML\s*=/g,
  /\$\("([A-Za-z0-9_-]+)"\)\.textContent\s*=/g,
  /const\s+\w+\s*=\s*\$\("([A-Za-z0-9_-]+)"\);[\s\S]{0,200}?\w+\.innerHTML\s*=/g
];
writePatterns.forEach(pattern => {
  let match;
  while ((match = pattern.exec(allJs))) writtenIds.add(match[1]);
});

// an id counts as existing if the served HTML declares it, or if a JS template creates it
const htmlIds = new Set(Array.from(appHtml.matchAll(/id="([A-Za-z0-9_-]+)"/g), m => m[1]));
const jsTemplateIds = new Set(Array.from(allJs.matchAll(/id="([A-Za-z0-9_-]+)"/g), m => m[1]));

writtenIds.forEach(id => {
  if (!htmlIds.has(id) && !jsTemplateIds.has(id)) {
    failures.push(`dead render target: code writes into $("${id}") but no element with that id is ever created`);
  }
});

// ---------------------------------------------------------------- 2. zombie interactive controls
// Collect every data-* attribute the templates emit, on any element - the clickable things here are
// not only <button>s (the arrow remove marker is an SVG <g>, board nodes are <section>s), so keying
// off tag names would miss exactly the cases that matter. An attribute is considered wired if
// something queries [data-x], reads dataset.x, or styles it in CSS; anything else is emitted and
// never used, which is what a zombie control looks like in this codebase.
// Templates live in two places: JS string literals and the static page served from app.py. Both
// count as emission, otherwise every control declared directly in the page markup looks orphaned.
const emitted = new Map();
Object.entries({ ...jsSources, "upscaling_pipeline_tool/app.py": appHtml }).forEach(([file, source]) => {
  // Valueless attributes count too: <button data-open-gantt> is a perfectly ordinary emission, and
  // requiring an "=" here previously reported it as an orphaned handler.
  const pattern = /\sdata-([a-z][a-z0-9-]*)(?=[=\s>/])/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const attr = match[1].toLowerCase();
    if (!emitted.has(attr)) emitted.set(attr, file);
  }
});

const cssSource = fs.existsSync(path.join(staticDir, "style.css"))
  ? fs.readdirSync(staticDir).filter(name => name.endsWith(".css")).map(name => fs.readFileSync(path.join(staticDir, name), "utf8")).join("\n")
  : "";

const camel = attr => attr.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

emitted.forEach((file, attr) => {
  const queried = new RegExp(`\\[data-${attr}[\\]=^~|*$]`).test(allJs);
  const readViaDataset = new RegExp(`dataset\\.${camel(attr)}\\b`).test(allJs);
  // CSS uses these two ways: as a selector, and as a value via attr() - the latter is how the
  // responsive table labels work, and matching only selectors reported them all as unused.
  const styled = new RegExp(`\\[data-${attr}[\\]=^~|*$]`).test(cssSource)
    || new RegExp(`attr\\(\\s*data-${attr}\\s*[,)]`).test(cssSource);
  if (!queried && !readViaDataset && !styled) {
    failures.push(`zombie control: templates emit data-${attr} (${file}) but nothing queries [data-${attr}], reads dataset.${camel(attr)}, or styles it`);
  }
});

// ---------------------------------------------------------------- 3. orphaned handlers
// The mirror image of a zombie control: code binds a handler to [data-x] but no template emits
// data-x any more, so the handler is attached to nothing. This is what a refactor leaves behind when
// it drops a control from a template and forgets its wiring, and it is invisible at runtime because
// querySelectorAll simply returns an empty list.
const queriedAttrs = new Set(Array.from(allJs.matchAll(/querySelectorAll\(["'`]\[data-([a-z][a-z0-9-]*)[\]=]/g), m => m[1].toLowerCase()));
queriedAttrs.forEach(attr => {
  if (!emitted.has(attr)) {
    failures.push(`orphaned handler: code binds to [data-${attr}] but no template emits that attribute any more`);
  }
});

// ---------------------------------------------------------------- 4. unreachable modals
// Checks 2 and 3 both start from a data-attribute, so they cannot see a feature whose only entry
// point is a plain function call. That blind spot hid the separation simulator: openSeparationSimulator
// unhid the modal, closeSeparationSimulator was bound to the close button, the modal existed in the
// served HTML - and nothing ever called the opener, so four of its six tabs were unreachable while
// this check reported "passed". A function that reveals a modal has to be invoked by something.
const opensAModal = /(?:\.hidden\s*=\s*false|classList\.remove\(["'`]hidden)/;
Array.from(allJs.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*\{/g)).forEach(match => {
  const name = match[1];
  if (!/^(open|show|reveal|launch)/.test(name)) return;
  // an IIFE runs itself, so its name appearing once is not evidence of death
  if (allJs.slice(Math.max(0, match.index - 2), match.index).includes("(")) return;
  const body = allJs.slice(match.index, match.index + 1400);
  if (!opensAModal.test(body)) return;
  const references = (allJs.match(new RegExp(`\\b${name}\\b`, "g")) || []).length
    + (appHtml.match(new RegExp(`\\b${name}\\b`, "g")) || []).length;
  if (references <= 1) {
    failures.push(`unreachable modal: ${name}() reveals a modal but nothing ever calls it, so the feature has no entry point`);
  }
});

// ---------------------------------------------------------------- 5. every script is served
const scriptTags = new Set(Array.from(appHtml.matchAll(/<script src="\/([A-Za-z0-9_.-]+)"><\/script>/g), m => m[1]));
const routed = new Set(Array.from(appHtml.matchAll(/"\/([A-Za-z0-9_.-]+\.js)":/g), m => m[1]));
scriptTags.forEach(name => {
  if (!routed.has(name)) failures.push(`script <${name}> is loaded by the page but has no STATIC_ROUTES entry, so it will 404`);
  if (!fs.existsSync(path.join(staticDir, name))) failures.push(`script <${name}> is loaded by the page but the file does not exist`);
});

if (failures.length) {
  console.error(`UI wiring check found ${failures.length} problem(s):`);
  failures.forEach(line => console.error(`  - ${line}`));
  process.exit(1);
}

console.log(`UI wiring check passed (${writtenIds.size} render targets, ${emitted.size} interactive data-attributes, ${scriptTags.size} scripts).`);
