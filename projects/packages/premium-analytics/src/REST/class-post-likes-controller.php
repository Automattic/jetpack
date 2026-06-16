<?php
/**
 * REST controller exposing a single post's likes for the analytics dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Jetpack_Options;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Returns a single post's likes via the WordPress.com public API at v1.2.
 */
class Post_Likes_Controller extends Public_Api_Controller {

	/**
	 * Hook the controller's routes onto rest_api_init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$controller = new self();
		add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
	}

	/**
	 * Register the post-likes route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/posts/(?P<resource_id>[\d]+)/likes',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Return the post's likes.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return mixed|\WP_Error
	 */
	public function get_items( $request ) {
		$site_id = (int) Jetpack_Options::get_option( 'id' );
		$post_id = (int) $request->get_param( 'resource_id' );

		// resource_id lives in the path, so it's dropped from the forwarded query string.
		return $this->request_public_api(
			sprintf( 'sites/%d/posts/%d/likes', $site_id, $post_id ),
			'1.2',
			$request->get_params(),
			array( 'resource_id' )
		);
	}
}
