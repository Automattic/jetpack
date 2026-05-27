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
	if ( endpoint.startsWith( 'activity' ) ) {
		const params = parseQs( endpoint );
		return fakeActivity( params ) as unknown as T;
	}
	if ( endpoint.startsWith( 'blackbox/verdict/' ) ) {
		const sessionId = endpoint.slice( 'blackbox/verdict/'.length );
		return fakeBlackboxVerdict( sessionId ) as unknown as T;
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
 * Activity-row fixture set (Plan 3). Built once per call, deterministic
 * across categories. The shape mirrors the PHP union-query response in
 * `Akismet_Experimental_Activity::query()`.
 *
 * @param params - Decoded query string parameters from the endpoint URL.
 * @return Paginated activity response.
 */
function fakeActivity( params: Record< string, string > ) {
	const category = params.category ?? 'all';
	const outcome = params.outcome ?? 'all';
	const source = params.source ?? 'all';
	const search = params.search ?? '';
	const page = Math.max( 1, parseInt( params.page ?? '1', 10 ) );
	const perPage = Math.max( 1, Math.min( 100, parseInt( params.per_page ?? '25', 10 ) ) );

	type Row = ReturnType< typeof makeRow >;
	const counts: Record< string, number > = {
		comments: 3, // small real-ish set so the test fixture stays cheap
		forms: 18,
		logins: 24,
		bots: 31,
		'brute-force': 12,
		checkouts: 9,
	};

	const out: Row[] = [];
	const cats = [ 'comments', 'forms', 'logins', 'checkouts', 'bots', 'brute-force' ];
	for ( const c of cats ) {
		if ( category !== 'all' && category !== c ) {
			continue;
		}
		for ( let i = 0; i < counts[ c ]; i++ ) {
			out.push( makeRow( c, i ) );
		}
	}

	let rows = out;
	if ( outcome !== 'all' ) {
		rows = rows.filter( r => r.outcome === outcome );
	}
	if ( source !== 'all' ) {
		rows = rows.filter( r => r.source === source );
	}
	if ( search ) {
		const needle = search.toLowerCase();
		rows = rows.filter( r =>
			( r.subject.label + ' ' + ( r.subject.secondary ?? '' ) ).toLowerCase().includes( needle )
		);
	}

	rows.sort( ( a, b ) => ( a.timestamp < b.timestamp ? 1 : -1 ) );

	const total = rows.length;
	const offset = ( page - 1 ) * perPage;
	const items = rows.slice( offset, offset + perPage );

	return {
		items,
		total,
		page,
		per_page: perPage,
		total_pages: total > 0 ? Math.ceil( total / perPage ) : 0,
	};
}

/**
 * Build one fake ActivityRow. Comments are 'real' (preview:false);
 * everything else is preview:true to match the PHP union default.
 *
 * @param category - Category id.
 * @param i        - Row index.
 * @return A fixture row.
 */
function makeRow( category: string, i: number ) {
	const id = `${ category }-${ i }`;
	const override = getMockState().activityOverrides[ id ] ?? {};
	const isComment = category === 'comments';

	const sourcesByCategory: Record< string, string[] > = {
		comments: [ 'akismet-content' ],
		forms: [ 'akismet-content', 'blackbox-behavioral' ],
		logins: [ 'blackbox-behavioral', 'blackbox-fingerprint' ],
		bots: [ 'blackbox-edge', 'blackbox-fingerprint' ],
		'brute-force': [ 'blackbox-behavioral' ],
		checkouts: [ 'woocommerce-fraud', 'blackbox-fingerprint' ],
	};
	const sources = sourcesByCategory[ category ] ?? [ 'akismet-rules' ];
	const outcomes = [ 'block', 'challenge-passed', 'challenge-failed', 'allowed-but-flagged' ];

	const subject = ( () => {
		switch ( category ) {
			case 'comments':
				return {
					kind: 'comment' as const,
					label: `Spammer ${ i + 1 }`,
					secondary: `Comment on “Hello world ${ i + 1 }”`,
				};
			case 'forms':
				return {
					kind: 'form-submission' as const,
					label: `Form submission #${ i + 1 }`,
					secondary: 'contact-form-7',
				};
			case 'logins':
				return {
					kind: 'login-attempt' as const,
					label: `admin (attempt #${ i + 1 })`,
					secondary: 'wp-login.php',
				};
			case 'bots':
				return {
					kind: 'visitor' as const,
					label: `Crawler ${ i + 1 }`,
					secondary: '/wp-json/wp/v2/posts',
				};
			case 'brute-force':
				return {
					kind: 'login-attempt' as const,
					label: `user-${ i + 1 }`,
					secondary: '142 attempts in 60s',
				};
			case 'checkouts':
				return {
					kind: 'order' as const,
					label: `Order #${ 1000 + i }`,
					secondary: `$${ 50 + i * 11 }.00`,
				};
			default:
				return { kind: 'visitor' as const, label: 'unknown' };
		}
	} )();

	return {
		id,
		timestamp: `2026-05-${ String( 27 - ( i % 27 ) ).padStart( 2, '0' ) }T12:00:00Z`,
		category,
		source: override.source ?? sources[ i % sources.length ],
		outcome: override.outcome ?? outcomes[ i % outcomes.length ],
		subject,
		signals: [
			{
				name: `${ category }_mock_signal`,
				weight: 0.5 + ( i % 5 ) * 0.1,
				description: `Preview signal for ${ category }.`,
			},
		],
		ip: `10.0.${ i % 256 }.${ ( i * 7 ) % 256 }`,
		visitor_id: isComment ? null : `bbx_preview_${ category }_${ i }`,
		context: isComment ? { comment_id: i + 1 } : {},
		preview: override.preview ?? ! isComment,
	};
}

/**
 * Per-session Blackbox verdict fixture (Plan 3).
 *
 * @param sessionId - Opaque session id.
 * @return Verdict fixture.
 */
function fakeBlackboxVerdict( sessionId: string ) {
	const override = getMockState().blackboxVerdicts[ sessionId ] ?? {};
	const decisions = [ 'allow', 'challenge', 'block' ] as const;
	// Stable per session: hash by character codes so a given id always
	// gets the same decision in tests (no randomness).
	const seed = sessionId.split( '' ).reduce( ( acc, ch ) => acc + ch.charCodeAt( 0 ), 0 );
	return {
		session_id: sessionId,
		decision: override.decision ?? decisions[ seed % decisions.length ],
		risk_score: override.risk_score ?? Math.round( ( ( seed % 100 ) / 100 ) * 100 ) / 100,
		confidence: 'medium',
		visitor_id: sessionId,
		ip_address: `10.0.${ seed % 255 }.${ ( seed * 3 ) % 255 }`,
		signals: [
			{
				name: 'velocity_threshold',
				log_odds: 2.4,
				confidence: 0.86,
				category: 'velocity',
				rule_id: 'velocity_v3',
				rule_version: '3.1.0',
			},
			{
				name: 'webdriver_detected',
				log_odds: 4.1,
				confidence: 0.99,
				category: 'automation',
				rule_id: 'webdriver_v2',
				rule_version: '2.0.0',
			},
		],
		preview: override.preview ?? true,
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
