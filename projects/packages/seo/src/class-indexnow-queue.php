<?php
/**
 * Durable IndexNow notifications with bounded reads and versioned ownership.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Status\Host;

/**
 * Stores pending URLs independently of caches and scheduler availability.
 */
class Indexnow_Queue {
	const PREFIX               = 'jetpack_seo_indexnow_q_';
	const CAPACITY             = 10000;
	const HOOK                 = 'jetpack_seo_indexnow_worker';
	const RECOVERY_HOOK        = 'jetpack_seo_indexnow_recovery';
	const STATUS_OPTION        = 'jetpack_seo_indexnow_status';
	const ACCEPTED_OPTION      = 'jetpack_seo_indexnow_last_accepted';
	const GENERATION_OPTION    = 'jetpack_seo_indexnow_generation';
	const CURSOR_OPTION        = 'jetpack_seo_indexnow_cursor';
	const COOLDOWN_OPTION      = 'jetpack_seo_indexnow_cooldown';
	const ADMISSION_LOCK       = 'jetpack_seo_indexnow_admission_lock';
	const WORKER_LOCK          = 'jetpack_seo_indexnow_worker_lock';
	const PAGE_SIZE            = 250;
	const SCAN_LIMIT           = 5000;
	const BATCH_BYTES          = 1048576;
	const SIMPLE_OPTIONS_BYTES = 750000;

	/** Register hooks without selecting a site or scheduling work. */
	public static function init() {
		add_action( 'jetpack_seo_indexnow_url_changed', array( __CLASS__, 'enqueue' ), 10, 3 );
		add_action( 'jetpack_seo_indexnow_post_restricted', array( __CLASS__, 'discard_post' ) );
		add_action( self::HOOK, array( __CLASS__, 'work' ) );
		add_action( self::RECOVERY_HOOK, array( __CLASS__, 'work' ) );
		add_action( 'jetpack_deactivate_module_seo-tools', array( __CLASS__, 'clear_if_used' ) );
		add_action( 'update_option_home', array( __CLASS__, 'clear_if_used' ) );
		add_action( 'update_option_' . Indexnow_Client::ENABLED_OPTION, array( __CLASS__, 'preference_changed' ), 10, 2 );
	}

	/**
	 * Reset pending work when consent is withdrawn outside the settings endpoint.
	 *
	 * @param mixed $old Previous preference.
	 * @param mixed $enabled Saved preference.
	 */
	public static function preference_changed( $old, $enabled ) {
		if ( ! $enabled ) {
			self::clear();
		}
	}

	/**
	 * Bound admissions without changing the identity or visibility of stored rows.
	 *
	 * @return int
	 */
	public static function capacity() {
		/**
		 * Filters the maximum pending IndexNow URLs admitted on a site.
		 *
		 * @since $$next-version$$
		 * @param int $capacity Pending URLs, between 1 and 50,000.
		 */
		$capacity = apply_filters( 'jetpack_seo_indexnow_queue_capacity', self::CAPACITY );
		return is_int( $capacity ) ? max( 1, min( 50000, $capacity ) ) : self::CAPACITY;
	}

	/**
	 * Read a bounded page directly from durable storage.
	 *
	 * @param int    $limit Maximum rows.
	 * @param string $after Previous row name for keyset pagination.
	 * @return array
	 */
	public static function rows( $limit = self::PAGE_SIZE, $after = '' ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Durable ownership must bypass option caches.
		return $wpdb->get_results( $wpdb->prepare( "SELECT option_name, option_value FROM $wpdb->options WHERE option_name LIKE %s AND option_name > %s ORDER BY option_name LIMIT %d", $wpdb->esc_like( self::PREFIX ) . '%', $after, max( 1, min( 1000, $limit ) ) ), ARRAY_A );
	}

	/**
	 * Count pending rows without loading their payloads.
	 *
	 * @return int
	 */
	public static function size() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Admission needs the current durable count.
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->options WHERE option_name LIKE %s", $wpdb->esc_like( self::PREFIX ) . '%' ) );
	}

	/**
	 * Read one durable row, bypassing stale option caches.
	 *
	 * @param string $name Option name.
	 * @return array|null
	 */
	private static function row( $name ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Compare-and-swap requires the actual persisted version.
		return $wpdb->get_row( $wpdb->prepare( "SELECT option_name, option_value FROM $wpdb->options WHERE option_name = %s", $name ), ARRAY_A );
	}

	/**
	 * Change a row only if its exact version remains owned.
	 *
	 * @param array       $row Observed durable row.
	 * @param array|null  $next Replacement, or null to delete.
	 * @param string|null $generation Required queue generation for a replacement.
	 * @return bool
	 */
	public static function compare_and_swap( $row, $next, $generation = null ) {
		global $wpdb;
		$where = array(
			'option_name'  => $row['option_name'],
			'option_value' => $row['option_value'],
		);
		if ( null !== $generation && null !== $next ) {
			// LIMIT keeps the generation subquery materialized, avoiding MySQL's target-table restriction.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Check the queue fence in the same statement as the conditional replacement.
			$changed = $wpdb->query( $wpdb->prepare( "UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s AND option_value = %s AND EXISTS (SELECT 1 FROM (SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1) AS queue_generation WHERE queue_generation.option_value = %s)", wp_json_encode( $next, JSON_UNESCAPED_SLASHES ), $row['option_name'], $row['option_value'], self::GENERATION_OPTION, $generation ) );
		} else {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Conditional writes prevent stale acknowledgments.
			$changed = null === $next ? $wpdb->delete( $wpdb->options, $where ) : $wpdb->update( $wpdb->options, array( 'option_value' => wp_json_encode( $next, JSON_UNESCAPED_SLASHES ) ), $where );
		}
		wp_cache_delete( $row['option_name'], 'options' );
		return 1 === $changed;
	}

	/**
	 * Delete a bounded snapshot without clearing newer row versions.
	 *
	 * @param array       $rows Observed rows.
	 * @param string|null $generation Required queue generation during a reset.
	 * @return int
	 */
	private static function delete_rows( $rows, $generation = null ) {
		global $wpdb;
		$conditions = array();
		$values     = array();
		foreach ( $rows as $row ) {
			$conditions[] = '(option_name = %s AND option_value = %s)';
			$values[]     = $row['option_name'];
			$values[]     = $row['option_value'];
		}
		$where = '(' . implode( ' OR ', $conditions ) . ')';
		if ( null !== $generation ) {
			$where   .= " AND EXISTS (SELECT 1 FROM (SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1) AS queue_generation WHERE queue_generation.option_value = %s)";
			$values[] = self::GENERATION_OPTION;
			$values[] = $generation;
		}
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- Conditions contain only bound placeholders.
		$removed = $wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE $where", $values ) );
		foreach ( $rows as $row ) {
			wp_cache_delete( $row['option_name'], 'options' );
		}
		return (int) $removed;
	}

	/**
	 * Acquire an expiring lock with an owner token.
	 *
	 * @param string $name Lock name.
	 * @return array|null Owned durable row.
	 */
	private static function lock( $name ) {
		$value = array(
			'owner'   => wp_generate_uuid4(),
			'expires' => time() + 60,
		);
		$json  = wp_json_encode( $value, JSON_UNESCAPED_SLASHES );
		$old   = self::row( $name );
		if ( $old ) {
			$previous = json_decode( $old['option_value'], true );
			if ( ( $previous['expires'] ?? 0 ) >= time() || ! self::compare_and_swap( $old, $value ) ) {
				return null;
			}
		} else {
			global $wpdb;
			if ( self::ADMISSION_LOCK === $name ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Avoid shared duplicate-key locks when writers concurrently create the lease.
				$inserted = $wpdb->query( $wpdb->prepare( "INSERT INTO $wpdb->options (option_name, option_value, autoload) VALUES (%s, %s, 'no') ON DUPLICATE KEY UPDATE option_name = option_name", $name, $json ) );
			} else {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Other requests cannot invalidate a nonpersistent option cache.
				$inserted = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO $wpdb->options (option_name, option_value, autoload) VALUES (%s, %s, 'no')", $name, $json ) );
			}
			wp_cache_delete( $name, 'options' );
			if ( 1 !== $inserted ) {
				return null;
			}
			if ( self::ADMISSION_LOCK === $name && self::row( $name ) !== array(
				'option_name'  => $name,
				'option_value' => $json,
			) ) {
				return null;
			}
		}
		return array(
			'option_name'  => $name,
			'option_value' => $json,
		);
	}

	/**
	 * Read the current generation after establishing writer-consistent routing.
	 *
	 * @return string|null
	 */
	private static function generation() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- The write also pins subsequent options reads on replicated hosts.
		$wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO $wpdb->options (option_name, option_value, autoload) VALUES (%s, '0', 'no')", self::GENERATION_OPTION ) );
		$row = self::row( self::GENERATION_OPTION );
		return $row ? $row['option_value'] : null;
	}

	/**
	 * Bound growing Simple records while holding the admission lock.
	 *
	 * @param string     $name Option name.
	 * @param string     $value Encoded notification.
	 * @param array|null $old Previous durable row.
	 * @param array      $lock Admission lock.
	 * @param string     $generation Current queue generation.
	 * @return bool
	 */
	private static function admit_simple( $name, $value, $old, $lock, $generation ) {
		global $wpdb;
		$delta = strlen( $name ) + strlen( $value ) + strlen( (string) strlen( $name ) ) + strlen( (string) strlen( $value ) ) + 12;
		if ( $old ) {
			$delta -= strlen( $name ) + strlen( $old['option_value'] ) + strlen( (string) strlen( $name ) ) + strlen( (string) strlen( $old['option_value'] ) ) + 12;
		}
		// Keep the scan read-only; queue writers serialize on the admission lock.
		// The estimate includes string serialization and a conservative array header.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Measure options without caching their values.
		$storage = $wpdb->get_row( $wpdb->prepare( "SELECT COALESCE(SUM(OCTET_LENGTH(option_name) + OCTET_LENGTH(option_value) + OCTET_LENGTH(OCTET_LENGTH(option_name)) + OCTET_LENGTH(OCTET_LENGTH(option_value)) + 12), 0) + 64 AS bytes, COALESCE(SUM(option_name LIKE %s), 0) AS pending FROM $wpdb->options", $wpdb->esc_like( self::PREFIX ) . '%' ), ARRAY_A );
		if ( ! $storage || $storage['bytes'] + $delta > self::SIMPLE_OPTIONS_BYTES || ( ! $old && $storage['pending'] >= self::capacity() ) ) {
			return false;
		}
		$fence = $wpdb->prepare( "EXISTS (SELECT 1 FROM (SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1) AS queue_owner WHERE queue_owner.option_value = %s) AND EXISTS (SELECT 1 FROM (SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1) AS queue_generation WHERE queue_generation.option_value = %s)", self::ADMISSION_LOCK, $lock['option_value'], self::GENERATION_OPTION, $generation );
		if ( $old ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Fences contain bound values and prevent a stale size check from surviving another queue writer or reset.
			$changed = $wpdb->query( $wpdb->prepare( "UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s AND option_value = %s AND $fence", $value, $name, $old['option_value'] ) );
		} else {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Verify ownership in the same statement as the admission without locking unrelated options.
			$changed = $wpdb->query( $wpdb->prepare( "INSERT INTO $wpdb->options (option_name, option_value, autoload) SELECT %s, %s, 'no' FROM DUAL WHERE $fence", $name, $value ) );
		}
		wp_cache_delete( $name, 'options' );
		return 1 === $changed;
	}

	/**
	 * Admit or replace a URL without scanning pending payloads.
	 *
	 * @param string $url Public URL.
	 * @param int    $post_id Source post ID.
	 * @param bool   $deleted Whether this describes the previous public URL.
	 * @return bool
	 */
	public static function enqueue( $url, $post_id, $deleted = false ) {
		$post_id = (int) $post_id;
		if ( $post_id < 1 || ! Indexnow_Client::enabled() || ! Indexnow_Client::in_scope( $url ) ) {
			return false;
		}
		$generation = self::generation();
		if ( null === $generation ) {
			return false;
		}
		$name = self::PREFIX . ( $deleted ? hash( 'sha256', $url ) : 'p_' . $post_id );
		$item = array(
			'generation' => $generation,
			'url'        => $url,
			'post'       => $post_id,
			'deleted'    => (bool) $deleted,
			'scope'      => Indexnow_Client::scope(),
			'version'    => wp_generate_uuid4(),
			'due'        => time() + 300,
			'attempt'    => 0,
			'created'    => time(),
		);
		if ( ! $deleted ) {
			unset( $item['url'] );
		}
		$json   = wp_json_encode( $item, JSON_UNESCAPED_SLASHES );
		$simple = ( new Host() )->is_wpcom_simple();
		for ( $attempt = 0; $attempt < 40; ++$attempt ) {
			if ( $attempt && self::generation() !== $generation ) {
				return false;
			}
			$old = self::row( $name );
			if ( $old && ( ! $simple || strlen( $json ) <= strlen( $old['option_value'] ) ) ) {
				if ( ! self::compare_and_swap( $old, $item, $generation ) ) {
					continue;
				}
			} else {
				$lock = self::lock( self::ADMISSION_LOCK );
				if ( ! $lock ) {
					usleep( 2000 );
					continue;
				}
				try {
					if ( $simple ) {
						$old = self::row( $name );
						if ( ! self::admit_simple( $name, $json, $old, $lock, $generation ) ) {
							if ( self::generation() !== $generation || ! Indexnow_Client::enabled() ) {
								return false;
							}
							break;
						}
					} else {
						if ( self::row( $name ) ) {
							continue;
						}
						if ( self::size() >= self::capacity() ) {
							break;
						}
						global $wpdb;
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Fence inserts against replacement of an expired admission lock.
						$added = $wpdb->query( $wpdb->prepare( "INSERT INTO $wpdb->options (option_name, option_value, autoload) SELECT %s, %s, 'no' FROM DUAL WHERE EXISTS (SELECT 1 FROM $wpdb->options WHERE option_name = %s AND option_value = %s) AND EXISTS (SELECT 1 FROM $wpdb->options WHERE option_name = %s AND option_value = %s)", $name, wp_json_encode( $item, JSON_UNESCAPED_SLASHES ), $lock['option_name'], $lock['option_value'], self::GENERATION_OPTION, $generation ) );
						wp_cache_delete( $name, 'options' );
						if ( 1 !== $added ) {
							continue;
						}
					}
				} finally {
					// Reuse the row to avoid duplicate-key gap-lock deadlocks during parallel admissions.
					self::compare_and_swap(
						$lock,
						array(
							'owner'   => '',
							'expires' => 0,
						)
					);
				}
			}
			self::ensure_recovery();
			self::schedule();
			return true;
		}
		update_option(
			'jetpack_seo_indexnow_enqueue_error',
			array(
				'state'   => 'queue_full_or_busy',
				'time'    => time(),
				'version' => wp_generate_uuid4(),
			),
			false
		);
		return false;
	}

	/**
	 * Cancel matching URLs before deletion can erase a restriction.
	 *
	 * @param int $post_id Restricted post ID.
	 */
	public static function discard_post( $post_id ) {
		if ( ( new Host() )->is_vip_site() || ! Initializer::is_available() || ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			return;
		}
		if ( null === self::generation() ) {
			return;
		}
		global $wpdb;
		do {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Filter in storage to avoid loading unrelated URL payloads.
			$rows      = $wpdb->get_results( $wpdb->prepare( "SELECT option_name, option_value FROM $wpdb->options WHERE option_name LIKE %s AND option_value LIKE %s ORDER BY option_name LIMIT %d", $wpdb->esc_like( self::PREFIX ) . '%', '%"post":' . (int) $post_id . ',%', self::PAGE_SIZE ), ARRAY_A );
			$removed   = $rows ? self::delete_rows( $rows ) : 0;
			$full_page = is_array( $rows ) && count( $rows ) === self::PAGE_SIZE;
		} while ( $full_page && $removed );
	}

	/** Recover work after a lost single-event schedule. */
	public static function ensure_recovery() {
		if ( ! wp_next_scheduled( self::RECOVERY_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', self::RECOVERY_HOOK );
		}
	}

	/**
	 * Schedule one bounded worker, respecting the site's service cooldown.
	 *
	 * @param int $delay Seconds until work may run.
	 */
	public static function schedule( $delay = 300 ) {
		$when = max( time() + $delay, (int) get_option( self::COOLDOWN_OPTION, 0 ) );
		$next = wp_next_scheduled( self::HOOK );
		if ( ! $next || $next > $when ) {
			if ( $next ) {
				wp_unschedule_event( $next, self::HOOK );
			}
			wp_schedule_single_event( $when, self::HOOK );
		}
	}

	/**
	 * Avoid queue work for passive site changes before the first admission.
	 *
	 * @since $$next-version$$
	 */
	public static function clear_if_used() {
		if ( self::row( self::GENERATION_OPTION ) ) {
			self::clear();
		}
	}

	/** Discard pending work without depending on the current admission limit. */
	public static function clear() {
		if ( ( new Host() )->is_vip_site() || ! Initializer::is_available() ) {
			return;
		}
		$generation = wp_generate_uuid4();
		update_option( self::GENERATION_OPTION, $generation, false );
		$after = '';
		$rows  = self::rows();
		while ( $rows ) {
			$stale = array();
			foreach ( $rows as $row ) {
				$after = $row['option_name'];
				if ( ( json_decode( $row['option_value'], true )['generation'] ?? '' ) !== $generation ) {
					$stale[] = $row;
				}
			}
			if ( $stale ) {
				self::delete_rows( $stale, $generation );
			}
			if ( self::generation() !== $generation ) {
				return;
			}
			$rows = self::rows( self::PAGE_SIZE, $after );
		}
		$history = array();
		foreach ( array( self::CURSOR_OPTION, self::COOLDOWN_OPTION, self::STATUS_OPTION, self::ACCEPTED_OPTION, 'jetpack_seo_indexnow_enqueue_error' ) as $option ) {
			$row = self::row( $option );
			if ( ! $row ) {
				continue;
			}
			$receipt = maybe_unserialize( $row['option_value'] );
			if ( self::ACCEPTED_OPTION === $option && is_array( $receipt ) && 'accepted' === ( $receipt['state'] ?? '' ) && Indexnow_Client::matches_scope( get_option( Indexnow_Client::SCOPE_OPTION, '' ) ) ) {
				continue;
			}
			$history[] = $row;
		}
		if ( $history ) {
			self::delete_rows( $history, $generation );
			self::invalidate_summary_cache( array_column( $history, 'option_name' ) );
		}
		wp_clear_scheduled_hook( self::HOOK );
		wp_clear_scheduled_hook( self::RECOVERY_HOOK );
		if ( self::rows( 1 ) && Indexnow_Client::enabled() ) {
			self::ensure_recovery();
			self::schedule();
		}
	}

	/**
	 * Preserve received status separately from later failed attempts.
	 *
	 * @param array  $status Delivery summary without URL payloads.
	 * @param string $generation Queue generation that produced the summary.
	 */
	private static function record_status( $status, $generation ) {
		if ( in_array( $status['state'], array( 'accepted', 'verification_pending' ), true ) ) {
			self::store_status_option(
				self::ACCEPTED_OPTION,
				array(
					'time'  => $status['time'],
					'count' => $status['count'],
					'state' => $status['state'],
				),
				$generation
			);
		}
		self::store_status_option( self::STATUS_OPTION, $status, $generation );
	}

	/**
	 * Store worker state only while its queue generation still exists.
	 *
	 * @param string $name Status option name.
	 * @param mixed  $value Status value.
	 * @param string $generation Queue generation that produced this value.
	 */
	private static function store_status_option( $name, $value, $generation ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- The same-statement fence prevents a reset from being followed by an obsolete status write.
		$wpdb->query( $wpdb->prepare( "INSERT INTO $wpdb->options (option_name, option_value, autoload) SELECT %s, %s, 'no' FROM DUAL WHERE EXISTS (SELECT 1 FROM $wpdb->options WHERE option_name = %s AND option_value = %s) ON DUPLICATE KEY UPDATE option_value = VALUES(option_value), autoload = 'no'", $name, maybe_serialize( $value ), self::GENERATION_OPTION, $generation ) );
		wp_cache_delete( $name, 'options' );
		wp_cache_delete( 'notoptions', 'options' );
		self::invalidate_summary_cache( array( $name ) );
	}

	/**
	 * Preserve the shared cache on hosts that cache only autoloaded options.
	 *
	 * @param string[] $names Changed summary options.
	 */
	private static function invalidate_summary_cache( $names ) {
		$cached = wp_cache_get( 'alloptions', 'options' );
		if ( ( new Host() )->is_wpcom_simple() || array_intersect_key( (array) $cached, array_fill_keys( $names, true ) ) ) {
			wp_cache_delete( 'alloptions', 'options' );
		}
	}

	/** Process a bounded sweep with an expiring worker lock. */
	public static function work() {
		if ( ( new Host() )->is_vip_site() || ! Initializer::is_available() || ! apply_filters( 'jetpack_seo_indexnow_can_notify', true ) || Seo_Tools::is_disabled() ) {
			return;
		}
		if ( ! Indexnow_Client::enabled() ) {
			self::clear();
			return;
		}
		$cooldown = (int) get_option( self::COOLDOWN_OPTION, 0 );
		if ( $cooldown > time() ) {
			self::schedule( $cooldown - time() );
			return;
		}
		$lock = self::lock( self::WORKER_LOCK );
		if ( ! $lock ) {
			return;
		}
		try {
			$generation = self::generation();
			if ( null === $generation ) {
				self::schedule( 60 );
				return;
			}
			$cursor          = (string) get_option( self::CURSOR_OPTION, '' );
			$claimed         = array();
			$claimed_bytes   = 0;
			$deadline        = microtime( true ) + 20;
			$expired         = 0;
			$budget          = max( self::SCAN_LIMIT, Indexnow_Client::batch_size() );
			$started_at_head = '' === $cursor;
			$complete        = false;
			$earliest_due    = PHP_INT_MAX;
			$claimed_count   = 0;
			while ( $budget > 0 && microtime( true ) < $deadline && $claimed_count < Indexnow_Client::batch_size() ) {
				$rows = self::rows( min( self::PAGE_SIZE, $budget ), $cursor );
				if ( ! $rows ) {
					$cursor   = '';
					$complete = true;
					break;
				}
				foreach ( $rows as $row ) {
					--$budget;
					$previous_cursor = $cursor;
					$cursor          = $row['option_name'];
					$item            = json_decode( $row['option_value'], true );
					if ( ! is_array( $item ) || ( $item['created'] ?? 0 ) < time() - 2 * DAY_IN_SECONDS ) {
						$expired += self::compare_and_swap( $row, null ) ? 1 : 0;
						continue;
					}
					if ( ! Indexnow_Client::matches_scope( $item['scope'] ?? '' ) || ( isset( $item['url'] ) && ! Indexnow_Client::in_scope( $item['url'] ) ) ) {
						self::compare_and_swap( $row, null );
						continue;
					}
					$earliest_due = min( $earliest_due, $item['due'] );
					if ( $item['due'] > time() ) {
						continue;
					}
					$resolved = self::resolve( $item );
					if ( ( $item['generation'] ?? '0' ) !== $generation || ! $resolved ) {
						self::compare_and_swap( $row, null );
						continue;
					}
					$bytes = self::notification_bytes( $row['option_value'], $item, $resolved );
					if ( $claimed_bytes + $bytes > self::BATCH_BYTES ) {
						$cursor = $previous_cursor;
						break 2;
					}
					$claimed_bytes += $bytes;
					$claimed[]      = $row;
					++$claimed_count;
					if ( count( $claimed ) >= Indexnow_Client::batch_size() ) {
						break;
					}
				}
			}
			update_option( self::CURSOR_OPTION, $cursor, false );
			if ( $claimed ) {
				global $wpdb;
				$names        = array_column( $claimed, 'option_name' );
				$placeholders = implode( ', ', array_fill( 0, count( $names ), '%s' ) );
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- Only placeholders are interpolated; names are bound below.
				$fresh    = $wpdb->get_results( $wpdb->prepare( "SELECT option_name, option_value FROM $wpdb->options WHERE option_name IN ($placeholders)", $names ), ARRAY_A );
				$versions = array_column( is_array( $fresh ) ? $fresh : array(), 'option_value', 'option_name' );
				$valid    = array();
				$bytes    = 0;
				foreach ( $claimed as $row ) {
					$item = json_decode( $row['option_value'], true );
					if ( ( $versions[ $row['option_name'] ] ?? null ) === $row['option_value'] && ( $item['generation'] ?? '0' ) === $generation ) {
						$url = self::resolve( $item );
						if ( $url ) {
							$size = self::notification_bytes( $row['option_value'], $item, $url );
							if ( $bytes + $size > self::BATCH_BYTES ) {
								break;
							}
							$bytes              += $size;
							$row['resolved_url'] = $url;
							$valid[]             = $row;
						}
					}
				}
				$claimed = $valid;
			}
			if ( $claimed && Indexnow_Client::enabled() && self::row( self::WORKER_LOCK ) === $lock && self::generation() === $generation ) {
				$urls          = array_values(
					array_unique(
						array_map(
							static function ( $row ) {
								return $row['resolved_url'];
							},
							$claimed
						)
					)
				);
				$enqueue_error = self::row( 'jetpack_seo_indexnow_enqueue_error' );
				$result        = Indexnow_Client::submit( $urls );
				if ( self::generation() !== $generation || ! Indexnow_Client::enabled() ) {
					return;
				}
				$exhausted = 0;
				$retrying  = 0;
				$dropped   = 0;
				if ( $enqueue_error && in_array( $result['state'], array( 'accepted', 'verification_pending' ), true ) ) {
					self::delete_rows( array( $enqueue_error ), $generation );
					self::invalidate_summary_cache( array( 'jetpack_seo_indexnow_enqueue_error' ) );
				}
				$now = time();
				if ( 'http_429' === $result['state'] ) {
					self::store_status_option( self::COOLDOWN_OPTION, $now + max( 600, $result['retry_after'] ?? 0 ), $generation );
				}
				foreach ( $claimed as $row ) {
					$item = (array) json_decode( $row['option_value'], true );
					if ( $result['retry'] && $item['attempt'] < 5 ) {
						++$item['attempt'];
						$item['due']  = $now + max( $result['retry_after'] ?? 0, min( 43200, 60 * pow( 4, $item['attempt'] ) ), 'http_429' === $result['state'] ? 600 : 0 );
						$earliest_due = min( $earliest_due, $item['due'] );
						$retrying    += self::compare_and_swap( $row, $item, $generation ) ? 1 : 0;
					} elseif ( self::compare_and_swap( $row, null ) ) {
							$exhausted += $result['retry'] ? 1 : 0;
							$dropped   += ! $result['retry'] && ! in_array( $result['state'], array( 'accepted', 'verification_pending' ), true ) ? 1 : 0;
					}
				}
				self::record_status(
					array(
						'state'     => $result['state'],
						'time'      => time(),
						'count'     => count( $urls ),
						'expired'   => $expired,
						'exhausted' => $exhausted,
						'retrying'  => $retrying,
						'dropped'   => $dropped,
					),
					$generation
				);
			} elseif ( $expired ) {
				self::record_status(
					array(
						'state'   => 'expired',
						'time'    => time(),
						'count'   => 0,
						'expired' => $expired,
					),
					$generation
				);
			}
			if ( self::rows( 1 ) ) {
				$delay = $started_at_head && $complete && ! $claimed && PHP_INT_MAX !== $earliest_due ? max( 30, $earliest_due - time() ) : 30;
				self::schedule( $delay );
			}
		} finally {
			self::compare_and_swap( $lock, null );
		}
	}

	/**
	 * Include a resolved URL in the worker's retained-payload budget.
	 *
	 * @param string $value Encoded notification.
	 * @param array  $item Decoded notification.
	 * @param string $url Resolved public URL.
	 * @return int
	 */
	private static function notification_bytes( $value, $item, $url ) {
		return strlen( $value ) + ( isset( $item['url'] ) ? 0 : strlen( wp_json_encode( $url, JSON_UNESCAPED_SLASHES ) ) + 7 );
	}

	/**
	 * Resolve a currently eligible discovery or removal URL.
	 *
	 * @param array $item Stored notification.
	 * @return string
	 */
	private static function resolve( $item ) {
		$post_id = (int) ( $item['post'] ?? 0 );
		if ( $post_id < 1 ) {
			return '';
		}
		$post = get_post( $post_id );
		if ( ! empty( $item['deleted'] ) ) {
			return Indexnow_Events::removal_allowed( $post ) ? ( $item['url'] ?? '' ) : '';
		}
		if ( ! Indexnow_Events::eligible( $post, $item['url'] ?? '' ) ) {
			return '';
		}
		$url = $item['url'] ?? get_permalink( $post );
		return Indexnow_Client::in_scope( $url ) ? $url : '';
	}
}
