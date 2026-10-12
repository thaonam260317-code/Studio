import { NextResponse } from "next/server";
import { z } from "zod";
import { createJob } from "@/lib/jobs";
import { BrandSchema, VideoScriptSchema, normalizeScript } from "@/lib/script";
import { validateFor } from "@/lib/templates";

const Body = z.object({
  template: z.enum(["launch-film", "teaser", "stat-reveal"]),
  aspect: z.enum(["16:9", "9:16", "1:1", "4:5"]),
  quality: z.enum(["draft", "looks"]).default("draft"),
  script: VideoScriptSchema,
  brand: BrandSchema,
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Kịch bản hoặc tùy chọn render không hợp lệ.", issues: parsed.error.issues }, { status: 400 });
  const script = normalizeScript(parsed.data.script);
  const problem = validateFor(parsed.data.template, script);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  const job = await createJob({ ...parsed.data, script });
  return NextResponse.json(job, { status: 202 });
}
