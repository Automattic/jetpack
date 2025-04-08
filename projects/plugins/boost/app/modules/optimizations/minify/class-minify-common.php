<?php
namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Sub_Feature;

class Minify_Common implements Sub_Feature, Optimization, Is_Always_On, Has_Activate, Has_Deactivate, Has_Data_Sync {

	/**
	 * Setup the module. This runs on every page load.
	 */
	public function setup() {
		require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';

		jetpack_boost_minify_init();
	}

	public static function get_slug() {
		return 'minify_common';
	}

	public function register_data_sync( Data_Sync $instance ) {
		$instance->register_readonly(
			'minify_legacy_notice',
			Schema::as_unsafe_any(),
			array( self::class, 'show_legacy_notice' )
		);
	}

	public static function is_available() {
		return true;
	}

	public static function show_legacy_notice() {
		// If the JETPACK_BOOST_DISABLE_404_TESTER is set and true, we don't need to show the legacy notice.
		if ( defined( 'JETPACK_BOOST_DISABLE_404_TESTER' ) && JETPACK_BOOST_DISABLE_404_TESTER ) {
			return false;
		}

		// If this is a multisite, and the user is not a super admin, don't show the legacy notice, as they won't be able to do anything about it.
		if ( is_multisite() && ! current_user_can( 'manage_network_options' ) ) {
			return false;
		}

		// If the static minfification has not ran yet, don't show the legacy notice.
		$static_minification_enabled = get_site_option( 'jetpack_boost_static_minification', 'na' );
		if ( $static_minification_enabled === 'na' ) {
			return false;
		}

		// Otherwise show it if the 404 tester determined it can't be used.
		return ! (bool) $static_minification_enabled;
	}

	/**
	 * This is called when either minify module is activated
	 */
	public static function activate() {
		jetpack_boost_minify_activation();
	}

	/**
	 * This is called when either minify module is deactivated.
	 */
	public static function deactivate() {
		jetpack_boost_minify_clear_scheduled_events();
	}

	public static function get_parent_features(): array {
		return array(
			Minify_JS::class,
			Minify_CSS::class,
		);
	}
}
