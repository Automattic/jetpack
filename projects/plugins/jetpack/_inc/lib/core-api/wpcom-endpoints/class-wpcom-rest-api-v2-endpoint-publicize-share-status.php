<?php
/**
 * Publicize: Share status
 *
 * This file is synced from the Jetpack monorepo to WPCOM.
 *
 * @package automattic/jetpack
 * @since
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Publicize: Share post class.
 */
class WPCOM_REST_API_V2_Endpoint_Publicize_Share_Status extends WP_REST_Controller {

	const SOCIAL_SHARES_POST_META_KEY = '_publicize_shares';

	/**
	 * The constructor sets the route namespace, rest_base, and registers our API route and endpoint.
	 * Additionally, we check if we're executing this file on WPCOM or Jetpack.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';

		// $wpcom_is_wpcom_only_endpoint = true keeps WPCOM from trying to loop back to the Jetpack endpoint.
		$this->wpcom_is_wpcom_only_endpoint = true;

		// Determine if this endpoint is running on WPCOM or not.
		$this->is_wpcom = false;
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * This file is synced from Jetpack to WPCOM and this method creates a slightly different route for both sites.
	 * Jetpack route: http://{$site}/wp-json/wpcom/v2/publicize/share-status/{$postId}
	 * WPCOM route: https://public-api.wordpress.com/wpcom/v2/sites/{$siteId}/publicize/share-status/{$postId}
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/publicize/share-status/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_post_share_status' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			),
			true
		);
	}

	/**
	 * Ensure the user has permissions to publish posts on this blog.
	 *
	 * @return WP_Error|boolean
	 */
	public function permissions_check() {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * If this method callback is executed on WPCOM, we share the post using republicize_post(). If this method callback
	 * is executed on a Jetpack site, we make an API call to WPCOM using wpcom_json_api_request_as_user() and return
	 * the results. In both cases, this file and method are executed, as this file is synced from Jetpack to WPCOM.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|array The share status.
	 */
	public function get_post_share_status( $request ) {
		$post_id = $request->get_param( 'post_id' );

		if ( $this->is_wpcom ) {
			$post = get_post( $post_id );

			if ( empty( $post ) ) {
				return new WP_Error( 'not_found', 'Cannot find that post', array( 'status' => 404 ) );
			}
			if ( 'publish' !== $post->post_status ) {
				return new WP_Error( 'not_published', 'Cannot get share status for an unpublished post', array( 'status' => 400 ) );
			}

			// Not passing the third argument as `true`.
			$shares = get_post_meta( $post_id, self::SOCIAL_SHARES_POST_META_KEY );

			$done = metadata_exists( 'post', $post_id, self::SOCIAL_SHARES_POST_META_KEY );

			return array(
				'shares' => $done ? $shares : array(),
				'done'   => $done,
			);
		} else {
			$response = $this->proxy_request( $post_id );
			if ( is_wp_error( $response ) ) {
				return rest_ensure_response( $response );
			}

			return json_decode( wp_remote_retrieve_body( $response ), true );
		}
	}

	/**
	 * Passes the request on to the WPCOM endpoint, and returns the result.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return array|WP_Error $response Response data, else WP_Error on failure.
	 */
	public function proxy_request( $post_id ) {
		/*
		 * Publicize endpoint on WPCOM:
		 * [POST] wpcom/v2/sites/{$siteId}/publicize/share-status/{$postId}
		 */
		$url = sprintf(
			'/sites/%d/publicize/share-status/%d',
			Jetpack_Options::get_option( 'id' ),
			$post_id
		);

		return Client::wpcom_json_api_request_as_user(
			$url,
			'v2',
			array(
				'method' => 'GET',
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Publicize_Share_Status' );
