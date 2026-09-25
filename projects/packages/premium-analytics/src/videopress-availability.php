<?php
/**
 * VideoPress availability, shared by the widget layer and the client routes.
 *
 * Calypso gates its Videos module on the `videopress` plan feature, which `wpcom_site_has_feature()`
 * answers on the WPCOM platform but which does not exist off-platform. `Current_Plan::supports()`
 * grants `videopress` to every plan because of the free tier, and `Product::get_site_features_from_wpcom()`
 * answers entitlement rather than whether VideoPress is running, over a synchronous WPCOM request.
 *
 * The canonical gates (`VideoPress\Status::is_active()`, the WPCOM arm of `Current_Plan::supports()`)
 * live in packages this one does not depend on, so the detection below is local by necessity. Widen
 * the dependency graph before writing another detector.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
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
 * Atomic reads the plan feature alongside Simple, not the module: wpcomsh provides
 * `wpcom_site_has_feature()` there, and the VideoPress module has no `Auto Activate` header, so a
 * plan that includes VideoPress routinely comes with the module off. An Atomic site with the module
 * off therefore keeps the video surfaces, which is intended — hosting is service-level on WPCOM.
 *
 * Off-platform the question becomes "is VideoPress running here", not "is it paid for": without the
 * module there is no new play data. Deliberately narrower than
 * `Initial_State::has_videopress_access()`, which counts the paid storage tiers instead.
 *
 * @return bool Whether Premium Analytics treats VideoPress as available.
 */
function is_videopress_available() {
	if ( ( new Host() )->is_wpcom_platform() ) {
		$is_available = function_exists( 'wpcom_site_has_feature' ) && \wpcom_site_has_feature( 'videopress' );
	} else {
		// `false` skips the module registry the standalone Premium Analytics plugin
		// does not ship, which would otherwise report every module inactive.
		$is_available = ( new Modules() )->is_active( 'videopress', false )
			|| Constants::is_defined( 'JETPACK_VIDEOPRESS_ROOT_FILE' );
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
 * The client can't read `site.plan.features` here: that key is only populated when the
 * Publicize package happens to load, which the standalone Premium Analytics plugin never does.
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
