<?php
/**
 * Abstract Critical CSS provider class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers;

/**
 * Class Provider
 *
 * @package Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers
 */
abstract class Provider {

	/**
	 * The name of the provider.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string $name The name of the provider
	 */
	protected static $name;

	/**
	 * Each provider must return a list of URLs to generate CSS from.
	 *
	 * @param \WP_Post[] $context_posts The posts to generate CSS from.
	 * @return array
	 */
	abstract public static function get_critical_source_urls( $context_posts = array() );

	/**
	 * What key should this provider look for during the current request?
	 * Used in the front-end to determine where the CSS
	 * might be stored for the current request.
	 *
	 * @return array
	 */
	abstract public static function get_current_storage_keys();

	/**
	 * Returns a list of all keys that this provider can provide, regardless
	 * of the current URL.
	 */
	abstract public static function get_keys();

	/**
	 * Get a human-displayable string describing the given provider key.
	 *
	 * @param string $provider_key the key to describe.
	 */
	abstract public static function describe_key( $provider_key );

	/**
	 * Get the URL of the edit page for the given provider key.
	 *
	 * @param string $provider_key the key to edit.
	 */
	abstract public static function get_edit_url( $provider_key );

	/**
	 * Returns true if the key looks like it belongs to this provider.
	 *
	 * @param boolean $key The key.
	 */
	public static function owns_key( $key ) {
		return strncmp( static::$name, $key, strlen( static::$name ) ) === 0;
	}

	/**
	 * Get the name of the provider.
	 *
	 * @return string
	 */
	public static function get_provider_name() {
		return static::$name;
	}

	/**
	 * Returns the ratio of valid urls from the provider source urls
	 * for the Critical CSS generation to be considered successful.
	 *
	 * @return float|int
	 */
	abstract public static function get_success_ratio();
}
