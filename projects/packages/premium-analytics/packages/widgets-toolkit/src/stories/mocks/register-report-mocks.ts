/**
 * Storybook report-data mocking via a `@wordpress/api-fetch` middleware.
 *
 * The shared Jetpack Storybook config cannot be modified, and there is no
 * analytics backend in Storybook, so report requests have nothing to resolve
 * against.
 *
 * To mock report data we register an `apiFetch` middleware that intercepts the
 * proxy report paths and returns generated mock data. The data package fetches
 * every report through `apiFetch( { path } )` using the same base path
 * (`reportsPath`), so a single middleware covers all widget stories.
 *
 * The middleware is registered exactly once (guarded by a module-level flag) and
 * is triggered automatically when `with-widget-root.tsx` is imported.
 */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	mockOrderAttributionDeviceData,
	mockOrderAttributionChannelData,
	mockOrderAttributionSourceData,
	mockOrderAttributionCampaignData,
	generateOrdersByProductType,
	filterDataByDateRange,
	recalculateSummary,
	generateBookings,
	filterBookingsDataByDateRange,
	recalculateBookingsSummary,
	buildVisitorsByLocationResponse,
	mockSessionsByDeviceData,
	mockSessionsByDeviceComparisonData,
	mockCouponsData,
	mockCouponsComparisonData,
	mockCustomersData,
	mockCustomersComparisonData,
	mockCustomersByDateData,
	mockCustomersByDateComparisonData,
} from './data';
import { getMockParamsFromPreset } from './presets';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Base path that all report requests share. Matches `reportsPath` in the data
 * package (`@jetpack-premium-analytics/data`).
 */
const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const WP_SETTINGS_PATH = '/wp/v2/settings';

const coreSettingsMock = {
	timezone: 'UTC',
	gmt_offset: 0,
	date_format: 'F j, Y',
	time_format: 'g:i a',
	start_of_week: 1,
	title: 'Storybook',
};

/**
 * Days of mock data to generate (covering past requests).
 */
const SPECTRUM_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parameters for dynamic mock data generation.
 */
interface MockDataParams {
	seed: number;
	density: number;
	volume: number;
}

type VisitorsByLocationSignatureState = {
	primaryFrom?: string;
	comparisonFrom?: string;
	lastSeenMs: number;
};

const visitorsByLocationRequestState = new Map< string, VisitorsByLocationSignatureState >();

/**
 * Map view parameter to mock data for the order attribution endpoint.
 */
const orderAttributionMockMap: Record< string, object > = {
	device: mockOrderAttributionDeviceData,
	channel: mockOrderAttributionChannelData,
	source: mockOrderAttributionSourceData,
	campaign: mockOrderAttributionCampaignData,
};

/**
 * Per-endpoint request counters used to alternate between primary and
 * comparison data, mirroring the upstream MSW handlers (which kept a
 * `requestCount` per handler closure).
 */
const requestCounters: Record< string, number > = {};

/**
 * Returns true if the current request for the given endpoint key is the
 * comparison request (every other request), then advances the counter.
 *
 * @param key - Endpoint identifier.
 * @return Whether this request should serve comparison data.
 */
function nextIsComparison( key: string ): boolean {
	const count = requestCounters[ key ] ?? 0;
	requestCounters[ key ] = count + 1;
	return count % 2 === 1;
}

/**
 * Resolves the mock data params. No Storybook toolbar global is wired up, so we
 * fall back to the `default` preset, but still honour
 * `window.__STORYBOOK_MOCK_PARAMS__` if a consumer sets it.
 *
 * @return Mock data params (seed/density/volume).
 */
function getMockParams(): MockDataParams {
	const fromGlobal =
		typeof window !== 'undefined'
			? ( window as unknown as { __STORYBOOK_MOCK_PARAMS__?: Partial< MockDataParams > } )
					.__STORYBOOK_MOCK_PARAMS__
			: undefined;

	return { ...getMockParamsFromPreset( 'default' ), ...fromGlobal };
}

/**
 * Gets the end date for the mock data spectrum (end of today).
 *
 * @return Date set to the end of today (23:59:59.999).
 */
function getSpectrumToday(): Date {
	const today = new Date();
	today.setHours( 23, 59, 59, 999 );
	return today;
}

/**
 * Computes the spectrum date range (90 days ending today).
 *
 * @return ISO `from`/`to` strings for the spectrum.
 */
function getSpectrumRange(): { from: string; to: string } {
	const spectrumToday = getSpectrumToday();
	const spectrumFrom = new Date( spectrumToday );
	spectrumFrom.setDate( spectrumFrom.getDate() - SPECTRUM_DAYS );
	return {
		from: spectrumFrom.toISOString(),
		to: spectrumToday.toISOString(),
	};
}

/**
 * Splits an apiFetch path into its sub-path (relative to `API_BASE`) and parsed
 * query string.
 *
 * @param path - Full request path.
 * @return The sub-path and a `URLSearchParams` of the query.
 */
function parseReportPath( path: string ): {
	subPath: string;
	query: URLSearchParams;
} {
	const withoutBase = path.slice( API_BASE.length );
	const queryIndex = withoutBase.indexOf( '?' );
	const subPath = queryIndex === -1 ? withoutBase : withoutBase.slice( 0, queryIndex );
	const query = new URLSearchParams( queryIndex === -1 ? '' : withoutBase.slice( queryIndex + 1 ) );
	return { subPath, query };
}

function toDayStart( date: Date ) {
	return new Date( Date.UTC( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() ) );
}

function toDayEnd( date: Date ) {
	const end = toDayStart( date );
	end.setUTCHours( 23, 59, 59, 999 );
	return end;
}

function parseDateParam( value: string | null, fallback: Date ) {
	if ( ! value ) {
		return fallback;
	}

	const date = new Date( value );
	return Number.isNaN( date.getTime() ) ? fallback : date;
}

/**
 * Builds the orders / orders-by-product-type response using the
 * "spectrum + filter" strategy from upstream.
 *
 * @param key   - Endpoint counter key.
 * @param query - Parsed query params (uses `from`/`to`).
 * @return Orders report response (summary + filtered data).
 */
function buildOrdersResponse( key: string, query: URLSearchParams ) {
	const params = getMockParams();
	const isComparison = nextIsComparison( key );

	const spectrum = getSpectrumRange();
	const requestFrom = query.get( 'from' ) || '2024-01-01T00:00:00.000+00:00';
	const requestTo = query.get( 'to' ) || '2024-01-07T23:59:59.999+00:00';

	const seed = params.seed + ( isComparison ? 10000 : 0 );
	const density = isComparison ? Math.max( 0.1, params.density - 0.1 ) : params.density;
	const volume = isComparison ? Math.max( 1, params.volume - 1 ) : params.volume;

	const fullSpectrum = generateOrdersByProductType( {
		from: spectrum.from,
		to: spectrum.to,
		interval: 'day',
		seed,
		density,
		volume,
	} );

	const filteredData = filterDataByDateRange( fullSpectrum.data, requestFrom, requestTo );
	const summary = recalculateSummary( filteredData, requestFrom, requestTo );

	return { summary, data: filteredData };
}

/**
 * Builds the bookings response using the "spectrum + filter" strategy.
 *
 * @param query - Parsed query params (uses `from`/`to`).
 * @return Bookings report response (summary + filtered data).
 */
function buildBookingsResponse( query: URLSearchParams ) {
	const params = getMockParams();
	const isComparison = nextIsComparison( 'bookings/by-date' );

	const spectrum = getSpectrumRange();
	const requestFrom = query.get( 'from' ) || '2024-01-01T00:00:00.000+00:00';
	const requestTo = query.get( 'to' ) || '2024-01-07T23:59:59.999+00:00';

	const seed = params.seed + ( isComparison ? 10000 : 0 );
	// Bookings default density is 0.8 upstream; honour the preset density.
	const density = isComparison ? Math.max( 0.1, params.density - 0.1 ) : params.density;
	const volume = isComparison ? Math.max( 1, params.volume - 2 ) : Math.max( 1, params.volume - 2 );

	const fullSpectrum = generateBookings( {
		from: spectrum.from,
		to: spectrum.to,
		interval: 'day',
		seed,
		density,
		volume,
	} );

	const filteredData = filterBookingsDataByDateRange( fullSpectrum.data, requestFrom, requestTo );
	const summary = recalculateBookingsSummary( filteredData, requestFrom, requestTo );

	return { summary, data: filteredData };
}

/**
 * Builds the sessions/by-device response.
 *
 * Note: the data package's sanitizer reads `response.data` (not `items`), so we
 * return the items under the `data` key here.
 *
 * @return Sessions-by-device report response.
 */
function buildSessionsByDeviceResponse() {
	const isComparison = nextIsComparison( 'sessions/by-device' );
	const items = isComparison ? mockSessionsByDeviceComparisonData : mockSessionsByDeviceData;

	const totalSessions = items.reduce(
		( sum, item ) => sum + parseInt( item.active_sessions, 10 ),
		0
	);

	return {
		summary: {
			active_sessions: String( totalSessions ),
			total_orders: '0',
			date_start: '',
			date_end: '',
		},
		data: items,
	};
}

/**
 * Builds the sessions/by-date (visitors over time) response.
 *
 * @param query - Parsed query params.
 * @return Visitors time-series report response.
 */
function buildVisitorsByDateResponse( query: URLSearchParams ) {
	const params = getMockParams();
	const isComparison = nextIsComparison( 'sessions/by-date' );
	const fallbackTo = toDayEnd( new Date() );
	const fallbackFrom = toDayStart( new Date( fallbackTo.getTime() - 29 * DAY_MS ) );
	const from = toDayStart( parseDateParam( query.get( 'from' ), fallbackFrom ) );
	const to = toDayStart( parseDateParam( query.get( 'to' ), fallbackTo ) );
	const days = Math.max(
		1,
		Math.min( SPECTRUM_DAYS, Math.floor( ( to.getTime() - from.getTime() ) / DAY_MS ) + 1 )
	);
	const seed = params.seed + ( isComparison ? 10000 : 0 ) + from.getUTCDate();
	const density = Math.max( 0.1, Math.min( 1, params.density ) );
	const volume = Math.max( 1, params.volume * 100 );
	let visitorsTotal = 0;
	let sessionsTotal = 0;

	const data = Array.from( { length: days }, ( _, index ) => {
		const date = new Date( from.getTime() + index * DAY_MS );
		const activeDay = ( ( index * 37 + seed ) % 100 ) / 100 <= density;
		const trend = index * Math.max( 2, Math.round( volume / 120 ) );
		const wave = Math.sin( ( index + seed ) / 2.6 ) * volume * 0.35;
		const visitors = activeDay ? Math.max( 1, Math.round( volume + trend + wave ) ) : 0;
		const activeSessions = Math.round( visitors * 0.78 );

		visitorsTotal += visitors;
		sessionsTotal += activeSessions;

		return {
			date_start: date.toISOString(),
			date_end: toDayEnd( date ).toISOString(),
			time_interval: date.toISOString(),
			active_sessions: String( activeSessions ),
			visitors: String( visitors ),
		};
	} );

	return {
		summary: {
			active_sessions: String( sessionsTotal ),
			visitors: String( visitorsTotal ),
			date_start: from.toISOString(),
			date_end: toDayEnd( new Date( from.getTime() + ( days - 1 ) * DAY_MS ) ).toISOString(),
		},
		data,
	};
}

/**
 * Builds the sessions/by-location (visitors by location) response, detecting
 * comparison requests by tracking the distinct `from` values per request
 * signature (mirrors upstream).
 *
 * @param query - Parsed query params.
 * @return Visitors-by-location report response.
 */
function buildVisitorsByLocation( query: URLSearchParams ) {
	const requestFrom = query.get( 'from' ) || '2024-01-01T00:00:00.000+00:00';
	const requestTo = query.get( 'to' ) || '2024-01-07T23:59:59.999+00:00';
	const groupBy = ( query.get( 'group_by' ) as 'country' | 'region' ) || 'country';
	const countryCode = query.get( 'country_code' ) || '';
	const limit = query.get( 'limit' ) || '';

	const signature = [ groupBy, countryCode, limit ].join( '|' );
	const now = Date.now();

	const state = visitorsByLocationRequestState.get( signature ) ?? {
		lastSeenMs: 0,
	};

	// Reset if this signature hasn't been used recently (e.g. story changed).
	if ( now - state.lastSeenMs > 2000 ) {
		state.primaryFrom = undefined;
		state.comparisonFrom = undefined;
	}

	if ( requestFrom ) {
		if ( ! state.primaryFrom ) {
			state.primaryFrom = requestFrom;
		} else if ( state.primaryFrom !== requestFrom && ! state.comparisonFrom ) {
			// Assign primary/comparison by which range is more recent.
			const primaryTime = Date.parse( state.primaryFrom );
			const otherTime = Date.parse( requestFrom );
			if ( ! isNaN( primaryTime ) && ! isNaN( otherTime ) && otherTime > primaryTime ) {
				state.comparisonFrom = state.primaryFrom;
				state.primaryFrom = requestFrom;
			} else {
				state.comparisonFrom = requestFrom;
			}
		}
	}

	state.lastSeenMs = now;
	visitorsByLocationRequestState.set( signature, state );

	const isComparison = Boolean( state.comparisonFrom ) && requestFrom === state.comparisonFrom;

	return buildVisitorsByLocationResponse( {
		period: { from: requestFrom, to: requestTo },
		groupBy,
		isComparison,
	} );
}

/**
 * Routes a report sub-path to the matching mock generator.
 *
 * @param subPath - Path relative to `API_BASE` (e.g. `/orders/by-date`).
 * @param query   - Parsed query params.
 * @return The mock response body, or `null` if no specific handler matched.
 */
function routeReport( subPath: string, query: URLSearchParams ): unknown {
	// Order attribution: /order-attribution/{view}/summary
	const attributionMatch = subPath.match( /^\/order-attribution\/([^/]+)\/summary$/ );
	if ( attributionMatch ) {
		const view = attributionMatch[ 1 ];
		return orderAttributionMockMap[ view ] || mockOrderAttributionDeviceData;
	}

	switch ( subPath ) {
		case '/orders/by-date':
			return buildOrdersResponse( 'orders/by-date', query );
		case '/orders-by-product-type/by-date':
			return buildOrdersResponse( 'orders-by-product-type/by-date', query );
		case '/bookings/by-date':
			return buildBookingsResponse( query );
		case '/sessions/by-date':
			return buildVisitorsByDateResponse( query );
		case '/sessions/by-device':
			return buildSessionsByDeviceResponse();
		case '/sessions/by-location':
			return buildVisitorsByLocation( query );
		case '/coupons/':
		case '/coupons':
			return nextIsComparison( 'coupons' ) ? mockCouponsComparisonData : mockCouponsData;
		case '/customers/new-returning':
			return nextIsComparison( 'customers/new-returning' )
				? mockCustomersComparisonData
				: mockCustomersData;
		case '/customers/by-date':
			return nextIsComparison( 'customers/by-date' )
				? mockCustomersByDateComparisonData
				: mockCustomersByDateData;
		default:
			return null;
	}
}

const reportMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	if ( requestPath.startsWith( WP_SETTINGS_PATH ) ) {
		return coreSettingsMock;
	}

	if ( ! requestPath.startsWith( API_BASE ) ) {
		return next( options );
	}

	const { subPath, query } = parseReportPath( requestPath );
	const response = routeReport( subPath, query );

	if ( response !== null ) {
		return response;
	}

	// Catch-all for any other report path: an empty-but-valid response.
	return { data: [], summary: {} };
};

let registered = false;

/**
 * Registers the report-mocking `apiFetch` middleware. Idempotent: repeated calls
 * after the first are no-ops.
 */
export function registerReportMocks(): void {
	if ( registered ) {
		return;
	}
	registered = true;
	apiFetch.use( reportMocksMiddleware );
}
