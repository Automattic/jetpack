<?php
/**
 * HTTP probe endpoint for the Plugin Conflicts Guardian.
 *
 * Handles `?pcg_probe=1&token=…` requests fired by PCG_Load_Tester.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Run inline: we're already inside `plugins_loaded` (load_features() priority 10),
// so registering a hook at priority 0 would be too late.
pcg_maybe_handle_probe();

/**
 * Entry point. Bails when the request isn't a probe.
 */
function pcg_maybe_handle_probe() {
	$probe_flag = sanitize_text_field( wp_unslash( $_GET['pcg_probe'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- token is the nonce, validated below.
	if ( '1' !== $probe_flag ) {
		return;
	}

	// Stamp the response the instant we recognise a probe request — before
	// any bail, redirect, or plugin load. PCG_Load_Tester::parse_response()
	// uses this header to tell "our endpoint ran but emitted no JSON verdict"
	// (marker-present, non-JSON body — `ok-inconclusive`, non-blocking and
	// logged) apart from "the loopback never reached us at all" (no marker —
	// `error`, also non-blocking and logged). Under the "only block on a
	// captured fatal" policy, neither blocks; the marker just lets us bucket
	// the two in the `Probe anomaly allowed` log so we can size each class.
	if ( ! headers_sent() ) {
		header( 'X-PCG-Probe: 1' );
	}

	// Mixed-case random tokens from `wp_generate_password`; we can't
	// `sanitize_key` (which lowercases) and must validate with a regex.
	$raw_token = (string) wp_unslash( $_GET['token'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated via regex on the next line.
	$token     = preg_match( '/^[A-Za-z0-9]+$/', $raw_token ) ? $raw_token : '';
	if ( '' === $token ) {
		pcg_probe_bail_error( 'Missing or malformed probe token.', 400 );
		return;
	}

	$key     = PCG_Load_Tester::transient_key( $token );
	$payload = get_transient( $key );

	if ( ! is_array( $payload ) || ! isset( $payload['plugins'] ) || ! isset( $payload['mode'] ) ) {
		pcg_probe_bail_error( 'Invalid or expired probe token.', 403 );
		return;
	}

	// Defer deletion until we actually emit a verdict. If something redirects
	// (e.g. force_ssl_admin's http->https bounce) before admin_init, Requests
	// follows with the same token; deleting upfront would make the follow-up
	// fail with "Invalid or expired probe token". The 30s transient TTL caps
	// lingering entries when no terminal response runs.
	pcg_probe_pending_key( $key );
	$plugin_mains = is_array( $payload['plugins'] ) ? array_values(
		array_filter(
			array_map( static fn( $p ) => (string) $p, $payload['plugins'] ),
			static fn( $p ) => '' !== $p
		)
	) : array();
	$mode         = (string) $payload['mode'];
	if ( empty( $plugin_mains ) || ! in_array( $mode, array( PCG_Load_Tester::MODE_ACTIVATION, PCG_Load_Tester::MODE_UPDATE ), true ) ) {
		pcg_probe_bail_error( 'Invalid or expired probe token.', 403 );
		return;
	}

	// Gate per mode: activation probes need pcg_guard_activation, update
	// probes need pcg_guard_updates. Otherwise enabling either flow would
	// pull in the other as an unintended dependency.
	$is_update_mode = PCG_Load_Tester::MODE_UPDATE === $mode;
	$gate_filter    = $is_update_mode ? 'pcg_guard_updates' : 'pcg_guard_activation';
	if ( ! apply_filters( $gate_filter, true ) ) {
		pcg_probe_bail_error( 'Plugin Conflicts Guardian is disabled.', 403 );
		return;
	}

	// Drop unreadable entries instead of bailing on the first one. Bailing
	// would emit `error`, which the activation guard treats as a non-block
	// and lets the activation through — masking a fatal in a later
	// readable plugin. Only bail when nothing readable remains.
	$plugin_mains = array_values(
		array_filter(
			$plugin_mains,
			static fn( $p ) => is_file( $p ) && is_readable( $p )
		)
	);
	if ( empty( $plugin_mains ) ) {
		pcg_probe_bail_error( 'No probe targets are readable.', 404 );
		return;
	}

	// Tell WP's fatal handler to stand down so ours can emit JSON.
	if ( ! defined( 'WP_SANDBOX_SCRAPING' ) ) {
		define( 'WP_SANDBOX_SCRAPING', true );
	}

	// Swallow plugin output so the JSON response isn't corrupted.
	ob_start();

	register_shutdown_function( 'pcg_probe_shutdown' );

	// Activation: load each candidate. Update: skip (already loaded by
	// WP's bootstrap; re-requiring would fatal). Confirmation probes
	// also skip — the early hook injected them into active_plugins so
	// wp-settings.php loaded them at real-activation timing.
	$is_confirm = true === ( $payload['confirm'] ?? false );
	if ( PCG_Load_Tester::MODE_ACTIVATION === $mode && ! $is_confirm ) {
		foreach ( $plugin_mains as $plugin_main ) {
			try {
				require_once $plugin_main;
			} catch ( \Throwable $t ) {
				pcg_probe_respond(
					array(
						'status'  => 'throwable',
						'plugin'  => $plugin_main,
						'class'   => get_class( $t ),
						'message' => $t->getMessage(),
						'file'    => $t->getFile(),
						'line'    => $t->getLine(),
					)
				);
			}
		}
	}

	// Admin probe: defer until admin_init has fired so admin-time hook fatals
	// surface. Front-end probe: emit on wp_loaded once init has fired.
	$is_admin_probe = '1' === sanitize_text_field( wp_unslash( $_GET['pcg_admin'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- token already validated above.
	add_action( $is_admin_probe ? 'admin_init' : 'wp_loaded', 'pcg_probe_emit_ok', PHP_INT_MAX );
}

/**
 * Emit a clean "ok" verdict once the full bootstrap completed.
 */
function pcg_probe_emit_ok() {
	pcg_probe_respond( array( 'status' => 'ok' ) );
}

/**
 * Shutdown handler: always emits a JSON verdict.
 *
 * On a captured engine fatal, emits status=fatal. On any other shutdown
 * — including a plugin that called `exit`/`die` cleanly during init —
 * emits status=ok-shutdown so the client can distinguish "bootstrap
 * died silently" (previously seen as "marker present, no JSON body"
 * — historically the biggest false-positive class) from a real
 * captured fatal.
 *
 * Returning silently on re-entry preserves the original verdict.
 * `wp_send_json` calls `exit`, which fires this handler again on the
 * shutdown phase; without the guard the second pass would over-write
 * the response that was just sent.
 */
function pcg_probe_shutdown() {
	// Check-only (no `true` arg): `pcg_probe_respond` is the single
	// canonical marker. If we marked here, the very next call to
	// `pcg_probe_respond` would observe the flag and bail without
	// emitting — and the shutdown verdict would be lost. The role of
	// this guard is to bail when respond has *already* emitted (the
	// throwable catch in the require loop, or the post-exit shutdown
	// re-entry), not to claim ownership preemptively.
	if ( pcg_probe_already_emitted() ) {
		return;
	}
	pcg_probe_respond( PCG_Load_Tester::classify_shutdown( error_get_last() ) );
}

/**
 * Module-local "we've already emitted a verdict" flag, shared between
 * `pcg_probe_respond` and `pcg_probe_shutdown`. Reading sets nothing;
 * writing flips the flag to true permanently. This is the re-entry
 * guard that keeps a single probe request from emitting two verdicts:
 *
 *   - `pcg_probe_respond` calls `wp_send_json` then `exit`. The `exit`
 *     triggers the shutdown phase, which fires the registered shutdown
 *     handler a second time. Without this guard, the handler would
 *     re-emit (or attempt to) and corrupt the response.
 *   - A `\Throwable` caught in the require loop emits via
 *     `pcg_probe_respond`; the subsequent shutdown handler must stay
 *     silent rather than overwrite with `ok-shutdown`.
 *
 * @param bool $mark_now Pass true to flip the flag to its terminal value.
 * @return bool Whether a verdict has been emitted (or just-now claimed).
 */
function pcg_probe_already_emitted( $mark_now = false ) {
	static $emitted = false;
	if ( $emitted ) {
		return true;
	}
	if ( $mark_now ) {
		$emitted = true;
	}
	return false;
}

/**
 * Emit a JSON response and terminate.
 *
 * Returns silently if a verdict was already emitted — the most likely
 * caller in that state is the shutdown phase re-running after our own
 * `exit`, and the original verdict has already been written.
 *
 * @param array $payload JSON-serializable payload.
 * @param int   $status  HTTP status code.
 * @return void
 */
function pcg_probe_respond( $payload, $status = 200 ) {
	if ( pcg_probe_already_emitted( true ) ) {
		return;
	}
	$key = pcg_probe_pending_key();
	if ( '' !== $key ) {
		delete_transient( $key );
	}
	while ( ob_get_level() > 0 ) {
		ob_end_clean();
	}
	wp_send_json( $payload, (int) $status, JSON_UNESCAPED_SLASHES );
	exit;
}

/**
 * Get/set the transient key to delete when we emit a verdict.
 *
 * @param string|null $set Key to remember; omit to read the current value.
 * @return string
 */
function pcg_probe_pending_key( $set = null ) {
	static $key = '';
	if ( null !== $set ) {
		$key = (string) $set;
	}
	return $key;
}

/**
 * Emit an `error` verdict with the given reason + HTTP status. Returns
 * silently on the re-entry path (a verdict was already emitted), and
 * normally terminates via `pcg_probe_respond` → `wp_send_json` → `exit`
 * on first call. The signature is `@return void` rather than `never`
 * so static analyzers don't flag the silent-return branch as an
 * unannotated escape; callers must add an explicit `return;` after
 * invoking this when they want to stop the surrounding flow.
 *
 * @param string $reason Human-readable reason for the failure.
 * @param int    $status HTTP status code.
 * @return void
 */
function pcg_probe_bail_error( $reason, $status ) {
	pcg_probe_respond(
		array(
			'status' => 'error',
			'reason' => $reason,
		),
		$status
	);
}
