<?php
/**
 * API endpoints to interact with WordPress.com
 * to get info from the Mailchimp API for use with the Mailchimp block.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Mailchimp: Get Mailchimp Status.
 * API to determine if current site has linked Mailchimp account and mailing list selected.
 * This API is meant to be used in Jetpack and on WPCOM.
 *
 * @since 7.1
 */
class WPCOM_REST_API_V2_Endpoint_Mailchimp extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace                    = 'wpcom/v2';
		$this->rest_base                    = 'mailchimp';
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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_mailchimp_status' ),
					'permission_callback' => '__return_true',
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/groups',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_mailchimp_groups' ),
					'permission_callback' => '__return_true',
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_mailchimp_settings' ),
					'permission_callback' => function () {
						return current_user_can( 'manage_options' );
					},
				),
			)
		);
	}

	/**
	 * Check if MailChimp is set up properly.
	 *
	 * @return bool
	 */
	private function is_connected() {
		$option = get_option( 'jetpack_mailchimp' );
		if ( ! $option ) {
			return false;
		}
		$data = json_decode( $option, true );
		if ( ! $data ) {
			return false;
		}
		return isset( $data['follower_list_id'] ) && isset( $data['keyring_id'] );
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
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		$connect_url = '/wp-admin/options-writing.php';
		return array(
			'code'        => $this->is_connected() ? 'connected' : 'not_connected',
			'connect_url' => $connect_url,
			'site_id'     => $site_id,
		);
	}

	/**
	 * Get all Mailchimp groups for the accounted connected to the current blog
	 *
	 * @return mixed
	 * groups:array
	 * site_id:int
	 */
	public function get_mailchimp_groups() {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}

		// Do not attempt to fetch groups if Mailchimp is not connected.
		if ( ! $this->is_connected() ) {
			return new WP_Error(
				'mailchimp_not_connected',
				__( 'Your site is not connected to Mailchimp yet.', 'jetpack' ),
				403
			);
		}

		$path    = sprintf( '/sites/%d/mailchimp/groups', absint( $site_id ) );
		$request = Client::wpcom_json_api_request_as_blog( $path );
		$body    = wp_remote_retrieve_body( $request );
		return json_decode( $body );
	}

	/**
	 * Get the Mailchimp connection settings.
	 *
	 * @return mixed
	 */
	public function get_mailchimp_settings() {
		$site_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}

		$settings = array();

		if ( ( new Host() )->is_wpcom_simple() ) {
			require_lib( 'mailchimp' );
			$api                   = new MailchimpApi( $site_id, get_current_user_id() );
			$settings              = $api::get_settings( $site_id );
			$settings['audiences'] = $api->get_lists();
		} else {
			$path     = sprintf( '/sites/%d/mailchimp/settings', $site_id );
			$response = Client::wpcom_json_api_request_as_user( $path, '1.1', array(), null, 'rest' );
			if ( ! is_wp_error( $response ) ) {
				$settings = json_decode( wp_remote_retrieve_body( $response ), true );
			}

			$path     = sprintf( '/sites/%d/mailchimp/lists', $site_id );
			$response = Client::wpcom_json_api_request_as_user( $path, '1.1', array(), null, 'rest' );
			if ( ! is_wp_error( $response ) ) {
				$settings['audiences'] = json_decode( wp_remote_retrieve_body( $response ), true );
			}
		}

		return $settings;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Mailchimp' );
