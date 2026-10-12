import type { Brand } from "./script.ts";
import { USE_CASES, type UseCase } from "./matrix.ts";

export interface SiteFacts {
  url: string;
  domain: string;
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  numbers: string[];
  image?: string;
  brand: Brand;
}

export interface Recommendation {
  useCase: UseCase;
  reason: string;
  ready: boolean;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const stripTags = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function meta(html: string, key: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${key}["']`,
    "i",
  );
  const m = html.match(re);
  const v = m?.[1] ?? m?.[2];
  return v ? decode(v).trim() : undefined;
}

function all(html: string, tag: string, limit: number): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  for (const m of html.matchAll(re)) {
    const t = stripTags(m[1]);
    if (t && t.length > 2 && !out.includes(t)) out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function saturation([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
}

/** Lấy màu thương hiệu từ theme-color và các mã hex xuất hiện nhiều nhất trong CSS nội tuyến. */
export function extractBrand(html: string): Brand {
  const counts = new Map<string, number>();
  const theme = meta(html, "theme-color");
  if (theme?.startsWith("#")) counts.set(theme.toLowerCase(), 50);
  for (const m of html.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const hex = "#" + m[1].toLowerCase();
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  const vivid = [...counts.entries()]
    .map(([hex, n]) => ({ hex: hex.length === 4 ? "#" + hex.slice(1).split("").map((c) => c + c).join("") : hex, n }))
    .filter(({ hex }) => saturation(hexToRgb(hex)) > 0.35)
    .sort((a, b) => b.n - a.n);
  const primary = vivid[0]?.hex ?? "#4f7cff";
  const accent = vivid.find((v) => v.hex !== primary)?.hex ?? "#ff8a3d";
  return { background: "#0b0d12", text: "#f2f4f8", primary, accent };
}

export function parseSite(url: string, html: string): SiteFacts {
  const u = new URL(url);
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ");
  const title = meta(html, "og:title") ?? stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ?? u.hostname;
  const description = meta(html, "og:description") ?? meta(html, "description") ?? "";
  const headings = [...all(body, "h1", 3), ...all(body, "h2", 8), ...all(body, "h3", 6)].filter((h) => h.length <= 120).slice(0, 14);
  const paragraphs = all(body, "p", 30).filter((p) => p.length >= 40 && p.length <= 400).slice(0, 12);
  const text = stripTags(body);
  const numbers = [
    ...new Set(
      [...text.matchAll(/(?<![\w.])(?:[$€£])?\d[\d.,]*(?:%|[kKM]\+?|x|×|\+)(?=\s|$|[^\w])/g)].map((m) => m[0].trim()),
    ),
  ].slice(0, 10);
  const image = meta(html, "og:image");
  return {
    url,
    domain: u.hostname.replace(/^www\./, ""),
    title: title || u.hostname,
    description,
    headings,
    paragraphs,
    numbers,
    image: image ? new URL(image, url).toString() : undefined,
    brand: extractBrand(html),
  };
}

export async function fetchSite(url: string): Promise<SiteFacts> {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const res = await fetch(normalized, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; StudioBot/0.1)", accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Trang trả về mã ${res.status}`);
  const html = (await res.text()).slice(0, 2_000_000);
  return parseSite(res.url || normalized, html);
}

/** Gợi ý use case từ ma trận dựa trên những gì trang có. */
export function recommend(facts: SiteFacts): Recommendation[] {
  const byId = (id: string) => USE_CASES.find((u) => u.id === id)!;
  const recs: Recommendation[] = [
    { useCase: byId("launch-film"), ready: true, reason: `Trang có ${facts.headings.length} tiêu đề và mô tả đủ để dựng câu chuyện ra mắt.` },
    { useCase: byId("teaser"), ready: true, reason: "Rút 3–5 thông điệp mạnh nhất thành teaser ngắn cho Reels, TikTok, Shorts." },
  ];
  if (facts.numbers.length > 0) {
    recs.push({ useCase: byId("stat-reveal"), ready: true, reason: `Tìm thấy số liệu trên trang: ${facts.numbers.slice(0, 3).join(", ")}.` });
  } else {
    recs.push({ useCase: byId("stat-reveal"), ready: true, reason: "Trang chưa có số liệu rõ ràng; bạn có thể tự nhập số ở bước kịch bản." });
  }
  recs.push(
    { useCase: byId("ui-demo"), ready: false, reason: "Cần ảnh chụp giao diện. Có trong giai đoạn 2." },
    { useCase: byId("shorts"), ready: false, reason: "Nếu bạn có video quay sẵn. Có trong giai đoạn 2." },
  );
  return recs;
}
