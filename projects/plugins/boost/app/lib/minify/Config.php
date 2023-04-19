<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

class Config {

	public static function get_cache_dir_path() {
		if ( defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) ) {
			if ( empty( PAGE_OPTIMIZE_CACHE_DIR ) ) {
				$path = false;
			} else {
				$path = PAGE_OPTIMIZE_CACHE_DIR;
			}
		} else {
			$path = WP_CONTENT_DIR . '/cache/page_optimize';
		}

		return $path;
	}

	public static function is_css_minify_enabled() {
		if ( defined( 'PAGE_OPTIMIZE_CSS_MINIFY' ) ) {
			$enabled = (bool) PAGE_OPTIMIZE_CSS_MINIFY;
		} else {
			$enabled = false;
		}

		return $enabled;
	}

	// @todo - PAGE_OPTIMIZE_CONCAT_BASE_DIR is used in the original plugin, but never defined anywhere.

	public static function get_abspath() {
		if ( defined( 'PAGE_OPTIMIZE_ABSPATH' ) ) {
			$path = PAGE_OPTIMIZE_ABSPATH;
		} else {
			$path = ABSPATH;
		}

		return $path;
	}

	public static function get_cron_cache_cleanup_hook() {
		return 'page_optimize_cron_cache_cleanup';
	}
}
