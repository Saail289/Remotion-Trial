import { NextRequest, NextResponse } from 'next/server';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import { promises as fs } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { duration, fps, width, height } = await req.json();

    const timestamp = Date.now();
    const outDir = path.join(process.cwd(), "out");
    await fs.mkdir(outDir, { recursive: true });
    const outputLocation = path.join(outDir, `video_${timestamp}.mp4`);

    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      webpackOverride: (config) => config,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "GeneratedVideo",
      inputProps: {},
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation,
      inputProps: {},
      frameRange: [0, (duration || composition.durationInFrames) - 1], 
    });

    return NextResponse.json({ url: `/out/video_${timestamp}.mp4` });
    
  } catch (err: any) {
    console.error("Render error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
