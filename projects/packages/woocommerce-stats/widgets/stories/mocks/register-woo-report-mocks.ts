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
	buildOrderAttributionByProductDeviceResponse,
	buildOrderAttributionDeviceResponse,
	buildOrdersByDateResponse,
	buildProductDetailsResponse,
	buildProductsResponse,
	buildSessionsByDeviceResponse,
	buildVisitorsByDateResponse,
} from './data';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

const REPORTS_FRAGMENT = 'analytics/reports/';
const REPORTS_PATH = `/jetpack/v4/woocommerce-stats/proxy/v2/${ REPORTS_FRAGMENT }`;
const WC_REST_PATH = '/wc/v3/';
const WC_PRODUCTS_PATH = `${ WC_REST_PATH }products`;

/**
 * The report each mocked endpoint answers, as the path fragment that identifies it.
 *
 * `forceWooReportState` matches by substring, so a story names its report from here rather than
 * typing a fragment that no request contains.
 */
export const WOO_REPORT_PATHS = {
	orderAttributionByProductDevice: `${ REPORTS_FRAGMENT }order-attribution-by-product/device/summary`,
	orderAttributionDevice: `${ REPORTS_FRAGMENT }order-attribution/device/summary`,
	ordersByDate: `${ REPORTS_FRAGMENT }orders/by-date`,
	ordersByProductType: `${ REPORTS_FRAGMENT }orders-by-product-type/by-date`,
	products: `${ REPORTS_FRAGMENT }products`,
	sessionsByDate: `${ REPORTS_FRAGMENT }sessions/by-date`,
	sessionsByDevice: `${ REPORTS_FRAGMENT }sessions/by-device`,
} as const;

const subPathOf = ( reportPath: string ) => reportPath.slice( REPORTS_FRAGMENT.length );

const reportResponders = new Map< string, ( query: URLSearchParams ) => unknown >( [
	[
		subPathOf( WOO_REPORT_PATHS.orderAttributionByProductDevice ),
		buildOrderAttributionByProductDeviceResponse,
	],
	[ subPathOf( WOO_REPORT_PATHS.orderAttributionDevice ), buildOrderAttributionDeviceResponse ],
	[ subPathOf( WOO_REPORT_PATHS.ordersByDate ), buildOrdersByDateResponse ],
	// Assumes the bookings product_type filter, the only caller; it does not read the filter it is given.
	[
		subPathOf( WOO_REPORT_PATHS.ordersByProductType ),
		query => buildOrdersByDateResponse( query, { share: BOOKINGS_SHARE } ),
	],
	[ subPathOf( WOO_REPORT_PATHS.products ), buildProductsResponse ],
	[ subPathOf( WOO_REPORT_PATHS.sessionsByDate ), buildVisitorsByDateResponse ],
	[ subPathOf( WOO_REPORT_PATHS.sessionsByDevice ), buildSessionsByDeviceResponse ],
] );

/** The bookings subset's share of the store's order volume. */
const BOOKINGS_SHARE = 0.28;

export type WooReportMockState = 'error' | 'error-retryable' | 'loading' | 'empty';

export type WooReportPath = ( typeof WOO_REPORT_PATHS )[ keyof typeof WOO_REPORT_PATHS ];

const mockStateOverrides = new Map< string, WooReportMockState >();

// Fragments some request has actually contained since they were forced. A forced state the widget
// never asks for is the failure this set exists to catch, so it is read on cleanup.
const matchedOverrides = new Set< string >();

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
		matchedOverrides.add( fragment );
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
		const respond = reportResponders.get(
			requestPath.slice( REPORTS_PATH.length ).split( '?' )[ 0 ]
		);

		if ( respond ) {
			return respond( queryOf( requestPath ) );
		}
	}

	// An unrouted report sub-path falls through too, so a later endpoint is one entry and
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
	matchedOverrides.delete( pathFragment );
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
 * The cleanup throws when no request ever matched, because the story then rendered as `Default`
 * does: without this, forcing a report the widget does not request is a silent pass.
 *
 * @param {WooReportPath}      reportPath - The report to force, from `WOO_REPORT_PATHS`.
 * @param {WooReportMockState} state      - The forced state.
 * @return {Function} A Storybook `beforeEach` implementation returning its cleanup.
 */
export function forceWooReportState(
	reportPath: WooReportPath,
	state: WooReportMockState
): () => () => void {
	return () => {
		setWooReportMockState( reportPath, state );

		return () => {
			const matched = matchedOverrides.has( reportPath );

			setWooReportMockState( reportPath, null );

			if ( ! matched ) {
				throw new Error(
					`No request matched the forced report path "${ reportPath }", so this story rendered its default state. Force the report the widget actually requests.`
				);
			}
		};
	};
}
