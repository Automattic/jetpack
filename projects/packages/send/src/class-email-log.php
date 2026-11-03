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
 *
 * Nothing a GET request reaches deletes rows: only the hourly job, a lowered retention and the Log's
 * own delete routes do.
 */
class Email_Log {

	const DB_VERSION        = '4';
	const DB_VERSION_OPTION = 'jetpack_send_db_version';
	const PRUNE_HOOK        = 'jetpack_send_prune_log';
	const STATUS_SENT       = 'sent';
	const STATUS_FALLBACK   = 'fallback';
	const STATUS_FAILED     = 'failed';

	/**
	 * Transient prefix for the cached stats of one preset range; the range in days is appended.
	 *
	 * @var string
	 */
	const STATS_TRANSIENT = 'jetpack_send_stats_';

	/**
	 * The ranges GET /stats accepted before presets, in days. Their caches are cleared too.
	 *
	 * @var int[]
	 */
	const STATS_RANGES = array( 7, 30 );

	/**
	 * Bumped whenever cached stats can be stale without a new row: deletes, the prune, a moved count.
	 *
	 * @var string
	 */
	const STATS_GEN_OPTION = 'jetpack_send_stats_gen';

	/**
	 * Cursor (the last row id done) while older rows get their search columns filled; deleted when done.
	 *
	 * @var string
	 */
	const FIELDS_BACKFILL_OPTION = 'jetpack_send_fields_backfill';

	/**
	 * Larger bodies are logged without content, keeping the table small.
	 *
	 * @var int
	 */
	const MAX_BODY_BYTES = 524288;

	/**
	 * The searchable plain-text copy of a body is cut to this many bytes.
	 *
	 * @var int
	 */
	const BODY_TEXT_BYTES = 16384;

	/**
	 * Largest `detail` kept, JSON-encoded.
	 *
	 * @var int
	 */
	const DETAIL_BYTES = 8192;

	/**
	 * Search looks inside email text only while the other filters match this many rows or fewer.
	 *
	 * @var int
	 */
	const TEXT_SEARCH_MAX_ROWS = 20000;

	/**
	 * A search's total stops counting here.
	 *
	 * @var int
	 */
	const SEARCH_TOTAL_CAP = 1000;

	/**
	 * Shorter searches match too much to be useful, so they search nothing.
	 *
	 * @var int
	 */
	const SEARCH_MIN_CHARS = 2;

	/**
	 * Longest search.
	 *
	 * @var int
	 */
	const SEARCH_MAX_CHARS = 100;

	/**
	 * Rows deleted per query by the prune.
	 *
	 * @var int
	 */
	const PRUNE_BATCH = 1000;

	/**
	 * Older rows given their search columns per run.
	 *
	 * @var int
	 */
	const FIELDS_BATCH = 200;

	/**
	 * Most message bytes one backfill run reads, so a run of large bodies can't exhaust memory on an
	 * admin page. At least one row always moves on.
	 *
	 * @var int
	 */
	const FIELDS_BATCH_BYTES = 8388608;

	/**
	 * Set when the host refused the table changes, so the upgrade is tried again an hour later, not on
	 * every request.
	 *
	 * @var string
	 */
	const UPGRADE_RETRY_TRANSIENT = 'jetpack_send_upgrade_retry';

	/**
	 * Wire the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		// Every request, not just admin ones, so front-end emails are never dropped after an upgrade.
		// The version option is autoloaded, so the check costs no query.
		add_action( 'init', array( __CLASS__, 'maybe_install' ) );
		add_action( self::PRUNE_HOOK, array( __CLASS__, 'run_hourly' ) );
		add_action( 'admin_init', array( __CLASS__, 'ensure_scheduled' ), 10, 0 );
	}

	/**
	 * Put the hourly job back if it went missing (a cron clean-up, a site move), since it's the only
	 * thing that keeps the log within its retention after the day it was set.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function ensure_scheduled() {
		if ( self::has_v4_schema() && ! wp_next_scheduled( self::PRUNE_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', self::PRUNE_HOOK );
		}
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
	 * Whether the table exists with the columns every log read and write needs (schema 3 or later).
	 * Stays true while another request upgrades it.
	 *
	 * @return bool
	 */
	public static function is_installed() {
		return version_compare( (string) get_option( self::DB_VERSION_OPTION, '' ), '3', '>=' );
	}

	/**
	 * Whether the search and failure columns, the counts table and the debug table exist (schema 4).
	 * Every read or write of them checks this first, so newer code runs safely on an older table.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function has_v4_schema() {
		return version_compare( (string) get_option( self::DB_VERSION_OPTION, '' ), '4', '>=' );
	}

	/**
	 * Install or upgrade the table when the schema version changed.
	 *
	 * @return void
	 */
	public static function maybe_install() {
		if ( version_compare( (string) get_option( self::DB_VERSION_OPTION, '' ), self::DB_VERSION, '<' ) && ! get_transient( self::UPGRADE_RETRY_TRANSIENT ) ) {
			self::install();
		}
	}

	/**
	 * Whether the newest columns and both new tables are really there after `dbDelta()`, which doesn't
	 * report a change the host refused.
	 *
	 * @return bool
	 */
	private static function schema_ready() {
		global $wpdb;
		$suppress = $wpdb->suppress_errors();
		$columns  = (array) $wpdb->get_col( $wpdb->prepare( 'DESCRIBE %i', self::table_name() ) );
		$ready    = in_array( 'resend_of', $columns, true )
			&& array() !== (array) $wpdb->get_col( $wpdb->prepare( 'DESCRIBE %i', Stats::table_name() ) )
			&& array() !== (array) $wpdb->get_col( $wpdb->prepare( 'DESCRIBE %i', Debug_Log::table_name() ) );
		$wpdb->suppress_errors( $suppress );
		return $ready;
	}

	/**
	 * Create or upgrade the tables, under a lock. Every step adds; nothing is dropped or deleted.
	 *
	 * @return void
	 */
	public static function install() {
		global $wpdb;
		// Another request is upgrading; this one carries on with the stored version.
		if ( ! Lock::acquire( 'upgrade', 5 * MINUTE_IN_SECONDS ) ) {
			return;
		}

		try {
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			$previous = (string) get_option( self::DB_VERSION_OPTION, '' );
			$table    = self::table_name();
			$charset  = $wpdb->get_charset_collate();
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
					origin varchar(100) NOT NULL DEFAULT '',
					message longtext NULL,
					from_email varchar(255) NOT NULL DEFAULT '',
					other_addresses varchar(1000) NOT NULL DEFAULT '',
					body_text text NULL,
					reason varchar(32) NOT NULL DEFAULT '',
					detail text NULL,
					resend_of bigint(20) unsigned NOT NULL DEFAULT 0,
					user_id bigint(20) unsigned NOT NULL DEFAULT 0,
					PRIMARY KEY  (id),
					KEY created_at (created_at),
					KEY created_status (created_at,status),
					KEY status_created (status,created_at),
					KEY origin_created (origin,created_at),
					KEY reason_created (reason,created_at),
					KEY resend_of (resend_of)
				) {$charset};"
			);
			dbDelta( Stats::schema( $charset ) );
			dbDelta( Debug_Log::schema( $charset ) );

			// A host that refused a change keeps the version it had, so newer code stays off the
			// missing columns and every email is still logged; it's tried again in an hour.
			if ( ! self::schema_ready() ) {
				set_transient( self::UPGRADE_RETRY_TRANSIENT, 1, HOUR_IN_SECONDS );
				return;
			}

			// Sites that already had a log keep the 30 days it kept before the setting existed. Read the raw
			// option: Settings::get() merges in the new default, which would hide a missing key.
			if ( in_array( $previous, array( '1', '2', '3' ), true ) && ! array_key_exists( 'log_retention_days', Settings::stored() ) ) {
				Settings::update( array( 'log_retention_days' => 30 ) );
			}
			Stats::start_backfill( self::max_id_raw() );
			update_option( self::FIELDS_BACKFILL_OPTION, 0, false );

			wp_clear_scheduled_hook( self::PRUNE_HOOK );
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', self::PRUNE_HOOK );
			self::clear_stats_cache();
			update_option( self::DB_VERSION_OPTION, self::DB_VERSION, true );
		} finally {
			Lock::release( 'upgrade' );
		}

		// One batch now, so a log of up to 5,000 emails is counted in this request.
		Stats::backfill_batch( 0 );
	}

	/**
	 * Insert a row; a no-op until the table is installed.
	 *
	 * @param array $row status, recipients, subject, error, request_id, source, origin, message (array|null),
	 *                   and from schema 4 reason, detail (array), resend_of, user_id. `created_at` (Unix time) defaults to now.
	 * @return int|false The new row's id, or false when nothing was stored.
	 */
	public static function insert( array $row ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return false;
		}

		$columns               = self::columns( $row + array( 'source' => 'wp_mail' ) );
		$columns['created_at'] = gmdate( 'Y-m-d H:i:s', isset( $row['created_at'] ) && is_int( $row['created_at'] ) ? $row['created_at'] : time() );
		if ( ! $wpdb->insert( self::table_name(), $columns, self::formats( $columns ) ) ) {
			return false;
		}
		$id = (int) $wpdb->insert_id;
		return $id > 0 ? $id : false;
	}

	/**
	 * Change the given columns of a row, e.g. once a reserved row's email has been sent.
	 *
	 * @param int   $id  Row ID.
	 * @param array $row Columns to change, as for insert().
	 * @return bool Whether the update ran.
	 */
	public static function update( $id, array $row ) {
		global $wpdb;
		if ( ! self::is_installed() || $id < 1 ) {
			return false;
		}

		$columns = self::columns( $row );
		if ( array() === $columns ) {
			return false;
		}
		return false !== $wpdb->update( self::table_name(), $columns, array( 'id' => (int) $id ), self::formats( $columns ), array( '%d' ) );
	}

	/**
	 * Formats for the columns: numbers for ids, text for the rest.
	 *
	 * @param array $columns Column values.
	 * @return string[]
	 */
	private static function formats( array $columns ) {
		return array_map( fn( $key ) => in_array( $key, array( 'resend_of', 'user_id' ), true ) ? '%d' : '%s', array_keys( $columns ) );
	}

	/**
	 * Clean and truncate the given row keys into column values.
	 *
	 * @param array $row Keys from insert().
	 * @return array<string, string|int|null>
	 */
	private static function columns( array $row ) {
		// Invalid UTF-8 makes wpdb refuse the whole row, losing the log entry.
		$text    = fn( $key ) => (string) wp_check_invalid_utf8( (string) $row[ $key ], true );
		$limits  = array(
			'recipients' => 1000,
			'subject'    => 255,
			'status'     => 20,
			'error'      => 0,
			'request_id' => 64,
			'source'     => 20,
			'origin'     => 100,
		);
		$columns = array();
		foreach ( $limits as $key => $limit ) {
			if ( array_key_exists( $key, $row ) ) {
				$columns[ $key ] = $limit ? mb_substr( $text( $key ), 0, $limit ) : $text( $key );
			}
		}
		// The service sometimes repeats what it was sent, a key included.
		if ( isset( $columns['error'] ) ) {
			$columns['error'] = Debug_Log::remove_secrets( $columns['error'] );
		}
		$message = null;
		if ( array_key_exists( 'message', $row ) ) {
			$message            = empty( $row['message'] ) || ! is_array( $row['message'] ) ? null : self::strip_sign_in_links( $row['message'] );
			$encoded            = null === $message ? false : wp_json_encode( $message, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
			$columns['message'] = false === $encoded ? null : $encoded;
		}
		if ( ! self::has_v4_schema() ) {
			return $columns;
		}

		if ( array_key_exists( 'message', $row ) ) {
			$columns = array_merge( $columns, self::search_fields( $message ) );
		}
		if ( array_key_exists( 'reason', $row ) ) {
			$columns['reason'] = substr( (string) preg_replace( '/[^a-z_]/', '', (string) $row['reason'] ), 0, 32 );
		}
		if ( array_key_exists( 'detail', $row ) ) {
			$columns['detail'] = is_array( $row['detail'] ) ? self::encode_detail( Debug_Log::remove_secrets( $row['detail'] ) ) : null;
		}
		foreach ( array( 'resend_of', 'user_id' ) as $key ) {
			if ( array_key_exists( $key, $row ) ) {
				$columns[ $key ] = max( 0, (int) $row[ $key ] );
			}
		}
		return $columns;
	}

	/**
	 * The search columns for a stored message: the From address, the other addresses, and the text.
	 *
	 * @param array|null $message Decoded message, sign-in links already stripped.
	 * @return array{from_email: string, other_addresses: string, body_text: string|null}
	 */
	private static function search_fields( $message ) {
		$message = is_array( $message ) ? $message : array();
		$others  = array();
		foreach ( array( 'cc', 'bcc' ) as $key ) {
			foreach ( (array) ( $message[ $key ] ?? array() ) as $address ) {
				$others[] = is_array( $address ) ? (string) ( $address['email'] ?? '' ) : '';
			}
		}
		$others[] = is_array( $message['reply_to'] ?? null ) ? (string) ( $message['reply_to']['email'] ?? '' ) : '';
		$body     = $message['body'] ?? null;
		return array(
			'from_email'      => is_array( $message['from'] ?? null ) ? substr( (string) ( $message['from']['email'] ?? '' ), 0, 255 ) : '',
			'other_addresses' => mb_substr( implode( ',', array_filter( $others ) ), 0, 1000 ),
			'body_text'       => is_string( $body ) ? self::cut_bytes( (string) wp_check_invalid_utf8( Message_Builder::plain_text( $body, (string) ( $message['content_type'] ?? 'text/plain' ) ), true ), self::BODY_TEXT_BYTES ) : null,
		);
	}

	/**
	 * Cut text to a number of bytes without splitting a character, which would make wpdb drop the row.
	 *
	 * @param string $text  Text.
	 * @param int    $bytes Most bytes.
	 * @return string
	 */
	private static function cut_bytes( $text, $bytes ) {
		if ( strlen( $text ) <= $bytes ) {
			return $text;
		}
		if ( function_exists( 'mb_strcut' ) ) {
			return mb_strcut( $text, 0, $bytes, 'UTF-8' );
		}
		return (string) preg_replace( '/[\xC0-\xFF][\x80-\xBF]*$/', '', substr( $text, 0, $bytes ) );
	}

	/**
	 * Encode a detail, shortening it to fit DETAIL_BYTES.
	 *
	 * @param array $detail Detail.
	 * @return string|null
	 */
	private static function encode_detail( array $detail ) {
		$encode  = fn( $value ) => wp_json_encode( $value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		$encoded = $encode( Failure_Reason::cap( $detail ) );
		if ( false !== $encoded && strlen( $encoded ) > self::DETAIL_BYTES ) {
			unset( $detail['service_errors'] );
			$encoded = $encode( map_deep( $detail, fn( $value ) => is_string( $value ) && mb_strlen( $value ) > 100 ? mb_substr( $value, 0, 99 ) . '…' : $value ) );
		}
		return false === $encoded || strlen( $encoded ) > self::DETAIL_BYTES ? null : $encoded;
	}

	/**
	 * The stored copy of a message with sign-in links stripped, marked `redacted` when any were.
	 *
	 * @param array $message Message.
	 * @return array
	 */
	private static function strip_sign_in_links( array $message ) {
		if ( ! is_string( $message['body'] ?? null ) ) {
			return $message;
		}
		$body = self::redact_body( $message['body'] );
		if ( null === $body ) {
			// Couldn't check it: keep the body, and let it go only to the same people or the sender.
			$message['locked'] = true;
		} elseif ( $body !== $message['body'] ) {
			$message['body']     = $body;
			$message['redacted'] = true;
		}
		return $message;
	}

	/**
	 * Remove the secret part of sign-in links from a stored body; the email that goes out is untouched.
	 * Kept narrow on purpose, so links like a store's order page still work in a resend.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $body Body.
	 * @return string
	 */
	public static function redact_links( $body ) {
		$redacted = self::redact_body( (string) $body );
		return null === $redacted ? (string) $body : $redacted;
	}

	/**
	 * The body with sign-in links stripped, or null when a pattern couldn't run on it (a backtrack or
	 * memory limit), so the caller can keep the original rather than store an empty body.
	 *
	 * @param string $body Body.
	 * @return string|null
	 */
	private static function redact_body( $body ) {
		// A link is a run of URL characters with a `?` in it. Matches start only where a run starts and
		// the part before the `?` never gives characters back, so a long run with no `?` (an inline
		// image, say) is read once, not once per character.
		$body = preg_replace_callback( '#(?<![^\s"\'<>()])[^\s"\'<>()?]*+\?[^\s"\'<>()]+#', array( __CLASS__, 'redact_link' ), (string) $body );
		if ( null === $body ) {
			return null;
		}
		// Personal data export files are reachable by anyone with the link.
		$body = preg_replace( '#(wp-content/uploads/wp-personal-data-exports/)[^\s"\'<>()?]++#i', '$1[removed]', $body );
		if ( null === $body ) {
			return null;
		}

		/**
		 * More sign-in link patterns to strip from stored emails. A pattern's first capture group is removed,
		 * or the whole match when it has none.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $patterns Regular expressions. Default none.
		 */
		foreach ( (array) apply_filters( 'jetpack_send_log_redact_patterns', array() ) as $pattern ) {
			if ( ! is_string( $pattern ) || '' === $pattern ) {
				continue;
			}
			$result = @preg_replace_callback( $pattern, fn( $match ) => isset( $match[1] ) && '' !== $match[1] ? str_replace( $match[1], '[removed]', $match[0] ) : '[removed]', $body ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- A bad pattern from a filter must not stop logging.
			if ( is_string( $result ) ) {
				$body = $result;
			}
		}
		return $body;
	}

	/**
	 * Strip the secrets from one link with a query string.
	 *
	 * @param array $match The link, as `[0]`.
	 * @return string
	 */
	private static function redact_link( array $match ) {
		$url    = $match[0];
		$params = array( 'adminhash', 'newuseremail' );
		if ( preg_match( '/wp-login\.php/i', $url ) && preg_match( '/\baction=(?:rp|resetpass)\b/i', $url ) ) {
			$params[] = 'key';
		}
		if ( preg_match( '/\baction=enter_recovery_mode\b/i', $url ) ) {
			array_push( $params, 'rm_token', 'rm_key' );
		}
		if ( preg_match( '/\baction=confirmaction\b/i', $url ) ) {
			$params[] = 'confirm_key';
		}
		if ( preg_match( '/wp-activate\.php/i', $url ) ) {
			$params[] = 'key';
		}
		// Store account set-password links: a lost-password page with a key, and a new account's link.
		if ( preg_match( '#/lost-password/?(?:\?|&)#i', $url ) || preg_match( '/\baction=newaccount\b/i', $url ) ) {
			$params[] = 'key';
		}
		foreach ( array_unique( $params ) as $param ) {
			$url = (string) preg_replace( '/((?:\?|&(?:amp;|#0?38;)?)' . preg_quote( $param, '/' ) . '=)[^&#\s"\'<>]+/i', '$1[removed]', $url );
		}
		return $url;
	}

	/**
	 * A page of rows without their message, newest first.
	 *
	 * Takes an args array: `page`, `per_page`, `search`, `status`, `origin` and `source` (lists; any of),
	 * `start_utc` and `end_utc` (UTC `Y-m-d H:i:s`, or Unix times). The older positional form still works.
	 *
	 * @param array|int $args     Args, or the 1-based page in the older form.
	 * @param int       $per_page Older form: rows per page.
	 * @param string    $status   Older form: status filter, or '' for all.
	 * @param string    $source   Older form: source filter, or '' for all.
	 * @param string    $since    Older form: UTC `Y-m-d H:i:s`; only rows at or after it. '' for any date.
	 * @return array{items: array[], total: int, searched_text: bool, total_capped: bool}
	 */
	public static function query( $args, $per_page = 20, $status = '', $source = '', $since = '' ) {
		global $wpdb;
		if ( ! is_array( $args ) ) {
			$args = array(
				'page'      => (int) $args,
				'per_page'  => (int) $per_page,
				'status'    => '' === (string) $status ? array() : array( (string) $status ),
				'source'    => '' === (string) $source ? array() : array( (string) $source ),
				'start_utc' => (string) $since,
			);
		}
		$page = array(
			'items'         => array(),
			'total'         => 0,
			'searched_text' => true,
			'total_capped'  => false,
		);
		if ( ! self::is_installed() ) {
			return $page;
		}

		$table                  = self::table_name();
		$per_page               = max( 1, (int) ( $args['per_page'] ?? 20 ) );
		$offset                 = max( 0, ( (int) ( $args['page'] ?? 1 ) - 1 ) * $per_page );
		$v4                     = self::has_v4_schema();
		$columns                = 'id, created_at, recipients, subject, status, error, request_id, source, origin' . ( $v4 ? ', from_email, reason, resend_of' : '' );
		list( $where, $values ) = self::filters( $args );
		$search                 = self::clean_search( $args['search'] ?? '' );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- `$where` and `$match` hold placeholders only, with values to match.
		if ( '' === $search ) {
			$page['items'] = $wpdb->get_results( $wpdb->prepare( "SELECT {$columns} FROM %i WHERE {$where} ORDER BY created_at DESC, id DESC LIMIT %d OFFSET %d", $table, ...array_merge( $values, array( $per_page, $offset ) ) ), ARRAY_A );
			$page['total'] = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE {$where}", $table, ...$values ) );
		} else {
			$fields = $v4 ? array( 'subject', 'recipients', 'from_email', 'other_addresses' ) : array( 'subject', 'recipients' );
			// Text is searched only while the other filters leave few enough rows to scan; the count stops early.
			$page['searched_text'] = $v4 && (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM ( SELECT 1 FROM %i WHERE {$where} LIMIT %d ) counted", $table, ...array_merge( $values, array( self::TEXT_SEARCH_MAX_ROWS + 1 ) ) ) ) <= self::TEXT_SEARCH_MAX_ROWS;
			if ( $page['searched_text'] ) {
				$fields[] = 'body_text';
			}
			$match  = '( ' . implode( ' OR ', array_map( fn( $field ) => "{$field} LIKE %s", $fields ) ) . ' )';
			$values = array_merge( $values, array_fill( 0, count( $fields ), '%' . $wpdb->esc_like( $search ) . '%' ) );

			$page['items']        = $wpdb->get_results( $wpdb->prepare( "SELECT {$columns} FROM %i WHERE {$where} AND {$match} ORDER BY created_at DESC, id DESC LIMIT %d OFFSET %d", $table, ...array_merge( $values, array( $per_page, $offset ) ) ), ARRAY_A );
			$total                = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM ( SELECT 1 FROM %i WHERE {$where} AND {$match} LIMIT %d ) counted", $table, ...array_merge( $values, array( self::SEARCH_TOTAL_CAP + 1 ) ) ) );
			$page['total_capped'] = $total > self::SEARCH_TOTAL_CAP;
			$page['total']        = min( $total, self::SEARCH_TOTAL_CAP );
		}
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		$page['items'] = is_array( $page['items'] ) ? $page['items'] : array();
		return $page;
	}

	/**
	 * The WHERE clause for the filters, which the indexes cover.
	 *
	 * @param array $args As for query().
	 * @return array{0: string, 1: array} SQL with placeholders, and their values.
	 */
	private static function filters( array $args ) {
		$where  = array( '1=1' );
		$values = array();
		foreach ( array( 'status', 'origin', 'source' ) as $column ) {
			$list = array_values( array_unique( array_filter( array_map( 'strval', (array) ( $args[ $column ] ?? array() ) ), 'strlen' ) ) );
			if ( $list ) {
				$where[] = "{$column} IN (" . implode( ',', array_fill( 0, count( $list ), '%s' ) ) . ')';
				$values  = array_merge( $values, $list );
			}
		}
		foreach ( array(
			'start_utc' => '>=',
			'end_utc'   => '<',
		) as $key => $operator ) {
			$time = $args[ $key ] ?? '';
			if ( is_int( $time ) ) {
				$time = gmdate( 'Y-m-d H:i:s', $time );
			}
			if ( '' !== (string) $time ) {
				$where[]  = "created_at {$operator} %s";
				$values[] = (string) $time;
			}
		}
		return array( implode( ' AND ', $where ), $values );
	}

	/**
	 * Search text as the Log sends it: trimmed, control characters dropped, cut to SEARCH_MAX_CHARS
	 * characters, and '' when shorter than SEARCH_MIN_CHARS. Not sanitize_text_field(): it would change "50%" or "<b>".
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $value Typed text.
	 * @return string
	 */
	public static function clean_search( $value ) {
		if ( ! is_scalar( $value ) ) {
			return '';
		}
		$text = trim( (string) preg_replace( '/[\x00-\x1F\x7F]/u', '', (string) wp_check_invalid_utf8( (string) $value, true ) ) );
		return mb_strlen( $text ) < self::SEARCH_MIN_CHARS ? '' : mb_substr( $text, 0, self::SEARCH_MAX_CHARS );
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
	 * When an email was logged and how it went, or null when it's no longer in the log.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $id Row id.
	 * @return array{created_at: string, status: string}|null UTC `Y-m-d H:i:s` and the status.
	 */
	public static function brief_of( $id ) {
		global $wpdb;
		if ( ! self::is_installed() || (int) $id < 1 ) {
			return null;
		}
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT created_at, status FROM %i WHERE id = %d', self::table_name(), $id ), ARRAY_A );
		return is_array( $row ) && is_string( $row['created_at'] ?? null ) && '' !== $row['created_at']
			? array(
				'created_at' => $row['created_at'],
				'status'     => (string) ( $row['status'] ?? '' ),
			)
			: null;
	}

	/**
	 * The copies of an email sent again from the Log, newest first.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $id    The original's row id.
	 * @param int $limit Most copies listed.
	 * @return array{items: array[], total: int} `items` hold id, status and created_at.
	 */
	public static function resends_of( $id, $limit = 20 ) {
		global $wpdb;
		if ( ! self::has_v4_schema() || (int) $id < 1 ) {
			return array(
				'items' => array(),
				'total' => 0,
			);
		}
		$table = self::table_name();
		$items = $wpdb->get_results( $wpdb->prepare( 'SELECT id, status, created_at FROM %i WHERE resend_of = %d ORDER BY id DESC LIMIT %d', $table, $id, $limit ), ARRAY_A );
		$total = $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE resend_of = %d', $table, $id ) );
		return array(
			'items' => is_array( $items ) ? $items : array(),
			'total' => (int) $total,
		);
	}

	/**
	 * Origins still in the log, most first.
	 *
	 * @since $$next-version$$
	 *
	 * @return array<int, array{origin: string, n: string}>
	 */
	public static function origins_in_log() {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return array();
		}
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT origin, COUNT(*) AS n FROM %i WHERE origin <> '' GROUP BY origin ORDER BY n DESC", self::table_name() ), ARRAY_A );
		return is_array( $rows ) ? $rows : array();
	}

	/**
	 * How many emails the log holds, the oldest one, and how many each retention choice would delete,
	 * with the same rolling cutoff the prune uses.
	 *
	 * @since $$next-version$$
	 *
	 * @param int|null $now Unix time; defaults to now.
	 * @return array{total: int, oldest_at: string|null, older_than: array<string, int>}
	 */
	public static function summary( $now = null ) {
		global $wpdb;
		$now     = null === $now ? time() : (int) $now;
		$choices = array_values( array_filter( Settings::RETENTION_DAYS ) );
		$summary = array(
			'total'      => 0,
			'oldest_at'  => null,
			'older_than' => array_fill_keys( array_map( 'strval', $choices ), 0 ),
		);
		if ( ! self::is_installed() ) {
			return $summary;
		}

		$sums   = implode( ', ', array_map( fn( $days ) => "SUM( CASE WHEN created_at < %s THEN 1 ELSE 0 END ) AS d{$days}", $choices ) );
		$values = array_map( fn( $days ) => gmdate( 'Y-m-d H:i:s', $now - $days * DAY_IN_SECONDS ), $choices );
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- `$sums` holds one placeholder per choice.
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT COUNT(*) AS total, MIN(created_at) AS oldest, {$sums} FROM %i", ...array_merge( $values, array( self::table_name() ) ) ), ARRAY_A );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		if ( ! is_array( $row ) ) {
			return $summary;
		}
		$summary['total']     = (int) ( $row['total'] ?? 0 );
		$summary['oldest_at'] = empty( $row['oldest'] ) ? null : self::iso( (string) $row['oldest'] );
		foreach ( $choices as $days ) {
			$summary['older_than'][ (string) $days ] = (int) ( $row[ 'd' . $days ] ?? 0 );
		}
		return $summary;
	}

	/**
	 * When the oldest row was logged.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null UTC `Y-m-d H:i:s`, or null when the log is empty.
	 */
	public static function oldest_created_at() {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return null;
		}
		$value = $wpdb->get_var( $wpdb->prepare( 'SELECT MIN(created_at) FROM %i', self::table_name() ) );
		return is_string( $value ) && '' !== $value ? $value : null;
	}

	/**
	 * Failed and host-sent site emails and resends still in the log in a window.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $start_utc First second, Unix time.
	 * @param int $end_utc   Second after the last one.
	 * @return array{failed_in_log: int, fallback_in_log: int}
	 */
	public static function attention( $start_utc, $end_utc ) {
		global $wpdb;
		$counts = array(
			'failed_in_log'   => 0,
			'fallback_in_log' => 0,
		);
		if ( ! self::is_installed() ) {
			return $counts;
		}
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT SUM( CASE WHEN status = 'failed' THEN 1 ELSE 0 END ) AS failed, SUM( CASE WHEN status = 'fallback' THEN 1 ELSE 0 END ) AS fallback FROM %i WHERE created_at >= %s AND created_at < %s AND source IN ( 'wp_mail', 'resend' ) AND status IN ( 'failed', 'fallback' )", self::table_name(), gmdate( 'Y-m-d H:i:s', (int) $start_utc ), gmdate( 'Y-m-d H:i:s', (int) $end_utc ) ), ARRAY_A );
		if ( is_array( $row ) ) {
			$counts['failed_in_log']   = (int) ( $row['failed'] ?? 0 );
			$counts['fallback_in_log'] = (int) ( $row['fallback'] ?? 0 );
		}
		return $counts;
	}

	/**
	 * Delete rows by id, for good. Nothing else changes: the onboarding state, the hourly test limit and
	 * the dashboard's counts live outside the log, so deleting a row reopens nothing and lowers no number.
	 *
	 * @param int[] $ids Row IDs; duplicates and anything below 1 are ignored.
	 * @return array{deleted: int[], missing: int[]} The ids that were removed, and the ones that weren't there.
	 */
	public static function delete( array $ids ) {
		global $wpdb;
		$ids = array_values( array_unique( array_filter( array_map( 'intval', $ids ), fn( $id ) => $id > 0 ) ) );
		if ( ! self::is_installed() || array() === $ids ) {
			return array(
				'deleted' => array(),
				'missing' => $ids,
			);
		}

		$in    = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		$table = self::table_name();
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- `$in` is one `%d` per id.
		$found = array_map( 'intval', (array) $wpdb->get_col( $wpdb->prepare( "SELECT id FROM %i WHERE id IN ($in)", $table, ...$ids ) ) );
		if ( array() !== $found ) {
			$wpdb->query( $wpdb->prepare( "DELETE FROM %i WHERE id IN ($in)", $table, ...$ids ) );
		}
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		// The cached stats only notice a new newest row, and the attention notice counts rows still in the log.
		self::clear_stats_cache();

		$deleted = array_values( array_intersect( $ids, $found ) );
		if ( $deleted ) {
			/* translators: %d: how many emails. */
			Debug_Log::add( 'info', 'cleanup', 'log.deleted', sprintf( _n( 'Deleted %d email from the log.', 'Deleted %d emails from the log.', count( $deleted ), 'jetpack-send-pkg' ), count( $deleted ) ), array( 'count' => count( $deleted ) ) );
		}
		return array(
			'deleted' => $deleted,
			'missing' => array_values( array_diff( $ids, $deleted ) ),
		);
	}

	/**
	 * How many days the log keeps rows: the setting, unless the site's code sets it.
	 *
	 * @return int Days; 0 when rows are kept for good.
	 */
	public static function retention_days() {
		$days = self::retention_setting();

		/**
		 * Days to keep Send log rows. Overrides the Email log setting, which then can't be changed.
		 *
		 * @since $$next-version$$
		 *
		 * @param int $days Retention in days from the setting; 0 keeps rows for good. Default 7.
		 */
		return max( 0, (int) apply_filters( 'jetpack_send_log_retention_days', $days ) );
	}

	/**
	 * The Email log setting's days, before the site's code has its say.
	 *
	 * @since $$next-version$$
	 *
	 * @return int Days; 0 keeps rows for good.
	 */
	public static function retention_setting() {
		$stored = Settings::stored();
		if ( array_key_exists( 'log_retention_days', $stored ) ) {
			return (int) $stored['log_retention_days'];
		}
		// A log from before the setting kept 30 days, until the upgrade writes that down.
		return self::is_installed() && ! self::has_v4_schema() ? 30 : (int) Settings::get()['log_retention_days'];
	}

	/**
	 * Whether the site's code sets the retention, so the setting can't change it.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function retention_locked() {
		return false !== has_filter( 'jetpack_send_log_retention_days' );
	}

	/**
	 * Delete rows older than the retention window, in batches, until done or the time runs out.
	 * Rows the counts backfill hasn't reached stay, so no email drops out of the dashboard.
	 *
	 * @param int $budget_seconds Time to spend.
	 * @return array{deleted: int, remaining: int}
	 */
	public static function prune( $budget_seconds = 10 ) {
		global $wpdb;
		$result = array(
			'deleted'   => 0,
			'remaining' => 0,
		);
		$days   = self::retention_days();
		if ( ! self::is_installed() || $days < 1 ) {
			return $result;
		}

		$table   = self::table_name();
		$cutoff  = gmdate( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS );
		$state   = Stats::backfill_state();
		$counted = null === $state || $state['done'] ? '' : $wpdb->prepare( ' AND ( id <= %d OR id > %d )', $state['cursor'], $state['until_id'] );
		$started = microtime( true );
		$full    = false;
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- `$counted` is already prepared; `$in` is one `%d` per id.
		do {
			$ids = array_map( 'intval', (array) $wpdb->get_col( $wpdb->prepare( "SELECT id FROM %i WHERE created_at < %s{$counted} ORDER BY id LIMIT %d", $table, $cutoff, self::PRUNE_BATCH ) ) );
			if ( array() === $ids ) {
				break;
			}
			$in = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
			$wpdb->query( $wpdb->prepare( "DELETE FROM %i WHERE id IN ($in)", $table, ...$ids ) );
			$result['deleted'] += count( $ids );
			$full               = count( $ids ) === self::PRUNE_BATCH;
		} while ( $full && microtime( true ) - $started < $budget_seconds );
		if ( $full ) {
			$result['remaining'] = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE created_at < %s{$counted}", $table, $cutoff ) );
		}
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		if ( $result['deleted'] > 0 ) {
			self::clear_stats_cache();
			/* translators: %d: a number of days. */
			$length = sprintf( _n( '%d day', '%d days', $days, 'jetpack-send-pkg' ), $days );
			Debug_Log::add(
				'info',
				'cleanup',
				'log.pruned',
				/* translators: 1: how many emails, 2: how long the log keeps them, e.g. "7 days". */
				sprintf( _n( 'Deleted %1$d email older than %2$s.', 'Deleted %1$d emails older than %2$s.', $result['deleted'], 'jetpack-send-pkg' ), $result['deleted'], $length ),
				$result + array( 'days' => $days )
			);
		}
		return $result;
	}

	/**
	 * The hourly job: count older emails, then prune the log, the counts and the debug log.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function run_hourly() {
		Stats::backfill_batch();
		self::backfill_batch();
		self::prune( 10 );
		Stats::prune();
		Debug_Log::expire_if_due();
		Debug_Log::prune();
	}

	/**
	 * Fill the search columns of rows logged before they existed, a batch at a time. Only fills;
	 * restarting it is harmless. Runs on admin pages and the hourly job, never on the front end.
	 *
	 * @since $$next-version$$
	 *
	 * @param float $budget_seconds Time to spend.
	 * @return bool Whether every older row is done.
	 */
	public static function backfill_batch( $budget_seconds = 2.0 ) {
		global $wpdb;
		$cursor = get_option( self::FIELDS_BACKFILL_OPTION, false );
		if ( false === $cursor || ! self::has_v4_schema() ) {
			return true;
		}

		$state   = Stats::backfill_state();
		$until   = null === $state ? self::max_id() : $state['until_id'];
		$table   = self::table_name();
		$cursor  = (int) $cursor;
		$started = microtime( true );
		// Sizes first, so one run reads at most FIELDS_BATCH_BYTES of bodies, and always at least one row.
		$sizes = (array) $wpdb->get_results( $wpdb->prepare( 'SELECT id, LENGTH(message) AS bytes FROM %i WHERE id > %d AND id <= %d ORDER BY id LIMIT %d', $table, $cursor, $until, self::FIELDS_BATCH ), ARRAY_A );
		$take  = 0;
		$bytes = 0;
		foreach ( $sizes as $size ) {
			$bytes += (int) ( $size['bytes'] ?? 0 );
			if ( $take > 0 && $bytes > self::FIELDS_BATCH_BYTES ) {
				break;
			}
			++$take;
		}
		$rows = $take > 0 ? (array) $wpdb->get_results( $wpdb->prepare( 'SELECT id, message FROM %i WHERE id > %d AND id <= %d ORDER BY id LIMIT %d', $table, $cursor, $until, $take ), ARRAY_A ) : array();
		foreach ( $rows as $row ) {
			$message  = is_string( $row['message'] ) ? json_decode( $row['message'], true ) : null;
			$stripped = is_array( $message ) ? self::strip_sign_in_links( $message ) : null;
			$fields   = self::search_fields( $stripped );
			$formats  = array( '%s', '%s', '%s' );
			// Older rows kept sign-in links in their stored copy; the copy loses them too, as new rows do.
			if ( is_array( $stripped ) && $stripped !== $message ) {
				$encoded = wp_json_encode( $stripped, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
				if ( false !== $encoded ) {
					$fields['message'] = $encoded;
					$formats[]         = '%s';
				}
			}
			$wpdb->update( $table, $fields, array( 'id' => (int) $row['id'] ), $formats, array( '%d' ) );
			$cursor = (int) $row['id'];
			if ( microtime( true ) - $started > $budget_seconds ) {
				break;
			}
		}

		$done = count( $sizes ) < self::FIELDS_BATCH && count( $rows ) === count( $sizes ) && ( array() === $rows || (int) end( $rows )['id'] === $cursor );
		if ( $done ) {
			delete_option( self::FIELDS_BACKFILL_OPTION );
		} else {
			update_option( self::FIELDS_BACKFILL_OPTION, $cursor, false );
		}
		return $done;
	}

	/**
	 * Emails handed to the mail service since a UTC time: every sent row, tests included, since
	 * tests use the plan's sends too.
	 *
	 * @param string $since_utc UTC `Y-m-d H:i:s`.
	 * @return array{emails: int, tests: int}
	 */
	public static function sent_counts( $since_utc ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return array(
				'emails' => 0,
				'tests'  => 0,
			);
		}
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT COUNT(*) AS emails, SUM( CASE WHEN source = 'test' THEN 1 ELSE 0 END ) AS tests FROM %i WHERE created_at >= %s AND status = %s", self::table_name(), $since_utc, self::STATUS_SENT ), ARRAY_A );
		return array(
			'emails' => (int) ( $row['emails'] ?? 0 ),
			'tests'  => (int) ( $row['tests'] ?? 0 ),
		);
	}

	/**
	 * Non-test emails per site-local day and status since a UTC time.
	 *
	 * @param string $since_utc UTC `Y-m-d H:i:s`; rows at or after it count.
	 * @param int    $offset    Site timezone offset from UTC, in seconds.
	 * @return array<int, array{d: string, status: string, n: string}>
	 */
	public static function stats( $since_utc, $offset ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return array();
		}
		// A negative INTERVAL comes back NULL under the SQLite integration, so shift west with DATE_SUB.
		$sql  = (int) $offset >= 0
			? "SELECT DATE(DATE_ADD(created_at, INTERVAL %d SECOND)) AS d, status, COUNT(*) AS n FROM %i WHERE created_at >= %s AND source <> 'test' GROUP BY d, status"
			: "SELECT DATE(DATE_SUB(created_at, INTERVAL %d SECOND)) AS d, status, COUNT(*) AS n FROM %i WHERE created_at >= %s AND source <> 'test' GROUP BY d, status";
		$rows = $wpdb->get_results( $wpdb->prepare( $sql, abs( (int) $offset ), self::table_name(), $since_utc ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $sql is one of the two literals above.
		return is_array( $rows ) ? $rows : array();
	}

	/**
	 * Test emails since a UTC time.
	 *
	 * @param string $since_utc UTC `Y-m-d H:i:s`.
	 * @return int
	 */
	public static function test_count( $since_utc ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return 0;
		}
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE created_at >= %s AND source = 'test'", self::table_name(), $since_utc ) );
	}

	/**
	 * Non-test emails per origin since a UTC time, most first. Rows logged before origins existed are left out.
	 *
	 * @param string $since_utc UTC `Y-m-d H:i:s`.
	 * @return array<int, array{origin: string, n: string}>
	 */
	public static function origins( $since_utc ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return array();
		}
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT origin, COUNT(*) AS n FROM %i WHERE created_at >= %s AND source <> 'test' AND origin <> '' GROUP BY origin ORDER BY n DESC", self::table_name(), $since_utc ), ARRAY_A );
		return is_array( $rows ) ? $rows : array();
	}

	/**
	 * The newest row's id, 0 when the table is empty: a cheap way to tell whether anything was logged.
	 *
	 * @return int
	 */
	public static function max_id() {
		if ( ! self::is_installed() ) {
			return 0;
		}
		return self::max_id_raw();
	}

	/**
	 * The newest row's id, whatever the stored version: the upgrade reads it before storing its own.
	 *
	 * @return int
	 */
	private static function max_id_raw() {
		global $wpdb;
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT MAX(id) FROM %i', self::table_name() ) );
	}

	/**
	 * When the newest non-test email was logged.
	 *
	 * @return string|null UTC `Y-m-d H:i:s`, or null when there is none.
	 */
	public static function last_email_at() {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return null;
		}
		$value = $wpdb->get_var( $wpdb->prepare( "SELECT MAX(created_at) FROM %i WHERE source <> 'test'", self::table_name() ) );
		return is_string( $value ) && '' !== $value ? $value : null;
	}

	/**
	 * Whether the log holds any email the site sent (tests don't count). Stops at the first one.
	 *
	 * @return bool
	 */
	public static function has_history() {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return false;
		}
		return null !== $wpdb->get_var( $wpdb->prepare( "SELECT 1 FROM %i WHERE source <> 'test' LIMIT 1", self::table_name() ) );
	}

	/**
	 * A user's display name for the Log and the debug log.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $user_id User id; 0 for automatic work.
	 * @return string '' for 0, and "a former user" once the account is gone.
	 */
	public static function user_name( $user_id ) {
		if ( (int) $user_id < 1 ) {
			return '';
		}
		$user = get_userdata( (int) $user_id );
		if ( ! $user ) {
			return __( 'a former user', 'jetpack-send-pkg' );
		}
		return '' !== (string) $user->display_name ? (string) $user->display_name : (string) $user->user_login;
	}

	/**
	 * A stored UTC time as ISO 8601.
	 *
	 * @param string $utc UTC `Y-m-d H:i:s`.
	 * @return string
	 */
	public static function iso( $utc ) {
		return gmdate( 'Y-m-d\\TH:i:s\\Z', (int) strtotime( $utc . ' UTC' ) );
	}

	/**
	 * The cached stats' generation; cached stats from another one aren't used.
	 *
	 * @since $$next-version$$
	 *
	 * @return int
	 */
	public static function stats_gen() {
		return (int) get_option( self::STATS_GEN_OPTION, 0 );
	}

	/**
	 * Forget the cached stats for every range.
	 *
	 * @return void
	 */
	public static function clear_stats_cache() {
		update_option( self::STATS_GEN_OPTION, self::stats_gen() + 1, false );
		foreach ( array_unique( array_merge( self::STATS_RANGES, Period::PRESETS ) ) as $range ) {
			delete_transient( self::STATS_TRANSIENT . $range );
		}
	}

	/**
	 * Drop the log, counts and debug tables and every option they use (uninstall).
	 *
	 * @return void
	 */
	public static function drop_table() {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', self::table_name() ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange -- Uninstall.
		Stats::drop();
		Debug_Log::drop();
		wp_clear_scheduled_hook( self::PRUNE_HOOK );
		self::clear_stats_cache();
		foreach ( array( self::DB_VERSION_OPTION, self::FIELDS_BACKFILL_OPTION, self::STATS_GEN_OPTION, Resend::TIMES_OPTION ) as $option ) {
			delete_option( $option );
		}
		delete_transient( self::UPGRADE_RETRY_TRANSIENT );
		Lock::delete_all();
	}
}
