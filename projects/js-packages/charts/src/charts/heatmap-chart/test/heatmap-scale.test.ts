import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors } from '../../../utils/color-utils';
import {
	getHeatmapScale,
	HEATMAP_HIGH_CONTRAST,
	HEATMAP_LOW_CONTRAST,
	HEATMAP_STEP_CONTRAST,
} from '../private/heatmap-scale';

// The wp-admin scheme colors, then the pre-7.0 ones.
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
		'keeps the lowest step of %s at 2.5:1 against the background and empty cell, no further',
		primary => {
			const { low } = getHeatmapScale( primary, background, emptyCell );
			const contrasts = [ contrastRatio( low, background ), contrastRatio( low, emptyCell ) ];

			expect( Math.min( ...contrasts ) ).toBeGreaterThanOrEqual( HEATMAP_LOW_CONTRAST );
			expect( Math.min( ...contrasts ) ).toBeLessThan( HEATMAP_LOW_CONTRAST + 0.1 );
		}
	);

	it.each( PRIMARIES )( 'runs the scale of %s out to 6:1', primary => {
		const { high } = getHeatmapScale( primary, background );

		expect( contrastRatio( high, background ) ).toBeGreaterThanOrEqual( HEATMAP_HIGH_CONTRAST );
	} );
} );

describe( 'getHeatmapScale', () => {
	it( 'keeps a primary already past 6:1 as the high end', () => {
		expect( getHeatmapScale( '#1d2327', '#ffffff' ).high ).toBe( '#1d2327' );
	} );

	it.each( [
		[ '#ffffff', '#808080', null ],
		[ '#ffd000', '#767676', null ],
		[ '#3858e9', '#808080', null ],
		[ '#1e1e1e', '#999999', null ],
		[ '#ffd000', '#8a8a8a', null ],
		[ '#ffd000', '#8a8a8a', '#cccccc' ],
		[ '#1d2327', '#555555', '#272727' ],
	] )(
		'keeps every step of %s at 2:1 on a mid-gray %s with a %s empty cell, ends apart',
		( primary, background, emptyCell ) => {
			const { low, high } = getHeatmapScale( primary, background, emptyCell );

			expect( contrastRatio( low, high ) ).toBeGreaterThanOrEqual( HEATMAP_STEP_CONTRAST );
			for ( let step = 0; step <= 20; step++ ) {
				expect(
					contrastRatio( mixHexColors( low, high, step / 20 ), background )
				).toBeGreaterThanOrEqual( HEATMAP_STEP_CONTRAST );
			}
		}
	);

	it.each( [
		[ '#ffffff', '#cccccc' ],
		[ '#ffffff', '#959595' ],
		[ '#1e1e1e', '#6b6b6b' ],
	] )(
		'moves the low end on %s farther from a %s empty cell than the background alone would',
		( background, emptyCell ) => {
			const { low } = getHeatmapScale( '#3858e9', background, emptyCell );
			const backgroundOnly = getHeatmapScale( '#3858e9', background ).low;

			expect( contrastRatio( low, emptyCell ) ).toBeGreaterThan(
				contrastRatio( backgroundOnly, emptyCell )
			);
		}
	);

	it.each( [
		[ '#ffffff', '#959595' ],
		[ '#ffffff', '#cccccc' ],
		[ '#1e1e1e', '#555555' ],
	] )(
		'keeps the ends apart and in order on %s with a %s empty cell',
		( background, emptyCell ) => {
			const { low, high } = getHeatmapScale( '#3858e9', background, emptyCell );

			expect( contrastRatio( low, high ) ).toBeGreaterThanOrEqual( HEATMAP_STEP_CONTRAST );
			expect( contrastRatio( low, background ) ).toBeLessThan( contrastRatio( high, background ) );
		}
	);

	it( 'ends on black or white when the background leaves no room for 6:1', () => {
		expect( getHeatmapScale( '#3858e9', '#808080' ).high ).toBe( '#000000' );
	} );
} );
