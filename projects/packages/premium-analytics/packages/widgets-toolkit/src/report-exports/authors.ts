/**
 * External dependencies
 */
import {
	aggregateStatsDrilldownRows,
	fetchStatsTopAuthorsRows,
	findAuthorRow,
	type ReportParams,
	type StatsReportParams,
	type StatsDrilldownItemContext,
	type StatsDrilldownRow,
	type StatsDrilldownRowContext,
	type StatsDrilldownSourceReport,
	type StatsTopAuthorsComparisonItem,
	type StatsTopAuthorsItem,
	type StatsTopAuthorsPostComparisonItem,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getPostsCsvColumns } from './posts';
import { getReportWindowParams } from './query-params';
import type { ReportCsvExporter } from './types';

const UNTRACKED_AUTHORS_SENTINEL = 'Untracked Authors';

type AuthorDrilldownItem =
	| StatsTopAuthorsItem
	| StatsTopAuthorsComparisonItem
	| StatsTopPostsItem
	| StatsTopAuthorsPostComparisonItem;

type AuthorDrilldownMetadata = {
	parentName?: string;
	avatarUrl: string | null;
	postId?: string;
	previousViews?: number;
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
	const previousViews =
		'previousViews' in item && item.previousViews !== undefined
			? { previousViews: item.previousViews }
			: {};

	if ( context.depth === 0 ) {
		const author = item as StatsTopAuthorsItem;

		return {
			avatarUrl: author.icon,
			...previousViews,
		};
	}

	const post = item as StatsTopPostsItem;

	return {
		avatarUrl: null,
		parentName: String( context.parentItem?.label ?? '' ),
		postId: post.id != null ? String( post.id ) : undefined,
		...previousViews,
	};
}

/**
 * Convert the top-authors report into author parent rows and nested post rows.
 * Authors and their sibling posts are ordered independently by descending views.
 *
 * @param report - The normalized top-authors report.
 * @return The aggregate author rows.
 */
export function aggregateAuthorRows(
	report: StatsDrilldownSourceReport< AuthorDrilldownItem > | undefined
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

/**
 * Resolve the localized author display name shown in the table and exported to CSV.
 *
 * @param name - The raw author name.
 * @return The localized author display name.
 */
export function getAuthorName( name: string ): string {
	if ( ! name || name === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics-pkg' );
	}

	return name;
}

/**
 * The Authors report's query: `max: 0` returns every author, as Calypso's Authors report does.
 * WPCOM caps all time at the three years classic Stats shows.
 */
export function getAuthorsReportQueryParams( reportParams: ReportParams ): StatsReportParams {
	return { ...reportParams, max: 0, ...getReportWindowParams( reportParams ) };
}

/** One author's posts over the author page's own window, shared by its widget and its CSV. */
export function getAuthorPostsQueryParams( reportParams: ReportParams ): StatsReportParams {
	return { ...reportParams, max: 0 };
}

/**
 * Keep nested posts identifiable after the table hierarchy is flattened into CSV rows.
 *
 * @param item - The author or nested post row.
 * @return The author name or author-qualified post title.
 */
function getAuthorCsvLabel( item: AuthorRow ): string {
	return item.parentName
		? `${ getAuthorName( item.parentName ) } > ${ item.label }`
		: getAuthorName( item.label );
}

export const authorsCsvExporter: ReportCsvExporter< AuthorRow, AuthorRow > = {
	filenamePrefix: 'top-authors',
	hasDateRange: true,
	fetchItems: async reportParams =>
		aggregateAuthorRows( {
			data: [
				{ items: await fetchStatsTopAuthorsRows( getAuthorsReportQueryParams( reportParams ) ) },
			],
		} ),
	toCsvRows: items => items,
	getColumns: () => [
		{
			label: __( 'Author', 'jetpack-premium-analytics-pkg' ),
			getValue: getAuthorCsvLabel,
		},
		{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
	],
};

/** One author's posts from the Authors report, for the author page, which has no report of its own. */
export function authorPostsCsvExporter(
	authorId: number,
	authorName: string
): ReportCsvExporter< StatsTopAuthorsPostComparisonItem, StatsTopAuthorsPostComparisonItem > {
	return {
		// A name with only punctuation slugs to nothing; the id still names the file.
		filenamePrefix: `author-${ cleanForSlug( authorName ) || authorId }-posts`,
		hasDateRange: true,
		datesAllTime: true,
		fetchItems: async reportParams =>
			findAuthorRow(
				await fetchStatsTopAuthorsRows( getAuthorPostsQueryParams( reportParams ) ),
				authorId
			)?.children ?? [],
		toCsvRows: items => items,
		getColumns: () => getPostsCsvColumns< StatsTopAuthorsPostComparisonItem >(),
	};
}
