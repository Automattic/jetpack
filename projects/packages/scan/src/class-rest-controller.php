<?php
/**
 * The Scan REST Controller.
 *
 * Registers the `/jetpack/v4/site/scan/*` routes backing the admin UI.
 * Each read route proxies to the corresponding WPCOM v2 endpoint,
 * authenticated with the user's Jetpack token. Mutations (enqueue,
 * fix/ignore/unignore, bulk fix) land in later phases.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;
use function current_user_can;
use function esc_html__;
use function is_wp_error;
use function json_decode;
use function register_rest_route;
use function rest_ensure_response;
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
	 * (`/enqueue`, threat-id `fix`/`ignore`/`unignore`, bulk `threats/fix`,
	 * `threats/fix-status`) land in Phases 3–5 once the corresponding UI
	 * flows are ported.
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
	 * Proxies WPCOM `/sites/:siteId/scan`.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_site_scan() {
		return self::proxy_to_wpcom( '/scan', 'scan' );
	}

	/**
	 * GET /site/scan/history — past scan runs and their threats.
	 *
	 * Proxies WPCOM `/sites/:siteId/scan/history`.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_site_scan_history() {
		return self::proxy_to_wpcom( '/scan/history', 'scan_history' );
	}

	/**
	 * GET /site/scan/counts — threat counts for the overview tabs.
	 *
	 * Proxies WPCOM `/sites/:siteId/scan/counts`.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_site_scan_counts() {
		return self::proxy_to_wpcom( '/scan/counts', 'scan_counts' );
	}

	/**
	 * Proxy a GET request to the user-scoped WPCOM v2 Scan endpoint and
	 * pass the JSON body through (or surface a WP_Error mapping the
	 * upstream status code).
	 *
	 * Forwarding the visitor IP keeps WPCOM-side audit logs aligned with
	 * the existing `/jetpack/v4/site/activity` proxy in `activity-log`.
	 *
	 * @param string $upstream_path WPCOM path suffix (e.g. `/scan`, `/scan/counts`).
	 * @param string $error_slug    Slug used when synthesising WP_Error codes.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function proxy_to_wpcom( $upstream_path, $error_slug ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $blog_id <= 0 ) {
			return new WP_Error(
				'jetpack_scan_no_blog_id',
				esc_html__( 'Site is not connected to WordPress.com.', 'jetpack-scan-page' ),
				array( 'status' => 400 )
			);
		}

		$path = sprintf( '/sites/%d%s', $blog_id, $upstream_path );

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'jetpack_' . $error_slug . '_request_failed',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status ) {
			return new WP_Error(
				'jetpack_' . $error_slug . '_request_failed',
				isset( $body['message'] ) ? (string) $body['message'] : esc_html__( 'Unable to fetch Scan data.', 'jetpack-scan-page' ),
				array( 'status' => $status > 0 ? $status : 500 )
			);
		}

		return rest_ensure_response( $body );
	}
}
