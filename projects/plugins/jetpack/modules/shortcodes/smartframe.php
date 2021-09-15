<?php
/**
 * Smartframe.io embed
 *
 * Example URL: https://mikael-korpela.smartframe.io/p/mantymetsa_1630927773870/7673dc41a775fb845cc26acf24f1fe4?t=rql1c6dbpv2
 * Example embed code: <script src="https://embed.smartframe.io/6ae67829d1264ee0ea6071a788940eae.js" data-image-id="mantymetsa_1630927773870" data-width="100%" data-max-width="1412px"></script>
 * 
 * @package automattic/jetpack
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'init', 'jetpack_smartframe_enable_embeds' );
} else {
	jetpack_smartframe_enable_embeds();
}


/**
 * Register smartframe as oembed provider. Add filter to reverse iframes to shortcode. Register [smartframe] shortcode.
 *
 * @since 9.3.3
 */
function jetpack_smartframe_enable_embeds() {
    // Support their oEmbed Endpoint.
    wp_oembed_add_provider( '#https?://(.*?).smartframe.(io|net)/.*#i', 'https://oembed.smartframe.io/', true );

    // Allow script to be filtered to short code (so direct copy+paste can be done).
	add_filter( 'the_content', 'wpcom_shortcodereverse_smartframe' );

	// Actually display the smartframe Embed.
	add_shortcode( 'smartframe', 'jetpack_smartframe_shortcode' );
}

/**
 * Filters the oEmbed provider URL for smartframe URLs to include site URL host as
 * caller if available, falling back to "wordpress.com". Must be applied at
 * time of embed in case that `init` is too early (WP.com REST API).
 *
 * @module shortcodes
 *
 * @since 9.3.3
 *
 * @see WP_oEmbed::fetch
 *
 * @return string oEmbed provider URL
 */
add_filter( 'oembed_fetch_url', 'smartframe_add_oembed_endpoint_caller' );

/**
 * Filter the embeds to add a caller parameter.
 *
 * @param string $provider URL of the oEmbed provider.
 */
function smartframe_add_oembed_endpoint_caller( $provider ) {

	// By time filter is called, original provider URL has had url, maxwidth,
	// maxheight query parameters added.
	if ( 0 !== strpos( $provider, 'https://oembed.smartframe.io/' ) ) {
		return $provider;
	}

	// Set the caller argument to pass to smartframe's oembed provider.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {

		// Only include caller for non-private sites.
		if ( ! function_exists( 'is_private_blog' ) || ! is_private_blog() ) {
			$host = wp_parse_url( get_bloginfo( 'url' ), PHP_URL_HOST );
		}

		// Fall back to WordPress.com.
		if ( empty( $host ) ) {
			$host = 'wordpress.com';
		}
	} else {
		$host = wp_parse_url( get_home_url(), PHP_URL_HOST );
	}

	return add_query_arg( 'caller', $host, $provider );
}

/**
 * Compose shortcode based on smartframe iframes.
 *
 * @since 9.3.3
 *
 * @param string $content Post content.
 *
 * @return mixed
 */
function wpcom_shortcodereverse_smartframe( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'embed.smartframe.io' ) ) {
		return $content;
	}

	$regexp     = '!<script\ssrc="https://embed.smartframe.io/(\w+).js"\sdata-image-id="(.*?)"(\sdata-width="(\d+(%|px))"\s)?(data-max-width="(\d+(%|px)))?"></script>!i';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( compact( 'regexp', 'regexp_ent' ) as $regexp ) {
		if ( ! preg_match_all( $regexp, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {	
            $script_id = $match[1];

            if ( empty( $script_id ) ) {
				continue;
			}

            $image_id = $match[2];

            if ( empty( $image_id ) ) {
				continue;
			}

            if( isset( $match[4] ) ) {
                $width = $match[4];
            }

            if( isset( $match[7] )) {
                $max_width = $match[7];  
            }		

			$shortcode = '[smartframe script-id="'.$script_id.'" image-id="' . esc_attr( $image_id ) . '"';
			if ( ! empty( $width ) ) {
				$shortcode .= ' width="' . esc_attr( $width ) . '"';
			}
			if ( ! empty( $max_width ) ) {
				$shortcode .= ' max-width="' . esc_attr( $max_width ) . '"';
			}
			$shortcode .= ']';

			$content = str_replace( $match[0], $shortcode, $content );
		}
	}
	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'html_to_shortcode', 'smartframe' );

	return $content;
}

/**
 * Parse shortcode arguments and render its output.
 *
 * @since 9.3.3
 *
 * @param array  $atts    Shortcode parameters.
 * @param string $content Content enclosed by shortcode tags.
 *
 * @return string
 */
function jetpack_smartframe_shortcode( $atts ) {
	if ( ! empty( $atts['image-id'] ) ) {
		$image_id = $atts['image-id'];
	} else {
		return '<!-- Missing smartframe image-id -->';
	}
    if ( ! empty( $atts['script-id'] ) ) {
		$script_id = $atts['script-id'];
	} else {
		return '<!-- Missing smartframe script-id -->';
	}

	$params = array(
        // ignore width for now, smartframe embed code has it "100%". % isn't allowed in oembed, making it 100px
		// 'width'  => isset( $atts['width'] ) ? (int) $atts['width'] : null,
		'max-width' => isset( $atts['max-width'] ) ? (int) $atts['max-width'] : null,
	);

    // wrap the embed with wp-block-embed__wrapper, otherwise it would be aligned to the very left of the viewport
	return "<div class='wp-block-embed__wrapper'>" . wp_oembed_get( 'https://imagecards.smartframe.io/' . $script_id . '/' . $image_id, array_filter( $params ) ) . "</div>";
}
