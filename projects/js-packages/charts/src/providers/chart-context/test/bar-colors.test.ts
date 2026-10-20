import { getBarColors, getComparisonPrimaries } from '../private/bar-colors';
import { contrastRatio } from '../private/perceptual-color';
import type { SeriesData } from '../../../types';

const series = ( label: string, options: SeriesData[ 'options' ] = {}, group?: string ) => ( {
	label,
	data: [],
	group,
	options,
} );

describe( 'getComparisonPrimaries', () => {
	it.each( [
		[
			'the primary of its group',
			[
				series( 'Visitors', {}, 'current' ),
				series( 'Views', { type: 'comparison' }, 'current' ),
				series( 'Previous visitors', {}, 'previous' ),
				series( 'Previous views', { type: 'comparison' }, 'previous' ),
			],
			[
				[ 1, 0 ],
				[ 3, 2 ],
			],
		],
		[
			'the only primary when its group has none',
			[ series( 'Views', {}, 'current' ), series( 'Previous', { type: 'comparison' } ) ],
			[ [ 1, 0 ] ],
		],
		[
			'nothing when several primaries are outside its group',
			[
				series( 'Views', {}, 'current' ),
				series( 'Visitors', {}, 'current' ),
				series( 'Previous', { type: 'comparison' } ),
			],
			[],
		],
	] )( 'pairs a comparison with %s', ( _, data, pairs ) => {
		expect( getComparisonPrimaries( data as SeriesData[] ) ).toEqual(
			new Map( pairs as [ number, number ][] )
		);
	} );
} );

describe( 'getBarColors', () => {
	it.each( [
		[ 'a light color on white', '#c7e0f4', '#ffffff' ],
		[ 'a color on a dark background', '#3858e9', '#1e1e1e' ],
	] )(
		'gives a comparison the lightest tint that keeps 3:1 against the background, and its primary 3:1 against the tint, for %s',
		( _, color, background ) => {
			const [ primary, comparison ] = getBarColors(
				[ series( 'Views' ), series( 'Previous', { type: 'comparison' } ) ],
				[ color, color ],
				background
			);

			expect( contrastRatio( comparison, background ) ).toBeGreaterThanOrEqual( 3 );
			expect( contrastRatio( comparison, background ) ).toBeLessThan( 3.1 );
			expect( contrastRatio( primary, comparison ) ).toBeGreaterThanOrEqual( 3 );
			expect( contrastRatio( primary, comparison ) ).toBeLessThan( 3.1 );
		}
	);

	it( 'keeps a primary that already contrasts with the tint', () => {
		const [ primary ] = getBarColors(
			[ series( 'Visitors' ), series( 'Views', { type: 'comparison' } ) ],
			[ '#101010', '#101010' ],
			'#ffffff'
		);

		expect( primary ).toBe( '#101010' );
	} );

	it( 'tints from the primary color, not the comparison color', () => {
		const [ , comparison ] = getBarColors(
			[ series( 'Visitors', {}, 'current' ), series( 'Views', { type: 'comparison' }, 'current' ) ],
			[ '#3858e9', '#00a32a' ],
			'#ffffff'
		);

		expect( comparison ).toBe(
			getBarColors(
				[ series( 'Views' ), series( 'Previous', { type: 'comparison' } ) ],
				[ '#3858e9', '#3858e9' ],
				'#ffffff'
			)[ 1 ]
		);
	} );

	it( 'tints a comparison stroked in its primary color', () => {
		const tinted = getBarColors(
			[ series( 'Views' ), series( 'Previous', { type: 'comparison' } ) ],
			[ '#3858e9', '#3858e9' ],
			'#ffffff'
		);

		expect(
			getBarColors(
				[ series( 'Views' ), series( 'Previous', { type: 'comparison', stroke: '#3858E9' } ) ],
				[ '#3858e9', '#3858E9' ],
				'#ffffff'
			)
		).toEqual( tinted );
	} );

	it.each( [
		[ 'a primary paint that is not hex', [ 'url(#gradient)', 'url(#gradient)' ], '#ffffff' ],
		[ 'a background that is not hex', [ '#3858e9', '#3858e9' ], 'transparent' ],
	] )( 'keeps the colors given with %s', ( _case, colors, background ) => {
		const data = [ series( 'Views' ), series( 'Previous', { type: 'comparison' } ) ];

		expect( getBarColors( data, colors, background ) ).toEqual( colors );
	} );

	it( 'keeps the colors of a comparison stroked in a color of its own, and its primary', () => {
		const data = [
			series( 'Views' ),
			series( 'Previous', { type: 'comparison', stroke: '#dbdbdb' } ),
		];

		expect( getBarColors( data, [ '#3858e9', '#dbdbdb' ], '#ffffff' ) ).toEqual( [
			'#3858e9',
			'#dbdbdb',
		] );
	} );
} );
