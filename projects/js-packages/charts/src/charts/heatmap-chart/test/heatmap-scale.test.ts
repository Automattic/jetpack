import { MIN_BACKGROUND_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors } from '../../../utils/color-utils';
import { getHeatmapScale, HEATMAP_HIGH_CONTRAST } from '../private/heatmap-scale';

// The wp-admin scheme colors, then the pre-7.0 ones, which include a sunrise below 3:1 on white.
const PRIMARIES = [
	'#007cba',
	'#3858e9',
	'#437aa8',
	'#916745',
	'#646c3e',
	'#cf4339',
	'#567958',
	'#ad631e',
	'#0085ba',
	'#dd823b',
];

describe.each( [
	[ 'light', '#ffffff', '#f0f0f0' ],
	[ 'dark', '#242424', '#272727' ],
] )( 'getHeatmapScale on a %s background', ( _mode, background, emptyCell ) => {
	it.each( PRIMARIES )(
		'keeps the lowest step of %s at 3:1 against the background and empty cell, no further',
		primary => {
			const { low } = getHeatmapScale( primary, background, emptyCell );
			const contrasts = [ contrastRatio( low, background ), contrastRatio( low, emptyCell ) ];

			expect( Math.min( ...contrasts ) ).toBeGreaterThanOrEqual( MIN_BACKGROUND_CONTRAST );
			expect( Math.min( ...contrasts ) ).toBeLessThan( MIN_BACKGROUND_CONTRAST + 0.1 );
		}
	);

	it.each( PRIMARIES )( 'runs the scale of %s out to 9:1', primary => {
		const { high } = getHeatmapScale( primary, background );

		expect( contrastRatio( high, background ) ).toBeGreaterThanOrEqual( HEATMAP_HIGH_CONTRAST );
	} );
} );

describe( 'getHeatmapScale', () => {
	it( 'keeps a primary already past 9:1 as the high end', () => {
		expect( getHeatmapScale( '#1d2327', '#ffffff' ).high ).toBe( '#1d2327' );
	} );

	it.each( [
		[ '#ffffff', '#808080' ],
		[ '#ffd000', '#767676' ],
		[ '#3858e9', '#808080' ],
		[ '#1e1e1e', '#999999' ],
	] )( 'keeps every step of %s at 3:1 on a mid-gray %s', ( primary, background ) => {
		const { low, high } = getHeatmapScale( primary, background );

		for ( let step = 0; step <= 20; step++ ) {
			expect(
				contrastRatio( mixHexColors( low, high, step / 20 ), background )
			).toBeGreaterThanOrEqual( MIN_BACKGROUND_CONTRAST );
		}
	} );

	it.each( [
		[ 'no step clears it', '#ffffff', '#555555' ],
		[ 'clearing it would pass the high end', '#ffffff', '#767676' ],
		[ 'clearing it would pass the high end', '#1e1e1e', '#6b6b6b' ],
	] )(
		'measures against the background alone when %s (%s, %s)',
		( _case, background, emptyCell ) => {
			expect( getHeatmapScale( '#3858e9', background, emptyCell ) ).toEqual(
				getHeatmapScale( '#3858e9', background )
			);
		}
	);

	it( 'ends on black or white when the background leaves no room for 9:1', () => {
		expect( getHeatmapScale( '#3858e9', '#808080' ).high ).toBe( '#000000' );
	} );
} );
