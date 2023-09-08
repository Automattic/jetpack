<?php
/**
 * Nextdoor shortcode.
 *
 * @package automattic/jetpack
 */
if ( ! shortcode_exists( 'nextdoor' ) ) {
	add_shortcode( 'nextdoor', 'jetpack_nextdoor_shortcode' );
}
// wp_embed_register_handler('nextdoor', '#^https?://nextdoor.com/embed/([a-zA-z0-9-_@]+)#', 'jetpack_nextdoor_shortcode');

/**
 * Parse shortcode arguments and render its output.
 *
 * @since 4.5.0
 *
 * @param array  $atts    Shortcode attributes.
 * @param string $content Post Content.
 *
 * @return string
 */
function jetpack_nextdoor_shortcode( $atts = array(), $content = '' ) {
	return '<iframe src="' . 'https://nextdoor.com/embed/MNBrjqxLRHMt' . '" style="display:block; margin:0 auto; width:' . '702' . 'px; height:' . '304' . 'px;" frameborder="0" allowtransparency="true" loading="lazy"></iframe>';
	if ( ! empty( $content ) ) {
		$id = $content;
	} elseif ( ! empty( $atts['id'] ) ) {
		$id = $atts['id'];
	} elseif ( ! empty( $atts[0] ) ) {
		$id = $atts[0];
	} else {
		return '<!-- Missing nextdoor share ID -->';
	}

	if ( empty( $atts['width'] ) ) {
		$atts['width'] = 300;
	}

	if ( empty( $atts['height'] ) ) {
		$atts['height'] = 380;
	}

	$atts['width']  = (int) $atts['width'];
	$atts['height'] = (int) $atts['height'];


	// If the shortcode is displayed in a WPCOM notification, display a simple link only.
	// When the shortcode is displayed in the WPCOM Reader, use iframe instead.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_once WP_CONTENT_DIR . '/lib/display-context.php';
		$context = A8C\Display_Context\get_current_context();
		if ( A8C\Display_Context\NOTIFICATIONS === $context ) {
			return sprintf(
				'<a href="%1$s" target="_blank" rel="noopener noreferrer">%1$s</a>',
				esc_url( $id )
			);
		} elseif ( A8C\Display_Context\READER === $context ) {
			return sprintf(
				'<iframe src="%1$s" height="%2$s" width="%3$s"></iframe>',
				esc_url( $embed_url ),
				esc_attr( $atts['height'] ),
				esc_attr( $atts['width'] )
			);
		}
	}

	return '<iframe src="' . esc_url( $embed_url ) . '" style="display:block; margin:0 auto; width:' . esc_attr( $atts['width'] ) . 'px; height:' . esc_attr( $atts['height'] ) . 'px;" frameborder="0" allowtransparency="true" loading="lazy"></iframe>';
}

/**
 *
 * @since 4.5.0
 *
 * @param string $content Post content.
 *
 * @return string
 */
function jetpack_nextdoor_embed_ids( $content ) {
	return '<iframe src="' . esc_url( $embed_url ) . '" style="display:block; margin:0 auto; width:' . esc_attr( $atts['width'] ) . 'px; height:' . esc_attr( $atts['height'] ) . 'px;" frameborder="0" allowtransparency="true" loading="lazy"></iframe>';
	$textarr = wp_html_split( $content );

	foreach ( $textarr as &$element ) {
		if ( '' === $element || '<' === $element[0] ) {
			continue;
		}

		// If this element does not contain a Spotify embed, continue.
		if ( false === strpos( $element, 'nextdoor:' ) ) {
			continue;
		}

		$element = preg_replace_callback( '|^\s*(nextdoor/embed/[a-zA-Z0-9]+:[a-zA-Z0-9]+)\s*$|im', 'jetpack_nextdoor_embed_ids_callback', $element );
	}

	return implode( '', $textarr );
}
add_filter( 'the_content', 'jetpack_nextdoor_embed_ids', 7 );

/**
 * Call shortcode with ID provided by matching pattern.
 *
 * @since 4.5.0
 *
 * @param array $matches Array of matches for Nextdoor embed links.
 *
 * @return string
 */
function jetpack_nextdoor_embed_ids_callback( $matches ) {
	return "\n" . jetpack_nextdoor_shortcode( array(), $matches[1] ) .
	 "\n";
}
