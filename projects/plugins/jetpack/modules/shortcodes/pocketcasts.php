<?php
/**
 * Pocket Casts embed
 *
 * TODO: Example URL: https://pca.st/963s087t
 * TODO: Example embed code: <iframe src="https://pocketcasts.com/embed/963s087t" width="640" height="480" frameborder="0" allowfullscreen></iframe>
 *
 * @package automattic/jetpack
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'init', 'jetpack_pocketcasts_enable_embeds' );
} else {
	jetpack_pocketcasts_enable_embeds();
}

/**
 * Register Pocket Casts as oembed provider. Add filter to reverse iframes to shortcode. Register [pocketcasts] shortcode.
 *
 * @since 10.9
 */
function jetpack_pocketcasts_enable_embeds() {
	// Support their oEmbed Endpoint.
	// TODO: Update string to match Pocket Casts' embed URL format and oEmbed API endpoint.
	wp_oembed_add_provider( '#https?://pocketcasts.com/embed/\w+#i', 'https://api.pocketcasts.com/v1/oembed', true );

	// Allow script to be filtered to short code (so direct copy+paste can be done).
	add_filter( 'pre_kses', 'jetpack_shortcodereverse_pocketcasts' );

	// Actually display the Pocket Casts Embed.
	add_shortcode( 'pocketcasts', 'jetpack_pocketcasts_shortcode' );
}

/**
 * Compose shortcode based on Pocket Casts iframes.
 *
 * @since 10.4
 *
 * @param string $content Post content.
 *
 * @return mixed
 */
function jetpack_shortcodereverse_pocketcasts( $content ) {
	// TODO: Update string to match with Pocket Casts' embed URL format.
	if ( ! is_string( $content ) || false === stripos( $content, 'pocketcasts.com/embed' ) ) {
		return $content;
	}

	// TODO: Update this regex when we how the Pocket Casts embed iframe html looks like.
	$regexp = '/<iframe (?:loading="lazy" )?src="https:\/\/pocketcasts.com\/embed\/(\w+)" width="(\d+)" height="(\d+)" frameborder="0" allowfullscreen(?:="")?><\/iframe>/i';

	if ( preg_match_all( $regexp, $content, $matches, PREG_SET_ORDER ) ) {
		foreach ( $matches as $match ) {
			// We need at least a id.
			if ( isset( $match[1] ) ) {
				$shortcode = sprintf(
					'[pocketcasts id="%1$s" width="%2$s" height="%3$s"]',
					esc_attr( $match[1] ),
					esc_attr( $match[2] ),
					esc_attr( $match[3] )
				);
				$content   = str_replace( $match[0], $shortcode, $content );
			}
		}
	}

	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'html_to_shortcode', 'pocketcasts' );

	return $content;
}

/**
 * Parse shortcode arguments and render its output.
 *
 * @since 10.9
 *
 * @param array $atts Shortcode parameters.
 *
 * @return string
 */
function jetpack_pocketcasts_shortcode( $atts ) {
	if ( ! empty( $atts['id'] ) ) {
		$id = $atts['id'];
	} else {
		return '<!-- Missing Pocket Casts ID -->';
	}

	// TODO: Update the default width & height of Pocket Casts embed player.
	if ( ! empty( $atts['width'] ) ) {
		$width = $atts['width'];
	} else {
		$width = '640';
	}

	if ( ! empty( $atts['height'] ) ) {
		$height = $atts['height'];
	} else {
		$height = '480';
	}

	$params = array(
		'id'     => esc_attr( $id ),
		'width'  => (int) $width,
		'height' => (int) $height,
	);

	$embed_url = sprintf(
		// TODO: Update when we know the format of the Pocket Casts embed url format.
		'https://pca.st/%1$s',
		esc_attr( $id )
	);

	$embed_code = wp_oembed_get( $embed_url, array_filter( $params ) );

	// wrap the embed with wp-block-embed__wrapper, otherwise it would be aligned to the very left of the viewport.
	return sprintf(
		'<div class="wp-block-embed__wrapper">%1$s</div>',
		$embed_code
	);
}
