---
description: Audit a widget folder against the widget contract and conventions
allowed-tools: Read, Glob, Grep, Bash(grep:*), Bash(find:*), Bash(ls:*), Bash(cat:*)
---

Audit one `widgets/<slug>/` against the widget contract and this repo's conventions.
Report only — do not rewrite files unless the user asks.

**Argument**: `$ARGUMENTS` is a widget slug or path. If it resolves to a
`widgets/<slug>/`, audit it; otherwise list the `widgets/` folder and ask which.

The invariants live in the shared widgets rule (`.agents/rules/widgets.md`). This
command is how to verify a widget against them, plus the specifics the rule cannot
assume: namespace, text domain, and the dependency versions the package resolves.

## Pre-flight — derive, never assume

1. **Namespace + text domain**: take the `name` prefix from a sibling
   `widgets/*/widget.json` (e.g. `jpa`) and the text domain from the second
   argument used in `__()` across the package (e.g. `jetpack-premium-analytics`).
2. **Resolved versions**: check tokens and props against what the package actually
   resolves, not against trunk or memory:
   - Tokens → `@wordpress/theme`'s `design-tokens.css` in `node_modules/.pnpm`.
   - UI props → the resolved `@wordpress/ui` `build-types`.
   - Contract types → `@wordpress/widget-primitives` `build-types`.

## Checklist — one line per item: `PASS`, or a violation with `file:line` + fix

**Shape**
- `widget.json` has `name` (`<namespace>/<slug>`), `title`, `description`,
  `category`, `presentation` (`framed` | `content-bleed` | `full-bleed`).
- `widget.ts` default-exports `title`, `icon`, and — when configurable —
  `attributes` + `example`. The attribute TS shape is declared once and reused.
  `widget.ts` does NOT declare `presentation` — that field belongs only in `widget.json`.
- Every attribute declared in `widget.ts` is consumed somewhere in `render.tsx`; flag any
  ghost attribute (declared but never read from `attributes`).
- `render.tsx` default-exports the component.
- `package.json` `dependencies` mirror the imports across the widget source:
  nothing missing, nothing unused. Internal packages use `@jetpack-premium-analytics/*`
  aliases (never `@automattic/jetpack-premium-analytics-*` names).

**Contract**
- `render.tsx` props are typed by `WidgetRenderProps<T>` from
  `@wordpress/widget-primitives`, not a hand-rolled shape. `T` is the attribute type
  imported from `../widget` — it is NOT re-declared in `render.tsx`.
- `attributes` is defended — the host may pass it empty or undefined, so default it.
- The component receives only `{ attributes, setAttributes }`; no dashboard /
  surface / wp-admin imports, no `onRemove` / header / kebab.

**Chrome**
- The body renders content only — never a `Card`, header, title bar, or remove
  control (the host owns chrome). `presentation` in `widget.json` is a valid value.
- Verify that the `presentation` value in `widget.json` matches the widget's actual layout
  assumptions (e.g. `full-bleed` vs `framed` changes whether the host renders a border and
  padding). A mismatch causes incorrect chrome without a compile error.

**Style + i18n**
- Every `--wpds-*` token in the CSS exists in the resolved `@wordpress/theme`
  `design-tokens.css` (grep it; do not infer renamed names). Styles are CSS
  Modules, never global CSS. Production widget render files must not use inline
  `style={{ … }}` props; story-only canvas wrappers may use inline sizing when
  the style is not part of the shipped widget UI.
- Every `<button>` element has an explicit `type` attribute (`type="button"` for non-submit
  actions; `type="submit"` only when the button is intentionally a form submit).
- User-visible strings go through `__( …, '<text-domain>' )`. Check data-transform and
  display files, not just the render component.
- All source code comments are in English.

**Docs (JSDoc)**
- Props are a named `type`/`interface` with each field documented on the type,
  not echoed in `@param`. A component takes one typed tag
  (`@param {Props} props - The component props.`) — never `@param props.<field>`
  blocks; plain functions keep positional `@param`s.
- Descriptions track the code: referenced symbols still exist, terminology is
  consistent (`widget.json` ↔ `widget.ts` ↔ rendered strings), `@return` is accurate.
- Verify, don't guess: `jsdoc/require-param` is satisfied by that single typed
  `props` tag — confirm with `eslint <widget>/render.tsx` instead of dropping it.

## How to verify tokens

```bash
TOK=$(find node_modules/.pnpm -path '*@wordpress+theme*/css/design-tokens.css' | head -1)
grep -rhoE '\-\-wpds-[a-z0-9-]+' widgets/<slug>/*.css | sort -u | while read -r t; do
  grep -qE -- "$t\b" "$TOK" || echo "MISSING from resolved theme: $t"
done
```

Never run builds, Docker, or the dev server from this command.
