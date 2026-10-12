import { z } from "zod";

/** Kịch bản video: mọi template đọc cùng một cấu trúc này. */
export const VideoScriptSchema = z.object({
  title: z.string().describe("Tên sản phẩm hoặc thương hiệu, đúng như trên trang."),
  tagline: z.string().describe("Một câu định vị ngắn, tối đa 8 từ."),
  scenes: z
    .array(
      z.object({
        kicker: z.string().describe("Nhãn nhỏ phía trên, 1–3 từ, ví dụ 'Vấn đề' hoặc 'Tính năng'."),
        headline: z.string().describe("Câu chính của cảnh, tối đa 7 từ."),
        body: z.string().describe("Một câu bổ sung, tối đa 14 từ. Có thể để trống."),
      }),
    )
    .describe("3 đến 5 cảnh, theo thứ tự hook, vấn đề, giải pháp, bằng chứng."),
  stats: z
    .array(
      z.object({
        value: z.number().describe("Con số thật lấy từ trang. Không bịa."),
        prefix: z.string().describe("Ví dụ '$' hoặc ''."),
        suffix: z.string().describe("Ví dụ '%', 'k+', 'x' hoặc ''."),
        label: z.string().describe("Con số này đo cái gì, tối đa 5 từ."),
      }),
    )
    .describe("0 đến 3 số liệu có thật trên trang. Để mảng rỗng nếu trang không có số."),
  cta: z.string().describe("Lời kêu gọi cuối, tối đa 5 từ."),
  url: z.string().describe("Tên miền hiển thị ở end card, ví dụ 'example.com'."),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;

export const BrandSchema = z.object({
  background: z.string(),
  text: z.string(),
  primary: z.string(),
  accent: z.string(),
});

export type Brand = z.infer<typeof BrandSchema>;

/** Giới hạn cứng để template không bị tràn chữ hay quá dài. */
export function normalizeScript(s: VideoScript): VideoScript {
  const clip = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);
  return {
    ...s,
    title: clip(s.title.trim(), 40),
    tagline: clip(s.tagline.trim(), 70),
    scenes: s.scenes.slice(0, 5).map((sc) => ({
      kicker: clip(sc.kicker.trim(), 24),
      headline: clip(sc.headline.trim(), 60),
      body: clip(sc.body.trim(), 110),
    })),
    stats: s.stats.filter((st) => Number.isFinite(st.value)).slice(0, 3),
    cta: clip(s.cta.trim(), 36),
    url: clip(s.url.trim(), 40),
  };
}
