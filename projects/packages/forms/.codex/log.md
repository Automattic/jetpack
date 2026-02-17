# Codex Log

Tracks changes to the codex documentation itself, not to the source code. Each entry records which codex docs were created or modified, what triggered the update, and any gaps discovered.

## 2026-02-17 — Migrated to method-reference style, added freshness signals

- Codex docs modified: all files (README.md, map.md, 5 flow docs, 3 file notes, references.md)
- Trigger: codex-init and codex-update commands were rewritten to use `Class::method()` references instead of `file:line` references, and to add `<!-- verified: date, commit -->` freshness signals
- Changes made:
  - Replaced all `file:line` references with `Class::method()` references throughout
  - Added `<!-- verified: 2026-02-17, commit: 8225b1ff -->` to every doc
  - Slimmed file notes from exhaustive method indexes (40+ methods each) to key methods only (5-10 per file)
  - File notes capped at ~150 lines (were 150-195 lines)
  - README updated to explain freshness signals and new quality criteria
  - map.md entry points table now uses Class::Method format
- Gaps found: none — this was a format migration, not a content update
- Still needed: none

## 2026-02-16 — File field email rendering

- Codex docs modified: `flows/email-sending.md`
- Trigger: work on file field email rendering discovered undocumented pipeline
- Gaps found:
  - Codex didn't mention `Feedback_Field` as part of the email rendering pipeline — it's where per-field HTML is produced via `get_render_email_html_value()`
  - No documentation of the icon rasterization pipeline (`tools/rasterize-icons.mjs`) or the file-icons directory
  - The two different file field value structures (`{files}` vs `{field_id, files}`) caused a real bug — now documented as a gotcha
- Still needed: none

## 2026-02-14 — Initial creation

- Created codex for `projects/packages/forms` via plan implementation
- Codex docs created: README.md, map.md, 5 flow docs, 3 file deep dives, references.md, log.md
- Gaps/TODO: none at creation time
