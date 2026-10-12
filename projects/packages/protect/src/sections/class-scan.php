<?php
/**
 * Protect dashboard: the Scan section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use Automattic\Jetpack\Protect\Dashboard_Threats;
use Automattic\Jetpack\Protect_Status\Protect_Status;
use Automattic\Jetpack\Protect_Status\Scan_Status;
use Automattic\Jetpack\Protect_Status\Status;
use Automattic\Jetpack\Redirect;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Vulnerability results, from Scan on a paid plan or Protect's free daily check, and on-demand scans.
 *
 * @since $$next-version$$
 */
class Scan implements Dashboard_Section {

	/**
	 * Scan statuses that mean a scan is still running, as the Protect plugin reads them.
	 *
	 * @var string[]
	 */
	const SCANNING_STATUSES = array( 'provisioning', 'scheduled', 'scanning' );

	/**
	 * Statuses that mean the first scan has not run yet when there is no report date.
	 *
	 * @var string[]
	 */
	const INITIALIZING_STATUSES = array( 'idle', 'unavailable' );

	/**
	 * Lock held for a minute after a scan request, so repeated requests don't stack.
	 *
	 * @var string
	 */
	const REQUEST_LOCK = 'jetpack_protect_dashboard_scan_requested';

	/**
	 * Fixer statuses that mean a fix has finished, one way or the other.
	 *
	 * @var string[]
	 */
	const FIX_DONE_STATUSES = array( 'fixed', 'not_fixed' );

	/**
	 * Transient caching Scan history, which is slow to fetch; the ignored list and the History tab share it.
	 *
	 * @var string
	 */
	const HISTORY_CACHE = 'jetpack_protect_dashboard_scan_history';

	/**
	 * The section key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'scan';
	}

	/**
	 * The plan, where to manage or buy Scan, and the latest report.
	 *
	 * @return array
	 */
	public function get_state() {
		$has_plan = Dashboard::has_scan_plan();

		return array_merge(
			array(
				'hasPlan' => $has_plan,
				'url'     => $has_plan
					? Redirect::get_url( 'my-jetpack-manage-scan' )
					: admin_url( 'admin.php?page=my-jetpack#/add-scan' ),
			),
			self::get_scan_report( $has_plan )
		);
	}

	/**
	 * Register `jetpack/v4/protect-dashboard/scan`.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/scan',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_scan' ),
					'permission_callback' => array( Dashboard::class, 'can_manage' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'start_scan' ),
					'permission_callback' => array( Dashboard::class, 'can_manage' ),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/scan/threats/(?P<id>\d+)/ignore',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'ignore_threat' ),
				'permission_callback' => array( __CLASS__, 'can_act_on_threats' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/scan/threats/(?P<id>\d+)/unignore',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'unignore_threat' ),
				'permission_callback' => array( __CLASS__, 'can_act_on_threats' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/scan/ignored',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_ignored_threats' ),
				'permission_callback' => array( __CLASS__, 'can_act_on_threats' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/scan/threats/(?P<id>\d+)/fix',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_fix_status' ),
					'permission_callback' => array( __CLASS__, 'can_act_on_threats' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'fix_threat' ),
					'permission_callback' => array( __CLASS__, 'can_act_on_threats' ),
				),
			)
		);
	}

	/**
	 * Only Scan can fix or ignore threats; the free vulnerability check can't.
	 *
	 * @return bool|WP_Error
	 */
	public static function can_act_on_threats() {
		if ( ! Dashboard::can_manage() ) {
			return false;
		}
		if ( ! Dashboard::has_scan_plan() ) {
			return new WP_Error( 'scan_plan_required', __( 'Fixing and ignoring threats needs Jetpack Scan.', 'jetpack-protect-pkg' ), array( 'status' => 403 ) );
		}
		return true;
	}

	/**
	 * Ignore a threat; the client moves it to its ignored list.
	 *
	 * @param WP_REST_Request $request The request, with the threat `id`.
	 * @return array|WP_Error
	 */
	public static function ignore_threat( WP_REST_Request $request ) {
		return self::set_ignored( (int) $request['id'], true );
	}

	/**
	 * Report an ignored threat again; the client moves it back to its active list.
	 *
	 * @param WP_REST_Request $request The request, with the threat `id`.
	 * @return array|WP_Error
	 */
	public static function unignore_threat( WP_REST_Request $request ) {
		return self::set_ignored( (int) $request['id'], false );
	}

	/**
	 * Ignore or unignore a threat, and drop the caches that list it.
	 *
	 * @param int  $id     The threat id.
	 * @param bool $ignore True to ignore, false to unignore.
	 * @return array|WP_Error
	 */
	private static function set_ignored( $id, $ignore ) {
		$response = self::alerts_request( '/' . $id, 'POST', array( $ignore ? 'ignore' : 'unignore' => true ) );
		if ( is_wp_error( $response ) ) {
			return $ignore
				? new WP_Error( 'threat_not_ignored', __( 'The threat couldn’t be ignored. Try again in a few minutes.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) )
				: new WP_Error( 'threat_not_unignored', __( 'The threat couldn’t be unignored. Try again in a few minutes.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}

		Scan_Status::delete_option();
		delete_transient( self::HISTORY_CACHE );
		return array( 'ok' => true );
	}

	/**
	 * Threats the site has ignored, from Scan history.
	 *
	 * @return array|WP_Error
	 */
	public static function get_ignored_threats() {
		$history = self::get_history_threats();
		if ( is_wp_error( $history ) ) {
			return new WP_Error( 'ignored_unavailable', __( 'Ignored threats are unavailable right now.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}
		return array_values(
			array_filter(
				$history,
				function ( $threat ) {
					return 'ignored' === $threat['status'];
				}
			)
		);
	}

	/**
	 * Every threat Scan has fixed or ignored, cached for five minutes.
	 *
	 * @return array|WP_Error
	 */
	public static function get_history_threats() {
		$cached = get_transient( self::HISTORY_CACHE );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$api_url  = Scan_Status::get_api_url();
		$response = is_wp_error( $api_url ) ? $api_url : Client::wpcom_json_api_request_as_blog(
			$api_url . '/history',
			'2',
			array(
				'method'  => 'GET',
				'timeout' => 30,
			),
			null,
			'wpcom'
		);
		$body     = is_wp_error( $response ) ? null : json_decode( wp_remote_retrieve_body( $response ) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) || ! is_object( $body ) ) {
			return new WP_Error( 'history_unavailable', __( 'Scan history is unavailable right now.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}

		$threats = Dashboard_Threats::format_all( (array) ( $body->threats ?? array() ) );
		set_transient( self::HISTORY_CACHE, $threats, 5 * MINUTE_IN_SECONDS );
		return $threats;
	}

	/**
	 * Ask Scan to fix a threat.
	 *
	 * @param WP_REST_Request $request The request, with the threat `id`.
	 * @return array|WP_Error The threat's fixer status.
	 */
	public static function fix_threat( WP_REST_Request $request ) {
		$id       = (int) $request['id'];
		$response = self::alerts_request( '/fix', 'POST', array( 'threat_ids' => array( $id ) ) );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'threat_not_fixed', __( 'The fix couldn’t be started. Try again in a few minutes.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}

		Scan_Status::delete_option();
		$status = self::get_threat_fix_status( $response, $id );
		if ( 'fixed' === $status['status'] ) {
			delete_transient( self::HISTORY_CACHE );
		}
		return $status;
	}

	/**
	 * How a fix is going, with the refreshed report once it has finished.
	 *
	 * @param WP_REST_Request $request The request, with the threat `id`.
	 * @return array|WP_Error
	 */
	public static function get_fix_status( WP_REST_Request $request ) {
		$id       = (int) $request['id'];
		$response = self::alerts_request( add_query_arg( 'threat_ids', array( $id ), '/fix' ), 'GET' );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'fix_status_unavailable', __( 'We couldn’t check on the fix.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}

		$status = self::get_threat_fix_status( $response, $id );
		if ( in_array( $status['status'], self::FIX_DONE_STATUSES, true ) ) {
			// A fixed threat moves into Scan history.
			if ( 'fixed' === $status['status'] ) {
				delete_transient( self::HISTORY_CACHE );
			}
			$status['scan'] = self::get_scan_report( true, true );
		}
		return $status;
	}

	/**
	 * One threat's status from a WordPress.com fixer response.
	 *
	 * @param object $response The decoded response, with fixer statuses under `threats`, keyed by threat id.
	 * @param int    $id       The threat id.
	 * @return array The `status`, such as `in_progress` or `fixed`, and any `error`.
	 */
	private static function get_threat_fix_status( $response, $id ) {
		$threat = $response->threats->{ (string) $id } ?? null;
		return array(
			'status' => $threat->status ?? ( empty( $threat->error ) ? 'in_progress' : 'not_fixed' ),
			'error'  => $threat->error ?? null,
		);
	}

	/**
	 * Call the site's WordPress.com alerts API as the current user, as the Protect plugin does.
	 *
	 * @param string     $path   Path after `/sites/{id}/alerts`.
	 * @param string     $method HTTP method.
	 * @param array|null $body   Body to send as JSON.
	 * @return object|WP_Error The decoded response.
	 */
	private static function alerts_request( $path, $method, $body = null ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site_not_connected' );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/alerts%s', $blog_id, $path ),
			'2',
			array( 'method' => $method ),
			null === $body ? null : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'alerts_request_failed' );
		}

		// Ignoring answers with no useful body; only the status code matters there.
		$decoded = json_decode( wp_remote_retrieve_body( $response ) );
		return is_object( $decoded ) ? $decoded : new \stdClass();
	}

	/**
	 * The latest report, fresh from WordPress.com, for polling while a scan runs.
	 *
	 * @return array
	 */
	public static function get_scan() {
		return self::get_scan_report( Dashboard::has_scan_plan(), true );
	}

	/**
	 * Start a scan: enqueue one with a Scan plan, otherwise ask for the latest vulnerability report.
	 *
	 * @return array|WP_Error
	 */
	public static function start_scan() {
		$has_plan = Dashboard::has_scan_plan();

		if ( $has_plan && self::claim_request_lock() ) {
			$api_url  = Scan_Status::get_api_url();
			$response = is_wp_error( $api_url )
				? $api_url
				: Client::wpcom_json_api_request_as_blog( $api_url . '/enqueue', '2', array( 'method' => 'POST' ), null, 'wpcom' );
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				self::release_request_lock();
				return new WP_Error( 'scan_not_started', __( 'The scan couldn’t be started. Try again in a few minutes.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
			}
			Scan_Status::delete_option();
			delete_transient( self::HISTORY_CACHE );

			/**
			 * Fires after the Protect dashboard enqueues a scan on WordPress.com.
			 *
			 * @since $$next-version$$
			 */
			do_action( 'jetpack_protect_dashboard_scan_started' );
		}

		return self::get_scan_report( $has_plan, true );
	}

	/**
	 * Claim the once-a-minute scan request slot before calling WordPress.com, so concurrent requests don't both enqueue.
	 *
	 * @return bool Whether this request got the slot.
	 */
	private static function claim_request_lock() {
		// `wp_cache_add()` is atomic with a persistent object cache; transients can only narrow the race.
		if ( wp_using_ext_object_cache() ) {
			return wp_cache_add( self::REQUEST_LOCK, time(), 'jetpack_protect', MINUTE_IN_SECONDS );
		}
		if ( get_transient( self::REQUEST_LOCK ) ) {
			return false;
		}
		set_transient( self::REQUEST_LOCK, time(), MINUTE_IN_SECONDS );
		return true;
	}

	/**
	 * Give the scan request slot back after a failed request, so the user can retry straight away.
	 *
	 * @return void
	 */
	private static function release_request_lock() {
		if ( wp_using_ext_object_cache() ) {
			wp_cache_delete( self::REQUEST_LOCK, 'jetpack_protect' );
		} else {
			delete_transient( self::REQUEST_LOCK );
		}
	}

	/**
	 * The latest vulnerability report: from Scan on a paid plan, otherwise Protect's free check.
	 *
	 * @param bool $has_plan Whether the site has a Scan plan.
	 * @param bool $refresh  Fetch the report from WordPress.com instead of the cache; the plan is never refreshed.
	 * @return array
	 */
	private static function get_scan_report( $has_plan, $refresh = false ) {
		$error = array(
			'error'    => true,
			'scanning' => false,
		);
		if ( ! class_exists( Status::class ) ) {
			return $error;
		}

		if ( $refresh ) {
			Status::$status = null;
		}
		$status = $has_plan ? Scan_Status::get_status( $refresh ) : Protect_Status::get_status( $refresh );
		if ( ! empty( $status->error ) ) {
			return $error;
		}

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$is_initializing = empty( $status->last_checked ) && in_array( $status->status, self::INITIALIZING_STATUSES, true );

		return array(
			'error'          => false,
			'scanning'       => $is_initializing || in_array( $status->status, self::SCANNING_STATUSES, true ),
			'lastChecked'    => $status->last_checked,
			'progress'       => isset( $status->current_progress ) ? (int) $status->current_progress : null,
			'pluginsChecked' => count( get_plugins() ),
			'themesChecked'  => count( wp_get_themes() ),
			'threats'        => Dashboard_Threats::format_all( $status->threats ),
		);
	}
}
