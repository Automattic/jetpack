<?php
/**
 * Memberships block.
 *
 * @since 7.2.0
 *
 * @package Jetpack
 */
require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
	jetpack_register_block(
		'jetpack/membership-button',
		array(
			'render_callback' => array( Jetpack_Memberships::get_instance(), 'render_button' ),
		)
	);
}
