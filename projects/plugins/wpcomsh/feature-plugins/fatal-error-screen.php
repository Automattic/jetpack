<?php
/**
 * Customizes the core WordPress fatal error screen for WordPress.com Atomic sites.
 *
 * Mutates the HTML passed to the `wp_php_error_message` filter rather than
 * rebuilding it, so we inherit every decision WP core already made about which
 * sentence to show (recovery mode vs. protected endpoint vs. multisite vs.
 * default) and reuse its existing translations. We only swap two `<a href>`
 * destinations — and, for the English copy, rebrand the anchor text — so users
 * land on WordPress.com support resources instead of WordPress.org ones.
 *
 * @package wpcomsh
 */

/**
 * Rewrite the WordPress.org support links in the fatal-error screen to
 * WordPress.com equivalents.
 *
 * The filter runs in two passes per link. The first swaps the complete English
 * `<a>` tag, which rebrands both the URL and the anchor text on English sites.
 * The second is a URL-only fallback that updates the destination on localized
 * sites where core has translated the anchor text — the translated text is
 * preserved so users still read the link in their own language.
 *
 * @param string $message The HTML error message built by WP_Fatal_Error_Handler.
 * @return string The filtered HTML error message.
 */
function wpcomsh_filter_fatal_error_message( $message ) {
	$support_forums_url  = 'https://wordpress.com/forums/';
	$troubleshooting_url = 'https://wordpress.com/support/plugins/troubleshooting/';
	if ( function_exists( 'localized_wpcom_url' ) ) {
		$support_forums_url  = localized_wpcom_url( $support_forums_url );
		$troubleshooting_url = localized_wpcom_url( $troubleshooting_url );
	}

	$replacements = array(
		// Full English anchor rewrites — replace URL and rebrand anchor text.
		'<a href="https://wordpress.org/support/forums/">support forums</a>' => sprintf( '<a href="%s">WordPress.com support forums</a>', esc_url( $support_forums_url ) ),
		'<a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a>' => sprintf( '<a href="%s">Learn more about troubleshooting WordPress.com.</a>', esc_url( $troubleshooting_url ) ),

		// URL-only fallbacks — hit on localized sites where core translated the
		// anchor text. The translated text stays; only the destination changes.
		'href="https://wordpress.org/support/forums/"' => sprintf( 'href="%s"', esc_url( $support_forums_url ) ),
		'href="https://wordpress.org/documentation/article/faq-troubleshooting/"' => sprintf( 'href="%s"', esc_url( $troubleshooting_url ) ),
	);

	return str_replace( array_keys( $replacements ), array_values( $replacements ), $message );
}
add_filter( 'wp_php_error_message', 'wpcomsh_filter_fatal_error_message' );
