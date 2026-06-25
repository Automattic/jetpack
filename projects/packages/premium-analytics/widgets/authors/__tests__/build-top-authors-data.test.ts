/**
 * Internal dependencies
 */
import { buildTopAuthorsData } from '../build-top-authors-data';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '@jetpack-premium-analytics/data';

type AuthorSeed = {
	label?: string;
	views: number;
};

/**
 * Builds a single normalized top-authors item from a compact seed.
 *
 * @param seed       - The author seed.
 * @param seed.label - Display label (defaults to `Author`).
 * @param seed.views - View count for the period.
 * @return A normalized top-authors item.
 */
function makeAuthor( { label = 'Author', views }: AuthorSeed ): StatsTopAuthorsItem {
	return {
		label,
		views,
		icon: null,
		iconClassName: 'avatar-user',
		className: 'module-content-list-item-large',
		children: null,
	};
}

/**
 * Builds a normalized top-authors report. Each inner array represents the
 * authors for one data point (time interval), so multiple data points can be
 * passed to exercise cross-interval aggregation.
 *
 * @param dataPoints - Authors grouped per data point.
 * @return A normalized top-authors report.
 */
function makeReport( dataPoints: AuthorSeed[][] ): StatsNormalizedReport< StatsTopAuthorsItem > {
	return {
		summary: { date_start: '2024-01-01', date_end: '2024-01-31' },
		data: dataPoints.map( ( authors, index ) => ( {
			time_interval: `2024-01-${ String( index + 1 ).padStart( 2, '0' ) }`,
			date_start: '2024-01-01',
			date_end: '2024-01-31',
			items: authors.map( makeAuthor ),
		} ) ),
	};
}

describe( 'buildTopAuthorsData', () => {
	it( 'returns an empty array when the primary report is undefined', () => {
		expect( buildTopAuthorsData( undefined, undefined ) ).toEqual( [] );
	} );

	it( 'returns an empty array when the primary report has no authors', () => {
		expect( buildTopAuthorsData( makeReport( [ [] ] ), undefined ) ).toEqual( [] );
	} );

	it( 'maps a single author into leaderboard data', () => {
		const result = buildTopAuthorsData(
			makeReport( [ [ { label: 'Alice', views: 10 } ] ] ),
			undefined
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toMatchObject( {
			id: 'Alice',
			label: 'Alice',
			currentValue: 10,
			previousValue: 0,
			currentShare: 100,
			previousShare: 0,
			// No comparison value, so the author reads as newly appeared.
			delta: 100,
		} );
	} );

	it( 'aggregates views for the same author across data points', () => {
		const result = buildTopAuthorsData(
			makeReport( [ [ { label: 'Alice', views: 4 } ], [ { label: 'Alice', views: 6 } ] ] ),
			undefined
		);

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].currentValue ).toBe( 10 );
	} );

	it( 'sorts authors by views in descending order', () => {
		const result = buildTopAuthorsData(
			makeReport( [
				[
					{ label: 'Alice', views: 5 },
					{ label: 'Bob', views: 20 },
					{ label: 'Carol', views: 12 },
				],
			] ),
			undefined
		);

		expect( result.map( author => author.label ) ).toEqual( [ 'Bob', 'Carol', 'Alice' ] );
	} );

	it( 'truncates the leaderboard to maxEntries', () => {
		const result = buildTopAuthorsData(
			makeReport( [
				[
					{ label: 'Alice', views: 50 },
					{ label: 'Bob', views: 40 },
					{ label: 'Carol', views: 30 },
				],
			] ),
			undefined,
			2
		);

		expect( result.map( author => author.label ) ).toEqual( [ 'Alice', 'Bob' ] );
	} );

	it( 'aligns comparison values by author label', () => {
		const result = buildTopAuthorsData(
			makeReport( [ [ { label: 'Alice', views: 150 } ] ] ),
			makeReport( [ [ { label: 'Alice', views: 100 } ] ] )
		);

		expect( result[ 0 ] ).toMatchObject( {
			currentValue: 150,
			previousValue: 100,
			delta: 50,
		} );
	} );

	it( 'treats authors missing from the comparison period as zero', () => {
		const result = buildTopAuthorsData(
			makeReport( [
				[
					{ label: 'Alice', views: 10 },
					{ label: 'Bob', views: 8 },
				],
			] ),
			makeReport( [ [ { label: 'Alice', views: 5 } ] ] )
		);

		const bob = result.find( author => author.label === 'Bob' );
		expect( bob ).toMatchObject( { previousValue: 0, delta: 100 } );
	} );
} );
