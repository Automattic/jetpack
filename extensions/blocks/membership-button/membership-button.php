<?php // phpcs:disable Squiz.Commenting.FileComment.Missing
/**
 * Memberships block.
 *
 * @since 7.3.0
 *
 * @package Jetpack
 */

require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';

jetpack_register_block(
	'jetpack/membership-button',
	array(
		'render_callback' => array( Jetpack_Memberships::get_instance(), 'render_button' ),
	)
);
