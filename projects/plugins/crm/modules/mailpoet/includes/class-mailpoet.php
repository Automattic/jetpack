<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

use MailPoet\Config\Changelog;
use MailPoet\DI\ContainerWrapper;
use MailPoet\Models\Segment;
use MailPoet\Models\Subscriber;
use MailPoet\Models\SubscriberSegment;
use MailPoet\Entities\subscriberEntity;
use MailPoet\Subscribers\SubscribersRepository;
use MailPoet\Subscribers\RequiredCustomFieldValidator;
use MailPoet\Subscribers\SubscriberCustomFieldEntity;
use MailPoet\Subscribers\Source;
use MailPoet\Util\Helpers;
use MailPoet\WP\Functions as WPFunctions;
use MailPoet\API\MP\v1\APIException;

/**
 * MailPoet class
 */
class Mailpoet {

	/**
	 * Extension settings key
	 *
	 * @var string
	 */
	public $config_key = 'mailpoet';

	/**
	 * Extension name.
	 *
	 * @var string
	 */
	public $ext_name = 'MailPoet Sync';

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
	 * Feature class object: Background Sync
	 *
	 * @var Mailpoet_Background_Sync | null
	 */
	public $background_sync = null;

	/**
	 * Feature class object: Contact Tabs
	 *
	 * @var Mailpoet_Contact_Tabs | null
	 */
	public $contact_tabs = null;

	/**
	 * Feature class object: MailPoet Admin UI modifications
	 *
	 * @var Mailpoet_Admin_Integration | null
	 */
	public $mailpoet_ui = null;

	/**
	 * Feature class object: Export CRM segment to MailPoet list class
	 *
	 * @var Mailpoet_Export_Segment_To_MailPoet | null
	 */
	public $mailpoet_export_segment = null;

	/**
	 * Feature class object: MailPoet Segment Conditions
	 *
	 * @var mailpoet_Segment_Conditions | null
	 */
	public $segment_conditions = null;

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
		'hub'                       => 'crm-mail-poet-hub', // note needs to match `$zbs->slugs['mailpoet'] and can't use `*mailpoet*` as the plugin inteferes with styles
		'settings'                  => 'mailpoet',
		'add-edit'                  => 'zbs-add-edit',
	);

	/**
	 * URLs that the MailPoet module uses
	 *
	 * @var array()
	 */
	public $urls = array(

		'install_mailpoet' => '/wp-admin/plugin-install.php?tab=plugin-information&plugin=mailpoet'

	);

	/**
	 * Setup MailPoet
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

			// Add Filter buttons
			$this->include_filter_buttons();

			// Autoload page AJAX
			$this->load_ajax();

			// Register frontend/backend styles and scripts
			$this->register_styles_scripts();

		}

	}


	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Mailpoet_Sync is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Mailpoet_Sync main instance
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

		// for now there is ONLY local, but precursors..
		define( 'JPCRM_MAILPOET_MODE_LOCAL', 0 );
		define( 'JPCRM_MAILPOET_MODE_API',   1 );

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
			'req_core_ver' => $zbs->version, // will match current core version
			'req_DAL_ver'  => '3.0',
		);
		$plugin_reqs = array(
			'name'    => 'MailPoet',
			'slug'    => 'mailpoet/mailpoet.php',
			'link'    => 'https://wordpress.org/plugins/mailpoet/',
			'kb_link' => $zbs->urls['kb-mailpoet'],
			'req_ver' => '3.103.0',
		);
		$meets_all_reqs = $zbs->dependency_checker->check_all_reqs(
			$this->ext_name,
			$core_reqs,
			$plugin_reqs
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

		// Menus:

		// Adds Tools menu subitem
		add_filter( 'zbs-tools-menu', array( $this, 'add_tools_menu_sub_item_link' ) );
		// Learn menu
		add_action( 'wp_after_admin_bar_render', array( $this, 'render_learn_menu'), 12 );
		// Admin menu
		add_filter( 'zbs_menu_wpmenu', array( $this, 'add_wp_pages' ), 10, 1 );


		// JPCRM effecting:

		// Add MailPoet related info to CRM external source infobox
		add_filter( 'zbs_external_source_infobox_line', array( $this, 'override_crm_external_source_infobox' ), 10, 2 );

		// Hook in to Contact, Invoice, and Transaction query generation and add the quickfilter
		add_filter( 'jpcrm_contact_query_quickfilter', array( $this, 'contact_query_quickfilter_addition' ), 10, 2 );

		// Hook in to new contact log creation and add string manipulation
		add_filter( 'jpcrm_new_contact_log', array( $this, 'new_contact_log_override' ), 10, 3 );

		// add a position to the MailPoet segment condition category positions array
		add_filter( 'jpcrm_segment_condition_category_positions', array( $this, 'add_segments_condition_category_positions' ) );

	}

	/**
	 * Initialise Features
	 */
	private function init_features( ) {

		global $zbs;

		// Contact Tabs
		if ( $zbs->isDAL2() && zeroBSCRM_is_customer_view_page() ){

			require_once JPCRM_MAILPOET_ROOT_PATH . 'includes/jpcrm-mailpoet-contact-tabs.php';
			$this->contact_tabs = Mailpoet_Contact_Tabs::instance();
			wp_enqueue_style( 'jpcrm-mailpoet-contact-tabs', plugins_url( '/css/jpcrm-mailpoet-contact-tabs.min.css', JPCRM_MAILPOET_ROOT_FILE ) );

		}

		// Settings page
		if ( jpcrm_is_settings_page() ) {

			$this->load_admin_page( 'settings/router' );

		}

		// Hub page
		if ( $this->is_hub_page() ) {

			$this->load_admin_page( 'mailpoet-hub/main' );

		}

		// Edit / Add page
		if ( $this->is_add_edit_page() ) {

			wp_enqueue_style( 'jpcrm-mailpoet-add-edit-page', plugins_url( '/css/jpcrm-mailpoet-add-edit-page'.wp_scripts_get_suffix().'.css', JPCRM_MAILPOET_ROOT_FILE ) );
			wp_enqueue_script('jpcrm-mailpoet-add-edit-page', plugins_url('/js/jpcrm-mailpoet-add-edit-page'.wp_scripts_get_suffix().'.js', JPCRM_MAILPOET_ROOT_FILE), array( 'jquery' ), $zbs->version);

		}

		// Background sync
		require_once JPCRM_MAILPOET_ROOT_PATH . 'includes/class-mailpoet-background-sync.php';
		$this->background_sync = Mailpoet_Background_Sync::instance();

		// MailPoet UI additions
		require_once JPCRM_MAILPOET_ROOT_PATH . 'includes/class-mailpoet-admin-integration.php';
		$this->mailpoet_ui = Mailpoet_Admin_Integration::instance();

		// MailPoet Export CRM Segment to MailPoet List
		require_once JPCRM_MAILPOET_ROOT_PATH . 'includes/class-mailpoet-export-segment-to-mailpoet.php';
		$this->mailpoet_export_segment = Mailpoet_Export_Segment_To_MailPoet::instance();

		// Segment conditions
		require_once( JPCRM_MAILPOET_ROOT_PATH . 'includes/class-mailpoet-segment-conditions.php' );
		$this->segment_conditions = MailPoet_Segment_Conditions::instance();

	}


	/**
	 * Autoload page AJAX
	 */
	private function load_ajax( ) {

		$admin_page_directories = jpcrm_get_directories( JPCRM_MAILPOET_ROOT_PATH . 'admin' );

		if ( is_array( $admin_page_directories ) ){

			foreach ( $admin_page_directories as $directory ){

				$files = scandir( JPCRM_MAILPOET_ROOT_PATH . 'admin/' . $directory );
				
				if ( is_array( $files ) ){

					foreach ( $files as $file ){

						// find files `*.ajax.*`
						if ( strrpos( $file, '.ajax.' ) > 0 ){

							// load it
							require_once( JPCRM_MAILPOET_ROOT_PATH . 'admin/' . $directory . '/' . $file );

						}

					}

				}


			}

		}

	}


	/**
	 * Include filter buttons
	 * (Note, requires `contact_query_quickfilter_addition()` to be hooked into `jpcrm_contact_query_quickfilter`)
	 */
	public function include_filter_buttons(){

		global $zbs, $zeroBSCRM_filterbuttons_customer;

		// Add 'is Mailpoet subscriber' filter button to 'all options' for contact
  		$zeroBSCRM_filterbuttons_customer['all']['mailpoet_subscriber'] = array( __( 'MailPoet', 'zero-bs-crm' ) );

  		// get current list view filters
        $custom_views = $zbs->settings->get( 'customviews2' );

  		// If we've only just activated MailPoet,
  		// we add the customer filter button to the users selected filters by default (once)
  		if ( !isset( $custom_views['customer_filters']['mailpoet_subscriber'] ) && !$this->settings->get( 'has_added_mailpoetfilter', false ) ){

  			// add in our filter
  			$custom_views['customer_filters']['mailpoet_subscriber'] = array( __( 'MailPoet', 'zero-bs-crm' ) );

  			// save
			$zbs->settings->update( 'customviews2', $custom_views );

			// flag so we don't keep re-adding if user removes from selection
  			$this->settings->update( 'has_added_mailpoetfilter', true );

  		}

	}


	/**
	 * Hook in to Contact query generation and add the quickfilter
	 * (Hooked into `jpcrm_contact_query_quickfilter`)
	 */
	public function contact_query_quickfilter_addition( $wheres, $quick_filter_key ) {

		global $ZBSCRM_t;

		// is a MailPoet subscriber? (Could be copied/generalised for other ext sources)
		if ( $quick_filter_key == 'mailpoet_subscriber' ){
	        $wheres['is_mailpoet_customer'] = array(
	            'ID','IN',
	            '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = " . ZBS_TYPE_CONTACT . " AND zbss_source = %s)",
	            array( 'mailpoet' )
	        );
	    }

	    return $wheres;
	}


	/**
	 * Hook in to new contact log creation and add string manipulation
	 * (Hooked into `jpcrm_new_contact_log`)
	 */
	public function new_contact_log_override( $note_long_description, $source_key, $uid ) {

        if ( $source_key == 'mailpoet' ){

            $note_long_description = __( 'Synchronised from MailPoet', 'zero-bs-crm' ) . '&nbsp;&nbsp;<i class="users icon"></i>';           

        }

	    return $note_long_description;
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
		
		// Append our tab if enabled
		if ( $this->settings_tab ) {

			$main_tab                     = $this->slugs['settings'];
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

		return require( JPCRM_MAILPOET_ROOT_PATH . 'includes/jpcrm-mailpoet-default-settings.php' );

	}


	/**
	 * Main page addition
	 */
	function add_wp_pages( $menu_array=array() ) {

		// add a submenu item to main CRM menu
		$menu_array['jpcrm']['subitems']['mailpoet'] = array(
			'title'      => 'MailPoet Sync',
			'url'        => $this->slugs['hub'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 11,
			'wpposition' => 11,
			'callback'   => 'jpcrm_mailpoet_render_hub_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_mailpoet_hub_page_styles_scripts' ),
		);

		return $menu_array;

	} 


	/**
	 * Adds Tools menu sub item
	 */
	public function add_tools_menu_sub_item_link( $menu_items ) {

		global $zbs;
		
		$menu_items[] = '<a href="' . zeroBSCRM_getAdminURL( $this->slugs['hub'] ) . '" class="item"><i class="users icon"></i> MailPoet Sync</a>';
		
		return $menu_items;

	}


	/**
	 * Output learn menu
	 */
	public function render_learn_menu(){

		if ( $this->is_hub_page() ){

			global $zbs;

			$learn_content = '<p>' . __( "Here you can import your MailPoet data.", 'zerobscrm' ) . '</p>';
			
			// output
			$zbs->learn_menu->render_generic_learn_menu(
				'MailPoet Sync',
				'',
				'',
				true,
				__( "Import MailPoet Subscribers", "zerobscrm" ),
				$learn_content,
				$zbs->urls['kb-mailpoet'],
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
	public function load_admin_page( $page_name ){
		
		jpcrm_load_admin_page( $page_name, JPCRM_MAILPOET_ROOT_PATH );

	}


	/**
	 * Append/override MailPoet related info to CRM external source infobox
	 *
	 * @param string $html
	 * @param array $external_source
	 */
	public function override_crm_external_source_infobox( $html, $external_source ) {

		global $zbs;
		
		if ( $external_source['source'] == 'mailpoet' ){

			// verify subscriber is still in MailPoet before showing a link:
			$potential_subscriber = $this->get_mailpoet_subscriber_by_subscriber_id( $external_source['unique_id'] );

			if ( $potential_subscriber ){

				// retrieve origin info (where available)
				/* Not in v1.0 of this module
				$origin_str = '';
				$origin_detail = $zbs->DAL->hydrate_origin( $external_source['origin'] );
				if ( is_array( $origin_detail ) && isset( $origin_detail['origin_type'] ) && $origin_detail['origin_type'] == 'domain' ){

					// clean the domain (at this point strip protocols)
					$clean_domain = $zbs->DAL->clean_external_source_domain_string( $origin_detail['origin'] );
					$origin_str = __( ' from ', 'zero-bs-crm' ) . '<span class="jpcrm-ext-source-domain">' . $clean_domain . '</span>';

				} */

				// adds button to subscriber page
				// e.g. http://july.local/wp-admin/admin.php?page=mailpoet-subscribers#/stats/1
				$mailpoet_stats_link = $this->get_mailpoet_sub_stats_link( $external_source['unique_id'] ); //admin_url( 'post.php?post=' . $external_source['unique_id'] . '&action=edit' );

				switch ( $external_source['objtype'] ){

					case ZBS_TYPE_CONTACT:

						$html = '<div class="jpcrm-ext-source-mailpoet-subscriber">' . sprintf( __( 'Subscriber ID #%s', 'zero-bs-crm' ), $external_source['unique_id'] ) . ' <a class="compact ui mini button right floated" href="' . esc_url( $mailpoet_stats_link ) . '" target="_blank">' . __( 'View Subscriber', 'zero-bs-crm' ) . '</a></div>';

						break;

				}

			} else {

				// probably has been deleted in MailPoet
				// (where user had a delete_action option of `none|add_note`)
				switch ( $external_source['objtype'] ){

					case ZBS_TYPE_CONTACT:

						$html = '<div class="jpcrm-ext-source-mailpoet-subscriber">' . sprintf( __( 'Subscriber ID #%s', 'zero-bs-crm' ), $external_source['unique_id'] ) . ' <span class="compact ui mini label right floated">' . __( 'Subscriber not found', 'zero-bs-crm' ) . '</span></div>';

						break;

				}

			}

		}

		return $html;

	}


	/**
	 * Returns the total number of mailpoet imported contacts present in CRM
	 */
	public function get_crm_mailpoet_contact_count() {

		global $zbs;

		return (int)$zbs->DAL->contacts->getContacts(
			array(
				'externalSource' => 'mailpoet',
				'count'          => true,
				'ignoreowner'    => true,
				)
			);

	}


	/**
	 * Returns bool: is the loading page, our hub page
	 *
	 * @return bool hub page
	 */
	public function is_hub_page(){

		$page = '';

		if ( isset( $_GET['page'] ) ){
			$page = sanitize_text_field( $_GET['page'] );
		}

		if ( $page == $this->slugs['hub'] ){

			return true;

		}

		return false;

	}

	/**
	 * Returns bool: true if the page is zbs-add-edit
	 *
	 * @return bool 
	 */
	public function is_add_edit_page(){

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

		return $page == $this->slugs['add-edit'];
	}



	/**
	 * Returns Summarised JPCRM MailPoet stats
	 * Ripe for expansion
	 *
	 * @return 
	 */
	public function get_jpcrm_mailpoet_latest_stats( ){

		return array(

			'subscribers_synced' => $this->get_crm_mailpoet_contact_count(),

		);

	}

	/**
	 * Returns link to MailPoet subscriber
	 *
	 * @param int $subscriber_id
	 * or
	 * @param string $email
	 *
	 * @return string URL
	 */
	public function get_mailpoet_sub_stats_link( $subscriber_id = false, $email = false ){

		global $zbs;

		// sits at /wp-admin/admin.php?page=mailpoet-subscribers#/stats/4
		$id = false;

		if ( $subscriber_id > 0 ){
			$id = $subscriber_id;
		} elseif ( !empty( $email ) ) {

			$id = $zbs->DAL->contacts->getContact( -1, array(
				'email'       => $email,
				'onlyID'      => true,
				'ignoreowner' => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )
			));

		}

		if ( $id ){

			return '/wp-admin/admin.php?page=mailpoet-subscribers#/stats/' . $id;

		}

		return '#';		
	}

	/**
	 * Returns link to MailPoet list page
	 *
	 * @param int $segment_id
	 *
	 * @return string URL
	 */
	public function get_mailpoet_list_subs_link( $segment_id ){

		// sits at /wp-admin/admin.php?page=mailpoet-segments#/edit/3

		return site_url( '/wp-admin/admin.php?page=mailpoet-segments#/edit/' . $segment_id );

	}

	/**
	 * Returns URL to hop to local Mailpoet wp-admin
	 *	 
	 * @return string URL
	 */
	public function get_local_mailpoet_admin_url( ){

		return site_url( '/wp-admin/admin.php?page=mailpoet-newsletters' );

	}

	/**
	 * Returns link to MailPoet subscribers page (filtered by tag)
	 *
	 * @param int $tag_id
	 *
	 * @return string URL
	 */
	public function get_mailpoet_list_tagged_link( $tag_id ){


		return site_url( '/wp-admin/admin.php?page=mailpoet-subscribers#/filter[tag=' . $tag_id . ']');
	}
	

	// ===============================================================================
	// =========== MailPoet DAL ======================================================


	/*
	* Retrieve MailPoet data on a subscriber (from their MAILPOET subscriber ID)
	*/
	public function get_mailpoet_subscriber_by_subscriber_id( $subscriber_id, $with_meta = false, $with_tags = false ){

		// currently there's no direct MailPoet API way of doing this
		// so here we use the subscriber ID (MP Unique ID) to find the contact via external source search
		// ... then use their main email.
		// ... this is flawed, because users can change emails, or use alias emails, 
		// ... but until MailPoet has a `getSubscriberByID()` endpoint...
		// gh-2565

		global $zbs;

		$potential_contact = $zbs->DAL->contacts->getContact( -1, array(

            'externalSource'    => 'mailpoet',
            'externalSourceUID' => $subscriber_id,

        ));

        if ( is_array( $potential_contact ) && isset( $potential_contact['email'] ) ){

        	return $this->get_mailpoet_subscriber_by_email( $potential_contact['email'], $with_meta, $with_tags );


        }

        return false;

	}

	/*
	* Retrieve MailPoet data on a subscriber
	*/
	public function get_mailpoet_subscriber_by_email( $email, $with_meta = false, $with_tags = false ){


		// API+API Method
		// https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/GetSubscriber.md
		if ( class_exists( \MailPoet\API\API::class ) ) {
		  
			// load api
		  	$mailpoet_api = \MailPoet\API\API::MP('v1');

		  	// attempt retrieval
			try {

				// basic retrieval 
				$subscriber = $mailpoet_api->getSubscriber( $email );
				$lists = $this->get_mailpoet_lists_summary();

				// hydrate subscriptions
				if ( is_array( $subscriber['subscriptions'] ) ){

					$full_subscriptions_array = array();
					foreach ( $subscriber['subscriptions'] as $sub ){						

						$new_sub = $sub;

						// find sub list
						foreach ( $lists as $list ){

							if ( $new_sub['segment_id'] == $list['id'] ){

								// add some useful attributes not present in raw subscriptions obj
								$new_sub['segment_name']        = $list['name'];
								$new_sub['segment_type']        = $list['type'];
								$new_sub['segment_description'] = $list['description'];

							}

						}

						$full_subscriptions_array[] = $new_sub;

					}

					$subscriber['subscriptions'] = $full_subscriptions_array;
				}

				return $subscriber;

			} catch (\Exception $e) {


			}

		}


		/* Bunch of ways could seemingly do this without API, tried the following with some luck,
		but API method above more reliable in this instance. Would need to further check with 
		MailPoet team if wanted to switch from API for one of these methods...

		// here's adirect call method
		$subscriber = Subscriber::findOne( $email )->asArray();		

		// or by MP id...
		$SubscribersRepository = ContainerWrapper::getInstance()->get(SubscribersRepository::class);
		$subscriberEntity = $SubscribersRepository->findOneById( 4 );

		// then see /mailpoet/lib/API/JSON/ResponseBuilders/SubscribersResponseBuilder.php Line 71
		// ... on how could 'build' $subscriberEntity into a more usable array

		// ... adding tags
		$subscriber_array['tags'] = array();
		if ( method_exists( $subscriber, 'getSubscriberTags' ) ){
			
			$subscriber_array['tags'] = $subscriber->getSubscriberTags();

		}

		return $subscriber_array;
		*/

	}


	
	
	/**
	 * Return an array of mailpoet lists which a contact is in
	 *
	 * @param strng $email
	 */
	public function get_mailpoet_lists_for_contact_from_email( $email ) {

		$subscriber = $this->get_mailpoet_subscriber_by_email( $email );

		// return just the lists (Segments in MP nomenclature)
		if ( is_array( $subscriber ) && isset( $subscriber['segments'] ) ){

			return $subscriber['segments'];

		}

		// ... actually we use `subscriptions` which amounts to the same thing
		if ( is_array( $subscriber ) && isset( $subscriber['subscriptions'] ) ){

			return $subscriber['subscriptions'];

		}

		return array();

	}


	/**
	* Retrieve MailPoet list summary data by name
	* (currently needs to retrieve all lists and enumerate)
	*/
	public function get_mailpoet_list_summary_by_name( $mailpoet_list_name = '' ){

		$lists = $this->get_mailpoet_lists_summary();
		if ( is_array( $lists ) ){

			foreach( $lists as $list ){

				if ( $list['name'] == $mailpoet_list_name ){

					return $list;
					
				}

			}

		}

		return false;

	}

	/**
	* Retrieve MailPoet lists summary data
	*/
	public function get_mailpoet_lists_summary( $keyed_by_mailpoet_segment_id = false ){

		// https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/GetLists.md
		if ( class_exists( \MailPoet\API\API::class ) ) {
		  
			// load api
		  	$mailpoet_api = \MailPoet\API\API::MP('v1');

		  	// attempt retrieval
			try {
				
				$list_of_lists = $mailpoet_api->getLists();

				if ( $keyed_by_mailpoet_segment_id ){

					$keyed_array_of_lists = array();
					foreach ( $list_of_lists as $list ){
						$keyed_array_of_lists[ $list['id'] ] = $list;
					}

					return $keyed_array_of_lists;

				}

				return $list_of_lists;

			} catch (\Exception $e) {


			}

		}

		return false;

	}


	/*
	* Retrieve an int count of all MailPoet subscribers
	*/
	public function get_all_mailpoet_subscribers_count(){

		return $this->get_all_mailpoet_subscribers( false, false, true );

	}


	/*
	* Retrieve MailPoet subscribers (all of them)
	* Wrapper for `get_mailpoet_subscribers()`
	*/
	public function get_all_mailpoet_subscribers( 
		$limit = 50, 
		$offset = 0, 
		$count = false, 
		$with_meta = false, 
		$with_tags = false 
	){

		return $this->get_mailpoet_subscribers(
			false,
			false,
			false,
			$limit,
			$offset,
			$count
		);

	}


	/*
	* Retrieve MailPoet subscribers
	* 
	* @param int $limit
	* @param int $offset
	* @param int $count
	* @param bool $with_meta
	* @param bool $with_tags (Tag support is very new in MailPoet, TBC)
	*/
	public function get_mailpoet_subscribers(
		$status = false,
		$list_id = false,
		$min_updated_at = false,
		$limit = 50,
		$offset = 0,
		$count = false,
		$with_meta = false,
		$with_tags = false
	){

		// https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/GetSubscribers.md
		// https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/GetSubscribersCount.md
		if ( class_exists( \MailPoet\API\API::class ) ) {
		  
			// load api
		  	$mailpoet_api = \MailPoet\API\API::MP('v1');

		  	// attempt retrieval
			try {

				// build params
				$filters = array();
				if ( !empty( $status ) ){
					$filters['status'] = $status;
				}
				if ( $list_id > 0 ){
					$filters['listId'] = $list_id;
				}
				if ( $min_updated_at > 0 ){
					$filters['minUpdatedAt'] = $min_updated_at;
				}
				
				// if count, return that
				if ( $count ){

					return $mailpoet_api->getSubscribersCount(
						$filters
					);

				}

				// as at 19/10/22 the MailPoet API endpoint does not yet support returning segments/tags
				// $with_meta, $with_tags

				// return				
				return $mailpoet_api->getSubscribers(
					$filters,
					$limit,
					$offset
				);

			} catch (\Exception $e) {

				// debug: echo 'MailPoet API Error: ' . $e->getMessage();

			}

		}

		return false;

	}



	/*
	* Helper function to filter MailPoet lists by name.
	*/
	public function get_mailpoet_list_by_name( $name ) {
		$mailpoet_api = \MailPoet\API\API::MP('v1');
		$lists = $mailpoet_api->getLists();
		$found = array_filter($lists, function ($i) use($name) {
			return ($i['name'] == $name);
		});
	
		return array_pop($found);
	}


	/*
	* Creates a mew MailPoet mailing List.
	* Deletes a previous one if exists with the same name.
	*/
	public function reset_mailpoet_list_by_segment_name( $name ) {

		$mailpoet_api = \MailPoet\API\API::MP('v1');

		$list = $this->get_mailpoet_list_by_name( $name );
		
		// Delete all subscribers from this list
		if ( ! empty( $list ) && ! empty( $list['id'] ) ) {
			$mailpoet_api->deleteList( $list['id'] );
		}

		// Create list again with same name

		$description = __( 'Created by CRM', 'zero-bs-crm' );
		##WLREMOVE
		$description = __( 'Created by Jetpack CRM', 'zero-bs-crm' );
		##/WLREMOVE

		$list = $mailpoet_api->addList( array(
			'name' => $name,
			'description' => $description )
		);

		return $list['id'];
	}

	/*
	* Retrieve MailPoet setup status
	*/
	public function get_mailpoet_setup_status(){

		// https://github.com/mailpoet/mailpoet/blob/trunk/doc/api_methods/IsSetupComplete.md
		if ( class_exists( \MailPoet\API\API::class ) ) {
		  
			// load api
		  	$mailpoet_api = \MailPoet\API\API::MP('v1');

		  	// attempt retrieval
			try {
				
				return $mailpoet_api->isSetupComplete();

			} catch (\Exception $e) {


			}

		}

		return false;

	}

	// =========== / MailPoet Specific Migrations  ===================================
	// ===============================================================================
	

	// ===============================================================================
	// =========== MailPoet Specific Migrations  =====================================

	/*
	* Migrations
	*/
	private function run_migrations(){

	}

	// =========== / MailPoet Specific Migrations  ===================================
	// ===============================================================================

	/**
	 * Iterates through list of contacts to either `subscribeToList` or `addSubscriber` on MailPoet
	 */
	public function contacts_to_subscribers( $list_id, $subscribers ) {

		try {

			$mailpoet_api = \MailPoet\API\API::MP('v1');

			foreach( $subscribers as $sc ) {

				if ( ! zeroBSCRM_validateEmail( $sc['email'] ) ) {
					continue;
				}
				
				try {

					$subscriber = $mailpoet_api->getSubscriber( $sc['email'] );

					// Found an existing subscriber
					if ( ! empty( $subscriber['id'] ) ) {
						$mailpoet_api->subscribeToList(
							$subscriber['id'],
							$list_id,
							array(
								'send_confirmation_email' => false,
								'schedule_welcome_email' => false,
								'skip_subscriber_notification' => true,
							)
						);
					}

				} catch (APIException $th) {

					// Subscriber not found. Create new Subscriber
					if ( $th->getCode() === APIException::SUBSCRIBER_NOT_EXISTS ) {
						try {
							$mailpoet_api->addSubscriber(
								array(
									'email' => $sc['email'],
									'first_name' => $sc['fname'],
									'last_name' => $sc['lname'],
								),
								array( $list_id ),
								array(
									'send_confirmation_email' => false,
									'schedule_welcome_email' => false,
									'skip_subscriber_notification' => true,
								)
							);
						} catch (APIException $th) {
							return null;
						}
					}

				}
			}

			return array(
				'success' => true
			);

		} catch (\Throwable $th) {

			return array(
				'success' => false,
				'error'	  => zeroBSCRM_locale_utsToDatetime( time() ) . '] ' . $th->getMessage()
			);

		}
	}	


	/*
	 *   Adds segment condition category positions (to effect the display order)
	 */
	public function add_segments_condition_category_positions( $positions = array() ) {

	    global $zbs;

	    $positions['mailpoet'] = 11;

	    return $positions;

	}

}