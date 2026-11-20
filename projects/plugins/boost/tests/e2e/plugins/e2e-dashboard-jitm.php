<?php
/**
 * Plugin Name: Boost E2E Dashboard JITM
 *
 * @package automattic/jetpack-boost
 */

add_filter(
	'jetpack_pre_connection_jitms',
	function ( $messages ) {
		if ( ! get_option( 'e2e_boost_dashboard_jitm', false ) ) {
			return $messages;
		}

		$messages[] = array(
			'id'             => 'e2e-boost-dashboard',
			'message_path'   => '/wp:jetpack_page_jetpack-boost:admin_notices/',
			'message'        => 'Boost dashboard test message',
			'description'    => 'A message for the Boost dashboard visibility test.',
			'button_link'    => 'https://example.com/',
			'button_caption' => 'Learn more',
		);

		return $messages;
	}
);

// JITM stays off in offline mode, so go online only for the Boost page and the JITM REST routes.
add_filter(
	'jetpack_offline_mode',
	function ( $offline ) {
		if ( ! get_option( 'e2e_boost_dashboard_jitm', false ) ) {
			return $offline;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		$uri  = isset( $_SERVER['REQUEST_URI'] ) ? rawurldecode( esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) ) : '';
		if ( ( is_admin() && 'jetpack-boost' === $page ) || preg_match( '#/(jetpack/v4|wpcom/v3)/jitm\b#', $uri ) ) {
			return false;
		}
		return $offline;
	},
	999
);

register_deactivation_hook(
	__FILE__,
	function () {
		delete_option( 'e2e_boost_dashboard_jitm' );

		// A dismissal persists, so clear it or later runs and retries never see the message.
		$hidden = class_exists( 'Jetpack_Options' ) ? \Jetpack_Options::get_option( 'hide_jitm' ) : null;
		if ( is_array( $hidden ) ) {
			unset( $hidden['pre-connection-e2e-boost-dashboard'] );
			\Jetpack_Options::update_option( 'hide_jitm', $hidden );
		}
	}
);
