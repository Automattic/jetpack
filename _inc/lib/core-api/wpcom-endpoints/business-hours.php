<?php

/**
 * Subscribers: Get subscriber count
 *
 * @since 6.9
 */
class WPCOM_REST_API_V2_Endpoint_Business_Hours extends WP_REST_Controller {
	function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'bussiness-hours';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		// GET /sites/<blog_id>/subscribers/count - Return number of subscribers for this site.
		register_rest_route( $this->namespace, '/' . $this->rest_base  . '/count', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_business_hours' ),
			)
		) );
	}

	/**
	 * Retreives localized business hours
	 *
	 * @return array data object containing information about business hours
	 */
	public function get_business_hours() {
		global $wp_locale;
		return array(
			'days' => array(
				'Sun' => $wp_locale->get_weekday( 0 ),
				'Mon' => $wp_locale->get_weekday( 1 ),
				'Tue' => $wp_locale->get_weekday( 2 ),
				'Wed' => $wp_locale->get_weekday( 3 ),
				'Thu' => $wp_locale->get_weekday( 4 ),
				'Fri' => $wp_locale->get_weekday( 5 ),
				'Sat' => $wp_locale->get_weekday( 6 ),
			),
			'start_of_week' => (int) get_option( 'start_of_week', 0 ),
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Business_Hours' );
