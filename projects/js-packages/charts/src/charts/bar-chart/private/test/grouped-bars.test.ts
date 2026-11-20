import { contrastRatio } from '../../../../providers/chart-context/private/perceptual-color';
import { getGroupedBarColors } from '../grouped-bars';
import { tintWithContrast } from '../overlap-bars';
import type { SeriesData } from '../../../../types';

const series = ( label: string, group?: string, options: SeriesData[ 'options' ] = {} ) => ( {
	label,
	group,
	data: [],
	options,
} );

const BLUE = '#3858e9';
const GREEN = '#008a20';

describe( 'getGroupedBarColors', () => {
	it.each( [ [ '#ffffff' ], [ '#1e1e1e' ] ] )(
		'tints each comparison to 3:1 against %s and keeps its primary at 3:1 against the tint',
		background => {
			const data = [
				series( 'Views', 'views' ),
				series( 'Previous views', 'views', { type: 'comparison' } ),
				series( 'Visitors', 'visitors' ),
				series( 'Previous visitors', 'visitors', { type: 'comparison' } ),
			];
			const [ views, previousViews, visitors, previousVisitors ] = getGroupedBarColors(
				data,
				[ BLUE, BLUE, GREEN, GREEN ],
				background
			);

			for ( const [ primary, comparison ] of [
				[ views, previousViews ],
				[ visitors, previousVisitors ],
			] ) {
				expect( contrastRatio( comparison, background ) ).toBeGreaterThanOrEqual( 3 );
				expect( contrastRatio( comparison, background ) ).toBeLessThan( 3.1 );
				expect( contrastRatio( primary, comparison ) ).toBeGreaterThanOrEqual( 3 );
			}
		}
	);

	it( 'pairs a comparison without a group with the only primary', () => {
		const [ primary, comparison ] = getGroupedBarColors(
			[ series( 'Views' ), series( 'Previous', undefined, { type: 'comparison' } ) ],
			[ BLUE, GREEN ],
			'#ffffff'
		);

		expect( contrastRatio( primary, comparison ) ).toBeGreaterThanOrEqual( 3 );
	} );

	it( "keeps a primary's own stroke and tints its comparison from it", () => {
		const [ primary, comparison ] = getGroupedBarColors(
			[
				series( 'Views', 'views', { stroke: '#ff0000' } ),
				series( 'Previous', 'views', { type: 'comparison' } ),
			],
			[ '#ff0000', BLUE ],
			'#ffffff'
		);

		expect( [ primary, comparison ] ).toEqual( [
			'#ff0000',
			tintWithContrast( '#ff0000', '#ffffff' ),
		] );
	} );

	it.each( [
		[
			'a comparison stroked in a color of its own',
			[
				series( 'Views', 'views' ),
				series( 'Previous', 'views', { type: 'comparison', stroke: '#dbdbdb' } ),
			],
			[ BLUE, '#dbdbdb' ],
		],
		[
			'a primary color that is not hex',
			[ series( 'Views', 'views' ), series( 'Previous', 'views', { type: 'comparison' } ) ],
			[ 'currentColor', 'currentColor' ],
		],
		[ 'no comparison', [ series( 'Views' ), series( 'Visitors' ) ], [ BLUE, GREEN ] ],
	] )( 'keeps the colors given with %s', ( _case, data, colors ) => {
		expect( getGroupedBarColors( data, colors, '#ffffff' ) ).toEqual( colors );
	} );
} );
