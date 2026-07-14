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
import { differenceInCalendarDays, isValid, parseISO } from 'date-fns';
/**
 * Internal dependencies
 */
import {
	mockOrderAttributionDeviceData,
	mockOrderAttributionByProductDeviceData,
	mockOrderAttributionByProductDeviceComparisonData,
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
	mockCouponsByDateData,
	mockCouponsByDateComparisonData,
	mockCustomersData,
	mockCustomersComparisonData,
	mockCustomersByDateData,
	mockCustomersByDateComparisonData,
	mockCommentsData,
	mockSearchTermsData,
	mockSearchTermsComparisonData,
	mockSingleVideoData,
	mockTagsData,
	mockTopAuthorsData,
	mockTopAuthorsComparisonData,
	mockSiteSummary,
	mockStatsInsightsData,
	mockStatsSummaryData,
	mockStatsSummaryComparisonData,
	mockStatsSubscribersCountsData,
	mockPlanUsageData,
	buildEmailRateResponse,
	mockEmailCountryBreakdown,
	mockEmailDeviceBreakdown,
	mockEmailClientBreakdown,
	mockEmailInternalLinkBreakdown,
	mockEmailUserContentLinkBreakdown,
} from './data';
import { getMockParamsFromPreset } from './presets';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Base path for Woo analytics report requests. Matches `reportsPath` in the data
 * package (`@jetpack-premium-analytics/data`).
 */
const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const STATS_FOLLOWERS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/followers';
const STATS_SUBSCRIBERS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/subscribers';
// The subscribers/counts endpoint is a v2 proxy path (not under /stats), so it
// is matched on its own rather than through routeStatsReport().
const STATS_SUBSCRIBERS_COUNTS_PATH = '/jetpack-premium-analytics/v1/proxy/v2/subscribers/counts';
const STATS_VISITS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/visits';
const STATS_EMAIL_SUMMARY_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/emails/summary';
const STATS_VIDEO_PLAYS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/video-plays';
// Plan usage is served off the v2 base (not under /v1.1/stats), so it needs its
// own path branch rather than a `routeStatsReport()` case.
const STATS_PLAN_USAGE_PATH = '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/usage';
const STATS_WORDADS_STATS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/wordads/stats';
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
 * Base path for Jetpack Stats proxy requests (v1.1).
 */
const STATS_API_BASE = '/jetpack-premium-analytics/v1/proxy/v1.1/stats';

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
 * Forced response state for a request path fragment, so stories can exercise a
 * widget's loading, error, and empty UI. `error` rejects the request; `loading`
 * returns a promise that never settles; `empty` resolves with a valid response
 * that has no rows.
 */
type ReportMockState = 'error' | 'loading' | 'empty';

const mockStateOverrides = new Map< string, ReportMockState >();

/**
 * Force every request whose path contains `pathFragment` into a loading or error
 * state, or clear the override with `null`. Intended for a story's `beforeEach`
 * (set on enter, clear on cleanup). Because the override is keyed by path, scope
 * stories that use it out of the shared autodocs page (`tags: [ '!autodocs' ]`)
 * so it cannot bleed into sibling stories rendered alongside it.
 *
 * @param pathFragment - Substring matched against the request path (e.g. `stats/search-terms`).
 * @param state        - The forced state, or `null` to clear.
 */
export function setReportMockState( pathFragment: string, state: ReportMockState | null ): void {
	if ( state === null ) {
		mockStateOverrides.delete( pathFragment );
	} else {
		mockStateOverrides.set( pathFragment, state );
	}
}

const mockResponseOverrides = new Map< string, unknown >();

/**
 * Force every request whose path contains `pathFragment` to resolve with a
 * specific payload, or clear the override with `null`. Unlike
 * `setReportMockState`, which forces a widget's loading/error/empty UI, this
 * swaps the successful response body — for exercising a data-driven variant (an
 * over-limit reading, a specific row shape) the default fixture doesn't cover.
 * Same scoping caveat: keyed by path, so scope such stories out of the shared
 * autodocs page (`tags: [ '!autodocs' ]`) and clear the override on cleanup.
 *
 * @param pathFragment - Substring matched against the request path.
 * @param response     - The response body to resolve with, or `null` to clear.
 */
export function setReportMockResponse( pathFragment: string, response: unknown | null ): void {
	if ( response === null ) {
		mockResponseOverrides.delete( pathFragment );
	} else {
		mockResponseOverrides.set( pathFragment, response );
	}
}

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
 * Per-day rows for customers/by-date. Dense like the real endpoint, which
 * zero-fills every interval in the range.
 *
 * @param query        - Parsed query params.
 * @param isComparison - Whether this request is the comparison period.
 * @return Daily customers-by-date rows.
 */
function buildCustomersByDateRows( query: URLSearchParams, isComparison: boolean ) {
	const params = getMockParams();
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
	const volume = Math.max( 1, params.volume * 60 );

	return Array.from( { length: days }, ( _, index ) => {
		const date = new Date( from.getTime() + index * DAY_MS );
		const activeDay = ( ( index * 37 + seed ) % 100 ) / 100 <= density;
		const wave = Math.sin( ( index + seed ) / 2.6 ) * volume * 0.35;
		const totalCustomers = activeDay ? Math.max( 1, Math.round( volume + wave ) ) : 0;
		const newCustomers = Math.round( totalCustomers * 0.2 );
		const orders = Math.round( totalCustomers * 0.25 );
		const newCustomerOrders = Math.round( orders * 0.2 );
		const netSales = totalCustomers * 42;
		const newCustomerNetSales = Math.round( netSales * 0.2 );

		return {
			time_interval: date.toISOString(),
			date_start: date.toISOString(),
			date_end: toDayEnd( date ).toISOString(),
			total_customers: String( totalCustomers ),
			new_customers: String( newCustomers ),
			returning_customers: String( totalCustomers - newCustomers ),
			orders_count: String( orders ),
			new_customer_orders: String( newCustomerOrders ),
			returning_customer_orders: String( orders - newCustomerOrders ),
			net_sales: String( netSales ),
			new_customer_net_sales: String( newCustomerNetSales ),
			returning_customer_net_sales: String( netSales - newCustomerNetSales ),
		};
	} );
}

/**
 * The sessions/by-conversion-rate response: a daily session funnel
 * (sessions → cart → checkout → completed). Dense like the real endpoint,
 * which zero-fills every interval in the range.
 *
 * @param query - Parsed query params.
 * @return Conversion-rate funnel report response.
 */
function buildConversionRateResponse( query: URLSearchParams ) {
	const params = getMockParams();
	const isComparison = nextIsComparison( 'sessions/by-conversion-rate' );
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
	const totals = {
		active_sessions: 0,
		visitors: 0,
		with_cart_addition: 0,
		reached_checkout: 0,
		completed_checkout: 0,
	};

	const data = Array.from( { length: days }, ( _, index ) => {
		const date = new Date( from.getTime() + index * DAY_MS );
		const activeDay = ( ( index * 37 + seed ) % 100 ) / 100 <= density;
		const trend = index * Math.max( 2, Math.round( volume / 120 ) );
		const wave = Math.sin( ( index + seed ) / 2.6 ) * volume * 0.35;
		const visitors = activeDay ? Math.max( 1, Math.round( volume + trend + wave ) ) : 0;
		const activeSessions = Math.round( visitors * 0.78 );
		const withCartAddition = Math.round( activeSessions * 0.32 );
		const reachedCheckout = Math.round( activeSessions * 0.14 );
		const completedCheckout = Math.round( activeSessions * 0.06 );

		totals.visitors += visitors;
		totals.active_sessions += activeSessions;
		totals.with_cart_addition += withCartAddition;
		totals.reached_checkout += reachedCheckout;
		totals.completed_checkout += completedCheckout;

		return {
			date_start: date.toISOString(),
			date_end: toDayEnd( date ).toISOString(),
			time_interval: date.toISOString(),
			active_sessions: String( activeSessions ),
			visitors: String( visitors ),
			with_cart_addition: String( withCartAddition ),
			reached_checkout: String( reachedCheckout ),
			completed_checkout: String( completedCheckout ),
		};
	} );

	return {
		summary: {
			active_sessions: String( totals.active_sessions ),
			visitors: String( totals.visitors ),
			with_cart_addition: String( totals.with_cart_addition ),
			reached_checkout: String( totals.reached_checkout ),
			completed_checkout: String( totals.completed_checkout ),
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
	// Product-filtered order attribution: /order-attribution-by-product/{view}/summary
	const attributionByProductMatch = subPath.match(
		/^\/order-attribution-by-product\/([^/]+)\/summary$/
	);
	if ( attributionByProductMatch ) {
		const view = attributionByProductMatch[ 1 ];

		if ( view === 'device' ) {
			return nextIsComparison( 'order-attribution-by-product/device' )
				? mockOrderAttributionByProductDeviceComparisonData
				: mockOrderAttributionByProductDeviceData;
		}

		return {
			view,
			order_by: 'net_sales',
			data: [],
		};
	}

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
		case '/sessions/by-conversion-rate':
			return buildConversionRateResponse( query );
		case '/sessions/by-device':
			return buildSessionsByDeviceResponse();
		case '/sessions/by-location':
			return buildVisitorsByLocation( query );
		case '/coupons/':
		case '/coupons':
			return nextIsComparison( 'coupons' ) ? mockCouponsComparisonData : mockCouponsData;
		case '/coupons/by-date':
			return nextIsComparison( 'coupons/by-date' )
				? mockCouponsByDateComparisonData
				: mockCouponsByDateData;
		case '/customers/new-returning':
			return nextIsComparison( 'customers/new-returning' )
				? mockCustomersComparisonData
				: mockCustomersData;
		case '/customers/by-date': {
			const isComparison = nextIsComparison( 'customers/by-date' );
			const base = isComparison ? mockCustomersByDateComparisonData : mockCustomersByDateData;
			return { ...base, data: buildCustomersByDateRows( query, isComparison ) };
		}
		default:
			return null;
	}
}

/**
 * Builds a mock Stats "followers" (subscribers) response with a realistic spread
 * of recent subscription times so the Latest Subscribers widget renders
 * populated in Storybook. The shape matches what `sanitizeStatsFollowersResponse`
 * expects (`{ subscribers, total, … }`); `total` exceeds the shown rows so the
 * "N more" footer appears.
 *
 * @return Raw followers response.
 */
function buildFollowersResponse() {
	const now = Date.now();
	const MINUTE = 60 * 1000;
	const HOUR = 60 * MINUTE;
	const DAY = 24 * HOUR;
	const people = [
		{ name: 'Diego Morales', offset: 20 * 1000 },
		{ name: 'Olivia Park', offset: 12 * MINUTE },
		{ name: 'Hiroshi Tanaka', offset: HOUR },
		{ name: 'Emma Rossi', offset: 3 * HOUR },
		{ name: 'Aarav Patel', offset: 5 * HOUR },
		{ name: 'Sofia Nguyen', offset: DAY },
	];
	const subscribers = people.map( ( person, index ) => ( {
		ID: 1000 + index,
		subscription_id: 1000 + index,
		display_name: person.name,
		avatar: `https://i.pravatar.cc/64?img=${ 10 + index }`,
		url: 'https://example.com',
		date_subscribed: new Date( now - person.offset ).toISOString(),
	} ) );
	return { subscribers, total: 30, total_email: 18, total_wpcom: 12, page: 1, pages: 5 };
}

/**
 * Builds the stats/subscribers time-series response.
 *
 * Honours the `unit`, `quantity`, and `date` query params so the subscribers
 * chart's two requests (current window and the immediately preceding window)
 * return continuous data: values are anchored to each bucket's absolute date,
 * so the current window trends above the previous one and the headline shows a
 * positive period-over-period delta. The series is wavy (not flat) so the
 * dashed previous-period overlay reads clearly against the solid current line.
 * Paid subscribers are always present so both chart lines are exercised.
 *
 * @param query - Parsed query params (`unit`, `quantity`, `date`).
 * @return Raw subscribers response in the WPCOM matrix shape.
 */
function buildSubscribersResponse( query: URLSearchParams ) {
	const unit = query.get( 'unit' ) || 'day';
	const quantity = Math.max( 1, Math.min( 60, parseInt( query.get( 'quantity' ) || '30', 10 ) ) );
	const endDate = parseDateParam( query.get( 'date' ), new Date() );

	// Anchor growth to a fixed day so totals stay in a realistic range and stay
	// continuous across the current/previous windows.
	const anchorDay = Math.floor( Date.now() / DAY_MS ) - 400;
	const stepDays = unit === 'week' ? 7 : 1;

	const rows = Array.from( { length: quantity }, ( _, index ) => {
		const i = quantity - 1 - index;
		const bucket = new Date( endDate );
		let period: string;

		if ( unit === 'month' ) {
			bucket.setUTCMonth( bucket.getUTCMonth() - i );
			period = `${ bucket.getUTCFullYear() }-${ String( bucket.getUTCMonth() + 1 ).padStart(
				2,
				'0'
			) }`;
		} else if ( unit === 'week' ) {
			// Mirror WPCOM's weekly label shape: YYYY'W'MM'W'DD (week-start date).
			bucket.setUTCDate( bucket.getUTCDate() - i * stepDays );
			period = `${ bucket.getUTCFullYear() }W${ String( bucket.getUTCMonth() + 1 ).padStart(
				2,
				'0'
			) }W${ String( bucket.getUTCDate() ).padStart( 2, '0' ) }`;
		} else {
			bucket.setUTCDate( bucket.getUTCDate() - i * stepDays );
			period = bucket.toISOString().slice( 0, 10 );
		}

		const absDay = Math.floor( bucket.getTime() / DAY_MS );
		// Upward trend plus a wave whose period (~44 days) does not align with a
		// 30-day window, so the index-aligned previous-period series stays out of
		// phase and its dashed line diverges visibly from the current solid line.
		const trend = ( absDay - anchorDay ) * 9;
		const wave = 420 * Math.sin( absDay / 7 ) + 180 * Math.cos( absDay / 11 );
		const subscribers = Math.max( 0, Math.round( 900 + trend + wave ) );
		const paid = Math.max( 0, Math.round( subscribers * 0.32 + 120 * Math.sin( absDay / 6 ) ) );

		return [ period, subscribers, paid ];
	} );

	return {
		date: endDate.toISOString().slice( 0, 10 ),
		unit,
		fields: [ 'period', 'subscribers', 'subscribers_paid' ],
		data: rows,
	};
}

/**
 * Number of days a unit step spans, used to lay out mock visits buckets.
 */
const VISITS_STEP_DAYS: Record< string, number > = { day: 1, week: 7, month: 30, year: 365 };

/**
 * Builds the stats/visits time-series response for the traffic chart.
 *
 * Honours the `unit`, `date`, `start_date`, and `stat_fields` query params, and
 * returns only the requested fields (the traffic chart fetches views/visitors
 * and likes/comments as two separate requests). Values are anchored to each
 * bucket's absolute date so the current window trends above the comparison
 * window and each metric shows a positive period-over-period delta; the series
 * is wavy so the dashed previous-period overlay reads clearly against the solid
 * current line.
 *
 * @param query - Parsed query params (`unit`, `date`, `start_date`, `stat_fields`).
 * @return Raw visits response in the WPCOM matrix shape.
 */
function buildVisitsResponse( query: URLSearchParams ) {
	const unit = query.get( 'unit' ) || 'day';
	const stepDays = VISITS_STEP_DAYS[ unit ] ?? 1;
	const fields = ( query.get( 'stat_fields' ) || 'views,visitors' ).split( ',' );
	const endDate = parseDateParam( query.get( 'date' ), new Date() );
	const startDate = parseDateParam(
		query.get( 'start_date' ),
		new Date( endDate.getTime() - 29 * stepDays * DAY_MS )
	);

	const spanDays = Math.round( ( endDate.getTime() - startDate.getTime() ) / DAY_MS );
	const count = Math.max( 1, Math.min( 400, Math.round( spanDays / stepDays ) + 1 ) );
	const anchorDay = Math.floor( Date.now() / DAY_MS ) - 400;

	const rows = Array.from( { length: count }, ( _, index ) => {
		const i = count - 1 - index;
		const bucket = new Date( endDate );
		let period: string;

		if ( unit === 'month' ) {
			bucket.setUTCMonth( bucket.getUTCMonth() - i );
			period = `${ bucket.getUTCFullYear() }-${ String( bucket.getUTCMonth() + 1 ).padStart(
				2,
				'0'
			) }`;
		} else if ( unit === 'week' ) {
			bucket.setUTCDate( bucket.getUTCDate() - i * stepDays );
			// The stats/visits weekly label is `YYYYWMMWDD` — the week's start date.
			period = `${ bucket.getUTCFullYear() }W${ String( bucket.getUTCMonth() + 1 ).padStart(
				2,
				'0'
			) }W${ String( bucket.getUTCDate() ).padStart( 2, '0' ) }`;
		} else {
			bucket.setUTCDate( bucket.getUTCDate() - i * stepDays );
			period = bucket.toISOString().slice( 0, 10 );
		}

		const absDay = Math.floor( bucket.getTime() / DAY_MS );
		const trend = ( absDay - anchorDay ) * 6;
		const wave = 300 * Math.sin( absDay / 7 ) + 120 * Math.cos( absDay / 11 );
		const views = Math.max( 0, Math.round( 800 + trend + wave ) );
		const values: Record< string, number > = {
			views,
			visitors: Math.round( views * 0.64 ),
			likes: Math.max( 0, Math.round( views * 0.08 + 6 * Math.sin( absDay / 5 ) ) ),
			comments: Math.max( 0, Math.round( views * 0.03 + 3 * Math.cos( absDay / 6 ) ) ),
		};

		return [ period, ...fields.map( field => values[ field ] ?? 0 ) ];
	} );

	return {
		date: endDate.toISOString().slice( 0, 10 ),
		unit,
		fields: [ 'period', ...fields ],
		data: rows,
	};
}

/**
 * Builds a mock Stats "email summary" response so the Emails widget renders
 * populated in Storybook. The shape matches what `sanitizeStatsEmailSummaryResponse`
 * expects (`{ posts: [ { title, opens_rate, clicks_rate, … } ] }`); rates are
 * 0–100 percentages and the rows are newest-first to mirror the live endpoint.
 *
 * @return Raw email-summary response.
 */
function buildEmailSummaryResponse() {
	const emails = [
		{ title: '4 Ways to Make Your Website Stand Out', opens_rate: 38.1, clicks_rate: 3.81 },
		{ title: 'Develop Locally on Linux with WordPress.com', opens_rate: 41.2, clicks_rate: 5.98 },
		{ title: '10 Brand-New WordPress.com Themes for 2026', opens_rate: 35.7, clicks_rate: 7.12 },
		{
			title: 'WordPress.com Is Now Available in More Languages',
			opens_rate: 52.4,
			clicks_rate: 8.93,
		},
		{ title: 'WordCamp Europe 2026: What to Expect', opens_rate: 47.9, clicks_rate: 10.25 },
		{
			title: 'Click, Comment, Done: A Better Way to Collaborate',
			opens_rate: 44.3,
			clicks_rate: 10.38,
		},
	];
	const posts = emails.map( ( email, index ) => ( {
		id: 2000 + index,
		title: email.title,
		href: 'https://example.com',
		type: 'post',
		opens_rate: email.opens_rate,
		clicks_rate: email.clicks_rate,
		opens: 400 - index * 20,
		clicks: 40 - index * 3,
		unique_opens: 380 - index * 20,
		unique_clicks: 38 - index * 3,
		total_sends: 1000,
	} ) );
	return { posts };
}

/**
 * Builds a mock email breakdown response for the "Email breakdown" widget. The
 * request path ends with the breakdown dimension
 * (`.../stats/opens|clicks/emails/{id}/{breakdown}`), so the trailing segment
 * selects the matching fieldless fixture. The endpoints have no comparison period.
 *
 * @param requestPath - The request path, used to read the breakdown dimension.
 * @return Raw email breakdown response.
 */
function buildEmailBreakdownResponse( requestPath: string ): unknown {
	const breakdown = requestPath.split( '?' )[ 0 ].split( '/' ).pop() ?? '';

	switch ( breakdown ) {
		case 'country':
			return mockEmailCountryBreakdown;
		case 'device':
			return mockEmailDeviceBreakdown;
		case 'client':
			return mockEmailClientBreakdown;
		case 'link':
			return mockEmailInternalLinkBreakdown;
		case 'user-content-link':
			return mockEmailUserContentLinkBreakdown;
		default:
			return {};
	}
}

/**
 * Routes a Stats sub-path to the matching mock generator.
 *
 * @param subPath - Path relative to `STATS_API_BASE` (e.g. `/search-terms`).
 * @return The mock response body, or `null` if no specific handler matched.
 */
function routeStatsReport( subPath: string ): unknown {
	// Single-video detail: `/video/{postId}` (drives the "Video embeds" widget).
	if ( /^\/video\/\d+$/.test( subPath ) ) {
		return mockSingleVideoData;
	}

	// Per-post email rate breakdowns: `/opens/emails/<postId>/rate`, `/clicks/emails/<postId>/rate`.
	const emailRate = subPath.match( /^\/(opens|clicks)\/emails\/\d+\/rate$/ );
	if ( emailRate ) {
		return buildEmailRateResponse( emailRate[ 1 ] as 'opens' | 'clicks' );
	}

	// Per-post email breakdowns: `/opens|clicks/emails/<postId>/<dimension>`. Matched here
	// (after the `rate` case above) so the shared prefix can't swallow the rate endpoint.
	if (
		/^\/(?:opens|clicks)\/emails\/\d+\/(?:country|device|client|link|user-content-link)$/.test(
			subPath
		)
	) {
		return buildEmailBreakdownResponse( subPath );
	}

	switch ( subPath ) {
		case '':
			// Site summary — the bare `/stats` endpoint (all-time totals).
			return mockSiteSummary;
		case '/summary':
			// Period summary — alternates primary/comparison so the Site overview
			// widget shows a period-over-period delta on each tile.
			return nextIsComparison( 'stats/summary' )
				? mockStatsSummaryComparisonData
				: mockStatsSummaryData;
		case '/comments':
			// All-time report with no comparison period; the same body serves
			// both the primary and comparison requests.
			return mockCommentsData;
		case '/search-terms':
			return nextIsComparison( 'stats/search-terms' )
				? mockSearchTermsComparisonData
				: mockSearchTermsData;
		case '/top-authors':
			return nextIsComparison( 'stats/top-authors' )
				? mockTopAuthorsComparisonData
				: mockTopAuthorsData;
		case '/tags':
			// The Stats `tags` endpoint has no comparison period, so the same
			// primary fixture is returned for every request.
			return mockTagsData;
		case '/insights':
			return mockStatsInsightsData;
		default:
			return null;
	}
}

/**
 * Read a query-string parameter from a (possibly relative) apiFetch request
 * path.
 *
 * @param requestPath - The request path, with or without a query string.
 * @param key         - The parameter name to read.
 * @return The decoded value, or undefined when absent.
 */
function getQueryParam( requestPath: string, key: string ): string | undefined {
	const query = requestPath.split( '?' )[ 1 ];

	return query ? new URLSearchParams( query ).get( key ) ?? undefined : undefined;
}

/**
 * Scale factor for play counts based on how recent the requested window ends,
 * so the primary (recent) period reads higher than the comparison (earlier)
 * period and the widget shows period-over-period growth. Recent windows return
 * the full count; windows ~30+ days back taper to ~70%.
 *
 * @param endDate - The window's end date (YYYY-MM-DD), or undefined for "today".
 * @return A multiplier in the range [0.7, 1].
 */
function playsFactorForWindow( endDate: string | undefined ): number {
	if ( ! endDate ) {
		return 1;
	}

	const end = parseISO( endDate );

	if ( ! isValid( end ) ) {
		return 1;
	}

	// `differenceInCalendarDays` counts whole calendar days between the two
	// dates, so the scaling (and the mocked counts) stay stable regardless of
	// the machine's timezone.
	const daysAgo = Math.max( 0, differenceInCalendarDays( new Date(), end ) );

	return 1 - Math.min( daysAgo / 30, 1 ) * 0.3;
}

/**
 * Builds a mock Stats "video-plays" response so the Videos widget renders a
 * populated leaderboard in Storybook. The shape matches what
 * `sanitizeStatsVideoPlaysResponse` reads (`days.<date>.plays[]`), and play
 * counts scale by how recent the requested window is so the comparison period
 * reads lower than the primary one.
 *
 * @param requestPath - The request path, used to read the window's end date.
 * @return Raw video-plays response.
 */
function buildVideoPlaysResponse( requestPath: string ) {
	const endDate = getQueryParam( requestPath, 'end_date' ) ?? getQueryParam( requestPath, 'date' );
	const date = endDate ?? new Date().toISOString().slice( 0, 10 );
	const factor = playsFactorForWindow( endDate );
	const videos = [
		{ post_id: 101, title: 'Getting Started Walkthrough', plays: 3820 },
		{ post_id: 102, title: 'Product Launch Highlights', plays: 2640 },
		{ post_id: 103, title: 'Customer Story: Acme Co.', plays: 1980 },
		{ post_id: 104, title: 'How-To: Advanced Settings', plays: 1410 },
		{ post_id: 105, title: 'Behind the Scenes', plays: 980 },
		{ post_id: 106, title: 'Weekly Recap', plays: 540 },
		{ post_id: 107, title: '', plays: 320 },
	];
	const rows = videos.map( video => ( {
		post_id: video.post_id,
		title: video.title,
		url: `https://example.com/video/${ video.post_id }/`,
		plays: Math.round( video.plays * factor ),
		impressions: Math.round( video.plays * factor * 1.8 ),
		watch_time: Math.round( video.plays * factor * 12 ),
		retention_rate: 60,
	} ) );

	// `summary.plays` feeds the summarized path (multi-day ranges set
	// `summarize=1`); `days.<date>.plays` covers the single-day path.
	return { date, period: 'day', summary: { plays: rows }, days: { [ date ]: { plays: rows } } };
}

/**
 * Builds the wordads/stats time-series response for the WordAds chart tabs.
 *
 * Honours the `unit`, `date`, and `quantity` query params and returns the raw
 * WPCOM matrix shape (`fields: [ 'period', 'impressions', 'revenue', 'cpm' ]`).
 * Impressions are anchored to each bucket's absolute date so the current window
 * trends above the comparison window (a positive period-over-period delta), and
 * revenue is derived from impressions and a wavy CPM so all three metrics move
 * together and read clearly against the dashed previous-period overlay.
 *
 * @param query - Parsed query params (`unit`, `date`, `quantity`).
 * @return Raw wordads/stats response in the WPCOM matrix shape.
 */
function buildWordAdsStatsResponse( query: URLSearchParams ) {
	const unit = query.get( 'unit' ) || 'day';
	const stepDays = VISITS_STEP_DAYS[ unit ] ?? 1;
	const endDate = parseDateParam( query.get( 'date' ), new Date() );
	const count = Math.max( 1, Math.min( 400, Number( query.get( 'quantity' ) ) || 30 ) );
	const anchorDay = Math.floor( Date.now() / DAY_MS ) - 400;

	const rows = Array.from( { length: count }, ( _, index ) => {
		const i = count - 1 - index;
		const bucket = new Date( endDate );
		let period: string;

		if ( unit === 'year' ) {
			bucket.setUTCFullYear( bucket.getUTCFullYear() - i );
			period = `${ bucket.getUTCFullYear() }`;
		} else if ( unit === 'month' ) {
			bucket.setUTCMonth( bucket.getUTCMonth() - i );
			period = `${ bucket.getUTCFullYear() }-${ String( bucket.getUTCMonth() + 1 ).padStart(
				2,
				'0'
			) }`;
		} else if ( unit === 'week' ) {
			bucket.setUTCDate( bucket.getUTCDate() - i * stepDays );
			// The wordads weekly label is `YYYYWMMWDD` — the week's start date.
			period = `${ bucket.getUTCFullYear() }W${ String( bucket.getUTCMonth() + 1 ).padStart(
				2,
				'0'
			) }W${ String( bucket.getUTCDate() ).padStart( 2, '0' ) }`;
		} else {
			bucket.setUTCDate( bucket.getUTCDate() - i * stepDays );
			period = bucket.toISOString().slice( 0, 10 );
		}

		const absDay = Math.floor( bucket.getTime() / DAY_MS );
		const trend = ( absDay - anchorDay ) * 3;
		const wave = 200 * Math.sin( absDay / 9 ) + 80 * Math.cos( absDay / 13 );
		const impressions = Math.max( 0, Math.round( 1500 + trend + wave ) );
		const cpm = Math.max( 1, 4 + 1.5 * Math.sin( absDay / 6 ) );
		const revenue = ( impressions / 1000 ) * cpm;

		return [ period, impressions, Number( revenue.toFixed( 2 ) ), Number( cpm.toFixed( 2 ) ) ];
	} );

	return {
		date: endDate.toISOString().slice( 0, 10 ),
		unit,
		fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
		data: rows,
	};
}

const reportMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	for ( const [ fragment, response ] of mockResponseOverrides ) {
		if ( requestPath.includes( fragment ) ) {
			return response;
		}
	}

	for ( const [ fragment, state ] of mockStateOverrides ) {
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

	if ( requestPath.startsWith( WP_SETTINGS_PATH ) ) {
		return coreSettingsMock;
	}

	if ( requestPath.startsWith( STATS_FOLLOWERS_PATH ) ) {
		return buildFollowersResponse();
	}

	if ( requestPath.startsWith( STATS_SUBSCRIBERS_COUNTS_PATH ) ) {
		return mockStatsSubscribersCountsData;
	}

	if ( requestPath.startsWith( STATS_SUBSCRIBERS_PATH ) ) {
		const queryIndex = requestPath.indexOf( '?' );
		return buildSubscribersResponse(
			new URLSearchParams( queryIndex === -1 ? '' : requestPath.slice( queryIndex + 1 ) )
		);
	}

	if ( requestPath.startsWith( STATS_VISITS_PATH ) ) {
		const queryIndex = requestPath.indexOf( '?' );
		return buildVisitsResponse(
			new URLSearchParams( queryIndex === -1 ? '' : requestPath.slice( queryIndex + 1 ) )
		);
	}

	if ( requestPath.startsWith( STATS_EMAIL_SUMMARY_PATH ) ) {
		return buildEmailSummaryResponse();
	}

	if ( requestPath.startsWith( STATS_VIDEO_PLAYS_PATH ) ) {
		return buildVideoPlaysResponse( requestPath );
	}

	if ( requestPath.startsWith( STATS_PLAN_USAGE_PATH ) ) {
		return mockPlanUsageData;
	}

	if ( requestPath.startsWith( STATS_WORDADS_STATS_PATH ) ) {
		const queryIndex = requestPath.indexOf( '?' );
		return buildWordAdsStatsResponse(
			new URLSearchParams( queryIndex === -1 ? '' : requestPath.slice( queryIndex + 1 ) )
		);
	}

	if ( requestPath.startsWith( STATS_API_BASE ) ) {
		const subPath = requestPath.slice( STATS_API_BASE.length ).split( '?' )[ 0 ];
		const response = routeStatsReport( subPath );

		if ( response !== null ) {
			return response;
		}

		// Stats endpoints this middleware doesn't route may be owned by the
		// legacy stats mocks (register-stats-mocks.ts). Fall through so
		// middleware registration order doesn't decide whether they load.
		return next( options );
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
