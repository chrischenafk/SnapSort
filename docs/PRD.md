# SnapSort PRD

## Product Vision

SnapSort helps users quickly convert event details from unstructured sources (text snippets and screenshots) into editable Google Calendar events.

## MVP Scope

- Chrome extension only
- Google Calendar only
- One signed-in Google account
- Save to primary calendar only
- Inputs:
  - Selected text via context menu
  - Screenshot region capture (after selected-text flow is stable)
- Mandatory user confirmation before event creation

## User Flow

1. User sees event info in text or image form.
2. User triggers SnapSort via:
   - Context menu item on selected text.
   - Extension screenshot mode (future milestone in this repo).
3. Backend extracts event details with AI or fallback mock.
4. Side panel shows editable event form with warnings.
5. User saves or discards.
6. If saved, event is inserted into Google Calendar.

## Non-Goals For Initial Scaffold

- Full AI prompt engineering
- Google Calendar insert implementation
- Full screenshot capture/cropping pipeline
- Multi-account and multi-calendar flows

## Success Criteria (MVP)

- Selected text can launch extraction and produce an editable draft.
- User can inspect and adjust all key fields.
- Event only saves after explicit confirmation.
