<?php
/**
 * Local Jetpack-side REST proxy for podcast distribution submissions.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards podcast distribution `wp.apiFetch` calls from the dashboard SPA to
 * the wpcom-side podcast-distribution endpoints. Same rationale as
 * Podcast_Stats_Endpoint: wpcom-proxy-request can't authenticate from Atomic
 * origins, so we proxy server-to-server with the user's token.
 */
class Podcast_Distribution_Endpoint extends WP_REST_Controller {

	use Relay_Response;

	const REST_NAMESPACE = 'wpcom/v2';
	const REST_BASE      = 'podcast-distribution';

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire up routes. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
	}

	/**
	 * Register the Pocket Casts submit proxy route.
	 */
	public function register_routes() {
		$this->namespace = self::REST_NAMESPACE;
		$this->rest_base = self::REST_BASE;

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/pocket-casts/submit',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'submit_pocket_casts' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);
	}

	/**
	 * Permission callback. Submitting a feed mutates the site's distribution
	 * state, so require the same edit permission the dashboard SPA itself uses.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to submit podcasts for this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * POST /wpcom/v2/podcast-distribution/pocket-casts/submit — forward to wpcom.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function submit_pocket_casts() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'site-not-connected',
				__( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ),
				array( 'status' => 400 )
			);
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/podcast-distribution/pocket-casts/submit', $blog_id ),
			'2',
			array(
				// Pocket Casts relay can be slow; keep a generous timeout.
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 30,
			),
			null,
			'wpcom'
		);

		return $this->relay_response( $response );
	}
}
