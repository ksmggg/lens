import { describe, expect, it } from "vitest";
import { nextSort, sortRows, type Sort } from "./sort";

const rows = [
  { id: "a", text: "banana", rank: 2 },
  { id: "b", text: "apple", rank: 3 },
  { id: "c", text: "cherry", rank: 1 },
  { id: "d", text: "", rank: 2 },
];
const keyOf = (r: (typeof rows)[number], key: string) => (key === "rank" ? r.rank : r.text);

describe("sortRows", () => {
  it("keeps the incoming order when nothing is sorted", () => {
    expect(sortRows(rows, null, keyOf).map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("sorts text ascending and descending, empties last either way", () => {
    expect(sortRows(rows, { key: "text", dir: "asc" }, keyOf).map((r) => r.id)).toEqual(["b", "a", "c", "d"]);
    expect(sortRows(rows, { key: "text", dir: "desc" }, keyOf).map((r) => r.id)).toEqual(["c", "a", "b", "d"]);
  });

  it("sorts numbers by value and is stable for ties", () => {
    expect(sortRows(rows, { key: "rank", dir: "asc" }, keyOf).map((r) => r.id)).toEqual(["c", "a", "d", "b"]);
    expect(sortRows(rows, { key: "rank", dir: "desc" }, keyOf).map((r) => r.id)).toEqual(["b", "a", "d", "c"]);
  });

  it("does not mutate the input", () => {
    const before = rows.map((r) => r.id);
    sortRows(rows, { key: "text", dir: "desc" }, keyOf);
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});

describe("nextSort", () => {
  it("cycles a column through ascending, descending, off", () => {
    const first: Sort = nextSort(null, "text");
    expect(first).toEqual({ key: "text", dir: "asc" });
    expect(nextSort(first, "text")).toEqual({ key: "text", dir: "desc" });
    expect(nextSort({ key: "text", dir: "desc" }, "text")).toBeNull();
  });

  it("starts a different column ascending", () => {
    expect(nextSort({ key: "text", dir: "desc" }, "rank")).toEqual({ key: "rank", dir: "asc" });
  });
});
