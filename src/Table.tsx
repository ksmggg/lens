import { useState } from "react";
import type { DataIndex, MatrixStatus, Need, ProtoState, Requirement } from "./model";
import { MATRIX_STATUS_LABEL, NEED_STATUS_LABEL, PROTO_LABEL } from "./model";
import { nextSort, sortRows, type Sort } from "./sort";

interface TableProps<T> {
  rows: T[];
  openId: string | null;
  onOpen: (id: string) => void;
  sort: Sort;
  onSort: (sort: Sort) => void;
}

// Status columns sort by meaning, in the order the matrix legend lists them.
const MATRIX_RANK: Record<MatrixStatus, number> = { confirmed: 0, future: 1, discussion: 2, unwritten: 3, contested: 4 };
const PROTO_RANK: Record<ProtoState, number> = { built: 0, partial: 1, planned: 2, none: 3 };

const NEED_COLUMNS: [key: string, label: string][] = [
  ["goal", "User goal"], ["by", "Goal by"], ["ids", "ID"], ["req", "Requirement"], ["reqby", "Requirement by"],
  ["sol", "Possible solution"], ["mod", "Module"], ["notes", "Notes"], ["status", "Status"], ["proto", "Prototype"],
];

function needKey(n: Need, key: string): string | number {
  switch (key) {
    case "goal": return n.need;
    case "by": return n.raised_by;
    case "ids": return n.requirements[0] ?? "";
    case "req": return n.requirement_text ?? "";
    case "reqby": return n.requirement_by ?? "";
    case "sol": return n.solution ?? "";
    case "mod": return n.module;
    case "notes": return n.notes ?? "";
    case "status": return n.matrix_status ? MATRIX_RANK[n.matrix_status] : Number.POSITIVE_INFINITY;
    case "proto": return PROTO_RANK[n.prototype.state];
    default: return "";
  }
}

/** The module matrix, one need per row — the same columns and order as the matrix everyone has seen. */
export function NeedsTable({ rows, openId, onOpen, sort, onSort, index }: TableProps<Need> & { index: DataIndex }) {
  const [tip, setTip] = useState<Tip>(null);
  const show = (id: string) => (e: React.SyntheticEvent<HTMLElement>) => setTip({ id, rect: e.currentTarget.getBoundingClientRect() });
  const hide = () => setTip(null);
  return (
    <>
    {tip ? <ReqTip id={tip.id} rect={tip.rect} index={index} /> : null}
    <table className="matrix">
      <thead><tr>{NEED_COLUMNS.map(([key, label]) => <Th key={key} col={key} label={label} sort={sort} onSort={onSort} />)}</tr></thead>
      <tbody>
        {sortRows(rows, sort, needKey).map((n) => (
          <tr key={n.id} className={openId === n.id ? "open" : ""} onClick={() => onOpen(n.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(n.id)}>
            <td className="goal"><span className="nid">{n.id}</span>{n.need}</td>
            <td className="by"><b>{n.raised_by}</b>{n.raised_where}</td>
            <td className="ids">
              {n.requirements.length
                ? n.requirements.map((id) => <code key={id} tabIndex={0} onMouseEnter={show(id)} onFocus={show(id)} onMouseLeave={hide} onBlur={hide}>{id}</code>)
                : <span className="muted">—</span>}
            </td>
            <td className="req">{n.requirement_text || <span className="muted">—</span>}</td>
            <td className="by">{n.requirement_by}</td>
            <td className="sol">{n.solution}</td>
            <td className="mod">{n.module}</td>
            <td className="notes">{n.notes}</td>
            <td className="status">
              {n.matrix_status
                ? <span className={`badge m-${n.matrix_status}`}>{MATRIX_STATUS_LABEL[n.matrix_status]}</span>
                : <span className={`badge s-${n.status}`}>{NEED_STATUS_LABEL[n.status]}</span>}
            </td>
            <td className="proto"><span className={`badge p-${n.prototype.state}`}>{PROTO_LABEL[n.prototype.state]}</span>{n.prototype.note ? <p>{n.prototype.note}</p> : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

type Tip = { id: string; rect: DOMRect } | null;
const TIP_WIDTH = 420;
const TIP_GAP = 6;

/** The requirement behind an ID, shown while a code chip is hovered or focused — what the matrix also did. */
function ReqTip({ id, rect, index }: { id: string; rect: DOMRect; index: DataIndex }) {
  const req = index.requirements.find((r) => r.id === id);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - TIP_WIDTH - 8));
  const below = rect.bottom < window.innerHeight * 0.7;
  const style = below ? { left, top: rect.bottom + TIP_GAP } : { left, bottom: window.innerHeight - rect.top + TIP_GAP };
  return (
    <div className="tip" role="tooltip" style={{ ...style, width: TIP_WIDTH }}>
      <p className="tip-head"><b>{id}</b>{req ? <span className={`badge r-${(req.status || "unstatused").toLowerCase()}`}>{req.status || "unstatused"}</span> : null}</p>
      {req ? <p>{req.ears || <span className="muted">no text imported</span>}</p> : <p className="muted">Not in the requirement set — the ID is cited but no file exists for it.</p>}
      {req?.sheet_note ? <p className="muted">{req.sheet_note}</p> : null}
      {req?.source ? <p className="tip-src">{req.source}</p> : null}
    </div>
  );
}

const REQ_COLUMNS: [key: string, label: string][] = [
  ["id", "ID"], ["ears", "Requirement"], ["status", "Status"], ["mod", "Module"], ["needs", "Needs it serves"], ["source", "Source"],
];

function reqKey(r: Requirement, key: string): string | number {
  switch (key) {
    case "id": return r.id;
    case "ears": return r.ears;
    case "status": return r.status || "";
    case "mod": return r.module;
    case "needs": return r.needs.length ? r.needs.length : Number.POSITIVE_INFINITY;
    case "source": return r.source ?? "";
    default: return "";
  }
}

/** Requirements first: the written set, with the needs each one serves. */
export function RequirementsTable({ rows, openId, onOpen, sort, onSort, index }: TableProps<Requirement> & { index: DataIndex }) {
  const goalOf = (id: string) => index.needs.find((n) => n.id === id);
  return (
    <table className="matrix reqs">
      <thead><tr>{REQ_COLUMNS.map(([key, label]) => <Th key={key} col={key} label={label} sort={sort} onSort={onSort} />)}</tr></thead>
      <tbody>
        {sortRows(rows, sort, reqKey).map((r) => (
          <tr key={r.id} className={openId === r.id ? "open" : ""} onClick={() => onOpen(r.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(r.id)}>
            <td className="ids"><code>{r.id}</code>{r.type && r.type !== "Requirement" ? <span className="muted"> {r.type}</span> : null}</td>
            <td className="goal">{r.ears || <span className="muted">no text imported</span>}</td>
            <td className="status"><span className={`badge r-${(r.status || "unstatused").toLowerCase()}`}>{r.status || "unstatused"}</span></td>
            <td className="mod">{r.module}</td>
            <td className="notes">{r.needs.length ? r.needs.map((id) => <span key={id} className="needref"><code>{id}</code> {goalOf(id)?.title}</span>) : <span className="muted">none linked</span>}</td>
            <td className="by">{r.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A column header that sorts: one click ascending, a second descending, a third back to the file order. */
function Th({ col, label, sort, onSort }: { col: string; label: string; sort: Sort; onSort: (s: Sort) => void }) {
  const active = sort?.key === col;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th aria-sort={ariaSort}>
      <button type="button" className="sorter" onClick={() => onSort(nextSort(sort, col))}>
        {label}<span className="arrow" aria-hidden="true">{active ? (sort.dir === "asc" ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );
}
