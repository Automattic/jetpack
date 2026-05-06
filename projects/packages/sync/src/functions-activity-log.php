<?php
/**
 * Activity Log helper functions.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Modules\Posts;

// If WordPress's plugin API is available already, use it. If not,
// drop data into `$wp_filter` for `WP_Hook::build_preinitialized_hooks()`.
if ( function_exists( 'add_filter' ) ) {
	$jetpack_activity_log_add_filter = 'add_filter';
	$jetpack_activity_log_add_action = 'add_action';
} else {
	$jetpack_activity_log_add_filter = function ( $name, $cb, $priority = 10, $accepted_args = 1 ) {
		global $wp_filter;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wp_filter[ $name ][ $priority ][] = array(
			'accepted_args' => $accepted_args,
			'function'      => $cb,
		);
	};
	$jetpack_activity_log_add_action = $jetpack_activity_log_add_filter;
}

/**
 * Logs a custom event to the Jetpack Activity Log.
 *
 * Example:
 *   jetpack_activity_log_event( array(
 *       'title'       => 'Cache flushed during incident response',
 *       'content'     => 'Plain text note only.',
 *       'source'      => 'mc',
 *       'severity'    => 'info',
 *       'external_id' => 'sync-run-123',
 *       'link'        => 'https://example.com/logs/123',
 *   ) );
 *
 * @param array $args {
 *     Activity log event arguments.
 *
 *     @type string $title       Required. Plain-text title, truncated to 200 chars.
 *     @type string $content     Required. Plain-text body, truncated to 5000 chars.
 *     @type string $source      Required. Identifier for the source of the event, e.g. 'mc'.
 *     @type string $severity    Optional. 'info', 'success', 'warning', or 'error'. Defaults to 'info'.
 *     @type string $external_id Optional. Caller-supplied ID for deduplication on retry.
 *     @type string $link        Optional. URL for more details about the event.
 * }
 * @return int|false Post ID on success, false if validation fails.
 */
function jetpack_activity_log_event( array $args ) {

	$source  = _jetpack_activity_log_sanitize_string( $args['source'] ?? '', 100 );
	$title   = _jetpack_activity_log_sanitize_string( $args['title'] ?? '', 200 );
	$content = _jetpack_activity_log_sanitize_string( $args['content'] ?? '', 5000, true );

	if ( '' === $source || '' === $title || '' === $content ) {
		return false;
	}

	$severity = _jetpack_activity_log_sanitize_severity( $args['severity'] ?? 'info' );
	if ( false === $severity ) {
		return false;
	}

	$payload = array(
		'title'    => $title,
		'content'  => $content,
		'source'   => $source,
		'severity' => $severity,
	);

	if ( ! empty( $args['external_id'] ) ) {
		$external_id = _jetpack_activity_log_sanitize_string( $args['external_id'], 100 );
		if ( '' !== $external_id ) {
			$payload['external_id'] = $external_id;
		}
	}

	if ( ! empty( $args['link'] ) && ! is_array( $args['link'] ) && ! is_object( $args['link'] ) ) {
		$link = esc_url_raw( (string) $args['link'] );
		if ( '' !== $link ) {
			$payload['link'] = _jetpack_activity_log_substr( $link, 2000 );
		}
	}

	$post_id = wp_insert_post(
		wp_slash(
			array(
				'post_type'    => Posts::ACTIVITY_LOG_CPT,
				'post_title'   => $title,
				'post_content' => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
				'post_status'  => 'publish',
			)
		),
		true
	);

	return is_wp_error( $post_id ) ? false : $post_id;
}

/**
 * Strips HTML/PHP from a value and truncates it to a maximum character length, multibyte-safe.
 *
 * @internal Used by jetpack_activity_log_event() to sanitize required string fields.
 *
 * @param mixed $value                Raw value from caller.
 * @param int   $max                  Maximum length in characters.
 * @param bool  $preserve_line_breaks Whether to preserve line breaks.
 * @return string
 */
function _jetpack_activity_log_sanitize_string( $value, $max, $preserve_line_breaks = false ) {
	if ( is_array( $value ) || is_object( $value ) ) {
		return '';
	}

	$value = wp_strip_all_tags( (string) $value, ! $preserve_line_breaks );
	$value = trim( preg_replace( '/[^\P{C}\t\r\n]/u', '', $value ) );

	return _jetpack_activity_log_substr( $value, $max );
}

/**
 * Sanitizes an Activity Log severity value.
 *
 * @internal Used by jetpack_activity_log_event() to validate event severity.
 *
 * @param mixed $severity Raw severity from caller.
 * @return string|false Sanitized severity, or false if invalid.
 */
function _jetpack_activity_log_sanitize_severity( $severity ) {
	if ( is_array( $severity ) || is_object( $severity ) ) {
		return false;
	}

	$severity = strtolower( trim( (string) $severity ) );
	if ( '' === $severity ) {
		return 'info';
	}

	$allowed_severities = array(
		'info'    => true,
		'success' => true,
		'warning' => true,
		'error'   => true,
	);

	return isset( $allowed_severities[ $severity ] ) ? $severity : false;
}

/**
 * Truncates a string to a maximum character length.
 *
 * @internal Used by jetpack_activity_log_event() helpers.
 *
 * @param string $value Raw value.
 * @param int    $max   Maximum length in characters.
 * @return string
 */
function _jetpack_activity_log_substr( $value, $max ) {
	if ( function_exists( 'mb_substr' ) ) {
		return mb_substr( $value, 0, $max );
	}

	return substr( $value, 0, $max );
}

/**
 * Registers the Activity Log CPT with hardened defaults that prevent leakage
 * to front-end queries, RSS, REST, search, sitemaps, and exports.
 */
$jetpack_activity_log_add_action(
	'init',
	function () {
		register_post_type(
			Posts::ACTIVITY_LOG_CPT,
			array(
				'labels'              => array(
					'name'          => 'Activity Log Events',
					'singular_name' => 'Activity Log Event',
				),
				'public'              => false,
				'publicly_queryable'  => false,
				'show_ui'             => false,
				'show_in_menu'        => false,
				'show_in_nav_menus'   => false,
				'show_in_rest'        => false,
				'show_in_admin_bar'   => false,
				'exclude_from_search' => true,
				'has_archive'         => false,
				'rewrite'             => false,
				'query_var'           => false,
				'can_export'          => false,
				'supports'            => array( 'title', 'editor' ),
			)
		);
	}
);

/**
 * Never auto-share Activity Log entries via Jetpack Social,
 * even if a third party adds 'publicize' post-type support to this CPT.
 */
$jetpack_activity_log_add_filter(
	'publicize_should_publicize_published_post',
	function ( $should, $post ) {
		return ( $post && Posts::ACTIVITY_LOG_CPT === $post->post_type ) ? false : $should;
	},
	10,
	2
);

/**
 * Never include Activity Log entries in Jetpack sitemaps,
 * even if a third party adds this CPT to the sitemap post-type list.
 */
$jetpack_activity_log_add_filter(
	'jetpack_sitemap_post_types',
	function ( $types ) {
		return array_diff( (array) $types, array( Posts::ACTIVITY_LOG_CPT ) );
	}
);

unset( $jetpack_activity_log_add_action, $jetpack_activity_log_add_filter );
