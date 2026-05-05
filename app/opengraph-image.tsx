import { ImageResponse } from "next/og";

export const alt = "Interview Pilot — AI Mock Interview Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SUBSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,—·-':/";

async function loadGoogleFont(
  family: string,
  weight: number,
  italic = false,
): Promise<ArrayBuffer> {
  const fam = family.replace(/ /g, "+");
  const variant = italic ? `${weight}italic` : `${weight}`;
  const url = `https://fonts.googleapis.com/css?family=${fam}:${variant}&text=${encodeURIComponent(SUBSET)}`;
  const css = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8",
    },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\((.+?)\)/);
  if (!match) throw new Error(`Failed to load font: ${family} ${variant}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OpengraphImage() {
  const [libreBaskerville, karla] = await Promise.all([
    loadGoogleFont("Libre Baskerville", 700),
    loadGoogleFont("Karla", 500),
  ]);

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
          fontFamily: "Karla, sans-serif",
        }}
      >
        {/* Bottom-right teal gradient blob */}
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "75%",
            height: "75%",
            background:
              "linear-gradient(135deg, transparent 0%, rgba(13, 132, 116, 0.10) 100%)",
          }}
        />

        {/* Top: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#0d8474",
            }}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: -0.5,
              fontFamily: "Libre Baskerville, serif",
            }}
          >
            Interview Pilot
          </div>
        </div>

        {/* Hero */}
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
              fontSize: 17,
              fontWeight: 700,
              color: "#0d8474",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Interview Practice
          </div>
          <div
            style={{
              fontSize: 124,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: -3.5,
              lineHeight: 1.0,
              marginTop: 22,
              fontFamily: "Libre Baskerville, serif",
            }}
          >
            Prepare with
          </div>
          <div
            style={{
              fontSize: 124,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: -3.5,
              lineHeight: 1.0,
              fontFamily: "Libre Baskerville, serif",
            }}
          >
            confidence.
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: "#555",
              marginTop: 36,
              maxWidth: 800,
              lineHeight: 1.45,
            }}
          >
            Five AI-tailored questions for your role. Speak your answers naturally. Get feedback that helps you improve.
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: "#888",
              fontFamily: "monospace",
              letterSpacing: 0.5,
            }}
          >
            01 Tailored · 02 Speak · 03 Feedback
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
    {
      ...size,
      fonts: [
        {
          name: "Libre Baskerville",
          data: libreBaskerville,
          weight: 700,
          style: "normal",
        },
        {
          name: "Karla",
          data: karla,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
