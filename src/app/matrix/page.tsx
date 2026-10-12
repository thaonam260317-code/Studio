import { TOOLS, USE_CASES } from "@/lib/matrix";
import { TEMPLATES } from "@/lib/templates";

export const metadata = { title: "Ma trận use case · Studio" };

export default function MatrixPage() {
  return (
    <>
      <div>
        <h1>Ma trận use case video marketing</h1>
        <p className="muted">15 use case × 15 công cụ mã nguồn mở, kiểm chứng bằng cách clone từng repo ngày 12/10/2026. Use case có nhãn “có template” dựng được ngay trong Studio.</p>
      </div>
      <div className="legend">
        <span><span className="s2" style={{ background: "var(--primary)" }} />Công cụ chính</span>
        <span><span style={{ background: "var(--assist)" }} />Hỗ trợ</span>
      </div>
      <div className="scroller">
        <table className="m">
          <thead>
            <tr>
              <th className="uc mono">USE CASE</th>
              {TOOLS.map((t) => (
                <th key={t.id}>
                  <div className="tool">
                    <a href={`https://github.com/${t.repo}`} target="_blank" rel="noreferrer">{t.name}</a>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USE_CASES.map((u) => (
              <tr key={u.id}>
                <th className="uc" scope="row">
                  {u.name} {u.template && <span className="pill">có template: {TEMPLATES[u.template].name}</span>}
                  <small>{u.format} · {u.input} → {u.output} · công sức {u.effort.toLowerCase()}</small>
                </th>
                {TOOLS.map((t) => {
                  const c = u.tools[t.id];
                  return (
                    <td key={t.id} className="c">
                      {c && <span className={`s${c[0]}`} title={`${t.name}: ${c[1]}`} aria-label={`${c[0] === 2 ? "chính" : "hỗ trợ"}: ${c[1]}`} />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
