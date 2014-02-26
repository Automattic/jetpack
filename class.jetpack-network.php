<?php

/**
 * Used to manage Jetpack installation on Multisite Network installs
 *
 * SINGLETON: To use call Jetpack_Network::init()
 *
 * DO NOT USE ANY STATIC METHODS IN THIS CLASS!!!!!!
 *
 * @todo Look through todos in Jetpack_Network
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
		'auto-connect'		=> 0,
		'sub-site-connection-override'	=> 1,
	//	'manage_auto_activated_modules' => 0,
	);

	/**
	 * Constructor
	 *
	 * @since 2.9
	 */
	private function __construct() {
		 require_once( ABSPATH . '/wp-admin/includes/plugin.php' ); // For the is_plugin... check
		/*
		 * Sanity check to ensure the install is Multisite and we
		 * are in Network Admin
		 */
		if (is_multisite() && is_network_admin()) {
			add_action('network_admin_menu', array($this, 'add_network_admin_menu'));
			add_action('network_admin_edit_jetpack-network-settings', array($this, 'save_network_settings_page'), 10, 0);
			add_action( 'admin_init', array ( $this,  'jetpack_sites_list' ) );
			add_filter( 'admin_body_class', array( $this, 'body_class' ) );
			add_filter( 'wpmu_blogs_columns', array( $this, 'add_jetpack_sites_column' ) );
			//add_action( 'manage_sites_custom_column', array( $this, 'render_jetpack_sites_column' ), 10, 2 );
			//add_action( 'manage_blogs_custom_column', array( $this, 'render_jetpack_sites_column' ), 10, 2 );
		}

		/*
		 * Things that should only run on multisite
		 */
		if( is_multisite()  && is_plugin_active_for_network( 'jetpack/jetpack.php' ) ) {
			add_action( 'wp_before_admin_bar_render', array( $this, 'add_to_menubar' ) );


			/*
			 * If admin wants to automagically register new sites set the hook here
			 *
			 * This is a hacky way because xmlrpc is not available on wpmu_new_blog
			 */
			if( $this->get_option( 'auto-connect' ) == 1 ) {
			//add_action( 'admin_init', array( $this, 'do_automatically_add_new_site' ) );
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
	 * @param array $modules
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
	 * Displays the Jetpack connection status on the Network Admin > Sites
	 * page.
	 *
	 * @param string $column_name
	 * @param int $blog_id
	 **/
	public function render_jetpack_sites_column( $column_name, $blog_id ) {
		if( 'jetpack_connection' != $column_name )
			return;
		
		$jp = Jetpack::init();

		switch_to_blog( $blog_id );
		if( $jp->is_active() ) {
		   // Build url for disconnecting 
			$url = $this->get_url( array(
			'name'		=> 'subsitedisconnect',
			'site_id'   => $blog_id,

			) );
			restore_current_blog();
			echo '<a href="' . $url . '">Disconnect</a>';
			return;
		}
		restore_current_blog();
		
		// Build URL for connecting
		$url = $this->get_url( array(
			'name'	=> 'subsiteregister',
			'site_id'	=> $blog_id,
		) );
		echo '<a href="' . $url . '">Connect</a>';
		return;
	}

	/**
	 * Add the column for Jetpack connection status to the
	 * Network Admin > Sites list
	 *
	 * @since 2.9
	 * @param array $columns
	 * @return array
	 **/
	public function add_jetpack_sites_column( $columns ) {
		$columns['jetpack_connection'] = __( 'Jetpack' );
		return $columns;
	}

	/**
	 * Registers new sites upon creation
	 *
	 * @since 2.9
	 * @uses wpmu_new_blog
	 * @param int $blog_id
	 **/
	public function do_automatically_add_new_site( $blog_id ) {
		$this->do_subsiteregister( $blog_id );
	}
	
	/**
	 * Adds .network-admin class to the body tag
	 * Helps distiguish network admin JP styles from regular site JP styles
	 *
	 * @since 2.9
	 */
	public function body_class( $classes ) {
		return 'network-admin';
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
		if (!self::$instance || !is_a(self::$instance, 'Jetpack_Network')) {
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
		if( !is_network_admin() ) return; // Only fire if in network admin

		$sites = $this->wp_get_sites();

		foreach( $sites AS $s ) {
		switch_to_blog( $s->blog_id );
		$plugins = get_option( 'active_plugins' );

		/*
		 * If this plugin was activated in the subsite individually
		 * we do not want to call disconnect. Plugins activated 
		 * individually (before network activation) stay activated
		 * when the network deactivation occurs
		 */
		if( !in_array( 'jetpack/jetpack.php', $plugins ) ) {
			Jetpack::disconnect();
		}
		}
		restore_current_blog();
	}

	/**
	 * Adds a link to the Jetpack Network Admin page in the netowrk admin menu bar.
	 *
	 * @since 2.9
	 **/
	 public function add_to_menubar () {
		global $wp_admin_bar;
		// Don't show for logged out users or single site mode.
		if ( ! is_user_logged_in() || ! is_multisite() )
		return;

		 $wp_admin_bar->add_node( array(
		'parent' => 'network-admin',
		'id'     => 'network-admin-jetpack',
		'title'  => __( 'Jetpack' ),
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
	 * @param Mixed $args 
	 * @return String
	 **/
	public function get_url( $args ) {
		$url = null; // Default url value

		if( is_string( $args ) ) 
		$name = $args;
		else
		$name = $args['name'];


		switch( $name ) {
		case 'subsiteregister':
			if( !isset( $args['site_id'] ) ) {
			break; // If there is not a site id present we cannot go further
			}
			$url = network_admin_url(
			'admin.php?page=jetpack&action=subsiteregister&site_id='
			. $args['site_id'] );
			break;

		case 'network_admin_page':
			$url = network_admin_url( 'admin.php?page=jetpack' );
			break;
		case 'subsitedisconnect':
			if( !isset( $args['site_id'] ) ) {
			break; // If there is not a site id present we cannot go further      
			}
			$url = network_admin_url(  
			'admin.php?page=jetpack&action=subsitedisconnect&site_id='   
			. $args['site_id'] ); 
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
		add_action( 'admin_print_styles', array( $this, 'network_admin_styles' ) );
		
		add_menu_page(__('Jetpack', 'jetpack'), __('Jetpack', 'jetpack'), 'read', 'jetpack', array($this, 'network_admin_page'), 'div', 3);
		add_submenu_page('jetpack', 'Jetpack Sites', 'Sites', 'manage_options', 'jetpack', array($this, 'network_admin_page'));
		add_submenu_page('jetpack', __('Settings', 'jetpack'), __('Settings', 'jetpack'), 'read', 'jetpack-settings', array($this, 'render_network_admin_settings_page'));
		
		/**
		 * As jetpack_register_genericons is by default fired off a hook,
		 * the hook may have already fired by this point.
		 * So, let's just trigger it manually.
		 */
		require_once( JETPACK__PLUGIN_DIR . '_inc/genericons.php' );
		jetpack_register_genericons();

		if ( ! wp_style_is( 'jetpack-icons', 'registered' ) )
			wp_register_style( 'jetpack-icons', plugins_url( '_inc/jetpack-icons/jetpack-icons.css', __FILE__ ), false, JETPACK__VERSION );
		
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_menu_css' ) );
	}
	
	 /**
	 * Adds JP menu icon
	 *
	 * @since 2.9
	 **/
	 function admin_menu_css() {
		// Make sure we're working off a clean version.
		include( ABSPATH . WPINC . '/version.php' );
		if ( version_compare( $wp_version, '3.8-alpha', '>=' ) ) {
			wp_enqueue_style( 'jetpack-icons' );
			$css = "
				#toplevel_page_jetpack .wp-menu-image:before {
					font-family: 'Jetpack' !important;
					content: '\\e600';
				}
				#menu-posts-feedback .wp-menu-image:before {
					font-family: dashicons !important;
					content: '\\f175';
				}
				#adminmenu #menu-posts-feedback div.wp-menu-image {
					background: none !important;
					background-repeat: no-repeat;
				}";
		} else {
			$css = "
				#toplevel_page_jetpack .wp-menu-image {
					background: url( " . plugins_url( '_inc/images/menuicon-sprite.png', __FILE__ ) . " ) 0 90% no-repeat;
				}
				/* Retina Jetpack Menu Icon */
				@media  only screen and (-moz-min-device-pixel-ratio: 1.5),
						only screen and (-o-min-device-pixel-ratio: 3/2),
						only screen and (-webkit-min-device-pixel-ratio: 1.5),
						only screen and (min-device-pixel-ratio: 1.5) {
					#toplevel_page_jetpack .wp-menu-image {
						background: url( " . plugins_url( '_inc/images/menuicon-sprite-2x.png', __FILE__ ) . " ) 0 90% no-repeat;
						background-size:30px 64px;
					}
				}
				#toplevel_page_jetpack.current .wp-menu-image,
				#toplevel_page_jetpack.wp-has-current-submenu .wp-menu-image,
				#toplevel_page_jetpack:hover .wp-menu-image {
					background-position: top left;
				}";
		}
		wp_add_inline_style( 'wp-admin', $css );
	}

	/**
	 * Provides functionality for the Jetpack > Sites page. 
	 * Does not do the display!
	 *
	 * @since 2.9
	 */
	public function jetpack_sites_list() {
		$jp = Jetpack::init();

		if( isset( $_GET['action'] ) ) {
			switch( $_GET['action'] ) {
				case 'subsiteregister':
					/*
					 * @todo check_admin_referer( 'jetpack-subsite-register' );
					 */
					Jetpack::log( 'subsiteregister' );
					 
					// If !$_GET['site_id'] stop registration and error
					if( !isset( $_GET['site_id'] ) || empty( $_GET['site_id'] ) ) {
					   // Log error to state cookie for display later
					   /**
						* @todo Make state messages show on Jetpack NA pages
						**/
					   Jetpack::state( 'missing_site_id', 'Site ID must be provided to register a sub-site' );
						break;
					}

					// Send data to register endpoint and retrieve shadow blog details
					$result = $this->do_subsiteregister();
					$url = $this->get_url( 'network_admin_page' );
					if( is_wp_error( $result ) ) {		
						$url = add_query_arg( 'action', 'connection_failed', $url );
					} else {
						$url = add_query_arg( 'action', 'connected', $url );
					}
					
					wp_safe_redirect( $url );
					break;
				case 'subsitedisconnect':
					Jetpack::log( 'subsitedisconnect' );

					if( !isset( $_GET['site_id'] ) || empty( $_GET['site_id'] ) ) {    
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
		
		if( isset( $_GET['action'] ) && 'connected' == $_GET['action'] ) {
			$notice = 'Blog successfully connected';
		} else if( isset( $_GET['action'] ) && 'connection_failed' == $_GET['action'] )	{
			$notice = 'Blog connection <strong>failed</strong>';
		}

		require_once( 'views/admin/network-admin-alert.php' );
	}

	/**
	 * Disconnect functionality for an individual site
	 *
	 * @since 2.9
	 * @see Jetpack_Network::jetpack_sites_list()
	 */
	public function do_subsitedisconnect( $site_id = null ) {
		$site_id = ( is_null( $site_id ) ) ? $_GET['site_id']: $site_id;
		switch_to_blog( $site_id );
		Jetpack::disconnect();
		restore_current_blog();
	}

	/**
	 * Registers a subsite with the Jetpack servers
	 *
	 * @since 2.9
	 * @todo Break apart into easier to manage chunks that can be unit tested
	 * @see Jetpack_Network::jetpack_sites_list();
	 */
	public function do_subsiteregister( $site_id = null ) {
		$jp = Jetpack::init();

		// Figure out what site we are working on
		$site_id = ( is_null( $site_id ) ) ? $_GET['site_id']: $site_id; 

		// Build secrets to sent to wpcom for verification
		$secrets = $jp->generate_secrets();
		
		// Remote query timeout limit
		$timeout = $jp->get_remote_query_timeout_limit();

		// Get proof the wpcom server can trust you adding this site
		$network_admin_token = '';

		// The blog id on WordPress.com of the primary network site
		$network_wpcom_blog_id = Jetpack_Options::get_option( 'id' );

		/*
		 * Here we need to switch to the subsite
		 * For the registration process we really only hijack how it
		 * works for an idividual site and pass in some extra data here
		 */
		switch_to_blog( $site_id );
	   
		// Save the secrets in the subsite so when the wpcom server does a pingback it
		// will be able to validate the connection
		Jetpack_Options::update_option( 'register', 
		$secrets[0] . ':' .$secrets[1]. ':' . $secrets[2] 
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
		$stat_id = $stat_options = isset($stats_options['blog_id']) ? $stats_options['blog_id'] : null;
		$args = array(
		'method'  => 'POST',
		'body'    => array(
			'network_url'     => $this->get_url( 'network_admin_page' ),
			'network_wpcom_blog_id' => $network_wpcom_blog_id, 
			'siteurl'         => site_url(),
			'home'            => home_url(),
			'gmt_offset'      => $gmt_offset,
			'timezone_string' => (string) get_option( 'timezone_string' ),
			'site_name'       => (string) get_option( 'blogname' ),
			'secret_1'        => $secrets[0],
			'secret_2'        => $secrets[1],
			'site_lang'       => get_locale(),
			'timeout'         => $timeout,
			'stats_id'        => $stat_id, // Is this still required?
			'user_id'		  => get_current_user_id(),
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
		
		if( is_wp_error( $valid_response ) || !$valid_response ) {
			return $valid_response;
		}
		
		// Grab the response values to work with
		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );
		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;
		
		if ( empty( $json->jetpack_secret ) || ! is_string( $json->jetpack_secret ) )
		return new Jetpack_Error( 'jetpack_secret', '', $code );

		if ( isset( $json->jetpack_public ) ) {
		$jetpack_public = (int) $json->jetpack_public;
		} else {
		$jetpack_public = false;
		}
		
		Jetpack_Options::update_options(
		array(
			'id'         => (int)    $json->jetpack_id,
			'blog_token' => (string) $json->jetpack_secret,
			'public'     => $jetpack_public,
		)
		);
		
		/*
		 * Update the subsiteregister method on wpcom so that it also sends back the
		 * token in this same request
		 */
		$is_master_user = ! Jetpack::is_active(); 
		Jetpack::update_user_token( 
			get_current_user_id(), 
			sprintf( 
			'%s.%d', 
			$json->token->secret, 
			get_current_user_id() 
			), 
			$is_master_user 
		);

		Jetpack::activate_default_modules();

		restore_current_blog();
	}

	/**
	 * Add css styles needed for the Network Admin area
	 **/
	function network_admin_styles() {
		global $wp_styles;
		wp_enqueue_style( 'jetpack', plugins_url( '_inc/jetpack.css', __FILE__ ), false, JETPACK__VERSION . '-20121016' );
		$wp_styles->add_data( 'jetpack', 'rtl', true );
	}

	/**
	 * Handles the displaying of all sites on the network that are
	 * dis/connected to Jetpack
	 *
	 * @since 2.9
	 * @see Jetpack_Network::jetpack_sites_list()
	 */
	function network_admin_page() {
		$this->network_admin_page_header();
	
			$jp = Jetpack::init();

			// We should be, but ensure we are on the main blog
			switch_to_blog(1);
			$main_active = $jp->is_active(); 
			restore_current_blog();
	
			/*
			 * Ensure the main blog is connected as all other subsite blog 
			 * connections will feed off this one
			 */
			if( !$main_active ) { 
				$url = $this->get_url( array(
				'name'      => 'subsiteregister', 
				'site_id'   => 1,
				) );
				$url = $jp->build_connect_url();
				require_once( 'views/admin/must-connect-main-blog.php' );
				return;
			}
			
			require_once( 'class.jetpack-network-sites-list-table.php' );
			$myListTable = new Jetpack_Network_Sites_List_Table();
			echo '<div class="wrap"><h2>' . __('Sites', 'jetpack') . '</h2>';
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

		$is_connected      = Jetpack::is_active();
		$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
		$is_user_connected = $user_token && ! is_wp_error( $user_token );
		$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );

		require_once( 'views/admin/network-admin-header.php' );
	}
	
	/**
	 * Stylized JP footer formatting
	 *
	 * @since 2.9
	 */
	function network_admin_page_footer() {
		require_once( 'views/admin/network-admin-footer.php' );
	}

	/**
	 * Fires when the Jetpack > Settings page is saved.
	 *
	 * @since 2.9
	 */
	public function save_network_settings_page() {

		/*
		 * Fields
		 *
		 * auto-connect - Checkbox for global Jetpack connection
		 * sub-site-connection-override - Allow sub-site admins to (dis)reconnect with their own Jetpack account
		 */
		$auto_connect = 0;
		if( isset( $_POST['auto-connect'] ) )
			$auto_connect = 1;


		$sub_site_connection_override = 0;
		if( isset( $_POST['sub-site-connection-override'] ) )
			$sub_site_connection_override = 1;
/* Remove the toggles for 2.9, re-evaluate how they're done and added for a 3.0 release. They don't feel quite right yet.
		$manage_auto_activated_modules = 0;
		if( isset( $_POST['manage_auto_activated_modules'] ) )
			$manage_auto_activated_modules = 1;

		$modules = array();
		if( isset( $_POST['modules'] ) )
			$modules = $_POST['modules'];
*/
		$data = array(
			'auto-connect'			=> $auto_connect,
			'sub-site-connection-override'	=> $sub_site_connection_override,
	//		'manage_auto_activated_modules'	=> $manage_auto_activated_modules,
	//		'modules'						=> $modules,
		);

		update_site_option( $this->settings_name, $data );
		wp_safe_redirect(add_query_arg(array('page' => 'jetpack-settings', 'updated' => 'true'), network_admin_url('admin.php')));
		exit();
	}

	public function render_network_admin_settings_page() {
		$this->network_admin_page_header();
		$options = wp_parse_args( get_site_option( $this->settings_name ), $this->setting_defaults );

		$modules = array();
		$module_slugs = Jetpack::get_available_modules();
		foreach ( $module_slugs as $slug ) {
			$module = Jetpack::get_module( $slug );
			$module['module'] = $slug;
			$modules[] = $module;
		}
		
		usort( $modules, array( 'Jetpack', 'sort_modules' ) );

		if( !isset( $options['modules'] ) ) {
			$options['modules'] = $modules;
		}
		
		require( 'views/admin/network-settings.php' );
		$this->network_admin_page_footer();
	}

	/**
	 * Updates a site wide option
	 *
	 * @since 2.9
	 * @param string $key
	 * @param mixed $value
	 * @return boolean
	 **/
	public function update_option( $key, $value ) {
		$options = get_site_option( $this->settings_name );
		$options[$key] = $value;
		return update_site_option( $this->settings_name, $options );
	}

	/**
	 * Retrieves a site wide option
	 *
	 * @since 2.9
	 * @param string $name - Name of the option in the database
	 **/
	public function get_option( $name ) {
		$options = get_site_option( $this->settings_name );

		$options = wp_parse_args( $options, $this->setting_defaults );

		if( !isset( $options[$name] ) )
			$options[$name] = null;

		return $options[$name];
	}

	/**
	 * Return an array of sites on the specified network. If no network is specified,
	 * return all sites, regardless of network.
	 *
	 *
	 * @todo REMOVE THIS FUNCTION! This function is moving to core. Use that one in favor of this. WordPress::wp_get_sites(). http://codex.wordpress.org/Function_Reference/wp_get_sites NOTE, This returns an array instead of stdClass. Be sure to update class.network-sites-list-table.php
	 * @since 2.9
	 * @deprecated 2.4.5
	 * @param array|string $args Optional. Specify the status of the sites to return.
	 * @return array An array of site data
	 */
	public function wp_get_sites($args = array()) {
		global $wpdb;

		if (wp_is_large_network())
			return;

		$defaults = array('network_id' => $wpdb->siteid);

		$args = wp_parse_args($args, $defaults);

		$query = "SELECT * FROM $wpdb->blogs WHERE 1=1 ";

		if (isset($args['network_id']) && ( is_array($args['network_id']) || is_numeric($args['network_id']) )) {
			$network_ids = array_map('intval', (array) $args['network_id']);
			$network_ids = implode(',', $network_ids);
			$query .= "AND site_id IN ($network_ids) ";
		}

		if (isset($args['public']))
			$query .= $wpdb->prepare("AND public = %s ", $args['public']);

		if (isset($args['archived']))
			$query .= $wpdb->prepare("AND archived = %s ", $args['archived']);

		if (isset($args['mature']))
			$query .= $wpdb->prepare("AND mature = %s ", $args['mature']);

		if (isset($args['spam']))
			$query .= $wpdb->prepare("AND spam = %s ", $args['spam']);

		if (isset($args['deleted']))
			$query .= $wpdb->prepare("AND deleted = %s ", $args['deleted']);

		$key = 'wp_get_sites:' . md5($query);

		if (!$site_results = wp_cache_get($key, 'site-id-cache')) {
			$site_results = (array) $wpdb->get_results($query);
			wp_cache_set($key, $site_results, 'site-id-cache');
		}

		return $site_results;
	}
}

// end class
