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
	StatsDevicesItem,
	StatsNormalizedReport,
	StatsDeviceProperty,
} from '@jetpack-premium-analytics/data';

export interface DeviceView {
	label: string;
	displayLabel: string;
	percentage: number;
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
	comparisonData: DeviceView[];
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	errorReason: 'upgrade-required' | null;
	refetch: () => void;
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
function toDeviceView( item: StatsDevicesItem ): DeviceView {
	const key = typeof item.label === 'string' ? item.label : String( item.label );
	return {
		label: key,
		displayLabel: formatDisplayLabel( key, DEVICE_LABELS ),
		percentage: item.value,
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

	const { primary, comparison, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsDevices( statsParams );
	const errorReason = getStatsPlanErrorReason( error );

	const report = primary.data as StatsNormalizedReport< StatsDevicesItem > | undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const items = rawItems.map( toDeviceView ).slice( 0, max > 0 ? max : undefined );

	const comparisonReport = comparison.data as StatsNormalizedReport< StatsDevicesItem > | undefined;
	const comparisonRawItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const comparisonItems = comparisonRawItems
		.map( toDeviceView )
		.slice( 0, max > 0 ? max : undefined );

	return {
		data: items,
		comparisonData: comparisonItems,
		// When comparison is requested but its query fails, drop to a
		// non-comparison view rather than pairing every row with a placeholder 0.
		hasComparison: hasComparison && ! comparison.isError,
		isLoading,
		isFetching,
		// The Stats queries carry `placeholderData: previousData => previousData`, so a
		// failed range change keeps the prior period's rows in `data` while `isError`
		// flips true. Only surface the error when there's nothing to show, so a transient
		// refetch failure doesn't replace populated rows with the error state.
		isError: items.length === 0 && isError,
		errorReason,
		// The data layer's combined refetch: memoized, awaits both queries, and
		// skips the comparison query when comparison is disabled.
		refetch,
	};
}
