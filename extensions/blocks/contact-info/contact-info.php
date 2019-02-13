<?php
/**
 * Contact Info block and its child blocks.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block_type(
	'jetpack/contact-info',
	array(
		'render_callback' => 'jetpack_contact_info_block_load_assets',
	)
);
jetpack_register_block_type(
	'jetpack/email',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
jetpack_register_block_type(
	'jetpack/address',
	array( 'parent' => array( 'jetpack/contact-info' ) )
);
jetpack_register_block_type(
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

add_filter( 'wp_kses_allowed_html', 'jetpack_contact_info_add_schema_attributes', 10, 2 );
/**
 * Add the schema attributes to post data. So that it can be saved as expected.
 * @param array  $tags      Allowed tags by.
 * @param string $context_type Context type (explicit).
 */
function jetpack_contact_info_add_schema_attributes( $tags, $context_type ) {
	if ( $context_type !== 'post' ) {
		return $tags;
	}

	$scheme_attribues = array(
		'itemscope' => true,
		'itemtype' => true,
		'itemprop' => true,
		'content' => true
	);
	if ( ! is_array( $tags['div'] ) ) {
		$tags['div'] = array();
	}
	$tags['div'] = array_merge( $tags['div'], $scheme_attribues );

	if ( ! is_array( $tags['a'] ) ) {
		$tags['a'] = array();
	}
	$tags['a'] = array_merge( $tags['a'], $scheme_attribues );

	return $tags;
}
