<?php
/**
 * MailPoet Subcribers stats reporting.
 *
 * @package wpcomsh
 */

/**
 * Initializes and processes wp-cron job that reports subscribers stats to MC Stats.
 */
class WPCOMSH_MailPoet_Subscribers_Stats_Report {

	const STATUS_STATS_GROUP = 'mailpoet-subscriber-stats'; // Reporting stats data
	const REPORT_STATS_GROUP = 'mailpoet-subscriber-reports'; // Reporting successful and failed attempts for reporting stats
	const STATS_SERVICE_URL  = 'http://pixel.wp.com/g.gif';
	const WP_CRON_HOOK       = 'wpcomsh_mailpoet_subscribers_stats';

	const ALLOWED_STATUSES = array(
		'subscribed'   => 1,
		'inactive'     => 1,
		'unsubscribed' => 1,
		'unconfirmed'  => 1,
		'bounced'      => 1,
	);

	/**
	 * When MailPoet plugin is detected active the method schedules a weekly wp-cron job
	 * for reporting subscribers stats to MC Stats
	 *
	 * @return void
	 */
	public static function init_wp_cron() {
		// Always handle the cron hook so it has a chance to unschedule itself after mailpoet deactivation
		add_action( self::WP_CRON_HOOK, array( self::class, 'report_stats' ) );

		if (
			is_plugin_active( 'mailpoet/mailpoet.php' ) &&
			false === wp_next_scheduled( self::WP_CRON_HOOK )
		) {
			wp_schedule_event( time(), 'weekly', self::WP_CRON_HOOK );
		}
	}

	/**
	 * Reports subscriber counts by status to MC Stats and also increases stats counting sites that sent the report.
	 *
	 * @return void
	 */
	public static function report_stats() {
		// Cleanup wp-cron in case the MailPoet plugin was deactivated
		if ( ! is_plugin_active( 'mailpoet/mailpoet.php' ) ) {
			$timestamp = wp_next_scheduled( self::WP_CRON_HOOK );
			if ( $timestamp !== false ) {
				wp_unschedule_event( $timestamp, self::WP_CRON_HOOK );
			}
			return;
		}

		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$stats_data = $wpdb->get_results( 'SELECT count(id) as `count`, `status` FROM ' . $wpdb->prefix . 'mailpoet_subscribers GROUP BY `status`', ARRAY_A ); // db call ok; no-cache ok
		$query_args = array( 'v' => 'wpcom-no-pv' );

		if ( ! is_array( $stats_data ) ) {
			self::bump_report_status( 'db_fetch_error' );
			return;
		}

		foreach ( $stats_data as $status_data ) {
			if ( (int) $status_data['count'] === 0 || ! isset( self::ALLOWED_STATUSES[ $status_data['status'] ] ) ) {
				continue;
			}
			$query_args[ 'x_' . self::STATUS_STATS_GROUP . '/' . $status_data['status'] ] = $status_data['count'];
		}

		// Increase success count of sites that reported stats
		$result = self::bump_report_status( 'success' );
		if ( $result === false ) {
			return;
		}

		// Report subscribers status stats
		$stats_track_url = self::STATS_SERVICE_URL . '?' . http_build_query( $query_args );
		$result          = wp_remote_get( $stats_track_url );
		if ( $result instanceof \WP_Error ) {
			error_log( 'WPComSH: ' . $result->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
		}
	}

	/**
	 * Reports status of subscriber stats report to the MC Stats.
	 *
	 * @param string $status Status of the report. Possible values: success, db_fetch_error.
	 * @return bool True if success otherwise false
	 */
	public static function bump_report_status( string $status ) {
		$stats_report_track_url = self::STATS_SERVICE_URL . '?v=wpcom-no-pv&x_' . self::REPORT_STATS_GROUP . '=' . $status;
		$result                 = wp_remote_get( $stats_report_track_url );
		if ( $result instanceof \WP_Error ) {
			error_log( 'WPComSH: ' . $result->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
			return false;
		}
		return true;
	}
}

add_action( 'init', array( WPCOMSH_MailPoet_Subscribers_Stats_Report::class, 'init_wp_cron' ) );
