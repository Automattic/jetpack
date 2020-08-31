<?php
/**
 * The nonce handler.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The nonce handler.
 */
class Nonce_Handler {

	/**
	 * The nonces used during the request are stored here to keep them valid.
	 *
	 * @var array
	 */
	private static $nonces_used_this_request = array();

	/**
	 * Adds a used nonce to a list of known nonces.
	 *
	 * @param int    $timestamp the current request timestamp.
	 * @param string $nonce the nonce value.
	 * @return bool whether the nonce is unique or not.
	 */
	public static function add( $timestamp, $nonce ) {
		global $wpdb;

		if ( isset( static::$nonces_used_this_request[ "$timestamp:$nonce" ] ) ) {
			return static::$nonces_used_this_request[ "$timestamp:$nonce" ];
		}

		// This should always have gone through Jetpack_Signature::sign_request() first to check $timestamp an $nonce.
		$timestamp = (int) $timestamp;
		$nonce     = esc_sql( $nonce );

		// Raw query so we can avoid races: add_option will also update.
		$show_errors = $wpdb->show_errors( false );

		$old_nonce = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM `$wpdb->options` WHERE option_name = %s", "jetpack_nonce_{$timestamp}_{$nonce}" )
		);

		if ( is_null( $old_nonce ) ) {
			$return = (bool) $wpdb->query(
				$wpdb->prepare(
					"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
					"jetpack_nonce_{$timestamp}_{$nonce}",
					time(),
					'no'
				)
			);
		} else {
			$return = false;
		}

		$wpdb->show_errors( $show_errors );

		static::$nonces_used_this_request[ "$timestamp:$nonce" ] = $return;

		return $return;
	}

	/**
	 * Cleans nonces that were saved when calling ::add_nonce.
	 *
	 * @param bool $all whether to clean even non-expired nonces.
	 */
	public static function clean( $all = false ) {
		global $wpdb;

		$sql      = "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE %s";
		$sql_args = array( $wpdb->esc_like( 'jetpack_nonce_' ) . '%' );

		if ( true !== $all ) {
			$sql       .= ' AND CAST( `option_value` AS UNSIGNED ) < %d';
			$sql_args[] = time() - 3600;
		}

		$sql .= ' ORDER BY `option_id` LIMIT 100';

		$sql = $wpdb->prepare( $sql, $sql_args ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		for ( $i = 0; $i < 1000; $i++ ) {
			if ( ! $wpdb->query( $sql ) ) { // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				break;
			}
		}
	}

	/**
	 * Clean the cached nonces valid during the current request, therefore making them invalid.
	 *
	 * @return bool
	 */
	public static function invalidate_request_nonces() {
		static::$nonces_used_this_request = array();

		return true;
	}

}
