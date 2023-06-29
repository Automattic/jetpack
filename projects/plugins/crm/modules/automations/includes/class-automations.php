<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;


/**
 * Automation class
 */
class Automations {

	/**
	 * Extension settings key
	 *
	 * @var string
	 */
	public $config_key = 'automations';

	/**
	 * Extension name.
	 *
	 * @var string
	 */
	public $ext_name = 'Automations';

	/**
	 * Settings object
	 *
	 * @var \WHWPConfigExtensionsLib | null
	 */
	public $settings = null; 

	/**
	 * Show extension settings tab
	 *
	 * @var string
	 */
	public $settings_tab = true;

	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Slugs for internal pages
	 *
	 * @var array()
	 */
	public $slugs = array(
		// moved to core 'listview'                  => 'manage-automation', 
		// moved to core 'editor'                    => 'automation-editor',
		// moved to core 'settings'                  => 'automation'
	);

	/**
	 * URLs that this module uses
	 *
	 * @var array()
	 */
	public $urls = array(

	);

	/**
	 * Setup Automation
	 * Note: This will effectively fire after core settings and modules loaded on tail end of `init`
	 */
	public function __construct( ) {
		
		if ( $this->check_dependencies() ) {

			// Definitions
			$this->definitions();

			// Initialise Settings
			$this->init_settings();
			
			// Initialise Features
			$this->init_features();

			// Run migrations (if any)
			$this->run_migrations();

			// Initialise Hooks
			$this->init_hooks();

			// Autoload page AJAX
			$this->load_ajax();

			// Register frontend/backend styles and scripts
			$this->register_styles_scripts();
		}
	}


	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Automation Module is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Automation_Module main instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}


	/**
	 * Define any key vars.
	 */
	private function definitions(){
		define( 'JPCRM_AUTOMATION_ROOT_PATH', plugin_dir_path( JPCRM_AUTOMATION_ROOT_FILE ) );
	}


	/**
	 *
	 * Checks dependencies
	 *
	 * @return bool
	 *
	 */
	public function check_dependencies() {

		global $zbs;

		$core_reqs = array(
			'req_core_ver' => $zbs->version,
			'req_DAL_ver'  => '3.0',
		);

		$meets_all_reqs = $zbs->dependency_checker->check_core_reqs(
			$this->ext_name,
			$core_reqs
		);

		if ( $meets_all_reqs ) {
			return true;
		}
		return false;
	}


	/**
	 * Initialise Settings
	 */
	private function init_settings( ) {
		
		$this->settings = new \WHWPConfigExtensionsLib( $this->config_key, $this->default_settings() );

	}

	/**
	 * Retrieve Settings
	 */
	public function get_settings( ) {
		
		return $this->settings->getAll();

	}

	/**
	 * Initialise Hooks
	 */
	private function init_hooks( ) {

		// Add settings tab
		add_filter( 'zbs_settings_tabs', array( $this, 'add_settings_tab' ) );

		// Adds Tools menu subitem
		add_filter( 'zbs-tools-menu', array( $this, 'add_tools_menu_sub_item_link' ) );
		// Learn menu
		add_action( 'wp_after_admin_bar_render', array( $this, 'render_learn_menu'), 12 );
		// Admin menu
		add_filter( 'zbs_menu_wpmenu', array( $this, 'add_wp_pages' ), 10, 1 );

		// filter for `zbsLink()` (effects list view links etc.)
		add_filter( 'jpcrm_link_out', array( $this, 'jpcrm_link_out_filter' ), 10, 1 );
	}
	
	/**
	 * Initialise Features
	 */
	private function init_features( ) {

		global $zbs;


		// Settings page
		if ( jpcrm_is_settings_page() ) {

			#TBC
			$this->load_admin_page( 'settings/router' );

		}

		// Listview page
		if ( $this->is_listview_page() ) {
			$this->load_admin_page( 'listview/main' );
		}

		// Editor page
		if ( $this->is_editor_page() ) {
			$this->load_admin_page( 'editor/main' );
		}

	}


	/**
	 * Autoload page AJAX
	 */
	private function load_ajax( ) {

		$admin_page_directories = jpcrm_get_directories( JPCRM_AUTOMATION_ROOT_PATH . 'admin' );

		if ( is_array( $admin_page_directories ) ){

			foreach ( $admin_page_directories as $directory ){

				$files = scandir( JPCRM_AUTOMATION_ROOT_PATH . 'admin/' . $directory );
				
				if ( is_array( $files ) ){

					foreach ( $files as $file ){

						// find files `*.ajax.*`
						if ( strrpos( $file, '.ajax.' ) > 0 ){

							// load it
							require_once( JPCRM_AUTOMATION_ROOT_PATH . 'admin/' . $directory . '/' . $file );

						}

					}

				}


			}

		}

	}


	/**
	 * Register styles & scripts
	 *  (previously on `init`)
	 */
	public function register_styles_scripts() {
		
	}


	/**
	 * Filter settings tabs, adding this extension
	 *  (previously `load_settings_tab`)
	 *
	 * @param array $tabs
	 */
	public function add_settings_tab( $tabs ){

		global $zbs;
		
		// Append our tab if enabled
		if ( $this->settings_tab ) {

			$main_tab                     = $zbs->slugs['settings'];
			$tabs[ $main_tab ]            = array(
				'name' => $this->ext_name,
				'ico' => '',
				'submenu' => array(),
			);
			
		}

		return $tabs;

	}


	/**
	 * Return default settings
	 */
	public function default_settings() {

		return require( JPCRM_AUTOMATION_ROOT_PATH . 'includes/jpcrm-automations-default-settings.php' );

	}


	/**
	 * Main page addition
	 */
	function add_wp_pages( $menu_array=array() ) {

		global $zbs;

		// add a submenu item to main CRM menu
		$menu_array['jpcrm']['subitems']['automations'] = array(
			'title'      => 'Automation',
			'url'        => $zbs->slugs['automations-listview'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 12,
			'wpposition' => 12,
			'callback'   => 'jpcrm_automations_render_listview_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_automations_listview_styles_scripts' ),
		);

		// add editor page under hidden menu
		$menu_array['hidden']['subitems']['automations_editor'] = array(
			'title'      => 'Edit Automation',
			'url'        => $zbs->slugs['automations-editor'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 12,
			'wpposition' => 12,
			'callback'   => 'jpcrm_automations_render_editor_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_automations_editor_styles_scripts' ),
		);

		return $menu_array;

	} 


	/**
	 * Adds Tools menu sub item
	 */
	public function add_tools_menu_sub_item_link( $menu_items ) {

		global $zbs;
		
		$menu_items[] = '<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['automations-listview'] ) . '" class="item"><i class="cogs icon"></i> Automations</a>';
		
		return $menu_items;

	}


	/**
	 * Output learn menu
	 */
	public function render_learn_menu(){

		if ( $this->is_listview_page() ){

			global $zbs;

			#TBC
			$learn_content = '<p>' . __( "Here you can view your Automations.", 'zerobscrm' ) . '</p>';
			
			// output
			$zbs->learn_menu->render_generic_learn_menu(
				'Automations',
				'',
				'',
				true,
				__( "Create automatic workflows around CRM events.", "zerobscrm" ),
				$learn_content,
				$zbs->urls['kb-automations'],
				false,
				false,
				''
			);

		}

		if ( $this->is_editor_page() ){

			global $zbs;

			#TBC
			$learn_content = '<p>' . __( "Here you can set up Automations.", 'zerobscrm' ) . '</p>';
			
			// output
			$zbs->learn_menu->render_generic_learn_menu(
				'Automation Editor',
				'',
				'',
				true,
				__( "Create automatic workflows around CRM events.", "zerobscrm" ),
				$learn_content,
				$zbs->urls['kb-automations'],
				false,
				false,
				''
			);


		}
	}


	/**
	 * Load the file for a given page
	 *
	 * @param string $page_name (e.g. `settings/main`)
	 */
	public function load_admin_page( $page_name ) {
		jpcrm_load_admin_page( $page_name, JPCRM_AUTOMATION_ROOT_PATH );
	}


	/**
	 * Returns bool: is the loading page, our list view page
	 *
	 * @return bool editor page
	 */
	public function is_listview_page() {

		global $zbs;

		$page = '';

		if ( isset( $_GET['page'] ) ) {
			$page = sanitize_text_field( $_GET['page'] );
		}

		if ( $page == $zbs->slugs['automations-listview'] ) {
			return true;
		}

		return false;
	}


	/**
	 * Returns bool: is the loading page, our editor page
	 *
	 * @return bool editor page
	 */
	public function is_editor_page() {

		global $zbs;

		$page = '';

		if ( isset( $_GET['page'] ) ) {
			$page = sanitize_text_field( $_GET['page'] );
		}

		if ( $page == $zbs->slugs['automations-editor'] ) {
			return true;
		}
		return false;
	}


	/**
	 * Returns bool: true if the page is zbs-add-edit
	 *
	 * @return bool 
	 */
	public function is_add_edit_page() {

		global $zbs;

		$page = '';

		if ( isset( $_GET['page'] ) ){
			$page = sanitize_text_field( $_GET['page'] );
		}

		// specifically segment add-edit
		$type = '';
		if ( isset( $_GET['zbstype'] ) ){
			$type = sanitize_text_field( $_GET['zbstype'] );
		}
		if ( $type !== 'segment' ){
			return false;
		}

		return $page == $zbs->slugs['add-edit'];
	}


	/**
	 * Retrieve Total number of automation (Used for system assistant job)
	 */
	public function get_automations_count( ) {
		//todo: Get the count of automations
		return 0;
	}

	/**
	 * Appends functionality to `zbsLink()`
	 * (effects list view links etc.)
	 */
	public function jpcrm_link_out_filter( $args ){

		global $zbs;

		if ( $args['type'] == 'automations' ){

			switch ( $args['key'] ){

				case 'create':
					return admin_url( 'admin.php?page=' . $zbs->slugs['automations-editor'] );
					break;

				case 'edit':
					return admin_url( 'admin.php?page=' . $zbs->slugs['automations-editor'] . '&id=' . $args['id'] );
					break;

				case 'default':
					return admin_url( 'admin.php?page=' . $zbs->slugs['automations-listview'] );
					break;


			}


		}

	}


	// ===============================================================================
	// =========== Automation Specific Migrations  ==================================

	/*
	* Migrations
	*/
	private function run_migrations(){

	}

	// ========= / Automation Specific Migrations  ==================================
	// ===============================================================================


}