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

		/** @var Autoloader_Handler $autoloader_handler */
		$autoloader_handler = $container->get( Autoloader_Handler::class );

		// If the autoloader is already initializing it means that it has included us as the latest.
		$was_included_by_autoloader = $autoloader_handler->is_initializing();

		/** @var Plugin_Locator $plugin_locator */
		$plugin_locator = $container->get( Plugin_Locator::class );

		/** @var Plugins_Handler $plugins_handler */
		$plugins_handler = $container->get( Plugins_Handler::class );

		// The current plugin is the one that we are attempting to initialize here.
		$current_plugin = $plugin_locator->find_current_plugin();

		// The active plugins are those that we were able to discover on the site. This list will not
		// include mu-plugins, those activated by code, or those who are hidden by filtering. We also
		// want to take care to not consider the current plugin unknown if it was included by an
		// autoloader. This avoids the case where a plugin will be marked "active" while deactivated
		// due to it having the latest autoloader.
		$active_plugins = $plugins_handler->get_active_plugins( true, ! $was_included_by_autoloader );

		// The cached plugins are all of those that were active or discovered by the autoloader during a previous request.
		// Note that it's possible this list will include plugins that have since been deactivated, but after a request
		// the cache should be updated and the deactivated plugins will be removed.
		$cached_plugins = $plugins_handler->get_cached_plugins();

		// We combine the active list and cached list to preemptively load classes for plugins that are
		// presently unknown but will be loaded during the request. While this may result in us considering packages in
		// deactivated plugins there shouldn't be any problems as a result and the eventual consistency is sufficient.
		$all_plugins = array_merge( $active_plugins, $cached_plugins );

		// In particular we also include the current plugin to address the case where it is the latest autoloader
		// but also unknown (and not cached). We don't want it in the active list because we don't know that it
		// is active but we need it in the all plugins list so that it is considered by the autoloader.
		$all_plugins[] = $current_plugin;

		// We require uniqueness in the array to avoid processing the same plugin more than once.
		$all_plugins = array_values( array_unique( $all_plugins ) );

		/** @var Latest_Autoloader_Guard $guard */
		$guard = $container->get( Latest_Autoloader_Guard::class );
		if ( $guard->should_stop_init( $current_plugin, $all_plugins, $was_included_by_autoloader ) ) {
			return;
		}

		// Initialize the autoloader using the handler now that we're ready.
		$autoloader_handler->activate_autoloader( $all_plugins );

		/** @var Hook_Manager $hook_manager */
		$hook_manager = $container->get( Hook_Manager::class );

		// Register a shutdown handler to clean up the autoloader.
		$hook_manager->add_action( 'shutdown', new Shutdown_Handler( $plugins_handler, $cached_plugins, $was_included_by_autoloader ) );

		// phpcs:enable Generic.Commenting.DocComment.MissingShort
	}
}
