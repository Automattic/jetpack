<?php
/**
 * Shared logstash dispatch for the Plugin Conflicts Guardian feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Emit an event to the `plugin-conflicts-guardian` logstash bucket.
 *
 * Best-effort: a logging failure must never escalate into a fatal,
 * since callers run on activation / install / update request paths.
 * No-op outside WordPress.com (no `log2logstash` available).
 *
 * @param string $message Event message slug (e.g. "Activation blocked").
 * @param array  $extra   Event-specific properties; JSON-encoded into the `extra` field.
 * @return void
 */
function pcg_log_event( $message, array $extra ) {
	try {
		if ( ! function_exists( 'log2logstash' ) ) {
			$log2logstash_path = WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';
			if ( ! is_readable( $log2logstash_path ) ) {
				return;
			}
			require_once $log2logstash_path;
		}

		log2logstash(
			array(
				'blog_id' => get_current_blog_id(),
				'feature' => 'plugin-conflicts-guardian',
				'message' => (string) $message,
				'extra'   => wp_json_encode( pcg_log_redact_paths( $extra ), JSON_UNESCAPED_SLASHES ),
			)
		);
	} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- best-effort: a logging failure must not escalate on activation / install / update request paths.
		unset( $e );
	}
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
