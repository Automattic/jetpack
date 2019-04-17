<?php

/*
[vimeo 141358]
[vimeo http://vimeo.com/141358]
[vimeo 141358 h=500&w=350]
[vimeo id=141358 width=350 height=500]

<iframe src="http://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo 'We Got More' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>
*/

function jetpack_shortcode_get_vimeo_id( $atts ) {
	if ( isset( $atts[0] ) ) {
		$atts[0] = trim( $atts[0], '=' );
		$id      = false;
		if ( is_numeric( $atts[0] ) ) {
			$id = (int) $atts[0];
		} elseif ( preg_match( '|vimeo\.com/(\d+)/?$|i', $atts[0], $match ) ) {
			$id = (int) $match[1];
		} elseif ( preg_match( '|player\.vimeo\.com/video/(\d+)/?$|i', $atts[0], $match ) ) {
			$id = (int) $match[1];
		}

		return $id;
	}

	return 0;
}

/**
 * Convert a Vimeo shortcode into an embed code.
 *
 * @param array $atts An array of shortcode attributes.
 *
 * @return string The embed code for the Vimeo video.
 */
function vimeo_shortcode( $atts ) {
	global $content_width;

	$attr = array_map(
		'intval',
		shortcode_atts(
			array(
				'id'       => 0,
				'width'    => 0,
				'height'   => 0,
				'autoplay' => 0,
				'loop'     => 0,
			),
			$atts
		)
	);

	if ( isset( $atts[0] ) ) {
		$attr['id'] = jetpack_shortcode_get_vimeo_id( $atts );
	}

	if ( ! $attr['id'] ) {
		return '<!-- vimeo error: not a vimeo video -->';
	}

	// [vimeo 141358 h=500&w=350]
	$params = shortcode_new_to_old_params( $atts ); // h=500&w=350
	$params = str_replace( array( '&amp;', '&#038;' ), '&', $params );
	parse_str( $params, $args );

	$width  = intval( $attr['width'] );
	$height = intval( $attr['height'] );

	// Support w and h argument as fallback.
	if ( empty( $width ) && isset( $args['w'] ) ) {
		$width = intval( $args['w'] );

		if ( empty( $height ) && ! isset( $args['h'] ) ) {
			// The case where w=300 is specified without h=200, otherwise $height
			// will always equal the default of 300, no matter what w was set to.
			$height = round( ( $width / 640 ) * 360 );
		}
	}

	if ( empty( $height ) && isset( $args['h'] ) ) {
		$height = (int) $args['h'];

		if ( ! isset( $args['w'] ) ) {
			$width = round( ( $height / 360 ) * 640 );
		}
	}

	if ( ! $width && ! empty( $content_width ) ) {
		$width = absint( $content_width );
	}

	// If setting the width with content_width has failed, defaulting
	if ( ! $width ) {
		$width = 640;
	}

	if ( ! $height ) {
		$height = round( ( $width / 640 ) * 360 );
	}

	/**
	 * Filter the Vimeo player width.
	 *
	 * @module shortcodes
	 *
	 * @since 3.4.0
	 *
	 * @param int $width Width of the Vimeo player in pixels.
	 */
	$width = (int) apply_filters( 'vimeo_width', $width );

	/**
	 * Filter the Vimeo player height.
	 *
	 * @module shortcodes
	 *
	 * @since 3.4.0
	 *
	 * @param int $height Height of the Vimeo player in pixels.
	 */
	$height = (int) apply_filters( 'vimeo_height', $height );

	$url = esc_url( 'https://player.vimeo.com/video/' . $attr['id'] );

	// Handle autoplay and loop arguments.
	if (
		isset( $args['autoplay'] ) && '1' === $args['autoplay'] // Parsed from the embedded URL.
		|| $attr['autoplay']                                    // Parsed from shortcode arguments.
		|| in_array( 'autoplay', $atts )                        // Catch the argument passed without a value.
	) {
		$url = add_query_arg( 'autoplay', 1, $url );
	}

	if (
		isset( $args['loop'] ) && '1' === $args['loop'] // Parsed from the embedded URL.
		|| $attr['loop']                                // Parsed from shortcode arguments.
		|| in_array( 'loop', $atts )                    // Catch the argument passed without a value.
	) {
		$url = add_query_arg( 'loop', 1, $url );
	}

	$html = sprintf(
		'<div class="embed-vimeo" style="text-align: center;"><iframe src="%1$s" width="%2$u" height="%3$u" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>',
		esc_url( $url ),
		esc_attr( $width ),
		esc_attr( $height )
	);

	/**
	 * Filter the Vimeo player HTML.
	 *
	 * @module shortcodes
	 *
	 * @since 1.2.3
	 *
	 * @param string $html Embedded Vimeo player HTML.
	 */
	$html = apply_filters( 'video_embed_html', $html );

	return $html;
}

add_shortcode( 'vimeo', 'vimeo_shortcode' );

/**
 * Callback to modify output of embedded Vimeo video using Jetpack's shortcode.
 *
 * @since 3.9
 *
 * @param array $matches Regex partial matches against the URL passed.
 * @param array $attr Attributes received in embed response
 * @param array $url Requested URL to be embedded
 *
 * @return string Return output of Vimeo shortcode with the proper markup.
 */
function wpcom_vimeo_embed_url( $matches, $attr, $url ) {
	return vimeo_shortcode( array( $url ) );
}

/**
 * For bare URLs on their own line of the form
 * http://vimeo.com/12345
 *
 * @since 3.9
 *
 * @uses wpcom_vimeo_embed_url
 */
function wpcom_vimeo_embed_url_init() {
	wp_embed_register_handler( 'wpcom_vimeo_embed_url', '#https?://(.+\.)?vimeo\.com/#i', 'wpcom_vimeo_embed_url' );
}

// Register handler to modify Vimeo embeds using Jetpack's shortcode output.
add_action( 'init', 'wpcom_vimeo_embed_url_init' );

function vimeo_embed_to_shortcode( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'player.vimeo.com/video/' ) ) {
		return $content;
	}

	$regexp     = '!<iframe\s+src=[\'"](https?:)?//player\.vimeo\.com/video/(\d+)[\w=&;?]*[\'"]((?:\s+\w+=[\'"][^\'"]*[\'"])*)((?:[\s\w]*))></iframe>!i';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			$id = (int) $match[2];

			$params = $match[3];

			if ( 'regexp_ent' == $reg ) {
				$params = html_entity_decode( $params );
			}

			$params = wp_kses_hair( $params, array( 'http' ) );

			$width  = isset( $params['width'] ) ? (int) $params['width']['value'] : 0;
			$height = isset( $params['height'] ) ? (int) $params['height']['value'] : 0;

			$wh = '';
			if ( $width && $height ) {
				$wh = ' w=' . $width . ' h=' . $height;
			}

			$shortcode = '[vimeo ' . $id . $wh . ']';
			$content   = str_replace( $match[0], $shortcode, $content );
		}
	}

	return $content;
}

add_filter( 'pre_kses', 'vimeo_embed_to_shortcode' );

/**
 * Replaces shortcodes and plain-text URLs to Vimeo videos with Vimeo embeds.
 * Covers shortcode usage [vimeo 1234] | [vimeo https://vimeo.com/1234] | [vimeo http://vimeo.com/1234]
 * Or plain text URLs https://vimeo.com/1234 | vimeo.com/1234 | //vimeo.com/1234
 * Links are left intact.
 *
 * @since 3.7.0
 * @since 3.9.5 One regular expression matches shortcodes and plain URLs.
 *
 * @param string $content HTML content
 * @return string The content with embeds instead of URLs
 */
function vimeo_link( $content ) {
	/**
	 *  [vimeo 12345]
	 *  [vimeo http://vimeo.com/12345]
	 */
	$shortcode = '(?:\[vimeo\s+[^0-9]*)([0-9]+)(?:\])';

	/**
	 *  http://vimeo.com/12345
	 *  https://vimeo.com/12345
	 *  //vimeo.com/12345
	 *  vimeo.com/some/descender/12345
	 *
	 *  Should not capture inside HTML attributes
	 *  [Not] <a href="vimeo.com/12345">Cool Video</a>
	 *  [Not] <a href="https://vimeo.com/12345">vimeo.com/12345</a>
	 *
	 *  Could erroneously capture:
	 *  <a href="some.link/maybe/even/vimeo">This video (vimeo.com/12345) is teh cat's meow!</a>
	 */
	$plain_url = "(?:[^'\">]?\/?(?:https?:\/\/)?vimeo\.com[^0-9]+)([0-9]+)(?:[^'\"0-9<]|$)";

	return jetpack_preg_replace_callback_outside_tags(
		sprintf( '#%s|%s#i', $shortcode, $plain_url ),
		'vimeo_link_callback',
		$content,
		'vimeo'
	);
}

/**
 * Callback function for the regex that replaces Vimeo URLs with Vimeo embeds.
 *
 * @since 3.7.0
 *
 * @param array $matches An array containing a Vimeo URL.
 * @return string The Vimeo HTML embed code.
 */
function vimeo_link_callback( $matches ) {
	$id = isset( $matches[2] ) ? $matches[2] : $matches[1];
	if ( isset( $id ) && ctype_digit( $id ) ) {
		return "\n" . vimeo_shortcode( array( 'id' => $id ) ) . "\n";
	}
	return $matches[0];
}

/** This filter is documented in modules/shortcodes/youtube.php */
if ( ! is_admin() && apply_filters( 'jetpack_comments_allow_oembed', true ) ) {
	// We attach wp_kses_post to comment_text in default-filters.php with priority of 10 anyway, so the iframe gets filtered out.
	// Higher priority because we need it before auto-link and autop get to it
	add_filter( 'comment_text', 'vimeo_link', 1 );
}
