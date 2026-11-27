<?php
/**
 * A stand-in for the wp_html_to_markdown() of the html-to-md library.
 *
 * @package automattic/jetpack-publicize
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound, Universal.Files.SeparateFunctionsFromOO

/**
 * Marks its output, and throws on HTML it does not support, like the library.
 *
 * @param string $html The HTML.
 * @return string
 * @throws RuntimeException On unsupported HTML.
 */
function wp_html_to_markdown( $html ) {
	if ( false !== strpos( $html, 'data-unsupported' ) ) {
		throw new RuntimeException( 'Unsupported HTML.' );
	}

	return 'from the site: ' . trim( $html );
}
