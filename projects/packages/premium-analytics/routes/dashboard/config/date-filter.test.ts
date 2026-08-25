import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
import {
	DATE_FILTER_NONE,
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
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, PRESET_ALL_TIME ) ).toBe(
				'last-30-days'
			);
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, toYearPresetId( 2024 ) ) ).toBe(
				'last-30-days'
			);
		} );
	} );

	// `none` means the header shows no control while a widget hosts a range
	// picker, so the preset must stay coherent with the range surface.
	describe( 'on the no-control surface', () => {
		it( 'reconciles exactly like the date-range surface', () => {
			expect( resolvePresetForSurface( DATE_FILTER_NONE, 'last-7-days' ) ).toBeNull();
			expect( resolvePresetForSurface( DATE_FILTER_NONE, 'custom' ) ).toBeNull();
			expect( resolvePresetForSurface( DATE_FILTER_NONE, undefined ) ).toBeNull();
			expect( resolvePresetForSurface( DATE_FILTER_NONE, PRESET_ALL_TIME ) ).toBe( 'last-30-days' );
			expect( resolvePresetForSurface( DATE_FILTER_NONE, toYearPresetId( 2024 ) ) ).toBe(
				'last-30-days'
			);
		} );
	} );
} );

describe( 'Date-filter surface constants', () => {
	// The frontend re-declares these values rather than importing them from PHP, and
	// `resolvePresetForSurface` treats unknown surfaces exactly like `none`, so a typo
	// here would break the mirror with every other test still green.
	// `Dashboard_Section::DATE_FILTERS` is the source of truth.
	it( 'mirrors the PHP surface values exactly', () => {
		expect( DATE_FILTER_RANGE ).toBe( 'range' );
		expect( DATE_FILTER_YEAR ).toBe( 'year' );
		expect( DATE_FILTER_NONE ).toBe( 'none' );
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

	// Not just chrome: `ReportScopeProvider` has `WidgetRoot` strip the
	// comparison params for the whole section when this is false.
	it( 'never offers it on the no-control surface, whatever the section says', () => {
		expect( offersDateComparison( DATE_FILTER_NONE, undefined ) ).toBe( false );
		expect( offersDateComparison( DATE_FILTER_NONE, { with_date_comparison: true } ) ).toBe(
			false
		);
	} );
} );
