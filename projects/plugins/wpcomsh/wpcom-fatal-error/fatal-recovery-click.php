<?php
/**
 * Logging endpoint for the "Enter recovery mode" link on the fatal-error screen.
 *
 * The screen renders a signed wrapper URL (built by
 * wpcomsh_fatal_build_recovery_link()) instead of pointing at core's recovery
 * URL directly. Clicking it lands here. We:
 *
 *   1) Validate the HMAC-signed URL.
 *   2) Emit `wpcomsh_fatal_recovery_click` so we can measure how often admins
 *      reach for recovery mode for a given extension.
 *   3) Mint a fresh recovery URL and redirect.
 *
 * Runs at mu-plugin load time so the still-fataling site never finishes
 * loading — same constraint as fatal-plugin-deactivator.php. If the recovery
 * URL can't be minted (multisite, link service throws), we return without
 * redirecting and let the request fall through to the regular fatal screen.
 *
 * Security: see wpcomsh_fatal_verify_signed_payload() for the HMAC contract;
 * the handler additionally gates on core's per-extension recovery cap via
 * user_can() once the user/cap stack is bootstrapped.
 *
 * @package wpcomsh
 */

/**
 * Validate the request and, if trusted, log the click and redirect to a
 * freshly-generated recovery URL before the regular plugin-load pass runs.
 *
 * @return void
 */
function wpcomsh_fatal_maybe_handle_recovery_click() {
	// Nonces aren't usable in this endpoint (pluggable.php hasn't loaded yet);
	// wpcomsh_fatal_verify_signed_payload() validates an HMAC signature below
	// instead. Inputs are sanitized / cast before trust.
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	if ( empty( $_GET['wpcomsh_recovery'] ) ) {
		return;
	}

	$sig  = isset( $_GET['wpcomsh_recovery_sig'] ) ? sanitize_text_field( wp_unslash( $_GET['wpcomsh_recovery_sig'] ) ) : '';
	$exp  = isset( $_GET['wpcomsh_recovery_exp'] ) ? (int) $_GET['wpcomsh_recovery_exp'] : 0;
	$kind = isset( $_GET['wpcomsh_recovery_kind'] ) ? sanitize_text_field( wp_unslash( $_GET['wpcomsh_recovery_kind'] ) ) : '';
	$slug = isset( $_GET['wpcomsh_recovery_slug'] ) ? sanitize_text_field( wp_unslash( $_GET['wpcomsh_recovery_slug'] ) ) : '';
	$ver  = isset( $_GET['wpcomsh_recovery_ver'] ) ? sanitize_text_field( wp_unslash( $_GET['wpcomsh_recovery_ver'] ) ) : '';
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( ! wpcomsh_fatal_verify_signed_payload( $sig, array( $kind, $slug, $ver ), $exp ) ) {
		return;
	}

	// HMAC proves the URL came from a screen we rendered to the same
	// authenticated session, but we still want core's per-extension recovery
	// gate.
	$user_id = wpcomsh_fatal_current_user_id();
	if ( ! $user_id || ! user_can( $user_id, wpcomsh_fatal_recovery_cap_for_kind( $kind ) ) ) {
		return;
	}

	if ( '' !== $kind && '' !== $slug ) {
		wpcomsh_fatal_log_event(
			array(
				'kind'    => $kind,
				'slug'    => $slug,
				'version' => $ver,
			),
			'wpcomsh_fatal_recovery_click'
		);
	}

	$recovery_url = wpcomsh_fatal_build_recovery_url();
	if ( '' === $recovery_url ) {
		return;
	}

	// wp_redirect (not wp_safe_redirect): URL minted locally above by core's
	// recovery-mode service; safe-redirect's home-host allowlist would reject
	// it on split SITEURL/HOME installs and bounce the admin back into the fatal.
	wp_redirect( $recovery_url ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
	exit;
}

wpcomsh_fatal_maybe_handle_recovery_click();
