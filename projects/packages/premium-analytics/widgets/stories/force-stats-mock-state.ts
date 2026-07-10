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

let registered = false;

/**
 * Story-side counterpart of `setReportMockState` for Stats endpoints owned by
 * the legacy stats mocks (`register-stats-mocks.ts`), e.g. `stats/clicks` and
 * `stats/referrers`.
 *
 * The shared override in `register-report-mocks.ts` never sees those requests:
 * the last-registered `apiFetch` middleware runs first, and `registerStatsMocks()`
 * always registers after `registerReportMocks()` in the story modules, so the
 * legacy middleware answers the endpoints it knows before the override loop can
 * intercept them. This helper registers its own middleware lazily on first use —
 * i.e. after every mock registration — so it is guaranteed to run first.
 *
 * Same contract as `setReportMockState`: call it in a story's `beforeEach` and
 * clear the override with `null` in the returned cleanup.
 *
 * @param pathFragment - Substring matched against the request path (e.g. `stats/clicks`).
 * @param state        - The forced state, or `null` to clear.
 */
export function forceStatsMockState( pathFragment: string, state: ForcedMockState | null ): void {
	if ( ! registered ) {
		registered = true;
		apiFetch.use( forcedStateMiddleware );
	}

	if ( state === null ) {
		stateOverrides.delete( pathFragment );
	} else {
		stateOverrides.set( pathFragment, state );
	}
}
