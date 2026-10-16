/**
 * External dependencies
 */
import {
	useStatsTags,
	type ReportParams,
	type StatsTagsItem,
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
 * @return Table rows and fetch state.
 */
export function useTagsReportRecords( reportParams: ReportParams ) {
	const tags = useStatsTags( { ...reportParams, max: TAGS_REPORT_ROW_LIMIT } );
	const rows = useMemo< StatsTagsItem[] >(
		() => tags.data?.data?.[ 0 ]?.items ?? [],
		[ tags.data ]
	);

	return {
		rows,
		isLoading: tags.isLoading,
		isFetching: tags.isFetching,
		isError: tags.isError,
		error: tags.error,
		refetch: tags.refetch,
	};
}
