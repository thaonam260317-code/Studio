import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TemplateId } from "./matrix.ts";
import type { Brand, VideoScript } from "./script.ts";

export type Aspect = "16:9" | "9:16" | "1:1" | "4:5";

export const ASPECTS: Record<Aspect, { w: number; h: number }> = {
  "16:9": { w: 1920, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
};

export const TEMPLATES: Record<TemplateId, { name: string; description: string }> = {
  "launch-film": { name: "Launch film", description: "Mở tên thương hiệu, 3–5 cảnh thông điệp, số liệu, end card. Khoảng 20–30 giây." },
  teaser: { name: "Teaser theo beat", description: "Cắt theo lưới 120 BPM, chữ lớn, nền đổi màu thương hiệu. Khoảng 8–12 giây." },
  "stat-reveal": { name: "Số liệu nổi bật", description: "Trường điểm hút về tâm, từng con số đếm lên trong vòng tròn. Khoảng 8–12 giây." },
};

export interface Timing {
  total: number;
  intro: number;
  end: number;
  scene: number;
  stats: number;
  stat: number;
  beat: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Thời lượng từng phần, tính từ kịch bản. Template đọc lại đúng các số này. */
export function timingFor(template: TemplateId, script: VideoScript): Timing {
  const scenes = script.scenes.length;
  const statsCount = script.stats.length;
  if (template === "teaser") {
    const beat = 0.5; // 120 BPM
    const intro = beat * 2, scene = beat * 4, end = beat * 5;
    return { total: round(intro + scenes * scene + end), intro, end, scene, stats: 0, stat: 0, beat };
  }
  if (template === "stat-reveal") {
    const intro = 2.2, stat = 3, end = 2.4;
    return { total: round(intro + statsCount * stat + end), intro, end, scene: 0, stats: 0, stat, beat: 0 };
  }
  const intro = 2.6, scene = 3.4, stats = statsCount ? 4 : 0, end = 3.4;
  return { total: round(intro + scenes * scene + stats + end), intro, end, scene, stats, stat: 0, beat: 0 };
}

export function validateFor(template: TemplateId, script: VideoScript): string | null {
  if (template === "stat-reveal" && script.stats.length === 0) return "Template số liệu cần ít nhất một con số.";
  if (template !== "stat-reveal" && script.scenes.length === 0) return "Kịch bản cần ít nhất một cảnh.";
  return null;
}

const ROOT = process.cwd();
const TEMPLATE_DIR = path.join(ROOT, "templates");

/** Escape để JSON nằm an toàn trong thẻ <script>. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const safeCss = (c: string) => (/^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "#888888");

/** Dựng một thư mục dự án HyperFrames hoàn chỉnh cho một lần render. */
export async function buildProject(opts: {
  dir: string;
  template: TemplateId;
  aspect: Aspect;
  script: VideoScript;
  brand: Brand;
}): Promise<Timing> {
  const { dir, template, aspect, script, brand } = opts;
  const { w, h } = ASPECTS[aspect];
  const u = Math.min(w, h) / 100;
  const timing = timingFor(template, script);
  await mkdir(path.join(dir, "vendor"), { recursive: true });
  await cp(path.join(ROOT, "node_modules/gsap/dist/gsap.min.js"), path.join(dir, "vendor/gsap.min.js"));
  await cp(path.join(TEMPLATE_DIR, "_shared/base.css"), path.join(dir, "base.css"));
  await cp(path.join(TEMPLATE_DIR, "_shared/kit.js"), path.join(dir, "kit.js"));
  const html = (await readFile(path.join(TEMPLATE_DIR, template, "index.html"), "utf8"))
    .replaceAll("{{W}}", String(w))
    .replaceAll("{{H}}", String(h))
    .replaceAll("{{U}}", String(u))
    .replaceAll("{{BG}}", safeCss(brand.background))
    .replaceAll("{{TEXT}}", safeCss(brand.text))
    .replaceAll("{{PRIMARY}}", safeCss(brand.primary))
    .replaceAll("{{ACCENT}}", safeCss(brand.accent))
    .replaceAll("{{ORIENTATION}}", h > w ? "portrait" : "landscape")
    .replaceAll("{{DURATION}}", String(timing.total))
    .replace("{{DATA}}", safeJson({ script, timing, u, aspect }));
  await writeFile(path.join(dir, "index.html"), html);
  await writeFile(path.join(dir, "hyperframes.json"), JSON.stringify({ name: path.basename(dir) }, null, 2));
  return timing;
}
