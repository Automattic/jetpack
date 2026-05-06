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
	if ( ! function_exists( 'log2logstash' ) ) {
		$log2logstash_path = WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';
		if ( ! is_readable( $log2logstash_path ) ) {
			return;
		}
		require_once $log2logstash_path;
	}

	log2logstash(
		array(
			'feature' => 'plugin-conflicts-guardian',
			'message' => (string) $message,
			'extra'   => wp_json_encode( $extra, JSON_UNESCAPED_SLASHES ),
		)
	);
}
