"use client";

/** Last-resort error screen, used only if the page frame itself fails to load. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Helvetica, Arial, sans-serif", background: "#ECECEA", color: "#111", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, margin: "0 0 12px" }}>That didn&apos;t work.</h1>
        <p style={{ margin: "0 0 20px" }}>Nothing was lost. Try again in a moment.</p>
        <button onClick={reset} style={{ background: "#2A35E8", color: "#fff", border: 0, padding: "12px 20px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}
