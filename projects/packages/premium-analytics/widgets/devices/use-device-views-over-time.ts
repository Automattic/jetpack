/**
 * External dependencies
 */
import { useStatsDevicesPeriods } from '@jetpack-premium-analytics/data';
import { buildMetricTab, formatDisplayLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
import type { ReportParams, StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';
import type { MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { DEVICE_LABELS } from './use-device-views';
import type { DevicesChartGranularity } from './widget';

/** Stacked bottom up in this order; any other device follows, largest first. */
const DEVICE_ORDER = [ 'desktop', 'mobile', 'tablet' ];

const RANGE_FIELDS = new Set( [ 'date_start', 'date_end' ] );

interface DeviceViewsOverTimeState {
	/** One tab per device, its views in each bucket and, with comparison on, the previous period's. */
	devices: MetricTab[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

/**
 * The devices a report counted, in stacking order.
 *
 * @param report - The current period's report.
 * @return The device keys.
 */
function getDeviceKeys( report: StatsTimeSeriesReport | undefined ): string[] {
	const totals = Object.entries( report?.summary ?? {} ).filter(
		( entry ): entry is [ string, number ] =>
			! RANGE_FIELDS.has( entry[ 0 ] ) && typeof entry[ 1 ] === 'number'
	);
	const rank = ( key: string ) => {
		const index = DEVICE_ORDER.indexOf( key );
		return index === -1 ? DEVICE_ORDER.length : index;
	};

	return totals
		.sort( ( [ a, aTotal ], [ b, bTotal ] ) => rank( a ) - rank( b ) || bTotal - aTotal )
		.map( ( [ key ] ) => key );
}

/**
 * Screen-size views in each bucket of the range, for the Devices bar chart.
 *
 * @param reportParams - The dashboard range and comparison.
 * @param period       - The bucket size.
 * @return The devices and the request state.
 */
export default function useDeviceViewsOverTime(
	reportParams: ReportParams,
	period: DevicesChartGranularity
): DeviceViewsOverTimeState {
	const params = useMemo(
		() => ( { ...reportParams, period, deviceProperty: 'screensize' as const } ),
		[ reportParams, period ]
	);
	const report = useStatsDevicesPeriods( params );
	const primary = report.primary.data as StatsTimeSeriesReport | undefined;
	const comparison = report.comparison.data as StatsTimeSeriesReport | undefined;
	const { hasComparison, timezone, periodStarts } = report;

	const devices = useMemo(
		() =>
			getDeviceKeys( primary ).map( key =>
				buildMetricTab( {
					primary,
					comparison,
					hasComparison,
					field: key,
					label: formatDisplayLabel( key, DEVICE_LABELS ),
					zone: timezone,
					periodStarts,
				} )
			),
		[ primary, comparison, hasComparison, timezone, periodStarts ]
	);

	return {
		devices,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		// Placeholder data keeps the last range's bars through a failed refetch.
		isError: report.isError && ! primary?.data?.length,
		refetch: report.refetch,
	};
}
