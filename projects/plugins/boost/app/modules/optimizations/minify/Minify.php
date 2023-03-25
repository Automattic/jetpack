<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Pluggable;

// Allow overriding WordPress globals, as that is necessary to taking over script output.
// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited

class Minify implements Pluggable {
	// @todo - handle PHP constants.

	public function setup() {
		require __DIR__ . '/functions-helpers.php';

		// TODO: Make concat URL dir configurable
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( isset( $_SERVER['REQUEST_URI'] ) && '/_static/' === substr( wp_unslash( $_SERVER['REQUEST_URI'] ), 0, 9 ) ) {
			require_once __DIR__ . '/service.php';
			exit;
		}

		if ( jetpack_boost_page_optimize_bail() ) {
			return;
		}

		add_action( Config::get_cron_cache_cleanup_hook(), 'jetpack_boost_page_optimize_cache_cleanup' );
		register_deactivation_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_deactivate' );
		register_uninstall_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_uninstall' );

		jetpack_boost_page_optimize_schedule_cache_cleanup();

		add_action( 'init', array( $this, 'init_concatenate' ) );

		// Disable Jetpack photon-cdn for static JS/CSS
		add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
	}

	public static function get_slug() {
		return 'minify';
	}

	public static function is_available() {
		return defined( 'JETPACK_BOOST_MINIFY' ) && true === JETPACK_BOOST_MINIFY;
	}

	public function setup_trigger() {
		return 'init';
	}

	public function init_concatenate() {
		if ( is_admin() ) {
			return;
		}

		jetpack_boost_init_filesystem();

		if ( jetpack_boost_page_optimize_should_concat_js() || jetpack_boost_page_optimize_load_mode_js() ) {
			global $wp_scripts;

			$wp_scripts                         = new Concatenate_JS( $wp_scripts );
			$wp_scripts->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
		}

		if ( jetpack_boost_page_optimize_should_concat_css() ) {
			global $wp_styles;

			$wp_styles                         = new Concatenate_CSS( $wp_styles );
			$wp_styles->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
		}
	}
}
