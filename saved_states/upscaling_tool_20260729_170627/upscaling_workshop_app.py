#!/usr/bin/env python3
"""Local Python web app for annotating protocol blocks and grouping phenomena."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse


APP_HTML = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Upscaling Block Annotator</title>
  <style>
    :root {
      --bg: #f5f7f8;
      --panel: #ffffff;
      --ink: #172027;
      --muted: #657480;
      --line: #d9e1e6;
      --accent: #0f766e;
      --accent-soft: #dcf3ef;
      --blue: #2d6098;
      --blue-soft: #e4eff9;
      --green: #286d3f;
      --green-soft: #e2f2e7;
      --orange: #965d00;
      --orange-soft: #fff0d4;
      --red: #a23b3b;
      --red-soft: #f8dfdf;
    }

    * { box-sizing: border-box; }

    html {
      max-width: 100%;
      overflow-x: hidden;
    }

    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--bg);
      max-width: 100%;
      overflow-x: hidden;
    }

    header {
      min-height: 62px;
      padding: 10px 12px;
      background: #fff;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    h1, h2, h3 { margin: 0; letter-spacing: 0; line-height: 1.2; }
    h1 { font-size: 18px; }
    h2 { font-size: 13px; }
    h3 { font-size: 13px; }

    .subtitle {
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
    }

    button, input, select, textarea {
      font: inherit;
    }

    button {
      min-height: 32px;
      padding: 0 9px;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--ink);
      background: #fff;
      cursor: pointer;
      font-size: 13px;
    }

    button.primary {
      color: #fff;
      border-color: var(--accent);
      background: var(--accent);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    textarea, input[type="text"], select {
      width: 100%;
      min-height: 32px;
      padding: 7px 8px;
      border: 1px solid var(--line);
      border-radius: 7px;
      color: var(--ink);
      background: #fff;
      font-size: 12px;
    }

    textarea {
      min-height: 88px;
      resize: vertical;
      line-height: 1.45;
    }

    main {
      display: grid;
      grid-template-columns: minmax(218px, 240px) minmax(0, 1fr) minmax(260px, 300px);
      gap: 10px;
      padding: 10px;
      min-height: calc(100vh - 70px);
      width: 100%;
      max-width: 100%;
    }

    main.inspector-collapsed {
      grid-template-columns: minmax(218px, 240px) minmax(0, 1fr) 42px;
    }

    main.inspector-collapsed #inspectorPanel .panel-body {
      display: none;
    }

    main.inspector-collapsed #inspectorPanel .panel-head {
      min-height: calc(100vh - 100px);
      justify-content: center;
      align-items: flex-start;
      padding: 10px 4px;
    }

    main.inspector-collapsed #inspectorPanel h2 {
      display: none;
    }

    .panel {
      min-width: 0;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
    }

    main > .panel:first-child,
    #inspectorPanel {
      font-size: 12px;
    }

    main > .panel:first-child .panel-body,
    #inspectorPanel .panel-body {
      padding: 9px;
    }

    main > .panel:first-child button,
    #inspectorPanel button {
      min-height: 29px;
      padding: 0 7px;
      font-size: 12px;
    }

    .panel-head {
      min-height: 38px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid var(--line);
      background: #fbfcfc;
    }

    .panel-body {
      padding: 10px;
    }

    .stack { display: grid; gap: 9px; min-width: 0; }
    .row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; min-width: 0; }
    .between { justify-content: space-between; }

    .label {
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .muted { color: var(--muted); font-size: 12px; }
    .small { font-size: 11px; }

    .card {
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      min-width: 0;
    }

    .text-surface {
      min-height: 230px;
      max-height: 30vh;
      overflow: auto;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      line-height: 1.65;
      white-space: pre-wrap;
      user-select: text;
      font-size: 12px;
    }

    .annotated-block {
      display: inline;
      padding: 2px 4px;
      margin: 0 2px;
      border-radius: 5px;
      background: var(--accent-soft);
      border: 1px solid rgba(15, 118, 110, 0.35);
      cursor: pointer;
    }

    .annotated-block:after {
      content: attr(data-label);
      display: inline-flex;
      align-items: center;
      min-height: 15px;
      padding: 0 5px;
      margin-left: 4px;
      border-radius: 999px;
      background: var(--blue);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      vertical-align: 1px;
    }

    .annotated-block.selected {
      background: var(--orange-soft);
      border-color: var(--orange);
      box-shadow: 0 0 0 2px rgba(150, 93, 0, 0.15);
    }

    .annotated-block.primary-selected {
      background: var(--blue-soft);
      border-color: var(--blue);
      box-shadow: 0 0 0 2px rgba(45, 96, 152, 0.16);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 23px;
      padding: 0 7px;
      margin: 2px;
      border-radius: 999px;
      background: #eef2f4;
      color: #26343d;
      font-size: 11px;
    }

    button.pill { border: 0; }
    .pill.accent { background: var(--accent-soft); color: #0b5f59; }
    .pill.blue { background: var(--blue-soft); color: var(--blue); }
    .pill.green { background: var(--green-soft); color: var(--green); }
    .pill.warn { background: var(--orange-soft); color: var(--orange); }
    .pill.danger { background: var(--red-soft); color: var(--red); }

    .tip {
      position: relative;
    }

    .tip[data-tip]:hover {
      z-index: 140;
    }

    .hover-tip {
      position: fixed;
      z-index: 300;
      width: min(330px, 72vw);
      padding: 9px 10px;
      border: 1px solid #c9d6de;
      border-radius: 7px;
      color: #26343d;
      background: #fff;
      box-shadow: 0 12px 28px rgba(25, 35, 45, 0.18);
      font-size: 12px;
      font-weight: 500;
      line-height: 1.35;
      white-space: normal;
      pointer-events: none;
      text-transform: none;
    }

    .hover-tip[hidden] { display: none; }

    .group-flow {
      min-height: calc(100vh - 185px);
      max-height: calc(100vh - 185px);
      overflow: auto;
      position: relative;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #f7f9fa;
      cursor: default;
      overscroll-behavior: contain;
    }

    .group-box {
      position: absolute;
      width: 430px;
      padding: 12px;
      border: 2px solid var(--line);
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 5px 18px rgba(25, 35, 45, 0.06);
      user-select: none;
      z-index: 20;
    }

    .group-box.active {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft), 0 5px 18px rgba(25, 35, 45, 0.06);
    }

    .group-box:hover {
      z-index: 120;
    }

    .group-box.draft {
      border-style: dashed;
      background: #fbfcfc;
    }

    .group-box.connecting {
      border-color: var(--orange);
      box-shadow: 0 0 0 3px var(--orange-soft), 0 5px 18px rgba(25, 35, 45, 0.06);
    }

    .board-space {
      position: relative;
      min-width: 100%;
      min-height: 100%;
    }

    .board-canvas {
      position: relative;
      transform-origin: 0 0;
      width: 2400px;
      height: 1400px;
      background-color: #fbfcfd;
      background-image:
        linear-gradient(90deg, rgba(23, 32, 39, 0.10) 1px, transparent 1px),
        linear-gradient(rgba(23, 32, 39, 0.10) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 118, 110, 0.14) 1px, transparent 1px),
        linear-gradient(rgba(15, 118, 110, 0.14) 1px, transparent 1px);
      background-size: 28px 28px, 28px 28px, 140px 140px, 140px 140px;
      background-position: 0 0;
    }

    .board-canvas .group-box {
      transform-origin: 0 0;
    }

    .board-canvas .group-box {
      transform: translateZ(0);
      transform-origin: 0 0;
    }

    .link-layer {
      position: absolute;
      inset: 0;
      width: 3600px;
      height: 2200px;
      pointer-events: none;
      overflow: visible;
      z-index: 80;
    }

    .link-label {
      font-size: 12px;
      fill: var(--orange);
      font-weight: 700;
    }

    .group-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 9px;
    }

    .block-strip {
      display: flex;
      gap: 22px;
      overflow-x: auto;
      padding: 4px 3px 7px;
    }

    .block-card {
      position: relative;
      min-width: 172px;
      max-width: 230px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfc;
      cursor: pointer;
    }

    .block-card.selected {
      border-color: var(--blue);
      background: var(--blue-soft);
      box-shadow: 0 0 0 2px rgba(45, 96, 152, 0.12);
    }

    .block-card.multi {
      border-color: var(--orange);
      background: var(--orange-soft);
    }

    .block-card.connecting {
      border-color: var(--orange);
      box-shadow: 0 0 0 3px var(--orange-soft);
    }

    .block-text {
      margin: 7px 0;
      color: #2a3943;
      font-size: 12px;
      line-height: 1.35;
    }

    .group-summary {
      padding-top: 8px;
      margin-top: 8px;
      border-top: 1px solid var(--line);
    }

    .alt-grid {
      display: grid;
      gap: 7px;
      margin-top: 7px;
    }

    .alt-button {
      min-height: 32px;
      text-align: left;
      background: #fff;
    }

    .alt-button.selected {
      color: var(--blue);
      border-color: var(--blue);
      background: var(--blue-soft);
      font-weight: 700;
    }

    .phen-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px;
    }

    .phen-option {
      min-height: 28px;
      padding: 0 6px;
      text-align: left;
      font-size: 11px;
    }

    .phen-option.active {
      color: #0b5f59;
      border-color: var(--accent);
      background: var(--accent-soft);
      font-weight: 700;
    }

    .context-menu {
      position: fixed;
      z-index: 50;
      width: 275px;
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 14px 34px rgba(25, 35, 45, 0.18);
    }

    .context-menu[hidden] { display: none; }
    .context-menu button { width: 100%; margin-top: 6px; text-align: left; }

    .graph-controls {
      margin-bottom: 8px;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfc;
    }

    .eye-button {
      min-width: 34px;
      padding: 0;
      font-size: 15px;
      line-height: 1;
    }

    .zoom-readout {
      min-width: 54px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }

    .link-board {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 8px;
      align-items: end;
    }

    .link-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 6px;
      margin: 2px;
      border-radius: 6px;
      background: var(--orange-soft);
      color: var(--orange);
      font-size: 11px;
      font-weight: 700;
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .connection-status {
      color: var(--orange);
      font-size: 12px;
      font-weight: 700;
    }

    .empty {
      min-height: 150px;
      display: grid;
      place-items: center;
      padding: 16px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      text-align: center;
      background: rgba(255,255,255,0.75);
    }

    pre {
      max-height: 38vh;
      overflow: auto;
      margin: 0;
      padding: 12px;
      border-radius: 8px;
      background: #101820;
      color: #e8f1f2;
      font-size: 12px;
      line-height: 1.45;
      white-space: pre-wrap;
    }

    @media (max-width: 1240px) {
      main { grid-template-columns: 1fr; }
      .group-flow { max-height: none; }
      .text-surface { max-height: none; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Upscaling Block Annotator</h1>
      <div class="subtitle">Create blocks from selected source text, assign behavior presets, then combine separate blocks into task groups.</div>
    </div>
    <div class="row">
      <button id="loadSample">Load Sample</button>
      <button id="loadText" class="primary">Load Text View</button>
      <button id="createBlock">Create Block From Selection</button>
      <button id="exportJson">Export JSON</button>
    </div>
  </header>

  <main id="appMain">
    <section class="panel">
      <div class="panel-head">
        <h2>1. Source Text</h2>
        <span class="muted small">select text to create blocks</span>
      </div>
      <div class="panel-body stack">
        <textarea id="sourceInput" spellcheck="false" placeholder="Paste or edit the protocol text here, then load it into the annotated text view."></textarea>
        <div class="row">
          <button id="loadTextSide" class="primary">Load Text View</button>
          <button id="createBlockSide">Create Block From Selection</button>
          <button id="clearProject">Clear Blocks</button>
        </div>
        <div id="selectionInfo" class="muted">No active text selection.</div>
        <div id="annotatedText" class="text-surface"></div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>2. Block And Task Graph</h2>
        <span class="muted small">draft blocks first, task groups after combine/assign</span>
      </div>
      <div class="panel-body">
        <div class="graph-controls">
          <div class="row between">
            <div>
              <div class="label">Board Controls</div>
              <div class="muted small">Drag boxes to move them. Right-click a group, start an arrow, then click the target group.</div>
            </div>
            <div class="row">
              <button id="boardOrigin">Origin</button>
              <button id="boardCenter">Center Selection</button>
              <button id="zoomOut">-</button>
              <span id="zoomReadout" class="zoom-readout">100%</span>
              <button id="zoomIn">+</button>
              <button id="zoomReset">Board</button>
              <button id="zoomFit">Fit</button>
            </div>
          </div>
          <div id="connectionStatus" class="connection-status" style="margin-top:7px"></div>
          <div id="linkSummary" style="margin-top:7px"></div>
        </div>
        <div id="groupFlow" class="group-flow"></div>
      </div>
    </section>

    <section class="panel" id="inspectorPanel">
      <div class="panel-head">
        <h2>3. Inspector</h2>
        <button id="toggleInspector" class="eye-button" title="Show/hide inspector">◐</button>
      </div>
      <div class="panel-body stack">
        <div class="card">
          <div class="label">Selected Block</div>
          <div id="selectedBlockInfo" class="muted">No block selected.</div>
        </div>

        <div class="card stack">
          <label>
            <div class="label">Behavior Preset</div>
            <select id="behaviorSelect"></select>
          </label>
          <label>
            <div class="label">Block Text</div>
            <textarea id="blockText" style="min-height:78px"></textarea>
          </label>
          <div>
            <div class="label">Phenomena On This Block</div>
            <div id="phenomenaGrid" class="phen-grid"></div>
          </div>
        </div>

        <div class="card stack">
          <div>
            <div class="label">Selected Group</div>
            <div id="selectedGroupInfo" class="muted">No group selected.</div>
          </div>
          <label>
            <div class="label">Task Assigned To Group</div>
            <input id="groupTask" type="text" placeholder="reaction, washing, purification...">
          </label>
          <div>
            <div class="label">Group Alternatives</div>
            <div id="groupAlternatives" class="alt-grid"></div>
          </div>
        </div>

        <div class="card">
          <div class="label">Export</div>
          <pre id="jsonOut">{}</pre>
        </div>
      </div>
    </section>
  </main>

  <div id="blockMenu" class="context-menu" hidden>
    <div class="label">Block Actions</div>
    <button id="ctxStartBlockConnection" class="primary">Start Arrow From This Block</button>
    <button id="ctxRemoveBlockLinks">Remove Arrows For This Block</button>
    <button id="ctxCombine" class="primary">Combine Selected</button>
    <button id="ctxNewGroup">Create New Group For Block</button>
    <div class="label" style="margin-top:8px">Assign To Group</div>
    <select id="ctxGroupSelect"></select>
    <button id="ctxAssignGroup">Assign To Selected Group</button>
  </div>

  <div id="groupMenu" class="context-menu" hidden>
    <div class="label">Group Actions</div>
    <button id="ctxStartConnection" class="primary">Start Arrow From This Group</button>
    <button id="ctxRemoveLinks">Remove Arrows For This Group</button>
  </div>

  <div id="hoverTip" class="hover-tip" hidden></div>

  <script>
    const sampleText = `Charge benzophenone, 2-ethylhexyl cyanoacetate, cyclohexane, and ammonium acetate catalyst into a stirred reactor. Heat to reflux at 85-90 C under nitrogen. Continuously remove the water formed using a Dean-Stark trap so the condensation equilibrium is driven toward octocrylene. Cool the reaction mixture to room temperature. Wash the crude organic phase with water, then wash with brine and separate the organic layer. Dry the organic stream over anhydrous MgSO4 or Na2SO4. Filter the drying solids and remove cyclohexane under vacuum. Purify the crude product by vacuum distillation to obtain light-yellow viscous octocrylene.`;

    const phenomenaOptions = [
      "M(L)", "2phM(LS)", "2phM(LL)", "R(L)", "R(V)",
      "ES(H)", "ES(C)", "PT(VL)", "PT(LL)", "PC(VL)",
      "PC(LL)", "PC(LS)", "PS(LL)", "PS(LS)", "PS(VL)"
    ];

    const phenomenonGlossary = {
      "M(L)": "Mixing in liquid phase. Use this when the block requires homogenization, stirring, dilution, or controlled liquid addition.",
      "2phM(LS)": "Two-phase mixing, liquid-solid. Relevant when solids, catalysts, salts, drying agents, or suspended particles contact a liquid.",
      "2phM(LL)": "Two-phase mixing, liquid-liquid. Relevant for washing, extraction, emulsion risk, or mass transfer between immiscible liquids.",
      "R(L)": "Reaction in liquid phase. Use this when chemical transformation occurs primarily in the liquid bulk.",
      "R(V)": "Reaction in vapor phase. Use this when transformation occurs mainly through gaseous or vapor-phase species.",
      "ES(H)": "Energy supply, heating. Covers heat-up, reflux duty, evaporation duty, or maintaining a hot operating window.",
      "ES(C)": "Energy supply, cooling. Covers cool-down, quenching, condensation duty, or removal of heat for control.",
      "PT(VL)": "Phase transition, vapor-liquid. Relevant for boiling, evaporation, condensation, reflux, or solvent removal.",
      "PT(LL)": "Phase transfer, liquid-liquid. Relevant when a solute moves between two liquid phases during washing or extraction.",
      "PC(VL)": "Phase contact, vapor-liquid. Relevant for vapor-liquid contacting, condensation, stripping, scrubbing, or reflux.",
      "PC(LL)": "Phase contact, liquid-liquid. Relevant when two liquid phases must contact effectively before separation.",
      "PC(LS)": "Phase contact, liquid-solid. Relevant for adsorption, drying salts, catalyst contact, or solid treatment of a liquid stream.",
      "PS(LL)": "Phase separation, liquid-liquid. Relevant for settling, decanting, interface control, or organic/aqueous split.",
      "PS(LS)": "Phase separation, liquid-solid. Relevant for filtration, cake removal, drying-agent removal, or slurry clarification.",
      "PS(VL)": "Phase separation, vapor-liquid. Relevant for condensers, decanters, vents, evaporation outlets, or vapor/liquid disengagement."
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
      ["reaction preparation", "Feed tanks and dosing skid", ["M(L)", "2phM(LS)"], "Industrial charging and controlled dosing."],
      ["thermal conditioning", "Jacketed vessel heat-up/cool-down", ["ES(H)", "ES(C)"], "Thermal control around the process block."],
      ["reaction", "Jacketed batch reactor", ["M(L)", "R(L)", "ES(H)", "ES(C)"], "General liquid-phase batch reaction."],
      ["reaction", "Semi-batch reactor with reflux condenser and side decanter", ["M(L)", "R(L)", "ES(H)", "PT(VL)", "PS(VL)"], "Best match for equilibrium reaction with in-situ water removal."],
      ["reaction", "CSTR", ["M(L)", "R(L)", "ES(H)"], "Continuous option if kinetics and residence time allow it."],
      ["washing", "Single-stage mixer-settler", ["2phM(LL)", "PT(LL)", "PS(LL)"], "Liquid-liquid contacting and phase split."],
      ["washing", "Two-stage countercurrent mixer-settler train", ["2phM(LL)", "PT(LL)", "PS(LL)"], "Combines water and brine washing with lower auxiliary demand."],
      ["drying", "Fixed-bed molecular sieve dryer", ["PC(LS)", "PS(LS)"], "Regenerable industrial drying option."],
      ["drying", "Drying salts plus filtration", ["PC(LS)", "PS(LS)"], "Lab-faithful baseline with higher waste burden."],
      ["solid-liquid separation", "Nutsche filter or pressure filter", ["PS(LS)"], "Industrial solid-liquid separation."],
      ["solvent removal", "Vacuum evaporator", ["ES(H)", "PT(VL)", "PS(VL)"], "Generic solvent removal."],
      ["solvent removal", "Thin-film evaporator", ["ES(H)", "PT(VL)", "PS(VL)"], "Better for heat-sensitive or viscous product streams."],
      ["purification", "Vacuum distillation column", ["ES(H)", "PT(VL)", "PS(VL)"], "Final purification by volatility."],
      ["purification", "Short-path molecular distillation", ["ES(H)", "PT(VL)", "PS(VL)"], "Lower residence time for heat-sensitive high-boiling products."],
      ["vent abatement", "Vent condenser and activated carbon polish", ["PC(VL)", "PS(VL)"], "VOC compliance addition."],
      ["wastewater treatment", "Neutralization tank and WWT interface", ["PS(LL)"], "Industrial wastewater boundary operation."]
    ].map(([task, name, phenomena, rationale], index) => ({ id: `UO${index + 1}`, task, name, phenomena, rationale }));

    const state = {
      text: "",
      blocks: [],
      groups: {},
      links: [],
      selectedBlockId: null,
      selectedIds: [],
      menuBlockId: null,
      menuGroupId: null,
      connectingFrom: null,
      lastSelection: null,
      zoom: 0.78,
      draftPos: { x: 24, y: 24 },
      focusEndpoint: null,
      drag: null
    };

    const $ = id => document.getElementById(id);

    function nodeWidth(blockCount) {
      return Math.max(430, 92 + Math.max(1, blockCount) * 194);
    }

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
          x: 520 + count * 480,
          y: 90 + (count % 2) * 260
        };
      }
      return state.groups[groupId];
    }

    function createBlock(start, end) {
      if (start === end) return;
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      if (state.blocks.some(block => rangesOverlap(lo, hi, block.start, block.end))) {
        alert("Selection overlaps an existing block. Select unassigned text or use group actions.");
        return;
      }
      const text = state.text.slice(lo, hi).replace(/\s+/g, " ").trim();
      if (!text) return;
      const behavior = inferBehavior(text);
      const preset = behaviorPresets[behavior];
      const block = {
        id: nextBlockId(),
        groupId: null,
        start: lo,
        end: hi,
        text,
        behavior,
        phenomena: [...preset.phenomena],
        phase: "",
        endpoint: "",
        status: "needs validation"
      };
      state.blocks.push(block);
      state.selectedBlockId = block.id;
      state.selectedIds = [block.id];
      state.focusEndpoint = block.id;
      renderAll();
    }

    function rangesOverlap(a1, a2, b1, b2) {
      return Math.max(a1, b1) < Math.min(a2, b2);
    }

    function selectedBlock() {
      return state.blocks.find(block => block.id === state.selectedBlockId) || null;
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
      return unitCatalog
        .map(unit => {
          const overlap = unit.phenomena.filter(item => phen.has(item));
          const sameTask = unit.task === group.task;
          const score = overlap.length + (sameTask ? 4 : 0);
          return { ...unit, overlap, sameTask, score };
        })
        .filter(unit => unit.score > 0)
        .sort((a, b) => b.score - a.score || Number(b.sameTask) - Number(a.sameTask));
    }

    function alternativeReason(candidate) {
      const fit = [];
      if (candidate.sameTask) fit.push("it matches the assigned task");
      if (candidate.overlap?.length) fit.push(`it covers ${candidate.overlap.join(", ")}`);
      const basis = fit.length ? fit.join(" and ") : "it is a related heuristic option";
      return `${candidate.rationale} Use this when ${basis}.`;
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
      state.text = $("sourceInput").value;
      state.blocks = [];
      state.groups = {};
      state.links = [];
      state.selectedBlockId = null;
      state.selectedIds = [];
      state.connectingFrom = null;
      state.lastSelection = null;
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
      return { start, end };
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
      }
      return {
        start: Math.min(source.selectionStart, source.selectionEnd),
        end: Math.max(source.selectionStart, source.selectionEnd)
      };
    }

    function rememberSelection() {
      const offsets = selectionOffsets() || sourceInputSelection();
      state.lastSelection = offsets;
      $("selectionInfo").textContent = offsets
        ? `Selected characters ${offsets.start}-${offsets.end}.`
        : "No active text selection.";
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
      blocks.forEach(block => {
        html += escapeHtml(state.text.slice(cursor, block.start));
        const classes = [
          "annotated-block",
          state.selectedIds.includes(block.id) ? "selected" : "",
          state.selectedBlockId === block.id ? "primary-selected" : ""
        ].filter(Boolean).join(" ");
        html += `<span class="${classes}" data-label="${escapeAttr(block.id)}" data-block-id="${block.id}" title="${escapeAttr(block.id)} / ${escapeAttr(block.groupId || "ungrouped")}">${escapeHtml(state.text.slice(block.start, block.end))}</span>`;
        cursor = block.end;
      });
      html += escapeHtml(state.text.slice(cursor));
      root.innerHTML = html;

      root.querySelectorAll("[data-block-id]").forEach(span => {
        span.addEventListener("click", event => {
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
    }

    function selectBlock(blockId, additive) {
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
        const active = group.blocks.some(block => state.selectedIds.includes(block.id));
        return `
          <section class="group-box ${active ? "active" : ""} ${state.connectingFrom === group.id ? "connecting" : ""}" style="left:${group.x}px; top:${group.y}px; width:${nodeWidth(group.blocks.length)}px" data-group-box="${group.id}" data-node-id="${group.id}">
            <div class="group-head">
              <div class="row">
                <strong>${escapeHtml(group.id)}</strong>
                <span class="pill blue">${escapeHtml(group.task)}</span>
              </div>
              <span class="pill">${group.blocks.length} block${group.blocks.length === 1 ? "" : "s"}</span>
            </div>
            <div class="block-strip">
              ${group.blocks.map(block => blockCardHtml(block)).join("")}
            </div>
            <div class="group-summary">
              <div class="label">Summed Phenomena</div>
              ${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted">No phenomena assigned.</span>`}
              <div style="margin-top:6px">${linksForGroup(group.id).map(link => `<span class="link-chip">${escapeHtml(formatLink(link, group.id))}</span>`).join("")}</div>
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

      root.querySelectorAll("[data-group-box]").forEach(box => {
        box.addEventListener("click", event => {
          if (event.target.closest("[data-block-card]") || event.target.closest("[data-unit]")) return;
          if (state.connectingFrom && state.connectingFrom !== box.dataset.groupBox) {
            addConnection(state.connectingFrom, box.dataset.groupBox);
            return;
          }
          const first = blocksForGroup(box.dataset.groupBox)[0];
          if (first) selectBlock(first.id, false);
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

      revealFocusedEndpoint();
    }

    function renderLinksSvg(board) {
      const nodeMasks = allNodeRects().map(rect => {
        const masked = shrinkRect(rect, 7);
        return `<rect x="${round(masked.x)}" y="${round(masked.y)}" width="${round(masked.w)}" height="${round(masked.h)}" rx="7" fill="black"></rect>`;
      }).join("");
      const links = state.links.map(link => {
        const route = connectionRoute(link.from, link.to);
        if (!route) return "";
        const path = orthogonalPath(route.points);
        const start = route.points[0];
        return `
          <path d="${path}" stroke="#fff7ed" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none" mask="url(#nodeTextMask)"></path>
          <path d="${path}" stroke="#c76500" stroke-width="3.25" stroke-linecap="round" stroke-linejoin="round" fill="none" marker-end="url(#arrowHead)" mask="url(#nodeTextMask)"></path>
          <circle cx="${round(start.x)}" cy="${round(start.y)}" r="4.2" fill="#fff7ed" stroke="#c76500" stroke-width="2"></circle>
        `;
      }).join("");
      return `
        <svg class="link-layer" style="width:${board.width}px; height:${board.height}px" viewBox="0 0 ${board.width} ${board.height}">
          <defs>
            <marker id="arrowHead" markerWidth="13" markerHeight="13" refX="10.5" refY="4.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,9 L12,4.5 z" fill="#c76500"></path>
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
        h: 255
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
        h: 142
      };
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

    function orthogonalPath(points) {
      if (!points.length) return "";
      return points
        .map((point, index) => `${index ? "L" : "M"} ${round(point.x)} ${round(point.y)}`)
        .join(" ");
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
      return `
        <article class="block-card ${state.selectedBlockId === block.id ? "selected" : ""} ${state.selectedIds.includes(block.id) ? "multi" : ""} ${state.connectingFrom === block.id ? "connecting" : ""}" data-block-card="${block.id}" data-node-id="${block.id}">
          <div class="row between">
            <strong>${block.id}</strong>
            <span class="pill accent">${escapeHtml(block.behavior)}</span>
          </div>
          <div class="block-text">${escapeHtml(block.text)}</div>
          <div>${block.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted small">No phenomena</span>`}</div>
        </article>
      `;
    }

    function renderInspector() {
      const block = selectedBlock();
      const hasBlock = Boolean(block);
      ["behaviorSelect", "blockText"].forEach(id => $(id).disabled = !hasBlock);
      $("selectedBlockInfo").innerHTML = block
        ? `<strong>${block.id}</strong> <span class="pill">${escapeHtml(block.groupId || "ungrouped")}</span><div style="margin-top:6px">${escapeHtml(block.text)}</div>`
        : "No block selected.";
      $("behaviorSelect").value = block?.behavior || "unassigned";
      $("blockText").value = block?.text || "";
      renderPhenomenaGrid(block);

      const group = block ? groupModel(block.groupId) : null;
      $("groupTask").disabled = !group;
      $("selectedGroupInfo").innerHTML = group
        ? `<strong>${escapeHtml(group.id)}</strong><div style="margin-top:6px">Blocks: ${group.blocks.map(item => `<span class="pill">${item.id}</span>`).join("")}</div><div style="margin-top:6px">${group.phenomena.map(p => phenomenonPill(p)).join("") || `<span class="muted">No phenomena.</span>`}</div>`
        : "This block is not assigned to a task group yet.";
      $("groupTask").value = group?.task || "";
      renderGroupAlternatives(group);
      renderExport();
    }

    function renderPhenomenaGrid(block) {
      $("phenomenaGrid").innerHTML = phenomenaOptions.map(phen => {
        const active = block?.phenomena.includes(phen);
        return phenomenonOptionButton(phen, active, !block);
      }).join("");
      document.querySelectorAll("[data-phen]").forEach(button => {
        button.addEventListener("click", () => {
          const block = selectedBlock();
          if (!block) return;
          const phen = button.dataset.phen;
          block.phenomena = block.phenomena.includes(phen)
            ? block.phenomena.filter(item => item !== phen)
            : [...block.phenomena, phen];
          renderAll();
        });
      });
    }

    function renderGroupAlternatives(group) {
      if (!group) {
        $("groupAlternatives").innerHTML = `<span class="muted">No group selected.</span>`;
        return;
      }
      const candidates = matchesForGroup(group).slice(0, 6);
      $("groupAlternatives").innerHTML = candidates.length ? candidates.map(candidate => `
        <button class="alt-button tip ${group.selectedUnit === candidate.name ? "selected" : ""}" data-inspector-unit="${escapeAttr(candidate.name)}" data-tip="${escapeAttr(alternativeReason(candidate))}">
          ${escapeHtml(candidate.name)}
          <span class="pill ${candidate.sameTask ? "blue" : "warn"}">${candidate.sameTask ? "same task" : "related"}</span>
        </button>
      `).join("") : `<span class="muted">Assign phenomena to get alternatives.</span>`;
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
      const preset = behaviorPresets[behavior] || behaviorPresets.unassigned;
      block.behavior = behavior;
      block.phenomena = [...preset.phenomena];
      if (block.groupId) ensureGroup(block.groupId).task = preset.task;
      renderAll();
    }

    function combineSelected() {
      const ids = state.selectedIds.filter(id => state.blocks.some(block => block.id === id));
      if (ids.length < 2) return;
      const groupId = nextGroupId();
      ensureGroup(groupId, "unassigned");
      ids.forEach(id => {
        const block = state.blocks.find(item => item.id === id);
        block.groupId = groupId;
      });
      const group = groupModel(groupId);
      state.groups[groupId].task = inferGroupTask(group);
      state.selectedBlockId = ids[0];
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
      const groupId = nextGroupId();
      const task = behaviorPresets[block.behavior]?.task || "unassigned";
      ensureGroup(groupId, task);
      block.groupId = groupId;
      state.selectedIds = [block.id];
      state.focusEndpoint = groupId;
      renderAll();
    }

    function assignSelectedToGroup(groupId) {
      if (!groupId) return;
      ensureGroup(groupId);
      const ids = state.selectedIds.length ? state.selectedIds : [state.selectedBlockId];
      ids.filter(Boolean).forEach(id => {
        const block = state.blocks.find(item => item.id === id);
        if (block) block.groupId = groupId;
      });
      state.focusEndpoint = groupId;
      renderAll();
    }

    function renderContextMenuOptions() {
      const ids = groupIdsInTextOrder();
      $("ctxGroupSelect").innerHTML = ids.map(id => `<option value="${id}">${id}</option>`).join("");
      $("ctxCombine").disabled = state.selectedIds.length < 2;
      $("ctxAssignGroup").disabled = ids.length === 0;
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
        ? state.links.map((link, index) => `<span class="link-chip">${escapeHtml(link.from)} -> ${escapeHtml(link.to)} <button class="pill danger" data-remove-link="${index}">x</button></span>`).join("")
        : `<span class="muted small">No arrows yet.</span>`;

      document.querySelectorAll("[data-remove-link]").forEach(button => {
        button.addEventListener("click", () => {
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
      const menu = $("blockMenu");
      menu.hidden = false;
      menu.style.left = `${Math.min(x, window.innerWidth - 295)}px`;
      menu.style.top = `${Math.min(y, window.innerHeight - 250)}px`;
    }

    function hideBlockMenu() {
      $("blockMenu").hidden = true;
      state.menuBlockId = null;
    }

    function showGroupMenu(x, y, groupId) {
      state.menuGroupId = groupId;
      hideBlockMenu();
      const menu = $("groupMenu");
      menu.hidden = false;
      menu.style.left = `${Math.min(x, window.innerWidth - 295)}px`;
      menu.style.top = `${Math.min(y, window.innerHeight - 190)}px`;
    }

    function hideGroupMenu() {
      $("groupMenu").hidden = true;
      state.menuGroupId = null;
    }

    function closeFloatingActions() {
      state.connectingFrom = null;
      hideBlockMenu();
      hideGroupMenu();
    }

    function removeLinksForGroup(groupId) {
      state.links = state.links.filter(link => link.from !== groupId && link.to !== groupId);
      renderAll();
    }

    function removeLinksForEndpoint(endpointId) {
      state.links = state.links.filter(link => link.from !== endpointId && link.to !== endpointId);
      renderAll();
    }

    function boardOrigin() {
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
      const width = Math.min(330, window.innerWidth * 0.72);
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

    function renderExport() {
      const groups = groupIdsInTextOrder().map(groupId => {
        const group = groupModel(groupId);
        return {
          groupId: group.id,
          task: group.task,
          blocks: group.blocks.map(block => block.id),
          phenomena: group.phenomena,
          selectedUnit: group.selectedUnit
        };
      });
      $("jsonOut").textContent = JSON.stringify({
        workflow: "source text -> annotated blocks -> behavior presets -> phenomenon groups -> task/unit alternatives",
        text: state.text,
        blocks: blocksInOrder(),
        groups,
        links: state.links
      }, null, 2);
    }

    function renderAll() {
      renderAnnotatedText();
      renderLinkControls();
      renderGroupFlow();
      renderInspector();
      renderContextMenuOptions();
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
    $("sourceInput").value = sampleText;

    $("loadSample").addEventListener("click", () => {
      $("sourceInput").value = sampleText;
      loadTextView();
    });
    $("loadText").addEventListener("click", loadTextView);
    $("loadTextSide").addEventListener("click", loadTextView);
    $("createBlock").addEventListener("click", createBlockFromSelection);
    $("createBlockSide").addEventListener("click", createBlockFromSelection);
    $("clearProject").addEventListener("click", () => {
      state.blocks = [];
      state.groups = {};
      state.links = [];
      state.draftPos = { x: 24, y: 24 };
      state.connectingFrom = null;
      state.focusEndpoint = null;
      state.zoom = 0.78;
      state.selectedIds = [];
      state.selectedBlockId = null;
      renderAll();
    });
    $("exportJson").addEventListener("click", renderExport);
    $("boardOrigin").addEventListener("click", boardOrigin);
    $("boardCenter").addEventListener("click", centerSelection);
    $("zoomOut").addEventListener("click", () => setZoom(state.zoom / 1.35));
    $("zoomIn").addEventListener("click", () => setZoom(state.zoom * 1.35));
    $("zoomReset").addEventListener("click", () => setZoom(0.78));
    $("zoomFit").addEventListener("click", fitBoard);
    $("toggleInspector").addEventListener("click", toggleInspector);
    $("groupFlow").addEventListener("wheel", handleGraphWheel, { passive: false });

    $("annotatedText").addEventListener("mouseup", rememberSelection);
    $("annotatedText").addEventListener("keyup", rememberSelection);
    $("sourceInput").addEventListener("mouseup", rememberSelection);
    $("sourceInput").addEventListener("keyup", rememberSelection);

    $("behaviorSelect").addEventListener("change", event => applyBehavior(event.target.value));
    $("blockText").addEventListener("input", event => {
      const block = selectedBlock();
      if (!block) return;
      block.text = event.target.value;
      renderAll();
    });
    $("groupTask").addEventListener("input", event => {
      const block = selectedBlock();
      if (!block) return;
      ensureGroup(block.groupId).task = event.target.value;
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

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeFloatingActions();
      renderAll();
    });
    document.addEventListener("mouseover", showHoverTip);
    document.addEventListener("mousemove", moveHoverTip);
    document.addEventListener("mouseout", hideHoverTip);
    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);

    loadTextView();
  </script>
</body>
</html>
"""


class AppHandler(BaseHTTPRequestHandler):
    def do_HEAD(self):
        if self.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        body = APP_HTML.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

    def do_GET(self):
        if self.path not in ("/", "/index.html"):
            self.send_error(404)
            return
        body = APP_HTML.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def main():
    parser = argparse.ArgumentParser(description="Run the upscaling block annotator.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    print(f"Upscaling Block Annotator running at http://{args.host}:{args.port}")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


if __name__ == "__main__":
    main()
