<?php
/**
 * Protect dashboard: the Scan section.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Protect_Status\Plan as Protect_Plan;
use Automattic\Jetpack\Protect_Status\Scan_Status;
use Automattic\Jetpack\Protect_Status\Status as Protect_Status;
use Automattic\Jetpack\Redirect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Vulnerability results, from Scan on a paid plan or Protect's free daily check, and on-demand scans.
 *
 * @since $$next-version$$
 */
class Jetpack_Protect_Dashboard_Scan implements Jetpack_Protect_Dashboard_Section {

	/**
	 * Scan statuses that mean a scan is still running, as the Protect plugin reads them.
	 *
	 * @var string[]
	 */
	const SCANNING_STATUSES = array( 'provisioning', 'scheduled', 'scanning' );

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
		$has_plan = self::has_scan_plan();

		return array_merge(
			array(
				'hasPlan' => $has_plan,
				'url'     => $has_plan
					? Redirect::get_url( 'my-jetpack-manage-scan' )
					: admin_url( 'admin.php?page=my-jetpack#/add-scan' ),
			),
			self::get_scan_report()
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
					'permission_callback' => array( Jetpack_Protect_Dashboard::class, 'can_manage' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'start_scan' ),
					'permission_callback' => array( Jetpack_Protect_Dashboard::class, 'can_manage' ),
				),
			)
		);
	}

	/**
	 * The latest report, fresh from WordPress.com, for polling while a scan runs.
	 *
	 * @return array
	 */
	public static function get_scan() {
		return self::get_scan_report( true );
	}

	/**
	 * Start a scan: enqueue one with a Scan plan, otherwise ask for the latest vulnerability report.
	 *
	 * @return array|WP_Error
	 */
	public static function start_scan() {
		if ( self::has_scan_plan() ) {
			$response = Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%d/scan/enqueue', Jetpack_Options::get_option( 'id' ) ),
				'2',
				array( 'method' => 'POST' ),
				null,
				'wpcom'
			);
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				return new WP_Error( 'scan_not_started', __( 'The scan couldn’t be started. Try again in a few minutes.', 'jetpack' ), array( 'status' => 502 ) );
			}
			Scan_Status::delete_option();
		}

		return self::get_scan_report( true );
	}

	/**
	 * Whether the site has a Scan plan, which runs real scans.
	 *
	 * @return bool
	 */
	private static function has_scan_plan() {
		return class_exists( Protect_Plan::class ) && Protect_Plan::has_required_plan();
	}

	/**
	 * The latest vulnerability report: from Scan on a paid plan, otherwise Protect's free check.
	 *
	 * @param bool $refresh Fetch it from WordPress.com instead of the cache.
	 * @return array
	 */
	private static function get_scan_report( $refresh = false ) {
		if ( ! class_exists( Protect_Status::class ) ) {
			return array( 'error' => true );
		}

		$status = Protect_Status::get_status( $refresh );
		if ( ! empty( $status->error ) ) {
			return array( 'error' => true );
		}

		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return array(
			'error'          => false,
			'scanning'       => in_array( $status->status, self::SCANNING_STATUSES, true ),
			'lastChecked'    => $status->last_checked,
			'pluginsChecked' => count( get_plugins() ),
			'themesChecked'  => count( wp_get_themes() ),
			'threats'        => Jetpack_Protect_Dashboard_Threats::format_all( $status->threats ),
		);
	}
}

Jetpack_Protect_Dashboard::register_section( new Jetpack_Protect_Dashboard_Scan() );
