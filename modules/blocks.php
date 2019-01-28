<?php
/**
 * Load code specific to Gutenberg blocks which are not tied to a module.
 * This file is unusual, and is not an actual `module` as such.
 * It is included in ./module-extras.php
 */

jetpack_register_block(
	'gif',
	array(
		'render_callback' => 'jetpack_gif_block_render',
	)
);

jetpack_register_block(
	'map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

jetpack_register_block( 'vr' );

/**
 * Tiled Gallery block. Depends on the Photon module.
 *
 * @since 6.9.0
*/
if (
	( defined( 'IS_WPCOM' ) && IS_WPCOM ) ||
	class_exists( 'Jetpack_Photon' ) && Jetpack::is_module_active( 'photon' )
) {
	jetpack_register_block(
		'tiled-gallery',
		array(
			'render_callback' => 'jetpack_tiled_gallery_load_block_assets',
		)
	);

	/**
	 * Tiled gallery block registration/dependency declaration.
	 *
	 * @param array  $attr - Array containing the block attributes.
	 * @param string $content - String containing the block content.
	 *
	 * @return string
	 */
	function jetpack_tiled_gallery_load_block_assets( $attr, $content ) {
		$dependencies = array(
			'lodash',
			'wp-i18n',
			'wp-token-list',
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

/**
 * Gif block registration/dependency declaration.
 *
 * @param array $attr - Array containing the map block attributes.
 *
 * @return string
 */
function jetpack_gif_block_render( $attr ) {
	$align       = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$padding_top = isset( $attr['paddingTop'] ) ? $attr['paddingTop'] : 0;
	$style       = 'padding-top:' . $padding_top;
	$giphy_url   = isset( $attr['giphyUrl'] ) ? $attr['giphyUrl'] : null;
	$search_text = isset( $attr['searchText'] ) ? $attr['searchText'] : '';
	$caption     = isset( $attr['caption'] ) ? $attr['caption'] : null;

	if ( ! $giphy_url ) {
		return null;
	}

	$classes = array(
		'wp-block-jetpack-gif',
		'align' . $align,
	);
	if ( isset( $attr['className'] ) ) {
		array_push( $classes, $attr['className'] );
	}

	ob_start();
	?>
	<div class="<?php echo esc_attr( implode( $classes, ' ' ) ); ?>">
		<figure>
			<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
				<iframe src="<?php echo esc_url( $giphy_url ); ?>" title="<?php echo esc_attr( $search_text ); ?>"></iframe>
			</div>
			<?php if ( $caption ) : ?>
				<figcaption class="wp-block-jetpack-gif-caption gallery-caption"><?php echo wp_kses_post( $caption ); ?></figcaption>
			<?php endif; ?>
		</figure>
	</div>
	<?php
	$html = ob_get_clean();

	Jetpack_Gutenberg::load_assets_as_required( 'gif' );
	return $html;
}

/**
 * Map block registration/dependency declaration.
 *
 * @param array  $attr - Array containing the map block attributes.
 * @param string $content - String containing the map block content.
 *
 * @return string
 */
function jetpack_map_block_load_assets( $attr, $content ) {
	$dependencies = array(
		'lodash',
		'wp-element',
		'wp-i18n',
	);

	$api_key = Jetpack_Options::get_option( 'mapbox_api_key' );

	Jetpack_Gutenberg::load_assets_as_required( 'map', $dependencies );
	return preg_replace( '/<div /', '<div data-api-key="'. esc_attr( $api_key ) .'" ', $content, 1 );
}

/**
 * Register the Contact Info block and its child blocks.
 */
jetpack_register_block( 'contact-info' );
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
