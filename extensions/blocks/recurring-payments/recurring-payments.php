<?php // phpcs:disable Squiz.Commenting.FileComment.Missing
/**
 * Memberships block.
 *
 * @since 7.3.0
 *
 * @package Jetpack
 */

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || \Automattic\Jetpack::is_active() ) {
	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';

	\Automattic\Jetpack\jetpack_register_block(
		'jetpack/recurring-payments',
		array(
			'render_callback' => array( Jetpack_Memberships::get_instance(), 'render_button' ),
		)
	);
}
