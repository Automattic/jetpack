/**
 * Jest-mocked `apiClient` that defers to the in-memory state in `handlers.ts`.
 *
 * Usage (matches the conventions doc §11 — mock at the apiFetch/apiClient
 * boundary):
 *
 *   jest.mock( '@/lib/api-client', () =>
 *     jest.requireActual( '../../tests/js/mocks/api-client' )
 *   );
 *
 * Failure paths override per-call:
 *
 *   ( apiClient.get as jest.Mock ).mockRejectedValueOnce( {
 *     code: 'akismet_unavailable', message: 'down', data: { status: 503 },
 *   } );
 *
 * `mockClear()` runs between tests via `tests/js/setup.ts` so the call history
 * is reset alongside the state store.
 */

import { getMockState, setMockState } from './handlers';
import type { WpError } from '../../../src/lib/api-client';
import type { AkismetSettings } from '../../../src/lib/types';

/**
 *
 * @param path
 */
function notFound( path: string ): WpError {
	return {
		code: 'rest_no_route',
		message: `Unhandled mock endpoint: ${ path }`,
		data: { status: 404 },
	};
}

/**
 *
 * @param code
 * @param message
 */
function badRequest( code: string, message: string ): WpError {
	return { code, message, data: { status: 400 } };
}

/**
 *
 * @param endpoint
 */
async function fakeGet< T >( endpoint: string ): Promise< T > {
	const state = getMockState();
	switch ( endpoint ) {
		case 'key':
			return { key: state.key, valid: state.keyValid } as unknown as T;
		case 'settings':
			return state.settings as unknown as T;
		case 'jetpack-key':
			// Default: Jetpack not active. Tests override per-call when they
			// need a different shape.
			throw {
				code: 'no_jetpack',
				message: 'Jetpack is not active.',
				data: { status: 400 },
			} satisfies WpError;
	}

	// Plan 2 — Overview tab data sources. Paths carry query strings; match
	// by prefix and parse out the params we care about.
	if ( endpoint.startsWith( 'stats/timeseries' ) ) {
		const interval = parseQs( endpoint ).interval ?? '30-days';
		return fakeStatsTimeseries( interval ) as unknown as T;
	}
	if ( endpoint.startsWith( 'stats/' ) ) {
		const interval = endpoint.slice( 'stats/'.length );
		return fakeStatsTotals( interval ) as unknown as T;
	}
	if ( endpoint.startsWith( 'blackbox/aggregates' ) ) {
		const params = parseQs( endpoint );
		return fakeBlackboxAggregates(
			params.category ?? 'logins',
			params.interval ?? '30-days'
		) as unknown as T;
	}
	if ( endpoint.startsWith( 'woocommerce/fraud-summary' ) ) {
		const params = parseQs( endpoint );
		return fakeWooFraud( params.interval ?? '30-days' ) as unknown as T;
	}

	throw notFound( endpoint );
}

/**
 * Tiny query-string parser for the fake apiClient. Real apiClient builds
 * URLs with `encodeURIComponent`, so a `?key=value&key2=value2` split is
 * enough here.
 *
 * @param endpoint - Path with optional `?…` suffix.
 * @return Map of decoded key/value pairs.
 */
function parseQs( endpoint: string ): Record< string, string > {
	const qIndex = endpoint.indexOf( '?' );
	if ( qIndex === -1 ) {
		return {};
	}
	const out: Record< string, string > = {};
	for ( const pair of endpoint.slice( qIndex + 1 ).split( '&' ) ) {
		const [ k, v = '' ] = pair.split( '=' );
		out[ decodeURIComponent( k ) ] = decodeURIComponent( v );
	}
	return out;
}

/**
 * Comments-stats totals fixture. Default reflects the PHP mock contract
 * (`preview: true`); a per-interval override in `MockState.stats` wins.
 *
 * @param interval - Interval id.
 * @return Stats totals fixture.
 */
function fakeStatsTotals( interval: string ) {
	const override = getMockState().stats[ interval ] ?? {};
	return {
		interval,
		spam: override.spam ?? 1234,
		ham: override.ham ?? 187,
		missed_spam: override.missed_spam ?? 6,
		false_positives: override.false_positives ?? 2,
		accuracy: 99.7,
		time_saved: ( override.spam ?? 1234 ) * 30,
		preview: override.preview ?? true,
		generated_at: '2026-05-27T12:00:00Z',
	};
}

/**
 * Comments-stats time series fixture. Returns 3 deterministic buckets so
 * the sparkline has something to render in unit tests.
 *
 * @param interval - Interval id.
 * @return Time series fixture.
 */
function fakeStatsTimeseries( interval: string ) {
	const series = [
		{ date: '2026-05-25', spam: 30, ham: 4, missed_spam: 0, false_positives: 0 },
		{ date: '2026-05-26', spam: 45, ham: 3, missed_spam: 1, false_positives: 0 },
		{ date: '2026-05-27', spam: 22, ham: 2, missed_spam: 0, false_positives: 0 },
	];
	return {
		interval,
		bucket: 'day',
		series,
		totals: {
			spam: 97,
			ham: 9,
			missed_spam: 1,
			false_positives: 0,
			accuracy: 99.06,
			time_saved: 97 * 30,
		},
		preview: true,
		generated_at: '2026-05-27T12:00:00Z',
	};
}

/**
 * Blackbox-aggregates fixture. Default mirrors the deterministic-mock
 * branch on the PHP handler (`preview: true`); per-cell overrides win.
 *
 * @param category - Blackbox category id.
 * @param interval - Interval id.
 * @return Aggregates fixture.
 */
function fakeBlackboxAggregates( category: string, interval: string ) {
	const override = getMockState().blackboxAggregates[ `${ category }|${ interval }` ] ?? {};
	return {
		category,
		interval,
		blocked: override.blocked ?? 420,
		challenged: override.challenged ?? 130,
		passed: override.passed ?? 110,
		series: [
			{ date: '2026-05-25', blocked: 12, challenged: 4, passed: 3 },
			{ date: '2026-05-26', blocked: 17, challenged: 6, passed: 2 },
			{ date: '2026-05-27', blocked: 8, challenged: 2, passed: 1 },
		],
		preview: override.preview ?? true,
		generated_at: '2026-05-27T12:00:00Z',
	};
}

/**
 * WooCommerce fraud-summary fixture. Mirrors `wfp_active: true` in the
 * default — flip via override when a test wants the preview-badged shape.
 *
 * @param interval - Interval id.
 * @return WC fraud fixture.
 */
function fakeWooFraud( interval: string ) {
	const override = getMockState().wooFraud[ interval ] ?? {};
	const wfpActive = override.wfp_active ?? true;
	return {
		interval,
		orders_flagged: override.orders_flagged ?? 38,
		blocked_checkouts: override.blocked_checkouts ?? 120,
		estimated_chargebacks_averted_usd: override.estimated_chargebacks_averted_usd ?? 4200,
		top_signals: [
			{ name: 'avs_mismatch', count: 22 },
			{ name: 'high_risk_geo', count: 14 },
			{ name: 'velocity_threshold', count: 9 },
			{ name: 'card_testing_pattern', count: 6 },
			{ name: 'proxy_or_vpn', count: 4 },
		],
		wfp_active: wfpActive,
		preview: override.preview ?? ! wfpActive,
		generated_at: '2026-05-27T12:00:00Z',
	};
}

/**
 *
 * @param endpoint
 * @param body
 */
async function fakePost< T >(
	endpoint: string,
	body: Record< string, unknown > | undefined
): Promise< T > {
	if ( endpoint === 'key' ) {
		const key = String( body?.key ?? '' );
		if ( key.length < 6 ) {
			throw badRequest( 'akismet_invalid_key', 'Invalid key.' );
		}
		setMockState( { key, keyValid: true } );
		return { key, valid: true } as unknown as T;
	}
	throw notFound( endpoint );
}

/**
 *
 * @param endpoint
 * @param body
 */
async function fakePut< T >(
	endpoint: string,
	body: Record< string, unknown > | undefined
): Promise< T > {
	if ( endpoint === 'settings' ) {
		const patch = ( body ?? {} ) as Partial< AkismetSettings >;
		const next = { ...getMockState().settings, ...patch };
		setMockState( { settings: next } );
		return next as unknown as T;
	}
	throw notFound( endpoint );
}

/**
 *
 * @param endpoint
 */
async function fakeDelete< T >( endpoint: string ): Promise< T > {
	if ( endpoint === 'key' ) {
		setMockState( { key: '', keyValid: false } );
		return { success: true } as unknown as T;
	}
	throw notFound( endpoint );
}

export const apiClient = {
	get: jest.fn( fakeGet ) as jest.MockedFunction< typeof fakeGet > & {
		< T = unknown >( endpoint: string ): Promise< T >;
	},
	post: jest.fn( fakePost ) as jest.MockedFunction< typeof fakePost > & {
		< T = unknown >( endpoint: string, data?: Record< string, unknown > ): Promise< T >;
	},
	put: jest.fn( fakePut ) as jest.MockedFunction< typeof fakePut > & {
		< T = unknown >( endpoint: string, data?: Record< string, unknown > ): Promise< T >;
	},
	delete: jest.fn( fakeDelete ) as jest.MockedFunction< typeof fakeDelete > & {
		< T = unknown >( endpoint: string ): Promise< T >;
	},
};

export type { WpError };
export type { ApiKeyState, AkismetSettings } from '../../../src/lib/types';

/**
 * Reset all fake fn call history. Called from `tests/js/setup.ts`.
 *
 * The default fake implementations are reinstated after the clear so tests
 * that don't override get the state-aware defaults.
 */
export function __resetApiClientMocks(): void {
	apiClient.get.mockReset();
	apiClient.get.mockImplementation( fakeGet );
	apiClient.post.mockReset();
	apiClient.post.mockImplementation( fakePost );
	apiClient.put.mockReset();
	apiClient.put.mockImplementation( fakePut );
	apiClient.delete.mockReset();
	apiClient.delete.mockImplementation( fakeDelete );
}
