<?php
/**
 * Configuration Manager for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Jetpack_Boost;

require_once __DIR__ . '/class-cacheable.php';

/**
 * Class Config
 *
 * Value object for configuration.
 *
 * When caching, this serializes the whole Jetpack Boost configuration for the site and generates an ID.
 *
 * If an empty ID is supplied, it stores and saves in the options table.
 *
 * This ID can be used to respond to requests using a specific configuration, without affecting the whole
 * configuration of the site.
 *
 * @todo Impose a schema
 */
class Config extends Cacheable {
	/**
	 * The nested configuration array.
	 *
	 * @var mixed $config The config.
	 */
	private $data;

	/**
	 * The option name to store this config in.
	 *
	 * @var string $option_name The option name.
	 */
	private $option_name;

	/**
	 * Create the config object.
	 *
	 * @param mixed $data        The config.
	 * @param null  $option_name The option name.
	 */
	public function __construct( $data, $option_name = null ) {
		$this->data        = $data;
		$this->option_name = $option_name;
	}

	/**
	 * Convert this object to a plain array for JSON serialization.
	 *
	 * @return array The object as an array.
	 */
	public function jsonSerialize() {
		return array_merge( array( 'id' => $this->get_cache_id() ), $this->data );
	}

	/**
	 * This is intended to be the reverse of JsonSerializable->jsonSerialize.
	 *
	 * @param mixed $data The data to turn into an object.
	 *
	 * @return Config
	 */
	public static function jsonUnserialize( $data ) {
		$object = new Config( $data );
		if ( ! empty( $data['id'] ) ) {
			$object->set_cache_id( $data['id'] );
		}

		return $object;
	}

	/**
	 * Generate a cache key for the given config ID.
	 *
	 * @return string
	 */
	protected static function cache_prefix() {
		return 'jetpack_boost_config_';
	}

	/**
	 * Check is config data is empty.
	 *
	 * @return bool
	 */
	public function is_empty() {
		return empty( $this->data );
	}

	/**
	 * Gets a value from the configuration. Allows for config traversal and supports default values.
	 *
	 * @param string $key     Key name, sub-items separated by '/'.
	 * @param mixed  $default Default value to be returned when no config value is found.
	 *
	 * @return mixed Value from config.
	 */
	public function get_value( $key, $default = null ) {
		$path = array_filter( explode( '/', $key ) );

		$config = $this->data;

		foreach ( $path as $config_key ) {
			if ( ! isset( $config[ $config_key ] ) ) {
				return $default;
			}
			$config = &$config[ $config_key ];
		}

		return $config;
	}

	/**
	 * Sets a value in the configuration. Allows for config traversal with slashes.
	 *
	 * @param string $key         Key name, sub-items separated by '/'.
	 * @param mixed  $value       The value to set.
	 * @param bool   $auto_create Whether or not to auto create the value.
	 *
	 * @return bool The value that was set.
	 * @throws \Error Throw an error if value is not in array.
	 */
	public function set_value( $key, $value, $auto_create = false ) {
		$temp = &$this->data;
		$path = array_filter( explode( '/', $key ) );

		foreach ( $path as $key_part ) {
			if ( ! is_array( $temp ) ) {
				throw new \Error( "$key_part does not point to array in $key" );
			}
			if ( $auto_create && ! isset( $temp[ $key_part ] ) ) {
				$temp[ $key_part ] = array();
			}
			$temp = &$temp[ $key_part ];
		}

		$temp = $value;

		return $this->store_in_option();
	}

	/**
	 * Store the object.
	 *
	 * @param int $expiry Expiry in seconds.
	 *
	 * @return mixed|void
	 */
	public function store( $expiry = self::DEFAULT_EXPIRY ) {
		if ( Jetpack_Boost::CURRENT_CONFIG_ID === $this->config_id ) {
			$this->store_in_option();
		}

		return parent::store( $expiry );
	}

	/**
	 * Fetch an object with the given ID.
	 *
	 * @param string $id The object ID.
	 *
	 * @return \WP_Error|mixed
	 */
	public static function get( $id ) {
		if ( Jetpack_Boost::CURRENT_CONFIG_ID === $id ) {
			$option_name = apply_filters( 'jetpack_boost_options_store_key_name', 'jetpack_boost_config' );

			return self::get_from_option( $option_name );
		}

		return parent::get( $id );
	}

	/**
	 * Extra functions to store and retrieve in the options table.
	 */

	/**
	 * Store this configuration in an option.
	 *
	 * @return bool
	 * @throws \Error Error if the option name is not set.
	 */
	private function store_in_option() {
		// @todo - serialize as JSON to match cache entries?
		if ( ! $this->option_name ) {
			throw new \Error( 'Cannot save config that was not loaded from an option' );
		}

		return update_option( $this->option_name, $this->data, false );
	}

	/**
	 * Fetch this configuration from an option.
	 *
	 * @param string $option_name The option to store it in.
	 *
	 * @return Config
	 */
	private static function get_from_option( $option_name ) {
		$option_value = \get_option( $option_name, array() );

		// @todo - unserialize from JSON to match cache entries?
		return new Config( $option_value, $option_name );
	}

	/**
	 * Set data.
	 *
	 * @param mixed $data Data.
	 *
	 * @return bool
	 */
	public function set_data( $data ) {
		$this->data = $data;

		return $this->store_in_option();
	}

	/**
	 * Reset all settings to defaults.
	 */
	public function reset() {
		$this->set_data( Jetpack_Boost::get_default_config_array() );
	}

	/**
	 * Get the data.
	 *
	 * @return mixed
	 */
	public function get_data() {
		return $this->data;
	}
}
