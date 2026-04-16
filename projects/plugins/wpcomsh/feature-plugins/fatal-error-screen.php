<?php
/**
 * Customizes the core WordPress fatal error screen for WordPress.com Atomic sites.
 *
 * Replaces the output from WP_Fatal_Error_Handler::display_default_error_template()
 * so that users are directed to WordPress.com support resources rather than the
 * default WordPress.org ones. The body sentence mirrors core's branching (recovery
 * mode, protected endpoint, multisite) so each context keeps its contextual message.
 *
 * @package wpcomsh
 */

/**
 * Build a WordPress.com-branded replacement for the default fatal-error message.
 *
 * @return string The replacement HTML error message.
 */
function wpcomsh_filter_fatal_error_message() {
	$troubleshooting_link = sprintf(
		'<a href="%s">%s</a>',
		esc_url( localized_wpcom_url( 'https://wordpress.com/support/plugins/troubleshooting/' ) ),
		esc_html__( 'Learn more about troubleshooting WordPress.com.', 'wpcomsh' )
	);

	return sprintf( '<p>%s</p><p>%s</p>', wpcomsh_get_fatal_error_body(), $troubleshooting_link );
}
add_filter( 'wp_php_error_message', 'wpcomsh_filter_fatal_error_message' );

/**
 * Pick the fatal-error body sentence for the current context, mirroring the
 * branching in WP_Fatal_Error_Handler::display_default_error_template().
 *
 * @return string The body sentence.
 */
function wpcomsh_get_fatal_error_body() {
	if ( wp_is_recovery_mode() ) {
		return __( 'There has been a critical error on this website, putting it in recovery mode. Please check the Themes and Plugins screens for more details. If you just installed or updated a theme or plugin, check the relevant page for that first.', 'wpcomsh' );
	}

	if ( is_protected_endpoint() && wp_recovery_mode()->is_initialized() ) {
		if ( is_multisite() ) {
			return __( 'There has been a critical error on this website. Please reach out to your site administrator, and inform them of this error for further assistance.', 'wpcomsh' );
		}

		$support_forums_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( localized_wpcom_url( 'https://wordpress.com/forums/' ) ),
			esc_html__( 'WordPress.com support forums', 'wpcomsh' )
		);

		return sprintf(
			/* translators: %s: WordPress.com support forums link. */
			__( 'There has been a critical error on this website. Please check your site admin email inbox for instructions. If you continue to have problems, please try the %s.', 'wpcomsh' ),
			$support_forums_link
		);
	}

	return __( 'There has been a critical error on this website.', 'wpcomsh' );
}
