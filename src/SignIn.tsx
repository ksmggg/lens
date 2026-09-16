import { useState } from "react";

export function SignIn({ error, onSubmit }: { error: string | null; onSubmit: (token: string, remember: boolean) => void }) {
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  return (
    <main className="signin">
      <h1>lens</h1>
      <p className="lede">Two views over one folder of needs and requirements. The data stays in its private repository; this page only reads it with your token.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (token.trim()) onSubmit(token.trim(), remember);
        }}
      >
        <label htmlFor="token">GitHub token</label>
        <input id="token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" />
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember on this device
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button type="submit" disabled={!token.trim()}>Open</button>
      </form>
      <p className="hint">A fine-grained token with read access to the data repository is enough. Nothing is stored anywhere but this browser.</p>
    </main>
  );
}
