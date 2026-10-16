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
			// The local proxy's `no_connection` shape: still a 403, but `describeError`
			// keeps it retryable because a broken connection can heal.
			return Promise.reject( {
				code: 'no_connection',
				message: 'Mocked connection failure for Storybook.',
				data: { status: 403 },
			} );
		}
		// The WPCOM pass-through envelope. `shouldRetryApiError` does not retry a 403,
		// so the error UI shows at once and `describeError` drops the Retry action.
		return Promise.reject( {
			error: 'unauthorized',
			message: 'Mocked error response for Storybook.',
			status: 403,
		} );
	}

	return next( options );
};

/**
 * Forces a state for requests handled by story-local or legacy mocks. Setting
 * a state re-registers the middleware, since the most recently registered one
 * runs first and stories load lazily. Keyed by path, so exclude the story from autodocs.
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
