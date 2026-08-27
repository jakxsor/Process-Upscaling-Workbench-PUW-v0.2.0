const fs = require("fs");
const assert = require("assert");

const core = fs.readFileSync("upscaling_pipeline_tool/static/separation_core.js", "utf8");
let source = fs.readFileSync("upscaling_pipeline_tool/static/app.js", "utf8");
const marker = "$(\"behaviorSelect\").innerHTML";
source = source.slice(0, source.indexOf(marker));

source += `
globalThis.requestAnimationFrame = () => {};
globalThis.document = {
  getElementById() {
    return {
      value: "",
      hidden: false,
      textContent: "",
      innerHTML: "",
      className: "",
      clientWidth: 1000,
      clientHeight: 800,
      scrollLeft: 0,
      scrollTop: 0,
      scrollTo() {},
      classList: { toggle() {}, contains() { return false; }, remove() {}, add() {} },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      setAttribute() {},
      style: {}
    };
  }
};
renderAll = () => {};
renderExport = () => {};

loadBaseExampleProject();
let group = groupModel("G2");
syncSeparationSimulatorSubstances(group);
let model = separationSimulatorModel(group);
let names = model.substances.map(item => item.name);
assert(names.includes("benzophenone"), "G2 should include upstream benzophenone");
assert(names.includes("2-ethylhexyl cyanoacetate"), "G2 should include upstream 2-ethylhexyl cyanoacetate");
assert(names.includes("cyclohexane"), "G2 should include cyclohexane");
assert(names.includes("octocrylene"), "G2 should include octocrylene");
assert(names.includes("water"), "G2 should include water");
assert(!names.includes("charged reaction"), "G2 should not treat charged reaction mixture as a pure substance");
assert.strictEqual(model.substances.find(item => item.name === "water").role, "byproduct", "water should be inferred as byproduct");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").quantity, "1.82", "benzophenone quantity should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "benzophenone").unit, "kg", "benzophenone unit should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "2-ethylhexyl cyanoacetate").quantity, "1.97", "2-ethylhexyl cyanoacetate quantity should be prefilled");
assert.strictEqual(model.substances.find(item => item.name === "water").quantity, "0.18", "water byproduct quantity should be prefilled");
assert(model.substances.find(item => item.name === "cyclohexane").source.includes("B1"), "cyclohexane should keep source stream traceability");

state.blocks = [{ id: "B99", start: 0, end: 1, groupId: "GT", streams: [], phenomena: [], conditions: {} }];
state.groups = {
  GT: {
    id: "GT",
    task: "separation theory test",
    selectedUnit: "",
    schedule: scheduleDefaults(),
    properties: {},
    separationSimulator: {
      tab: "suggestions",
      substances: [
        { id: "CS1", name: "cyclohexane", role: "solvent", phase: "L", fate: "recycle", thermalSensitivity: "low", mw: "84.16", tb: "353.9", tm: "279.7", pvap: "13000" },
        { id: "CS2", name: "octocrylene", role: "product", phase: "L", fate: "product", thermalSensitivity: "high", mw: "361.5", tb: "480", tm: "280", pvap: "10" }
      ],
      pairInsights: {},
      notes: ""
    }
  }
};
group = groupModel("GT");
model = separationSimulatorModel(group);
const ruleIds = model.suggestions.map(item => item.ruleId);
assert(ruleIds.includes("KB3.1-VL-BP-PVAP"), "property ratios should trigger V-L separation suggestions");
assert(ruleIds.includes("SCREEN-THERMAL-SENSITIVE"), "heat-sensitive product should trigger thin-film/short-path suggestions");
assert(model.suggestions.some(item => item.units.includes("Evaporation")), "suggestions should include evaporation");
assert(model.suggestions.some(item => item.units.includes("Short-path distillation")), "suggestions should include short-path distillation");

console.log("Separation simulator regression check passed.");
`;

eval(`${core}\n${source}`);
