<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles management of the actual PHP autoloader.
 */
class PHP_Autoloader {

	/**
	 * Registers the autoloader with PHP so that it can begin autoloading classes.
	 *
	 * @param Version_Loader $version_loader The class loader to use in the autoloader.
	 */
	public function register_autoloader( $version_loader ) {
		// Make sure no other autoloaders are registered.
		$this->unregister_autoloader();

		// Set the global so that it can be used to load classes.
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = $version_loader;

		// Ensure that the autoloader is first to avoid contention with others.
		spl_autoload_register( array( self::class, 'load_class' ), true, true );
	}

	/**
	 * Unregisters the active autoloader so that it will no longer autoload classes.
	 */
	public function unregister_autoloader() {
		// Remove any v2 autoloader that we've already registered.
		$autoload_chain = spl_autoload_functions();
		if ( ! $autoload_chain ) {
			return;
		}
		foreach ( $autoload_chain as $autoloader ) {
			// We can identify a v2 autoloader using the namespace.
			$namespace_check = null;

			// Functions are recorded as strings.
			if ( is_string( $autoloader ) ) {
				$namespace_check = $autoloader;
			} elseif ( is_array( $autoloader ) && is_string( $autoloader[0] ) ) {
				// Static method calls have the class as the first array element.
				$namespace_check = $autoloader[0];
			} else {
				// Since the autoloader has only ever been a function or a static method we don't currently need to check anything else.
				continue;
			}

			// Check for the namespace without the generated suffix.
			if ( 'Automattic\\Jetpack\\Autoloader\\jp' === substr( $namespace_check, 0, 32 ) ) {
				spl_autoload_unregister( $autoloader );
			}
		}

		// Clear the global now that the autoloader has been unregistered.
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = null;
	}

	/**
	 * Loads a class file if one could be found.
	 *
	 * Note: This function is static so that the autoloader can be easily unregistered. If
	 * it was a class method we would have to unwrap the object to check the namespace.
	 *
	 * @param string $class_name The name of the class to autoload.
	 *
	 * @return bool Indicates whether or not a class file was loaded.
	 */
	public static function load_class( $class_name ) {
		global $jetpack_autoloader_loader;
		if ( ! isset( $jetpack_autoloader_loader ) ) {
			return false;
		}

		$file = $jetpack_autoloader_loader->find_class_file( $class_name );
		if ( ! isset( $file ) ) {
			return false;
		}

		// A common source of strange and confusing problems is when a vendor
		// file is autoloaded before all plugins have had a chance to register
		// with the autoloader. Detect that, if a development constant is set.
		if ( defined( 'JETPACK_AUTOLOAD_DEBUG_EARLY_LOADS' ) && JETPACK_AUTOLOAD_DEBUG_EARLY_LOADS &&
			( strpos( $file, '/vendor/' ) !== false || strpos( $file, '/jetpack_vendor/' ) !== false ) &&
			is_callable( 'did_action' ) && ! did_action( 'plugins_loaded' )
		) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_wp_debug_backtrace_summary -- This is a debug log message.
			$msg = "Jetpack Autoloader: Autoloading `$class_name` before the plugins_loaded hook may cause strange and confusing problems. " . wp_debug_backtrace_summary( '', 1 );
			// @todo Remove the is_callable check once we drop support for WP 6.5.
			if ( is_callable( 'wp_trigger_error' ) ) {
				wp_trigger_error( '', $msg );
			} else {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
				trigger_error( $msg );
			}
		}

		require $file;
		return true;
	}
}
