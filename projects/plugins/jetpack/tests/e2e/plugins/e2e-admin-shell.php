<?php
/**
 * Plugin Name: Jetpack E2E Admin Shell
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Sets up the unconnected e2e site for the admin shell suite. Only that suite activates it.
 *
 * @package automattic/jetpack
 */

// The shell-off run sets this option, so the two runs differ only by the flag.
if ( ! get_option( 'e2e_admin_shell_off' ) ) {
	add_filter( 'jetpack_feature_flag_enabled_jetpack-admin-shell', '__return_true' );
}

// Most members need a connection: keep Jetpack out of localhost's offline mode and stub one on activation.
add_filter( 'jetpack_offline_mode', '__return_false', 99 );

register_activation_hook(
	__FILE__,
	function () {
		$admins = get_users(
			array(
				'role'    => 'administrator',
				'orderby' => 'ID',
				'number'  => 1,
				'fields'  => 'ID',
			)
		);
		$owner  = (int) reset( $admins );
		Jetpack_Options::update_options(
			array(
				'id'          => 123456789,
				'blog_token'  => 'e2e.blog',
				'user_tokens' => array( $owner => "e2e.user.$owner" ),
				'master_user' => $owner,
			)
		);
	}
);

register_deactivation_hook(
	__FILE__,
	function () {
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'user_tokens', 'master_user' ) );
		delete_option( 'e2e_admin_shell_off' );
	}
);

// The stubbed tokens can't sign requests, so fail WordPress.com calls at once instead of waiting on them.
add_filter(
	'pre_http_request',
	function ( $response, $args, $url ) {
		$host = (string) wp_parse_url( $url, PHP_URL_HOST );
		if ( preg_match( '/(^|\.)(wordpress|wp)\.com$/', $host ) ) { // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Hostname pattern.
			return new WP_Error( 'e2e_admin_shell_offline', 'WordPress.com is unreachable from the admin shell e2e site.' );
		}
		return $response;
	},
	10,
	3
);
