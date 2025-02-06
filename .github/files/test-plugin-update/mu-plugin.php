<?php
/**
 * Plugin Name: Plugin Upgrade Test hacks
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

// Force user ID 1 as the logged in user.
add_filter(
	'determine_current_user',
	function () {
		return 1;
	}
);

/**
 * Disable the login cookie check.
 *
 * @phan-suppress PhanRedefineFunction -- Pluggable function.
 */
function wp_validate_auth_cookie() {
	return true;
}

/**
 * Disable the nonce check.
 *
 * @phan-suppress PhanRedefineFunction -- Pluggable function.
 */
function wp_verify_nonce() {
	return true;
}

// Allow for forcing an "update" of a particular plugin.
add_filter(
	'site_transient_update_plugins',
	function ( $value ) {
		$plugin = get_option( 'fake_plugin_update_plugin' );
		$url    = get_option( 'fake_plugin_update_url' );
		if ( $plugin && $url ) {
			if ( ! is_object( $value ) ) {
				$value = (object) array(
					'response'  => array(),
					'no_update' => array(),
				);
			}
			if ( ! isset( $value->response[ $plugin ] ) ) {
				if ( isset( $value->no_update[ $plugin ] ) ) {
					$value->response[ $plugin ] = $value->no_update[ $plugin ];
					unset( $value->no_update[ $plugin ] );
				} else {
					$value->response[ $plugin ] = (object) array(
						'plugin' => dirname( $plugin ),
						'slug'   => dirname( $plugin ),
					);
				}
			}
			$value->response[ $plugin ]->new_version = '1000000.0.0';
			$value->response[ $plugin ]->package     = $url;
		}
		return $value;
	}
);
