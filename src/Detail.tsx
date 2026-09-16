import type { DataIndex, Need, Requirement } from "./model";
import { NEED_STATUS_LABEL, PROTO_LABEL, formatAt } from "./model";

export function NeedDetail({ need, index, onOpen }: { need: Need; index: DataIndex; onOpen: (id: string) => void }) {
  const reqs = need.requirements.map((id) => index.requirements.find((r) => r.id === id)).filter(Boolean) as Requirement[];
  return (
    <article className="detail">
      <p className="eyebrow">{need.id} · {need.module}</p>
      <h2>{need.need}</h2>
      <Row k="Status"><span className={`badge s-${need.status}`}>{NEED_STATUS_LABEL[need.status]}</span></Row>
      <Row k="Raised by">{need.raised_by}{need.raised_where ? <span className="muted"> · {need.raised_where}</span> : null}</Row>
      {need.sources.length ? (
        <Row k="Said at">
          <ul className="plain">
            {need.sources.map((s, i) => (
              <li key={i}><b>{formatAt(s.at, s.approx)}</b> <span className="muted">· {s.meeting} · {s.offset} into the recording</span></li>
            ))}
          </ul>
        </Row>
      ) : null}
      <Row k="Requirements">
        {reqs.length ? (
          <ul className="plain">
            {reqs.map((r) => (
              <li key={r.id}><button type="button" className="link" onClick={() => onOpen(r.id)}>{r.id}</button> <span className="muted">{r.status}</span><br />{r.ears}</li>
            ))}
          </ul>
        ) : (
          <span className="muted">{need.requirement_text || "none written"}{need.requirement_by ? ` — ${need.requirement_by}` : ""}</span>
        )}
      </Row>
      {need.solution ? <Row k="Solution">{need.solution}</Row> : null}
      <Row k="Prototype"><span className={`badge p-${need.prototype.state}`}>{PROTO_LABEL[need.prototype.state]}</span>{need.prototype.note ? <p className="muted">{need.prototype.note}</p> : null}</Row>
      {need.notes ? <Row k="Notes">{need.notes}</Row> : null}
    </article>
  );
}

export function RequirementDetail({ req, index, onOpen }: { req: Requirement; index: DataIndex; onOpen: (id: string) => void }) {
  const needs = req.needs.map((id) => index.needs.find((n) => n.id === id)).filter(Boolean) as Need[];
  return (
    <article className="detail">
      <p className="eyebrow">{req.id} · {req.module}{req.type ? ` · ${req.type}` : ""}</p>
      <h2>{req.ears || <span className="muted">no text imported</span>}</h2>
      <Row k="Status"><span className={`badge r-${(req.status || "unstatused").toLowerCase()}`}>{req.status || "unstatused"}</span></Row>
      {req.sheet_note ? <Row k="Sheet note">{req.sheet_note}</Row> : null}
      {req.source ? <Row k="Source"><span className="muted">{req.source}</span></Row> : null}
      <Row k="Needs behind it">
        {needs.length ? (
          <ul className="plain">
            {needs.map((n) => (
              <li key={n.id}>
                <button type="button" className="link" onClick={() => onOpen(n.id)}>{n.id}</button> <span className="muted">{n.raised_by}{n.sources[0] ? ` · ${formatAt(n.sources[0].at, n.sources[0].approx)}` : ""}</span>
                <br />{n.need}
                <br /><span className={`badge p-${n.prototype.state}`}>{PROTO_LABEL[n.prototype.state]}</span>
              </li>
            ))}
          </ul>
        ) : <span className="muted">none linked</span>}
      </Row>
      <Row k="Verified by">{req.verifies.length ? req.verifies.join(", ") : <span className="muted">no tests linked yet</span>}</Row>
      <Row k="Satisfied by">{req.satisfies.length ? req.satisfies.join(", ") : <span className="muted">no code linked yet</span>}</Row>
    </article>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <div className="k">{k}</div>
      <div className="v">{children}</div>
    </div>
  );
}
