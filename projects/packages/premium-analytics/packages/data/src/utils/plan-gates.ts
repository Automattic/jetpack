/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * A paid Stats feature the server may lock; the keys match `src/stats-plan-gates.php`.
 */
export type StatsFeatureKey =
	| 'top-posts'
	| 'referrers'
	| 'countries'
	| 'clicks'
	| 'file-downloads'
	| 'authors'
	| 'search-terms'
	| 'videos'
	| 'utm'
	| 'devices'
	| 'regions-cities'
	| 'insights'
	| 'csv'
	| 'intervals'
	| 'long-date-presets'
	| 'recent-7-days';

/**
 * Look a key up in a server map without reaching inherited names like `constructor`.
 *
 * @param map - The map.
 * @param key - The key.
 * @return The value, or undefined.
 */
function readOwn( map: Record< string, string > | undefined, key: string ): string | undefined {
	return map && Object.hasOwn( map, key ) ? map[ key ] : undefined;
}

/**
 * Whether the site's plan locks a Stats feature. False when the server published no gates.
 *
 * @param feature - The feature.
 * @return Whether it is locked.
 */
export function isStatsFeatureLocked( feature: StatsFeatureKey ): boolean {
	return (
		readOwn( getScriptData()?.premium_analytics?.plan_gates?.locked_features, feature ) !==
		undefined
	);
}

/**
 * Where to buy a locked feature. Takes any key, since another plugin's widget may declare its own.
 *
 * @param feature - The feature.
 * @return The upgrade URL, or undefined when the feature is open or there is nowhere to buy it.
 */
export function getStatsUpgradeUrl( feature: string ): string | undefined {
	return (
		readOwn( getScriptData()?.premium_analytics?.plan_gates?.locked_features, feature ) || undefined
	);
}

/**
 * The feature that locks a whole widget type.
 *
 * @param widgetType - The widget type name.
 * @return The feature, or undefined when the type is open.
 */
export function getLockedWidgetFeature( widgetType: string ): string | undefined {
	return readOwn( getScriptData()?.premium_analytics?.plan_gates?.locked_widget_types, widgetType );
}
