# Scale-Up Engine v2 Notes

Date: 2026-08-05

## Objective

Make the Scale-Up panel support the paper case-study logic without turning the app into a full process simulator.

## Implemented

- Annual targets now support `kg/year` and `t/year`.
- Conservative batch makespan is separated from overlapped plant cycle time.
- Conservative throughput uses batch makespan.
- Overlapped throughput uses plant cycle time, defined as `max(task effective time)`.
- Reactor sizing adds optional case-study inputs:
  - product kg/batch override;
  - reactants volume;
  - solvent loading in L/kg product;
  - working fill;
  - product molecular weight;
  - condensation water stoichiometry.
- Reactor volume is calculated as:
  - `(reactants volume + solvent loading * product kg/batch / 1000) / working fill`.
- Condensation water is calculated as:
  - `product kg/batch * 18.015 / product MW * stoichiometric coefficient`.
- Optional equipment capacity is now available per Gantt task.
- Bottleneck classification is split into:
  - time bottleneck;
  - size bottleneck;
  - throughput bottleneck.

## Octocrylene Reference Behaviour

With the sample case:

- target: 750 t/year;
- OEE: 80%;
- conservative batch makespan: 28 h;
- plant cycle time: 20 h;
- product batch size: about 3000 kg/batch;
- reactants volume: 3.2 m3;
- solvent loading: 2.5 L/kg product;
- working fill: 70%;
- product MW: 361.5 g/mol.

The tool should report approximately:

- 250 conservative batches/year;
- 750 t/year conservative output;
- 15 m3 reactor class;
- 149 kg/batch condensation water;
- 350 overlapped batches/year;
- 1050 t/year overlapped output.

## Deliberate Limits

- Size and throughput bottlenecks are calculated only when equipment capacity is entered.
- The tool does not infer a rated equipment capacity from a selected unit operation unless the user provides it.
- Reactor sizing uses a transparent volume shortcut, not detailed density/composition prediction.
- The Gantt remains a screening schedule, not a validated plant scheduler.
