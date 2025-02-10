<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_JS;

class Minify_JS extends Minify {

	public static $default_excludes = array( 'jquery', 'jquery-core', 'underscore', 'backbone' );

	public static function get_slug() {
		return 'minify_js';
	}

	public function init_minify() {
		global $wp_scripts;

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_scripts                         = new Concatenate_JS( $wp_scripts );
		$wp_scripts->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
	}

	/**
	 * This is called only when the module is deactivated.
	 */
	public static function deactivate() {
		parent::deactivate();
		jetpack_boost_page_optimize_cleanup_cache( 'js' );
	}
}
