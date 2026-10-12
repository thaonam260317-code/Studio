import { NextResponse } from "next/server";
import { z } from "zod";
import type { SiteFacts } from "@/lib/analyze";
import { writeScript } from "@/lib/brief";

const Body = z.object({
  facts: z.object({
    url: z.string(),
    domain: z.string(),
    title: z.string(),
    description: z.string(),
    headings: z.array(z.string()),
    paragraphs: z.array(z.string()),
    numbers: z.array(z.string()),
    image: z.string().optional(),
    brand: z.object({ background: z.string(), text: z.string(), primary: z.string(), accent: z.string() }),
  }),
  template: z.enum(["launch-film", "teaser", "stat-reveal"]),
  language: z.enum(["vi", "en"]).default("vi"),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thiếu dữ kiện trang hoặc template." }, { status: 400 });
  try {
    return NextResponse.json(await writeScript(parsed.data.facts as SiteFacts, parsed.data.template, parsed.data.language));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Không viết được kịch bản: ${message}` }, { status: 502 });
  }
}
