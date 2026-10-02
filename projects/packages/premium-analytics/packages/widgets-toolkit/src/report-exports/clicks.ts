/**
 * External dependencies
 */
import {
	aggregateStatsDrilldownRows,
	fetchStatsClicksRows,
	type StatsClicksComparisonItem,
	type StatsClicksItem,
	type StatsDrilldownItemContext,
	type StatsDrilldownSourceReport,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getSummarizedReportQueryParams } from './query-params';
import type { ReportCsvExporter } from './types';

export type ClickRow = {
	id: string;
	/** The click-group parent row id; unset on group rows and single-URL groups. */
	parentId?: string;
	clickedUrl: string;
	/** The external URL; group parent rows have none. */
	href?: string;
	/** Marks a group parent row: styled as a title in the table and given no CSV group. */
	isGroup?: boolean;
	clicks: number;
	/** Click count for the matching row in the comparison period. */
	previousClicks?: number;
};

type ClickDrilldownMetadata = {
	href?: string;
	previousClicks?: number;
};

type ClickItem = StatsClicksItem | StatsClicksComparisonItem;

/**
 * Return the display label used by the Clicks hierarchy.
 *
 * @param item - A normalized Clicks item.
 * @return The item label.
 */
function getClickLabel( item: ClickItem ): string {
	return String( item.label ?? item.link ?? '' );
}

/**
 * Build the stable row id used to aggregate a Clicks item across buckets.
 *
 * @param item    - A normalized Clicks item.
 * @param context - The item's hierarchy context.
 * @return The row id, or null for a row with no label and no URL.
 */
function getClickRowId(
	item: ClickItem,
	context: StatsDrilldownItemContext< ClickItem >
): string | null {
	const label = getClickLabel( item );

	if ( context.hasChildren ) {
		return context.parentId ? `${ context.parentId }|group:${ label }` : label;
	}

	if ( ! item.link ) {
		// The Clicks widget lists unlinked rows, so the table lists them too.
		// Without a URL the label is the only stable key.
		if ( ! label ) {
			return null;
		}

		return context.parentId ? `${ context.parentId }|label:${ label }` : `label:${ label }`;
	}

	return context.parentId ? `${ context.parentId }|${ item.link }` : `${ label }|${ item.link }`;
}

/**
 * Associate every linked descendant with its top-level Clicks group.
 *
 * @param item       - The current descendant.
 * @param group      - Its top-level group.
 * @param groupByUrl - Destination URL-to-group map.
 */
function registerClickGroupUrls(
	item: ClickItem,
	group: ClickItem,
	groupByUrl: Map< string, ClickItem >
): void {
	if ( item.link && ! groupByUrl.has( item.link ) ) {
		groupByUrl.set( item.link, group );
	}

	for ( const child of item.children ?? [] ) {
		registerClickGroupUrls( child, group, groupByUrl );
	}
}

/**
 * Normalize the Clicks endpoint's variable grouping across buckets. When only
 * one URL from a group is clicked in a bucket, the endpoint promotes it to a
 * top-level record. Recreate its known group so common hierarchy aggregation
 * can merge it with the same nested URL from other buckets.
 *
 * @param report - The bucketed Clicks report.
 * @return A report with known single-URL records nested under their group.
 */
function normalizeClickDrilldownGroups(
	report: StatsDrilldownSourceReport< ClickItem > | undefined
): StatsDrilldownSourceReport< ClickItem > | undefined {
	if ( ! report?.data ) {
		return undefined;
	}

	const groupByUrl = new Map< string, ClickItem >();

	for ( const point of report.data ) {
		for ( const item of point.items ) {
			if ( item.children?.length ) {
				registerClickGroupUrls( item, item, groupByUrl );
			}
		}
	}

	if ( ! groupByUrl.size ) {
		return report;
	}

	return {
		...report,
		data: report.data.map( point => ( {
			...point,
			items: point.items.map( item => {
				if ( item.children?.length || ! item.link ) {
					return item;
				}

				const group = groupByUrl.get( item.link );

				return group
					? {
							...group,
							views: item.views,
							children: [ item ],
						}
					: item;
			} ),
		} ) ),
	};
}

/**
 * Aggregate bucketed click groups into nested rows: one parent row per click
 * group with its clicked URLs as child rows, in display order.
 *
 * @param report - The bucketed clicks report.
 * @return Nested click rows in display order.
 */
export function aggregateClickRows( report?: StatsDrilldownSourceReport< ClickItem > ): ClickRow[] {
	return aggregateStatsDrilldownRows< ClickItem, ClickDrilldownMetadata >(
		normalizeClickDrilldownGroups( report ),
		{
			getChildren: item => item.children,
			getId: getClickRowId,
			getLabel: getClickLabel,
			getValue: item => item.views,
			getRowMetadata: ( item, { isGroup } ) => ( {
				...( ! isGroup && item.link ? { href: item.link } : {} ),
				...( 'previousValue' in item && item.previousValue !== undefined
					? { previousClicks: item.previousValue }
					: {} ),
			} ),
		}
	).map( row => ( {
		id: row.id,
		parentId: row.parentId,
		// Leaf rows show the full clicked URL; group rows show the group label.
		clickedUrl: row.href ?? row.label,
		href: row.href,
		isGroup: row.isGroup,
		clicks: row.value,
		...( row.previousClicks !== undefined ? { previousClicks: row.previousClicks } : {} ),
	} ) );
}

/**
 * Recover the source group encoded in a click row.
 *
 * Nested leaf rows expose the group directly as their parent id. A group with
 * only one URL stays flat, so its id retains the original `group|url` key.
 *
 * @param row - The click row to export.
 * @return The source click group.
 */
export function getClickCsvGroup( row: ClickRow ): string {
	if ( row.parentId ) {
		return row.parentId;
	}

	const urlSuffix = row.href ? `|${ row.href }` : '';
	return urlSuffix && row.id.endsWith( urlSuffix ) ? row.id.slice( 0, -urlSuffix.length ) : '';
}

type ClickCsvRow = ClickRow & { group: string };

// Rows stay in hierarchy order: a global sort would split groups from their URLs.
export const clicksCsvExporter: ReportCsvExporter< ClickRow, ClickCsvRow > = {
	filenamePrefix: 'clicks',
	hasDateRange: true,
	fetchItems: async reportParams =>
		aggregateClickRows( {
			data: [
				{ items: await fetchStatsClicksRows( getSummarizedReportQueryParams( reportParams ) ) },
			],
		} ),
	toCsvRows: items => items.map( row => ( { ...row, group: getClickCsvGroup( row ) } ) ),
	getColumns: () => [
		{
			label: __( 'Clicked URL', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.clickedUrl,
		},
		{ label: __( 'Group', 'jetpack-premium-analytics-pkg' ), getValue: row => row.group },
		{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ), getValue: row => row.clicks },
	],
};
