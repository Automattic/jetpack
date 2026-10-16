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
import { dateWindowKey, takeDateWindowNotice } from '../date-window-notice';
import { route as postRoute } from '../post-detail/route';
import { route } from './route';

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
jest.mock( '@wordpress/data', () => {
	const actual = () => jest.requireActual( '@wordpress/data' );
	return new Proxy(
		{},
		{
			get: ( _target, name ) =>
				name === 'dispatch'
					? ( store: unknown ) =>
							store === 'core/notices'
								? { createInfoNotice: jest.fn() }
								: actual().dispatch( store )
					: actual()[ name as string ],
		}
	);
} );

type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

const LOCKED = { description: '', support_url: '', upgrade_url: '' };
const DATE_SETTINGS = getSettings();

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
			current = ( thrown as { search: Record< string, unknown > } ).search;
		}
	}
	throw new Error( `Still redirecting after 3 hops: ${ JSON.stringify( current ) }` );
}

/**
 * Publish plan gates that lock the given features.
 *
 * @param features - Locked feature slugs.
 */
function setLocks( ...features: string[] ) {
	( getScriptData as jest.Mock ).mockReturnValue( {
		premium_analytics: {
			sections: [ 'traffic', 'store' ],
			plan_gates: {
				tier: 'free',
				locked_features: Object.fromEntries( features.map( feature => [ feature, LOCKED ] ) ),
				locked_widget_types: {},
			},
		},
	} );
}

beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
} );

/**
 * The notice the page shows on landing on a search, if any.
 *
 * @param search - The search the page shows.
 * @return The queued feature, or undefined.
 */
const noticeOn = ( search: Search ) => takeDateWindowNotice( dateWindowKey( search ) );

afterEach( () => {
	jest.useRealTimers();
	takeDateWindowNotice( '' );
	setSettings( DATE_SETTINGS );
	rememberPreset( undefined );
	window.localStorage.clear();
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
		[ 'an old deep link', { from: '2025-01-01', to: '2025-01-31', interval: 'day' } ],
		[ 'a bare locked preset', { preset: 'last-90-days' } ],
		[
			'a comparison',
			{
				preset: 'last-7-days',
				comp: '1',
				compare_from: '2026-10-01',
				compare_to: '2026-10-07',
			},
		],
	] )( 'settles %s within two redirects', async ( _name, search ) => {
		setLocks( 'recent-7-days', 'long-date-presets', 'intervals', 'csv' );

		const settled = await settle( search );

		expect( settled.hops ).toBeLessThanOrEqual( 2 );
		expect( settled.search ).toMatchObject( { preset: 'last-7-days', from: weekStart } );
		expect( settled.search ).not.toHaveProperty( 'comp' );
	} );
} );

describe( 'the date-limit notice on a free site', () => {
	beforeEach( () => setLocks( 'recent-7-days', 'long-date-presets', 'intervals', 'csv' ) );

	it( 'shows once an old deep link lands on the last 7 days', async () => {
		const settled = await settle( { from: '2025-01-01', to: '2025-01-31', interval: 'day' } );

		expect( noticeOn( settled.search ) ).toBe( 'recent-7-days' );
	} );

	it( 'is dropped when a hovered link preloads but the page keeps its window', async () => {
		const current = ( await settle( { section: 'traffic', preset: 'yesterday' } ) ).search;

		await settle( { ...current, from: '2025-01-01', to: '2025-01-31', preset: undefined } );

		expect( noticeOn( current ) ).toBeUndefined();
	} );

	it( 'stays quiet when a post opens on its own window', async () => {
		const settled = await settle(
			{ from: '2025-01-01', to: '2025-01-31', interval: 'day', ref: 'posts' },
			next => postRoute.beforeLoad( { params: { postId: '42' }, search: next } as never )
		);

		expect( settled.hops ).toBeLessThanOrEqual( 2 );
		expect( settled.search ).toMatchObject( { preset: 'last-7-days', post_id: '42' } );
		expect( noticeOn( settled.search ) ).toBeUndefined();
	} );
} );

it.each( [
	[ 'weeks', { from: '2026-01-01', to: '2026-06-30', interval: 'week' } ],
	[ 'no interval', { from: '2026-01-01', to: '2026-06-30' } ],
] )( 'settles a long legacy-basic range given %s', async ( _name, search ) => {
	setLocks( 'long-date-presets', 'intervals', 'csv' );

	const settled = await settle( search );

	expect( settled.hops ).toBeLessThanOrEqual( 2 );
	expect( settled.search ).toMatchObject( { from: '2026-01-01', interval: 'day' } );
} );

it.each( [
	[ 'a remembered preset', () => rememberPreset( 'last-12-months' ) ],
	[
		'a Stats v1 range',
		() =>
			window.localStorage.setItem(
				'jetpack_stats_stored_date_range_shortcut_id',
				'last_12_months'
			),
	],
] )( 'opens legacy basic on the last 30 days, compared, given %s', async ( _name, arrange ) => {
	setLocks( 'long-date-presets', 'intervals', 'csv' );
	arrange();

	const settled = await settle( { section: 'traffic' } );

	expect( settled.hops ).toBeLessThanOrEqual( 1 );
	expect( settled.search ).toMatchObject( {
		preset: 'last-30-days',
		comp: '1',
		compare_preset: 'previous-period',
	} );
} );

const FREE_LOCKS = [ 'recent-7-days', 'long-date-presets', 'intervals', 'csv' ];
const LEGACY_BASIC_LOCKS = [ 'long-date-presets', 'intervals', 'csv' ];
const ALL_TIME = { preset: 'all-time', from: '2005-01-01', to: '2026-10-15' };
const YEAR_2024 = { preset: 'year-2024', from: '2024-01-01', to: '2024-12-31' };

const YEAR_2025 = { preset: 'year-2025', from: '2025-01-01', to: '2025-12-31' };

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
	[
		'legacy basic',
		'a year',
		LEGACY_BASIC_LOCKS,
		YEAR_2024,
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
