<?php
/**
 * Customizes WordPress's default fatal error screen with WordPress.com support links.
 *
 * @package wpcomsh
 */

/**
 * Swaps wordpress.org links on the fatal error screen for their WordPress.com
 * equivalents, and updates the trailing "Learn more" link text to match.
 *
 * Matches against core's translated source strings so the replacement works in
 * any locale; the replacement text lives under the wpcomsh text domain.
 *
 * @param string $message HTML error message produced by WP_Fatal_Error_Handler.
 * @return string
 */
function wpcomsh_customize_fatal_error_message( $message ) {
	// Fatal handler can run before after_setup_theme and before i18n.php is required;
	// i18n.php registers the wpcom-locale .mo rewrite (e.g. nb_NO -> no.mo) we depend on.
	if ( ! is_textdomain_loaded( 'wpcomsh' ) ) {
		require_once __DIR__ . '/i18n.php';
		load_theme_textdomain( 'wpcomsh', WP_LANG_DIR . '/mu-plugins' );
	}

	// Match against core's translated source strings (text domain `default`) so
	// the swap works in any locale; replacement text lives under `wpcomsh`.
	// phpcs:disable WordPress.WP.I18n.TextDomainMismatch
	$replacements = array(
		__( 'https://wordpress.org/support/forums/', 'default' ) => 'https://wordpress.com/forums/',
		__( 'https://wordpress.org/documentation/article/faq-troubleshooting/', 'default' ) => 'https://wordpress.com/support/plugins/troubleshooting/',
		__( 'Learn more about troubleshooting WordPress.', 'default' ) => __(
			/* translators: Replaces core's "Learn more about troubleshooting WordPress." link text on the fatal error screen. The link now points to WordPress.com support docs, hence the brand swap. */
			'Learn more about troubleshooting WordPress.com.',
			'wpcomsh'
		),
	);
	// phpcs:enable WordPress.WP.I18n.TextDomainMismatch

	return str_replace( array_keys( $replacements ), array_values( $replacements ), $message );
}
add_filter( 'wp_php_error_message', 'wpcomsh_customize_fatal_error_message' );
