/**
 * Render cả 3 template với kịch bản mẫu, không cần mạng hay API key.
 *   npm run render:sample            -> 16:9 và 9:16, chất lượng nháp
 *   npm run render:sample -- --only teaser --aspect 1:1
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import type { TemplateId } from "../src/lib/matrix.ts";
import { runRender } from "../src/lib/jobs.ts";
import type { Brand, VideoScript } from "../src/lib/script.ts";
import { buildProject, type Aspect } from "../src/lib/templates.ts";

const script: VideoScript = {
  title: "Lumen Notes",
  tagline: "Ghi chú tự sắp xếp khi bạn viết",
  scenes: [
    { kicker: "Vấn đề", headline: "Ghi chú rơi vãi khắp nơi", body: "Ý tưởng nằm rải rác trong chat, email và năm ứng dụng khác nhau." },
    { kicker: "Giải pháp", headline: "Một chỗ cho mọi ý tưởng", body: "Lumen gom, gắn thẻ và nối các ghi chú liên quan cho bạn." },
    { kicker: "Tìm kiếm", headline: "Hỏi bằng câu bình thường", body: "Gõ câu hỏi, nhận câu trả lời kèm ghi chú gốc." },
    { kicker: "Đội nhóm", headline: "Chia sẻ trong một chạm", body: "" },
  ],
  stats: [
    { value: 12000, prefix: "", suffix: "+", label: "người dùng mỗi tuần" },
    { value: 4.8, prefix: "", suffix: "/5", label: "điểm đánh giá" },
  ],
  cta: "Dùng thử miễn phí",
  url: "lumen.example",
};
const brand: Brand = { background: "#0b0d12", text: "#f2f4f8", primary: "#5b7cff", accent: "#ff8a3d" };

const args = process.argv.slice(2);
const only = args.includes("--only") ? (args[args.indexOf("--only") + 1] as TemplateId) : undefined;
const aspects: Aspect[] = args.includes("--aspect") ? [args[args.indexOf("--aspect") + 1] as Aspect] : ["16:9", "9:16"];
const templates: TemplateId[] = only ? [only] : ["launch-film", "teaser", "stat-reveal"];

const out = path.join(process.cwd(), "renders");
await mkdir(out, { recursive: true });
for (const t of templates) {
  for (const a of aspects) {
    const tag = `${t}-${a.replace(":", "x")}`;
    const dir = path.join(process.cwd(), ".studio", "samples", tag);
    await rm(dir, { recursive: true, force: true });
    const timing = await buildProject({ dir, template: t, aspect: a, script, brand });
    const started = Date.now();
    await runRender(dir, path.join(out, `${tag}.mp4`), "draft", path.join(out, `${tag}.log`));
    console.log(`✓ ${tag}: ${timing.total}s video, render ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
}
