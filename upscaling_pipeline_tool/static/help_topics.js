(function (root) {
  "use strict";

  // The long explanations that used to live in hover tooltips, one list per area of the
  // interface. A tooltip now says what a control does in a line; the reasoning, the caveats and
  // the "when to use it" live here, opened from the "?" button of that area, readable without
  // holding the mouse still.
  const topics = {
    protocol: {
      title: "Protocol and blocks (step 1)",
      items: [
        { title: "Creating blocks", body: "Load the protocol text, select a passage in the annotated view and press Create Block (or right-click the selection). A block keeps the character offsets of its source passage, so every later decision can be traced back to the sentence it came from." },
        { title: "Merging blocks", body: "Merge Into One Block fuses adjacent blocks: their texts are concatenated and their streams, phenomena and conditions are combined. The block count goes down and the merge cannot be split back automatically, so merge only when two passages really describe one operation." },
        { title: "Scale-up additions", body: "Blocks marked as industrial additions (vent abatement, solvent recovery, wastewater interface) are not in the protocol text. They are placed after the protocol blocks and carry no text position." }
      ]
    },
    board: {
      title: "Blocks, tasks and network (steps 3 and 4)",
      items: [
        { title: "Forming a task group", body: "Shift-click two or more draft blocks, then right-click and choose Group Into New Task. Blocks stay separate and keep their own text, streams and conditions; the group only bundles them under one unit operation. Assign To Selected Task adds blocks to an existing group; Remove From Task Group returns a block to the draft state without changing it." },
        { title: "Assigning a unit operation", body: "Proposals appear on each group box under Assign Unit Operation once the task has a name, material streams with phase labels and at least one operating condition. They are ranked by task class, phenomena overlap, feed-phase compatibility and conditions; the Lutze/Garg screening can refine the choice afterwards. The gate exists so equipment is not chosen before the material and phase basis is auditable." },
        { title: "Connecting groups", body: "Drag between group handles to declare a process link, or use Connections > Auto-Connect to link groups in text order and add recycle arrows from declared stream destinations. Layout rearranges groups left to right along the declared links, in the same order as the Flowsheet View, without changing any content." },
        { title: "Splitting into parallel units", body: "Split Into Parallel Units creates N groups, each handling 1/N of the material flow between the same predecessor and successor. Declared durations are kept until you enter resized estimates; a kinetics-bound step keeps its full time per batch and only gains throughput." }
      ]
    },
    phenomena: {
      title: "Phenomena (step 2)",
      items: [
        { title: "Presets and the grid", body: "A preset assigns a whole set of phenomena that usually go together (for example reaction with in-situ removal: mixing, reaction, heating, vapour-liquid transition and separation). Leave the preset on unassigned to pick phenomena one by one in the grid. Each code has a glossary line on hover." },
        { title: "Why phenomena matter", body: "The unit-operation proposals, the phase-compatibility checks and the heuristic rules all read the phenomena. A block with no phenomena cannot be matched to equipment." }
      ]
    },
    mfa: {
      title: "Material streams (step 4)",
      items: [
        { title: "What a stream carries", body: "Name, quantity and unit, phase, provenance status (reported, calculated, estimated, assumed, missing), timing (initial charge, later addition, in-process intermediate, final output) and fate (fresh input, intermediate, product, recycled input, recovered solvent, wastewater, solid waste, purge, loss, vent). Fate and destination drive the recycle and waste arrows and the inventory export." },
        { title: "Recovery and purge fractions", body: "Recovery percent is the fraction of a stream actually recovered or recycled; purge percent is the fraction of a loop purged at this point. Both feed the recycle and fate summary on the Scale-Up tab, which computes recovered, purged and lost mass." },
        { title: "Volumes and density", body: "A quantity in litres weighs nothing in mass balances and on the flowsheet unless a density is declared, on the stream or on a same-named stream anywhere in the project. Streams without a usable mass are counted and labelled n.q." }
        ,
        { title: "Uncertainty by provenance", body: "Every quantity carries a screening-default uncertainty from its status: reported ±2 %, calculated ±5 %, estimated ±20 %, assumed ±30 %. Totals combine them in quadrature, the stream table and the scaled rows print the result, a unit balance that is off by less than the combined uncertainty of its two sides says so, and the LCI export carries the percentage per exchange." }
      ]
    },
    reaction: {
      title: "Reaction balance",
      items: [
        { title: "Yield, conversion, selectivity", body: "Yield sets the product mass from the theoretical product. Conversion is the fraction of the limiting reactant consumed and sets every unreacted residual. Selectivity is the fraction of converted reactant that forms the selected product. The three are linked: yield cannot exceed conversion times selectivity, and the modal checks this as you type." },
        { title: "What enters the stoichiometry", body: "Only inputs classified as reagent or reactant are consumed. Solvents, catalysts, auxiliaries and inerts pass through and are tracked for downstream handling but never consumed by conversion." },
        { title: "Byproducts and residual outlets", body: "Add a named byproduct, co-product or residual outlet only when it is known or intentionally modelled. Give it a molecular weight for mol or kmol units, or a density for volume units, so it can be converted to kg." }
      ]
    },
    heuristics: {
      title: "Heuristic rules (step 5)",
      items: [
        { title: "How rules are triggered", body: "The 53 screening rules are matched from the phenomena, phases, fates, conditions, properties and source text of the built process. A triggered rule never changes the flowsheet: it proposes, explains and waits for your accept, reject or override, which is recorded with a note and a timestamp." },
        { title: "Local check and external review", body: "Apply Rules runs the deterministic local check on the current board data. The external OpenAI-compatible review is optional, folded under the report, and needs a key; its output is commentary, never an automatic change." }
      ]
    },
    scale: {
      title: "Scale-up and schedule (step 6)",
      items: [
        { title: "Duration and scale behaviour", body: "Each task's time is declared or inferred from the timetable. Scale sensitivity says how it behaves with size: roughly constant, increases with scale, equipment dependent, or kinetics-bound. Set kinetics-bound when a heat or cool holding step is actually where a reaction runs; its Gantt time is then never divided by parallel units." },
        { title: "Dependencies", body: "Auto makes each task follow the previous one in text order. Manual lets you pick exactly which tasks this one must wait for." },
        { title: "Fill Example Durations", body: "Overwrites every group's duration, capacity and notes with generic keyword-matched example values. It asks for confirmation and can be undone; use it to see the schedule mechanics, not as data." },
        { title: "Conservative and overlapped campaigns", body: "Conservative starts a batch after the previous one leaves the train (batch makespan). Overlapped starts a new batch at the plant cycle time, the longest single stage, and assumes equipment, buffers, cleaning and material stability allow it. The Gantt draws the next batch as a ghost in the overlapped scenario." }
      ]
    },
    lutze: {
      title: "Lutze/Garg separation screening",
      items: [
        { title: "Basic and Advanced", body: "Basic opens the guided Lutze/Garg pathway screening: mixture, objective and pathway application. Advanced opens the wider KB3.1 sandbox on the same group: reaction balance, component list, pair screening, workup plan, pathway sandbox and suggestions." },
        { title: "Route-ready and threshold-only", body: "Route-ready means the knowledge-base threshold and the minimum phase and evidence gate both passed; it is still not equipment validation. Threshold-only review means the property ratio passed but evidence is incomplete. The thermal count only counts operation names associated with thermal separation; it does not compute temperatures or degradation risk." },
        { title: "When the screening is blocked", body: "A blocked screening names the missing properties (boiling point, vapour pressure, melting point) and the substances that lack them. Use Autofill properties in Mixture, or enter values under Advanced properties, then screen again." }
      ]
    },
    flowsheet: {
      title: "Flowsheet view",
      items: [
        { title: "What the drawing shows", body: "Units in process order with equipment symbols, the main train in black, recycle in dashed green, waste in orange, vents in dashed grey. Every arrow carries a stream number, the total mass and the number of substances; the stream table under the drawing lists route, type, total, phases and composition, largest component first." },
        { title: "Basis", body: "Lab batch uses the declared quantities; Scaled batch uses the scale-up model's quantities for the target batch; Per kg product divides by the product mass. Volumes are converted with declared densities; an arrow without a usable mass is dashed grey and labelled n.q." },
        { title: "Balance markers", body: "Each unit reports its mass balance on the mass-convertible streams: closed, open (with the count of streams without a usable mass) or off, with a marker on the box when the difference exceeds 2 percent." },
        { title: "Export", body: "Export PowerPoint writes native shapes, the routes and labels as drawn, the stream table as a table and a title block, editable in PowerPoint. Export SVG writes the drawing as shown." }
      ]
    }
  };

  root.ProcessUpscalingHelp = Object.freeze(topics);
})(globalThis);
