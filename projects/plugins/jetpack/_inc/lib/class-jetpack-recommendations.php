<?php
/**
 * Utilities related to the Jetpack Recommendations
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Contains utilities related to the Jetpack Recommendations.
 *
 * @package automattic/jetpack
 */

/**
 * Jetpack_Recommendations class
 */
class Jetpack_Recommendations {

	const PUBLICIZE_RECOMMENDATION = 'publicize';

	const CONDITIONAL_RECOMMENDATIONS_OPTION = 'recommendations_conditional';
	const CONDITIONAL_RECOMMENDATIONS        = array(
		self::PUBLICIZE_RECOMMENDATION,
	);

	/**
	 * Returns a boolean indicating if the Jetpack Recommendations are enabled.
	 *
	 * @since 9.3.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// Shortcircuit early if Jetpack is not active or we are in offline mode.
		if ( ! Jetpack::is_connection_ready() || ( new Status() )->is_offline_mode() ) {
			return false;
		}

		// No recommendations for Atomic sites, they already get onboarded in Calypso.
		if ( ( new Host() )->is_woa_site() ) {
			return false;
		}

		self::initialize_jetpack_recommendations();

		return true;
	}

	/**
	 * Returns a boolean indicating if the Jetpack Banner is enabled.
	 *
	 * @since 9.3.0
	 *
	 * @return bool
	 */
	public static function is_banner_enabled() {
		// Shortcircuit early if the recommendations are not enabled at all.
		if ( ! self::is_enabled() ) {
			return false;
		}

		$recommendations_banner_enabled = Jetpack_Options::get_option( 'recommendations_banner_enabled', null );

		// If the option is already set, just return the cached value.
		// Otherwise calculate it and store it before returning it.
		if ( null !== $recommendations_banner_enabled ) {
			return $recommendations_banner_enabled;
		}

		if ( ! Jetpack::connection()->is_connected() ) {
			return new WP_Error( 'site_not_connected', esc_html__( 'Site not connected.', 'jetpack' ) );
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

		$recommendations_start_date     = gmdate( 'Y-m-d H:i:s', strtotime( '2020-12-01 00:00:00' ) );
		$recommendations_banner_enabled = $site_registered_date > $recommendations_start_date;

		Jetpack_Options::update_option( 'recommendations_banner_enabled', $recommendations_banner_enabled );

		return $recommendations_banner_enabled;
	}

	/**
	 * Set up actions to monitor for things that trigger a recommendation.
	 *
	 * @return false|void
	 */
	public static function init_conditional_recommendation_actions() {
		// Check to make sure that recommendations are enabled.
		if ( ! self::is_enabled() ) {
			return false;
		}

		// Monitor for the publishing of a new post.
		add_action( 'transition_post_status', array( 'Jetpack_Recommendations', 'publicize_recommendation_post_transition' ), 10, 3 );
		add_action( 'jetpack_activate_module', array( 'Jetpack_Recommendations', 'jetpack_module_activated' ), 10, 2 );
	}

	/**
	 * Check when Jetpack modules are activated if some recommendations should be skipped.
	 *
	 * @param string $module Name of the module activated.
	 * @param bool   $success Whether the module activation was successful.
	 */
	public static function jetpack_module_activated( $module, $success ) {
		if ( 'publicize' === $module && $success ) {
			self::disable_conditional_recommendation( self::PUBLICIZE_RECOMMENDATION );
		}
	}

	/**
	 * Hook for transition_post_status that checks for the publishing of a new post.
	 * Used to enable the publicize recommendation.
	 *
	 * @param string  $new_status new status of post.
	 * @param string  $old_status old status of post.
	 * @param WP_Post $post the post object being updated.
	 */
	public static function publicize_recommendation_post_transition( $new_status, $old_status, $post ) {
		// Check for condition when post has been published.
		if ( 'post' === $post->post_type && 'publish' === $new_status && 'publish' !== $old_status && ! Jetpack::is_module_active( 'publicize' ) ) {
			// Set the publicize recommendation to have met criteria to be shown.
			self::enable_conditional_recommendation( self::PUBLICIZE_RECOMMENDATION );
		}
	}

	/**
	 * Enable a recommendation.
	 *
	 * @param string $recommendation_name The name of the recommendation to enable.
	 * @return false|void
	 */
	public static function enable_conditional_recommendation( $recommendation_name ) {
		if ( ! in_array( $recommendation_name, self::CONDITIONAL_RECOMMENDATIONS, true ) ) {
			return false;
		}

		$conditional_recommendations = Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
		if ( ! in_array( $recommendation_name, $conditional_recommendations, true ) ) {
			array_push( $conditional_recommendations, $recommendation_name );
			Jetpack_Options::update_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, $conditional_recommendations );
		}
	}

	/**
	 * Disable a recommendation.
	 *
	 * @param string $recommendation_name The name of the recommendation to disable.
	 * @return false|void
	 */
	public static function disable_conditional_recommendation( $recommendation_name ) {
		if ( ! in_array( $recommendation_name, self::CONDITIONAL_RECOMMENDATIONS, true ) ) {
			return false;
		}

		$conditional_recommendations = Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
		$recommendation_index        = array_search( $recommendation_name, $conditional_recommendations, true );

		if ( false !== $recommendation_index ) {
			array_splice( $conditional_recommendations, $recommendation_index, 1 );
			Jetpack_Options::update_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, $conditional_recommendations );
		}
	}

	/**
	 * Gets data for all conditional recommendations.
	 *
	 * @return mixed
	 */
	public static function get_conditional_recommendations() {
		return Jetpack_Options::get_option( self::CONDITIONAL_RECOMMENDATIONS_OPTION, array() );
	}

	/**
	 * Get a count of conditional recommendations that are eligible to show, but have not been viewed yet.
	 *
	 * @return int
	 */
	public static function get_new_conditional_recommendations_count() {
		$conditional_recommendations = self::get_conditional_recommendations();
		$recommendations_data        = Jetpack_Options::get_option( 'recommendations_data', array() );
		$viewed_recommendations      = $recommendations_data['viewedRecommendations'] ? $recommendations_data['viewedRecommendations'] : array();

		return count( array_diff( $conditional_recommendations, $viewed_recommendations ) );
	}

	/**
	 * Initializes the Recommendations step according to the Setup Wizard state.
	 */
	private static function initialize_jetpack_recommendations() {
		if ( Jetpack_Options::get_option( 'recommendations_step' ) ) {
			return;
		}

		$setup_wizard_status = Jetpack_Options::get_option( 'setup_wizard_status' );
		if ( 'completed' === $setup_wizard_status ) {
			Jetpack_Options::update_option( 'recommendations_banner_enabled', false );
			Jetpack_Options::update_option( 'recommendations_step', 'setup-wizard-completed' );
		}
	}

	/**
	 * Get the data for the recommendations
	 *
	 * @return array Recommendations data
	 */
	public static function get_recommendations_data() {
		self::initialize_jetpack_recommendations();

		return Jetpack_Options::get_option( 'recommendations_data', array() );
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
