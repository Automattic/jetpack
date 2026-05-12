# Posts to Podcast — wp-admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generate episode from recent posts" section to the wp-admin Podcast Settings tab in `projects/packages/podcast/`, calling the existing `wpcom/v2/posts-to-podcast` proxy endpoint from PR Automattic/jetpack#48523.

**Architecture:** Three new files in a colocated `settings/posts-to-podcast/` folder — `presets.ts`, `use-posts-to-podcast.ts`, `index.tsx`. Hook owns the enqueue + polling state machine with localStorage resume. UI rendered as a Card inside the existing Settings VStack, gated on `podcasting_category_id > 0`. No additional a8c gate — the page-level `jetpack_podcast_untangle` filter handles rollout, the wpcom endpoint enforces `is_automattician()`.

**Tech Stack:** TypeScript, React 18, `@wordpress/components` (SelectControl, Card, Button, Notice), `@wordpress/ui` (Link), `@wordpress/i18n` (`__`), `@wordpress/api-fetch`, `@automattic/jetpack-script-data` (`getSiteData`).

**No JS tests in this PR** — the podcast package has no Jest infrastructure today; setting it up is out of scope. Hook logic is the TypeScript port of the well-tested Calypso version (which has 12 unit tests).

---

## File Structure

**Create:**
- `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/presets.ts` — `WINDOW_PRESETS`, `LENGTH_PRESETS`, `VOICE_PRESETS` constants.
- `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/use-posts-to-podcast.ts` — `usePostsToPodcastJob` hook.
- `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/index.tsx` — `<PostsToPodcastSection>` component.
- `projects/packages/podcast/changelog/add-posts-to-podcast-section` — changelog entry.

**Modify:**
- `projects/packages/podcast/src/dashboard/settings/index.tsx` — import and render `<PostsToPodcastSection>` after the "Feed settings" Card, inside the `draft.podcasting_category_id > 0` branch.

---

## Task 1: Presets module

**Files:**
- Create: `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/presets.ts`

- [ ] **Step 1: Implement presets.ts**

```ts
import { __ } from '@wordpress/i18n';

export interface WindowPreset {
	id: string;
	label: string;
	unit: 'days' | 'months';
	n: number;
}

export interface LabeledPreset {
	id: string;
	label: string;
}

export const WINDOW_PRESETS: WindowPreset[] = [
	{ id: 'last-7-days', label: __( 'Last 7 days', 'jetpack-podcast' ), unit: 'days', n: 7 },
	{ id: 'last-14-days', label: __( 'Last 14 days', 'jetpack-podcast' ), unit: 'days', n: 14 },
	{ id: 'last-30-days', label: __( 'Last 30 days', 'jetpack-podcast' ), unit: 'days', n: 30 },
	{ id: 'last-3-months', label: __( 'Last 3 months', 'jetpack-podcast' ), unit: 'months', n: 3 },
];

export const LENGTH_PRESETS: LabeledPreset[] = [
	{ id: 'short', label: __( 'Short (~3 min)', 'jetpack-podcast' ) },
	{ id: 'medium', label: __( 'Medium (~7 min)', 'jetpack-podcast' ) },
	{ id: 'long', label: __( 'Long (~12 min)', 'jetpack-podcast' ) },
];

export const VOICE_PRESETS: LabeledPreset[] = [
	{ id: 'witty', label: __( 'Witty', 'jetpack-podcast' ) },
	{ id: 'earnest', label: __( 'Earnest', 'jetpack-podcast' ) },
	{ id: 'professional', label: __( 'Professional', 'jetpack-podcast' ) },
];
```

- [ ] **Step 2: Type-check**

Run: `cd projects/packages/podcast && pnpm exec tsgo --noEmit`
Expected: PASS (no new errors).

- [ ] **Step 3: Commit**

```bash
git add projects/packages/podcast/src/dashboard/settings/posts-to-podcast/presets.ts
git commit -m "Posts to Podcast: add preset constants for window/length/voice"
```

---

## Task 2: usePostsToPodcastJob hook

**Files:**
- Create: `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/use-posts-to-podcast.ts`

The hook is a TypeScript port of the Calypso `use-posts-to-podcast.js`. Same state machine, same cadence (3s for the first 30s of real elapsed time, then 10s; lookahead so the next-scheduled poll lands before the switch boundary), same localStorage resume, same 5-min timeout, same cleanup-on-unmount.

The only Jetpack-side adaptations:
- `wpcom.req.post/get` → `apiFetch`.
- `siteId` arg → derive `blogId` from `getSiteData()` inside the hook; the hook takes no arguments.
- TypeScript types for the state and the wire records.

- [ ] **Step 1: Implement use-posts-to-podcast.ts**

```ts
import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useReducer, useRef } from '@wordpress/element';

const POLL_FAST_MS = 3000;
const POLL_SLOW_MS = 10000;
const POLL_SWITCH_MS = 30000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface WindowParam {
	unit: 'days' | 'months';
	n: number;
}

export interface GenerateParams {
	window: WindowParam;
	length: string;
	voicePreset: string;
}

export interface JobResult {
	postId: number;
	editUrl?: string;
}

export interface JobError {
	code: string;
	message: string | null;
}

type JobStatus = 'idle' | 'polling' | 'succeeded' | 'failed';

interface State {
	status: JobStatus;
	jobId: number | null;
	startedAt: number | null;
	result: JobResult | null;
	error: JobError | null;
}

type Action =
	| { type: 'START_POLLING'; jobId: number; startedAt: number }
	| { type: 'SUCCEEDED'; result: JobResult }
	| { type: 'FAILED'; error: JobError }
	| { type: 'RESET' };

interface JobRecord {
	status: 'pending' | 'complete' | 'failed' | 'unknown';
	postId?: number;
	editUrl?: string;
	message?: string;
	errorMessage?: string;
	errorCode?: string;
}

interface StoredJob {
	jobId: number;
	startedAt: number;
}

const storageKey = ( blogId: number ): string => `posts-to-podcast:active-job:${ blogId }`;

const readStored = ( blogId: number ): StoredJob | null => {
	if ( typeof window === 'undefined' ) {
		return null;
	}
	try {
		const raw = window.localStorage.getItem( storageKey( blogId ) );
		if ( ! raw ) {
			return null;
		}
		const parsed = JSON.parse( raw ) as Partial< StoredJob >;
		if ( ! parsed || ! parsed.jobId || typeof parsed.startedAt !== 'number' ) {
			return null;
		}
		return { jobId: parsed.jobId, startedAt: parsed.startedAt };
	} catch {
		return null;
	}
};

const writeStored = ( blogId: number, value: StoredJob ): void => {
	if ( typeof window === 'undefined' ) {
		return;
	}
	try {
		window.localStorage.setItem( storageKey( blogId ), JSON.stringify( value ) );
	} catch {
		// no-op
	}
};

const clearStored = ( blogId: number ): void => {
	if ( typeof window === 'undefined' ) {
		return;
	}
	try {
		window.localStorage.removeItem( storageKey( blogId ) );
	} catch {
		// no-op
	}
};

const initial: State = {
	status: 'idle',
	jobId: null,
	startedAt: null,
	result: null,
	error: null,
};

const reducer = ( state: State, action: Action ): State => {
	switch ( action.type ) {
		case 'START_POLLING':
			return {
				status: 'polling',
				jobId: action.jobId,
				startedAt: action.startedAt,
				result: null,
				error: null,
			};
		case 'SUCCEEDED':
			return { ...state, status: 'succeeded', result: action.result };
		case 'FAILED':
			return { ...state, status: 'failed', error: action.error };
		case 'RESET':
			return initial;
		default:
			return state;
	}
};

export interface UsePostsToPodcastJobReturn {
	status: JobStatus;
	jobId: number | null;
	result: JobResult | null;
	error: JobError | null;
	generate: ( params: GenerateParams ) => Promise< void >;
	reset: () => void;
}

export const usePostsToPodcastJob = (): UsePostsToPodcastJobReturn => {
	const blogId = Number( getSiteData()?.blog_id ?? 0 );

	const [ state, dispatch ] = useReducer( reducer, initial, ( init ): State => {
		if ( ! blogId ) {
			return init;
		}
		const stored = readStored( blogId );
		if ( stored && Date.now() - stored.startedAt < POLL_TIMEOUT_MS ) {
			return {
				...init,
				status: 'polling',
				jobId: stored.jobId,
				startedAt: stored.startedAt,
			};
		}
		if ( stored ) {
			clearStored( blogId );
		}
		return init;
	} );

	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	useEffect( () => {
		if ( state.status !== 'polling' || state.jobId === null || state.startedAt === null ) {
			return undefined;
		}

		let cancelled = false;

		const poll = async (): Promise< void > => {
			if ( cancelled ) {
				return;
			}
			const startedAt = state.startedAt as number;
			const elapsed = Date.now() - startedAt;
			if ( elapsed > POLL_TIMEOUT_MS ) {
				clearStored( blogId );
				dispatch( { type: 'FAILED', error: { code: 'timeout', message: null } } );
				return;
			}
			try {
				const record = await apiFetch< JobRecord >( {
					path: `/wpcom/v2/posts-to-podcast/jobs/${ state.jobId }`,
				} );
				if ( cancelled ) {
					return;
				}
				if ( record.status === 'complete' && record.postId ) {
					clearStored( blogId );
					dispatch( {
						type: 'SUCCEEDED',
						result: { postId: record.postId, editUrl: record.editUrl },
					} );
					return;
				}
				if ( record.status === 'failed' ) {
					clearStored( blogId );
					dispatch( {
						type: 'FAILED',
						error: {
							code: record.errorCode || 'job-failed',
							message: record.message || record.errorMessage || null,
						},
					} );
					return;
				}
				// Ensure the scheduled poll lands before the switch point, not just that now is before it.
				const nextDelay =
					Date.now() - startedAt + POLL_FAST_MS < POLL_SWITCH_MS
						? POLL_FAST_MS
						: POLL_SLOW_MS;
				timerRef.current = setTimeout( poll, nextDelay );
			} catch {
				if ( cancelled ) {
					return;
				}
				clearStored( blogId );
				dispatch( { type: 'FAILED', error: { code: 'poll-failed', message: null } } );
			}
		};

		void poll();

		return () => {
			cancelled = true;
			if ( timerRef.current ) {
				clearTimeout( timerRef.current );
				timerRef.current = null;
			}
		};
	}, [ state.status, state.jobId, state.startedAt, blogId ] );

	const generate = useCallback(
		async ( params: GenerateParams ): Promise< void > => {
			if ( ! blogId ) {
				dispatch( {
					type: 'FAILED',
					error: { code: 'queue-failed', message: null },
				} );
				return;
			}
			try {
				const response = await apiFetch< { jobId?: number } >( {
					path: '/wpcom/v2/posts-to-podcast',
					method: 'POST',
					data: params,
				} );
				if ( ! response?.jobId ) {
					dispatch( {
						type: 'FAILED',
						error: { code: 'queue-failed', message: null },
					} );
					return;
				}
				const startedAt = Date.now();
				writeStored( blogId, { jobId: response.jobId, startedAt } );
				dispatch( { type: 'START_POLLING', jobId: response.jobId, startedAt } );
			} catch {
				dispatch( {
					type: 'FAILED',
					error: { code: 'queue-failed', message: null },
				} );
			}
		},
		[ blogId ]
	);

	const reset = useCallback( (): void => {
		if ( blogId ) {
			clearStored( blogId );
		}
		dispatch( { type: 'RESET' } );
	}, [ blogId ] );

	return {
		status: state.status,
		jobId: state.jobId,
		result: state.result,
		error: state.error,
		generate,
		reset,
	};
};
```

- [ ] **Step 2: Type-check**

Run: `cd projects/packages/podcast && pnpm exec tsgo --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add projects/packages/podcast/src/dashboard/settings/posts-to-podcast/use-posts-to-podcast.ts
git commit -m "Posts to Podcast: add hook with enqueue/poll/localStorage resume"
```

---

## Task 3: PostsToPodcastSection component

**Files:**
- Create: `projects/packages/podcast/src/dashboard/settings/posts-to-podcast/index.tsx`

The component renders the Card with the three SelectControls + Generate button + status notice. Uses `@wordpress/components` everywhere, `Link` from `@wordpress/ui` for the success-state link (consistent with the existing Settings tab's "Create a new category" link).

- [ ] **Step 1: Implement index.tsx**

```tsx
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { Button, Card, CardBody, CardHeader, Notice, SelectControl } from '@wordpress/components';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __experimentalText as Text, __experimentalVStack as VStack } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { LENGTH_PRESETS, VOICE_PRESETS, WINDOW_PRESETS } from './presets';
import { usePostsToPodcastJob } from './use-posts-to-podcast';

const editPostUrl = ( postId: number ): string =>
	`${ getAdminUrl( 'post.php' ) }?action=edit&post=${ postId }`;

const PostsToPodcastSection = (): JSX.Element => {
	const [ windowId, setWindowId ] = useState( WINDOW_PRESETS[ 0 ].id );
	const [ lengthId, setLengthId ] = useState( 'medium' );
	const [ voiceId, setVoiceId ] = useState( VOICE_PRESETS[ 0 ].id );

	const { status, result, error, generate, reset } = usePostsToPodcastJob();

	const isPolling = status === 'polling';

	const onGenerate = (): void => {
		const preset = WINDOW_PRESETS.find( p => p.id === windowId );
		if ( ! preset ) {
			return;
		}
		void generate( {
			window: { unit: preset.unit, n: preset.n },
			length: lengthId,
			voicePreset: voiceId,
		} );
	};

	return (
		<Card>
			<CardHeader>
				<h2 className="podcast__section-heading">
					{ __( 'Generate episode from recent posts', 'jetpack-podcast' ) }
				</h2>
			</CardHeader>
			<CardBody>
				<VStack spacing={ 4 }>
					<Text variant="muted">
						{ __(
							"Generate a podcast-style episode draft from your site's recent activity. Pick a window, a length, and a voice; the result lands as a draft you can edit and publish.",
							'jetpack-podcast'
						) }
					</Text>

					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Window', 'jetpack-podcast' ) }
						value={ windowId }
						onChange={ setWindowId }
						disabled={ isPolling }
						options={ WINDOW_PRESETS.map( p => ( { label: p.label, value: p.id } ) ) }
						help={ __( 'Which posts to draw from.', 'jetpack-podcast' ) }
					/>

					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Length', 'jetpack-podcast' ) }
						value={ lengthId }
						onChange={ setLengthId }
						disabled={ isPolling }
						options={ LENGTH_PRESETS.map( p => ( { label: p.label, value: p.id } ) ) }
					/>

					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Voice', 'jetpack-podcast' ) }
						value={ voiceId }
						onChange={ setVoiceId }
						disabled={ isPolling }
						options={ VOICE_PRESETS.map( p => ( { label: p.label, value: p.id } ) ) }
					/>

					<div>
						<Button variant="primary" onClick={ onGenerate } disabled={ isPolling }>
							{ isPolling
								? __( 'Generating…', 'jetpack-podcast' )
								: __( 'Generate', 'jetpack-podcast' ) }
						</Button>
					</div>

					{ status === 'polling' && (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Generating episode script — this usually takes 2–3 minutes. You can leave this page and come back.',
								'jetpack-podcast'
							) }
						</Notice>
					) }

					{ status === 'succeeded' && result?.postId && (
						<Notice status="success" onRemove={ reset }>
							{ __( 'Draft created.', 'jetpack-podcast' ) }{ ' ' }
							<Link href={ editPostUrl( result.postId ) }>
								{ __( 'Open draft', 'jetpack-podcast' ) }
							</Link>
						</Notice>
					) }

					{ status === 'failed' && (
						<Notice status="error" onRemove={ reset }>
							{ error?.message ||
								__( 'Generation failed. Please try again.', 'jetpack-podcast' ) }
						</Notice>
					) }
				</VStack>
			</CardBody>
		</Card>
	);
};

export default PostsToPodcastSection;
```

Notes:
- `Link` is imported from `@wordpress/ui` (matches the Settings tab's existing import on line 22 of `settings/index.tsx`).
- The `JSX.Element` return type is the package's convention (verify against neighboring files; if the package prefers explicit `React.ReactElement` or omits return types, match that — but `JSX.Element` is the most common in `@wordpress/element` projects).
- Default export is consistent with `SettingsTab`, `EpisodesTab`, etc.

- [ ] **Step 2: Type-check**

Run: `cd projects/packages/podcast && pnpm exec tsgo --noEmit`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `cd projects/packages/podcast && pnpm exec eslint src/dashboard/settings/posts-to-podcast/`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add projects/packages/podcast/src/dashboard/settings/posts-to-podcast/index.tsx
git commit -m "Posts to Podcast: render Generate section inside the Settings tab"
```

---

## Task 4: Wire into Settings tab

**Files:**
- Modify: `projects/packages/podcast/src/dashboard/settings/index.tsx`

Render the new section inside the existing Settings tab `<VStack>`. Insert it after the "Feed settings" Card (which ends around line 361 in the current file) and **before** the conditional "Disable podcasting" Card (which starts at `{ draft.podcasting_category_id > 0 && (` around line 363).

The placement intent: this section is podcast-content tooling, so it sits with the configuration cards above "Disable podcasting" (which is destructive housekeeping). Like "Disable podcasting", this section is conditional on the same `draft.podcasting_category_id > 0` check — there's nothing to generate from if podcasting isn't enabled.

- [ ] **Step 1: Read the current file**

Read `projects/packages/podcast/src/dashboard/settings/index.tsx` so you can place the import and JSX accurately.

- [ ] **Step 2: Add the import**

Near the other local imports (e.g., right after `import CoverImageControl from './cover-image-control';`), add:

```tsx
import PostsToPodcastSection from './posts-to-podcast';
```

Match the existing import order in the file. Local relative imports are grouped at the bottom.

- [ ] **Step 3: Add the JSX**

Locate the block that begins:

```tsx
{ draft.podcasting_category_id > 0 && (
    <Card>
        <CardHeader>
            <h2 className="podcast__section-heading">
                { __( 'Disable podcasting', 'jetpack-podcast' ) }
            </h2>
        </CardHeader>
```

Immediately **before** that `{ draft.podcasting_category_id > 0 && (` block, insert:

```tsx
{ draft.podcasting_category_id > 0 && <PostsToPodcastSection /> }
```

`PostsToPodcastSection` takes no props.

- [ ] **Step 4: Type-check and lint**

```bash
cd projects/packages/podcast && pnpm exec tsgo --noEmit
cd projects/packages/podcast && pnpm exec eslint src/dashboard/settings/
```

Expected: PASS for both.

- [ ] **Step 5: Commit**

```bash
git add projects/packages/podcast/src/dashboard/settings/index.tsx
git commit -m "Posts to Podcast: mount section in the Podcast Settings tab"
```

---

## Task 5: Changelog entry

**Files:**
- Create: `projects/packages/podcast/changelog/add-posts-to-podcast-section`

Match the format of existing changelog entries in the same folder (e.g., `add-podcast-settings`, `add-admin-tabs-scaffold`).

- [ ] **Step 1: Write the changelog file**

```
Significance: minor
Type: added

Settings: add a "Generate episode from recent posts" section that calls the wpcom/v2/posts-to-podcast proxy, polls the job, and links to the resulting draft. Gated behind the jetpack_podcast_untangle filter via the page-level gate; the wpcom endpoint enforces is_automattician() server-side.
```

- [ ] **Step 2: Commit**

```bash
git add projects/packages/podcast/changelog/add-posts-to-podcast-section
git commit -m "Posts to Podcast: add changelog entry"
```

---

## Task 6: Build and manual verification

**No automated tests in this PR.** The package has no Jest setup; that's tracked as a separate follow-up. Manual verification is required before requesting review.

- [ ] **Step 1: Build the package's wp-build artifact**

```bash
cd projects/packages/podcast && pnpm build
```

Expected: completes without errors. The artifact lives in `build/`. If the build pipeline complains about missing `react` peers, run `jetpack install -r packages/podcast` first.

- [ ] **Step 2: Type-check the whole package**

```bash
cd projects/packages/podcast && pnpm exec tsgo --noEmit
```

Expected: PASS.

- [ ] **Step 3: Lint the whole package**

```bash
cd projects/packages/podcast && pnpm exec eslint src/
```

Expected: PASS.

- [ ] **Step 4: Manual smoke test**

On a Simple or Atomic site running the Jetpack plugin with the `jetpack_podcast_untangle` filter enabled and PR #48523's proxy endpoint available:

1. Navigate to `wp-admin/admin.php?page=jetpack-podcast`.
2. Enable podcasting on the Settings tab (pick a category).
3. Confirm the "Generate episode from recent posts" Card appears after "Feed settings" and before "Disable podcasting".
4. Pick `Last 7 days` / `Medium (~7 min)` / `Witty`. Click **Generate**.
5. Confirm the Button switches to "Generating…", selects disable, and the info Notice appears.
6. Confirm `localStorage` has `posts-to-podcast:active-job:<blogId>` with `{ jobId, startedAt }`.
7. Switch to the Episodes tab and back to Settings. The "Generating…" state should resume (no second POST).
8. Wait for completion (~2–3 min). Confirm the success Notice appears with an "Open draft" link to `post.php?action=edit&post=<id>`.
9. Trigger the error path: in DevTools → Network, block `**/posts-to-podcast` once and click Generate. Confirm the error Notice appears and Generate re-enables.

- [ ] **Step 5: Open the PR**

Follow Jetpack's PR conventions. Reference PR #48523 in the description (this PR depends on its proxy endpoint). Mark as Draft initially.

---

## Self-Review Notes

- **Spec coverage:** Section 1 (placement/gating) → Task 4. Section 2 (component structure) → Tasks 1–3. Section 3 (API/data flow) → Task 2 (apiFetch calls inside the hook). Section 4 (localStorage persistence) → Task 2 (read/write/clear/expire). Section 5 (UI) → Task 3 (Card/SelectControl/Notice/Link layout, copy verbatim). Section "Testing" → explicitly skipped in this plan per user decision; tracked as out-of-scope follow-up.
- **Placeholder scan:** None. Every code step has runnable code. Every command has expected output.
- **Type consistency:** Hook returns `{ status, jobId, result, error, generate, reset }`. `JobResult = { postId, editUrl? }`. `JobError = { code, message }`. Used consistently across Tasks 2, 3, and the spec.
- **Notice API:** Uses `status="info|success|error"`, `onRemove`, `isDismissible` per `@wordpress/components` — not Calypso's `is-info`/`onDismissClick`/`showDismiss`. Verified against the existing `Notice` usage in `settings/index.tsx:218–227`.
- **`getAdminUrl` vs `ADMIN_URL`:** Task 3 uses `getAdminUrl('post.php')` from `@automattic/jetpack-script-data` for the edit link, consistent with the Settings tab's existing `getAdminUrl('edit-tags.php?taxonomy=category')` import. The Episodes tab uses a hand-built `${ ADMIN_URL }post.php?action=edit&post=...` pattern; both work, but `getAdminUrl` is the more idiomatic helper.
