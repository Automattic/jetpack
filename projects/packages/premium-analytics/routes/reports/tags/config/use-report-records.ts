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
 * Rows to request for the report table. `stats/tags` declares `max` as its only
 * query parameter and is the one stats endpoint that floors anything below 1
 * back to its default of 10 (`if ( $max < 1 ) $max = 10;`), rather than reading
 * it as "all rows" the way its siblings do — so a report that wants more than
 * the widget's ten has to name a number. Its ranking is drawn from at most 50
 * posts, which this comfortably clears.
 */
const TAGS_REPORT_ROW_LIMIT = 100;

/**
 * Fetch the Tags & categories rows.
 *
 * One flat list, no chart and no date filters, because the endpoint takes no
 * date parameters — see `TAGS_REPORT_ROW_LIMIT` above.
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
