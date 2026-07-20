/**
 * External dependencies
 */
import {
	aggregateStatsDrilldownRows,
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsDrilldownItemContext,
	type StatsDrilldownRow,
	type StatsDrilldownRowContext,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
	type StatsTopAuthorsItem,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

type AuthorDrilldownItem = StatsTopAuthorsItem | StatsTopPostsItem;

type AuthorDrilldownMetadata = {
	parentName?: string;
	avatarUrl: string | null;
	postId?: string;
};

/** One author or nested post row in the report table. */
export type AuthorRow = Omit< StatsDrilldownRow< AuthorDrilldownMetadata >, 'value' > & {
	views: number;
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
 * Build a stable hierarchy row id for an author or one of their posts.
 *
 * @param item    - The normalized author or post.
 * @param context - The item's hierarchy context.
 * @return The stable row id.
 */
function getAuthorDrilldownId(
	item: AuthorDrilldownItem,
	context: StatsDrilldownItemContext< AuthorDrilldownItem >
): string {
	if ( context.depth === 0 ) {
		return getAuthorKey( item as StatsTopAuthorsItem );
	}

	const postKey = getPostKey( item as StatsTopPostsItem );

	return context.parentId ? `${ context.parentId }|post:${ postKey }` : `post:${ postKey }`;
}

/**
 * Preserve report-specific author and post metadata on common drill-down rows.
 *
 * @param item    - The normalized author or post.
 * @param context - The aggregated row context.
 * @return Metadata used by the Authors table fields.
 */
function getAuthorDrilldownMetadata(
	item: AuthorDrilldownItem,
	context: StatsDrilldownRowContext< AuthorDrilldownItem >
): AuthorDrilldownMetadata {
	if ( context.depth === 0 ) {
		return {
			avatarUrl: ( item as StatsTopAuthorsItem ).icon,
		};
	}

	const post = item as StatsTopPostsItem;

	return {
		avatarUrl: null,
		parentName: String( context.parentItem?.label ?? '' ),
		postId: post.id != null ? String( post.id ) : undefined,
	};
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
	return aggregateStatsDrilldownRows< AuthorDrilldownItem, AuthorDrilldownMetadata >( report, {
		getChildren: item => item.children,
		getId: getAuthorDrilldownId,
		getLabel: item => String( item.label ?? '' ),
		getValue: item => item.views,
		isGroup: ( _item, { depth, hasChildren } ) => depth === 0 || hasChildren,
		getRowMetadata: getAuthorDrilldownMetadata,
	} ).map( ( { value, ...row } ) => ( { ...row, views: value } ) );
}
