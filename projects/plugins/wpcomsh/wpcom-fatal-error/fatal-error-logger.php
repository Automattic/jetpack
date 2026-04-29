<?php
/**
 * Default listener on `wpcomsh_fatal_signature` that ships the
 * transportable signature to wpcom logstash via `WPCOMSH_Log`.
 *
 * Mirrors the existing telemetry pattern used in this plugin (see
 * `safeguard/utils.php::log_safeguard_error()`, `woa.php`,
 * `wpcom-marketplace/software/class-marketplace-software-manager.php`,
 * and `connection/class-atomic-storage-provider.php`): a short labeled
 * `$message` plus a structured `$extra` array.
 *
 * `unsafe_direct_log()` is used (rather than the `wpcomsh_log` action)
 * because the regular hook is only registered after `init`, and the
 * fatal-error filter can fire much earlier in the request. The unsafe
 * variant queues the entry and flushes via a shutdown function, so the
 * outbound `wp_remote_post()` runs after the response has been sent.
 *
 * @package wpcomsh
 */

/**
 * Action callback for `wpcomsh_fatal_signature`.
 *
 * @param string     $signature Base64url-encoded signature token.
 * @param array|null $plugin    Identified extension metadata. Unused; the
 *                              signature already encodes what we need.
 * @param array      $error     Original error details. Unused for the
 *                              same reason.
 * @return void
 */
function wpcomsh_fatal_log_signature( $signature, $plugin = null, $error = array() ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	unset( $plugin, $error );

	if ( ! is_string( $signature ) || '' === $signature ) {
		return;
	}

	// The fatal handler can fire before `wpcomsh.php` finishes its
	// requires (the fatal-error module loads at the top, `WPCOMSH_Log`
	// further down). Pull the class in directly when needed; the file
	// only defines a class + registers an `init` action, both safe to
	// re-register if it ends up loaded again later.
	if ( ! class_exists( 'WPCOMSH_Log' ) ) {
		$log_file = dirname( __DIR__ ) . '/class-wpcomsh-log.php';
		if ( is_readable( $log_file ) ) {
			require_once $log_file;
		}
	}
	if ( ! class_exists( 'WPCOMSH_Log' ) ) {
		return;
	}

	try {
		\WPCOMSH_Log::unsafe_direct_log(
			'wpcomsh_fatal_signature',
			array( 'signature' => $signature )
		);
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort; never escalate a logging failure into another fatal.
		// Swallow.
	}
}
add_action( 'wpcomsh_fatal_signature', 'wpcomsh_fatal_log_signature', 10, 3 );
