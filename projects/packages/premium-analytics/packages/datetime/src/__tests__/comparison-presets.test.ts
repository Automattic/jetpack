/**
 * Internal dependencies
 */
import { COMPARISON_PRESETS, isComparisonPresetId } from '../get-comparison-range';
import { getComparisonPresetConfigs } from '../presets';

describe( 'comparison presets', () => {
	/*
	 * The set is a design decision (WOOA7S-1814), not an accident of what the
	 * range math happens to support: the picker offers these three plus "No
	 * comparison". Changing it should be a deliberate edit here.
	 */
	it( 'offers the period, month and year presets, in that order', () => {
		expect( COMPARISON_PRESETS ).toEqual( [
			'previous-period',
			'previous-month',
			'previous-year',
		] );
	} );

	it( 'labels every preset it offers', () => {
		const configs = getComparisonPresetConfigs();

		expect( configs.map( ( { id } ) => id ) ).toEqual( [ ...COMPARISON_PRESETS ] );

		for ( const { label } of configs ) {
			expect( label ).toBeTruthy();
		}
	} );

	it( 'rejects an identifier outside the set', () => {
		expect( isComparisonPresetId( 'previous-week' ) ).toBe( false );
	} );
} );
