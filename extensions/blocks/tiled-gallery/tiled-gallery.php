<?php
/**
 * Tiled Gallery block. Depends on the Photon module.
 *
 * @since 6.9.0
 *
 * @package Jetpack
 */

if (
	( defined( 'IS_WPCOM' ) && IS_WPCOM ) ||
	class_exists( 'Jetpack_Photon' ) && Jetpack::is_module_active( 'photon' )
) {
	jetpack_register_block_type(
		'jetpack/tiled-gallery',
		array(
			'render_callback' => 'jetpack_tiled_gallery_load_block_assets',
		)
	);

	/**
	 * Tiled gallery block registration/dependency declaration.
	 *
	 * @param array  $attr    Array containing the block attributes.
	 * @param string $content String containing the block content.
	 *
	 * @return string
	 */
	function jetpack_tiled_gallery_load_block_assets( $attr, $content ) {
		$dependencies = array(
			// i18n isn't really needed for the view, but the current module structure
			// requires it during evaluation of an imported module:
			//
			// https://github.com/Automattic/wp-calypso/blob/4b25daefec1425165086a0aaac8f10ac6c479463/client/gutenberg/extensions/tiled-gallery/constants.js#L6
			//
			// With some restructuring we can remove this view dependency.
			'wp-i18n',
		);
		Jetpack_Gutenberg::load_assets_as_required( 'tiled-gallery', $dependencies );

		/**
		 * Filter the output of the Tiled Galleries content.
		 *
		 * @module tiled-gallery
		 *
		 * @since 6.9.0
		 *
		 * @param string $content Tiled Gallery block content.
		 */
		return apply_filters( 'jetpack_tiled_galleries_block_content', $content );
	}
}
