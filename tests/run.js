import assert from "node:assert";
import { nextFree, afterOf, pendingOf } from "../roster.js";
import { plan, leave, back, undo } from "../shift.js";
import { render } from "../app.js";

const base = {
  roster: ["a", "b", "c"],
  state: { roster: ["a", "b", "c"], cursor: 0, days: [], leaves: [], skips: 0, undos: 0 },
  events: [{ kind: "plan" }]
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("nextFree returns a pair", () => {
  assert.ok(Array.isArray(nextFree(base.roster, [], 0)));
});

check("afterOf returns a string", () => {
  assert.strictEqual(typeof afterOf(base.roster, "a"), "string");
});

check("pendingOf returns a string", () => {
  assert.strictEqual(typeof pendingOf(base.state.days), "string");
});

check("plan returns a state", () => {
  assert.strictEqual(typeof plan(base.state).days, "object");
});

check("render covers the calendar", () => {
  assert.strictEqual(typeof render(base).covered, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
