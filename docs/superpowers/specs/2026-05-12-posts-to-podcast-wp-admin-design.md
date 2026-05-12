# Posts to Podcast — wp-admin Podcast Page (Design)

## Context

Two parallel pieces of work converge here:

1. **PR [Automattic/jetpack#48523](https://github.com/Automattic/jetpack/pull/48523)** adds a Phase A "Posts to Podcast" admin page to the Jetpack plugin (vanilla `wp-admin` form) and a wpcom/v2 proxy endpoint that forwards to `/sites/<id>/posts-to-podcast` on `public-api.wordpress.com`.
2. The **`projects/packages/podcast/` package** is the new wp-admin Podcast experience gated by the `jetpack_podcast_untangle` filter. It hosts a React SPA with four tabs (Settings, Episodes, Distribution, Stats).

This spec replaces PR #48523's standalone admin page with a section inside the new package's Settings tab. The proxy endpoint from #48523 is the API surface this UI talks to; only the front-end changes.

## Placement and gating

A new `<Card>` rendered from `projects/packages/podcast/src/dashboard/settings/index.tsx`, inserted into the existing `<VStack>` after the "Feed settings" Card and before the conditional "Disable podcasting" Card. The section is gated on `draft.podcasting_category_id > 0` (matches the surrounding "Disable podcasting" gate and the Calypso version's `isPodcastingEnabled` check).

No additional client-side a8c check. The page-level `jetpack_podcast_untangle` filter is the rollout gate; the wpcom endpoint enforces `is_automattician()` server-side. A non-a8c user with `manage_options` on an untangled site would receive a 401 on Generate and see the failure Notice — the same code path as any other error.

## Component structure

New folder `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/`:

- `index.tsx` — `<PostsToPodcastSection>` (no props; reads `getSiteData()` for the edit-post URL).
- `use-posts-to-podcast.ts` — hook owning the state machine (`idle | polling | succeeded | failed`), `localStorage` resume, polling cadence (3s for the first 30s of real elapsed time, then 10s), and a 5-minute total timeout.
- `presets.ts` — `WINDOW_PRESETS`, `LENGTH_PRESETS`, `VOICE_PRESETS`. Labels translated via `__('...', 'jetpack-podcast')` at module load (free-function `__` from `@wordpress/i18n` — different from Calypso's translate-as-arg).
- `style.scss` — likely empty or absent; parent `<VStack spacing={ 5 }>` supplies vertical rhythm.

Tests live under the package's existing `tests/` root (verify layout during implementation; mirror it).

The hook returns `{ status, jobId, result, error, generate, reset }` — same shape as the Calypso hook.

## API client and data flow

Requests go through `@wordpress/api-fetch` against the Jetpack-local proxy from PR #48523:

```ts
import apiFetch from '@wordpress/api-fetch';

// Enqueue
const { jobId } = await apiFetch<{ jobId: number }>( {
    path: '/wpcom/v2/posts-to-podcast',
    method: 'POST',
    data: { window, length, voicePreset },
} );

// Poll
const record = await apiFetch<JobRecord>( {
    path: `/wpcom/v2/posts-to-podcast/jobs/${ jobId }`,
} );
// JobRecord: { status: 'pending' | 'complete' | 'failed' | 'unknown'; postId?: number; editUrl?: string; message?: string; errorMessage?: string; errorCode?: string }
```

`apiFetch` already handles the nonce + REST URL plumbing the rest of the package uses (see `hooks/use-podcast-settings.ts`).

No React Query factory — the hand-rolled timer loop matches the Calypso implementation for the same reason: custom cadence, internal surface, not worth a query abstraction for one consumer.

## Persisting in-progress jobs

Jobs take 2–3 minutes; users navigate between tabs (and across the wp-admin) during that time. Active jobs persist to `localStorage` keyed by site:

- **Key:** `posts-to-podcast:active-job:<blogId>` — `blogId` from `getSiteData()?.blog_id`.
- **Value:** `{ jobId, startedAt }` (ms since epoch).
- **On generate success:** write the entry, transition to `polling`.
- **On `<PostsToPodcastSection>` mount:** read the entry. If present and `Date.now() - startedAt < 5 min`, transition straight into `polling`. If expired, clear and stay `idle`.
- **On terminal state or runtime timeout:** clear the entry.
- **SSR/JSDOM safety:** guard `typeof window !== 'undefined'` before touching `localStorage`.

The PR #48523 endpoint only exposes `POST /posts-to-podcast` and `GET /posts-to-podcast/jobs/{id}`; there's no "list active jobs" endpoint, so resume is client-side only. Same trade-off as the Calypso version.

## UI

Wrapping `<Card>` + `<CardHeader>` (h2.podcast__section-heading) + `<CardBody>` — matches the surrounding Cards in `settings/index.tsx`.

- Header: `__( 'Generate episode from recent posts', 'jetpack-podcast' )`.
- Intro `<Text variant="muted">` line explaining the feature.
- `<VStack spacing={ 4 }>` body with three `<SelectControl __next40pxDefaultSize __nextHasNoMarginBottom>` controls (Window / Length / Voice), populated from the presets. Defaults: Window = `last-7-days`, Length = `medium`, Voice = `witty`. All disabled while `status === 'polling'`.
- `<Button variant="primary" disabled={ isPolling }>` toggling between `Generate` and `Generating…`.
- Status region below the button:
  - `polling` → `<Notice status="info" isDismissible={ false }>` with the 2–3-minute messaging.
  - `succeeded` → `<Notice status="success" onRemove={ reset }>` "Draft created." plus a `<Link href={ editPostUrl(result.postId) }>{ __('Open draft') }</Link>` using the `@wordpress/ui` `Link` already imported by `settings/index.tsx`. `editPostUrl(postId)` returns `${ ADMIN_URL }post.php?action=edit&post=${ postId }` — reuse the helper from the Episodes tab if it's already shared; otherwise lift to a shared util.
  - `failed` → `<Notice status="error" onRemove={ reset }>` with `error?.message` or the generic fallback.

Note: `@wordpress/components` Notice differs from Calypso's `Notice`. `status` values are `info|success|warning|error` (no `is-` prefix); dismissal is `onRemove`/`isDismissible`, not `onDismissClick`/`showDismiss`.

## Testing

- **`use-posts-to-podcast.test.ts`** — Hook tests with `renderHook` and `jest.useFakeTimers()`. Mock `@wordpress/api-fetch` and `getSiteData` from `@automattic/jetpack-script-data`. Coverage parity with the Calypso hook: initial idle, enqueue + persist, polling complete, cadence switch at 30s, enqueue rejection, terminal `failed`, poll rejection (with storage clear), missing-jobId, resume from `localStorage` (fresh + expired), runtime 5-min timeout, unmount cleanup.
- **`index.test.tsx`** — Component tests with `@testing-library/react` + `@testing-library/user-event`. Mock `apiFetch` and `getSiteData`. Cases: renders the form; happy-path generate → polling Notice → success Notice with `post.php?action=edit&post=<id>` link; error path → error Notice and Generate re-enabled.

## Out of scope

- Real Jetpack AI entitlement / credit checks (Phase C on the Jetpack side).
- Removing or shrinking PR #48523's proxy endpoint — the proxy is still needed (it's what this UI calls). Only PR #48523's standalone admin page (`class-jetpack-posts-to-podcast-page.php`) becomes redundant once this lands; deletion of that file is a follow-up coordinated with the #48523 author.
- A "list active jobs" server-side endpoint for cross-device resumption.
- Surfacing this in any tab other than Settings.
