<?php
/**
 * Phone Number Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/phone-number',
	array( 'render_callback' => 'jetpack_phone_number_block_load_assets' )
);

/**
 * Phone Number block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Phone Number block attributes.
 * @param string $content String containing the Phone Number block content.
 *
 * @return string
 */
function jetpack_phone_number_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'phone-number' );
	return $content;
}
