<?php
/**
 * A stand-in for the wp_html_to_markdown() of the html-to-md library.
 *
 * @package automattic/jetpack-publicize
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound, Universal.Files.SeparateFunctionsFromOO

/**
 * Marks its output.
 *
 * @param string $html The HTML.
 * @return string
 */
function wp_html_to_markdown( $html ) {
	return 'from the site: ' . trim( $html );
}
