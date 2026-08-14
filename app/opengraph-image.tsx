import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "vidnex - the digital home for African entertainment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b0a0e",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            left: 340,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background:
              "linear-gradient(100deg, #ff6b3d 0%, #ff3d77 55%, #c026d3 100%)",
            opacity: 0.35,
            filter: "blur(90px)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 48 48">
            <defs>
              <linearGradient id="g" x1="4" y1="6" x2="44" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff6b3d" />
                <stop offset="55%" stopColor="#ff3d77" />
                <stop offset="100%" stopColor="#c026d3" />
              </linearGradient>
            </defs>
            <path
              d="M24 3c6 6.5 11 12.7 11 19.4C35 30.9 30.1 37 24 37c-6.1 0-11-6.1-11-14.6C13 15.7 18 9.5 24 3Z"
              fill="url(#g)"
            />
            <path d="M20 17.5 30 23l-10 5.5v-11Z" fill="#0b0a0e" />
          </svg>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#f7f4f0" }}>vidnex</span>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#f7f4f0",
            maxWidth: 900,
          }}
        >
          The digital home for African entertainment
        </div>
        <div style={{ marginTop: 24, fontSize: 26, color: "#b9b4c0", maxWidth: 780 }}>
          Short-form video, real creator relationships, one in-app token.
        </div>
      </div>
    ),
    { ...size },
  );
}
