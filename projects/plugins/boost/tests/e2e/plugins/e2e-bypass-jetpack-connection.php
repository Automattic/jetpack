<?php
/**
 * Plugin Name: Jetpack Boost Bypass Jetpack Connection
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack-boot
 *
 * @package automattic/jetpack-boost
 */

// Bypass the Jetpack connection - act like you're already connected.
add_filter( 'jetpack_boost_connection_bypass', '__return_true' );

// Fake out connected Jetpack user on WPCOM.
add_filter(
	'jetpack_boost_connection_user_data',
	function () {
		$wpcom_user = array(
			'ID'              => 1234,
			'login'           => 'fakewpcomuser',
			'email'           => 'fakewpcomuser@example.com',
			'display_name'    => 'Fake WPCOM User',
			'text_direction'  => 'ltr',
			'site_count'      => 1,
			'jetpack_connect' => 1,
			'avatar'          => 'http://example.com/avatar.png',
		);

		return array(
			'wpcomUser'     => $wpcom_user,
			'isPrimaryUser' => false,
			'canDisconnect' => false,
		);
	}
);
