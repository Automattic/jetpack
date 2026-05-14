<?php
/**
 * Shared logstash dispatch for the Plugin Conflicts Guardian feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Emit an event to the `atomic_plugin_conflicts_guardian` logstash bucket.
 *
 * Thin wrapper around `Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash()`
 * that pins the feature bucket and redacts ABSPATH/WP_CONTENT_DIR prefixes
 * from any string values in `$extra` so log lines don't leak the install layout.
 *
 * @param string $message Event message slug (e.g. "Activation blocked").
 * @param array  $extra   Event-specific properties; JSON-encoded into the `extra` field.
 * @return void
 */
function pcg_log_event( $message, array $extra ) {
	\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash(
		'atomic_plugin_conflicts_guardian',
		$message,
		pcg_log_redact_paths( $extra )
	);
}

/**
 * Recursively replace `ABSPATH` and `WP_CONTENT_DIR` prefixes inside string
 * values with `.../` so log lines don't leak the install layout. Keeps the
 * relative tail (`plugins/foo/bar.php`), which is the useful part for triage.
 *
 * @param mixed $value Scalar or array.
 * @return mixed
 */
function pcg_log_redact_paths( $value ) {
	if ( is_array( $value ) ) {
		return array_map( 'pcg_log_redact_paths', $value );
	}
	if ( ! is_string( $value ) || '' === $value ) {
		return $value;
	}
	// WP_CONTENT_DIR first — it's a longer prefix that's typically *under*
	// ABSPATH on standard installs, so swapping ABSPATH first would shadow it.
	$replacements = array();
	if ( defined( 'WP_CONTENT_DIR' ) && '' !== WP_CONTENT_DIR ) {
		$replacements[ rtrim( WP_CONTENT_DIR, '/' ) . '/' ] = '.../';
	}
	if ( defined( 'ABSPATH' ) && '' !== ABSPATH ) {
		$replacements[ rtrim( ABSPATH, '/' ) . '/' ] = '.../';
	}
	if ( empty( $replacements ) ) {
		return $value;
	}
	return strtr( $value, $replacements );
}
