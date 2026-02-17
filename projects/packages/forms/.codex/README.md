# Codex: Jetpack Forms Package

This directory contains architecture documentation for the `automattic/jetpack-forms` package. It gives Claude Code (and human developers) instant orientation without re-reading thousands of lines of source code each session.

## How to Use

1. **Start here** — you're reading the bootstrap file
2. **Read `map.md`** — architecture overview, file inventory, class relationships
3. **Read a flow doc** — `flows/*.md` for cross-file processes (rendering, submission, etc.)
4. **Read a file note** — `files/*.md` for notes on complex files

Only read what you need. If you're fixing a rendering bug, read `flows/form-rendering.md`. If you're debugging submission handling, read `flows/form-submission.md`. Don't read everything.

## Update Rules

After code changes to the forms package, run `/codex-update`. It will:
1. Identify which codex docs cover the changed files (via "Files involved" tables)
2. Update affected docs — method references, sequences, gotchas
3. Update the freshness signal at the top of each modified doc
4. Log the update in `log.md`

## Freshness

Each doc has a `<!-- verified: YYYY-MM-DD, commit: short-hash -->` comment. If the source files covered by that doc were modified after that commit, verify the doc's accuracy before relying on it.

## Quality Criteria

A good codex doc:
- Uses **`Class::method()` references** (stable, greppable) — not line numbers
- Is **50-200 lines** (flow docs) or up to **150 lines** (file notes)
- Explains the **why** and **how**, not the **what** (the source code already has the what)
- Is **actionable** — every section helps understand the code faster
- If it's faster to just read the source, the doc isn't earning its keep

## File Index

| File | Purpose |
|------|---------|
| `map.md` | Architecture overview, file inventory, class relationships |
| `flows/form-rendering.md` | Block rendering through HTML output |
| `flows/form-submission.md` | POST handling through feedback storage and email |
| `flows/field-validation.md` | Field validation during submission |
| `flows/jwt-encryption.md` | JWT token encoding/decoding with AES encryption |
| `flows/email-sending.md` | Email decision tree and sending pipeline |
| `files/class-contact-form.md` | Notes: Contact_Form — static state, JWT, dual render/submit role |
| `files/class-contact-form-plugin.md` | Notes: Contact_Form_Plugin — singleton orchestrator |
| `files/class-contact-form-field.md` | Notes: Contact_Form_Field — type dispatch, style variations |
| `references.md` | External docs, WordPress references, related packages |
| `log.md` | Codex maintenance log |
