<?php
/**
 * REST API endpoint for post-level newsletter email-sent state.
 *
 * On Jetpack sites, registers the route and proxies requests to WordPress.com.
 * On WordPress.com Simple sites, the a8c-sandbox rest-api-plugins endpoint
 * handles this natively—this file does nothing there.
 *
 * GET /wpcom/v2/newsletter-email-sent-status?post_id=<id>
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Simple sites: a8c-sandbox rest-api-plugins handles this. No need to register.
if ( ( new Host() )->is_wpcom_simple() ) {
	return;
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status
 */
class WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = 'newsletter-email-sent-status';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'show_in_index'       => true,
				'methods'             => 'GET',
				'callback'            => array( $this, 'proxy_request_to_wpcom_as_user' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'post_id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
						'validate_callback' => function ( $param ) {
							return $param > 0;
						},
					),
				),
			)
		);
	}

	/**
	 * Permission check for the endpoint.
	 *
	 * @return bool|WP_Error
	 */
	public function permission_check() {
		if ( current_user_can( 'edit_posts' ) || current_user_can( 'manage_options' ) ) {
			return true;
		}
		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to access this endpoint.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Newsletter_Email_Sent_Status' );
