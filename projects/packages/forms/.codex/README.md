# Codex: Jetpack Forms Package

This directory contains architecture documentation for the `automattic/jetpack-forms` package. It exists to give Claude Code (and human developers) instant orientation without re-reading thousands of lines of source code each session.

## How to Use

1. **Start here** -- you're reading the bootstrap file
2. **Read `map.md`** -- architecture overview, file inventory, class relationships
3. **Read a flow doc** -- `flows/*.md` for cross-file processes (rendering, submission, etc.)
4. **Read a file doc** -- `files/*.md` for deep dives into complex files (500+ lines)

Only read what you need. If you're fixing a rendering bug, read `flows/form-rendering.md`. If you're debugging submission handling, read `flows/form-submission.md`. Don't read everything.

## Update Rules

**After any code change to the forms package:**
1. Check which codex docs cover the changed files (look at "Files involved" tables in flow docs)
2. Update affected docs -- especially file:line references, which shift when code changes
3. If a flow fundamentally changed, rewrite the flow doc rather than patching it
4. Log the update in `log.md`

**Run `/codex-update` to automate this.**

## Self-Improvement Protocol

1. **After each task**: If the codex was missing information you needed, append what was missing to `log.md`
2. **After modifying source**: Update affected codex docs before marking the task complete
3. **Periodically**: Review `log.md` for patterns and batch-update codex docs
4. **Meta-improvement**: If these instructions are unclear or the templates aren't working, update this README

## Quality Criteria

A good codex doc:
- Has **verified** file:line references (not guessed)
- Is **50-200 lines** (flow docs) or up to 300 lines (file docs)
- Explains the **why** and **how**, not the **what** (the source code already has the what)
- Is **actionable** -- every section helps understand the code faster
- Is **maintainable** -- avoids duplicating info across files

A bad codex doc:
- Has stale line numbers that point to wrong code
- Dumps alphabetical lists without grouping by concern
- Restates what's obvious from reading method signatures
- Is so long it's faster to just read the source

## Creating a Codex for a New Project

Run `/codex-init` with a project path. See `.claude/commands/codex-init.md` for the full process.

## File Index

| File | Purpose |
|------|---------|
| `map.md` | Architecture overview, file inventory, class relationships |
| `flows/form-rendering.md` | Block rendering through HTML output |
| `flows/form-submission.md` | POST handling through feedback storage and email |
| `flows/field-validation.md` | Field validation during submission |
| `flows/jwt-encryption.md` | JWT token encoding/decoding with AES encryption |
| `flows/email-sending.md` | Email decision tree and sending pipeline |
| `files/class-contact-form.md` | Deep dive: Contact_Form (3,477 lines) |
| `files/class-contact-form-plugin.md` | Deep dive: Contact_Form_Plugin (3,953 lines) |
| `files/class-contact-form-field.md` | Deep dive: Contact_Form_Field (3,339 lines) |
| `references.md` | External docs, WordPress references, related packages |
| `log.md` | Usage log: gaps found, improvements made |
