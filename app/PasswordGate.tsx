"use client";

import { FormEvent, useState } from "react";

export default function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(password)) {
      setError("请输入 6 位数字密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("密码不正确，请重试");
        return;
      }
      window.location.reload();
    } catch {
      setError("暂时无法验证，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="gatePage">
      <div className="gateOrbits" aria-hidden="true" />
      <section className="gateCard" aria-labelledby="gate-title">
        <div className="brand gateBrand">
          <span className="brandMark">AC</span>
          <span>AI Compiler<br /><b>YEAR ONE</b></span>
        </div>
        <span className="gateIndex">PRIVATE STUDY MAP · 52 WEEKS</span>
        <h1 id="gate-title">进入你的<br /><em>年度作战室</em></h1>
        <p>学习进度只保存在当前浏览器。输入访问密码后，即可继续查看和勾选每日计划。</p>
        <form onSubmit={submit}>
          <label htmlFor="plan-password">访问密码</label>
          <div className="passwordRow">
            <input
              id="plan-password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              aria-describedby="password-hint password-error"
              autoFocus
            />
            <button type="submit" disabled={loading}>{loading ? "验证中" : "进入 →"}</button>
          </div>
          <span id="password-hint" className="passwordHint">提示：6 位数</span>
          <span id="password-error" className="passwordError" role="alert">{error}</span>
        </form>
        <div className="gateFooter"><span>365 DAYS</span><i /><span>3 PROJECTS</span><i /><span>1 GOAL</span></div>
      </section>
    </main>
  );
}
