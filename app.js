// app.js：渲染值班表
import { nextFree, afterOf, pendingOf } from "./roster.js";
import { plan, leave, back, undo } from "./shift.js";

function copyState(state) {
  return {
    roster: (state.roster || []).slice(),
    cursor: state.cursor,
    days: (state.days || []).map(function (row) { return [row[0], row[1]]; }),
    leaves: (state.leaves || []).slice(),
    skips: state.skips,
    undos: state.undos
  };
}

export function render(spec) {
  let state = copyState(spec.state);
  const failed = [];
  for (const event of spec.events || []) {
    try {
      if (event.kind === "plan") {
        state = plan(state);
      } else if (event.kind === "leave") {
        state = leave(state, event.name);
      } else if (event.kind === "back") {
        state = back(state, event.name);
      } else {
        state = undo(state);
      }
    } catch (error) {
      failed.push([event.kind, error && error.code ? error.code : "E_BAD_EVENT"]);
    }
  }
  const counts = {};
  for (const row of state.days) {
    counts[row[1]] = (counts[row[1]] || 0) + 1;
  }
  const countsList = Object.keys(counts).sort().map(function (name) {
    return [name, counts[name]];
  });
  let covered = true;
  state.days.forEach(function (row, spot) {
    if (row[0] !== spot + 1 || state.leaves.indexOf(row[1]) >= 0) {
      covered = false;
    }
  });
  return { days: state.days, counts: countsList, cursor_name: state.roster[state.cursor],
           leaves: state.leaves, skips: state.skips, undos: state.undos,
           covered: covered, failed_events: failed.length, failed_marks: failed,
           day_total: state.days.length,
           tail: nextFree(["a", "b"], ["b"], 1)[1] + afterOf(["a", "b"], "b").length
                 + pendingOf(state.days).length };
}
