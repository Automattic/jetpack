/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { LegendItem } from '../components';
import type { SemiCircleChartData } from '../components/chart-semi-circle/semi-circle-chart';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

export interface SessionsByDeviceData {
	chartData: SemiCircleChartData;
	total: number;
	comparisonTotal: number;
	legendData: LegendItem[];
}

/**
 * Maps API `device_type` values to display labels.
 */
const DEVICE_LABELS: Record< string, string > = {
	mobile: __( 'Mobile', 'jetpack-premium-analytics-pkg' ),
	desktop: __( 'Desktop', 'jetpack-premium-analytics-pkg' ),
	tablet: __( 'Tablet', 'jetpack-premium-analytics-pkg' ),
};

function getDeviceLabel( deviceType: string ): string {
	const normalized = deviceType.toLowerCase();
	return DEVICE_LABELS[ normalized ] || deviceType;
}

/**
 * Builds chart and legend data for the Sessions by Device widget.
 *
 * @param sessionsByDevice           - Primary period sessions by device data
 * @param comparisonSessionsByDevice - Comparison period sessions by device data
 */
export function buildSessionsByDeviceData(
	sessionsByDevice: ReportDataMap[ 'sessionsByDevice' ] | undefined,
	comparisonSessionsByDevice?: ReportDataMap[ 'sessionsByDevice' ] | undefined
): SessionsByDeviceData {
	if ( ! sessionsByDevice?.data || sessionsByDevice.data.length === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		};
	}

	const { data, summary } = sessionsByDevice;
	const total = summary.total_sessions;
	const comparisonTotal = comparisonSessionsByDevice?.summary?.total_sessions || 0;

	if ( total === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal,
			legendData: [],
		};
	}

	const comparisonMap = new Map< string, number >();
	if ( comparisonSessionsByDevice?.data ) {
		comparisonSessionsByDevice.data.forEach( item => {
			comparisonMap.set( item.device_type.toLowerCase(), item.active_sessions );
		} );
	}

	const chartData: SemiCircleChartData = data.map( item => ( {
		label: getDeviceLabel( item.device_type ),
		value: item.active_sessions,
		valueDisplay: formatMetricValue( item.active_sessions, 'number', {
			useMultipliers: true,
			decimals: 0,
		} ),
	} ) );

	const legendData: LegendItem[] = data.map( item => {
		const normalizedType = item.device_type.toLowerCase();
		const comparisonValue = comparisonSessionsByDevice
			? comparisonMap.get( normalizedType ) || 0
			: undefined;

		return {
			label: getDeviceLabel( item.device_type ),
			value: item.active_sessions,
			displayValue: formatMetricValue( item.active_sessions, 'number', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: comparisonValue,
		};
	} );

	return {
		chartData,
		total,
		comparisonTotal,
		legendData,
	};
}
