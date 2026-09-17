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

		foreach ( array( 'jetpack_page_jetpack-boost', 'jetpack-boost-dashboard' ) as $screen ) {
			$messages[] = array(
				'id'             => 'e2e-boost-dashboard-' . $screen,
				'message_path'   => '/wp:' . $screen . ':admin_notices/',
				'message'        => 'Boost dashboard test message',
				'description'    => 'A message for the Boost dashboard visibility test.',
				'button_link'    => 'https://example.com/',
				'button_caption' => 'Learn more',
			);
		}

		return $messages;
	}
);

add_filter(
	'jetpack_offline_mode',
	function ( $offline ) {
		if ( ! ( defined( 'WP_CLI' ) && WP_CLI ) && get_option( 'e2e_boost_dashboard_jitm', false ) ) {
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
	}
);
