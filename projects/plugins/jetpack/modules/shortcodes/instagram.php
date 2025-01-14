<?php
/**
 * Instagram embeds
 *
 * @package automattic/jetpack
 */

define( 'JETPACK_INSTAGRAM_EMBED_REGEX', '/https?:\/\/(www.)?instagram\.com\/(p|reel|reels)\/(.*)?/' );

/*
 * Example URL: https://www.instagram.com/p/DDp9QYpy-Cg/
 * Example URL: https://www.instagram.com/reels/DC2gSRjS68t/
 */
wp_embed_register_handler( 'instagram', JETPACK_INSTAGRAM_EMBED_REGEX, 'jetpack_instagram_embed_handler' );

/**
 * Callback to modify output of embedded Instagram posts.
 *
 * @param array  $matches Regex partial matches against the URL passed.
 * @param array  $attr    Attributes received in embed response.
 * @param string $url     Requested URL to be embedded.
 * @return string Instagram embed markup.
 */
function jetpack_instagram_embed_handler( $matches, $attr, $url ) {
	// Transform reels URLs to into reel. Only singulars are embeddable.
	$url = str_replace( '/reels', '/reel', $url );

	$embed = sprintf(
		'<blockquote
			class="instagram-media"
			data-instgrm-captioned
			data-instgrm-permalink="%s"
			data-instgrm-version="14" style="
			background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; height:920px; padding:0; width:99.375%%; width:-webkit-calc(100%% - 2px); width:calc(100%% - 2px);"
		>
			<div style="padding:16px;"></div>
		</blockquote>',
		esc_url( $url )
	);

	wp_register_script(
		'jetpack-instagram-embed',
		'https://www.instagram.com/embed.js',
		array(),
		JETPACK__VERSION,
		true
	);

	// Skip rendering scripts in an AMP context.
	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return $embed;
	}

	// since Instagram is a faux embed, we need to load the JS SDK in the wpview embed iframe.
	if (
		defined( 'DOING_AJAX' )
		&& DOING_AJAX
		// No need to check for a nonce here, that's already handled by Core further up.
		&& ! empty( $_POST['action'] ) // phpcs:ignore WordPress.Security.NonceVerification.Missing
		&& 'parse-embed' === $_POST['action'] // phpcs:ignore WordPress.Security.NonceVerification.Missing
	) {
		ob_start();
		wp_scripts()->do_items( array( 'jetpack-instagram-embed' ) );
		$scripts = ob_get_clean();
		return $embed . $scripts;
	} else {
		wp_enqueue_script( 'jetpack-instagram-embed' );
		return $embed;
	}
}

/**
 * Shortcode handler.
 *
 * @param array $atts Shortcode attributes.
 */
function jetpack_instagram_shortcode_handler( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) ) {
		return;
	}

	if ( ! preg_match( JETPACK_INSTAGRAM_EMBED_REGEX, $atts['url'] ) ) {
		return;
	}

	return $wp_embed->shortcode( $atts, $atts['url'] );
}

add_shortcode( 'instagram', 'jetpack_instagram_shortcode_handler' );
