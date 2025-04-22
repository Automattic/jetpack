<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Data_Sync\Minify_Excludes_State_Entry;
use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_CSS;

class Minify_CSS implements Feature, Changes_Output_On_Activation, Changes_Output_After_Activation, Optimization, Has_Deactivate, Has_Data_Sync {

	public static $default_excludes = array( 'admin-bar', 'dashicons', 'elementor-app' );

	/**
	 * Setup the module. This runs on every page load.
	 */
	public function setup() {
		if ( jetpack_boost_page_optimize_bail() ) {
			return;
		}

		add_action( 'init', array( $this, 'init_minify' ) );
	}

	public function register_data_sync( Data_Sync $instance ) {
		$parser = Schema::as_array( Schema::as_string() )->fallback( self::$default_excludes );

		$instance->register( 'minify_css_excludes', $parser, new Minify_Excludes_State_Entry( 'minify_css_excludes' ) );

		$instance->register_readonly(
			'minify_css_excludes_default',
			Schema::as_unsafe_any(),
			function () {
				return Minify_CSS::$default_excludes;
			}
		);
	}

	public static function get_slug() {
		return 'minify_css';
	}

	public static function get_change_output_action_names() {
		return array( 'update_option_' . JETPACK_BOOST_DATASYNC_NAMESPACE . '_minify_css_excludes' );
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

	/**
	 * This is called only when the module is deactivated.
	 */
	public static function deactivate() {
		jetpack_boost_page_optimize_cleanup_cache( 'css' );
	}
}
