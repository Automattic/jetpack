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
 * Fetch the all-time Tags & categories rows.
 *
 * The endpoint ignores date-window parameters (`period`, `start_date`,
 * `days`, `summarize`) and always reports one flat all-time list — verified
 * against WPCOM directly, and matching Calypso, which never sends date
 * params here — so the report requests only `max: 0` (all rows) and renders
 * no chart or date filters.
 *
 * @return Table rows and fetch state.
 */
export function useTagsReportRecords() {
	const tags = useStatsTags( { max: 0 } );
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
