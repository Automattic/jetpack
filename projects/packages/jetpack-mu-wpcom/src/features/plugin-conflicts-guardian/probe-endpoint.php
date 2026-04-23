<?php
/**
 * HTTP probe endpoint for the Plugin Conflicts Guardian.
 *
 * Listens for requests carrying `?pcg_probe=1&token=…` with a token we
 * stashed moments earlier in PCG_Load_Tester. The handler fires on
 * `plugins_loaded` priority 0 — the earliest point where transients
 * and WP helpers are available but the full bootstrap (init,
 * admin_init, …) hasn't finished. It:
 *
 *   1. Validates + consumes the token.
 *   2. Arms a shutdown handler so any PHP fatal from here on is turned
 *      into a clean JSON response.
 *   3. `require`s the uploaded plugin's main PHP file, registering
 *      whatever hooks the plugin wires up.
 *   4. Hooks `wp_loaded` at `PHP_INT_MAX` to emit a clean "ok"
 *      verdict — by that point `plugins_loaded`, `init` and
 *      `admin_init` have all run, so errors that only manifest inside
 *      those callbacks have had a chance to fatal.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Run synchronously at require time. This file is included from
// jetpack-mu-wpcom's `load_features()`, which itself fires on
// `plugins_loaded` at priority 10, so we're already inside that
// action when this runs. Registering a hook at priority 0 here would
// be too late; inline inspection is the one reliable path.
pcg_maybe_handle_probe();

/**
 * Entry point. Bails when the request isn't a probe so unrelated
 * traffic stays untouched.
 */
function pcg_maybe_handle_probe() {
	$probe_flag = isset( $_GET['pcg_probe'] ) ? sanitize_text_field( wp_unslash( $_GET['pcg_probe'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- token is the nonce, validated below.
	if ( '1' !== $probe_flag ) {
		return;
	}

	// Mixed-case random tokens from `wp_generate_password`; we can't
	// `sanitize_key` (which lowercases) and must validate with a regex.
	$raw_token = isset( $_GET['token'] ) ? (string) wp_unslash( $_GET['token'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated via regex on the next line.
	$token     = preg_match( '/^[A-Za-z0-9]+$/', $raw_token ) ? $raw_token : '';
	if ( '' === $token ) {
		pcg_probe_respond(
			array(
				'status' => 'error',
				'reason' => 'Missing or malformed probe token.',
			),
			400
		);
	}

	$key  = PCG_Load_Tester::transient_key( $token );
	$data = get_transient( $key );
	delete_transient( $key );

	if ( ! is_array( $data ) || empty( $data['plugin_main'] ) ) {
		pcg_probe_respond(
			array(
				'status' => 'error',
				'reason' => 'Invalid or expired probe token.',
			),
			403
		);
	}

	$plugin_main = (string) $data['plugin_main'];

	if ( ! is_file( $plugin_main ) || ! is_readable( $plugin_main ) ) {
		pcg_probe_respond(
			array(
				'status' => 'error',
				'reason' => 'Probe target is no longer readable.',
			),
			404
		);
	}

	// Tell WP's own fatal-error handler to stand down for this request.
	// `WP_SANDBOX_SCRAPING` is the core-blessed opt-out: the built-in
	// shutdown handler returns early when it sees this constant, which
	// leaves our shutdown handler free to emit a JSON verdict (instead
	// of WP running wp_die() first and exit()ing before we get a turn).
	if ( ! defined( 'WP_SANDBOX_SCRAPING' ) ) {
		define( 'WP_SANDBOX_SCRAPING', true );
	}

	// Swallow any output the plugin emits during load / hooks so the
	// JSON response isn't corrupted; the shutdown handler flushes and
	// discards it.
	ob_start();

	register_shutdown_function( 'pcg_probe_shutdown' );

	try {
		require $plugin_main;
	} catch ( \Throwable $t ) {
		pcg_probe_respond(
			array(
				'status'  => 'throwable',
				'class'   => get_class( $t ),
				'message' => $t->getMessage(),
				'file'    => basename( $t->getFile() ),
				'line'    => $t->getLine(),
			),
			200
		);
	}

	// Let WP continue bootstrapping — init, admin_init, and so on fire
	// with the uploaded plugin's hooks in place. At `wp_loaded` we've
	// reached the end of the bootstrap sequence; if nothing fataled we
	// can confidently emit "ok".
	add_action( 'wp_loaded', 'pcg_probe_emit_ok', PHP_INT_MAX );
}

/**
 * Emit a clean "ok" verdict once the full bootstrap completed.
 *
 * The `diagnostic` block is included to help debug probes that return
 * "ok" unexpectedly — it tells the parent which bootstrap actions
 * actually fired during the probe request.
 */
function pcg_probe_emit_ok() {
	pcg_probe_respond(
		array(
			'status'     => 'ok',
			'diagnostic' => array(
				'did_plugins_loaded' => (int) did_action( 'plugins_loaded' ),
				'did_init'           => (int) did_action( 'init' ),
				'did_admin_init'     => (int) did_action( 'admin_init' ),
				'did_wp_loaded'      => (int) did_action( 'wp_loaded' ),
				'is_admin'           => (bool) is_admin(),
				'loaded_file'        => basename( __FILE__ ),
			),
		),
		200
	);
}

/**
 * Shutdown handler: if PHP terminated the probe request with a fatal,
 * clear buffered output (including WP's own fatal page) and emit JSON
 * with the error. Uses HTTP 200 so the parent's `wp_remote_get`
 * doesn't confuse the fatal report with a transport problem.
 */
function pcg_probe_shutdown() {
	$error = error_get_last();
	if ( ! is_array( $error ) ) {
		return;
	}
	$fatal_mask = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR;
	if ( 0 === ( $error['type'] & $fatal_mask ) ) {
		return;
	}

	while ( ob_get_level() > 0 ) {
		ob_end_clean();
	}

	if ( ! headers_sent() ) {
		status_header( 200 );
		header( 'Content-Type: application/json; charset=utf-8' );
	}
	echo wp_json_encode( // phpcs:ignore Jetpack.Functions.JsonEncodeFlags.Missing -- output goes to an HTTP body, not embedded in HTML; default flags are fine.
		array(
			'status'  => 'fatal',
			'errno'   => (int) $error['type'],
			'message' => (string) $error['message'],
			'file'    => basename( (string) $error['file'] ),
			'line'    => (int) $error['line'],
		)
	);
	exit;
}

/**
 * Emit a JSON response and terminate. One helper for the three
 * validation / success paths keeps the headers-and-buffer dance
 * consistent.
 *
 * @param array $payload JSON-serializable payload.
 * @param int   $status  HTTP status code.
 */
function pcg_probe_respond( $payload, $status = 200 ) {
	while ( ob_get_level() > 0 ) {
		ob_end_clean();
	}
	if ( ! headers_sent() ) {
		status_header( (int) $status );
		header( 'Content-Type: application/json; charset=utf-8' );
	}
	// phpcs:ignore Jetpack.Functions.JsonEncodeFlags.Missing -- output goes to an HTTP body, not embedded in HTML; default flags are fine.
	echo wp_json_encode( $payload );
	exit;
}
