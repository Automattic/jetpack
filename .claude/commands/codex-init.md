---
description: Bootstrap a .codex/ knowledge system for a project
---

**Scope: currently only supported for `projects/packages/forms`.** If the user requests this for a different project, explain that the codex system is only set up for the forms package and decline to proceed.

Bootstrap a `.codex/` codebase knowledge system for a project directory.

The user will provide a project path (e.g., `projects/packages/forms`). If not provided, ask for it.

## What is .codex/?

A persistent, directory-scoped documentation system that gives Claude (and humans) instant orientation on a codebase. It stores architecture maps, cross-file flow documents, and notes on complex files — so future sessions don't need to re-read thousands of lines of source code to understand the project.

Each codex lives inside its project directory and documents only that project. It does not index the monorepo or other packages.

## Reference style

Use **method and class references** as primary anchors, not line numbers. Method names are stable across code changes and greppable. Line numbers go stale with every edit.

Good: `Contact_Form::process_submission()` handles validation and storage.
Bad: `class-contact-form.php:2426` — process_submission() handles validation.

When referencing code, use the format `Class::method()` or `function_name()` with the file path for context where needed: `Contact_Form::process_submission() (class-contact-form.php)`.

## Steps

### 1. Survey the project and plan scope

Use Explore agents to analyze the project. Focus on **production source files** — skip test files, config files, build artifacts, and vendor/node_modules unless they contain unusual patterns.

Gather:
- **File inventory**: Every production source file with path, approximate line count, and one-line role
- **Class hierarchy**: Classes, inheritance, interfaces, traits
- **Entry points**: How the project bootstraps, where execution starts
- **Key data flows**: The 3-8 most important cross-file processes (e.g., "form submission", "email sending")
- **Complex files**: Files that are hard to understand — complex state, non-obvious patterns, many responsibilities
- **WordPress hooks**: Major actions and filters registered or consumed (if applicable)
- **External dependencies**: Packages and APIs this project depends on

After surveying, decide:
- Which flows deserve their own doc (aim for 3-8)
- Which files deserve a deep dive (only genuinely complex ones — a short file with tricky state needs one more than a long file of repetitive renderers)
- Share your plan with the user before writing, so they can redirect if priorities are wrong

### 2. Write map.md (architecture overview)

The main orientation document. Include:

- **Overview**: What the package does (2-3 sentences)
- **Entry points**: Where execution starts, with class/method references
- **Boot sequence**: How the project initializes (numbered steps with class::method references)
- **File inventory**: Every production source file with one-line role, grouped by directory. Include line counts to signal complexity. Skip test files and config.
- **Key classes**: Class hierarchy diagram showing inheritance and responsibility
- **Data flow**: ASCII diagram or numbered description of how data moves through the system
- **Available flow docs**: Index of `flows/` with one-line descriptions
- **Available file docs**: Index of `files/` with one-line descriptions

### 3. Write flow docs (flows/*.md)

Create a flow doc for each major cross-file process. These are the highest-value part of the codex — they capture knowledge that's genuinely hard to reconstruct from source. Template:

```markdown
# [Flow Name]

<!-- verified: YYYY-MM-DD, commit: short-hash -->

## When this happens
One sentence describing the trigger.

## Entry point
Class::method() (file path) — what triggers this flow.

## Sequence
Numbered steps showing the call chain. Use Class::method() references.
Group into phases if the flow has distinct stages.

## Key decisions
Non-obvious logic, branching, filter hooks that alter behavior.

## Files involved
| File | Role |
|------|------|
| ... | ... |

## Gotchas
Things that will bite you if you don't know about them.
```

Keep each flow doc to **50-200 lines**. If it's longer, split into separate flows.

### 4. Write file notes (files/*.md)

Only for files that are **genuinely hard to understand** — complex state, non-obvious patterns, many responsibilities. Don't write these for files that are straightforward despite being long.

Keep these lighter than flow docs. Focus on what's not obvious from reading the source:

```markdown
# [filename]

<!-- verified: YYYY-MM-DD, commit: short-hash -->

## Purpose
What this file does and why it's complex (2-3 sentences).

## Key patterns
Non-obvious architectural patterns, design decisions, or conventions.

## Key methods
Only the 5-10 methods that aren't obvious from their names.
For each: method name, what it does, and why it's notable.

## State & lifecycle
Important properties, especially static/shared state. How instances are created and managed.

## Hooks & filters
WordPress hooks registered or consumed, with context on when and why.

## Gotchas
Non-obvious behavior, common mistakes, tricky edge cases.
```

Note: don't write exhaustive method indexes. I can Grep for any method name. Document only the methods where the name doesn't tell the full story.

### 5. Write references.md

Document external dependencies so future sessions know where to look:

- **External libraries / upstream repos**: For major dependencies where you might need to read the source (e.g., Gutenberg for `@wordpress/*` packages):
  - Local clone path if available (e.g., `~/src/gutenberg`)
  - GitHub URL
  - Table of key source locations relevant to this project
  - Packages/modules used and what they're used for
- **WordPress docs**: Relevant API references, developer handbook links
- **Internal packages**: Packages from this monorepo that the project depends on
- **Third-party integrations**: External services the project integrates with
- **Key hooks**: Important actions and filters the project registers and consumes

### 6. Write README.md (the bootstrap file)

First file Claude reads when starting work. Keep it concise:

- **What this is**: One paragraph explaining the codex
- **How to use**: Read map.md first, then relevant flow/file docs as needed. Don't read everything.
- **Update rules**: After code changes, run `/codex-update`
- **Freshness**: Each doc has a `<!-- verified: date, commit -->` comment. If the source was modified after that commit, verify before relying on the doc.
- **Quality criteria**: Verified references, concise, explains "why" not "what"
- **File index**: Table of every codex file with one-line purpose

### 7. Write log.md

Tracks **codex maintenance activity** — what docs were created, modified, or found lacking. NOT a changelog of the source code.

```markdown
# Codex Log

Tracks changes to the codex documentation itself, not to the source code. Each entry records which codex docs were created or modified, what triggered the update, and any gaps discovered.

## YYYY-MM-DD — Initial creation
- Created codex for [project] via /codex-init
- Codex docs created: [list all .codex/ files]
- Gaps/TODO: [anything you noticed but skipped, or "none"]
```

### 8. Create or update CLAUDE.md

Add to the project's CLAUDE.md (create if it doesn't exist):

- **Codex pointer**: Tell Claude to read `.codex/README.md` first when working on this project
- **Quick overview**: What the project does, key files (enough to orient without reading the codex)
- **Tooling commands**: Discover the exact commands for testing (JS and PHP), building, static analysis, linting, and watching. Check `composer.json` scripts and the project structure. Include any environment prerequisites. Test a command if unsure.

## Quality Standards

- **Accuracy over coverage**: Every reference must be verified against source code. Wrong references are worse than no references.
- **Concise**: Flow docs 50-200 lines. File notes up to 150 lines. If it's longer, you're documenting too much.
- **Actionable**: Every section should help someone understand the code faster. Remove anything that doesn't.
- **Maintainable**: Use class::method() references that survive code changes. Avoid duplicating information across files.
- **Scoped**: Only document the project in its own `.codex/` directory. Don't reference or update codex docs in other projects.

## Important

- Read actual source files before writing any codex content. Never guess at method signatures or behavior.
- Use `Class::method()` format for code references. Add `(file-path)` when the class/file mapping isn't obvious.
- Group related information logically. Don't dump alphabetical lists.
- Focus on the "why" and "how" — the "what" is already in the source code.
- The codex is a tool for orientation, not exhaustive documentation. If it's faster to just read the source, the codex doc isn't earning its keep.
