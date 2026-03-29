<?php
/**
 * Block Editor - Block Notes plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\BlockNotes;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const FEATURE_NAME            = 'block-notes';
const ASSET_BASE_PATH         = 'widgets.wp.com/agents-manager/';
const ASSET_JS_URL            = 'https://' . ASSET_BASE_PATH . 'block-notes.min.js';
const ASSET_JSON_URL          = 'https://' . ASSET_BASE_PATH . 'block-notes.asset.json';
const ASSET_JSON_PATH         = ASSET_BASE_PATH . 'block-notes.asset.json';
const ASSET_TRANSIENT         = 'jetpack_block_notes_asset';
const HEADLESS_AGENT_PROVIDER = 'block-notes/headless-agent-provider';

/**
 * Check if Block Notes is enabled.
 *
 * Returns true if either the unified chat experience or the
 * jetpack_block_notes_enabled filter is active.
 *
 * @return bool
 */
function is_block_notes_enabled() {
	return apply_filters( 'agents_manager_use_unified_experience', false )
		|| apply_filters( 'jetpack_block_notes_enabled', false );
}

/**
 * Check if the current screen is the post editor for a 'post' post type.
 *
 * Block Notes is only for the post editor (not site editor, pages, or other contexts).
 *
 * @return bool
 */
function is_post_editor() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return $screen
		&& $screen->is_block_editor()
		&& 'post' === $screen->base
		&& 'post' === $screen->post_type;
}

/**
 * Determine if Block Notes should load on the current screen.
 *
 * @return bool
 */
function should_load_on_current_screen() {
	return is_post_editor();
}

/**
 * Register the Block Notes plugin.
 *
 * Registers unconditionally when either filter is true. Screen-level gating
 * happens at enqueue time since get_current_screen() is not available here.
 *
 * @return void
 */
function register_plugin() {
	if ( ! is_block_notes_enabled() ) {
		return;
	}

	\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

/**
 * Fetch and cache the remote asset manifest.
 *
 * On WordPress.com, the asset file may be accessible on the local filesystem
 * (under ABSPATH). This avoids an HTTP round-trip and works on sandboxes where
 * outbound requests to widgets.wp.com may be blocked.
 *
 * @return array|false The decoded asset data, or false on failure.
 */
function get_asset_data() {
	$cached = get_transient( ASSET_TRANSIENT );
	if ( false !== $cached ) {
		return $cached;
	}

	$data = get_asset_data_from_file();
	if ( false === $data ) {
		$data = get_asset_data_from_remote();
	}

	if ( false === $data ) {
		return false;
	}

	if ( ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ) {
		set_transient( ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
	}
	return $data;
}

/**
 * Try to read the asset manifest from the local filesystem.
 *
 * On WordPress.com, widgets.wp.com assets are available at ABSPATH.
 *
 * @return array|false The decoded asset data, or false if not available locally.
 */
function get_asset_data_from_file() {
	$local_path = ABSPATH . ASSET_JSON_PATH;
	if ( ! file_exists( $local_path ) ) {
		return false;
	}

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a local file, not a remote URL.
	$contents = file_get_contents( $local_path );
	if ( false === $contents ) {
		return false;
	}

	$data = json_decode( $contents, true );
	if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
		return false;
	}

	return $data;
}

/**
 * Fetch the asset manifest via HTTP.
 *
 * Used as a fallback when the file is not available locally (e.g. self-hosted sites).
 *
 * @return array|false The decoded asset data, or false on failure.
 */
function get_asset_data_from_remote() {
	$response = wp_safe_remote_get( ASSET_JSON_URL );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return false;
	}

	$content_type = wp_remote_retrieve_header( $response, 'content-type' );
	if ( is_string( $content_type ) && false === stripos( $content_type, 'json' ) ) {
		return false;
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );
	if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
		return false;
	}

	return $data;
}

/**
 * Enqueue Block Notes script asset.
 *
 * @return void
 */
function do_enqueue_assets() {
	if ( ! is_block_notes_enabled() ) {
		return;
	}

	$asset_data = get_asset_data();
	if ( ! $asset_data ) {
		return;
	}

	$version      = $asset_data['version'] ?? false;
	$dependencies = $asset_data['dependencies'] ?? array();

	wp_enqueue_script(
		FEATURE_NAME,
		ASSET_JS_URL,
		$dependencies,
		$version,
		true
	);

	wp_add_inline_script(
		FEATURE_NAME,
		'if ( typeof window.blockNotesData === "undefined" ) { window.blockNotesData = ' . wp_json_encode( array( 'enabled' => true ), JSON_HEX_TAG | JSON_HEX_AMP ) . '; }',
		'before'
	);
}

/**
 * Enqueue Block Notes assets in the post editor.
 *
 * Only loads when should_load_on_current_screen() returns true.
 *
 * @return void
 */
function enqueue_block_notes() {
	if ( ! should_load_on_current_screen() ) {
		return;
	}

	do_enqueue_assets();
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_notes' );

/**
 * Enable the agents manager unified experience on self-hosted sites
 * when jetpack_block_notes_enabled is true.
 *
 * This ensures the agents manager loads and can host the headless agent
 * even when the unified chat experience is not otherwise enabled.
 *
 * @param bool $use_unified_experience Current value of the filter.
 * @return bool
 */
function enable_agents_manager_for_block_notes( $use_unified_experience ) {
	if ( $use_unified_experience ) {
		return true;
	}

	return (bool) apply_filters( 'jetpack_block_notes_enabled', false );
}
add_filter( 'agents_manager_use_unified_experience', __NAMESPACE__ . '\enable_agents_manager_for_block_notes' );

/**
 * Register the Block Notes headless agent provider with the agents manager.
 *
 * When Block Notes is enabled, adds the Block Notes headless
 * agent provider module so the agents manager can load it.
 *
 * @param array $providers Existing agent provider module IDs.
 * @return array Modified array of provider module IDs.
 */
function register_headless_agent_provider( $providers ) {
	if ( ! is_block_notes_enabled() ) {
		return $providers;
	}

	$providers[] = HEADLESS_AGENT_PROVIDER;
	return $providers;
}
add_filter( 'agents_manager_agent_providers', __NAMESPACE__ . '\register_headless_agent_provider' );

/**
 * Register Block Notes meta fields and filters.
 *
 * Registers the comment meta field used to track AI processing, and hooks
 * the avatar filter for AI-authored notes.
 *
 * @return void
 */
function register_meta_fields() {
	if ( ! is_block_notes_enabled() ) {
		return;
	}

	register_meta(
		'comment',
		'bigsky_ai_processed_date',
		array(
			'type'              => 'string',
			'description'       => 'ISO date when this note was processed by AI (empty if not processed)',
			'single'            => true,
			'show_in_rest'      => true,
			'auth_callback'     => __NAMESPACE__ . '\meta_auth_callback',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	add_filter( 'get_avatar_data', __NAMESPACE__ . '\customize_ai_avatar', 10, 2 );
}
add_action( 'init', __NAMESPACE__ . '\register_meta_fields' );

/**
 * Authorization callback for the bigsky_ai_processed_date comment meta.
 *
 * @return bool
 */
function meta_auth_callback() {
	return current_user_can( 'edit_posts' );
}

/**
 * Customize the avatar for AI-authored block notes.
 *
 * @param array $args         Avatar data arguments.
 * @param mixed $id_or_email  The Gravatar to retrieve.
 * @return array Modified avatar arguments.
 */
function customize_ai_avatar( $args, $id_or_email ) {
	if ( is_object( $id_or_email ) && isset( $id_or_email->comment_author ) ) {
		if ( 'AI [experimental]' === $id_or_email->comment_author ) {
			$args['url'] = plugins_url( 'images/big-sky.svg', JETPACK__PLUGIN_FILE );
		}
	}
	return $args;
}

/**
 * Debug: Output Block Notes diagnostic info to the browser console.
 *
 * Temporary — remove before merging to trunk.
 */
function debug_block_notes_status() {
	if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$debug = array();

	// --- Section 1: Filter values ---
	$unified_filter = apply_filters( 'agents_manager_use_unified_experience', false );
	$bn_filter      = apply_filters( 'jetpack_block_notes_enabled', false );
	$enabled        = is_block_notes_enabled();

	$debug['=== 1. ENABLEMENT FLAGS ===']                  = '';
	$debug['agents_manager_use_unified_experience filter']  = $unified_filter;
	$debug['jetpack_block_notes_enabled filter']            = $bn_filter;
	$debug['is_block_notes_enabled() result']               = $enabled;

	// --- Section 2: Filter hooks registered ---
	global $wp_filter;
	$unified_hooks = array();
	if ( isset( $wp_filter['agents_manager_use_unified_experience'] ) ) {
		foreach ( $wp_filter['agents_manager_use_unified_experience']->callbacks as $priority => $callbacks ) {
			foreach ( $callbacks as $id => $callback ) {
				$name = '';
				if ( is_string( $callback['function'] ) ) {
					$name = $callback['function'];
				} elseif ( is_array( $callback['function'] ) ) {
					$name = ( is_object( $callback['function'][0] ) ? get_class( $callback['function'][0] ) : $callback['function'][0] ) . '::' . $callback['function'][1];
				} elseif ( $callback['function'] instanceof \Closure ) {
					$name = '{closure}';
				}
				$unified_hooks[] = "priority $priority: $name";
			}
		}
	}
	$bn_hooks = array();
	if ( isset( $wp_filter['jetpack_block_notes_enabled'] ) ) {
		foreach ( $wp_filter['jetpack_block_notes_enabled']->callbacks as $priority => $callbacks ) {
			foreach ( $callbacks as $id => $callback ) {
				$name = '';
				if ( is_string( $callback['function'] ) ) {
					$name = $callback['function'];
				} elseif ( is_array( $callback['function'] ) ) {
					$name = ( is_object( $callback['function'][0] ) ? get_class( $callback['function'][0] ) : $callback['function'][0] ) . '::' . $callback['function'][1];
				} elseif ( $callback['function'] instanceof \Closure ) {
					$name = '{closure}';
				}
				$bn_hooks[] = "priority $priority: $name";
			}
		}
	}

	$debug['=== 2. REGISTERED FILTER CALLBACKS ===']              = '';
	$debug['agents_manager_use_unified_experience callbacks']     = ! empty( $unified_hooks ) ? implode( ' | ', $unified_hooks ) : 'NONE';
	$debug['jetpack_block_notes_enabled callbacks']               = ! empty( $bn_hooks ) ? implode( ' | ', $bn_hooks ) : 'NONE';

	// --- Section 3: Agents Manager class ---
	$debug['=== 3. AGENTS MANAGER ===']      = '';
	$am_class                                 = 'Automattic\\Jetpack\\Agents_Manager\\Agents_Manager';
	$debug['Agents_Manager class exists']     = class_exists( $am_class );
	$debug['jetpack-mu-wpcom active']         = defined( 'JETPACK_MU_WPCOM_VERSION' ) ? JETPACK_MU_WPCOM_VERSION : false;

	if ( class_exists( $am_class ) && method_exists( $am_class, 'is_dev_mode' ) ) {
		// is_dev_mode is private, use reflection to read it.
		try {
			$reflection = new \ReflectionMethod( $am_class, 'is_dev_mode' );
			$reflection->setAccessible( true );
			$debug['Agents_Manager::is_dev_mode()'] = $reflection->invoke( null );
		} catch ( \Exception $e ) {
			$debug['Agents_Manager::is_dev_mode()'] = 'reflection failed: ' . $e->getMessage();
		}
	} else {
		$debug['Agents_Manager::is_dev_mode()'] = 'class/method not found';
	}

	// --- Section 4: Site & user environment ---
	$domain = wp_parse_url( get_site_url(), PHP_URL_HOST );

	$debug['=== 4. SITE & USER ENVIRONMENT ==='] = '';
	$debug['site_url']                            = get_site_url();
	$debug['domain']                              = $domain;
	$debug['is_localhost']                        = 'localhost' === $domain;
	$debug['is_jurassic']                         = ( false !== stristr( $domain, '.jurassic.tube' ) || false !== stristr( $domain, '.jurassic.ninja' ) );
	$debug['AT_PROXIED_REQUEST defined']          = defined( 'AT_PROXIED_REQUEST' ) ? AT_PROXIED_REQUEST : 'not defined';
	$debug['ATOMIC_CLIENT_ID defined']            = defined( 'ATOMIC_CLIENT_ID' ) ? ATOMIC_CLIENT_ID : 'not defined';
	$debug['current_user_id']                     = get_current_user_id();
	$debug['SCRIPT_DEBUG']                        = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
	$debug['WP_DEBUG']                            = defined( 'WP_DEBUG' ) && WP_DEBUG;

	// --- Section 5: Jetpack connection ---
	$debug['=== 5. JETPACK CONNECTION ==='] = '';
	if ( class_exists( 'Jetpack' ) ) {
		$debug['Jetpack::is_connection_ready()'] = \Jetpack::is_connection_ready();
		$debug['Jetpack::is_active()']           = \Jetpack::is_active();
	} else {
		$debug['Jetpack class'] = 'not loaded';
	}
	if ( class_exists( 'Automattic\\Jetpack\\Connection\\Manager' ) ) {
		$connection                            = new \Automattic\Jetpack\Connection\Manager();
		$debug['connection->has_connected_owner()'] = $connection->has_connected_owner();
		$debug['connection->is_user_connected()']   = $connection->is_user_connected();
	}

	// --- Section 6: Screen info ---
	$screen      = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	$screen_base = $screen ? $screen->base : 'N/A';
	$screen_post = $screen ? $screen->post_type : 'N/A';
	$is_block_ed = $screen && $screen->is_block_editor();
	$screen_ok   = should_load_on_current_screen();

	$debug['=== 6. SCREEN CHECK ===']       = '';
	$debug['screen.base']                    = $screen_base;
	$debug['screen.post_type']               = $screen_post;
	$debug['screen.is_block_editor()']       = $is_block_ed;
	$debug['should_load_on_current_screen()'] = $screen_ok;

	// --- Section 7: Asset loading ---
	$transient_value = get_transient( ASSET_TRANSIENT );
	$local_path      = ABSPATH . ASSET_JSON_PATH;
	$local_exists    = file_exists( $local_path );

	$debug['=== 7. ASSET LOADING ===']  = '';
	$debug['ASSET_JSON_URL']             = ASSET_JSON_URL;
	$debug['ASSET_JSON_PATH (local)']    = $local_path;
	$debug['local file exists']          = $local_exists;
	$debug['transient cached']           = false !== $transient_value;

	if ( false !== $transient_value ) {
		$debug['asset source']       = 'transient cache';
		$debug['asset version']      = $transient_value['version'] ?? 'missing';
		$debug['asset dependencies'] = isset( $transient_value['dependencies'] ) ? implode( ', ', $transient_value['dependencies'] ) : 'none';
	} else {
		// Try the remote fetch and report full details.
		$response = wp_safe_remote_get( ASSET_JSON_URL );
		if ( is_wp_error( $response ) ) {
			$debug['remote fetch'] = 'WP_Error: ' . $response->get_error_message();
		} else {
			$status       = wp_remote_retrieve_response_code( $response );
			$content_type = wp_remote_retrieve_header( $response, 'content-type' );
			$body         = wp_remote_retrieve_body( $response );

			$debug['remote HTTP status']       = $status;
			$debug['remote content-type']      = $content_type;
			$debug['remote body (first 500)']  = substr( $body, 0, 500 );

			if ( 200 === $status ) {
				$data = json_decode( $body, true );
				if ( json_last_error() !== JSON_ERROR_NONE ) {
					$debug['remote JSON parse'] = 'FAILED: ' . json_last_error_msg();
				} else {
					$debug['remote asset version']      = $data['version'] ?? 'missing';
					$debug['remote asset dependencies'] = isset( $data['dependencies'] ) ? implode( ', ', $data['dependencies'] ) : 'none';
				}
			}
		}
	}

	// --- Section 8: Extension availability ---
	$debug['=== 8. JETPACK EXTENSION STATUS ==='] = '';
	if ( class_exists( 'Jetpack_Gutenberg' ) ) {
		$availability = \Jetpack_Gutenberg::get_extension_availability();
		if ( isset( $availability[ FEATURE_NAME ] ) ) {
			$debug['block-notes extension'] = $availability[ FEATURE_NAME ];
		} else {
			$debug['block-notes extension'] = 'NOT REGISTERED';
		}
	}

	// --- Section 9: Was the script actually enqueued? ---
	$debug['=== 9. ENQUEUE STATUS ===']      = '';
	$debug['script enqueued (block-notes)']   = wp_script_is( FEATURE_NAME, 'enqueued' );
	$debug['script registered (block-notes)'] = wp_script_is( FEATURE_NAME, 'registered' );

	// --- Output ---
	$js_data = wp_json_encode( $debug, JSON_PRETTY_PRINT | JSON_HEX_TAG | JSON_HEX_AMP );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Temporary debug script, admin-only, will be removed.
	echo '<script>
	console.group("%cBlock Notes Debug", "font-weight:bold;font-size:14px;color:#0073aa");
	Object.entries(' . $js_data . ').forEach(([k,v]) => {
		if (v === "") {
			console.log("%c" + k, "font-weight:bold;color:#0073aa;margin-top:4px");
		} else if (v === false) {
			console.log("%c" + k + ": %cfalse", "color:#333", "color:red;font-weight:bold");
		} else if (v === true) {
			console.log("%c" + k + ": %ctrue", "color:#333", "color:green;font-weight:bold");
		} else {
			console.log(k + ":", v);
		}
	});
	console.groupEnd();
	</script>';
}
add_action( 'admin_footer', __NAMESPACE__ . '\debug_block_notes_status' );
