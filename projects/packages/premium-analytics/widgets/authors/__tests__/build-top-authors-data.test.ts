/**
 * Internal dependencies
 */
import { buildTopAuthorsData } from '../build-top-authors-data';
import { mergeStatsTopAuthorsComparisonRows } from '@jetpack-premium-analytics/data';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '@jetpack-premium-analytics/data';

type PostSeed = {
	id?: string | number;
	title: string;
	views: number;
	link?: string | null;
};

type AuthorSeed = {
	/**
	 * Stable author id.
	 */
	id?: string | number;
	/**
	 * Display label (defaults to `Author`).
	 */
	label?: string;
	/**
	 * View count for the period.
	 */
	views: number;
	/**
	 * Avatar URL (defaults to none).
	 */
	avatar?: string | null;
	/**
	 * The author's posts (defaults to none).
	 */
	posts?: PostSeed[];
};

/**
 * Builds a single normalized top-authors item from a compact seed.
 *
 * @param {AuthorSeed} seed - The author seed.
 * @return A normalized top-authors item.
 */
function makeAuthor( {
	id,
	label = 'Author',
	views,
	avatar = null,
	posts,
}: AuthorSeed ): StatsTopAuthorsItem {
	return {
		id,
		label,
		views,
		icon: avatar,
		iconClassName: 'avatar-user',
		className: 'module-content-list-item-large',
		children: posts
			? posts.map( post => ( {
					id: post.id,
					label: post.title,
					views: post.views,
					link: post.link ?? null,
					page: null,
					actions: [],
					children: null,
			  } ) )
			: null,
	};
}

/**
 * Builds a normalized top-authors report. The Stats query layer summarizes
 * multi-day ranges server-side, so the report carries a single data point of
 * per-author totals — which is what the widget consumes.
 *
 * @param authors - The authors for the period, already ranked by the API.
 * @return A normalized top-authors report.
 */
function makeReport( authors: AuthorSeed[] ): StatsNormalizedReport< StatsTopAuthorsItem > {
	return {
		summary: { date_start: '2024-01-01', date_end: '2024-01-31' },
		data: [
			{
				time_interval: '2024-01-01',
				date_start: '2024-01-01',
				date_end: '2024-01-31',
				items: authors.map( makeAuthor ),
			},
		],
	};
}

function buildData(
	primary?: StatsNormalizedReport< StatsTopAuthorsItem >,
	comparison?: StatsNormalizedReport< StatsTopAuthorsItem >
) {
	return buildTopAuthorsData( mergeStatsTopAuthorsComparisonRows( primary, comparison ).rows );
}

describe( 'buildTopAuthorsData', () => {
	it( 'returns an empty array when the primary report is undefined', () => {
		expect( buildData( undefined, undefined ) ).toEqual( [] );
	} );

	it( 'returns an empty array when the primary report has no authors', () => {
		expect( buildData( makeReport( [] ), undefined ) ).toEqual( [] );
	} );

	it( 'maps a single author into leaderboard data', () => {
		const result = buildData( makeReport( [ { label: 'Alice', views: 10 } ] ), undefined );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toMatchObject( {
			id: 'label:Alice|',
			label: 'Alice',
			currentValue: 10,
			currentShare: 100,
		} );
		expect( result[ 0 ].previousValue ).toBeUndefined();
		expect( result[ 0 ].previousShare ).toBeUndefined();
		expect( result[ 0 ].delta ).toBeUndefined();
	} );

	it( 'preserves the order the API returns authors in', () => {
		const result = buildData(
			makeReport( [
				{ label: 'Bob', views: 20 },
				{ label: 'Carol', views: 12 },
				{ label: 'Alice', views: 5 },
			] ),
			undefined
		);

		expect( result.map( author => author.label ) ).toEqual( [ 'Bob', 'Carol', 'Alice' ] );
	} );

	it( 'aligns comparison values by author id', () => {
		const result = buildData(
			makeReport( [ { id: 1, label: 'Alice', views: 150 } ] ),
			makeReport( [ { id: 1, label: 'Alice', views: 100 } ] )
		);

		expect( result[ 0 ] ).toMatchObject( {
			currentValue: 150,
			previousValue: 100,
			delta: 50,
		} );
	} );

	it( 'aligns comparison values by label and avatar when there is no id', () => {
		const result = buildData(
			makeReport( [ { label: 'Alice', views: 150, avatar: 'https://example.com/a.png' } ] ),
			makeReport( [ { label: 'Alice', views: 100, avatar: 'https://example.com/a.png' } ] )
		);

		expect( result[ 0 ] ).toMatchObject( {
			currentValue: 150,
			previousValue: 100,
			delta: 50,
		} );
	} );

	it( 'does not fabricate comparison values for authors missing from the comparison period', () => {
		const result = buildData(
			makeReport( [
				{ id: 1, label: 'Alice', views: 10 },
				{ id: 2, label: 'Bob', views: 8 },
			] ),
			makeReport( [ { id: 1, label: 'Alice', views: 5 } ] )
		);

		const bob = result.find( author => author.label === 'Bob' );
		expect( bob?.previousValue ).toBeUndefined();
		expect( bob?.delta ).toBeUndefined();
	} );

	it( 'localizes the untracked-authors sentinel produced by the sanitizer', () => {
		const result = buildData(
			makeReport( [ { label: 'Untracked Authors', views: 5 } ] ),
			undefined
		);

		expect( result[ 0 ].label ).toBe( 'Untracked authors' );
	} );

	it( 'carries the author avatar and an empty posts list when there are no children', () => {
		const result = buildData(
			makeReport( [ { label: 'Alice', views: 10, avatar: 'https://example.com/a.png' } ] ),
			undefined
		);

		expect( result[ 0 ] ).toMatchObject( {
			avatarUrl: 'https://example.com/a.png',
			posts: [],
		} );
	} );

	it( 'maps the author children into drill-down posts without fabricating comparison values', () => {
		const result = buildData(
			makeReport( [
				{
					label: 'Alice',
					views: 30,
					posts: [
						{ id: 12, title: 'Hello world', views: 20, link: 'https://example.com/hello' },
						{ title: 'Second post', views: 10 },
					],
				},
			] ),
			undefined
		);

		expect( result[ 0 ].posts ).toEqual( [
			{
				id: '12',
				title: 'Hello world',
				link: 'https://example.com/hello',
				currentValue: 20,
				previousValue: undefined,
				currentShare: 100,
				previousShare: undefined,
				delta: undefined,
			},
			{
				id: 'post-1',
				title: 'Second post',
				link: null,
				currentValue: 10,
				previousValue: undefined,
				currentShare: 50,
				previousShare: undefined,
				delta: undefined,
			},
		] );
	} );

	it( 'uses author ids to keep same-name authors distinct', () => {
		const result = buildData(
			makeReport( [
				{
					id: 1,
					label: 'Alex',
					views: 30,
					posts: [ { id: 101, title: 'First Alex post', views: 30 } ],
				},
				{
					id: 2,
					label: 'Alex',
					views: 20,
					posts: [ { id: 201, title: 'Second Alex post', views: 20 } ],
				},
			] ),
			makeReport( [
				{
					id: 1,
					label: 'Alex',
					views: 10,
					posts: [ { id: 101, title: 'First Alex post', views: 10 } ],
				},
				{
					id: 2,
					label: 'Alex',
					views: 15,
					posts: [ { id: 201, title: 'Second Alex post', views: 15 } ],
				},
			] )
		);

		expect(
			result.map( author => ( { id: author.id, previousValue: author.previousValue } ) )
		).toEqual( [
			{ id: '1', previousValue: 10 },
			{ id: '2', previousValue: 15 },
		] );
		expect( result[ 0 ].posts[ 0 ] ).toMatchObject( {
			id: '101',
			title: 'First Alex post',
			previousValue: 10,
		} );
		expect( result[ 1 ].posts[ 0 ] ).toMatchObject( {
			id: '201',
			title: 'Second Alex post',
			previousValue: 15,
		} );
	} );

	it( 'aligns author posts across comparison periods and includes dropped posts', () => {
		const result = buildData(
			makeReport( [
				{
					label: 'Alice',
					views: 30,
					posts: [
						{ id: 1, title: 'Still popular', views: 20 },
						{ id: 2, title: 'New post', views: 10 },
					],
				},
			] ),
			makeReport( [
				{
					label: 'Alice',
					views: 40,
					posts: [
						{ id: 1, title: 'Still popular', views: 30 },
						{ id: 3, title: 'Dropped post', views: 10 },
					],
				},
			] )
		);

		expect( result[ 0 ].posts ).toEqual( [
			{
				id: '1',
				title: 'Still popular',
				link: null,
				currentValue: 20,
				previousValue: 30,
				currentShare: 66.66666666666666,
				previousShare: 100,
				delta: -33.33333333333333,
			},
			{
				id: '2',
				title: 'New post',
				link: null,
				currentValue: 10,
				previousValue: undefined,
				currentShare: 33.33333333333333,
				previousShare: undefined,
				delta: undefined,
			},
			{
				id: '3',
				title: 'Dropped post',
				link: null,
				currentValue: 0,
				previousValue: 10,
				currentShare: 0,
				previousShare: 33.33333333333333,
				delta: -100,
			},
		] );
	} );
} );

describe( 'mergeStatsTopAuthorsComparisonRows', () => {
	it( 'detects when at least one primary author overlaps the comparison period', () => {
		expect(
			mergeStatsTopAuthorsComparisonRows(
				makeReport( [
					{ label: 'Alice', views: 10 },
					{ label: 'Bob', views: 8 },
				] ),
				makeReport( [ { label: 'Bob', views: 5 } ] )
			).hasComparison
		).toBe( true );
	} );

	it( 'does not detect comparison rows when authors do not overlap', () => {
		expect(
			mergeStatsTopAuthorsComparisonRows(
				makeReport( [ { label: 'Alice', views: 10 } ] ),
				makeReport( [ { label: 'Carol', views: 5 } ] )
			).hasComparison
		).toBe( false );
	} );

	it( 'only counts overlap on rows visible under maxRows', () => {
		const { rows, hasComparison } = mergeStatsTopAuthorsComparisonRows(
			makeReport( [
				{ id: 1, label: 'Alice', views: 10 },
				{ id: 2, label: 'Bob', views: 8 },
			] ),
			// Only Bob overlaps, but Bob is cut off by maxRows.
			makeReport( [ { id: 2, label: 'Bob', views: 5 } ] ),
			1
		);

		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ] ).toMatchObject( { key: '1' } );
		expect( hasComparison ).toBe( false );
	} );

	it( 'treats a zero-valued comparison row as real comparison data', () => {
		const { rows, hasComparison } = mergeStatsTopAuthorsComparisonRows(
			makeReport( [ { id: 1, label: 'Alice', views: 10 } ] ),
			makeReport( [ { id: 1, label: 'Alice', views: 0 } ] )
		);

		expect( rows[ 0 ].previousViews ).toBe( 0 );
		expect( hasComparison ).toBe( true );
	} );
} );
