<?php
/**
 * Plugin Name: Jetpack E2E plugin updater
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package jetpack-test-plugin-e2e-plugin-updater
 */

add_filter( 'site_transient_update_plugins', 'e2e_set_jetpack_update', 10, 1 );
add_filter( 'upgrader_post_install', 'e2e_move_jetpack_dev_dir', 10, 3 );


function e2e_set_jetpack_update( $value ) {
	// $update_version = get_option( 'e2e_jetpack_upgrader_update_version' );
	// $update_package = get_option( 'e2e_jetpack_upgrader_plugin_url' );
	$update_version = '8.9';
	$update_package = 'https://ed2aad5ac207.ngrok.io/wp-content/jetpack-dev.zip';

	if ( ! isset( $update_package ) || ! isset( $update_version ) ) {
		return $value;
	}

	if ( ! file_exists( trailingslashit( WP_PLUGIN_DIR ) . 'jetpack/jetpack.php' ) ) {
		// Jetpack not installed so bail.
		return $value;
	}

	$current_version = get_file_data( trailingslashit( WP_PLUGIN_DIR ) . 'jetpack/jetpack.php', array( 'Version' => 'Version' ) )['Version'];

	if ( $current_version === $update_version ) {
		// Already on desired Jetpack version.
		return $value;
	}

	// Override an existing Jetpack update.
	if ( ! empty( $value->response['jetpack/jetpack.php'] ) ) {
		$value->response['jetpack/jetpack.php']->new_version = $update_version;
		$value->response['jetpack/jetpack.php']->package     = $update_package;
		return $value;
	}

	// Cause a new Jetpack update.
	if ( ! empty( $value->no_update['jetpack/jetpack.php'] ) ) {
		$jetpack                                = $value->no_update['jetpack/jetpack.php'];
		$jetpack->new_version                   = $update_version;
		$jetpack->package                       = $update_package;
		$value->response['jetpack/jetpack.php'] = $jetpack;
	}

	error_log( print_r( '!!!!!!!!!!!!!', 1 ) );
	error_log( print_r( $value, 1 ) );
	error_log( print_r( '!!!!!!!!!!!!!', 1 ) );
	return $value;
}

function e2e_move_jetpack_dev_dir( $response, $hook_extra, $result ) {
	if ( 'jetpack-dev' === $result['destination_name'] ) {
		// rename( WP_PLUGIN_DIR . '/jetpack-dev', WP_PLUGIN_DIR . '/jetpack' );
	}

	error_log( print_r( '@@@@@@@@@@@@@', 1 ) );
	error_log( print_r( $result, 1 ) );
	error_log( print_r( '@@@@@@@@@@@@@', 1 ) );


	return $response;
}
