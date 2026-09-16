import { describe, expect, it } from "vitest";
import { applyNeedFilters, applyReqFilters, peopleOf, statusLabel, statusesOf } from "./filters";
import type { DataIndex } from "./model";
import { buildSearch } from "./search";
import { formatAt } from "./model";

const index: DataIndex = {
  generatedAt: "2026-09-16T10:00",
  needs: [
    { id: "N-001", title: "fixed notification area", module: "Shell", raised_by: "Cleo", status: "unwritten", matrix_status: "unwritten", requirements: [], sources: [{ meeting: "11 Sep sync", offset: "19:56", at: "2026-09-11T17:50" }], prototype: { state: "none" }, need: "As an operator, I want every system event in one place." },
    { id: "N-002", title: "APP-6 symbology", module: "Map", raised_by: "Ada · Ben", status: "covered", matrix_status: "discussion", requirements: ["REQ-HMI-039"], sources: [], prototype: { state: "built" }, need: "As an operator, I want tracks drawn in NATO symbology." },
  ],
  requirements: [
    { id: "REQ-HMI-039", ears: "Track tails shall follow the NATO APP6 symbology", status: "Current", module: "Map", needs: ["N-002"], verifies: [], satisfies: [] },
  ],
};

describe("lenses over one index", () => {
  it("searches within a lens only", () => {
    const search = buildSearch(index);
    expect([...search("symbology", "needs")!]).toEqual(["N-002"]);
    expect([...search("symbology", "requirements")!]).toEqual(["REQ-HMI-039"]);
    expect(search("   ", "needs")).toBeNull();
  });

  it("filters needs by person and status, requirements by the people behind their needs", () => {
    const f = { query: "", module: null, status: "unwritten", person: null };
    expect(applyNeedFilters(index.needs, f, null).map((n) => n.id)).toEqual(["N-001"]);
    const byAda = { query: "", module: null, status: null, person: "Ada" };
    expect(applyReqFilters(index.requirements, byAda, null, index).map((r) => r.id)).toEqual(["REQ-HMI-039"]);
    expect(peopleOf(index)).toEqual(["Ada", "Ben", "Cleo"]);
  });

  it("status chips are the matrix statuses, in legend order, and filter both grains by them", () => {
    expect(statusesOf(index, "needs")).toEqual(["discussion", "unwritten"]);
    expect(statusesOf(index, "requirements")).toEqual(["discussion"]);
    expect(statusLabel("discussion")).toBe("up for discussion");
    const discussed = { query: "", module: null, status: "discussion", person: null };
    expect(applyNeedFilters(index.needs, discussed, null).map((n) => n.id)).toEqual(["N-002"]);
    expect(applyReqFilters(index.requirements, discussed, null, index).map((r) => r.id)).toEqual(["REQ-HMI-039"]);
    const unwritten = { ...discussed, status: "unwritten" };
    expect(applyReqFilters(index.requirements, unwritten, null, index)).toEqual([]);
  });

  it("shows the wall-clock time the way a reader expects", () => {
    expect(formatAt("2026-09-11T17:57")).toBe("11 Sep 17:57");
    expect(formatAt("2026-09-07T10:36", true)).toBe("7 Sep ≈10:36");
  });
});
