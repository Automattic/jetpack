/**
 * External dependencies
 */
import {
	fetchStatsReferrersRows,
	type StatsReferrersComparisonItem,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getSummarizedReportQueryParams } from './query-params';
import type { DatedReportCsvExporter } from './types';

/**
 * A flattened referrer group, source, or domain shown in the records table.
 */
export type ReferrerRecord = {
	id: string;
	parentId?: string;
	parentLabel?: string;
	label: string;
	views: number;
	previousValue?: number;
	link?: string;
	icon?: string;
	hasChildren?: boolean;
};

/**
 * Flatten nested comparison rows into the parent-linked shape consumed by
 * DataViews' native hierarchy support.
 *
 * @param items - Top-level referrer items.
 * @return Parent and child rows in depth-first display order.
 */
export function flattenReferrerRows(
	items: readonly StatsReferrersComparisonItem[]
): ReferrerRecord[] {
	const rows: ReferrerRecord[] = [];

	const appendRows = (
		children: readonly StatsReferrersComparisonItem[],
		parentId: string | undefined,
		parentLabel: string | undefined,
		parentPath: string[],
		inheritedIcon?: string
	) => {
		for ( const item of children ) {
			const itemChildren = item.children ?? [];
			const itemKey = item.link ?? item.label;
			const path = [ ...parentPath, itemKey ];
			const id = JSON.stringify( path );
			const icon = item.icon ?? inheritedIcon;

			rows.push( {
				id,
				...( parentId ? { parentId } : {} ),
				...( parentLabel ? { parentLabel } : {} ),
				label: item.label,
				views: item.views,
				previousValue: item.previousValue,
				...( item.link ? { link: item.link } : {} ),
				...( icon ? { icon } : {} ),
				...( itemChildren.length ? { hasChildren: true } : {} ),
			} );

			appendRows( itemChildren, id, item.label, path, icon ?? undefined );
		}
	};

	appendRows( items, undefined, undefined, [] );

	return rows;
}

export const referrersCsvExporter: DatedReportCsvExporter< ReferrerRecord, ReferrerRecord > = {
	filenamePrefix: 'referrers',
	hasDateRange: true,
	fetchItems: async reportParams =>
		flattenReferrerRows(
			await fetchStatsReferrersRows( getSummarizedReportQueryParams( reportParams ) )
		),
	toCsvRows: items => items,
	getColumns: () => [
		{ label: __( 'Referrer', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
		{
			label: __( 'Group', 'jetpack-premium-analytics-pkg' ),
			getValue: row => row.parentLabel ?? '',
		},
		{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
	],
};
