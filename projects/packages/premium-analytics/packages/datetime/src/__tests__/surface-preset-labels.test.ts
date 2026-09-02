/**
 * Internal dependencies
 */
import { getDefaultDateRangePresets, getQuickSurfacePresets } from '../presets';
import { QUICK_SURFACE_PRESETS } from '../presets/types';

const TIME_ZONE = 'America/New_York';

describe( 'surface preset short labels', () => {
	it( 'names every preset in full', () => {
		expect( getQuickSurfacePresets( TIME_ZONE ).map( preset => preset.label ) ).toEqual( [
			'Last 24 hours',
			'Last 7 days',
			'Last 30 days',
			'Last 12 months',
		] );
	} );

	// The row cannot afford "Last 30 days" beside three siblings; a surface with
	// room reads `label`.
	it( 'compresses the labels the pill row cannot fit', () => {
		expect(
			getQuickSurfacePresets( TIME_ZONE ).map( preset => preset.pillLabel ?? preset.label )
		).toEqual( [ 'Last 24 hours', '7 days', '30 days', '12 months' ] );
	} );

	it( 'gives every quick surface preset a short label', () => {
		const presets = getQuickSurfacePresets( TIME_ZONE );

		expect( presets ).toHaveLength( QUICK_SURFACE_PRESETS.length );

		for ( const preset of presets ) {
			expect( preset.shortLabel ).toBeTruthy();
		}
	} );

	it( 'keeps the short label shorter than the one it replaces', () => {
		for ( const { label, pillLabel, shortLabel } of getQuickSurfacePresets( TIME_ZONE ) ) {
			expect( shortLabel!.length ).toBeLessThan( ( pillLabel ?? label ).length );
		}
	} );

	/*
	 * The abbreviations exist for the pill row, and only the quick surface
	 * presets render there. A short label on any other preset would never be
	 * shown, so it would be dead weight the translators still have to carry.
	 */
	it( 'leaves presets outside the surface without one', () => {
		const surface = new Set< string >( QUICK_SURFACE_PRESETS );

		const offSurface = getDefaultDateRangePresets( TIME_ZONE ).filter(
			preset => ! surface.has( preset.id )
		);

		expect( offSurface.length ).toBeGreaterThan( 0 );

		for ( const preset of offSurface ) {
			expect( preset.shortLabel ).toBeUndefined();
		}
	} );
} );
