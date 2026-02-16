# Codex Log

## 2026-02-16 -- File field email rendering
- Updated `flows/email-sending.md`: added `class-feedback-field.php` and `file-icons/` to files table, added three new gotchas (file field value structure, icon mapping, email PNG requirement)
- Gap found: codex didn't mention `Feedback_Field` as part of the email rendering pipeline — it's where per-field HTML is produced via `get_render_email_html_value()`
- Gap found: no documentation of the icon rasterization pipeline (`tools/rasterize-icons.mjs`) or the file-icons directory
- Gap found: the two different file field value structures (`{files}` vs `{field_id, files}`) caused a real bug — now documented as a gotcha

## 2026-02-14 -- Initial creation
- Created codex for `projects/packages/forms` via plan implementation
- Files documented: 28 PHP source files across 6 directories
- Flow docs created: form-rendering, form-submission, field-validation, jwt-encryption, email-sending
- File deep dives created: class-contact-form, class-contact-form-plugin, class-contact-form-field
- Line numbers verified against current trunk (commit 32d3cd5a6c)
