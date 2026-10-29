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
	| 'tags'
	| 'csv'
	| 'intervals'
	| 'long-date-presets'
	| 'recent-7-days';

/**
 * A locked feature as the server publishes it: `description` wraps in `<link>` the words `support_url` explains,
 * and `upgrade_url` is empty when there is nowhere to buy it.
 */
export type LockedFeature = {
	description: string;
	support_url: string;
	upgrade_url: string;
};

/**
 * A dashboard section the plan replaces with one upgrade prompt, worded as classic Stats' upsell.
 */
export type LockedSectionGate = {
	title: string;
	description: string;
	/** `description` quoting the price, with `%s` for the formatted monthly price inside `<strong>`. */
	description_with_price: `${ string }%s${ string }`;
	features: string[];
	upgrade_label: string;
	expand_label: string;
	support_url: string;
	upgrade_url: string;
	/** The widget types the section still shows; every other one is hidden. */
	open_widget_types: string[];
	/** The plan's yearly price in the currency's smallest unit, or null when WordPress.com has none. */
	plan_price: { yearly: number; currency: string } | null;
};

/**
 * Look a key up in a server map without reaching inherited names like `constructor`.
 *
 * @param map - The map.
 * @param key - The key.
 * @return The value, or undefined.
 */
function readOwn< T >( map: Record< string, T > | undefined, key: string ): T | undefined {
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
 * What a locked feature says and where to buy it.
 *
 * @param feature - The feature.
 * @return The locked feature, or undefined when it is open.
 */
export function getLockedFeature( feature: StatsFeatureKey ): LockedFeature | undefined {
	return readOwn( getScriptData()?.premium_analytics?.plan_gates?.locked_features, feature );
}

/**
 * What a locked section's upgrade prompt says and where to buy the plan.
 *
 * @param section - The section slug.
 * @return The locked section, or undefined when it is open.
 */
export function getLockedSection( section: string ): LockedSectionGate | undefined {
	return readOwn( getScriptData()?.premium_analytics?.plan_gates?.locked_sections, section );
}

/**
 * The feature that locks a whole widget type.
 *
 * @param widgetType - The widget type name.
 * @return The feature, or undefined when the type is open.
 */
export function getLockedWidgetFeature( widgetType: string ): StatsFeatureKey | undefined {
	// The server lists a type only under a feature it locks, so the value is always one of its keys.
	return readOwn(
		getScriptData()?.premium_analytics?.plan_gates?.locked_widget_types,
		widgetType
	) as StatsFeatureKey | undefined;
}
