<?php

/**
 * Mailchimp: Get Mailchimp Status.
 * API to determine if current site has linked Mailchimp account and mailing list selected.
 * This API is meant to be used in Jetpack and on WPCOM.
 *
 * @since 7.0
 */
class WPCOM_REST_API_V2_Endpoint_Mailchimp extends WP_REST_Controller {
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'mailchimp';
		$this->wpcom_is_wpcom_only_endpoint = true;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
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
	 * Get the status of current blog's Mailchimp connection
	 *
	 * @return mixed
	 * code:string (connected|unconnected),
	 * connect_url:string
	 * site_id:int
	 */
	public function get_mailchimp_status() {
		$is_wpcom    = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id     = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		$connect_url = sprintf( 'https://wordpress.com/sharing/%s', $site_id );
		$path        = sprintf( '/sites/%d/mailchimp/settings', $site_id );
		if ( ! $is_wpcom ) {
			$response = Jetpack_Client::wpcom_json_api_request_as_blog(
				$path,
				'1.1'
			);
			if ( is_wp_error( $response ) ) {
				return new WP_Error( 'wpcom_connection_error', 'Could not connect to WP.com', 404 );
			}
			$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
		} else {
			require_lib( 'mailchimp' );
			$data = MailchimpApi::get_settings( $site_id );
		}
		$follower_list_id = isset( $data['follower_list_id'] ) ? $data['follower_list_id'] : null;
		$code             = $follower_list_id ? 'connected' : 'not_connected';
		return array(
			'code'        => $code,
			'connect_url' => $connect_url,
			'site_id'     => $site_id,
		);
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Mailchimp' );
