# GueimGaides — Project Context

## What this is
A free, no-account video game guide generator.
User types a game + goal, AI generates a structured guide.
Checklist system with localStorage save + shareable codes.
Partial step editing — click a step to refine just that part.
PDF download via browser print.

## Stack
- Next.js 16 + TypeScript
- Vercel (free hosting, not deployed yet)
- Gemini 2.5 Flash API (free tier, MX region confirmed working)
- No database — localStorage only

## Repo
GitHub user: GueimGaides
(not pushed to GitHub yet)

## File structure
app/
├── api/
│   ├── generate/route.ts   — main guide generation endpoint
│   ├── refine/route.ts     — partial step editing endpoint
│   └── admin/auth/route.ts — admin panel password check
├── components/
│   ├── GuideDisplay.tsx    — full guide UI with checklist + PDF
│   ├── AdminPanel.tsx      — secret admin color/theme panel
│   └── SeasonalTheme.tsx   — seasonal CSS themes
├── globals.css             — CSS variables + print stylesheet
├── layout.tsx              — suppressHydrationWarning added
└── page.tsx                — main page
CONTEXT.md                  — this file

## Security
- API key server-side only in .env.local
- Unicode normalization before injection scanning
- System prompt separated from user data
- Output structure validated before sending to frontend
- Image URLs whitelisted to trusted domains only
- Rate limit: 5 req/min generate, 10 req/min refine
- Admin auth: 5 attempts per 15 min, constant-time comparison
- Temperature: 0.2

## Design
- Dark theme only
- Colors: #090c14 base, #3b7dd8 blue, #7c5cbf purple
- Fonts: Space Mono (display/steps), DM Sans (body)
- Seasonal: Christmas (Dec/Jan), Pride (June), Halloween (Oct)
- Snow is CSS only
- Step text uses monospace font (GameFAQs style)

## Features complete
- Any game, no content gatekeeping
- Auto browser language + manual override (11 languages)
- Click step → edit panel → AI refines just that step
- Partial regen — affectedSteps returned for cascading changes
- Triple Shift → admin panel (password protected)
- Admin: color presets, custom pickers, undo x5, seasonal override
- localStorage auto-save (guide + progress + colors)
- Save code (base64, 32 chars) for cross-device transfer
- PDF download via window.print() with print stylesheet
- Save code embedded in PDF header
- Steps have optional hint field (collapsible 💡)
- Linear game detection in prompt — focuses on missables/secrets
- Pride gradient logo in June
- suppressHydrationWarning (Dark Reader extension compat)

## Trusted image domains
bulbapedia.bulbagarden.net, cdn.bulbagarden.net, serebii.net,
gamefaqs.gamespot.com, wiki.fandom.com, psnprofiles.com,
ign.com, strategywiki.org, neoseeker.com, static.wikia.nocookie.net

## .env.local variables
GEMINI_API_KEY=their_key
ADMIN_PASSWORD=their_password

## Still to do
- Push to GitHub
- Deploy to Vercel
- Add tutorial (first visit overlay, highlights each UI element)
- Validate image URLs server-side before sending to frontend
- Test on mobile