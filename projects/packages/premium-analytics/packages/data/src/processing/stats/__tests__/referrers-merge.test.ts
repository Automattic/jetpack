import { mergeStatsReferrersComparisonRows } from '..';
import type { StatsNormalizedReport, StatsReferrersItem } from '..';

function makeItem( overrides: Partial< StatsReferrersItem > ): StatsReferrersItem {
	return {
		label: '',
		views: 0,
		link: null,
		icon: null,
		labelIcon: null,
		children: null,
		...overrides,
	};
}

function makeReport( items: StatsReferrersItem[] ): StatsNormalizedReport< StatsReferrersItem > {
	return {
		summary: {},
		data: [
			{
				time_interval: '2026-06-29',
				date_start: '2026-06-29 00:00:00',
				date_end: '2026-06-29 23:59:59',
				items,
			},
		],
	};
}

describe( 'mergeStatsReferrersComparisonRows', () => {
	it( 'matches nested sources within the same group only', () => {
		const primary = makeReport( [
			makeItem( {
				label: 'Search Engines',
				views: 4801,
				icon: 'https://example.com/search-engine.png',
				children: [
					makeItem( {
						label: 'Google Search',
						views: 3936,
						icon: 'https://example.com/google.png',
						children: [
							makeItem( {
								label: 'google.com',
								views: 3920,
								link: 'https://www.google.com/',
								labelIcon: 'external',
							} ),
						],
					} ),
				],
			} ),
			makeItem( {
				label: 'jetpack.com',
				views: 18,
				link: 'https://jetpack.com/',
				labelIcon: 'external',
			} ),
		] );
		// The same domain appears under a different group in the comparison
		// period — it must not cross-match into Search Engines' subtree.
		const comparison = makeReport( [
			makeItem( {
				label: 'Search Engines',
				views: 4100,
				children: [
					makeItem( {
						label: 'Google Search',
						views: 3300,
						children: [
							makeItem( {
								label: 'google.com',
								views: 3290,
								link: 'https://www.google.com/',
								labelIcon: 'external',
							} ),
						],
					} ),
				],
			} ),
			makeItem( {
				label: 'Recommendations',
				views: 90,
				children: [
					makeItem( {
						label: 'google.com',
						views: 90,
						link: 'https://www.google.com/',
						labelIcon: 'external',
					} ),
				],
			} ),
		] );

		const { rows, hasComparison } = mergeStatsReferrersComparisonRows( primary, comparison );

		expect( hasComparison ).toBe( true );
		expect( rows[ 0 ] ).toEqual(
			expect.objectContaining( { label: 'Search Engines', previousValue: 4100 } )
		);
		expect( rows[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( { label: 'Google Search', previousValue: 3300 } )
		);
		expect( rows[ 0 ].children?.[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( { label: 'google.com', previousValue: 3290 } )
		);
		// Unmatched rows keep previousValue undefined rather than a fake zero.
		expect( rows[ 1 ] ).toEqual(
			expect.objectContaining( { label: 'jetpack.com', previousValue: undefined } )
		);
	} );

	it( 'inherits the group favicon down to sources and domains', () => {
		const primary = makeReport( [
			makeItem( {
				label: 'Search Engines',
				views: 100,
				icon: 'https://example.com/search-engine.png',
				children: [
					makeItem( {
						label: 'Google Search',
						views: 100,
						icon: 'https://example.com/google.png',
						children: [
							makeItem( { label: 'google.com', views: 100, link: 'https://www.google.com/' } ),
						],
					} ),
				],
			} ),
		] );

		const { rows } = mergeStatsReferrersComparisonRows( primary, undefined );
		const domain = rows[ 0 ].children?.[ 0 ].children?.[ 0 ];

		expect( domain?.icon ).toBe( 'https://example.com/google.png' );
	} );

	it( 'gates the comparison flag on the visible rows only', () => {
		const primary = makeReport( [
			makeItem( { label: 'a.com', views: 5, link: 'https://a.com/' } ),
			makeItem( { label: 'b.com', views: 2, link: 'https://b.com/' } ),
		] );
		// Only the second-ranked row overlaps the comparison period, so capping
		// the list to one row must not switch the comparison UI on.
		const comparison = makeReport( [
			makeItem( { label: 'b.com', views: 4, link: 'https://b.com/' } ),
		] );

		const capped = mergeStatsReferrersComparisonRows( primary, comparison, 1 );
		expect( capped.rows ).toHaveLength( 1 );
		expect( capped.hasComparison ).toBe( false );

		const full = mergeStatsReferrersComparisonRows( primary, comparison, 0 );
		expect( full.rows ).toHaveLength( 2 );
		expect( full.hasComparison ).toBe( true );
	} );

	it( 'flags subtrees whose children overlap the comparison period', () => {
		const primary = makeReport( [
			makeItem( {
				label: 'Search Engines',
				views: 10,
				children: [ makeItem( { label: 'Google Search', views: 10 } ) ],
			} ),
			makeItem( {
				label: 'Recommendations',
				views: 5,
				children: [ makeItem( { label: 'wordpress.com', views: 5 } ) ],
			} ),
		] );
		const comparison = makeReport( [
			makeItem( {
				label: 'Search Engines',
				views: 8,
				children: [ makeItem( { label: 'Google Search', views: 8 } ) ],
			} ),
		] );

		const { rows } = mergeStatsReferrersComparisonRows( primary, comparison );

		expect( rows[ 0 ].childrenHaveComparison ).toBe( true );
		expect( rows[ 1 ].childrenHaveComparison ).toBe( false );
	} );

	it( 'sorts every level by views descending', () => {
		const primary = makeReport( [
			makeItem( {
				label: 'Group',
				views: 10,
				children: [
					makeItem( { label: 'small', views: 1 } ),
					makeItem( { label: 'big', views: 9 } ),
				],
			} ),
			makeItem( { label: 'Top', views: 20 } ),
		] );

		const { rows } = mergeStatsReferrersComparisonRows( primary, undefined );

		expect( rows.map( row => row.label ) ).toEqual( [ 'Top', 'Group' ] );
		expect( rows[ 1 ].children?.map( row => row.label ) ).toEqual( [ 'big', 'small' ] );
	} );
} );
