<?php
/**
 * Agents manager
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
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
	const PACKAGE_VERSION = '0.8.1';

	/**
	 * Help Center URL for disconnected variants.
	 *
	 * @var string
	 */
	private const HELP_CENTER_URL = 'https://wordpress.com/help?help-center=home';

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
		add_action( 'next_admin_init', array( $this, 'enqueue_scripts' ), 1001 );
		add_filter( 'agents_manager_use_unified_experience', array( $this, 'should_use_unified_experience' ) );

		Sidebar_Open_Preservation::init();
	}

	/**
	 * Check if the agents manager menu panel should be displayed.
	 *
	 * @return bool True if the menu panel should be displayed.
	 */
	public function should_display_menu_panel() {
		return self::is_unified_experience();
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
	 * Add the Agents Manager Help "?" node (`agents-manager`) to the admin bar, replacing the
	 * legacy Help Center node (`help-center`).
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar     The WP_Admin_Bar instance.
	 * @param bool          $use_disconnected Disconnected variants link straight to the Help Center instead of opening the dropdown.
	 */
	public function add_help_menu( $wp_admin_bar, $use_disconnected ) {
		$wp_admin_bar->remove_node( 'help-center' );

		$menu_args = array(
			'id'     => 'agents-manager',
			'title'  => '<span title="' . esc_attr__( 'Help Center', 'jetpack-agents-manager' ) . '"><svg id="agents-manager-icon" class="ab-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16v-2h2v2h-2zm2-3v-1.141A3.991 3.991 0 0016 10a4 4 0 00-8 0h2c0-1.103.897-2 2-2s2 .897 2 2-.897 2-2 2a1 1 0 00-1 1v2h2z" />
						</svg></span>',
			'parent' => 'top-secondary',
		);

		if ( $use_disconnected ) {
			$menu_args['href'] = self::HELP_CENTER_URL;
			$menu_args['meta'] = array(
				'target' => '_blank',
				'rel'    => 'noopener noreferrer',
			);
		} else {
			$menu_args['meta'] = array(
				'html'   => '<div id="agents-manager-masterbar"></div>',
				'class'  => 'menupop',
				'target' => '_blank',
				'rel'    => 'noopener noreferrer',
			);
		}

		$wp_admin_bar->add_menu( $menu_args );
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
				'title'  => $this->get_icon( 'comment' ) . '<span>' . __( 'Chat support', 'jetpack-agents-manager' ) . '</span>',
			)
		);

		// Add chat history menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-chat',
				'id'     => 'agents-manager-chat-history',
				'title'  => $this->get_icon( 'backup' ) . '<span>' . __( 'Chat history', 'jetpack-agents-manager' ) . '</span>',
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
				'title'  => $this->get_icon( 'page' ) . '<span>' . __( 'Support guides', 'jetpack-agents-manager' ) . '</span>',
			)
		);

		// Add courses menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-links',
				'id'     => 'agents-manager-courses',
				'title'  => $this->get_icon( 'video' ) . '<span>' . __( 'Courses', 'jetpack-agents-manager' ) . '</span>',
				'href'   => 'https://wordpress.com/support/courses/',
				'meta'   => array(
					'target' => '_blank',
					'rel'    => 'noopener noreferrer',
				),
			)
		);

		// Add product updates menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'agents-manager-menu-panel-links',
				'id'     => 'agents-manager-product-updates',
				'title'  => $this->get_icon( 'rss' ) . '<span>' . __( 'Product updates', 'jetpack-agents-manager' ) . '</span>',
				'href'   => 'https://wordpress.com/blog/category/product-features/',
				'meta'   => array(
					'target' => '_blank',
					'rel'    => 'noopener noreferrer',
				),
			)
		);
	}

	/**
	 * Add the standalone AI chat button to the admin bar.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public function add_ai_chat_button( $wp_admin_bar ) {
		$wp_admin_bar->add_menu(
			array(
				'id'     => 'agents-manager-ai-chat',
				'parent' => 'top-secondary',
				'title'  => '<span title="' . esc_attr__( 'Ask AI', 'jetpack-agents-manager' ) . '"><svg class="ab-icon" role="img" aria-label="' . esc_attr__( 'Ask AI', 'jetpack-agents-manager' ) . '" width="24" height="24" viewBox="-45 -45 490 490" xmlns="http://www.w3.org/2000/svg">
								<path fill="currentColor" d="M391.528 188.061L309.455 159.75C276.997 148.597 251.403 123.003 240.25 90.5451L211.939 8.47185C208.079 -2.82395 191.921 -2.82395 188.061 8.47185L159.75 90.5451C148.597 123.003 123.003 148.597 90.5451 159.75L8.47185 188.061C-2.82395 191.921 -2.82395 208.079 8.47185 211.939L90.5451 240.25C123.003 251.403 148.597 276.997 159.75 309.455L188.061 391.528C191.921 402.824 208.079 402.824 211.939 391.528L240.25 309.455C251.403 276.997 276.997 251.403 309.455 240.25L391.528 211.939C402.824 208.079 402.824 191.921 391.528 188.061ZM295.728 206.077L254.692 220.232C238.391 225.809 225.666 238.677 220.089 254.835L205.934 295.871C203.932 301.591 195.925 301.591 193.923 295.871L179.768 254.835C174.191 238.534 161.323 225.809 145.165 220.232L104.129 206.077C98.4093 204.075 98.4093 196.068 104.129 194.066L145.165 179.911C161.466 174.334 174.191 161.466 179.768 145.308L193.923 104.272C195.925 98.5523 203.932 98.5523 205.934 104.272L220.089 145.308C225.666 161.609 238.534 174.334 254.692 179.911L295.728 194.066C301.448 196.068 301.448 204.075 295.728 206.077Z" />
							</svg></span>',
			)
		);
	}

	/**
	 * Enqueue Agents Manager scripts and add inline script data.
	 */
	public function enqueue_scripts() {
		// Early return for P2 frontend - don't add admin bar or enqueue scripts.
		$stylesheet = get_stylesheet();
		$is_p2      = str_contains( $stylesheet, 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && \WPForTeams\is_wpforteams_site( get_current_blog_id() );

		if ( ! is_admin() && $is_p2 ) {
			return;
		}

		// Determine which variant to load (null = don't load).
		$variant = self::get_active_variant();
		if ( null === $variant ) {
			return;
		}
		$use_disconnected = str_contains( $variant, 'disconnected' );
		$is_gutenberg     = $this->is_block_editor();

		// In Gutenberg, dequeue Help Center so we don't end up with two buttons — but only
		// in the full unified experience, where Agents Manager takes over the Help Center.
		// In block-editor-only mode (e.g. ?flags=unified-big-sky) Agents Manager replaces
		// Big Sky's native UI and Help Center should remain available.
		// Agents Manager fires at priority 101, after Help Center at 100, so HC is already enqueued.
		if ( $is_gutenberg && self::is_unified_experience() ) {
			wp_dequeue_script( 'help-center' );
			wp_dequeue_style( 'help-center-style' );
		}

		// For non-Gutenberg, non-CIAB environments, add to the admin bar. The fullscreen Gutenberg
		// editor has no admin bar, so JS handles UI insertion — except under the omnibar, which is
		// handled below. CIAB hides the admin bar and uses its own Site Hub.
		$is_ciab = $this->is_ciab_environment();
		if ( ! $is_gutenberg && ! $is_ciab ) {
			add_action(
				'admin_bar_menu',
				function ( $wp_admin_bar ) use ( $use_disconnected ) {
					$this->add_help_menu( $wp_admin_bar, $use_disconnected );
				},
				// Add the agents manager icon to the admin bar after the help center is added, so we can remove it.
				100
			);

			// Initialize the agents manager menu panel (only for full variants, not disconnected)
			if ( ! $use_disconnected ) {
				add_action( 'admin_bar_menu', array( $this, 'add_menu_panel' ), 100 );
			}

			// Standalone AI chat button, shown only in the unified experience.
			if ( ! $use_disconnected && self::is_unified_experience() ) {
				add_action( 'admin_bar_menu', array( $this, 'add_ai_chat_button' ), 100 );
			}
		}

		// When Gutenberg's "admin bar in editor" (omnibar) experiment is active, add the entry
		// points to that editor admin bar. CIAB is excluded — it has its own Site Hub UI.
		// Mirroring wp-admin: the Help "?" dropdown shows only in the full unified experience;
		// the Ask AI button shows whenever Agents Manager is enabled in this editor.
		if ( ! $is_ciab && ! $use_disconnected && self::is_admin_bar_in_editor() ) {
			// Help "?" node + dropdown panel first, matching the wp-admin admin bar order.
			if ( self::is_unified_experience() ) {
				add_action(
					'admin_bar_menu',
					function ( $wp_admin_bar ) {
						$this->add_help_menu( $wp_admin_bar, false );
					},
					100
				);
				add_action( 'admin_bar_menu', array( $this, 'add_menu_panel' ), 100 );
			}

			// Ask AI button — shown whenever Agents Manager is enabled in this editor context.
			if ( self::is_enabled() ) {
				add_action( 'admin_bar_menu', array( $this, 'add_ai_chat_button' ), 100 );
			}
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

		$use_unified_experience = self::is_unified_experience();

		/**
		 * Filter the default agent ID for the Agents Manager.
		 *
		 * Allows host applications (e.g., CIAB, WooCommerce AI) to specify a custom
		 * workflow agent instead of the default orchestrator. The value is passed to
		 * the frontend as `agentsManagerData.agentId` and consumed by `useAgentConfig()`.
		 *
		 * @param string|null $agent_id The agent ID to use, or null for default behavior.
		 */
		$agent_id = apply_filters( 'agents_manager_agent_id', null );

		$this->enqueue_script( $variant );

		$inline_data = array(
			'agentProviders'       => $agent_providers,
			'useUnifiedExperience' => $use_unified_experience,
			'isDevMode'            => self::is_dev_mode(),
			'sectionName'          => apply_filters( 'agents_manager_section_name', $variant ),
			'currentUser'          => $this->get_current_user_data(),
			'site'                 => $this->get_current_site(),
			'helpCenterUrl'        => self::HELP_CENTER_URL,
		);

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
	 * Determine which script variant to load, or null if none should be loaded.
	 *
	 * Combines the gating logic (should we load at all?) with variant selection
	 * (which build to use?) into a single method so the two cannot get out of sync.
	 *
	 * @return string|null The variant name, or null if scripts should not be loaded.
	 */
	private static function get_variant() {
		// CIAB: Load either the connected or disconnected variants if enabled.
		if ( self::is_ciab_environment() && self::is_enabled() ) {
			return self::is_jetpack_disconnected() ? 'ciab-disconnected' : 'ciab';
		}

		// Frontend: load disconnected variant for eligible logged-in editors.
		if ( ! is_admin() ) {
			if ( self::is_loading_on_frontend() && self::is_enabled() ) {
				return 'wp-admin-disconnected';
			}
			return null;
		}

		// Apply wp-admin exclusions (WooCommerce, customizer, preview contexts).
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

		return $disconnected ? 'wp-admin-disconnected' : 'wp-admin';
	}

	/**
	 * Whether the unified experience — the Help Center takeover — is active.
	 *
	 * "Unified" here means Agents Manager takes over the Help Center, unifying Odie and
	 * Dolly (the orchestrator) into a single chat experience. This is distinct from
	 * block-editor-only enablement, which replaces Big Sky's native UI without taking
	 * over the Help Center.
	 *
	 * @return bool
	 */
	public static function is_unified_experience() {
		/**
		 * Filter to determine if the user should see the unified chat experience.
		 *
		 * When true, Help Center will render UnifiedAIAgent instead of traditional UI.
		 * The filter is hooked by should_use_unified_experience() in this class.
		 *
		 * @param bool $use_unified_experience Whether to use unified experience. Default false.
		 */
		return (bool) apply_filters( 'agents_manager_use_unified_experience', false );
	}

	/**
	 * Returns true if the Agents Manager should be loaded in the current context.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// CIAB: Agents Manager is the default AI experience — enabled unless explicitly
		// disabled via filter (e.g. for debugging or gradual rollout).
		if ( self::is_ciab_environment() ) {
			/**
			 * Filter whether Agents Manager is enabled in CIAB (Next Admin) environments.
			 *
			 * @param bool $enabled Whether Agents Manager should load. Default true.
			 */
			return apply_filters( 'agents_manager_enabled_in_ciab', true );
		}

		// Full unified experience: Agents Manager with support guides, Help Center takeover, etc.
		if ( self::is_unified_experience() ) {
			return true;
		}

		// Block editor only: Agents Manager replaces Big Sky's native UI. Hooked by Big Sky.
		if ( self::is_block_editor() && apply_filters( 'agents_manager_enabled_in_block_editor', false ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Returns true if the current wp-admin context passes all exclusion checks.
	 *
	 * Excludes WooCommerce Admin home, customizer preview, Gutenberg asset requests,
	 * and preview query param contexts.
	 *
	 * @return bool
	 */
	private static function passes_admin_checks() {
		// Don't load on WooCommerce Admin home page to avoid UI conflicts.
		global $current_screen;
		if ( $current_screen && $current_screen->id === 'woocommerce_page_wc-admin' ) {
			return false;
		}

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

		if ( 'gutenberg-disconnected' !== $variant && 'ciab-disconnected' !== $variant ) {
			wp_enqueue_style(
				'agents-manager-style',
				'https://widgets.wp.com/agents-manager/agents-manager-' . $variant . ( is_rtl() ? '.rtl.css' : '.css' ),
				array(),
				$version
			);
		}
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
		( new WP_REST_Agents_Manager_Persisted_Open_State() )->register_rest_route();
		( new WP_REST_Jetpack_AI_JWT() )->register_rest_route();
	}

	/**
	 * Determine if user should see unified experience.
	 *
	 * @param bool $use_unified_experience Whether to use unified experience.
	 * @return bool
	 */
	public function should_use_unified_experience( $use_unified_experience = false ) {
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

		// On WoA and Garden sites, delegate to wpcom via the /agents-manager/state endpoint.
		// This avoids duplicating rollout logic and handles cases where
		// wpcom-specific functions (like get_user_attribute) aren't available.
		if ( $this->fetch_unified_experience_preference() ) {
			return true;
		}

		// Default to false, for now.
		// In the future: users with a big sky site (similar to https://github.a8c.com/Automattic/wpcom/pull/196449/files), a big-sky free trial or a paid plan.
		return $use_unified_experience;
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
	 * Calls /agents-manager/state endpoint which is accessible via Jetpack user tokens.
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

		// Call dedicated agents-manager/state endpoint.
		$wpcom_request = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			'/agents-manager/state?key=unified_ai_chat',
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

		// The response is { "unified_ai_chat": true/false } when using key param.
		$result = is_array( $decoded_body ) && ! empty( $decoded_body['unified_ai_chat'] );

		// Cache for 1 minute.
		set_transient( $cache_key, $result ? 1 : 0, MINUTE_IN_SECONDS );

		return $result;
	}

	/**
	 * Returns true if the current request is on the frontend and the user can edit posts.
	 *
	 * Mirrors Help_Center::is_loading_on_frontend().
	 *
	 * @return bool True if loading on the frontend for an eligible user.
	 */
	private static function is_loading_on_frontend() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a context check, not a form submission.
		if ( isset( $_GET['na_site_preview'] ) || isset( $_GET['preview_overlay'] ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a context check, not a form submission.
		if ( isset( $_GET['preview'] ) && 'true' === sanitize_text_field( wp_unslash( $_GET['preview'] ) ) ) {
			return false;
		}

		$can_edit_posts = current_user_can( 'edit_posts' ) && is_user_member_of_blog();
		return ! is_admin() && ! self::is_block_editor() && $can_edit_posts;
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
	 * Returns true when Gutenberg's "admin bar in editor" (omnibar) experiment is active.
	 *
	 * Mirrors Gutenberg core's gate in `lib/experimental/admin-bar-in-editor/load.php`, and fails
	 * safe when `gutenberg_is_experiment_enabled()` is unavailable.
	 *
	 * @return bool
	 */
	private static function is_admin_bar_in_editor() {
		return self::is_block_editor()
			&& is_admin_bar_showing()
			&& function_exists( 'gutenberg_is_experiment_enabled' )
			// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above.
			&& \gutenberg_is_experiment_enabled( 'gutenberg-admin-bar-in-editor' );
	}

	/**
	 * Check if current environment is CIAB (Commerce in a Box) / Next Admin.
	 *
	 * Uses the same detection method as Help Center: checks if next_admin_init has fired.
	 *
	 * @return bool True if CIAB/Next Admin environment.
	 */
	private static function is_ciab_environment() {
		return (bool) did_action( 'next_admin_init' );
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
