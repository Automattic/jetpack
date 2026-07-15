/**
 * External dependencies
 */
import {
	useStatsArchives,
	useStatsTopPosts,
	type ReportParams,
	type StatsChartBucketPeriod,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import {
	aggregateArchiveRows,
	aggregatePostRows,
	archivesToTimeSeries,
	postsToTimeSeries,
} from './aggregate';
import type { ReportPostsTabId } from './tabs';

/**
 * Fetch and derive the chart and table records for the active report tab.
 *
 * @param activeTab    - The active Posts & Pages report tab.
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and per-tab table records.
 */
export function usePostsReportRecords(
	activeTab: ReportPostsTabId,
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
) {
	const isPostsTab = activeTab === 'posts-pages';

	/*
	 * One bucketed report per tab feeds both the chart and the table (see
	 * `config/aggregate.ts`), so the chart is scoped to exactly the records
	 * shown below it. `summarize: 0` opts out of the data layer's automatic
	 * summarization to get daily buckets. The chart control is applied only to
	 * client-side chart derivation. `max: 0` asks for every row so
	 * search/sort/pagination run client-side. Each tab's report only fetches
	 * while its tab is active. `skip_archives=1` mirrors the Stats "Most
	 * viewed" card: the homepage is returned inside `stats/top-posts` as
	 * "Homepage (Latest posts)" (so it belongs on the Posts & Pages tab) and
	 * omitted from `stats/archives`, preventing double counting between tabs.
	 */
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
			skip_archives: 1,
		} ),
		[ reportParams ]
	);
	const posts = useStatsTopPosts( recordsParams, { enabled: isPostsTab } );
	const archives = useStatsArchives( recordsParams, { enabled: ! isPostsTab } );

	const activeReport = isPostsTab ? posts : archives;

	const chartPrimary = useMemo( () => {
		return isPostsTab
			? postsToTimeSeries( posts.primary.data, chartPeriod )
			: archivesToTimeSeries( archives.primary.data, chartPeriod );
	}, [ isPostsTab, posts.primary.data, archives.primary.data, chartPeriod ] );
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return isPostsTab
			? postsToTimeSeries( posts.comparison.data, chartPeriod )
			: archivesToTimeSeries( archives.comparison.data, chartPeriod );
	}, [ isPostsTab, reportParams, posts.comparison.data, archives.comparison.data, chartPeriod ] );

	const postRows = useMemo< StatsTopPostsItem[] >(
		() => aggregatePostRows( posts.primary.data ),
		[ posts.primary.data ]
	);
	const archiveRows = useMemo(
		() => aggregateArchiveRows( archives.primary.data ),
		[ archives.primary.data ]
	);

	return {
		chart: {
			primary: chartPrimary,
			comparison: activeReport.hasComparison ? chartComparison : undefined,
			isLoading: activeReport.isLoading,
		},
		posts: {
			rows: postRows,
			isLoading: posts.isLoading,
		},
		archives: {
			rows: archiveRows,
			isLoading: archives.isLoading,
		},
	};
}
