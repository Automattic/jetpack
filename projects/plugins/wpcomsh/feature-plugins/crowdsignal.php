<?php
/**
 * Crowdsignal Forms tweaks for WoA sites.
 *
 * @package wpcomsh
 */

/**
 * Prevent Crowdsignal Forms from hijacking wp-admin with its onboarding redirect.
 *
 * On activation Crowdsignal sets the `crowdsignal_forms_do_activation_redirect` option
 * and, on the next admin_init, redirects to its settings page unless a Crowdsignal
 * account is already connected. That connection lives in WordPress.com-managed state and
 * isn't present in the site's options on Atomic, so the plugin's own guard misses and the
 * redirect fires on every activation a WoA site sees: the Simple-to-Atomic transfer (which
 * installs and activates the plugin) and every later managed version-bump reactivation.
 * None of those should send the admin to Crowdsignal's settings page.
 *
 * wpcomsh only loads on Atomic, so clearing the flag here is inherently WoA-scoped. Running
 * at priority 1 ensures the option is gone before Crowdsignal's own admin_init handler
 * (priority 10) reads it, regardless of how the activation was triggered.
 */
function wpcomsh_suppress_crowdsignal_activation_redirect() {
	if ( get_option( 'crowdsignal_forms_do_activation_redirect' ) ) {
		delete_option( 'crowdsignal_forms_do_activation_redirect' );
	}
}
add_action( 'admin_init', 'wpcomsh_suppress_crowdsignal_activation_redirect', 1 );
