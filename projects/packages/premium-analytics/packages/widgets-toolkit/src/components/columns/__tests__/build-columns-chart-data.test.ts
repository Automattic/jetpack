/**
 * Internal dependencies
 */
import { buildColumnsChartData, type ColumnInput } from '../build-columns-chart-data';

const COLUMNS: ColumnInput[] = [
	{ label: 'Returning', value: 3820, previousValue: 3000 },
	{ label: 'New', value: 1210 },
];

const LABELS = { primary: 'Oct 1 – 7, 2026', comparison: 'Sep 24 – 30, 2026' };

describe( 'buildColumnsChartData', () => {
	it( 'draws one series per period over the same categories, a missing previous figure as 0', () => {
		expect( buildColumnsChartData( COLUMNS, { hasComparison: true, labels: LABELS } ) ).toEqual( [
			{
				label: 'Oct 1 – 7, 2026',
				data: [
					{ label: 'Returning', value: 3820 },
					{ label: 'New', value: 1210 },
				],
			},
			{
				label: 'Sep 24 – 30, 2026',
				data: [
					{ label: 'Returning', value: 3000 },
					{ label: 'New', value: 0 },
				],
			},
		] );
	} );

	it( 'draws no comparison bar for a column the comparison has no figure for', () => {
		const series = buildColumnsChartData(
			[ COLUMNS[ 0 ], { label: 'Tablet', value: 120, previousValue: null } ],
			{ hasComparison: true, labels: LABELS }
		);

		expect( series[ 1 ].data ).toEqual( [
			{ label: 'Returning', value: 3000 },
			{ label: 'Tablet', value: null },
		] );
	} );

	it( 'leaves the comparison series out while the comparison period is off', () => {
		const series = buildColumnsChartData( COLUMNS, { hasComparison: false, labels: LABELS } );

		expect( series.map( item => item.label ) ).toEqual( [ 'Oct 1 – 7, 2026' ] );
	} );

	it( 'leaves the comparison series out while no column carries a previous figure', () => {
		const series = buildColumnsChartData(
			COLUMNS.map( ( { label, value } ) => ( { label, value } ) ),
			{ hasComparison: true, labels: LABELS }
		);

		expect( series.map( item => item.label ) ).toEqual( [ 'Oct 1 – 7, 2026' ] );
	} );
} );
