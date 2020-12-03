<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles dealing with paths for the autoloader.
 */
class Path_Processor {
	/**
	 * Given a path this will replace any of the path constants with a token to represent it.
	 *
	 * @param string $path The path we want to process.
	 * @return string The tokenized path.
	 */
	public function tokenize_path_constants( $path ) {
		$path = self::normalize( $path );

		$constants = self::get_path_constants();
		foreach ( $constants as $constant => $constant_path ) {
			$len = strlen( $constant_path );
			if ( substr( $path, 0, $len ) !== $constant_path ) {
				continue;
			}

			$path = substr_replace( $path, '{{' . $constant . '}}', 0, $len );
			break;
		}

		return $path;
	}

	/**
	 * Given a path this will replace any of the path constant tokens with the expanded path.
	 *
	 * @param string $path The path we want to process.
	 * @return string The expanded path.
	 */
	public function untokenize_path_constants( $path ) {
		$constants = self::get_path_constants();
		foreach ( $constants as $constant => $constant_path ) {
			$constant = '{{' . $constant . '}}';

			$len = strlen( $constant );
			if ( substr( $path, 0, $len ) !== $constant ) {
				continue;
			}

			$path = substr_replace( $path, $constant_path, 0, $len );
			break;
		}

		return $path;
	}

	/**
	 * Given a file and an array of places it might be, this will find the absolute path and return it.
	 *
	 * @param string $file The plugin or theme file to resolve.
	 * @param array  $directories_to_check The directories we should check for the file if it isn't an absolute path.
	 * @return string|false Returns the absolute path to the directory, otherwise false.
	 */
	public function find_directory_with_autoloader( $file, $directories_to_check ) {
		$file = self::normalize( $file );

		// We need an absolute path to the plugin directory to check for an autoloader.
		if ( path_is_absolute( $file ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$directory = @is_file( $file ) ? dirname( $file ) : $file;
		} else {
			$directory = $this->find_plugin_directory( $file, $directories_to_check );
			if ( ! isset( $directory ) ) {
				return false;
			}
		}

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( ! @is_file( $directory . '/vendor/composer/jetpack_autoload_classmap.php' ) ) {
			return false;
		}

		return $directory;
	}

	/**
	 * Fetches an array of paths keyed by the constant they came from.
	 *
	 * @return string[] The paths keyed by the constant.
	 */
	private static function get_path_constants() {
		$raw_constants = array(
			// Order the constants from most-specific to least-specific.
			'WP_PLUGIN_DIR',
			'WPMU_PLUGIN_DIR',
			'WP_CONTENT_DIR',
			'ABSPATH',
		);

		$constants = array();
		foreach ( $raw_constants as $raw ) {
			if ( ! defined( $raw ) ) {
				continue;
			}

			// Normalize the path for consistency.
			$path = self::normalize( constant( $raw ) );
			if ( isset( $path ) ) {
				$constants[ $raw ] = $path;
			}
		}

		return $constants;
	}

	/**
	 * Given a file and a list of directories to check, this method will try to figure out
	 * the absolute path to the file in question.
	 *
	 * @param string $file The plugin or theme file to resolve.
	 * @param array  $directories_to_check The directories we should check for the file if it isn't an absolute path.
	 * @return string|null The absolute path to the plugin directory, otherwise null.
	 */
	private function find_plugin_directory( $file, $directories_to_check ) {
		// We're only able to find the absolute path for plugin/theme PHP files.
		if ( ! is_string( $file ) || '.php' !== substr( $file, -4 ) ) {
			return null;
		}

		$directories_to_check = self::normalize( $directories_to_check );
		foreach ( $directories_to_check as $check_dir ) {
			$check = dirname( trailingslashit( $check_dir ) . $file );
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			if ( @is_dir( $check ) ) {
				return $check;
			}
		}

		return null;
	}

	/**
	 * Normalizes the given path or paths so that it can be consistently
	 * handled throughout the autoloader.
	 *
	 * @param string|string[] $paths The path or paths we want to normalize.
	 * @return string|string[] The normalized path or paths.
	 */
	private static function normalize( $paths ) {
		// The paths will only be used in PHP and should have the same directory separators.
		return str_replace( '\\', '/', $paths );
	}
}
