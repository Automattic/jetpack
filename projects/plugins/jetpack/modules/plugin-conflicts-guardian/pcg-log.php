<?php
/**
 * Shared event dispatch for the Plugin Conflicts Guardian feature.
 *
 * @package automattic/jetpack
 */

/**
 * Record a Plugin Conflicts Guardian event.
 *
 * Dispatches to every sink available in the current context:
 *
 *  - A Jetpack Tracks event. `record_user_event()` resolves the connected
 *    WordPress.com user and silently no-ops when the site has no working
 *    connection, so this is effectively connection-gated without a guard.
 *  - The Atomic `atomic_plugin_conflicts_guardian` logstash bucket, when
 *    PCG is running alongside jetpack-mu-wpcom on WordPress.com Atomic and
 *    `Jetpack_Mu_Wpcom::log2logstash()` is therefore available.
 *  - `error_log()`, the always-available fallback used when logstash isn't.
 *
 * `ABSPATH` / `WP_CONTENT_DIR` prefixes are redacted from string values in
 * `$extra` first so log lines don't leak the install layout.
 *
 * @param string $message Event message slug (e.g. "Activation blocked").
 * @param array  $extra   Event-specific properties; JSON-encoded into the `context`/`extra` field.
 * @return void
 */
function pcg_log_event( $message, array $extra ) {
	$message = (string) $message;

	/**
	 * Filter whether Plugin Conflicts Guardian records an event.
	 *
	 * Return false to suppress PCG's whole event dispatch — the Jetpack
	 * Tracks event, the Atomic logstash dispatch, and the `error_log()`
	 * fallback — e.g. on sites that don't want the telemetry.
	 *
	 * @param bool   $enabled Whether to record the event. Default true.
	 * @param string $message Event message slug.
	 * @param array  $extra   Event-specific properties.
	 */
	if ( ! apply_filters( 'pcg_log_enabled', true, $message, $extra ) ) {
		return;
	}

	$extra = pcg_log_redact_paths( $extra );

	// Jetpack Tracks. The Tracking client no-ops gracefully when it can't
	// resolve a connected user, so disconnected sites simply emit nothing here.
	if ( class_exists( \Automattic\Jetpack\Tracking::class ) ) {
		( new \Automattic\Jetpack\Tracking() )->record_user_event(
			'pcg_' . pcg_log_event_slug( $message ),
			array( 'context' => wp_json_encode( $extra, JSON_UNESCAPED_SLASHES ) )
		);
	}

	// Atomic: dispatch to logstash when mu-wpcom's helper is loaded alongside
	// us. `::class` resolves at compile time without autoloading, and
	// `method_exists()` on an absent class is a safe `false` — so this is a
	// no-op off-Atomic rather than a fatal.
	if ( method_exists( \Automattic\Jetpack\Jetpack_Mu_Wpcom::class, 'log2logstash' ) ) {
		\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash( 'atomic_plugin_conflicts_guardian', $message, $extra );
		return;
	}

	// Fallback when logstash isn't available: a local error_log line.
	error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		sprintf( 'Plugin Conflicts Guardian: %s %s', $message, (string) wp_json_encode( $extra, JSON_UNESCAPED_SLASHES ) )
	);
}

/**
 * Slugify an event message into the tail of a Tracks event name, e.g.
 * "Activation blocked" -> "activation_blocked" (the full event becomes
 * `jetpack_pcg_activation_blocked` once Tracking adds the product prefix).
 *
 * @param string $message Event message.
 * @return string
 */
function pcg_log_event_slug( $message ) {
	$slug = strtolower( (string) preg_replace( '/[^A-Za-z0-9]+/', '_', (string) $message ) );
	return trim( $slug, '_' );
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
