/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useStatsDevices } from '@jetpack-premium-analytics/data';
import { formatDisplayLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ReportParams, StatsDevicesComparisonItem } from '@jetpack-premium-analytics/data';

export interface PlatformView {
	key: string;
	label: string;
	views: number;
	previousViews?: number;
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
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
}

const BROWSER_LABELS: Record< string, string > = {
	chrome: __( 'Chrome', 'jetpack-premium-analytics-pkg' ),
	safari: __( 'Safari', 'jetpack-premium-analytics-pkg' ),
	firefox: __( 'Firefox', 'jetpack-premium-analytics-pkg' ),
	edge: __( 'Edge', 'jetpack-premium-analytics-pkg' ),
	opera: __( 'Opera', 'jetpack-premium-analytics-pkg' ),
	samsung: __( 'Samsung Internet', 'jetpack-premium-analytics-pkg' ),
	ie: __( 'IE', 'jetpack-premium-analytics-pkg' ),
	yandex: __( 'Yandex', 'jetpack-premium-analytics-pkg' ),
	miui: __( 'Mi Browser', 'jetpack-premium-analytics-pkg' ),
	other: __( 'Other', 'jetpack-premium-analytics-pkg' ),
};

const PLATFORM_LABELS: Record< string, string > = {
	windows: __( 'Windows', 'jetpack-premium-analytics-pkg' ),
	mac: __( 'macOS', 'jetpack-premium-analytics-pkg' ),
	android: __( 'Android', 'jetpack-premium-analytics-pkg' ),
	linux: __( 'Linux', 'jetpack-premium-analytics-pkg' ),
	ios: __( 'iOS', 'jetpack-premium-analytics-pkg' ),
	ipad: __( 'iPad', 'jetpack-premium-analytics-pkg' ),
	iphone: __( 'iPhone', 'jetpack-premium-analytics-pkg' ),
	ipados: __( 'iPadOS', 'jetpack-premium-analytics-pkg' ),
	macos: __( 'macOS', 'jetpack-premium-analytics-pkg' ),
	chrome: __( 'Chrome OS', 'jetpack-premium-analytics-pkg' ),
	android_tablet: __( 'Android Tablet', 'jetpack-premium-analytics-pkg' ),
	other: __( 'Other', 'jetpack-premium-analytics-pkg' ),
};

function toPlatformView(
	item: StatsDevicesComparisonItem,
	deviceProperty: 'browser' | 'platform'
): PlatformView {
	const key = String( item.label ?? '' );
	const labels = deviceProperty === 'browser' ? BROWSER_LABELS : PLATFORM_LABELS;

	return {
		key,
		label: formatDisplayLabel( key, labels ),
		views: item.value,
		previousViews: item.previousValue,
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

	const { comparisonRows, hasComparison, isLoading, isFetching, isError, error, refetch } =
		useStatsDevices( statsParams, { maxRows: max } );

	const rows = ( comparisonRows?.rows ?? [] ).map( item => toPlatformView( item, deviceProperty ) );

	// The Stats queries carry `placeholderData: previousData => previousData`, so a
	// failed range change keeps the prior period's rows in `data` while `isError`
	// flips true. Only surface the error when there's nothing to show, so a transient
	// refetch failure doesn't replace populated rows with the error state. `error` is
	// gated by the same predicate so it is populated iff `isError` is true.
	const showError = rows.length === 0 && isError;

	return {
		data: rows,
		hasComparison,
		isLoading,
		isFetching,
		isError: showError,
		error: showError ? error : null,
		refetch,
	};
}
