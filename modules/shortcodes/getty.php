<?php
/**
 * Getty shortcode
 *
 * [getty src="82278805" width="$width" height="$height"]
 * <div class="getty embed image" style="background-color:#fff;display:inline-block;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#a7a7a7;font-size:11px;width:100%;max-width:462px;"><div style="padding:0;margin:0;text-align:left;"><a href="http://www.gettyimages.com/detail/82278805" target="_blank" style="color:#a7a7a7;text-decoration:none;font-weight:normal !important;border:none;display:inline-block;">Embed from Getty Images</a></div><div style="overflow:hidden;position:relative;height:0;padding:80.086580% 0 0 0;width:100%;"><iframe src="//embed.gettyimages.com/embed/82278805?et=jGiu6FXXSpJDGf1SnwLV2g&sig=TFVNFtqghwNw5iJQ1MFWnI8f4Y40_sfogfZLhai6SfA=" width="462" height="370" scrolling="no" frameborder="0" style="display:inline-block;position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div><p style="margin:0;"></p></div>
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'init', 'jetpack_getty_enable_embeds' );
} else {
	jetpack_getty_enable_embeds( 'jetpack' );
}

/**
 * Register Getty as oembed provider. Add filter to reverse iframes to shortcode. Register [getty] shortcode.
 *
 * @since 4.5.0
 *
 * @param string $site Can be 'wpcom' or 'jetpack' and determines if we're in wpcom or in a Jetpack site.
 */
function jetpack_getty_enable_embeds( $site = 'wpcom' ) {

	// Set the caller argument to pass to Getty's oembed provider.
	$caller = 'jetpack' === $site
		? parse_url( get_home_url(), PHP_URL_HOST )
		: 'wordpress.com';

	// Support their oEmbed Endpoint
	wp_oembed_add_provider( '#https?://www\.gettyimages\.com/detail/.*#i', "https://embed.gettyimages.com/oembed/?caller=$caller", true );
	wp_oembed_add_provider( '#https?://(www\.)?gty\.im/.*#i',              "https://embed.gettyimages.com/oembed/?caller=$caller", true );

	// Allow iframes to be filtered to short code (so direct copy+paste can be done)
	add_filter( 'pre_kses', 'wpcom_shortcodereverse_getty' );

	// Actually display the Getty Embed
	add_shortcode( 'getty', 'jetpack_getty_shortcode' );
}

/**
 * Compose shortcode based on Getty iframes.
 *
 * @since 4.5.0
 *
 * @param string $content
 *
 * @return mixed
 */
function wpcom_shortcodereverse_getty( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'embed.gettyimages.com/embed' ) ) {
		return $content;
	}

	$regexp = '!<iframe\s+src=[\'"](https?:)?//embed\.gettyimages\.com/embed(/|/?\?assets=)(\d+(,\d+)*)[^\'"]*?[\'"]((?:\s+\w+=[\'"][^\'"]*[\'"])*)((?:[\s\w]*))></iframe>!i';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			$ids = esc_html( $match[3] );

			$params = $match[5];

			if ( 'regexp_ent' == $reg ) {
				$params = html_entity_decode( $params );
			}

			$params = wp_kses_hair( $params, array( 'http' ) );

			$width = isset( $params['width'] ) ? (int) $params['width']['value'] : 0;
			$height = isset( $params['height'] ) ? (int) $params['height']['value'] : 0;

			$shortcode = '[getty src="' . esc_attr( $ids ) . '"';
			if ( $width ) {
				$shortcode .= ' width="' . esc_attr( $width ) . '"';
			}
			if ( $height ) {
				$shortcode .= ' height="' . esc_attr( $height ) . '"';
			}
			$shortcode .= ']';

			$content = str_replace( $match[0], $shortcode, $content );
		}
	}

	// strip out enclosing div and any other markup
	$regexp = '%<div class="getty\s[^>]*+>.*?<div[^>]*+>(\[getty[^\]]*+\])\s*</div>.*?</div>%is';
	$regexp_ent = str_replace( array( '&amp;#0*58;', '[^&gt;]' ), array( '&amp;#0*58;|&#0*58;', '[^&]' ), htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			$content = str_replace( $match[0], $match[1], $content );
		}
	}

	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'html_to_shortcode', 'getty' );

	return $content;
}

/**
 * Parse shortcode arguments and render its output.
 *
 * @since 4.5.0
 *
 * @param array  $atts    Shortcode parameters.
 * @param string $content Content enclosed by shortcode tags.
 *
 * @return string
 */
function jetpack_getty_shortcode( $atts, $content = '' ) {

	if ( ! empty( $content ) ) {
		$src = $content;
	} elseif ( ! empty( $atts['src'] ) ) {
		$src = $atts['src'];
	} elseif ( ! empty( $atts[0] ) ) {
		$src = $atts[0];
	} else {
		return '<!-- Missing Getty Source ID -->';
	}

	$src = preg_replace( '/^(\d+(,\d+)*).*$/', '$1', $src );

	$args = array();
	$args['width'] = isset( $atts['width'] ) ? (int) $atts['width'] : '462';
	$args['height'] = isset( $atts['height'] ) ? (int) $atts['height'] : '370';

	return wp_oembed_get( 'https://gty.im/' . $src, $args );
}
