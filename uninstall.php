<?php

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

// Delete all compact options
delete_option( 'jetpack_options'        );

// Delete all non-compact options
delete_option( 'jetpack_register'       );
delete_option( 'jetpack_activated'      );
delete_option( 'jetpack_active_modules' );
delete_option( 'jetpack_do_activate'    );

// Delete all legacy options
delete_option( 'jetpack_was_activated'  );
delete_option( 'jetpack_auto_installed' );
delete_transient( 'jetpack_register'    );

// Jetpack Sync
/**
 * Remove the sync queue
 */
function jetpack_remove_sync_queue() {
	global $wpdb;
	$wpdb->query( $wpdb->prepare(
		"DELETE FROM $wpdb->options WHERE option_name LIKE %s", "jpsq_sync-%"
	);
}

/**
 * Remove the default sync settings
 */
function jetpack_remove_sync_settings() {
	$valid_settings = array( 'dequeue_max_bytes' => true, 'upload_max_bytes' => true, 'upload_max_rows' => true, 'sync_wait_time' => true );
	$settings_prefix = 'jetpack_sync_settings_';
	foreach( $valid_settings as $option => $value ) {
		delete_option( $settings_prefix . $option );
	}
}

delete_option( 'jetpack_full_sync_status' );
delete_option( 'jetpack_constants_sync_checksum' );
delete_option( 'jetpack_callables_sync_checksum' );

delete_option( 'jetpack_sync_min_wait' );
delete_option( 'jetpack_sync_constants_await' );
delete_option( 'jetpack_sync_callables_await' );

delete_transient( 'jetpack_sync_callables_await' );
delete_transient( 'jetpack_sync_constants_await' );

jetpack_remove_sync_settings();
jetpack_remove_sync_queue();