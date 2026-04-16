<?php
/**
 * Customizes the core WordPress fatal error screen for WordPress.com Atomic sites.
 *
 * Replaces the output from WP_Fatal_Error_Handler::display_default_error_template()
 * so that users are directed to WordPress.com support resources rather than the
 * default WordPress.org ones. The body sentence mirrors core's branching (recovery
 * mode, protected endpoint, multisite) so each context keeps its contextual message.
 *
 * Sentences that are verbatim from WP core use the `default` text domain so they
 * pick up core's existing translations (WP core loads them early via
 * `wp_load_translations_early()`). WP.com-specific strings stay in the `wpcomsh`
 * domain — so for the rare fatal that aborts before `after_setup_theme` fires,
 * the `wpcomsh` strings fall back to English on localized sites. We accept that
 * gap rather than eagerly load the domain here, which would trigger the WP 6.7+
 * `_doing_it_wrong()` warning for translation loading before `init`.
 *
 * @package wpcomsh
 */

/**
 * Build a WordPress.com-branded replacement for the default fatal-error message.
 *
 * @return string The replacement HTML error message.
 */
function wpcomsh_filter_fatal_error_message() {
	$troubleshooting_url = 'https://wordpress.com/support/plugins/troubleshooting/';
	if ( function_exists( 'localized_wpcom_url' ) ) {
		$troubleshooting_url = localized_wpcom_url( $troubleshooting_url );
	}

	$troubleshooting_link = sprintf(
		'<a href="%s">%s</a>',
		esc_url( $troubleshooting_url ),
		esc_html__( 'Learn more about troubleshooting WordPress.com.', 'wpcomsh' )
	);

	return sprintf( '<p>%s</p><p>%s</p>', wpcomsh_get_fatal_error_body(), $troubleshooting_link );
}
add_filter( 'wp_php_error_message', 'wpcomsh_filter_fatal_error_message' );

/**
 * Pick the fatal-error body sentence for the current context, mirroring the
 * branching in WP_Fatal_Error_Handler::display_default_error_template().
 *
 * Core gates the "putting it in recovery mode" message on `$handled`, which isn't
 * exposed to the `wp_php_error_message` filter. We approximate with
 * `! is_multisite() && wp_is_recovery_mode()`, which matches the conditions that
 * allow `$handled` to be truthy in the first place.
 *
 * @return string The body sentence.
 */
function wpcomsh_get_fatal_error_body() {
	if ( ! is_multisite() && wp_is_recovery_mode() ) {
		// phpcs:ignore WordPress.WP.I18n.TextDomainMismatch -- Verbatim from WP core to reuse core's early-loaded translations.
		return __( 'There has been a critical error on this website, putting it in recovery mode. Please check the Themes and Plugins screens for more details. If you just installed or updated a theme or plugin, check the relevant page for that first.', 'default' );
	}

	if ( is_protected_endpoint() && wp_recovery_mode()->is_initialized() ) {
		if ( is_multisite() ) {
			// phpcs:ignore WordPress.WP.I18n.TextDomainMismatch -- Verbatim from WP core to reuse core's early-loaded translations.
			return __( 'There has been a critical error on this website. Please reach out to your site administrator, and inform them of this error for further assistance.', 'default' );
		}

		$support_forums_url = 'https://wordpress.com/forums/';
		if ( function_exists( 'localized_wpcom_url' ) ) {
			$support_forums_url = localized_wpcom_url( $support_forums_url );
		}

		$support_forums_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $support_forums_url ),
			esc_html__( 'WordPress.com support forums', 'wpcomsh' )
		);

		return sprintf(
			/* translators: %s: WordPress.com support forums link. */
			__( 'There has been a critical error on this website. Please check your site admin email inbox for instructions. If you continue to have problems, please try the %s.', 'wpcomsh' ),
			$support_forums_link
		);
	}

	// phpcs:ignore WordPress.WP.I18n.TextDomainMismatch -- Verbatim from WP core to reuse core's early-loaded translations.
	return __( 'There has been a critical error on this website.', 'default' );
}
