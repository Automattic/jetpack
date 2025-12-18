<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

class Utils {

	/**
	 * Indicates whether to use the WordPress functions.
	 *
	 * @var bool $use_wp Whether to use WordPress functions.
	 */
	private $use_wp;

	/**
	 * Utils constructor.
	 *
	 * @param bool $use_wp Whether to use WordPress functions. Default is true.
	 */
	public function __construct( $use_wp = true ) {
		$this->use_wp = $use_wp;
	}

	/**
	 * Encodes a value to JSON.
	 *
	 * @param mixed $value   The value to encode.
	 * @param int   $flags   Options to be passed to json_encode(). Default 0.
	 * @param int   $depth   Maximum depth to walk through $value. Must be greater than 0.
	 *
	 * @return string|false The JSON-encoded string, or false on failure.
	 */
	public function json_encode( $value, $flags = 0, $depth = 512 ) {
		if ( $this->use_wp ) {
			return wp_json_encode( $value, $flags, $depth );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		return json_encode( $value, $flags, $depth );
	}

	/**
	 * Removes slashes from a string or an array of strings.
	 *
	 * @param mixed $value The string or array of strings to remove slashes from.
	 *
	 * @return mixed The string or array of strings with slashes removed.
	 */
	public function unslash( $value ) {
		if ( $this->use_wp ) {
			return wp_unslash( $value );
		}

		return is_string( $value ) ? stripslashes( $value ) : $value;
	}

	/**
	 * Parses a URL and returns its components.
	 *
	 * @param string $url       The URL to parse.
	 * @param int    $component Optional. The specific component to retrieve.
	 *                          Use one of the PHP_URL_* constants. Default is -1 (all components).
	 *
	 * @return mixed|array|string|null The parsed URL component(s), or the entire URL string if $component is -1.
	 */
	public function parse_url( $url, $component = -1 ) {
		if ( $this->use_wp ) {
			return wp_parse_url( $url, $component );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		return parse_url( $url, $component );
	}
}
