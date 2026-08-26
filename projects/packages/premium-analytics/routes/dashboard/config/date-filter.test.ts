import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
import {
	DATE_FILTER_RANGE,
	DATE_FILTER_YEAR,
	offersDateComparison,
	offersHeaderDateControl,
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
	// The frontend re-declares these values rather than importing them from PHP,
	// and an unrecognized surface falls back to `range` silently, so a typo here
	// would break the mirror with every other test still green.
	//
	// This pins the literals; it cannot see a surface added on the PHP side
	// only. `Dashboard_Section_Test::test_sections_schema_documents_the_date_filter`
	// asserts the enum exactly, and names this file, so that direction fails there.
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

	// Not just chrome: the dashboard declares this on `ReportScopeProvider`, so
	// `WidgetRoot` strips the comparison params for the whole section.
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

describe( 'offersHeaderDateControl', () => {
	it( 'follows the section', () => {
		expect(
			offersHeaderDateControl( { with_date_comparison: true, with_header_date_control: true } )
		).toBe( true );
		expect(
			offersHeaderDateControl( { with_date_comparison: true, with_header_date_control: false } )
		).toBe( false );
	} );

	// A section registered before the field existed, and a payload served before
	// it existed, both keep the header control they had.
	it( 'keeps the control when the section carries no placement', () => {
		expect( offersHeaderDateControl( undefined ) ).toBe( true );
		expect( offersHeaderDateControl( { with_date_comparison: true } ) ).toBe( true );
	} );

	// Placement is not capability: a widget-hosted control still has one.
	it( 'is independent of comparison', () => {
		expect(
			offersHeaderDateControl( { with_date_comparison: false, with_header_date_control: true } )
		).toBe( true );
	} );
} );
