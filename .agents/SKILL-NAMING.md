# Skill naming + registration

Conventions for skills under `.agents/skills/` and how they surface as Claude Code
slash commands.

---

## Naming guidelines

Recommendations, not a strict pattern — the existing tree predates this doc and
mixes several shapes.

- **Use kebab-case.** File name is `<full-name>.md`.
- **Lead with a recognizable scope** — package name, topic, or the repo.
  Existing scopes in `.agents/skills/`:
  - `jetpack-*` — repo-wide skills (`jetpack-changelog`, `jetpack-review-pr`,
    `jetpack-screenshot`, `jetpack-blueprint-builder`, …)
  - `premium-analytics-*` — bound to the premium-analytics package
  - `wp-abilities-*` — bound to the WP Abilities API toolkit
  - `charts-*`, `ship-*` — topic-scoped, no specific package binding
- **After the scope, describe what the skill does** in 1–3 words. New skills
  should prefer an early verb when there's a clear action
  (`<scope>-<verb>[-<object>]`, e.g. `premium-analytics-verify-ui`), but
  matching the shape of neighbors in an established subset is fine — current
  tree includes verb-only (`wp-abilities-verify`), object-only
  (`wp-abilities-api`, `charts-docs`), verb-first (`ship-wp-ability`), and
  noun-phrase (`jetpack-blueprint-builder`) forms.

---

## Slash-command registration

A skill under `.agents/skills/<name>.md` is **not** automatically invocable as
`/<name>` in Claude Code. It needs a stub file at `.claude/commands/<name>.md`:

```markdown
---
description: One-line description of what `/the-skill` does and when to use it.
---

@../../.agents/skills/<name>.md
```

The stub's frontmatter `description` is what users see in the slash-command
picker. The body imports the actual skill file via `@`-import. Keep the stub
small — all real logic lives in the skill file.

### When to add a stub

Add a stub whenever the skill is meant to be **directly invoked by name** during
a session. Skills that are only invoked by other skills (e.g. utility helpers,
sub-flows of a larger pipeline) don't need stubs.

Rule of thumb: if you'd want to type `/the-skill` to start it, it needs a stub.

### Why it matters

Without the stub, typing `/premium-analytics-foo <arg>` fails with
`Args from unknown skill: <arg>` — an unhelpful error that surfaces at
invocation time, not at file creation time. The lint script catches it before
that happens.

---

## Lint

```bash
bash .agents/check-skill-registration.sh
```

Scope is currently narrow: it enforces stub-presence only for skills matching
`.agents/skills/premium-analytics-*.md`. Other namespaces are unaffected.

To extend enforcement to a new namespace, edit the glob in the script. Don't
extend it speculatively — only widen when an actual second namespace shows the
same trap.

### When to run

- Before committing a new skill — fastest catch.
- Manually any time you suspect a stub got dropped during a rebase / refactor.

The script is plain bash and exits non-zero on any missing stub, so it composes
cleanly with pre-commit hooks or CI later if desired. Not wired up
automatically today.
