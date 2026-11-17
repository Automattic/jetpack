/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '../defaults/remembered-preset';
import type { DashboardSectionSlug } from './dashboard-sections';

/** Preferences key holding when the reader completed or dismissed the onboarding, as an ISO date. */
export const DASHBOARD_ONBOARDING_KEY = 'onboardingCompletedAt';

/** Preferences key holding when the reader was shown the WooCommerce tab onboarding, as an ISO date. */
export const DASHBOARD_STORE_ONBOARDING_KEY = 'storeOnboardingCompletedAt';

type OnboardingFlow = 'stats' | 'store' | 'stats-and-store';

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

/**
 * Whether a slug is the WooCommerce tab: its own, or the `store` slug an older WooCommerce
 * Stats package still registers.
 *
 * @param slug - Slug of a dashboard tab.
 * @return Whether it is the WooCommerce tab.
 */
export function isStoreSectionSlug( slug: DashboardSectionSlug ): boolean {
	return slug === 'woocommerce' || slug === 'store';
}

/**
 * The journey a reader has not been through yet: the new Stats, with the
 * WooCommerce tab when the dashboard shows it, or only the tab for a reader
 * who already knows the new Stats.
 *
 * @param statsSeen       - Whether the reader has been through the Stats journey.
 * @param storeSeen       - Whether the reader has been through the WooCommerce tab journey.
 * @param hasStoreSection - Whether the dashboard shows the WooCommerce tab.
 * @return The journey to show, or null when there is none left.
 */
export function getPendingOnboardingFlow(
	statsSeen: boolean,
	storeSeen: boolean,
	hasStoreSection: boolean
): OnboardingFlow | null {
	if ( ! statsSeen ) {
		return hasStoreSection ? 'stats-and-store' : 'stats';
	}

	return hasStoreSection && ! storeSeen ? 'store' : null;
}

/**
 * Whether an onboarding journey is still ahead of the reader.
 *
 * Read outside React, from the preferences and from the tabs the server published with the
 * page, for what has to decide before the dashboard renders.
 *
 * @return Whether a journey is pending.
 */
export function isOnboardingPending(): boolean {
	const preferences = select( preferencesStore ) as unknown as PreferencesSelectors;
	const sections = getScriptData()?.premium_analytics?.sections;

	return (
		getPendingOnboardingFlow(
			!! preferences.get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_ONBOARDING_KEY ),
			!! preferences.get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_STORE_ONBOARDING_KEY ),
			Array.isArray( sections ) && sections.some( isStoreSectionSlug )
		) !== null
	);
}
