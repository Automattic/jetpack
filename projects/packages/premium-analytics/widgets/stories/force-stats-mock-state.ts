/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { resetForcedStateQueries } from '../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

type ForcedMockState = 'error' | 'error-retryable' | 'loading' | 'empty';

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
		if ( state === 'error-retryable' ) {
			// The local proxy's `no_connection` shape. Still a 403, so the error UI
			// shows at once, but `describeError` keeps it retryable: a broken Jetpack
			// connection can heal, unlike a permission gate.
			return Promise.reject( {
				code: 'no_connection',
				message: 'Mocked connection failure for Storybook.',
				data: { status: 403 },
			} );
		}
		// The WPCOM pass-through envelope, with the status attached the way the fetch
		// layer attaches it. A 403 is not retried by `shouldRetryApiError`, so the
		// error UI shows at once instead of after the query's retry backoff. Widgets
		// on `describeError` read this as a permission gate and drop their Retry action.
		return Promise.reject( {
			error: 'unauthorized',
			message: 'Mocked error response for Storybook.',
			status: 403,
		} );
	}

	return next( options );
};

/**
 * Force a state for requests handled by story-local or legacy mocks.
 *
 * Re-register the middleware when setting a state because the most recently
 * registered `apiFetch` middleware runs first and stories load lazily.
 *
 * Use in `beforeEach`, clear on cleanup, and exclude the story from autodocs
 * because overrides are keyed by path. Cache isolation is automatic.
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
	resetForcedStateQueries();
}
