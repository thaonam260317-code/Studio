"use client";

import { useEffect, useState } from "react";
import type { Recommendation, SiteFacts } from "@/lib/analyze";
import type { TemplateId } from "@/lib/matrix";
import type { Brand, VideoScript } from "@/lib/script";

type Aspect = "16:9" | "9:16" | "1:1" | "4:5";
interface Job { id: string; status: "queued" | "rendering" | "done" | "failed"; duration?: number; error?: string; aspect: Aspect; template: TemplateId }

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
  return data as T;
}

const ASPECT_LABEL: Record<Aspect, string> = { "16:9": "16:9 YouTube, web", "9:16": "9:16 Reels, TikTok", "1:1": "1:1 Feed", "4:5": "4:5 Instagram, LinkedIn" };

export default function StudioFlow() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facts, setFacts] = useState<SiteFacts | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [template, setTemplate] = useState<TemplateId>("launch-film");
  const [aspects, setAspects] = useState<Aspect[]>(["16:9", "9:16"]);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [scriptNote, setScriptNote] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  };

  const analyze = () => run("Đang đọc trang…", async () => {
    const r = await post<{ facts: SiteFacts; recommendations: Recommendation[] }>("/api/analyze", { url });
    setFacts(r.facts); setRecs(r.recommendations); setBrand(r.facts.brand); setScript(null); setJobs([]);
  });

  const write = () => run("Claude đang viết kịch bản…", async () => {
    const r = await post<{ script: VideoScript; source: string; note?: string }>("/api/script", { facts, template, language: "vi" });
    setScript(r.script);
    setScriptNote(r.source === "claude" ? "Kịch bản do Claude viết từ nội dung trang. Hãy sửa trước khi render." : r.note ?? null);
  });

  const render = () => run("Đang gửi lệnh render…", async () => {
    const created = await Promise.all(aspects.map((aspect) => post<Job>("/api/jobs", { template, aspect, quality: "draft", script, brand })));
    setJobs(created);
  });

  // Hỏi trạng thái các job đang render.
  useEffect(() => {
    if (!jobs.some((j) => j.status === "queued" || j.status === "rendering")) return;
    const t = setInterval(async () => {
      const next = await Promise.all(jobs.map(async (j) => (j.status === "done" || j.status === "failed" ? j : ((await (await fetch(`/api/jobs/${j.id}`)).json()) as Job))));
      setJobs(next);
    }, 2500);
    return () => clearInterval(t);
  }, [jobs]);

  const patchScene = (i: number, key: "kicker" | "headline" | "body", v: string) =>
    setScript((s) => s && { ...s, scenes: s.scenes.map((sc, j) => (j === i ? { ...sc, [key]: v } : sc)) });
  const patchStat = (i: number, key: "prefix" | "value" | "suffix" | "label", v: string) =>
    setScript((s) => s && { ...s, stats: s.stats.map((st, j) => (j === i ? { ...st, [key]: key === "value" ? Number(v) : v } : st)) });

  return (
    <>
      <section className="step">
        <div className="step-head"><span className="n">BƯỚC 1</span><h2>Phân tích trang sản phẩm</h2></div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); analyze(); }}>
          <input id="url" type="url" required placeholder="https://sanpham-cua-ban.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" disabled={!!busy}>Phân tích</button>
        </form>
        {facts && brand && (
          <div className="facts">
            <div>
              <p><b>{facts.title}</b> <span className="mono muted">{facts.domain}</span></p>
              <p className="muted">{facts.description || "Trang không có mô tả."}</p>
              <ul>{facts.headings.slice(0, 6).map((h) => <li key={h}>{h}</li>)}</ul>
              {facts.numbers.length > 0 && <p className="note">Số liệu tìm thấy: {facts.numbers.join(", ")}</p>}
            </div>
            <div>
              <p className="note">Màu thương hiệu (bấm để đổi)</p>
              <div className="swatches">
                {(Object.keys(brand) as Array<keyof Brand>).map((k) => (
                  <label key={k} className="swatch">
                    <input id={`color-${k}`} type="color" value={brand[k]} onChange={(e) => setBrand({ ...brand, [k]: e.target.value })} />
                    {k}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {facts && (
        <section className="step">
          <div className="step-head"><span className="n">BƯỚC 2</span><h2>Chọn loại video</h2></div>
          <div className="choices">
            {recs.map((r) => (
              <button key={r.useCase.id} type="button" className="choice" disabled={!r.ready}
                aria-pressed={r.useCase.template === template}
                onClick={() => { if (r.useCase.template) { setTemplate(r.useCase.template); setScript(null); } }}>
                <b>{r.useCase.name}</b>
                <span className="note">{r.reason}</span>
                <span className="pill">{r.ready ? r.useCase.format : "giai đoạn 2"}</span>
              </button>
            ))}
          </div>
          <div className="row">
            {(Object.keys(ASPECT_LABEL) as Aspect[]).map((a) => (
              <label key={a} className="row" style={{ gap: 6 }}>
                <input id={`aspect-${a}`} type="checkbox" checked={aspects.includes(a)}
                  onChange={(e) => setAspects(e.target.checked ? [...aspects, a] : aspects.filter((x) => x !== a))} />
                {ASPECT_LABEL[a]}
              </label>
            ))}
          </div>
          <div className="row"><button type="button" onClick={write} disabled={!!busy}>Viết kịch bản</button></div>
        </section>
      )}

      {script && (
        <section className="step">
          <div className="step-head"><span className="n">BƯỚC 3</span><h2>Duyệt kịch bản</h2></div>
          {scriptNote && <p className="note">{scriptNote}</p>}
          <div className="row">
            <input id="title" type="text" value={script.title} onChange={(e) => setScript({ ...script, title: e.target.value })} aria-label="Tên" />
            <input id="tagline" type="text" style={{ flex: 1 }} value={script.tagline} onChange={(e) => setScript({ ...script, tagline: e.target.value })} aria-label="Tagline" />
          </div>
          <div>
            {script.scenes.map((sc, i) => (
              <div key={i} className="scene-edit">
                <input id={`kicker-${i}`} type="text" value={sc.kicker} onChange={(e) => patchScene(i, "kicker", e.target.value)} aria-label={`Nhãn cảnh ${i + 1}`} />
                <input id={`headline-${i}`} type="text" value={sc.headline} onChange={(e) => patchScene(i, "headline", e.target.value)} aria-label={`Headline cảnh ${i + 1}`} />
                {template !== "teaser" && (
                  <input id={`body-${i}`} className="full" type="text" value={sc.body} placeholder="Câu phụ (có thể để trống)" onChange={(e) => patchScene(i, "body", e.target.value)} aria-label={`Câu phụ cảnh ${i + 1}`} />
                )}
              </div>
            ))}
          </div>
          {template !== "teaser" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p className="note">Số liệu (chỉ dùng số có thật)</p>
              {script.stats.map((st, i) => (
                <div key={i} className="stat-edit">
                  <input id={`prefix-${i}`} type="text" value={st.prefix} onChange={(e) => patchStat(i, "prefix", e.target.value)} aria-label="Tiền tố" />
                  <input id={`value-${i}`} type="number" value={st.value} onChange={(e) => patchStat(i, "value", e.target.value)} aria-label="Giá trị" />
                  <input id={`suffix-${i}`} type="text" value={st.suffix} onChange={(e) => patchStat(i, "suffix", e.target.value)} aria-label="Hậu tố" />
                  <input id={`label-${i}`} type="text" value={st.label} onChange={(e) => patchStat(i, "label", e.target.value)} aria-label="Nhãn" />
                  <button type="button" className="ghost" onClick={() => setScript({ ...script, stats: script.stats.filter((_, j) => j !== i) })}>Xóa</button>
                </div>
              ))}
              {script.stats.length < 3 && (
                <div><button type="button" className="ghost" onClick={() => setScript({ ...script, stats: [...script.stats, { prefix: "", value: 0, suffix: "", label: "" }] })}>Thêm số liệu</button></div>
              )}
            </div>
          )}
          <div className="row">
            <input id="cta" type="text" value={script.cta} onChange={(e) => setScript({ ...script, cta: e.target.value })} aria-label="Lời kêu gọi" />
            <input id="domain" type="text" value={script.url} onChange={(e) => setScript({ ...script, url: e.target.value })} aria-label="Tên miền" />
          </div>
          <div className="row">
            <button type="button" onClick={render} disabled={!!busy || aspects.length === 0}>Render {aspects.join(" + ")}</button>
            <button type="button" className="ghost" onClick={write} disabled={!!busy}>Viết lại</button>
          </div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="step">
          <div className="step-head"><span className="n">BƯỚC 4</span><h2>Video</h2></div>
          <div className="facts">
            {jobs.map((j) => (
              <div key={j.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p className="mono">{j.aspect} · {j.duration ?? "?"}s · {j.status === "done" ? "xong" : j.status === "failed" ? "lỗi" : "đang render"}</p>
                {j.status === "done" && <video src={`/api/jobs/${j.id}/video`} controls playsInline />}
                {j.status === "done" && <a href={`/api/jobs/${j.id}/video`} download>Tải MP4</a>}
                {j.status === "failed" && <p className="error">{j.error}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {busy && <p className="note" role="status">{busy}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
