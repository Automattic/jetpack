<?php
/**
 * One-shot redirect endpoint behind the fatal-error screen's
 * "Enter recovery mode" link.
 *
 * The screen renders an HMAC-signed URL pointing here instead of core's
 * recovery-mode URL directly, so a successful click is, by construction, a
 * click from the screen we rendered to the same authenticated session —
 * the recovery-mode email always carries the bare core URL, and a CSRF-
 * style navigation can't forge the signature without AUTH_SALT. Minting
 * the recovery key here (instead of at fatal-screen render time) also
 * keeps the recovery_keys option from accumulating a row per fatal-screen
 * pageview.
 *
 * Security model and load-order argument mirror fatal-plugin-deactivator.php.
 *
 * @package wpcomsh
 */

/**
 * Verify the signed URL, dedup, mint a fresh core recovery URL, log the
 * click, and 302 to it. Best-effort: silently no-ops if anything is off.
 *
 * @return void
 */
function wpcomsh_fatal_maybe_handle_recovery_click() {
	// Nonces aren't usable here (pluggable.php hasn't loaded yet); the HMAC
	// check below is the actual auth gate.
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	if ( empty( $_GET['wpcomsh_recover'] ) || empty( $_GET['wpcomsh_sig'] ) || empty( $_GET['wpcomsh_exp'] ) ) {
		return;
	}
	// The screen never emits this URL on multisite, so any matching request
	// here is bogus. Bail before the verifier so an invalid GET can't cause
	// `wp_cookie_constants()` to run ahead of `ms_cookie_constants()`.
	if ( is_multisite() ) {
		return;
	}
	$sig = sanitize_text_field( wp_unslash( $_GET['wpcomsh_sig'] ) );
	$exp = (int) $_GET['wpcomsh_exp'];
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( ! wpcomsh_fatal_verify_payload( 'recover', $exp, $sig ) ) {
		return;
	}

	// HMAC binding only proves the request carries the same logged-in
	// cookie *bytes* as when the URL was minted — a stale cookie (server-
	// side session invalidation, password reset, account demotion) still
	// byte-matches. With day-long TTLs, that gap matters: validate the
	// cookie against current user state and re-check the recovery capability
	// before minting a core recovery URL. wpcomsh_fatal_current_user_id()
	// also loads pluggable.php as a side effect, which both
	// wpcomsh_fatal_build_recovery_url() (via wp_generate_password) and
	// wp_safe_redirect() below rely on.
	$user_id = wpcomsh_fatal_current_user_id();
	if ( ! $user_id ) {
		return;
	}
	if ( ! user_can( $user_id, 'resume_plugins' ) && ! user_can( $user_id, 'resume_themes' ) ) {
		return;
	}

	$recovery_url = wpcomsh_fatal_build_recovery_url();
	if ( '' === $recovery_url ) {
		return;
	}

	// Dedup gates the *log only*, not the redirect: a refresh / back-nav
	// of the same signed URL shouldn't flood log rows, but the user must
	// still reach recovery mode — otherwise the link silently looks broken.
	// (Core recovery keys are single-use, so each click mints a fresh one.)
	if ( wpcomsh_fatal_dedup_acquire( 'wpcomsh_fatal_event:recovery:' . $sig ) ) {
		wpcomsh_fatal_emit_logstash_event( 'wpcomsh_fatal_recovery' );
	}

	// `wp_redirect()` rather than `wp_safe_redirect()`: on split-host installs
	// (home_url() and wp_login_url() on different hosts) wp_safe_redirect()
	// would `wp_validate_redirect()` against allowed_redirect_hosts, which at
	// mu-plugin time hasn't been extended by plugins yet — the login host
	// gets rejected and the user is silently bounced to admin_url() without
	// the recovery cookie, landing right back on the fatal screen. The URL
	// is core-generated for *this* site (no user input), so the open-redirect
	// risk wp_safe_redirect() guards against doesn't apply.
	wp_redirect( $recovery_url ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- see comment above; wp_safe_redirect() drops split-host login URLs at mu-plugin time.
	exit;
}

wpcomsh_fatal_maybe_handle_recovery_click();
