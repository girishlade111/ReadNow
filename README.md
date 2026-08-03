<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ReadNow — Enterprise Knowledge Platform & Distraction-Free Reader

> A brutalist-designed web app to **save, read, analyze, and share** web pages, articles, internal documents, podcasts, and video transcripts in a clean, distraction-free reading mode — supercharged with Google Gemini AI.

ReadNow is a full-stack **Express + Vite + React single-page application**. Server-side it fetches any URL, extracts the article body with Mozilla's Readability engine, stores everything in a local JSON database, and augments each document with an AI-generated executive analysis (summary, key takeaways, action items, sentiment, and suggested tags). It ships with reader-customization, text-to-speech, highlights and notes, an AI Copilot, workspace-wide RAG search, team digests, collections, exports, enterprise governance controls, audit logs, and outbound webhooks.

**Live AI Studio instance:** https://ai.studio/apps/c1dbe0d5-a3a4-4f5d-8f64-e8e6bcda90b6

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running in Development](#running-in-development)
  - [Building & Running in Production](#building--running-in-production)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [AI Capabilities](#ai-capabilities)
- [Data Persistence](#data-persistence)
- [Design System](#design-system)
- [Deployment on AI Studio / Cloud Run](#deployment-on-ai-studio--cloud-run)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

### Core Reading Platform
- **Save any URL** — paste a link, ReadNow fetches it, extracts the clean article via `@mozilla/readability`, and stores title, author, site name, publish date, full HTML, and plain text.
- **Distraction-free reader mode** — custom typography for headings, blockquotes, code blocks, images, and links with brutalist styling.
- **Fully customizable reading settings** (`ReaderSettingsModal`):
  - Font family: sans / serif / mono
  - Font size
  - Line height
  - Column width (narrow / normal / wide)
  - Theme: Brutal Light, Brutal Dark, Sepia, Cyberpunk
  - Bionic reading ("speed-reading") mode
  - Auto text-to-speech speech rate
- **Quick Save + Ingest** (`POST /api/quick-save`) — a bookmarklet, Chrome-extension style endpoint, or internal tool for dropping in arbitrary text, audio/podcast transcripts, or video transcripts as documents (no URL required).
- **Text-to-Speech audio player** (`AudioPlayer`) using the Web Speech API (`speechSynthesis` + `SpeechSynthesisUtterance`), with play/pause/skip and configurable rate.

### Personal Knowledge Management
- **Highlights with notes** (`HighlightsManager`) — highlight any sentence in an article in 4 colors (yellow / green / pink / blue) and attach a private note.
- **Favorites & Archive** — star articles and archive or delete them (delete cascades to highlights and comments).
- **Reading progress** — track %-read per article to feed streaks and analytics.
- **Collections** (`TeamCollectionsModal`) — organize articles into color-coded, team-shared collections (Engineering & Tech, Market Research, Product Strategy, and custom ones).
- **Collaborative comments** — leave timestamped, author-attributed comments on any article.

### AI Capabilities (Google Gemini)
- **Auto AI analysis on every save** — an executive summary, 3–4 key takeaways, action items, sentiment classification (Positive / Neutral / Analytical / Critical), and suggested tags.
- **Article AI Copilot** (`AiCopilotDrawer`) — chat with the article, ask questions, get a quick summary, or translate it into any language (default app state: Marathi).
- **One-click translation** — Gemini translates title, HTML content, and a short summary into your target language and stores it per-article.
- **Workspace-wide RAG** (`GlobalRAGDrawer`) — ask a question across your entire library; the server ranks all articles by relevance, selects the top 5, and returns a cited executive answer with source snippets.
- **Weekly Team AI Digest** (`TeamDigestModal`) — synthesize the whole team's reading into a digest title, summary, key insights, and a recommended action; copy as Markdown or broadcast to Slack/Teams.
- **Graceful fallback** — every AI feature falls back to a deterministic local heuristic engine when no `GEMINI_API_KEY` is configured, so the app works fully offline.

### Integrations
- **Outbound Webhooks** (`IntegrationsModal`) — register any endpoint; ReadNow fires `ARTICLE_SAVED` and `DIGEST_GENERATED` events automatically (test ping endpoint included).
- **Bookmarklet / Quick Save** — save a page from your browser with a bookmarklet pointing at the quick-save API.
- **Export** (`ExportModal`) — export any article as Markdown (single text/summary/takeaways/highlights), HTML, copy, or print-to-PDF.

### Enterprise, Governance & Analytics
- **Enterprise Data Governance** (`AuditLogsModal`):
  - **DLP / PII masking** — when enabled, emails, SSNs, and credit-card numbers are redacted (`[REDACTED_EMAIL]`, `[REDACTED_SSN]`, `[REDACTED_CARD]`) before text is sent to AI models.
  - **Zero Data Retention** toggle — enforces ephemeral prompts.
  - Storage & security profile (AES-256 at rest / in transit).
- **Immutable audit trail** — every action (`ARTICLE_SAVED`, `ARTICLE_DELETED`, `HIGHLIGHT_ADDED`, `EXPORT_PERFORMED`, `AI_RAG_QUERY`, `DIGEST_GENERATED`, `SETTINGS_UPDATED`) is logged with a timestamp, action, actor, and JSON; exportable as CSV.
- **Settings API** — per-app DLP, retention, and auto-digest schedule persisted to the JSON database.
- **Analytics Dashboard** (`AnalyticsDashboard`) — total articles, articles read, total reading time, time saved by AI summaries, reading-streak days, and a top-categories/domains breakdown.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Language** | TypeScript (ESM) |
| **Frontend** | React 19, React Router 7, Vite 6 |
| **Backend** | Node.js + Express 4 (`tsx` runtime) |
| **Styling** | Tailwind CSS 4 (via `@tailwindcss/vite`), custom brutalist CSS layers |
| **AI** | `@google/genai` (Google Gemini 2.5 Flash, JSON-mode responses) |
| **Article parsing** | `@mozilla/readability` + `jsdom` |
| **Sanitization** | `dompurify` |
| **Icons** | `lucide-react` |
| **Motion** | `motion` (Framer Motion) |
| **Utilities** | `clsx`, `tailwind-merge`, `date-fns` |
| **Persistence** | Flat-file JSON store (`fs`), no external database required |
| **Hosting target** | AI Studio applets / Cloud Run (see [Deployment](#deployment-on-ai-studio--cloud-run)) |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Client (React SPA, served by Vite middleware or /dist)  │
│   App.tsx · Navbar · ReaderView · Modals · Drawers      │
│        │                   ▲                             │
│        │  fetch /api/*     │ JSON responses             │
│        ▼                   │                             │
│  ┌─────────────────────────────────────────────┐          │
│  │  Express Server (server.ts, port 3000)       │          │
│  │  /api/parse · /api/quick-save               │          │
│  │  /api/articles · /api/highlights · ...       │          │
│  │  Webhook dispatcher · static file serving    │          │
│  └──────────────┬───────────────────────────────┘          │
│                 │                                          │
│  ┌──────────────▼───────────────┐   ┌───────────────┐      │
│  │  server/db.ts                │   │ server/ai.ts  │      │
│  │  JSON file persistence       │   │ Gemini client  │      │
│  │  data/readnow_db.json        │   │ + local fallback │    │
│  └──────────────────────────────┘   └───────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### How an article gets saved

1. React posts `{ url }` to `POST /api/parse`.
2. The server validates the URL, fetches raw HTML with a Chrome `User-Agent` header, and runs it through `JSDOM` + `Readability` to extract `title`, `byline`, `siteName`, `publishedTime`, `content`, `textContent`, and `excerpt`.
3. If DLP is enabled in settings, PII is masked on `textContent`.
4. Reading time is computed at ~200 WPM.
5. `generateArticleAnalysis()` produces the AI summary, and the article is persisted.
6. An `ARTICLE_SAVED` audit log entry is written, and `ARTICLE_SAVED` webhooks are dispatched.
7. The saved article (with AI analysis) is returned to the client.

---

## Project Structure

```
ReadNow/
├── server.ts                  # Express app, all REST routes, webhook dispatcher, Vite wiring
├── vite.config.ts             # React + Tailwind plugins, '@/'-alias, GEMINI_API_KEY define, HMR gate
├── tsconfig.json              # TypeScript config with '@/'-alias → root
├── package.json
├── .env.example               # Documented environment variables
├── metadata.json              # AI Studio metadata (name, description)
├── index.html
├── dist/                      # Production build output (generated)
├── data/
│   └── readnow_db.json        # JSON database (generated at runtime)
├── server/
│   ├── db.ts                  # JSON-file persistence layer + all interfaces/models
│   └── ai.ts                  # Gemini client + heuristics: analysis, copilot, translation, RAG, digest, DLP
└── src/
    ├── main.tsx               # App entry point
    ├── App.tsx                # Root app, routing, global state, DEFAULT_SETTINGS
    ├── index.css              # Tailwind + brutalist design system + reader themes + print styles
    ├── types/
    │   └── index.ts           # Shared client types
    ├── services/
    │   └── api.ts             # Fetch wrapper around all endpoints (with localStorage fallback)
    └── components/
        ├── Navbar.tsx              # Top navigation
        ├── ArticleCard.tsx         # Library grid card
        ├── AudioPlayer.tsx         # Text-to-speech dock
        ├── AiCopilotDrawer.tsx     # Article chat / summarize / translate
        ├── GlobalRAGDrawer.tsx     # Workspace-wide Q&A with citations
        ├── HighlightsManager.tsx   # Highlight color/note management
        ├── ReaderSettingsModal.tsx # Font/theme/columns/bionic controls
        ├── ExportModal.tsx         # Markdown / HTML / copy / print export
        ├── TeamCollectionsModal.tsx # Collections view
        ├── IntegrationsModal.tsx   # Bookmarklet, webhooks, quick save
        ├── AuditLogsModal.tsx      # Enterprise governance + audit trail
        ├── TeamDigestModal.tsx     # Weekly AI team digest
        └── AnalyticsDashboard.tsx  # KPI & stats dashboard
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18.20+ / v20+ recommended — the server uses the global `fetch` API)

### Installation

```bash
# 1. Clone the repo and enter the directory
cd ReadNow

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the project root (it is loaded automatically via dotenv / Vite `loadEnv`).

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes * | Google Gemini API key for all AI features. If omitted (or set to `MY_GEMINI_API_KEY`), ReadNow runs with a built-in heuristic fallback — no AI. In AI Studio it is injected automatically from user **Secrets**. |
| `APP_URL` | No | Fully-hosted applet URL (AI Studio injects the Cloud Run service URL). Used for self-referential links and API endpoints. |

> **Tip:** In AI Studio, configure the API key via the **Secrets panel** in the UI — it supersedes `.env.local`.

### Development in the workspace

```bash
npm run dev
```

This launches the `tsx` server which also boots the Vite dev server in-memory (middleware mode).

Open **http://localhost:3000** — the host header is `0.0.0.0` and the server serves both the Express API and the Vite HMR client from the same origin.

### Building & Running in Production

```bash
# 1. Type-check
npm run lint          # tsc --noEmit

# 2. Build the frontend bundle
npm run build         # vite build → dist/

# 3. Serve with the Express server (production mode, static route)
NODE_ENV=production npm start   # node server.ts → http://localhost:3000
```

In production (`NODE_ENV=production`), `server.ts` serves the compiled static files from `dist/` and falls back to `dist/index.html` for SPA routing.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the full-stack dev server (Express API + in-memory Vite HMR on `localhost:3000`) |
| `npm run build` | Build the static client into `dist/` |
| `npm run preview` | Preview the built client with Vite |
| `npm run clean` | Remove the `dist/` output directory |
| `npm run lint` | TypeScript type-check without emitting files (`tsc --noEmit`) |
| `npm start` | Run the production server (requires a build) |

---

## API Reference

Base URL: `http://localhost:3000` (or your `APP_URL`). All requests are JSON; the body limit is **10 MB**.

### Articles & Parsing

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/parse` | Fetch and extract an article from a URL, run AI analysis if present, persist, log, webhook. Body: `{ url }` |
| `POST` | `/api/quick-save` | Ingest custom doc / audio text / video transcript or web content. Body: `{ title, content, url?, mediaType?, collectionId? }` |
| `GET` | `/api/articles` | List all articles → `{ articles }` |
| `GET` | `/api/articles/:id` | Get one article → `{ article }` |
| `PATCH` | `/api/articles/:id` | Merge-update article fields (archive, favorite, progress, collection, tags…) → `{ article }` |
| `DELETE` | `/api/articles/:id` | Delete article (cascades highlights/comments), logs audit → `{ success }` |

### AI Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/ai/summarize` | (Re)generate the AI analysis for an article. Body: `{ articleId }` |
| `POST` | `/api/ai/ask` | Ask the AI Copilot a question about one article. Body: `{ articleId, question }` |
| `POST` | `/api/ai/workspace-ask` | Workspace-wide RAG Q&A over all articles. Body: `{ query }` → `{ answer, citations, query }` |
| `POST` | `/api/ai/digest` | Generate a weekly team AI digest. → `{ digest }`, dispatches `DIGEST_GENERATED` webhook |
| `POST` | `/api/ai/translate` | Translate article title/content/summary to a target language. Body: `{ articleId, targetLanguage }` |

### Highlights & Comments

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/highlights?articleId=&nbsp;` | List highlights (optionally filtered by article) |
| `POST` | `/api/highlights` | Add highlight. Body: `{ articleId, text, color?, note? }` |
| `DELETE` | `/api/highlights/:id` | Delete a highlight |
| `GET` | `/api/comments?articleId=&nbsp;` | List comments for an article |
| `POST` | `/api/comments` | Add comment. Body: `{ articleId, author?, text }` |

### Collections, Governance & Integrations

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/collections` | List shared, team collections |
| `POST` | `/api/collections` | Create collection. Body: `{ name, description?, color? }` |
| `DELETE` | `/api/collections/:id` | Delete + unassign articles |
| `GET` | `/api/audit-logs` | List audit trail |
| `GET` | `/api/settings` | Get enterprise settings (`dlpEnabled`, `zeroDataRetention`, `autoDigestSchedule`, `retentionDays`) |
| `PATCH` | `/api/settings` | Update settings. Body: any subset |
| `GET` | `/api/webhooks` | List webhook configs |
| `POST` | `/api/webhooks` | Create webhook. Body: `{ name, url, events?, enabled? }` |
| `DELETE` | `/api/webhooks/:id` | Delete a webhook |
| `POST` | `/api/webhooks/test` | Send a `TEST_PING` to a URL. Body: `{ url }` |

### Analytics & Export

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/analytics` | Reading stats: totals, reading time, time saved, streaks, category breakdown |
| `POST` | `/api/export` | Export article. Body: `{ articleId, format }`. When `format === 'markdown'` returns a `.md` attachment including summary, takeaways, and highlights; otherwise returns `{ article, highlights }` |

### Webhook Events

- `ARTICLE_SAVED` — payload: `{ id, title, url }`
- `DIGEST_GENERATED` — payload: the full digest
- `TEST_PING` — "Webhook verified" ping sent via `/api/webhooks/test`

Webhook request body shape: `{ event, timestamp, payload }`.

---

## AI Capabilities

All AI features live in `server/ai.ts` and run on the **Gemini 2.5 Flash** model (`@google/genai`). When no API key is present, every function degrades to a deterministic, local heuristic that keeps the product functional.

| Feature | Endpoint | Model-mode response |
| --- | --- | --- |
| Auto analysis (summary/takeaways/actionItems/sentiment/tags) | via parse & `/api/ai/summarize` | JSON (`responseMimeType: "application/json"`) |
| Article Copilot Q&A | `/api/ai/ask` | Markdown text |
| Translation | `/api/ai/translate` | JSON (title + HTML content + summary) |
| Workspace-wide RAG | `/api/ai/workspace-ask` | Markdown with `[Source N]` citations |
| Team digest | `/api/ai/digest` | JSON (title, summary, topInsights, recommendedAction) |
| DLP PII masking | applied server-side pre-AI | regex redaction (email/SSN/credit-card) |

The workspace RAG uses a token-frequency relevance scoring pass to select the top-5 articles (else the first 3) and feeds up to ~1,500-char snippets per source into the model, returning relevance-scored citations.

---

## Data Persistence

There is **no external database** — everything lives in a single pretty-printed JSON file:

```
data/readnow_db.json
```

Created automatically on first request (and reset if it becomes corrupt). The schema (`DatabaseSchema` in `server/db.ts`) contains:

- `articles[]` — full saved articles + AI analysis + translations
- `collections[]` — three seeded defaults (Engineering, Research, Strategy)
- `highlights[]`, `comments[]` — annotations
- `auditLogs[]` — capped at 500 entries
- `settings` — enterprise governance flags
- `webhooks[]` — one disabled demo Slack webhook pre-seeded
- `analytics` — reading streak + last-read date

**In scale:** swap `server/db.ts` for a real datastore (the UI already surfaces "PostgreSQL Sync" in its governance panel) while keeping the same interface; the Express routes are storage-agnostic.

---

## Design System

ReadNow uses a **neo-brutalist** visual identity:

- Thick **4px black borders**, hard **8px offset shadows**, and pure black/white/gray surfaces with flat `#dc2626` (red) and `#facc15` (amber) accents.
- Typography: **Space Grotesk** (body, loaded via `--font-sans`), JetBrains Mono for code/mono, Inter fallback.
- Signature utilities in `src/index.css`: `.brutal-border`, `.brutal-shadow`, `.brutal-card`, `.brutal-button`, `.brutal-input`.
- **Reader themes** — `theme-brutal-light`, `theme-brutal-dark`, `theme-sepia`, `theme-cyberpunk`.
- Headings in the reader are uppercase with black underlines; blockquotes get a red accent; code/pre blocks are black-on-white with red hard shadows; images respect the `@media print` clearing (header, nav, audio dock, and buttons hidden on print).

---

## Deployment on AI Studio / Cloud Run

1. Push this repo to a Cloud Run service (or link it in AI Studio).
2. In AI Studio, set the **`GEMINI_API_KEY`** in the Secrets panel — it is injected for this process automatically at runtime (the `vite.config.ts` also inlines it for the client build from the environment).
3. Vite's `DISABLE_HMR` gate keeps the file-watch quiet in the editor environment to prevent flicker during agent/AI edits.
4. Set `NODE_ENV=production` in the service so it serves `dist/` statically.

In AI Studio the app runs at the Cloud Run service URL — the applet link for this instance is:

https://ai.studio/apps/c1dbe0d5-a3a4-4f5d-8f64-e8e6bcda90b6

---

## Troubleshooting

| Problem | Likely cause / fix |
| --- | --- |
| Articles save without summaries | `GEMINI_API_KEY` missing → the app uses the heuristic fallback. Set the key in `.env.local` or AI Studio Secrets and retry. |
| Port already in use | Another process on `3000` — kill it or change `PORT` in `server.ts`. |
| A web page fails to parse | The site blocks bots/returns 403 — try a different URL. Readability can also return `null` for non-article pages (JS-only apps, videos). |
| Webhooks not firing | Ensure the webhook is `enabled` and its event list includes `ARTICLE_SAVED`/`DIGEST_GENERATED`. Use `/api/webhooks/test`. |
| Data resets unexpectedly | Corrupt `data/readnow_db.json` is re-initialized automatically — back up the `data/` folder for persistence. |
| `tsc` errors | Run `npm run lint` to type-check; ensure Node ≥18 for `fetch` support. |

---

## License

Private / internal — see `package.json` and repository settings. All third-party trademarks and service names are the property of their respective owners.