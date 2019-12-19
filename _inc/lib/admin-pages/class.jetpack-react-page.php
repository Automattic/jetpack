<?php
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Partner;

include_once( 'class.jetpack-admin-page.php' );

// Builds the landing page and its menu
class Jetpack_React_Page extends Jetpack_Admin_Page {

	protected $dont_show_if_not_active = false;

	protected $is_redirecting = false;

	function get_page_hook() {
		// Add the main admin Jetpack menu
		return add_menu_page( 'Jetpack', 'Jetpack', 'jetpack_admin_page', 'jetpack', array( $this, 'render' ), 'div' );
	}

	function add_page_actions( $hook ) {
		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_admin_menu', $hook );

		// Place the Jetpack menu item on top and others in the order they appear
		add_filter( 'custom_menu_order',         '__return_true' );
		add_filter( 'menu_order',                array( $this, 'jetpack_menu_order' ) );

		if ( ! isset( $_GET['page'] ) || 'jetpack' !== $_GET['page'] ) {
			return; // No need to handle the fallback redirection if we are not on the Jetpack page
		}

		// Adding a redirect meta tag if the REST API is disabled
		if ( ! $this->is_rest_api_enabled() ) {
			$this->is_redirecting = true;
			add_action( 'admin_head', array( $this, 'add_fallback_head_meta' ) );
		}

		// Adding a redirect meta tag wrapped in noscript tags for all browsers in case they have JavaScript disabled
		add_action( 'admin_head', array( $this, 'add_noscript_head_meta' ) );

		// If this is the first time the user is viewing the admin, don't show JITMs.
		// This filter is added just in time because this function is called on admin_menu
		// and JITMs are initialized on admin_init
		if ( Jetpack::is_active() && ! Jetpack_Options::get_option( 'first_admin_view', false ) ) {
			Jetpack_Options::update_option( 'first_admin_view', true );
			add_filter( 'jetpack_just_in_time_msgs', '__return_false' );
		}
	}

	/**
	 * Add Jetpack Dashboard sub-link and point it to AAG if the user can view stats, manage modules or if Protect is active.
	 *
	 * Works in Dev Mode or when user is connected.
	 *
	 * @since 4.3.0
	 */
	function jetpack_add_dashboard_sub_nav_item() {
		if ( ( new Status() )->is_development_mode() || Jetpack::is_active() ) {
			global $submenu;
			if ( current_user_can( 'jetpack_admin_page' ) ) {
				$submenu['jetpack'][] = array( __( 'Dashboard', 'jetpack' ), 'jetpack_admin_page', 'admin.php?page=jetpack#/dashboard' );
			}
		}
	}

	/**
	 * If user is allowed to see the Jetpack Admin, add Settings sub-link.
	 *
	 * @since 4.3.0
	 */
	function jetpack_add_settings_sub_nav_item() {
		if ( ( ( new Status() )->is_development_mode() || Jetpack::is_active() ) && current_user_can( 'jetpack_admin_page' ) && current_user_can( 'edit_posts' ) ) {
			global $submenu;
			$submenu['jetpack'][] = array( __( 'Settings', 'jetpack' ), 'jetpack_admin_page', 'admin.php?page=jetpack#/settings' );
		}
	}

	function add_fallback_head_meta() {
		echo '<meta http-equiv="refresh" content="0; url=?page=jetpack_modules">';
	}

	function add_noscript_head_meta() {
		echo '<noscript>';
		$this->add_fallback_head_meta();
		echo '</noscript>';
	}

	function jetpack_menu_order( $menu_order ) {
		$jp_menu_order = array();

		foreach ( $menu_order as $index => $item ) {
			if ( $item != 'jetpack' )
				$jp_menu_order[] = $item;

			if ( $index == 0 )
				$jp_menu_order[] = 'jetpack';
		}

		return $jp_menu_order;
	}

	function page_render() {
		/** This action is already documented in views/admin/admin-page.php */
		do_action( 'jetpack_notices' );

		// Try fetching by patch
		$static_html = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static.html' );

		if ( false === $static_html ) {

			// If we still have nothing, display an error
			echo '<p>';
			esc_html_e( 'Error fetching static.html. Try running: ', 'jetpack' );
			echo '<code>yarn distclean && yarn build</code>';
			echo '</p>';
		} else {

			// We got the static.html so let's display it
			echo $static_html;
			self::render_footer();

		}
	}

	/**
	 * Gets array of any Jetpack notices that have been dismissed.
	 *
	 * @since 4.0.1
	 * @return mixed|void
	 */
	function get_dismissed_jetpack_notices() {
		$jetpack_dismissed_notices = get_option( 'jetpack_dismissed_notices', array() );
		/**
		 * Array of notices that have been dismissed.
		 *
		 * @since 4.0.1
		 *
		 * @param array $jetpack_dismissed_notices If empty, will not show any Jetpack notices.
		 */
		$dismissed_notices = apply_filters( 'jetpack_dismissed_notices', $jetpack_dismissed_notices );
		return $dismissed_notices;
	}

	function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	function page_admin_scripts() {
		if ( $this->is_redirecting ) {
			return; // No need for scripts on a fallback page
		}

		$is_development_mode = ( new Status() )->is_development_mode();
		$script_deps_path    = JETPACK__PLUGIN_DIR . '_inc/build/admin.asset.php';
		$script_dependencies = array( 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		if ( Jetpack::is_active() || $is_development_mode ) {
			wp_enqueue_script(
				'react-plugin',
				plugins_url( '_inc/build/admin.js', JETPACK__PLUGIN_FILE ),
				$script_dependencies,
				JETPACK__VERSION,
				true
			);
		}


		if ( ! $is_development_mode && Jetpack::is_active() ) {
			// Required for Analytics.
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}

		// Add objects to be passed to the initial state of the app.
		wp_localize_script( 'react-plugin', 'Initial_State', $this->get_initial_state() );
	}

	function get_initial_state() {
		// Load API endpoint base classes and endpoints for getting the module list fed into the JS Admin Page
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-module-endpoints.php';
		$moduleListEndpoint = new Jetpack_Core_API_Module_List_Endpoint();
		$modules = $moduleListEndpoint->get_modules();

		// Preparing translated fields for JSON encoding by transforming all HTML entities to
		// respective characters.
		foreach( $modules as $slug => $data ) {
			$modules[ $slug ]['name'] = html_entity_decode( $data['name'] );
			$modules[ $slug ]['description'] = html_entity_decode( $data['description'] );
			$modules[ $slug ]['short_description'] = html_entity_decode( $data['short_description'] );
			$modules[ $slug ]['long_description'] = html_entity_decode( $data['long_description'] );
		}

		// Collecting roles that can view site stats.
		$stats_roles = array();
		$enabled_roles = function_exists( 'stats_get_option' ) ? stats_get_option( 'roles' ) : array( 'administrator' );

		if ( ! function_exists( 'get_editable_roles' ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
		}
		foreach ( get_editable_roles() as $slug => $role ) {
			$stats_roles[ $slug ] = array(
				'name' => translate_user_role( $role['name'] ),
				'canView' => is_array( $enabled_roles ) ? in_array( $slug, $enabled_roles, true ) : false,
			);
		}

		// Get information about current theme.
		$current_theme = wp_get_theme();

		// Get all themes that Infinite Scroll provides support for natively.
		$inf_scr_support_themes = array();
		foreach ( Jetpack::glob_php( JETPACK__PLUGIN_DIR . 'modules/infinite-scroll/themes' ) as $path ) {
			if ( is_readable( $path ) ) {
				$inf_scr_support_themes[] = basename( $path, '.php' );
			}
		}

		// Get last post, to build the link to Customizer in the Related Posts module.
		$last_post = get_posts( array( 'posts_per_page' => 1 ) );
		$last_post = isset( $last_post[0] ) && $last_post[0] instanceof WP_Post
			? get_permalink( $last_post[0]->ID )
			: get_home_url();

		$current_user_data = jetpack_current_user_data();

		return array(
			'WP_API_root'                 => esc_url_raw( rest_url() ),
			'WP_API_nonce'                => wp_create_nonce( 'wp_rest' ),
			'pluginBaseUrl'               => plugins_url( '', JETPACK__PLUGIN_FILE ),
			'connectionStatus'            => array(
				'isActive'           => Jetpack::is_active(),
				'isStaging'          => Jetpack::is_staging_site(),
				'devMode'            => array(
					'isActive' => ( new Status() )->is_development_mode(),
					'constant' => defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG,
					'url'      => site_url() && false === strpos( site_url(), '.' ),
					'filter'   => apply_filters( 'jetpack_development_mode', false ),
				),
				'isPublic'           => '1' == get_option( 'blog_public' ), // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				'isInIdentityCrisis' => Jetpack::validate_sync_error_idc_option(),
				'sandboxDomain'      => JETPACK__SANDBOX_DOMAIN,
			),
			'connectUrl'                  => false == $current_user_data['isConnected'] // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				? Jetpack::init()->build_connect_url( true, false, false )
				: '',
			'dismissedNotices'            => $this->get_dismissed_jetpack_notices(),
			'isDevVersion'                => Jetpack::is_development_version(),
			'currentVersion'              => JETPACK__VERSION,
			'is_gutenberg_available'      => true,
			'getModules'                  => $modules,
			'rawUrl'                      => Jetpack::build_raw_urls( get_home_url() ),
			'adminUrl'                    => esc_url( admin_url() ),
			'stats'                       => array(
				// data is populated asynchronously on page load.
				'data'  => array(
					'general' => false,
					'day'     => false,
					'week'    => false,
					'month'   => false,
				),
				'roles' => $stats_roles,
			),
			'aff'                         => Partner::init()->get_partner_code( Partner::AFFILIATE_CODE ),
			'partnerSubsidiaryId'         => Partner::init()->get_partner_code( Partner::SUBSIDIARY_CODE ),
			'settings'                    => $this->get_flattened_settings( $modules ),
			'userData'                    => array(
				'currentUser' => $current_user_data,
			),
			'siteData'                    => array(
				'icon'                       => has_site_icon()
					? apply_filters( 'jetpack_photon_url', get_site_icon_url(), array( 'w' => 64 ) )
					: '',
				'siteVisibleToSearchEngines' => '1' == get_option( 'blog_public' ), // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				/**
				 * Whether promotions are visible or not.
				 *
				 * @since 4.8.0
				 *
				 * @param bool $are_promotions_active Status of promotions visibility. True by default.
				 */
				'showPromotions'             => apply_filters( 'jetpack_show_promotions', true ),
				'isAtomicSite'               => jetpack_is_atomic_site(),
				'plan'                       => Jetpack_Plan::get(),
				'showBackups'                => Jetpack::show_backups_ui(),
				'isMultisite'                => is_multisite(),
			),
			'themeData'                   => array(
				'name'      => $current_theme->get( 'Name' ),
				'hasUpdate' => (bool) get_theme_update_available( $current_theme ),
				'support'   => array(
					'infinite-scroll' => current_theme_supports( 'infinite-scroll' ) || in_array( $current_theme->get_stylesheet(), $inf_scr_support_themes, true ),
				),
			),
			'locale'                      => Jetpack::get_i18n_data_json(),
			'localeSlug'                  => join( '-', explode( '_', get_user_locale() ) ),
			'jetpackStateNotices'         => array(
				'messageCode'      => Jetpack::state( 'message' ),
				'errorCode'        => Jetpack::state( 'error' ),
				'errorDescription' => Jetpack::state( 'error_description' ),
			),
			'tracksUserData'              => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'currentIp'                   => function_exists( 'jetpack_protect_get_ip' ) ? jetpack_protect_get_ip() : false,
			'lastPostUrl'                 => esc_url( $last_post ),
			'externalServicesConnectUrls' => $this->get_external_services_connect_urls(),
			'calypsoEnv'                  => Jetpack::get_calypso_env(),
		);
	}

	function get_external_services_connect_urls() {
		$connect_urls = array();
		jetpack_require_lib( 'class.jetpack-keyring-service-helper' );
		foreach ( Jetpack_Keyring_Service_Helper::$SERVICES as $service_name => $service_info ) {
			$connect_urls[ $service_name ] = Jetpack_Keyring_Service_Helper::connect_url( $service_name, $service_info[ 'for' ] );
		}
		return $connect_urls;
	}

	/**
	 * Returns an array of modules and settings both as first class members of the object.
	 *
	 * @param array $modules the result of an API request to get all modules.
	 *
	 * @return array flattened settings with modules.
	 */
	function get_flattened_settings( $modules ) {
		$core_api_endpoint = new Jetpack_Core_API_Data();
		$settings = $core_api_endpoint->get_all_options();
		return $settings->data;
	}
}

/**
 * Gather data about the current user.
 *
 * @since 4.1.0
 *
 * @return array
 */
function jetpack_current_user_data() {
	$current_user   = wp_get_current_user();
	$is_master_user = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
	$dotcom_data    = Jetpack::get_connected_user_data();

	// Add connected user gravatar to the returned dotcom_data.
	$dotcom_data['avatar'] = ( ! empty( $dotcom_data['email'] ) ?
		get_avatar_url(
			$dotcom_data['email'],
			array(
				'size'    => 64,
				'default' => 'mysteryman',
			)
		)
		: false );

	$current_user_data = array(
		'isConnected' => Jetpack::is_user_connected( $current_user->ID ),
		'isMaster'    => $is_master_user,
		'username'    => $current_user->user_login,
		'id'          => $current_user->ID,
		'wpcomUser'   => $dotcom_data,
		'gravatar'    => get_avatar( $current_user->ID, 40, 'mm', '', array( 'force_display' => true ) ),
		'permissions' => array(
			'admin_page'         => current_user_can( 'jetpack_admin_page' ),
			'connect'            => current_user_can( 'jetpack_connect' ),
			'disconnect'         => current_user_can( 'jetpack_disconnect' ),
			'manage_modules'     => current_user_can( 'jetpack_manage_modules' ),
			'network_admin'      => current_user_can( 'jetpack_network_admin_page' ),
			'network_sites_page' => current_user_can( 'jetpack_network_sites_page' ),
			'edit_posts'         => current_user_can( 'edit_posts' ),
			'publish_posts'      => current_user_can( 'publish_posts' ),
			'manage_options'     => current_user_can( 'manage_options' ),
			'view_stats'		 => current_user_can( 'view_stats' ),
			'manage_plugins'	 => current_user_can( 'install_plugins' )
									&& current_user_can( 'activate_plugins' )
									&& current_user_can( 'update_plugins' )
									&& current_user_can( 'delete_plugins' ),
		),
	);

	return $current_user_data;
}
