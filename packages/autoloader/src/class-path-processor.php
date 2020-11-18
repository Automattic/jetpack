<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles dealing with paths for the autoloader.
 */
class Path_Processor {
	/**
	 * Given a file and an array of places it might be, this will find the absolute path and return it.
	 *
	 * @param string $file The plugin or theme file to resolve.
	 * @param array  $directories_to_check The directories we should check for the file if it isn't an absolute path.
	 * @return string|false Returns the absolute path to the directory, otherwise false.
	 */
	public function find_directory_with_autoloader( $file, $directories_to_check ) {
		// We're only able to find the absolute path for plugin/theme PHP files.
		if ( ! is_string( $file ) || '.php' !== substr( $file, -4 ) ) {
			return false;
		}

		// Normalize the path for consistency.
		$file = str_replace( '\\', '/', $file );

		if ( path_is_absolute( $file ) ) {
			$directory = dirname( $file );
		} else {
			foreach ( $directories_to_check as $check_dir ) {
				$check = dirname( trailingslashit( $check_dir ) . $file );
				// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				if ( @is_dir( $check ) ) {
					$directory = $check;
					break;
				}
			}

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
}
