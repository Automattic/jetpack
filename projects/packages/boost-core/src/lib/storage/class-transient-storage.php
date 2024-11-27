<?php
/**
 * Transients for Jetpack Boost.
 *
 * @package automattic/jetpack-boost-core
 */

namespace Automattic\Jetpack\Boost_Core\Lib\Storage;

/**
 * Class Transient
 */
class Transient_Storage implements KV_Storage {

	/**
	 * Global prefix for all transient keys.
	 *
	 * @var string
	 */
	const GLOBAL_PREFIX = 'jb_transient_';

	/**
	 * Additional prefix for transient keys.
	 *
	 * @var string
	 */
	private $prefix;

	/**
	 * Constructor.
	 *
	 * @param string $prefix Optional prefix to prepend to all transient keys.
	 */
	public function __construct( $prefix = '' ) {
		$this->prefix = $prefix;
	}

	/**
	 * Get the key with prefix.
	 *
	 * @param string $key the key to be prefixed.
	 */
	public function key( $key = '' ) {
		return self::GLOBAL_PREFIX . $this->prefix . $key;
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
	public function set( $key, $value, $expiry = YEAR_IN_SECONDS ) {
		$data = array(
			'expire' => time() + $expiry,
			'data'   => $value,
		);
		update_option( $this->key( $key ), $data, false );
	}

	/**
	 * Gets an entry.
	 *
	 * @param string $key     Cache key name.
	 * @param mixed  $default Default value.
	 *
	 * @return mixed
	 */
	public function get( $key, $default = null ) {
		// Ensure everything's there.
		$option = get_option( $this->key( $key ), $default );
		if ( $default === $option || ! isset( $option['expire'] ) || ! isset( $option['data'] )
		) {
			return $default;
		}

		// Maybe expire the result instead of returning it.
		$expire = $option['expire'];
		$data   = $option['data'];
		if ( false !== $expire && $expire < time() ) {
			$this->delete( $key );

			return $default;
		}

		return $data;
	}

	/**
	 * Delete an entry.
	 *
	 * @param string $key Cache key name.
	 *
	 * @return void
	 */
	public function delete( $key ) {
		delete_option( $this->key( $key ) );
	}

	/**
	 * Remove all expired values from the storage.
	 *
	 * @return int The number of expired values removed.
	 */
	public function garbage_collect() {
		global $wpdb;

		/**
		 * The prefix used in option_name.
		 */
		$option_prefix = $this->key();

		/**
		 * LIKE search pattern for the delete query.
		 */
		$prefix_search_pattern = $wpdb->esc_like( $option_prefix ) . '%';

		//phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$options = $wpdb->get_results(
			$wpdb->prepare(
				"
					SELECT option_name, option_value
					FROM   $wpdb->options
					WHERE  `option_name` LIKE %s
				",
				$prefix_search_pattern
			)
		);
		// phpcs:enable

		$count = 0;
		foreach ( $options as $option ) {
			$value = maybe_unserialize( $option->option_value );
			if ( ! isset( $value['expire'] ) || $value['expire'] < time() ) {
				delete_option( $option->option_name );
				++$count;
			}
		}

		return $count;
	}

	/**
	 * Clear all transient values from database.
	 *
	 * @return void
	 */
	public function clear() {
		$this->delete_by_prefix( '' );
	}

	/**
	 * Delete all `Transient` values with certain prefix from database.
	 *
	 * @param string $prefix Cache key prefix.
	 */
	private function delete_by_prefix( $prefix ) {
		global $wpdb;

		/**
		 * The prefix used in option_name.
		 */
		$option_prefix = $this->key( $prefix );

		/**
		 * LIKE search pattern for the delete query.
		 */
		$prefix_search_pattern = $wpdb->esc_like( $option_prefix ) . '%';

		//phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$option_names = $wpdb->get_col(
			$wpdb->prepare(
				"
					SELECT option_name
					FROM   $wpdb->options
					WHERE  `option_name` LIKE %s
				",
				$prefix_search_pattern
			)
		);
		// phpcs:enable

		// Go through each option individually to ensure caches are handled properly.
		foreach ( $option_names as $option_name ) {
			delete_option( $option_name );
		}
	}
}
