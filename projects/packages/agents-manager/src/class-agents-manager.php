<?php
/**
 * Agents manager
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\REST_Jetpack_AI_JWT;
use Automattic\Jetpack\Constants;

/**
 * Class Agents_Manager
 */
class Agents_Manager {
	/**
	 * The package version of the Agents Manager package.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.12.3';

	/**
	 * Class instance.
	 *
	 * @var Agents_Manager
	 */
	private static $instance = null;

	/**
	 * Agents_Manager constructor.
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_filter( 'calypso_preferences_update', array( $this, 'calypso_preferences_update' ) );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 101 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ), 101 );

		add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_nodes' ), 100 );

		Sidebar_Open_Preservation::init();
	}

	/**
	 * Get the SVG icon markup for the AI chat button.
	 *
	 * @return string The SVG markup.
	 */
	private function get_ai_icon() {
		// Not cached: the sparkle icon's aria-label is translated, and the locale can switch mid-request.
		return '<svg class="ab-icon" role="img" aria-label="' . esc_attr__( 'Agent', 'jetpack-agents-manager' ) . '" width="24" height="24" viewBox="-45 -45 490 490" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M391.528 188.061L309.455 159.75C276.997 148.597 251.403 123.003 240.25 90.5451L211.939 8.47185C208.079 -2.82395 191.921 -2.82395 188.061 8.47185L159.75 90.5451C148.597 123.003 123.003 148.597 90.5451 159.75L8.47185 188.061C-2.82395 191.921 -2.82395 208.079 8.47185 211.939L90.5451 240.25C123.003 251.403 148.597 276.997 159.75 309.455L188.061 391.528C191.921 402.824 208.079 402.824 211.939 391.528L240.25 309.455C251.403 276.997 276.997 251.403 309.455 240.25L391.528 211.939C402.824 208.079 402.824 191.921 391.528 188.061ZM295.728 206.077L254.692 220.232C238.391 225.809 225.666 238.677 220.089 254.835L205.934 295.871C203.932 301.591 195.925 301.591 193.923 295.871L179.768 254.835C174.191 238.534 161.323 225.809 145.165 220.232L104.129 206.077C98.4093 204.075 98.4093 196.068 104.129 194.066L145.165 179.911C161.466 174.334 174.191 161.466 179.768 145.308L193.923 104.272C195.925 98.5523 203.932 98.5523 205.934 104.272L220.089 145.308C225.666 161.609 238.534 174.334 254.692 179.911L295.728 194.066C301.448 196.068 301.448 204.075 295.728 206.077Z" />
							</svg>';
	}

	/**
	 * Add the standalone AI chat button to the admin bar.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public function add_ai_chat_button( $wp_admin_bar ) {
		$meta = array(
			'menu_title' => __( 'Agent', 'jetpack-agents-manager' ),
			'icon'       => 'sparkle',
			// The wp-admin bundle mounts the chat into this div.
			'html'       => '<div id="agents-manager-masterbar"></div>',
		);

		// The "Agent" label shows while the chat is hidden (closed or minimized).
		// Pre-hide it when the chat will restore visible; the bundle keeps the
		// class in step afterwards.
		$state = Open_State_Store::get_cached();
		if ( ! empty( $state['agents_manager_open'] ) && empty( $state['agents_manager_minimized'] ) ) {
			$meta['class'] = 'is-chat-visible';
		}

		$wp_admin_bar->add_menu(
			array(
				'id'     => 'agents-manager-ai-chat',
				'parent' => 'top-secondary',
				'title'  => '<span title="' . esc_attr__( 'Agent', 'jetpack-agents-manager' ) . '">' . $this->get_ai_icon() . '</span>'
					. '<span class="agents-manager-ai-chat-label" aria-hidden="true"><span>' . esc_html__( 'Agent', 'jetpack-agents-manager' ) . '</span></span>',
				'meta'   => $meta,
			)
		);
	}

	/**
	 * The Agents Manager context for this request, or null when it should not load.
	 *
	 * Shared by `add_admin_bar_nodes()` and `enqueue_scripts()`.
	 *
	 * @return array{variant: string, disconnected: bool, gutenberg: bool, enabled: bool}|null
	 */
	private function get_active_context() {
		// P2 frontends get neither the admin bar entry points nor the app.
		$stylesheet = get_stylesheet();
		$is_p2      = str_contains( $stylesheet, 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && \WPForTeams\is_wpforteams_site( get_current_blog_id() );

		if ( ! is_admin() && $is_p2 ) {
			return null;
		}

		// Determine which variant to load (null = don't load).
		$variant = self::get_active_variant();
		if ( null === $variant ) {
			return null;
		}

		return array(
			'variant'      => $variant,
			'disconnected' => str_contains( $variant, 'disconnected' ),
			'gutenberg'    => $this->is_block_editor(),
			'enabled'      => self::is_enabled(),
		);
	}

	/**
	 * Add the Agents Manager entry points to the admin bar.
	 *
	 * Hooked unconditionally, with eligibility resolved here rather than at registration, so the
	 * admin-bar REST endpoints — which fire `admin_bar_menu` with no enqueue hook — get the same
	 * nodes as a page load.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public function add_admin_bar_nodes( $wp_admin_bar ) {
		$context = $this->get_active_context();
		if ( null === $context ) {
			return;
		}

		// Gutenberg uses JS when no admin bar is visible and the server-side branch below when one is available.
		if ( ! $context['gutenberg'] ) {
			// Standalone AI chat button, shown whenever the full Agents Manager app is enabled.
			if ( ! $context['disconnected'] && $context['enabled'] ) {
				$this->add_ai_chat_button( $wp_admin_bar );
			}
		}

		// When the block editor exposes the WordPress admin bar, add the entry point there.
		if ( ! $context['disconnected'] && self::is_admin_bar_in_editor() ) {
			if ( $context['enabled'] ) {
				$this->add_ai_chat_button( $wp_admin_bar );
			}
		}
	}

	/**
	 * Enqueue Agents Manager scripts and add inline script data.
	 */
	public function enqueue_scripts() {
		$context = $this->get_active_context();
		if ( null === $context ) {
			return;
		}

		$variant = $context['variant'];

		/**
		 * Filter to register agent provider modules for the Agents Manager.
		 *
		 * Plugins can hook into this filter to register script module IDs that export
		 * toolProvider and/or contextProvider. The Agents Manager JS will dynamically
		 * import these modules and merge their providers.
		 *
		 * @param array $providers Array of provider script module IDs.
		 */
		$agent_providers = apply_filters( 'agents_manager_agent_providers', array() );

		/**
		 * Filter the default agent ID for the Agents Manager.
		 *
		 * Allows host applications (e.g., WooCommerce AI) to specify a custom
		 * workflow agent instead of the default orchestrator. The value is passed to
		 * the frontend as `agentsManagerData.agentId` and consumed by `useAgentConfig()`.
		 *
		 * @param string|null $agent_id The agent ID to use, or null for default behavior.
		 */
		$agent_id = apply_filters( 'agents_manager_agent_id', null );

		$script_version = $this->enqueue_script( $variant );

		$inline_data = array(
			'agentProviders'  => $agent_providers,
			'isDevMode'       => self::is_dev_mode(),
			'isA11n'          => self::is_tracking_automattician(),
			'isWpcomPlatform' => ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_platform(),
			'sectionName'     => apply_filters( 'agents_manager_section_name', $variant ),
			'currentUser'     => $this->get_current_user_data(),
			'site'            => $this->get_current_site(),
		);

		if ( null !== $script_version ) {
			$inline_data['version'] = $variant . ':' . $script_version;
		}

		if ( $agent_id ) {
			$inline_data['agentId'] = $agent_id;
		}

		/**
		 * Filter the data exposed to the Agents Manager frontend.
		 *
		 * @param array $inline_data Data encoded into `agentsManagerData`.
		 */
		$filtered    = apply_filters( 'jetpack_ai_sidebar_agents_manager_data', $inline_data );
		$inline_data = is_array( $filtered ) ? $filtered : $inline_data;

		wp_add_inline_script(
			'agents-manager',
			'const agentsManagerData = ' . wp_json_encode(
				$inline_data,
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * The script variant active for this request, or null if none.
	 *
	 * Single source of truth for "is the Agents Manager app loaded on this
	 * request?". Used both to enqueue the app and to gate the server-side
	 * sidebar pre-render, so the pre-rendered shell can never appear on a page
	 * where the app won't mount to reconcile it.
	 *
	 * @return string|null The variant name, or null if scripts should not be loaded.
	 */
	public static function get_active_variant() {
		if ( self::is_plugin_information_iframe() ) {
			return null;
		}

		/**
		 * Filter the script variant the Agents Manager loads for this request.
		 *
		 * @since 0.1.0
		 *
		 * @param string|null $variant The resolved variant, or null to not load.
		 */
		return apply_filters( 'agents_manager_variant', self::get_variant() );
	}

	/**
	 * Whether the current request renders the plugin information iframe.
	 *
	 * The parent plugin screen may load Agents Manager, but the iframe must not
	 * bootstrap a second copy of the app.
	 *
	 * @return bool
	 */
	private static function is_plugin_information_iframe() {
		global $current_screen;

		if ( ! $current_screen || 'plugin-install' !== $current_screen->id ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a request context check, not a form submission.
		return isset( $_GET['tab'] ) && 'plugin-information' === sanitize_text_field( wp_unslash( $_GET['tab'] ) );
	}

	/**
	 * Determine which script variant to load, or null if none should be loaded.
	 *
	 * Combines the gating logic (should we load at all?) with variant selection
	 * (which build to use?) into a single method so the two cannot get out of sync.
	 *
	 * @return string|null The variant name, or null if scripts should not be loaded.
	 */
	private static function get_variant() {
		// Agents Manager does not render on the frontend.
		if ( ! is_admin() ) {
			return null;
		}

		// Apply wp-admin exclusions (customizer, asset, and preview contexts).
		if ( ! self::passes_admin_checks() ) {
			return null;
		}

		if ( ! self::is_enabled() ) {
			return null;
		}

		$disconnected = self::is_jetpack_disconnected();

		if ( self::is_block_editor() ) {
			return $disconnected ? 'gutenberg-disconnected' : 'gutenberg';
		}

		return $disconnected ? null : 'wp-admin';
	}

	/**
	 * Returns true if the Agents Manager should be loaded in the current context.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$enabled = false;

		if ( self::is_block_editor() && apply_filters( 'agents_manager_enabled_in_block_editor', false ) ) {
			// Block editor only: Agents Manager replaces Big Sky's native UI. Hooked by Big Sky.
			$enabled = true;
		}

		/**
		 * Filters whether an integration requests the Agents Manager shell on this request.
		 *
		 * Providers should preserve an existing true value so multiple integrations can
		 * request the shared shell independently.
		 *
		 * @since 0.9.1
		 *
		 * @param bool $should_load Whether another integration already requested the shell.
		 */
		$should_load = (bool) apply_filters( 'agents_manager_should_load', false );

		return $enabled || $should_load;
	}

	/**
	 * Returns true if the current wp-admin context passes all exclusion checks.
	 *
	 * Excludes customizer previews, Gutenberg asset requests, and preview query
	 * param contexts.
	 *
	 * @return bool
	 */
	private static function passes_admin_checks() {
		// Don't load in customizer preview iframe.
		if ( is_customize_preview() ) {
			return false;
		}

		// Don't load during Gutenberg asset requests or preview contexts.
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a context check, not a form submission.
		$is_preview = isset( $_GET['preview'] ) && 'true' === sanitize_text_field( wp_unslash( $_GET['preview'] ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a context check, not a form submission.
		$is_preview_overlay = isset( $_GET['preview_overlay'] );
		if ( str_contains( $request_uri, 'wp-content/plugins/gutenberg-core' ) || $is_preview || $is_preview_overlay ) {
			return false;
		}

		return true;
	}

	/**
	 * Enqueue Agents Manager script based on context.
	 *
	 * @param string $variant The variant of the asset file to get.
	 * @return string|null The deployed build version from the asset file, or null when unavailable.
	 */
	private function enqueue_script( $variant ) {
		$cache_key  = 'agents-manager-asset-' . $variant . '.asset.json';
		$asset_file = get_transient( $cache_key );

		if ( ! $asset_file ) {
			$asset_file = self::get_assets_json( 'widgets.wp.com/agents-manager/agents-manager-' . $variant . '.asset.json' );
			if ( ! $asset_file ) {
				return null;
			}
			set_transient( $cache_key, $asset_file, HOUR_IN_SECONDS );
		}

		// When the request is dev mode, use a random cache buster as the version for easier debugging.
		$version = self::is_dev_mode() ? wp_rand() : $asset_file['version'];

		$script_dependencies = $asset_file['dependencies'] ?? array();

		// Load translations for connected variants from widgets.wp.com.
		// Disconnected variants have no translatable UI, so skip them (as Help
		// Center does). English needs no translation file.
		if ( ! str_contains( $variant, 'disconnected' ) ) {
			$locale = self::determine_iso_639_locale();

			if ( 'en' !== $locale ) {
				wp_enqueue_script(
					'agents-manager-translations',
					'https://widgets.wp.com/agents-manager/languages/' . $locale . '-v1.js',
					array( 'wp-i18n' ),
					$version,
					true
				);

				$script_dependencies[] = 'agents-manager-translations';
			}
		}

		wp_enqueue_script(
			'agents-manager',
			'https://widgets.wp.com/agents-manager/agents-manager-' . $variant . '.min.js',
			$script_dependencies,
			$version,
			/**
			 * Filter the strategy to use when enqueuing the script.
			 *
			 * @param array|bool $args The arguments to pass to wp_enqueue_script. Default is true.
			 * @param string $handle The handle of the script.
			 */
			apply_filters( 'agents_manager_enqueue_script_strategy', true, 'agents-manager' )
		);

		if ( 'gutenberg-disconnected' !== $variant ) {
			wp_enqueue_style(
				'agents-manager-style',
				'https://widgets.wp.com/agents-manager/agents-manager-' . $variant . ( is_rtl() ? '.rtl.css' : '.css' ),
				array(),
				$version
			);
		}

		return (string) $asset_file['version'];
	}

	/**
	 * Returns the ISO 639 conforming locale string for the current user.
	 *
	 * Normalizes the WordPress user locale to match the widgets.wp.com translation
	 * file naming at languages/{code}-v1.js. Preserves the region for the few locales
	 * where it is meaningful (pt-br, zh-tw, zh-cn); strips the region for all others;
	 * falls back to 'en' when the locale is empty.
	 *
	 * @return string The ISO 639 locale string, e.g. "en".
	 */
	private static function determine_iso_639_locale() {
		$language = get_user_locale();
		$language = strtolower( $language );

		if ( in_array( $language, array( 'pt_br', 'pt-br', 'zh_tw', 'zh-tw', 'zh_cn', 'zh-cn' ), true ) ) {
			$language = str_replace( '_', '-', $language );
		} else {
			$language = preg_replace( '/([-_].*)$/i', '', $language );
		}

		if ( empty( $language ) ) {
			return 'en';
		}

		return $language;
	}

	/**
	 * Get the asset via file-system on wpcom and via network on Atomic sites.
	 *
	 * @param string $filepath The URL to download the asset file from.
	 * @return array|null The asset file data or null on failure.
	 */
	private static function get_assets_json( $filepath ) {
		$accessible_directly = file_exists( ABSPATH . $filepath );

		if ( $accessible_directly ) {
			$file_contents = file_get_contents( ABSPATH . $filepath );

			if ( false === $file_contents ) {
				return null;
			}

			return json_decode( $file_contents, true );
		}

		$request = wp_remote_get( 'https://' . $filepath );

		if ( is_wp_error( $request ) ) {
			return null;
		}

		$response_code = wp_remote_retrieve_response_code( $request );
		if ( 200 !== $response_code ) {
			return null;
		}

		$content_type = wp_remote_retrieve_header( $request, 'content-type' );
		if ( is_string( $content_type ) && false === strpos( $content_type, 'json' ) ) {
			return null;
		}

		$body = wp_remote_retrieve_body( $request );
		if ( '' === $body ) {
			return null;
		}

		$decoded = json_decode( $body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return null;
		}

		return $decoded;
	}

	/**
	 * Update the calypso preferences.
	 *
	 * @param \stdClass $preferences The preferences.
	 *
	 * @return \stdClass The preferences.
	 */
	public function calypso_preferences_update( $preferences ) {
		// Check if agents_manager_router_history exists and is a valid array structure
		if ( ! isset( $preferences->agents_manager_router_history ) ||
			! is_array( $preferences->agents_manager_router_history ) ) {
			return $preferences;
		}

		$router_history = $preferences->agents_manager_router_history;

		// Check if entries exist and is an array
		if ( ! isset( $router_history['entries'] ) ||
			! is_array( $router_history['entries'] ) ) {
			return $preferences;
		}

		$entries = $router_history['entries'];

		// Limit entries to 50 to prevent spamming entries in the router history.
		if ( count( $entries ) > 50 ) {
			// Keep only the last 49 entries and add the root entry at the beginning.
			$entries = array_slice( $entries, -49 );
			// Keep the start at root so the back button always works.
			array_unshift(
				$entries,
				array(
					'pathname' => '/',
					'search'   => '',
					'hash'     => '',
					'key'      => 'default',
					'state'    => null,
				)
			);

			// Update the preferences object directly
			$preferences->agents_manager_router_history['entries'] = $entries;
			$preferences->agents_manager_router_history['index']   = 49;
		}

		return $preferences;
	}

	/**
	 * Creates instance.
	 *
	 * @return Agents_Manager
	 */
	public static function init() {
		if ( did_action( 'jetpack_agents_manager_initialized' ) ) {
			return self::get_instance();
		}

		self::$instance = new self();

		/**
		 * Fires once the Agents Manager class has been instantiated.
		 *
		 * @since 0.5.0
		 */
		do_action( 'jetpack_agents_manager_initialized' );

		return self::$instance;
	}

	/**
	 * Returns the instance of the Agents Manager class.
	 *
	 * @return Agents_Manager
	 */
	public static function get_instance() {
		return self::$instance;
	}

	/**
	 * Returns whether the current request is coming from the A8C proxy.
	 *
	 * @return bool
	 */
	private static function is_proxied() {
		// On Simple sites, use the wpcom function if available.
		if ( function_exists( 'wpcom_is_proxied_request' ) ) {
			return wpcom_is_proxied_request();
		}

		// On WoA/Garden sites, check server variable or constant.
		return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: Constants::is_true( 'A8C_PROXIED_REQUEST' );
	}

	/**
	 * Returns whether the current visitor should be marked as an Automattician in tracking.
	 *
	 * @return bool
	 */
	private static function is_tracking_automattician() {
		$is_automattician = function_exists( 'is_automattician' ) && (bool) is_automattician();

		return $is_automattician || self::is_proxied() || Constants::is_true( 'AT_PROXIED_REQUEST' );
	}

	/**
	 * Enables "Development" features that should be accessible only for admins.
	 */
	private static function is_dev_mode() {
		// Known local environments.
		$domain = wp_parse_url( get_site_url(), PHP_URL_HOST );
		if (
			$domain === 'localhost' ||
			'.jurassic.tube' === stristr( $domain, '.jurassic.tube' ) ||
			'.jurassic.ninja' === stristr( $domain, '.jurassic.ninja' )
		) {
			return true;
		}

		// A8C development.
		if ( self::is_proxied() ) {
			return true;
		}

		if ( Constants::is_true( 'AT_PROXIED_REQUEST' ) && Constants::is_defined( 'ATOMIC_CLIENT_ID' ) ) {
			switch ( Constants::get_constant( 'ATOMIC_CLIENT_ID' ) ) {
				case 1:
				case 2:
				case 3: // Pressable
				case 32:
				case 118: // Commerce garden client.
					return true;
			}
		}

		return false;
	}

	/**
	 * Register the Agents Manager endpoints.
	 */
	public function register_rest_api() {
		( new WP_REST_Agents_Manager_Persisted_Open_State() )->register_rest_route();
		( new REST_Jetpack_AI_JWT() )->register_rest_route();
	}

	/**
	 * Returns true if the current screen is the block editor.
	 *
	 * @return bool True if the current screen is the block editor.
	 */
	private static function is_block_editor() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$current_screen = get_current_screen();
		// The widgets screen has the block editor but no Gutenberg top bar.
		return $current_screen && $current_screen->is_block_editor() && $current_screen->id !== 'widgets';
	}

	/**
	 * Returns true when the WordPress admin bar is available in the block editor.
	 *
	 * The frontend uses the visible admin bar as its signal to move editor entry points out of the
	 * Gutenberg toolbar. Use WordPress's matching server-side signal so a classic editor admin bar
	 * receives those entry points too, not only Gutenberg's experimental omnibar.
	 *
	 * @return bool
	 */
	private static function is_admin_bar_in_editor() {
		return self::is_block_editor() && is_admin_bar_showing();
	}

	/**
	 * Returns true if the current user is NOT connected through Jetpack.
	 *
	 * Mirrors the logic from Help_Center::is_jetpack_disconnected().
	 *
	 * @return bool True if the site uses Jetpack but the current user is not connected.
	 */
	private static function is_jetpack_disconnected() {
		$user_id = get_current_user_id();
		$blog_id = get_current_blog_id();

		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			return ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected( $user_id );
		}

		if ( true === apply_filters( 'is_jetpack_site', false, $blog_id ) ) {
			return ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected( $user_id );
		}

		return false;
	}

	/**
	 * Get current user data for the agents manager.
	 *
	 * Mirrors the user data structure from Help Center's helpCenterData.
	 *
	 * @return array|null User data array or null if not logged in.
	 */
	private function get_current_user_data() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$user_data = get_userdata( $user_id );
		if ( ! $user_data ) {
			return null;
		}

		$user_email = $user_data->user_email;

		// Use wpcom_get_avatar_url on Simple sites, fall back to get_avatar_url elsewhere.
		if ( function_exists( 'wpcom_get_avatar_url' ) ) {
			$avatar_url = wpcom_get_avatar_url( $user_email, 64, '', true )[0];
		} else {
			$avatar_url = get_avatar_url( $user_id );
		}

		return array(
			'ID'           => $user_id,
			'username'     => $user_data->user_login,
			'display_name' => $user_data->display_name,
			'avatar_URL'   => $avatar_url,
			'email'        => $user_email,
		);
	}

	/**
	 * Get current site data for the agents manager.
	 *
	 * Returns minimal site data needed by AgentsManager (ID and domain only).
	 * Uses jetpack_options['id'] on Atomic sites for the wpcom blog ID.
	 *
	 * @return array Site data with ID and domain.
	 */
	private function get_current_site() {
		/*
		 * Atomic sites have the WP.com blog ID stored as a Jetpack option.
		 * This code deliberately doesn't use `Jetpack_Options::get_option`
		 * so it works even when Jetpack has not been loaded.
		 */
		$jetpack_options = get_option( 'jetpack_options' );
		if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
			$site_id = (int) $jetpack_options['id'];
		} else {
			$site_id = get_current_blog_id();
		}

		return array(
			'ID'     => $site_id,
			'domain' => wp_parse_url( home_url(), PHP_URL_HOST ),
		);
	}
}
