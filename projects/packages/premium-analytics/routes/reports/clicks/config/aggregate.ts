/**
 * External dependencies
 */
import {
	aggregateStatsDrilldownRows,
	bucketStatsTimeSeries,
	type StatsChartBucketPeriod,
	type StatsClicksItem,
	type StatsDrilldownItemContext,
	type StatsNormalizedReport,
	type StatsTimeSeriesReport,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import type { ClickRow } from './fields';

type ClickDrilldownMetadata = {
	href?: string;
};

/**
 * Return the display label used by the Clicks hierarchy.
 *
 * @param item - A normalized Clicks item.
 * @return The item label.
 */
function getClickLabel( item: StatsClicksItem ): string {
	return String( item.label ?? item.link ?? '' );
}

/**
 * Build the stable row id used to aggregate a Clicks item across buckets.
 *
 * @param item    - A normalized Clicks item.
 * @param context - The item's hierarchy context.
 * @return The row id, or null for an unlinked leaf.
 */
function getClickRowId(
	item: StatsClicksItem,
	context: StatsDrilldownItemContext< StatsClicksItem >
): string | null {
	const label = getClickLabel( item );

	if ( context.hasChildren ) {
		return context.parentId ? `${ context.parentId }|group:${ label }` : label;
	}

	if ( ! item.link ) {
		return null;
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
	item: StatsClicksItem,
	group: StatsClicksItem,
	groupByUrl: Map< string, StatsClicksItem >
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
	report: StatsNormalizedReport< StatsClicksItem > | undefined
): StatsNormalizedReport< StatsClicksItem > | undefined {
	if ( ! report ) {
		return undefined;
	}

	const groupByUrl = new Map< string, StatsClicksItem >();

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
 * Convert a daily clicks report to a clicks-per-bucket time series.
 *
 * Top-level click groups already contain their children's totals, so only
 * top-level values are summed to avoid double-counting flattened child URLs.
 *
 * @param report - The daily clicks report.
 * @param period - The chart bucket period.
 * @return The chart-ready time series.
 */
export function clicksToTimeSeries(
	report: StatsNormalizedReport< StatsClicksItem > | undefined,
	period: StatsChartBucketPeriod = 'day'
): StatsTimeSeriesReport {
	return bucketStatsTimeSeries( report, period, point => {
		const clicks = point.items.reduce( ( total, item ) => total + item.views, 0 );

		return { value: clicks, clicks };
	} );
}

/**
 * Aggregate bucketed click groups into nested rows: one parent row per click
 * group with its clicked URLs as child rows, in display order.
 *
 * @param report - The bucketed clicks report.
 * @return Nested click rows in display order.
 */
export function aggregateClickRows(
	report?: StatsNormalizedReport< StatsClicksItem >
): ClickRow[] {
	return aggregateStatsDrilldownRows< StatsClicksItem, ClickDrilldownMetadata >(
		normalizeClickDrilldownGroups( report ),
		{
			getChildren: item => item.children,
			getId: getClickRowId,
			getLabel: getClickLabel,
			getValue: item => item.views,
			getRowMetadata: ( item, { isGroup } ) =>
				! isGroup && item.link ? { href: item.link } : {},
		}
	).map( row => ( {
		id: row.id,
		parentId: row.parentId,
		// Leaf rows show the full clicked URL; group rows show the group label.
		clickedUrl: row.href ?? row.label,
		href: row.href,
		isGroup: row.isGroup,
		clicks: row.value,
	} ) );
}
