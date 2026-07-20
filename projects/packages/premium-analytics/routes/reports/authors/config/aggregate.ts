/**
 * External dependencies
 */
import {
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
	type StatsTopAuthorsItem,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

/**
 * One author or nested post row in the report table.
 */
export type AuthorRow = {
	id: string;
	/** The author parent row id; unset on author rows. */
	parentId?: string;
	/** The parent author's raw name, used to announce nested post context. */
	parentName?: string;
	label: string;
	avatarUrl: string | null;
	postId?: string;
	isGroup?: boolean;
	views: number;
};

type AggregatedAuthor = {
	row: AuthorRow;
	posts: Map< string, AuthorRow >;
};

/**
 * Build a period-independent key for an author. The endpoint normally provides
 * an author id; label plus avatar keeps anonymous/fallback authors aligned
 * across buckets when it does not.
 *
 * @param author - A normalized top-authors item.
 * @return The author's stable aggregation key.
 */
function getAuthorKey( author: StatsTopAuthorsItem ): string {
	if ( author.id != null ) {
		return `id:${ String( author.id ) }`;
	}

	return `label:${ String( author.label ?? '' ) }|${ author.icon ?? '' }`;
}

/**
 * Build a period-independent key for a post nested under an author.
 *
 * @param post - A normalized post item.
 * @return The post's stable aggregation key.
 */
function getPostKey( post: StatsTopPostsItem ): string {
	if ( post.id != null ) {
		return `id:${ String( post.id ) }`;
	}

	if ( post.link ) {
		return `link:${ post.link }`;
	}

	return `title:${ String( post.label ?? '' ) }`;
}

/**
 * Convert a daily top-authors report into the views-per-bucket series used by
 * the performance chart.
 *
 * @param report - The bucketed top-authors report.
 * @param period - The chart bucket period.
 * @return The chart-ready views time series.
 */
export function authorsToTimeSeries(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const views = point.items.reduce( ( total, author ) => total + author.views, 0 );

		return { value: views, views };
	} );
}

/**
 * Aggregate a bucketed top-authors report into author parent rows and nested
 * post rows, summing views across all buckets. Authors and their sibling posts
 * are ordered independently by descending views.
 *
 * @param report - The bucketed top-authors report.
 * @return The aggregate author rows.
 */
export function aggregateAuthorRows(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): AuthorRow[] {
	const authors = new Map< string, AggregatedAuthor >();

	for ( const point of report?.data ?? [] ) {
		for ( const author of point.items ) {
			const key = getAuthorKey( author );
			let aggregate = authors.get( key );

			if ( aggregate ) {
				aggregate.row.views += author.views;
			} else {
				aggregate = {
					row: {
						id: key,
						label: String( author.label ?? '' ),
						avatarUrl: author.icon,
						isGroup: true,
						views: author.views,
					},
					posts: new Map(),
				};
				authors.set( key, aggregate );
			}

			for ( const post of author.children ?? [] ) {
				const postKey = getPostKey( post );
				const rowId = `${ key }|post:${ postKey }`;
				const existingPost = aggregate.posts.get( postKey );

				if ( existingPost ) {
					existingPost.views += post.views;
				} else {
					aggregate.posts.set( postKey, {
						id: rowId,
						parentId: key,
						parentName: aggregate.row.label,
						label: String( post.label ?? '' ),
						avatarUrl: null,
						postId: post.id ? String( post.id ) : undefined,
						views: post.views,
					} );
				}
			}
		}
	}

	const rows: AuthorRow[] = [];
	const sortedAuthors = [ ...authors.values() ].sort( ( a, b ) => b.row.views - a.row.views );

	for ( const author of sortedAuthors ) {
		rows.push( author.row );
		rows.push( ...[ ...author.posts.values() ].sort( ( a, b ) => b.views - a.views ) );
	}

	console.log( 'rows', rows );

	return rows;
}
