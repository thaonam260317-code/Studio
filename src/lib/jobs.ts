import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import type { TemplateId } from "./matrix.ts";
import type { Brand, VideoScript } from "./script.ts";
import { buildProject, type Aspect } from "./templates.ts";

export type JobStatus = "queued" | "rendering" | "done" | "failed";

export interface Job {
  id: string;
  template: TemplateId;
  aspect: Aspect;
  quality: "draft" | "looks";
  status: JobStatus;
  createdAt: string;
  finishedAt?: string;
  duration?: number;
  error?: string;
}

const JOBS_DIR = path.join(process.cwd(), ".studio", "jobs");
const HYPERFRAMES_BIN = path.join(process.cwd(), "node_modules", "hyperframes", "bin", "hyperframes.mjs");

export const jobDir = (id: string) => path.join(JOBS_DIR, id);
export const videoPath = (id: string) => path.join(jobDir(id), "out.mp4");

async function save(job: Job) {
  await writeFile(path.join(jobDir(job.id), "job.json"), JSON.stringify(job, null, 2));
}

export async function getJob(id: string): Promise<Job | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(jobDir(id), "job.json"), "utf8")) as Job;
  } catch {
    return null;
  }
}

/** Chạy CLI HyperFrames ở tiến trình con. Trả về khi render xong hoặc lỗi. */
export function runRender(projectDir: string, output: string, quality: "draft" | "looks", logFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = createWriteStream(logFile);
    const child = spawn(process.execPath, [HYPERFRAMES_BIN, "render", projectDir, "-o", output, "--quality", quality, "--quiet"], {
      env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1", NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.pipe(log);
    child.stderr.pipe(log);
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`HyperFrames thoát với mã ${code}. Xem render.log trong thư mục job.`))));
  });
}

export async function createJob(input: {
  template: TemplateId;
  aspect: Aspect;
  quality?: "draft" | "looks";
  script: VideoScript;
  brand: Brand;
}): Promise<Job> {
  const id = randomUUID();
  const dir = jobDir(id);
  await mkdir(dir, { recursive: true });
  const job: Job = { id, template: input.template, aspect: input.aspect, quality: input.quality ?? "draft", status: "queued", createdAt: new Date().toISOString() };
  await save(job);
  const projectDir = path.join(dir, "project");
  const timing = await buildProject({ dir: projectDir, template: input.template, aspect: input.aspect, script: input.script, brand: input.brand });
  job.duration = timing.total;
  job.status = "rendering";
  await save(job);
  // Chạy nền; client hỏi trạng thái qua GET /api/jobs/:id.
  runRender(projectDir, videoPath(id), job.quality, path.join(dir, "render.log"))
    .then(async () => save({ ...job, status: "done", finishedAt: new Date().toISOString() }))
    .catch(async (err: Error) => save({ ...job, status: "failed", error: err.message, finishedAt: new Date().toISOString() }));
  return job;
}
