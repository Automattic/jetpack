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
	$classes     = implode( $classes, ' ' );
	$placeholder = sprintf( '<a href="%s">%s</a>', esc_url( $giphy_url ), esc_attr( $search_text ) );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<?php if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) : ?>
				<amp-iframe src="<?php echo esc_url( $giphy_url ); ?>" width="100" height="<?php echo absint( $padding_top ); ?>" sandbox="allow-scripts allow-same-origin" layout="responsive">
					<div placeholder>
						<?php echo wp_kses_post( $placeholder ); ?>
					</div>
				</amp-iframe>
			<?php else : ?>
				<div class="wp-block-jetpack-gif-wrapper" style="<?php echo esc_attr( $style ); ?>">
					<iframe src="<?php echo esc_url( $giphy_url ); ?>" title="<?php echo esc_attr( $search_text ); ?>"></iframe>
				</div>
			<?php endif; ?>
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
