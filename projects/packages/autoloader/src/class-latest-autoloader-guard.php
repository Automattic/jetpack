<?php
/* HEADER */ // phpcs:ignore

/**
 * This class ensures that we're only executing the latest autoloader.
 */
class Latest_Autoloader_Guard {

	/**
	 * The Plugins_Handler instance.
	 *
	 * @var Plugins_Handler
	 */
	private $plugins_handler;

	/**
	 * The Autoloader_Handler instance.
	 *
	 * @var Autoloader_Handler
	 */
	private $autoloader_handler;

	/**
	 * The Autoloader_locator instance.
	 *
	 * @var Autoloader_Locator
	 */
	private $autoloader_locator;

	/**
	 * The constructor.
	 *
	 * @param Plugins_Handler    $plugins_handler    The Plugins_Handler instance.
	 * @param Autoloader_Handler $autoloader_handler The Autoloader_Handler instance.
	 * @param Autoloader_Locator $autoloader_locator The Autoloader_Locator instance.
	 */
	public function __construct( $plugins_handler, $autoloader_handler, $autoloader_locator ) {
		$this->plugins_handler    = $plugins_handler;
		$this->autoloader_handler = $autoloader_handler;
		$this->autoloader_locator = $autoloader_locator;
	}

	/**
	 * Indicates whether or not the autoloader should be initialized. Note that this function
	 * has the side-effect of actually loading the latest autoloader in the event that this
	 * is not it.
	 *
	 * @param string   $current_plugin             The current plugin we're checking.
	 * @param string[] $plugins                    The active plugins to check for autoloaders in.
	 * @param bool     $was_included_by_autoloader Indicates whether or not this autoloader was included by another.
	 *
	 * @return bool True if we should stop initialization, otherwise false.
	 */
	public function should_stop_init( $current_plugin, $plugins, $was_included_by_autoloader ) {
		global $jetpack_autoloader_latest_version;

		// We need to reset the autoloader when the plugins change because
		// that means the autoloader was generated with a different list.
		if ( $this->plugins_handler->have_plugins_changed( $plugins ) ) {
			$this->autoloader_handler->reset_autoloader();
		}

		// When the latest autoloader has already been found we don't need to search for it again.
		// We should take care however because this will also trigger if the autoloader has been
		// included by an older one.
		if ( isset( $jetpack_autoloader_latest_version ) && ! $was_included_by_autoloader ) {
			return true;
		}

		$latest_plugin = $this->autoloader_locator->find_latest_autoloader( $plugins, $jetpack_autoloader_latest_version );
		if ( isset( $latest_plugin ) && $latest_plugin !== $current_plugin ) {
			require $this->autoloader_locator->get_autoloader_path( $latest_plugin );
			return true;
		}

		return false;
	}

	/**
	 * Check for conflicting autoloaders.
	 *
	 * A common source of strange and confusing problems is when another plugin
	 * registers a Composer autoloader at a higher priority that us. If enabled,
	 * check for this problem and warn about it.
	 *
	 * Called from the plugins_loaded hook.
	 *
	 * @since 3.1.0
	 * @return void
	 */
	public function check_for_conflicting_autoloaders() {
		if ( ! defined( 'JETPACK_AUTOLOAD_DEBUG_CONFLICTING_LOADERS' ) || ! JETPACK_AUTOLOAD_DEBUG_CONFLICTING_LOADERS ) {
			return;
		}

		global $jetpack_autoloader_loader;
		if ( ! isset( $jetpack_autoloader_loader ) ) {
			return;
		}
		$prefixes = array();
		foreach ( ( $jetpack_autoloader_loader->get_class_map() ?? array() ) as $classname => $data ) {
			$parts = explode( '\\', trim( $classname, '\\' ) );
			array_pop( $parts );
			while ( $parts ) {
				$prefixes[ implode( '\\', $parts ) . '\\' ] = true;
				array_pop( $parts );
			}
		}
		foreach ( ( $jetpack_autoloader_loader->get_psr4_map() ?? array() ) as $prefix => $data ) {
			$parts = explode( '\\', trim( $prefix, '\\' ) );
			while ( $parts ) {
				$prefixes[ implode( '\\', $parts ) . '\\' ] = true;
				array_pop( $parts );
			}
		}

		$autoload_chain = spl_autoload_functions();
		if ( ! $autoload_chain ) {
			return;
		}

		foreach ( $autoload_chain as $autoloader ) {
			// No need to check anything after us.
			if ( is_array( $autoloader ) && is_string( $autoloader[0] ) && substr( $autoloader[0], 0, strlen( __NAMESPACE__ ) + 1 ) === __NAMESPACE__ . '\\' ) {
				break;
			}

			// We can check Composer autoloaders easily enough.
			if ( is_array( $autoloader ) && $autoloader[0] instanceof \Composer\Autoload\ClassLoader && is_callable( array( $autoloader[0], 'getPrefixesPsr4' ) ) ) {
				$composer_autoloader = $autoloader[0];
				foreach ( $composer_autoloader->getClassMap() as $classname => $path ) {
					if ( $jetpack_autoloader_loader->find_class_file( $classname ) ) {
						$msg = "A Composer autoloader is registered with a higher priority than the Jetpack Autoloader and would also handle some of the classes we handle (e.g. $classname => $path). This may cause strange and confusing problems.";
						// @todo Remove the is_callable check once we drop support for WP 6.5.
						if ( is_callable( 'wp_trigger_error' ) ) {
							wp_trigger_error( '', $msg );
						} else {
							// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
							trigger_error( $msg );
						}
						continue 2;
					}
				}
				foreach ( $composer_autoloader->getPrefixesPsr4() as $prefix => $paths ) {
					if ( isset( $prefixes[ $prefix ] ) ) {
						$path = array_pop( $paths );
						$msg  = "A Composer autoloader is registered with a higher priority than the Jetpack Autoloader and would also handle some of the namespaces we handle (e.g. $prefix => $path). This may cause strange and confusing problems.";
						// @todo Remove the is_callable check once we drop support for WP 6.5.
						if ( is_callable( 'wp_trigger_error' ) ) {
							wp_trigger_error( '', $msg );
						} else {
							// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
							trigger_error( $msg );
						}
						continue 2;
					}
				}
				foreach ( $composer_autoloader->getPrefixes() as $prefix => $paths ) {
					if ( isset( $prefixes[ $prefix ] ) ) {
						$path = array_pop( $paths );
						$msg  = "A Composer autoloader is registered with a higher priority than the Jetpack Autoloader and would also handle some of the namespaces we handle (e.g. $prefix => $path). This may cause strange and confusing problems.";
						// @todo Remove the is_callable check once we drop support for WP 6.5.
						if ( is_callable( 'wp_trigger_error' ) ) {
							wp_trigger_error( '', $msg );
						} else {
							// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
							trigger_error( $msg );
						}
						continue 2;
					}
				}
			}
		}
	}
}
