<?php
/**
 * Protect dashboard: the Monitor section, for downtime monitoring.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The Monitor module's state and its uptime history.
 *
 * @since $$next-version$$
 */
class Monitor implements Dashboard_Section {

	/**
	 * Days of uptime the section shows.
	 *
	 * @var int
	 */
	const UPTIME_DAYS = 40;

	/**
	 * Transient caching the uptime history.
	 *
	 * @var string
	 */
	const UPTIME_TRANSIENT = 'jetpack_protect_dashboard_uptime';

	/**
	 * Drop the cached history whenever Monitor is turned on or off.
	 */
	public function __construct() {
		add_action( 'jetpack_activate_module_monitor', array( $this, 'clear_cache' ) );
		add_action( 'jetpack_deactivate_module_monitor', array( $this, 'clear_cache' ) );
	}

	/**
	 * The section's key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'monitor';
	}

	/**
	 * Whether Monitor can run here and is on, the days of uptime shown, and whether the user can reach WordPress.com.
	 *
	 * @return array
	 */
	public function get_state() {
		return array_merge(
			Dashboard::get_module_state( 'monitor' ),
			array(
				'uptimeDays'    => self::UPTIME_DAYS,
				'userConnected' => ( new Connection_Manager() )->is_user_connected(),
			)
		);
	}

	/**
	 * Register the uptime route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/uptime',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_uptime' ),
				'permission_callback' => array( Dashboard::class, 'can_manage' ),
				'args'                => array(
					'retry' => array(
						'description' => __( 'Ask WordPress.com again, even if it failed in the last minute.', 'jetpack-protect-pkg' ),
						'type'        => 'boolean',
						'default'     => false,
					),
				),
			)
		);
	}

	/**
	 * Daily uptime for the last UPTIME_DAYS days (oldest first) and the current status, from WordPress.com.
	 *
	 * @param WP_REST_Request|null $request The request; its `retry` flag skips a remembered failure.
	 * @return array|WP_Error
	 */
	public function get_uptime( $request = null ) {
		if ( ! Dashboard::get_module_state( 'monitor' )['active'] ) {
			return new WP_Error( 'monitor_inactive', __( 'Downtime monitoring is off.', 'jetpack-protect-pkg' ), array( 'status' => 409 ) );
		}

		// The endpoints check `manage_options` for the requesting user, so a blog token is refused.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error( 'not_connected', __( 'Connect your WordPress.com account to see uptime.', 'jetpack-protect-pkg' ), array( 'status' => 403 ) );
		}

		$cached = get_transient( self::UPTIME_TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		if ( 'failed' === $cached && ! ( $request && $request['retry'] ) ) {
			return $this->unavailable_error();
		}

		// It has no 40-day period, so ask for 90 and keep the newest days.
		$history = $this->request( '/jetpack-monitor-uptime?period=' . rawurlencode( '90 days' ) );
		$days    = $this->parse_days( $history['body'] );
		if ( ! $days ) {
			// A 401 or 403 is about this user's token, so it must not hide the history from other admins.
			if ( ! in_array( $history['code'], array( 401, 403 ), true ) ) {
				set_transient( self::UPTIME_TRANSIENT, 'failed', MINUTE_IN_SECONDS );
			}
			return $this->unavailable_error();
		}

		$uptime = array(
			'days' => $days,
			'isUp' => $this->fetch_is_up(),
		);
		set_transient( self::UPTIME_TRANSIENT, $uptime, null === $uptime['isUp'] ? MINUTE_IN_SECONDS : 10 * MINUTE_IN_SECONDS );
		return $uptime;
	}

	/**
	 * Forget the cached uptime history.
	 *
	 * @return void
	 */
	public function clear_cache() {
		delete_transient( self::UPTIME_TRANSIENT );
	}

	/**
	 * The newest UPTIME_DAYS days of an uptime history, oldest first; empty when it has no valid days.
	 *
	 * @param mixed $body The decoded history, keyed by `Y-m-d` date.
	 * @return array
	 */
	private function parse_days( $body ) {
		if ( ! is_array( $body ) ) {
			return array();
		}

		$body = array_filter(
			$body,
			function ( $day, $date ) {
				return is_array( $day ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $date );
			},
			ARRAY_FILTER_USE_BOTH
		);
		ksort( $body );

		$days = array();
		foreach ( array_slice( $body, -self::UPTIME_DAYS, null, true ) as $date => $day ) {
			$status = $day['status'] ?? null;
			$days[] = array(
				'date'              => (string) $date,
				'status'            => in_array( $status, array( 'up', 'down' ), true ) ? $status : 'monitor_inactive',
				'downtimeInMinutes' => (int) ( $day['downtime_in_minutes'] ?? 0 ),
			);
		}
		return $days;
	}

	/**
	 * Whether the site is up right now; null when unknown.
	 *
	 * @return bool|null
	 */
	private function fetch_is_up() {
		$body   = $this->request( '/jetpack-monitor-status' )['body'];
		$status = is_array( $body ) ? ( $body['status'] ?? null ) : null;
		return is_bool( $status ) ? $status : null;
	}

	/**
	 * GET a wpcom/v2 site endpoint as the current user.
	 *
	 * @param string $path Path after `/sites/<id>`.
	 * @return array The HTTP `code` (0 when the request failed) and the decoded `body`, null unless the code is 200.
	 */
	private function request( $path ) {
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d', Jetpack_Options::get_option( 'id' ) ) . $path,
			'2',
			array(),
			null,
			'wpcom'
		);
		$code     = is_wp_error( $response ) ? 0 : (int) wp_remote_retrieve_response_code( $response );
		return array(
			'code' => $code,
			'body' => 200 === $code ? json_decode( wp_remote_retrieve_body( $response ), true ) : null,
		);
	}

	/**
	 * The error returned when WordPress.com can't be reached.
	 *
	 * @return WP_Error
	 */
	private function unavailable_error() {
		return new WP_Error( 'uptime_unavailable', __( 'Uptime history is unavailable right now.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
	}
}
