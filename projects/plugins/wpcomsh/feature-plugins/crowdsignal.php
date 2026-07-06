<?php
/**
 * Crowdsignal plugin tweaks for WoA sites.
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

/**
 * Suppress Crowdsignal Forms' "getting started" setup notice on WoA sites.
 *
 * On activation Crowdsignal Forms enqueues a persistent "core setup" notice and renders it on
 * the Plugins and Dashboard screens until the user either connects a Crowdsignal account or
 * dismisses it. Because WoA activates the plugin during the Simple-to-Atomic transfer and again
 * on every managed version-bump reactivation, and because the account connection lives in
 * WordPress.com-managed state the plugin can't read locally, this notice reappears uninvited and
 * clutters the Plugins page for users who never chose to install it.
 *
 * Crowdsignal Forms exposes a `crowdsignal_forms_show_admin_notice_{notice}` filter for exactly
 * this purpose; returning false keeps the notice from rendering without disturbing its stored
 * state or the plugin's own dismissal handling. The plugin's own callback on this filter runs at
 * the default priority and returns true whenever no account is connected, so we hook at
 * PHP_INT_MAX to have the final say regardless of hook-registration order.
 *
 * The suppression is scoped to the Plugins and Dashboard screens, which is where the notice is
 * unsolicited clutter. Upstream also renders it on Crowdsignal Forms' own admin screen; there it
 * is deliberate setup guidance for a user who navigated in on purpose, so we pass the incoming
 * value through and leave the plugin's own logic in charge.
 *
 * Only the "core setup" notice is touched: the sibling "setup success" notice is gated on a
 * `?msg=connect` request and is deliberate feedback shown right after a user completes setup, not
 * part of the activation clutter, so it is left intact.
 *
 * @param bool $show Whether Crowdsignal Forms intends to show the notice.
 * @return bool
 */
function wpcomsh_suppress_crowdsignal_forms_setup_notice( $show ) {
	$screen = get_current_screen();
	if ( $screen && in_array( $screen->id, array( 'plugins', 'dashboard' ), true ) ) {
		return false;
	}
	return $show;
}
add_filter( 'crowdsignal_forms_show_admin_notice_core_setup', 'wpcomsh_suppress_crowdsignal_forms_setup_notice', PHP_INT_MAX );

/**
 * Suppress the Crowdsignal Dashboard (Polldaddy) "link your account" warning on WoA sites.
 *
 * The Crowdsignal Dashboard plugin (slug `polldaddy`) prints a "Crowdsignal features will be
 * unavailable until you link your Crowdsignal.com account" warning on the Plugins screen and on
 * its own poll/rating screens whenever no `polldaddy_api_key` option is stored. As with Crowdsignal
 * Forms, WoA activates this plugin without the user asking, and the account link lives in
 * WordPress.com-managed state the plugin can't read locally, so the warning is never actionable
 * here and just clutters the Plugins page.
 *
 * Scope this to the Plugins screen only. On the plugin's own poll/rating screens the warning is
 * the intended explanation for why features are unavailable, so leave it there.
 *
 * Unlike Crowdsignal Forms, this notice has no suppression filter: it is echoed directly from a
 * named `admin_notices` callback. Remove that callback instead. The `current_screen` hook fires
 * after all plugins have loaded (so polldaddy has already registered the callback) and before
 * admin_notices renders, and remove_action is a no-op when the plugin is inactive.
 *
 * @param WP_Screen $screen The current admin screen.
 */
function wpcomsh_suppress_crowdsignal_polldaddy_login_warning( $screen ) {
	if ( $screen && 'plugins' === $screen->id ) {
		remove_action( 'admin_notices', 'polldaddy_login_warning' );
	}
}
add_action( 'current_screen', 'wpcomsh_suppress_crowdsignal_polldaddy_login_warning' );
