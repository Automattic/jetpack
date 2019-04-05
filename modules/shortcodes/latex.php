<?php
/**
 * LaTeX shortcode.
 * Originally shipped as its own module, under modules/latex.php, and named "Beautiful Math".
 *
 * Backward compatibility requires support for both "[latex][/latex]", and
 * "$latex $" shortcodes.
 *
 * $latex e^{\i \pi} + 1 = 0$  ->  [latex]e^{\i \pi} + 1 = 0[/latex]
 * $latex [a, b]$              ->  [latex][a, b][/latex]
 * [latex s=4 bg=00f fg=ff0]\LaTeX[/latex]
 *
 * @package Jetpack
 */

/**
 * Replace LaTeX markup in post content.
 * This covers the use of the "$latex $" format.
 *
 * @param string $content Post content.
 */
function latex_markup( $content ) {
	$textarr = wp_html_split( $content );

	$regex = '%
		\$latex(?:=\s*|\s+)
		((?:
			[^$]+ # Not a dollar
		|
			(?<=(?<!\\\\)\\\\)\$ # Dollar preceded by exactly one slash
		)+)
		(?<!\\\\)\$ # Dollar preceded by zero slashes
	%ix';

	foreach ( $textarr as &$element ) {
		if ( '' === $element || '<' === $element[0] ) {
			continue;
		}

		if ( false === stripos( $element, '$latex' ) ) {
			continue;
		}

		$element = preg_replace_callback( $regex, 'latex_src', $element );
	}

	return implode( '', $textarr );
}

/**
 * Extract LaTex parameters to be used in LaTeX image.
 *
 * @param array $matches Array of matches found when parsing post content.
 */
function latex_src( $matches ) {
	$latex = $matches[1];
	$bg    = latex_get_default_color( 'bg' );
	$fg    = latex_get_default_color( 'text', '000' );
	$s     = 0;

	$latex = latex_entity_decode( $latex );
	if ( preg_match( '/.+(&fg=[0-9a-f]{6}).*/i', $latex, $fg_matches ) ) {
		$fg    = substr( $fg_matches[1], 4 );
		$latex = str_replace( $fg_matches[1], '', $latex );
	}
	if ( preg_match( '/.+(&bg=[0-9a-f]{6}).*/i', $latex, $bg_matches ) ) {
		$bg    = substr( $bg_matches[1], 4 );
		$latex = str_replace( $bg_matches[1], '', $latex );
	}
	if ( preg_match( '/.+(&s=[0-9-]{1,2}).*/i', $latex, $s_matches ) ) {
		$s     = (int) substr( $s_matches[1], 3 );
		$latex = str_replace( $s_matches[1], '', $latex );
	}

	return latex_render( $latex, $fg, $bg, $s );
}

/**
 * Get a default color to use for the background and the foreground of LaTeX formulae.
 * Default color can be provided by themes on WordPress.com.
 *
 * @param string $color         Name of the color to get (e.g. 'text' for text color, 'bg' for background color).
 * @param string $default_color Default color if no color is specified.
 */
function latex_get_default_color( $color, $default_color = 'ffffff' ) {
	global $themecolors;

	return isset( $themecolors[ $color ] ) ? $themecolors[ $color ] : $default_color;
}

/**
 * Clean up LaTex formula before it's sent to WordPress for the creation of a LaTex formula image.
 *
 * @param string $latex LaTeX formula.
 */
function latex_entity_decode( $latex ) {
	return str_replace(
		array(
			'&lt;',
			'&gt;',
			'&quot;',
			'&#039;',
			'&#038;',
			'&amp;',
			"\n",
			"\r",
		),
		array( '<', '>', '"', "'", '&', '&', ' ', ' ' ),
		$latex
	);
}

/**
 * Render image of the LaTeX formula.
 *
 * @param string $latex LaTeX formula.
 * @param string $fg    Foreground color.
 * @param string $bg    Background color.
 * @param int    $s     Formula size.
 */
function latex_render( $latex, $fg, $bg, $s = 0 ) {
	$url = add_query_arg(
		array(
			'latex' => rawurlencode( $latex ),
			'bg'    => sanitize_hex_color_no_hash( $bg ),
			'fg'    => sanitize_hex_color_no_hash( $fg ),
			's'     => absint( $s ),
		),
		'https://s0.wp.com/latex.php'
	);

	return sprintf(
		'<img src="%1$s" alt="%2$s" title="%2$s" class="latex" />',
		esc_url( $url ),
		str_replace( '\\', '&#92;', esc_attr( $latex ) )
	);
}

/**
 * The shortcode way. The attributes are the same as the old ones - 'fg' and 'bg', instead of foreground
 * and background, and 's' is for the font size.
 *
 * Example: [latex s=4 bg=00f fg=ff0]\LaTeX[/latex]
 *
 * @param array  $atts    Shortcode attributes.
 * @param string $content Post content.
 */
function latex_shortcode( $atts, $content = '' ) {
	$attributes = shortcode_atts(
		array(
			'fg' => latex_get_default_color( 'text', '000' ),
			'bg' => latex_get_default_color( 'bg' ),
			's'  => 0,
		),
		$atts,
		'latex'
	);

	return latex_render(
		latex_entity_decode( $content ),
		$attributes['fg'],
		$attributes['bg'],
		$attributes['s']
	);
}

/**
 * LaTeX needs to be untexturized
 *
 * @param array $shortcodes An array of shortcodes to exempt from texturizations.
 */
function latex_no_texturize( $shortcodes ) {
	$shortcodes[] = 'latex';
	return $shortcodes;
}
add_filter( 'no_texturize_shortcodes', 'latex_no_texturize' );

add_filter( 'the_content', 'latex_markup', 9 ); // before wptexturize.
add_filter( 'comment_text', 'latex_markup', 9 ); // before wptexturize.
add_shortcode( 'latex', 'latex_shortcode' );
