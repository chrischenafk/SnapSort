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

To use it, configure your Google Cloud project:

1. Enable the Google Calendar API.
2. Configure the OAuth consent screen.
3. Create a Chrome extension OAuth client.
4. Replace `GOOGLE_OAUTH_CLIENT_ID_GOES_HERE` in `apps/extension/manifest.json` with the real client ID.

Current MVP behavior saves to the primary Google Calendar by default. Multi-account and multi-calendar support are planned for future milestones.

## Privacy and Security Notes

- LLM API keys belong only in backend environment variables.
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
