/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
// This import pulls @jetpack-premium-analytics/data into woo's Jest program, so a woo test
// failure can originate in Premium Analytics source with nothing in this package to say so.
import { resetForcedStateQueries } from '../../../../premium-analytics/packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	buildOrdersByDateResponse,
	buildProductDetailsResponse,
	buildProductsResponse,
	buildSessionsByDeviceResponse,
} from './data';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

const REPORTS_PATH = '/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports/';
const WC_REST_PATH = '/wc/v3/';
const WC_PRODUCTS_PATH = `${ WC_REST_PATH }products`;

/** The bookings subset's share of the store's order volume. */
const BOOKINGS_SHARE = 0.28;

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
	// The four states behave as the toolkit's `register-report-mocks.ts` does, which documents them.
	for ( const [ fragment, state ] of mockStateOverrides ) {
		if ( ! requestPath.includes( fragment ) ) {
			continue;
		}
		if ( state === 'loading' ) {
			return new Promise< never >( () => {} );
		}
		if ( state === 'empty' ) {
			// The store's own endpoints answer with a collection, the reports with a report.
			return Promise.resolve(
				requestPath.startsWith( WC_REST_PATH ) ? [] : { summary: {}, data: [] }
			);
		}
		if ( state === 'error-retryable' ) {
			return Promise.reject( {
				code: 'no_connection',
				message: 'Mocked connection failure for Storybook.',
				data: { status: 403 },
			} );
		}
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
				return buildOrdersByDateResponse( query );
			case 'orders-by-product-type/by-date':
				return buildOrdersByDateResponse( query, { share: BOOKINGS_SHARE } );
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
 * Registers the store-report mocking `apiFetch` middleware, once however often it is called.
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
 * Forces every request whose path contains `pathFragment` into a state, or clears it with `null`.
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
 * Story `beforeEach` that forces the matching requests into a state and clears it on cleanup.
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
