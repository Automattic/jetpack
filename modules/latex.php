<?php
/**
 * Module Name: Beautiful Math
 * Module Description: Mark up your posts with the <img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-2" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" /> markup language, perfect for complex mathematical equations and other &#252;ber-geekery.
 * Sort Order: 12
 * First Introduced: 1.1
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Writing
 */

/**
 * LaTeX support.
 *
 * Backward compatibility requires support for both "[latex][/latex]", and
 * "$latex $" shortcodes.
 *
 * $latex e^{\i \pi} + 1 = 0$  ->  [latex]e^{\i \pi} + 1 = 0[/latex]
 * $latex [a, b]$              ->  [latex][a, b][/latex]
 */

function latex_markup( $content ) {
	$regex = '%
		\$latex(?:=\s*|\s+)
		((?:
			[^$]+ # Not a dollar
		|
			(?<=(?<!\\\\)\\\\)\$ # Dollar preceded by exactly one slash
		)+)
		(?<!\\\\)\$ # Dollar preceded by zero slashes
	%ix';
	return preg_replace_callback( $regex, 'latex_src', $content );
}

function latex_src( $matches ) {
	$latex = $matches[1];

	$bg = latex_get_default_color( 'bg' );
	$fg = latex_get_default_color( 'text', '000' );
	$s = 0;


	$latex = latex_entity_decode( $latex );
	if ( preg_match( '/.+(&fg=[0-9a-f]{6}).*/i', $latex, $fg_matches ) ) {
		$fg = substr( $fg_matches[1], 4 );
		$latex = str_replace( $fg_matches[1], '', $latex );
	}
	if ( preg_match( '/.+(&bg=[0-9a-f]{6}).*/i', $latex, $bg_matches ) ) {
		$bg = substr( $bg_matches[1], 4 );
		$latex = str_replace( $bg_matches[1], '', $latex );
	}
	if ( preg_match( '/.+(&s=[0-9-]{1,2}).*/i', $latex, $s_matches ) ) {
		$s = (int) substr( $s_matches[1], 3 );
		$latex = str_replace( $s_matches[1], '', $latex );
	}

	return latex_render( $latex, $fg, $bg, $s );
}

function latex_get_default_color( $color, $default_color = 'ffffff' ) {
	global $themecolors;
	return isset($themecolors[$color]) ? $themecolors[$color] : $default_color;
}

function latex_entity_decode( $latex ) {
	return str_replace( array( '&lt;', '&gt;', '&quot;', '&#039;', '&#038;', '&amp;', "\n", "\r" ), array( '<', '>', '"', "'", '&', '&', ' ', ' ' ), $latex );
}

function latex_render( $latex, $fg, $bg, $s = 0 ) {
	$url = "//s0.wp.com/latex.php?latex=" . urlencode( $latex ) . "&bg=" . $bg . "&fg=" . $fg . "&s=" . $s;
	$url = esc_url( $url );
	$alt = str_replace( '\\', '&#92;', esc_attr( $latex ) );

	return '<img src="' . $url . '" alt="' . $alt . '" title="' . $alt . '" class="latex" />';
}

/**
 * The shortcode way. The attributes are the same as the old ones - 'fg' and 'bg', instead of foreground
 * and background, and 's' is for the font size.
 *
 * Example: [latex s=4 bg=00f fg=ff0]\LaTeX[/latex]
 */
function latex_shortcode( $atts, $content = '' ) {
	extract( shortcode_atts( array(
		's' => 0,
		'bg' => latex_get_default_color( 'bg' ),
		'fg' => latex_get_default_color( 'text', '000' )
	), $atts ) );

	return latex_render( latex_entity_decode( $content ), $fg, $bg, $s );
}

/**
 * LaTeX needs to be untexturized
 */
function latex_no_texturize( $shortcodes ) {
	$shortcodes[] = 'latex';
	return $shortcodes;
}

add_filter( 'no_texturize_shortcodes', 'latex_no_texturize' );

add_filter( 'the_content', 'latex_markup', 9 ); // before wptexturize
add_filter( 'comment_text', 'latex_markup', 9 ); // before wptexturize
add_shortcode( 'latex', 'latex_shortcode' );

