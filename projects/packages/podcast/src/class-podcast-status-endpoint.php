<?php
/**
 * Podcast dashboard status endpoint.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

/**
 * Provides derived podcast status that is awkward to infer from core REST data.
 */
class Podcast_Status_Endpoint extends WP_REST_Controller {

	/**
	 * Wire the route when the podcast package is enabled.
	 */
	public static function init() {
		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
	}

	/**
	 * Register the status route.
	 */
	public function register_routes() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'podcast/status';

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_status' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);
	}

	/**
	 * Permission callback.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to manage podcast settings on this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Read derived podcast status for the dashboard.
	 */
	public function read_status() {
		$category_id = Customize_Feed::resolve_category_id();
		$feed_url    = $category_id > 0 ? get_category_feed_link( $category_id, 'rss2' ) : '';

		return rest_ensure_response(
			array(
				'categoryId'          => $category_id,
				'feedUrl'             => $feed_url ? esc_url_raw( $feed_url ) : '',
				'hasPublishedEpisode' => $category_id > 0 ? Episode_Query::has_published_episode( $category_id ) : false,
			)
		);
	}
}
