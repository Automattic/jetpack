import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import {
	getHeatmapScale,
	HEATMAP_HIGH_CONTRAST,
	HEATMAP_LOW_CONTRAST,
} from '../private/heatmap-scale';

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
	[ 'light', '#ffffff' ],
	[ 'dark', '#1e1e1e' ],
] )( 'getHeatmapScale on a %s background', ( _mode, background ) => {
	it.each( PRIMARIES )( 'keeps the lowest step of %s at 3:1, no darker than needed', primary => {
		const { low } = getHeatmapScale( primary, background );
		const contrast = contrastRatio( low, background );

		expect( contrast ).toBeGreaterThanOrEqual( HEATMAP_LOW_CONTRAST );
		expect( contrast ).toBeLessThan( HEATMAP_LOW_CONTRAST + 0.1 );
	} );

	it.each( PRIMARIES )( 'runs the scale of %s out to 9:1', primary => {
		const { high } = getHeatmapScale( primary, background );

		expect( contrastRatio( high, background ) ).toBeGreaterThanOrEqual( HEATMAP_HIGH_CONTRAST );
	} );
} );

describe( 'getHeatmapScale', () => {
	it( 'keeps a primary already past 9:1 as the high end', () => {
		expect( getHeatmapScale( '#1d2327', '#ffffff' ).high ).toBe( '#1d2327' );
	} );

	it( 'still clears 3:1 when the primary matches the background', () => {
		const { low, high } = getHeatmapScale( '#ffffff', '#ffffff' );

		expect( contrastRatio( low, '#ffffff' ) ).toBeGreaterThanOrEqual( HEATMAP_LOW_CONTRAST );
		expect( contrastRatio( high, '#ffffff' ) ).toBeGreaterThanOrEqual( HEATMAP_HIGH_CONTRAST );
	} );

	it( 'ends on black or white when the background leaves no room for 9:1', () => {
		expect( getHeatmapScale( '#3858e9', '#808080' ).high ).toBe( '#000000' );
	} );
} );
