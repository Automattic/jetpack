<?php
/**
 * Customizes the core WordPress fatal error screen for WordPress.com Atomic sites.
 *
 * Mutates the HTML passed to the `wp_php_error_message` filter rather than
 * rebuilding it, so we inherit every decision WP core already made about which
 * sentence to show (recovery mode vs. protected endpoint vs. multisite vs.
 * default) and reuse its existing translations. The link rewrites target the
 * fatal-error template's paragraph/anchor structure rather than hardcoded
 * WordPress.org URLs, so localized sites keep working even when core translates
 * the original `href` values.
 *
 * @package wpcomsh
 */

/**
 * Rewrite the support links in the fatal-error screen to WordPress.com
 * equivalents.
 *
 * The replacement logic keys off the structure output by
 * `WP_Fatal_Error_Handler::display_default_error_template()`: the final
 * paragraph is always the troubleshooting link, while the protected-endpoint
 * single-site branch adds a second anchor earlier in the message for support
 * forums. That lets us swap destinations even on locales where WP core has
 * translated both the anchor text and the original `href`.
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

	if ( ! preg_match( '#<p><a\b[^>]*>(.*?)</a></p>$#', $message, $troubleshooting_match ) ) {
		return $message;
	}

	$troubleshooting_text = 'Learn more about troubleshooting WordPress.' === $troubleshooting_match[1]
		? 'Learn more about troubleshooting WordPress.com.'
		: $troubleshooting_match[1];

	$message = preg_replace(
		'#<p><a\b[^>]*>.*?</a></p>$#',
		sprintf(
			'<p><a href="%s">%s</a></p>',
			esc_url( $troubleshooting_url ),
			esc_html( $troubleshooting_text )
		),
		$message,
		1
	);

	if ( 2 !== preg_match_all( '#<a\b[^>]*>(.*?)</a>#', $message, $anchor_matches ) ) {
		return $message;
	}

	$support_forums_text = 'support forums' === $anchor_matches[1][0]
		? 'WordPress.com support forums'
		: $anchor_matches[1][0];

	return preg_replace(
		'#<a\b[^>]*>.*?</a>#',
		sprintf(
			'<a href="%s">%s</a>',
			esc_url( $support_forums_url ),
			esc_html( $support_forums_text )
		),
		$message,
		1
	);
}
add_filter( 'wp_php_error_message', 'wpcomsh_filter_fatal_error_message' );
