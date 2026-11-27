<?php
/**
 * Locks held while a proposal changes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals;

use WP_Error;

/**
 * Option-row locks: one per proposal, and one per target while an apply writes it. Released at shutdown if a request dies holding them.
 *
 * Locks never expire, since expiring a running apply's lock would let two run at once.
 */
class Proposal_Lock {

	/** Option name prefix for the lock. */
	const OPTION_PREFIX = '_jetpack_proposal_lock_';

	/**
	 * Option names of the locks this request holds.
	 *
	 * @var array<string, true>
	 */
	private static $held = array();

	/**
	 * Whether release_held() runs at shutdown.
	 *
	 * @var bool
	 */
	private static $releases_on_shutdown = false;

	/**
	 * The option that holds a proposal's lock.
	 *
	 * @param int $proposal_id Proposal ID.
	 */
	public static function option_name( int $proposal_id ): string {
		return self::OPTION_PREFIX . $proposal_id;
	}

	/**
	 * The option that holds a target's lock, such as for 'post:12'. Hashed, since handlers choose target keys.
	 *
	 * @param string $target Target key from a handler's targets().
	 */
	public static function target_option_name( string $target ): string {
		return self::OPTION_PREFIX . 'target_' . md5( $target );
	}

	/**
	 * Take the lock, recording who holds it.
	 *
	 * @param int $proposal_id Proposal ID.
	 * @return bool Whether the lock was taken.
	 */
	public static function acquire( int $proposal_id ): bool {
		return self::acquire_option( self::option_name( $proposal_id ) );
	}

	/**
	 * Release a lock this request holds.
	 *
	 * @param int $proposal_id Proposal ID.
	 */
	public static function release( int $proposal_id ): void {
		self::release_option( self::option_name( $proposal_id ) );
	}

	/**
	 * Release every lock this request still holds. Public only as a shutdown callback.
	 */
	public static function release_held(): void {
		foreach ( array_keys( self::$held ) as $name ) {
			self::release_option( $name );
		}
	}

	/**
	 * Release every lock this request holds when WordPress's fatal error handler runs. Public only as a filter callback.
	 *
	 * @param mixed $message The error message, returned unchanged.
	 * @return mixed
	 */
	public static function release_held_on_fatal( $message ) {
		self::release_held();
		return $message;
	}

	/**
	 * Whether anyone holds the lock.
	 *
	 * @param int $proposal_id Proposal ID.
	 */
	public static function is_held( int $proposal_id ): bool {
		return null !== self::read_holder( self::option_name( $proposal_id ) );
	}

	/**
	 * Run a callback under the proposal's lock.
	 *
	 * @param int      $proposal_id Proposal ID.
	 * @param callable $callback    Work to do.
	 * @return mixed|WP_Error The callback's result, or proposal_locked.
	 */
	public static function with_lock( int $proposal_id, callable $callback ) {
		$name = self::option_name( $proposal_id );
		$busy = self::take( $name, 'Nothing was changed: another request is changing this proposal (started %s ago). Try again once it finishes.' );
		if ( $busy ) {
			return $busy;
		}
		try {
			return $callback();
		} finally {
			self::release_option( $name );
		}
	}

	/**
	 * Run a callback holding the lock of every target, so two proposals cannot write the same content at once.
	 *
	 * @param string[] $targets  Target keys from the handlers' targets().
	 * @param callable $callback Work to do.
	 * @return mixed|WP_Error The callback's result, or proposal_locked.
	 */
	public static function with_target_locks( array $targets, callable $callback ) {
		$taken = array();
		try {
			foreach ( array_unique( $targets ) as $target ) {
				$name = self::target_option_name( $target );
				$busy = self::take( $name, 'Nothing was applied: another proposal for the same content is being applied (started %s ago). Read this proposal again once it finishes.' );
				if ( $busy ) {
					return $busy;
				}
				$taken[] = $name;
			}
			return $callback();
		} finally {
			foreach ( $taken as $name ) {
				self::release_option( $name );
			}
		}
	}

	/**
	 * Insert the lock row, recording who holds it.
	 *
	 * @param string $name Option name.
	 * @return bool Whether this request took the lock.
	 */
	private static function acquire_option( string $name ): bool {
		$holder = array(
			'started_at' => time(),
			'user_id'    => get_current_user_id(),
			'host'       => (string) gethostname(),
		);
		global $wpdb;
		// Not add_option(): its INSERT … ON DUPLICATE KEY UPDATE lets two racing requests both succeed.
		$inserted = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $name, maybe_serialize( $holder ) ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		if ( 1 !== $inserted ) {
			return false;
		}

		if ( ! self::$releases_on_shutdown ) {
			self::$releases_on_shutdown = true;
			register_shutdown_function( array( __CLASS__, 'release_held' ) );
		}
		// WordPress's fatal error handler runs first at shutdown and can exit, which skips the function above.
		if ( ! has_filter( 'wp_php_error_message', array( __CLASS__, 'release_held_on_fatal' ) ) ) {
			add_filter( 'wp_php_error_message', array( __CLASS__, 'release_held_on_fatal' ) );
		}
		self::$held[ $name ] = true;
		return true;
	}

	/**
	 * Delete a lock row.
	 *
	 * @param string $name Option name.
	 */
	private static function release_option( string $name ): void {
		unset( self::$held[ $name ] );
		delete_option( $name );
	}

	/**
	 * The lock row's value, read from the database: the option caches can be stale for rows other requests write.
	 *
	 * @param string $name Option name.
	 * @return mixed|null The holder, or null when no row exists.
	 */
	private static function read_holder( string $name ) {
		global $wpdb;
		$value = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $name ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return null === $value ? null : maybe_unserialize( $value );
	}

	/**
	 * Take a lock, or say why not.
	 *
	 * @param string $name    Option name.
	 * @param string $message Message with a %s for how long ago the holder started.
	 * @return WP_Error|null Null once taken, otherwise proposal_locked.
	 */
	private static function take( string $name, string $message ): ?WP_Error {
		if ( self::acquire_option( $name ) ) {
			return null;
		}
		$holder = self::read_holder( $name );
		$since  = human_time_diff( (int) ( is_array( $holder ) ? $holder['started_at'] ?? time() : time() ) );
		return new WP_Error( 'proposal_locked', sprintf( $message, $since ) . sprintf( ' If it has been held for a long time, the request that took it has stopped and a site administrator has to delete the %s option.', $name ) );
	}
}
