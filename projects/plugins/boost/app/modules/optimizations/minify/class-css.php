<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Css extends Minify implements Pluggable {

	public static function get_slug() {
		return 'minify_css';
	}

	public function init_concatenate() {
		if ( is_admin() ) {
			return;
		}

		jetpack_boost_init_filesystem();

		if ( jetpack_boost_page_optimize_should_concat_css() ) {
			global $wp_styles;

			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$wp_styles                         = new Concatenate_CSS( $wp_styles );
			$wp_styles->allow_gzip_compression = true; // @todo - used constant ALLOW_GZIP_COMPRESSION = true if not defined.
		}
	}
}
