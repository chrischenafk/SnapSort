# SnapSort

SnapSort is a Chrome extension that turns event details from selected text or screenshots into editable Google Calendar events. Users always review and confirm details before any calendar event is created.

## Current Status

This repository currently contains the MVP scaffold for:
- `apps/extension`: Chrome Extension (Manifest V3, React, TypeScript, Vite, Tailwind CSS)
- `apps/backend`: Node.js + Express + TypeScript extraction backend
- `docs`: PRD, architecture notes, and roadmap

## Monorepo Structure

```text
snapsort/
├── README.md
├── package.json
├── tsconfig.base.json
├── apps/
│   ├── extension/
│   └── backend/
└── docs/
```

## Prerequisites

- Node.js 20+
- npm 10+
- Google OAuth client ID for Chrome extension identity flow (MVP placeholder in manifest)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure backend env:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. Start backend:

   ```bash
   npm run dev:backend
   ```

4. Build extension:

   ```bash
   npm run build --workspace apps/extension
   ```

5. Load unpacked extension in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select `apps/extension/dist`

## Development Commands

- Run extension dev server: `npm run dev:extension`
- Run backend dev server: `npm run dev:backend`
- Typecheck all: `npm run typecheck`
- Build all: `npm run build`
- Lint all: `npm run lint`

## Implemented In This Scaffold

- Workspace monorepo with extension and backend apps
- Manifest V3 baseline and context menu registration in service worker
- Side panel React shell with editable event form
- Google Calendar save action from the side panel form
- Options page shell with `chrome.storage` settings persistence
- Shared `EventDraft` and `UserSettings` types
- Shared Zod schemas for event and extraction payload validation
- Backend Express app with:
  - `GET /health`
  - `POST /api/extract/text` (currently mock extraction)
  - `POST /api/extract/image` (currently mock extraction)

## MVP Milestones

1. Project scaffold
2. Extension shell
3. Selected text flow
4. Text extraction flow
5. Google Calendar save
6. Screenshot flow
7. Polish

## Google Calendar Save Setup

Google Calendar save is now implemented for the side panel draft flow.

To use it, configure your Google Cloud project and extension OAuth client:

1. Create or select a Google Cloud project.
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen.
4. Create an OAuth client with application type **Chrome Extension**.
5. Use your Chrome extension ID from `chrome://extensions` as the OAuth client Item ID.
6. Copy the generated OAuth client ID (`...apps.googleusercontent.com`).
7. Update `apps/extension/manifest.json` and replace `GOOGLE_OAUTH_CLIENT_ID_GOES_HERE` (if still present) with the real OAuth client ID.
8. Keep the scope as `https://www.googleapis.com/auth/calendar.events`.
9. Add your Google accounts as OAuth test users while developing.
10. Expect OAuth verification requirements before public release for arbitrary users.

Notes:

- MVP saves to the signed-in user's primary Google Calendar.
- Multiple Google accounts and multiple calendar selection are future work.
- Cursor/code cannot generate this OAuth client ID automatically; it must be created in your Google Cloud project.

## Screenshot Region Capture

Screenshot region capture is now implemented for the side panel flow.

- Open the SnapSort side panel and click **Capture Screenshot**.
- Drag over the visible page region that contains event details.
- Press **Esc** to cancel capture mode at any time.
- The selected screenshot region is shown as a preview in the side panel.
- SnapSort sends the captured image to the backend `/api/extract/image` endpoint and pre-fills the editable event form.

Current screenshot extraction uses mock backend data unless real vision extraction is configured. This flow is intended for flyers, images, and PDF-like content where text selection is unavailable.

## Claude Extraction Setup

SnapSort extraction runs in the backend and supports mock mode or Anthropic Claude mode.

Backend environment variables (`apps/backend/.env`):

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`)
- `USE_MOCK_EXTRACTION` (`true` or `false`)

Run in mock mode (safe default):

```bash
USE_MOCK_EXTRACTION=true npm run dev:backend
```

Run in real Claude mode:

```bash
USE_MOCK_EXTRACTION=false ANTHROPIC_API_KEY=your_key ANTHROPIC_MODEL=claude-sonnet-4-6 npm run dev:backend
```

Behavior:

- If `USE_MOCK_EXTRACTION=true`, backend uses mock extraction.
- If `ANTHROPIC_API_KEY` is missing, backend falls back to mock extraction.
- If `USE_MOCK_EXTRACTION=false` and `ANTHROPIC_API_KEY` is set, backend calls Claude for text and image extraction.

Current extraction limitations:

- One event at a time.
- Multiple-event extraction is future work.
- Extraction quality may require prompt tuning and post-processing polish.

## Privacy and Security Notes

- LLM API keys belong only in backend environment variables.
- Selected text and screenshots are sent to the backend for extraction.
- When Claude mode is enabled, backend sends extraction input to Anthropic.
- The extension never stores the Claude API key.
- The extension should not create calendar events without user confirmation.
- Selected text and screenshots are treated as sensitive input and should avoid production logging.
- Scope and permissions are intentionally minimized for MVP.

## Future Roadmap (Post-MVP)

- Multiple Google account support
- Multiple calendar selection
- AI custom instructions applied to extraction
- Manual “recompile event” follow-up instructions
- Event color selection
- Reminder support
- Recurrence support
- Structured rules with dropdowns
- Multiple event extraction from one source
- Outlook Calendar support
- Chrome Web Store publication
