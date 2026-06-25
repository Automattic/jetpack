/**
 * Internal dependencies
 */
import { useStatsDevices } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsDevicesItem,
	StatsDeviceProperty,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

export interface PlatformView {
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
	isLoading: boolean;
	isError: boolean;
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
		deviceProperty: deviceProperty as StatsDeviceProperty,
	} as Parameters< typeof useStatsDevices >[ 0 ];

	const { primary } = useStatsDevices( statsParams );

	const isLoading = primary.isLoading;
	const isError = primary.isError;

	const report = primary.data as StatsNormalizedReport< StatsDevicesItem > | undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const items = rawItems
		.map( item => ( {
			label: toDisplayLabel( String( item.label ?? '' ) ),
			views: item.views,
		} ) )
		.slice( 0, max > 0 ? max : undefined );

	return { data: items, isLoading, isError };
}
