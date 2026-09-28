import fs from "node:fs";
import { nextFree, afterOf, pendingOf } from "./roster.js";
import { plan, leave, back, undo } from "./shift.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/shift.json", "utf8"));
let state = {
  roster: (spec.state.roster || []).slice(),
  cursor: spec.state.cursor,
  days: (spec.state.days || []).map(function (row) { return [row[0], row[1]]; }),
  leaves: (spec.state.leaves || []).slice(),
  skips: spec.state.skips,
  undos: spec.state.undos
};
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
let covered = true;
state.days.forEach(function (row, spot) {
  if (row[0] !== spot + 1 || state.leaves.indexOf(row[1]) >= 0) {
    covered = false;
  }
});

const report = {
  days: state.days,
  counts: Object.keys(counts).sort().map(function (name) { return [name, counts[name]]; }),
  cursor_name: state.roster[state.cursor],
  leaves: state.leaves,
  skips: state.skips,
  undos: state.undos,
  covered: covered,
  failed_events: failed.length,
  day_total: state.days.length,
  next_free_from_1: nextFree(["a", "b", "c"], ["b"], 1),
  after_b: afterOf(["a", "b", "c"], "b"),
  pending: pendingOf(state.days)
};

const probes = {};
try {
  leave({ roster: ["a"], cursor: 0, days: [], leaves: ["a"], skips: 0, undos: 0 }, "a");
  probes.on_leave = "没有报错";
} catch (error) {
  probes.on_leave = error && error.code ? error.code : String(error.message);
}
try {
  back({ roster: ["a"], cursor: 0, days: [], leaves: [], skips: 0, undos: 0 }, "a");
  probes.not_on_leave = "没有报错";
} catch (error) {
  probes.not_on_leave = error && error.code ? error.code : String(error.message);
}
try {
  undo({ roster: ["a"], cursor: 0, days: [], leaves: [], skips: 0, undos: 0 });
  probes.nothing = "没有报错";
} catch (error) {
  probes.nothing = error && error.code ? error.code : String(error.message);
}

// ---- 断言表：按路径从结构化报告里取值，逐项比对 ----
const TABLE = [
  [
    "days",
    [
      [
        1,
        "a"
      ],
      [
        2,
        "c"
      ],
      [
        3,
        "a"
      ]
    ]
  ],
  [
    "counts",
    [
      [
        "a",
        2
      ],
      [
        "c",
        1
      ]
    ]
  ],
  [
    "cursor_name",
    "b"
  ],
  [
    "leaves",
    []
  ],
  [
    "skips",
    1
  ],
  [
    "undos",
    1
  ],
  [
    "covered",
    true
  ],
  [
    "failed_events",
    0
  ],
  [
    "day_total",
    3
  ],
  [
    "next_free_from_1",
    [
      "c",
      1
    ]
  ],
  [
    "after_b",
    "c"
  ],
  [
    "pending",
    "a"
  ],
  [
    "probes.on_leave",
    "E_ON_LEAVE"
  ],
  [
    "probes.not_on_leave",
    "E_NOT_ON_LEAVE"
  ],
  [
    "probes.nothing",
    "E_NOTHING"
  ]
];
let bad = 0;
for (const [path, want] of TABLE) {
  let got = report;
  if (path.indexOf("probes.") === 0) {
    got = probes[path.slice(7)];
  } else {
    for (const step of path.split(".")) {
      got = got === undefined || got === null ? undefined : got[step];
    }
  }
  const same = JSON.stringify(got) === JSON.stringify(want);
  if (same) {
    console.log("通过 " + path + " = " + JSON.stringify(got));
  } else {
    bad += 1;
    console.log("不过 " + path + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got));
  }
}
console.log("断言 " + (TABLE.length - bad) + "/" + TABLE.length + " 通过");
process.exit(bad === 0 ? 0 : 1);
