<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Speculation_Rules implements Pluggable, Optimization, Changes_Page_Output, Has_Data_Sync {
	public static function is_available() {
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) ) {
			return \JETPACK_BOOST_ALPHA_FEATURES === true;
		}

		return false;
	}

	/**
	 * Setup the module.
	 *
	 * @return void
	 */
	public function setup() {
		add_action( 'wp_footer', array( $this, 'inject_speculation_rules' ) );
	}

	/**
	 * Inject speculation rules script in the footer.
	 */
	public function inject_speculation_rules() {
		// Get the fetch speculation method setting
		$use_prerender = (bool) jetpack_boost_ds_get( 'speculation_method' );

		// Determine the fetch speculation method based on the setting
		$fetch_method = $use_prerender ? 'prerender' : 'prefetch';

		// Generate the speculation rules script
		$script = '<script type="speculationrules">
		{
			"' . esc_js( $fetch_method ) . '": [
				{
					"source": "document",
					"where": {
						"href_matches": "/*"
					}
				}
			]
		}
		</script>';

		echo $script; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	public static function get_slug() {
		return 'speculation_rules';
	}

	public function is_ready() {
		return true;
	}

	/**
	 * Register data sync for the module.
	 *
	 * @param Data_Sync $instance The data sync instance.
	 *
	 * @return void
	 */
	public function register_data_sync( Data_Sync $instance ) {
		$instance->register( 'speculation_method', Schema::as_boolean()->fallback( false ) );
	}
}
