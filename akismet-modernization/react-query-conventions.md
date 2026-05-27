# React Query conventions — Akismet UI exploration

**Status:** Canonical. Every hook in this prototype follows the rules below. Diverge only with a one-line reason comment.

**Sources:**
- Scan: `projects/packages/scan/src/js/data/query-options.ts` — the cleanest in-tree exemplar.
- VideoPress: `projects/packages/videopress/src/dashboard/{hooks,test-utils}/` — most thorough query + mutation + test patterns.
- My Jetpack: `projects/packages/my-jetpack/_inc/data/` — `WP_Error` typing + wrapper hooks.
- Newsletter: `projects/packages/newsletter/_inc/subscribers/data/` — pagination via `placeholderData`.
- TkDodo: [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys), [Error Handling](https://tkdodo.eu/blog/react-query-error-handling).
- TanStack v5 docs: [Query Keys](https://tanstack.com/query/v5/docs/react/guides/query-keys), [Mutations](https://tanstack.com/query/v5/docs/react/guides/mutations), [Invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation).
- WordPress: [`@wordpress/api-fetch`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-api-fetch/) — nonce middleware.

---

## 1. QueryClient defaults

Match the in-tree exemplars (Scan + VideoPress) exactly. The current Plan 0 code uses `retry: 2`; **back-fix to `retry: 1`** before Plan 1 starts.

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			queries: {
				staleTime: 30_000,           // 30s — matches Scan + VideoPress
				gcTime: 5 * 60_000,          // 5 min
				retry: 1,                    // matches Scan + VideoPress; was 2 in Plan 0 — back-fix
				refetchOnWindowFocus: false, // admin UI; refocus refetch is noise
			},
			mutations: {
				// Mutations are explicit user actions; never retry silently.
				retry: false,
			},
		},
	} );
}
```

For tests, a separate factory: `retry: false`, `gcTime: 0`, `staleTime: 0`. See §11.

## 2. Provider order in `<App>`

Mirror My Jetpack: `<SlotFillProvider>` → `<QueryClientProvider>` → page content. Notice context (if added later) wraps the page tree but stays *inside* `QueryClientProvider` so error toasts can read query state.

```tsx
<SlotFillProvider>
	<QueryClientProvider client={ queryClient }>
		{/* future: <NoticeContext.Provider> */}
		<Page>{ /* tabs */ }</Page>
		{ isJetpackActive() && <JetpackFooter /> }
		{/* dev-only DevTools — §12 */}
	</QueryClientProvider>
</SlotFillProvider>
```

## 3. File layout

```
src/
├── data/
│   ├── query-keys.ts      ← single source of truth for query keys (§4)
│   ├── queries.ts         ← `queryOptions()` factories (§5)
│   └── mutations.ts       ← shared mutation builders (§6)
├── hooks/
│   ├── use-api-key.ts     ← one file per query-or-mutation pair (§7)
│   ├── use-akismet-config.ts
│   └── …
└── lib/
	├── api-client.ts      ← typed apiFetch wrapper + WpError type (§8)
	└── query-client.ts    ← createQueryClient() (§1)
```

**Why this layout:** matches VideoPress/Newsletter precedent (data + hooks separate). Keeps query keys grep-able in one place — mass-renaming a namespace shouldn't require touching every hook.

## 4. Query keys — hierarchical factory

**Single namespace per surface, hierarchy generic→specific.** Keys live in `src/data/query-keys.ts`. Hand-rolled — `@lukemorales/query-key-factory` is not in the monorepo and isn't worth adding for this scope.

```ts
// src/data/query-keys.ts
import type { StatsInterval } from '@/hooks/use-stats-totals';
import type { ActivityCategory, ActivityOutcome, ActivitySource } from '@/routes/activity/activity-types';

export const akismetKeys = {
	all: [ 'akismet' ] as const,

	// Plan 1
	key: () => [ ...akismetKeys.all, 'key' ] as const,
	settings: () => [ ...akismetKeys.all, 'settings' ] as const,
	jetpackKey: () => [ ...akismetKeys.all, 'jetpack-key' ] as const,

	// Plan 2
	stats: {
		all: () => [ ...akismetKeys.all, 'stats' ] as const,
		totals: ( interval: StatsInterval ) =>
			[ ...akismetKeys.stats.all(), 'totals', interval ] as const,
		timeseries: ( interval: StatsInterval ) =>
			[ ...akismetKeys.stats.all(), 'timeseries', interval ] as const,
	},
	category: {
		all: () => [ ...akismetKeys.all, 'category' ] as const,
		summary: ( cat: string, interval: StatsInterval ) =>
			[ ...akismetKeys.category.all(), 'summary', cat, interval ] as const,
	},
	blackbox: {
		all: () => [ ...akismetKeys.all, 'blackbox' ] as const,
		aggregates: ( cat: string, interval: StatsInterval ) =>
			[ ...akismetKeys.blackbox.all(), 'aggregates', cat, interval ] as const,
		verdict: ( sessionId: string ) =>
			[ ...akismetKeys.blackbox.all(), 'verdict', sessionId ] as const,
	},
	woocommerce: {
		all: () => [ ...akismetKeys.all, 'woocommerce' ] as const,
		fraudSummary: ( interval: StatsInterval ) =>
			[ ...akismetKeys.woocommerce.all(), 'fraud-summary', interval ] as const,
	},

	// Plan 3
	activity: {
		all: () => [ ...akismetKeys.all, 'activity' ] as const,
		list: ( params: {
			page: number;
			perPage: number;
			category: ActivityCategory | 'all';
			outcome: ActivityOutcome | 'all';
			source: ActivitySource | 'all';
			search: string;
		} ) => [ ...akismetKeys.activity.all(), 'list', params ] as const,
	},
};
```

### Invalidation by prefix

Any node in the tree invalidates everything beneath it:

```ts
// invalidate ALL akismet data
queryClient.invalidateQueries( { queryKey: akismetKeys.all } );

// invalidate every stats query (all intervals, both totals + timeseries)
queryClient.invalidateQueries( { queryKey: akismetKeys.stats.all() } );

// invalidate one specific row
queryClient.invalidateQueries( { queryKey: akismetKeys.stats.totals( '30-days' ) } );
```

This is **why** the hierarchy matters. Bulk invalidation after a Save without re-fetching unrelated data.

## 5. Query definitions — `queryOptions()` factories

Use TanStack v5's `queryOptions()` helper. Returns a typed options bag that's both spreadable into `useQuery` AND directly usable for `invalidateQueries`. Matches Scan's pattern.

```ts
// src/data/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { akismetKeys } from '@/data/query-keys';
import type { ApiKeyState, AkismetSettings } from '@/lib/types';

export const apiKeyQuery = () =>
	queryOptions( {
		queryKey: akismetKeys.key(),
		queryFn: () => apiClient.get< ApiKeyState >( 'key' ),
	} );

export const akismetSettingsQuery = () =>
	queryOptions( {
		queryKey: akismetKeys.settings(),
		queryFn: () => apiClient.get< AkismetSettings >( 'settings' ),
	} );
```

Hook wrapper is a one-liner:

```ts
// src/hooks/use-api-key.ts
import { useQuery } from '@tanstack/react-query';
import { apiKeyQuery } from '@/data/queries';

export function useApiKey() {
	return useQuery( apiKeyQuery() );
}
```

**Why factories are functions, not constants:** if a query later needs runtime params (e.g., `apiKeyQuery( { freshOnly: true } )`), it's a non-breaking change. Don't bake constants into the API.

## 6. Mutations

### Naming

- **Queries:** noun-based, no `Mutation` suffix. `useApiKey`, `useStatsTotals`, `useActivity`.
- **Mutations:** verb-prefixed. `useConnectApiKey`, `useDisconnectApiKey`, `useUpdateAkismetConfig`, `useMarkAsHam`, `useDeletePermanently`.
- **Query + mutation pairs in one file** when they share a resource (e.g., `useAkismetConfig` returns `{ config, update }`).

### Two patterns — pick by data shape

**Pattern A — `setQueryData` (preferred when response IS the new state).** Settings save returns the new settings; key entry returns the new key. Skip the refetch round-trip.

```ts
const update = useMutation( {
	mutationFn: ( patch: Partial< AkismetSettings > ) =>
		apiClient.put< AkismetSettings >( 'settings', patch ),
	onSuccess: ( data ) => {
		queryClient.setQueryData( akismetKeys.settings(), data );
	},
} );
```

**Pattern B — `invalidateQueries` (preferred when response is unrelated or partial).** Comment moderation: response is `{ id, status }`, but the spam-log query returns rows we need to refetch.

```ts
const markAsHam = useMutation( {
	mutationFn: ( ids: number[] ) =>
		Promise.all( ids.map( id =>
			apiFetch( { path: `/wp/v2/comments/${ id }`, method: 'POST', data: { status: 'approve' } } )
		) ),
	onSuccess: () => {
		queryClient.invalidateQueries( { queryKey: akismetKeys.activity.all() } );
	},
} );
```

### Optimistic updates — opt-in, not default

Apply only when:
1. The mutation is fast-feedback (toggle a setting, mark one row).
2. The rollback story is clear (snapshot pre-mutation + restore on error).
3. The shape of the optimistic value is *certain* (a server transform would invalidate the optimism).

VideoPress's `use-settings.ts:69-84` is the canonical full-form-with-rollback:

```ts
const update = useMutation( {
	mutationFn: ( patch ) => apiClient.put( 'settings', patch ),
	onMutate: async ( patch ) => {
		await queryClient.cancelQueries( { queryKey: akismetKeys.settings() } );
		const previous = queryClient.getQueryData( akismetKeys.settings() );
		queryClient.setQueryData( akismetKeys.settings(), prev => ( { ...prev, ...patch } ) );
		return { previous };
	},
	onError: ( _err, _patch, ctx ) => {
		if ( ctx?.previous ) {
			queryClient.setQueryData( akismetKeys.settings(), ctx.previous );
		}
	},
	onSettled: () => {
		queryClient.invalidateQueries( { queryKey: akismetKeys.settings() } );
	},
} );
```

Don't bother for slow mutations (e.g., "Connect with Jetpack" — the API key fetch from WPCOM takes seconds; spinner is honest).

## 7. Pagination — `placeholderData: keepPreviousData`

The Newsletter + VideoPress library pattern: keep the prior page visible while the next one loads. Set on the `queryOptions()`:

```ts
import { keepPreviousData } from '@tanstack/react-query';

export const activityListQuery = ( params: ActivityQueryParams ) =>
	queryOptions( {
		queryKey: akismetKeys.activity.list( params ),
		queryFn: () => apiClient.get< ActivityResponse >( `activity?${ toQS( params ) }` ),
		placeholderData: keepPreviousData,
	} );
```

## 8. WordPress error envelope — `WpError` type

WP REST returns errors as `{ code, message, data: { status } }`. Define once, use everywhere. Plan 0's `api-client.ts` does NOT type errors today — back-fix.

```ts
// src/lib/api-client.ts
export type WpError = {
	code: string;          // e.g., 'rest_cookie_invalid_nonce', 'akismet_invalid_key'
	message: string;
	data?: {
		status?: number;   // HTTP status the server wanted to return
		[ key: string ]: unknown;
	};
};
```

Type queries explicitly: `useQuery< TData, WpError >`. Components can branch on `query.error?.code` for actionable error display.

`@wordpress/api-fetch` throws these envelopes natively when the server returns 4xx/5xx with the WP error JSON shape, so no manual mapping in `apiClient` is needed.

## 9. Nonce middleware — wire on app boot

**Plan 0 is missing this.** `apiFetch` needs the WP REST nonce, otherwise mutations 403. Back-fix in `src/index.tsx`:

```ts
// src/index.tsx
import apiFetch from '@wordpress/api-fetch';
import { createRoot } from '@wordpress/element';
import { App } from '@/app';
import { readGlobal } from '@/lib/is-jetpack-active';

const nonce = readGlobal().apiNonce;
const apiRoot = readGlobal().apiRoot;

if ( nonce ) {
	apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );
}
if ( apiRoot ) {
	apiFetch.use( apiFetch.createRootURLMiddleware( apiRoot ) );
}

const root = document.getElementById( 'akismet-experimental-app' );
if ( root ) {
	createRoot( root ).render( <App /> );
}
```

`createNonceMiddleware` also auto-refreshes the nonce when the server's response includes an updated one in the `X-WP-Nonce` header — no manual rotation needed.

## 10. Retry policy + error routing

Defaults from §1 (`queries.retry: 1`, `mutations.retry: false`) handle the common case. Two refinements:

### Retry predicate — never retry 4xx

```ts
queries: {
	retry: ( failureCount, error ) => {
		const status = ( error as WpError ).data?.status;
		if ( status && status >= 400 && status < 500 ) {
			return false;            // 4xx: don't retry; client-side bug or auth issue
		}
		return failureCount < 1;     // 5xx / network: one retry, then give up
	},
},
```

### Global error toast — deferred to Plan 1

A `MutationCache`-level `onError` callback can drive a `wp.data.dispatch('core/notices').createNotice('error', …)` toast once per mutation (not once per observer). **Add when Plan 1's Settings tab lands** — the first time a save can fail visibly.

```ts
import { MutationCache, QueryClient } from '@tanstack/react-query';
import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

const queryClient = new QueryClient( {
	mutationCache: new MutationCache( {
		onError: ( error ) => {
			const message = ( error as WpError ).message ?? __( 'Something went wrong.', 'akismet' );
			void dispatch( noticesStore ).createNotice( 'error', message, {
				type: 'snackbar',
				isDismissible: true,
			} );
		},
	} ),
	defaultOptions: { /* … */ },
} );
```

Per-mutation `onError` callbacks still fire and can override (e.g., display inline form errors instead of a toast).

### `throwOnError` — only for catastrophic 5xx

Per tkdodo, route only `status >= 500` to an Error Boundary; let 4xx surface as `query.error` for in-component handling.

```ts
queries: {
	throwOnError: ( error ) => ( ( error as WpError ).data?.status ?? 0 ) >= 500,
},
```

Add this when (and if) the prototype gets an `<ErrorBoundary>` shell — not in Plan 0.

## 11. Testing

### Shared helper

Plan 0's tests inline a `QueryClient` constructor in each file. Consolidate at `tests/js/test-utils.tsx`:

```tsx
// tests/js/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

export function createTestQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
			},
			mutations: { retry: false },
		},
	} );
}

export function renderWithClient( ui: ReactElement, options?: RenderOptions ) {
	const client = createTestQueryClient();
	return {
		client,
		...render(
			<QueryClientProvider client={ client }>{ ui }</QueryClientProvider>,
			options
		),
	};
}
```

Each test that needs the client wrapper imports `renderWithClient`. Fresh client per test guarantees no cache bleed.

### Mock at the `apiFetch` boundary

The Plan 0 `api-client.test.ts` does this correctly: `jest.mock('@wordpress/api-fetch', () => ({ __esModule: true, default: jest.fn() }))`. Apply the same shape to mutation tests.

### When MSW makes sense

Once Plan 3's Activity log lands, MSW (Mock Service Worker) is worth introducing for hook-level integration tests (a real `apiFetch` → MSW handler chain catches more than per-call mocks). Not required for Plan 1; revisit at Plan 3.

## 12. DevTools — dev-only, lazy-loaded

Currently absent. Add as a follow-up commit in Plan 1 — useful when debugging the Account tab's mutation flow.

```tsx
// src/app.tsx
const ReactQueryDevtools =
	process.env.NODE_ENV === 'development'
		? require( '@tanstack/react-query-devtools' ).ReactQueryDevtools
		: () => null;

// Inside <QueryClientProvider>:
<ReactQueryDevtools initialIsOpen={ false } />
```

The conditional require avoids shipping the devtools bundle in production builds. Add `@tanstack/react-query-devtools` to `devDependencies`, not `dependencies`.

## 13. Polling — dynamic intervals only

VideoPress + Scan precedent: `refetchInterval` takes a callback that inspects state and returns `false` to stop polling. Don't poll at a fixed interval; it wastes battery + bandwidth.

```ts
queryOptions( {
	queryKey: akismetKeys.someBackgroundJob( id ),
	queryFn: () => apiClient.get( `jobs/${ id }` ),
	refetchInterval: ( query ) =>
		query.state.data?.status === 'pending' ? 5_000 : false,
} );
```

No polling planned for Plans 0–4. Documented here for completeness.

## 14. Anti-patterns to avoid

- **String query keys.** Always arrays. (TanStack errors at runtime, but TS doesn't catch it.)
- **`useQuery` inside event handlers.** Use `queryClient.fetchQuery` for imperative fetches.
- **Mutations without invalidation.** Every mutation either `setQueryData`s the affected key or `invalidateQueries` a prefix. The audit pass: grep `useMutation` and check each one.
- **Reading the query cache via `queryClient.getQueryData` in render.** Use `useQuery` for reactivity.
- **`refetchOnWindowFocus: true` for admin pages.** Default is true in TanStack; we override to false (§1). Don't toggle back without a reason.
- **Passing a fresh object as a query key.** `queryKey: [ 'akismet', { ...params } ]` re-creates on every render and breaks cache hits. Always use the factory's stable helpers.

## 15. Plan 0 back-fix checklist

Before Plan 1 starts, one cleanup commit on the branch addresses the gaps this doc surfaced:

- [ ] `createQueryClient`: `retry: 2` → `retry: 1`.
- [ ] Add `mutations.retry: false` to defaults.
- [ ] `src/index.tsx`: wire `apiFetch.createNonceMiddleware` + `createRootURLMiddleware` on app boot.
- [ ] `src/lib/api-client.ts`: export `WpError` type.
- [ ] Add `src/data/query-keys.ts` with the foundation entries (`all`, `key()`, `settings()`).
- [ ] Add `tests/js/test-utils.tsx` with `createTestQueryClient` + `renderWithClient`.
- [ ] Reference this doc from `00-foundation.md`'s self-review checklist.

DevTools (§12) and global error toast (§10) intentionally deferred to Plan 1.
