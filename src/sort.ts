export type Dir = "asc" | "desc";
export type Sort = { key: string; dir: Dir } | null;

/** A header click cycles its column: ascending → descending → back to the file order. */
export function nextSort(current: Sort, key: string): Sort {
  if (current?.key !== key) return { key, dir: "asc" };
  return current.dir === "asc" ? { key, dir: "desc" } : null;
}

/** Stable sort by one column; empty values sink to the bottom in both directions. */
export function sortRows<T>(rows: T[], sort: Sort, keyOf: (row: T, key: string) => string | number): T[] {
  if (!sort) return rows;
  const sign = sort.dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: keyOf(row, sort.key) }))
    .sort((a, b) => emptiesLast(a.v, b.v) || compare(a.v, b.v) * sign || a.i - b.i)
    .map((x) => x.row);
}

const isEmpty = (v: string | number) => v === "" || v === Number.POSITIVE_INFINITY;

// Independent of direction: a row with nothing in the column never leads the table.
function emptiesLast(a: string | number, b: string | number): number {
  return Number(isEmpty(a)) - Number(isEmpty(b));
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}
