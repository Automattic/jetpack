import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
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
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, PRESET_ALL_TIME ) ).toBe(
				'last-30-days'
			);
			expect( resolvePresetForSurface( DATE_FILTER_RANGE, toYearPresetId( 2024 ) ) ).toBe(
				'last-30-days'
			);
		} );
	} );
} );

describe( 'Date-filter surface constants', () => {
	// An unrecognized surface falls back to `range` silently, so a typo here
	// would go unnoticed. A surface added on the PHP side only fails in
	// `Dashboard_Section_Test::test_sections_schema_documents_the_date_filter`.
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
