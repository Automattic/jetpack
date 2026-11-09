<?php
/**
 * Short locks between requests.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- A lock must read the database, never a cache.

/**
 * One options row per lock, taken with `INSERT IGNORE` the way core's upgrader takes its own.
 * `add_option()` isn't a lock: it's an upsert, so two requests could both get it.
 */
class Lock {

	/**
	 * Option name prefix; the lock's name is appended.
	 *
	 * @var string
	 */
	const PREFIX = 'jetpack_send_lock_';

	/**
	 * Take a lock, or replace one older than its stale time.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $name        Lock name, e.g. `upgrade` or `resend_12`.
	 * @param int    $stale_after Seconds after which a lock left by a request that died can be taken over.
	 * @return bool Whether this request holds the lock now.
	 */
	public static function acquire( $name, $stale_after ) {
		global $wpdb;
		$option = self::option_name( $name );
		$now    = time();

		$result = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO %i ( option_name, option_value, autoload ) VALUES ( %s, %s, 'off' )", $wpdb->options, $option, (string) $now ) );
		if ( false !== $result && (int) $wpdb->rows_affected > 0 ) {
			return true;
		}

		$held = $wpdb->get_var( $wpdb->prepare( 'SELECT option_value FROM %i WHERE option_name = %s', $wpdb->options, $option ) );
		if ( null === $held || (int) $held > $now - (int) $stale_after ) {
			return false;
		}
		// Only one request can swap out the stale time it read.
		$result = $wpdb->query( $wpdb->prepare( 'UPDATE %i SET option_value = %s WHERE option_name = %s AND option_value = %s', $wpdb->options, (string) $now, $option, (string) $held ) );
		return false !== $result && (int) $wpdb->rows_affected > 0;
	}

	/**
	 * Give a lock back.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $name Lock name.
	 * @return void
	 */
	public static function release( $name ) {
		global $wpdb;
		$wpdb->delete( $wpdb->options, array( 'option_name' => self::option_name( $name ) ) );
	}

	/**
	 * Remove every Send lock (uninstall).
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function delete_all() {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE option_name LIKE %s', $wpdb->options, $wpdb->esc_like( self::PREFIX ) . '%' ) );
	}

	/**
	 * The option that holds a lock.
	 *
	 * @param string $name Lock name.
	 * @return string
	 */
	public static function option_name( $name ) {
		return self::PREFIX . preg_replace( '/[^a-z0-9_]/', '', strtolower( (string) $name ) );
	}
}
