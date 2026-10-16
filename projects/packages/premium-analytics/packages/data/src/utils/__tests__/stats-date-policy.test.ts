/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	computePrimaryRange,
	MENU_SURFACE_PRESETS_WITH_ALL_TIME,
} from '@jetpack-premium-analytics/datetime';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { normalizeReportParams } from '../search';
import {
	applyStatsDatePolicy,
	deriveStatsDatePolicy,
	getPolicyDefaultPreset,
	getStatsDatePolicy,
	isPresetLockedByPolicy,
	OPEN_DATE_POLICY,
} from '../stats-date-policy';
import type { StatsFeatureKey } from '../plan-gates';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const lockOnly =
	( ...features: StatsFeatureKey[] ) =>
	( feature: StatsFeatureKey ) =>
		features.includes( feature );
const free = () => deriveStatsDatePolicy( lockOnly( 'recent-7-days' ), 'UTC' );
// Legacy Basic, as `stats-plan-gates.php` defines it.
const basic = () => deriveStatsDatePolicy( lockOnly( 'long-date-presets', 'intervals' ), 'UTC' );

const originalSettings = getSettings();

// `applyStatsDatePolicy` reads the site zone from the WordPress date settings.
beforeAll( () => {
	setSettings( {
		...originalSettings,
		timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
	} );
} );

beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
} );

afterEach( () => {
	jest.useRealTimers();
} );

afterAll( () => {
	setSettings( originalSettings );
} );

describe( 'deriveStatsDatePolicy', () => {
	it.each( [ 'UTC', 'America/Los_Angeles', 'Asia/Tokyo' ] )(
		'keeps only the presets inside the last 7 days open in %s',
		timeZone => {
			const policy = deriveStatsDatePolicy( lockOnly( 'recent-7-days' ), timeZone );
			const lockedPresetIds: readonly string[] = policy.lockedPresetIds;

			expect(
				MENU_SURFACE_PRESETS_WITH_ALL_TIME.filter( id => ! lockedPresetIds.includes( id ) )
			).toEqual( [ 'today', 'yesterday', 'last-24-hours', 'last-7-days' ] );
			expect( policy ).toMatchObject( {
				feature: 'recent-7-days',
				fallbackPresetId: 'last-7-days',
				offersComparison: false,
			} );
			expect( policy.earliestDate ).toEqual( computePrimaryRange( 'last-7-days', timeZone )?.from );
		}
	);

	it.each( [
		[
			'legacy basic',
			lockOnly( 'long-date-presets', 'intervals' ),
			'last-30-days',
			true,
			[ 'week', 'month', 'year' ],
			undefined,
		],
		[
			'intervals only',
			lockOnly( 'intervals' ),
			undefined,
			true,
			[ 'week', 'month', 'year' ],
			undefined,
		],
		[ 'nothing', lockOnly(), undefined, true, [], undefined ],
		[
			'recent-7-days with intervals',
			lockOnly( 'recent-7-days', 'intervals' ),
			'last-7-days',
			false,
			[ 'week', 'month', 'year' ],
			new Date( '2026-10-09T00:00:00Z' ),
		],
	] )(
		'derives the %s policy',
		( _name, isLocked, fallbackPresetId, offersComparison, lockedIntervals, earliestDate ) => {
			const policy = deriveStatsDatePolicy( isLocked, 'UTC' );

			expect( policy.earliestDate ).toEqual( earliestDate );
			expect( policy.fallbackPresetId ).toBe( fallbackPresetId );
			expect( policy.offersComparison ).toBe( offersComparison );
			expect( policy.lockedIntervals ).toEqual( lockedIntervals );
		}
	);

	it( 'locks single years under either date limit', () => {
		const longPresets = deriveStatsDatePolicy( lockOnly( 'long-date-presets' ), 'UTC' );

		expect( isPresetLockedByPolicy( 'year-2025', longPresets ) ).toBe( true );
		expect( isPresetLockedByPolicy( 'last-30-days', longPresets ) ).toBe( false );
		expect( isPresetLockedByPolicy( 'year-2025', OPEN_DATE_POLICY ) ).toBe( false );
	} );
} );

describe( 'getStatsDatePolicy', () => {
	afterEach( () => {
		( getScriptData as jest.Mock ).mockReset();
	} );

	it.each( [
		[ 'opens everything when the server published no gates', {}, undefined ],
		[
			'reads the week lock the server published',
			{
				plan_gates: {
					tier: 'free',
					locked_features: {
						'recent-7-days': { description: '', support_url: '', upgrade_url: '' },
					},
					locked_widget_types: {},
				},
			},
			'recent-7-days',
		],
	] )( '%s', ( _name, premiumAnalytics, feature ) => {
		( getScriptData as jest.Mock ).mockReturnValue( { premium_analytics: premiumAnalytics } );

		expect( getStatsDatePolicy().feature ).toBe( feature );
	} );
} );

describe( 'getPolicyDefaultPreset', () => {
	it.each( [
		[ 'an open plan', 'last-12-months', 'last-12-months', () => OPEN_DATE_POLICY ],
		[ 'a free plan', 'yesterday', 'yesterday', free ],
		[ 'a free plan', 'last-30-days', 'last-7-days', free ],
		[ 'legacy basic', 'last-12-months', 'last-30-days', basic ],
	] as const )( 'on %s opens %s as %s', ( _name, preset, expected, policy ) => {
		expect( getPolicyDefaultPreset( policy(), preset ) ).toBe( expected );
	} );
} );

describe( 'applyStatsDatePolicy', () => {
	it.each( [
		[
			'a custom range older than 7 days',
			free,
			{ from: '2025-01-01', to: '2025-01-31' },
			'last-7-days',
		],
		[ 'a locked preset', free, { preset: 'last-30-days' }, 'last-7-days' ],
		[ 'a long preset', basic, { preset: 'last-90-days' }, 'last-30-days' ],
		// Last 30 days allows weeks, so only the plan's locks bring this one back to days.
		[
			'a long preset in weeks',
			basic,
			{ preset: 'last-90-days', interval: 'week' },
			'last-30-days',
		],
	] )( 'replaces %s with the fallback', ( _name, policy, search, preset ) => {
		const result = applyStatsDatePolicy( normalizeReportParams( search as never ), policy() );

		expect( result.isWindowAdjusted ).toBe( true );
		expect( result.params.preset ).toBe( preset );
		expect( result.params.interval ).toBe( 'day' );
	} );

	it.each( [
		[ 'a range inside the window', free, { from: '2026-10-12', to: '2026-10-14' } ],
		[ 'a range starting on the earliest day', free, { from: '2026-10-09', to: '2026-10-14' } ],
		[ 'a long custom range on legacy basic', basic, { from: '2026-01-01', to: '2026-06-30' } ],
	] )( 'keeps %s', ( _name, policy, search ) => {
		const params = normalizeReportParams( search as never, undefined, {
			lockedIntervals: policy().lockedIntervals,
		} );

		expect( applyStatsDatePolicy( params, policy() ) ).toEqual( {
			params,
			isWindowAdjusted: false,
			isComparisonDropped: false,
		} );
	} );

	it.each( [
		[ 'yesterday', 'yesterday' ],
		[ 'last-30-days', 'last-7-days' ],
	] as const )( 'lands a replaced window given %s on %s', ( landing, expected ) => {
		const params = normalizeReportParams( { preset: 'last-30-days' } as never );

		expect( applyStatsDatePolicy( params, free(), landing ).params.preset ).toBe( expected );
	} );

	it( 'drops the comparison of a window the policy replaced', () => {
		const params = normalizeReportParams( {
			preset: 'last-90-days',
			comp: '1',
			compare_from: '2026-04-01',
			compare_to: '2026-06-30',
		} as never );

		const result = applyStatsDatePolicy( params, basic() );

		expect( result.isWindowAdjusted ).toBe( true );
		expect( result.isComparisonDropped ).toBe( true );
		expect( result.params.comp ).toBeUndefined();
	} );

	it( 'drops the comparison when the window has no room for it', () => {
		const params = normalizeReportParams( {
			preset: 'last-7-days',
			comp: '1',
			compare_from: '2026-10-01',
			compare_to: '2026-10-07',
		} as never );

		const result = applyStatsDatePolicy( params, free() );

		expect( result.isComparisonDropped ).toBe( true );
		expect( result.params.comp ).toBeUndefined();
	} );
} );
