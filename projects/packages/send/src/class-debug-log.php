<?php
/**
 * The debug log: each step Send takes, while it's turned on.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- A custom table, read only by its own screen.

/**
 * Off by default, records only while on, and turns itself off. Everything is redacted on the way in:
 * no keys, tokens, bodies, subjects, full addresses or server paths ever reach the table.
 */
class Debug_Log {

	/**
	 * Most entries kept, newest first; the hourly job enforces it.
	 *
	 * @var int
	 */
	const MAX_ROWS = 20000;

	/**
	 * Largest context, JSON-encoded.
	 *
	 * @var int
	 */
	const CONTEXT_BYTES = 4096;

	/**
	 * Longest string kept.
	 *
	 * @var int
	 */
	const STRING_CHARS = 500;

	/**
	 * Longest string kept from a safe key of the service's answer.
	 *
	 * @var int
	 */
	const SERVICE_CHARS = 300;

	/**
	 * The parts of Send an entry can be about.
	 *
	 * @var string[]
	 */
	const AREAS = array( 'sending', 'domain', 'account', 'settings', 'cleanup' );

	/**
	 * Levels, most serious first.
	 *
	 * @var string[]
	 */
	const LEVELS = array( 'error', 'warning', 'info', 'debug' );

	/**
	 * How long it records once turned on, in days; entries are kept as long.
	 *
	 * @var int[]
	 */
	const DAYS = array( 1, 7, 30 );

	/**
	 * Keys of the service's answers whose values are kept.
	 *
	 * @var string[]
	 */
	const SERVICE_KEYS = array( 'status', 'reason', 'errors', 'request_id', 'message_id', 'verdict', 'selector', 'domain', 'index', 'message' );

	/**
	 * Values the long-run rule skips: the IDs support asks for, and public DNS values.
	 *
	 * @var string[]
	 */
	const RAW_KEYS = array( 'request_id', 'message_id', 'selector' );

	/**
	 * The context keys each event may keep; any other key is dropped.
	 *
	 * @var array<string, string[]>
	 */
	const EVENTS = array(
		'mail.caught'          => array( 'origin', 'recipients', 'attachments', 'bytes', 'content_type' ),
		'mail.skipped'         => array( 'why', 'origin' ),
		'api.call'             => array( 'method', 'path', 'status', 'ms', 'request_id', 'content_type', 'bytes', 'body' ),
		'api.transport_error'  => array( 'method', 'path', 'wp_code', 'errno', 'phase', 'ms', 'timeout_s', 'message' ),
		'mail.sent'            => array( 'request_id', 'message_id', 'ms' ),
		'mail.failed'          => array( 'reason', 'code', 'http_status' ),
		'fallback.handed_off'  => array( 'reason', 'code' ),
		'fallback.host_result' => array( 'result', 'reason', 'message', 'exception_code' ),
		'mail.maybe_duplicate' => array( 'reason', 'host' ),
		'resend.sent'          => array( 'original', 'recipients', 'changed', 'status', 'reason' ),
		'resend.refused'       => array( 'reason', 'code' ),
		'test.sent'            => array( 'kind', 'request_id' ),
		'test.failed'          => array( 'kind', 'reason', 'code' ),
		'dns.check'            => array( 'domain', 'lockdown', 'dkim', 'spf', 'sender_domain', 'expected', 'found' ),
		'dns.watch'            => array( 'run', 'outcome', 'elapsed', 'next' ),
		'cloudflare.write'     => array( 'purpose', 'name', 'type', 'action', 'reason', 'codes' ),
		'account.provision'    => array( 'provider', 'domain', 'selector', 'status', 'code' ),
		'account.usage'        => array( 'used', 'limit', 'period_end' ),
		'settings.changed'     => array( 'keys' ),
		'debug.on'             => array( 'days' ),
		'debug.off'            => array( 'automatic' ),
		'log.pruned'           => array( 'deleted', 'remaining', 'days' ),
		'log.deleted'          => array( 'count' ),
		'sending.reset'        => array(),
	);

	/**
	 * Set while an entry is being written, so writing can never call itself.
	 *
	 * @var bool
	 */
	private static $writing = false;

	/**
	 * Values to remove wherever they appear in this request, like a token pasted for one call.
	 *
	 * @var string[]
	 */
	private static $secrets = array();

	/**
	 * Entries written for the email being sent before its log row exists (picked up, the API call), so
	 * they can be linked to it once it does; null when no email is being sent.
	 *
	 * @var int[]|null
	 */
	private static $held = null;

	/**
	 * Most entries held for one email.
	 *
	 * @var int
	 */
	const HELD_MAX = 20;

	/**
	 * Prefix of the day-long transients that remember a value, so a repeat isn't recorded again.
	 *
	 * @var string
	 */
	const SEEN_PREFIX = 'jetpack_send_debug_seen_';

	/**
	 * Table name.
	 *
	 * @return string
	 */
	public static function table_name() {
		global $wpdb;
		return $wpdb->prefix . 'jetpack_send_debug';
	}

	/**
	 * The table's definition, for dbDelta().
	 *
	 * @param string $charset Charset and collation clause.
	 * @return string
	 */
	public static function schema( $charset ) {
		$table = self::table_name();
		return "CREATE TABLE {$table} (
				id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				created_at datetime NOT NULL,
				level varchar(10) NOT NULL,
				area varchar(20) NOT NULL,
				event varchar(40) NOT NULL,
				message varchar(500) NOT NULL DEFAULT '',
				context text NULL,
				log_id bigint(20) unsigned NOT NULL DEFAULT 0,
				user_id bigint(20) unsigned NOT NULL DEFAULT 0,
				PRIMARY KEY  (id),
				KEY created_at (created_at),
				KEY log_id (log_id),
				KEY level_created (level,created_at)
			) {$charset};";
	}

	/**
	 * Whether it's recording now. Only reads.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function enabled() {
		if ( ! Email_Log::has_v4_schema() ) {
			return false;
		}
		$settings = Settings::get();
		$until    = self::until();
		return ! empty( $settings['debug_log'] ) && null !== $until && $until > time();
	}

	/**
	 * When it turns itself off, as a Unix time.
	 *
	 * @return int|null Null when it isn't on.
	 */
	private static function until() {
		$until = (string) ( Settings::get()['debug_log_until'] ?? '' );
		$time  = '' === $until ? false : strtotime( $until );
		return false === $time ? null : (int) $time;
	}

	/**
	 * Turn it off once its time is up.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function expire_if_due() {
		$settings = Settings::get();
		if ( empty( $settings['debug_log'] ) ) {
			return;
		}
		$until = self::until();
		if ( null === $until || $until <= time() ) {
			self::turn_off( true );
		}
	}

	/**
	 * Turn it on for a number of days.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $days 1, 7 or 30.
	 * @return void
	 */
	public static function turn_on( $days ) {
		$days   = in_array( (int) $days, self::DAYS, true ) ? (int) $days : 7;
		$was_on = self::enabled();
		Settings::update(
			array(
				'debug_log'       => true,
				'debug_log_days'  => $days,
				'debug_log_until' => gmdate( 'Y-m-d\\TH:i:s\\Z', time() + $days * DAY_IN_SECONDS ),
			)
		);
		// As Settings names the choice.
		$lengths = array(
			1  => __( '1 day', 'jetpack-send-pkg' ),
			7  => __( '1 week', 'jetpack-send-pkg' ),
			30 => __( '1 month', 'jetpack-send-pkg' ),
		);
		$message = $was_on
			/* translators: %s: how long it records for from now, e.g. "1 week". */
			? sprintf( __( 'Debug log now records for %s.', 'jetpack-send-pkg' ), $lengths[ $days ] )
			/* translators: %s: how long it records for, e.g. "1 week". */
			: sprintf( __( 'Debug log turned on for %s.', 'jetpack-send-pkg' ), $lengths[ $days ] );
		self::write( 'info', 'settings', 'debug.on', $message, array( 'days' => $days ) );
	}

	/**
	 * Turn it off. Entries stay until they're older than the days it was set to keep them.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $automatic Whether its time ran out, rather than someone turning it off.
	 * @return void
	 */
	public static function turn_off( $automatic = false ) {
		self::write(
			'info',
			'settings',
			'debug.off',
			$automatic ? __( 'Debug log turned off automatically.', 'jetpack-send-pkg' ) : __( 'Debug log turned off.', 'jetpack-send-pkg' ),
			array( 'automatic' => (bool) $automatic )
		);
		Settings::update(
			array(
				'debug_log'       => false,
				'debug_log_until' => '',
			)
		);
	}

	/**
	 * Record one step, while it's on. Never throws and never blocks a send.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $level   `error`, `warning`, `info` or `debug`.
	 * @param string $area    `sending`, `domain`, `account`, `settings` or `cleanup`.
	 * @param string $event   A dot key like `mail.failed`; it decides which context keys are kept.
	 * @param string $message One plain line.
	 * @param array  $context Details; unknown keys are dropped and the rest redacted.
	 * @param int    $log_id  The email it's about, or 0.
	 * @return void
	 */
	public static function add( $level, $area, $event, $message, array $context = array(), $log_id = 0 ) {
		if ( self::$writing ) {
			return;
		}
		try {
			if ( self::enabled() ) {
				self::write( $level, $area, $event, $message, $context, $log_id );
			}
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- A debug entry must never stop an email.
		}
	}

	/**
	 * Write an entry, whether or not it's on: turning it on and off is always recorded.
	 *
	 * @param string $level   Level.
	 * @param string $area    Area.
	 * @param string $event   Event key.
	 * @param string $message Plain line.
	 * @param array  $context Details.
	 * @param int    $log_id  The email it's about, or 0.
	 * @return void
	 */
	private static function write( $level, $area, $event, $message, array $context = array(), $log_id = 0 ) {
		global $wpdb;
		if ( self::$writing || ! Email_Log::has_v4_schema() ) {
			return;
		}
		self::$writing = true;
		try {
			$event   = substr( (string) preg_replace( '/[^a-z0-9._]/', '', strtolower( (string) $event ) ), 0, 40 );
			$allowed = array_flip( self::EVENTS[ $event ] ?? array() );
			$context = self::fit( self::redact( array_intersect_key( $context, $allowed ), '', $event ) );
			// Every string is already valid UTF-8 and cut to size, so wpdb's per-column checks aren't needed.
			$wpdb->query(
				$wpdb->prepare(
					'INSERT INTO %i ( created_at, level, area, event, message, context, log_id, user_id ) VALUES ( %s, %s, %s, %s, %s, %s, %d, %d )',
					self::table_name(),
					gmdate( 'Y-m-d H:i:s' ),
					in_array( $level, self::LEVELS, true ) ? $level : 'info',
					in_array( $area, self::AREAS, true ) ? $area : 'sending',
					$event,
					self::scrub( (string) $message ),
					array() === $context ? '' : (string) wp_json_encode( $context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
					max( 0, (int) $log_id ),
					get_current_user_id()
				)
			);
			if ( is_array( self::$held ) && (int) $log_id < 1 && 'sending' === $area && $wpdb->insert_id && count( self::$held ) < self::HELD_MAX ) {
				self::$held[] = (int) $wpdb->insert_id;
			}
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- A debug entry must never stop an email.
		} finally {
			self::$writing = false;
		}
	}

	/**
	 * Start holding the sending entries for one email until its log row exists. A new email starts over.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function hold() {
		self::$held = array();
	}

	/**
	 * Link the held entries to the email's log row, so its "See debug entries" shows the whole send,
	 * the service's answer included. Stops holding either way.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $log_id The email's row, or 0 when it wasn't logged.
	 * @return void
	 */
	public static function claim( $log_id ) {
		global $wpdb;
		$held       = self::$held;
		self::$held = null;
		if ( empty( $held ) || (int) $log_id < 1 || ! Email_Log::has_v4_schema() ) {
			return;
		}
		try {
			$in = implode( ',', array_fill( 0, count( $held ), '%d' ) );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- `$in` is one `%d` per id.
			$wpdb->query( $wpdb->prepare( "UPDATE %i SET log_id = %d WHERE log_id = 0 AND id IN ($in)", self::table_name(), (int) $log_id, ...$held ) );
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- A debug entry must never stop an email.
		}
	}

	/**
	 * Whether a value worth one entry changed since it was last recorded (usage, say), so repeated reads
	 * don't fill the log. Only while it's on, so nothing is stored while it's off.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $what  What it is, e.g. `usage`.
	 * @param string $value Its current value.
	 * @return bool
	 */
	public static function changed( $what, $value ) {
		if ( ! self::enabled() ) {
			return false;
		}
		$key = self::SEEN_PREFIX . preg_replace( '/[^a-z_]/', '', (string) $what );
		if ( get_transient( $key ) === (string) $value ) {
			return false;
		}
		set_transient( $key, (string) $value, DAY_IN_SECONDS );
		return true;
	}

	/**
	 * Remove a value wherever it appears in this request's entries, like a token used for one call.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $value Secret.
	 * @return void
	 */
	public static function secret( $value ) {
		$value = (string) $value;
		if ( strlen( $value ) >= 8 && ! in_array( $value, self::$secrets, true ) ) {
			self::$secrets[] = $value;
		}
	}

	/**
	 * Redact a context value: strings are scrubbed, other scalars kept, objects dropped.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $value Value.
	 * @param string $key   Its key, which decides whether long values are kept.
	 * @param string $event The event, for its own exemptions.
	 * @return mixed
	 */
	public static function redact( $value, $key = '', $event = '' ) {
		if ( is_array( $value ) ) {
			$out = array();
			foreach ( $value as $child => $item ) {
				$out[ $child ] = self::redact( $item, is_int( $child ) ? $key : $child, $event );
			}
			return $out;
		}
		if ( is_string( $value ) ) {
			// Public DNS values for the domain check, and the IDs support asks for, can be long.
			$raw = in_array( $key, self::RAW_KEYS, true ) || ( 'dns.check' === $event && in_array( $key, array( 'expected', 'found' ), true ) );
			// A message ID looks like an address but names no one, and support matches it with the service's.
			return self::scrub( $value, ! $raw, 'message_id' !== $key );
		}
		if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) || null === $value ) {
			return $value;
		}
		return '<' . gettype( $value ) . '>';
	}

	/**
	 * The parts of a service's answer that are safe to keep: listed keys keep their words, other strings
	 * become `<string, N chars>`, and lists show three items.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $data   Decoded answer.
	 * @param string $parent The key it sits under.
	 * @param int    $depth  Nesting depth.
	 * @return mixed
	 */
	public static function service_body( $data, $parent = '', $depth = 0 ) {
		if ( $depth > 5 ) {
			return '<deeper>';
		}
		if ( is_array( $data ) ) {
			$out   = array();
			$count = 0;
			$list  = array_keys( $data ) === range( 0, count( $data ) - 1 );
			foreach ( $data as $key => $value ) {
				if ( $list && ++$count > 3 ) {
					$out[] = '<+' . ( count( $data ) - 3 ) . ' more>';
					break;
				}
				// A sub-account's key comes back in the answer that creates it.
				$out[ $key ] = 'key' === $key || 'api_key' === $key ? '[removed]' : self::service_body( $value, $list ? $parent : (string) $key, $depth + 1 );
			}
			return $out;
		}
		if ( is_string( $data ) ) {
			return in_array( $parent, self::SERVICE_KEYS, true ) ? mb_substr( $data, 0, self::SERVICE_CHARS ) : '<string, ' . strlen( $data ) . ' chars>';
		}
		return $data;
	}

	/**
	 * Scrub one string: bearer tokens, secret-looking query values, long random runs, addresses,
	 * server paths, and this request's secrets; then cut it to length.
	 *
	 * @param string $text      Text.
	 * @param bool   $long_runs Whether to remove long random-looking runs.
	 * @param bool   $mask      Whether to mask addresses.
	 * @return string
	 */
	private static function scrub( $text, $long_runs = true, $mask = true ) {
		$text = (string) wp_check_invalid_utf8( (string) $text, true );
		$text = (string) preg_replace( '/\bBearer\s+\S+/i', 'Bearer [removed]', $text );
		$text = (string) preg_replace( '/\b(key|token|nonce|_wpnonce|password|pass|code|auth|sig|signature)=[^&\s"]+/i', '$1=[removed]', $text );
		if ( $long_runs ) {
			$text = (string) preg_replace_callback(
				'/[A-Za-z0-9+\/_-]{32,}={0,2}/',
				// Hex, or a mix of capitals, small letters and digits, like keys and tokens; words and paths stay.
				fn( $match ) => preg_match( '/^[0-9a-f]+$/i', $match[0] ) || ( preg_match( '/[A-Z]/', $match[0] ) && preg_match( '/[a-z]/', $match[0] ) && preg_match( '/\d/', $match[0] ) ) ? '[removed]' : $match[0],
				$text
			);
		}
		if ( $mask ) {
			$text = self::mask_emails( $text );
		}
		if ( defined( 'WP_CONTENT_DIR' ) && '' !== WP_CONTENT_DIR ) {
			$text = str_replace( rtrim( WP_CONTENT_DIR, '/\\' ), 'wp-content', $text );
		}
		if ( defined( 'ABSPATH' ) && strlen( ABSPATH ) > 1 ) {
			$text = str_replace( ABSPATH, '', $text );
		}
		$text = self::remove_secrets( $text );
		return mb_strlen( $text ) > self::STRING_CHARS ? mb_substr( $text, 0, self::STRING_CHARS - 1 ) . '…' : $text;
	}

	/**
	 * Replace the stored API key and this request's other secrets wherever they appear, e.g. when the
	 * service repeats a key in its error. Used for the email log's error and details too.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $value A string, or an array of them.
	 * @return mixed
	 */
	public static function remove_secrets( $value ) {
		$secrets = self::secrets();
		if ( array() === $secrets ) {
			return $value;
		}
		return map_deep( $value, fn( $item ) => is_string( $item ) ? str_replace( $secrets, '[removed]', $item ) : $item );
	}

	/**
	 * The stored API key and this request's other secrets.
	 *
	 * @return string[]
	 */
	private static function secrets() {
		$secrets = self::$secrets;
		$account = get_option( Account::OPTION );
		$key     = is_array( $account ) ? (string) ( $account['api_key'] ?? '' ) : '';
		if ( strlen( $key ) >= 8 ) {
			$secrets[] = $key;
		}
		return $secrets;
	}

	/**
	 * Mask every email address in a text.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $text Text.
	 * @return string
	 */
	public static function mask_emails( $text ) {
		return (string) preg_replace_callback( '/[A-Za-z0-9._%+\'-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/', fn( $match ) => self::mask_email( $match[0] ), $text );
	}

	/**
	 * An address with its mailbox hidden: `jane.doe@example.com` becomes `j•••@example.com`.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $email Address.
	 * @return string
	 */
	public static function mask_email( $email ) {
		$email = (string) $email;
		$at    = strrpos( $email, '@' );
		if ( false === $at || 0 === $at ) {
			return $email;
		}
		return mb_substr( $email, 0, 1 ) . '•••' . substr( $email, $at );
	}

	/**
	 * Keep a context under CONTEXT_BYTES: shorten strings, then keep only the plain values.
	 *
	 * @param array $context Redacted context.
	 * @return array
	 */
	private static function fit( array $context ) {
		$size = fn( $value ) => strlen( (string) wp_json_encode( $value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
		if ( $size( $context ) <= self::CONTEXT_BYTES ) {
			return $context;
		}
		$short = map_deep( $context, fn( $value ) => is_string( $value ) && mb_strlen( $value ) > 100 ? mb_substr( $value, 0, 99 ) . '…' : $value );
		if ( $size( $short ) <= self::CONTEXT_BYTES ) {
			return $short;
		}
		$plain = array_filter( $short, 'is_scalar' );
		return $plain + array( 'cut' => true );
	}

	/**
	 * A page of entries, newest first.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args `page`, `per_page`, `search`, `level` (string[]), `area` (string[]), `email` (log id).
	 * @return array{items: array[], total: int}
	 */
	public static function query( array $args ) {
		global $wpdb;
		if ( ! Email_Log::has_v4_schema() ) {
			return array(
				'items' => array(),
				'total' => 0,
			);
		}
		$page                   = max( 1, (int) ( $args['page'] ?? 1 ) );
		$per_page               = min( 100, max( 1, (int) ( $args['per_page'] ?? 20 ) ) );
		list( $where, $values ) = self::where( $args );
		$table                  = self::table_name();

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- `$where` is built from placeholders only, with `$values` to match.
		$rows  = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i WHERE {$where} ORDER BY id DESC LIMIT %d OFFSET %d", $table, ...array_merge( $values, array( $per_page, ( $page - 1 ) * $per_page ) ) ), ARRAY_A );
		$total = $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE {$where}", $table, ...$values ) );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		return array(
			'items' => array_map( array( __CLASS__, 'row' ), is_array( $rows ) ? $rows : array() ),
			'total' => (int) $total,
		);
	}

	/**
	 * The WHERE clause for the list's filters.
	 *
	 * @param array $args As for query().
	 * @return array{0: string, 1: array} SQL with placeholders, and their values.
	 */
	private static function where( array $args ) {
		global $wpdb;
		$where  = array( '1=1' );
		$values = array();
		foreach ( array(
			'level' => self::LEVELS,
			'area'  => self::AREAS,
		) as $column => $allowed ) {
			$list = array_values( array_intersect( array_map( 'strval', (array) ( $args[ $column ] ?? array() ) ), $allowed ) );
			if ( $list ) {
				$where[] = "{$column} IN (" . implode( ',', array_fill( 0, count( $list ), '%s' ) ) . ')';
				$values  = array_merge( $values, $list );
			}
		}
		if ( ! empty( $args['email'] ) ) {
			$where[]  = 'log_id = %d';
			$values[] = (int) $args['email'];
		}
		$search = Email_Log::clean_search( $args['search'] ?? '' );
		if ( '' !== $search ) {
			$like    = '%' . $wpdb->esc_like( $search ) . '%';
			$where[] = '( message LIKE %s OR event LIKE %s OR context LIKE %s )';
			array_push( $values, $like, $like, $like );
		}
		return array( implode( ' AND ', $where ), $values );
	}

	/**
	 * One entry.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $id Entry id.
	 * @return array|null
	 */
	public static function get( $id ) {
		global $wpdb;
		if ( ! Email_Log::has_v4_schema() ) {
			return null;
		}
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', self::table_name(), $id ), ARRAY_A );
		return is_array( $row ) ? self::row( $row ) : null;
	}

	/**
	 * Entries as plain text for support, newest first, in the site's timezone.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args  Filters, as for query().
	 * @param int   $limit Most entries.
	 * @return array{text: string, count: int}
	 */
	public static function text( array $args, $limit = 200 ) {
		$args['per_page'] = 100;
		$args['page']     = 1;
		$page             = self::query( $args );
		$items            = $page['items'];
		$want             = min( (int) $limit, $page['total'] );
		$have             = count( $items );
		while ( $have < $want ) {
			++$args['page'];
			$more = self::query( $args )['items'];
			if ( ! $more ) {
				break;
			}
			$items = array_merge( $items, $more );
			$have  = count( $items );
		}
		$items = array_slice( $items, 0, $limit );

		$zone    = wp_timezone();
		$account = Account::get();
		$site    = $account ? (string) $account['domain'] : (string) wp_parse_url( home_url(), PHP_URL_HOST );
		// English on purpose: support reads it.
		$lines = array(
			'Jetpack Send debug log',
			sprintf( 'Site: %s · Send %s · WordPress %s · PHP %s', $site, Send::PACKAGE_VERSION, get_bloginfo( 'version' ), PHP_VERSION ),
			sprintf(
				'Times are %s. Newest first. %s',
				Period::zone_label( new \DateTimeImmutable( 'now', $zone ) ),
				count( $items ) < $page['total'] ? sprintf( 'Newest %d of %d entries.', count( $items ), $page['total'] ) : sprintf( '%d entries.', count( $items ) )
			),
			'',
		);
		foreach ( $items as $item ) {
			$time    = ( new \DateTimeImmutable( $item['created_at'], new \DateTimeZone( 'UTC' ) ) )->setTimezone( $zone )->format( 'Y-m-d H:i:s' );
			$context = null === $item['context'] ? '' : ' ' . wp_json_encode( $item['context'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
			$lines[] = sprintf( '%s  %-8s %-9s %-16s %s%s', $time, strtoupper( $item['level'] ), $item['area'], $item['event'], $item['message'], $context );
		}
		return array(
			'text'  => implode( "\n", $lines ) . "\n",
			'count' => count( $items ),
		);
	}

	/**
	 * How many entries there are, or how many are about one email.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $log_id A log row, or 0 for all.
	 * @return int
	 */
	public static function count( $log_id = 0 ) {
		global $wpdb;
		if ( ! Email_Log::has_v4_schema() ) {
			return 0;
		}
		if ( (int) $log_id > 0 ) {
			return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE log_id = %d', self::table_name(), $log_id ) );
		}
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', self::table_name() ) );
	}

	/**
	 * Delete every entry.
	 *
	 * @since $$next-version$$
	 *
	 * @return int How many were deleted.
	 */
	public static function clear() {
		global $wpdb;
		$count = self::count();
		if ( $count > 0 ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i', self::table_name() ) );
		}
		return $count;
	}

	/**
	 * Delete entries older than the days it keeps them, on or off, and past MAX_ROWS.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function prune() {
		global $wpdb;
		if ( ! Email_Log::has_v4_schema() ) {
			return;
		}
		$days  = (int) ( Settings::get()['debug_log_days'] ?? 7 );
		$table = self::table_name();
		$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE created_at < %s', $table, gmdate( 'Y-m-d H:i:s', time() - max( 1, $days ) * DAY_IN_SECONDS ) ) );
		$oldest_kept = $wpdb->get_var( $wpdb->prepare( 'SELECT id FROM %i ORDER BY id DESC LIMIT 1 OFFSET %d', $table, self::MAX_ROWS - 1 ) );
		if ( null !== $oldest_kept ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE id < %d', $table, (int) $oldest_kept ) );
		}
	}

	/**
	 * What GET /status reports.
	 *
	 * @since $$next-version$$
	 *
	 * @return array{enabled: bool, days: int, until: string|null, entries: int}
	 */
	public static function state() {
		$settings = Settings::get();
		$enabled  = self::enabled();
		$until    = self::until();
		return array(
			'enabled' => $enabled,
			'days'    => (int) $settings['debug_log_days'],
			'until'   => $enabled && null !== $until ? gmdate( 'Y-m-d\\TH:i:s\\Z', $until ) : null,
			'entries' => self::count(),
		);
	}

	/**
	 * Drop the table (uninstall).
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function drop() {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', self::table_name() ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange -- Uninstall.
		delete_transient( self::SEEN_PREFIX . 'usage' );
	}

	/**
	 * An entry as the REST API returns it.
	 *
	 * @param array $row Database row.
	 * @return array
	 */
	private static function row( array $row ) {
		$context = is_string( $row['context'] ?? null ) ? json_decode( $row['context'], true ) : null;
		return array(
			'id'         => (string) $row['id'],
			'created_at' => (string) $row['created_at'],
			'level'      => (string) $row['level'],
			'area'       => (string) $row['area'],
			'event'      => (string) $row['event'],
			'message'    => (string) $row['message'],
			'context'    => is_array( $context ) && array() !== $context ? $context : null,
			'log_id'     => (int) ( $row['log_id'] ?? 0 ) > 0 ? (string) $row['log_id'] : '',
			'user'       => Email_Log::user_name( (int) ( $row['user_id'] ?? 0 ) ),
		);
	}
}
