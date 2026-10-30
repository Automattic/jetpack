<?php
/**
 * Email counts for the dashboard.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- A custom counts table; GET /stats caches the results.

/**
 * One row per site-local hour, status, type and plugin, holding a number. The counts outlive the
 * log, so a short retention never empties the dashboard. No addresses, subjects or row ids.
 *
 * Product code only ever adds, except move() when one email changes status.
 */
class Stats {

	/**
	 * Days of counts kept: a year's range plus the year before it.
	 *
	 * @var int
	 */
	const KEEP_DAYS = 800;

	/**
	 * `{ until_id, cursor, done }` for counting the emails logged before the counts existed.
	 * Kept once done: it's the flag that stops a second upgrade counting them again.
	 *
	 * @var string
	 */
	const BACKFILL_OPTION = 'jetpack_send_stats_backfill';

	/**
	 * Log rows read per backfill batch.
	 *
	 * @var int
	 */
	const BACKFILL_ROWS = 5000;

	/**
	 * The statuses counted, in the order the dashboard lists them.
	 *
	 * @var string[]
	 */
	const STATUSES = array( Email_Log::STATUS_SENT, Email_Log::STATUS_FALLBACK, Email_Log::STATUS_FAILED );

	/**
	 * Table name.
	 *
	 * @return string
	 */
	public static function table_name() {
		global $wpdb;
		return $wpdb->prefix . 'jetpack_send_stats';
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
				bucket int(10) unsigned NOT NULL,
				status varchar(20) NOT NULL,
				source varchar(20) NOT NULL,
				origin varchar(100) NOT NULL DEFAULT '',
				emails int(10) unsigned NOT NULL DEFAULT 0,
				PRIMARY KEY  (bucket,status,source,origin)
			) {$charset};";
	}

	/**
	 * The start of the site-local hour a time falls in, as a Unix time. Half-hour zones land
	 * local midnights on bucket edges, and daylight-saving days have 23 or 25 buckets.
	 *
	 * @since $$next-version$$
	 *
	 * @param int                $time Unix time.
	 * @param \DateTimeZone|null $zone Site timezone, when the caller already has it.
	 * @return int
	 */
	public static function bucket( $time, $zone = null ) {
		$time   = (int) $time;
		$zone   = $zone instanceof \DateTimeZone ? $zone : wp_timezone();
		$offset = $zone->getOffset( new \DateTime( '@' . $time ) );
		return (int) ( floor( ( $time + $offset ) / HOUR_IN_SECONDS ) * HOUR_IN_SECONDS - $offset );
	}

	/**
	 * Count one email once its outcome is known.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $time   When the email's log row was created, Unix time.
	 * @param string $status `sent`, `fallback` or `failed`.
	 * @param string $source `wp_mail`, `test` or `resend`.
	 * @param string $origin What sent it; '' for tests.
	 * @param int    $log_id The log row; 0 when the insert failed, which still counts.
	 * @return void
	 */
	public static function add( $time, $status, $source, $origin, $log_id = 0 ) {
		if ( self::backfill_counts( $log_id ) ) {
			return;
		}
		self::add_count( $time, $status, $source, $origin, 1 );
	}

	/**
	 * Add to a count, for one or more emails at once.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $time   Unix time.
	 * @param string $status Status.
	 * @param string $source Type.
	 * @param string $origin Origin key.
	 * @param int    $n      Emails to add.
	 * @return void
	 */
	public static function add_count( $time, $status, $source, $origin, $n ) {
		global $wpdb;
		if ( (int) $n < 1 || ! Email_Log::has_v4_schema() ) {
			return;
		}
		$wpdb->query(
			$wpdb->prepare(
				'INSERT INTO %i ( bucket, status, source, origin, emails ) VALUES ( %d, %s, %s, %s, %d ) ON DUPLICATE KEY UPDATE emails = emails + %d',
				self::table_name(),
				self::bucket( $time ),
				substr( (string) $status, 0, 20 ),
				substr( (string) $source, 0, 20 ),
				substr( (string) $origin, 0, 100 ),
				(int) $n,
				(int) $n
			)
		);
	}

	/**
	 * Move one counted email to another status, e.g. when the host's mail fails after a hand-off.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $time   When its log row was created, Unix time.
	 * @param string $from   Status it was counted as.
	 * @param string $to     Status it has now.
	 * @param string $source Type.
	 * @param string $origin Origin key.
	 * @param int    $log_id The log row.
	 * @return void
	 */
	public static function move( $time, $from, $to, $source, $origin, $log_id = 0 ) {
		global $wpdb;
		if ( ! Email_Log::has_v4_schema() || self::backfill_counts( $log_id ) ) {
			return;
		}
		$wpdb->query(
			$wpdb->prepare(
				'UPDATE %i SET emails = emails - 1 WHERE bucket = %d AND status = %s AND source = %s AND origin = %s AND emails > 0',
				self::table_name(),
				self::bucket( $time ),
				(string) $from,
				(string) $source,
				substr( (string) $origin, 0, 100 )
			)
		);
		self::add_count( $time, $to, $source, $origin, 1 );
		Email_Log::clear_stats_cache();
	}

	/**
	 * Whether the backfill counts a row, so a live count would count it twice.
	 *
	 * @param int $log_id Log row id.
	 * @return bool
	 */
	private static function backfill_counts( $log_id ) {
		$state = self::backfill_state();
		return null !== $state && (int) $log_id > 0 && (int) $log_id <= $state['until_id'];
	}

	/**
	 * Site emails and resends per hour and status; tests aren't counted.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $start_utc First second, Unix time.
	 * @param int $end_utc   Second after the last one.
	 * @return array<int, array{sent: int, fallback: int, failed: int}> By bucket, only those with emails.
	 */
	public static function series( $start_utc, $end_utc ) {
		global $wpdb;
		$series = array();
		$fold   = static function ( $bucket, $status, $n ) use ( &$series ) {
			if ( in_array( $status, self::STATUSES, true ) ) {
				$series[ $bucket ]           ??= array_fill_keys( self::STATUSES, 0 );
				$series[ $bucket ][ $status ] += $n;
			}
		};
		if ( Email_Log::has_v4_schema() ) {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT bucket, status, SUM(emails) AS n FROM %i WHERE bucket >= %d AND bucket < %d AND source <> 'test' GROUP BY bucket, status", self::table_name(), $start_utc, $end_utc ), ARRAY_A );
			foreach ( (array) $rows as $row ) {
				$fold( (int) $row['bucket'], (string) $row['status'], (int) $row['n'] );
			}
		}
		foreach ( self::uncounted( $start_utc, $end_utc ) as $row ) {
			if ( 'test' !== $row['source'] ) {
				$fold( $row['bucket'], $row['status'], $row['n'] );
			}
		}
		ksort( $series );
		return $series;
	}

	/**
	 * Every email by type and status, tests included.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $start_utc First second, Unix time.
	 * @param int $end_utc   Second after the last one.
	 * @return array<string, array<string, int>> By type, then status.
	 */
	public static function totals_by_source( $start_utc, $end_utc ) {
		global $wpdb;
		$totals = array();
		if ( Email_Log::has_v4_schema() ) {
			$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT source, status, SUM(emails) AS n FROM %i WHERE bucket >= %d AND bucket < %d GROUP BY source, status', self::table_name(), $start_utc, $end_utc ), ARRAY_A );
			foreach ( (array) $rows as $row ) {
				$totals[ (string) $row['source'] ][ (string) $row['status'] ] = (int) $row['n'];
			}
		}
		foreach ( self::uncounted( $start_utc, $end_utc ) as $row ) {
			$totals[ $row['source'] ][ $row['status'] ] = ( $totals[ $row['source'] ][ $row['status'] ] ?? 0 ) + $row['n'];
		}
		return $totals;
	}

	/**
	 * Site emails and resends per origin, most first. Tests and emails with no origin are left out.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $start_utc First second, Unix time.
	 * @param int $end_utc   Second after the last one.
	 * @return array<int, array{origin: string, n: int}>
	 */
	public static function origins( $start_utc, $end_utc ) {
		global $wpdb;
		$counts = array();
		if ( Email_Log::has_v4_schema() ) {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT origin, SUM(emails) AS n FROM %i WHERE bucket >= %d AND bucket < %d AND source <> 'test' AND origin <> '' GROUP BY origin", self::table_name(), $start_utc, $end_utc ), ARRAY_A );
			foreach ( (array) $rows as $row ) {
				$counts[ (string) $row['origin'] ] = (int) $row['n'];
			}
		}
		foreach ( self::uncounted( $start_utc, $end_utc ) as $row ) {
			if ( 'test' !== $row['source'] && '' !== $row['origin'] ) {
				$counts[ $row['origin'] ] = ( $counts[ $row['origin'] ] ?? 0 ) + $row['n'];
			}
		}
		arsort( $counts );
		$origins = array();
		foreach ( $counts as $origin => $n ) {
			if ( $n > 0 ) {
				$origins[] = array(
					'origin' => (string) $origin,
					'n'      => $n,
				);
			}
		}
		return $origins;
	}

	/**
	 * Emails the mail service accepted since a time, every type: tests and resends use the plan's sends too.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $start_utc First second, Unix time.
	 * @return array{emails: int, tests: int}
	 */
	public static function sent_counts( $start_utc ) {
		$end    = time() + DAY_IN_SECONDS;
		$totals = self::totals_by_source( (int) $start_utc, $end );
		$emails = 0;
		foreach ( $totals as $statuses ) {
			$emails += (int) ( $statuses[ Email_Log::STATUS_SENT ] ?? 0 );
		}
		return array(
			'emails' => $emails,
			'tests'  => (int) ( $totals['test'][ Email_Log::STATUS_SENT ] ?? 0 ),
		);
	}

	/**
	 * Whether anything but a test was ever counted. Stops at the first one.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function has_history() {
		global $wpdb;
		if ( Email_Log::has_v4_schema() && null !== $wpdb->get_var( $wpdb->prepare( "SELECT 1 FROM %i WHERE source <> 'test' AND emails > 0 LIMIT 1", self::table_name() ) ) ) {
			return true;
		}
		return self::log_still_counts() && Email_Log::has_history();
	}

	/**
	 * The oldest counted hour, tests included.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|null Bucket, or null with no counts.
	 */
	public static function since() {
		global $wpdb;
		$since = null;
		if ( Email_Log::has_v4_schema() ) {
			$value = $wpdb->get_var( $wpdb->prepare( 'SELECT MIN(bucket) FROM %i WHERE emails > 0', self::table_name() ) );
			$since = null === $value ? null : (int) $value;
		}
		$oldest = self::log_still_counts() ? Email_Log::oldest_created_at() : null;
		if ( null !== $oldest ) {
			$bucket = self::bucket( (int) strtotime( $oldest . ' UTC' ) );
			$since  = null === $since ? $bucket : min( $since, $bucket );
		}
		return $since;
	}

	/**
	 * The newest counted hour with a site email or resend.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|null Bucket, or null with none.
	 */
	public static function newest() {
		global $wpdb;
		$newest = null;
		if ( Email_Log::has_v4_schema() ) {
			$value  = $wpdb->get_var( $wpdb->prepare( "SELECT MAX(bucket) FROM %i WHERE source <> 'test' AND emails > 0", self::table_name() ) );
			$newest = null === $value ? null : (int) $value;
		}
		$last = self::log_still_counts() ? Email_Log::last_email_at() : null;
		if ( null !== $last ) {
			$bucket = self::bucket( (int) strtotime( $last . ' UTC' ) );
			$newest = null === $newest ? $bucket : max( $newest, $bucket );
		}
		return $newest;
	}

	/**
	 * Whether some emails are still only in the log: before the upgrade, or while the backfill runs.
	 *
	 * @return bool
	 */
	private static function log_still_counts() {
		if ( ! Email_Log::has_v4_schema() ) {
			return true;
		}
		$state = self::backfill_state();
		return null !== $state && ! $state['done'];
	}

	/**
	 * Log rows not in the counts yet, grouped by hour, status, type and origin: every row before the
	 * upgrade, and the rows the backfill hasn't reached while it runs. So the numbers are right either way.
	 *
	 * @param int $start_utc First second, Unix time.
	 * @param int $end_utc   Second after the last one.
	 * @return array<int, array{bucket: int, status: string, source: string, origin: string, n: int}>
	 */
	private static function uncounted( $start_utc, $end_utc ) {
		if ( ! Email_Log::has_v4_schema() ) {
			return self::count_log_rows( 0, PHP_INT_MAX, (int) $start_utc, (int) $end_utc );
		}
		$state = self::backfill_state();
		if ( null === $state || $state['done'] ) {
			return array();
		}
		return self::count_log_rows( $state['cursor'], $state['until_id'], (int) $start_utc, (int) $end_utc );
	}

	/**
	 * Count log rows with `$after_id < id <= $until_id` inside a window, in batches, grouping in PHP.
	 *
	 * @param int      $after_id  Lowest id, excluded.
	 * @param int      $until_id  Highest id, included.
	 * @param int|null $start_utc First second, or null for any.
	 * @param int|null $end_utc   Second after the last one, or null for any.
	 * @return array<int, array{bucket: int, status: string, source: string, origin: string, n: int}>
	 */
	private static function count_log_rows( $after_id, $until_id, $start_utc = null, $end_utc = null ) {
		global $wpdb;
		if ( ! Email_Log::is_installed() ) {
			return array();
		}
		$zone   = wp_timezone();
		$from   = null === $start_utc ? '0000-00-00 00:00:00' : gmdate( 'Y-m-d H:i:s', $start_utc );
		$to     = null === $end_utc ? '9999-12-31 23:59:59' : gmdate( 'Y-m-d H:i:s', $end_utc );
		$counts = array();
		$last   = (int) $after_id;
		do {
			$rows = (array) $wpdb->get_results( $wpdb->prepare( 'SELECT id, created_at, status, source, origin FROM %i WHERE id > %d AND id <= %d AND created_at >= %s AND created_at < %s ORDER BY id LIMIT %d', Email_Log::table_name(), $last, $until_id, $from, $to, self::BACKFILL_ROWS ), ARRAY_A );
			foreach ( $rows as $row ) {
				$bucket = self::bucket( (int) strtotime( $row['created_at'] . ' UTC' ), $zone );
				$key    = $bucket . '|' . $row['status'] . '|' . $row['source'] . '|' . $row['origin'];
				if ( ! isset( $counts[ $key ] ) ) {
					$counts[ $key ] = array(
						'bucket' => $bucket,
						'status' => (string) $row['status'],
						'source' => (string) $row['source'],
						'origin' => (string) $row['origin'],
						'n'      => 0,
					);
				}
				++$counts[ $key ]['n'];
				$last = max( $last, (int) $row['id'] );
			}
			$full = count( $rows ) === self::BACKFILL_ROWS;
		} while ( $full );
		return array_values( $counts );
	}

	/**
	 * The backfill's state.
	 *
	 * @since $$next-version$$
	 *
	 * @return array{until_id: int, cursor: int, done: bool}|null Null before the upgrade wrote it.
	 */
	public static function backfill_state() {
		$state = get_option( self::BACKFILL_OPTION, null );
		if ( ! is_array( $state ) || ! isset( $state['until_id'] ) ) {
			return null;
		}
		return array(
			'until_id' => (int) $state['until_id'],
			'cursor'   => (int) ( $state['cursor'] ?? 0 ),
			'done'     => ! empty( $state['done'] ),
		);
	}

	/**
	 * Write the backfill's boundary once: emails logged before the upgrade are counted by the backfill,
	 * later ones live. A boundary that's already there (a second upgrade after a rollback) stays.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $until_id The newest log row at the upgrade; 0 for an empty log.
	 * @return void
	 */
	public static function start_backfill( $until_id ) {
		if ( false !== get_option( self::BACKFILL_OPTION, false ) ) {
			return;
		}
		$until_id = max( 0, (int) $until_id );
		update_option(
			self::BACKFILL_OPTION,
			array(
				'until_id' => $until_id,
				'cursor'   => 0,
				'done'     => 0 === $until_id,
			),
			false
		);
	}

	/**
	 * Count the next batches of emails logged before the upgrade. Only adds; never deletes or lowers.
	 *
	 * @since $$next-version$$
	 *
	 * @param float $budget_seconds Keep going while there's time; 0 for one batch.
	 * @return bool Whether the backfill is done.
	 */
	public static function backfill_batch( $budget_seconds = 2.0 ) {
		global $wpdb;
		$state = self::backfill_state();
		if ( ! Email_Log::has_v4_schema() || null === $state ) {
			return false;
		}
		if ( $state['done'] ) {
			return true;
		}
		if ( ! Lock::acquire( 'backfill', 5 * MINUTE_IN_SECONDS ) ) {
			return false;
		}

		try {
			$started = microtime( true );
			$zone    = wp_timezone();
			do {
				$rows  = (array) $wpdb->get_results( $wpdb->prepare( 'SELECT id, created_at, status, source, origin FROM %i WHERE id > %d AND id <= %d ORDER BY id LIMIT %d', Email_Log::table_name(), $state['cursor'], $state['until_id'], self::BACKFILL_ROWS ), ARRAY_A );
				$batch = array();
				foreach ( $rows as $row ) {
					$time = (int) strtotime( $row['created_at'] . ' UTC' );
					$key  = self::bucket( $time, $zone ) . '|' . $row['status'] . '|' . $row['source'] . '|' . $row['origin'];
					if ( ! isset( $batch[ $key ] ) ) {
						$batch[ $key ] = array( $time, (string) $row['status'], (string) $row['source'], (string) $row['origin'], 0 );
					}
					++$batch[ $key ][4];
				}

				$state['cursor'] = count( $rows ) < self::BACKFILL_ROWS ? $state['until_id'] : (int) end( $rows )['id'];
				$state['done']   = $state['cursor'] >= $state['until_id'];
				// The cursor moves before the counts are added: a request that dies here drops a count, never doubles one.
				update_option( self::BACKFILL_OPTION, $state, false );
				foreach ( $batch as $count ) {
					self::add_count( $count[0], $count[1], $count[2], $count[3], $count[4] );
				}
			} while ( ! $state['done'] && microtime( true ) - $started < $budget_seconds );
		} finally {
			Lock::release( 'backfill' );
		}
		return $state['done'];
	}

	/**
	 * Delete counts older than KEEP_DAYS.
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
		$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE bucket < %d', self::table_name(), time() - self::KEEP_DAYS * DAY_IN_SECONDS ) );
	}

	/**
	 * Drop the table and the backfill's state (uninstall).
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function drop() {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', self::table_name() ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange -- Uninstall.
		delete_option( self::BACKFILL_OPTION );
	}
}
