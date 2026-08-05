import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
import { DATE_FILTER_RANGE, DATE_FILTER_YEAR, resolvePresetForSurface } from './date-filter';

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
