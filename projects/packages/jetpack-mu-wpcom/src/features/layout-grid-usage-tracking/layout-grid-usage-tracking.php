<?php
/**
 * Layout-grid usage tracking — emit a logstash event when a `jetpack/layout-grid`
 * block is inserted or first rendered on a WoA site. The payload captures the
 * active theme, active plugins, request-context flags, and a sanitized
 * backtrace so the source can be attributed to the responsible plugin or
 * theme rather than just the candidate set.
 *
 * Events ship to the `atomic_layout_grid_block` logstash bucket.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare(strict_types=1);

const LAYOUT_GRID_BLOCK_NAME       = 'jetpack/layout-grid';
const LAYOUT_GRID_SEEN_OPTION      = 'layout_grid_block_seen';
const LAYOUT_GRID_IMPORT_TRANSIENT = 'layout_grid_block_import_seen';
const LAYOUT_GRID_CRON_TRANSIENT   = 'layout_grid_block_cron_seen';
const LAYOUT_GRID_LOG_FEATURE      = 'atomic_layout_grid_block';
const LAYOUT_GRID_LOG_MESSAGE      = 'layout_grid_block_observed';

/**
 * Whether to register the detectors. WoA only — non-WoA Atomic / connected
 * Jetpack sites aren't in scope. Extracted so tests can require the file
 * without auto-registering hooks.
 *
 * @return bool
 */
function layout_grid_should_load() {
	if ( ! class_exists( '\Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}
	return ( new \Automattic\Jetpack\Status\Host() )->is_woa_site();
}

if ( layout_grid_should_load() ) {
	add_action( 'wp_after_insert_post', 'layout_grid_react_to_post_insert', 10, 4 );
	add_action( 'add_option_widget_block', 'layout_grid_react_to_widget_block_added', 10, 2 );
	add_action( 'update_option_widget_block', 'layout_grid_react_to_widget_block_updated', 10, 2 );
	add_filter( 'render_block_' . LAYOUT_GRID_BLOCK_NAME, 'layout_grid_react_to_block_render', 10, 2 );
}

/**
 * Post-insert detector. Logs editor-driven first-landings per-event (low
 * volume, and repeat events from the same blog help corroborate single-cause
 * vs multi-cause patterns). Importer- and cron-driven inserts are rate-limited
 * to one event per blog per 24h via transients — same stack on every iteration,
 * so per-event repeats add zero attribution value but a lot of noise.
 *
 * @param int           $post_id     Post ID.
 * @param \WP_Post      $post        Post after the insert.
 * @param bool          $update      Whether this is an update.
 * @param \WP_Post|null $post_before Previous post version (null on insert).
 * @return void
 */
function layout_grid_react_to_post_insert( $post_id, $post, $update, $post_before ) {
	unset( $update );
	// Revisions and autosaves are inserted as their own posts, so the
	// `$post_before` check below can't see the parent post's previous state —
	// without this guard every editor autosave on a layout-grid-using post
	// would log a fresh event.
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( ! $post instanceof \WP_Post ) {
		return;
	}
	// `has_block( $name, $post )` would route through `get_post()`, which can
	// re-fetch the post via cache (or DB) and return a different content
	// snapshot than the WP_Post we were handed. Pass the raw content string
	// directly so the scan is over the exact bytes we observed.
	if ( ! has_block( LAYOUT_GRID_BLOCK_NAME, (string) $post->post_content ) ) {
		return;
	}
	if ( $post_before instanceof \WP_Post && has_block( LAYOUT_GRID_BLOCK_NAME, (string) $post_before->post_content ) ) {
		return;
	}
	$is_importing = defined( 'WP_IMPORTING' ) && WP_IMPORTING;
	$is_cron      = defined( 'DOING_CRON' ) && DOING_CRON;
	if ( ! layout_grid_should_log_in_context( $is_importing, $is_cron ) ) {
		return;
	}
	$dispatched = layout_grid_log_observation(
		array(
			'surface'   => 'post_insert',
			'post_type' => (string) $post->post_type,
		)
	);
	// Only burn the 24h budget if we actually dispatched. Setting the
	// transient before dispatch would mean a filter-blocked or class-missing
	// observation silently consumes the rate-limit window without recording
	// anything in Kibana.
	if ( $dispatched ) {
		layout_grid_mark_context_seen( $is_importing, $is_cron );
	}
}

/**
 * Read-only rate-limit gate for high-volume insert contexts. Returns false
 * when the per-context transient is already set (we've logged within the
 * window). Pair with `layout_grid_mark_context_seen()` after a successful
 * dispatch — splitting the read from the write means a logging failure no
 * longer burns the 24h budget.
 *
 * Import takes precedence when both flags are set (cron-triggered import).
 *
 * @param bool $is_importing Whether `WP_IMPORTING` is set.
 * @param bool $is_cron      Whether `DOING_CRON` is set.
 * @return bool True if the caller should continue and log; false to skip.
 */
function layout_grid_should_log_in_context( $is_importing, $is_cron ) {
	$key = layout_grid_context_transient_key( $is_importing, $is_cron );
	if ( null === $key ) {
		return true;
	}
	return ! get_transient( $key );
}

/**
 * Persist the rate-limit transient for the active context (if any) after a
 * successful dispatch. No-op outside import / cron.
 *
 * @param bool $is_importing Whether `WP_IMPORTING` is set.
 * @param bool $is_cron      Whether `DOING_CRON` is set.
 * @return void
 */
function layout_grid_mark_context_seen( $is_importing, $is_cron ) {
	$key = layout_grid_context_transient_key( $is_importing, $is_cron );
	if ( null === $key ) {
		return;
	}
	set_transient( $key, 1, DAY_IN_SECONDS );
}

/**
 * Resolve the transient key for the active rate-limit context. Returns null
 * outside import / cron. Import wins when both flags are set.
 *
 * @param bool $is_importing Whether `WP_IMPORTING` is set.
 * @param bool $is_cron      Whether `DOING_CRON` is set.
 * @return string|null
 */
function layout_grid_context_transient_key( $is_importing, $is_cron ) {
	if ( $is_importing ) {
		return LAYOUT_GRID_IMPORT_TRANSIENT;
	}
	if ( $is_cron ) {
		return LAYOUT_GRID_CRON_TRANSIENT;
	}
	return null;
}

/**
 * `add_option_widget_block` handler. Fires the first time the option is
 * created; logs when the initial value contains layout-grid markup.
 *
 * @param string $option Option name (unused — pinned to `widget_block` via filter name).
 * @param mixed  $value  New option value.
 * @return void
 */
function layout_grid_react_to_widget_block_added( $option, $value ) {
	unset( $option );
	if ( ! layout_grid_widget_value_contains_block( $value ) ) {
		return;
	}
	layout_grid_log_observation( array( 'surface' => 'widget_add' ) );
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
function layout_grid_react_to_widget_block_updated( $old_value, $value ) {
	if ( ! layout_grid_widget_value_contains_block( $value ) ) {
		return;
	}
	if ( layout_grid_widget_value_contains_block( $old_value ) ) {
		return;
	}
	layout_grid_log_observation( array( 'surface' => 'widget_update' ) );
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
function layout_grid_react_to_block_render( $block_content, $parsed_block ) {
	unset( $parsed_block );
	if ( get_option( LAYOUT_GRID_SEEN_OPTION ) ) {
		return $block_content;
	}
	// Only persist the sentinel after the dispatch attempt actually went out.
	// Setting it first would mean a filter-blocked or class-missing
	// observation permanently disables the render backstop for this blog,
	// because the option has no TTL — even after the underlying cause is
	// fixed, the backstop never fires again.
	if ( layout_grid_log_observation( array( 'surface' => 'render' ) ) ) {
		update_option( LAYOUT_GRID_SEEN_OPTION, 1, false );
	}
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
function layout_grid_widget_value_contains_block( $value ) {
	if ( ! is_array( $value ) ) {
		return false;
	}
	foreach ( $value as $widget ) {
		if (
			is_array( $widget )
			&& isset( $widget['content'] )
			&& is_string( $widget['content'] )
			&& has_block( LAYOUT_GRID_BLOCK_NAME, $widget['content'] )
		) {
			return true;
		}
	}
	return false;
}

/**
 * Dispatch a layout-grid observation to logstash. Returns true when dispatch
 * was attempted (filter passed and `Jetpack_Mu_Wpcom` is loaded), false when
 * the call was short-circuited. Callers use the return value to gate sticky
 * side effects (the render sentinel, the import/cron transients) so that a
 * blocked dispatch doesn't lock those out for the next observation.
 *
 * Best-effort beyond that point: a logging failure inside
 * `Jetpack_Mu_Wpcom::log2logstash()` is swallowed by that method's own
 * try/catch — we treat "dispatch was attempted" as the meaningful signal.
 *
 * @param array $extra Caller-supplied properties merged with the default payload.
 *                     Caller keys win on collision.
 * @return bool True if the dispatch was attempted; false if short-circuited.
 */
function layout_grid_log_observation( array $extra ) {
	/**
	 * Whether layout-grid usage observations should be dispatched to logstash.
	 * Defaults to true; tests short-circuit this to keep `log2logstash` (and
	 * its HTTP fallback) out of the unit-test environment, and sites that
	 * don't want the telemetry can disable it the same way.
	 *
	 * @param bool  $enabled Whether to dispatch the log event.
	 * @param array $extra   Surface-specific properties for the candidate event.
	 */
	if ( ! (bool) apply_filters( 'layout_grid_log_enabled', true, $extra ) ) {
		return false;
	}
	if ( ! class_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom' ) ) {
		return false;
	}

	$active_plugins_raw = get_option( 'active_plugins' );
	$active_plugins     = is_array( $active_plugins_raw ) ? array_values( $active_plugins_raw ) : array();
	// WoA is multisite-shaped at the platform layer; the platform-managed
	// plugins live in `active_sitewide_plugins`, not `active_plugins`. Without
	// this merge, the most common attribution candidates would be invisible
	// in the payload.
	if ( function_exists( 'is_multisite' ) && is_multisite() && function_exists( 'get_site_option' ) ) {
		$sitewide_raw = get_site_option( 'active_sitewide_plugins' );
		if ( is_array( $sitewide_raw ) && ! empty( $sitewide_raw ) ) {
			$active_plugins = array_values( array_unique( array_merge( $active_plugins, array_keys( $sitewide_raw ) ) ) );
		}
	}

	// Caller keys win on collision: `array_merge( defaults, $extra )` makes
	// the caller-supplied `$extra` override same-named default keys, which
	// matches the natural reading of the `$extra` API.
	$payload = array_merge(
		array(
			'active_theme'   => function_exists( 'get_stylesheet' ) ? (string) get_stylesheet() : '',
			'active_plugins' => $active_plugins,
			'is_rest'        => defined( 'REST_REQUEST' ) && REST_REQUEST,
			'is_cli'         => defined( 'WP_CLI' ) && WP_CLI,
			'is_cron'        => defined( 'DOING_CRON' ) && DOING_CRON,
			'is_importing'   => defined( 'WP_IMPORTING' ) && WP_IMPORTING,
			'trace'          => layout_grid_attribute_source(),
		),
		$extra
	);

	\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash(
		LAYOUT_GRID_LOG_FEATURE,
		LAYOUT_GRID_LOG_MESSAGE,
		layout_grid_redact_paths( $payload )
	);
	return true;
}

/**
 * Walk the PHP call stack and return up to 8 `file:line` strings whose `file`
 * lives under `wp-content/plugins/`, `wp-content/themes/`, or
 * `wp-content/mu-plugins/`. Those are the cause candidates; core / pluggable
 * frames are filtered out. `wp_debug_backtrace_summary()` is deliberately not
 * used here — it returns function-call summaries (e.g. `WP_Hook->apply_filters()`)
 * without file paths, so the extension-path filter would yield an empty trace.
 *
 * @return string[]
 */
function layout_grid_attribute_source() {
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace -- Intentional: attribution backtrace for a logstash record.
	$frames    = debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS );
	$self_file = __FILE__;
	$relevant  = array();
	foreach ( $frames as $frame ) {
		$entry = layout_grid_format_attribution_frame( $frame, $self_file );
		if ( null === $entry ) {
			continue;
		}
		$relevant[] = $entry;
		if ( count( $relevant ) >= 8 ) {
			break;
		}
	}
	return $relevant;
}

/**
 * Pure per-frame predicate for `layout_grid_attribute_source()`. Returns
 * `<file>:<line>` when the frame should be kept, or `null` to skip. Extracted
 * so the regex + self-skip behavior can be unit-tested without staging a
 * real PHP call stack.
 *
 * Skip rules, in order:
 *   - Malformed frame (no string `file` field).
 *   - Self-frame (`file === $self_file`) — the tracker's own frames would
 *     otherwise pass the extension-path regex (jetpack-mu-wpcom is loaded
 *     from `wp-content/mu-plugins/`) and crowd out real attribution within
 *     the caller's 8-frame cap.
 *   - File outside `wp-content/(plugins|themes|mu-plugins)/`.
 *
 * @param mixed  $frame     One frame from `debug_backtrace()`.
 * @param string $self_file Path to compare against for the self-skip.
 * @return string|null
 */
function layout_grid_format_attribution_frame( $frame, string $self_file ) {
	if ( ! is_array( $frame ) || empty( $frame['file'] ) || ! is_string( $frame['file'] ) ) {
		return null;
	}
	if ( $frame['file'] === $self_file ) {
		return null;
	}
	if ( ! preg_match( '#/wp-content/(plugins|themes|mu-plugins)/#', $frame['file'] ) ) {
		return null;
	}
	$line = isset( $frame['line'] ) ? (int) $frame['line'] : 0;
	return $frame['file'] . ':' . $line;
}

/**
 * Strip ABSPATH / WP_CONTENT_DIR prefixes from any string values in the
 * payload so log lines don't leak the install layout. Mirrors the
 * `pcg_log_redact_paths` helper in the Plugin Conflicts Guardian feature.
 *
 * @param mixed $value Scalar or array.
 * @return mixed
 */
function layout_grid_redact_paths( $value ) {
	if ( is_array( $value ) ) {
		return array_map( 'layout_grid_redact_paths', $value );
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
