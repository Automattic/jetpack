<?php
/**
 * Email log table.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- A custom log table; nothing to cache.

/**
 * Stores one row per email Send handled, with its content for previewing unless filtered out.
 */
class Email_Log {

	const DB_VERSION        = '2';
	const DB_VERSION_OPTION = 'jetpack_send_db_version';
	const PRUNE_HOOK        = 'jetpack_send_prune_log';
	const STATUS_SENT       = 'sent';
	const STATUS_FALLBACK   = 'fallback';
	const STATUS_FAILED     = 'failed';

	/**
	 * Larger bodies are logged without content, keeping the table small.
	 *
	 * @var int
	 */
	const MAX_BODY_BYTES = 524288;

	/**
	 * Wire the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		// Packages get no activation hook, and sending can't be enabled without visiting the admin.
		add_action( 'admin_init', array( __CLASS__, 'maybe_install' ) );
		add_action( self::PRUNE_HOOK, array( __CLASS__, 'prune' ) );
	}

	/**
	 * Table name.
	 *
	 * @return string
	 */
	public static function table_name() {
		global $wpdb;
		return $wpdb->prefix . 'jetpack_send_log';
	}

	/**
	 * Whether the table exists at the current schema.
	 *
	 * @return bool
	 */
	public static function is_installed() {
		return self::DB_VERSION === get_option( self::DB_VERSION_OPTION );
	}

	/**
	 * Install or upgrade the table when the schema version changed.
	 *
	 * @return void
	 */
	public static function maybe_install() {
		if ( ! self::is_installed() ) {
			self::install();
		}
	}

	/**
	 * Create or upgrade the table and schedule pruning.
	 *
	 * @return void
	 */
	public static function install() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table_name();
		$charset = $wpdb->get_charset_collate();
		dbDelta(
			"CREATE TABLE {$table} (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				created_at datetime NOT NULL,
				recipients varchar(1000) NOT NULL DEFAULT '',
				subject varchar(255) NOT NULL DEFAULT '',
				status varchar(20) NOT NULL,
				error text NULL,
				request_id varchar(64) NOT NULL DEFAULT '',
				source varchar(20) NOT NULL DEFAULT 'wp_mail',
				message longtext NULL,
				PRIMARY KEY  (id),
				KEY created_at (created_at)
			) {$charset};"
		);

		update_option( self::DB_VERSION_OPTION, self::DB_VERSION, false );
		if ( ! wp_next_scheduled( self::PRUNE_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::PRUNE_HOOK );
		}
	}

	/**
	 * Insert a row; a no-op until the table is installed.
	 *
	 * @param array $row status, recipients, subject, error, request_id, source, and message (array|null).
	 * @return bool
	 */
	public static function insert( array $row ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return false;
		}

		// Invalid UTF-8 makes wpdb refuse the whole row, losing the log entry.
		$text    = fn( $key, $default = '' ) => (string) wp_check_invalid_utf8( (string) ( $row[ $key ] ?? $default ), true );
		$message = empty( $row['message'] ) ? false : wp_json_encode( $row['message'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

		return (bool) $wpdb->insert(
			self::table_name(),
			array(
				'created_at' => gmdate( 'Y-m-d H:i:s' ),
				'recipients' => mb_substr( $text( 'recipients' ), 0, 1000 ),
				'subject'    => mb_substr( $text( 'subject' ), 0, 255 ),
				'status'     => $text( 'status' ),
				'error'      => $text( 'error' ),
				'request_id' => substr( $text( 'request_id' ), 0, 64 ),
				'source'     => $text( 'source', 'wp_mail' ),
				'message'    => false === $message ? null : $message,
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
	}

	/**
	 * A page of rows without their message, newest first.
	 *
	 * @param int    $page     1-based page.
	 * @param int    $per_page Rows per page.
	 * @param string $status   Status filter, or '' for all.
	 * @return array{items: array[], total: int}
	 */
	public static function query( $page, $per_page, $status = '' ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return array(
				'items' => array(),
				'total' => 0,
			);
		}

		$table  = self::table_name();
		$offset = max( 0, ( $page - 1 ) * $per_page );
		if ( '' !== $status ) {
			$items = $wpdb->get_results( $wpdb->prepare( 'SELECT id, created_at, recipients, subject, status, error, request_id, source FROM %i WHERE status = %s ORDER BY id DESC LIMIT %d OFFSET %d', $table, $status, $per_page, $offset ), ARRAY_A );
			$total = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE status = %s', $table, $status ) );
		} else {
			$items = $wpdb->get_results( $wpdb->prepare( 'SELECT id, created_at, recipients, subject, status, error, request_id, source FROM %i ORDER BY id DESC LIMIT %d OFFSET %d', $table, $per_page, $offset ), ARRAY_A );
			$total = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', $table ) );
		}

		return array(
			'items' => is_array( $items ) ? $items : array(),
			'total' => (int) $total,
		);
	}

	/**
	 * One row with its decoded message, which is null when none was kept.
	 *
	 * @param int $id Row ID.
	 * @return array|null Null when the row doesn't exist.
	 */
	public static function get( $id ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return null;
		}

		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', self::table_name(), $id ), ARRAY_A );
		if ( ! is_array( $row ) ) {
			return null;
		}

		$message        = is_string( $row['message'] ) ? json_decode( $row['message'], true ) : null;
		$row['message'] = is_array( $message ) ? $message : null;
		return $row;
	}

	/**
	 * Delete rows older than the retention window.
	 *
	 * @return void
	 */
	public static function prune() {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return;
		}

		/**
		 * Days to keep Send log rows.
		 *
		 * @since $$next-version$$
		 *
		 * @param int $days Retention in days. Default 30.
		 */
		$days = (int) apply_filters( 'jetpack_send_log_retention_days', 30 );
		if ( $days < 1 ) {
			return;
		}

		$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE created_at < %s', self::table_name(), gmdate( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS ) ) );
	}

	/**
	 * Drop the table and its bookkeeping.
	 *
	 * @return void
	 */
	public static function drop_table() {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', self::table_name() ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange -- Uninstall.
		delete_option( self::DB_VERSION_OPTION );
		wp_clear_scheduled_hook( self::PRUNE_HOOK );
	}
}
