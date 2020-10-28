<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles management of the actual PHP autoloader.
 */
class Autoloader {
	/**
	 * Loads a class file if one could be found.
	 *
	 * @param string $class_name The name of the class to autoload.
	 *
	 * @return bool Indicates whether or not a class file was loaded.
	 */
	public static function load_class( $class_name ) {
		global $jetpack_autoloader_loader;
		if ( ! isset( $jetpack_autoloader_loader ) ) {
			return;
		}

		$file = $jetpack_autoloader_loader->find_class_file( $class_name );
		if ( ! isset( $file ) ) {
			return false;
		}

		require_once $file;
		return true;
	}

	/**
	 * Activates this autoloader and deactivates any other v2 autoloaders that may be present.
	 *
	 * @param Version_Loader $version_loader The version loader for our autoloader.
	 */
	public static function activate( $version_loader ) {
		// Set the global autoloader to indicate that we've activated this autoloader.
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = $version_loader;

		// Remove any v2 autoloader that we've already registered.
		$autoload_chain = spl_autoload_functions();
		foreach ( $autoload_chain as $autoloader ) {
			// Jetpack autoloaders are always strings.
			if ( ! is_string( $autoloader ) ) {
				continue;
			}

			// We can identify a v2 autoloader using the namespace prefix without the unique suffix.
			if ( 'Automattic\\Jetpack\\Autoloader\\jp' === substr( $autoloader, 0, 32 ) ) {
				spl_autoload_unregister( $autoloader );
				continue;
			}
		}

		// Ensure that the autoloader is first to avoid contention with others.
		spl_autoload_register( self::class . '::load_class', true, true );

		// Now that we've activated the autoloader we should load the filemap.
		$jetpack_autoloader_loader->load_filemap();
	}
}
