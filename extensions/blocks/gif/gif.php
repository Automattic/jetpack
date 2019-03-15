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
 * Filter oEmbed HTML for Giphy to to replace GIF image with iframe/amp-iframe.
 *
 * @param mixed  $return The shortcode callback function to call.
 * @param string $url    The attempted embed URL.
 * @param array  $attr   An array of shortcode attributes.
 * @return string Embed.
 */
function jetpack_filter_giphy_oembed_html( $return, $url, $attr ) {
	unset( $attr ); // @todo Consider any width/height in $attr?
	if ( 'giphy.com' !== wp_parse_url( $url, PHP_URL_HOST ) ) {
		return $return;
	}
	if ( ! preg_match( '#^/gifs/(.*-)?(.+?)$#', wp_parse_url( $url, PHP_URL_PATH ), $matches ) ) {
		return $return;
	}

	$id = $matches[2];

	$width  = null;
	$height = null;
	$alt    = '';
	if ( preg_match( '/width="(\d+)"/', $return, $matches ) ) {
		$width = intval( $matches[1] );
	}
	if ( preg_match( '/height="(\d+)"/', $return, $matches ) ) {
		$height = intval( $matches[1] );
	}
	if ( preg_match( '/alt="(.*?)"/', $return, $matches ) ) {
		$alt = $matches[1];
	}
	if ( ! $width && ! $height ) {
		return $return;
	}

	$iframe = sprintf(
		'<iframe src="%s" width="%s" height="%s" title="%s"></iframe>',
		esc_url( "https://giphy.com/embed/$id" ),
		esc_attr( $width ),
		esc_attr( $height ),
		esc_attr( $alt )
	);

	if ( ! Jetpack_AMP_Support::is_amp_request() ) {
		return $iframe;
	}

	return sprintf(
		'<amp-iframe src="%s" width="%s" height="%s" sandbox="allow-scripts allow-same-origin" layout="responsive">%s<noscript>%s</noscript></amp-iframe>',
		esc_url( "https://giphy.com/embed/$id" ),
		esc_attr( $width ),
		esc_attr( $height ),
		sprintf( '<a href="%s" placeholder>%s</a>', esc_url( $url ), esc_html( $alt ) ),
		$iframe
	);
}
add_filter( 'embed_oembed_html', 'jetpack_filter_giphy_oembed_html', 10, 3 );

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
