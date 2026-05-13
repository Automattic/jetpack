<?php
/**
 * Jetpack Reader Chat — Agents Manager CDN loader for blog readers.
 *
 * Loads a self-contained reader-chat bundle from the widgets.wp.com CDN
 * and renders a floating chat UI on singular posts for logged-out visitors.
 *
 * The reader-chat bundle inlines all WP dependencies (built without
 * DependencyExtractionWebpackPlugin) so it works on the frontend
 * without WordPress's script loader.
 *
 * Enable via filter:
 *   add_filter( 'jetpack_reader_chat_enabled', '__return_true' );
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

const READER_CHAT_JS_URL                  = 'https://widgets.wp.com/agents-manager/reader-chat.min.js';
const READER_CHAT_ASSET_TRANSIENT         = 'jetpack_reader_chat_asset';
const READER_CHAT_ASSET_FAILURE_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

/**
 * Handles loading the reader chat UI on the frontend.
 */
class Jetpack_Reader_Chat {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		// Register the setting unconditionally so the REST API can flip it even
		// when the feature is currently disabled.
		add_action( 'init', array( __CLASS__, 'register_settings' ) );
		add_filter( 'jetpack_sync_options_whitelist', array( __CLASS__, 'add_sync_options_whitelist' ) );

		/**
		 * Filter to enable or disable the Jetpack Reader Chat feature.
		 *
		 * Defaults to the value of the reader_chat site option (false when
		 * unset). Override programmatically with:
		 *   add_filter( 'jetpack_reader_chat_enabled', '__return_true' );
		 *
		 * @since 15.9
		 *
		 * @param bool $enabled Whether the reader chat is enabled.
		 */
		if ( ! apply_filters( 'jetpack_reader_chat_enabled', (bool) get_option( 'reader_chat', false ) ) ) {
			return;
		}

		// Rollout gate: only serve the widget to Automatticians for now.
		// The opt-in + orchestrator agents are still being validated
		// end-to-end; showing the widget to arbitrary visitors would
		// produce a 403 from the (also staff-only) reader-chat agent.
		// Falls back to the proxied-request check when is_automattician
		// isn't available (non-wpcom hosts). Filterable for dev overrides.
		if ( ! apply_filters( 'jetpack_reader_chat_enqueue_enabled', self::current_user_is_staff() ) ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( __CLASS__, 'render_mount_div' ) );
	}

	/**
	 * Register the reader_chat option so it is readable and writable
	 * via the /wp/v2/settings REST endpoint. Requires manage_options.
	 *
	 * Gated to proxied Automattic requests during the rollout so regular
	 * site owners (and even non-proxied staff on JN / localhost) do not
	 * see an unfinished toggle. The admin UI in the Jetpack Search
	 * dashboard also checks for the setting's presence before rendering.
	 *
	 * @since 15.9
	 *
	 * @return void
	 */
	public static function register_settings(): void {
		if ( ! self::is_proxied_request() ) {
			return;
		}

		register_setting(
			'general',
			'reader_chat',
			array(
				'type'              => 'boolean',
				'description'       => __( 'Whether Reader Chat is enabled on this site.', 'jetpack' ),
				'sanitize_callback' => 'rest_sanitize_boolean',
				'show_in_rest'      => true,
				'default'           => false,
			)
		);
	}

	/**
	 * Add Reader Chat's setting to Jetpack Sync's option whitelist.
	 *
	 * Atomic and Jurassic Ninja sites write `reader_chat` locally via
	 * /wp/v2/settings, while the wpcom-hosted agent reads the wpcom-side
	 * option before serving public chat requests. Syncing the option keeps
	 * the local toggle and agent permission gate aligned.
	 *
	 * @since 15.9
	 *
	 * @param array $options Option names allowed to sync.
	 * @return array Updated option names.
	 */
	public static function add_sync_options_whitelist( array $options ): array {
		$options[] = 'reader_chat';
		return array_values( array_unique( $options ) );
	}

	/**
	 * Check whether the current request is from an Automattician.
	 *
	 * Uses the wpcom is_automattician() helper when available (wpcom
	 * Simple / Atomic). Falls back to the proxied-request heuristic
	 * on self-hosted Jetpack sites where is_automattician() does not
	 * exist. Returns false for logged-out visitors on wpcom (since
	 * get_current_user_id() is 0 and is_automattician( 0 ) is false).
	 *
	 * IMPORTANT: Only use for feature gating, not for authorization.
	 *
	 * @since 15.9
	 *
	 * @return bool
	 */
	private static function current_user_is_staff(): bool {
		if ( function_exists( 'is_automattician' ) ) {
			return is_automattician( get_current_user_id() );
		}

		return self::is_proxied_request();
	}

	/**
	 * Check whether the current request is coming from a proxied
	 * Automattic context (a12 staff on a sandbox / proxy).
	 *
	 * This is a strict subset of is_dev_mode(): it excludes the
	 * hostname-based matches (localhost, jurassic.ninja, jurassic.tube)
	 * because a non-staff dev on JN should not see the rollout toggle.
	 *
	 * IMPORTANT: Only use for feature gating, not for authorization.
	 *
	 * @since 15.9
	 *
	 * @return bool
	 */
	private static function is_proxied_request(): bool {
		if ( function_exists( 'wpcom_is_proxied_request' ) && wpcom_is_proxied_request() ) {
			return true;
		}

		if (
			( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) && (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) ) ) ||
			( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST )
		) {
			return true;
		}

		if ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST && defined( 'ATOMIC_CLIENT_ID' ) ) {
			switch ( ATOMIC_CLIENT_ID ) {
				case 1:
				case 2:
				case 3: // Pressable
				case 32:
				case 118: // Commerce garden client (ciab)
					return true;
			}
		}

		return false;
	}

	/**
	 * Enqueue the reader chat script on the frontend.
	 *
	 * Loads on every public-facing page (home, archives, pages, singular
	 * posts). Skips admin, feeds, and AJAX to keep the bundle off contexts
	 * where the chat UI doesn't belong. currentPost in the config is only
	 * populated on singular views — stream views get general suggestions.
	 *
	 * @return void
	 */
	public static function enqueue_scripts(): void {
		if ( is_admin() || is_feed() || wp_doing_ajax() ) {
			return;
		}

		/**
		 * Filter to override the AI features check.
		 *
		 * Set to true to load reader chat regardless of Jetpack connection
		 * status, or false to force-disable. Defaults to null, meaning use
		 * the built-in check. Useful for testing on dev sites.
		 *
		 * @param bool|null $override null = use default check, true/false = override.
		 */
		$has_features = apply_filters( 'jetpack_reader_chat_has_ai_features', null );
		if ( ! ( $has_features ?? self::has_ai_features() ) ) {
			return;
		}

		$version = self::get_asset_version();

		// The reader-chat bundle is self-contained — no WP script dependencies.
		wp_enqueue_script(
			'jetpack-reader-chat',
			READER_CHAT_JS_URL,
			array(),
			$version,
			true
		);

		wp_enqueue_style(
			'jetpack-reader-chat',
			'https://widgets.wp.com/agents-manager/reader-chat.css',
			array(),
			$version
		);

		// Inject config for the JS bundle (before the script tag).
		wp_add_inline_script(
			'jetpack-reader-chat',
			'window.JetpackReaderChatConfig = ' . wp_json_encode(
				self::get_reader_chat_config(),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * Render the mount div in the footer.
	 *
	 * Only outputs the div when the script was successfully enqueued.
	 *
	 * @return void
	 */
	public static function render_mount_div(): void {
		if ( ! wp_script_is( 'jetpack-reader-chat' ) ) {
			return;
		}

		echo '<div id="jetpack-reader-chat"></div>';
	}

	/**
	 * Build the config object for the reader chat JS bundle.
	 *
	 * @return array The config array for JSON encoding.
	 */
	private static function get_reader_chat_config(): array {
		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			$site_id = get_current_blog_id();
		} else {
			$site_id = (int) Jetpack_Options::get_option( 'id' );
		}

		$config = array(
			'siteId'    => $site_id,
			'siteUrl'   => home_url(),
			'siteName'  => get_bloginfo( 'name' ),
			'isDevMode' => self::is_dev_mode(),
			'agentId'   => 'reader-chat',
		);

		$current_post = self::get_current_post_context();
		if ( null !== $current_post ) {
			$config['currentPost'] = $current_post;
		}

		return $config;
	}

	/**
	 * Build the current post context for the reader chat config.
	 *
	 * Returns null on non-singular views or when no post is available.
	 *
	 * @return array|null Post context, or null when not on a singular view.
	 */
	private static function get_current_post_context(): ?array {
		if ( ! is_singular() ) {
			return null;
		}

		$post = get_post();
		if ( ! $post ) {
			return null;
		}

		// Only expose current post context for content that is publicly
		// viewable. Draft/private/future/trash posts can be visible to
		// editors through previews, but reader chat is public-facing and
		// should not receive non-public post content in its inline config.
		if ( is_preview() || ! is_post_publicly_viewable( $post ) ) {
			return null;
		}

		// Respect password-protected posts: do not leak body content to
		// visitors who have not entered the password. Omit the whole
		// currentPost envelope so the chat doesn't imply it "knows" the
		// post's content either.
		if ( post_password_required( $post ) ) {
			return null;
		}

		$context = array(
			'id'      => $post->ID,
			'title'   => get_the_title( $post ),
			'url'     => get_permalink( $post ),
			'excerpt' => wp_trim_words( wp_strip_all_tags( $post->post_content ), 120 ),
			'author'  => get_the_author_meta( 'display_name', (int) $post->post_author ),
			'date'    => get_the_date( 'F j, Y', $post ),
		);

		$categories = get_the_category( $post->ID );
		if ( $categories ) {
			$context['categories'] = wp_list_pluck( $categories, 'name' );
		}

		$tags = get_the_tags( $post->ID );
		if ( $tags ) {
			$context['tags'] = wp_list_pluck( $tags, 'name' );
		}

		return $context;
	}

	/**
	 * Get the version string for the CDN bundle.
	 *
	 * Attempts to read the version from the remote asset manifest.
	 * Falls back to a timestamp in dev mode, or null in production.
	 *
	 * @return string|false|null The version string, or null to omit the query param.
	 */
	private static function get_asset_version() {
		$skip_cache = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;

		if ( ! $skip_cache ) {
			$cached = get_transient( READER_CHAT_ASSET_TRANSIENT );
			if ( false !== $cached ) {
				return $cached['version'] ?? null;
			}
		}

		$json_path = 'widgets.wp.com/agents-manager/reader-chat.asset.json';

		// Try local filesystem first (available on WordPress.com).
		$data = self::read_local_asset_json( ABSPATH . $json_path );

		// Fallback to HTTP fetch.
		if ( false === $data ) {
			$data = self::fetch_remote_asset_json( 'https://' . $json_path );
		}

		if ( false === $data ) {
			// Dev mode: return a cache-busting version so the sandbox bundle loads.
			if ( self::is_dev_mode() ) {
				return 'dev-' . time();
			}
			if ( ! $skip_cache ) {
				set_transient(
					READER_CHAT_ASSET_TRANSIENT,
					array(
						'version' => null,
					),
					READER_CHAT_ASSET_FAILURE_CACHE_TTL
				);
			}
			return null;
		}

		if ( ! $skip_cache ) {
			set_transient( READER_CHAT_ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
		}

		return $data['version'] ?? null;
	}

	/**
	 * Read and decode a local asset manifest JSON file.
	 *
	 * @param string $path Absolute filesystem path to the JSON file.
	 * @return array|false Decoded data or false on failure.
	 */
	private static function read_local_asset_json( string $path ) {
		if ( ! file_exists( $path ) ) {
			return false;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local file, not remote URL.
		$contents = file_get_contents( $path );
		if ( false === $contents ) {
			return false;
		}

		return self::decode_asset_json( $contents );
	}

	/**
	 * Fetch and decode a remote asset manifest JSON file.
	 *
	 * @param string $url URL to fetch.
	 * @return array|false Decoded data or false on failure.
	 */
	private static function fetch_remote_asset_json( string $url ) {
		$response = wp_safe_remote_get( $url );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		return self::decode_asset_json( wp_remote_retrieve_body( $response ) );
	}

	/**
	 * Decode a JSON asset manifest string and validate the result is an array.
	 *
	 * @param string $contents Raw JSON string.
	 * @return array|false Decoded array or false on decode failure / non-array.
	 */
	private static function decode_asset_json( string $contents ) {
		$data = json_decode( $contents, true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $data ) ) {
			return false;
		}
		return $data;
	}

	/**
	 * Check whether AI features are available for this site.
	 *
	 * @return bool
	 */
	private static function has_ai_features(): bool {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return true;
		}

		return ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
			&& ! ( new Status() )->is_offline_mode()
			&& apply_filters( 'jetpack_ai_enabled', true );
	}

	/**
	 * Check if the current request is from a development environment.
	 *
	 * Matches the pattern used in Jetpack_AI_Sidebar::is_dev_mode().
	 * IMPORTANT: Only use for feature gating, not authorization.
	 *
	 * @return bool
	 */
	private static function is_dev_mode(): bool {
		$domain = wp_parse_url( get_site_url(), PHP_URL_HOST );
		if ( ! is_string( $domain ) ) {
			return false;
		}

		if (
			'localhost' === $domain ||
			'.jurassic.tube' === stristr( $domain, '.jurassic.tube' ) ||
			'.jurassic.ninja' === stristr( $domain, '.jurassic.ninja' )
		) {
			return true;
		}

		if ( function_exists( 'wpcom_is_proxied_request' ) && wpcom_is_proxied_request() ) {
			return true;
		}

		if (
			( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) && (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) ) ) ||
			( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST )
		) {
			return true;
		}

		if ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST && defined( 'ATOMIC_CLIENT_ID' ) ) {
			switch ( ATOMIC_CLIENT_ID ) {
				case 1:
				case 2:
				case 3: // Pressable
				case 32:
				case 118: // Commerce garden client (ciab)
					return true;
			}
		}

		return false;
	}
}
