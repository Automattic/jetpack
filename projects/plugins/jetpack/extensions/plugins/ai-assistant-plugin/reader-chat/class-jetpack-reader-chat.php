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
use Automattic\Jetpack\Search\Plan;
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
	// Keep these limits in sync with Search\REST_Controller.
	private const BRAND_FONT_FAMILIES = array( 'site', 'rounded', 'serif' );
	private const BRAND_FONT_SIZE_MIN = 13;
	private const BRAND_FONT_SIZE_MAX = 18;

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		// Register the setting unconditionally so the Search REST endpoint can
		// flip it even when the feature is currently disabled.
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

		/**
		 * Filter whether Reader Chat should hook its public frontend loader.
		 *
		 * @since 15.9
		 *
		 * @param bool $enabled Whether the reader chat frontend loader should be hooked.
		 */
		if ( ! apply_filters( 'jetpack_reader_chat_enqueue_enabled', true ) ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( __CLASS__, 'render_mount_div' ) );
	}

	/**
	 * Register the Reader Chat options so Search settings can read and write them.
	 *
	 * @since 15.9
	 *
	 * @return void
	 */
	public static function register_settings(): void {
		register_setting(
			'general',
			'reader_chat',
			array(
				'type'              => 'boolean',
				'description'       => __( 'Whether Site Chat is enabled on this site.', 'jetpack' ),
				'sanitize_callback' => 'rest_sanitize_boolean',
				'default'           => false,
			)
		);

		register_setting(
			'general',
			'reader_chat_brand',
			array(
				'type'              => 'array',
				'description'       => __( 'Site Chat brand overrides for this site.', 'jetpack' ),
				'sanitize_callback' => array( __CLASS__, 'sanitize_brand_option' ),
				'default'           => array(
					'name'       => '',
					'accent'     => '',
					'greeting'   => '',
					'help'       => '',
					'background' => '',
					'text'       => '',
					'outline'    => '',
					'fontFamily' => '',
					'fontSize'   => 0,
				),
			)
		);
	}

	/**
	 * Sanitize Reader Chat brand overrides before they are stored.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $value Brand option value.
	 * @return array Sanitized brand overrides.
	 */
	public static function sanitize_brand_option( $value ): array {
		$value = is_array( $value ) ? $value : array();

		return array(
			'name'       => self::sanitize_brand_text( $value['name'] ?? '', 40 ),
			'accent'     => self::sanitize_brand_color( $value['accent'] ?? '' ),
			'greeting'   => self::sanitize_brand_text( $value['greeting'] ?? '', 120 ),
			'help'       => self::sanitize_brand_text( $value['help'] ?? '', 160 ),
			'background' => self::sanitize_brand_color( $value['background'] ?? '' ),
			'text'       => self::sanitize_brand_color( $value['text'] ?? '' ),
			'outline'    => self::sanitize_brand_color( $value['outline'] ?? '' ),
			'fontFamily' => self::sanitize_brand_font_family( $value['fontFamily'] ?? '' ),
			'fontSize'   => self::sanitize_brand_font_size( $value['fontSize'] ?? 0 ),
		);
	}

	/**
	 * Resolve Reader Chat's public brand configuration.
	 *
	 * Stored overrides win per field. Empty or invalid overrides fall back to
	 * values derived from the current site and theme. Keys without a value are
	 * omitted so the client can retain its existing fallback behavior. The
	 * Calypso Reader Chat bootstrap consumes these keys as readerBrand.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Resolved Reader Chat brand.
	 */
	public static function get_brand(): array {
		$stored_brand = get_option( 'reader_chat_brand', array() );
		$stored_brand = is_array( $stored_brand ) ? $stored_brand : array();
		$brand        = array();

		$name = self::sanitize_brand_text( $stored_brand['name'] ?? '', 40 );
		if ( '' === $name ) {
			$name = self::sanitize_brand_text( get_bloginfo( 'name' ), 40 );
		}
		if ( '' !== $name ) {
			$brand['name'] = $name;
		}

		$accent = isset( $stored_brand['accent'] ) && is_string( $stored_brand['accent'] )
			? sanitize_hex_color( $stored_brand['accent'] )
			: null;
		if ( ! $accent ) {
			$accent = self::get_palette_accent( self::get_theme_palette_settings() );
		}
		if ( $accent ) {
			$brand['accent']           = $accent;
			$brand['accentForeground'] = self::get_accent_foreground( $accent );
		}

		$logo_url = get_site_icon_url( 96 );
		$logo_url = is_string( $logo_url ) ? esc_url_raw( $logo_url ) : '';
		if ( $logo_url ) {
			$brand['logoUrl'] = $logo_url;
		}

		$greeting = self::sanitize_brand_text( $stored_brand['greeting'] ?? '', 120 );
		if ( '' === $greeting ) {
			$greeting = null !== self::get_current_post_context()
				? 'Ask me anything about this post.'
				: 'Ask me anything about this blog.';
		}
		$brand['greeting'] = $greeting;

		$help = self::sanitize_brand_text( $stored_brand['help'] ?? '', 160 );
		if ( '' !== $help ) {
			$brand['help'] = $help;
		}

		foreach ( array( 'background', 'text', 'outline' ) as $color_field ) {
			$color = self::sanitize_brand_color( $stored_brand[ $color_field ] ?? '' );
			if ( '' !== $color ) {
				$brand[ $color_field ] = $color;
			}
		}

		$font_family = self::sanitize_brand_font_family( $stored_brand['fontFamily'] ?? '' );
		if ( '' !== $font_family ) {
			$brand['fontFamily'] = $font_family;
		}

		$font_size = self::sanitize_brand_font_size( $stored_brand['fontSize'] ?? 0 );
		if ( 0 !== $font_size ) {
			$brand['fontSize'] = $font_size;
		}

		return $brand;
	}

	/**
	 * Get the theme and custom palette entries available to the settings UI.
	 *
	 * Core's default palette is intentionally excluded.
	 *
	 * @since $$next-version$$
	 *
	 * @return array Theme and custom color entries.
	 */
	public static function get_brand_palette(): array {
		$palette_settings = self::get_theme_palette_settings();
		$colors           = array();

		foreach ( array( 'theme', 'custom' ) as $origin ) {
			if ( empty( $palette_settings[ $origin ] ) || ! is_array( $palette_settings[ $origin ] ) ) {
				continue;
			}

			foreach ( $palette_settings[ $origin ] as $color ) {
				if ( ! is_array( $color ) || empty( $color['color'] ) || ! is_string( $color['color'] ) ) {
					continue;
				}

				$hex = sanitize_hex_color( $color['color'] );
				if ( ! $hex ) {
					continue;
				}

				$slug = isset( $color['slug'] ) && is_string( $color['slug'] )
					? sanitize_key( $color['slug'] )
					: '';
				$name = self::sanitize_brand_text( $color['name'] ?? '', 80 );
				if ( '' === $name ) {
					$name = '' !== $slug ? $slug : $hex;
				}
				$colors[] = array(
					'name'  => $name,
					'slug'  => $slug,
					'color' => $hex,
				);
			}
		}

		return $colors;
	}

	/**
	 * Add Reader Chat's settings to Jetpack Sync's option whitelist.
	 *
	 * Atomic and Jurassic Ninja sites write Reader Chat settings locally via
	 * Search settings, while the wpcom-hosted agent reads the wpcom-side option
	 * before serving public chat requests. Syncing the option keeps
	 * the local toggle and agent permission gate aligned.
	 *
	 * @since 15.9
	 *
	 * @param array $options Option names allowed to sync.
	 * @return array Updated option names.
	 */
	public static function add_sync_options_whitelist( array $options ): array {
		$options[] = 'reader_chat';
		$options[] = 'reader_chat_brand';
		return array_values( array_unique( $options ) );
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

		if ( self::is_site_coming_soon_or_unlaunched() ) {
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

		if ( ! self::has_search_plan_access() ) {
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
	 * Check whether the current site is Coming Soon or unlaunched.
	 *
	 * Reader Chat is a public frontend widget, so it should not mount on sites
	 * that are still hidden behind launch or Coming Soon visibility.
	 *
	 * @return bool Whether the site is hidden by launch or Coming Soon visibility.
	 */
	private static function is_site_coming_soon_or_unlaunched(): bool {
		$status = new Status();
		if ( $status->is_coming_soon() ) {
			return true;
		}

		return 'unlaunched' === get_option( 'launch-status' );
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
			'brand'     => self::get_brand(),
		);

		$current_post = self::get_current_post_context();
		if ( null !== $current_post ) {
			$config['currentPost'] = $current_post;
		}

		return $config;
	}

	/**
	 * Sanitize and truncate a Reader Chat text field.
	 *
	 * @param mixed $value      Field value.
	 * @param int   $max_length Maximum character count.
	 * @return string Sanitized value.
	 */
	private static function sanitize_brand_text( $value, int $max_length ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$value = sanitize_text_field( $value );

		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $value, 0, $max_length );
		}

		return substr( $value, 0, $max_length );
	}

	/**
	 * Sanitize a Reader Chat color override.
	 *
	 * @param mixed $value Color value.
	 * @return string Sanitized hex color, or an empty string.
	 */
	private static function sanitize_brand_color( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$color = sanitize_hex_color( $value );

		return $color ? $color : '';
	}

	/**
	 * Sanitize a Reader Chat font-family preset.
	 *
	 * @param mixed $value Font-family preset.
	 * @return string Sanitized preset, or an empty string for the default.
	 */
	private static function sanitize_brand_font_family( $value ): string {
		return is_string( $value ) && in_array( $value, self::BRAND_FONT_FAMILIES, true )
			? $value
			: '';
	}

	/**
	 * Sanitize a Reader Chat base font size.
	 *
	 * @param mixed $value Font size in pixels.
	 * @return int Sanitized size, or zero for the default.
	 */
	private static function sanitize_brand_font_size( $value ): int {
		$value = is_numeric( $value ) ? (int) $value : 0;

		return $value >= self::BRAND_FONT_SIZE_MIN && $value <= self::BRAND_FONT_SIZE_MAX
			? $value
			: 0;
	}

	/**
	 * Get the global theme palette settings used for brand derivation.
	 *
	 * @return array Palette settings grouped by origin.
	 */
	private static function get_theme_palette_settings(): array {
		if ( ! function_exists( 'wp_get_global_settings' ) ) {
			return array();
		}

		$palette_settings = wp_get_global_settings( array( 'color', 'palette' ) );

		return is_array( $palette_settings ) ? $palette_settings : array();
	}

	/**
	 * Resolve an accent from theme-authored palette origins.
	 *
	 * The primary slug takes precedence over accent across the theme and
	 * custom origins. Core's default origin is deliberately ignored.
	 *
	 * @param array $palette_settings Palette settings grouped by origin.
	 * @return string|null Resolved accent, or null when none is available.
	 */
	private static function get_palette_accent( array $palette_settings ): ?string {
		foreach ( array( 'primary', 'accent' ) as $target_slug ) {
			foreach ( array( 'theme', 'custom' ) as $origin ) {
				if ( empty( $palette_settings[ $origin ] ) || ! is_array( $palette_settings[ $origin ] ) ) {
					continue;
				}

				foreach ( $palette_settings[ $origin ] as $color ) {
					if (
						! is_array( $color )
						|| ! isset( $color['slug'] )
						|| ! isset( $color['color'] )
						|| $target_slug !== $color['slug']
						|| ! is_string( $color['color'] )
					) {
						continue;
					}

					$accent = sanitize_hex_color( $color['color'] );
					if ( $accent ) {
						return $accent;
					}
				}
			}
		}

		return null;
	}

	/**
	 * Select the black or white foreground with the higher WCAG contrast.
	 *
	 * @param string $accent Sanitized hexadecimal accent color.
	 * @return string Foreground hexadecimal color.
	 */
	private static function get_accent_foreground( string $accent ): string {
		$hex = ltrim( $accent, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		$channels = array(
			hexdec( substr( $hex, 0, 2 ) ) / 255,
			hexdec( substr( $hex, 2, 2 ) ) / 255,
			hexdec( substr( $hex, 4, 2 ) ) / 255,
		);
		$channels = array_map(
			static function ( $channel ) {
				return $channel <= 0.04045
					? $channel / 12.92
					: ( ( $channel + 0.055 ) / 1.055 ) ** 2.4;
			},
			$channels
		);

		$luminance      = 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
		$white_contrast = 1.05 / ( $luminance + 0.05 );
		$black_contrast = ( $luminance + 0.05 ) / 0.05;

		return $black_contrast > $white_contrast ? '#000000' : '#ffffff';
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
	 * Check whether the current site can serve Reader Chat under its Search plan.
	 *
	 * Uses WordPress.com's local Search plan source on Simple sites. Elsewhere,
	 * uses the cached Jetpack Search plan option instead of forcing a remote
	 * refresh on public frontend requests.
	 *
	 * @return bool
	 */
	private static function has_search_plan_access(): bool {
		$plan_access = apply_filters( 'jetpack_reader_chat_has_search_plan_access', null );
		if ( null !== $plan_access ) {
			return (bool) $plan_access;
		}

		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			$blog_id = get_current_blog_id();
			if ( $blog_id <= 0 ) {
				return false;
			}

			if ( function_exists( 'require_lib' ) ) {
				require_lib( 'jetpack-search' );
			}

			$wpcom_plan_info_class = '\Jetpack\Search\Plan_Info';
			if ( class_exists( $wpcom_plan_info_class ) ) {
				$plan_info = new $wpcom_plan_info_class( $blog_id );
				return $plan_info->supports_search() && ! $plan_info->is_disabled_due_to_overage();
			}
		}

		if ( ! class_exists( Plan::class ) ) {
			return false;
		}

		$plan_info = get_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		if ( ! is_array( $plan_info ) ) {
			return false;
		}

		return ! empty( $plan_info['supports_search'] )
			&& empty( $plan_info['plan_usage']['must_upgrade'] );
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
