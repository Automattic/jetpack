<?php
/**
 * Pinterest embeds
 *
 * Based on "Board Widget" example here: http://business.pinterest.com/widget-builder/#code
 */

// Example URL: http://pinterest.com/pinterest/pin-pets/
// Second Example URL: https://uk.pinterest.com/annsawesomepins/travel/
wp_embed_register_handler(
	'pinterest',
	'#'
	. 'https?://'
	. '(?:www\.)?'
	. '(?:[a-z]{2}\.)?'
	. 'pinterest\.[a-z.]+/'
	. '([^/]+)'
	. '(/[^/]+)?'
	. '#',
	'pinterest_embed_handler'
);

function pinterest_embed_handler( $matches, $attr, $url ) {
	// Pinterest's JS handles making the embed
    $script_src = '//assets.pinterest.com/js/pinit.js';
	wp_enqueue_script( 'pinterest-embed', $script_src, array(), false, true );

	$path = parse_url( $url, PHP_URL_PATH );
	if ( 0 === strpos( $path, '/pin/' ) ) {
		$embed_type = 'embedPin';
	} elseif ( preg_match( '#^/([^/]+)/?$#', $path ) ) {
		$embed_type = 'embedUser';
	} elseif ( preg_match( '#^/([^/]+)/([^/]+)/?$#', $path ) ) {
		$embed_type = 'embedBoard';
	} else {
		if ( current_user_can( 'edit_posts' ) ) {
			return __( 'Sorry, that Pinterest URL was not recognized.', 'jetpack' );
		}
		return;
	}

	$return = sprintf( '<a data-pin-do="%s" href="%s"></a>', esc_attr( $embed_type ), esc_url( $url ) );

	// If we're generating an embed view for the WordPress Admin via ajax...
	if ( doing_action( 'wp_ajax_parse-embed' ) ) {
		$return .= sprintf( '<script src="%s"></script>', esc_url( $script_src ) );
	}

	return $return;
}
