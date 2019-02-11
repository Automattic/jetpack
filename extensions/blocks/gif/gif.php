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

	$giphy_id = null;
	if ( ! $giphy_url || ! preg_match( '#^' . preg_quote( 'https://giphy.com/embed/', '#' ) . '(\w+)#', $giphy_url, $matches ) ) {
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

	global $wp_embed;
	$embed_html = $wp_embed->shortcode( array(), $giphy_url );

	$width = 250; // @todo Is this the right default?
	if ( preg_match( '/width="(\d+)"/', $embed_html, $matches ) ) {
		$width = (int) $matches[1];
	}
	$height = 250; // @todo Is this the right default?
	if ( preg_match( '/height="(\d+)"/', $embed_html, $matches ) ) {
		$height = (int) $matches[1];
	}

	$placeholder = preg_replace( '#<img.*?alt="(.*?)".*?>#', '$1', $embed_html );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $classes ); ?>">
		<figure>
			<?php if ( Jetpack_AMP_Support::is_amp_request() ) : ?>
				<amp-iframe src="<?php echo esc_url( $giphy_url ); ?>" width="<?php echo esc_attr( $width ); ?>" height="<?php echo esc_attr( $height ); ?>" sandbox="allow-scripts allow-same-origin" layout="responsive">
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
