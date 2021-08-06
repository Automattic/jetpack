<?php
/**
 * Base abstract class for cacheable value objects.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Cacheable.
 */
abstract class Cacheable implements \JsonSerializable {

	/**
	 * Default cache expiry.
	 */
	const DEFAULT_EXPIRY = 300; // 5 minutes.

	/**
	 * The ID of this object, if cached as a transient.
	 *
	 * @var string|null $cache_id Cache id.
	 */
	private $cache_id;

	/**
	 * Store the object.
	 *
	 * @param int $expiry Expiry in seconds.
	 *
	 * @return mixed|void
	 */
	public function store( $expiry = self::DEFAULT_EXPIRY ) {
		if ( ! $this->cache_id ) {
			$this->cache_id = $this->generate_cache_id();
		}

		Transient::set(
			static::cache_prefix() . $this->cache_id,
			$this->jsonSerialize(),
			$expiry
		);

		return $this->cache_id;
	}

	/**
	 * Default implementation for generating cache key. Generates a random ASCII string.
	 */
	protected function generate_cache_id() {
		return wp_generate_password( 20, false );
	}

	/**
	 * This is intended to be the reverse of JsonSerializable->jsonSerialize.
	 *
	 * @param mixed $data The data to convert into an object.
	 */
	abstract public static function jsonUnserialize( $data );

	/**
	 * Fetch an object with the given ID.
	 *
	 * @param string $id The object ID.
	 *
	 * @return null|mixed
	 */
	public static function get( $id ) {
		$data = Transient::get( static::cache_prefix() . $id, false );
		if ( ! $data ) {
			return null;
		}
		$class  = get_called_class();
		$object = $class::jsonUnserialize( $data, $id );
		if ( $object ) {
			$object->set_cache_id( $id );
		}

		return $object;
	}

	/**
	 * Set cache id.
	 *
	 * This is here so we know how this object was loaded.
	 *
	 * @param string $cache_id Cache id.
	 */
	public function set_cache_id( $cache_id ) {
		$this->cache_id = $cache_id;
	}

	/**
	 * Getter for the cache ID.
	 *
	 * @return string
	 */
	public function get_cache_id() {
		return $this->cache_id;
	}

	/**
	 * Delete the cache entry.
	 */
	public function delete() {
		$this->cache_id && static::delete_by_cache_id( $this->cache_id );
	}

	/**
	 * Delete the cache entry for the given cache id.
	 *
	 * @param string $cache_id The cache ID.
	 */
	public static function delete_by_cache_id( $cache_id ) {
		Transient::delete( static::cache_prefix() . $cache_id );
	}

	/**
	 * Returns the cache prefix
	 *
	 * @return string The cache prefix
	 */
	abstract protected static function cache_prefix();
}
