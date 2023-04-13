<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

class Minify {
	private static $called = false; // This class is called multiple times, so we need to make sure we only run some things once.

	public function setup() {
		require_once __DIR__ . '/functions-helpers.php';

		// TODO: Make concat URL dir configurable
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( isset( $_SERVER['REQUEST_URI'] ) && '/_static/' === substr( wp_unslash( $_SERVER['REQUEST_URI'] ), 0, 9 ) ) {
			require_once __DIR__ . '/service.php';
			exit;
		}

		if ( jetpack_boost_page_optimize_bail() ) {
			return;
		}

		if ( ! self::$called ) {
			add_action( Config::get_cron_cache_cleanup_hook(), 'jetpack_boost_page_optimize_cache_cleanup' );
			register_deactivation_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_deactivate' );
			register_uninstall_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_uninstall' );

			jetpack_boost_page_optimize_schedule_cache_cleanup();
		}

		add_action( 'init', array( $this, 'init_concatenate' ) );

		if ( ! self::$called ) {
			// Disable Jetpack photon-cdn for static JS/CSS
			add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
		}

		self::$called = true;
	}

	public static function is_available() {
		return true;
	}

	public function setup_trigger() {
		return 'init';
	}

	public function init_concatenate() {
		// declared in child classes.
	}
}
