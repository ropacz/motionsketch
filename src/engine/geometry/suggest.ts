// Suggests the right name for a misspelled one ("sizee" → "size").
function editDistance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export function suggest(wrong: string, options: Iterable<string>) {
  let best: string | null = null;
  let smallest = 3;
  for (const o of options) {
    const d = editDistance(wrong.toLowerCase(), o.toLowerCase());
    if (d < smallest) (smallest = d), (best = o);
  }
  return best;
}

export function unknownName(kind: string, name: string, options: Iterable<string>) {
  const s = suggest(name, options);
  return new Error(`${kind} "${name}" does not exist${s ? ` (did you mean "${s}"?)` : ''}`);
}
