<?php
/**
 * Early-bootstrap hook for the PCG confirmation probe. Must load at
 * mu-plugin time — `pre_option_active_plugins` has to be registered
 * before wp-settings.php reads `active_plugins`.
 *
 * @package automattic/jetpack-mu-wpcom
 */

pcg_confirm_maybe_register_hook();

/**
 * Validate the request and register the `pre_option_active_plugins`
 * filter when this is a valid confirmation probe.
 */
function pcg_confirm_maybe_register_hook() {
	// Bail if `plugins_loaded` already fired — we're loaded too late for
	// the active-plugin injection to take effect (dev path where
	// jetpack-mu-wpcom runs as a regular plugin, not a mu-plugin).
	if ( did_action( 'plugins_loaded' ) ) {
		return;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- only used as a literal flag comparison; no sanitization needed.
	if ( '1' !== ( $_GET['pcg_probe'] ?? '' ) || '1' !== ( $_GET['pcg_confirm'] ?? '' ) ) {
		return;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated via regex on the next line.
	$raw_token = (string) wp_unslash( $_GET['token'] ?? '' );
	$token     = preg_match( '/^[A-Za-z0-9]+$/', $raw_token ) ? $raw_token : '';
	if ( '' === $token ) {
		return;
	}

	require_once __DIR__ . '/class-pcg-load-tester.php';
	$payload = get_transient( PCG_Load_Tester::transient_key( $token ) );
	if ( ! is_array( $payload ) || true !== ( $payload['confirm'] ?? false ) ) {
		return;
	}
	$plugin_mains = is_array( $payload['plugins'] ?? null ) ? array_values(
		array_filter(
			array_map( static fn( $p ) => (string) $p, $payload['plugins'] ),
			static fn( $p ) => '' !== $p
		)
	) : array();
	if ( empty( $plugin_mains ) ) {
		return;
	}

	add_filter(
		'pre_option_active_plugins',
		static function ( $value ) use ( $plugin_mains ) {
			$existing  = false === $value ? get_option( 'active_plugins', array() ) : (array) $value;
			$basenames = array_map( 'plugin_basename', $plugin_mains );
			return array_values( array_unique( array_merge( $existing, $basenames ) ) );
		}
	);
}
