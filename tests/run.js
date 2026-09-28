import assert from "node:assert";
import { nextFree, afterOf, pendingOf } from "../roster.js";
import { plan, leave, back, undo } from "../shift.js";
import { render } from "../app.js";

const roster = ["a", "b", "c"];
const fresh = { roster: roster.slice(), cursor: 0, days: [], leaves: [], skips: 0, undos: 0 };

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}
function codeOf(fn) {
  try { fn(); return ""; } catch (e) { return e && e.code ? e.code : "E_BAD_EVENT"; }
}

check("roster helpers: nextFree/afterOf/pendingOf", () => {
  assert.deepStrictEqual(nextFree(roster, ["b"], 1), ["c", 1]);
  assert.deepStrictEqual(nextFree(roster, [], 2), ["c", 0]);
  assert.deepStrictEqual(nextFree(roster, ["a", "b", "c"], 0), ["", -1]);
  assert.deepStrictEqual(nextFree([], [], 0), ["", -1]);
  assert.strictEqual(afterOf(roster, "b"), "c");
  assert.strictEqual(afterOf(roster, "c"), "a");
  assert.strictEqual(afterOf(roster, "z"), "");
  assert.strictEqual(pendingOf([[1, "a"], [2, "c"]]), "c");
  assert.strictEqual(pendingOf([]), "");
});

check("plan: ring rotation, skips, cursor", () => {
  let s = plan(fresh);
  assert.deepStrictEqual(s.days, [[1, "a"]]);
  assert.strictEqual(s.cursor, 1);
  s = leave(s, "b");
  s = plan(s);
  assert.deepStrictEqual(s.days, [[1, "a"], [2, "c"]]);
  assert.strictEqual(s.skips, 1);
  assert.strictEqual(s.cursor, 0);
  s = plan(s);
  assert.deepStrictEqual(s.days[s.days.length - 1], [3, "a"]);
  assert.strictEqual(s.cursor, 1);
});

check("plan: empty roster or all on leave is illegal", () => {
  assert.strictEqual(codeOf(() => plan({ roster: [], cursor: 0, days: [], leaves: [], skips: 0, undos: 0 })), "E_NONE_AVAILABLE");
  assert.strictEqual(codeOf(() => plan({ roster: ["a"], cursor: 0, days: [], leaves: ["a"], skips: 0, undos: 0 })), "E_NONE_AVAILABLE");
});

check("leave/back/undo: rules and error codes", () => {
  assert.strictEqual(codeOf(() => leave(fresh, "z")), "E_NO_MEMBER");
  const onLeave = leave(fresh, "a");
  assert.strictEqual(codeOf(() => leave(onLeave, "a")), "E_ON_LEAVE");
  assert.strictEqual(codeOf(() => back(fresh, "z")), "E_NO_MEMBER");
  assert.strictEqual(codeOf(() => back(fresh, "a")), "E_NOT_ON_LEAVE");
  assert.deepStrictEqual(back(onLeave, "a").leaves, []);
  assert.strictEqual(codeOf(() => undo(fresh)), "E_NOTHING");
  const planned = plan(plan(fresh));
  const undone = undo(planned);
  assert.deepStrictEqual(undone.days, [[1, "a"]]);
  assert.strictEqual(undone.cursor, planned.roster.indexOf("b"));
  assert.strictEqual(undone.undos, 1);
});

check("render: shift.json scenario end-to-end", () => {
  const spec = {
    roster: ["a", "b", "c"],
    state: { roster: ["a", "b", "c"], cursor: 0, days: [], leaves: [], skips: 0, undos: 0 },
    events: [
      { kind: "plan" },
      { kind: "leave", name: "b" },
      { kind: "plan" },
      { kind: "plan" },
      { kind: "undo" },
      { kind: "plan" },
      { kind: "back", name: "b" }
    ]
  };
  const view = render(spec);
  assert.deepStrictEqual(view.days, [[1, "a"], [2, "c"], [3, "a"]]);
  assert.deepStrictEqual(view.counts, [["a", 2], ["c", 1]]);
  assert.strictEqual(view.cursor_name, "b");
  assert.deepStrictEqual(view.leaves, []);
  assert.strictEqual(view.skips, 1);
  assert.strictEqual(view.undos, 1);
  assert.strictEqual(view.covered, true);
  assert.strictEqual(view.failed_events, 0);
  assert.strictEqual(view.day_total, 3);
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
