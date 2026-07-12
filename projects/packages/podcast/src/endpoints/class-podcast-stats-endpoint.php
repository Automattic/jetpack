<?php
/**
 * Local Jetpack-side REST proxy for podcast stats.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards podcast stats `wp.apiFetch` calls from the dashboard SPA to the
 * wpcom-side podcast-stats endpoints. Browser-side wpcom-proxy-request only
 * authenticates from wpcom origins, so Atomic admin (which is the whole point
 * of this proxy) needs the request to go server-to-server with the blog
 * token. Simple sites pass through `Client::wpcom_json_api_request_as_user`
 * via the in-process IS_WPCOM short-circuit, so the round-trip cost is negligible.
 */
class Podcast_Stats_Endpoint extends WP_REST_Controller {

	use Relay_Response;

	/**
	 * Wire up routes.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( self::class, 'register' ) );
	}

	/**
	 * Registers the REST routes on the `rest_api_init` hook.
	 *
	 * Instantiated here, rather than eagerly, so the endpoint class only loads
	 * on requests that reach `rest_api_init`. Static so the callback can be
	 * unregistered.
	 */
	public static function register() {
		( new self() )->register_routes();
	}

	/**
	 * Register the four stats proxy routes the dashboard SPA consumes.
	 */
	public function register_routes() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'podcast-stats';

		// Period summary (top apps/countries/episodes for a date range).
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'read_summary' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'from'  => array(
						'type'     => 'string',
						'required' => false,
					),
					'to'    => array(
						'type'     => 'string',
						'required' => false,
					),
					'limit' => array(
						'type'     => 'integer',
						'required' => false,
					),
				),
			)
		);

		// Period-independent overview (all-time totals, preset windows, top day).
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/overview',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'read_overview' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'limit' => array(
						'type'     => 'integer',
						'required' => false,
					),
				),
			)
		);

		// Plays + duration for a batch of episode post IDs.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/episode-totals',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'read_episode_totals' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'post_ids' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);

		// Per-episode detail stats for a date range.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/episode/(?P<post_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'read_episode_detail' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'post_id' => array(
						'type'     => 'integer',
						'required' => true,
					),
					'from'    => array(
						'type'     => 'string',
						'required' => false,
					),
					'to'      => array(
						'type'     => 'string',
						'required' => false,
					),
				),
			)
		);
	}

	/**
	 * Permission callback. Stats are surfaced in the dashboard SPA which is
	 * limited to users who can edit the site's posts.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view podcast stats for this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * GET /wpcom/v2/podcast-stats — period summary.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_summary( WP_REST_Request $request ) {
		return $this->forward(
			'podcast-stats',
			array(
				'from'  => $request->get_param( 'from' ),
				'to'    => $request->get_param( 'to' ),
				'limit' => $request->get_param( 'limit' ),
			)
		);
	}

	/**
	 * GET /wpcom/v2/podcast-stats/overview — period-independent overview.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_overview( WP_REST_Request $request ) {
		return $this->forward(
			'podcast-stats/overview',
			array(
				'limit' => $request->get_param( 'limit' ),
			)
		);
	}

	/**
	 * GET /wpcom/v2/podcast-stats/episode-totals — plays + duration per episode.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_episode_totals( WP_REST_Request $request ) {
		return $this->forward(
			'podcast-stats/episode-totals',
			array(
				'post_ids' => $request->get_param( 'post_ids' ),
			)
		);
	}

	/**
	 * GET /wpcom/v2/podcast-stats/episode/{post_id} — per-episode detail.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_episode_detail( WP_REST_Request $request ) {
		$post_id = (int) $request['post_id'];

		return $this->forward(
			sprintf( 'podcast-stats/episode/%d', $post_id ),
			array(
				'from' => $request->get_param( 'from' ),
				'to'   => $request->get_param( 'to' ),
			)
		);
	}

	/**
	 * Forward a GET to `public-api.wordpress.com/wpcom/v2/sites/{blog_id}/{sub_path}`
	 * as the current user, dropping query args whose value is null/''.
	 *
	 * @param string $sub_path Sub-path under `/sites/{blog_id}/` (no leading slash).
	 * @param array  $query    Query args to append.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function forward( $sub_path, $query ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'site-not-connected',
				__( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ),
				array( 'status' => 400 )
			);
		}

		$query = array_filter(
			$query,
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$path = sprintf( '/sites/%d/%s', $blog_id, $sub_path );
		if ( ! empty( $query ) ) {
			$path = add_query_arg( $query, $path );
		}

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 15,
			),
			null,
			'wpcom'
		);

		return $this->relay_response( $response );
	}
}
