import type { DataIndex, Need, Requirement } from "./model";
import { MATRIX_STATUS_LABEL, NEED_STATUS_LABEL, PROTO_LABEL } from "./model";

interface TableProps<T> {
  rows: T[];
  openId: string | null;
  onOpen: (id: string) => void;
}

/** The module matrix, one need per row — the same columns and order as the matrix everyone has seen. */
export function NeedsTable({ rows, openId, onOpen }: TableProps<Need>) {
  return (
    <table className="matrix">
      <thead>
        <tr>
          <th>User goal</th><th>Goal by</th><th>ID</th><th>Requirement</th><th>Requirement by</th>
          <th>Possible solution</th><th>Module</th><th>Notes</th><th>Status</th><th>Prototype</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((n) => (
          <tr key={n.id} className={openId === n.id ? "open" : ""} onClick={() => onOpen(n.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(n.id)}>
            <td className="goal"><span className="nid">{n.id}</span>{n.need}</td>
            <td className="by"><b>{n.raised_by}</b>{n.raised_where}</td>
            <td className="ids">{n.requirements.length ? n.requirements.map((id) => <code key={id}>{id}</code>) : <span className="muted">—</span>}</td>
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
  );
}

/** Requirements first: the written set, with the needs each one serves. */
export function RequirementsTable({ rows, openId, onOpen, index }: TableProps<Requirement> & { index: DataIndex }) {
  const goalOf = (id: string) => index.needs.find((n) => n.id === id);
  return (
    <table className="matrix reqs">
      <thead>
        <tr><th>ID</th><th>Requirement</th><th>Status</th><th>Module</th><th>Needs it serves</th><th>Source</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
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
