# SnapSort Roadmap

## Milestone 1: Project Scaffold

- [x] Monorepo structure and workspace scripts
- [x] Extension scaffold (MV3 + React + Vite + Tailwind)
- [x] Backend scaffold (Express + TypeScript + Zod)
- [x] Shared types and schema foundations
- [x] Basic side panel and options pages

## Milestone 2: Extension Shell Hardening

- [ ] Ensure side panel launch behavior is reliable across tabs
- [ ] Add richer loading and empty states
- [ ] Persist and hydrate draft state robustly

## Milestone 3: Selected Text Flow

- [ ] Complete right-click selected text to side panel flow
- [ ] Display source metadata (page title + URL)
- [ ] Add robust error feedback for extraction failures

## Milestone 4: Text Extraction

- [ ] Replace mock text extractor with LLM provider implementation
- [ ] Harden prompt + parse + validation behavior
- [ ] Add warning/confidence handling UX

## Milestone 5: Google Calendar Save

- [ ] Implement OAuth token acquisition using `chrome.identity`
- [ ] Convert `EventDraft` into Google Calendar `events.insert` payload
- [ ] Show success UI + open event link when available

## Milestone 6: Screenshot Flow

- [ ] Implement overlay and drag-select region capture
- [ ] Add Esc cancellation behavior
- [ ] Add image preview + `/api/extract/image` pipeline

## Milestone 7: Polish

- [ ] Google Calendar-style visual polish
- [ ] Better loading skeletons and error states
- [ ] Privacy notice and permissions rationale
- [ ] Documentation quality pass

## Future Ideas

- Multiple Google accounts and calendars
- Custom extraction instructions and post-extraction “recompile”
- Event colors, reminders, recurrence
- Multi-event extraction from one source
- Outlook Calendar support
- Chrome Web Store publication
