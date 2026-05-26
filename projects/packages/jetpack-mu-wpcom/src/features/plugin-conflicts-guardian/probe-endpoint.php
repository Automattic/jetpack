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
	// (a plugin terminated the request mid-bootstrap — a real fatal) apart
	// from "the loopback never reached us at all" (a full-page cache, a
	// security plugin, or a maintenance page answered with a 200). Only the
	// former should block an activation; without the marker a cached 200
	// would be misread as a fatal and block a healthy plugin.
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

	// Activation: load each plugin to exercise its load path. Deferred to
	// `wp_loaded` (priority 1) so dependency shims registered later in the
	// bootstrap — Action Scheduler's `as_*` functions, WC constants like
	// `WC_ADMIN_ABSPATH`, plugin singletons set up during `init` — are
	// available when we require the candidate. The original design ran
	// the require inline at `plugins_loaded:10`, which captured real PHP
	// fatals against undefined functions / constants that wouldn't fire
	// on a real activation page-load. Trade-off: the candidate's own
	// `plugins_loaded` callbacks are never invoked in the probe context
	// (we require it after that hook has finished), but a real activation
	// click also doesn't fire the new plugin's `plugins_loaded` until the
	// next request, so the probe still matches the real activation shape.
	//
	// Update: skip; re-requiring an already-loaded plugin would fatal with
	// "Cannot redeclare". The shutdown handler catches either way.
	if ( PCG_Load_Tester::MODE_ACTIVATION === $mode ) {
		// Default milestone is `pre-require`; the shutdown handler reads
		// this to distinguish "bootstrap exited before our require even
		// ran" (a different probe issue, not a candidate fault) from
		// "candidate's main file exited during load" (treat as throwable).
		pcg_probe_load_milestone( array( 'state' => 'pre-require' ) );
		add_action(
			'wp_loaded',
			static function () use ( $plugin_mains ) {
				foreach ( $plugin_mains as $plugin_main ) {
					pcg_probe_load_milestone(
						array(
							'state'  => 'in-require',
							'plugin' => $plugin_main,
						)
					);
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
						// `pcg_probe_respond` normally exits, but its
						// re-entry guard can short-circuit silently;
						// stop processing the rest of the batch either
						// way so a captured throwable always wins.
						return;
					}
				}
				pcg_probe_load_milestone( array( 'state' => 'required' ) );
			},
			1
		);
	} else {
		// Update mode doesn't require anything — the new plugin files are
		// already loaded by WP's normal bootstrap. Mark the milestone as
		// `required` so the shutdown handler treats `ok-shutdown` /
		// captured fatals normally (no candidate-load attribution).
		pcg_probe_load_milestone( array( 'state' => 'required' ) );
	}

	// Admin probe: defer the verdict to admin_init so admin-time hook fatals
	// surface (admin_init fires after wp_loaded in admin, so the require has
	// already happened by then). Front-end probe: emit on wp_loaded once
	// init has fired and the require + any wp_loaded callbacks have run.
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
 * Shutdown handler: emit a verdict for every shutdown path so the client
 * can distinguish a real fatal from a plugin that exited cleanly during
 * bootstrap (init/admin_init redirects, license checks, A/B routers, etc).
 *
 * Without the always-emit, a clean exit() during init would leave the
 * client seeing "marker present + HTTP 200 + non-JSON body", which it
 * classifies as a fatal. That misfires on legitimate exit paths and was
 * the dominant cause of false-positive update-healthcheck rollbacks.
 *
 * When the milestone tracker says the bootstrap was mid-`require_once` of
 * a candidate plugin and the classify_shutdown verdict is *not* a fatal
 * (i.e. PHP didn't capture an error — the candidate called `exit` / `die`
 * / `wp_die` from its main file), we re-attribute as a `throwable`
 * against that plugin. A real WP activation would abort the same way, so
 * silently allowing it is the wrong default.
 *
 * When the milestone is still `pre-require` (the deferred `wp_loaded`
 * callback never ran — usually because an earlier plugin exited during
 * `init`), the verdict is downgraded to `error`: the probe learned
 * nothing about the candidate, and shouldn't pretend success.
 */
function pcg_probe_shutdown() {
	$verdict = PCG_Load_Tester::classify_shutdown( error_get_last() );

	if ( 'fatal' === ( $verdict['status'] ?? '' ) ) {
		pcg_probe_respond( $verdict );
		return;
	}

	$milestone = pcg_probe_load_milestone();
	$state     = (string) ( $milestone['state'] ?? 'required' );

	if ( 'in-require' === $state ) {
		$plugin_main = (string) ( $milestone['plugin'] ?? '' );
		pcg_probe_respond(
			array(
				'status'  => 'throwable',
				'plugin'  => $plugin_main,
				'class'   => 'PCG_Probe_Load_Exit',
				'message' => 'Candidate plugin terminated the request during load (exit/die/wp_die before returning). Real activation would abort the same way.',
				'file'    => $plugin_main,
				'line'    => 0,
			)
		);
		return;
	}

	if ( 'pre-require' === $state ) {
		pcg_probe_respond(
			array(
				'status' => 'error',
				'reason' => 'Probe bootstrap exited before the candidate plugin could be loaded; verdict is inconclusive.',
			)
		);
		return;
	}

	pcg_probe_respond( $verdict );
}

/**
 * Track the candidate-load milestone so the shutdown handler can decide
 * whether a missing wp_loaded/admin_init verdict reflects a candidate's
 * mid-load exit (treat as throwable), a pre-require bootstrap abort
 * (treat as error), or a normal post-require clean exit (treat as
 * ok-shutdown via classify_shutdown).
 *
 * @internal
 * @param array|null $set Optional partial state to merge in (`state` and/or `plugin`).
 * @return array{state:string,plugin:string}
 */
function pcg_probe_load_milestone( $set = null ) {
	static $milestone = array(
		'state'  => 'required',
		'plugin' => '',
	);
	if ( is_array( $set ) ) {
		$milestone = array_merge( $milestone, $set );
	}
	return $milestone;
}

/**
 * Emit a JSON response and terminate.
 *
 * Re-entry guard: pcg_probe_shutdown is registered with PHP and fires
 * after every exit, including the exit at the end of this function. A
 * second invocation would append a second JSON document onto the
 * already-flushed response body, breaking the client's json_decode and
 * routing the marker+200 fall-through to a false-positive fatal.
 * Returning silently on re-entry preserves the original verdict.
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
 * Track whether a verdict has already been written to the wire. Set on
 * the first `pcg_probe_respond` call so the shutdown handler's always-
 * emit doesn't re-enter and corrupt the response body.
 *
 * @param bool $mark_now When true, atomically set the flag and return its prior value.
 * @return bool Whether a verdict has already been emitted.
 */
function pcg_probe_already_emitted( $mark_now = false ) {
	static $emitted = false;
	$was            = $emitted;
	if ( $mark_now ) {
		$emitted = true;
	}
	return $was;
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
 * Emit an `error` verdict with the given reason + HTTP status, and terminate.
 *
 * Normally terminates via `pcg_probe_respond`'s `exit`, but returns void
 * silently when `pcg_probe_already_emitted` short-circuits the call (the
 * shutdown-phase re-entry path) — hence `@return void` rather than
 * `@return never`.
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
