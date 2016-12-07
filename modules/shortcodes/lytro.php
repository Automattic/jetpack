<?php
/**
 * Lytro.com Short Code
 *
 * Format:
 *   [lytro photo='202' show_arrow='true' show_border='true' show_first_time_user='true' allow_full_view='true']
 *   [lytro username='lytroweb' photo='431119']
 *
 * Legend:
 *   username: the lytro.com username for newer embed format
 *   photo: the ID or the URL of the photo on lytro.com
 *   show_arrow: set to false to force-hide the menu in the lower right (not used in v2)
 *   show_border: set to true to force-show the border
 *   show_first_time_user: set to false to force-disable the first-time user experience (not used in v2)
 *   allow_full_view: set to true to allow an external site to have a full-zoom mode (not used in v2)
 *   enable_help: set to false to hide the question mark/help popup
 *
 * Output:
 *   <iframe width="400" height="415" src="https://www.lytro.com/living-pictures/202/embed?showArrow=true&showBorder=true&showFTU=true" frameborder="0" allowfullscreen></iframe>
 *   <iframe width="400" height="415" src="http://pictures.lytro.com/lytroweb/pictures/431119/embed" frameborder="0" allowfullscreen="" scrolling="no"></iframe>
 */

/**
 * Lytro.com Short Code Attributes Definition
 *
 * This helper function returns an array all available
 * shortcode attributes, their validation method, default
 * value and more.
 *
 * Keys:
 *   validate: a callable function or regular expression used to validate the input
 *   default: default value for shortcode attribute
 *   query_arg: the related lytro query argument name
 *
 * @since 4.5.0
 */
function jetpack_lytro_shortcode_attributes() {
	return array(
		'username'             => array(
			'default' => '',
		),
		'photo'                => array( // could be ID or URL, validated separately
			'default' => 0,
		),
		'width'                => array(
			'validate' => '#^\d+$#',
			'default'  => 400,
		),
		'height'               => array(
			'validate' => '#^\d+$#',
			'default'  => 415,
		),
		'show_arrow'           => array(
			'query_arg' => 'showArrow',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'show_border'          => array(
			'query_arg' => 'showBorder',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'show_first_time_user' => array(
			'query_arg' => 'showFTU',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'allow_full_view'      => array(
			'query_arg' => 'allowFullView',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'enable_help'          => array(
			'query_arg' => 'enableHelp',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'enable_attribution'   => array(
			'query_arg' => 'enableAttribution',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'enable_logo'          => array(
			'query_arg' => 'enableLogo',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'enable_fullscreen'    => array(
			'query_arg' => 'enableFullscreen',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'enable_play'          => array(
			'query_arg' => 'enablePlay',
			'validate'  => '#^(true|false)$#',
			'default'   => 'true',
		),
		'bg_color'             => array(
			'query_arg' => 'bgColor',
			'validate'  => '/^#(?:[0-9a-fA-F]{3}){1,2}$/',
			'default'   => '',
		),
	);
}

/**
 * Lytro.com Shortcode
 *
 * Allows embedding Lytro "living pictures" using [lytro photo="200"] or
 * [lytro photo="http://www.lytro.com/..."]. Additional attributes
 * like show_border, show_arrow, etc have priority over the ones supplied
 * in the URL.
 *
 * @since 4.5.0
 *
 * @param array $atts Shortcode attributes
 *
 * @uses jetpack_lytro_shortcode_attributes()
 * @return string Embed HTML or a <!-- commented out error -->
 */
function jetpack_lytro_shortcode_handler( $atts ) {
	$defaults   = array();
	$attributes = jetpack_lytro_shortcode_attributes();
	foreach ( $attributes as $key => $attribute ) {
		if ( isset( $attribute['default'] ) ) {
			$defaults[$key] = $attribute['default'];
		}
	}

	$atts = shortcode_atts( $defaults, $atts );

	// There has to at least be a photo attribute.
	if ( empty( $atts['photo'] ) ) {
		return '<!-- Lytro Shortcode Error: No Photo ID/URL -->';
	}

	// The photo attribute might be a URL
	if ( ! is_numeric( $atts['photo'] ) ) {
		$atts = array_merge( $atts, jetpack_lytro_shortcode_url_to_atts( $atts['photo'] ) );
	}

	// Validate all attributes by callable function or regular expression.
	foreach ( $atts as $key => $value ) {
		$attribute = $attributes[$key];
		if ( isset( $attribute['validate'] ) ) {
			$validate = $attribute['validate'];
			$valid    = is_callable( $validate ) ? call_user_func( $validate, $value ) : preg_match( $validate, $value );
			if ( ! $valid ) {
				$atts[$key] = $defaults[$key];
			}
		}
	}

	// The photo attribute might have changed, make sure it's still valid.
	if ( ! is_numeric( $atts['photo'] ) || ! $atts['photo'] ) {
		return '<!-- Lytro Shortcode Error: Invalid Photo ID/URL -->';
	}

	// Build a query which is then appended to the iframe src.
	$query_args = array();
	foreach ( $atts as $key => $value ) {
		$attribute = $attributes[$key];
		if ( isset( $attribute['query_arg'] ) && ! empty( $attribute['query_arg'] ) && ! empty( $value ) ) {
			$query_args[$attribute['query_arg']] = $value;
		}
	}

	if ( ! empty( $atts['username'] ) ) {
		$src = sprintf( 'https://pictures.lytro.com/%s/pictures/%d/embed', $atts['username'], $atts['photo'] );
	} else {
		$src = sprintf( 'https://pictures.lytro.com/pictures/%d/embed', $atts['photo'] );
	}

	// Add query args and build the iframe.
	$src = add_query_arg( $query_args, $src );

	return '<iframe width="' . esc_attr( $atts['width'] ) . '" height="' . esc_attr( $atts['height'] ) . '" src="' . esc_url( $src ) . '" frameborder="0" allowfullscreen scrolling="no"></iframe>';
}

add_shortcode( 'lytro', 'jetpack_lytro_shortcode_handler' );

/**
 * Lytro Shortcode URL to Shortcode Attributes
 *
 * This helper function parses a Lytro.com URL
 * and returns an attributes array.
 *
 * @since 4.5.0
 *
 * @uses jetpack_lytro_shortcode_attributes()
 */
function jetpack_lytro_shortcode_url_to_atts( $url ) {
	$attributes = jetpack_lytro_shortcode_attributes();
	$atts       = array();

	$url = str_replace( '&amp;', '&', $url );

	if ( preg_match( '#^https?://(www\.)?lytro\.com/living-pictures/([0-9]+)/?#i', $url, $matches ) ) {
		$atts['photo'] = $matches[2];
	} elseif ( preg_match( '#^https?://(www\.)?pictures\.lytro\.com/([^/]+)/pictures/([0-9]+)/?#i', $url, $matches ) ) {
		$atts['username'] = $matches[2];
		$atts['photo']    = $matches[3];
	}

	$url = parse_url( $url );
	if ( isset( $url['query'] ) ) {
		parse_str( $url['query'], $qargs );

		// Get the attributes with query_args and fill in the $atts array
		foreach ( $attributes as $key => $attribute ) {
			if ( isset( $attribute['query_arg'] ) && in_array( $attribute['query_arg'], array_keys( $qargs ) ) ) {
				$atts[$key] = $qargs[$attribute['query_arg']];
			}
		}
	}

	return $atts;
}

/**
 * Lytro Shortcode Reversal
 *
 * Example
 * <iframe width="400" height="415" src="https://www.lytro.com/living-pictures/202/embed?showBorder=true" frameborder="0" allowfullscreen></iframe>
 * <iframe width="400" height="415" src="http://pictures.lytro.com/lytroweb/pictures/431128/embed" frameborder="0" allowfullscreen="" scrolling="no"></iframe>
 *
 * Converts to:
 * [lytro photo="202" show_border="true" width="400" height="415"]
 *
 * @since 4.5.0
 *
 * @uses jetpack_lytro_shortcode_url_to_atts()
 * @uses wpcom_shortcodereverse_parseattr()
 */
function wpcom_shortcodereverse_lytro( $atts ) {
	$atts           = wpcom_shortcodereverse_parseattr( $atts );
	$shortcode_atts = array();

	// Grab the src URL and convert to shortcode attributes
	if ( $atts['src'] ) {
		$shortcode_atts = jetpack_lytro_shortcode_url_to_atts( $atts['src'] );
	}

	// Width and height too
	if ( $atts['width'] ) {
		$shortcode_atts['width'] = $atts['width'];
	}
	if ( $atts['height'] ) {
		$shortcode_atts['height'] = $atts['height'];
	}

	// Generate the shortcode.
	$shortcode = '';
	foreach ( $shortcode_atts as $key => $value ) {
		$shortcode .= " $key='" . esc_attr( $value ) . "'";
	}
	$shortcode = "[lytro {$shortcode}]";

	return $shortcode;
}

Filter_Embedded_HTML_Objects::register( '#^https?://(www\.)?lytro\.com/living-pictures/#i', 'wpcom_shortcodereverse_lytro', true );
Filter_Embedded_HTML_Objects::register( '#^https?://(www\.)?pictures\.lytro\.com/([^/]+)/pictures/([0-9]+)/embed#i', 'wpcom_shortcodereverse_lytro', true );

/**
 * Register Embed Handler
 *
 * Registers a WordPress Embed handler to allow embedding
 * Lytro images by publishing the Lytro URL on a line by itself.
 *
 * @since 4.5.0
 *
 * @uses wp_embed_register_handler
 */
function jetpack_lytro_register_embed_handler() {
	wp_embed_register_handler( 'lytro', '#^https?://(www\.)?lytro\.com/living-pictures/([0-9]+)/?#i', 'jetpack_lytro_embed_handler' );
	wp_embed_register_handler( 'lytro-v2', '#^https?://(www\.)?pictures\.lytro\.com/([^/]+)/pictures/([0-9]+)/?#i', 'jetpack_lytro_embed_handler' );
}

add_action( 'init', 'jetpack_lytro_register_embed_handler' );

/**
 * Lytro Embed Handler
 *
 * The embed handler function which converts a Lytro URL
 * on a line by itself into an embedded Lytro image.
 *
 * @since 4.5.0
 *
 * @see  jetpack_lytro_register_embed_handler
 * @uses jetpack_lytro_shortcode_url_to_atts
 * @uses jetpack_lytro_shortcode_handler
 */
function jetpack_lytro_embed_handler( $matches, $attr, $url, $rawattr ) {
	return jetpack_lytro_shortcode_handler( jetpack_lytro_shortcode_url_to_atts( $url ) );
}
