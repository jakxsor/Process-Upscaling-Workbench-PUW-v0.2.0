#!/usr/bin/env python3
"""Local Python web app for annotating protocol blocks and grouping phenomena."""

import argparse
import json
import os
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import error, parse, request

from .pyflowsheet_renderer import render_pyflowsheet_svg

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


def _read_static(filename):
    with open(os.path.join(STATIC_DIR, filename), "r", encoding="utf-8") as f:
        return f.read()


APP_HTML = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Upscaling Block Annotator</title>
  <link rel="stylesheet" href="/style.css">
  <script>
    (function () {
      try {
        var saved = localStorage.getItem("theme");
        if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
      } catch (e) {}
    })();
  </script>
</head>
<body>
  <header>
    <div>
      <h1>Upscaling Block Annotator</h1>
      <div class="subtitle">Lab protocol to industrial flowsheet: blocks, phenomena, unit operations, network, heuristics, and scale-up schedule.</div>
    </div>
    <div class="row">
      <button id="themeToggle" class="eye-button" title="Toggle dark/light theme">◐</button>
      <button id="undoAction" title="Undo last change (Ctrl/Cmd+Z)" disabled>↶ Undo</button>
      <button id="openTutorial" title="Open a short guided tour of the main workflow">Tutorial</button>
      <div class="header-dropdown">
        <button id="loadExampleToggle" aria-haspopup="true" aria-expanded="false">Load example ▾</button>
        <div id="loadExampleMenu" class="header-dropdown-menu" hidden role="menu">
          <button id="loadSample" role="menuitem">Octocrylene Case</button>
          <button id="loadMethylbenzeneCase" role="menuitem">Methylbenzene Case</button>
        </div>
      </div>
      <button id="openFlowsheet" title="Open the editable flowsheet board generated from the current groups and streams">Flowsheet View</button>
      <button id="exportJson">Export JSON</button>
    </div>
  </header>

  <nav id="workflowStepper" class="workflow-stepper" aria-label="Upscaling workflow steps"></nav>

  <main id="appMain">
    <section class="panel">
      <div class="panel-head source-panel-head">
        <div>
          <h2>Workflow Input</h2>
          <span class="muted small">Text first, board controls when needed</span>
        </div>
        <div class="source-panel-tabs" role="tablist" aria-label="Source and board controls">
          <button class="source-panel-tab active" data-source-tab="protocol" role="tab">Protocol</button>
          <button class="source-panel-tab" data-source-tab="board" role="tab">Board</button>
        </div>
      </div>
      <div class="panel-body stack">
        <div id="sourceProtocolTab" class="source-tab-view stack">
          <textarea id="sourceInput" spellcheck="false" placeholder="Paste or edit the protocol text here, then load it into the annotated text view."></textarea>
          <div class="row">
            <button id="loadTextSide" class="primary">Load Text View</button>
            <button id="createBlockSide">Create Block From Selection</button>
            <button id="clearProject">Clear Blocks</button>
          </div>
          <div id="selectionInfo" class="muted">No active text selection.</div>
          <div id="annotatedText" class="text-surface"></div>
        </div>
        <div id="sourceBoardTab" class="source-tab-view stack" hidden>
          <div class="graph-controls">
            <div class="board-control-head">
              <div class="label">Board Controls</div>
              <div class="muted small">Drag boxes to move them. Right-click a group, start an arrow, then click the target group.</div>
            </div>
            <div class="board-control-section">
              <div class="label">Step 1-3 Audit</div>
              <div class="muted small">Block data, phenomena, task grouping, and unit-operation evidence.</div>
              <div id="stepAuditPanel" class="step-audit-panel"></div>
            </div>
            <div class="board-control-section">
              <div class="label">Network</div>
              <button id="autoConnect" class="primary" title="Connect task groups in text order and add recycle arrows from declared stream destinations">Auto-Connect</button>
              <div id="connectionStatus" class="connection-status"></div>
              <div id="linkSummary"></div>
              <div id="networkClosure" class="closure-strip"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel workflow-panel">
      <div class="panel-head">
        <div class="workflow-title-stack">
          <h2>Blocks, Tasks & Network</h2>
          <span class="muted small">Steps 1-4 — draft blocks, task groups, then arrows to close the network</span>
        </div>
        <div class="workflow-view-tools" aria-label="Board view controls">
          <button id="toggleCompact" title="Switch group boxes between full detail and compact icon + label view">Compact</button>
          <button id="autoLayout" title="Rearrange task groups into a compact left-to-right grid without changing block/group content">Auto-Layout</button>
          <button id="resetView" title="Scroll back to the top-left corner and reset zoom to the default level">Reset</button>
          <button id="boardCenter" title="Scroll to and zoom in on the currently selected block or group">Center</button>
          <button id="zoomFit" title="Zoom out just enough to fit every block and group on screen">Fit</button>
          <div class="workflow-zoom-row">
            <button id="zoomOut" title="Zoom out">-</button>
            <span id="zoomReadout" class="zoom-readout">100%</span>
            <button id="zoomIn" title="Zoom in">+</button>
          </div>
        </div>
      </div>
      <div class="panel-body">
        <div id="groupFlow" class="group-flow"></div>
        <div id="stepFlowInspector" class="step-flow-inspector empty">Select a block to add quantified MFA inputs, outputs, and waste/emission streams.</div>
      </div>
    </section>

    <section class="panel" id="inspectorPanel">
      <div class="panel-head">
        <button id="toggleInspector" class="eye-button" title="Show/hide Phenomena/Group panel">◐</button>
        <div class="panel-tabs" role="tablist" aria-label="Workflow categories">
          <button class="panel-tab active" data-inspector-tab="inspect" role="tab">Phenomena/Group</button>
          <button class="panel-tab" data-inspector-tab="heuristics" role="tab">Heuristics</button>
          <button class="panel-tab" data-inspector-tab="scale" role="tab">Scale-Up</button>
        </div>
      </div>
      <div class="panel-body stack">
        <div id="inspectPanelTab" class="tab-view stack">
          <div class="card stack">
            <div>
              <div class="label">Selected Description</div>
              <div id="selectedBlockInfo" class="muted">No block selected.</div>
            </div>
            <label>
              <div class="label">Description Text</div>
              <textarea id="blockText" class="description-editor" placeholder="Select or create a block, then refine the extracted description here."></textarea>
            </label>
            <label>
              <div class="label">Details & Notes</div>
              <textarea id="blockNotes" class="description-notes" placeholder="Add missing words, interpretation notes, assumptions, citations, or why this block was extended."></textarea>
            </label>
          </div>

          <div class="card stack">
            <label>
              <div class="label">Behavior Preset</div>
              <select id="behaviorSelect" class="behavior-select"></select>
            </label>
            <div id="behaviorPresetHelp" class="behavior-preset-help muted small"></div>
            <div>
              <div class="label">Phenomena On This Block</div>
              <div id="phenomenaGrid" class="phen-grid"></div>
            </div>
          </div>

          <div class="card">
            <div class="label">Export</div>
            <pre id="jsonOut">{}</pre>
          </div>

          <div class="card stack">
            <div class="row between">
              <div>
                <div class="label">Data Readiness</div>
                <div id="dataReadinessSummary" class="muted small">No project data yet.</div>
              </div>
              <button id="toggleReadiness" class="mini-button">Details</button>
            </div>
            <div id="dataReadinessPanel" hidden></div>
          </div>
        </div>

        <div id="heuristicsPanelTab" class="tab-view scale-tab" hidden>
          <section class="card stack scale-sticky-card">
            <div class="scale-run-row">
              <div>
                <div class="label">Heuristic Rules</div>
                <div class="muted small">Pre-scale screening before numerical scale-up.</div>
              </div>
              <button id="refineProjectAi" class="primary">Apply Rules</button>
              <span class="muted small">process checker; external API optional</span>
            </div>
          </section>

          <div class="scale-scroll-body stack">
            <section class="card stack">
              <div>
                <div class="label">Triggered Rules</div>
                <div class="muted small">Only rules involved in the current synthesis are shown here.</div>
              </div>
              <div id="heuristicsPanel"></div>
            </section>

            <section class="card stack">
              <div>
                <div class="label">Review Results</div>
                <div class="muted small">Conflicts and missing information detected before scale-up.</div>
              </div>
              <div id="heuristicRuleCheckPanel" class="rule-results"></div>
            </section>
          </div>
        </div>

        <div id="scalePanelTab" class="tab-view scale-tab" hidden>
          <section class="card stack scale-sticky-card">
            <div class="scale-run-row">
              <div>
                <div class="label">Scale-Up & Gantt Control</div>
                <div class="muted small">Numerical scale-up and bottleneck review after heuristic screening.</div>
              </div>
              <button id="refineProject" class="primary">Run Check</button>
            </div>
            <div id="scaleQuickPanel"></div>
            <div class="muted small">Results (conflicts and missing data) appear under the Heuristics tab's Review Results.</div>
          </section>

          <div class="scale-scroll-body stack">
            <section class="card stack">
              <div>
                <div class="label">Scale-Up & Gantt Details</div>
                <div class="muted small">Schedule, correction factors, scaled MFA, recycle/fate, and energy bridge.</div>
              </div>
              <div id="scaleBasisPanel"></div>
            </section>
          </div>
        </div>

      </div>
    </section>
  </main>

  <div id="blockMenu" class="context-menu" hidden>
    <div class="label">Arrows</div>
    <button id="ctxStartBlockConnection" class="primary">Start Arrow From This Block</button>
    <button id="ctxRemoveBlockLinks">Remove Arrows For This Block</button>

    <div class="label" style="margin-top:10px">Task Grouping (Step 3) — keeps blocks separate</div>
    <button id="ctxCombine" class="primary" title="Group the selected blocks under one new task (Gx). Blocks stay separate and keep their own text/streams/conditions; the group just bundles them for a shared unit operation.">Group Into New Task</button>
    <button id="ctxNewGroup" title="Put only this block into its own new task group, on its own.">Put This Block In Its Own Task</button>
    <select id="ctxGroupSelect"></select>
    <button id="ctxAssignGroup" title="Add the selected block(s) to the task group chosen above, instead of creating a new one.">Assign To Selected Task Above</button>
    <button id="ctxRemoveFromGroup" title="Take this block out of its task group. It becomes an ungrouped draft block again; nothing about the block itself changes.">Remove From Task Group</button>

    <div class="label" style="margin-top:10px">Scale-Up</div>
    <button id="ctxSplitBlockGroup" title="Split the task group that contains this block into parallel units">Split This Task Group</button>

    <div class="label" style="margin-top:10px">Block Editing (Step 1) — changes the blocks themselves</div>
    <button id="ctxMergeBlocks" title="Fuse the selected adjacent blocks into a single block: their text is concatenated and their streams/phenomena/conditions are combined into one. The block count goes down — this cannot be split back automatically.">Merge Into One Block</button>
    <button id="ctxDeleteBlock" class="danger-button">Delete Block</button>
  </div>

  <div id="groupMenu" class="context-menu" hidden>
    <div class="label">Group Actions</div>
    <button id="ctxStartConnection" class="primary">Start Arrow From This Group</button>
    <button id="ctxRemoveLinks">Remove Arrows For This Group</button>
    <button id="ctxAddManualBlockToGroup">Add Empty Block To This Task</button>
    <div class="label" style="margin-top:10px">Scale-Up</div>
    <button id="ctxSplitGroup" title="Split this group into N parallel units, each handling 1/N of its material flow while keeping declared durations until resized estimates are entered">Split Into Parallel Units</button>
  </div>

  <div id="streamMenu" class="context-menu" hidden>
    <div class="label">Stream Actions</div>
    <button id="ctxEditStream" class="primary">Edit</button>
    <button id="ctxDeleteStream">Delete</button>
  </div>

  <div id="pubchemResolveModal" class="modal-backdrop" hidden>
    <section class="modal-card pubchem-resolve-panel" role="dialog" aria-modal="true" aria-labelledby="pubchemResolveTitle">
      <div class="modal-head">
        <div>
          <h2 id="pubchemResolveTitle">Resolve PubChem Compound</h2>
          <p id="pubchemResolveSubtitle">Search manually by compound name or CAS number.</p>
        </div>
        <button id="closePubchemResolve">Close</button>
      </div>
      <div id="pubchemResolveBody" class="modal-body"></div>
    </section>
  </div>

  <div id="textSelectionMenu" class="context-menu" hidden>
    <div class="label">Block Creation</div>
    <button id="ctxCreateBlockFromText" class="primary">Create Block From Selection</button>
    <button id="ctxCreateManualBlock">New Empty Block</button>
  </div>

  <div id="hoverTip" class="hover-tip" hidden></div>

  <div id="tutorialOverlay" class="tutorial-overlay" hidden>
    <div id="tutorialSpotlight" class="tutorial-spotlight"></div>
    <section id="tutorialCard" class="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
      <div class="tutorial-progress" id="tutorialProgress">1 / 7</div>
      <h2 id="tutorialTitle">Tutorial</h2>
      <p id="tutorialBody"></p>
      <div id="tutorialDetail" class="tutorial-detail"></div>
      <div class="tutorial-actions">
        <button id="tutorialPrev" class="mini-button">Back</button>
        <button id="tutorialDo" class="mini-button" hidden>Show</button>
        <button id="tutorialNext" class="primary">Next</button>
        <button id="tutorialSkip" class="mini-button">Close</button>
      </div>
    </section>
  </div>

  <div id="splitGroupModal" class="modal-backdrop" hidden>
    <section class="modal-panel split-group-panel" role="dialog" aria-modal="true" aria-labelledby="splitGroupTitle">
      <div class="modal-head">
        <div>
          <div class="label">Scale-up bottleneck relief</div>
          <h2 id="splitGroupTitle">Split <span id="splitGroupIdLabel"></span> Into Parallel Units</h2>
        </div>
        <button id="closeSplitGroupModal" class="mini-button">Close</button>
      </div>
      <div class="modal-body">
        <div id="splitGroupWarning" class="muted small" hidden></div>
        <label class="split-n-label">
          Split into
          <input type="number" min="2" max="20" step="1" id="splitGroupN" value="2">
          parallel units
        </label>
        <label class="split-mode-row">
          <input type="checkbox" id="splitGroupDivideDuration">
          <span>Divide Gantt duration as a bottleneck-time screening estimate</span>
        </label>
        <div id="splitGroupPreview" class="muted small"></div>
        <div class="row between" style="margin-top:8px">
          <button id="cancelSplitGroup">Cancel</button>
          <button id="confirmSplitGroup" class="primary">Split</button>
        </div>
      </div>
    </section>
  </div>

  <div id="confirmModal" class="modal-backdrop" hidden>
    <section class="modal-panel confirm-panel" role="dialog" aria-modal="true" aria-labelledby="confirmModalTitle">
      <div class="modal-head">
        <div>
          <h2 id="confirmModalTitle">Confirm</h2>
        </div>
      </div>
      <div class="modal-body">
        <div id="confirmModalMessage" class="confirm-modal-message"></div>
        <label id="confirmModalPromptRow" class="confirm-modal-prompt-row" hidden>
          <input type="text" id="confirmModalPromptInput">
        </label>
        <div class="row between" style="margin-top:12px">
          <button id="confirmModalCancel">Cancel</button>
          <button id="confirmModalOk" class="primary">OK</button>
        </div>
      </div>
    </section>
  </div>

  <div id="flowsheetModal" class="modal-backdrop" hidden>
    <section class="modal-panel flowsheet-panel" role="dialog" aria-modal="true" aria-labelledby="flowsheetTitle">
      <div class="modal-head">
        <div>
          <div class="label">Generated from the current project</div>
          <h2 id="flowsheetTitle">Flowsheet View</h2>
        </div>
        <div class="row flowsheet-toolbar">
          <button id="flowsheetEditableMode" class="mini-button primary" title="Interactive board with draggable units, hover details, and editable labels">Editable Board</button>
          <button id="flowsheetTechnicalMode" class="mini-button" title="Server-rendered technical PFD with formal equipment symbols (falls back to the editable board if unavailable)">Technical PFD</button>
          <span class="flowsheet-toolbar-divider"></span>
          <button id="fitFlowsheetView" class="mini-button primary" title="Fit the generated flowsheet inside the modal for overview">Fit View</button>
          <button id="resetFlowsheetLayout" class="mini-button" title="Move every unit back to the automatic left-to-right layout">Reset Layout</button>
          <button id="downloadFlowsheet" class="mini-button">Download SVG</button>
          <span class="flowsheet-toolbar-divider"></span>
          <button id="closeFlowsheetModal" class="flowsheet-close-button" title="Close" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="flowsheet-hint">PFD-style board generated from groups, streams, recycle, waste, and selected unit operations. Drag units to refine the layout; double-click a unit label to edit it.</div>
      <div class="modal-body">
        <div id="flowsheetHost" class="flowsheet-host"></div>
      </div>
    </section>
  </div>

  <div id="separationSimulatorModal" class="modal-backdrop" hidden>
    <section class="modal-panel separation-simulator-panel" role="dialog" aria-modal="true" aria-labelledby="separationSimulatorTitle">
      <div class="modal-head">
        <div>
          <div class="label">Optional KB3.1 sandbox</div>
          <h2 id="separationSimulatorTitle">Separation Simulator</h2>
        </div>
        <button id="closeSeparationSimulator" class="mini-button">Close</button>
      </div>
      <div id="separationSimulatorBody" class="modal-body"></div>
    </section>
  </div>

  <div id="aiRefineModal" class="modal-backdrop" hidden>
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="aiRefineTitle">
      <div class="modal-head">
        <div>
          <div class="label">Heuristic Rule Application</div>
          <h2 id="aiRefineTitle">Process Rule Check & External API</h2>
        </div>
        <button id="closeAiRefineModal" class="mini-button">Close</button>
      </div>
      <div class="modal-body">
        <div class="modal-columns">
          <div class="modal-column">
            <section class="modal-section modal-controls-card">
              <div>
                <div class="label">Rule Scopes</div>
                <div class="muted small">Select which parts of the built process are checked against the heuristic rules.</div>
              </div>
              <div class="rule-scope-grid">
                <label><input type="checkbox" data-rule-scope="sequence" checked> Sequence & thermal logic</label>
                <label><input type="checkbox" data-rule-scope="mfa" checked> MFA / material closure</label>
                <label><input type="checkbox" data-rule-scope="phases" checked> Phase & unit compatibility</label>
                <label><input type="checkbox" data-rule-scope="conditions" checked> Condition conflicts</label>
                <label><input type="checkbox" data-rule-scope="recycle" checked> Recycle / purge closure</label>
                <label><input type="checkbox" data-rule-scope="scale" checked> Scale-up & bottleneck</label>
              </div>
              <button id="rerunLocalRuleApplication">Apply Selected Checks</button>
            </section>

            <section class="modal-section">
              <div class="label">Local Process Report</div>
              <div class="muted small">Deterministic checks from the current board data.</div>
              <div id="aiRefineLocalResult" class="rule-results"></div>
            </section>
          </div>

          <div class="modal-column">
            <section class="modal-section external-analysis-section">
              <div>
                <div class="label">External Process Analysis</div>
                <div class="muted small">Expected output: commentary, problems, missing data, cited heuristic rules, and next actions.</div>
              </div>
              <div class="external-settings-grid">
                <label>
                  <div class="label">API key override</div>
                  <input id="aiApiKey" type="password" placeholder="temporary key only">
                </label>
                <label>
                  <div class="label">Model</div>
                  <input id="aiModel" type="text" list="aiModelOptions" placeholder="blank = server OPENAI_MODEL or default">
                  <datalist id="aiModelOptions">
                    <option value="gpt-5-mini">
                    <option value="gpt-5">
                    <option value="gpt-4.1-mini">
                    <option value="gpt-4.1">
                    <option value="o3">
                  </datalist>
                </label>
                <label>
                  <div class="label">Report style</div>
                  <select id="aiReportStyle">
                    <option value="commentary_summary">Commentary + action summary</option>
                    <option value="strict_table">Strict problem table</option>
                    <option value="short_triage">Short triage only</option>
                  </select>
                </label>
                <label>
                  <div class="label">Endpoint</div>
                  <input id="aiEndpoint" type="text" value="https://api.openai.com/v1/responses">
                </label>
                <label class="external-toggle-row">
                  <input id="aiUseWebReferences" type="checkbox" checked>
                  <span>Use web references when supported</span>
                </label>
              </div>
              <div class="muted small">Leave the endpoint unchanged unless you intentionally want another OpenAI-compatible route. Blank key uses server OPENAI_API_KEY. Web references are used only for review evidence; proposed changes are not applied automatically.</div>
              <button id="runExternalAiRefine" class="primary">Run External Process Check</button>
              <div id="externalAiResult" class="external-ai-result mfa-empty">No external analysis run yet.</div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </div>

  <script src="/tutorial.js"></script>
  <script src="/export.js"></script>
  <script src="/app.js"></script>
</body>
</html>
"""

STATIC_ROUTES = {
    "/style.css": ("style.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "application/javascript; charset=utf-8"),
    "/tutorial.js": ("tutorial.js", "application/javascript; charset=utf-8"),
    "/export.js": ("export.js", "application/javascript; charset=utf-8"),
}


class AppHandler(BaseHTTPRequestHandler):
    def _resolve(self):
        if self.path in ("/", "/index.html"):
            return APP_HTML.encode("utf-8"), "text/html; charset=utf-8"
        if self.path in STATIC_ROUTES:
            filename, content_type = STATIC_ROUTES[self.path]
            return _read_static(filename).encode("utf-8"), content_type
        return None, None

    def do_HEAD(self):
        body, content_type = self._resolve()
        if body is None:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

    def do_GET(self):
        body, content_type = self._resolve()
        if body is None:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path not in ("/api/refine", "/api/flowsheet", "/api/pubchem"):
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if self.path == "/api/pubchem":
                result = self._lookup_pubchem(payload)
            elif self.path == "/api/flowsheet":
                result = render_pyflowsheet_svg(payload.get("project", payload))
            else:
                result = self._run_external_refine(payload)
            self._send_json(200, result)
        except Exception as exc:
            self._send_json(500, {"ok": False, "error": str(exc)})

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _lookup_pubchem(self, payload):
        mode = str(payload.get("mode", "lookup")).strip().lower()
        name = str(payload.get("name", "")).strip()
        if not name:
            return {"ok": False, "error": "Compound name missing."}
        if len(name) > 160:
            return {"ok": False, "error": "Compound name is too long for lookup."}
        if mode == "search":
            return self._search_pubchem_candidates(name)
        encoded = parse.quote(name, safe="")
        props = ",".join([
            "MolecularFormula",
            "MolecularWeight",
            "CanonicalSMILES",
            "IsomericSMILES",
            "InChI",
            "InChIKey",
            "XLogP",
            "ExactMass",
            "TPSA",
            "HBondDonorCount",
            "HBondAcceptorCount",
        ])
        prop_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded}/property/{props}/JSON"
        try:
            prop_data = self._get_json(prop_url, timeout=20)
        except error.HTTPError as exc:
            return {
                "ok": False,
                "error": f"PubChem HTTP {exc.code}: no compound resolved for '{name}'.",
                "suggestions": self._pubchem_autocomplete(name),
            }
        except (TimeoutError, socket.timeout):
            return {"ok": False, "error": "PubChem lookup timed out."}
        except error.URLError as exc:
            return {"ok": False, "error": f"PubChem connection failed: {exc.reason}"}

        rows = prop_data.get("PropertyTable", {}).get("Properties", [])
        if not rows:
            return {
                "ok": False,
                "error": f"No PubChem compound properties found for '{name}'.",
                "suggestions": self._pubchem_autocomplete(name),
            }
        row = rows[0]
        cid = row.get("CID")
        experimental = {}
        if cid:
            view_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON?heading=Experimental+Properties"
            try:
                view_data = self._get_json(view_url, timeout=20)
                experimental = self._extract_pubchem_experimental_properties(view_data)
            except Exception:
                experimental = {}

        mapped = self._map_pubchem_fields(row, experimental)
        return {
            "ok": True,
            "source": "PubChem PUG-REST/PUG-View",
            "query": name,
            "cid": cid,
            "url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}" if cid else "",
            "properties": row,
            "experimental": experimental,
            "mapped": mapped,
            "warnings": [
                "Basic molecular properties are structured PubChem fields.",
                "Thermal/phase properties are best-effort PUG-View annotations and should be confirmed before design decisions.",
            ],
        }

    def _search_pubchem_candidates(self, name):
        suggestions = self._pubchem_autocomplete(name)
        return {
            "ok": True,
            "query": name,
            "suggestions": suggestions,
            "message": f"{len(suggestions)} PubChem candidate name{'s' if len(suggestions) != 1 else ''} found.",
        }

    def _pubchem_autocomplete(self, name):
        encoded = parse.quote(name, safe="")
        suggestions = []
        try:
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/{encoded}/JSON?limit=12"
            data = self._get_json(url, timeout=15)
            compounds = data.get("dictionary_terms", {}).get("compound", [])
            for item in compounds:
                if isinstance(item, str):
                    term = item
                elif isinstance(item, dict):
                    term = item.get("term") or item.get("name") or item.get("title") or ""
                else:
                    term = ""
                term = str(term).strip()
                if term and term.lower() not in {entry["name"].lower() for entry in suggestions}:
                    suggestions.append({"name": term, "source": "PubChem autocomplete"})
        except Exception:
            suggestions = []

        if suggestions:
            return suggestions[:12]

        try:
            cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded}/cids/JSON?name_type=word"
            cid_data = self._get_json(cid_url, timeout=15)
            cids = (cid_data.get("IdentifierList", {}).get("CID", []) or [])[:8]
            if not cids:
                return []
            cid_csv = ",".join(str(cid) for cid in cids)
            prop_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid_csv}/property/Title,MolecularFormula/JSON"
            prop_data = self._get_json(prop_url, timeout=15)
            rows = prop_data.get("PropertyTable", {}).get("Properties", []) or []
            for row in rows:
                title = str(row.get("Title") or "").strip()
                cid = row.get("CID")
                formula = str(row.get("MolecularFormula") or "").strip()
                if title:
                    suggestions.append({
                        "name": title,
                        "cid": cid,
                        "formula": formula,
                        "source": "PubChem word search",
                    })
        except Exception:
            return suggestions[:12]
        return suggestions[:12]

    def _get_json(self, url, timeout):
        req = request.Request(url, headers={"Accept": "application/json", "User-Agent": "upscaling-pipeline-tool/1.0"})
        with request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _extract_pubchem_experimental_properties(self, data):
        wanted = {
            "Melting Point": "melting_point",
            "Boiling Point": "boiling_point",
            "Vapor Pressure": "vapor_pressure",
            "Solubility": "solubility",
        }
        found = {value: [] for value in wanted.values()}

        def value_to_text(value):
            if not isinstance(value, dict):
                return ""
            strings = value.get("StringWithMarkup")
            if isinstance(strings, list):
                parts = [item.get("String", "") for item in strings if isinstance(item, dict)]
                text = " ".join(part for part in parts if part).strip()
                if text:
                    return text
            number = value.get("Number")
            unit = value.get("Unit")
            if number is not None:
                return f"{number} {unit or ''}".strip()
            return ""

        def visit(section):
            if not isinstance(section, dict):
                return
            heading = section.get("TOCHeading", "")
            key = wanted.get(heading)
            if key:
                for info in section.get("Information", []) or []:
                    text = value_to_text(info.get("Value", {}))
                    if text:
                        found[key].append(text)
            for child in section.get("Section", []) or []:
                visit(child)

        visit(data.get("Record", {}))
        return {key: values[:5] for key, values in found.items() if values}

    def _map_pubchem_fields(self, row, experimental):
        mapped = {}
        if row.get("MolecularWeight") is not None:
            mapped["mw"] = str(row.get("MolecularWeight"))
        for target, source_key in (("tm", "melting_point"), ("tb", "boiling_point"), ("pvap", "vapor_pressure")):
            values = experimental.get(source_key) or []
            for value in values:
                converted = self._pubchem_numeric_property(value, target)
                if converted:
                    mapped[target] = converted
                    break
        return mapped

    def _pubchem_numeric_property(self, text, target):
        import re

        match = re.search(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?", str(text))
        if not match:
            return ""
        value = float(match.group(0))
        lower = str(text).lower()
        if target in ("tm", "tb") and ("°c" in lower or "deg c" in lower or " c" in lower):
            return f"{value + 273.15:.2f}"
        if target in ("tm", "tb") and ("°f" in lower or "deg f" in lower or " f" in lower):
            return f"{(value - 32) * 5 / 9 + 273.15:.2f}"
        if target in ("tm", "tb"):
            return ""
        if target == "pvap":
            if "mmhg" in lower:
                return f"{value * 133.322:.3g}"
            if "kpa" in lower:
                return f"{value * 1000:.3g}"
        return str(value)

    def _run_external_refine(self, payload):
        api_key = str(payload.get("apiKey", "")).strip() or os.environ.get("OPENAI_API_KEY", "").strip()
        endpoint = str(payload.get("endpoint", "https://api.openai.com/v1/responses")).strip()
        default_model = os.environ.get("OPENAI_MODEL", "").strip() or "gpt-5-mini"
        model = str(payload.get("model", "")).strip() or default_model
        project = payload.get("project", {})
        options = payload.get("options", {})
        report_style = str(payload.get("reportStyle", "commentary_summary")).strip() or "commentary_summary"
        use_web = bool(payload.get("useWebReferences", True))
        if not api_key:
            return {"ok": False, "error": "API key missing. Set OPENAI_API_KEY before starting the server or enter a temporary key in the popup."}
        if not endpoint.startswith("https://"):
            return {"ok": False, "error": "Only https API endpoints are allowed."}
        system = (
            "You are a chemical process synthesis and scale-up reviewer. Apply the heuristic rules to the actual "
            "process that the user built: source blocks, grouped tasks, arrows/sequence, phenomena, phases, MFA streams, "
            "conditions, selected unit alternatives, recycle/purge data, scale-up basis, and Gantt schedule. "
            "Do not modify the process, do not refine or rewrite the rule library, and do not list all rules. "
            "Return only relevant inconsistencies, missing evidence, incompatibilities, and proposed process changes. "
            "Treat this as pre-scale screening, not a validated design. If web search is available, use it only as "
            "supporting reference evidence for general process-synthesis, safety, scale-up, separation, or unit-operation "
            "judgment; cite source titles or URLs compactly in the report."
        )
        user = (
            "Selected checking scopes:\n"
            + json.dumps(options, indent=2)
            + f"\n\nRequested report style: {report_style}\n\n"
            + f"Use web references if available: {use_web}\n\n"
            + "Apply the heuristic rules to this project JSON. Compare rules against the constructed process, "
            "especially sequence/thermal reversals, phase-unit mismatches, missing MFA quantities or phases, "
            "condition conflicts inside groups, recycle/purge closure, scale-up basis, and bottleneck logic. "
            "Use the process rule checks already present in project.ruleChecks as first evidence, then add only extra "
            "issues supported by project blocks/groups/links/scaleUp. Cite heuristic IDs when available from "
            "project.scaleUp.heuristicReview.triggered or rule-check titles; if no exact ID applies, write 'rule logic: "
            "general process heuristic' instead of inventing an ID. Do not list inactive rules. Do not change the JSON "
            "or claim that any proposed change has been applied.\n\n"
            "You must produce a written final report. Do not return only reasoning/tool calls.\n\n"
            "Return Markdown with these exact sections:\n"
            "1. Process commentary - 5 to 8 concise lines explaining what the built process currently looks like.\n"
            "2. Main problems - a valid Markdown table with exactly these columns: Severity | Target | Evidence | Rule or doubt | Why it matters | Suggested change. Keep every row on one line so the UI can parse it.\n"
            "3. Missing data before scale-up - bullets grouped as MFA, phases/properties, conditions, recycle/purge, schedule.\n"
            "4. Web/reference notes - only include sources actually used; otherwise say no web reference used.\n"
            "5. Rules involved - cite only heuristic IDs or local rule-check titles that are relevant to this process.\n"
            "6. Proposed process changes, not applied - concrete options the user could manually implement.\n"
            "7. Immediate next actions - maximum 5 actions in practical order.\n\n"
            + json.dumps(project)[:45000]
        )
        if endpoint.endswith("/chat/completions"):
            body = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            }
        else:
            body = {
                "model": model,
                "instructions": system,
                "input": user,
            }
            if use_web:
                body["tools"] = [{"type": "web_search_preview", "search_context_size": "low"}]
        req = request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            data = self._post_api_json(req, timeout=180)
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            return {"ok": False, "error": f"API HTTP {exc.code}: {detail[:1000]}"}
        except (TimeoutError, socket.timeout) as exc:
            if use_web and not endpoint.endswith("/chat/completions"):
                fallback = {key: value for key, value in body.items() if key != "tools"}
                fallback_user = (
                    user
                    + "\n\nThe first attempt with web references timed out. Produce the same review without live web references, "
                    "and clearly write in section 4 that no web reference was used because the web-enabled request timed out."
                )
                fallback["input"] = fallback_user
                fallback_req = request.Request(
                    endpoint,
                    data=json.dumps(fallback).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    method="POST",
                )
                try:
                    data = self._post_api_json(fallback_req, timeout=180)
                except error.HTTPError as fallback_exc:
                    detail = fallback_exc.read().decode("utf-8", errors="replace")
                    return {"ok": False, "error": f"API HTTP {fallback_exc.code} after web-timeout fallback: {detail[:1000]}"}
                except (TimeoutError, socket.timeout) as fallback_exc:
                    return {"ok": False, "error": "External analysis timed out after 180 seconds, including the no-web fallback. Try gpt-4.1-mini, reduce report style to Short triage, or disable web references.", "details": {"timeout_seconds": 180, "web_references": True}}
            else:
                return {"ok": False, "error": "External analysis timed out after 180 seconds. Try gpt-4.1-mini, reduce report style to Short triage, or disable web references.", "details": {"timeout_seconds": 180, "web_references": use_web}}
        except error.URLError as exc:
            return {"ok": False, "error": f"API connection failed: {exc.reason}"}
        text = self._extract_api_text(data)
        if not text:
            compact = {
                "id": data.get("id"),
                "status": data.get("status"),
                "model": data.get("model"),
                "output_types": [item.get("type") for item in data.get("output", []) if isinstance(item, dict)],
            }
            return {
                "ok": False,
                "error": "The API request completed but returned no written text. Try Run External Process Check again, or use a non-reasoning model such as gpt-4.1-mini for this report.",
                "details": compact,
            }
        return {"ok": True, "text": text, "model": model}

    def _post_api_json(self, req, timeout):
        with request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _extract_api_text(self, data):
        text = data.get("output_text")
        if isinstance(text, str) and text.strip():
            return text.strip()
        if data.get("choices"):
            content = data["choices"][0].get("message", {}).get("content", "")
            if isinstance(content, str) and content.strip():
                return content.strip()
        parts = []
        for item in data.get("output", []) or []:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if isinstance(content, str) and content.strip():
                parts.append(content.strip())
            elif isinstance(content, list):
                for chunk in content:
                    if not isinstance(chunk, dict):
                        continue
                    chunk_text = chunk.get("text") or chunk.get("content")
                    if isinstance(chunk_text, str) and chunk_text.strip():
                        parts.append(chunk_text.strip())
        return "\n\n".join(parts).strip()

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
