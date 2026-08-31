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
 * `stats/tags` has no "all rows" value (see `StatsTagsParams`), so a report that
 * wants more than the widget's ten has to name a number.
 */
const TAGS_REPORT_ROW_LIMIT = 100;

/**
 * Fetch the Tags & categories rows.
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
