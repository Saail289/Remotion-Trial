import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, assetFilename, assetType, style, colorTheme, animationFeel, duration, fps } = await req.json();

    const systemPrompt = `You are an expert Remotion React developer.
Return ONLY raw TSX code, no markdown, no backticks, no explanation.
Export a component named GeneratedVideo.
Import only from the 'remotion' package.
Use useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Img, staticFile.
Reference the asset with: <Img src={staticFile('/assets/${assetFilename}')} />
Do NOT use <Sequence>. Instead, write ONE continuous scene that spans exactly ${duration} frames at ${fps} fps.
Use only inline styles.
Every animation must use spring() or interpolate() with clamp on both sides (extrapolateLeft: 'clamp', extrapolateRight: 'clamp').
Never use window, document, fetch, async/await inside the component.

The user wants a video matching these specs:
- Asset Type: ${assetType}
- Style: ${style}
- Color Theme: ${colorTheme}
- Animation Feel: ${animationFeel}
- Duration (Total Video Duration): ${duration} frames at ${fps} fps
- Prompt: ${prompt}

Make sure the animations work continuously from frame 0 to frame ${duration}. White backgrounds are fine if unspecified. Provide full code.
Write the full React TSX file now.`;

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "No OpenRouter API key" }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000"
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash",
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
        ]
      })
    });

    if (!response.ok) {
      const respError = await response.text();
      console.error("OpenRouter Error:", respError);
      return NextResponse.json({ error: "Failed to call LLM", details: respError }, { status: 500 });
    }

    const data = await response.json();
    let rawCode = data.choices?.[0]?.message?.content;
    
    if (!rawCode) {
      console.error("OpenRouter empty response data:", data);
      return NextResponse.json({ error: "OpenRouter returned an empty response or hit a system limit. Details: " + JSON.stringify(data) }, { status: 500 });
    }

    // Strip markdown fences
    rawCode = rawCode.replace(/^```tsx?\n?/m, '').replace(/^```\n?/m, '').replace(/```$/m, '').trim();

    // Validation
    const requiredStrings = ["useCurrentFrame", "GeneratedVideo", "AbsoluteFill", "export"];
    for (const str of requiredStrings) {
      if (!rawCode.includes(str)) {
         return NextResponse.json({ error: `Validation failed: missing ${str}`, raw: rawCode }, { status: 422 });
      }
    }

    // Write file
    const destPath = path.join(process.cwd(), "remotion", "compositions", "Generated.tsx");
    await fs.writeFile(destPath, rawCode);

    return NextResponse.json({ success: true, rawCode });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
