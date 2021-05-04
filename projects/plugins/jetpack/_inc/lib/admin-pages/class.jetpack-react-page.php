<?php
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Status;

include_once( 'class.jetpack-admin-page.php' );

// Builds the landing page and its menu
class Jetpack_React_Page extends Jetpack_Admin_Page {

	protected $dont_show_if_not_active = false;

	protected $is_redirecting = false;

	function get_page_hook() {
		// Add the main admin Jetpack menu
		return add_menu_page( 'Jetpack', 'Jetpack', 'jetpack_admin_page', 'jetpack', array( $this, 'render' ), 'div', 3 );
	}

	function add_page_actions( $hook ) {
		/** This action is documented in class.jetpack.php */
		do_action( 'jetpack_admin_menu', $hook );

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
		if ( Jetpack::is_connection_ready() && ! Jetpack_Options::get_option( 'first_admin_view', false ) ) {
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
		if ( ( new Status() )->is_offline_mode() || Jetpack::is_connection_ready() ) {
			add_submenu_page( 'jetpack', __( 'Dashboard', 'jetpack' ), __( 'Dashboard', 'jetpack' ), 'jetpack_admin_page', 'jetpack#/dashboard', '__return_null' );
			remove_submenu_page( 'jetpack', 'jetpack' );
		}
	}

	/**
	 * If user is allowed to see the Jetpack Admin, add Settings sub-link.
	 *
	 * @since 4.3.0
	 * @since 9.7.0 If Connection does not have an owner, restrict it to admins
	 */
	function jetpack_add_settings_sub_nav_item() {
		if ( ! ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}
		if ( ( ( new Status() )->is_offline_mode() || Jetpack::is_connection_ready() ) && current_user_can( 'edit_posts' ) ) {
			add_submenu_page( 'jetpack', __( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'jetpack_admin_page', 'jetpack#/settings', '__return_null' );
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

	/**
	 * Custom menu order.
	 *
	 * @deprecated since 9.2.0
	 * @param array $menu_order Menu order.
	 * @return array
	 */
	function jetpack_menu_order( $menu_order ) {
		_deprecated_function( __METHOD__, 'jetpack-9.2' );

		return $menu_order;
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

		$status              = new Status();
		$is_offline_mode     = $status->is_offline_mode();
		$site_suffix         = $status->get_site_suffix();
		$script_deps_path    = JETPACK__PLUGIN_DIR . '_inc/build/admin.asset.php';
		$script_dependencies = array( 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		wp_enqueue_script(
			'react-plugin',
			plugins_url( '_inc/build/admin.js', JETPACK__PLUGIN_FILE ),
			$script_dependencies,
			JETPACK__VERSION,
			true
		);

		if ( ! $is_offline_mode && Jetpack::is_connection_ready() ) {
			// Required for Analytics.
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}

		wp_set_script_translations( 'react-plugin', 'jetpack' );

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'react-plugin', 'var Initial_State=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->get_initial_state() ) ) . '"));', 'before' );

		// This will set the default URL of the jp_redirects lib.
		wp_add_inline_script( 'react-plugin', 'var jetpack_redirects = { currentSiteRawUrl: "' . $site_suffix . '" };', 'before' );
	}

	function get_initial_state() {
		global $is_safari;

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

		/**
		 * Adds information to the `connectionStatus` API field that is unique to the Jetpack React dashboard.
		 */
		$connection_status = array(
			'isInIdentityCrisis' => Jetpack::validate_sync_error_idc_option(),
			'sandboxDomain'      => JETPACK__SANDBOX_DOMAIN,

			/**
			 * Filter to add connection errors
			 * Format: array( array( 'code' => '...', 'message' => '...', 'action' => '...' ), ... )
			 *
			 * @since 8.7.0
			 *
			 * @param array $errors Connection errors.
			 */
			'errors'             => apply_filters( 'react_connection_errors_initial_state', array() ),
		);

		$connection_status = array_merge( REST_Connector::connection_status( false ), $connection_status );

		return array(
			'WP_API_root'                 => esc_url_raw( rest_url() ),
			'WP_API_nonce'                => wp_create_nonce( 'wp_rest' ),
			'pluginBaseUrl'               => plugins_url( '', JETPACK__PLUGIN_FILE ),
			'connectionStatus'            => $connection_status,
			'connectUrl'                  => false == $current_user_data['isConnected'] // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				? Jetpack::init()->build_connect_url( true, false, false )
				: '',
			'dismissedNotices'            => $this->get_dismissed_jetpack_notices(),
			'isDevVersion'                => Jetpack::is_development_version(),
			'currentVersion'              => JETPACK__VERSION,
			'is_gutenberg_available'      => true,
			'getModules'                  => $modules,
			'rawUrl'                      => ( new Status() )->get_site_suffix(),
			'adminUrl'                    => esc_url( admin_url() ),
			'siteTitle'                   => (string) htmlspecialchars_decode( get_option( 'blogname' ), ENT_QUOTES ),
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
				'showRecommendations'        => Jetpack_Recommendations::is_enabled(),
				'isMultisite'                => is_multisite(),
				'dateFormat'                 => get_option( 'date_format' ),
			),
			'themeData'                   => array(
				'name'      => $current_theme->get( 'Name' ),
				'hasUpdate' => (bool) get_theme_update_available( $current_theme ),
				'support'   => array(
					'infinite-scroll' => current_theme_supports( 'infinite-scroll' ) || in_array( $current_theme->get_stylesheet(), $inf_scr_support_themes, true ),
				),
			),
			'jetpackStateNotices'         => array(
				'messageCode'      => Jetpack::state( 'message' ),
				'errorCode'        => Jetpack::state( 'error' ),
				'errorDescription' => Jetpack::state( 'error_description' ),
				'messageContent'   => Jetpack::state( 'display_update_modal' ) ? $this->get_update_modal_data() : null,
			),
			'tracksUserData'              => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'currentIp'                   => function_exists( 'jetpack_protect_get_ip' ) ? jetpack_protect_get_ip() : false,
			'lastPostUrl'                 => esc_url( $last_post ),
			'externalServicesConnectUrls' => $this->get_external_services_connect_urls(),
			'calypsoEnv'                  => Jetpack::get_calypso_env(),
			'products'                    => Jetpack::get_products_for_purchase(),
			'recommendationsStep'         => Jetpack_Core_Json_Api_Endpoints::get_recommendations_step()['step'],
			'isSafari'                    => $is_safari || User_Agent_Info::is_opera_desktop(), // @todo Rename isSafari everywhere.
			'doNotUseConnectionIframe'    => Constants::is_true( 'JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME' ),
			'licensing'                   => array(
				'error'           => Licensing::instance()->last_error(),
				'showLicensingUi' => Licensing::instance()->is_licensing_input_enabled(),
			),
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

	/**
	 * Returns the release post content and image data as an associative array.
	 * This data is used to create the update modal.
	 */
	public function get_update_modal_data() {
		$post_data = $this->get_release_post_data();

		if ( ! isset( $post_data['posts'][0] ) ) {
			return;
		}

		$post = $post_data['posts'][0];

		if ( empty( $post['content'] ) ) {
			return;
		}

		// This allows us to embed videopress videos into the release post.
		add_filter( 'wp_kses_allowed_html', array( $this, 'allow_post_embed_iframe' ), 10, 2 );
		$content = wp_kses_post( $post['content'] );
		remove_filter( 'wp_kses_allowed_html', array( $this, 'allow_post_embed_iframe' ), 10, 2 );

		$post_title = isset( $post['title'] ) ? $post['title'] : null;
		$title      = wp_kses( $post_title, array() );

		$post_thumbnail = isset( $post['post_thumbnail'] ) ? $post['post_thumbnail'] : null;
		if ( ! empty( $post_thumbnail ) ) {
			jetpack_require_lib( 'class.jetpack-photon-image' );
			$photon_image = new Jetpack_Photon_Image(
				array(
					'file'   => jetpack_photon_url( $post_thumbnail['URL'] ),
					'width'  => $post_thumbnail['width'],
					'height' => $post_thumbnail['height'],
				),
				$post_thumbnail['mime_type']
			);
			$photon_image->resize(
				array(
					'width'  => 600,
					'height' => null,
					'crop'   => false,
				)
			);
			$post_thumbnail_url = $photon_image->get_raw_filename();
		} else {
			$post_thumbnail_url = null;
		}

		$post_array = array(
			'release_post_content'        => $content,
			'release_post_featured_image' => $post_thumbnail_url,
			'release_post_title'          => $title,
		);

		return $post_array;
	}

	/**
	 * Temporarily allow post content to contain iframes, e.g. for videopress.
	 *
	 * @param string $tags    The tags.
	 * @param string $context The context.
	 */
	public function allow_post_embed_iframe( $tags, $context ) {
		if ( 'post' === $context ) {
			$tags['iframe'] = array(
				'src'             => true,
				'height'          => true,
				'width'           => true,
				'frameborder'     => true,
				'allowfullscreen' => true,
			);
		}

		return $tags;
	}

	/**
	 * Obtains the release post from the Jetpack release post blog. A release post will be displayed in the
	 * update modal when a post has a tag equal to the Jetpack version number.
	 *
	 * The response parameters for the post array can be found here:
	 * https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/posts/%24post_ID/#apidoc-response
	 *
	 * @return array|null Returns an associative array containing the release post data at index ['posts'][0].
	 *                    Returns null if the release post data is not available.
	 */
	private function get_release_post_data() {
		if ( Constants::is_defined( 'TESTING_IN_JETPACK' ) && Constants::get_constant( 'TESTING_IN_JETPACK' ) ) {
			return null;
		}

		$release_post_src = add_query_arg(
			array(
				'order_by' => 'date',
				'tag'      => JETPACK__VERSION,
				'number'   => '1',
			),
			'https://public-api.wordpress.com/rest/v1/sites/' . JETPACK__RELEASE_POST_BLOG_SLUG . '/posts'
		);

		$response = wp_remote_get( $release_post_src );

		if ( ! is_array( $response ) ) {
			return null;
		}

		return json_decode( wp_remote_retrieve_body( $response ), true );
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
	$jetpack_connection = new Connection_Manager( 'jetpack' );

	$current_user   = wp_get_current_user();
	$is_master_user = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
	$dotcom_data    = $jetpack_connection->get_connected_user_data();

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
		'isConnected' => $jetpack_connection->is_user_connected( $current_user->ID ),
		'isMaster'    => $is_master_user,
		'username'    => $current_user->user_login,
		'id'          => $current_user->ID,
		'wpcomUser'   => $dotcom_data,
		'gravatar'    => get_avatar_url( $current_user->ID, 64, 'mm', '', array( 'force_display' => true ) ),
		'permissions' => array(
			'admin_page'         => current_user_can( 'jetpack_admin_page' ),
			'connect'            => current_user_can( 'jetpack_connect' ),
			'connect_user'       => current_user_can( 'jetpack_connect_user' ),
			'disconnect'         => current_user_can( 'jetpack_disconnect' ),
			'manage_modules'     => current_user_can( 'jetpack_manage_modules' ),
			'network_admin'      => current_user_can( 'jetpack_network_admin_page' ),
			'network_sites_page' => current_user_can( 'jetpack_network_sites_page' ),
			'edit_posts'         => current_user_can( 'edit_posts' ),
			'publish_posts'      => current_user_can( 'publish_posts' ),
			'manage_options'     => current_user_can( 'manage_options' ),
			'view_stats'         => current_user_can( 'view_stats' ),
			'manage_plugins'     => current_user_can( 'install_plugins' )
									&& current_user_can( 'activate_plugins' )
									&& current_user_can( 'update_plugins' )
									&& current_user_can( 'delete_plugins' ),
		),
	);

	return $current_user_data;
}
