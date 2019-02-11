<?php
/**
 * Contact Info block and its child blocks.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

register_block_type(
	'jetpack/contact-info',
	array(
		'render_callback' => 'jetpack_contact_info_block_load_assets',
	)
);
register_block_type(
	'jetpack/email',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
register_block_type(
	'jetpack/address',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
register_block_type(
	'jetpack/phone',
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
