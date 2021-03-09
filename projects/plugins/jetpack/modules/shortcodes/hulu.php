<?php
/**
 * Hulu Shortcode
 *
 * [hulu 369061]
 * [hulu id=369061]
 * [hulu id=369061 width=512 height=288 start_time="10" end_time="20" thumbnail_frame="10"]
 * [hulu http://www.hulu.com/watch/369061]
 * [hulu id=gQ6Z0I990IWv_VFQI2J7Eg width=512 height=288]
 *
 * <object width="512" height="288">
 * <param name="movie" value="http://www.hulu.com/embed/gQ6Z0I990IWv_VFQI2J7Eg"></param>
 * <param name="allowFullScreen" value="true"></param>
 * <embed src="http://www.hulu.com/embed/gQ6Z0I990IWv_VFQI2J7Eg" type="application/x-shockwave-flash"  width="512" height="288" allowFullScreen="true"></embed>
 * </object>
 *
 * @package automattic/jetpack
 */

add_shortcode( 'hulu', 'jetpack_hulu_shortcode' );

if (
	! is_admin()
	/** This filter is documented in modules/shortcodes/youtube.php */
	&& apply_filters( 'jetpack_comments_allow_oembed', true )
	// No need for this on WordPress.com, this is done for multiple shortcodes at a time there.
	&& ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM )
) {
	add_filter( 'comment_text', 'jetpack_hulu_link', 1 );
}

/**
 * Return a Hulu video ID from a given set to attributes.
 *
 * @since 4.5.0
 *
 * @param array $atts Shortcode parameters.
 *
 * @return string $id  Hulu video ID.
 */
function jetpack_shortcode_get_hulu_id( $atts ) {
	// This will catch an id explicitly defined as such, or assume any param without a label is the id.  First found is used.
	if ( isset( $atts['id'] ) ) {
		// First we check to see if [hulu id=369061] or [hulu id=gQ6Z0I990IWv_VFQI2J7Eg] was used.
		$id = esc_attr( $atts['id'] );
	} elseif ( isset( $atts[0] ) && preg_match( '|www\.hulu\.com/watch/(\d+)|i', $atts[0], $match ) ) {
		// this checks for [hulu http://www.hulu.com/watch/369061].
		$id = (int) $match[1];
	} elseif ( isset( $atts[0] ) ) {
		// This checks for [hulu 369061] or [hulu 65yppv6xqa45s5n7_m1wng].
		$id = esc_attr( $atts[0] );
	} else {
		$id = 0;
	}

	return $id;
}

/**
 * Convert a Hulu shortcode into an embed code.
 *
 * @since 4.5.0
 *
 * @param array $atts An array of shortcode attributes.
 *
 * @return string The embed code for the Hulu video.
 */
function jetpack_hulu_shortcode( $atts ) {
	global $content_width;

	// Set a default content width, if it's not specified.
	$attr = shortcode_atts(
		array(
			'id'              => '',
			'width'           => $content_width ? $content_width : 640,
			'start_time'      => '',
			'end_time'        => '',
			'thumbnail_frame' => '',
		),
		$atts
	);

	$id = jetpack_shortcode_get_hulu_id( $atts );
	if ( ! $id ) {
		return '<!-- Hulu Error: Hulu shortcode syntax invalid. -->';
	}

	$start_time = 0;
	if ( is_numeric( $attr['start_time'] ) ) {
		$start_time = (int) $attr['start_time'];
	}
	if ( is_numeric( $attr['end_time'] ) && (int) $attr['end_time'] > $start_time ) {
		$end_time = (int) $attr['end_time'];
	}
	if ( is_numeric( $attr['thumbnail_frame'] ) ) {
		$thumbnail_frame = (int) $attr['thumbnail_frame'];
	}

	// check to see if $id is 76560 else we assume it's gQ6Z0I990IWv_VFQI2J7Eg
	// If id is numeric, we'll send it off to the hulu oembed api to get the embed URL (and non-numeric id).
	if ( is_numeric( $id ) ) {
		$transient_key   = "hulu-$id";
		$transient_value = get_transient( $transient_key );

		if ( false === $transient_value ) {
			// let's make a cross-site http request out to the hulu oembed api.
			$oembed_url       = sprintf(
				'https://www.hulu.com/api/oembed.json?url=%s',
				rawurlencode( 'https://www.hulu.com/watch/' . esc_attr( $id ) )
			);
			$response         = wp_remote_get( $oembed_url );
			$response_code    = wp_remote_retrieve_response_code( $response );
			$response_message = wp_remote_retrieve_response_message( $response );
			if ( 200 !== $response_code && ! empty( $response_message ) ) {
				return "<!-- Hulu Error: Hulu shortcode http error $response_message -->";
			} elseif ( 200 !== $response_code ) {
				return "<!-- Hulu Error: Hulu shortcode unknown error occurred, $response_code -->";
			} else {
				$response_body = wp_remote_retrieve_body( $response );
				$json          = json_decode( $response_body );

				// Pull out id from embed url (from oembed API).
				$embed_url_params = array();
				parse_str( wp_parse_url( $json->embed_url, PHP_URL_QUERY ), $embed_url_params );

				if ( isset( $embed_url_params['eid'] ) ) {
					$id = $embed_url_params['eid'];
				}
				// let's cache this response indefinitely.
				set_transient( $transient_key, $id );
			}
		} else {
			$id = $transient_value;
		}
	}

	if ( ! $id ) {
		return '<!-- Hulu Error: Not a Hulu video. -->';
	}

	$query_args        = array();
	$query_args['eid'] = esc_attr( $id );
	if ( isset( $start_time ) ) {
		$query_args['st'] = (int) $start_time;
	}
	if ( isset( $end_time ) ) {
		$query_args['et'] = (int) $end_time;
	}
	if ( isset( $thumbnail_frame ) ) {
		$query_args['it'] = 'i' . (int) $thumbnail_frame;
	}

	$iframe_url = add_query_arg( $query_args, 'https://www.hulu.com/embed.html' );
	$width      = (int) $attr['width'];
	$height     = round( ( $width / 640 ) * 360 );

	$html = sprintf(
		'<div class="embed-hulu" style="text-align: center;"><iframe src="%s" width="%s" height="%s" style="border:0;" scrolling="no" webkitAllowFullScreen
mozallowfullscreen allowfullscreen></iframe></div>',
		esc_url( $iframe_url ),
		esc_attr( $width ),
		esc_attr( $height )
	);
	$html = apply_filters( 'video_embed_html', $html );

	return $html;
}

/**
 * Callback to convert Hulu links in comments into a embed src.
 *
 * @since 4.5.0
 *
 * @param array $matches Array of matches from regex.
 *
 * @return string
 */
function jetpack_hulu_link_callback( $matches ) {
	$video_id = $matches[4];

	// Make up an embed src to pass to the shortcode reversal function.
	$attrs = array(
		'src' => 'https://www.hulu.com/embed.html?eid=' . esc_attr( $video_id ),
	);

	return wpcom_shortcodereverse_huluhelper( $attrs );
}

/**
 * Convert Hulu links in comments into a Hulu shortcode.
 *
 * @since 4.5.0
 *
 * @param string $content Post content.
 *
 * @return string
 */
function jetpack_hulu_link( $content ) {
	$content = preg_replace_callback( '!^(http(s)?://)?(www\.)?hulu\.com\/watch\/([0-9]+)$!im', 'jetpack_hulu_link_callback', $content );

	return $content;
}

/**
 * Makes a Hulu shortcode from $attrs and $pattern
 *
 * @since 4.5.0
 *
 * @param array $attrs Shortcode attributes.
 *
 * @return string
 */
function wpcom_shortcodereverse_huluhelper( $attrs ) {
	$attrs = wpcom_shortcodereverse_parseattr( $attrs );

	$src_attributes = array();
	parse_str( wp_parse_url( $attrs['src'], PHP_URL_QUERY ), $src_attributes );

	$attrs = array_merge( $attrs, $src_attributes );

	// If we don't have an eid, we can't do anything.  Just send back the src string.
	if ( ! isset( $attrs['eid'] ) ) {
		return $attrs['src'];
	}

	$shortcode = '[hulu id=' . esc_attr( $attrs['eid'] );

	if ( $attrs['width'] ) {
		$shortcode .= ' width=' . (int) $attrs['width'];
	}

	if ( $attrs['height'] ) {
		$shortcode .= ' height=' . (int) $attrs['height'];
	}

	if ( $attrs['st'] ) {
		$shortcode .= ' start_time=' . (int) $attrs['st'];
	}

	if ( $attrs['et'] ) {
		$shortcode .= ' end_time=' . (int) $attrs['et'];
	}

	if ( $attrs['it'] ) {
		// the thumbnail frame attribute comes with an i in front of the value, so we've got to remove that.
		$shortcode .= ' thumbnail_frame=' . (int) ltrim( $attrs['it'], 'i' );
	}
	$shortcode .= ']';

	return $shortcode;
}

/**
 * Initiates process to convert iframe HTML into a Hulu shortcode.
 *
 * Example:
 * <iframe width="512" height="288" src="http://www.hulu.com/embed.html?eid=nlg_ios3tutcfrhatkiaow&et=20&st=10&it=i11" frameborder="0" scrolling="no" webkitAllowFullScreen mozallowfullscreen allowfullscreen></iframe>
 *
 * Converts to:
 * [hulu id=nlg_ios3tutcfrhatkiaow width=512 height=288 start_time=10 end_time=20 thumbnail_frame=11]
 *
 * @since 4.5.0
 *
 * @param array $attrs Shortcode attributes.
 *
 * @return string
 */
function wpcom_shortcodereverse_huluembed( $attrs ) {

	$shortcode = wpcom_shortcodereverse_huluhelper( $attrs );

	if ( '[' === substr( $shortcode, 0, 1 ) ) {
		/** This action is documented in modules/widgets/social-media-icons.php */
		do_action( 'jetpack_bump_stats_extras', 'html_to_shortcode', 'hulu-embed' );
	}

	return $shortcode;
}
Filter_Embedded_HTML_Objects::register( '#^https?://www.hulu.com/embed.html#i', 'wpcom_shortcodereverse_huluembed', true );
