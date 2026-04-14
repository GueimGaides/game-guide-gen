import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary, #090c14)",
      color: "var(--text-primary, #e8eaf0)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border-subtle, #1e2a40)",
        background: "var(--bg-secondary, #0f1320)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "18px",
          color: "var(--text-primary, #e8eaf0)",
          textDecoration: "none",
          letterSpacing: "1px",
        }}>
          GUEIMGAIDES
        </Link>
        <Link href="/" style={{
          fontSize: "12px",
          color: "var(--text-muted, #4a566e)",
          textDecoration: "none",
          fontFamily: "'Space Mono', monospace",
        }}>
          ← BACK
        </Link>
      </header>

      <main style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}>

        {/* Title */}
        <div>
          <div style={{
            fontSize: "10px",
            color: "var(--text-muted, #4a566e)",
            letterSpacing: "3px",
            textTransform: "uppercase",
            fontFamily: "'Space Mono', monospace",
            marginBottom: "8px",
          }}>
            Legal & About
          </div>
          <h1 style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "24px",
            letterSpacing: "1px",
            marginBottom: "8px",
          }}>
            About GueimGaides
          </h1>
          <p style={{
            fontSize: "14px",
            color: "var(--text-secondary, #8892a4)",
            lineHeight: "1.7",
          }}>
            GueimGaides is a free, open tool that uses AI to generate video game
            guides on demand. No account required. No ads. Minimal data handling.
          </p>
        </div>

        {[
          {
            title: "Use of Service",
            content: `By using GueimGaides, you agree to use the service at your own risk.

            You agree to: 
            -Not misuse the service, attempt to disrupt its operation,
            or use it for unlawful purposes. 
            -The generated content is provided for informational and entertainment purposes only and should not be
            relied upon for critical decisions.`,
          },
          {
            title: "AI-Generated Content Disclaimer",
            content: `All guides are generated automatically using artificial intelligence
            (Google Gemini), which compiles and summarizes publicly available
            information from sources such as wikis, forums, and community content.

            Content may be inaccurate, incomplete, or outdated. We make no guarantees
            regarding correctness. Always verify important information using official sources.

            We do not claim ownership of any game-related intellectual property.
            All trademarks, names, and assets belong to their respective owners.`,
          },
          {
            title: "Content & Copyright",
            content: `Images and references are sourced from publicly available databases
            and community resources.

            If you are a copyright owner and believe content is used improperly,
            please contact us at: gueimgaides@hotmail.com with the subject line "takedown request" and it will be removed promptly.`,
          },
          {
            title: "Mature Content Notice",
            content: `GueimGaides may generate guides for games of any rating, including
            Mature or Adults Only titles.

            Generated guides focus strictly on gameplay, progression, and mechanics.
            We do not generate explicit sexual content.`,
          },
          {
            title: "No Warranty",
            content: `This service is provided "as is" and "as available" without warranties
            of any kind, express or implied.

            We do not guarantee availability, accuracy, reliability, or fitness for
            any particular purpose.`,
          },
          {
            title: "Limitation of Liability",
            content: `To the maximum extent permitted by law, GueimGaides and its creators
            shall not be liable for any direct, indirect, incidental, or consequential
            damages arising from the use of this service.`,
          },
          {
            title: "Privacy",
            content: `We do not intentionally collect or store personal data.

            However, third-party services (such as AI providers or hosting platforms)
            may process technical information (e.g., IP address) as part of normal
            operation. Their respective privacy policies apply.

            Any data stored locally (such as progress) remains in your browser and
            can be cleared at any time.`,
          },
          {
            title: "Technical Operation",
            content: `Most of the application runs locally in your browser. AI-generated
            content is processed via external APIs.

            Service availability may be affected by rate limits, outages, or
            third-party dependencies.`,
          },
          {
            title: "Open Source",
            content: `GueimGaides is an open source project. You are free to inspect,
            modify, and learn from the code on GitHub at:
            
            https://

            This project is provided as a free tool for the community.`,
          },
          {
            title: "Changes",
            content: `These terms may be updated or modified at any time without prior notice.`,
          },
          {
            title: "Contact",
            content: `For legal inquiries, copyright concerns, or general questions,
            please contact: contact@gueimgaides.com`,
          },
          {
            title: "Jurisdiction",
            content: `This service is operated from Mexico. Any legal matters
            shall be governed by the applicable laws of Mexico.`,
          }
        ].map((section) => (
          <div key={section.title} style={{
            background: "var(--bg-card, #131929)",
            border: "1px solid var(--border-subtle, #1e2a40)",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            <div style={{
              background: "var(--bg-secondary, #0f1320)",
              borderBottom: "1px solid var(--border-subtle, #1e2a40)",
              padding: "12px 16px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              letterSpacing: "0.5px",
            }}>
              {section.title}
            </div>
            <div style={{
              padding: "16px",
              fontSize: "13px",
              color: "var(--text-secondary, #8892a4)",
              lineHeight: "1.8",
              whiteSpace: "pre-line",
            }}>
              {section.content}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          fontSize: "11px",
          color: "var(--text-muted, #4a566e)",
          fontFamily: "'Space Mono', monospace",
          textAlign: "center",
        }}>
          Last updated: April 2026 · GueimGaides
        </div>

      </main>
    </div>
  );
}