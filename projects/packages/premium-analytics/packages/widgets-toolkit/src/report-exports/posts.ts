/**
 * External dependencies
 */
import {
	fetchStatsArchivesRows,
	fetchStatsTopPostsRows,
	type ReportParams,
	type StatsArchivesComparisonItem,
	type StatsArchivesItem,
	type StatsReportParams,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { ReportCsvExporter } from './types';
import type { CsvColumn } from '../helpers/build-csv';

/** The Posts & pages report's query: every row, summarized over the window. */
export function getPostsReportQueryParams( reportParams: ReportParams ): StatsReportParams {
	return { ...reportParams, max: 0, period: 'day', summarize: 1, skip_archives: 1 };
}

type PostsCsvRow = { label?: unknown; views: number; link?: string | null };

/** Title, Views, and URL: the columns both Posts & pages tabs export. */
export function getPostsCsvColumns< Row extends PostsCsvRow >(): CsvColumn< Row >[] {
	return [
		{
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			getValue: row => String( row.label ?? '' ),
		},
		{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	];
}

/** A flat DataViews row carrying its place in the archives hierarchy. */
export type ArchiveRow = {
	id: string;
	parentId?: string;
	label: string;
	views: number;
	previousViews?: number;
	link?: string;
	isGroup: boolean;
};

/**
 * Human-readable labels for the archive-type keys returned by the API.
 *
 * @param archiveType - The raw archive-type key.
 * @return The archive type's display label.
 */
function getArchiveTypeLabel( archiveType: string ): string {
	switch ( archiveType ) {
		case 'author':
			return __( 'Authors', 'jetpack-premium-analytics-pkg' );
		case 'cat':
			return __( 'Categories', 'jetpack-premium-analytics-pkg' );
		case 'err':
			return __( 'Error', 'jetpack-premium-analytics-pkg' );
		case 'home':
			return __( 'Homepage (Latest posts)', 'jetpack-premium-analytics-pkg' );
		case 'search':
			return __( 'Searches', 'jetpack-premium-analytics-pkg' );
		case 'tag':
			return __( 'Tags', 'jetpack-premium-analytics-pkg' );
		case 'tax':
			return __( 'Taxonomies', 'jetpack-premium-analytics-pkg' );
		case 'date':
			return __( 'Dates', 'jetpack-premium-analytics-pkg' );
		case 'multiple':
			return __( 'Aggregated', 'jetpack-premium-analytics-pkg' );
		case 'other':
			return __( 'Others', 'jetpack-premium-analytics-pkg' );
		case 'post_type':
			return __( 'Post types', 'jetpack-premium-analytics-pkg' );
		default:
			return archiveType.charAt( 0 ).toUpperCase() + archiveType.slice( 1 ).toLowerCase();
	}
}

/**
 * Humanize an intermediate archive group such as a taxonomy key.
 *
 * @param label - The raw group label.
 * @return The human-readable group label.
 */
function getArchiveGroupLabel( label: string ): string {
	const spaced = label.replace( /_/g, ' ' );
	return spaced.charAt( 0 ).toUpperCase() + spaced.slice( 1 );
}

/**
 * Convert one normalized archive item into DataViews' flat hierarchy shape.
 *
 * @param item       - The normalized archive item.
 * @param id         - Stable ID for the item.
 * @param parentId   - Stable ID of the parent item, when nested.
 * @param isTopLevel - Whether this item is an archive-type row.
 * @return The item followed by all of its descendants.
 */
function buildArchiveEntryRows(
	item: StatsArchivesItem | StatsArchivesComparisonItem,
	id: string,
	parentId: string | undefined,
	isTopLevel: boolean
): ArchiveRow[] {
	const rawLabel = String( item.label ?? '' );
	const children = item.children ?? [];
	const link = typeof item.link === 'string' ? item.link : undefined;
	const previousViews =
		'previousValue' in item && item.previousValue !== undefined
			? { previousViews: item.previousValue }
			: {};
	let label = rawLabel;
	if ( isTopLevel ) {
		label = getArchiveTypeLabel( rawLabel );
	} else if ( children.length ) {
		label = getArchiveGroupLabel( rawLabel );
	}
	const row: ArchiveRow = {
		id,
		...( parentId ? { parentId } : {} ),
		label: label || __( 'Untitled', 'jetpack-premium-analytics-pkg' ),
		views: item.value,
		...previousViews,
		...( link ? { link } : {} ),
		isGroup: children.length > 0,
	};

	return [
		row,
		...children.flatMap( ( child, index ) =>
			buildArchiveEntryRows( child, `${ id }-${ index }`, id, false )
		),
	];
}

/**
 * Flatten the normalized archives tree while retaining parent IDs for
 * DataViews' native hierarchy. The API's value-sorted order is preserved at
 * each level; the table can also re-sort siblings without breaking nesting.
 *
 * @param items - The top-level archive groups.
 * @return Parent and child rows in depth-first order.
 */
export function buildArchiveRows(
	items: Array< StatsArchivesItem | StatsArchivesComparisonItem >
): ArchiveRow[] {
	return items.flatMap( ( group, groupIndex ) =>
		buildArchiveEntryRows( group, `${ String( group.label ) }-${ groupIndex }`, undefined, true )
	);
}

/**
 * Prepare the archive rows for CSV export the way legacy Stats does: group
 * rows stay in as subtotals, and every descendant carries its ancestors in the
 * label (`Tags > video`) so a row still identifies itself once the table's
 * nesting is gone. `buildArchiveRows` emits parents ahead of their children,
 * so each parent's full label is already resolved by the time a child needs it.
 *
 * @param rows - The flat archive rows, in depth-first order.
 * @return The same rows, with ancestor-qualified labels.
 */
export function buildArchiveCsvRows( rows: ArchiveRow[] ): ArchiveRow[] {
	const pathById = new Map< string, string >();

	return rows.map( row => {
		const parentPath = row.parentId ? pathById.get( row.parentId ) : undefined;
		const label = parentPath ? `${ parentPath } > ${ row.label }` : row.label;

		pathById.set( row.id, label );

		return { ...row, label };
	} );
}

const byViewsDescending = ( a: StatsTopPostsComparisonItem, b: StatsTopPostsComparisonItem ) =>
	b.views - a.views;

export const postsPagesCsvExporter: ReportCsvExporter<
	StatsTopPostsComparisonItem,
	StatsTopPostsComparisonItem
> = {
	filenamePrefix: 'top-posts',
	hasDateRange: true,
	fetchItems: reportParams => fetchStatsTopPostsRows( getPostsReportQueryParams( reportParams ) ),
	toCsvRows: items => [ ...items ].sort( byViewsDescending ),
	getColumns: () => getPostsCsvColumns< StatsTopPostsComparisonItem >(),
};

// No sort here: a global sort would split each archive group from its children.
export const archivesCsvExporter: ReportCsvExporter< StatsArchivesComparisonItem, ArchiveRow > = {
	filenamePrefix: 'archives',
	hasDateRange: true,
	fetchItems: reportParams => fetchStatsArchivesRows( getPostsReportQueryParams( reportParams ) ),
	toCsvRows: items => buildArchiveCsvRows( buildArchiveRows( items ) ),
	getColumns: () => getPostsCsvColumns< ArchiveRow >(),
};
