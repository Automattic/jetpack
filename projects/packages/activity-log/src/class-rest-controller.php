<?php
/**
 * The Activity Log REST Controller.
 *
 * Registers the `/jetpack/v4/activity-log/*` routes backing the admin
 * UI. Each route is a thin proxy to the corresponding WPCOM v2
 * endpoint, authenticated with the site's blog token.
 *
 * @package automattic/jetpack-activity-log
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Activity_Log\V0001;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use function current_user_can;
use function esc_html__;
use function http_build_query;
use function is_wp_error;
use function json_decode;
use function register_rest_route;
use function rest_ensure_response;
use function wp_remote_retrieve_body;
use function wp_remote_retrieve_response_code;

/**
 * REST routes for the Activity Log UI.
 */
class REST_Controller {

	/**
	 * REST namespace used by this package.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * Query params accepted by the list endpoint. Shape matches Calypso's
	 * ActivityLogParams so the ported UI can forward its filter state
	 * verbatim.
	 *
	 * @return array
	 */
	private static function list_args() {
		return array(
			'number'      => array(
				'description' => __( 'Number of items to return per page.', 'jetpack-activity-log' ),
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => 1000,
			),
			'page'        => array(
				'description' => __( '1-indexed page number.', 'jetpack-activity-log' ),
				'type'        => 'integer',
				'minimum'     => 1,
			),
			'sort_order'  => array(
				'description' => __( 'Sort direction.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'enum'        => array( 'asc', 'desc' ),
			),
			'after'       => array(
				'description' => __( 'ISO 8601 lower bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'before'      => array(
				'description' => __( 'ISO 8601 upper bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'group'       => array(
				'description' => __( 'Only return events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'not_group'   => array(
				'description' => __( 'Exclude events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'text_search' => array(
				'description' => __( 'Full-text search string.', 'jetpack-activity-log' ),
				'type'        => 'string',
			),
		);
	}

	/**
	 * Query params accepted by the group-counts endpoint. A subset of the
	 * list params — no pagination or sort, no text search.
	 *
	 * @return array
	 */
	private static function group_counts_args() {
		return array(
			'number'    => array(
				'description' => __( 'Cap on the number of events considered when counting groups.', 'jetpack-activity-log' ),
				'type'        => 'integer',
				'minimum'     => 1,
				'maximum'     => 1000,
			),
			'after'     => array(
				'description' => __( 'ISO 8601 lower bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'before'    => array(
				'description' => __( 'ISO 8601 upper bound on event timestamp.', 'jetpack-activity-log' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'group'     => array(
				'description' => __( 'Only count events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'not_group' => array(
				'description' => __( 'Exclude events in these groups.', 'jetpack-activity-log' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
		);
	}

	/**
	 * Register the Activity Log REST routes.
	 *
	 * Hooked on `rest_api_init` by {@see Jetpack_Activity_Log::initialize()}.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/activity-log',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_activity_log' ),
				'permission_callback' => array( __CLASS__, 'permissions_callback' ),
				'args'                => self::list_args(),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/activity-log/count/group',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_activity_log_group_counts' ),
				'permission_callback' => array( __CLASS__, 'permissions_callback' ),
				'args'                => self::group_counts_args(),
			)
		);
	}

	/**
	 * Permission callback. Mirrors the menu gating — any admin on a
	 * non-multisite install with a user-level WPCOM connection can read
	 * the log. A user-level connection is required because the upstream
	 * WPCOM endpoint is user-gated (it needs to identify *which* admin
	 * is asking); signing as the blog gets rejected with "Only
	 * Administrators can query information about the current site."
	 *
	 * @return bool|WP_Error
	 */
	public static function permissions_callback() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error(
				'activity_log_user_not_connected',
				esc_html__( 'Your WordPress.com account is not connected to this site. Connect it to use the Activity Log.', 'jetpack-activity-log' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Proxy the paginated activity list.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return mixed
	 */
	public static function get_activity_log( WP_REST_Request $request ) {
		return self::proxy_get( '/activity', $request, array_keys( self::list_args() ) );
	}

	/**
	 * Proxy the group-counts endpoint.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return mixed
	 */
	public static function get_activity_log_group_counts( WP_REST_Request $request ) {
		return self::proxy_get( '/activity/count/group', $request, array_keys( self::group_counts_args() ) );
	}

	/**
	 * Shared helper: forward whitelisted query params from $request to the
	 * equivalent WPCOM v2 path under `/sites/{blog_id}`.
	 *
	 * @param string          $wpcom_path    Path relative to the site, starting with "/".
	 * @param WP_REST_Request $request       Incoming request.
	 * @param array           $allowed_keys  Params to forward. Any unset keys are dropped.
	 * @return mixed Decoded JSON response from WPCOM, or WP_Error on failure.
	 */
	private static function proxy_get( $wpcom_path, WP_REST_Request $request, array $allowed_keys ) {
		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'activity_log_not_connected',
				esc_html__( 'This site is not connected to WordPress.com.', 'jetpack-activity-log' ),
				array( 'status' => 400 )
			);
		}

		$params = array();
		foreach ( $allowed_keys as $key ) {
			$value = $request->get_param( $key );
			if ( $value !== null ) {
				$params[ $key ] = $value;
			}
		}

		$path = sprintf( '/sites/%d%s', (int) $blog_id, $wpcom_path );
		if ( ! empty( $params ) ) {
			$path .= '?' . http_build_query( $params );
		}

		// Sign as the current user, not the blog: the upstream /sites/{id}/activity
		// endpoint checks that a specific admin is asking. Forward the visitor IP
		// so WPCOM logs match the existing /jetpack/v4/site/activity proxy.
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
				'activity_log_request_failed',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status ) {
			return new WP_Error(
				'activity_log_request_failed',
				isset( $body['message'] ) ? (string) $body['message'] : esc_html__( 'Unable to fetch activity log.', 'jetpack-activity-log' ),
				array( 'status' => $status ? $status : 500 )
			);
		}

		return rest_ensure_response( $body );
	}
}
