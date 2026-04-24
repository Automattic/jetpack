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

	// Tell WP's fatal handler to stand down so ours can emit JSON.
	if ( ! defined( 'WP_SANDBOX_SCRAPING' ) ) {
		define( 'WP_SANDBOX_SCRAPING', true );
	}

	// Swallow plugin output so the JSON response isn't corrupted.
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

	// Let init / admin_init fire with the plugin's hooks in place; emit "ok" at the end.
	add_action( 'wp_loaded', 'pcg_probe_emit_ok', PHP_INT_MAX );
}

/**
 * Emit a clean "ok" verdict once the full bootstrap completed.
 * Diagnostic block reports which bootstrap actions actually fired.
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
 * Shutdown handler: on fatal, clear any buffered WP fatal page and emit
 * JSON with the error. Uses HTTP 200 so the client can distinguish a
 * captured fatal from a transport problem.
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

	wp_send_json(
		array(
			'status'  => 'fatal',
			'errno'   => (int) $error['type'],
			'message' => (string) $error['message'],
			'file'    => basename( (string) $error['file'] ),
			'line'    => (int) $error['line'],
		),
		200,
		JSON_UNESCAPED_SLASHES
	);
}

/**
 * Emit a JSON response and terminate.
 *
 * @param array $payload JSON-serializable payload.
 * @param int   $status  HTTP status code.
 * @return never
 */
function pcg_probe_respond( $payload, $status = 200 ) {
	while ( ob_get_level() > 0 ) {
		ob_end_clean();
	}
	wp_send_json( $payload, (int) $status, JSON_UNESCAPED_SLASHES );
	exit;
}
