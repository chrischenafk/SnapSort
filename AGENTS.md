# AGENTS.md

## Project Overview

SnapSort is a Chrome extension that helps users turn event information from selected text or screenshots into editable Google Calendar events.

The core product flow is:

1. User encounters event information in an email, webpage, image, flyer, syllabus, announcement, or other source.
2. User either:
   - Highlights text, right-clicks, and selects “Create Calendar Event with SnapSort”
   - Or enters screenshot mode and drags over the relevant part of the page
3. SnapSort extracts structured calendar event details.
4. SnapSort opens a side panel with an editable Google Calendar-style event form.
5. User reviews and edits the event.
6. User saves or discards the event.
7. If saved, SnapSort creates the event in Google Calendar.

The current MVP target is:

- Chrome extension only
- Google Calendar only
- One signed-in Google account
- Save to the user’s primary Google Calendar
- Selected-text flow first
- Screenshot flow second
- Google OAuth and Calendar API after the editable event draft flow works
- AI extraction through a backend, not directly from the extension

Do not overbuild. Prioritize clean, working milestones.

---

## Repository Expectations

The repository should use this general structure:

```text
SnapSort/
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── README.md
├── AGENTS.md
├── apps/
│   ├── extension/
│   │   ├── manifest.json
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── background/
│   │   │   ├── content/
│   │   │   ├── sidepanel/
│   │   │   ├── options/
│   │   │   ├── lib/
│   │   │   └── shared/
│   │   └── public/
│   └── backend/
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   ├── services/
│       │   ├── schemas/
│       │   └── utils/
│       └── .env.example
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    └── ROADMAP.md