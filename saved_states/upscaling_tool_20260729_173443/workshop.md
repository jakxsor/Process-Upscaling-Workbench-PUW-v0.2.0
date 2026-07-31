# Workshop: Automating the Lab-to-Industrial Upscaling Pipeline

## Purpose

This workshop is designed to assess and structure the automation of the upscaling methodology that translates a laboratory synthesis protocol into an industrially representative process flowsheet for prospective LCA.

The core question is:

> Can we start from a written synthesis protocol and support the user, through a simple graphical software interface, in assigning blocks, phenomena, tasks, unit operations, streams, assumptions, and heuristic rules at the right level of aggregation?

Short answer: yes, this is possible. The methodology is already structured enough to be turned into an assisted software workflow. The important design choice is that the software should not behave as a fully automatic black box. It should behave as a traceable decision workspace where the system proposes structured interpretations and the user confirms, edits, or rejects them.

## Why Automation Is Feasible

The framework has a clear layered structure:

1. Protocol layer: what the lab text says.
2. Physical layer: what phenomena are happening.
3. Process layer: how phenomena are aggregated into tasks and unit operations.
4. Network layer: how streams, recycle loops, waste streams, and product outputs connect.
5. Heuristic layer: which engineering rules are used when the protocol does not determine a unique industrial design.
6. Scheduling layer: how task duration, bottlenecks, and parallelization options affect industrial feasibility.

This layered structure is suitable for automation because each layer can be represented as a structured object and linked to the previous and next layer.

The automation challenge is not only text extraction. The real challenge is decision traceability: the tool must preserve the link between the original text, the interpreted block, the assigned phenomena, the task aggregation, the selected unit operation, and the heuristic rule that justified the choice.

## Proposed Workshop Objectives

By the end of the workshop, participants should agree on:

1. The minimum viable automation pipeline.
2. The required data model for protocol blocks, phenomena, tasks, unit operations, streams, COIs, values, and heuristic rules.
3. Which steps can be automated directly and which require user validation.
4. The graphical interface concept for assigning and editing tasks by aggregation level.
5. The first case study to implement as a prototype.
6. The output format needed for prospective LCA and energy calculation.

## Proposed Participants

- Upscaling methodology owner
- Prospective LCA practitioner
- Chemical/process engineering expert
- Software developer or data-model designer
- Optional: AI/NLP specialist for protocol extraction
- Optional: UX designer for the graphical workflow

## Workshop Duration

Recommended duration: 2.5 to 3 hours.

## Agenda

### 1. Problem Framing

Goal: align on what the software should automate and what it should only support.

Discussion points:

- What is the expected user input?
- Is the input a raw synthesis paragraph, a table, a paper excerpt, or a curated protocol?
- What is the expected output?
- Should the output be a flowsheet, task network, LCI-ready inventory, energy-calculation input, or all of these?
- What level of user expertise should the interface assume?

Expected decision:

- The software should support a semi-automated workflow: automatic suggestions plus explicit user confirmation.

### 2. Define the Automation Pipeline

Proposed pipeline:

1. Import protocol text.
2. Extract candidate protocol actions.
3. Group actions into protocol blocks.
4. Assign materials, phases, conditions, endpoints, and data-quality flags.
5. Assign dominant phenomena building blocks.
6. Aggregate protocol blocks into process tasks.
7. Match tasks to candidate unit operations.
8. Build the stream network.
9. Add recycle, waste, utility, compliance, and safety-related operations.
10. Apply heuristic rules to resolve ambiguous choices.
11. Build preliminary schedule and bottleneck analysis.
12. Export structured output.

Key principle:

- The software should expose the level of aggregation at every step. A user should be able to move from protocol text to block, from block to phenomena, from phenomena to task, and from task to unit operation without losing traceability.

### 3. Define the Graph Data Model

The tool should be represented as a graph, not only as tables.

Recommended node types:

- Text segment
- Protocol block
- Material
- Phase cue
- Condition
- Endpoint
- Phenomena building block
- Task
- Unit operation candidate
- Selected unit operation
- Stream
- Recycle loop
- Waste stream
- Assumption
- Heuristic rule
- COI
- Value
- Data gap
- Scheduling item

Recommended edge types:

- extracted_from
- contains
- has_input
- has_output
- has_phase
- has_condition
- has_endpoint
- implies_phenomenon
- aggregated_into
- maps_to_candidate
- selected_as
- justified_by
- connected_to
- recycles_to
- creates_waste
- affects_coi
- supports_value
- requires_user_validation

This graph structure would allow the interface to show why a unit operation was selected and which assumptions or heuristic rules affect it.

## COI and Value Connection

The phrase "connection between values and COIs" should be made explicit in the software model.

In this context, COI can be handled as "Criterion or Concern of Interest". Examples:

- Environmental impact
- Energy demand
- Material efficiency
- Solvent recovery
- Waste generation
- VOC emissions
- Safety and thermal risk
- Data quality
- Industrial plausibility
- Scheduling feasibility
- Scale sensitivity

Values are the user or project priorities that determine how decisions should be ranked. Examples:

- Minimize environmental burden
- Maximize traceability
- Avoid unrealistic industrial assumptions
- Reduce solvent losses
- Minimize hazardous waste
- Prioritize conservative engineering choices
- Preserve product quality
- Reduce uncertainty in the LCA inventory

The software should let users connect values to COIs. For example:

| Value | Connected COI | Consequence in the Workflow |
| --- | --- | --- |
| Minimize environmental burden | Energy demand, waste generation, solvent recovery | Prefer units with heat recovery and recycle loops |
| Preserve product quality | Thermal sensitivity, residence time | Prefer thin-film or short-path options for heat-sensitive products |
| Maximize traceability | Data quality, assumption tracking | Require all heuristic choices to be documented |
| Reduce uncertainty | Missing data, ambiguous mapping | Flag units for sensitivity analysis |
| Ensure industrial plausibility | Compliance, safety, throughput | Add vent abatement, wastewater interface, and scheduling checks |

This gives the graphical tool a decision logic: users do not only select unit operations, they select design priorities, and the tool shows which COIs and heuristic rules are affected.

## Heuristic Rule Layer

The heuristic layer should be a first-class component of the software.

Each heuristic rule should include:

- Rule ID
- Rule text
- Rule category
- Trigger condition
- Suggested action
- Required user validation
- Source
- Confidence level
- Affected COIs
- Affected values

Example:

| Field | Example |
| --- | --- |
| Rule ID | H-VOC-001 |
| Category | Compliance and emissions |
| Trigger | Volatile organic solvent used at industrial scale |
| Suggested action | Add vent condenser and activated carbon polishing |
| User validation | Required |
| Affected COIs | VOC emissions, safety, industrial plausibility |
| Affected values | Minimize environmental burden, ensure industrial plausibility |

Important rule:

- A heuristic rule should never silently change the flowsheet. It should propose a change, explain why, and ask for confirmation.

## Graphical Software Concept

The interface should be organized as an assisted workflow with linked panels.

Recommended layout:

- Left panel: source protocol text.
- Middle panel: extracted blocks and aggregation controls.
- Right panel: properties, phenomena, task mapping, unit-operation candidates, and heuristic rules.
- Bottom panel: warnings, assumptions, data gaps, and validation status.
- Optional canvas: task network and flowsheet graph.

Expected interactions:

- Highlight a sentence and convert it into a protocol block.
- Merge or split blocks.
- Assign phase, material, condition, and endpoint tags.
- Select dominant phenomena from a controlled vocabulary.
- Aggregate multiple blocks into a task.
- Review candidate unit operations.
- Accept, reject, or override heuristic suggestions.
- Link values to COIs.
- Export the final structured workflow.

## MVP Scope

The first prototype should avoid trying to solve everything.

Recommended MVP:

1. Paste or import a protocol text.
2. Extract candidate protocol blocks.
3. Allow manual merge/split of blocks.
4. Assign materials, phases, conditions, and endpoints.
5. Assign phenomena building blocks from a controlled list.
6. Aggregate blocks into tasks.
7. Suggest candidate unit operations from a rule table.
8. Record heuristic decisions and assumptions.
9. Display a simple task network.
10. Export JSON and CSV tables.

Out of scope for MVP:

- Full process simulation.
- Automatic mass and energy balance closure.
- Automatic equipment sizing.
- Automatic LCA database linking.
- Fully automatic flowsheet generation without user validation.

## Suggested Output Schema

The MVP should export one structured project file.

```json
{
  "project": {
    "name": "Octocrylene upscaling case",
    "functional_unit": "1 kg purified product",
    "target_scale": "750 t/year"
  },
  "protocol_blocks": [],
  "phenomena": [],
  "tasks": [],
  "unit_operation_candidates": [],
  "selected_unit_operations": [],
  "streams": [],
  "heuristic_rules": [],
  "assumptions": [],
  "cois": [],
  "values": [],
  "scheduling": [],
  "validation_flags": []
}
```

## Automation Feasibility by Step

| Step | Automation Potential | User Validation Needed | Main Risk |
| --- | --- | --- | --- |
| Protocol import | High | Low | Formatting differences |
| Block extraction | Medium-high | Medium | Wrong granularity |
| Material and phase tagging | Medium | Medium | Missing implicit information |
| Phenomena assignment | Medium | High | Ambiguous physical interpretation |
| Task aggregation | Medium | High | Multiple valid aggregation levels |
| Unit-operation candidate matching | High | Medium | Incomplete knowledge base |
| Unit-operation selection | Medium | High | Heuristic arbitration required |
| Network closure | Medium | High | Missing recycle and waste streams |
| Heuristic rule application | Medium | High | Overconfident recommendations |
| Scheduling | Medium | High | Missing duration and scale-sensitivity data |
| LCA/energy export | High after schema definition | Medium | Data completeness |

## Key Design Risks

1. Granularity is not unique.

The same protocol can be split into different block structures. The software must allow merge/split operations and preserve the reason for the chosen level of aggregation.

2. Phenomena-to-unit-operation mapping is not deterministic.

The same phenomena set can map to multiple candidate units. The software should rank candidates and expose the rule behind the ranking.

3. Some industrial operations are not derivable from the lab protocol.

Vent abatement, wastewater treatment, solvent recovery, heat integration, and compliance units often appear only through heuristic reasoning.

4. Missing data must be explicit.

The tool should distinguish between extracted data, inferred data, assumed data, and missing data.

5. The tool must avoid false precision.

Early-stage prospective LCA requires plausible industrial representation, not fake detailed engineering certainty.

## Workshop Exercises

### Exercise 1: Manual Pipeline Walkthrough

Use the octocrylene case study.

Participants map:

- Protocol text to blocks
- Blocks to phenomena
- Blocks to tasks
- Tasks to unit-operation candidates
- Heuristic rules to final selections

Output:

- One agreed graph for the case study.

### Exercise 2: Ambiguity Review

Participants identify where the workflow is deterministic and where it is heuristic.

Output:

- A list of steps requiring mandatory user validation.

### Exercise 3: COI and Value Mapping

Participants define which values matter for the project and connect them to COIs.

Output:

- A value-to-COI matrix that can drive software ranking and warnings.

### Exercise 4: MVP Interface Sketch

Participants sketch the minimum graphical interface.

Output:

- Screen layout
- Required controls
- Required export formats

## Decisions to Make During the Workshop

1. What does COI mean formally in the project vocabulary?
2. What are the fixed aggregation levels?
3. Which phenomena vocabulary should be implemented first?
4. Which heuristic rules are mandatory for the first prototype?
5. Should the first interface be a graph editor, a table-first editor, or a hybrid?
6. What is the canonical project export format?
7. Which case study should be used as the benchmark?

## Recommended Technical Direction

The first implementation should be a small web application with:

- A structured JSON project model.
- A controlled vocabulary for phenomena.
- A rule table for candidate unit operations.
- A rule table for heuristic suggestions.
- A graph visualization for traceability.
- Manual validation at every uncertain step.

The system should start as a decision-support tool, not as a fully autonomous process-design engine.

## Final Position

The workshop is worth doing. The pipeline is automatable because the methodology already separates text, phenomena, tasks, unit operations, networks, heuristics, and scheduling. The main product opportunity is a graphical, traceable workspace where users can build an industrial process representation from a lab protocol while seeing which decisions are extracted, inferred, assumed, or heuristic.

The most valuable first prototype is not a complete simulator. It is a structured editor that lets users move cleanly across aggregation levels and records every decision needed to produce a defensible prospective-LCA process model.
