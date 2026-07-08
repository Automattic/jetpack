/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getStatsPlanErrorReason, useStatsDevices } from '@jetpack-premium-analytics/data';
import { formatDisplayLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import type {
	ReportParams,
	StatsDevicesComparisonItem,
	StatsDeviceProperty,
} from '@jetpack-premium-analytics/data';

export interface DeviceView {
	label: string;
	displayLabel: string;
	percentage: number;
	previousPercentage?: number;
}

interface UseDeviceViewsArgs {
	/**
	 * PA ReportParams injected by the host via attributes.
	 */
	reportParams: ReportParams;
	/**
	 * Maximum rows to display (0 = all).
	 */
	max: number;
	/**
	 * Device dimension to break down by.
	 */
	deviceProperty?: StatsDeviceProperty;
}

interface DeviceViewsState {
	data: DeviceView[];
	hasComparison: boolean;
	isLoading: boolean;
	isError: boolean;
	errorReason: 'upgrade-required' | null;
}

/**
 * Maps raw API device keys to human-readable display labels.
 * Keys not in this map are title-cased as a fallback.
 */
const DEVICE_LABELS: Record< string, string > = {
	desktop: __( 'Desktop', 'jetpack-premium-analytics' ),
	mobile: __( 'Mobile', 'jetpack-premium-analytics' ),
	tablet: __( 'Tablet', 'jetpack-premium-analytics' ),
	phone: __( 'Phone', 'jetpack-premium-analytics' ),
	unknown: __( 'Unknown', 'jetpack-premium-analytics' ),
};

/**
 * Converts a StatsDevicesItem from the data layer to the widget's DeviceView shape.
 *
 * @param item - Normalized device item from the data layer.
 * @return DeviceView with a human-readable display label.
 */
function toDeviceView( item: StatsDevicesComparisonItem ): DeviceView {
	const key = typeof item.label === 'string' ? item.label : String( item.label );
	return {
		label: key,
		displayLabel: formatDisplayLabel( key, DEVICE_LABELS ),
		percentage: item.value,
		previousPercentage: item.previousValue,
	};
}

/**
 * Fetch device percentages for the Devices widget via the shared Stats data layer.
 *
 * @param {UseDeviceViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function useDeviceViews( {
	reportParams,
	max,
	deviceProperty = 'screensize',
}: UseDeviceViewsArgs ): DeviceViewsState {
	const statsParams = {
		...reportParams,
		deviceProperty,
	};

	const { comparisonRows, hasComparison, isLoading, isError, error } = useStatsDevices(
		statsParams,
		{ maxRows: max }
	);
	const errorReason = getStatsPlanErrorReason( error );

	const rows = ( comparisonRows?.rows ?? [] ).map( toDeviceView );

	return {
		data: rows,
		hasComparison,
		isLoading,
		isError,
		errorReason,
	};
}
