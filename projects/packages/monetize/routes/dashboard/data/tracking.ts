import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { getPageData } from './state';

// Jetpack › Settings' event names, as in my-jetpack's settings-panel/use-settings-panel-tracking.ts.
const ORIGIN = 'monetize-settings-tab';
const MODULE = 'wordads';

let initialized = false;

const toggled = ( active: boolean ) => ( active ? 'on' : 'off' );

/**
 * Record a Tracks event, identifying the connected user first.
 *
 * Skipped when PHP disallows Tracks: another plugin's w.js would still send the queued event.
 *
 * @param event      - Event name.
 * @param properties - Event properties.
 */
function record( event: string, properties: Record< string, unknown > ) {
	if ( ! getPageData().tracks ) {
		return;
	}

	const scriptData = getScriptData();
	if ( ! initialized ) {
		const wpcom = scriptData?.user?.current_user?.wpcom;
		if ( wpcom?.ID && wpcom.login ) {
			jetpackAnalytics.initialize( wpcom.ID, wpcom.login );
		}
		initialized = true;
	}

	// The analytics client only takes the blog ID from `jpTracksContext`, which this page doesn't print.
	const blogId = scriptData?.site?.wpcom?.blog_id;
	jetpackAnalytics.tracks.recordEvent(
		event,
		blogId ? { blog_id: blogId, ...properties } : properties
	);
}

/**
 * Record the Ads switch.
 *
 * @param active - The asked-for state.
 */
export function trackModuleToggle( active: boolean ) {
	record( 'jetpack_wpa_module_toggle', {
		module: MODULE,
		toggled: toggled( active ),
		origin: ORIGIN,
	} );
}

/**
 * Record an Ads option switch.
 *
 * @param setting - The option name.
 * @param active  - The asked-for state.
 */
export function trackSettingToggle( setting: string, active: boolean ) {
	record( 'jetpack_wpa_settings_toggle', {
		module: MODULE,
		setting,
		toggled: toggled( active ),
		origin: ORIGIN,
	} );
}

/**
 * Record a link click under the Settings screen's `jetpack_wpa_click` targets.
 *
 * @param target - The Settings screen's target name.
 */
export function trackClick( target: 'view-earnings' | 'place_ad_widget' ) {
	record( 'jetpack_wpa_click', { target, origin: ORIGIN } );
}

/**
 * Record a click on the upgrade or connect prompt, as the Settings card's banner does.
 *
 * @param type - Which prompt.
 */
export function trackBannerClick( type: 'upgrade' | 'connect' ) {
	record( 'jetpack_wpa_click', {
		target: `${ type }-banner`,
		feature: 'wordads-jetpack',
		type,
		origin: ORIGIN,
	} );
}

/**
 * Record a saved PayPal address.
 * @param signedTos - Whether the terms were signed with this save.
 */
export function trackPayoutSave( signedTos: boolean ) {
	record( 'jetpack_monetize_ads_payout_save', { signed_tos: signedTos, origin: ORIGIN } );
}

/**
 * Record a click on one of the Overview's cards, with Calypso's Earn page `feature` names.
 *
 * @param feature - The card's feature, e.g. `ads`.
 * @param target  - What was clicked.
 */
export function trackOverviewClick( feature: string, target: 'learn-more' | 'upgrade' | 'open' ) {
	record( 'jetpack_monetize_overview_click', { feature, target } );
}
