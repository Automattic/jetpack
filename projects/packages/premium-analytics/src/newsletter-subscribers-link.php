<?php
/**
 * Link from the Latest subscribers widget to the Newsletter page's Subscribers tab.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Newsletter\Urls;

/**
 * Configures the Newsletter subscribers link script data.
 *
 * @return void
 */
function configure_newsletter_subscribers_link() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_newsletter_subscribers_script_data', 20 );
}

/**
 * Injects the Newsletter Subscribers tab URL into JetpackScriptData.
 *
 * Read on print, after `admin_menu` has registered the Newsletter page.
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_newsletter_subscribers_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	// The Newsletter package ships with the Jetpack plugin, not this one, and an older copy lacks the method.
	$data['premium_analytics']['newsletter_subscribers_url'] = method_exists( Urls::class, 'get_subscribers_url' )
		? Urls::get_subscribers_url()
		: null;

	return $data;
}
