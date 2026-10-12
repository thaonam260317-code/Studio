import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchSite, recommend } from "@/lib/analyze";

const Body = z.object({ url: z.string().min(3).max(2000) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Cần một đường dẫn trang web." }, { status: 400 });
  try {
    const facts = await fetchSite(parsed.data.url);
    return NextResponse.json({ facts, recommendations: recommend(facts) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Không đọc được trang: ${message}` }, { status: 502 });
  }
}
