<?php //phpcs:ignoreFile
/**
 * Jetpack Boost Test Sidekick Plugin
 *
 * @link              https://automattic.com
 * @since             0.1.0
 * @copyright         Copyright(c) 2020, Automattic
 * @licence           http://opensource.org/licenses/GPL-2.0 GNU General Public License, version 2 (GPL-2.0)
 *
 * @wordpress-plugin
 * Plugin Name:       Jetpack Boost Development/Test Sidekick
 * Plugin URI:        https://jetpack.com/boost
 * Description:       Tweaks required for development and testing environment
 * Version:           0.1-alpha
 * Author:            Automattic, XWP
 * Author URI:        https://automattic.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       jetpack
 * Requires at least: 5.5
 * Requires PHP:      7.0
 */
// bypass the Jetpack connection - act like you're already connected
add_filter( 'jetpack_boost_connection_bypass', '__return_true' );

// fake out connected Jetpack user on WPCOM
add_filter(
	'jetpack_boost_connection_user_data',
	function ( $user ) {
		$wpcomUser = array(
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
			'wpcomUser'     => $wpcomUser,
			'isPrimaryUser' => false,
			'canDisconnect' => false,
		);
	}
);

$boost = null;

// assign boost instance when plugin is loaded
add_action(
	'jetpack_boost_loaded',
	function ( $instance ) use ( &$boost ) {
		$boost = $instance;
	}
);

// include non-default modules
add_filter(
	'jetpack_boost_modules',
	function ( $modules ) {
		// These below are examples:
		// $modules[] = 'critical-css';
		// $modules[] = 'render-blocking-js';

		return $modules;
	}
);

// add an unsecured API endpoint to reset plugin data
add_action(
	'rest_api_init',
	function () use ( &$boost ) {
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/reset-data',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( $request ) use ( &$boost ) {
					$boost->config()->reset();

					return true;
				},
				'permission_callback' => '__return_true',
			)
		);
	}
);
