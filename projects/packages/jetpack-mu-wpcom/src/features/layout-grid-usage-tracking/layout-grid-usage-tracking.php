<?php
/**
 * Layout-grid usage tracking — emit a logstash event when a `jetpack/layout-grid`
 * block is inserted or first rendered on a WoA site. The payload carries the
 * active theme, active plugins, request-context flags, an `origin` label that
 * separates an explicit editor insert (the expected, noisy case) from the
 * arrivals we actually want to surface — migration, import, XML-RPC, WP-CLI,
 * cron, a headless REST or AJAX write, a programmatic write with no user behind
 * it, or a theme/template render — and a sanitized backtrace so the source can
 * be attributed to a responsible plugin or theme rather than just the candidate
 * set. Events ship to the `atomic_layout_grid_block` logstash bucket.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare(strict_types=1);

const WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME       = 'jetpack/layout-grid';
const WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION      = 'wpcom_layout_grid_block_seen';
const WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT = 'wpcom_layout_grid_block_import_seen';
const WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT   = 'wpcom_layout_grid_block_cron_seen';
const WPCOM_LAYOUT_GRID_USAGE_LOG_FEATURE      = 'atomic_layout_grid_block';
const WPCOM_LAYOUT_GRID_USAGE_LOG_MESSAGE      = 'layout_grid_block_observed';

/**
 * WoA-only gate. Extracted so tests can require the file without registering hooks.
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
 * `wp_after_insert_post` handler. Editor first-landings log per-event; import
 * and cron contexts are rate-limited to one event per blog per 24h.
 *
 * @param int           $post_id     Post ID.
 * @param mixed         $post        Typed as WP_Post by core; checked defensively.
 * @param bool          $update      Whether this is an update.
 * @param \WP_Post|null $post_before Previous post version (null on insert).
 * @return void
 */
function wpcom_layout_grid_usage_react_to_post_insert( $post_id, $post, $update, $post_before ) {
	unset( $update );
	// Revisions/autosaves are inserted as their own posts, so the
	// `$post_before` check below can't see the parent's prior state.
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( ! $post instanceof \WP_Post ) {
		return;
	}
	// Scan the raw content string so `has_block` doesn't route through
	// `get_post()` and re-fetch a potentially different cache snapshot.
	if ( ! has_block( WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME, (string) $post->post_content ) ) {
		return;
	}
	if ( $post_before instanceof \WP_Post && has_block( WPCOM_LAYOUT_GRID_USAGE_BLOCK_NAME, (string) $post_before->post_content ) ) {
		return;
	}
	$is_importing = defined( 'WP_IMPORTING' ) && WP_IMPORTING;
	$is_cron      = defined( 'DOING_CRON' ) && DOING_CRON;
	if ( ! wpcom_layout_grid_usage_should_log_in_context( $is_importing, $is_cron ) ) {
		return;
	}
	$dispatched = wpcom_layout_grid_usage_log_observation(
		array(
			'surface'   => 'post_insert',
			'post_type' => (string) $post->post_type,
			'origin'    => wpcom_layout_grid_usage_classify_origin(),
		)
	);
	// Burn the 24h budget only after a successful dispatch — otherwise a
	// filter-blocked observation consumes the window with nothing logged.
	if ( $dispatched ) {
		wpcom_layout_grid_usage_mark_context_seen( $is_importing, $is_cron );
	}
}

/**
 * Read-only rate-limit gate. Returns false when the active context's transient
 * is already set. Paired with `wpcom_layout_grid_usage_mark_context_seen()`
 * post-dispatch so a logging failure doesn't burn the 24h budget. Import wins
 * when both flags are set (cron-triggered import).
 *
 * @param bool $is_importing WP_IMPORTING flag.
 * @param bool $is_cron      DOING_CRON flag.
 * @return bool True if the caller should log.
 */
function wpcom_layout_grid_usage_should_log_in_context( $is_importing, $is_cron ) {
	$key = wpcom_layout_grid_usage_context_transient_key( $is_importing, $is_cron );
	if ( null === $key ) {
		return true;
	}
	return ! get_transient( $key );
}

/**
 * Write half of the rate-limit gate. No-op outside import / cron.
 *
 * @param bool $is_importing WP_IMPORTING flag.
 * @param bool $is_cron      DOING_CRON flag.
 * @return void
 */
function wpcom_layout_grid_usage_mark_context_seen( $is_importing, $is_cron ) {
	$key = wpcom_layout_grid_usage_context_transient_key( $is_importing, $is_cron );
	if ( null === $key ) {
		return;
	}
	set_transient( $key, 1, DAY_IN_SECONDS );
}

/**
 * Active rate-limit context's transient key, or null. Import wins.
 *
 * @param bool $is_importing WP_IMPORTING flag.
 * @param bool $is_cron      DOING_CRON flag.
 * @return string|null
 */
function wpcom_layout_grid_usage_context_transient_key( $is_importing, $is_cron ) {
	if ( $is_importing ) {
		return WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT;
	}
	if ( $is_cron ) {
		return WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT;
	}
	return null;
}

/**
 * Classify how an inserted block arrived, so the expected and noisy case — a
 * logged-in user adding the block in the editor — can be told apart from the
 * arrivals worth investigating. Checked in priority order:
 *
 *  - `migration`:    the WoA transfer is mid-flight — the block came over with
 *                    the site. Checked before `import` because migration runs
 *                    also set `WP_IMPORTING`, and "arrived during transfer" is
 *                    the more specific (and, post-conditional-activation, the
 *                    more interesting) answer.
 *  - `import`:       a `WP_IMPORTING` run (an importer plugin, a WXR import).
 *  - `xmlrpc`:       a remote publishing client (legacy apps, some migration
 *                    tools) writing over XML-RPC.
 *  - `cli`:          a WP-CLI invocation.
 *  - `cron`:         a scheduled / background job.
 *  - `editor`:       a logged-in user on an ordinary request — the expected case.
 *  - `rest`:         a REST write with no user behind it — a headless client or
 *                    server-to-server integration rather than the block editor.
 *  - `ajax`:         an admin-ajax write with no user — a front-end handler.
 *  - `programmatic`: none of the above — internal PHP wrote the post on a normal
 *                    request with no HTTP API surface and no user.
 *
 * The batch / transport contexts win over the user check on purpose: an import,
 * cron, or CLI run isn't a person at the editor even when a user happens to be
 * set. The `editor` check sits above `rest`/`ajax` so a normal block-editor save
 * (REST + a logged-in user) reads as `editor`, leaving those two buckets for the
 * no-user writes they're meant to catch. The remaining false negative — a plugin
 * calling `wp_insert_post()` on a normal admin request with a user logged in —
 * reads as `editor`; the `trace` field is the backstop for naming that source.
 * Used for the insert surfaces; the render backstop sets its own `origin` since
 * by render time the context is gone.
 *
 * @return string One of: migration, import, xmlrpc, cli, cron, editor, rest, ajax, programmatic.
 */
function wpcom_layout_grid_usage_classify_origin() {
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcomsh-provided; present on WoA, guarded by function_exists.
	if ( function_exists( 'wpcomsh_is_migration_in_progress' ) && wpcomsh_is_migration_in_progress() ) {
		return 'migration';
	}
	if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
		return 'import';
	}
	if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
		return 'xmlrpc';
	}
	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		return 'cli';
	}
	if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
		return 'cron';
	}
	if ( function_exists( 'get_current_user_id' ) && get_current_user_id() > 0 ) {
		return 'editor';
	}
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return 'rest';
	}
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		return 'ajax';
	}
	return 'programmatic';
}

/**
 * `add_option_widget_block` handler. Logs when the initial value carries the block.
 *
 * @param string $option Unused — pinned by hook name.
 * @param mixed  $value  New option value.
 * @return void
 */
function wpcom_layout_grid_usage_react_to_widget_block_added( $option, $value ) {
	unset( $option );
	if ( ! wpcom_layout_grid_usage_widget_value_contains_block( $value ) ) {
		return;
	}
	wpcom_layout_grid_usage_log_observation(
		array(
			'surface' => 'widget_add',
			'origin'  => wpcom_layout_grid_usage_classify_origin(),
		)
	);
}

/**
 * `update_option_widget_block` handler. Logs first-landings only (new has, old didn't).
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
	wpcom_layout_grid_usage_log_observation(
		array(
			'surface' => 'widget_update',
			'origin'  => wpcom_layout_grid_usage_classify_origin(),
		)
	);
}

/**
 * Render-time backstop. Sentinel-guarded to fire at most once per blog — by
 * render time the stack no longer reaches the cause, so per-pageview repeats
 * add zero attribution value at non-trivial cost. One log per blog still tells
 * us the block came from a theme template, pattern, or direct `$wpdb` write
 * that the post/widget detectors didn't see.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $parsed_block  Unused.
 * @return string Unchanged.
 */
function wpcom_layout_grid_usage_react_to_block_render( $block_content, $parsed_block ) {
	unset( $parsed_block );
	if ( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) ) {
		return $block_content;
	}
	// Persist the sentinel only after a successful dispatch. The option has no
	// TTL, so a filter-blocked observation that wrote it first would
	// permanently disable the backstop for this blog.
	if ( wpcom_layout_grid_usage_log_observation(
		array(
			'surface' => 'render',
			// The block was only ever seen at render, never at insert — it came
			// from a theme template, a pattern, or a direct write, not a user
			// adding it in the editor.
			'origin'  => 'render',
		)
	) ) {
		update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 1, false );
	}
	return $block_content;
}

/**
 * Whether a `widget_block` option value carries the layout-grid block in any
 * widget entry's `content`.
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
 * Dispatch an observation to logstash. Returns true if dispatch was attempted
 * (filter passed and the wrapper class is loaded), false when short-circuited.
 * Callers use the return value to gate sticky side effects (sentinel, context
 * transients) so a blocked dispatch doesn't lock them out. Anything throwing
 * during payload assembly (third-party filter callbacks, option lookups, etc.)
 * or inside `Jetpack_Mu_Wpcom::log2logstash()` is caught and reported as a
 * non-dispatch — telemetry must never escalate into a fatal on the host
 * action chain (post save, front-end render).
 *
 * @param array $extra Caller-supplied payload. Caller keys win on collision.
 * @return bool
 */
function wpcom_layout_grid_usage_log_observation( array $extra ) {
	/**
	 * Whether layout-grid usage observations should be dispatched. Tests
	 * short-circuit this to keep `log2logstash` (and its HTTP fallback) out
	 * of the unit-test environment; sites that don't want telemetry can
	 * disable it the same way.
	 *
	 * @param bool  $enabled
	 * @param array $extra
	 */
	if ( ! (bool) apply_filters( 'wpcom_layout_grid_usage_log_enabled', true, $extra ) ) {
		return false;
	}
	if ( ! class_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom' ) ) {
		return false;
	}

	try {
		$active_plugins_raw = get_option( 'active_plugins' );
		$active_plugins     = is_array( $active_plugins_raw ) ? array_values( $active_plugins_raw ) : array();
		// Union network-activated plugins: WoA is multisite-shaped and the
		// platform's plugins live in `active_sitewide_plugins`.
		if ( function_exists( 'is_multisite' ) && is_multisite() && function_exists( 'get_site_option' ) ) {
			$sitewide_raw = get_site_option( 'active_sitewide_plugins' );
			if ( is_array( $sitewide_raw ) && ! empty( $sitewide_raw ) ) {
				$active_plugins = array_values( array_unique( array_merge( $active_plugins, array_keys( $sitewide_raw ) ) ) );
			}
		}

		// `array_merge( defaults, $extra )`: caller keys win on collision.
		$payload = array_merge(
			array(
				'active_theme'   => function_exists( 'get_stylesheet' ) ? (string) get_stylesheet() : '',
				'active_plugins' => $active_plugins,
				'is_rest'        => defined( 'REST_REQUEST' ) && REST_REQUEST,
				'is_cli'         => defined( 'WP_CLI' ) && WP_CLI,
				'is_cron'        => defined( 'DOING_CRON' ) && DOING_CRON,
				'is_importing'   => defined( 'WP_IMPORTING' ) && WP_IMPORTING,
				'trace'          => wpcom_layout_grid_usage_attribute_source(),
			),
			$extra
		);

		\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash(
			WPCOM_LAYOUT_GRID_USAGE_LOG_FEATURE,
			WPCOM_LAYOUT_GRID_USAGE_LOG_MESSAGE,
			wpcom_layout_grid_usage_redact_paths( $payload )
		);
		return true;
	} catch ( \Throwable $e ) {
		unset( $e );
		return false;
	}
}

/**
 * Walk `debug_backtrace()` and return up to 8 `<file>:<line>` strings for
 * frames under `wp-content/(plugins|themes|mu-plugins)/`. Core / pluggable
 * frames are filtered out. `wp_debug_backtrace_summary()` is deliberately
 * not used: it returns function-call summaries, not file paths.
 *
 * @return string[]
 */
function wpcom_layout_grid_usage_attribute_source() {
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace -- Attribution backtrace for a logstash record.
	$frames    = debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS );
	$self_file = __FILE__;
	$relevant  = array();
	foreach ( $frames as $frame ) {
		$entry = wpcom_layout_grid_usage_format_attribution_frame( $frame, $self_file );
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
 * Per-frame predicate. Returns `<file>:<line>` for kept frames, null to skip.
 * Skips: malformed frames, the tracker's own file (jetpack-mu-wpcom loads
 * from `wp-content/mu-plugins/` and would otherwise dominate the 8-frame cap),
 * and any file outside the three extension directories. Extracted from
 * `wpcom_layout_grid_usage_attribute_source()` for unit-testability.
 *
 * @param mixed  $frame     One frame from `debug_backtrace()`.
 * @param string $self_file Tracker file path for the self-skip comparison.
 * @return string|null
 */
function wpcom_layout_grid_usage_format_attribution_frame( $frame, string $self_file ) {
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
 * Strip ABSPATH / WP_CONTENT_DIR prefixes from string values, recursing into
 * arrays. Mirrors `pcg_log_redact_paths` in Plugin Conflicts Guardian.
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
