<?php

/**
 * Used to manage Jetpack installation on Multisite Network installs
 *
 * SINGLETON: To use call Jetpack_Network::init()
 *
 * DO NOT USE ANY STATIC METHODS IN THIS CLASS!!!!!!
 *
 * @since 2.9
 */
class Jetpack_Network {

	/**
	 * Holds a static copy of Jetpack_Network for the singleton
	 *
	 * @since 2.9
	 * @var Jetpack_Network
	 */
	private static $instance = null;

	/**
	 * Name of the network wide settings
	 *
	 * @since 2.9
	 * @var string
	 */
	private $settings_name = 'jetpack-network-settings';

	/**
	 * Defaults for settings found on the Jetpack > Settings page
	 *
	 * @since 2.9
	 * @var array
	 */
	private $setting_defaults = array(
		'auto-connect'                  => 0,
		'sub-site-connection-override'  => 1,
		//'manage_auto_activated_modules' => 0,
	);

	/**
	 * Constructor
	 *
	 * @since 2.9
	 */
	private function __construct() {
		require_once( ABSPATH . '/wp-admin/includes/plugin.php' ); // For the is_plugin... check
		require_once( JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php' ); // For managing the global whitelist
		/*
		 * Sanity check to ensure the install is Multisite and we
		 * are in Network Admin
		 */
		if ( is_multisite() && is_network_admin() ) {
			add_action( 'network_admin_menu', array( $this, 'add_network_admin_menu' ) );
			add_action( 'network_admin_edit_jetpack-network-settings', array( $this, 'save_network_settings_page' ), 10, 0 );
			add_filter( 'admin_body_class', array( $this, 'body_class' ) );

			if ( isset( $_GET['page'] ) && 'jetpack' == $_GET['page'] ) {
				add_action( 'admin_init', array( $this, 'jetpack_sites_list' ) );
			}
		}

		/*
		 * Things that should only run on multisite
		 */
		if ( is_multisite() && is_plugin_active_for_network( 'jetpack/jetpack.php' ) ) {
			add_action( 'wp_before_admin_bar_render', array( $this, 'add_to_menubar' ) );

			/*
			 * If admin wants to automagically register new sites set the hook here
			 *
			 * This is a hacky way because xmlrpc is not available on wpmu_new_blog
			 */
			if ( $this->get_option( 'auto-connect' ) == 1 ) {
				add_action( 'wpmu_new_blog', array( $this, 'do_automatically_add_new_site' ) );
			}
		}

		// Remove the toggles for 2.9, re-evaluate how they're done and added for a 3.0 release. They don't feel quite right yet.
		// add_filter( 'jetpack_get_default_modules', array( $this, 'set_auto_activated_modules' ) );
	}

	/**
	 * Sets which modules get activated by default on subsite connection.
	 * Modules can be set in Network Admin > Jetpack > Settings
	 *
	 * @since 2.9
	 *
	 * @param array $modules
	 *
	 * @return array
	 **/
	public function set_auto_activated_modules( $modules ) {
		return $modules;

		/* Remove the toggles for 2.9, re-evaluate how they're done and added for a 3.0 release. They don't feel quite right yet.
		if( 1 == $this->get_option( 'manage_auto_activated_modules' ) ) {
			return (array) $this->get_option( 'modules' );
		} else {
			return $modules;
		}
		*/
	}

	/**
	 * Registers new sites upon creation
	 *
	 * @since 2.9
	 * @uses  wpmu_new_blog
	 *
	 * @param int $blog_id
	 **/
	public function do_automatically_add_new_site( $blog_id ) {
		$this->do_subsiteregister( $blog_id );
	}

	/**
	 * Adds .network-admin class to the body tag
	 * Helps distinguish network admin JP styles from regular site JP styles
	 *
	 * @since 2.9
	 */
	public function body_class( $classes ) {
		return trim( $classes ) . ' network-admin ';
	}

	/**
	 * Provides access to an instance of Jetpack_Network
	 *
	 * This is how the Jetpack_Network object should *always* be accessed
	 *
	 * @since 2.9
	 * @return Jetpack_Network
	 */
	public static function init() {
		if ( ! self::$instance || ! is_a( self::$instance, 'Jetpack_Network' ) ) {
			self::$instance = new Jetpack_Network;
		}

		return self::$instance;
	}

	/**
	 * Registers the Multisite admin bar menu item shortcut.
	 * This shortcut helps users quickly and easily navigate to the Jetpack Network Admin
	 * menu from anywhere in their network.
	 *
	 * @since 2.9
	 */
	public function register_menubar() {
		add_action( 'wp_before_admin_bar_render', array( $this, 'add_to_menubar' ) );
	}

	/**
	 * Runs when Jetpack is deactivated from the network admin plugins menu.
	 * Each individual site will need to have Jetpack::disconnect called on it.
	 * Site that had Jetpack individually enabled will not be disconnected as
	 * on Multisite individually activated plugins are still activated when
	 * a plugin is deactivated network wide.
	 *
	 * @since 2.9
	 **/
	public function deactivate() {
		// Only fire if in network admin
		if ( ! is_network_admin() ) {
			return;
		}

		$sites = $this->wp_get_sites();

		foreach ( $sites as $s ) {
			switch_to_blog( $s->blog_id );
			$active_plugins = get_option( 'active_plugins' );

			/*
			 * If this plugin was activated in the subsite individually
			 * we do not want to call disconnect. Plugins activated
		 	 * individually (before network activation) stay activated
		 	 * when the network deactivation occurs
		 	 */
			if ( ! in_array( 'jetpack/jetpack.php', $active_plugins ) ) {
				Jetpack::disconnect();
			}
		}
		restore_current_blog();
	}

	/**
	 * Adds a link to the Jetpack Network Admin page in the network admin menu bar.
	 *
	 * @since 2.9
	 **/
	public function add_to_menubar() {
		global $wp_admin_bar;
		// Don't show for logged out users or single site mode.
		if ( ! is_user_logged_in() || ! is_multisite() ) {
			return;
		}

		$wp_admin_bar->add_node( array(
			'parent' => 'network-admin',
			'id'     => 'network-admin-jetpack',
			'title'  => __( 'Jetpack', 'jetpack' ),
			'href'   => $this->get_url( 'network_admin_page' ),
		) );
	}

	/**
	 * Returns various URL strings. Factory like
	 *
	 * $args can be a string or an array.
	 * If $args is an array there must be an element called name for the switch statement
	 *
	 * Currently supports:
	 * - subsiteregister: Pass array( 'name' => 'subsiteregister', 'site_id' => SITE_ID )
	 * - network_admin_page: Provides link to /wp-admin/network/JETPACK
	 * - subsitedisconnect: Pass array( 'name' => 'subsitedisconnect', 'site_id' => SITE_ID )
	 *
	 * @since 2.9
	 *
	 * @param Mixed $args
	 *
	 * @return String
	 **/
	public function get_url( $args ) {
		$url = null; // Default url value

		if ( is_string( $args ) ) {
			$name = $args;
		} else {
			$name = $args['name'];
		}

		switch ( $name ) {
			case 'subsiteregister':
				if ( ! isset( $args['site_id'] ) ) {
					break; // If there is not a site id present we cannot go further
				}
				$url = network_admin_url(
					'admin.php?page=jetpack&action=subsiteregister&site_id='
					. $args['site_id']
				);
				break;

			case 'network_admin_page':
				$url = network_admin_url( 'admin.php?page=jetpack' );
				break;

			case 'subsitedisconnect':
				if ( ! isset( $args['site_id'] ) ) {
					break; // If there is not a site id present we cannot go further
				}
				$url = network_admin_url(
					'admin.php?page=jetpack&action=subsitedisconnect&site_id='
					. $args['site_id']
				);
				break;
		}

		return $url;
	}

	/**
	 * Adds the Jetpack  menu item to the Network Admin area
	 *
	 * @since 2.9
	 */
	public function add_network_admin_menu() {
		add_menu_page( __( 'Jetpack', 'jetpack' ), __( 'Jetpack', 'jetpack' ), 'jetpack_network_admin_page', 'jetpack', array( $this, 'network_admin_page' ), 'div', 3 );
		add_submenu_page( 'jetpack', __( 'Jetpack Sites', 'jetpack' ), __( 'Sites', 'jetpack' ), 'jetpack_network_sites_page', 'jetpack', array( $this, 'network_admin_page' ) );
		add_submenu_page( 'jetpack', __( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'jetpack_network_settings_page', 'jetpack-settings', array( $this, 'render_network_admin_settings_page' ) );

		/**
		 * As jetpack_register_genericons is by default fired off a hook,
		 * the hook may have already fired by this point.
		 * So, let's just trigger it manually.
		 */
		require_once( JETPACK__PLUGIN_DIR . '_inc/genericons.php' );
		jetpack_register_genericons();

		if ( ! wp_style_is( 'jetpack-icons', 'registered' ) ) {
			wp_register_style( 'jetpack-icons', plugins_url( 'css/jetpack-icons.min.css', JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION );
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_menu_css' ) );
	}

	/**
	 * Adds JP menu icon
	 *
	 * @since 2.9
	 **/
	function admin_menu_css() {
		wp_enqueue_style( 'jetpack-icons' );
	}

	/**
	 * Provides functionality for the Jetpack > Sites page.
	 * Does not do the display!
	 *
	 * @since 2.9
	 */
	public function jetpack_sites_list() {
		Jetpack::init();

		if ( isset( $_GET['action'] ) ) {
			switch ( $_GET['action'] ) {
				case 'subsiteregister':
					/*
					 * @todo check_admin_referer( 'jetpack-subsite-register' );
					 */
					Jetpack::log( 'subsiteregister' );

					// If !$_GET['site_id'] stop registration and error
					if ( ! isset( $_GET['site_id'] ) || empty( $_GET['site_id'] ) ) {
						// Log error to state cookie for display later
						/**
						 * @todo Make state messages show on Jetpack NA pages
						 **/
						Jetpack::state( 'missing_site_id', 'Site ID must be provided to register a sub-site' );
						break;
					}

					// Send data to register endpoint and retrieve shadow blog details
					$result = $this->do_subsiteregister();
					$url    = $this->get_url( 'network_admin_page' );

					if ( is_wp_error( $result ) ) {
						$url = add_query_arg( 'action', 'connection_failed', $url );
					} else {
						$url = add_query_arg( 'action', 'connected', $url );
					}

					wp_safe_redirect( $url );
					break;

				case 'subsitedisconnect':
					Jetpack::log( 'subsitedisconnect' );

					if ( ! isset( $_GET['site_id'] ) || empty( $_GET['site_id'] ) ) {
						Jetpack::state( 'missing_site_id', 'Site ID must be provided to disconnect a sub-site' );
						break;
					}

					$this->do_subsitedisconnect();
					break;

				case 'connected':
				case 'connection_failed':
					add_action( 'jetpack_notices', array( $this, 'show_jetpack_notice' ) );
					break;
			}
		}
	}

	public function show_jetpack_notice() {
		if ( isset( $_GET['action'] ) && 'connected' == $_GET['action'] ) {
			$notice = __( 'Site successfully connected.', 'jetpack' );
		} else if ( isset( $_GET['action'] ) && 'connection_failed' == $_GET['action'] ) {
			$notice = __( 'Site connection <strong>failed</strong>', 'jetpack' );
		}

		Jetpack::init()->load_view( 'admin/network-admin-alert.php', array( 'notice' => $notice ) );
	}

	/**
	 * Disconnect functionality for an individual site
	 *
	 * @since 2.9
	 * @see   Jetpack_Network::jetpack_sites_list()
	 */
	public function do_subsitedisconnect( $site_id = null ) {
		if ( ! current_user_can( 'jetpack_disconnect' ) ) {
			return;
		}
		$site_id = ( is_null( $site_id ) ) ? $_GET['site_id'] : $site_id;
		switch_to_blog( $site_id );
		Jetpack::disconnect();
		restore_current_blog();
	}

	/**
	 * Registers a subsite with the Jetpack servers
	 *
	 * @since 2.9
	 * @todo  Break apart into easier to manage chunks that can be unit tested
	 * @see   Jetpack_Network::jetpack_sites_list();
	 */
	public function do_subsiteregister( $site_id = null ) {
		if ( ! current_user_can( 'jetpack_disconnect' ) ) {
			return;
		}

		if ( Jetpack::is_development_mode() ) {
			return;
		}

		$jp = Jetpack::init();

		// Figure out what site we are working on
		$site_id = ( is_null( $site_id ) ) ? $_GET['site_id'] : $site_id;

		// Build secrets to sent to wpcom for verification
		$secrets = $jp->generate_secrets();

		// Remote query timeout limit
		$timeout = $jp->get_remote_query_timeout_limit();

		// The blog id on WordPress.com of the primary network site
		$network_wpcom_blog_id = Jetpack_Options::get_option( 'id' );

		/*
		 * Here we need to switch to the subsite
		 * For the registration process we really only hijack how it
		 * works for an individual site and pass in some extra data here
		 */
		switch_to_blog( $site_id );

		// Save the secrets in the subsite so when the wpcom server does a pingback it
		// will be able to validate the connection
		Jetpack_Options::update_option( 'register',
			$secrets[0] . ':' . $secrets[1] . ':' . $secrets[2]
		);

		// Gra info for gmt offset
		$gmt_offset = get_option( 'gmt_offset' );
		if ( ! $gmt_offset ) {
			$gmt_offset = 0;
		}

		/*
		 * Get the stats_option option from the db.
		 * It looks like the server strips this out so maybe it is not necessary?
		 * Does it match the Jetpack site with the old stats plugin id?
		 *
		 * @todo Find out if sending the stats_id is necessary
		 */
		$stat_options = get_option( 'stats_options' );
		$stat_id = $stat_options = isset( $stats_options['blog_id'] ) ? $stats_options['blog_id'] : null;

		$args = array(
			'method'  => 'POST',
			'body'    => array(
				'network_url'           => $this->get_url( 'network_admin_page' ),
				'network_wpcom_blog_id' => $network_wpcom_blog_id,
				'siteurl'               => site_url(),
				'home'                  => home_url(),
				'gmt_offset'            => $gmt_offset,
				'timezone_string'       => (string) get_option( 'timezone_string' ),
				'site_name'             => (string) get_option( 'blogname' ),
				'secret_1'              => $secrets[0],
				'secret_2'              => $secrets[1],
				'site_lang'             => get_locale(),
				'timeout'               => $timeout,
				'stats_id'              => $stat_id, // Is this still required?
				'user_id'               => get_current_user_id(),
			),
			'headers' => array(
				'Accept' => 'application/json',
			),
			'timeout' => $timeout,
		);

		// Attempt to retrieve shadow blog details
		$response = Jetpack_Client::_wp_remote_request(
			Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'subsiteregister' ) ), $args, true
		);

		/*
		 * $response should either be invalid or contain:
		 * - jetpack_id	=> id
		 * - jetpack_secret => blog_token
		 * - jetpack_public
		 *
		 * Store the wpcom site details
		 */
		$valid_response = $jp->validate_remote_register_response( $response );

		if ( is_wp_error( $valid_response ) || ! $valid_response ) {
			restore_current_blog();
			return $valid_response;
		}

		// Grab the response values to work with
		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );
		if ( $entity ) {
			$json = json_decode( $entity );
		} else {
			$json = false;
		}

		if ( empty( $json->jetpack_secret ) || ! is_string( $json->jetpack_secret ) ) {
			restore_current_blog();
			return new Jetpack_Error( 'jetpack_secret', '', $code );
		}

		if ( isset( $json->jetpack_public ) ) {
			$jetpack_public = (int) $json->jetpack_public;
		} else {
			$jetpack_public = false;
		}

		Jetpack_Options::update_options( array(
			'id'         => (int) $json->jetpack_id,
			'blog_token' => (string) $json->jetpack_secret,
			'public'     => $jetpack_public,
		) );

		/*
		 * Update the subsiteregister method on wpcom so that it also sends back the
		 * token in this same request
		 */
		$is_master_user = ! Jetpack::is_active();
		Jetpack::update_user_token(
			get_current_user_id(),
			sprintf( '%s.%d', $json->token->secret, get_current_user_id() ),
			$is_master_user
		);

		Jetpack::activate_default_modules();

		restore_current_blog();
	}

	/**
	 * Handles the displaying of all sites on the network that are
	 * dis/connected to Jetpack
	 *
	 * @since 2.9
	 * @see   Jetpack_Network::jetpack_sites_list()
	 */
	function network_admin_page() {
		global $current_site;
		$this->network_admin_page_header();

		$jp = Jetpack::init();

		// We should be, but ensure we are on the main blog
		switch_to_blog( $current_site->blog_id );
		$main_active = $jp->is_active();
		restore_current_blog();

		// If we are in dev mode, just show the notice and bail
		if ( Jetpack::is_development_mode() ) {
			Jetpack::show_development_mode_notice();
			return;
		}

		/*
		 * Ensure the main blog is connected as all other subsite blog
		 * connections will feed off this one
		 */
		if ( ! $main_active ) {
			$url  = $this->get_url( array(
				'name'    => 'subsiteregister',
				'site_id' => 1,
			) );
			$data = array( 'url' => $jp->build_connect_url() );
			Jetpack::init()->load_view( 'admin/must-connect-main-blog.php', $data );

			return;
		}

		require_once( 'class.jetpack-network-sites-list-table.php' );
		$myListTable = new Jetpack_Network_Sites_List_Table();
		echo '<div class="wrap"><h2>' . __( 'Sites', 'jetpack' ) . '</h2>';
		echo '<form method="post">';
		$myListTable->prepare_items();
		$myListTable->display();
		echo '</form></div>';

		$this->network_admin_page_footer();
	}

	/**
	 * Stylized JP header formatting
	 *
	 * @since 2.9
	 */
	function network_admin_page_header() {
		global $current_user;

		$is_connected = Jetpack::is_active();

		$data = array(
			'is_connected' => $is_connected
		);
		Jetpack::init()->load_view( 'admin/network-admin-header.php', $data );
	}

	/**
	 * Stylized JP footer formatting
	 *
	 * @since 2.9
	 */
	function network_admin_page_footer() {
		Jetpack::init()->load_view( 'admin/network-admin-footer.php' );
	}

	/**
	 * Fires when the Jetpack > Settings page is saved.
	 *
	 * @since 2.9
	 */
	public function save_network_settings_page() {

		if ( ! wp_verify_nonce( $_POST['_wpnonce'], 'jetpack-network-settings' ) ) {
			// no nonce, push back to settings page
			wp_safe_redirect(
				add_query_arg(
					array( 'page' => 'jetpack-settings' ),
					network_admin_url( 'admin.php' )
				)
			);
			exit();
		}

		// try to save the Protect whitelist before anything else, since that action can result in errors
		$whitelist = str_replace( ' ', '', $_POST['global-whitelist'] );
		$whitelist = explode( PHP_EOL, $whitelist );
		$result    = jetpack_protect_save_whitelist( $whitelist, $global = true );
		if ( is_wp_error( $result ) ) {
			wp_safe_redirect(
				add_query_arg(
					array( 'page' => 'jetpack-settings', 'error' => 'jetpack_protect_whitelist' ),
					network_admin_url( 'admin.php' )
				)
			);
			exit();
		}

		/*
		 * Fields
		 *
		 * auto-connect - Checkbox for global Jetpack connection
		 * sub-site-connection-override - Allow sub-site admins to (dis)reconnect with their own Jetpack account
		 */
		$auto_connect = 0;
		if ( isset( $_POST['auto-connect'] ) ) {
			$auto_connect = 1;
		}

		$sub_site_connection_override = 0;
		if ( isset( $_POST['sub-site-connection-override'] ) ) {
			$sub_site_connection_override = 1;
		}

		/* Remove the toggles for 2.9, re-evaluate how they're done and added for a 3.0 release. They don't feel quite right yet.
		$manage_auto_activated_modules = 0;
		if ( isset( $_POST['manage_auto_activated_modules'] ) ) {
			$manage_auto_activated_modules = 1;
		}

		$modules = array();
		if ( isset( $_POST['modules'] ) ) {
			$modules = $_POST['modules'];
		}
		*/

		$data = array(
			'auto-connect'                  => $auto_connect,
			'sub-site-connection-override'  => $sub_site_connection_override,
			//'manage_auto_activated_modules' => $manage_auto_activated_modules,
			//'modules'                       => $modules,
		);

		update_site_option( $this->settings_name, $data );
		wp_safe_redirect(
			add_query_arg(
				array( 'page' => 'jetpack-settings', 'updated' => 'true' ),
				network_admin_url( 'admin.php' )
			)
		);
		exit();
	}

	public function render_network_admin_settings_page() {
		$this->network_admin_page_header();
		$options = wp_parse_args( get_site_option( $this->settings_name ), $this->setting_defaults );

		$modules = array();
		$module_slugs = Jetpack::get_available_modules();
		foreach ( $module_slugs as $slug ) {
			$module           = Jetpack::get_module( $slug );
			$module['module'] = $slug;
			$modules[]        = $module;
		}

		usort( $modules, array( 'Jetpack', 'sort_modules' ) );

		if ( ! isset( $options['modules'] ) ) {
			$options['modules'] = $modules;
		}

		$data = array(
			'modules' => $modules,
			'options' => $options,
			'jetpack_protect_whitelist' => jetpack_protect_format_whitelist(),
		);

		Jetpack::init()->load_view( 'admin/network-settings.php', $data );
		$this->network_admin_page_footer();
	}

	/**
	 * Updates a site wide option
	 *
	 * @since 2.9
	 *
	 * @param string $key
	 * @param mixed  $value
	 *
	 * @return boolean
	 **/
	public function update_option( $key, $value ) {
		$options  = get_site_option( $this->settings_name, $this->setting_defaults );
		$options[ $key ] = $value;

		return update_site_option( $this->settings_name, $options );
	}

	/**
	 * Retrieves a site wide option
	 *
	 * @since 2.9
	 *
	 * @param string $name - Name of the option in the database
	 **/
	public function get_option( $name ) {
		$options = get_site_option( $this->settings_name, $this->setting_defaults );
		$options = wp_parse_args( $options, $this->setting_defaults );

		if ( ! isset( $options[ $name ] ) ) {
			$options[ $name ] = null;
		}

		return $options[ $name ];
	}

	/**
	 * Return an array of sites on the specified network. If no network is specified,
	 * return all sites, regardless of network.
	 *
	 * @todo REMOVE THIS FUNCTION! This function is moving to core. Use that one in favor of this. WordPress::wp_get_sites(). http://codex.wordpress.org/Function_Reference/wp_get_sites NOTE, This returns an array instead of stdClass. Be sure to update class.network-sites-list-table.php
	 * @since 2.9
	 * @deprecated 2.4.5
	 *
	 * @param array|string $args Optional. Specify the status of the sites to return.
	 *
	 * @return array An array of site data
	 */
	public function wp_get_sites( $args = array() ) {
		global $wpdb;

		if ( wp_is_large_network() ) {
			return;
		}

		$defaults = array( 'network_id' => $wpdb->siteid );
		$args     = wp_parse_args( $args, $defaults );
		$query    = "SELECT * FROM $wpdb->blogs WHERE 1=1 ";

		if ( isset( $args['network_id'] ) && ( is_array( $args['network_id'] ) || is_numeric( $args['network_id'] ) ) ) {
			$network_ids = array_map( 'intval', (array) $args['network_id'] );
			$network_ids = implode( ',', $network_ids );
			$query .= "AND site_id IN ($network_ids) ";
		}

		if ( isset( $args['public'] ) ) {
			$query .= $wpdb->prepare( "AND public = %s ", $args['public'] );
		}

		if ( isset( $args['archived'] ) ) {
			$query .= $wpdb->prepare( "AND archived = %s ", $args['archived'] );
		}

		if ( isset( $args['mature'] ) ) {
			$query .= $wpdb->prepare( "AND mature = %s ", $args['mature'] );
		}

		if ( isset( $args['spam'] ) ) {
			$query .= $wpdb->prepare( "AND spam = %s ", $args['spam'] );
		}

		if ( isset( $args['deleted'] ) ) {
			$query .= $wpdb->prepare( "AND deleted = %s ", $args['deleted'] );
		}

		if ( isset( $args['exclude_blogs'] ) ) {
			$query .= "AND blog_id NOT IN (" . implode( ',', $args['exclude_blogs'] ) . ")";
		}

		$key = 'wp_get_sites:' . md5( $query );

		if ( ! $site_results = wp_cache_get( $key, 'site-id-cache' ) ) {
			$site_results = (array) $wpdb->get_results( $query );
			wp_cache_set( $key, $site_results, 'site-id-cache' );
		}

		return $site_results;
	}
}

// end class
