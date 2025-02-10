<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_CSS;

class Minify_CSS implements Pluggable, Changes_Page_Output, Optimization, Has_Activate, Has_Deactivate {

	public static $default_excludes = array( 'admin-bar', 'dashicons', 'elementor-app' );

	public static function get_slug() {
		return 'minify_css';
	}

	public function init_minify() {
		global $wp_styles;

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_styles                         = new Concatenate_CSS( $wp_styles );
		$wp_styles->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
	}

	/**
	 * Setup the module. This runs on every page load.
	 */
	public function setup() {
		require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';

		jetpack_boost_minify_init();

		if ( jetpack_boost_page_optimize_bail() ) {
			return;
		}

		add_action( 'init', array( $this, 'init_minify' ) );
	}

	/**
	 * The module starts serving as soon as it's enabled.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return true;
	}

	public static function is_available() {
		return true;
	}

	/**
	 * This is called only when the module is activated.
	 */
	public static function activate() {
		jetpack_boost_minify_activation();
		jetpack_boost_404_tester();
	}

	/**
	 * This is called only when the module is deactivated.
	 */
	public static function deactivate() {
		jetpack_boost_minify_deactivation();
		jetpack_boost_page_optimize_cleanup_cache( 'css' );
	}
}
