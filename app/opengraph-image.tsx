import { ImageResponse } from "next/og";

export const alt = "Interview Pilot — AI Mock Interview Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "65%",
            height: "65%",
            background:
              "linear-gradient(135deg, transparent 0%, rgba(13, 132, 116, 0.10) 100%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "#0d8474",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -0.5,
            }}
          >
            IP
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: -0.5,
            }}
          >
            Interview Pilot
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#1a1a1a",
              letterSpacing: -2.5,
              lineHeight: 1.0,
            }}
          >
            AI Mock Interview
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: "#555",
              marginTop: 24,
            }}
          >
            Resume-aware questions · Real-time TTS · Video feedback
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#888",
              fontFamily: "monospace",
            }}
          >
            Next.js · OpenAI · Supabase · Clerk
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#888",
              fontFamily: "monospace",
            }}
          >
            interview-pilot-ace.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
