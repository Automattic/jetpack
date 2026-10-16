import {
	DASHBOARD_PREFERENCES_SCOPE,
	getStatsDatePolicy,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DATE_FILTER_RANGE,
	DATE_FILTER_YEAR,
	offersDateComparison,
	resolvePresetForSurface,
} from './date-filter';

describe( 'resolvePresetForSurface', () => {
	describe( 'on the year surface', () => {
		it( 'keeps a preset the surface can show', () => {
			expect( resolvePresetForSurface( DATE_FILTER_YEAR, PRESET_ALL_TIME ) ).toBeNull();
			expect( resolvePresetForSurface( DATE_FILTER_YEAR, toYearPresetId( 2024 ) ) ).toBeNull();
		} );

		it( 'takes over from a rolling window, a custom range, or nothing at all', () => {
			expect( resolvePresetForSurface( DATE_FILTER_YEAR, 'last-30-days' ) ).toBe( PRESET_ALL_TIME );
			expect( resolvePresetForSurface( DATE_FILTER_YEAR, 'custom' ) ).toBe( PRESET_ALL_TIME );
			expect( resolvePresetForSurface( DATE_FILTER_YEAR, undefined ) ).toBe( PRESET_ALL_TIME );
		} );
	} );

	describe( 'on the date-range surface', () => {
		it( 'keeps a rolling window, a custom range, or an absent preset', () => {
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, 'last-7-days' ) ).toBeNull();
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, 'custom' ) ).toBeNull();
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, undefined ) ).toBeNull();
		} );

		it( 'takes over from a year-surface preset with the default preset', () => {
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, PRESET_ALL_TIME ) ).toBe( 'last-7-days' );
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, toYearPresetId( 2024 ) ) ).toBe(
				'last-7-days'
			);
		} );

		describe( 'under the plan date policy', () => {
			const LOCKED = { description: '', support_url: '', upgrade_url: '' };

			const remember = ( preset: string | undefined ) =>
				(
					dispatch( preferencesStore ) as unknown as {
						set: ( scope: string, name: string, value: unknown ) => void;
					}
				 ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', preset );

			const policyLocking = ( features: string[] ): StatsDatePolicy => {
				window.JetpackScriptData = {
					premium_analytics: {
						plan_gates: {
							tier: 'free',
							locked_features: Object.fromEntries( features.map( key => [ key, LOCKED ] ) ),
							locked_widget_types: {},
						},
					},
				} as unknown as typeof window.JetpackScriptData;

				return getStatsDatePolicy();
			};

			beforeEach( () => {
				jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
			} );

			afterEach( () => {
				jest.useRealTimers();
				remember( undefined );
				delete window.JetpackScriptData;
			} );

			it.each( [
				[ 'year-to-date', 'last-7-days' ],
				[ 'yesterday', 'yesterday' ],
			] )( 'on free, takes over from a remembered %s with %s', ( remembered, expected ) => {
				remember( remembered );

				expect(
					resolvePresetForSurface(
						DATE_FILTER_RANGE,
						PRESET_ALL_TIME,
						policyLocking( [ 'recent-7-days', 'long-date-presets', 'intervals' ] )
					)
				).toBe( expected );
			} );
		} );
	} );
} );

describe( 'Date-filter surface constants', () => {
	// An unrecognized surface silently falls back to `range`, so a typo here goes
	// unnoticed; a PHP-side addition is only caught by `Dashboard_Section_Test`.
	it( 'pins the surface literals the PHP constants use', () => {
		expect( DATE_FILTER_RANGE ).toBe( 'range' );
		expect( DATE_FILTER_YEAR ).toBe( 'year' );
	} );
} );

describe( 'offersDateComparison', () => {
	it( 'follows the section on the date-range surface', () => {
		expect( offersDateComparison( DATE_FILTER_RANGE, { with_date_comparison: true } ) ).toBe(
			true
		);
		expect( offersDateComparison( DATE_FILTER_RANGE, { with_date_comparison: false } ) ).toBe(
			false
		);
	} );

	it( 'keeps the control when the section carries no options', () => {
		expect( offersDateComparison( DATE_FILTER_RANGE, undefined ) ).toBe( true );
	} );

	it( 'never offers it on the year surface, whatever the section says', () => {
		expect( offersDateComparison( DATE_FILTER_YEAR, undefined ) ).toBe( false );
		expect( offersDateComparison( DATE_FILTER_YEAR, { with_date_comparison: true } ) ).toBe(
			false
		);
	} );

	it( 'ignores the placement of the control', () => {
		expect(
			offersDateComparison( DATE_FILTER_RANGE, {
				with_date_comparison: true,
				with_header_date_control: false,
			} )
		).toBe( true );
		expect(
			offersDateComparison( DATE_FILTER_RANGE, {
				with_date_comparison: false,
				with_header_date_control: true,
			} )
		).toBe( false );
	} );
} );
