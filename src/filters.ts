import type { DataIndex, Lens, Need, Requirement } from "./model";

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

export function statusesOf(index: DataIndex, lens: Lens): string[] {
  return lens === "needs"
    ? unique(index.needs.map((n) => n.status))
    : unique(index.requirements.map((r) => r.status || "unstatused"));
}

export function applyNeedFilters(needs: Need[], f: Filters, hits: Set<string> | null): Need[] {
  return needs.filter(
    (n) =>
      (!hits || hits.has(n.id)) &&
      (!f.module || n.module === f.module) &&
      (!f.status || n.status === f.status) &&
      (!f.person || n.raised_by.includes(f.person)),
  );
}

export function applyReqFilters(reqs: Requirement[], f: Filters, hits: Set<string> | null, index: DataIndex): Requirement[] {
  return reqs.filter(
    (r) =>
      (!hits || hits.has(r.id)) &&
      (!f.module || r.module === f.module) &&
      (!f.status || (r.status || "unstatused") === f.status) &&
      (!f.person || r.needs.some((id) => index.needs.find((n) => n.id === id)?.raised_by.includes(f.person!))),
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
