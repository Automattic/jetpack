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
	const LOCK_TRANSIENT_EXPIRY = 180; // Seconds.

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

		global $wpdb;
		$name = self::LOCK_PREFIX . $name;

		// Options API is explicitly bypassed. This is because with high concurrency request to the
		// site multiple processes would pass checks and send concurrent data to WP.

		$row         = $wpdb->get_row( $wpdb->prepare( "SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1", $name ) );
		$locked_time = false;
		if ( is_object( $row ) ) {
			$locked_time = $row->option_value;
		}

		if ( $locked_time ) {
			if ( microtime( true ) < $locked_time ) {
				return false;
			} else {
				// If expired delete but don't send. That will occurr in new request to avoid race conditions.
				$wpdb->delete( $wpdb->options, array( 'option_name' => $name ) );
				return false;
			}
		}
		$locked_time = microtime( true ) + $expiry;
		$result      = $wpdb->query( $wpdb->prepare( "INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload` ) VALUES (%s, %s, %s)", $name, maybe_serialize( $locked_time ), 'no' ) );

		if ( 1 !== $result ) {
			// Insert failed - concurrent requests.
			return false;
		} else {
			return $locked_time;
		}
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
		global $wpdb;

		$name       = self::LOCK_PREFIX . $name;
		$row        = $wpdb->get_row( $wpdb->prepare( "SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1", $name ) );
		$lock_value = false;
		if ( is_object( $row ) ) {
			$lock_value = $row->option_value;
		}

		// Only remove lock if current value matches our lock.
		if ( true === $lock_expiration || (string) $lock_value === (string) $lock_expiration ) {
			$wpdb->delete( $wpdb->options, array( 'option_name' => $name ) );
		}
	}
}
