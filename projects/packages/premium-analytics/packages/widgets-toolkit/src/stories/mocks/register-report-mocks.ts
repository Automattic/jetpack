/**
 * Storybook report-data mocking via a `@wordpress/api-fetch` middleware: since
 * Storybook has no analytics backend, this middleware intercepts proxy report
 * paths (matching `fetchReport()`'s base path) and returns generated mock data.
 * Registered once, triggered when `with-widget-root.tsx` is imported.
 */
/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
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
	mockStatsPostData,
	mockPostCommentsData,
	mockPostLikesData,
	mockStatsSummaryData,
	mockStatsSummaryComparisonData,
	mockStatsSubscribersCountsData,
	mockPlanUsageData,
	buildEmailRateResponse,
	buildEmailTimelineResponse,
	mockEmailCountryBreakdown,
	mockEmailDeviceBreakdown,
	mockEmailClientBreakdown,
	mockEmailInternalLinkBreakdown,
	mockEmailUserContentLinkBreakdown,
	buildPostContentResponse,
} from './data';
import { getMockParamsFromPreset } from './presets';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Base path for Woo analytics report requests. Matches the non-Simple path
 * built by `fetchReport()` in the data package (`@jetpack-premium-analytics/data`).
 */
const API_BASE = '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports';
const STATS_FOLLOWERS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/followers';
const STATS_SUBSCRIBERS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/subscribers';
// The subscribers/counts endpoint is a v2 proxy path (not under /stats), so it
// is matched on its own rather than through routeStatsReport().
const STATS_SUBSCRIBERS_COUNTS_PATH = '/jetpack-premium-analytics/v1/proxy/v2/subscribers/counts';
const STATS_VISITS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/visits';
const STATS_VIEWS_BY_HOUR_PATH =
	'/jetpack-premium-analytics/v1/proxy/v1.1/stats/views-by/hour-of-day';
const STATS_EMAIL_SUMMARY_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/emails/summary';
const STATS_VIDEO_PLAYS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/video-plays';
// Plan usage is served off the v2 base (not under /v1.1/stats), so it needs its
// own path branch rather than a `routeStatsReport()` case.
const STATS_PLAN_USAGE_PATH = '/jetpack-premium-analytics/v1/proxy/v2/jetpack-stats/usage';
const STATS_WORDADS_STATS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/wordads/stats';
const STATS_WORDADS_EARNINGS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/wordads/earnings';
// Post likes is a `posts/{id}/likes` proxy path (not under /stats), so it is
// matched with its own pattern rather than through routeStatsReport().
const POST_LIKES_PATH_PATTERN =
	/^\/jetpack-premium-analytics\/v1\/proxy\/v1\.2\/posts\/\d+\/likes(?:\?|$)/;
// Post comments use the public `posts/{id}/replies` v1.1 endpoint.
const POST_COMMENTS_PATH_PATTERN =
	/^\/jetpack-premium-analytics\/v1\/proxy\/v1\.1\/posts\/\d+\/replies(?:\?|$)/;
const WP_SETTINGS_PATH = '/wp/v2/settings';
// Core posts endpoint: single-post highlight widgets read post content (title,
// permalink, image) from core since Stats rows lack it; only `include=` is handled here.
const WP_POSTS_PATH = '/wp/v2/posts';

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
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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
 * widget's loading, error, and empty UI. `error` is a permission-gated 403;
 * `error-retryable` is the proxy's `no_connection` 403 (which `describeError`
 * renders with Retry); `loading` never settles; `empty` resolves with no rows.
 */
export type ReportMockState = 'error' | 'error-retryable' | 'loading' | 'empty';

const mockStateOverrides = new Map< string, ReportMockState >();

/**
 * Clear cached queries after a forced mock override changes.
 *
 * Forced-state stories are excluded from autodocs, so clearing the shared cache
 * is safe and avoids coupling mocks to widget query keys.
 */
export function resetForcedStateQueries(): void {
	queryClient.clear();
}

/**
 * Force every request whose path contains `pathFragment` into a loading or error
 * state (or clear it with `null`), for a story's `beforeEach`. Keyed by path, so
 * scope stories that use it out of autodocs (`tags: [ '!autodocs' ]`) to avoid bleeding into siblings.
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
	resetForcedStateQueries();
}

/**
 * Story `beforeEach` that forces the shared `wordads/earnings` request into a
 * loading, error, or empty state, resetting its cache on both enter and cleanup.
 * The endpoint takes no params, so every WordAds story shares one static query
 * key — the reset avoids drift and clears a never-settling `loading` fetch before reuse.
 *
 * @param state - The forced mock state.
 * @return A Storybook `beforeEach` implementation returning its cleanup.
 */
export function forceWordAdsEarningsState( state: ReportMockState ) {
	return () => {
		setReportMockState( 'wordads/earnings', state );
		queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
		return () => {
			setReportMockState( 'wordads/earnings', null );
			queryClient.removeQueries( { queryKey: [ 'stats', 'wordads-earnings' ] } );
		};
	};
}

/**
 * Story `beforeEach` that forces the shared `stats/comments` request into a
 * loading, error, or empty state, resetting its cache on both enter and cleanup.
 * The endpoint is all-time, so every comment-widget story shares one static
 * query key — the reset avoids drift and clears a never-settling `loading` fetch before reuse.
 *
 * @param state - The forced mock state.
 * @return A Storybook `beforeEach` implementation returning its cleanup.
 */
export function forceStatsCommentsState( state: ReportMockState ) {
	return () => {
		setReportMockState( 'stats/comments', state );
		queryClient.removeQueries( { queryKey: [ 'stats', 'comments' ] } );
		return () => {
			setReportMockState( 'stats/comments', null );
			queryClient.removeQueries( { queryKey: [ 'stats', 'comments' ] } );
		};
	};
}

const mockResponseOverrides = new Map< string, unknown >();

/**
 * Force every request whose path contains `pathFragment` to resolve with a
 * specific payload (or clear with `null`) — unlike `setReportMockState`, this
 * swaps the response body for data-driven variants the default fixture doesn't cover. Same autodocs-scoping caveat applies.
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
	resetForcedStateQueries();
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
 * Builds a mock Stats "followers" (subscribers) response for the Latest
 * Subscribers widget. Rows arrive grouped by subscriber type rather than in
 * date order, and `total` exceeds them so the "N more" footer appears.
 *
 * @param max - Rows per type; `0` or a missing param returns every row.
 * @return Raw followers response.
 */
function buildFollowersResponse( max: number ) {
	const now = Date.now();
	const MINUTE = 60 * 1000;
	const HOUR = 60 * MINUTE;
	const DAY = 24 * HOUR;
	const emailPeople = [
		{ label: 'subscriber-one@example.com', offset: 120 * DAY },
		{ label: 'subscriber-two@example.com', offset: 240 * DAY },
		{ label: 'subscriber-three@example.com', offset: 300 * DAY },
		{ label: 'subscriber-four@example.com', offset: 330 * DAY },
		{ label: 'subscriber-five@example.com', offset: 400 * DAY },
		{ label: 'subscriber-six@example.com', offset: 430 * DAY },
	];
	const wpcomPeople = [
		{ label: 'Diego Morales', offset: 20 * 1000 },
		{ label: 'Olivia Park', offset: 12 * MINUTE },
		{ label: 'Hiroshi Tanaka', offset: HOUR },
		{ label: 'Emma Rossi', offset: 3 * HOUR },
		{ label: 'Aarav Patel', offset: 5 * HOUR },
		{ label: 'Sofia Nguyen', offset: DAY },
		{ label: 'Chloe Dubois', offset: 2 * DAY },
		{ label: 'Liam Carter', offset: 3 * DAY },
		{ label: 'Mia Andersson', offset: 4 * DAY },
		{ label: 'Noah Bergström', offset: 5 * DAY },
		{ label: 'Priya Sharma', offset: 6 * DAY },
		{ label: 'Tomás Silva', offset: 8 * DAY },
	];
	const page = ( people: typeof emailPeople ) => people.slice( 0, max > 0 ? max : undefined );
	const subscribers = [ ...page( emailPeople ), ...page( wpcomPeople ) ].map(
		( person, index ) => ( {
			ID: 1000 + index,
			subscription_id: 1000 + index,
			label: person.label,
			avatar: `https://i.pravatar.cc/64?img=${ 10 + index }`,
			url: 'https://example.com',
			date_subscribed: new Date( now - person.offset ).toISOString(),
		} )
	);
	return { subscribers, total: 30, total_email: 18, total_wpcom: 12, page: 1, pages: 5 };
}

/**
 * Builds the stats/subscribers time-series response. Values are anchored to each
 * bucket's absolute date so the current window trends above the previous one
 * (continuous across both windows, wavy so the comparison overlay reads clearly);
 * paid subscribers are always present so both chart lines are exercised.
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
		// Upward trend plus a ~44-day wave that doesn't align with a 30-day window, so
		// the previous-period series stays out of phase and its dashed line diverges visibly.
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
		// Newest first, as the live endpoint returns them. An oldest-first mock here
		// hid WOOA7S-1907.
		data: rows.reverse(),
	};
}

/**
 * Number of days a unit step spans, used to lay out mock visits buckets.
 */
const VISITS_STEP_DAYS: Record< string, number > = { day: 1, week: 7, month: 30, year: 365 };

/**
 * Build an hour-of-day response over the requested date range.
 */
function buildHourOfDayResponse( query: URLSearchParams ) {
	const endDate = parseDateParam( query.get( 'date' ), new Date() );
	const requestedDays = Number.parseInt( query.get( 'days' ) ?? '', 10 );
	const fallbackDays = Number.isInteger( requestedDays ) && requestedDays > 0 ? requestedDays : 30;
	const startDate = parseDateParam(
		query.get( 'start_date' ),
		new Date( endDate.getTime() - ( fallbackDays - 1 ) * DAY_MS )
	);
	const days = Math.max(
		1,
		Math.round( ( endDate.getTime() - startDate.getTime() ) / DAY_MS ) + 1
	);

	// Two peaks make the distribution easier to read in Storybook.
	const data = Array.from( { length: 24 }, ( _, hour ) => {
		const evening = 900 * Math.exp( -( ( hour - 19 ) ** 2 ) / 6 );
		const morning = 420 * Math.exp( -( ( hour - 10 ) ** 2 ) / 8 );

		return [ String( hour ).padStart( 2, '0' ), Math.round( ( 60 + evening + morning ) * days ) ];
	} );

	return {
		date: endDate.toISOString().slice( 0, 10 ),
		start_date: startDate.toISOString().slice( 0, 10 ),
		days,
		dimension: 'hour-of-day',
		utc_offset: '+00:00',
		fields: [ 'period', 'views' ],
		data,
	};
}

/**
 * The hourly slice of `stats/visits`: mirrors the real endpoint by packing date
 * and hour into a single `period` string (not split columns), with only Views
 * carrying a number — every other requested field comes back `null`.
 *
 * @param query   - Parsed query params (`start_date`, `quantity`, `stat_fields`).
 * @param fields  - The requested stat fields, in order.
 * @param endDate - The last bucket's instant.
 * @return Raw hourly visits response in the WPCOM matrix shape.
 */
function buildHourlyVisitsResponse( query: URLSearchParams, fields: string[], endDate: Date ) {
	// Counted from the range, as the endpoint does, not `quantity` — a range-bounded
	// request carries none, so reading it would peg every story to 24 buckets. `quantity` is the range-less fallback.
	const startDate = query.get( 'start_date' )
		? parseDateParam( query.get( 'start_date' ), endDate )
		: null;
	const spanHours = startDate
		? Math.floor( ( endDate.getTime() - startDate.getTime() ) / HOUR_MS ) + 1
		: Number( query.get( 'quantity' ) ) || 24;
	const count = Math.max( 1, Math.min( 400, spanHours ) );

	const rows = Array.from( { length: count }, ( _, index ) => {
		const bucket = new Date( endDate );
		bucket.setUTCHours( bucket.getUTCHours() - ( count - 1 - index ), 0, 0, 0 );

		const hour = bucket.getUTCHours();
		const period = `${ bucket.toISOString().slice( 0, 10 ) } ${ String( hour ).padStart(
			2,
			'0'
		) }:00:00`;
		// A daily rhythm — quiet overnight, busiest mid-afternoon — so the shape
		// reads as hourly traffic rather than noise.
		const views = Math.max(
			0,
			Math.round( 70 + 55 * Math.sin( ( ( hour - 4 ) / 24 ) * 2 * Math.PI ) + 8 * Math.cos( hour ) )
		);

		return [ period, ...fields.map( field => ( field === 'views' ? views : null ) ) ];
	} );

	return {
		date: endDate.toISOString().slice( 0, 10 ),
		unit: 'hour',
		fields: [ 'period', ...fields ],
		data: rows,
	};
}

/**
 * Builds the stats/visits time-series response for the traffic chart, honouring
 * `unit`/`date`/`start_date`/`stat_fields` and returning only the requested
 * fields (views/visitors and likes/comments are separate requests). Values are
 * anchored to each bucket's absolute date so the window trends above the comparison and the wavy series reads clearly.
 *
 * @param query - Parsed query params (`unit`, `date`, `start_date`, `stat_fields`).
 * @return Raw visits response in the WPCOM matrix shape.
 */
function buildVisitsResponse( query: URLSearchParams ) {
	const unit = query.get( 'unit' ) || 'day';
	const stepDays = VISITS_STEP_DAYS[ unit ] ?? 1;
	const fields = ( query.get( 'stat_fields' ) || 'views,visitors' ).split( ',' );
	const endDate = parseDateParam( query.get( 'date' ), new Date() );

	if ( unit === 'hour' ) {
		return buildHourlyVisitsResponse( query, fields, endDate );
	}

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
 * Builds a mock Stats "email summary" response matching what
 * `sanitizeStatsEmailSummaryResponse` expects (`{ posts: [...] }`); rates are
 * 0–100 percentages, rows are newest-first, and one subject carries HTML entities to mirror the live endpoint's encoding.
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
		{
			title: 'WordCamp Europe 2026: Talks &amp; Workshops You Shouldn&#8217;t Miss',
			opens_rate: 47.9,
			clicks_rate: 10.25,
		},
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
 * trailing path segment (`.../emails/{id}/{breakdown}`) selects the matching
 * fixture; the endpoints have no comparison period.
 *
 * @param requestPath - The request path, used to read the breakdown dimension.
 * @return Raw email breakdown response.
 */
function buildEmailBreakdownResponse( requestPath: string ): unknown {
	const path = requestPath.split( '?' )[ 0 ];
	const breakdown = path.split( '/' ).pop() ?? '';
	const isClicks = /\/clicks\/emails\//.test( path );

	switch ( breakdown ) {
		case 'country':
			return isClicks
				? scaleEmailBreakdown( mockEmailCountryBreakdown )
				: mockEmailCountryBreakdown;
		case 'device':
			return isClicks ? scaleEmailBreakdown( mockEmailDeviceBreakdown ) : mockEmailDeviceBreakdown;
		case 'client':
			return isClicks ? scaleEmailBreakdown( mockEmailClientBreakdown ) : mockEmailClientBreakdown;
		case 'link':
			return mockEmailInternalLinkBreakdown;
		case 'user-content-link':
			return mockEmailUserContentLinkBreakdown;
		default:
			return {};
	}
}

// Clicks are a fraction of opens, so the clicks breakdowns reuse the opens
// fixtures scaled down rather than carrying a second fixture per dimension.
const EMAIL_CLICKS_RATIO = 0.3;

function scaleEmailBreakdown< Fixture extends Record< string, unknown > >(
	fixture: Fixture
): Fixture {
	return Object.fromEntries(
		Object.entries( fixture ).map( ( [ key, section ] ) => {
			const data = ( section as { data?: unknown } )?.data;
			if ( ! Array.isArray( data ) ) {
				return [ key, section ];
			}
			return [
				key,
				{
					...( section as object ),
					data: data.map( row =>
						Array.isArray( row ) && typeof row[ 1 ] === 'number'
							? [ row[ 0 ], Math.round( row[ 1 ] * EMAIL_CLICKS_RATIO ) ]
							: row
					),
				},
			];
		} )
	) as Fixture;
}

/**
 * Routes a Stats sub-path to the matching mock generator.
 *
 * @param subPath     - Path relative to `STATS_API_BASE` (e.g. `/search-terms`).
 * @param requestPath - The full request path, including query parameters.
 * @return The mock response body, or `null` if no specific handler matched.
 */
function routeStatsReport( subPath: string, requestPath: string ): unknown {
	// Single-post detail — `stats/post/{id}`. Any ID resolves to the shared fixture,
	// but must echo the requested ID: widgets skeleton on a mismatch.
	const statsPost = subPath.match( /^\/post\/(\d+)/ );
	if ( statsPost ) {
		return {
			...mockStatsPostData,
			post: { ...mockStatsPostData.post, ID: Number( statsPost[ 1 ] ) },
		};
	}

	// Single-video detail: `/video/{postId}` (drives video detail widgets).
	if ( /^\/video\/\d+$/.test( subPath ) ) {
		return buildSingleVideoResponse( requestPath );
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
 * Parse the query string of a (possibly relative) apiFetch request path.
 *
 * @param requestPath - The request path, with or without a query string.
 * @return The parsed params, empty when the path carries none.
 */
function queryParamsOf( requestPath: string ): URLSearchParams {
	return new URLSearchParams( requestPath.split( '?' )[ 1 ] ?? '' );
}

/**
 * Builds a single-video response for the requested metric and window. Requests
 * with an explicit `start_date`/`date` window get fixture days inside it; others
 * (the embeds widget's default `period=month`) keep the default trailing 31-day
 * window. `statType=all` mirrors wpcom #229903: four-metric tuples plus range totals (retention play-weighted, not averaged).
 *
 * @param requestPath - The request path, used to read `statType` and the window.
 * @return Raw single-video response.
 */
function buildSingleVideoResponse( requestPath: string ) {
	const statType = getQueryParam( requestPath, 'statType' );
	const startDate = getQueryParam( requestPath, 'start_date' );
	const endDate = getQueryParam( requestPath, 'date' ) ?? getQueryParam( requestPath, 'end_date' );
	const windowDays =
		startDate && endDate
			? mockSingleVideoData.data.filter( ( [ day ] ) => day >= startDate && day <= endDate )
			: mockSingleVideoData.data.slice( -31 );

	if ( statType === 'all' ) {
		const rows = windowDays.map( ( [ period, value ], index ) => {
			const plays = Number( value );

			return [
				period,
				plays,
				Math.round( plays * 1.8 ),
				Number( ( plays * 0.05 ).toFixed( 1 ) ),
				Number( ( 52 + ( index % 7 ) * 2 ).toFixed( 1 ) ),
			] as [ string, number, number, number, number ];
		} );
		const totalPlays = rows.reduce( ( sum, row ) => sum + row[ 1 ], 0 );
		const total = {
			plays: totalPlays,
			impressions: rows.reduce( ( sum, row ) => sum + row[ 2 ], 0 ),
			watch_time: Number( rows.reduce( ( sum, row ) => sum + row[ 3 ], 0 ).toFixed( 1 ) ),
			retention_rate: Number(
				(
					rows.reduce( ( sum, row ) => sum + row[ 4 ] * row[ 1 ], 0 ) / ( totalPlays || 1 )
				).toFixed( 1 )
			),
		};

		return {
			...mockSingleVideoData,
			fields: [ 'period', 'plays', 'impressions', 'watch_time', 'retention_rate' ],
			data: rows,
			total,
		};
	}

	let factor = 1;
	if ( statType === 'impressions' ) {
		factor = 2;
	} else if ( statType === 'watch_time' ) {
		factor = 0.05;
	}

	return {
		...mockSingleVideoData,
		data: windowDays.map( ( [ period, value ] ) => [
			period,
			Number( ( Number( value ) * factor ).toFixed( 1 ) ),
		] ),
	};
}

/**
 * Scale factor for play counts based on how recent the window ends, so the
 * primary (recent) period reads higher than the comparison and the widget shows
 * growth. Recent windows return the full count; ~30+ days back tapers to ~70%.
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

	// `differenceInCalendarDays` counts whole calendar days, so the scaling (and
	// mocked counts) stay stable regardless of the machine's timezone.
	const daysAgo = Math.max( 0, differenceInCalendarDays( new Date(), end ) );

	return 1 - Math.min( daysAgo / 30, 1 ) * 0.3;
}

/**
 * Builds a mock Stats "video-plays" response matching what
 * `sanitizeStatsVideoPlaysResponse` reads (`days.<date>.plays[]`); play metrics
 * scale by window recency so the comparison period reads lower than the primary.
 *
 * @param requestPath - The request path, used to read the window's end date.
 * @return Raw video-plays response.
 */
function buildVideoPlaysResponse( requestPath: string ) {
	const endDate = getQueryParam( requestPath, 'end_date' ) ?? getQueryParam( requestPath, 'date' );
	const date = endDate ?? new Date().toISOString().slice( 0, 10 );
	const factor = playsFactorForWindow( endDate );
	const videos = [
		{ post_id: 101, title: 'Getting Started Walkthrough', plays: 3820, hours: 72.4 },
		{ post_id: 102, title: 'Product Launch Highlights', plays: 2640, hours: 51.8 },
		{ post_id: 103, title: 'Customer Story: Acme Co.', plays: 1980, hours: 38.2 },
		{ post_id: 104, title: 'How-To: Advanced Settings', plays: 1410, hours: 27.6 },
		{ post_id: 105, title: 'Behind the Scenes', plays: 980, hours: 18.9 },
		{ post_id: 106, title: 'Weekly Recap', plays: 540, hours: 10.7 },
		{ post_id: 107, title: '', plays: 320, hours: 6.1 },
	];
	const rows = videos.map( video => ( {
		post_id: video.post_id,
		title: video.title,
		url: `https://example.com/video/${ video.post_id }/`,
		plays: Math.round( video.plays * factor ),
		impressions: Math.round( video.plays * factor * 1.8 ),
		watch_time: Number( ( video.hours * factor ).toFixed( 1 ) ),
		retention_rate: Number( ( 67.6 * factor ).toFixed( 1 ) ),
	} ) );
	const completeStats = getQueryParam( requestPath, 'complete_stats' ) === '1';

	if ( completeStats ) {
		return {
			date,
			period: 'day',
			days: {
				summary: {
					data: rows.map( ( { plays, ...row } ) => ( { ...row, views: plays } ) ),
				},
			},
		};
	}

	// `summary.plays` feeds the summarized path (multi-day ranges set
	// `summarize=1`); `days.<date>.plays` covers the single-day path.
	return { date, period: 'day', summary: { plays: rows }, days: { [ date ]: { plays: rows } } };
}

/**
 * Builds the wordads/stats time-series response for the WordAds chart tabs,
 * honouring `unit`/`date`/`quantity` and returning the raw WPCOM matrix shape.
 * Impressions anchor to each bucket's date so the window trends above the
 * comparison; revenue derives from impressions and a wavy CPM so all three metrics move together.
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

/**
 * Builds the wordads/earnings response. All-time totals (not period-scoped):
 * `total_earnings`/`total_amount_owed` feed the Earnings/Paid/Outstanding cards
 * (paid = earnings − owed), and all three breakdowns are populated, covering every payment status, so the history tables render fully by default.
 *
 * @return Raw wordads/earnings response in the WPCOM shape.
 */
function buildWordAdsEarningsResponse() {
	return {
		earnings: {
			total_earnings: 1284.57,
			total_amount_owed: 342.19,
			wordads: {
				'2026-02': { amount: '96.80', pageviews: 71178, status: 1 },
				'2026-03': { amount: '79.51', pageviews: 64642, status: 1 },
				'2026-04': { amount: '75.67', pageviews: 62021, status: 1 },
				'2026-05': { amount: '129.24', pageviews: 84470, status: 1 },
				'2026-06': { amount: '75.99', pageviews: 59367, status: 0 },
				'2026-07': { amount: '90.31', pageviews: 65921, status: 0 },
			},
			sponsored: {
				'2026-07': { amount: '44.14', pageviews: 14332, status: 3 },
				'2026-06': { amount: '28.23', pageviews: 8580, status: 4 },
			},
			adjustment: {
				'2026-04': { amount: '2.47', pageviews: 0, status: 2 },
				'2026-02': { amount: '3.32', pageviews: 0, status: 1 },
			},
		},
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
			if ( requestPath.startsWith( STATS_VIEWS_BY_HOUR_PATH ) ) {
				// `sanitizeStatsHourOfDayResponse` throws on any other `dimension`, so the
				// generic empty payload below would render the error state here instead.
				return {
					date: '2026-01-01',
					start_date: '2025-12-03',
					days: 30,
					dimension: 'hour-of-day',
					fields: [ 'period', 'views' ],
					data: [],
				};
			}
			// A valid response with no rows across the shapes report sanitizers read
			// (`summary` / `days` / `data`), so the widget resolves to its empty state.
			return { date: '2026-01-01', period: 'day', summary: {}, days: {}, data: [] };
		}
		if ( state === 'error-retryable' ) {
			// The local proxy's `no_connection` shape: still a 403, so the error UI shows
			// at once, but `describeError` keeps it retryable since a broken connection can heal.
			return Promise.reject( {
				code: 'no_connection',
				message: 'Mocked connection failure for Storybook.',
				data: { status: 403 },
			} );
		}
		// The WPCOM pass-through error envelope. A 403 isn't retried by
		// `shouldRetryApiError`, so the error UI shows at once; `describeError` reads it as a permission gate and drops Retry.
		return Promise.reject( {
			error: 'unauthorized',
			message: 'Mocked error response for Storybook.',
			status: 403,
		} );
	}

	if ( requestPath.startsWith( WP_SETTINGS_PATH ) ) {
		return coreSettingsMock;
	}

	if ( requestPath.startsWith( WP_POSTS_PATH ) ) {
		const includeParam = getQueryParam( requestPath, 'include' );

		if ( includeParam ) {
			return buildPostContentResponse( includeParam );
		}

		return next( options );
	}

	if ( requestPath.startsWith( STATS_FOLLOWERS_PATH ) ) {
		const queryIndex = requestPath.indexOf( '?' );
		const query = new URLSearchParams(
			queryIndex === -1 ? '' : requestPath.slice( queryIndex + 1 )
		);
		return buildFollowersResponse( Number( query.get( 'max' ) ) );
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

	if ( requestPath.startsWith( STATS_VIEWS_BY_HOUR_PATH ) ) {
		return buildHourOfDayResponse( queryParamsOf( requestPath ) );
	}

	if ( requestPath.startsWith( STATS_VISITS_PATH ) ) {
		return buildVisitsResponse( queryParamsOf( requestPath ) );
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

	if ( POST_LIKES_PATH_PATTERN.test( requestPath ) ) {
		return mockPostLikesData;
	}

	if ( POST_COMMENTS_PATH_PATTERN.test( requestPath ) ) {
		return mockPostCommentsData;
	}

	if ( requestPath.startsWith( STATS_WORDADS_STATS_PATH ) ) {
		const queryIndex = requestPath.indexOf( '?' );
		return buildWordAdsStatsResponse(
			new URLSearchParams( queryIndex === -1 ? '' : requestPath.slice( queryIndex + 1 ) )
		);
	}

	if ( requestPath.startsWith( STATS_WORDADS_EARNINGS_PATH ) ) {
		return buildWordAdsEarningsResponse();
	}

	if ( requestPath.startsWith( STATS_API_BASE ) ) {
		const subPath = requestPath.slice( STATS_API_BASE.length ).split( '?' )[ 0 ];

		// Per-post email timelines — `/opens|clicks/emails/<postId>` with
		// `stats_fields=timeline`. Matched here, not in routeStatsReport(), since buckets read period/quantity/date off the query.
		const emailTimeline = subPath.match( /^\/(opens|clicks)\/emails\/\d+$/ );
		if ( emailTimeline && getQueryParam( requestPath, 'stats_fields' ) === 'timeline' ) {
			return buildEmailTimelineResponse( emailTimeline[ 1 ] as 'opens' | 'clicks', requestPath );
		}

		const response = routeStatsReport( subPath, requestPath );

		if ( response !== null ) {
			return response;
		}

		// Unrouted Stats endpoints may be owned by the legacy mocks (register-stats-mocks.ts);
		// fall through so middleware registration order doesn't decide whether they load.
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
