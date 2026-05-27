<?php
/**
 * Early-bootstrap hook for the PCG confirmation probe.
 *
 * Confirmation probes carry `pcg_confirm=1` on the URL. To load the
 * candidates via WP's normal active-plugin flow (rather than the manual
 * require_once in probe-endpoint.php), we hook `pre_option_active_plugins`
 * BEFORE wp-settings.php reads the option. That means this file must be
 * required at mu-plugin load time — too late if it waits for
 * `plugins_loaded`.
 *
 * @package automattic/jetpack-mu-wpcom
 */

require_once __DIR__ . '/class-pcg-load-tester.php';

pcg_confirm_maybe_register_hook();

/**
 * Validate the request and, if it's a valid confirmation probe,
 * register the `pre_option_active_plugins` filter to inject candidates.
 */
function pcg_confirm_maybe_register_hook() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- token is the nonce, validated below.
	if ( '1' !== ( $_GET['pcg_probe'] ?? '' ) || '1' !== ( $_GET['pcg_confirm'] ?? '' ) ) {
		return;
	}
	// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated via regex on the next line.
	$raw_token = (string) wp_unslash( $_GET['token'] ?? '' );
	$token     = preg_match( '/^[A-Za-z0-9]+$/', $raw_token ) ? $raw_token : '';
	// phpcs:enable
	if ( '' === $token ) {
		return;
	}

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
			// `false` means "let WP read the real option." Merge our
			// candidates onto whatever WP would have returned.
			$existing = false === $value ? get_option( 'active_plugins', array() ) : (array) $value;
			$basenames = array();
			foreach ( $plugin_mains as $main ) {
				$basenames[] = plugin_basename( (string) $main );
			}
			return array_values( array_unique( array_merge( $existing, $basenames ) ) );
		}
	);
}
