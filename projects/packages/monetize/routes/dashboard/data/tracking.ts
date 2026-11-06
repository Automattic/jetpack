import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';

// Jetpack › Settings' event names, as in my-jetpack's settings-panel/use-settings-panel-tracking.ts.
const ORIGIN = 'monetize-settings-tab';
const MODULE = 'wordads';

let initialized = false;

const toggled = ( active: boolean ) => ( active ? 'on' : 'off' );

/**
 * Record a Tracks event, identifying the connected user first.
 *
 * @param event      - Event name.
 * @param properties - Event properties.
 */
function record( event: string, properties: Record< string, unknown > ) {
	if ( ! initialized ) {
		const wpcom = getScriptData()?.user?.current_user?.wpcom;
		if ( wpcom?.ID && wpcom.login ) {
			jetpackAnalytics.initialize( wpcom.ID, wpcom.login );
		}
		initialized = true;
	}

	jetpackAnalytics.tracks.recordEvent( event, properties );
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
