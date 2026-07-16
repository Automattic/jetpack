/**
 * External dependencies
 */
import {
	useStatsTags,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateTagRows, tagsToTimeSeries } from './aggregate';

/**
 * Fetch and derive the Tags & categories report chart and table from one
 * bucketed query.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and table records.
 */
export function useTagsReportRecords(
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
) {
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const tags = useStatsTags( recordsParams );
	const primaryData = tags.data;

	const chartPrimary = useMemo(
		() => tagsToTimeSeries( primaryData, chartPeriod ),
		[ primaryData, chartPeriod ]
	);
	const rows = useMemo( () => aggregateTagRows( primaryData ), [ primaryData ] );

	return {
		chart: {
			primary: chartPrimary,
			isLoading: tags.isLoading,
		},
		rows,
		isLoading: tags.isLoading,
	};
}
