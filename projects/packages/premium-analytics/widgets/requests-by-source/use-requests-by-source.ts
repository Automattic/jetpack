/**
 * External dependencies
 */
import {
	EDGE_REQUEST_SOURCES,
	STATS_CHART_BUCKET_PERIODS,
	defaultPeriodForInterval,
	getDaysBetweenInclusive,
	isEdgeBotRequestsRangeTooLong,
	useStatsEdgeBotRequests,
	type EdgeRequestSource,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import type { StackedAreaSeries } from '@jetpack-premium-analytics/widgets-toolkit';

/** A window this short is drawn by the hour, since two daily points make no area. */
const HOURLY_MAX_DAYS = 2;

const BLOCKED_STROKE = 'var(--a8c-charts-color-trend-down)';

export type RequestSource = {
	key: EdgeRequestSource;
	label: string;
	total: number;
	/** Its part of every request in the window, 0 to 1; null when there were none. */
	share: number | null;
	series: StackedAreaSeries;
};

function sourceLabels(): Record< EdgeRequestSource, string > {
	return {
		human: __( 'Human', 'jetpack-premium-analytics-pkg' ),
		ai: __( 'AI bots', 'jetpack-premium-analytics-pkg' ),
		other: __( 'Other bots', 'jetpack-premium-analytics-pkg' ),
		blocked: __( 'Blocked', 'jetpack-premium-analytics-pkg' ),
	};
}

/**
 * The requests the edge saw in the dashboard's window, per source: its total, its
 * share and its points over time.
 *
 * @param reportParams - The dashboard range.
 * @return The sources, the bucket size drawn and the request's state.
 */
export default function useRequestsBySource( reportParams: ReportParams ) {
	// The AI tab has no interval control, so the range and the page's interval pick the bucket.
	const period: 'hour' | StatsChartBucketPeriod =
		getDaysBetweenInclusive( reportParams.from, reportParams.to ) <= HOURLY_MAX_DAYS
			? 'hour'
			: defaultPeriodForInterval( reportParams.interval, STATS_CHART_BUCKET_PERIODS );
	const params = useMemo( () => ( { ...reportParams, period } ), [ reportParams, period ] );
	const isRangeTooLong = isEdgeBotRequestsRangeTooLong( params );
	const { primary, timezone, isLoading, isFetching, isError, error, refetch } =
		useStatsEdgeBotRequests( params );
	const report = primary.data;

	const sources = useMemo< RequestSource[] >( () => {
		const labels = sourceLabels();
		const summary = report?.summary;
		const allRequests = EDGE_REQUEST_SOURCES.reduce(
			( sum, key ) => sum + ( summary?.[ key ] ?? 0 ),
			0
		);

		return EDGE_REQUEST_SOURCES.map( key => {
			const total = summary?.[ key ] ?? 0;
			const data = ( report?.data ?? [] ).flatMap( point => {
				const date = resolveBucketStamp( point.date_start, timezone );
				const endDate = resolveBucketStamp( point.date_end, timezone );
				return date ? [ { date, endDate, value: point[ key ] } ] : [];
			} );

			return {
				key,
				label: labels[ key ],
				total,
				share: allRequests > 0 ? total / allRequests : null,
				series: {
					label: labels[ key ],
					data,
					// What was refused takes the charts' own negative color, so it follows the theme.
					options: key === 'blocked' ? { stroke: BLOCKED_STROKE } : {},
				},
			};
		} );
	}, [ report, timezone ] );

	const hasRequests = sources.some( source => source.total > 0 );

	return {
		sources,
		period,
		isLoading,
		isFetching,
		// Placeholder rows from the previous window outlive a failed refetch.
		isError: isError && ! report?.data.length,
		isEmpty: isRangeTooLong || ( ! isLoading && ! hasRequests ),
		isRangeTooLong,
		error,
		refetch,
	};
}
