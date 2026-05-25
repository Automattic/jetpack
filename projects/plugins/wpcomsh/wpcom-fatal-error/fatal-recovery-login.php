<?php
/**
 * Log when a user authenticates while a recovery-mode session is active.
 *
 * Hooks `wp_login` and checks `wp_is_recovery_mode()`: by the time the
 * action runs, core's `WP_Recovery_Mode::handle_cookie()` has already
 * validated the recovery cookie from wp-settings.php, so a true result
 * means the just-authenticated user is now operating inside a recovery
 * session — the support-relevant "user got past login in recovery mode"
 * signal.
 *
 * Distinct from `wpcomsh_fatal_signature` / `wpcomsh_fatal_deactivate`,
 * which are keyed on a suspected extension. This event has no fatal
 * context (the recovery cookie was set on a previous request, possibly
 * by core's email link rather than our screen), so it skips the
 * signature-building wrapper and emits through `wpcomsh_fatal_emit_logstash`
 * directly.
 *
 * @package wpcomsh
 */

/**
 * `wp_login` callback. Emits a `wpcomsh_fatal_recovery_login` event the
 * first time a user authenticates inside a given recovery-mode session,
 * deduped per (session, user) so a re-login on the same recovery cookie
 * doesn't double-log. Falls back to a per-user dedup when the session id
 * is unavailable so unhealthy core state doesn't silently drop the event.
 *
 * @param string  $user_login Login name passed by `wp_login`. Unused.
 * @param WP_User $user       Authenticated user.
 * @return void
 */
function wpcomsh_fatal_log_recovery_login( $user_login, $user ) {
	unset( $user_login );

	if ( ! function_exists( 'wp_is_recovery_mode' ) || ! wp_is_recovery_mode() ) {
		return;
	}
	if ( ! ( $user instanceof WP_User ) || ! $user->ID ) {
		return;
	}

	$session_id = '';
	if ( function_exists( 'wp_recovery_mode' ) ) {
		try {
			$session_id = (string) wp_recovery_mode()->get_session_id();
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; fall through to a per-user dedup.
			// Fall through.
		}
	}

	// Hash the session id (it's the validated cookie payload) before
	// folding it into a dedup key, so the cache key never carries the
	// raw secret. Keyed on (session, user) so two admins inside one
	// shared recovery cookie still each emit once.
	$dedup_seed = '' !== $session_id
		? hash( 'sha256', $session_id . '|' . (int) $user->ID )
		: 'user:' . (int) $user->ID;
	$cache_key  = 'wpcomsh_fatal_event:recovery_login:' . $dedup_seed;
	try {
		if ( ! wp_cache_add( $cache_key, 1, 'wpcomsh', WEEK_IN_SECONDS ) ) {
			return;
		}
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- fail open: a cache outage MUST NOT silence telemetry.
		// Fall through and log.
	}

	wpcomsh_fatal_emit_logstash(
		'wpcomsh_fatal_recovery_login',
		array( 'user_id' => (int) $user->ID )
	);
}
add_action( 'wp_login', 'wpcomsh_fatal_log_recovery_login', 10, 2 );
