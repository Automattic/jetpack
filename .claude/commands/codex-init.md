---
description: Bootstrap a .codex/ knowledge system for a project
---

Bootstrap a `.codex/` codebase knowledge system for a project directory.

The user will provide a project path (e.g., `projects/packages/forms`). If not provided, ask for it.

## What is .codex/?

A persistent documentation system that gives Claude (and humans) instant orientation on a codebase. It stores architecture maps, cross-file flow documents, and deep dives for complex files — so future sessions don't need to re-read thousands of lines of source code to understand the project.

## Steps

### 1. Survey the project

Use Explore agents to thoroughly analyze the project:

- **File inventory**: Every source file with path, approximate line count, and one-line role
- **Class hierarchy**: Classes, inheritance, interfaces, traits
- **Entry points**: How the project bootstraps, where execution starts
- **Key data flows**: How data moves through the system end-to-end
- **Complex files**: Files over 500 lines that need deep dives
- **WordPress hooks**: Major actions and filters (if applicable)
- **External dependencies**: What packages/APIs this project depends on

### 2. Create directory structure

```
<project>/.codex/
├── README.md
├── map.md
├── flows/
├── files/
├── references.md
└── log.md
```

### 3. Write README.md (the bootstrap file)

This is the only file Claude *must* read when starting work on a project. Include:

- **What this is**: One paragraph explanation of the codex system
- **How to use**: Read map.md first, then relevant flow/file docs as needed
- **Update rules**: After any code change, update affected codex docs
- **Self-improvement protocol**: After each task, note gaps in log.md; periodically review and improve
- **Quality criteria**: What makes a good flow doc vs. a bad one
- **How to create a codex for a new project**: Point to `/codex-init`

### 4. Write map.md (architecture overview)

- **Overview**: What the package does (2-3 sentences)
- **Entry points**: Where execution starts (main class, block registration, etc.)
- **File inventory**: Every source file with one-line role, grouped by directory
- **Key classes**: Class hierarchy, relationships, responsibility ownership
- **Data flow**: How data moves through the system
- **Available flow docs**: Index of flows/ with one-line descriptions
- **Available file docs**: Index of files/ with one-line descriptions

### 5. Write flow docs (flows/*.md)

Identify the 3-8 most important cross-file processes and create a flow doc for each. Every flow doc must follow this template:

```markdown
# [Flow Name]

## When this happens
One sentence describing the trigger.

## Entry point
File:line — what triggers this flow.

## Sequence
Numbered steps with file:line references showing the call chain.

## Key decisions
Non-obvious logic, branching, filter hooks that alter behavior.

## Files involved
| File | Role |
|------|------|
| ... | ... |

## Gotchas
Things that will bite you if you don't know about them.
```

### 6. Write file deep dives (files/*.md)

Only for files that are genuinely complex (500+ lines, non-obvious patterns). Each follows:

```markdown
# [filename]

## Purpose
What this file does (2-3 sentences).

## Key patterns
Non-obvious architectural patterns.

## Method index
| Method | Line | Description |
|--------|------|-------------|
| ... | ... | ... |

Group methods by concern area.

## Properties & state
Important properties, especially static ones with shared state.

## Hooks & filters
All WordPress hooks used/fired, with context.

## Dependencies
What this file needs from others, what others need from it.
```

### 7. Write references.md

Document external dependencies and source code references. Structure as:

- **External libraries / upstream repos**: For major dependencies where you might need to read the source (e.g., Gutenberg for `@wordpress/*` packages), include:
  - Local clone path if available (e.g., `/Users/cg/a8c/gutenberg`)
  - GitHub URL
  - Table of key source locations within that repo relevant to this project
  - List of packages/modules used by this project and what they're used for
- **WordPress docs**: API references, developer handbook links
- **Jetpack packages**: Internal packages this project depends on
- **Third-party integrations**: External services the project integrates with
- **Key hooks**: Important WordPress actions and filters the project registers and consumes

The goal is that when you need to understand how an external dependency works, the references tell you exactly where to look -- either locally or on GitHub -- without searching from scratch.

### 8. Write log.md

Initialize with a creation entry:

```markdown
# Codex Log

## YYYY-MM-DD — Initial creation
- Created codex for [project] via /codex-init
- Files documented: [count]
- Flow docs created: [list]
- File deep dives created: [list]
```

### 9. Create or update CLAUDE.md

Add to the project's CLAUDE.md (create if needed). Include:

```markdown
## Codex

This project has a `.codex/` knowledge system for architecture documentation.
Always read `.codex/README.md` first when working on this project.

## Tooling

All commands require `nvm use` first to set the correct Node.js version for Jetpack tooling.

[Document the exact commands for: testing (JS and PHP), building, static analysis (phan), linting, watching. Include any environment prerequisites like `nvm use`.]
```

The Tooling section is critical -- it captures the exact commands with any prerequisites (like `nvm use`) so future sessions don't waste time on environment issues. Check `composer.json` scripts and the project structure to determine available tooling. Test a command if unsure.

## Quality Standards

- **Accuracy over coverage**: Every file:line reference must be verified against source code. Wrong references are worse than no references.
- **Concise**: A flow doc should be 50-200 lines. If it's longer, split it.
- **Actionable**: Every section should help someone understand the code faster. Remove anything that doesn't.
- **Maintainable**: Write docs that are easy to update. Avoid duplicating information across files.

## Important

- Read actual source files before writing any codex content. Never guess at line numbers or method signatures.
- Use file:line format (e.g., `src/class-foo.php:142`) for all code references.
- Group related information logically. Don't just dump alphabetical lists.
- Focus on the "why" and "how" — the "what" is already in the source code.
