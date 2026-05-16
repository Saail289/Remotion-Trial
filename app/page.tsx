"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [assetFilename, setAssetFilename] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [assetType, setAssetType] = useState("Product");
  const [style, setStyle] = useState("Product showcase");
  const [colorTheme, setColorTheme] = useState("Dark & premium");
  const [animationFeel, setAnimationFeel] = useState("Smooth & fluid");
  const [duration, setDuration] = useState("150"); // values correspond to frames, e.g., 3s = 90f, 5s = 150f, 10s = 300f
  const fps = 30;

  const [status, setStatus] = useState<"idle" | "uploading" | "generating" | "rendering" | "done" | "error">("idle");
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addLog = (msg: string) => setProgressLog(prev => [...prev, msg]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setStatus("uploading");
    addLog("Uploading image...");

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAssetFilename(data.filename);
      setAssetUrl(data.url);
      setStatus("idle");
      addLog("Upload complete.");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message);
      addLog("Upload failed.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!assetFilename || !prompt) return;

    setStatus("generating");
    setErrorMsg(null);
    setVideoUrl(null);
    setProgressLog([]);
    addLog("Sending request to LLM (Gemini is writing...)");

    try {
      // Step 2: Generate
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          assetFilename,
          assetType,
          style,
          colorTheme,
          animationFeel,
          duration: parseInt(duration, 10),
          fps,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || "Generation failed: " + JSON.stringify(genData));

      addLog("LLM generation complete. Code written. Starting Remotion render...");
      setStatus("rendering");

      // Step 3: Render
      const renderRes = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: parseInt(duration, 10),
          fps,
          width: 1080,
          height: 1080,
        }),
      });
      
      let renderData;
      let rawText = "";
      try {
        rawText = await renderRes.text();
        renderData = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Render failed to return JSON. Status: ${renderRes.status}. Raw Response: ${rawText.substring(0, 500)}`);
      }

      if (!renderRes.ok) throw new Error(renderData.error || "Render failed");

      setVideoUrl(renderData.url);
      setStatus("done");
      addLog("Rendering MP4... Done!");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message);
      addLog("Error occurred: " + err.message);
    }
  };

  const getButtonLabel = () => {
    switch (status) {
      case "uploading": return "Uploading Asset...";
      case "generating": return "Gemini is writing...";
      case "rendering": return "Rendering MP4...";
      case "done": return "Generate Another";
      case "error": return "Retry Generation";
      default: return "Generate video";
    }
  };

  const isGenerating = status === "uploading" || status === "generating" || status === "rendering";

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "#111",
    padding: "32px",
    borderRadius: "16px",
    marginBottom: "32px",
    border: "1px solid #333",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  };

  const dropzoneStyle: React.CSSProperties = {
    border: "2px dashed #555",
    borderRadius: "12px",
    padding: "50px",
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: isDragActive ? "#222" : "#1a1a1a",
    transition: "all 0.3s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "14px",
    color: "#ccc",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #333",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    marginBottom: "20px",
    fontSize: "15px",
    transition: "border 0.3s ease",
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "18px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: (!assetFilename || !prompt || isGenerating) ? "#333" : "#4A90E2",
    color: (!assetFilename || !prompt || isGenerating) ? "#888" : "#fff",
    fontSize: "16px",
    fontWeight: "800",
    cursor: (!assetFilename || !prompt || isGenerating) ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    boxShadow: (!assetFilename || !prompt || isGenerating) ? "none" : "0 4px 14px rgba(74, 144, 226, 0.4)",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050505" }}>
      <div style={containerStyle}>
        <h1 style={{ textAlign: "center", marginBottom: "50px", fontSize: "36px", fontWeight: 800, background: "linear-gradient(90deg, #4A90E2, #50E3C2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AI Video Generation Studio
        </h1>

        {/* Step 1 */}
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "22px" }}>Step 1 — Asset Upload</h2>
          <div {...getRootProps()} style={dropzoneStyle}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p style={{ margin: 0, color: "#50E3C2" }}>Drop the image here ...</p>
            ) : (
              <p style={{ margin: 0, color: "#888" }}>Drag 'n' drop a product image, character, or logo here, or <span style={{color: "#4A90E2"}}>click to select</span></p>
            )}
          </div>
          {assetUrl && (
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "16px", backgroundColor: "#1a1a1a", padding: "12px", borderRadius: "8px", border: "1px solid #333" }}>
              <img src={assetUrl} alt="Preview" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#4A90E2" }}>{assetFilename}</div>
                <div style={{ fontSize: "12px", color: "#888" }}>Uploaded successfully</div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2 */}
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "22px" }}>Step 2 — Describe the Video</h2>
          
          <label style={labelStyle}>Prompt</label>
          <textarea
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
            placeholder="e.g. The product flies in from the left, spins around, and lands on a pedestal..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = "#4A90E2"}
            onBlur={(e) => e.target.style.borderColor = "#333"}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>AI Model</label>
              <select style={inputStyle} value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="anthropic/claude-opus-4.6">Claude Opus 4.6</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Asset Type</label>
              <select style={inputStyle} value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option>Product</option>
                <option>Character</option>
                <option>Logo</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Video Style</label>
              <select style={inputStyle} value={style} onChange={(e) => setStyle(e.target.value)}>
                <option>Product showcase</option>
                <option>Character intro</option>
                <option>Logo reveal</option>
                <option>Explainer</option>
                <option>Social reel</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color Theme</label>
              <select style={inputStyle} value={colorTheme} onChange={(e) => setColorTheme(e.target.value)}>
                <option>Dark & premium</option>
                <option>Bright & vibrant</option>
                <option>Minimal white</option>
                <option>Neon futuristic</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Animation Feel</label>
              <select style={inputStyle} value={animationFeel} onChange={(e) => setAnimationFeel(e.target.value)}>
                <option>Smooth & fluid</option>
                <option>Bouncy & playful</option>
                <option>Fast & punchy</option>
                <option>Slow & cinematic</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Duration</label>
              <select style={inputStyle} value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="90">3s (90f)</option>
                <option value="150">5s (150f)</option>
                <option value="300">10s (300f)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div style={sectionStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "22px" }}>Step 3 — Generate & Download</h2>
          
          <button style={btnStyle} onClick={handleGenerate} disabled={!assetFilename || !prompt || isGenerating}>
            {getButtonLabel()}
          </button>

          {progressLog.length > 0 && (
            <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#0a0a0a", borderRadius: "8px", border: "1px solid #222" }}>
              {progressLog.map((log, i) => (
                <div key={i} style={{ fontSize: "13px", color: i === progressLog.length - 1 ? "#50E3C2" : "#888", marginBottom: "6px", fontFamily: "monospace" }}>
                  &gt; {log}
                </div>
              ))}
              {errorMsg && (
                <div style={{ color: "#E74C3C", marginTop: "12px", fontSize: "14px", fontWeight: "bold" }}>
                  Error: {errorMsg}
                </div>
              )}
            </div>
          )}

          {videoUrl && (
            <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                style={{ width: "100%", maxWidth: "500px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", border: "1px solid #333" }}
              />
              <a 
                href={videoUrl} 
                download 
                style={{ marginTop: "20px", display: "inline-block", padding: "12px 24px", backgroundColor: "#4A90E2", color: "#fff", textDecoration: "none", borderRadius: "8px", fontWeight: "bold", boxShadow: "0 4px 12px rgba(74, 144, 226, 0.4)" }}
              >
                Download MP4
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
