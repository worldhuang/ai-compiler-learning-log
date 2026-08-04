"use client";

import { FormEvent, useState } from "react";

export default function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(password)) return setError("请输入 6 位数字密码");
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) return setError("密码不正确，请重试");
      window.location.reload();
    } catch { setError("暂时无法验证，请稍后重试"); }
    finally { setLoading(false); }
  }

  return <main className="gatePage"><div className="gateOrbits" aria-hidden="true"/><section className="gateCard" aria-labelledby="gate-title">
    <div className="brand gateBrand"><span className="brandMark">AC</span><span>AI Compiler<br/><b>LEARNING LOG</b></span></div>
    <span className="gateIndex">PRIVATE LEARNING LOG · 52 WEEKS</span><h1 id="gate-title">进入你的<br/><em>学习日志</em></h1>
    <p>输入访问密码，继续查看每日任务、知识链接与完成记录。</p>
    <form onSubmit={submit}><label htmlFor="plan-password">访问密码</label><div className="passwordRow">
      <input id="plan-password" type="password" inputMode="numeric" autoComplete="current-password" maxLength={6} value={password} onChange={event=>setPassword(event.target.value.replace(/\D/g,""))} placeholder="••••••" autoFocus/>
      <button type="submit" disabled={loading}>{loading?"验证中":"进入 →"}</button>
    </div><span className="passwordHint">提示：6 位数</span><span className="passwordError" role="alert">{error}</span></form>
    <div className="gateFooter"><span>52 WEEKS</span><i/><span>364 TASKS</span><i/><span>1 LOG</span></div>
  </section></main>;
}
