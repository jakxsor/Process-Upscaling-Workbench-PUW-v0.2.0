    // PubChem property lookup and the "resolve a substance name" modal, used by the separation
    // simulator to auto-fill pure-component properties. Split out of app.js for navigability;
    // loaded as a plain <script> before app.js (see app.py) so these functions share the same
    // global scope as the rest of the app. Depends on: $, escapeHtml, escapeAttr, pushUndo,
    // delay, alertModal, ensureGroup, invalidateProcessCheck, renderSeparationSimulatorModal,
    // renderExport, pubchemResolveState — all defined in app.js. Pure lookup/property mapping
    // lives in pubchem_core.js.

    const pubChemCore = globalThis.ProcessUpscalingPubChemCore;
    if (!pubChemCore) throw new Error("PubChem core module failed to load.");

    async function fetchPubChemForSubstance(groupId, substanceId, button = null, options = {}) {
      const groupState = ensureGroup(groupId);
      const substance = groupState.separationSimulator.substances.find(item => item.id === substanceId);
      if (!substance || !String(substance.name || "").trim()) {
        if (!options.silent) await alertModal("Add a compound name before fetching PubChem properties.");
        return false;
      }
      const previousText = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = "Fetching...";
      }
      try {
        const data = await lookupPubChem(substance.name);
        if (!data.ok) {
          groupState.separationSimulator.lookupSummary = {
            status: data.suggestions?.length ? "partial" : "error",
            message: data.suggestions?.length
              ? `${substance.name}: direct PubChem lookup failed; choose a suggested name or enter a CAS.`
              : `${substance.name}: ${data.error || "PubChem lookup failed."}`,
            lastUpdated: new Date().toISOString()
          };
          renderSeparationSimulatorModal();
          renderExport();
          if (!options.silent && options.allowResolve !== false) {
            openPubChemResolveModal(groupId, substanceId, substance.name, data);
          } else if (!options.silent) {
            await alertModal(data.error || "PubChem lookup failed.");
          }
          return false;
        }
        if (!options.skipUndo) pushUndo();
        applyPubChemLookup(substance, data);
        if (typeof propagateSeparationChemicalProperties === "function") {
          propagateSeparationChemicalProperties(groupId, substance);
        }
        groupState.separationSimulator.lookupSummary = {
          status: "done",
          message: `${substance.name}: PubChem CID ${data.cid || "unknown"} applied. Thermal fields are annotations and need confirmation.`,
          lastUpdated: new Date().toISOString()
        };
        invalidateProcessCheck();
        renderSeparationSimulatorModal();
        renderExport();
        return true;
      } catch (error) {
        groupState.separationSimulator.lookupSummary = {
          status: "error",
          message: `${substance.name}: ${error.message}`,
          lastUpdated: new Date().toISOString()
        };
        if (!options.silent) await alertModal(`PubChem lookup failed: ${error.message}`);
        return false;
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = previousText || "Fetch";
        }
      }
    }

    async function autofillPubChemForGroup(groupId, button = null) {
      const groupState = ensureGroup(groupId);
      const substances = groupState.separationSimulator.substances.filter(item => String(item.name || "").trim());
      if (!substances.length) {
        await alertModal("No named substances available for PubChem autofill.");
        return;
      }
      const previousText = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = "Autofilling...";
      }
      pushUndo();
      groupState.separationSimulator.lookupSummary = {
        status: "running",
        message: `Fetching PubChem properties for ${substances.length} substances...`,
        lastUpdated: new Date().toISOString()
      };
      renderSeparationSimulatorModal();
      let okCount = 0;
      const failed = [];
      for (const substance of substances) {
        const ok = await fetchPubChemForSubstance(groupId, substance.id, null, { silent: true, skipUndo: true });
        if (ok) okCount += 1;
        else failed.push(substance.name);
        await delay(240);
      }
      groupState.separationSimulator.lookupSummary = {
        status: okCount === substances.length ? "done" : okCount ? "partial" : "error",
        message: okCount
          ? `Applied PubChem data to ${okCount}/${substances.length} substances${failed.length ? `; failed: ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "..." : ""}` : ""}.`
          : "No PubChem properties were applied.",
        lastUpdated: new Date().toISOString()
      };
      invalidateProcessCheck();
      renderSeparationSimulatorModal();
      renderExport();
      if (button) {
        button.disabled = false;
        button.textContent = previousText || "Autofill PubChem";
      }
      if (!okCount) await alertModal("No PubChem properties were applied.");
    }

    async function lookupPubChem(name, options = {}) {
      return pubChemCore.lookup(name, options);
    }

    function applyPubChemLookup(substance, data) {
      pubChemCore.applyLookup(substance, data);
    }

    function openPubChemResolveModal(groupId, substanceId, query, lookupData = {}) {
      pubchemResolveState = {
        groupId,
        substanceId,
        query: String(query || "").trim(),
        status: lookupData.suggestions?.length ? "ready" : "idle",
        message: lookupData.error || "Direct PubChem lookup did not resolve. Search by a clearer name or CAS number.",
        candidates: Array.isArray(lookupData.suggestions) ? lookupData.suggestions : []
      };
      $("pubchemResolveModal").hidden = false;
      renderPubChemResolveModal();
      if (!pubchemResolveState.candidates.length && pubchemResolveState.query) {
        searchPubChemResolveCandidates(pubchemResolveState.query);
      }
    }

    function closePubChemResolveModal() {
      $("pubchemResolveModal").hidden = true;
      pubchemResolveState = null;
    }

    function renderPubChemResolveModal() {
      const root = $("pubchemResolveBody");
      if (!root || !pubchemResolveState) return;
      const groupState = ensureGroup(pubchemResolveState.groupId);
      const substance = groupState.separationSimulator.substances.find(item => item.id === pubchemResolveState.substanceId);
      const candidates = pubchemResolveState.candidates || [];
      root.innerHTML = `
        <section class="pubchem-resolve-grid">
          <div class="pubchem-resolve-status ${escapeAttr(pubchemResolveState.status)}">
            <strong>${escapeHtml(substance?.name || "unknown substance")}</strong>
            <span>${escapeHtml(pubchemResolveState.message || "Search PubChem manually.")}</span>
          </div>
          <label class="pubchem-manual-search">
            <span class="label">Manual PubChem query</span>
            <div>
              <input id="pubchemManualQuery" value="${escapeAttr(pubchemResolveState.query)}" placeholder="compound name, synonym, or CAS number">
              <button id="pubchemManualSearch">Search Names</button>
              <button class="primary" id="pubchemManualFetch">Fetch This Query / CAS</button>
            </div>
          </label>
          <div class="pubchem-candidate-list">
            <div class="label">Similar PubChem Names</div>
            ${pubchemResolveState.status === "running" ? `<div class="mfa-empty">Searching PubChem...</div>` : candidates.length ? candidates.map(candidate => `
              <button class="pubchem-candidate" data-pubchem-candidate-name="${escapeAttr(candidate.name)}">
                <strong>${escapeHtml(candidate.name)}</strong>
                <span>${[
                  candidate.cid ? `CID ${candidate.cid}` : "",
                  candidate.formula ? `Formula ${candidate.formula}` : "",
                  candidate.source || ""
                ].filter(Boolean).map(escapeHtml).join(" · ")}</span>
              </button>
            `).join("") : `<div class="mfa-empty">No similar names yet. Try a synonym, IUPAC fragment, abbreviation expansion, or CAS number.</div>`}
          </div>
          <div class="mfa-note">
            <strong>How it applies</strong>
            <span>Choosing a similar name renames this substance before fetching. Fetching a typed CAS/query uses it only for PubChem resolution and keeps your current visible name.</span>
          </div>
        </section>
      `;
      bindPubChemResolveControls();
    }

    function bindPubChemResolveControls() {
      $("pubchemManualSearch")?.addEventListener("click", () => {
        searchPubChemResolveCandidates($("pubchemManualQuery").value);
      });
      $("pubchemManualFetch")?.addEventListener("click", () => {
        applyPubChemResolvedQuery($("pubchemManualQuery").value, { rename: false });
      });
      $("pubchemManualQuery")?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          searchPubChemResolveCandidates(event.target.value);
        }
      });
      document.querySelectorAll("[data-pubchem-candidate-name]").forEach(button => {
        button.addEventListener("click", () => {
          applyPubChemResolvedQuery(button.dataset.pubchemCandidateName, { rename: true });
        });
      });
    }

    async function searchPubChemResolveCandidates(query) {
      if (!pubchemResolveState) return;
      const clean = String(query || "").trim();
      if (!clean) {
        pubchemResolveState.status = "error";
        pubchemResolveState.message = "Enter a compound name, synonym, or CAS number first.";
        renderPubChemResolveModal();
        return;
      }
      pubchemResolveState.query = clean;
      pubchemResolveState.status = "running";
      pubchemResolveState.message = `Searching PubChem candidates for "${clean}"...`;
      renderPubChemResolveModal();
      try {
        const data = await lookupPubChem(clean, { mode: "search" });
        pubchemResolveState.status = data.suggestions?.length ? "ready" : "error";
        pubchemResolveState.message = data.suggestions?.length
          ? data.message || `Choose a candidate for "${clean}".`
          : `No similar PubChem names found for "${clean}". Try a synonym or CAS number.`;
        pubchemResolveState.candidates = data.suggestions || [];
      } catch (error) {
        pubchemResolveState.status = "error";
        pubchemResolveState.message = `PubChem candidate search failed: ${error.message}`;
        pubchemResolveState.candidates = [];
      }
      renderPubChemResolveModal();
    }

    async function applyPubChemResolvedQuery(query, options = {}) {
      if (!pubchemResolveState) return;
      const clean = String(query || "").trim();
      if (!clean) return;
      const { groupId, substanceId } = pubchemResolveState;
      const groupState = ensureGroup(groupId);
      const substance = groupState.separationSimulator.substances.find(item => item.id === substanceId);
      if (!substance) return;
      pubchemResolveState.status = "running";
      pubchemResolveState.message = `Fetching PubChem data for "${clean}"...`;
      renderPubChemResolveModal();
      try {
        const data = await lookupPubChem(clean);
        if (!data.ok) {
          pubchemResolveState.status = data.suggestions?.length ? "ready" : "error";
          pubchemResolveState.message = data.error || "PubChem lookup failed.";
          pubchemResolveState.candidates = data.suggestions || pubchemResolveState.candidates || [];
          renderPubChemResolveModal();
          return;
        }
        pushUndo();
        if (options.rename) substance.name = clean;
        applyPubChemLookup(substance, data);
        if (typeof applyChemicalKey === "function") applyChemicalKey(substance);
        if (typeof propagateSeparationChemicalProperties === "function") {
          propagateSeparationChemicalProperties(groupId, substance);
        }
        if (!options.rename && !String(substance.note || "").includes(`Manual PubChem query "${clean}"`)) {
          substance.note = [substance.note, `Manual PubChem query "${clean}" used for property lookup.`].filter(Boolean).join(" | ");
        }
        groupState.separationSimulator.lookupSummary = {
          status: "done",
          message: `${substance.name || clean}: PubChem CID ${data.cid || "unknown"} applied from manual resolver.`,
          lastUpdated: new Date().toISOString()
        };
        closePubChemResolveModal();
        invalidateProcessCheck();
        renderSeparationSimulatorModal();
        renderExport();
      } catch (error) {
        pubchemResolveState.status = "error";
        pubchemResolveState.message = `PubChem lookup failed: ${error.message}`;
        renderPubChemResolveModal();
      }
    }
