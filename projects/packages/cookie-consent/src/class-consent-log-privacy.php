<?php
/**
 * GDPR personal-data exporter/eraser for the consent log.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

defined( 'ABSPATH' ) || exit;

/**
 * Registers WordPress personal-data exporter/eraser callbacks for the
 * cookie-consent log table, matched by email -> user_id.
 */
class Consent_Log_Privacy {

	/**
	 * Export group id / exporter+eraser registration key.
	 *
	 * @var string
	 */
	private const GROUP_ID = 'jetpack-cookie-consent';

	/**
	 * Rows processed per page.
	 *
	 * @var int
	 */
	private const PER_PAGE = 100;

	/**
	 * Register the exporter and eraser filters.
	 */
	public static function init() {
		add_filter( 'wp_privacy_personal_data_exporters', array( __CLASS__, 'register_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( __CLASS__, 'register_eraser' ) );
	}

	/**
	 * Register the exporter.
	 *
	 * @param array $exporters Registered exporters.
	 * @return array
	 */
	public static function register_exporter( $exporters ) {
		$exporters[ self::GROUP_ID ] = array(
			'exporter_friendly_name' => __( 'Cookie Consent Log', 'jetpack-cookie-consent' ),
			'callback'               => array( __CLASS__, 'export' ),
		);
		return $exporters;
	}

	/**
	 * Register the eraser.
	 *
	 * @param array $erasers Registered erasers.
	 * @return array
	 */
	public static function register_eraser( $erasers ) {
		$erasers[ self::GROUP_ID ] = array(
			'eraser_friendly_name' => __( 'Cookie Consent Log', 'jetpack-cookie-consent' ),
			'callback'             => array( __CLASS__, 'erase' ),
		);
		return $erasers;
	}

	/**
	 * Resolve an email to a WordPress user id, or 0 if none.
	 *
	 * @param string $email Email address.
	 * @return int
	 */
	private static function user_id_for_email( $email ) {
		$user = get_user_by( 'email', $email );
		return $user ? (int) $user->ID : 0;
	}

	/**
	 * Fetch a page of consent rows for a user id.
	 *
	 * @param int $user_id User id.
	 * @param int $page    Page number (1-based).
	 * @return array Array of associative row arrays.
	 */
	private static function get_rows( $user_id, $page ) {
		global $wpdb;
		$table  = Consent_Log_Controller::get_table_name();
		$offset = ( max( 1, $page ) - 1 ) * self::PER_PAGE;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE user_id = %d ORDER BY id LIMIT %d OFFSET %d",
				$user_id,
				self::PER_PAGE,
				$offset
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}

	/**
	 * Personal-data exporter callback.
	 *
	 * @param string $email Email address being exported.
	 * @param int    $page  Page number (1-based).
	 * @return array { data: array, done: bool }
	 */
	public static function export( $email, $page = 1 ) {
		$user_id = self::user_id_for_email( $email );
		if ( ! $user_id ) {
			return array(
				'data' => array(),
				'done' => true,
			);
		}

		$rows = self::get_rows( $user_id, $page );
		$data = array();
		foreach ( $rows as $row ) {
			$data[] = array(
				'group_id'    => self::GROUP_ID,
				'group_label' => __( 'Cookie Consent Log', 'jetpack-cookie-consent' ),
				'item_id'     => 'consent-log-' . $row['id'],
				'data'        => array(
					array(
						'name'  => __( 'Consent ID', 'jetpack-cookie-consent' ),
						'value' => $row['consent_id'],
					),
					array(
						'name'  => __( 'Event', 'jetpack-cookie-consent' ),
						'value' => $row['event_type'],
					),
					array(
						'name'  => __( 'IP Address', 'jetpack-cookie-consent' ),
						'value' => $row['ip_address'],
					),
					array(
						'name'  => __( 'URL', 'jetpack-cookie-consent' ),
						'value' => $row['url'],
					),
					array(
						'name'  => __( 'Consent Types', 'jetpack-cookie-consent' ),
						'value' => $row['consent_types'],
					),
					array(
						'name'  => __( 'Date (GMT)', 'jetpack-cookie-consent' ),
						'value' => $row['date_created_gmt'],
					),
				),
			);
		}

		return array(
			'data' => $data,
			'done' => count( $rows ) < self::PER_PAGE,
		);
	}
}
