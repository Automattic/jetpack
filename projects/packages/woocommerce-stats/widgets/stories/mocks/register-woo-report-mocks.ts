/**
 * Storybook store-report mocking via a `@wordpress/api-fetch` middleware: Storybook has no store
 * behind it, so this answers the store report paths and leaves every other path to `next`.
 */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { resetForcedStateQueries } from '../../../../premium-analytics/packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	buildOrdersByDateResponse,
	buildProductDetailsResponse,
	buildProductsResponse,
	buildSessionsByDeviceResponse,
} from './data';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

const REPORTS_PATH = '/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/';
const WC_PRODUCTS_PATH = '/wc/v3/products';

/**
 * Forced response state for a request path fragment, so stories can exercise a widget's loading,
 * error, and empty UI. `error` is a permission-gated 403; `error-retryable` is the proxy's
 * `no_connection` 403 (which `describeError` renders with Retry); `loading` never settles;
 * `empty` resolves with no rows.
 */
export type WooReportMockState = 'error' | 'error-retryable' | 'loading' | 'empty';

const mockStateOverrides = new Map< string, WooReportMockState >();

const queryOf = ( requestPath: string ) =>
	new URLSearchParams( requestPath.split( '?' )[ 1 ] ?? '' );

/**
 * The response a forced state owes a request, if any override matches its path.
 *
 * @param {string} requestPath - The request path, query string included.
 * @return {Promise<unknown>|undefined} The forced response, or undefined when none is forced.
 */
function forcedResponse( requestPath: string ): Promise< unknown > | undefined {
	for ( const [ fragment, state ] of mockStateOverrides ) {
		if ( ! requestPath.includes( fragment ) ) {
			continue;
		}
		if ( state === 'loading' ) {
			// Never settles: the query stays in its loading state.
			return new Promise< never >( () => {} );
		}
		if ( state === 'empty' ) {
			// A valid report with no rows, so the widget resolves to its empty state.
			return Promise.resolve( { summary: {}, data: [] } );
		}
		if ( state === 'error-retryable' ) {
			// The local proxy's `no_connection` shape: still a 403, but `describeError` keeps it
			// retryable because a broken connection can heal.
			return Promise.reject( {
				code: 'no_connection',
				message: 'Mocked connection failure for Storybook.',
				data: { status: 403 },
			} );
		}
		// The WPCOM pass-through envelope. A 403 is not retried, so the error UI shows at once and
		// `describeError` reads it as a permission gate and drops Retry.
		return Promise.reject( {
			error: 'unauthorized',
			message: 'Mocked error response for Storybook.',
			status: 403,
		} );
	}

	return undefined;
}

const wooReportMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';
	const forced = forcedResponse( requestPath );

	if ( forced !== undefined ) {
		return forced;
	}

	if ( requestPath.startsWith( WC_PRODUCTS_PATH ) ) {
		const include = queryOf( requestPath ).get( 'include' );

		return include ? buildProductDetailsResponse( include ) : next( options );
	}

	if ( requestPath.startsWith( REPORTS_PATH ) ) {
		const query = queryOf( requestPath );

		switch ( requestPath.slice( REPORTS_PATH.length ).split( '?' )[ 0 ] ) {
			case 'orders/by-date':
			case 'orders-by-product-type/by-date':
				return buildOrdersByDateResponse( query );
			case 'products':
				return buildProductsResponse( query );
			case 'sessions/by-device':
				return buildSessionsByDeviceResponse( query );
		}
	}

	// An unrouted report sub-path falls through too, so a later endpoint is one `case` and
	// registration order decides nothing.
	return next( options );
};

let registered = false;

/**
 * Registers the store-report mocking `apiFetch` middleware. Idempotent: repeated calls after the
 * first are no-ops.
 *
 * @return {void}
 */
export function registerWooReportMocks(): void {
	if ( registered ) {
		return;
	}
	registered = true;
	apiFetch.use( wooReportMocksMiddleware );
}

/**
 * Forces every request whose path contains `pathFragment` into a loading or error state (or
 * clears it with `null`), for a story's `beforeEach`. Keyed by path, so scope stories that use it
 * out of autodocs (`tags: [ '!autodocs' ]`) to avoid bleeding into siblings.
 *
 * @param {string}                  pathFragment - Substring matched against the request path.
 * @param {WooReportMockState|null} state        - The forced state, or `null` to clear.
 * @return {void}
 */
export function setWooReportMockState(
	pathFragment: string,
	state: WooReportMockState | null
): void {
	if ( state === null ) {
		mockStateOverrides.delete( pathFragment );
	} else {
		mockStateOverrides.set( pathFragment, state );
	}
	resetForcedStateQueries();
}

/**
 * Story `beforeEach` that forces the matching requests into a loading, error, or empty state and
 * clears it again on cleanup.
 *
 * @param {string}             pathFragment - Substring matched against the request path.
 * @param {WooReportMockState} state        - The forced state.
 * @return {Function} A Storybook `beforeEach` implementation returning its cleanup.
 */
export function forceWooReportState(
	pathFragment: string,
	state: WooReportMockState
): () => () => void {
	return () => {
		setWooReportMockState( pathFragment, state );

		return () => setWooReportMockState( pathFragment, null );
	};
}
