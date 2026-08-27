/**
 * External dependencies
 */
import { useStatsTags, type StatsTagsItem } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * Resolve the stable identity of a tag/category row.
 *
 * @param item - The normalized tag/category row.
 * @return Stable row key.
 */
export function getTagRowId( item: StatsTagsItem ): string {
	return item.link ?? item.labelText;
}

/**
 * Rows to request for the report table. The endpoint declares `max` as its only
 * query parameter and floors anything below 1 back to its default of 10, so a
 * report that wants every row has to name a number. Its own ranking is drawn
 * from at most 50 posts, which this comfortably clears.
 */
const TAGS_REPORT_ROW_LIMIT = 100;

/**
 * Fetch the Tags & categories rows.
 *
 * The endpoint reports one flat list over a fixed last-seven-days window and
 * takes no date parameters — WPCOM strips everything but `max` before the
 * handler runs, and Calypso never sends any — so the report renders no chart
 * and no date filters.
 *
 * @return Table rows and fetch state.
 */
export function useTagsReportRecords() {
	const tags = useStatsTags( { max: TAGS_REPORT_ROW_LIMIT } );
	const rows = useMemo< StatsTagsItem[] >(
		() => tags.data?.data?.[ 0 ]?.items ?? [],
		[ tags.data ]
	);

	return {
		rows,
		isLoading: tags.isLoading,
		isFetching: tags.isFetching,
		isError: tags.isError,
		refetch: tags.refetch,
	};
}
