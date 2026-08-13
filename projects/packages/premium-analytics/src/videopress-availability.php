<?php
/**
 * VideoPress availability, shared by the widget layer and the client routes.
 *
 * Calypso gates its Videos module on the `videopress` plan feature
 * (`siteHasFeature( state, siteId, 'videopress' )`), which it only ever reads
 * on WPCOM. Self-hosted Jetpack has no equivalent feature list to read, so the
 * same intent — "is VideoPress here" — is answered from the module/plugin the
 * site is actually running.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Filter controlling whether the VideoPress-backed surfaces are available.
 *
 * @var string
 */
const VIDEOPRESS_AVAILABLE_FILTER = 'jetpack_premium_analytics_videopress_available';

/**
 * Whether the site can produce VideoPress play data.
 *
 * Simple sites are gated on the plan feature, matching Calypso. Everywhere else
 * the signal is VideoPress itself: the Jetpack module, or the standalone
 * VideoPress plugin, which defines its root-file constant as it loads.
 * `Modules::is_active()` is not asked on Simple because it answers true for
 * every module there.
 *
 * The module lookup passes `$available_only = false` deliberately: that
 * intersection needs the Jetpack plugin's module registry, which the standalone
 * Premium Analytics plugin does not ship, and there it would report every
 * module inactive.
 *
 * @return bool Whether VideoPress was detected in the current request.
 */
function is_videopress_available() {
	if ( ( new Host() )->is_wpcom_simple() ) {
		$is_available = function_exists( 'wpcom_site_has_feature' ) && \wpcom_site_has_feature( 'videopress' );
	} else {
		$is_available = ( new Modules() )->is_active( 'videopress', false )
			|| defined( 'JETPACK_VIDEOPRESS_ROOT_FILE' );
	}

	/**
	 * Filters whether Premium Analytics treats VideoPress as available.
	 *
	 * Hides the Top videos widget, the Videos report, and the video detail page
	 * when false.
	 *
	 * @param bool $is_available Whether VideoPress was detected in the current request.
	 */
	return (bool) apply_filters( VIDEOPRESS_AVAILABLE_FILTER, $is_available );
}

/**
 * Configures the VideoPress script data.
 *
 * @return void
 */
function configure_videopress_availability() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_videopress_script_data', 20 );
}

/**
 * Injects the VideoPress availability flag into JetpackScriptData.
 *
 * The client cannot read `site.plan.features` for this: that key is only
 * populated when the Publicize package happens to be loaded, which the
 * standalone Premium Analytics plugin never loads.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_videopress_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['has_videopress'] = is_videopress_available();

	return $data;
}
