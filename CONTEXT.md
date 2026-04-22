# GueimGaides — Project Context

## What this is
A free, no-account video game guide generator.
User types a game + goal, AI generates a structured guide.
Checklist system with localStorage save + shareable codes.
Partial step editing — click a step to refine just that part.
PDF download via generated HTML + window.print().

## LIVE URL
https://game-guide-gen.vercel.app

## Stack
- Next.js 16 + TypeScript
- Vercel (free hosting, deployed and live)
- Gemini 2.5 Flash API (free tier, MX region confirmed working)
- No database — localStorage only

## Repo
GitHub: github.com/GueimGaides/game-guide-gen

## File structure
app/
├── api/
│   ├── generate/route.ts   — main guide generation endpoint
│   ├── refine/route.ts     — partial step editing endpoint
│   └── admin/auth/route.ts — admin panel password check
├── components/
│   ├── GuideDisplay.tsx    — full guide UI, checklist, PDF
│   ├── AdminPanel.tsx      — secret admin color/theme panel
│   ├── SeasonalTheme.tsx   — seasonal CSS themes
│   └── TutorialOverlay.tsx — first visit tutorial spotlight
├── about/page.tsx          — legal disclaimers page
├── globals.css             — CSS variables + print stylesheet
├── layout.tsx              — suppressHydrationWarning added
└── page.tsx                — main page
CONTEXT.md                  — this file

## Security
- API keys server-side only in Vercel env vars
- Unicode normalization before injection scanning
- System prompt separated from user data
- Output structure validated before sending to frontend
- Image URLs whitelisted + HEAD request validated
- Rate limit: 5 req/min generate, 10 req/min refine
- Admin auth: 5 attempts per 15 min, constant-time comparison
- Temperature: 0.2

## Design
- Dark theme only
- Colors: #090c14 base, #3b7dd8 blue, #7c5cbf purple
- Fonts: Space Mono (display/steps), DM Sans (body)
- Seasonal themes done in globals.css:
  Christmas: dark green-black bg, green logo, snow
  Halloween: dark purple-black bg, orange logo
  Pride: rainbow logo gradient, rainbow progress bar
- Step text uses monospace font (GameFAQs style)

## Features complete
- Any game accepted, no content gatekeeping
- Adult games allowed — shows "not enough info" if nothing found
- Auto browser language + manual override (11 languages)
- Guide + game + goal saved to localStorage on generation
- Guide persists on page refresh
- Click step → edit panel → AI refines just that step
- Partial regen — affectedSteps returned for cascading changes
- localStorage auto-save (guide + progress + colors)
- Save code (base64, 32 chars) for cross-device transfer
- PDF download — generates clean standalone HTML, auto-prints
- PDF filename: "GueimGaides - {game}"
- PDF includes header, all sections, items, tips, save code, footer
- Steps have optional hint field (collapsible 💡)
- Linear game detection — focuses on missables/secrets
- RPG depth — levels, movesets, equipment, boss strategies
- Long guide scope limiting with user message to split request
- Pride gradient logo in June
- suppressHydrationWarning (Dark Reader extension compat)
- /about page with AI disclaimer, content notice, no-warranty, privacy
- First visit tutorial overlay (spotlight style, 4 steps)
- Image URL server-side HEAD request validation
- Seasonal theme full implementation (bg, logo, borders per season)

## Trusted image/guide domains
bulbapedia.bulbagarden.net, cdn.bulbagarden.net, serebii.net,
gamefaqs.gamespot.com, wiki.fandom.com, psnprofiles.com,
ign.com, strategywiki.org, neoseeker.com, static.wikia.nocookie.net,
gamepressure.com, powerpyx.com, trueachievements.com, truetrophies.com

## .env.local / Vercel environment variables
GEMINI_API_KEY=first key
GEMINI_API_KEY_2=second key
GEMINI_API_KEY_3=third key
ADMIN_PASSWORD=password

## Known issues
- Step refinement occasionally fails (Gemini inconsistency)
- Very long guide requests still timeout sometimes
- Images rarely show (wiki URLs change frequently)

Challenge: we use JSON responses which cant be parsed mid-stream.
Solution: two-phase approach:
  Phase 1 — stream raw text to frontend, show animated preview
  Phase 2 — when stream ends, parse JSON and render full guide

### Gemini streaming endpoint:
Same URL but use generateContentStream instead of generateContent.
Response is Server-Sent Events (SSE) format.
Parse each chunk: data.candidates[0].content.parts[0].text

### Frontend streaming read pattern:
const reader = response.body.getReader()
const decoder = new TextDecoder()
let fullText = ""
while(true) {
  const {done, value} = await reader.read()
  if(done) break
  fullText += decoder.decode(value)
  setStreamPreview(fullText) // show raw text while generating
}
// then parse JSON from fullText

## Still to do
- Test on more games for accuracy
