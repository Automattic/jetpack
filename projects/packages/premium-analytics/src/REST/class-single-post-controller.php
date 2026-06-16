<?php
/**
 * REST controller exposing single-post metadata for the analytics dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Serves a single post's display metadata from the local database.
 *
 * Unlike the WPCOM pass-through endpoints ({@see Api_Proxy_Controller}), this reads the post
 * locally via `get_post()` rather than forwarding to WPCOM: `/sites/<id>/posts/<id>` can require a
 * user token for private posts/sites, which users without a WordPress.com account don't have.
 *
 * The response shape deliberately mirrors WordPress.com's `/sites/<id>/posts/<id>` (not WP core's
 * `/wp/v2/posts/<id>`): the dashboard's data layer is shared between the public-api source and this
 * local endpoint, so keeping one shape lets the same frontend code consume both. We may later
 * migrate to the Core single-post endpoint and drop this controller, which would mean reworking
 * that shared frontend data layer to handle Core's shape.
 */
class Single_Post_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'jetpack-premium-analytics/v1';
	}

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
	 * Register the single-post route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/posts/(?P<resource_id>[\d]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_post' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Stats access: an administrator or any user who can view stats.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Return a single post's display metadata.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array<string, mixed>|WP_Error
	 */
	public function get_single_post( WP_REST_Request $request ) {
		// No per-post `read` capability check, matching the stats-admin source: the analytics
		// dashboard reports on every post, so any stats viewer may read a post's metadata by ID
		// (including drafts/private). Only the limited display fields below are exposed.
		$post = get_post( (int) $request->get_param( 'resource_id' ), OBJECT, 'display' );

		if ( empty( $post ) ) {
			return new WP_Error(
				'post_not_found',
				__( 'Post not found.', 'jetpack-premium-analytics' ),
				array( 'status' => 404 )
			);
		}

		// `like_count` is intentionally omitted — likes are fetched separately from the
		// WordPress.com public API.
		return array(
			'ID'             => $post->ID,
			'site_ID'        => (int) Jetpack_Options::get_option( 'id' ),
			'title'          => $post->post_title,
			'URL'            => get_permalink( $post->ID ),
			'type'           => $post->post_type,
			'status'         => $post->post_status,
			'discussion'     => array( 'comment_count' => (int) $post->comment_count ),
			'date'           => $post->post_date,
			'post_thumbnail' => array( 'URL' => get_the_post_thumbnail_url( $post->ID ) ),
		);
	}
}
