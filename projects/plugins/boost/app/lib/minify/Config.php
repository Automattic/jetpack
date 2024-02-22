<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

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

	public static function get_abspath() {
		if ( defined( 'PAGE_OPTIMIZE_ABSPATH' ) ) {
			$path = PAGE_OPTIMIZE_ABSPATH;
		} else {
			$path = ABSPATH;
		}

		return $path;
	}
}
