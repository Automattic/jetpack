# Site Chat (Reader Chat) — Brand Kit

**Date:** 2026-07-30
**Status:** Approved design, ready for implementation
**Scope:** A small brand kit — assistant name, logo, accent color, greeting. Full white-label is documented as an open decision in the appendix and is explicitly **not** built.

---

## Problem

Reader Chat renders the same generic assistant on every site that enables it. A site owner can already shape the bot's *voice* through the existing guidelines system (`wp_guideline` post type → `get_copy()` / `get_site()` / `get_additional()`, injected by `trait.reader-agent.php`), but cannot change its *identity* or *appearance*. The widget looks like a WordPress.com component parked on their blog.

This spec adds a brand kit: a name, a logo, an accent color, and a greeting, with sensible values derived from the site so that every enabled site improves without anyone opening settings.

## Non-goals

- Removing or altering the EU AI Act compliance disclosure
- Removing network-level WordPress.com attribution
- Plan gating
- A media picker for the logo (v1 uses the Site Icon; see Decisions)
- Any change to the existing guidelines / voice system

---

## Existing architecture

Three repos participate.

**Jetpack** — `projects/plugins/jetpack/extensions/plugins/ai-assistant-plugin/reader-chat/class-jetpack-reader-chat.php`

- Gates on the `reader_chat` option (plus AI features, Search plan, coming-soon, and filters)
- Enqueues `https://widgets.wp.com/agents-manager/reader-chat.min.js` and `.css`
- Injects `window.JetpackReaderChatConfig` via `wp_add_inline_script`: `siteId`, `siteUrl`, `siteName`, `isDevMode`, `agentId`, `currentPost`
- Registers the `reader_chat` setting and adds it to `jetpack_sync_options_whitelist` so the wpcom-hosted agent can read it server-side

Settings UI lives in `projects/packages/search/src/dashboard/components/reader-chat-control/index.jsx` (a single `ToggleControl` plus a conditional "Set guidelines" link), saved through `projects/packages/search/src/class-rest-controller.php`.

**Calypso** — `apps/agents-manager/reader-chat.js`

- Reads `window.JetpackReaderChatConfig`, copies values onto `window.agentsManagerData`
- Injects a scoped `!important` CSS reset targeting `#jetpack-reader-chat`, `.agents-manager-chat`, and `.components-popover` — the panel is portalled to `body`, so mount-node-only scoping does not reach it
- Pins the launcher to bottom-left via `.agents-manager-sidebar-fab`
- Fetches contextual suggestions and wires Tracks events

UI comes from `@automattic/agents-manager` → `@automattic/agenttic-ui`.

**wpcom** — `wp-content/lib/ai/agents/class.reader-chat-agent.php` and `trait.reader-agent.php`

- `run()` reads `clientContext.selectedSiteId`, validates it through `can_target_reader_chat_blog()` (which already reads the `reader_chat` option server-side), then `switch_to_blog()`
- `build_guidelines_text()` / `inject_guidelines()` append site guidelines to `$this->instructions`

### What already exists that this design exploits

1. **`agenttic-ui` is tokenized.** `dist/global.css` defines `--color-primary`, `--color-primary-foreground`, `--color-background`, `--color-foreground`, `--color-muted`, `--radius`, `--font-sans`, `--base-font-size`. Coloring the widget is variable injection, not a stylesheet rewrite.
2. **The launcher is already parameterizable.** `AgentUI` accepts `triggerIcon` and `triggerTitle`; `CollapsedView` accepts `icon`. Neither is wired for reader chat.
3. **`ChatHeader` already accepts `title`.** `agent-chat/index.tsx` renders `<ChatHeader onClose options isDocked />` with no title, so the header slot exists and is empty.
4. **`emptyViewHeading` is a supported host override.** `getEmptyViewHeading()` in `agent-chat/index.tsx` reads it first. The greeting field needs storage and a form field only.
5. **The agent is already inside the right blog context.** By the time identity is needed, `switch_to_blog()` has run and been validated.

---

## Design

### 1. Data model and resolution

A single option, `reader_chat_brand`, registered alongside `reader_chat` in `Jetpack_Reader_Chat::register_settings()` and added to the same `jetpack_sync_options_whitelist` entry.

```php
array(
    'name'     => '',  // string, <= 40 chars
    'accent'   => '',  // string, #rrggbb
    'greeting' => '',  // string, <= 120 chars
)
```

Empty string means "not set", which means derive. One resolver — `Jetpack_Reader_Chat::get_brand()` — applies precedence per field:

| Field | Override | Derived | Floor |
| --- | --- | --- | --- |
| name | `reader_chat_brand['name']` | `get_bloginfo( 'name' )` | none — header title stays empty |
| logo | *(no override in v1)* | `get_site_icon_url( 96 )` | `AssistantAvatarIcon` (client-side) |
| accent | `reader_chat_brand['accent']` | theme palette primary | none — agenttic default stands |
| greeting | `reader_chat_brand['greeting']` | existing contextual default | — |

`get_brand()` returns a flat array consumed by `get_reader_chat_config()`:

```php
array(
    'name'              => 'Ada',
    'accent'            => '#2271b1',
    'accentForeground'  => '#ffffff',
    'logoUrl'           => 'https://example.com/wp-content/uploads/…-96x96.png',
    'greeting'          => 'Ask me anything about this blog.',
)
```

Keys resolving to nothing are omitted from the array entirely, so the JS side distinguishes "unset" from "empty string" without a sentinel.

#### Decision: logo is the Site Icon, not the Custom Logo

`get_site_icon_url()` is square by definition and independent of the active theme. The theme's Custom Logo (`get_theme_mod( 'custom_logo' )`) is typically a wide wordmark that renders badly in a round 48px launcher and a 24px message avatar. v1 uses Site Icon only.

#### Decision: no logo override in v1

A media picker would require adding `@wordpress/media-utils` to `projects/packages/search/package.json` and calling `wp_enqueue_media()` on the search dashboard page hook in `src/dashboard/class-dashboard.php`. Deferred. Site owners change the logo by changing their Site Icon.

#### Decision: theme palette derivation reads the theme origin only

`wp_get_global_settings( array( 'color', 'palette' ) )` returns `theme`, `default`, and `custom` arrays. Derivation reads **`theme` and `custom` only**, matching slug `primary` first, then `accent`. WordPress core's `default` palette is deliberately excluded — including it would assign a generic stock color to every classic-theme site that never expressed a preference. When neither slug is present, no accent is derived and agenttic's default stands.

#### Decision: contrast is computed in PHP

Given an accent, compute WCAG relative luminance and select whichever of `#ffffff` / `#000000` yields the higher contrast ratio. Ship it as `accentForeground`.

This selection is provably safe. The worst case is the luminance where contrast against white equals contrast against black: `1.05 / (L + 0.05) = (L + 0.05) / 0.05`, giving `L ≈ 0.179` and a ratio of `≈ 4.58:1`. Max-contrast selection therefore always clears WCAG AA (4.5:1) for any accent a site owner can pick. No accent produces an unreadable send button, and the client receives a value rather than a decision.

#### Sanitization

- `name` — `sanitize_text_field`, newlines and angle brackets stripped, truncated to 40 chars
- `greeting` — `sanitize_text_field`, truncated to 120 chars
- `accent` — `sanitize_hex_color`; anything else resolves to unset

**Sanitize on read as well as on write.** The option is sync-replicated and consumed by a public-facing render path. Write-time validation alone is insufficient — anything that reaches storage by another route would otherwise be echoed into every page of the site.

### 2. Settings UI

Extend `projects/packages/search/src/dashboard/components/reader-chat-control/index.jsx`. Fields render only when `isEnabled` is true, matching the progressive disclosure the existing "Set guidelines" link already uses.

Three controls:

| Control | Component | Placeholder |
| --- | --- | --- |
| Assistant name | `TextControl` | resolved site name |
| Greeting | `TextControl` | current contextual default |
| Accent color | `ColorPalette` seeded from the theme palette, plus a "Reset to theme" action | resolved derived swatch |

**Every field shows its derived value as the placeholder.** This is the mechanism that makes auto-derivation legible: a blank name field displaying the site name in placeholder styling teaches the resolution model without help text.

Derived values reach the dashboard through `projects/packages/search/src/dashboard/class-initial-state.php`, alongside the existing `readerChatGuidelinesUrl`.

Saving extends `projects/packages/search/src/class-rest-controller.php`: `update_settings` accepts `reader_chat_brand`, validated in `validate_search_settings` following the existing per-field pattern, and `get_settings` returns it when `is_reader_chat_setting_registered()` is true. No new endpoint. `manage_options` is already the gate.

#### Decision: text fields save on blur, not on change

`updateJetpackSettings` performs a REST save, a settings re-fetch, and a success notice per call, with no debounce. Every control in this dashboard before now was a toggle, so a discrete-event assumption was baked in and never wrong. Wiring a `TextControl` straight to `updateOptions` would fire all three on every keystroke.

The name and greeting fields therefore hold a local draft and commit `onBlur`, skipping the save when the value is unchanged. A `useEffect` re-seeds the draft when the stored value changes from outside the component (initial fetch, or a save returning server-normalized values).

Relatedly, the text inputs must **not** carry `disabled={ isSaving }`. Because they save on blur, a save is in flight precisely when the user tabs into the next field — disabling would steal focus and drop keystrokes. The toggle and the "Reset to theme" button remain disabled while saving; those are discrete.

### 3. Transport and render

`get_reader_chat_config()` gains a `brand` key, carried by the existing inline script. No new network request on the reader's first paint.

`apps/agents-manager/reader-chat.js` performs three mappings.

**Colors → CSS custom properties.** Emit a `<style>` rule (sibling to `injectScopedReset`) setting `--color-primary` and `--color-primary-foreground` on:

```
.agents-manager-chat,
.agents-manager-sidebar-fab,
.components-popover
```

These are the same selectors the existing reset uses, and they are required — the panel is portalled to `body`, so a rule scoped to `#jetpack-reader-chat` never reaches it.

**Do not set these on `:root`.** `--color-primary` is a common enough custom property name that defining it globally risks redefining it for the host theme.

**Name → header and launcher.** Assign `brand.name` to `window.agentsManagerData.brandName`. In `packages/agents-manager/src/components/agent-chat/index.tsx`, pass it as `ChatHeader`'s `title` and `AgentUI`'s `triggerTitle`, gated on `isReaderChatHost()` so no other surface changes. Add `brandName` and `brandLogoUrl` to `packages/agents-manager/src/global.d.ts`.

**Logo → avatar.** Use `brand.logoUrl` as `triggerIcon` and the assistant message avatar, rendered as an `<img>` with an `onError` handler that swaps to `AssistantAvatarIcon`. A deleted or unreachable site icon must degrade to today's appearance, not a broken-image box on every page of the blog.

**Greeting.** Assign `brand.greeting` to `window.agentsManagerData.emptyViewHeading`, replacing the current `getReaderEmptyViewHeading()` result when set. The existing contextual post/blog default remains the fallback.

#### Deploy skew

The CDN bundle and the PHP deploy ship independently. A cached `reader-chat.min.js` will receive a `brand` key it does not recognize; a freshly deployed bundle will encounter sites that send none. Every read is optional-chained and every mapping no-ops on absence, so both directions degrade to current rendering rather than throwing on a public blog.

### 4. Agent identity

In `wp-content/lib/ai/agents/class.reader-chat-agent.php`, after `maybe_switch_to_blog()` has validated and switched:

1. Read `get_option( 'reader_chat_brand' )` and extract `name`
2. Sanitize: plain text, newlines and angle brackets stripped, truncated to 40 chars
3. Inject an `<assistant-identity>` block through the same `inject_guidelines()` mechanism in `trait.reader-agent.php`, so it lands **under** the existing "site guidelines override everything else" rule rather than competing with it
4. The prompt's opening line becomes "You are {name}, the voice of this blog" when a name resolves, and is unchanged otherwise

#### The name is never read from `clientContext`

The reader-chat agent endpoint is public and unauthenticated. `clientContext` is whatever the reader's browser sends. Sourcing a prompt-bound string from it would let any visitor rename the assistant and prepend arbitrary text to a system prompt. Reading the synced option server-side closes that path, at the cost of one `get_option()` inside a blog context the agent has already switched into.

To be precise about the threat model: a **site owner** can put anything in the name field. That is acceptable and consistent with the existing model — owners already author freeform guidelines text, a considerably larger lever. **Readers** controlling prompt content is the boundary being defended.

#### Sync lag

Because the name travels by option sync, a rename appears in the chat header immediately (Jetpack renders that from local state) but in the bot's self-description only after sync completes. Briefly inconsistent; not broken. Documented, not fixed.

---

## Failure modes

| Failure | Behavior |
| --- | --- |
| `reader_chat_brand` missing or malformed | Resolver returns all-derived values |
| Invalid hex already in storage | Re-sanitized on read; field resolves to unset |
| Site Icon deleted or unreachable | `onError` swaps to `AssistantAvatarIcon` |
| Stale cached CDN bundle | Ignores the `brand` key; renders as today |
| Fresh bundle, un-updated PHP | `brand` absent; all mappings no-op |
| Rename not yet synced to wpcom | Header updates immediately; prompt updates after sync |

Every path resolves to current rendering. Nothing in this feature may produce an error state on a public blog frontend.

---

## Testing

**Jetpack PHP** — `projects/plugins/jetpack/tests/php/extensions/plugins/ai-assistant-plugin/reader-chat/`

- Resolver precedence per field: override wins, then derived, then omitted
- Palette derivation reads theme and custom origins, ignores the core default palette
- Palette derivation matches `primary` before `accent`, and omits accent when neither exists
- Contrast selection, including at the `L ≈ 0.179` boundary where the black/white pick flips
- Malformed option (wrong type, unexpected keys, invalid hex) falls back cleanly
- Sanitization on read, not only on write
- `get_reader_chat_config()` omits `brand` keys that resolve to nothing

**Search package** — REST and dashboard

- `update_settings` validates and persists `reader_chat_brand`
- `get_settings` returns it only when the reader chat setting is registered
- `reader-chat-control` renders fields only when enabled, shows derived values as placeholders, and round-trips a save

**Calypso jest** — `apps/agents-manager/__tests__/`, `packages/agents-manager/src/**/__tests__/`

- Token rule targets `.agents-manager-chat`, `.agents-manager-sidebar-fab`, `.components-popover` — and asserts it does **not** target `:root`
- Logo `onError` falls back to `AssistantAvatarIcon`
- Absent `brand` is a no-op across all three mappings
- `ChatHeader` receives a title only for the reader-chat host

**wpcom** — `bin/tests/isolated/suites/AI/agents/`

- Name is injected into instructions from the option
- **A name supplied via `clientContext` is ignored.** This is the regression guard for the security property above; without it, a future refactor of the context plumbing can silently reopen the path.

---

## Build order

1. **Jetpack** — option, resolver, sanitization, `brand` in the inline config, REST validation, settings UI, tests. Defines the config contract everything else consumes.
2. **Calypso** — token injection, name and logo wiring, `global.d.ts`, tests. Depends on the contract from step 1.
3. **wpcom** — server-side name read and prompt injection, tests. Independent of step 2; can run in parallel with it once step 1 lands.

Steps 2 and 3 are separate repos and separate reviews.

---

## Appendix — Full white-label (not built)

Full white-label means removing every trace of WordPress.com, Jetpack, and "AI" from the reader's experience. Four blockers, two of which are decisions rather than engineering:

1. **The AI disclosure is a legal question.** `complianceDisclosure` in `agent-chat/index.tsx` implements EU AI Act Art. 50(1). It is technically removable — `ZendeskChat` passes `false` — but that exception exists because Zendesk transfers the user to a human. Suppressing it on a surface that remains an AI bot requires Legal sign-off, not a settings toggle.
2. **Network-level attribution.** The bundle loads from `widgets.wp.com` and posts to `public-api.wordpress.com`. Any reader with devtools sees it. Genuine white-label requires a proxy or custom domain — infrastructure work, not a settings field.
3. **Commercial.** Is white-label plan-gated? Which plan? This determines whether a gate needs building at all.
4. **Brand.** Does Automattic want unattributed AI answers shipping under third-party names, and who owns the incident when one misbehaves?

Recommended sequence: answer 1 and 3 first. Item 2 is expensive and worth scoping only if 3 establishes revenue behind it.

**This brand kit does not prejudge that decision.** It adds identity on top of existing chrome and removes no attribution, so nothing here needs unwinding whichever way white-label goes.
