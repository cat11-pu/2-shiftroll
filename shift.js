// shift.js：排班、请假、销假与撤销（基线：一律原样返回）
import { nextFree, afterOf, pendingOf } from "./roster.js";

export function plan(state) {
  return state;
}

export function leave(state, name) {
  return state;
}

export function back(state, name) {
  return state;
}

export function undo(state) {
  return state;
}
