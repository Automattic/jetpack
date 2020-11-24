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
	 *
	 * @access public
	 *
	 * @var int
	 */
	const LOCK_TRANSIENT_EXPIRY = 15; // Seconds.

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
		update_option( $name, microtime( true ) + $expiry );

		return true;
	}

	/**
	 * Remove the lock.
	 *
	 * @access public
	 *
	 * @param string $name lock name.
	 */
	public function remove( $name ) {
		delete_option( self::LOCK_PREFIX . $name );
	}
}
