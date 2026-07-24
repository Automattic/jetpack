/**
 * External dependencies
 */
import {
	useStatsVideoPlays,
	type ReportParams,
	type StatsVideoPlaysComparisonItem,
} from '@jetpack-premium-analytics/data';
import { useCallback, useMemo } from '@wordpress/element';

const EMPTY_VIDEO_ROWS: StatsVideoPlaysComparisonItem[] = [];

/**
 * Fetch the Videos report table from the range summary and restore its row links.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Table records and request state.
 */
export function useVideosReportRecords( reportParams: ReportParams ) {
	/*
	 * The complete-stats summary supplies the table metrics but omits row
	 * links. Keep the daily request to restore those links without changing
	 * the summary rows or date range shown in the table.
	 */
	const linkParams = useMemo( () => {
		const params = { ...reportParams };
		delete params.compare_from;
		delete params.compare_to;
		delete params.compare_preset;
		delete params.comp;

		return {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		};
	}, [ reportParams ] );
	const linkVideos = useStatsVideoPlays( linkParams );
	const summaryParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 1,
			complete_stats: 1,
		} ),
		[ reportParams ]
	);
	const summary = useStatsVideoPlays( summaryParams );
	const primaryData = linkVideos.primary.data;
	const summaryRows = summary.comparisonRows?.rows ?? EMPTY_VIDEO_ROWS;
	const primaryLinksById = useMemo( () => {
		const links = new Map< string, string >();

		for ( const point of primaryData?.data ?? [] ) {
			for ( const video of point.items ) {
				if ( video.id != null && video.link ) {
					links.set( String( video.id ), video.link );
				}
			}
		}

		return links;
	}, [ primaryData ] );
	const rows = useMemo(
		() =>
			summaryRows.map( row => ( {
				...row,
				link:
					row.link ??
					( row.id != null ? primaryLinksById.get( String( row.id ) ) : undefined ) ??
					null,
			} ) ),
		[ summaryRows, primaryLinksById ]
	);

	const linkVideosRefetch = linkVideos.refetch;
	const summaryRefetch = summary.refetch;
	const refetch = useCallback( async () => {
		await Promise.all( [ linkVideosRefetch(), summaryRefetch() ] );
	}, [ linkVideosRefetch, summaryRefetch ] );

	return {
		isError: linkVideos.isError || summary.isError,
		refetch,
		rows,
		hasComparison: summary.hasComparison,
		isLoading: summary.isLoading,
	};
}
