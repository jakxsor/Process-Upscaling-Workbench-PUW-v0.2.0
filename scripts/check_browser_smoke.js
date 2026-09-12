#!/usr/bin/env node
"use strict";

// Browser smoke check: drives the served application in headless Chromium and asserts the things
// the static checks cannot see - that the page loads without a runtime error, that the process
// board opens legible with every group inside the panel, that the step-5 modal produces a local
// report, that the inventory readiness card renders, and that the flowsheet opens.
//
// The board regression this exists for (the board opened at 35% zoom, clipped, on every screen
// size) was invisible to every other check: the code parsed, the model was right, the render
// functions all wrote into existing elements. Only the browser could see that nothing was readable.
//
// Optional dependency: Playwright and a Chromium build. When either is missing the check prints a
// SKIP line and exits 0, so the rest of the suite is unaffected. To run it locally:
//   npm install --no-save playwright@1.54.0 && npx playwright install chromium
//   node scripts/check_browser_smoke.js
// PLAYWRIGHT_CHROMIUM_EXECUTABLE can point at an existing Chrome/Chromium binary instead.

const assert = require("assert");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.log("SKIP browser smoke check: playwright is not installed (npm install --no-save playwright).");
  process.exit(0);
}

const repoRoot = path.resolve(__dirname, "..");
const python = process.env.PYTHON || "python3";

function waitForServer(url, attempts = 40) {
  return new Promise((resolve, reject) => {
    const tryOnce = remaining => {
      const request = http.get(url, response => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (remaining <= 0) reject(new Error(`server did not answer at ${url}`));
        else setTimeout(() => tryOnce(remaining - 1), 250);
      });
    };
    tryOnce(attempts);
  });
}

async function withServer(run) {
  const port = 8700 + Math.floor(Math.random() * 200);
  const server = spawn(python, ["start.py", "--no-browser", "--port", String(port)], { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = "";
  server.stdout.on("data", chunk => { serverOutput += chunk; });
  server.stderr.on("data", chunk => { serverOutput += chunk; });
  try {
    // start.py falls back to a free port when the preferred one is busy and prints the URL it used.
    await waitForServer(`http://127.0.0.1:${port}/`).catch(async error => {
      const match = serverOutput.match(/running at (http:\/\/[^\s]+)/);
      if (!match) throw new Error(`${error.message}\n${serverOutput}`);
      await waitForServer(match[1]);
      return match[1];
    });
    const match = serverOutput.match(/running at (http:\/\/[^\s]+)/);
    await run(match ? match[1] : `http://127.0.0.1:${port}/`);
  } finally {
    server.kill();
  }
}

const measureBoard = () => {
  const flow = document.getElementById("groupFlow");
  const canvas = flow.querySelector(".board-canvas");
  const boxes = Array.from(canvas.querySelectorAll(".group-box"));
  const panel = flow.getBoundingClientRect();
  const zoom = parseFloat((canvas.style.transform.match(/scale\(([\d.]+)\)/) || [0, 1])[1]);
  const inside = boxes.filter(box => {
    const rect = box.getBoundingClientRect();
    return rect.left >= panel.left - 1 && rect.right <= panel.right + 1 && rect.top >= panel.top - 1 && rect.bottom <= panel.bottom + 1;
  }).length;
  return {
    zoom,
    groups: boxes.length,
    inside,
    horizontalScroll: flow.scrollWidth > flow.clientWidth + 1,
    verticalScroll: flow.scrollHeight > flow.clientHeight + 1
  };
};

(async () => {
  let browser;
  try {
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {});
  } catch (error) {
    console.log(`SKIP browser smoke check: no Chromium available (${String(error.message).split("\n")[0]}). Run: npx playwright install chromium`);
    process.exit(0);
  }
  try {
    await withServer(async baseUrl => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const runtimeErrors = [];
      page.on("pageerror", error => runtimeErrors.push(error.message));
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const board = await page.evaluate(measureBoard);
      assert.strictEqual(board.groups, 9, `The built-in example should load nine task groups, got ${board.groups}`);
      assert.strictEqual(board.inside, board.groups, `Every group box must be inside the board panel on load, ${board.inside}/${board.groups} were`);
      assert(board.zoom >= 0.5, `Board must open legibly at 1440x900; zoom was ${Math.round(board.zoom * 100)}%`);
      assert(!board.horizontalScroll && !board.verticalScroll, "A fitted board must not need scrollbars");

      // Zooming in from the fitted view must keep the process on screen.
      await page.evaluate(() => { const menu = document.querySelector(".board-view-dropdown"); if (menu) menu.open = true; });
      await page.click("#zoomIn");
      await page.click("#zoomIn");
      await page.waitForTimeout(400);
      const zoomed = await page.evaluate(measureBoard);
      assert(zoomed.inside >= 4, `Two zoom-in clicks should keep most groups in view, only ${zoomed.inside} were`);
      await page.evaluate(() => { const menu = document.querySelector(".board-view-dropdown"); if (menu) menu.open = false; });

      // Compact/Detailed shows which mode is on.
      const pressed = await page.$eval("#boardModeCompact", el => el.getAttribute("aria-pressed"));
      assert.strictEqual(pressed, "true", "Compact should be the pressed mode on load");

      // Inventory readiness is on screen, not only in the export.
      const lci = await page.$eval("#lcaReadinessSummary", el => el.textContent.trim());
      assert(/input/.test(lci), `Inventory readiness summary should report inputs, got: ${lci}`);

      // Step 5 opens a modal whose deterministic report is filled and whose external form is folded.
      await page.click('[data-inspector-tab="heuristics"]');
      await page.waitForTimeout(300);
      await page.click("#refineProjectAi");
      await page.waitForTimeout(1500);
      const report = await page.$eval("#aiRefineLocalResult", el => el.innerText);
      assert(/before scale-up/.test(report), "The local rule report should summarise conflicts before scale-up");
      const externalOpen = await page.$eval(".external-analysis-details", el => el.open);
      assert.strictEqual(externalOpen, false, "The external review should be folded by default");
      await page.click("#closeAiRefineModal");
      await page.waitForTimeout(300);

      // The flowsheet opens and draws units.
      await page.click("#openFlowsheet");
      await page.waitForTimeout(1500);
      const units = await page.$$eval("#flowsheetModal svg text", nodes => nodes.length);
      assert(units > 9, `Flowsheet should draw labelled units, found ${units} text nodes`);
      await page.keyboard.press("Escape");

      assert.deepStrictEqual(runtimeErrors, [], `Runtime errors during the smoke run: ${runtimeErrors.join(" | ")}`);
      console.log(`Browser smoke check passed (board ${Math.round(board.zoom * 100)}% with ${board.inside}/${board.groups} groups in view; ${lci}).`);
    });
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
