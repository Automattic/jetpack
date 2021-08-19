<?php
/**
 * Transients for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Transient
 */
class Transient {

	const OPTION_PREFIX = 'jb_transient_';

	/**
	 * Get the key with prefix.
	 *
	 * @param string $key the key to be prefixed.
	 */
	public static function key( $key ) {
		return static::OPTION_PREFIX . $key;
	}

	/**
	 * Updates a cache entry. Creates the cache entry if it doesn't exist.
	 *
	 * @param string $key    Cache key name.
	 * @param mixed  $value  Cache value.
	 * @param int    $expiry Cache expiration in seconds.
	 *
	 * @return void
	 */
	public static function set( $key, $value, $expiry = 0 ) {
		if ( 0 === $expiry ) {
			$expiry = YEAR_IN_SECONDS;
		}

		$data = array(
			'expire' => time() + $expiry,
			'data'   => $value,
		);
		update_option( self::key( $key ), $data, false );
	}

	/**
	 * Gets a cache entry.
	 *
	 * @param string $key     Cache key name.
	 * @param mixed  $default Default value.
	 *
	 * @return mixed
	 */
	public static function get( $key, $default = null ) {
		// Ensure everything's there.
		$option = get_option( self::key( $key ), $default );
		if ( $default === $option || ! isset( $option['expire'] ) || ! isset( $option['data'] )
		) {
			return $default;
		}

		// Maybe expire the result instead of returning it.
		$expire = $option['expire'];
		$data   = $option['data'];
		if ( false !== $expire && $expire < time() ) {
			self::delete( $key );

			return $default;
		}

		return $data;
	}

	/**
	 * Find all cache keys by prefix.
	 *
	 * @param string $prefix    Cache key prefix.
	 *
	 * return string[] Array of string representing the keys that match the prefix.
	 */
	public static function find_keys_by_prefix( $prefix ) {
		global $wpdb;

		/**
		 * The prefix used in option_name.
		 */
		$option_prefix = static::key( $prefix );

		/*
		 * Find the length of prefix used by all transients.
		 */
		$transient_prefix_length = strlen( static::OPTION_PREFIX );

		/*
		 * We are looking for all cache entries in the database for supplied cache prefix. As the `Transient` class adds
		 * another prefix before storing the cache in database, we will remove that during the query to return the
		 * proper keys.
		 */
		$keys = $wpdb->get_col(
			$wpdb->prepare(
				"
					SELECT  SUBSTRING(`option_name`, %d)
					FROM    $wpdb->options
					WHERE   `option_name` LIKE %s
				",
				$transient_prefix_length + 1,
				$option_prefix . '%'
			)
		);

		return $keys;
	}

	/**
	 * Delete a cache entry.
	 *
	 * @param string $key Cache key name.
	 *
	 * @return void
	 */
	public static function delete( $key ) {
		delete_option( self::key( $key ) );
	}
}
