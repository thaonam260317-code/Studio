/**
 * Ma trận use case × công cụ (kiểm chứng ngày 12/10/2026 bằng cách clone từng repo).
 * Mức 2 = công cụ chính, 1 = hỗ trợ. `template` là template Studio đã có cho use case đó.
 */
export type TemplateId = "launch-film" | "teaser" | "stat-reveal";

export interface Tool {
  id: string;
  name: string;
  repo: string;
  group: "A" | "B" | "C" | "D" | "E";
  license: string;
  engine: string;
}

export interface UseCase {
  id: string;
  name: string;
  format: string;
  input: string;
  output: string;
  effort: "Thấp" | "Trung bình" | "Cao";
  channels: Array<"launch" | "social" | "footage" | "edu" | "web">;
  template?: TemplateId;
  tools: Record<string, [1 | 2, string]>;
}

export const GROUPS: Record<Tool["group"], string> = {
  A: "Launch video",
  B: "Hậu kỳ footage",
  C: "Hoạt hình ngắn",
  D: "Web UI",
  E: "Nền tảng chính thức",
};

export const TOOLS: Tool[] = [
  { id: "plm", name: "product-launch-motion", repo: "AbubakrChan/product-launch-motion", group: "A", license: "MIT", engine: "HyperFrames / Remotion + GSAP" },
  { id: "mgs", name: "motion-graphics-skills", repo: "charlie947/motion-graphics-skills", group: "A", license: "MIT", engine: "HyperFrames" },
  { id: "cmd", name: "claude-motion-design", repo: "howseen-ai/claude-motion-design", group: "A", license: "MIT", engine: "HTML + Playwright + FFmpeg" },
  { id: "hfk", name: "hyperframes-student-kit", repo: "nateherkai/hyperframes-student-kit", group: "B", license: "MIT", engine: "HyperFrames + GSAP" },
  { id: "bb", name: "motion-graphics (Barty-Bart)", repo: "Barty-Bart/motion-graphics", group: "B", license: "MIT", engine: "HTML + Playwright; SAM 2" },
  { id: "anim", name: "animate", repo: "cth9191/animate", group: "C", license: "MIT", engine: "Canvas + Playwright + FFmpeg" },
  { id: "cmo", name: "claude-motion", repo: "whaleyxbt/claude-motion", group: "C", license: "MIT", engine: "Remotion 4 + Python SFX; three.js sims" },
  { id: "crs", name: "claude-remotion-skill", repo: "haidrrrry/claude-remotion-skill", group: "C", license: "MIT", engine: "Remotion" },
  { id: "mot", name: "motion", repo: "motiondivision/motion", group: "D", license: "MIT", engine: "Thư viện JS/React/Vue" },
  { id: "mda", name: "motion-dev-animations-skill", repo: "199-biotechnologies/motion-dev-animations-skill", group: "D", license: "MIT", engine: "Motion.dev" },
  { id: "hf", name: "hyperframes", repo: "heygen-com/hyperframes", group: "E", license: "Apache-2.0", engine: "Chrome headless + FFmpeg" },
  { id: "rem", name: "remotion", repo: "remotion-dev/remotion", group: "E", license: "Remotion License", engine: "React + TS" },
  { id: "rsk", name: "remotion skills", repo: "remotion-dev/skills", group: "E", license: "Chưa ghi", engine: "Remotion" },
  { id: "gsk", name: "gsap-skills", repo: "greensock/gsap-skills", group: "E", license: "MIT", engine: "GSAP" },
  { id: "lot", name: "motion-design-skill", repo: "LottieFiles/motion-design-skill", group: "E", license: "MIT", engine: "Không phụ thuộc engine" },
];

export const USE_CASES: UseCase[] = [
  { id: "launch-film", name: "Launch film sản phẩm", format: "30–45s, có voiceover", input: "URL hoặc ảnh SP, brief", output: "16:9 + 9:16", effort: "Cao", channels: ["launch"], template: "launch-film",
    tools: { plm: [2, "toàn bộ pipeline"], mgs: [2, "launch-video, apple-launch-film"], cmd: [1, "beat map, motion blur"], cmo: [1, "quy tắc + tự soát"], crs: [1, "quy tắc Remotion"], hf: [1, "engine render"], rem: [1, "engine thay thế"], gsk: [1, "timeline"], lot: [1, "nguyên tắc"] } },
  { id: "teaser", name: "Teaser hype cắt theo beat", format: "12–20s", input: "Nhạc, logo, 3–5 fact", output: "9:16, 1:1", effort: "Trung bình", channels: ["launch", "social"], template: "teaser",
    tools: { cmd: [2, "drop nhạc trùng cảnh chính"], bb: [2, "explainer-high-energy"], mgs: [1, "newsletter-promo"], cmo: [1, "beats.py"], anim: [1, "cắt theo nhạc"], hf: [1, "engine render"] } },
  { id: "ui-demo", name: "Demo UI sản phẩm", format: "45–90s", input: "Screenshot hoặc URL", output: "16:9", effort: "Cao", channels: ["launch"],
    tools: { bb: [2, "explainer-default"], plm: [1, "camera 3D + con trỏ"], anim: [1, "chụp site thật"], cmd: [1, "port component 21st.dev"], hf: [1, "engine render"] } },
  { id: "stat-reveal", name: "Biểu đồ số liệu, milestone", format: "Loop 8–12s", input: "Số liệu thật", output: "1:1, 4:5", effort: "Thấp", channels: ["social"], template: "stat-reveal",
    tools: { mgs: [2, "animated-chart, milestone-reveal"], hf: [1, "data-in-motion"], cmo: [1, "rolling numbers"], rem: [1, "engine thay thế"] } },
  { id: "title", name: "Intro, logo sting, title 3D", format: "3–15s", input: "Logo, tên", output: "16:9", effort: "Thấp", channels: ["launch", "social"],
    tools: { mgs: [2, "title-sequence-3d"], crs: [2, "logo animation"], cmo: [1, "masked text reveal"], plm: [1, "end card"], hf: [1, "engine render"] } },
  { id: "remake", name: "Remake video tham chiếu", format: "Khớp từng khung", input: "Video mẫu + brand", output: "Như bản gốc", effort: "Cao", channels: ["launch", "social"],
    tools: { cmd: [2, "remake mode"], mgs: [1, "reference-to-motion"], anim: [1, "look từ tham chiếu"] } },
  { id: "talking-head", name: "Dọn talking-head", format: "Cắt dead air, nói vấp", input: "Footage thô", output: "Bản dựng nháp", effort: "Thấp", channels: ["footage"],
    tools: { hfk: [2, "cut-silences, cut-mistakes, edit-video"] } },
  { id: "shorts", name: "Reels, Shorts từ footage", format: "9:16 có hook, caption", input: "Footage + transcript", output: "9:16", effort: "Trung bình", channels: ["footage", "social"],
    tools: { hfk: [2, "short-form-edit"], rsk: [1, "remotion-captions"], crs: [1, "caption động"], mgs: [1, "reel-export"], anim: [1, "đa tỉ lệ"] } },
  { id: "broll", name: "B-roll motion theo lời nói", format: "Chèn vào video gốc", input: "Video + SRT", output: "Clip + preview", effort: "Trung bình", channels: ["footage"],
    tools: { bb: [2, "motion-broll"], hfk: [2, "406 thẻ motion"], crs: [1, "B-roll edits"] } },
  { id: "separation", name: "Tách chủ thể khỏi nền", format: "Người, tay, sản phẩm", input: "Video", output: "Video có mask", effort: "Trung bình", channels: ["footage"],
    tools: { bb: [2, "object-separation (SAM 2)"] } },
  { id: "explainer", name: "Explainer hoạt hình", format: "30–60s, phong cách thủ công", input: "Chủ đề, kịch bản", output: "Mọi tỉ lệ", effort: "Trung bình", channels: ["edu", "social"],
    tools: { anim: [2, "7 style + look riêng"], mgs: [1, "vox-explainer"], cmo: [1, "quy tắc"], lot: [1, "nguyên tắc"], hf: [1, "engine render"] } },
  { id: "sims", name: "Sim, 3D viral", format: "Mô phỏng 60fps", input: "Ý tưởng", output: "1080×1350", effort: "Cao", channels: ["social", "edu"],
    tools: { cmo: [2, "sims (three.js)"] } },
  { id: "sound", name: "Sound design và master", format: "SFX, nhạc, −14 LUFS", input: "Timeline", output: "WAV đã master", effort: "Thấp", channels: ["launch", "social", "footage"],
    tools: { cmo: [2, "sound engine tự sinh"], bb: [1, "sound-effects CC0"], cmd: [1, "SFX theo đỉnh"], plm: [1, "verify-cue"], anim: [1, "nhạc theo code"] } },
  { id: "web-motion", name: "Motion cho landing page", format: "Hero, scroll, hover", input: "Code site", output: "Component React", effort: "Thấp", channels: ["web"],
    tools: { mot: [2, "thư viện"], mda: [2, "sinh code"], gsk: [2, "ScrollTrigger"], lot: [1, "nguyên tắc"] } },
  { id: "brand-motion", name: "Bộ luật motion thương hiệu", format: "Dùng lại cho mọi video", input: "Brand, ví dụ yêu thích", output: "brand.md, MOTION.md", effort: "Thấp", channels: ["launch", "social", "web", "edu"],
    tools: { lot: [2, "12 nguyên tắc"], mgs: [2, "brand-intake"], cmo: [1, "quy tắc có số"], crs: [1, "theme.ts"] } },
];
