<?php
/**
 * Contact Info block and its child blocks.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'contact-info',
	array(
		'render_callback' => 'jetpack_contact_info_block_load_assets',
	)
);
jetpack_register_block(
	'email',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
jetpack_register_block(
	'address',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
jetpack_register_block(
	'phone',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);

/**
 * Contact info block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the contact info block attributes.
 * @param string $content String containing the contact info block content.
 *
 * @return string
 */
function jetpack_contact_info_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'contact-info' );
	return $content;
}
