/**
 * External dependencies
 */
import { useStatsHourOfDay, withoutComparison } from '@jetpack-premium-analytics/data';
import { formatHourOfDay } from '@jetpack-premium-analytics/formatters';
import { useWidgetRootContext } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
import type { StatsHourOfDayParams, StatsHourOfDayReport } from '@jetpack-premium-analytics/data';

export type PopularHourBucket = {
	hour: number;
	total: number;
	average: number;
};

export type PopularHourPeak = PopularHourBucket & {
	label: string;
};

/**
 * Picks the busiest hour by total views: every hour occurs once per reported
 * day, so totals rank the same as averages without risking rounding drift.
 */
function pickPeakHour( buckets: PopularHourBucket[] ) {
	const peak = buckets.reduce< PopularHourBucket | undefined >(
		( best, bucket ) => ( ! best || bucket.total > best.total ? bucket : best ),
		undefined
	);

	return peak && peak.total > 0 ? peak : undefined;
}

/**
 * Load views grouped into site-local hour-of-day buckets.
 */
export function usePopularHours() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo< StatsHourOfDayParams >(
		() => withoutComparison( { ...reportParams } ),
		[ reportParams ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsHourOfDay( params );
	const report = primary.data as StatsHourOfDayReport | undefined;

	const buckets = useMemo< PopularHourBucket[] >( () => {
		if ( ! report ) {
			return [];
		}

		// Average over the range the endpoint reports, not the one requested: it
		// caps ranges longer than a year.
		return report.buckets.map( ( { hour, views } ) => ( {
			hour,
			total: views,
			average: views / report.days,
		} ) );
	}, [ report ] );

	// Only the peak carries a label, so the other 23 hours are never formatted.
	const peak = useMemo< PopularHourPeak | undefined >( () => {
		const bucket = pickPeakHour( buckets );

		return bucket && { ...bucket, label: formatHourOfDay( bucket.hour ) };
	}, [ buckets ] );

	return {
		buckets,
		peak,
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	};
}
