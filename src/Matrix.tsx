import { useState } from "react";
import type { DataIndex, Lens, MatrixStatus, Need, ProtoState, Requirement } from "./model";
import { MATRIX_STATUS_LABEL, NEED_STATUS_LABEL, PROTO_LABEL } from "./model";
import { nextSort, sortRows, type Sort } from "./sort";

/** One row of the matrix: a goal with the requirements that serve it, or a requirement with the goals it serves. */
interface Row {
  id: string;
  needs: Need[];
  reqs: Requirement[];
  /** The hand-written requirement summary and attribution from the matrix (needs grain only). */
  reqText: string;
  reqBy: string;
  module: string;
}

interface Column {
  key: string;
  label: string;
  cell: (row: Row) => React.ReactNode;
  sortKey: (row: Row) => string | number;
}

interface MatrixProps {
  grain: Lens;
  needs: Need[];
  reqs: Requirement[];
  index: DataIndex;
  openId: string | null;
  onOpen: (id: string) => void;
  sort: Sort;
  onSort: (sort: Sort) => void;
}

// Status columns sort by meaning, in the order the matrix legend lists them.
const MATRIX_RANK: Record<MatrixStatus, number> = { confirmed: 0, future: 1, discussion: 2, unwritten: 3, contested: 4 };
const PROTO_RANK: Record<ProtoState, number> = { built: 0, partial: 1, planned: 2, none: 3 };
const NONE = Number.POSITIVE_INFINITY;

function needRow(n: Need, index: DataIndex): Row {
  const reqs = n.requirements.map((id) => index.requirements.find((r) => r.id === id)).filter(Boolean) as Requirement[];
  return { id: n.id, needs: [n], reqs, reqText: n.requirement_text ?? "", reqBy: n.requirement_by ?? "", module: n.module };
}

function reqRow(r: Requirement, index: DataIndex): Row {
  const needs = r.needs.map((id) => index.needs.find((n) => n.id === id)).filter(Boolean) as Need[];
  return { id: r.id, needs, reqs: [r], reqText: r.ears, reqBy: r.source ?? "", module: r.module };
}

/** The module matrix. The grain decides which side leads the row; the columns are the same either way. */
export function Matrix({ grain, needs, reqs, index, openId, onOpen, sort, onSort }: MatrixProps) {
  const { tip, show, hide } = useChipTip();
  const chip = (id: string, key = id) => <code key={key} tabIndex={0} onMouseEnter={show(id)} onFocus={show(id)} onMouseLeave={hide} onBlur={hide}>{id}</code>;
  const rows = grain === "needs" ? needs.map((n) => needRow(n, index)) : reqs.map((r) => reqRow(r, index));
  const columns = columnsFor(grain, chip);
  return (
    <>
      {tip ? <Popover rect={tip.rect}>{tip.id.startsWith("N-") ? <NeedTip id={tip.id} index={index} /> : <ReqTip id={tip.id} index={index} />}</Popover> : null}
      <table className={`matrix grain-${grain}`}>
        <thead><tr>{columns.map((c) => <Th key={c.key} col={c.key} label={c.label} sort={sort} onSort={onSort} />)}</tr></thead>
        <tbody>
          {sortRows(rows, sort, (row, key) => columns.find((c) => c.key === key)?.sortKey(row) ?? "").map((row) => (
            <tr key={row.id} className={openId === row.id ? "open" : ""} onClick={() => onOpen(row.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(row.id)}>
              {columns.map((c) => <td key={c.key} className={c.key}>{c.cell(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

type Chip = (id: string, key?: string) => React.ReactNode;

// The goal side stacks one block per need, so a requirement serving two goals shows both, aligned across cells.
const blocks = (row: Row, render: (n: Need) => React.ReactNode) =>
  row.needs.length ? row.needs.map((n) => <div key={n.id} className="blk">{render(n)}</div>) : <span className="muted">—</span>;
const first = (row: Row) => row.needs[0];

function columnsFor(grain: Lens, chip: Chip): Column[] {
  const goalSide: Column[] = [
    {
      key: "goal", label: "User goal",
      cell: (row) => blocks(row, (n) => <>{grain === "needs" ? <span className="nid">{n.id}</span> : <span className="nid">{chip(n.id)}</span>}{n.need}</>),
      sortKey: (row) => first(row)?.need ?? "",
    },
    { key: "by", label: "Goal by", cell: (row) => blocks(row, (n) => <><b>{n.raised_by}</b>{n.raised_where}</>), sortKey: (row) => first(row)?.raised_by ?? "" },
  ];
  const reqSide: Column[] = [
    {
      key: "ids", label: "ID",
      cell: (row) => grain === "needs"
        ? (first(row)?.requirements.length ? first(row)!.requirements.map((id) => chip(id)) : <span className="muted">—</span>)
        : <code>{row.reqs[0]?.id}</code>,
      sortKey: (row) => (grain === "needs" ? first(row)?.requirements[0] ?? "" : row.reqs[0]?.id ?? ""),
    },
    {
      key: "req", label: "Requirement",
      cell: (row) => grain === "needs"
        ? row.reqText || <span className="muted">—</span>
        : <><span className={`badge r-${(row.reqs[0]?.status || "unstatused").toLowerCase()}`}>{row.reqs[0]?.status || "unstatused"}</span><p>{row.reqText || <span className="muted">no text imported</span>}</p></>,
      sortKey: (row) => row.reqText,
    },
    { key: "reqby", label: "Requirement by", cell: (row) => grain === "needs" ? row.reqBy : <>{row.reqBy}{row.reqs[0]?.sheet_note ? <p>{row.reqs[0].sheet_note}</p> : null}</>, sortKey: (row) => row.reqBy },
  ];
  const shared: Column[] = [
    { key: "sol", label: "Possible solution", cell: (row) => blocks(row, (n) => n.solution), sortKey: (row) => first(row)?.solution ?? "" },
    { key: "mod", label: "Module", cell: (row) => row.module, sortKey: (row) => row.module },
    { key: "notes", label: "Notes", cell: (row) => blocks(row, (n) => n.notes), sortKey: (row) => first(row)?.notes ?? "" },
    {
      key: "status", label: "Status",
      cell: (row) => blocks(row, (n) => n.matrix_status
        ? <span className={`badge m-${n.matrix_status}`}>{MATRIX_STATUS_LABEL[n.matrix_status]}</span>
        : <span className={`badge s-${n.status}`}>{NEED_STATUS_LABEL[n.status]}</span>),
      sortKey: (row) => { const n = first(row); return n?.matrix_status ? MATRIX_RANK[n.matrix_status] : NONE; },
    },
    {
      key: "proto", label: "Prototype",
      cell: (row) => blocks(row, (n) => <><span className={`badge p-${n.prototype.state}`}>{PROTO_LABEL[n.prototype.state]}</span>{n.prototype.note ? <p>{n.prototype.note}</p> : null}</>),
      sortKey: (row) => { const n = first(row); return n ? PROTO_RANK[n.prototype.state] : NONE; },
    },
  ];
  return grain === "needs" ? [...goalSide, ...reqSide, ...shared] : [...reqSide, ...goalSide, ...shared];
}

type Tip = { id: string; rect: DOMRect } | null;
const TIP_WIDTH = 420;
const TIP_GAP = 6;

/** Which chip is hovered or focused, and where it sits — one tip at a time. */
function useChipTip() {
  const [tip, setTip] = useState<Tip>(null);
  const show = (id: string) => (e: React.SyntheticEvent<HTMLElement>) => setTip({ id, rect: e.currentTarget.getBoundingClientRect() });
  const hide = () => setTip(null);
  return { tip, show, hide };
}

/** Anchored under the chip; flips above it near the bottom of the viewport and stays inside the right edge. */
function Popover({ rect, children }: { rect: DOMRect; children: React.ReactNode }) {
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - TIP_WIDTH - 8));
  const below = rect.bottom < window.innerHeight * 0.7;
  const style = below ? { left, top: rect.bottom + TIP_GAP } : { left, bottom: window.innerHeight - rect.top + TIP_GAP };
  return <div className="tip" role="tooltip" style={{ ...style, width: TIP_WIDTH }}>{children}</div>;
}

/** The requirement behind an ID — what the matrix also showed. */
function ReqTip({ id, index }: { id: string; index: DataIndex }) {
  const req = index.requirements.find((r) => r.id === id);
  return (
    <>
      <p className="tip-head"><b>{id}</b>{req ? <span className={`badge r-${(req.status || "unstatused").toLowerCase()}`}>{req.status || "unstatused"}</span> : null}</p>
      {req ? <p>{req.ears || <span className="muted">no text imported</span>}</p> : <p className="muted">Not in the requirement set — the ID is cited but no file exists for it.</p>}
      {req?.sheet_note ? <p className="muted">{req.sheet_note}</p> : null}
      {req?.source ? <p className="tip-src">{req.source}</p> : null}
    </>
  );
}

/** The need behind an N-### — who wanted it, where they said it, how far the prototype is. */
function NeedTip({ id, index }: { id: string; index: DataIndex }) {
  const n = index.needs.find((x) => x.id === id);
  if (!n) return <p className="tip-head"><b>{id}</b><span className="muted">no need file with this ID</span></p>;
  return (
    <>
      <p className="tip-head">
        <b>{id}</b>
        {n.matrix_status ? <span className={`badge m-${n.matrix_status}`}>{MATRIX_STATUS_LABEL[n.matrix_status]}</span> : null}
        <span className={`badge p-${n.prototype.state}`}>{PROTO_LABEL[n.prototype.state]}</span>
      </p>
      <p>{n.need}</p>
      <p className="tip-src">{n.raised_by}{n.raised_where ? ` · ${n.raised_where}` : ""}</p>
    </>
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
