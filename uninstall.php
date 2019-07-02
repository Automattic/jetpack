<?php

use Automattic\Jetpack\Sync\Sender;

if (
	!defined( 'WP_UNINSTALL_PLUGIN' )
	||
	!WP_UNINSTALL_PLUGIN
	||
	dirname( WP_UNINSTALL_PLUGIN ) != dirname( plugin_basename( __FILE__ ) )
) {
	status_header( 404 );
	exit;
}

if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
	define( 'JETPACK__PLUGIN_DIR', plugin_dir_path( __FILE__ )  );
}

require JETPACK__PLUGIN_DIR . 'vendor/autoload_packages.php';

Jetpack_Options::delete_all_known_options();

// Delete all legacy options
delete_option( 'jetpack_was_activated'  );
delete_option( 'jetpack_auto_installed' );
delete_option( 'jetpack_register'       );
delete_transient( 'jetpack_register'    );

// Delete sync options
//
// Do not initialize any listeners.
// Since all the files will be deleted.
// No need to try to sync anything.
add_filter( 'jetpack_sync_modules', '__return_empty_array', 100 );

// Jetpack Sync
Sender::get_instance()->uninstall();
