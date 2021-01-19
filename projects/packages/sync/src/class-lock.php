<?php
/**
 * Lock class.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Lock class
 */
class Lock {
	/**
	 * Prefix of the blog lock transient.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const LOCK_PREFIX = 'jp_sync_lock_';

	/**
	 * Default Lifetime of the lock.
	 * This is the expiration value as such we are setting it high to handle cases where there are
	 * long running requests. Short expiration value leads to concurrent requests and performance issues.
	 *
	 * @access public
	 *
	 * @var int
	 */
	const LOCK_TRANSIENT_EXPIRY = 300; // Seconds.

	/**
	 * Attempt to lock.
	 *
	 * @access public
	 *
	 * @param string $name lock name.
	 * @param int    $expiry lock duration in seconds.
	 *
	 * @return boolean True if succeeded, false otherwise.
	 */
	public function attempt( $name, $expiry = self::LOCK_TRANSIENT_EXPIRY ) {
		$name        = self::LOCK_PREFIX . $name;
		$locked_time = get_option( $name );

		if ( $locked_time ) {
			if ( microtime( true ) < $locked_time ) {
				return false;
			}
		}
		$locked_time = microtime( true ) + $expiry;
		update_option( $name, $locked_time );

		return $locked_time;
	}

	/**
	 * Remove the lock.
	 *
	 * @access public
	 *
	 * @param string     $name                 lock name.
	 * @param bool|float $lock_expiration lock expiration.
	 */
	public function remove( $name, $lock_expiration = false ) {
		if ( true === $lock_expiration || (string) get_option( self::LOCK_PREFIX . $name ) === (string) $lock_expiration ) {
			delete_option( self::LOCK_PREFIX . $name );
		}
	}
}
