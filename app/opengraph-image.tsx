import { ImageResponse } from "next/og";

export const alt = "D'Sign Architects — Timeless Architecture, Modern Living";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080d17 0%, #0d1524 60%, #1e3a5f 100%)",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            color: "#d9a441",
            display: "flex",
          }}
        >
          D&#39;sign Architects
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#9aa7ba",
            display: "flex",
          }}
        >
          Timeless Architecture · Modern Living
        </div>
      </div>
    ),
    { ...size }
  );
}
