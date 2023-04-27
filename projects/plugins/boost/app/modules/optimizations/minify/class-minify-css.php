<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_CSS;

class Minify_CSS implements Pluggable {

	public static $default_excludes = array( 'admin-bar', 'dashicons' );

	public function setup() {
		require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';

		$should_minify = jetpack_boost_minify_setup();
		if ( false === $should_minify ) {
			return;
		}

		if ( is_admin() ) {
			return;
		}

		jetpack_boost_init_filesystem();

		add_action( 'init', array( $this, 'init_minify' ) );
	}

	public static function get_slug() {
		return 'minify_css';
	}

	public static function is_available() {
		return true;
	}

	public function init_minify() {
		global $wp_styles;

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_styles                         = new Concatenate_CSS( $wp_styles );
		$wp_styles->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
	}
}
