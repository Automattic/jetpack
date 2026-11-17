import { contrastRatio } from '../../../../providers/chart-context/private/perceptual-color';
import { relativeLuminance } from '../../../../utils/color-utils';
import { getOverlapBarColors, getOverlapPlacements, tintWithContrast } from '../overlap-bars';
import type { SeriesData } from '../../../../types';

const series = ( label: string, group?: string, options: SeriesData[ 'options' ] = {} ) => ( {
	label,
	group,
	data: [],
	options,
} );

const VIEWS_AND_VISITORS: SeriesData[] = [
	series( 'Views', 'views' ),
	series( 'Previous views', 'views', { type: 'comparison' } ),
	series( 'Visitors', 'visitors' ),
	series( 'Previous visitors', 'visitors', { type: 'comparison' } ),
];

const BLUE = '#3858e9';
const GREEN = '#008a20';

describe( 'getOverlapPlacements', () => {
	it( 'puts primaries and comparisons in their own slots, with each group a layer in order of first appearance', () => {
		expect( getOverlapPlacements( VIEWS_AND_VISITORS ) ).toEqual( [
			{ slot: 'primary', layer: 0, thickness: 1 },
			{ slot: 'comparison', layer: 0, thickness: 1 },
			{ slot: 'primary', layer: 1, thickness: 0.5 },
			{ slot: 'comparison', layer: 1, thickness: 0.5 },
		] );
	} );

	it.each( [
		[ 'one group', [ series( 'Views', 'views' ) ], [ 1 ] ],
		[
			'three groups',
			[ series( 'A', 'a' ), series( 'B', 'b' ), series( 'C', 'c' ) ],
			[ 1, 0.75, 0.5 ],
		],
	] )( 'narrows each layer in front with %s', ( _case, data, thicknesses ) => {
		expect( getOverlapPlacements( data ).map( ( { thickness } ) => thickness ) ).toEqual(
			thicknesses
		);
	} );
} );

describe( 'getOverlapBarColors', () => {
	const colorsOf = ( data: SeriesData[] ) =>
		data.map( item => item.options?.stroke ?? ( item.group === 'views' ? BLUE : GREEN ) );

	it.each( [
		[ 'a light background', '#ffffff', -1 ],
		[ 'a dark background', '#1e1e1e', 1 ],
	] )(
		'tints the back bar to 3:1 against %s and moves the front bar away from it to 3:1',
		( _case, background, direction ) => {
			const [ back, previousBack, front, previousFront ] = getOverlapBarColors(
				VIEWS_AND_VISITORS,
				colorsOf( VIEWS_AND_VISITORS ),
				[ BLUE, GREEN ],
				background
			);

			for ( const [ slotBack, slotFront ] of [
				[ back, front ],
				[ previousBack, previousFront ],
			] ) {
				expect( contrastRatio( slotBack, background ) ).toBeGreaterThanOrEqual( 3 );
				expect( contrastRatio( slotBack, background ) ).toBeLessThan( 3.1 );
				expect( contrastRatio( slotFront, slotBack ) ).toBeGreaterThanOrEqual( 3 );
				expect( Math.sign( relativeLuminance( slotFront ) - relativeLuminance( slotBack ) ) ).toBe(
					direction
				);
			}
		}
	);

	it( 'turns the front bar back toward the background when the far side cannot reach 3:1', () => {
		const background = '#686884';
		const [ back, , front ] = getOverlapBarColors(
			VIEWS_AND_VISITORS,
			colorsOf( VIEWS_AND_VISITORS ),
			[ '#9f4902', GREEN ],
			background
		);

		expect( contrastRatio( front, back ) ).toBeGreaterThanOrEqual( 3 );
	} );

	it( "tones each slot from its palette color, not from the series' group colors", () => {
		const toned = getOverlapBarColors(
			VIEWS_AND_VISITORS,
			colorsOf( VIEWS_AND_VISITORS ),
			[ BLUE, GREEN ],
			'#ffffff'
		);
		const regrouped = getOverlapBarColors(
			VIEWS_AND_VISITORS,
			[ '#111111', '#222222', '#333333', '#444444' ],
			[ BLUE, GREEN ],
			'#ffffff'
		);

		expect( regrouped ).toEqual( toned );
	} );

	it( "tones a slot from its back series' own stroke", () => {
		const data = [
			series( 'Views', 'views', { stroke: GREEN } ),
			series( 'Visitors', 'visitors' ),
		];
		const [ back ] = getOverlapBarColors( data, [ GREEN, BLUE ], [ BLUE, BLUE ], '#ffffff' );

		expect( back ).toBe( tintWithContrast( GREEN, '#ffffff' ) );
	} );

	it.each( [ BLUE, '#dbdbdb' ] )( 'tints a bar alone in its slot from %s, as a back bar', base => {
		const [ bar ] = getOverlapBarColors(
			[ series( 'Comments' ) ],
			[ base ],
			[ base, GREEN ],
			'#ffffff'
		);

		expect( bar ).toBe( tintWithContrast( base, '#ffffff' ) );
	} );

	it.each( [
		[
			'a front series stroked in a color of its own',
			[
				series( 'Previous views', 'views', { type: 'comparison', stroke: '#dbdbdb' } ),
				series( 'Previous visitors', 'visitors', { type: 'comparison', stroke: '#707070' } ),
			],
			[ '#dbdbdb', '#707070' ],
			'#ffffff',
		],
		[
			'a bar alone in its slot stroked in a color of its own',
			[ series( 'Previous comments', 'comments', { type: 'comparison', stroke: '#dbdbdb' } ) ],
			[ '#dbdbdb' ],
			'#ffffff',
		],
		[
			'a base that is not hex',
			[ series( 'Views', 'views', { stroke: 'currentColor' } ), series( 'Visitors', 'visitors' ) ],
			[ 'currentColor', BLUE ],
			'#ffffff',
		],
		[
			'a background that is not hex',
			[ series( 'Views', 'views' ), series( 'Visitors', 'visitors' ) ],
			[ BLUE, GREEN ],
			'transparent',
		],
	] )( 'keeps the colors given with %s', ( _case, data, colors, background ) => {
		expect( getOverlapBarColors( data, colors, [ BLUE, GREEN ], background ) ).toEqual( colors );
	} );
} );
