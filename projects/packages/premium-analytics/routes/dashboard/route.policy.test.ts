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
import { dateWindowKey, takeDateWindowNotice } from '../date-window-notice';
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
jest.mock( '../reports/registry', () => ( { getReportDefinition: () => ( {} ) } ) );
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
 * @return The search that loads, and how many redirects it took.
 */
async function settle(
	search: Search,
	load = ( next: Search ) => route.beforeLoad( { search: next } as never )
) {
	let current = search;
	for ( let hops = 0; hops < 3; hops++ ) {
		try {
			await load( current );
			return { search: current, hops };
		} catch ( thrown ) {
			expect( thrown ).toMatchObject( { isRedirect: true, replace: true, viewTransition: false } );
			current = ( thrown as { search: Record< string, unknown > } ).search;
		}
	}
	throw new Error( `Still redirecting after 3 hops: ${ JSON.stringify( current ) }` );
}

const setLocks = ( ...features: string[] ) =>
	( getScriptData as jest.Mock ).mockReturnValue(
		planGatesScriptData( features, [ 'traffic', 'store' ] )
	);

beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
} );

/**
 * The notice the page shows on landing on a search, if any.
 *
 * @param search   - The search the page shows.
 * @param pathname - Its pathname.
 * @return The queued feature, or undefined.
 */
const noticeOn = ( search: Search, pathname = '/' ) =>
	takeDateWindowNotice( dateWindowKey( search, pathname ) );

afterEach( () => {
	jest.useRealTimers();
	takeDateWindowNotice( '' );
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
		expect( noticeOn( settled.search ) ).toBe( notice );
	} );
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
	expect( noticeOn( settled.search ) ).toBe( 'long-date-presets' );
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
		expect( noticeOn( settled.search ) ).toBeUndefined();
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
