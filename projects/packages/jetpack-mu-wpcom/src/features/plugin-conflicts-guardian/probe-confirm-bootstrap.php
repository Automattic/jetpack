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

	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- token (validated by `pcg_confirm_validate_request`) is the nonce.
	$plugin_mains = pcg_confirm_validate_request( $_GET );
	// phpcs:enable WordPress.Security.NonceVerification.Recommended
	if ( empty( $plugin_mains ) ) {
		return;
	}

	// Only single-site active_plugins is hooked; pre_option_active_sitewide_plugins
	// would need the same treatment if PCG ever guards network activations.
	add_filter(
		'pre_option_active_plugins',
		static fn( $value ) => pcg_confirm_inject_active_plugins( $value, $plugin_mains )
	);
}

/**
 * Pure validation: returns the plugin-main list iff $request is a valid
 * confirmation probe (correct flags, well-formed token, matching
 * transient with `confirm === true`, non-empty plugins). Empty array
 * otherwise. Extracted from the entry hook for unit testability.
 *
 * @internal
 * @param array $request Request array (typically `$_GET`).
 * @return string[] Plugin main absolute paths, or empty on any failure.
 */
function pcg_confirm_validate_request( array $request ) {
	$probe_flag   = sanitize_text_field( wp_unslash( $request['pcg_probe'] ?? '' ) );
	$confirm_flag = sanitize_text_field( wp_unslash( $request['pcg_confirm'] ?? '' ) );
	$raw_token    = sanitize_text_field( wp_unslash( $request['token'] ?? '' ) );
	if ( '1' !== $probe_flag || '1' !== $confirm_flag ) {
		return array();
	}
	// Length is locked to what wp_generate_password( 32, false ) emits;
	// the transient lookup is still the real gate, but anchoring length
	// here rules out truncation / accidental-collision noise.
	$token = preg_match( '/^[A-Za-z0-9]{32}$/', $raw_token ) ? $raw_token : '';
	if ( '' === $token ) {
		return array();
	}

	require_once __DIR__ . '/class-pcg-load-tester.php';
	$payload = get_transient( PCG_Load_Tester::transient_key( $token ) );
	// During a mixed-version deploy a pre-deploy transient may lack the
	// `confirm` key; strict `true ===` keeps that case on the safe side
	// (no injection — the probe endpoint will manually require as before).
	if ( ! is_array( $payload ) || true !== ( $payload['confirm'] ?? false ) ) {
		return array();
	}
	return is_array( $payload['plugins'] ?? null ) ? array_values(
		array_filter(
			array_map( static fn( $p ) => (string) $p, $payload['plugins'] ),
			static fn( $p ) => '' !== $p
		)
	) : array();
}

/**
 * Merge confirmation-probe candidates into the `active_plugins` option
 * value. When $value is false, read the cached option without going
 * through `get_option()` — `get_option()` re-fires the same
 * `pre_option_active_plugins` filter, which would recurse forever.
 *
 * @internal Exposed for unit tests.
 * @param mixed    $value         Existing filter value (false = "let WP read the option").
 * @param string[] $plugin_mains  Absolute paths to candidate plugin main files.
 * @return string[] Merged active_plugins list of basenames.
 */
function pcg_confirm_inject_active_plugins( $value, array $plugin_mains ) {
	if ( false === $value ) {
		$alloptions = wp_load_alloptions();
		$raw        = $alloptions['active_plugins'] ?? array();
		$existing   = is_array( $raw ) ? $raw : (array) maybe_unserialize( $raw );
	} else {
		$existing = (array) $value;
	}
	$basenames = array_map( 'plugin_basename', $plugin_mains );
	return array_values( array_unique( array_merge( $existing, $basenames ) ) );
}
