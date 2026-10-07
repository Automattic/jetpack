/**
 * Internal dependencies
 */
import { buildDonutChartData, type DonutSegmentInput } from '../build-donut-chart-data';

const SEGMENTS: DonutSegmentInput[] = [
	{ label: 'Returning', value: 3820, previousValue: 3000 },
	{ label: 'New', value: 1210, previousValue: 1400 },
];

const OPTIONS = {
	hasComparison: true,
	format: { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } },
	styles: [ { color: '#111111' }, { color: '#222222' } ],
	mutedColor: '#f4f4f4',
};

describe( 'buildDonutChartData', () => {
	it( 'totals both periods from the segments', () => {
		const { total, previousTotal } = buildDonutChartData( SEGMENTS, OPTIONS );

		expect( total ).toBe( 5030 );
		expect( previousTotal ).toBe( 4400 );
	} );

	it( 'leaves the previous period out when the comparison is off', () => {
		const { previousTotal, legendData } = buildDonutChartData( SEGMENTS, {
			...OPTIONS,
			hasComparison: false,
		} );

		expect( previousTotal ).toBeNull();
		expect( legendData.map( item => item.comparison ) ).toEqual( [ undefined, undefined ] );
	} );

	it( 'writes the legend values in the given format', () => {
		const { legendData } = buildDonutChartData( SEGMENTS, {
			...OPTIONS,
			format: { type: 'currency', options: { useMultipliers: true } },
		} );

		expect( legendData.map( item => item.displayValue ) ).toEqual( [ '$3.8K', '$1.2K' ] );
	} );

	it( 'colors a muted segment in the neutral tone and the rest from the palette', () => {
		const { chartData, legendData } = buildDonutChartData(
			[ SEGMENTS[ 0 ], { ...SEGMENTS[ 1 ], muted: true } ],
			OPTIONS
		);

		expect( chartData.map( item => item.color ) ).toEqual( [ '#111111', '#f4f4f4' ] );
		expect( legendData.map( item => item.color ) ).toEqual( [ '#111111', '#f4f4f4' ] );
	} );
} );
