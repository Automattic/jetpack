<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Js extends Minify implements Pluggable {

	public static function get_slug() {
		return 'minify_js';
	}

	public function init_concatenate() {
		if ( is_admin() ) {
			return;
		}

		jetpack_boost_init_filesystem();

		if ( jetpack_boost_page_optimize_should_concat_js() || jetpack_boost_page_optimize_load_mode_js() ) {
			global $wp_scripts;

			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$wp_scripts                         = new Concatenate_JS( $wp_scripts );
			$wp_scripts->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
		}
	}
}
