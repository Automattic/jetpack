/**
 * Internal dependencies
 */
import { buildDatedTooltipModel } from '../dated-tooltip-model';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JUNE_1 = new Date( '2026-06-01T00:00:00Z' );
const DATA_FORMAT = { type: 'number' as const };
const CURRENCY = { type: 'currency' as const, options: { decimals: 2 } };

const SERIES: ComparativeLineChartSeries[] = [
	{ label: 'Views', group: 'views', data: [] },
	{ label: 'Views · previous period', group: 'views', options: { type: 'comparison' }, data: [] },
	{ label: 'Visitors', group: 'visitors', data: [] },
];
const STYLES = [ { stroke: '#views' }, { stroke: '#views-previous' }, { stroke: '#visitors' } ];
const COMPARISON_POINT = { date: JULY_1, realDate: JUNE_1, value: 80 };

type Entry = [ string, { datum: Record< string, unknown >; index: number; key: string } ];
const entry = ( key: string, datum: Record< string, unknown > ): Entry => [
	key,
	{ datum, index: 0, key },
];
const formatDate = ( point: { date: Date; realDate?: Date } ) =>
	( point.realDate ?? point.date ).toISOString().slice( 0, 10 );

function modelFor(
	entries: Entry[],
	extras?: Parameters< typeof buildDatedTooltipModel >[ 0 ][ 'extras' ],
	series = SERIES
) {
	return buildDatedTooltipModel( {
		tooltipData: { datumByKey: Object.fromEntries( entries ) },
		series,
		seriesStyles: STYLES,
		extras,
		dataFormat: DATA_FORMAT,
		formatDate,
	} );
}

describe( 'buildDatedTooltipModel', () => {
	it( 'returns null with nothing hovered', () => {
		expect( modelFor( [] ) ).toBeNull();
	} );

	it( 'heads the rows with the hovered date and gives each drawn row its swatch', () => {
		const model = modelFor( [
			entry( 'Views', { date: JULY_1, value: 100 } ),
			entry( 'Visitors', { date: JULY_1, value: 40 } ),
		] );

		expect( model ).toEqual( {
			date: '2026-07-01',
			previousDate: undefined,
			rows: [
				expect.objectContaining( {
					name: 'Views',
					value: 100,
					indicator: { kind: 'series', style: { stroke: '#views' } },
				} ),
				expect.objectContaining( {
					name: 'Visitors',
					value: 40,
					indicator: { kind: 'series', style: { stroke: '#visitors' } },
				} ),
			],
		} );
	} );

	// visx picks the nearest point by distance, so near the dashed line the hovered
	// point is the comparison one; its `realDate` must not take over the header.
	it( 'keeps the current date in the header when the nearest point is a comparison', () => {
		const model = modelFor( [
			entry( 'Views · previous period', COMPARISON_POINT ),
			entry( 'Views', { date: JULY_1, value: 100 } ),
		] );

		expect( model?.date ).toBe( '2026-07-01' );
		expect( model?.previousDate ).toBe( '2026-06-01' );
		expect( model?.rows ).toEqual( [
			expect.objectContaining( {
				name: 'Views',
				value: 100,
				previous: {
					value: 80,
					indicator: { kind: 'series', style: { stroke: '#views-previous' } },
				},
			} ),
		] );
	} );

	// A shorter comparison period has no point for the last bucket, so visx hands over
	// the dashed line's nearest point from the bucket before.
	it( 'reads a comparison point from another bucket as no data, under the current date', () => {
		const JULY_2 = new Date( '2026-07-02T00:00:00Z' );
		const model = modelFor( [
			entry( 'Views · previous period', COMPARISON_POINT ),
			entry( 'Views', { date: JULY_2, value: 100 } ),
		] );

		expect( model?.date ).toBe( '2026-07-02' );
		expect( model?.previousDate ).toBeUndefined();
		expect( model?.rows ).toEqual( [
			expect.objectContaining( {
				name: 'Views',
				value: 100,
				previous: {
					value: null,
					indicator: { kind: 'series', style: { stroke: '#views-previous' } },
				},
			} ),
		] );
	} );

	it( "carries the first hovered point's note, for a bucket the source has not counted", () => {
		const model = modelFor( [
			entry( 'Views', { date: JULY_1, value: null, note: 'Not counted yet.' } ),
			entry( 'Visitors', { date: JULY_1, value: null, note: 'Another note' } ),
		] );

		expect( model?.note ).toBe( 'Not counted yet.' );
		expect( model?.rows.map( row => row.value ) ).toEqual( [ null, null ] );
	} );

	it( 'drops a comparison whose metric is not reported, as a hidden series is not', () => {
		const model = modelFor( [
			entry( 'Visitors', { date: JULY_1, value: 40 } ),
			entry( 'Views · previous period', COMPARISON_POINT ),
		] );

		expect( model?.rows.map( row => row.name ) ).toEqual( [ 'Visitors' ] );
		expect( model?.previousDate ).toBeUndefined();
	} );

	// `alignSeriesDates` places such a comparison on the first series, so the
	// tooltip reads it there too rather than losing a line the chart draws.
	it.each( [
		[ 'ungrouped', { label: 'June', options: { type: 'comparison' as const }, data: [] } ],
		[
			'grouped with no current series in its group',
			{ label: 'June', group: 'orphan', options: { type: 'comparison' as const }, data: [] },
		],
	] )( 'pairs a comparison %s with the first series', ( _case, comparison ) => {
		const model = modelFor(
			[ entry( 'Views', { date: JULY_1, value: 100 } ), entry( 'June', COMPARISON_POINT ) ],
			undefined,
			[ SERIES[ 0 ], comparison ]
		);

		expect( model?.rows[ 0 ].previous?.value ).toBe( 80 );
	} );

	it( 'reads an extra at the hovered date as its own row, icon, format and comparison included', () => {
		const cpm = {
			label: 'Average CPM',
			icon: <span />,
			data: [ { date: JULY_1, value: 0.15 } ],
			previous: [ { date: JULY_1, realDate: JUNE_1, value: 0.1 } ],
			dataFormat: CURRENCY,
		};
		const model = modelFor( [ entry( 'Views', { date: JULY_1, value: 100 } ) ], [ cpm ] );

		expect( model?.rows[ 1 ] ).toEqual( {
			key: 'Average CPM',
			name: 'Average CPM',
			countLabel: undefined,
			dataFormat: CURRENCY,
			indicator: { kind: 'icon', icon: cpm.icon },
			value: 0.15,
			previous: { value: 0.1, indicator: { kind: 'icon', icon: cpm.icon } },
		} );
		expect( model?.previousDate ).toBe( '2026-06-01' );
	} );

	it( 'keeps an extra whose comparison bucket has a reading but the current one does not', () => {
		const posts = { label: 'Posts published', data: [], previous: [ { date: JULY_1, value: 3 } ] };
		const model = modelFor( [ entry( 'Views', { date: JULY_1, value: 100 } ) ], [ posts ] );

		expect( model?.rows[ 1 ] ).toEqual(
			expect.objectContaining( {
				name: 'Posts published',
				value: null,
				previous: expect.objectContaining( { value: 3 } ),
			} )
		);
	} );

	it( 'skips an extra with no point for the hovered date, and leaves an extra without an icon blank', () => {
		const model = modelFor(
			[ entry( 'Views', { date: JULY_1, value: 100 } ) ],
			[
				{ label: 'Revenue', data: [ { date: JULY_1, value: null } ] },
				{ label: 'Orders', data: [ { date: JUNE_1, value: 5 } ] },
			]
		);

		expect( model?.rows.slice( 1 ) ).toEqual( [
			expect.objectContaining( { name: 'Revenue', value: null, indicator: { kind: 'blank' } } ),
		] );
	} );

	// A counterpart in `MetricTabsChart` is drawn (hidden until revealed) and
	// listed; once the chart reports it, it must not turn into a blank row.
	it( 'keeps the swatch of a drawn series that is also listed as an extra', () => {
		const model = modelFor(
			[
				entry( 'Views', { date: JULY_1, value: 100 } ),
				entry( 'Visitors', { date: JULY_1, value: 40 } ),
			],
			[ { label: 'Visitors', data: [ { date: JULY_1, value: 999 } ] } ]
		);

		expect( model?.rows.map( row => [ row.name, row.value, row.indicator.kind ] ) ).toEqual( [
			[ 'Views', 100, 'series' ],
			[ 'Visitors', 40, 'series' ],
		] );
	} );
} );
