<?php
/**
 * Load code specific to Gutenberg blocks which are not tied to a module.
 * This file is unusual, and is not an actual `module` as such.
 * It is included in ./module-extras.php
 */

jetpack_register_block(
	'gif',
	array(
		'render_callback' => 'jetpack_gif_block_load_assets',
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
function jetpack_gif_block_load_assets( $attr ) {
	$align       = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$style       = 'padding-top:' . $attr['paddingTop'];
	$giphy_url   = isset( $attr['giphyUrl'] ) ? $attr['giphyUrl'] : '//giphy.com/embed/ZgTR3UQ9XAWDvqy9jv';
	$search_text = isset( $attr['searchText'] ) ? $attr['searchText'] : '';
	$caption     = isset( $attr['caption'] ) ? $attr['caption'] : null;

	ob_start();
	?>
	<div class="wp-block-jetpack-gif align<?php echo esc_attr( $align ); ?>">
		<figure style="<?php echo esc_attr( $style ); ?>">
			<iframe src="<?php echo esc_attr( $giphy_url ); ?>" title="<?php echo esc_attr( $search_text ); ?>"></iframe>
		</figure>
		<?php if ( $caption ) : ?>
			<p class="wp-block-jetpack-gif-caption"><?php echo wp_kses_post( $caption ); ?></p>
		<?php endif; ?>
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
