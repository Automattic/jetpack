<?php
/**
 * Memberships block.
 *
 * @since 7.3.0
 *
 * @package Jetpack
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once WP_CONTENT_DIR . '/mu-plugins/memberships/class-jetpack-memberships.php';
} elseif ( Jetpack::is_active() ) {
	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
}

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
	jetpack_register_block(
		'jetpack/membership-button',
		array(
			'render_callback' => array( Jetpack_Memberships::get_instance(), 'render_button' ),
		)
	);
}
