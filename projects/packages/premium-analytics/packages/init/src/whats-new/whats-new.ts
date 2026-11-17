/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

// Mirrors of what the dashboard's onboarding hook reads and writes, which this package cannot import.
const ONBOARDING_KEY = 'onboardingCompletedAt';
const STORE_ONBOARDING_KEY = 'storeOnboardingCompletedAt';
const STORE_SECTIONS = [ 'woocommerce', 'store' ];

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

/**
 * Whether an onboarding journey is about to open: the new Stats, or the WooCommerce tab
 * where the dashboard shows it.
 *
 * @return Whether a journey is pending.
 */
function isOnboardingPending(): boolean {
	const preferences = select( preferencesStore ) as unknown as PreferencesSelectors;
	const hasSeen = ( key: string ) => !! preferences.get( DASHBOARD_PREFERENCES_SCOPE, key );

	const sections = getScriptData()?.premium_analytics?.sections;
	const hasStoreSection =
		Array.isArray( sections ) && sections.some( slug => STORE_SECTIONS.includes( slug ) );

	return ! hasSeen( ONBOARDING_KEY ) || ( hasStoreSection && ! hasSeen( STORE_ONBOARDING_KEY ) );
}

/**
 * Show the What's new surface with the dashboard's announcements, while its feature flag is on.
 *
 * Imported on demand and never awaited, so the surface stays out of the dashboard's first
 * render. A load that fails leaves the dashboard without it.
 */
export function showWhatsNew(): void {
	if ( ! getScriptData()?.premium_analytics?.whats_new_enabled ) {
		return;
	}

	// Held for this page load: the welcome modal and its tour are about to ask for the same attention.
	if ( isOnboardingPending() ) {
		return;
	}

	import( '@automattic/jetpack-announcements' )
		.then( ( { mountWhatsNew } ) => mountWhatsNew( { channels: [ 'premium-analytics' ] } ) )
		.catch( () => undefined );
}
