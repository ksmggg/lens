import type { DataIndex, Lens, MatrixStatus, Need, Requirement } from "./model";
import { MATRIX_STATUS_LABEL } from "./model";

export interface Filters {
  query: string;
  module: string | null;
  status: string | null;
  person: string | null;
}

export const EMPTY_FILTERS: Filters = { query: "", module: null, status: null, person: null };

export function modulesOf(index: DataIndex): string[] {
  return unique([...index.needs.map((n) => n.module), ...index.requirements.map((r) => r.module)]);
}

export function peopleOf(index: DataIndex): string[] {
  const names = index.needs.flatMap((n) => n.raised_by.split(/\s*[·→]\s*/)).map((s) => s.trim());
  return unique(names.filter((n) => n && !/^unidentified/i.test(n)));
}

// The Status column shows the matrix vocabulary in both grains, so the chips do too — in the legend's order.
const MATRIX_ORDER: MatrixStatus[] = ["confirmed", "future", "discussion", "unwritten", "contested"];

export function statusesOf(index: DataIndex, lens: Lens): string[] {
  const needs = lens === "needs" ? index.needs : index.requirements.flatMap((r) => needsOf(r, index));
  const present = new Set(needs.map((n) => n.matrix_status).filter(Boolean));
  return MATRIX_ORDER.filter((s) => present.has(s));
}

export function statusLabel(status: string): string {
  return MATRIX_STATUS_LABEL[status as MatrixStatus] ?? status;
}

function needsOf(r: Requirement, index: DataIndex): Need[] {
  return r.needs.map((id) => index.needs.find((n) => n.id === id)).filter(Boolean) as Need[];
}

export function applyNeedFilters(needs: Need[], f: Filters, hits: Set<string> | null): Need[] {
  return needs.filter(
    (n) =>
      (!hits || hits.has(n.id)) &&
      (!f.module || n.module === f.module) &&
      (!f.status || n.matrix_status === f.status) &&
      (!f.person || n.raised_by.includes(f.person)),
  );
}

export function applyReqFilters(reqs: Requirement[], f: Filters, hits: Set<string> | null, index: DataIndex): Requirement[] {
  return reqs.filter(
    (r) =>
      (!hits || hits.has(r.id)) &&
      (!f.module || r.module === f.module) &&
      (!f.status || needsOf(r, index).some((n) => n.matrix_status === f.status)) &&
      (!f.person || needsOf(r, index).some((n) => n.raised_by.includes(f.person!))),
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
