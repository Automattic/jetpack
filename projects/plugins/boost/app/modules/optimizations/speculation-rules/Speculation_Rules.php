<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Data_Sync\Speculation_Rules_Excludes_Entry;

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
		// Get the exceptions list
		$rules      = jetpack_boost_ds_get( 'speculation_rules', array( 'bypass_patterns' => array() ) );
		$exceptions = isset( $rules['bypass_patterns'] ) && is_array( $rules['bypass_patterns'] ) ? $rules['bypass_patterns'] : array();

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

		if ( ! empty( $exceptions ) ) {
			$not_exceptions = '{ "not": { "href_matches": [ "' . implode( '", "', array_map( 'esc_js', $exceptions ) ) . '" ] } }';
		} else {
			$not_exceptions = '';
		}

		// Generate the speculation rules script
		$script = '<script type="speculationrules">
		{
			"prefetch": [
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
					'bypass_patterns' => Schema::as_array( Schema::as_string() )->fallback( array() ),
				)
			)->fallback( array( 'bypass_patterns' => array() ) ),
			new Speculation_Rules_Excludes_Entry()
		);
	}
}
