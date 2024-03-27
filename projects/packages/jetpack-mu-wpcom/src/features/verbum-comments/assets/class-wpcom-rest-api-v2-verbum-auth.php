<?php
/**
 * Plugin Name: Verbum Comments Experience Auth.
 * Description: This returns the user info based on their cookies/headers.
 * Author: Vertex
 * Text Domain: jetpack-mu-wpcom
 *
 * @package automattic/jetpack-mu-plugins
 */

declare( strict_types = 1 );

/**
 * Verbum Comments Experience Auth endpoint.
 */
class WPCOM_REST_API_V2_Verbum_Auth extends \WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace                       = 'wpcom/v2';
		$this->rest_base                       = '/verbum/auth';
		$this->wpcom_is_wpcom_only_endpoint    = false;
		$this->wpcom_is_site_specific_endpoint = false;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'show_in_index'       => false,
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_auth' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Authorize user based on their WordPress credentials or Facebook cookies.
	 *
	 * @return array|WP_Error
	 */
	public function get_auth() {
		$user = wp_get_current_user();
		if ( $user->ID ) {
			list( $wordpress_avatar_url ) = wpcom_get_avatar_url( $user->user_email, 60, '', true );
			return array(
				'account' => $user->user_login,
				'avatar'  => $wordpress_avatar_url,
				'email'   => $user->user_email,
				'link'    => ( ! empty( $user->user_url ) ? esc_url_raw( $user->user_url ) : esc_url_raw( 'http://gravatar.com/' . $user->user_login ) ),
				'name'    => ( ! empty( $user->display_name ) ? $user->display_name : $user->user_login ),
				'uid'     => $user->ID,
				'service' => 'wordpress',
			);
		} else {
			$fb = \Automattic\Jetpack\Verbum_Comments::verify_facebook_identity();
			if ( ! is_wp_error( $fb ) ) {
				return array(
					'account' => $fb->name,
					'avatar'  => $fb->picture->data->url,
					'email'   => $fb->email,
					'link'    => esc_url_raw( 'http://gravatar.com/' . $fb->email ),
					'name'    => $fb->name,
					'uid'     => $user->id,
					'service' => 'facebook',
				);
			}
		}
		return new \WP_Error( '403', 'Not Authorized', array( 'status' => 403 ) );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Verbum_Auth' );
