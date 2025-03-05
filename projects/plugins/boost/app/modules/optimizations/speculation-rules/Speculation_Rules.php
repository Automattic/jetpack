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

		// Get the exceptions list
		$rules      = jetpack_boost_ds_get( 'speculation_rules' );
		$exceptions = isset( $rules['exceptions'] ) && is_array( $rules['exceptions'] ) ? $rules['exceptions'] : array();

		// Prepare the exceptions for the speculation rules
		$exceptions = array_map(
			function ( $url ) {
				static $home_url;
				if ( ! $home_url ) {
					$home_url = home_url();
				}
				$url = str_replace( $home_url, '', $url );
				$url = trailingslashit( $url ) . '*';
				return $url;
			},
			$exceptions
		);

		// Determine the fetch speculation method based on the setting
		$fetch_method = $use_prerender ? 'prerender' : 'prefetch';

		if ( ! empty( $exceptions ) ) {
			$not_exceptions = '{ "not": { "href_matches": [ "' . implode( '", "', array_map( 'esc_js', $exceptions ) ) . '" ] } }';
		} else {
			$not_exceptions = '';
		}

		// Generate the speculation rules script
		$script = '<script type="speculationrules">
		{
			"' . esc_js( $fetch_method ) . '": [
				{
					"source":"document",
					"where": {
						"and": [
							{ "href_matches": "\/*" },' .
							$not_exceptions . '
						]
					},
					"eagerness":"moderate"
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
		$instance->register(
			'speculation_rules',
			Schema::as_assoc_array(
				array(
					'exceptions' => Schema::as_array( Schema::as_string() )->fallback( array() ),
				)
			)->fallback( array( 'exceptions' => array() ) )
		);
	}
}
