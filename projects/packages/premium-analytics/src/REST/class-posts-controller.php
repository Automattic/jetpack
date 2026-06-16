<?php
/**
 * REST controller exposing the site's post list for the analytics dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Jetpack_Options;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Lists the site's posts via the WordPress.com public API at v1.1, forcing the WPCOM-backed
 * response (`force=wpcom`) so the dashboard sees the same data regardless of the local site's
 * Jetpack sync state.
 */
class Posts_Controller extends Public_Api_Controller {

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
	 * Register the post-list route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/posts',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * List the site's posts.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return mixed|\WP_Error
	 */
	public function get_items( $request ) {
		$params = array_merge( array( 'force' => 'wpcom' ), $request->get_params() );

		return $this->request_public_api(
			sprintf( 'sites/%d/posts', (int) Jetpack_Options::get_option( 'id' ) ),
			'1.1',
			$params
		);
	}
}
