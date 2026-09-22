<?php
/**
 * Archive.org book shortcode.
 *
 * Usage:
 * [archiveorg Experime1940]
 * [archiveorg http://archive.org/details/Experime1940 poster=http://archive.org/images/map.png]
 * [archiveorg id=Experime1940 width=640 height=480 autoplay=1]

 * <iframe src="http://archive.org/embed/Experime1940&autoplay=1&poster=http://archive.org/images/map.png" width="640" height="480" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Get ID of requested archive.org embed.
 *
 * @since 4.5.0
 *
 * @param array $atts Shortcode attributes.
 *
 * @return int|string
 */
function jetpack_shortcode_get_archiveorg_id( $atts ) {
	if ( isset( $atts[0] ) ) {
		$atts[0] = trim( $atts[0], '=' );
		if ( preg_match( '#archive.org/(details|embed)/(.+)/?$#i', $atts[0], $match ) ) {
			$id = $match[2];
		} else {
			$id = $atts[0];
		}
		return $id;
	}
	return 0;
}

/**
 * Convert an archive.org shortcode into an embed code.
 *
 * @since 4.5.0
 *
 * @param array $atts An array of shortcode attributes.
 * @return string The embed code for the archive.org video.
 */
function jetpack_archiveorg_shortcode( $atts ) {
	global $content_width;

	if ( isset( $atts[0] ) && empty( $atts['id'] ) ) {
		$atts['id'] = jetpack_shortcode_get_archiveorg_id( $atts );
	}

	$atts = shortcode_atts(
		array(
			'id'       => '',
			'width'    => 640,
			'height'   => 480,
			'autoplay' => 0,
			'poster'   => '',
			'playlist' => 0,
		),
		$atts
	);

	if ( ! $atts['id'] ) {
		return '<!-- error: missing archive.org ID -->';
	}

	$id = $atts['id'];

	// Allow extra query parameters to be baked into the identifier, e.g. "myitem&playlist=1" or "myitem?playlist=1".
	// In some environments a the_content filter encodes "&" to "&amp;" before do_shortcode runs, so the
	// parser receives "myitem&amp;playlist=1" — normalize that back before splitting. The sibling function
	// jetpack_archiveorg_embed_to_shortcode() splits on "&amp;" for the same reason.
	$id            = str_replace( '&amp;', '&', $id );
	$id_extra_args = array();
	if ( preg_match( '/^([^?&]*)[?&](.*)$/', $id, $id_match ) ) {
		$id = $id_match[1];
		wp_parse_str( $id_match[2], $id_extra_args );
	}

	// Re-check after the split — an identifier that's only a query string (e.g. "?playlist=1") leaves $id empty
	// and would otherwise produce an item-less embed URL.
	if ( '' === $id ) {
		return '<!-- error: missing archive.org ID -->';
	}

	if ( ! $atts['width'] ) {
		$width = absint( $content_width );
	} else {
		$width = (int) $atts['width'];
	}

	if ( ! $atts['height'] ) {
		$height = round( ( $width / 640 ) * 360 );
	} else {
		$height = (int) $atts['height'];
	}

	$query_args = array();
	if ( $atts['autoplay'] ) {
		$query_args['autoplay'] = 1;
	}
	if ( $atts['poster'] ) {
		$query_args['poster'] = $atts['poster'];
	}
	if ( $atts['playlist'] ) {
		$query_args['playlist'] = 1;
	}

	// Explicit shortcode attributes take precedence over query parameters baked into the identifier.
	$query_args = array_merge( $id_extra_args, $query_args );

	$url = 'https://archive.org/embed/' . $id;
	if ( ! empty( $query_args ) ) {
		$url = add_query_arg( $query_args, $url );
	}

	return sprintf(
		'<div class="embed-archiveorg" style="text-align:center;"><iframe title="%s" src="%s" width="%s" height="%s" style="border:0;" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe></div>',
		esc_attr__( 'Archive.org', 'jetpack' ),
		esc_url( $url ),
		esc_attr( $width ),
		esc_attr( $height )
	);
}

add_shortcode( 'archiveorg', 'jetpack_archiveorg_shortcode' );

/**
 * Compose shortcode from archive.org iframe.
 *
 * @since 4.5.0
 *
 * @param string $content Post content.
 *
 * @return mixed
 */
function jetpack_archiveorg_embed_to_shortcode( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'archive.org/embed/' ) ) {
		return $content;
	}

	$processor = new class( $content ) extends WP_HTML_Tag_Processor {
		/**
		 * Replaced the currently-matched token with new raw HTML.
		 *
		 * This is a dangerous function and perform a splice in-place
		 * with the supplied text. It _is_, however, safer than using
		 * a PCRE pattern to attempt to find the start and end of an
		 * IFRAME element and swap out the text there, as this will
		 * retain the original boundaries.
		 *
		 * @param string $new_raw_html Already-escaped and raw HTML.
		 */
		public function replace_entire_token( $new_raw_html ) {
			$this->set_bookmark( 'here' );
			$here = $this->bookmarks['here'];

			$this->lexical_updates[] = new WP_HTML_Text_Replacement(
				$here->start,
				$here->length,
				$new_raw_html
			);
		}
	};

	while ( $processor->next_tag( 'IFRAME' ) ) {
		$src = $processor->get_attribute( 'src' );
		if ( ! is_string( $src ) || 1 !== preg_match( '~^https?://archive\.org/embed/~', $src ) ) {
			continue;
		}

		$query = wp_parse_url( $src, PHP_URL_QUERY );
		if ( ! is_string( $query ) || ! str_contains( $query, '=' ) ) {
			continue;
		}

		$query_args     = array();
		$shortcode_args = array();

		wp_parse_str( $query, $query_args );

		if ( is_string( $query_args['id'] ?? null ) ) {
			$shortcode_args['id'] = $query_args['id'];
		}

		if ( '1' === ( $query_args['autoplay'] ?? null ) ) {
			$shortcode_args['autoplay'] = '1';
		}

		if ( is_string( $query_args['poster'] ?? null ) ) {
			$shortcode_args['poster'] = $query_args['poster'];
		}

		$width  = $processor->get_attribute( 'width' );
		$width  = is_string( $width ) ? (int) $width : 0;
		$height = $processor->get_attribute( 'height' );
		$height = is_string( $height ) ? (int) $height : 0;

		if ( $width > 0 && $height > 0 ) {
			$shortcode_args['width']  = "{$width}";
			$shortcode_args['height'] = "{$height}";
		}

		$shortcode = '[archiveorg';
		foreach ( $shortcode_args as $name => $value ) {
			$value      = strtr( $value, array( '"' => '&quot;' ) );
			$shortcode .= " {$name}=\"{$value}\"";
		}
		$shortcode .= ']';

		$processor->replace_entire_token( $shortcode );
	}

	return $processor->get_updated_html();
}

if ( jetpack_shortcodes_should_hook_pre_kses() ) {
	add_filter( 'pre_kses', 'jetpack_archiveorg_embed_to_shortcode' );
}
