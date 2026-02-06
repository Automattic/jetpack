<?php
/**
 * Agents manager
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Class Agents_Manager
 */
class Agents_Manager {
	/**
	 * Class instance.
	 *
	 * @var Agents_Manager
	 */
	private static $instance = null;

	/**
	 * Agents_Manager constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_filter( 'calypso_preferences_update', array( $this, 'calypso_preferences_update' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 101 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ), 101 );
		add_action( 'next_admin_init', array( $this, 'enqueue_scripts' ), 1001 );
		add_filter( 'agents_manager_use_unified_experience', array( $this, 'should_use_unified_experience' ) );

		// Disable Jetpack AI image extensions early, before Jetpack builds its editor state.
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'disable_jetpack_ai_image_extensions' ), 99 );
	}

	/**
	 * Check if the agents manager menu panel should be displayed.
	 *
	 * @return bool True if the menu panel should be displayed.
	 */
	public function should_display_menu_panel() {
		return $this->should_use_unified_experience();
	}

	/**
	 * Get the SVG icon markup for a given icon name.
	 *
	 * @param string $icon_name The name of the icon to retrieve.
	 * @return string The SVG markup.
	 */
	private function get_icon( $icon_name ) {
		$icons = array(
			'comment' => '<svg class="help-center-menu-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 4H6c-1.1 0-2 .9-2 2v12.9c0 .6.5 1.1 1.1 1.1.3 0 .5-.1.8-.3L8.5 17H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 11c0 .3-.2.5-.5.5H7.9l-2.4 2.4V6c0-.3.2-.5.5-.5h12c.3 0 .5.2.5.5v9z" /></svg>',
			'backup'  => '<svg class="help-center-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.5 12h1.75l-2.5 3-2.5-3H4a8 8 0 113.134 6.35l.907-1.194A6.5 6.5 0 105.5 12zm9.53 1.97l-2.28-2.28V8.5a.75.75 0 00-1.5 0V12a.747.747 0 00.218.529l1.282-.84-1.28.842 2.5 2.5a.75.75 0 101.06-1.061z" /></svg>',
			'page'    => '<svg class="help-center-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 7.5h-7V9h7V7.5Zm-7 3.5h7v1.5h-7V11Zm7 3.5h-7V16h7v-1.5Z" /><path d="M17 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM7 5.5h10a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5Z" /></svg>',
			'video'   => '<svg class="help-center-menu-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.7 3H5.3C4 3 3 4 3 5.3v13.4C3 20 4 21 5.3 21h13.4c1.3 0 2.3-1 2.3-2.3V5.3C21 4 20 3 18.7 3zm.8 15.7c0 .4-.4.8-.8.8H5.3c-.4 0-.8-.4-.8-.8V5.3c0-.4.4-.8.8-.8h13.4c.4 0 .8.4.8.8v13.4zM10 15l5-3-5-3v6z" /></svg>',
			'rss'     => '<svg class="help-center-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 10.2h-.8v1.5H5c1.9 0 3.8.8 5.1 2.1 1.4 1.4 2.1 3.2 2.1 5.1v.8h1.5V19c0-2.3-.9-4.5-2.6-6.2-1.6-1.6-3.8-2.6-6.1-2.6zm10.4-1.6C12.6 5.8 8.9 4.2 5 4.2h-.8v1.5H5c3.5 0 6.9 1.4 9.4 3.9s3.9 5.8 3.9 9.4v.8h1.5V19c0-3.9-1.6-7.6-4.4-10.4zM4 20h3v-3H4v3z" /></svg>',
		);

		return $icons[ $icon_name ] ?? '';
	}

	/**
	 * Add the agents manager menu panel to the admin bar.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public function add_menu_panel( $wp_admin_bar ) {
		// Add chat support group
		$wp_admin_bar->add_group(
			array(
				'parent' => 'agents-manager',
				'id'     => 'agents-manager-menu-panel-chat',
				'meta'   => array(
					'class' => 'ab-sub-secondary',
				),
			)
		);

		// Add chat support menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-chat',
				'id'     => 'agents-manager-chat-support',
				'title'  => $this->get_icon( 'comment' ) . '<span>' . __( 'Chat support', 'jetpack-mu-wpcom' ) . '</span>',
			)
		);

		// Add chat history menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-chat',
				'id'     => 'agents-manager-chat-history',
				'title'  => $this->get_icon( 'backup' ) . '<span>' . __( 'Chat history', 'jetpack-mu-wpcom' ) . '</span>',
			)
		);

		// Add links group
		$wp_admin_bar->add_group(
			array(
				'parent' => 'agents-manager',
				'id'     => 'agents-manager-menu-panel-links',
				'meta'   => array(
					'class' => 'ab-sub-secondary',
				),
			)
		);

		// Add support guides menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-links',
				'id'     => 'agents-manager-support-guides',
				'title'  => $this->get_icon( 'page' ) . '<span>' . __( 'Support guides', 'jetpack-mu-wpcom' ) . '</span>',
			)
		);

		// Add courses menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-links',
				'id'     => 'agents-manager-courses',
				'title'  => $this->get_icon( 'video' ) . '<span>' . __( 'Courses', 'jetpack-mu-wpcom' ) . '</span>',
				'href'   => 'https://wordpress.com/support/courses/',
				'meta'   => array(
					'target' => '_blank',
				),
			)
		);

		// Add product updates menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-links',
				'id'     => 'agents-manager-product-updates',
				'title'  => $this->get_icon( 'rss' ) . '<span>' . __( 'Product updates', 'jetpack-mu-wpcom' ) . '</span>',
				'href'   => 'https://wordpress.com/blog/category/product-features/',
				'meta'   => array(
					'target' => '_blank',
				),
			)
		);
	}

	/**
	 * Enqueue Agents Manager scripts and add inline script data.
	 */
	public function enqueue_scripts() {
		if ( $this->should_display_menu_panel() ) {
			add_action(
				'admin_bar_menu',
				function ( $wp_admin_bar ) {
					// Remove the help-center menu item
					$wp_admin_bar->remove_node( 'help-center' );

					// Add the main agents manager menu node
					$wp_admin_bar->add_menu(
						array(
							'id'     => 'agents-manager',
							'title'  => '<span title="' . __( 'Help Center', 'jetpack-mu-wpcom' ) . '"><svg id="agents-manager-icon" class="ab-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16v-2h2v2h-2zm2-3v-1.141A3.991 3.991 0 0016 10a4 4 0 00-8 0h2c0-1.103.897-2 2-2s2 .897 2 2-.897 2-2 2a1 1 0 00-1 1v2h2z" />
											</svg></span>',
							'parent' => 'top-secondary',
							'meta'   => array(
								'html'   => '<div id="agents-manager-masterbar" />',
								'class'  => 'menupop',
								'target' => '_blank',
							),
						)
					);
				},
				// Add the agents manager icon to the admin bar after the help center is added, so we can remove it.
				100
			);

			// Initialize the agents manager menu panel
			add_action( 'admin_bar_menu', array( $this, 'add_menu_panel' ), 100 );
		}

		if ( ! $this->should_enqueue_script() ) {
			return;
		}

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
		 * Filter to determine if user should see the unified chat experience.
		 *
		 * When true, Help Center will render UnifiedAIAgent instead of traditional UI.
		 * The filter is hooked by should_use_unified_experience() in this class.
		 *
		 * @param bool $use_unified_experience Whether to use unified experience. Default false.
		 */
		$use_unified_experience = apply_filters( 'agents_manager_use_unified_experience', false );

		if ( $this->is_block_editor() ) {
			$variant = 'gutenberg';
		} else {
			$variant = 'wp-admin';
		}

		$this->enqueue_script( $variant );
		$this->enqueue_image_studio();

		wp_add_inline_script(
			'agents-manager',
			'const agentsManagerData = ' . wp_json_encode(
				array(
					'agentProviders'       => $agent_providers,
					'useUnifiedExperience' => $use_unified_experience,
					'isDevMode'            => self::is_dev_mode(),
					'sectionName'          => $variant,
					'currentUser'          => $this->get_current_user_data(),
					'site'                 => $this->get_current_site(),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * Determine if the agents manager files should be enqueued.
	 */
	private function should_enqueue_script() {
		// Don't load on site frontend - only load in wp-admin.
		if ( ! is_admin() ) {
			return false;
		}

		// Don't load in customizer preview iframe - Help Center handles customizer separately
		// via customize_controls_enqueue_scripts hook (loads only in controls panel, not preview).
		if ( is_customize_preview() ) {
			return false;
		}

		// Don't load during Gutenberg asset requests or in preview contexts.
		// This matches the logic in Help_Center::init() to prevent excessive/unnecessary loading.
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a context check, not a form submission.
		$is_preview = isset( $_GET['preview'] ) && 'true' === sanitize_text_field( wp_unslash( $_GET['preview'] ) );
		if ( str_contains( $request_uri, 'wp-content/plugins/gutenberg-core' ) || $is_preview ) {
			return false;
		}

		if ( apply_filters( 'agents_manager_use_unified_experience', false ) ) {
			return true;
		}

		if ( $this->is_block_editor() && class_exists( 'Big_Sky' ) && $this->has_unified_big_sky_flag() ) {
			return true;
		}

		return false;
	}

	/**
	 * Enqueue Agents Manager script based on context.
	 *
	 * @param string $variant The variant of the asset file to get.
	 */
	private function enqueue_script( $variant ) {
		$cache_key  = 'agents-manager-asset-' . $variant . '.asset.json';
		$asset_file = get_transient( $cache_key );

		if ( ! $asset_file ) {
			$asset_file = self::get_assets_json( 'widgets.wp.com/agents-manager/agents-manager-' . $variant . '.asset.json' );
			if ( ! $asset_file ) {
				return;
			}
			set_transient( $cache_key, $asset_file, HOUR_IN_SECONDS );
		}

		// When the request is dev mode, use a random cache buster as the version for easier debugging.
		$version = self::is_dev_mode() ? wp_rand() : $asset_file['version'];

		$script_dependencies = $asset_file['dependencies'] ?? array();

		wp_enqueue_script(
			'agents-manager',
			'https://widgets.wp.com/agents-manager/agents-manager-' . $variant . '.min.js',
			$script_dependencies,
			$version,
			true
		);

		wp_enqueue_style(
			'agents-manager-style',
			'https://widgets.wp.com/agents-manager/agents-manager-' . $variant . ( is_rtl() ? '.rtl.css' : '.css' ),
			array(),
			$version
		);
	}

	/**
	 * Enqueue Image Studio script and styles.
	 */
	private function enqueue_image_studio() {
		$cache_key  = 'image-studio.asset.json';
		$asset_file = get_transient( $cache_key );

		if ( ! $asset_file ) {
			$asset_file = self::get_assets_json( 'widgets.wp.com/agents-manager/image-studio.asset.json' );
			if ( ! $asset_file ) {
				return;
			}
			set_transient( $cache_key, $asset_file, HOUR_IN_SECONDS );
		}

		// When the request is dev mode, use a random cache buster as the version for easier debugging.
		$version = self::is_dev_mode() ? wp_rand() : $asset_file['version'];

		$script_dependencies = $asset_file['dependencies'] ?? array();

		wp_enqueue_script(
			'image-studio',
			'https://widgets.wp.com/agents-manager/image-studio.min.js',
			$script_dependencies,
			$version,
			true
		);

		wp_add_inline_script(
			'image-studio',
			'const imageStudioData = ' . wp_json_encode(
				array(
					'enabled' => true,
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);

		wp_enqueue_style(
			'image-studio-style',
			'https://widgets.wp.com/agents-manager/image-studio' . ( is_rtl() ? '.rtl.css' : '.css' ),
			array( 'wp-components' ),
			$version
		);
	}

	/**
	 * Disable Jetpack AI image generation extensions when Image Studio is active.
	 *
	 * Hooked into `jetpack_register_gutenberg_extensions` at priority 99 to run
	 * after Jetpack registers its extensions but before the editor state is built.
	 */
	public function disable_jetpack_ai_image_extensions() {
		if ( ! $this->should_use_unified_experience() ) {
			return;
		}

		if ( ! class_exists( 'Jetpack_Gutenberg' ) ) {
			return;
		}

		$extensions = array(
			'ai-featured-image-generator',
			'ai-assistant-image-extension',
			'ai-general-purpose-image-generator',
			'ai-assistant-experimental-image-generation-support',
		);

		foreach ( $extensions as $extension ) {
			\Jetpack_Gutenberg::set_extension_unavailable( $extension, 'image_studio_enabled' );
		}
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
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
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
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
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
	 * Register the Agents Manager endpoints.
	 */
	public function register_rest_api() {
		require_once __DIR__ . '/class-wp-rest-agents-manager-persisted-open-state.php';
		$controller = new WP_REST_Agents_Manager_Persisted_Open_State();
		$controller->register_rest_route();
	}

	/**
	 * Determine if user should see unified experience.
	 *
	 * @return bool
	 */
	public function should_use_unified_experience() {
		// Early return for non-proxied/dev mode requests.
		// This feature is currently only available to Automattic employees testing via proxy.
		if ( ! self::is_dev_mode() ) {
			return false;
		}

		$user_id = get_current_user_id();

		if ( ! $user_id ) {
			return false;
		}

		$is_simple_site = ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple();
		if ( $is_simple_site ) {
			// On Simple sites, evaluate locally.
			// Check Automattician and opt-in setting.
			$is_automattician = function_exists( '\is_automattician' ) && \is_automattician( $user_id );
			if ( $is_automattician && $this->has_unified_chat_opt_in_enabled( $user_id ) ) {
				return true;
			}
		}

		// On WoA and Garden sites, delegate to wpcom via the /me/preferences endpoint.
		// This avoids duplicating rollout logic and handles cases where
		// wpcom-specific functions (like get_user_attribute) aren't available.
		if ( $this->fetch_unified_experience_preference() ) {
			return true;
		}

		// False, for now.
		// In the future: users with a big sky site (similar to https://github.a8c.com/Automattic/wpcom/pull/196449/files), a big-sky free trial or a paid plan.
		return false;
	}

	/**
	 * Check if user has enabled unified chat opt-in in their Automattician options.
	 *
	 * This checks the unified_ai_chat calypso preference set via the wpcom profile settings.
	 * Only used on Simple sites where get_user_attribute is available.
	 *
	 * @param int $user_id User ID.
	 *
	 * @return bool
	 */
	private function has_unified_chat_opt_in_enabled( $user_id ) {
		if ( ! function_exists( '\get_user_attribute' ) ) {
			return false;
		}

		$calypso_prefs = \get_user_attribute( $user_id, 'calypso_preferences' );
		return ! empty( $calypso_prefs['unified_ai_chat'] );
	}

	/**
	 * Fetch unified experience preference from wpcom via Jetpack Connection.
	 *
	 * Used on Atomic sites to delegate the decision to wpcom, which has
	 * access to user attributes and can evaluate the rollout logic.
	 *
	 * Calls /me/preferences endpoint which is accessible via Jetpack user tokens.
	 *
	 * @return bool Whether user should see unified experience.
	 */
	private function fetch_unified_experience_preference() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		// Check transient cache first (per-user cache).
		$cache_key     = 'unified-experience-' . $user_id;
		$cached_result = get_transient( $cache_key );
		if ( false !== $cached_result ) {
			return (bool) $cached_result;
		}

		// Check if user is connected before making API call.
		if ( ! ( new Connection_Manager() )->is_user_connected( $user_id ) ) {
			return false;
		}

		// Call /me/preferences via wpcom/v2 namespace (works with Jetpack user tokens).
		$wpcom_request = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			'/me/preferences?preference_key=unified_ai_chat',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $wpcom_request ) ) {
			// Cache failures too to avoid hammering the API.
			set_transient( $cache_key, 0, MINUTE_IN_SECONDS );
			return false;
		}

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			set_transient( $cache_key, 0, MINUTE_IN_SECONDS );
			return false;
		}

		$body         = wp_remote_retrieve_body( $wpcom_request );
		$decoded_body = json_decode( $body, true );

		// The response is the value of the preference directly when using preference_key.
		$result = ! empty( $decoded_body );

		// Cache for 1 minute.
		set_transient( $cache_key, $result ? 1 : 0, MINUTE_IN_SECONDS );

		return $result;
	}

	/**
	 * Returns true if the current screen is the block editor.
	 *
	 * @return bool True if the current screen is the block editor.
	 */
	private function is_block_editor() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$current_screen = get_current_screen();
		// The widgets screen has the block editor but no Gutenberg top bar.
		return $current_screen && $current_screen->is_block_editor() && $current_screen->id !== 'widgets';
	}

	/**
	 * Determine if the user should use unified experience for Big Sky.
	 */
	private function has_unified_big_sky_flag() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a feature flag check, not a form submission.
		if ( isset( $_GET['flags'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a feature flag check, not a form submission.
			$flags = explode( ',', sanitize_text_field( wp_unslash( $_GET['flags'] ) ) );
			if ( in_array( 'unified-big-sky', $flags, true ) ) {
				return true;
			}
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

add_action( 'init', array( __NAMESPACE__ . '\Agents_Manager', 'init' ) );
