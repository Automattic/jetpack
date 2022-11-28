<?php
/**
 * The Stats Rest Controller class.
 * Registers the REST routes for Stats.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;

/**
 * Registers the REST routes for Stats.
 * It bascially forwards the requests to the WordPress.com REST API.
 */
class REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/stats-app';

	/**
	 * Hold an instance of WPCOM_Stats.
	 *
	 * @var WPCOM_Stats
	 */
	protected $wpcom_stats;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->wpcom_stats = new WPCOM_Stats();
	}

	/**

	 * Registers the REST routes for Stats.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		// Stats for single resource type.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/(?P<resource>[\-\w]+)/(?P<resource_id>[\d]+)', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats_single_resource_from_wpcom' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);

		// Stats for a resource type.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/stats/(?P<resource>[\-\w]+)', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats_resource' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);

		// Single post info.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/posts/(?P<resource_id>[\d]+)', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_post' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);

		// Single post likes.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/posts/(?P<resource_id>[\d]+)/likes', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_post_likes' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);

		// Required site endpoints for the Stats app.
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/(?P<resource>[\-\w]+)', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_resource_from_wpcom' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);

		// TODO remove call to the endpoint from the frontend.
		register_rest_route(
			static::$namespace,
			sprintf( '/jetpack-blogs/%d/rest-api/', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_result' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);

		// TODO remove call to the endpoint from the frontend.
		register_rest_route(
			static::$namespace,
			'/me/connections',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_result' ),
				'permission_callback' => array( $this, 'check_user_privileges_callback' ),
			)
		);
	}

	/**
	 * Only users with capability `view_stats` can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function check_user_privileges_callback() {
		if ( current_user_can( 'manage_options' ) || current_user_can( 'view_stats' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Stats resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_stats_resource( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'file-downloads':
				return $this->stats->get_file_downloads( $req->get_params() );

			case 'video-plays':
				return $this->stats->get_video_plays( $req->get_params() );

			case 'clicks':
				return $this->stats->get_clicks( $req->get_params() );

			case 'search-terms':
				return $this->stats->get_search_terms( $req->get_params() );

			case 'top-authors':
				return $this->stats->get_top_authors( $req->get_params() );

			case 'country-views':
				return $this->stats->get_views_by_country( $req->get_params() );

			case 'referrers':
				return $this->stats->get_referrers( $req->get_params() );

			case 'top-posts':
				return $this->stats->get_top_posts( $req->get_params() );

			case 'publicize':
				return $this->stats->get_publicize_followers( $req->get_params() );

			case 'followers':
				return $this->stats->get_followers( $req->get_params() );

			case 'tags':
				return $this->stats->get_tags( $req->get_params() );

			case 'visits':
				return $this->stats->get_visits( $req->get_params() );

			case 'comments':
				return $this->stats->get_top_comments( $req->get_params() );

			case 'comment-followers':
				return $this->stats->get_comment_followers( $req->get_params() );

			case 'streak':
				return $this->stats->get_streak( $req->get_params() );

			case 'insights':
				return $this->stats->get_insights( $req->get_params() );

			case 'highlights':
				return $this->stats->get_highlights( $req->get_params() );

			default:
				return $this->get_forbidden_error();
		}

	}

	/**
	 * Sub Resource endpoint e.g. posts/121/likes.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_single_post_likes( $req ) {
		return static::request_as_blog_cached(
			sprintf(
				'/sites/%d/posts/%d/likes?%s',
				Jetpack_Options::get_option( 'id' ),
				$req->get_param( 'resource_id' ),
				http_build_query(
					$req->get_params()
				)
			),
			'1.2',
			array( 'timeout' => 30 )
		);
	}

	/**
	 * Site Stats Resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_stats_single_resource_from_wpcom( $req ) {
		switch ( $req->get_param( 'resource' ) ) {
			case 'post':
				return $this->wpcom_stats->get_post_views(
					intval( $req->get_param( 'resource_id' ) ),
					$req->get_params()
				);

			case 'video':
				return $this->wpcom_stats->get_video_details(
					intval( $req->get_param( 'resource_id' ) ),
					$req->get_params()
				);

			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Site Resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_single_post( $req ) {
		$post = get_post( intval( $req->get_param( 'resource_id' ) ), 'OBJECT', 'display' );
		if ( is_wp_error( $post ) || empty( $post ) ) {
			return $post;
		}

		// TODO: do we need to check if the post is public?
		return array(
			'ID'    => $post->ID,
			'title' => $post->post_title,
			'URL'   => get_permalink( $post->ID ),
		);
	}

	/**
	 * Returns an empty object.
	 *
	 * @return object
	 */
	public function empty_result() {
		return json_decode( '{}' );
	}

	/**
	 * Empty result.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_site_resource_from_wpcom( $req ) {
		$resource = $req->get_param( 'resource' );
		switch ( $resource ) {
			case 'site-has-never-published-post':
				return $this->get_has_never_published_post( $req );

			// TODO: remove the following calls from the frontend.
			case 'posts':
			case 'sharing-buttons':
			case 'plugins':
			case 'keyrings':
			case 'rewind':
				return $this->empty_result();

			// General stats endpiont.
			case 'stats':
				return $this->wpcom_stats->get_stats( $req->get_params() );

			default:
				return $this->get_forbidden_error();
		}
	}

	/**
	 * Stolen from `wp-content/rest-api-plugins/endpoints/sites-has-never-published-post.php`
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return bool the value of has ever published post
	 */
	protected function get_has_never_published_post( $req ) {
		$has_never_published_post = (bool) get_option( 'has_never_published_post', false );

		if ( ! $has_never_published_post ) {
			return false;
		}

		$include_pages = $req->get_param( 'include_pages' );
		if ( $include_pages ) {
			$has_never_published_page = true;
			$pages                    = get_pages();
			// 20 is a threshold, We are assuming that there won't be more than 20 head start pages.
			if ( count( $pages ) <= 20 ) {
				foreach ( $pages as $page ) {
					$is_headstart_post = ! empty( get_post_meta( $page->ID, '_headstart_post' ) );
					if ( ! $is_headstart_post ) {
						$has_never_published_page = false;
						break;
					}
				}
			} else {
				$has_never_published_page = false;
			}
			return rest_ensure_response( $has_never_published_post && $has_never_published_page );
		}

		return rest_ensure_response( $has_never_published_post );
	}

	/**
	 * Query the WordPress.com REST API using the blog token
	 *
	 * @param String $path The API endpoint relative path.
	 * @param String $version The API version.
	 * @param array  $args Request arguments.
	 * @param String $body Request body.
	 * @param String $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @param bool   $use_cache (optional) default to true.
	 * @return array|WP_Error $response Data.
	 */
	protected function request_as_blog_cached( $path, $version = '1.1', $args = array(), $body = null, $base_api_path = 'rest', $use_cache = true ) {
		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = 'STATS_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args ), wp_json_encode( $body ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response_body = get_transient( $cache_key );
			if ( false !== $response_body ) {
				return $response_body;
			}
		}

		$response          = Client::wpcom_json_api_request_as_blog(
			$path,
			$version,
			$args,
			$body,
			$base_api_path = 'rest'
		);
		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response_body ) ) {
			return is_wp_error( $response ) ? $response : new WP_Error(
				isset( $response_body['error'] ) ? 'remote-error-' . $response_body['error'] : 'remote-error',
				isset( $response_body['message'] ) ? $response_body['message'] : 'unknown remote error',
				array( 'status' => $response_code )
			);

		}

		set_transient( $cache_key, $response_body, 5 * MINUTE_IN_SECONDS );
		return $response_body;
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-stats-admin'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}
}
