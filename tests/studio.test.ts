import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { extractBrand, parseSite, recommend } from "../src/lib/analyze.ts";
import { fallbackScript } from "../src/lib/brief.ts";
import { normalizeScript } from "../src/lib/script.ts";
import { buildProject, timingFor, validateFor } from "../src/lib/templates.ts";

const HTML = `<!doctype html><html><head>
<title>Lumen Notes – Ghi chú tự sắp xếp</title>
<meta name="description" content="Lumen gom ghi chú của bạn về một chỗ. Miễn phí cho cá nhân.">
<meta name="theme-color" content="#5b7cff">
<style>.btn{background:#ff8a3d}.x{color:#ff8a3d}.y{color:#111111}</style>
</head><body>
<h1>Ghi chú tự sắp xếp khi bạn viết</h1>
<h2>Tìm mọi thứ bằng câu hỏi</h2><h2>Chia sẻ trong một chạm</h2>
<meta property="og:site_name" content="Lumen &#x27;Notes&#x27;"><p>Hơn 12,000+ người dùng mỗi tuần tin dùng Lumen để giữ ý tưởng không bị thất lạc giữa các ứng dụng. Node 18 + Bun.</p>
<script>var ignored = "<h2>không lấy</h2>";</script>
</body></html>`;

test("parseSite lấy tiêu đề, mô tả, heading, số liệu và bỏ qua script", () => {
  const f = parseSite("https://www.lumen.example/", HTML);
  assert.equal(f.domain, "lumen.example");
  assert.equal(f.title, "Lumen Notes – Ghi chú tự sắp xếp");
  assert.match(f.description, /gom ghi chú/);
  assert.deepEqual(f.headings, ["Ghi chú tự sắp xếp khi bạn viết", "Tìm mọi thứ bằng câu hỏi", "Chia sẻ trong một chạm"]);
  assert.ok(f.numbers.includes("12,000+"));
});

test("extractBrand ưu tiên theme-color, lấy màu thứ hai làm accent, bỏ màu xám", () => {
  const b = extractBrand(HTML);
  assert.equal(b.primary, "#5b7cff");
  assert.equal(b.accent, "#ff8a3d");
});

test("recommend gợi ý stat-reveal kèm số liệu tìm được", () => {
  const recs = recommend(parseSite("https://lumen.example", HTML));
  const stat = recs.find((r) => r.useCase.id === "stat-reveal");
  assert.ok(stat?.reason.includes("12,000+"));
  assert.equal(recs.filter((r) => r.ready).length, 3);
});

test("fallbackScript dựng kịch bản hợp lệ cho mọi template khi không có API key", () => {
  const f = parseSite("https://lumen.example", HTML);
  for (const t of ["launch-film", "teaser", "stat-reveal"] as const) {
    const s = fallbackScript(f, t);
    assert.ok(s.scenes.length >= 1, t);
    assert.equal(s.url, "lumen.example");
  }
  assert.deepEqual(fallbackScript(f, "stat-reveal").stats[0], { prefix: "", value: 12000, suffix: "+", label: "theo trang chủ" });
});

test("normalizeScript cắt chữ quá dài và giới hạn số cảnh", () => {
  const s = normalizeScript({
    title: "x".repeat(80), tagline: "t", cta: "c", url: "u",
    scenes: Array.from({ length: 8 }, () => ({ kicker: "k", headline: "h", body: "" })),
    stats: [{ value: Number.NaN, prefix: "", suffix: "", label: "" }],
  });
  assert.equal(s.title.length, 40);
  assert.equal(s.scenes.length, 5);
  assert.equal(s.stats.length, 0);
});

test("timingFor: teaser khớp lưới 120 BPM", () => {
  const s = fallbackScript(parseSite("https://lumen.example", HTML), "teaser");
  const t = timingFor("teaser", s);
  assert.equal((t.total / t.beat) % 1, 0);
  assert.equal(validateFor("stat-reveal", { ...s, stats: [] }), "Template số liệu cần ít nhất một con số.");
});

test("buildProject ghi dự án HyperFrames với dữ liệu an toàn trong thẻ script", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "studio-"));
  const s = fallbackScript(parseSite("https://lumen.example", HTML), "launch-film");
  s.scenes[0].headline = "</script><b>x</b>";
  const timing = await buildProject({ dir, template: "launch-film", aspect: "9:16", script: s, brand: { background: "#000", text: "#fff", primary: "#123456", accent: "red;}" } });
  const html = await readFile(path.join(dir, "index.html"), "utf8");
  assert.ok(!html.includes("{{"));
  assert.ok(!html.includes("</script><b>"));
  assert.match(html, /data-width="1080" data-height="1920"/);
  assert.match(html, new RegExp(`data-duration="${timing.total}"`));
  assert.match(html, /--accent: #888888/);
  assert.match(html, /class="portrait"/);
});

test("parseSite giải mã entity dạng hex và bỏ số có khoảng trắng trước dấu +", () => {
  const f = parseSite("https://lumen.example", HTML.replace("<title>Lumen Notes", "<title>Lumen&#x27;s Notes"));
  assert.ok(f.title.startsWith("Lumen's Notes"));
  assert.ok(!f.numbers.some((n) => n.includes(" ")));
});
