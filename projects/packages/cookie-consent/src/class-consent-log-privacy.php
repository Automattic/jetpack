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
	 * Remove the exporter and eraser filters.
	 *
	 * Mirrors init(); booted from Consent_Log_Controller::deactivate() so a
	 * consumer that deactivates within the request stops exposing the consent
	 * log to core's privacy tools.
	 */
	public static function deactivate() {
		remove_filter( 'wp_privacy_personal_data_exporters', array( __CLASS__, 'register_exporter' ) );
		remove_filter( 'wp_privacy_personal_data_erasers', array( __CLASS__, 'register_eraser' ) );
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
		// Cast to array: get_results() returns null on a DB error, which would fatal
		// on the count()/foreach in export().
		return (array) $wpdb->get_results(
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

	/**
	 * Personal-data eraser callback.
	 *
	 * Default mode anonymizes matched rows (clears IP, zeroes user_id) to keep
	 * an auditable proof-of-consent count. Filter to 'delete' for hard removal.
	 *
	 * @param string $email Email address being erased.
	 * @param int    $page  Page number (1-based).
	 * @return array { items_removed: bool, items_retained: bool, messages: array, done: bool }
	 */
	public static function erase( $email, $page = 1 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $page is required by the WP eraser callback signature; we intentionally always fetch offset 0.
		$response = array(
			'items_removed'  => false,
			'items_retained' => false,
			'messages'       => array(),
			'done'           => true,
		);

		$user_id = self::user_id_for_email( $email );
		if ( ! $user_id ) {
			return $response;
		}

		// Always fetch from offset 0 (page 1), ignoring the $page argument.
		// Each pass anonymizes/deletes the rows it touches, removing them from
		// the "WHERE user_id = N" result set. The next core-driven pass therefore
		// sees the next unprocessed batch at offset 0. When fewer than PER_PAGE
		// rows remain, done = true and iteration converges.
		$rows = self::get_rows( $user_id, 1 );
		if ( empty( $rows ) ) {
			return $response;
		}

		$ids = wp_list_pluck( $rows, 'id' );

		/**
		 * Filters how consent-log rows are erased: 'anonymize' (default) or 'delete'.
		 *
		 * @param string $mode    Erase mode.
		 * @param int    $user_id The user id whose rows are being erased.
		 */
		$mode = apply_filters( 'jetpack_cookie_consent_erase_mode', 'anonymize', $user_id );

		$written = 'delete' === $mode
			? self::delete_rows( $ids )
			: self::anonymize_rows( $ids );

		if ( false === $written ) {
			// The UPDATE/DELETE failed. Report honestly (nothing removed) and stop
			// iterating: leaving done = true terminates core's erasure loop instead
			// of re-requesting the same un-erased rows (get_rows always reads offset 0).
			$response['messages'][] = __( 'Cookie consent records could not be erased due to a database error.', 'jetpack-cookie-consent' );
			return $response;
		}

		if ( 'delete' !== $mode ) {
			$response['items_retained'] = true;
			$response['messages'][]     = __( 'Cookie consent records were anonymized and retained for consent accountability.', 'jetpack-cookie-consent' );
		}

		$response['items_removed'] = true;
		$response['done']          = count( $rows ) < self::PER_PAGE;

		return $response;
	}

	/**
	 * Anonymize rows: clear the IP and detach the user.
	 *
	 * @param int[] $ids Row ids.
	 * @return int|false Rows affected, or false on error.
	 */
	private static function anonymize_rows( $ids ) {
		global $wpdb;
		$table        = Consent_Log_Controller::get_table_name();
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		return $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$table} SET ip_address = NULL, user_id = 0 WHERE id IN ({$placeholders})",
				...array_map( 'intval', $ids )
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
	}

	/**
	 * Hard-delete rows.
	 *
	 * @param int[] $ids Row ids.
	 * @return int|false Rows affected, or false on error.
	 */
	private static function delete_rows( $ids ) {
		global $wpdb;
		$table        = Consent_Log_Controller::get_table_name();
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		return $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$table} WHERE id IN ({$placeholders})",
				...array_map( 'intval', $ids )
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
	}
}
