# Akismet Experimental UI — branch notes

- **Plugin name:** Akismet Experimental UI
- **Path in this worktree:** `akismet-experimental-plugin/`
- **Production target path:** `wpcom/wp-content/mu-plugins/akismet-3.0/` (file copy / sync on approval)
- **Branch:** `claude/akismet-experimental-ui-exploration` (this worktree's branch — local only, never pushed; the public-facing snapshot lives at `claude/akismet-experimental-plugin-foundation`)
- **Purpose:** Internal R&D — prototype the unified-threat dashboard articulated in [../akismet-modernization/strategy.md](../akismet-modernization/strategy.md). Not shipped to wp.org.

## Activation

```php
// wp-config.php — preview mode (read-only)
define( 'AKISMET_EXPERIMENTAL_UI', true );

// To exercise mutating actions (off by default — see GUARDRAILS.md):
// define( 'AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS', true );

// To exercise live Blackbox API calls (off by default — see GUARDRAILS.md):
// define( 'AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API', true );
```

## Sync to wpcom (later, after approval)

When the prototype is reviewed and the owner gives a "sync to wpcom" go-ahead:

```bash
# From the wpcom checkout:
cp -R /path/to/akismet-experimental-plugin/* wp-content/mu-plugins/akismet-3.0/
# Ensure the experimental class isn't double-loaded with the prod plugin.
```

Until then this is a **portable plugin** in the jetpack-monorepo worktree, mounted into a Studio sandbox via symlink.

## Guardrails

See [../akismet-modernization/GUARDRAILS.md](../akismet-modernization/GUARDRAILS.md). Briefly:

- All three constants default OFF.
- Real Blackbox API calls gated; mocks otherwise.
- Comment mutations gated; UX-disabled otherwise.
- Bearer key never reaches the browser; tripwire test asserts.
- Nothing publishes to P2/Linear/Slack without explicit owner approval.

## Owners

- **Devin Walker** (devin.walker@a8c.com) — exploration owner
- Akismet eng team review later (`cfinke`, `bluefuton`, `derekspringer`, `andyperdomo`)
