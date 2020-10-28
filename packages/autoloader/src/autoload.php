<?php
/* HEADER */ // phpcs:ignore

// phpcs:disable Generic.Commenting.DocComment.MissingShort

// The container holds all of the dependencies used by the autoloader.
// We initialize this first so that we can compose the autoloader.
require_once __DIR__ . '/jetpack-autoloader/class-container.php';
$container = new Container();

/** @var Plugins_Handler $plugins_handler */
$plugins_handler = $container->get( Plugins_Handler::class );

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
if ( $guard->should_stop_init( $all_plugins ) ) {
	return;
}

// Initialize the autoloader now that we're ready.
$container->get( Autoloader_Handler::class )->init_autoloader( $all_plugins );

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
			return;
		}

		// Load the active plugins fresh since the list we have above might not contain
		// plugins that were activated but did not reset the autoloader. This happens
		// because they were already included in the cache.
		$active_plugins = $plugins_handler->get_active_plugins();

		// The paths should be sorted for easy comparisons with those loaded from the cache.
		sort( $active_plugins );

		// We don't want to waste time saving a cache that hasn't changed.
		if ( $cached_plugins === $active_plugins ) {
			return;
		}

		$plugins_handler->cache_plugins( $active_plugins );
	}
);

// phpcs:enable Generic.Commenting.DocComment.MissingShort
