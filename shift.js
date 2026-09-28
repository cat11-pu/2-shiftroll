// shift.js：排班、请假、销假与撤销
import { nextFree } from "./roster.js";

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function clone(state) {
  return {
    roster: (state.roster || []).slice(),
    cursor: state.cursor,
    days: (state.days || []).map(function (row) { return [row[0], row[1]]; }),
    leaves: (state.leaves || []).slice(),
    skips: state.skips,
    undos: state.undos
  };
}

export function plan(state) {
  const next = clone(state);
  const picked = nextFree(next.roster, next.leaves, next.cursor);
  if (picked[0] === "") {
    fail("E_NONE_AVAILABLE");
  }
  const name = picked[0];
  const index = next.roster.indexOf(name);
  next.days.push([next.days.length + 1, name]);
  next.skips += picked[1];
  next.cursor = (index + 1) % next.roster.length;
  return next;
}

export function leave(state, name) {
  const next = clone(state);
  if (next.roster.indexOf(name) < 0) {
    fail("E_NO_MEMBER");
  }
  if (next.leaves.indexOf(name) >= 0) {
    fail("E_ON_LEAVE");
  }
  next.leaves.push(name);
  return next;
}

export function back(state, name) {
  const next = clone(state);
  if (next.roster.indexOf(name) < 0) {
    fail("E_NO_MEMBER");
  }
  const index = next.leaves.indexOf(name);
  if (index < 0) {
    fail("E_NOT_ON_LEAVE");
  }
  next.leaves.splice(index, 1);
  return next;
}

export function undo(state) {
  const next = clone(state);
  if (next.days.length === 0) {
    fail("E_NOTHING");
  }
  const row = next.days.pop();
  next.cursor = next.roster.indexOf(row[1]);
  next.undos += 1;
  return next;
}
