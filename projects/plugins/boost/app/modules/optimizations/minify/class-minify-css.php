<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_CSS;

class Minify_CSS extends Minify {

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
	 * This is called only when the module is deactivated.
	 */
	public static function deactivate() {
		parent::deactivate();
		jetpack_boost_page_optimize_cleanup_cache( 'css' );
	}
}
