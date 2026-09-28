// shift.js：排班、请假、销假与撤销
import { nextFree, afterOf, pendingOf } from "./roster.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

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

export function plan(state) {
  const found = nextFree(state.roster, state.leaves, state.cursor);
  if (found[0] === "") {
    throw fail("E_NONE_AVAILABLE", "roster empty or everyone is on leave");
  }
  const name = found[0];
  const next = copyState(state);
  next.days.push([state.days.length + 1, name]);
  next.skips = state.skips + found[1];
  next.cursor = (state.roster.indexOf(name) + 1) % state.roster.length;
  return next;
}

export function leave(state, name) {
  if (state.roster.indexOf(name) < 0) {
    throw fail("E_NO_MEMBER", "name is not on the roster");
  }
  if (state.leaves.indexOf(name) >= 0) {
    throw fail("E_ON_LEAVE", "name is already on leave");
  }
  const next = copyState(state);
  next.leaves.push(name);
  return next;
}

export function back(state, name) {
  const spot = state.leaves.indexOf(name);
  if (spot < 0) {
    throw fail("E_NOT_ON_LEAVE", "name is not on leave");
  }
  const next = copyState(state);
  next.leaves.splice(spot, 1);
  return next;
}

export function undo(state) {
  if (!state.days || state.days.length === 0) {
    throw fail("E_NOTHING", "no planned day to undo");
  }
  const name = pendingOf(state.days);
  const next = copyState(state);
  next.days.pop();
  next.cursor = state.roster.indexOf(name);
  next.undos = state.undos + 1;
  return next;
}
