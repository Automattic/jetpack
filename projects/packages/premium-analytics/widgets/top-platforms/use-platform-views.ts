/**
 * Internal dependencies
 */
import { getStatsPlanErrorReason, useStatsDevices } from '@jetpack-premium-analytics/data';
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
	reportParams: ReportParams;
	max: number;
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

/**
 * Converts a raw device key to a display label, title-casing as needed.
 *
 * @param key - Raw key from the API (e.g. 'chrome', 'ios', 'macos').
 * @return Display label.
 */
function toDisplayLabel( key: string ): string {
	// Special-case well-known platform names.
	const known: Record< string, string > = {
		ios: 'iOS',
		ipad: 'iPad',
		iphone: 'iPhone',
		ipados: 'iPadOS',
		macos: 'macOS',
		ie: 'IE',
	};
	const lower = key.toLowerCase();
	return known[ lower ] ?? key.charAt( 0 ).toUpperCase() + key.slice( 1 );
}

/**
 * Fetch platform views (browser or OS) via the shared Stats data layer.
 *
 * @param args                - Hook arguments.
 * @param args.reportParams   - PA ReportParams from WidgetRoot context.
 * @param args.max            - Maximum rows to display (0 = all).
 * @param args.deviceProperty - 'browser' or 'platform' (OS).
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
		.map( item => {
			const key = String( item.label ?? '' );
			return {
				key,
				label: toDisplayLabel( key ),
				views: item.views,
			};
		} )
		.slice( 0, max > 0 ? max : undefined );

	const comparisonReport = comparison.data as StatsNormalizedReport< StatsDevicesItem > | undefined;
	const comparisonRawItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const comparisonItems = comparisonRawItems
		.map( item => {
			const key = String( item.label ?? '' );
			return {
				key,
				label: toDisplayLabel( key ),
				views: item.views,
			};
		} )
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
