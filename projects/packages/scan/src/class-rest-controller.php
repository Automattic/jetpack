<?php
/**
 * The Scan REST Controller.
 *
 * Registers the `/jetpack/v4/site/scan/*` routes backing the admin UI.
 * Read routes proxy to the corresponding WPCOM v2 endpoint, mutation
 * routes proxy to the user-scoped `wpcom/v2 /sites/:siteId/alerts/*`
 * surface that the Calypso Scan dashboard already uses.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use function add_query_arg;
use function current_user_can;
use function esc_html__;
use function is_wp_error;
use function json_decode;
use function register_rest_route;
use function rest_ensure_response;
use function wp_json_encode;
use function wp_remote_retrieve_body;
use function wp_remote_retrieve_response_code;

/**
 * REST routes for the Scan UI.
 */
class REST_Controller {

	/**
	 * REST namespace used by this package.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * REST route prefix used by this package.
	 *
	 * @var string
	 */
	const REST_ROUTE_PREFIX = 'site/scan';

	/**
	 * Register the REST routes backing the Scan UI.
	 *
	 * Read paths land in Phase 1 (this controller). Mutation paths
	 * (threat-id `ignore` / `unignore`, bulk `threats/fix`,
	 * `threats/fix-status`) land in Phase 3. The scan-enqueue mutation
	 * lands in Phase 5.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_site_scan' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/history',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_site_scan_history' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/counts',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_site_scan_counts' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/threat/(?P<id>[\w\-]+)/ignore',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'post_threat_ignore' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'id' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/threat/(?P<id>[\w\-]+)/unignore',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'post_threat_unignore' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'id' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/threats/fix',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'post_threats_fix' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'threat_ids' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'string',
						),
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/enqueue',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'post_scan_enqueue' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX . '/threats/fix-status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_threats_fix_status' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'threat_ids' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'string',
						),
					),
				),
			)
		);
	}

	/**
	 * Permission callback: admin-only. Mirrors the gate in
	 * `Jetpack_Scan::is_available()`.
	 *
	 * @return bool|WP_Error
	 */
	public static function permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'You do not have permission to access this resource.', 'jetpack-scan-page' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * GET /site/scan — current scan state + active threats.
	 *
	 * Proxies WPCOM `/sites/:siteId/scan` with blog auth (matches Protect
	 * plugin's `Threats::fetch_status()`).
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_site_scan() {
		return self::proxy_get( '/scan', 'scan', true );
	}

	/**
	 * GET /site/scan/history — past scan runs and their threats.
	 *
	 * Proxies WPCOM `/sites/:siteId/scan/history` with blog auth (matches
	 * Protect plugin's `Threats::history()`).
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_site_scan_history() {
		return self::proxy_get( '/scan/history', 'scan_history', true );
	}

	/**
	 * GET /site/scan/counts — threat counts for the overview tabs.
	 *
	 * Proxies WPCOM `/sites/:siteId/scan/counts` with blog auth.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_site_scan_counts() {
		return self::proxy_get( '/scan/counts', 'scan_counts', true );
	}

	/**
	 * POST /site/scan/threat/{id}/ignore — mark a threat as ignored.
	 *
	 * Proxies WPCOM `POST /sites/:siteId/alerts/:threatId` with
	 * `{ ignore: true }`. Same shape Protect plugin's
	 * `Threats::ignore_threat()` already uses.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function post_threat_ignore( WP_REST_Request $request ) {
		$threat_id = (string) $request->get_param( 'id' );
		return self::proxy_post(
			sprintf( '/alerts/%s', rawurlencode( $threat_id ) ),
			array( 'ignore' => true ),
			'scan_threat_ignore'
		);
	}

	/**
	 * POST /site/scan/threat/{id}/unignore — reactivate a previously-ignored
	 * threat.
	 *
	 * Proxies WPCOM `POST /sites/:siteId/alerts/:threatId` with
	 * `{ unignore: true }`.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function post_threat_unignore( WP_REST_Request $request ) {
		$threat_id = (string) $request->get_param( 'id' );
		return self::proxy_post(
			sprintf( '/alerts/%s', rawurlencode( $threat_id ) ),
			array( 'unignore' => true ),
			'scan_threat_unignore'
		);
	}

	/**
	 * POST /site/scan/threats/fix — kick auto-fix for one or more threats.
	 *
	 * Proxies WPCOM `POST /sites/:siteId/alerts/fix` with
	 * `{ threat_ids: [...] }`. Same endpoint handles single + bulk fix.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function post_threats_fix( WP_REST_Request $request ) {
		$ids = (array) $request->get_param( 'threat_ids' );
		$ids = array_values( array_filter( array_map( 'strval', $ids ) ) );
		return self::proxy_post(
			'/alerts/fix',
			array( 'threat_ids' => $ids ),
			'scan_threats_fix'
		);
	}

	/**
	 * POST /site/scan/enqueue — trigger an immediate scan run.
	 *
	 * Proxies WPCOM `POST /sites/:siteId/scan/enqueue` with blog auth
	 * (matches Protect plugin's `Threats::scan()`).
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function post_scan_enqueue() {
		return self::proxy_post( '/scan/enqueue', array(), 'scan_enqueue', true );
	}

	/**
	 * GET /site/scan/threats/fix-status — poll the auto-fixer for the
	 * current state of one or more threats.
	 *
	 * Proxies WPCOM `GET /sites/:siteId/alerts/fix?threat_ids[]=…`. Body
	 * shape mirrors `post_threats_fix` so the UI hook can poll until each
	 * threat reaches a terminal state.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_threats_fix_status( WP_REST_Request $request ) {
		$ids = (array) $request->get_param( 'threat_ids' );
		$ids = array_values( array_filter( array_map( 'strval', $ids ) ) );

		$path = add_query_arg( array( 'threat_ids' => $ids ), '/alerts/fix' );
		return self::proxy_get( $path, 'scan_threats_fix_status' );
	}

	/**
	 * Proxy a GET request to the WPCOM v2 Scan endpoint and pass the JSON
	 * body through (or surface a WP_Error mapping the upstream status
	 * code).
	 *
	 * Site-level reads (`/scan`, `/scan/history`, `/scan/counts`) sign
	 * with blog auth — the same contract Protect plugin's `Threats::*`
	 * helpers use, and what WPCOM expects for these endpoints. Alert /
	 * fix-status endpoints stay on user auth so per-user permissions on
	 * threat mutations carry through.
	 *
	 * Forwarding the visitor IP keeps WPCOM-side audit logs aligned with
	 * the existing `/jetpack/v4/site/activity` proxy in `activity-log`.
	 *
	 * @param string $upstream_path WPCOM path suffix (e.g. `/scan`, `/alerts/fix`).
	 * @param string $error_slug    Slug used when synthesising WP_Error codes.
	 * @param bool   $as_blog       Sign with blog auth instead of user auth.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function proxy_get( $upstream_path, $error_slug, $as_blog = false ) {
		$path = self::resolve_blog_path( $upstream_path );
		if ( is_wp_error( $path ) ) {
			return $path;
		}

		$args = array(
			'method'  => 'GET',
			'headers' => array(
				'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
			),
		);

		$response = $as_blog
			? Client::wpcom_json_api_request_as_blog(
				$path,
				'2',
				$args,
				null,
				'wpcom'
			)
			: Client::wpcom_json_api_request_as_user(
				$path,
				'2',
				$args,
				null,
				'wpcom'
			);

		return self::map_response( $response, $error_slug );
	}

	/**
	 * Proxy a POST request to the user-scoped WPCOM v2 Scan endpoint
	 * with a JSON body and pass the response through (or surface a
	 * WP_Error mapping the upstream status code).
	 *
	 * @param string $upstream_path WPCOM path suffix (e.g. `/alerts/fix`).
	 * @param array  $body          Body payload sent as JSON.
	 * @param string $error_slug    Slug used when synthesising WP_Error codes.
	 * @param bool   $as_blog       Sign with blog auth instead of user auth.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function proxy_post( $upstream_path, array $body, $error_slug, $as_blog = false ) {
		$path = self::resolve_blog_path( $upstream_path );
		if ( is_wp_error( $path ) ) {
			return $path;
		}

		$args         = array(
			'method'  => 'POST',
			'headers' => array(
				'Content-Type'    => 'application/json',
				'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
			),
		);
		$encoded_body = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );

		$response = $as_blog
			? Client::wpcom_json_api_request_as_blog(
				$path,
				'2',
				$args,
				$encoded_body,
				'wpcom'
			)
			: Client::wpcom_json_api_request_as_user(
				$path,
				'2',
				$args,
				$encoded_body,
				'wpcom'
			);

		return self::map_response( $response, $error_slug );
	}

	/**
	 * Resolve the connected blog id and prefix it onto the WPCOM path
	 * suffix. Surfaces a 400 WP_Error if the site isn't connected.
	 *
	 * @param string $upstream_path WPCOM path suffix.
	 * @return string|WP_Error
	 */
	private static function resolve_blog_path( $upstream_path ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $blog_id <= 0 ) {
			return new WP_Error(
				'jetpack_scan_no_blog_id',
				esc_html__( 'Site is not connected to WordPress.com.', 'jetpack-scan-page' ),
				array( 'status' => 400 )
			);
		}

		return sprintf( '/sites/%d%s', $blog_id, $upstream_path );
	}

	/**
	 * Translate a WPCOM HTTP response into a `WP_REST_Response` /
	 * `WP_Error` for the local `/jetpack/v4/*` route to return.
	 *
	 * @param array|WP_Error $response   Result of `wpcom_json_api_request_as_user`.
	 * @param string         $error_slug Slug used when synthesising WP_Error codes.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function map_response( $response, $error_slug ) {
		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'jetpack_' . $error_slug . '_request_failed',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status < 200 || $status >= 300 ) {
			return new WP_Error(
				'jetpack_' . $error_slug . '_request_failed',
				isset( $body['message'] ) ? (string) $body['message'] : esc_html__( 'Unable to fetch Scan data.', 'jetpack-scan-page' ),
				array( 'status' => $status > 0 ? $status : 500 )
			);
		}

		return rest_ensure_response( $body );
	}
}
