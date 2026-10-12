import { readFile } from "node:fs/promises";
import { getJob, videoPath } from "@/lib/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const job = await getJob((await ctx.params).id);
  if (!job || job.status !== "done") return new Response("Video chưa sẵn sàng.", { status: 404 });
  const data = await readFile(videoPath(job.id));
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "video/mp4",
      "content-length": String(data.byteLength),
      "content-disposition": `inline; filename="${job.template}-${job.aspect.replace(":", "x")}.mp4"`,
    },
  });
}
