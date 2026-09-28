// roster.js：名册顺序与请假跳过
export function nextFree(roster, leaves, start) {
  const total = roster.length;
  if (total === 0) {
    return ["", -1];
  }
  let skipped = 0;
  for (let step = 0; step < total; step += 1) {
    const name = roster[(start + step) % total];
    if (leaves.indexOf(name) < 0) {
      return [name, skipped];
    }
    skipped += 1;
  }
  return ["", -1];
}

export function afterOf(roster, name) {
  const index = roster.indexOf(name);
  if (index < 0) {
    return "";
  }
  return roster[(index + 1) % roster.length];
}

export function pendingOf(days) {
  if (!days || days.length === 0) {
    return "";
  }
  return days[days.length - 1][1];
}
