<?php
/**
 * Manage Mailchimp connection
 *
 * @since 6.9
 */
class WPCOM_REST_API_V2_Endpoint_Mailchimp extends WP_REST_Controller {
	/**
	 * TK __construct() docblock
	 */
	public function __construct() {
		$this->namespace   = 'wpcom/v2';
		$this->rest_base   = 'mailchimp';
		$this->option_name = 'jetpack_mailchimp';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}
	/**
	 * TK egister_routes docblock
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_mailchimp_status' ),
				),
			)
		);
	}
	/**
	 * Get Mailchimp connection status.
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public function get_mailchimp_status() {
		//https://public-api.wordpress.com/rest/v1.1/sites/jeffintraining352694663.wordpress.com/mailchimp/lists
		$path = sprintf( '/sites/%d/mailchimp/lists', Jetpack_Options::get_option('id' ) );
		$response =  Jetpack_Client::wpcom_json_api_request_as_blog(
			$path,
			'1.1',
			array( 'method' => 'POST' ),
			array()
		);

		// if ( 200 !== $response['response']['code'] ) {
		// 	return null;
		// }
		// return json_decode( $response['body'], true );



		$option      = get_option( $this->option_name );
		$data        = $option ? json_decode( $option, true ) : null;
		$code        = ( $option && isset( $data['follower_list_id'] ) && $data['follower_list_id'] ) ? 'connected' : 'not_connected';
		$connect_url = sprintf( 'https://wordpress.com/sharing/%s', $this->get_site_slug() );
		return array(
			'code'        => $code,
			'connect_url' => $connect_url,
			'path'        => $path,
			'response'    => $response
			// 'code'        => $response['response']['code'],
			// 'fun'         => $response['body'],
		);
	}
	/**
	 * Get the slug for the current site
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public function get_site_slug() {
		if ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'build_raw_urls' ) ) {
			return Jetpack::build_raw_urls( home_url() );
		} elseif ( class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
			return WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
		}
		return '';
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Mailchimp' );
