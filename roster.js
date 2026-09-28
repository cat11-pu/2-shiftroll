// roster.js：名册顺序与请假跳过
export function nextFree(roster, leaves, start) {
  const total = roster.length;
  if (total === 0) {
    return ["", -1];
  }
  const begin = ((start % total) + total) % total;
  let skipped = 0;
  for (let step = 0; step < total; step += 1) {
    const index = (begin + step) % total;
    const name = roster[index];
    if (leaves.indexOf(name) >= 0) {
      skipped += 1;
    } else {
      return [name, skipped];
    }
  }
  return ["", -1];
}

export function afterOf(roster, name) {
  const index = roster.indexOf(name);
  if (index < 0 || roster.length === 0) {
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
