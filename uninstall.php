<?php
/**
 * Functionality that is executed when Jetpack is uninstalled via built-in WordPress commands.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Plugin as Connection_Plugin;
use Automattic\Jetpack\Sync\Sender;
use Automattic\Jetpack\Backup\Helper_Script_Manager;

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

if ( ! ( new Connection_Plugin( 'jetpack' ) )->is_only() ) {
	$options_cleanup_filter = function( $options ) {
		if ( ! is_array( $options ) ) {
			_doing_it_wrong( 'jetpack_options_delete_all_ignore', '`$options` must be an array', '8.7.0' );
			$options = array();
		}

		$options_to_add = array(
			'private' => array( 'blog_token', 'user_token', 'user_tokens' ),
			'compact' => array( 'master_user', 'time_diff', 'fallback_no_verify_ssl_certs' ),
		);

		foreach ( $options_to_add as $group => $keys ) {
			if ( ! array_key_exists( $group, $options ) ) {
				$options[ $group ] = array();
			}
			$options[ $group ] = array_unique( array_merge( $options[ $group ], $keys ) );
		}

		return $options;
	};

	add_filter( 'jetpack_options_delete_all_ignore', $options_cleanup_filter, 20 );
}

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

// Jetpack Backup: Cleanup any leftover Helper Scripts
Helper_Script_Manager::delete_all_helper_scripts();
