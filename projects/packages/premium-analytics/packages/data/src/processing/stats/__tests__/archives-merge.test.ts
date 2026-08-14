import { mergeStatsArchivesComparisonRows } from '..';
import type { StatsArchivesItem, StatsNormalizedReport } from '..';

function makeReport( items: StatsArchivesItem[] ): StatsNormalizedReport< StatsArchivesItem > {
	return {
		summary: {},
		data: [
			{
				time_interval: '2026-06-25',
				date_start: '2026-06-25T00:00:00+00:00',
				date_end: '2026-06-25T23:59:59+00:00',
				items,
			},
		],
	};
}

describe( 'mergeStatsArchivesComparisonRows', () => {
	it( 'matches nested nodes within the same parent only', () => {
		const primary = makeReport( [
			{
				label: 'tax',
				value: 10,
				children: [
					{
						label: 'category',
						value: 10,
						children: [ { label: 'News', value: 10, children: null } ],
					},
				],
			},
		] );
		// Same term name lives under a different taxonomy in the comparison
		// period — it must not cross-match.
		const comparison = makeReport( [
			{
				label: 'tax',
				value: 4,
				children: [
					{
						label: 'post_tag',
						value: 4,
						children: [ { label: 'News', value: 4, children: null } ],
					},
				],
			},
		] );

		const { rows, hasComparison } = mergeStatsArchivesComparisonRows( primary, comparison );

		expect( hasComparison ).toBe( true );
		expect( rows[ 0 ] ).toEqual( expect.objectContaining( { label: 'tax', previousValue: 4 } ) );
		expect( rows[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( { label: 'category', previousValue: undefined } )
		);
		expect( rows[ 0 ].children?.[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( { label: 'News', previousValue: undefined } )
		);
	} );

	it( 'treats a zero comparison value as real data', () => {
		const { rows, hasComparison } = mergeStatsArchivesComparisonRows(
			makeReport( [ { label: 'search', value: 5, children: null } ] ),
			makeReport( [ { label: 'search', value: 0, children: null } ] )
		);

		expect( hasComparison ).toBe( true );
		expect( rows[ 0 ] ).toEqual( expect.objectContaining( { previousValue: 0 } ) );
	} );

	it( 'gates the overlap flag on the visible rows', () => {
		const primary = makeReport( [
			{ label: 'search', value: 9, children: null },
			{ label: 'cat', value: 1, children: null },
		] );
		// Only the row cut off by maxRows has a comparison match.
		const comparison = makeReport( [ { label: 'cat', value: 3, children: null } ] );

		const { rows, hasComparison } = mergeStatsArchivesComparisonRows( primary, comparison, 1 );

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ].label ).toBe( 'search' );
		expect( hasComparison ).toBe( false );
	} );

	it( 'reports no comparison when the comparison report is empty', () => {
		const { rows, hasComparison } = mergeStatsArchivesComparisonRows(
			makeReport( [ { label: 'search', value: 5, children: null } ] ),
			undefined
		);

		expect( hasComparison ).toBe( false );
		expect( rows[ 0 ] ).toEqual( expect.objectContaining( { previousValue: undefined } ) );
	} );
} );
