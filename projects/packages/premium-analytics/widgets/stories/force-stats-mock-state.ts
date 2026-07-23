/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

type ForcedMockState = 'error' | 'loading' | 'empty';

const stateOverrides = new Map< string, ForcedMockState >();

const forcedStateMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	for ( const [ fragment, state ] of stateOverrides ) {
		if ( ! requestPath.includes( fragment ) ) {
			continue;
		}
		if ( state === 'loading' ) {
			// Never settles: the query stays in its loading state.
			return new Promise< never >( () => {} );
		}
		if ( state === 'empty' ) {
			// A valid response with no rows across the shapes report sanitizers read
			// (`summary` / `days` / `data`), so the widget resolves to its empty state.
			return { date: '2026-01-01', period: 'day', summary: {}, days: {}, data: [] };
		}
		// A 403 is not retried by `shouldRetryApiError`, so the error UI shows at
		// once instead of after the query's retry backoff.
		return Promise.reject( {
			code: 'stats_mock_error',
			message: 'Mocked error response for Storybook.',
			data: { status: 403 },
		} );
	}

	return next( options );
};

/**
 * Story-side counterpart of `setReportMockState` for endpoints owned by
 * story-local or legacy stats mocks, e.g. `stats/clicks`, `stats/referrers`,
 * `reports/products`, or `latest-post`.
 *
 * The shared override in `register-report-mocks.ts` can miss those requests:
 * the last-registered `apiFetch` middleware runs first, so legacy stats mocks or
 * story-local endpoint mocks can answer before the shared override loop sees
 * the request. Storybook can lazy-load more story modules later, so this helper
 * re-registers its shared middleware whenever a forced state is set. The
 * duplicate registrations are intentional: they share the same override map and
 * keep the forced-state middleware ahead of any later endpoint-specific
 * middleware.
 *
 * Same contract as `setReportMockState`: call it in a story's `beforeEach` and
 * clear the override with `null` in the returned cleanup.
 *
 * Conventions for the forced-state stories that drive this helper (the per-story
 * comments point here rather than repeating the rationale in every widget file):
 * - Tag them `!autodocs`. The override is keyed by path, so on the shared
 *   autodocs page it would force every sibling story into the same state.
 * - Render each on a date preset distinct from the widget's other stories. The
 *   query key derives from the date range, so a unique preset gives the story
 *   its own cache entry and it hits the mock fresh instead of reading another
 *   story's cached success from the shared query client. When a widget's query
 *   key carries no date params, a distinct preset can't isolate it — evict the
 *   query from the shared client on enter and cleanup instead (see the
 *   `latest-post` stories).
 *
 * @param pathFragment - Substring matched against the request path (e.g. `stats/clicks`).
 * @param state        - The forced state, or `null` to clear.
 */
export function forceStatsMockState( pathFragment: string, state: ForcedMockState | null ): void {
	if ( state === null ) {
		stateOverrides.delete( pathFragment );
	} else {
		apiFetch.use( forcedStateMiddleware );
		stateOverrides.set( pathFragment, state );
	}
}
