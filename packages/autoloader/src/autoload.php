<?php
/* HEADER */ // phpcs:ignore

// phpcs:disable Generic.Commenting.DocComment.MissingShort

// The container holds all of the dependencies used by the autoloader.
// We initialize this first so that we can compose the autoloader.
require_once __DIR__ . '/jetpack-autoloader/class-container.php';
$container = new Container();

/** @var Plugins_Handler $plugins_handler */
$plugins_handler = $container->get( Plugins_Handler::class );

// We will attempt to compose the autoloader from all of the
// plugins that include our autoloader.
$active_plugins = $plugins_handler->get_active_plugins();

/** @var Latest_Autoloader_Guard $guard */
$guard = $container->get( Latest_Autoloader_Guard::class );
if ( $guard->should_stop_init( $active_plugins ) ) {
	return;
}

$cached_plugins = $plugins_handler->get_cached_plugins();
$all_plugins    = array_values( array_unique( array_merge( $active_plugins, $cached_plugins ) ) );

// Initialize the autoloader now that we're ready.
$container->get( Autoloader_Handler::class )->init_autoloader( $all_plugins );

/** @var Hook_Manager $hook_manager */
$hook_manager = $container->get( Hook_Manager::class );

// On shutdown we want to save the active plugins to a file cache.
// This will allow us to preemptively handle plugins that were
// found during the last request but not discoverable otherwise.
$hook_manager->add_action(
	'shutdown',
	function () use ( $plugins_handler, $active_plugins, $cached_plugins ) {
		// Don't save a broken cache if an error happens during some plugin's initialization.
		if ( ! did_action( 'plugins_loaded' ) ) {
			return;
		}

		// Don't waste time saving the same cache we already have.
		if ( $cached_plugins === $active_plugins ) {
			return;
		}

		$plugins_handler->cache_plugins( $active_plugins );
	}
);

// phpcs:enable Generic.Commenting.DocComment.MissingShort
