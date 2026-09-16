export type NeedStatus = "unwritten" | "proposed" | "covered" | "rejected";
export type ProtoState = "built" | "partial" | "planned" | "none";
/** The status vocabulary of the module matrix the team reviews; kept alongside the file-level status. */
export type MatrixStatus = "confirmed" | "future" | "discussion" | "unwritten" | "contested";

export interface Source {
  meeting: string;
  /** mm:ss into the recording. */
  offset: string;
  /** Wall-clock time, local to the meeting: YYYY-MM-DDTHH:MM. */
  at: string;
  approx?: boolean;
}

export interface Need {
  id: string;
  title: string;
  module: string;
  raised_by: string;
  raised_where?: string;
  status: NeedStatus;
  matrix_status?: MatrixStatus;
  requirements: string[];
  requirement_text?: string;
  requirement_by?: string;
  sources: Source[];
  solution?: string;
  prototype: { state: ProtoState; note?: string };
  notes?: string;
  /** The need statement itself (the file body). */
  need: string;
}

export interface Requirement {
  id: string;
  ears: string;
  status: string;
  type?: string;
  module: string;
  sheet_note?: string;
  source?: string;
  needs: string[];
  verifies: string[];
  satisfies: string[];
  notes?: string;
}

export interface DataIndex {
  generatedAt: string;
  needs: Need[];
  requirements: Requirement[];
}

export type Lens = "needs" | "requirements";

export const NEED_STATUS_LABEL: Record<NeedStatus, string> = {
  unwritten: "no requirement yet",
  proposed: "draft proposed",
  covered: "covered",
  rejected: "rejected",
};

export const MATRIX_STATUS_LABEL: Record<MatrixStatus, string> = {
  confirmed: "confirmed",
  future: "future",
  discussion: "up for discussion",
  unwritten: "unwritten",
  contested: "contested",
};

export const PROTO_LABEL: Record<ProtoState, string> = {
  built: "in prototype",
  partial: "partly",
  planned: "in build",
  none: "not yet",
};

/** "2026-09-11T17:57" → "11 Sep 17:57" for the reader; the file keeps ISO. */
export function formatAt(at: string, approx?: boolean): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(at);
  if (!m) return at;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(Number(m[3]));
  return `${day} ${months[Number(m[2]) - 1]} ${approx ? "≈" : ""}${m[4]}:${m[5]}`;
}
