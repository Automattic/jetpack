/**
 * External dependencies
 */
import {
	EDGE_REQUEST_SOURCES,
	getDaysBetweenInclusive,
	useStatsEdgeBotRequests,
	type EdgeRequestSource,
	type ReportParams,
	type StatsEdgeBotRequestsGranularity,
} from '@jetpack-premium-analytics/data';
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import type { ComparativeLineChartSeries } from '@jetpack-premium-analytics/widgets-toolkit';

/** A window this short is drawn by the hour, since two daily points make no area. */
const HOURLY_MAX_DAYS = 2;

export type RequestSource = {
	key: EdgeRequestSource;
	label: string;
	total: number;
	/** Its part of every request in the window, 0 to 1; null when there were none. */
	share: number | null;
	series: ComparativeLineChartSeries;
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
 * @param blockedColor - The color of the Blocked part, which is not one of the series colors.
 * @return The sources, the bucket size drawn and the request's state.
 */
export default function useRequestsBySource( reportParams: ReportParams, blockedColor: string ) {
	const granularity: StatsEdgeBotRequestsGranularity =
		getDaysBetweenInclusive( reportParams.from, reportParams.to ) <= HOURLY_MAX_DAYS
			? 'hour'
			: 'day';
	const params = useMemo(
		() => ( { ...reportParams, granularity } ),
		[ reportParams, granularity ]
	);
	const { primary, timezone, isLoading, isFetching, isError, refetch } =
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
					options: key === 'blocked' ? { stroke: blockedColor } : {},
				},
			};
		} );
	}, [ report, timezone, blockedColor ] );

	const hasRequests = sources.some( source => source.total > 0 );

	return {
		sources,
		granularity,
		isLoading,
		isFetching,
		// Placeholder rows from the previous window outlive a failed refetch.
		isError: isError && ! report?.data.length,
		isEmpty: ! isLoading && ! hasRequests,
		refetch,
	};
}
