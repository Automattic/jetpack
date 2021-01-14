<?php
/**
 * Utilities related to the Jetpack Recommendations
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Contains utilities related to the Jetpack Recommendations.
 *
 * @package Jetpack
 */

/**
 * Jetpack_Recommendations class
 */
class Jetpack_Recommendations {
	/**
	 * Returns a boolean indicating if the Jetpack Recommendations are enabled.
	 *
	 * @since 9.3.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$recommendations_enabled = Jetpack_Options::get_option( 'recommendations_enabled', null );

		// If the option is already set, just return the cached value.
		// Otherwise calculate it and store it before returning it.
		if ( null !== $recommendations_enabled ) {
			return $recommendations_enabled;
		}

		if ( ! Jetpack::connection()->is_connected() ) {
			return new WP_Error( 'site_not_connected', 'Site not connected.' );
		}

		$blog_id = Jetpack_Options::get_option( 'id' );

		$request_path = sprintf( '/sites/%s/jetpack-recommendations/site-registered-date', $blog_id );
		$result       = Client::wpcom_json_api_request_as_blog(
			$request_path,
			2,
			array(
				'headers' => array( 'content-type' => 'application/json' ),
			),
			null,
			'wpcom'
		);

		$body = json_decode( wp_remote_retrieve_body( $result ) );
		if ( 200 === wp_remote_retrieve_response_code( $result ) ) {
			$site_registered_date = $body->site_registered_date;
		} else {
			$connection           = new Connection_Manager( 'jetpack' );
			$site_registered_date = $connection->get_assumed_site_creation_date();
		}

		$recommendations_start_date = gmdate( 'Y-m-d H:i:s', strtotime( '2020-12-01 00:00:00' ) );
		$recommendations_enabled    = $site_registered_date > $recommendations_start_date;

		Jetpack_Options::update_option( 'recommendations_enabled', $recommendations_enabled );

		return $recommendations_enabled;
	}

	/**
	 * Initializes the Recommendations step according to the Setup Wizard state, and then clears the
	 * Setup Wizard state.
	 */
	private static function initialize_jetpack_recommendations() {
		if ( Jetpack_Options::get_option( 'recommendations_step' ) ) {
			return;
		}

		$setup_wizard_status = Jetpack_Options::get_option( 'setup_wizard_status' );
		if ( 'completed' === $setup_wizard_status ) {
			Jetpack_Options::update_option( 'recommendations_step', 'completed' );
		}

		Jetpack_Options::delete_option( array( 'setup_wizard_questionnaire', 'setup_wizard_status' ) );
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_data() {
		self::initialize_jetpack_recommendations();

		return Jetpack_Options::get_option( 'recommendations_data', (object) array() );
	}

	/**
	 * Update the data for the recommendations
	 *
	 * @param WP_REST_Request $data The data.
	 */
	public static function update_recommendations_data( $data ) {
		if ( ! empty( $data ) ) {
			Jetpack_Options::update_option( 'recommendations_data', $data );
		}
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_step() {
		self::initialize_jetpack_recommendations();

		return array(
			'step' => Jetpack_Options::get_option( 'recommendations_step', 'not-started' ),
		);
	}

	/**
	 * Update the step for the recommendations
	 *
	 * @param WP_REST_Request $step The step.
	 */
	public static function update_recommendations_step( $step ) {
		if ( ! empty( $step ) ) {
			Jetpack_Options::update_option( 'recommendations_step', $step );
		}
	}
}
