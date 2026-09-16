import MiniSearch from "minisearch";
import type { DataIndex, Lens, Need, Requirement } from "./model";

interface Doc {
  id: string;
  lens: Lens;
  text: string;
  people: string;
  module: string;
}

function needDoc(n: Need): Doc {
  return {
    id: n.id,
    lens: "needs",
    text: [n.title, n.need, n.solution, n.notes, n.requirement_text, n.prototype.note, ...n.requirements].join(" "),
    people: [n.raised_by, n.requirement_by].join(" "),
    module: n.module,
  };
}

function reqDoc(r: Requirement): Doc {
  return {
    id: r.id,
    lens: "requirements",
    text: [r.id, r.ears, r.sheet_note, r.notes, r.status, ...r.needs].join(" "),
    people: "",
    module: r.module,
  };
}

/** One index over both lenses; results come back as ids and the caller keeps its own order otherwise. */
export function buildSearch(index: DataIndex) {
  const ms = new MiniSearch<Doc>({
    fields: ["text", "people", "module"],
    storeFields: ["lens"],
    searchOptions: { prefix: true, fuzzy: 0.15, combineWith: "AND" },
  });
  ms.addAll([...index.needs.map(needDoc), ...index.requirements.map(reqDoc)]);
  return (query: string, lens: Lens): Set<string> | null => {
    const q = query.trim();
    if (!q) return null;
    return new Set(ms.search(q).filter((hit) => hit["lens"] === lens).map((hit) => String(hit.id)));
  };
}
