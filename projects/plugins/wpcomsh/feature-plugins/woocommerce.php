<?php
/**
 * Redirects user to Woo's Design With AI when user
 * creates a site through the Entrepreneur signup flow.
 *
 * @package wpcomsh
 */

/**
 * Redirect to Design With AI page with `ref=entrepreneur-signup` in the URL.
 * Also deletes the `_wc_activation_redirect` transient which is used for first-time woo onboarding.
 *
 * @return never
 */
function wpcom_redirect_to_woo_design_with_ai() {
	delete_transient( '_wc_activation_redirect' );
	wp_safe_redirect( wc_admin_url( '&path=%2Fcustomize-store%2Fdesign-with-ai&ref=entrepreneur-signup' ) );
	exit();
}

/**
 * Determine whether to redirect to Design With AI page when user lands on the admin page
 * based on the whether the site is created through Entrepreneur signup flow
 * and if we are still at the stage of first-time woo onboarding.
 */
function wpcom_maybe_redirect_to_woo_design_with_ai() {

	// Skip if the blog is not created through Entrepreneur signup flow.
	if ( ! get_option( 'wpcom_is_entrepreneur_signup' ) ) {
		return;
	}

	// Skip if Woo is no longer doing a first-time activation redirect.
	if ( ! get_transient( '_wc_activation_redirect' ) ) {
		return;
	}

	// When this function is called, we intervene OnboardingSetupWizard::do_admin_redirects()
	// and redirect the user to the Woo's Design With AI page.
	add_filter( 'woocommerce_prevent_automatic_wizard_redirect', 'wpcom_redirect_to_woo_design_with_ai' );
}

add_action( 'admin_init', 'wpcom_maybe_redirect_to_woo_design_with_ai', 1 );
