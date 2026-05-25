<?php
/**
 * Layout-grid usage tracking — emit a logstash event when a `jetpack/layout-grid`
 * block is inserted or first rendered on a WoA site. The payload captures the
 * active theme, active plugins, request-context flags, and a sanitized
 * backtrace so the source can be attributed to the responsible plugin or
 * theme rather than just the candidate set.
 *
 * Companion to the Simple-side observer in wpcom's
 * `wp-content/mu-plugins/wpcom-wpcom-blocks.php`. Distinct logstash feature
 * bucket (`atomic_layout_grid_block`) so the two datasets don't co-mingle.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare(strict_types=1);

const WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME  = 'jetpack/layout-grid';
const WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION = 'wpcom_layout_grid_block_seen';
const WPCOM_LAYOUT_GRID_USAGE_LOG_FEATURE = 'atomic_layout_grid_block';
const WPCOM_LAYOUT_GRID_USAGE_LOG_MESSAGE = 'layout_grid_block_observed';

/**
 * Whether to register the detectors. WoA only — Simple has its own observer
 * in wpcom; non-WoA Atomic / connected Jetpack sites aren't in scope.
 * Extracted so tests can require the file without auto-registering hooks.
 *
 * @return bool
 */
function wpcom_layout_grid_usage_should_load() {
	if ( ! class_exists( '\Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}
	return ( new \Automattic\Jetpack\Status\Host() )->is_woa_site();
}

if ( wpcom_layout_grid_usage_should_load() ) {
	add_action( 'wp_after_insert_post', 'wpcom_layout_grid_usage_react_to_post_insert', 10, 4 );
	add_action( 'add_option_widget_block', 'wpcom_layout_grid_usage_react_to_widget_block_added', 10, 2 );
	add_action( 'update_option_widget_block', 'wpcom_layout_grid_usage_react_to_widget_block_updated', 10, 2 );
	add_filter( 'render_block_' . WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME, 'wpcom_layout_grid_usage_react_to_block_render', 10, 2 );
}

/**
 * Post-insert detector. Logs per-event (no sentinel): editor saves are
 * naturally low volume, and repeat events from the same blog corroborate
 * single-cause vs multi-cause patterns. Skips updates whose previous version
 * already contained the block so we don't log every edit of pre-existing
 * content — only the moment the block first lands in a given post.
 *
 * @param int           $post_id     Post ID.
 * @param \WP_Post      $post        Post after the insert.
 * @param bool          $update      Whether this is an update.
 * @param \WP_Post|null $post_before Previous post version (null on insert).
 * @return void
 */
function wpcom_layout_grid_usage_react_to_post_insert( $post_id, $post, $update, $post_before ) {
	unset( $post_id, $update );
	if ( ! $post instanceof \WP_Post ) {
		return;
	}
	if ( ! has_block( WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME, $post ) ) {
		return;
	}
	if ( $post_before instanceof \WP_Post && has_block( WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME, $post_before ) ) {
		return;
	}
	wpcom_layout_grid_usage_log_observation(
		array(
			'surface'   => 'post_insert',
			'post_type' => (string) $post->post_type,
		)
	);
}

/**
 * `add_option_widget_block` handler. Fires the first time the option is
 * created; logs when the initial value contains layout-grid markup.
 *
 * @param string $option Option name (unused — pinned to `widget_block` via filter name).
 * @param mixed  $value  New option value.
 * @return void
 */
function wpcom_layout_grid_usage_react_to_widget_block_added( $option, $value ) {
	unset( $option );
	if ( ! wpcom_layout_grid_usage_widget_value_contains_block( $value ) ) {
		return;
	}
	wpcom_layout_grid_usage_log_observation( array( 'surface' => 'widget_add' ) );
}

/**
 * `update_option_widget_block` handler. Logs only when the new value contains
 * the block and the previous value didn't — same "first landing" semantics as
 * the post detector.
 *
 * @param mixed $old_value Previous option value.
 * @param mixed $value     New option value.
 * @return void
 */
function wpcom_layout_grid_usage_react_to_widget_block_updated( $old_value, $value ) {
	if ( ! wpcom_layout_grid_usage_widget_value_contains_block( $value ) ) {
		return;
	}
	if ( wpcom_layout_grid_usage_widget_value_contains_block( $old_value ) ) {
		return;
	}
	wpcom_layout_grid_usage_log_observation( array( 'surface' => 'widget_update' ) );
}

/**
 * Render-time backstop. Sentinel-guarded so it fires at most once per blog:
 * by render time the call stack no longer reaches the cause, so the marginal
 * attribution value of repeat events is zero — but the per-pageview cost on
 * layout-grid-using sites is high. One log per blog tells us the block came
 * from a theme-bundled template / pattern or direct `$wpdb` write that the
 * post / widget detectors didn't see.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $parsed_block  Parsed block (unused).
 * @return string Unchanged content.
 */
function wpcom_layout_grid_usage_react_to_block_render( $block_content, $parsed_block ) {
	unset( $parsed_block );
	if ( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) ) {
		return $block_content;
	}
	update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 1, false );
	wpcom_layout_grid_usage_log_observation( array( 'surface' => 'render' ) );
	return $block_content;
}

/**
 * Whether a `widget_block` option value contains the layout-grid block in
 * any of its widget entries. The option is an array keyed by widget id, with
 * each entry holding a `content` string of block markup.
 *
 * @param mixed $value Option value.
 * @return bool
 */
function wpcom_layout_grid_usage_widget_value_contains_block( $value ) {
	if ( ! is_array( $value ) ) {
		return false;
	}
	foreach ( $value as $widget ) {
		if (
			is_array( $widget )
			&& isset( $widget['content'] )
			&& is_string( $widget['content'] )
			&& has_block( WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME, $widget['content'] )
		) {
			return true;
		}
	}
	return false;
}

/**
 * Dispatch a layout-grid observation to logstash. Best-effort: a logging
 * failure must not escalate into a fatal for the caller — guarded by the
 * underlying `Jetpack_Mu_Wpcom::log2logstash()` wrapper.
 *
 * @param array $extra Surface-specific properties merged into the payload.
 * @return void
 */
function wpcom_layout_grid_usage_log_observation( array $extra ) {
	if ( ! class_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom' ) ) {
		return;
	}

	$active_plugins_raw = get_option( 'active_plugins' );
	$active_plugins     = is_array( $active_plugins_raw ) ? array_values( $active_plugins_raw ) : array();

	$payload = array_merge(
		$extra,
		array(
			'active_theme'   => function_exists( 'get_stylesheet' ) ? (string) get_stylesheet() : '',
			'active_plugins' => $active_plugins,
			'is_rest'        => defined( 'REST_REQUEST' ) && REST_REQUEST,
			'is_cli'         => defined( 'WP_CLI' ) && WP_CLI,
			'is_cron'        => defined( 'DOING_CRON' ) && DOING_CRON,
			'is_importing'   => defined( 'WP_IMPORTING' ) && WP_IMPORTING,
			'trace'          => wpcom_layout_grid_usage_attribute_source(),
		)
	);

	\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash(
		WPCOM_LAYOUT_GRID_USAGE_LOG_FEATURE,
		WPCOM_LAYOUT_GRID_USAGE_LOG_MESSAGE,
		wpcom_layout_grid_usage_redact_paths( $payload )
	);
}

/**
 * Walk the PHP call stack and return up to 8 frames that point at code under
 * `wp-content/plugins/`, `wp-content/themes/`, or `wp-content/mu-plugins/`.
 * Those are the cause candidates; core / pluggable frames are filtered out.
 *
 * @return string[]
 */
function wpcom_layout_grid_usage_attribute_source() {
	if ( ! function_exists( 'wp_debug_backtrace_summary' ) ) {
		return array();
	}
	// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- `null` is the documented default for $ignore_class; the wordpress-stubs signature is imprecise.
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_wp_debug_backtrace_summary -- Intentional: attribution backtrace for a logstash record.
	$frames = wp_debug_backtrace_summary( null, 0, false );
	if ( ! is_array( $frames ) ) {
		return array();
	}
	$relevant = array_values(
		array_filter(
			$frames,
			static function ( $frame ) {
				return is_string( $frame ) && preg_match( '#/wp-content/(plugins|themes|mu-plugins)/#', $frame );
			}
		)
	);
	return array_slice( $relevant, 0, 8 );
}

/**
 * Strip ABSPATH / WP_CONTENT_DIR prefixes from any string values in the
 * payload so log lines don't leak the install layout. Mirrors the
 * `pcg_log_redact_paths` helper in the Plugin Conflicts Guardian feature.
 *
 * @param mixed $value Scalar or array.
 * @return mixed
 */
function wpcom_layout_grid_usage_redact_paths( $value ) {
	if ( is_array( $value ) ) {
		return array_map( 'wpcom_layout_grid_usage_redact_paths', $value );
	}
	if ( ! is_string( $value ) || '' === $value ) {
		return $value;
	}
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
