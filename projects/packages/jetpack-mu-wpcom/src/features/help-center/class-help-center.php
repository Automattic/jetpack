<?php
/**
 * Help center
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Class Help_Center
 */
class Help_Center {
	/**
	 * Class instance.
	 *
	 * @var Help_Center|null
	 */
	private static $instance = null;

	/**
	 * Whether the current site is a support site.
	 *
	 * @var bool
	 */
	private $is_support_site = false;

	/**
	 * Whether the current site is a forum site.
	 *
	 * @var bool
	 */
	private $is_forum_site = false;

	/**
	 * The purchases of the current site.
	 *
	 * @var array
	 */
	private $purchases = array();

	/**
	 * Help_Center constructor.
	 */
	public function __construct() {
		if ( function_exists( 'wpcom_get_site_purchases' ) ) {
			$this->purchases = wp_list_filter( wpcom_get_site_purchases(), array( 'product_type' => 'bundle' ) );
		}

		$blog_id               = get_current_blog_id();
		$this->is_forum_site   = defined( 'WPCOM_FORUM_BLOG_IDS' ) && in_array( $blog_id, (array) WPCOM_FORUM_BLOG_IDS, true );
		$this->is_support_site = ( defined( 'WPCOM_SUPPORT_BLOG_IDS' ) && in_array( $blog_id, (array) WPCOM_SUPPORT_BLOG_IDS, true ) ) || $this->is_forum_site;

		// Always register REST API endpoints.
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_filter( 'calypso_preferences_update', array( $this, 'calypso_preferences_update' ) );

		// Handle customizer separately.
		if ( is_customize_preview() ) {
			add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqueue_customizer_scripts' ) );
			add_action( 'customize_controls_print_footer_scripts', array( $this, 'add_help_center_container' ) );
			return;
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_wp_admin_scripts' ), 100 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_wp_admin_scripts' ), 100 );
		add_filter( 'in_admin_header', array( $this, 'jetpack_remove_core_help_tab' ) );
	}

	/**
	 * Update the calypso preferences.
	 *
	 * @param \stdClass $preferences The preferences.
	 * @return \stdClass The preferences.
	 */
	public function calypso_preferences_update( $preferences ) {
		// Check if help_center_router_history exists and is a valid array structure
		if ( ! isset( $preferences->help_center_router_history ) ||
			! is_array( $preferences->help_center_router_history ) ) {
			return $preferences;
		}

		$router_history = $preferences->help_center_router_history;

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
			$preferences->help_center_router_history['entries'] = $entries;
			$preferences->help_center_router_history['index']   = 49;
		}

		return $preferences;
	}

	/**
	 * Returns ISO 639 conforming locale string of the current user.
	 *
	 * @return string ISO 639 locale string e.g. "en"
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
	 * We prefer to use the Help Center instead of the Help tab.
	 */
	public function jetpack_remove_core_help_tab() {
		?>
			<style>#contextual-help-link-wrap { display: none; }</style>
		<?php
	}

	/**
	 * Returns whether the current request is coming from the a8c proxy.
	 */
	private static function is_proxied() {
		return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';

		if ( str_contains( $request_uri, 'wp-content/plugins/gutenberg-core' ) || str_contains( $request_uri, 'preview=true' ) ) {
			return;
		}

		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Returns the singleton instance, or null if init() hasn't run or short-circuited.
	 *
	 * @return self|null
	 */
	public static function get_instance(): ?self {
		return self::$instance;
	}

	/**
	 * Enqueue Help Center assets.
	 *
	 * @param string $variant The variant of the asset file to get.
	 * @param array  $dependencies The asset file to get.
	 * @param string $version The version of the asset file to get.
	 */
	public function enqueue_script( $variant, $dependencies, $version ) {
		$script_dependencies = $dependencies ?? array();

		if ( $variant === 'wp-admin' || $variant === 'wp-admin-disconnected' || $variant === 'gutenberg' || $variant === 'gutenberg-disconnected' ) {
			add_action(
				'admin_bar_menu',
				function ( $wp_admin_bar ) {
					$wp_admin_bar->add_menu(
						array(
							'id'     => 'help-center',
							'title'  => '<span title="' . __( 'Help Center', 'jetpack-mu-wpcom' ) . '"><svg id="help-center-icon" class="ab-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 16v-2h2v2h-2zm2-3v-1.141A3.991 3.991 0 0016 10a4 4 0 00-8 0h2c0-1.103.897-2 2-2s2 .897 2 2-.897 2-2 2a1 1 0 00-1 1v2h2z" />
											</svg>
											<svg id="help-center-icon-with-notification" class="ab-icon"  width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM13 18H11V16H13V18ZM13 13.859V15H11V13C11 12.448 11.448 12 12 12C13.103 12 14 11.103 14 10C14 8.897 13.103 8 12 8C10.897 8 10 8.897 10 10H8C8 7.791 9.791 6 12 6C14.209 6 16 7.791 16 10C16 11.862 14.722 13.413 13 13.859Z" fill="currentColor"/>
												<circle cx="20" cy="3.5" r="4.3" fill="#e65054" stroke="#1d2327" stroke-width="2"/>
											</svg>
										</span>',
							'parent' => 'top-secondary',
							'href'   => $this->get_help_center_url(),
							'meta'   => array(
								'html'   => '<div id="help-center-masterbar" />',
								'class'  => 'menupop',
								'target' => '_blank',
							),
						)
					);
				},
				// Add the help center icon to the admin bar after the reader icon.
				12
			);

			if ( is_user_logged_in() && $variant === 'wp-admin' && $this->is_menu_panel_enabled() ) {
				// Initialize the help center menu panel
				require_once __DIR__ . '/class-help-center-menu-panel.php';
				Help_Center_Menu_Panel::init();
			}
		}

		if ( $variant !== 'wp-admin-disconnected' && $variant !== 'gutenberg-disconnected' ) {
			$locale = self::determine_iso_639_locale();

			if ( 'en' !== $locale ) {
				// Load translations directly from widgets.wp.com.
				wp_enqueue_script(
					'help-center-translations',
					'https://widgets.wp.com/help-center/languages/' . $locale . '-v1.js',
					array( 'wp-i18n' ),
					$version,
					true
				);

				$script_dependencies[] = 'help-center-translations';
			}
		}

		// If the user is not connected, the Help Center icon will link to the support page.
		// The disconnected version is significantly smaller than the connected version.
		wp_enqueue_script(
			'help-center',
			'https://widgets.wp.com/help-center/help-center-' . $variant . '.min.js',
			$script_dependencies,
			$version,
			true
		);

		wp_enqueue_style(
			'help-center-' . $variant . '-style',
			'https://widgets.wp.com/help-center/help-center-' . $variant . ( is_rtl() ? '.rtl.css' : '.css' ),
			array(),
			$version
		);

		// In the block editor the Help Center is already present in the editor toolbar
		// via SlotFill at viewports >= 600px. Hide the admin bar item at those widths
		// to avoid showing it in two places; keep it visible on mobile where the admin
		// bar is the primary navigation and the SlotFill button is hidden.
		if ( $variant === 'gutenberg' || $variant === 'gutenberg-disconnected' ) {
			wp_add_inline_style(
				'help-center-' . $variant . '-style',
				'@media (min-width:600px){#wpadminbar #wp-admin-bar-help-center{display:none!important;}}'
			);
		}

		// This information is only needed for the connected version of the help center.
		if ( $variant !== 'wp-admin-disconnected' && $variant !== 'gutenberg-disconnected' ) {
			wp_add_inline_script(
				'help-center',
				'if ( typeof helpCenterData === "undefined" ) { var helpCenterData = ' . wp_json_encode(
					$this->get_help_center_data( $variant ),
					JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
				) . '; }',
				'before'
			);
		}

		$should_enqueue_wp_components = ! is_admin() || ( is_customize_preview() && ( new Host() )->is_wpcom_simple() );

		if ( $should_enqueue_wp_components ) {
			$stylesheet     = is_rtl() ? 'build/components/style-rtl.css' : 'build/components/style.css';
			$stylesheet_url = plugins_url( 'gutenberg/' . $stylesheet );

			if ( function_exists( 'gutenberg_url' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction
				$stylesheet_url = gutenberg_url( $stylesheet );
			}
			// Enqueue wp-component styles because they're not enqueued in wp-admin outside of the editor.
			wp_enqueue_style(
				'wp-components',
				$stylesheet_url,
				array( 'dashicons' ),
				$version
			);
		}
	}

	/**
	 * Returns whether the menu panel experiment is enabled for the current user.
	 *
	 * @return boolean True if the menu panel experiment variation is enabled, false otherwise.
	 */
	private function is_menu_panel_enabled() {
		$experiment_name      = 'calypso_help_center_menu_popover_increase_exposure';
		$experiment_variation = 'menu_popover';
		$user_id              = get_current_user_id();
		$cache_key            = 'help-center-menu-panel-enabled-' . $user_id . '-' . $experiment_name;

		// Check cache first.
		$cached_result = get_transient( $cache_key );
		if ( false !== $cached_result ) {
			return (bool) $cached_result;
		}

		$result = false;

		if ( ( new Host() )->is_wpcom_simple() ) {
			$result = $experiment_variation === \ExPlat\assign_current_user( $experiment_name );
		} elseif ( ( new Connection_Manager() )->is_user_connected() ) {
			$request_path = '/experiments/0.1.0/assignments/calypso';
			$response     = Client::wpcom_json_api_request_as_user(
				add_query_arg( array( 'experiment_name' => $experiment_name ), $request_path ),
				'v2'
			);

			if ( ! is_wp_error( $response ) ) {
				$response_code = wp_remote_retrieve_response_code( $response );
				if ( 200 === $response_code ) {
					$data = json_decode( wp_remote_retrieve_body( $response ), true );
					if ( isset( $data['variations'] ) && isset( $data['variations'][ $experiment_name ] ) ) {
						$variation = $data['variations'][ $experiment_name ];
						$result    = $experiment_variation === $variation;
					}
				}
			}
		}

		// Cache the result for 1 hour.
		set_transient( $cache_key, $result ? 1 : 0, HOUR_IN_SECONDS );

		return $result;
	}

	/**
	 * Get current site details.
	 */
	public function get_current_site() {
		if ( $this->is_support_site ) {
			return null;
		}

		/*
		* Atomic sites have the WP.com blog ID stored as a Jetpack option. This code deliberately
		* doesn't use `Jetpack_Options::get_option` so it works even when Jetpack has not been loaded.
		*/
		$jetpack_options = get_option( 'jetpack_options' );
		if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
			$site = (int) $jetpack_options['id'];
		} else {
			$site = get_current_blog_id();
		}

		$logo_id = get_option( 'site_logo' );
		$bundles = $this->purchases;
		$plan    = array_pop( $bundles );

		$return_data = array(
			'ID'              => $site,
			'name'            => get_bloginfo( 'name' ),
			'URL'             => get_bloginfo( 'url' ),
			'plan'            => array(
				'product_slug' => $plan->product_slug ?? null,
			),
			'is_wpcom_atomic' => defined( 'IS_ATOMIC' ) && IS_ATOMIC,
			'jetpack'         => true === apply_filters( 'is_jetpack_site', false, $site ),
			'logo'            => array(
				'id'    => $logo_id,
				'sizes' => array(),
				'url'   => wp_get_attachment_image_src( $logo_id, 'thumbnail' )[0] ?? '',
			),
			'options'         => array(
				'launchpad_screen' => get_option( 'launchpad_screen' ),
				'site_intent'      => get_option( 'site_intent' ),
				'admin_url'        => get_admin_url(),
			),
		);

		return $return_data;
	}

	/**
	 * Build the helpCenterData payload for the connected Help Center bundles.
	 *
	 * Exposed so frontend consumers can mount Help Center outside the
	 * admin-only enqueue path without re-implementing the payload
	 * field-for-field.
	 *
	 * Note: this is the payload for the *connected* bundles. The disconnected
	 * variants ('wp-admin-disconnected', 'gutenberg-disconnected') do not
	 * consume helpCenterData and are not valid input here.
	 *
	 * @param string $variant   Bundle variant driving the default sectionName.
	 *                          One of 'wp-admin', 'logged-out', 'customizer',
	 *                          'gutenberg'.
	 * @param array  $overrides Shallow-merged onto the result via array_replace
	 *                          (e.g. array( 'sectionName' => 'landpack' )).
	 *                          Replacing a sub-array (e.g. 'currentUser')
	 *                          replaces it whole — no deep merge.
	 * @return array            JSON-ready associative array.
	 */
	public function get_help_center_data( string $variant = 'wp-admin', array $overrides = array() ): array {
		$user_id            = get_current_user_id();
		$user_data          = get_userdata( $user_id );
		$username           = $user_data ? $user_data->user_login : null;
		$user_email         = $user_data ? $user_data->user_email : null;
		$display_name       = $user_data ? $user_data->display_name : null;
		$avatar_url         = $user_data ? ( function_exists( 'wpcom_get_avatar_url' ) ? wpcom_get_avatar_url( $user_email, 64, '', true )[0] : get_avatar_url( $user_id ) ) : null;
		$is_commerce_garden = defined( 'IS_COMMERCE_GARDEN' );

		if ( $this->is_forum_site ) {
			$section_name = 'wp.com/forums';
		} elseif ( $this->is_support_site ) {
			$section_name = 'wp.com/support';
		} else {
			$section_name = $variant;
		}

		$data = array(
			'isProxied'        => boolval( self::is_proxied() ),
			'isSU'             => defined( 'WPCOM_SUPPORT_SESSION' ) && WPCOM_SUPPORT_SESSION,
			'isSSP'            => isset( $_COOKIE['ssp'] ),
			'sectionName'      => $section_name,
			'isCommerceGarden' => $is_commerce_garden,
			'currentUser'      => array(
				'ID'           => $user_id,
				'username'     => $username,
				'display_name' => $display_name,
				'avatar_URL'   => $avatar_url,
				'email'        => $user_email,
				'is_a11n'      => function_exists( '\is_automattician' ) && \is_automattician( $user_id ),
			),
			'site'             => $this->get_current_site(),
			'locale'           => self::determine_iso_639_locale(),
		);

		return array_replace( $data, $overrides );
	}

	/**
	 * Register the Help Center endpoints.
	 */
	public function register_rest_api() {
		require_once __DIR__ . '/class-wp-rest-help-center-authenticate.php';
		$controller = new WP_REST_Help_Center_Authenticate();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-sibyl.php';
		$controller = new WP_REST_Help_Center_Sibyl();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-support-status.php';
		$controller = new WP_REST_Help_Center_Support_Status();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-search.php';
		$controller = new WP_REST_Help_Center_Search();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-jetpack-search-ai.php';
		$controller = new WP_REST_Help_Center_Jetpack_Search_AI();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-fetch-post.php';
		$controller = new WP_REST_Help_Center_Fetch_Post();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-ticket.php';
		$controller = new WP_REST_Help_Center_Ticket();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-forum.php';
		$controller = new WP_REST_Help_Center_Forum();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-support-activity.php';
		$controller = new WP_REST_Help_Center_Support_Activity();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-support-interactions.php';
		$controller = new WP_REST_Help_Center_Support_Interactions();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-user-fields.php';
		$controller = new WP_REST_Help_Center_User_Fields();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-odie.php';
		$controller = new WP_REST_Help_Center_Odie();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-persisted-open-state.php';
		$controller = new WP_REST_Help_Center_Persisted_Open_State();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-email-support-enabled.php';
		$controller = new WP_REST_Help_Center_Email_Support_Enabled();
		$controller->register_rest_route();

		require_once __DIR__ . '/class-wp-rest-help-center-ticket-csat.php';
		$controller = new WP_REST_Help_Center_Ticket_CSAT();
		$controller->register_rest_route();
	}

	/**
	 * Returns true if the admin bar is set.
	 */
	public function is_admin_bar() {
		global $wp_admin_bar;
		return is_object( $wp_admin_bar );
	}

	/**
	 * Returns true if the current screen if the block editor.
	 */
	public function is_block_editor() {
		global $current_screen;

		if ( ! $current_screen ) {
			return false;
		}

		// widgets screen does have the block editor but also no Gutenberg top bar.
		return $current_screen->is_block_editor() && $current_screen->id !== 'widgets';
	}

	/**
	 * Returns true if the current screen is the woo commerce admin home page.
	 */
	private function is_wc_admin_home_page() {
		global $current_screen;
		return $current_screen && $current_screen->id === 'woocommerce_page_wc-admin';
	}

	/**
	 * Returns true if the current user is connected through Jetpack
	 */
	public function is_jetpack_disconnected() {
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
	 * Returns true if...
	 * 1. The current user can edit posts.
	 * 2. The current user is a member of the blog.
	 * 3. The current request is not in the admin.
	 * 4. The current request is not in the block editor.
	 *
	 * @return bool True if the this is being loaded on the frontend.
	 */
	public function is_loading_on_frontend() {
		$can_edit_posts = current_user_can( 'edit_posts' ) && is_user_member_of_blog();

		return ! is_admin() && ! $this->is_block_editor() && $can_edit_posts;
	}

	/**
	 * Returns the URL for the Help Center redirect.
	 * Used for the Help Center when disconnected.
	 */
	public function get_help_center_url() {
		$help_url = 'https://wordpress.com/help?help-center=home';

		if ( $this->is_jetpack_disconnected() || ( $this->is_loading_on_frontend() && ! $this->is_support_site ) ) {
			return $help_url;
		}

		return false;
	}

	/**
	 * Get the asset via file-system on wpcom and via network on Atomic sites.
	 *
	 * @param string $filepath The URL to download the asset file from.
	 */
	private static function get_assets_json( $filepath ) {
		$accessible_directly = file_exists( ABSPATH . '/' . $filepath );
		if ( $accessible_directly ) {
			return json_decode( file_get_contents( ABSPATH . $filepath ), true );
		}
		$request = wp_remote_get( 'https://' . $filepath );
		if ( is_wp_error( $request ) ) {
			return null;
		}
		return json_decode( wp_remote_retrieve_body( $request ), true );
	}

	/**
	 * Enqueue Help Center assets for the customizer.
	 */
	public function enqueue_customizer_scripts() {
		if ( $this->is_jetpack_disconnected() ) {
			$variant = 'wp-admin-disconnected';
		} else {
			$variant = 'customizer';
		}

		$cache_key  = 'help-center-asset-' . $variant . '.asset.json';
		$asset_file = get_transient( $cache_key );

		if ( ! $asset_file ) {
			$asset_file = self::get_assets_json( 'widgets.wp.com/help-center/help-center-' . $variant . '.asset.json' );
			if ( ! $asset_file ) {
				return;
			}
			set_transient( $cache_key, $asset_file, HOUR_IN_SECONDS );
		}

		// When the request is proxied, use a random cache buster as the version for easier debugging.
		$version = self::is_proxied() ? wp_rand() : $asset_file['version'];

		$this->enqueue_script( $variant, $asset_file['dependencies'], $version );
	}

	/**
	 * Add Help Center container div in customizer.
	 */
	public function add_help_center_container() {
		?>
		<div id="help-center-customizer"></div>
		<?php
	}

	/**
	 * Add icon to WP-ADMIN admin bar.
	 */
	public function enqueue_wp_admin_scripts() {
		if ( $this->is_wc_admin_home_page() ) {
			return;
		}

		require_once ABSPATH . 'wp-admin/includes/screen.php';

		$can_edit_posts = current_user_can( 'edit_posts' ) && is_user_member_of_blog();
		$is_p2          = str_contains( get_stylesheet(), 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( get_current_blog_id() );

		// We will show the help center icon in the admin bar when;
		// 1. On wp-admin
		// 2. On the front end of the site if the current user can edit posts
		// 3. On the front end of the site and the theme is not P2
		// 4. If it is the frontend we show the disconnected version of the help center.
		if ( ! is_admin() && ( ! $can_edit_posts || $is_p2 ) && ! $this->is_support_site ) {
			return;
		}

		// Do not load Help Center for logged-out users if we are not on support sites.
		if ( ! is_user_logged_in() && ! $this->is_support_site ) {
			return;
		}

		$suffix = $this->is_jetpack_disconnected() ? '-disconnected' : '';

		if ( $this->is_support_site ) {
			if ( ! is_user_logged_in() ) {
				$variant = 'logged-out';
			} else {
				$variant = ( $this->is_block_editor() ? 'gutenberg' : 'wp-admin' ) . $suffix;
			}
		} elseif ( $this->is_loading_on_frontend() ) {
			$variant = 'wp-admin-disconnected';
		} else {
			$variant = ( $this->is_block_editor() ? 'gutenberg' : 'wp-admin' ) . $suffix;
		}

		$cache_key  = 'help-center-asset-' . $variant . '.asset.json';
		$asset_file = get_transient( $cache_key );

		if ( ! $asset_file ) {
			$asset_file = self::get_assets_json( 'widgets.wp.com/help-center/help-center-' . $variant . '.asset.json' );
			if ( ! $asset_file ) {
				return;
			}
			set_transient( $cache_key, $asset_file, HOUR_IN_SECONDS );
		}

		// When the request is proxied, use a random cache buster as the version for easier debugging.
		$version = self::is_proxied() ? wp_rand() : $asset_file['version'];

		$this->enqueue_script( $variant, $asset_file['dependencies'], $version );
	}
}

add_action( 'init', array( __NAMESPACE__ . '\Help_Center', 'init' ) );
