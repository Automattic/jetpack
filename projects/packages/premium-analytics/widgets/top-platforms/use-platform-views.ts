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
} from '@jetpack-premium-analytics/data';

export interface PlatformView {
	key: string;
	label: string;
	views: number;
}

interface UsePlatformViewsArgs {
	/**
	 * PA ReportParams from WidgetRoot context.
	 */
	reportParams: ReportParams;
	/**
	 * Maximum rows to display (0 = all).
	 */
	max: number;
	/**
	 * 'browser' or 'platform' (OS).
	 */
	deviceProperty: 'browser' | 'platform';
}

interface PlatformViewsState {
	data: PlatformView[];
	comparisonData: PlatformView[];
	hasComparison: boolean;
	isLoading: boolean;
	isError: boolean;
	errorReason: 'upgrade-required' | null;
}

const BROWSER_LABELS: Record< string, string > = {
	chrome: __( 'Chrome', 'jetpack-premium-analytics' ),
	safari: __( 'Safari', 'jetpack-premium-analytics' ),
	firefox: __( 'Firefox', 'jetpack-premium-analytics' ),
	edge: __( 'Edge', 'jetpack-premium-analytics' ),
	opera: __( 'Opera', 'jetpack-premium-analytics' ),
	samsung: __( 'Samsung Internet', 'jetpack-premium-analytics' ),
	ie: __( 'IE', 'jetpack-premium-analytics' ),
	yandex: __( 'Yandex', 'jetpack-premium-analytics' ),
	miui: __( 'Mi Browser', 'jetpack-premium-analytics' ),
	other: __( 'Other', 'jetpack-premium-analytics' ),
};

const PLATFORM_LABELS: Record< string, string > = {
	windows: __( 'Windows', 'jetpack-premium-analytics' ),
	mac: __( 'macOS', 'jetpack-premium-analytics' ),
	android: __( 'Android', 'jetpack-premium-analytics' ),
	linux: __( 'Linux', 'jetpack-premium-analytics' ),
	ios: __( 'iOS', 'jetpack-premium-analytics' ),
	ipad: __( 'iPad', 'jetpack-premium-analytics' ),
	iphone: __( 'iPhone', 'jetpack-premium-analytics' ),
	ipados: __( 'iPadOS', 'jetpack-premium-analytics' ),
	macos: __( 'macOS', 'jetpack-premium-analytics' ),
	chrome: __( 'Chrome OS', 'jetpack-premium-analytics' ),
	android_tablet: __( 'Android Tablet', 'jetpack-premium-analytics' ),
	other: __( 'Other', 'jetpack-premium-analytics' ),
};

function toPlatformView(
	item: StatsDevicesItem,
	deviceProperty: 'browser' | 'platform'
): PlatformView {
	const key = String( item.label ?? '' );
	const labels = deviceProperty === 'browser' ? BROWSER_LABELS : PLATFORM_LABELS;

	return {
		key,
		label: formatDisplayLabel( key, labels ),
		views: item.value,
	};
}

/**
 * Fetch platform views (browser or OS) via the shared Stats data layer.
 *
 * @param {UsePlatformViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function usePlatformViews( {
	reportParams,
	max,
	deviceProperty,
}: UsePlatformViewsArgs ): PlatformViewsState {
	const statsParams = {
		...reportParams,
		deviceProperty,
	};

	const { primary, comparison, hasComparison, isLoading, isError, error } =
		useStatsDevices( statsParams );
	const errorReason = getStatsPlanErrorReason( error );

	const report = primary.data as StatsNormalizedReport< StatsDevicesItem > | undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const items = rawItems
		.map( item => toPlatformView( item, deviceProperty ) )
		.slice( 0, max > 0 ? max : undefined );

	const comparisonReport = comparison.data as StatsNormalizedReport< StatsDevicesItem > | undefined;
	const comparisonRawItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const comparisonItems = comparisonRawItems
		.map( item => toPlatformView( item, deviceProperty ) )
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
