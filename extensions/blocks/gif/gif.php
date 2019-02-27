<?php
/**
 * GIF Block.
 *
 * @since 7.0.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/gif',
	array(
		'render_callback' => 'jetpack_gif_block_render',
	)
);

/**
 * Gif block registration/dependency declaration.
 *
 * @param array $attr - Array containing the gif block attributes.
 *
 * @return string
 */
function jetpack_gif_block_render( $attr ) {
	$padding_top = isset( $attr['paddingTop'] ) ? $attr['paddingTop'] : 0;
	$style       = 'padding-top:' . $padding_top;
	$giphy_url   = isset( $attr['giphyUrl'] ) ? $attr['giphyUrl'] : null;
	$search_text = isset( $attr['searchText'] ) ? $attr['searchText'] : '';
	$caption     = isset( $attr['caption'] ) ? $attr['caption'] : null;

	if ( ! $giphy_url ) {
		return null;
	}

	/* TODO: replace with centralized block_class function */
	$align   = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$type    = 'gif';
	$classes = array(
		'wp-block-jetpack-' . $type,
		'align' . $align,
	);
	if ( isset( $attr['className'] ) ) {
		array_push( $classes, $attr['className'] );
	}
	$classes = implode( $classes, ' ' );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
				<iframe src="<?php echo esc_url( $giphy_url ); ?>"
						title="<?php echo esc_attr( $search_text ); ?>"></iframe>
			</div>
			<?php if ( $caption ) : ?>
				<figcaption
						class="wp-block-jetpack-gif-caption gallery-caption"><?php echo wp_kses_post( $caption ); ?></figcaption>
			<?php endif; ?>
		</figure>
	</div>
	<?php
	$html = ob_get_clean();

	Jetpack_Gutenberg::load_assets_as_required( 'gif' );

	return $html;
}
