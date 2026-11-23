/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	DASHBOARD_ONBOARDING_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_STORE_ONBOARDING_KEY,
} from '@jetpack-premium-analytics/data';
import { getCurrentRoutePath, onLocationChange } from '@jetpack-premium-analytics/routing';
import { select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

// Every page of the dashboard subscribes to this channel, and to it followed by its own section.
const CHANNEL = 'premium-analytics';

// The section of the route `/`, which has no segment to take a name from.
const MAIN_SECTION = 'main';

// The WooCommerce tab, under its slug or the one an older WooCommerce Stats package registers.
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

	return (
		! hasSeen( DASHBOARD_ONBOARDING_KEY ) ||
		( hasStoreSection && ! hasSeen( DASHBOARD_STORE_ONBOARDING_KEY ) )
	);
}

/**
 * The channels of the page on screen: the channel of the dashboard, alone and with the section.
 *
 * The section is the first segment of the path of the route.
 *
 * @return The channels, none while another page is on screen.
 */
function getChannels(): string[] {
	const path = getCurrentRoutePath();

	if ( path === null ) {
		return [];
	}

	const [ section = MAIN_SECTION ] = path.split( '/' ).filter( Boolean );

	return [ CHANNEL, `${ CHANNEL }/${ section }` ];
}

/**
 * Show the What's new surface with the announcements of the page on screen, while its feature
 * flag is on.
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
		.then( ( { mountWhatsNew } ) => {
			let subscribed = '';
			let unmount = (): void => undefined;

			const subscribe = () => {
				const channels = getChannels();

				// The location also changes within a page, and several routes share a section.
				if ( channels.join() === subscribed ) {
					return;
				}

				subscribed = channels.join();

				if ( channels.length ) {
					unmount = mountWhatsNew( { channels } );
				} else {
					unmount();
				}
			};

			subscribe();
			onLocationChange( subscribe );
		} )
		.catch( () => undefined );
}
