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

      // A fresh browser profile receives the first-visit tutorial offer. Confirm that the
      // onboarding prompt rendered, then dismiss it so the rest of the smoke test can interact
      // with the workbench controls behind the modal.
      const firstVisitPrompt = await page.$eval("#confirmModal", modal => ({
        hidden: modal.hidden,
        message: document.getElementById("confirmModalMessage").textContent.trim(),
        cancelLabel: document.getElementById("confirmModalCancel").textContent.trim()
      }));
      assert.strictEqual(firstVisitPrompt.hidden, false, "A fresh browser should receive the first-visit tutorial prompt");
      assert(/first time/i.test(firstVisitPrompt.message), `Unexpected first-visit prompt: ${firstVisitPrompt.message}`);
      assert.strictEqual(firstVisitPrompt.cancelLabel, "Not now", "The tutorial offer should have a non-destructive dismissal");
      await page.click("#confirmModalCancel");

      const board = await page.evaluate(measureBoard);
      assert.strictEqual(board.groups, 9, `The built-in example should load nine task groups, got ${board.groups}`);
      assert(board.zoom > 0.2, `Board zoom should be a sane value on load; got ${Math.round(board.zoom * 100)}%`);

      // The zoom controls must work and must not throw.
      await page.evaluate(() => { const menu = document.querySelector(".board-view-dropdown"); if (menu) menu.open = true; });
      await page.click("#zoomIn");
      await page.waitForTimeout(300);
      const zoomed = await page.evaluate(measureBoard);
      assert(zoomed.zoom > board.zoom, "Zoom in should increase the board zoom");
      await page.evaluate(() => { const menu = document.querySelector(".board-view-dropdown"); if (menu) menu.open = false; });

      // Focus mode must give the process map the workspace instead of merely changing a button.
      const normalMapWidth = await page.$eval(".workflow-panel", el => el.getBoundingClientRect().width);
      await page.click("#focusBoard");
      await page.waitForTimeout(500);
      const focused = await page.evaluate(() => ({
        classes: document.getElementById("appMain").className,
        pressed: document.getElementById("focusBoard").getAttribute("aria-pressed"),
        mapWidth: document.querySelector(".workflow-panel").getBoundingClientRect().width
      }));
      assert(/protocol-collapsed/.test(focused.classes) && /inspector-collapsed/.test(focused.classes), `Focus mode should collapse both side panels, got: ${focused.classes}`);
      assert.strictEqual(focused.pressed, "true", "Focus control should expose its pressed state");
      assert(focused.mapWidth > normalMapWidth + 300, `Focus mode should materially widen the map, from ${normalMapWidth}px to ${focused.mapWidth}px`);
      await page.click("#focusBoard");
      await page.waitForTimeout(300);
      const restoredClasses = await page.$eval("#appMain", el => el.className);
      assert(!/protocol-collapsed|inspector-collapsed/.test(restoredClasses), `Exiting focus should restore both side panels, got: ${restoredClasses}`);

      // Opening a task group is the primary editing action: its aggregate drawer must stay
      // within the board panel, not spill over and cover the contextual right rail (a past
      // "overhang" mechanism did exactly that, silently, with no treatment of the rail
      // underneath - confusing rather than useful).
      await page.click('[data-open-group-board]');
      await page.waitForTimeout(300);
      const groupDrawer = await page.evaluate(() => {
        const drawer = document.getElementById("stepFlowInspector").getBoundingClientRect();
        const inspector = document.getElementById("inspectorPanel").getBoundingClientRect();
        return { drawerRight: drawer.right, inspectorLeft: inspector.left };
      });
      assert(groupDrawer.drawerRight <= groupDrawer.inspectorLeft + 1, `Group drawer should stay clear of the right rail; drawer ends at ${groupDrawer.drawerRight}px and rail starts at ${groupDrawer.inspectorLeft}px`);

      // Inventory readiness is on screen, not only in the export.
      const lci = await page.$eval("#lcaReadinessSummary", el => el.textContent.trim());
      assert(/input/.test(lci), `Inventory readiness summary should report inputs, got: ${lci}`);

      // Step 5 opens a modal with the deterministic process-check results only.
      await page.click('[data-inspector-tab="heuristics"]');
      await page.waitForTimeout(300);
      await page.click("#openProcessCheck");
      await page.waitForTimeout(1500);
      const report = await page.$eval("#processCheckLocalResult", el => el.innerText);
      assert(/before scale-up/.test(report), "The local rule report should summarise conflicts before scale-up");
      await page.click("#closeProcessCheckModal");
      await page.waitForTimeout(300);

      // The flowsheet opens and draws units.
      await page.click("#openFlowsheet");
      await page.waitForTimeout(1500);
      const units = await page.$$eval("#flowsheetModal svg text", nodes => nodes.length);
      assert(units > 9, `Flowsheet should draw labelled units, found ${units} text nodes`);
      await page.keyboard.press("Escape");

      // The three findings sit in the stepper row and each one leads somewhere.
      const chips = await page.$$eval(".decision-chip", nodes => nodes.map(node => ({ id: node.dataset.decision, tone: node.className.replace("decision-chip", "").trim(), text: node.textContent.replace(/\s+/g, " ").trim() })));
      assert.deepStrictEqual(chips.map(chip => chip.id), ["capacity", "bottleneck", "gaps"], `The decision strip should show reactor, cycle and data, got ${JSON.stringify(chips)}`);
      assert(chips[0].tone === "conflict" && /m³ needed/.test(chips[0].text), `The example's reactor conflict should be the first finding, got ${JSON.stringify(chips[0])}`);
      assert(/G2 sets 20 h/.test(chips[1].text), `The example's bottleneck should be named with its cycle time, got ${JSON.stringify(chips[1])}`);
      await page.click('.decision-chip[data-decision="bottleneck"]');
      await page.waitForTimeout(400);
      assert.strictEqual(await page.$eval("#ganttModal", el => el.hidden), false, "The cycle finding should open the schedule");
      await page.click("#closeGanttModal");
      await page.click('.decision-chip[data-decision="gaps"]');
      await page.waitForTimeout(400);
      assert.strictEqual(await page.$eval("#dataQualityDetails", el => el.hidden), false, "The data finding should open the data quality detail");

      // Clearing the project must clear every card, not only the ones the empty state repaints.
      await page.click("#clearProject");
      await page.waitForTimeout(300);
      await page.click("#confirmModalOk");
      await page.waitForTimeout(500);
      const afterClear = await page.evaluate(() => ({
        blocks: state.blocks.length,
        provenance: document.getElementById("dataProvenanceSummary").textContent.trim(),
        inventory: document.getElementById("lcaReadinessSummary").textContent.trim(),
        detailsHidden: getComputedStyle(document.getElementById("dataQualityDetails")).display === "none",
        chips: document.querySelectorAll(".decision-chip").length
      }));
      assert.strictEqual(afterClear.blocks, 0, "Clear should empty the project");
      assert.strictEqual(afterClear.provenance, "No streams yet.", `Provenance must reset on clear, got: ${afterClear.provenance}`);
      assert.strictEqual(afterClear.inventory, "No streams yet.", `Inventory readiness must reset on clear, got: ${afterClear.inventory}`);
      assert(afterClear.detailsHidden, "The data quality detail must be hidden on an empty project");
      assert.strictEqual(afterClear.chips, 0, "An empty project shows the first-step hint, not findings");

      assert.deepStrictEqual(runtimeErrors, [], `Runtime errors during the smoke run: ${runtimeErrors.join(" | ")}`);
      console.log(`Browser smoke check passed (${board.groups} groups loaded at ${Math.round(board.zoom * 100)}% zoom; ${lci}).`);
    });
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
