<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Feature;

class Minify implements Feature {
	// @todo - handle PHP constants.

	public function setup() {
		// TODO: Make concat URL dir configurable
		if ( isset( $_SERVER['REQUEST_URI'] ) && '/_static/' === substr( $_SERVER['REQUEST_URI'], 0, 9 ) ) {
			require_once __DIR__ . '/service.php';
			exit;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$disable = isset( $_GET['jb-disable-minify'] );

		if ( $disable ) {
			return;
		}

		require 'functions-helpers.php';

		// @todo - handle cleanup. Depends on PHP constants.
		// jetpack_boost_page_optimize_schedule_cache_cleanup();

		$this->init_concatenate();

		// Disable Jetpack photon-cdn for static JS/CSS
		add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
	}

	public static function get_slug() {
		return 'minify';
	}

	public function setup_trigger() {
		return 'init';
	}

	private function init_concatenate() {
		if ( is_admin() ) {
			return;
		}

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
