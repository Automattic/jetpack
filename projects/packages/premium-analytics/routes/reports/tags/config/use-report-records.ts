/**
 * External dependencies
 */
import {
	selectStatsTagsItemsByType,
	useStatsTags,
	type ReportParams,
	type StatsTagsItem,
	type StatsTagsTermType,
} from '@jetpack-premium-analytics/data';
import { TAGS_REPORT_ROW_LIMIT } from '@jetpack-premium-analytics/widgets-toolkit';
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
 * Fetch the Tags & categories rows for the report window.
 *
 * @param reportParams - The report's date window.
 * @param termType     - Narrow the rows to tags or to categories, as the widget does; omit for both.
 * @return Table rows and fetch state.
 */
export function useTagsReportRecords( reportParams: ReportParams, termType?: StatsTagsTermType ) {
	const tags = useStatsTags( { ...reportParams, max: TAGS_REPORT_ROW_LIMIT } );
	const rows = useMemo< StatsTagsItem[] >( () => {
		const items = tags.data?.data?.[ 0 ]?.items ?? [];

		return termType ? selectStatsTagsItemsByType( items, termType ) : items;
	}, [ tags.data, termType ] );

	return {
		rows,
		isLoading: tags.isLoading,
		isFetching: tags.isFetching,
		isError: tags.isError,
		error: tags.error,
		refetch: tags.refetch,
	};
}
