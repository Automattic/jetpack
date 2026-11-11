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
 * The devices either period counted, in stacking order: a device with no views in one period is left out of its buckets.
 *
 * @param reports - The current and previous periods' reports.
 * @return The device keys.
 */
function getDeviceKeys( reports: ( StatsTimeSeriesReport | undefined )[] ): string[] {
	const totals = new Map< string, number >();
	for ( const report of reports ) {
		for ( const [ key, total ] of Object.entries( report?.summary ?? {} ) ) {
			if ( ! RANGE_FIELDS.has( key ) && typeof total === 'number' ) {
				totals.set( key, ( totals.get( key ) ?? 0 ) + total );
			}
		}
	}
	const rank = ( key: string ) => {
		const index = DEVICE_ORDER.indexOf( key );
		return index === -1 ? DEVICE_ORDER.length : index;
	};

	return [ ...totals ]
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
			getDeviceKeys( [ primary, hasComparison ? comparison : undefined ] ).map( key =>
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
		// A failed background refetch of the same range keeps its bars.
		isError: report.isError && ! primary?.data?.length,
		refetch: report.refetch,
	};
}
