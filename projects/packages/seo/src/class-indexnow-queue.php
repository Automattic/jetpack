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
	const PREFIX            = 'jetpack_seo_indexnow_q_';
	const CAPACITY          = 10000;
	const HOOK              = 'jetpack_seo_indexnow_worker';
	const RECOVERY_HOOK     = 'jetpack_seo_indexnow_recovery';
	const STATUS_OPTION     = 'jetpack_seo_indexnow_status';
	const ACCEPTED_OPTION   = 'jetpack_seo_indexnow_last_accepted';
	const GENERATION_OPTION = 'jetpack_seo_indexnow_generation';
	const CURSOR_OPTION     = 'jetpack_seo_indexnow_cursor';
	const COOLDOWN_OPTION   = 'jetpack_seo_indexnow_cooldown';
	const ADMISSION_LOCK    = 'jetpack_seo_indexnow_admission_lock';
	const WORKER_LOCK       = 'jetpack_seo_indexnow_worker_lock';
	const PAGE_SIZE         = 250;
	const SCAN_LIMIT        = 5000;
	const BATCH_BYTES       = 1048576;

	/** Register hooks without selecting a site or scheduling work. */
	public static function init() {
		add_action( 'jetpack_seo_indexnow_url_changed', array( __CLASS__, 'enqueue' ), 10, 3 );
		add_action( 'jetpack_seo_indexnow_post_restricted', array( __CLASS__, 'discard_post' ) );
		add_action( self::HOOK, array( __CLASS__, 'work' ) );
		add_action( self::RECOVERY_HOOK, array( __CLASS__, 'work' ) );
		add_action( 'jetpack_deactivate_module_seo-tools', array( __CLASS__, 'clear' ) );
		add_action( 'update_option_home', array( __CLASS__, 'clear' ) );
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
	 * @param string|null $generation Required queue generation for an admission replacement.
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
	 * @param array $rows Observed rows.
	 * @return int
	 */
	private static function delete_rows( $rows ) {
		global $wpdb;
		$conditions = array();
		$values     = array();
		foreach ( $rows as $row ) {
			$conditions[] = '(option_name = %s AND option_value = %s)';
			$values[]     = $row['option_name'];
			$values[]     = $row['option_value'];
		}
		$where = implode( ' OR ', $conditions );
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
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Other requests cannot invalidate a nonpersistent option cache.
			$inserted = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO $wpdb->options (option_name, option_value, autoload) VALUES (%s, %s, 'no')", $name, $json ) );
			wp_cache_delete( $name, 'options' );
			if ( 1 !== $inserted ) {
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
	 * Admit or replace a URL without scanning pending payloads.
	 *
	 * @param string $url Public URL.
	 * @param int    $post_id Source post ID.
	 * @param bool   $deleted Whether this describes the previous public URL.
	 * @return bool
	 */
	public static function enqueue( $url, $post_id, $deleted = false ) {
		if ( ! Indexnow_Client::enabled() || ! Indexnow_Client::in_scope( $url ) ) {
			return false;
		}
		$generation = self::generation();
		if ( null === $generation ) {
			return false;
		}
		$name = self::PREFIX . hash( 'sha256', $url );
		$item = array(
			'generation' => $generation,
			'url'        => $url,
			'post'       => (int) $post_id,
			'deleted'    => (bool) $deleted,
			'scope'      => home_url( '/' ),
			'version'    => wp_generate_uuid4(),
			'due'        => time() + 300,
			'attempt'    => 0,
			'created'    => time(),
		);
		for ( $attempt = 0; $attempt < 40; ++$attempt ) {
			if ( $attempt && self::generation() !== $generation ) {
				return false;
			}
			$old = self::row( $name );
			if ( $old ) {
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
					if ( self::row( $name ) ) {
						continue;
					}
					if ( self::size() >= self::capacity() ) {
						break;
					}
					global $wpdb;
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Fence inserts against replacement of an expired admission lock.
					$added = $wpdb->query( $wpdb->prepare( "INSERT INTO $wpdb->options (option_name, option_value, autoload) SELECT %s, %s, 'no' WHERE EXISTS (SELECT 1 FROM $wpdb->options WHERE option_name = %s AND option_value = %s) AND EXISTS (SELECT 1 FROM $wpdb->options WHERE option_name = %s AND option_value = %s)", $name, wp_json_encode( $item, JSON_UNESCAPED_SLASHES ), $lock['option_name'], $lock['option_value'], self::GENERATION_OPTION, $generation ) );
					wp_cache_delete( $name, 'options' );
					if ( 1 !== $added ) {
						continue;
					}
				} finally {
					self::compare_and_swap( $lock, null );
				}
			}
			self::ensure_recovery();
			self::schedule();
			return true;
		}
		update_option(
			'jetpack_seo_indexnow_enqueue_error',
			array(
				'state' => 'queue_full_or_busy',
				'time'  => time(),
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

	/** Discard pending work without depending on the current admission limit. */
	public static function clear() {
		if ( ( new Host() )->is_vip_site() || ! Initializer::is_available() ) {
			return;
		}
		update_option( self::GENERATION_OPTION, wp_generate_uuid4(), false );
		$rows = self::rows();
		while ( $rows ) {
			$removed = $rows ? self::delete_rows( $rows ) : 0;
			if ( ! $removed ) {
				break;
			}
			$rows = self::rows();
		}
		foreach ( array( self::CURSOR_OPTION, self::COOLDOWN_OPTION ) as $option ) {
			delete_option( $option );
		}
		wp_clear_scheduled_hook( self::HOOK );
		wp_clear_scheduled_hook( self::RECOVERY_HOOK );
	}

	/**
	 * Preserve received status separately from later failed attempts.
	 *
	 * @param array $status Delivery summary without URL payloads.
	 */
	private static function record_status( $status ) {
		if ( in_array( $status['state'], array( 'accepted', 'verification_pending' ), true ) ) {
			update_option(
				self::ACCEPTED_OPTION,
				array(
					'time'  => $status['time'],
					'count' => $status['count'],
					'state' => $status['state'],
				),
				false
			);
		}
		update_option( self::STATUS_OPTION, $status, false );
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
					if ( ( $item['scope'] ?? '' ) !== home_url( '/' ) || ! Indexnow_Client::in_scope( $item['url'] ?? '' ) ) {
						self::compare_and_swap( $row, null );
						continue;
					}
					$earliest_due = min( $earliest_due, $item['due'] );
					if ( $item['due'] > time() ) {
						continue;
					}
					if ( ( $item['generation'] ?? '0' ) !== $generation || ! self::eligible( $item ) ) {
						self::compare_and_swap( $row, null );
						continue;
					}
					if ( $claimed_bytes + strlen( $row['option_value'] ) > self::BATCH_BYTES ) {
						$cursor = $previous_cursor;
						break 2;
					}
					$claimed_bytes += strlen( $row['option_value'] );
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
				$claimed  = array_values(
					array_filter(
						$claimed,
						static function ( $row ) use ( $versions, $generation ) {
							return ( $versions[ $row['option_name'] ] ?? null ) === $row['option_value'] && ( json_decode( $row['option_value'], true )['generation'] ?? '0' ) === $generation && self::eligible( json_decode( $row['option_value'], true ) );
						}
					)
				);
			}
			if ( $claimed && Indexnow_Client::enabled() && self::row( self::WORKER_LOCK ) === $lock && self::generation() === $generation ) {
				$urls   = array_map(
					static function ( $row ) {
						$item = (array) json_decode( $row['option_value'], true );
						return $item['url'];
					},
					$claimed
				);
				$result = Indexnow_Client::submit( $urls );
				if ( self::generation() !== $generation || ! Indexnow_Client::enabled() ) {
					return;
				}
				$exhausted = 0;
				if ( 'http_429' === $result['state'] ) {
					update_option( self::COOLDOWN_OPTION, time() + max( 600, $result['retry_after'] ?? 0 ), false );
				}
				foreach ( $claimed as $row ) {
					$item = (array) json_decode( $row['option_value'], true );
					if ( $result['retry'] && $item['attempt'] < 5 ) {
						++$item['attempt'];
						$item['due']  = time() + max( $result['retry_after'] ?? 0, min( 43200, 60 * pow( 4, $item['attempt'] ) ), 'http_429' === $result['state'] ? 600 : 0 );
						$earliest_due = min( $earliest_due, $item['due'] );
						self::compare_and_swap( $row, $item );
					} else {
						$exhausted += $result['retry'] ? 1 : 0;
						self::compare_and_swap( $row, null );
					}
				}
				self::record_status(
					array(
						'state'     => $result['state'],
						'time'      => time(),
						'count'     => count( $claimed ),
						'expired'   => $expired,
						'exhausted' => $exhausted,
					)
				);
			} elseif ( $expired ) {
				self::record_status(
					array(
						'state'   => 'expired',
						'time'    => time(),
						'count'   => 0,
						'expired' => $expired,
					)
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
	 * Check current discovery or removal eligibility.
	 *
	 * @param array $item Stored notification.
	 * @return bool
	 */
	private static function eligible( $item ) {
		$post = get_post( $item['post'] );
		return $item['deleted'] ? Indexnow_Events::removal_allowed( $post ) : Indexnow_Events::eligible( $post, $item['url'] );
	}
}
