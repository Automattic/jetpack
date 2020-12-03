<?php
/**
 * Functions that mock WordPress core functionality for testing purposes.
 *
 * @package automattic/jetpack-autoloader
 */

if ( ! function_exists( 'trailingslashit' ) ) {

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param String $string string.
	 * @return String
	 */
	function trailingslashit( $string ) {
		return rtrim( $string, '/\\' ) . '/';
	}
}

if ( ! function_exists( 'wp_unslash' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string|string[] $value String or array of strings to unslash.
	 * @return string|string[] Unslashed $value
	 */
	function wp_unslash( $value ) {
		return stripslashes_deep( $value );
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed $value The value to be stripped.
	 * @return mixed Stripped value.
	 */
	function stripslashes_deep( $value ) {
		return map_deep( $value, 'stripslashes_from_strings_only' );
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed    $value    The array, object, or scalar.
	 * @param callable $callback The function to map onto $value.
	 * @return mixed The value with the callback applied to all non-arrays and non-objects inside it.
	 */
	function map_deep( $value, $callback ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $index => $item ) {
				$value[ $index ] = map_deep( $item, $callback );
			}
		} elseif ( is_object( $value ) ) {
			$object_vars = get_object_vars( $value );
			foreach ( $object_vars as $property_name => $property_value ) {
				$value->$property_name = map_deep( $property_value, $callback );
			}
		} else {
			$value = call_user_func( $callback, $value );
		}

		return $value;
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed $value The array or string to be stripped.
	 * @return mixed $value The stripped value.
	 */
	function stripslashes_from_strings_only( $value ) {
		return is_string( $value ) ? stripslashes( $value ) : $value;
	}
}

if ( ! function_exists( 'get_option' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * Note that the `$test_options` global can be used to set options to be returned via this function.
	 *
	 * @param string $option  Name of the option to retrieve. Expected to not be SQL-escaped.
	 * @param mixed  $default Default value to return if the option does not exist.
	 * @return mixed Value set for the option.
	 */
	function get_option( $option, $default = false ) {
		global $test_options;

		if ( isset( $test_options[ $option ] ) ) {
			return $test_options[ $option ];
		}

		return $default;
	}

	/**
	 * Adds an option to be used in tests.
	 *
	 * @param string $option The option to set.
	 * @param mixed  $value The value to set to the option.
	 */
	function add_test_option( $option, $value ) {
		global $test_options;
		$test_options[ $option ] = $value;
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string $option  Name of the option to retrieve. Expected to not be SQL-escaped.
	 * @param mixed  $default Default value to return if the option does not exist.
	 * @return mixed Value set for the option.
	 */
	function get_site_option( $option, $default = false ) {
		global $test_site_options;

		if ( isset( $test_site_options[ $option ] ) ) {
			return $test_site_options[ $option ];
		}

		return $default;
	}

	/**
	 * Adds a site option to be used in tests.
	 *
	 * @param string $option The option to set.
	 * @param mixed  $value The value to set to the option.
	 */
	function add_test_site_option( $option, $value ) {
		global $test_site_options;
		$test_site_options[ $option ] = $value;
	}
}

if ( ! function_exists( 'get_transient' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string $transient The transient to fetch.
	 * @return mixed Transient value.
	 */
	function get_transient( $transient ) {
		global $test_transients;
		if ( ! isset( $test_transients[ $transient ] ) ) {
			return false;
		}

		return $test_transients[ $transient ]['value'];
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string $transient The transient to set.
	 * @param mixed  $value The value to set.
	 * @param int    $expiration The expiration value, 0 for forever.
	 * @return mixed Transient value.
	 */
	function set_transient( $transient, $value, $expiration = 0 ) {
		global $test_transients;
		$test_transients[ $transient ] = array(
			'value'      => $value,
			'expiration' => $expiration,
		);

		return true;
	}
}

if ( ! function_exists( 'path_is_absolute' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string $path File path.
	 *
	 * @return bool True if path is absolute, false is not absolute.
	 */
	function path_is_absolute( $path ) {
		/*
		 * Check to see if the path is a stream and check to see if its an actual
		 * path or file as realpath() does not support stream wrappers.
		 */
		if ( wp_is_stream( $path ) && ( is_dir( $path ) || is_file( $path ) ) ) {
			return true;
		}

		/*
		 * This is definitive if true but fails if $path does not exist or contains
		 * a symbolic link.
		 */
		// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		if ( realpath( $path ) == $path ) {
			return true;
		}

		// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		if ( strlen( $path ) == 0 || '.' === $path[0] ) {
			return false;
		}

		// Windows allows absolute paths like this.
		if ( preg_match( '#^[a-zA-Z]:\\\\#', $path ) ) {
			return true;
		}

		// A path starting with / or \ is absolute; anything else is relative.
		return ( '/' === $path[0] || '\\' === $path[0] );
	}

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param string $path The resource path or URL.
	 *
	 * @return bool True if the path is a stream URL.
	 */
	function wp_is_stream( $path ) {
		$scheme_separator = strpos( $path, '://' );

		if ( false === $scheme_separator ) {
			// $path isn't a stream.
			return false;
		}

		$stream = substr( $path, 0, $scheme_separator );

		return in_array( $stream, stream_get_wrappers(), true );
	}
}

if ( ! function_exists( 'is_multisite' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @return bool
	 */
	function is_multisite() {
		global $test_is_multisite;
		return (bool) $test_is_multisite;
	}

	/**
	 * Sets whether or not we should be testing as multisite.
	 *
	 * @param bool $is_multisite What is returned by `is_multisite()`.
	 */
	function set_test_is_multisite( $is_multisite ) {
		global $test_is_multisite;
		$test_is_multisite = $is_multisite;
	}
}

if ( ! function_exists( 'wp_json_encode' ) ) {
	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param mixed $data    Variable (usually an array or object) to encode as JSON.
	 * @param int   $options Options to be passed to json_encode(). Default 0.
	 * @param int   $depth   Maximum depth to walk through $data. Must be greater than 0.
	 *
	 * @return false|string The JSON encoded string, or false if it cannot be encoded.
	 */
	function wp_json_encode( $data, $options = 0, $depth = 512 ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		return json_encode( $data, $options, $depth );
	}
}

if ( ! function_exists( 'add_action' ) ) {
	/**
	 * A drop-in replacement for a WordPress function.
	 *
	 * @param string   $tag           The name of the action which is hooked.
	 * @param callable $callable      The function to call.
	 * @param int      $priority      Used to specify the priority of the action.
	 * @param int      $accepted_args Used to specify the number of arguments the callable accepts.
	 *
	 * @return true
	 */
	function add_action( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		return add_filter( $tag, $callable, $priority, $accepted_args );
	}

	/**
	 * A drop-in replacement for a WordPress function.
	 *
	 * @param string   $tag           The name of the action which is hooked.
	 * @param callable $callable      The function to call.
	 * @param int      $priority      Used to specify the priority of the action.
	 * @param int      $accepted_args Used to specify the number of arguments the callable accepts.
	 *
	 * @return true
	 */
	function add_filter( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		global $test_filters;

		$test_filters[ $tag ][] = array(
			'callable'      => $callable,
			'priority'      => $priority,
			'accepted_args' => $accepted_args,
		);

		return true;
	}

	/**
	 * A drop-in replacement for a WordPress function.
	 *
	 * @param string   $tag      The name of the action which is hooked.
	 * @param callable $callable The function to call.
	 * @param int      $priority Used to specify the priority of the action.
	 *
	 * @return bool True if removed, false if not.
	 */
	function remove_action( $tag, $callable, $priority = 10 ) {
		return remove_filter( $tag, $callable, $priority );
	}

	/**
	 * A drop-in replacement for a WordPress function.
	 *
	 * @param string   $tag      The name of the filter which is hooked.
	 * @param callable $callable The function to call.
	 * @param int      $priority Used to specify the priority of the filter.
	 *
	 * @return bool True if removed, false if not.
	 */
	function remove_filter( $tag, $callable, $priority = 10 ) {
		global $test_filters;

		if ( ! isset( $test_filters[ $tag ] ) ) {
			return false;
		}

		foreach ( $test_filters[ $tag ] as $key => $record ) {
			if ( $record['callable'] !== $callable ) {
				continue;
			}

			if ( $record['priority'] !== $priority ) {
				continue;
			}

			unset( $test_filters[ $tag ][ $key ] );
			return true;
		}

		return false;
	}

	/**
	 * Checks to see if the given filter has been added.
	 *
	 * @param string   $tag           The name of the action which is hooked.
	 * @param callable $callable      The function to call.
	 * @param int      $priority      Used to specify the priority of the action.
	 * @param int      $accepted_args Used to specify the number of arguments the callable accepts.
	 *
	 * @return bool
	 */
	function test_has_filter( $tag, $callable, $priority = 10, $accepted_args = 1 ) {
		global $test_filters;

		if ( ! isset( $test_filters[ $tag ] ) ) {
			return false;
		}

		foreach ( $test_filters[ $tag ] as $record ) {
			if ( $record['callable'] !== $callable ) {
				continue;
			}

			if ( $record['priority'] !== $priority ) {
				continue;
			}

			if ( $record['accepted_args'] !== $accepted_args ) {
				continue;
			}

			return true;
		}

		return false;
	}
}

/**
 * A function to clean up all of the test data added by the test suite.
 */
function cleanup_test_wordpress_data() {
	global $test_options;
	$test_options = array();
	global $test_site_options;
	$test_site_options = array();
	global $test_is_multisite;
	$test_is_multisite = false;
	global $test_filters;
	$test_filters = array();
	global $test_transients;
	$test_transients = array();
}
