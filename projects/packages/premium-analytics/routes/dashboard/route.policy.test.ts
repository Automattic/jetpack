/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { dispatch } from '@wordpress/data';
import { getSettings, setSettings } from '@wordpress/date';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { planGatesScriptData } from '../../tests/js/plan-gates-test-utils';
import { DATE_WINDOW_NOTICE_STATE } from '../date-window-notice';
import { route as postRoute } from '../post-detail/route';
import { route as reportRoute } from '../reports/route';
import { DATE_FILTER_RANGE, type DashboardSection } from './config';
import { route } from './route';
import { dateWindowForSectionSwitch } from './section-date-window';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
// Lazy: the real store modules import this package while it is still loading.
jest.mock( '@jetpack-premium-analytics/data', () => {
	const actual = () => jest.requireActual( '@jetpack-premium-analytics/data' );
	return new Proxy(
		{},
		{
			get: ( _target, name ) =>
				name === 'ensureCoreSettingsReady' ? () => Promise.resolve() : actual()[ name as string ],
		}
	);
} );
jest.mock( '../site-readiness', () => ( {
	...jest.requireActual( '../site-readiness' ),
	isPremiumAnalyticsSiteConnected: () => true,
} ) );
jest.mock( '../reports/registry', () => ( {
	getReportDefinition: ( id?: string ) =>
		( {
			posts: { dashboardSection: 'traffic', feature: 'top-posts' },
			referrers: { dashboardSection: 'traffic', feature: 'referrers' },
		} )[ id ?? '' ] ?? {},
} ) );
jest.mock( '../post-detail/config', () => ( { resolveTabId: ( section: string ) => section } ) );
jest.mock( '@wordpress/route', () => ( {
	redirect: ( options: object ) => ( { isRedirect: true, ...options } ),
} ) );

type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

const DATE_SETTINGS = getSettings();
const FREE_LOCKS = [ 'recent-7-days', 'long-date-presets', 'intervals', 'csv' ];
const LEGACY_BASIC_LOCKS = [ 'long-date-presets', 'intervals', 'csv' ];

type Search = Record< string, unknown >;

/**
 * Follow the route's redirects until it lets a search load.
 *
 * @param search - The search the reader opens.
 * @param load   - The route's `beforeLoad`, given a search.
 * @return The search that loads, how many redirects it took, and the notice the last one carried.
 */
async function settle(
	search: Search,
	load = ( next: Search ) => route.beforeLoad( { search: next } as never )
) {
	let current = search;
	let notice: unknown;
	for ( let hops = 0; hops < 3; hops++ ) {
		try {
			await load( current );
			return { search: current, hops, notice };
		} catch ( thrown ) {
			expect( thrown ).toMatchObject( { isRedirect: true, replace: true, viewTransition: false } );
			const redirected = thrown as { search: Search; state?: Search };
			current = redirected.search;
			notice = redirected.state?.[ DATE_WINDOW_NOTICE_STATE ];
		}
	}
	throw new Error( `Still redirecting after 3 hops: ${ JSON.stringify( current ) }` );
}

const loadPost = ( next: Search ) =>
	postRoute.beforeLoad( { params: { postId: '42' }, search: next } as never );
const loadPostsReport = ( next: Search ) =>
	reportRoute.beforeLoad( { params: { report: 'posts' }, search: next } as never );

const setLocks = ( ...features: string[] ) =>
	( getScriptData as jest.Mock ).mockReturnValue(
		planGatesScriptData( features, [ 'traffic', 'store' ] )
	);

beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
} );

afterEach( () => {
	jest.useRealTimers();
	setSettings( DATE_SETTINGS );
	rememberPreset( undefined );
} );

/**
 * Remember the preset the reader last applied.
 *
 * @param preset - The preset, or undefined to forget it.
 */
function rememberPreset( preset: string | undefined ) {
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		'datePreset',
		preset
	);
}

describe.each( [
	[ 'Asia/Taipei', 8, '2026-10-09T00:00:00.000+08:00' ],
	[ '', 13, '2026-10-10T00:00:00.000+13:00' ],
] )( 'on a free site reporting in "%s" (offset %d)', ( string, offset, weekStart ) => {
	beforeEach( () => {
		setSettings( {
			...DATE_SETTINGS,
			timezone: { string, offset, offsetFormatted: String( offset ), abbr: '' },
		} );
	} );

	it.each( [
		[
			'an old deep link',
			{ from: '2025-01-01', to: '2025-01-31', interval: 'day' },
			'recent-7-days',
		],
		[ 'a bare locked preset', { preset: 'last-90-days' }, 'recent-7-days' ],
		[
			'a comparison',
			{
				preset: 'last-7-days',
				comp: '1',
				compare_from: '2026-10-01',
				compare_to: '2026-10-07',
			},
			undefined,
		],
	] )( 'settles %s within two redirects', async ( _name, search, notice ) => {
		setLocks( ...FREE_LOCKS );

		const settled = await settle( search );

		expect( settled.hops ).toBeLessThanOrEqual( 2 );
		expect( settled.search ).toMatchObject( { preset: 'last-7-days', from: weekStart } );
		expect( settled.search ).not.toHaveProperty( 'comp' );
		expect( settled.notice ).toBe( notice );
	} );
} );

describe( 'the date-limit notice on a free site', () => {
	beforeEach( () => setLocks( ...FREE_LOCKS ) );

	it( 'opens a post from a report on the plan window without a notice', async () => {
		const settled = await settle(
			{ from: '2025-01-01', to: '2025-01-31', interval: 'day', ref: 'posts' },
			loadPost
		);

		expect( settled.hops ).toBe( 1 );
		expect( settled.search ).toMatchObject( { preset: 'last-7-days', post_id: '42' } );
		expect( settled.notice ).toBeUndefined();
	} );

	it( 'tells the reader why a shared link to a post moved to the last 7 days', async () => {
		const settled = await settle(
			{ from: '2025-01-01', to: '2025-01-31', interval: 'day', post_id: '42' },
			loadPost
		);

		expect( settled.search ).toMatchObject( { preset: 'last-7-days' } );
		expect( settled.notice ).toBe( 'recent-7-days' );
	} );

	it( 'leaves a post open when its report’s tab does not follow the plan', async () => {
		const { premium_analytics: data } = planGatesScriptData( FREE_LOCKS );
		( getScriptData as jest.Mock ).mockReturnValue( {
			premium_analytics: { ...data, plan_date_limited_sections: [] },
		} );
		const link = { from: '2025-01-01', to: '2025-01-31', interval: 'day', post_id: '42' };

		const settled = await settle( link, loadPost );

		expect( settled.search ).toMatchObject( { from: '2025-01-01', to: '2025-01-31' } );
		expect( settled.notice ).toBeUndefined();
	} );

	it( 'stays quiet on a report the plan locks, since it shows no window', async () => {
		setLocks( ...FREE_LOCKS, 'referrers' );

		const settled = await settle( { from: '2025-01-01', to: '2025-01-31', interval: 'day' }, next =>
			reportRoute.beforeLoad( { params: { report: 'referrers' }, search: next } as never )
		);

		expect( settled.notice ).toBeUndefined();
	} );
} );

it.each( [
	[ 'tells the reader why a shared all-time link moved', {}, 'long-date-presets' ],
	[ 'opens all time carried over from Insights quietly', { ds: 'insights' }, undefined ],
] )( 'on a legacy-basic report, %s', async ( _name, origin, notice ) => {
	setLocks( ...LEGACY_BASIC_LOCKS );

	const settled = await settle( { ...ALL_TIME, ...origin }, loadPostsReport );

	expect( settled.search ).not.toMatchObject( { preset: 'all-time' } );
	expect( settled.notice ).toBe( notice );
} );

it( 'opens a report on its default, without a notice, for a year carried over from Insights', async () => {
	setLocks( ...LEGACY_BASIC_LOCKS );

	const settled = await settle( { preset: 'year-2025', ds: 'insights' }, loadPostsReport );

	expect( settled.search ).not.toMatchObject( { preset: 'year-2025' } );
	expect( settled.notice ).toBeUndefined();
} );

it.each( [
	[ 'weeks', { from: '2026-01-01', to: '2026-06-30', interval: 'week' } ],
	[ 'no interval', { from: '2026-01-01', to: '2026-06-30' } ],
] )( 'settles a long legacy-basic range given %s', async ( _name, search ) => {
	setLocks( ...LEGACY_BASIC_LOCKS );

	const settled = await settle( search );

	expect( settled.hops ).toBeLessThanOrEqual( 2 );
	expect( settled.search ).toMatchObject( { from: '2026-01-01', interval: 'day' } );
} );

it( 'tells a legacy-basic reader why a locked deep link opens on the last 30 days', async () => {
	setLocks( ...LEGACY_BASIC_LOCKS );

	const settled = await settle( { preset: 'last-12-months' } );

	expect( settled.search ).toMatchObject( { preset: 'last-30-days' } );
	expect( settled.notice ).toBe( 'long-date-presets' );
} );

const ALL_TIME = { preset: 'all-time', from: '2005-01-01', to: '2026-10-15' };
const YEAR_2025 = { preset: 'year-2025', from: '2025-01-01', to: '2025-12-31' };

const TRAFFIC = {
	id: 'traffic',
	slug: 'traffic',
	label: 'Traffic',
	order: 0,
	date_filter: DATE_FILTER_RANGE,
	default_layout: [],
} as DashboardSection;

it.each( [
	[
		'year to date',
		{
			preset: 'year-to-date',
			from: '2026-01-01T00:00:00',
			to: '2026-10-15T23:59:59',
			interval: 'month',
		},
	],
	[
		'a compared yesterday',
		{
			preset: 'yesterday',
			from: '2026-10-14T00:00:00',
			to: '2026-10-14T23:59:59',
			interval: 'hour',
			comp: '1',
			compare_from: '2026-10-13T00:00:00',
			compare_to: '2026-10-13T23:59:59',
			compare_preset: 'previous-period',
		},
	],
] )(
	'switches a free site from Store on %s to Traffic without a redirect',
	async ( _name, store ) => {
		setLocks( ...FREE_LOCKS );

		const settled = await settle( {
			...store,
			...dateWindowForSectionSwitch( 'traffic', TRAFFIC, { ...store, section: 'store' } ),
			section: 'traffic',
		} );

		expect( settled.hops ).toBe( 0 );
	}
);

it.each( [
	[
		'legacy basic',
		'all time',
		LEGACY_BASIC_LOCKS,
		ALL_TIME,
		'year-to-date',
		'last-30-days',
		'previous-period',
	],
	[ 'free', 'all time', FREE_LOCKS, ALL_TIME, 'year-to-date', 'last-7-days', undefined ],
	[ 'free', 'all time', FREE_LOCKS, ALL_TIME, 'yesterday', 'yesterday', undefined ],
	[ 'free', 'a year', FREE_LOCKS, YEAR_2025, 'yesterday', 'yesterday', undefined ],
] )(
	'opens %s Traffic on its default window when Insights hands it %s and %s is remembered',
	async ( _plan, _window, features, window, remembered, preset, comparePreset ) => {
		setLocks( ...features );
		rememberPreset( remembered );

		const settled = await settle( {
			...window,
			interval: 'month',
			section: 'traffic',
			comp: '1',
			compare_from: '2023-01-01',
			compare_to: '2023-12-31',
			compare_preset: 'previous-period',
		} );

		expect( settled.hops ).toBe( 1 );
		expect( settled.search ).toMatchObject( { section: 'traffic', preset } );
		expect( settled.search.compare_preset ).toBe( comparePreset );
		expect( settled.search.comp ).toBe( comparePreset && '1' );
		expect( settled.notice ).toBeUndefined();
	}
);

it( "keeps an open plan on Insights' month window when it reaches Traffic", async () => {
	setLocks();

	const settled = await settle( { ...ALL_TIME, interval: 'month', section: 'traffic' } );

	expect( settled.hops ).toBe( 0 );
	expect( settled.search ).toMatchObject( { preset: 'all-time', interval: 'month' } );
} );

it( 'loads the Store tab as asked', async () => {
	setLocks( 'recent-7-days' );

	const search = {
		from: '2026-07-01',
		to: '2026-09-30',
		interval: 'week',
		section: 'store',
	};

	await expect( settle( search ) ).resolves.toEqual( { search, hops: 0 } );
} );
