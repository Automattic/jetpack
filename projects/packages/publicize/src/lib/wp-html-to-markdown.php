<?php
/**
 * Defines wp_html_to_markdown() for sites without the html-to-md library.
 *
 * A stand-in, not the library: it takes no options, and tables, embeds and other elements
 * without a CommonMark form are reduced to their text.
 * Not autoloaded: require it right before the call, so the library has had the chance to load first.
 *
 * @link https://github.com/dmsnell/html-to-md
 *
 * @package automattic/jetpack-publicize
 */

use Automattic\Jetpack\Publicize\Lib\Markdown;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! function_exists( 'wp_html_to_markdown' ) ) {
	/**
	 * Converts HTML to Markdown.
	 *
	 * @param string $html The HTML.
	 * @return string The Markdown, or an empty string if the HTML cannot be converted.
	 */
	function wp_html_to_markdown( $html ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- Same name as the library's function, which it stands in for.
		return (string) Markdown::from_html( (string) $html );
	}
}
