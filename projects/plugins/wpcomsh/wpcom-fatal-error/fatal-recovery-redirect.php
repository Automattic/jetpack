<?php
/**
 * One-shot redirect endpoint behind the fatal-error screen's
 * "Enter recovery mode" link.
 *
 * The screen points its recovery link here
 * (`?wpcomsh_recover=1&_wpnonce=…` on `site_url()`) rather than at the
 * bare core recovery URL so we can:
 *   - log a `wpcomsh_fatal_recovery` event keyed on the actual click,
 *     not on every fatal-screen pageview;
 *   - mint the core recovery key on click rather than at render time,
 *     keeping the `recovery_keys` option from accumulating a row per
 *     pageview.
 *
 * Auth: WP nonce + cookie-resolved current user + `resume_plugins` /
 * `resume_themes` capability. The nonce binds the URL to the admin's
 * session, so a CSRF-style navigation can't reach the endpoint
 * without the rendered nonce. The deactivator endpoint keeps its
 * custom HMAC because it runs before pluggable.php loads, where
 * `wp_verify_nonce` isn't available.
 *
 * Failure paths 302 back to the same URL with the recovery query args
 * stripped, instead of letting WP serve a normal page response under
 * `?wpcomsh_recover=1&…`. Two reasons: the user-visible URL stops
 * carrying the suspicious params (so a refresh or back-nav doesn't
 * re-trigger the endpoint), and any side-effecting bootstraps below
 * (the pluggable.php load via `wpcomsh_fatal_current_user_id`) land on
 * a header-only 302 response — never a rendered page where a regular
 * plugin's pluggable override would silently no-op because pluggable
 * was already loaded at mu-plugin time.
 *
 * Load-order argument mirrors fatal-plugin-deactivator.php.
 *
 * @package wpcomsh
 */

/**
 * Validate the click, dedup the log, mint a fresh core recovery URL,
 * and 302 to it. On any failure after we recognize this as a recovery
 * click, 302 to the same URL minus the recovery query args.
 *
 * @return void
 */
function wpcomsh_fatal_maybe_handle_recovery_click() {
	if ( empty( $_GET['wpcomsh_recover'] ) ) {
		return; // Not our request — let WP serve normally.
	}

	// Raw header() rather than wp_redirect(): the early bails (empty
	// nonce, multisite) run before pluggable.php is loaded, and pulling
	// pluggable in just to bounce defeats the point of containing the
	// preload damage.
	//
	// Derive the redirect base from `site_url('/')` rather than echoing
	// $_SERVER['REQUEST_URI']: a crafted protocol-relative request URI
	// like `//attacker.com/path` would otherwise produce a `Location:
	// //attacker.com/path` header that browsers follow cross-origin (open
	// redirect). Routing through site_url also lands the user at the WP
	// install root on subdirectory installs (e.g. example.com/wp/)
	// instead of the domain root. Try/catch covers a misbehaving
	// `site_url` filter from an earlier mu-plugin throwing.
	//
	// Only the query string is carried over from the request — read from
	// $_SERVER['QUERY_STRING'] (no host can be smuggled in there), with
	// the recovery args stripped via `remove_query_arg` (which accepts a
	// query-only string and re-encodes via WP's standard `build_query`).
	$bail_clean = static function (): never {
		$base_path = '/';
		try {
			$path = wp_parse_url( site_url( '/' ), PHP_URL_PATH );
			if ( is_string( $path ) && '' !== $path ) {
				$base_path = $path;
			}
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- fall back to '/' on filter throw.
			// Fall through.
		}

		// `remove_query_arg` accepts a query-only string and re-encodes the
		// remaining args through WP's `build_query`, so the raw bytes from
		// QUERY_STRING are safe to pass through — text-field sanitization
		// would mangle valid query syntax (`+`, etc.) for no benefit.
		$query    = remove_query_arg(
			array( 'wpcomsh_recover', '_wpnonce' ),
			(string) wp_unslash( $_SERVER['QUERY_STRING'] ?? '' ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- see comment above; remove_query_arg parses + re-encodes.
		);
		$location = $base_path;
		if ( '' !== $query ) {
			$location .= '?' . $query;
		}
		header( 'Location: ' . $location, true, 302 );
		exit;
	};

	if ( empty( $_GET['_wpnonce'] ) ) {
		$bail_clean();
	}
	$nonce = sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) );

	// The screen never emits this URL on multisite, so any matching request
	// here is bogus.
	if ( is_multisite() ) {
		$bail_clean();
	}

	// wpcomsh_fatal_current_user_id() bootstraps pluggable.php (needed by
	// wp_verify_nonce / wp_redirect / the recovery-link service below)
	// and validates the auth cookie without setting `$current_user`. We
	// then call wp_set_current_user ourselves so wp_verify_nonce uses
	// our resolved id instead of re-validating the cookie, and pin the
	// `nonce_life` filter so the verify-time tick agrees with the
	// mint-time tick across load phases. The resolve+verify cluster is
	// wrapped in try/catch because the `set_current_user` action can be
	// hooked by another mu-plugin loaded earlier in this pass — a throw
	// must not turn the recovery-link click into a second fatal.
	$user_id = wpcomsh_fatal_current_user_id();
	if ( ! $user_id ) {
		$bail_clean();
	}
	try {
		wp_set_current_user( $user_id );
		wpcomsh_fatal_pin_recover_nonce_life();
		if ( ! wp_verify_nonce( $nonce, 'wpcomsh_recover' ) ) {
			$bail_clean();
		}
	} catch ( \Throwable $e ) {
		$bail_clean();
	}

	// `current_user_can` rather than `user_can( $user_id, ... )`: we just
	// called `wp_set_current_user`, so `$current_user` is populated and
	// the cap check skips a redundant `get_userdata()` lookup.
	if ( ! current_user_can( 'resume_plugins' ) && ! current_user_can( 'resume_themes' ) ) {
		$bail_clean();
	}

	$recovery_url = wpcomsh_fatal_build_recovery_url();
	if ( '' === $recovery_url ) {
		$bail_clean();
	}

	// Dedup gates the *log only*, not the redirect: a refresh / back-nav
	// shouldn't flood log rows, but the user must still reach recovery
	// mode — otherwise the link silently looks broken. (Core recovery
	// keys are single-use, so each click mints a fresh one.) Per-user
	// keying is enough because the cap check above already constrains
	// callers to admins on this site.
	if ( wpcomsh_fatal_dedup_acquire( 'wpcomsh_fatal_event:recovery:' . $user_id ) ) {
		wpcomsh_fatal_emit_logstash( 'wpcomsh_fatal_recovery' );
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
