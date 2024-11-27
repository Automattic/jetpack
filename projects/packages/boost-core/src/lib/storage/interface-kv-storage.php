<?php
/**
 * An interface for key-value storage.
 *
 * @package automattic/jetpack-boost-core
 */

namespace Automattic\Jetpack\Boost_Core\Lib\Storage;

interface KV_Storage {
	/**
	 * Get a value from the storage.
	 *
	 * @param string $key The key to get the value for.
	 * @return mixed The value.
	 */
	public function get( $key );

	/**
	 * Set a value in the storage.
	 *
	 * @param string   $key The key to set the value for.
	 * @param mixed    $value The value to set.
	 * @param int|null $expiry The expiry time in seconds.
	 */
	public function set( $key, $value, $expiry = null );

	/**
	 * Delete a value from the storage.
	 *
	 * @param string $key The key to delete the value for.
	 */
	public function delete( $key );

	/**
	 * Remove all expired values from the storage.
	 *
	 * @return int The number of expired values removed.
	 */
	public function garbage_collect();

	/**
	 * Clear the storage by removing all values.
	 */
	public function clear();
}
