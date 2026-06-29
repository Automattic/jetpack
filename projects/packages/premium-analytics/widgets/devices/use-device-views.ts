/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	getApiErrorCode,
	getApiErrorStatus,
	useStatsDevices,
} from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsDevicesItem,
	StatsNormalizedReport,
	StatsDeviceProperty,
} from '@jetpack-premium-analytics/data';

export interface DeviceView {
	label: string;
	displayLabel: string;
	views: number;
}

interface UseDeviceViewsArgs {
	reportParams: ReportParams;
	max: number;
	deviceProperty?: StatsDeviceProperty;
}

interface DeviceViewsState {
	data: DeviceView[];
	comparisonData: DeviceView[];
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

const NON_PLAN_FORBIDDEN_ERROR_CODES = new Set( [ 'no_connection' ] );

/**
 * Maps a raw API device key to a human-readable label.
 *
 * @param key - Raw device key from the API (e.g. 'desktop', 'mobile').
 * @return Display label for the device type.
 */
function toDisplayLabel( key: string ): string {
	return DEVICE_LABELS[ key.toLowerCase() ] ?? key.charAt( 0 ).toUpperCase() + key.slice( 1 );
}

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
		displayLabel: toDisplayLabel( key ),
		views: item.views,
	};
}

/**
 * Fetch device views for the Devices widget via the shared Stats data layer.
 *
 * @param args                - Hook arguments.
 * @param args.reportParams   - PA ReportParams injected by the host via attributes.
 * @param args.max            - Maximum rows to display (0 = all).
 * @param args.deviceProperty - Device dimension to break down by.
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

	const { primary, comparison, hasComparison, isLoading, isError, error } =
		useStatsDevices( statsParams );
	const errorCode = getApiErrorCode( error );
	const errorReason =
		getApiErrorStatus( error ) === 403 && ! NON_PLAN_FORBIDDEN_ERROR_CODES.has( errorCode ?? '' )
			? 'upgrade-required'
			: null;

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
		hasComparison,
		isLoading,
		isError,
		errorReason,
	};
}
