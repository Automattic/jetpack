<?php
/**
 * REST API endpoint to manage purchase tokens for logged out users.
 *
 * @package automattic/jetpack
 * @since 9.8.0
 */

/**
 * PurchaseToken wpcom api v2 endpoint
 */
class WPCOM_REST_API_V2_Endpoint_Purchase_Token extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'purchase-token';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_purchase_token' ),
				'permission_callback' => array( $this, 'permission_callback' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_purchase_token' ),
				'permission_callback' => array( $this, 'permission_callback' ),
			)
		);
	}

	/**
	 * Verify if site can request or delete a purchase token.
	 *
	 * @return bool True if user is able to request or delete a purchase token.
	 */
	public function permission_callback() {
		$is_site_level_auth = apply_filters( 'jetpack_site_level_auth', false );

		if ( $is_site_level_auth ) {
			return true;
		}

		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns a purchase token used for site-connected (non user-authenticated) checkout.
	 *
	 * @return array|WP_Error The current purchase token or WP_Error with error details.
	 */
	public function get_purchase_token() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_registered', esc_html__( 'Site not registered.', 'jetpack' ) );
		}

		$purchase_token = Jetpack_Options::get_option( 'purchase_token', false );
		$response       = array(
			'purchaseToken' => $purchase_token,
		);

		return $response;
	}

	/**
	 * Deletes the purchaseToken Jetpack_Option
	 *
	 * @return boolean|WP_Error Whether the token was deleted or WP_Error with error details.
	 */
	public static function delete_purchase_token() {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_registered', esc_html__( 'Site not registered.', 'jetpack' ) );
		}

		return Jetpack_Options::delete_option( 'purchase_token' );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Purchase_Token' );
