<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles management of the actual PHP autoloader.
 */
class Autoloader {

	/**
	 * Checks to see whether or not the autoloader should be initialized and then initializes it if so.
	 *
	 * @param Container|null $container The container we want to use for autoloader initialization. If none is given
	 *                                  then a container will be created automatically.
	 */
	public static function init( $container = null ) {
		// The container holds and manages the lifecycle of our dependencies
		// to make them easier to work with and increase flexibility.
		if ( ! isset( $container ) ) {
			require_once __DIR__ . '/class-container.php';
			$container = new Container();
		}

		// phpcs:disable Generic.Commenting.DocComment.MissingShort

		/** @var Plugin_Locator $plugin_locator */
		$plugin_locator = $container->get( Plugin_Locator::class );

		/** @var Plugins_Handler $plugins_handler */
		$plugins_handler = $container->get( Plugins_Handler::class );

		// The current plugin is the one that we are attempting to initialize here.
		$current_plugin = $plugin_locator->find_current_plugin();

		// The cached plugins are all of those that were active or discovered by the autoloader during a previous request.
		// Note that it's possible this list will include plugins that have since been deactivated, but after a request
		// the cache should be updated and the deactivated plugins will be removed.
		$cached_plugins = $plugins_handler->get_cached_plugins();

		// The active plugins are those that we were able to discover in on the site. This list will not include
		// mu-plugins, those activated by code, or those who are hidden by filtering.
		// By combining these lists we can preemptively load classes for plugins that are activated via another method.
		// While this may result in us considering packages in deactivated plugins the request after they're removed,
		// there shouldn't be any problems as a result and the eventual consistency is reliable enough.
		$all_plugins = array_values( array_unique( array_merge( $plugins_handler->get_active_plugins(), $cached_plugins ) ) );

		/** @var Latest_Autoloader_Guard $guard */
		$guard = $container->get( Latest_Autoloader_Guard::class );
		if ( $guard->should_stop_init( $current_plugin, $all_plugins ) ) {
			return;
		}

		/** @var Autoloader_Handler $autoloader_handler */
		$autoloader_handler = $container->get( Autoloader_Handler::class );

		// Initialize the autoloader using the handler now that we're ready.
		$autoloader_handler->create_autoloader( $all_plugins );

		/** @var Hook_Manager $hook_manager */
		$hook_manager = $container->get( Hook_Manager::class );

		// When the active and cached plugin lists do not match we should
		// update the cache. This will prevent plugins that have been
		// deactivated from being considered in other requests.
		$hook_manager->add_action(
			'shutdown',
			function () use ( $plugins_handler, $cached_plugins ) {
				// Don't save a broken cache if an error happens during some plugin's initialization.
				if ( ! did_action( 'plugins_loaded' ) ) {
					// Ensure that the cache is emptied to prevent consecutive failures if the cache is to blame.
					if ( ! empty( $cached_plugins ) ) {
						$plugins_handler->cache_plugins( array() );
					}

					return;
				}

				// Load the active plugins fresh since the list we have above might not contain
				// plugins that were activated but did not reset the autoloader. This happens
				// because they were already included in the cache.
				$active_plugins = $plugins_handler->get_active_plugins();

				// The paths should be sorted for easy comparisons with those loaded from the cache.
				// Note we don't need to sort the cached entries because they're already sorted.
				sort( $active_plugins );

				// We don't want to waste time saving a cache that hasn't changed.
				if ( $cached_plugins === $active_plugins ) {
					return;
				}

				$plugins_handler->cache_plugins( $active_plugins );
			}
		);

		// phpcs:enable Generic.Commenting.DocComment.MissingShort
	}

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

		require $file;
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
