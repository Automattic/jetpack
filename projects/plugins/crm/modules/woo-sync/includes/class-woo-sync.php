<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

#} the WooCommerce API
use Automattic\WooCommerce\Client;
use Automattic\WooCommerce\HttpClient\HttpClientException;

/**
 * WooSync class
 */
class Woo_Sync {


	/**
	 * Extension version.
	 *
	 * @var string
	 */
	public $version = '5.0';

	/**
	 * Extension settings key
	 *
	 * @var string
	 */
	public $config_key = 'woosync';

	/**
	 * Extension name.
	 *
	 * @var string
	 */
	public $ext_name = 'WooSync';

	/**
	 * Maximum number of WooCommerce products to retrieve into CRM product index
	 *
	 * @var int
	 */
	public $max_woo_product_index = 100;

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
	 * @var Woo_Sync_Background_Sync | null
	 */
	public $background_sync = null;

	/**
	 * Feature class object: Contact Tabs
	 *
	 * @var Woo_Sync_Contact_Tabs | null
	 */
	public $contact_tabs = null;

	/**
	 * Feature class object: My Account Integration
	 *
	 * @var Woo_Sync_My_Account_Integration | null
	 */
	public $my_account = null;

	/**
	 * Feature class object: Woo Admin UI modifications
	 *
	 * @var Woo_Sync_Woo_Admin_Integration | null
	 */
	public $woo_ui = null;

	/**
	 * Feature class object: WooSync Segment Conditions
	 *
	 * @var Woo_Sync_Segment_Conditions | null
	 */
	public $segment_conditions = null;

	/**
	 * Where true get_active_sync_sites() won't automatically try to add a local site when there isn't one already (e.g. on migration 5.2)
	 */
	public $skip_local_woo_check = false;

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
		'hub'                       => 'woo-sync-hub',
		'settings'                  => 'woosync',
		'settings_connections'      => 'connections',
		'settings_connection_edit'  => 'connection_edit',
	);

	/**
	 * URLs that the Woo module uses
	 *
	 * @var array()
	 */
	public $urls = array(
		'kb-woo-api-keys'   => 'https://kb.jetpackcrm.com/knowledge-base/getting-your-woocommerce-api-key-and-secret/',
		'kb-woo-map-status' => 'https://kb.jetpackcrm.com/knowledge-base/woosync-imported-all-customers-as-lead-status/',
	);

	/**
	 * Setup WooSync
	 * Note: This will effectively fire after core settings and modules loaded
	 * ... effectively on tail end of `init`
	 */
	public function __construct( ) {

		// Definitions
		$this->definitions();

		// Initialise endpoints
		$this->init_endpoints();

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


	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Woo_Sync is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Woo_Sync main instance
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

		define( 'JPCRM_WOO_SYNC_MODE_LOCAL', 0 );
		define( 'JPCRM_WOO_SYNC_MODE_API',   1 );

	}


	/**
	 * Initialise endpoints
	 *  (previously on `init`)
	 */
	private function init_endpoints( ) {

		add_rewrite_endpoint('invoices', EP_PAGES );

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
	public function get_settings() {
		return $this->settings->getAll();

	}

	/**
	 * Retrieve WooCommerce Order statuses
	 */
	public function get_woo_order_statuses() {
		$woo_order_statuses = array(
			'pending'        => __( 'Pending', 'zero-bs-crm' ),
			'processing'     => __( 'Processing', 'zero-bs-crm' ),
			'on-hold'        => __( 'On hold', 'zero-bs-crm' ),
			'completed'      => __( 'Completed', 'zero-bs-crm' ),
			'cancelled'      => __( 'Cancelled', 'zero-bs-crm' ),
			'refunded'       => __( 'Refunded', 'zero-bs-crm' ),
			'failed'         => __( 'Failed', 'zero-bs-crm' ),
			'checkout-draft' => __( 'Draft', 'zero-bs-crm' ),
		);
		return apply_filters( 'zbs-woo-additional-status', $woo_order_statuses );
	}

	/**
	 * Retrieve default mapped order status for a given object type
	 *
	 * @param int $obj_type_id Object type (e.g. ZBS_TYPE_CONTACT, ZBS_TYPE_INVOICE, or ZBS_TYPE_TRANSACTION).
	 * @param str $order_status Woo order status.
	 *
	 * @return str|bool Status string to use for object
	 */
	public function get_default_status_for_order_obj( $obj_type_id, $order_status ) {
		global $zbs;

		$status = false;

		if ( $obj_type_id === ZBS_TYPE_CONTACT ) {
			// default contact status is configured in CRM settings
			$status = $zbs->settings->get( 'defaultstatus' );
		} elseif ( $obj_type_id === ZBS_TYPE_INVOICE ) {
			// reasonable default paid mapping based on Woo status descriptions:
			// https://woocommerce.com/document/managing-orders/#order-statuses
			$paid_statuses = array(
				'completed',
				'processing',
			);

			if ( in_array( $order_status, $paid_statuses, true ) ) {
				$status = 'Paid';
			} elseif ( $order_status === 'checkout-draft' ) {
				$status = 'Draft';
			} else {
				$status = 'Unpaid';
			}
		} elseif ( $obj_type_id === ZBS_TYPE_TRANSACTION ) {
			// note that transaction statuses aren't translated, as they're user-configurable
			if ( $order_status === 'on-hold' ) {
				// weird legacy mapping fix
				$status = 'Hold';
			} elseif ( $order_status === 'checkout-draft' ) {
				// for lack of a better status
				$status = 'Draft';
			} else {
				// default transaction status is the same as the Woo order status
				$status = ucfirst( $order_status );
			}
		}

		return $status;
	}

	/**
	 * Retrieve available WooCommerce Order mapping to different CRM fields.
	 * This mapping is stored in the settings in the settings, more specifically
	 * in $settings[ $type_prefix . $woo_order_status_key ].
	 *
	 * @return array Array with mapping types for contacts, invoices and transactions.
	 */
	public function get_woo_order_mapping_types() {
		$contact_statuses     = zeroBSCRM_getCustomerStatuses( true );
		$invoice_statuses     = zeroBSCRM_getInvoicesStatuses();
		$transaction_statuses = zeroBSCRM_getTransactionsStatuses( true );
		return array(
			'contact' => array(
				'label'    => __( 'Contact status', 'zero-bs-crm' ),
				'prefix'   => 'order_contact_map_',
				'statuses' => $contact_statuses,
			),
			'invoice' => array(
				'label'    => __( 'Invoice status', 'zero-bs-crm' ),
				'prefix'   => 'order_invoice_map_',
				'statuses' => $invoice_statuses,
			),
			'transaction' => array(
				'label'    => __( 'Transaction status', 'zero-bs-crm' ),
				'prefix'   => 'order_transaction_map_',
				'statuses' => $transaction_statuses,
			),
		);
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

		// Add Woo related info to CRM external source infobox
		add_filter( 'zbs_external_source_infobox_line', array( $this, 'override_crm_external_source_infobox' ), 10, 2 );

		// Pay invoice via WooCommerce checkout button
		add_filter( 'zbs_woo_pay_invoice', array( $this, 'render_pay_via_woo_checkout_button' ), 20 );

		// Hook in to Contact, Invoice, and Transaction query generation and add the quickfilter
		add_filter( 'jpcrm_contact_query_quickfilter', array( $this, 'contact_query_quickfilter_addition' ), 10, 2 );
		add_filter( 'jpcrm_invoice_query_quickfilter', array( $this, 'invoice_query_quickfilter_addition' ), 10, 2 );
		add_filter( 'jpcrm_transaction_query_quickfilter', array( $this, 'transaction_query_quickfilter_addition' ), 10, 2 );

		// Hook in to new contact log creation and add string manipulation
		add_filter( 'jpcrm_new_contact_log', array( $this, 'new_contact_log_override' ), 10, 3 );
		
		// Product index
		// #follow-on-refinements
		// add_filter( 'zbs_invpro_productindex', array( $this, 'append_woo_products_to_crm_product_index' ), 10, 1 );

		// Add our action to the stack (for OAuth like connecting to Woo external stores)
		add_filter( 'jpcrm_listener_actions', array( $this, 'add_listener_action' ), 1 );

		// set action for endpoint listener to fire, so we can catch oauth requests (if any)
		add_action( 'jpcrm_listener_woosync_add_store', array( $this, 'catch_add_store_auth'), 10 );

		// add webhook actions
		add_filter( 'jpcrm_api_valid_webhook_actions', array( $this, 'add_webhook_actions' ) );

		// add a position to the WooSync segment condition category positions array
		add_filter( 'jpcrm_segment_condition_category_positions', array( $this, 'add_segments_condition_category_positions' ) );

	}

	/**
	 * Initialise Features
	 */
	private function init_features( ) {

		// Contact Tabs
		if ( zeroBSCRM_is_customer_view_page() ) {

			require_once JPCRM_WOO_SYNC_ROOT_PATH . 'includes/jpcrm-woo-sync-contact-tabs.php';
			$this->contact_tabs = Woo_Sync_Contact_Tabs::instance();
			wp_enqueue_style( 'jpcrm-woo-sync-contact-tabs', plugins_url( '/css/jpcrm-woo-sync-contact-tabs.css', JPCRM_WOO_SYNC_ROOT_FILE ) );

		}

		// Settings page
		if ( jpcrm_is_settings_page() ) {

			$this->load_admin_page( 'settings/router' );

		}

		// Hub page
		if ( $this->is_hub_page() ) {

			$this->load_admin_page( 'woo-sync-hub/main' );

		}

		// Background sync
		require_once JPCRM_WOO_SYNC_ROOT_PATH . 'includes/class-woo-sync-background-sync.php';
		$this->background_sync = Woo_Sync_Background_Sync::instance();

		// My account
		require_once JPCRM_WOO_SYNC_ROOT_PATH . 'includes/class-woo-sync-my-account-integration.php';
		$this->my_account = Woo_Sync_My_Account_Integration::instance();

		// WooCommerce UI additions
		require_once JPCRM_WOO_SYNC_ROOT_PATH . 'includes/class-woo-sync-woo-admin-integration.php';
		$this->woo_ui = Woo_Sync_Woo_Admin_Integration::instance();

		// Segment conditions
		require_once( JPCRM_WOO_SYNC_ROOT_PATH . 'includes/class-woo-sync-segment-conditions.php' );
		$this->segment_conditions = Woo_Sync_Segment_Conditions::instance();

	}


	/**
	 * Autoload page AJAX
	 */
	private function load_ajax( ) {

		$admin_page_directories = jpcrm_get_directories( JPCRM_WOO_SYNC_ROOT_PATH . 'admin' );

		if ( is_array( $admin_page_directories ) ){

			foreach ( $admin_page_directories as $directory ){

				$files = scandir( JPCRM_WOO_SYNC_ROOT_PATH . 'admin/' . $directory );
				
				if ( is_array( $files ) ){

					foreach ( $files as $file ){

						// find files `*.ajax.*`
						if ( strrpos( $file, '.ajax.' ) > 0 ){

							// load it
							require_once( JPCRM_WOO_SYNC_ROOT_PATH . 'admin/' . $directory . '/' . $file );

						}

					}

				}


			}

		}

	}


	/**
	 * Include WooCommerce REST API (well, in fact, autoload /vendor)
	 */
	public function include_woocommerce_rest_api(){

		require_once ZEROBSCRM_PATH .  'vendor/autoload.php';

	}


	/**
	 * Include filter buttons
	 * (Note, requires `contact_query_quickfilter_addition()` to be hooked into `jpcrm_contact_query_quickfilter`)
	 */
	public function include_filter_buttons(){

		global $zbs, $zeroBSCRM_filterbuttons_customer;

		// Add 'is woo customer' filter button to 'all options' for contact
  		$zeroBSCRM_filterbuttons_customer['all']['woo_customer'] = array( __( 'WooCommerce', 'zero-bs-crm' ) );

  		// get current list view filters
        $custom_views = $zbs->settings->get( 'customviews2' );

  		// If we've only just activated WooSync,
  		// we add the customer filter button to the users selected filters by default (once)
  		if ( !isset( $custom_views['customer_filters']['woo_customer'] ) && !$this->settings->get( 'has_added_woofilter', false ) ){

  			// add in our filter
  			$custom_views['customer_filters']['woo_customer'] = array( __( 'WooCommerce', 'zero-bs-crm' ) );

  			// save
			$zbs->settings->update( 'customviews2', $custom_views );

			// flag so we don't keep re-adding if user removes from selection
  			$this->settings->update( 'has_added_woofilter', true );

  		}

  		// ... we also add the transaction filter button to the users selected filters by default (once)
  		if ( !isset( $custom_views['transaction_filters']['woo_transaction'] ) && !$this->settings->get( 'has_added_woo_transaction_filter', false ) ){

  			// add in our filter
  			$custom_views['transaction_filters']['woo_transaction'] = array( __( 'WooCommerce', 'zero-bs-crm' ) );

  			// save
			$zbs->settings->update( 'customviews2', $custom_views );

			// flag so we don't keep re-adding if user removes from selection
  			$this->settings->update( 'has_added_woo_transaction_filter', true );

  		}

  		// ... we also add the invoice filter button to the users selected filters by default (once)
  		if ( !isset( $custom_views['invoice_filters']['woo_invoice'] ) && !$this->settings->get( 'has_added_woo_invoice_filter', false ) ){

  			// add in our filter
  			$custom_views['invoice_filters']['woo_invoice'] = array( __( 'WooCommerce', 'zero-bs-crm' ) );

  			// save
			$zbs->settings->update( 'customviews2', $custom_views );

			// flag so we don't keep re-adding if user removes from selection
  			$this->settings->update( 'has_added_woo_invoice_filter', true );

  		}

	}


	/**
	 * Hook in to Contact query generation and add the quickfilter
	 * (Hooked into `jpcrm_contact_query_quickfilter`)
	 */
	public function contact_query_quickfilter_addition( $wheres, $quick_filter_key ) {

		global $ZBSCRM_t;

		// is a Woo customer? (Could be copied/generalised for other ext sources)
		if ( $quick_filter_key == 'woo_customer' ){
	        $wheres['is_woo_customer'] = array(
	            'ID','IN',
	            '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = " . ZBS_TYPE_CONTACT . " AND zbss_source = %s)",
	            array( 'woo' )
	        );
	    }

	    return $wheres;
	}


	/**
	 * Hook in to Invoice query generation and add the quickfilter
	 * (Hooked into `jpcrm_invoice_query_quickfilter`)
	 */
	public function invoice_query_quickfilter_addition( $wheres, $quick_filter_key ) {

		global $ZBSCRM_t;

		// is a Woo customer? (Could be copied/generalised for other ext sources)
		if ( $quick_filter_key == 'woo_invoice' ){
	        $wheres['is_woo_invoice'] = array(
	            'ID','IN',
	            '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = " . ZBS_TYPE_INVOICE . " AND zbss_source = %s)",
	            array( 'woo' )
	        );
	    }

	    return $wheres;
	}


	/**
	 * Hook in to Transaction query generation and add the quickfilter
	 * (Hooked into `jpcrm_transaction_query_quickfilter`)
	 */
	public function transaction_query_quickfilter_addition( $wheres, $quick_filter_key ) {

		global $ZBSCRM_t;

		// is a Woo customer? (Could be copied/generalised for other ext sources)
		if ( $quick_filter_key == 'woo_transaction' ){
	        $wheres['is_woo_transaction'] = array(
	            'ID','IN',
	            '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = " . ZBS_TYPE_TRANSACTION . " AND zbss_source = %s)",
	            array( 'woo' )
	        );
	    }

	    return $wheres;
	}



	/**
	 * Hook in to new contact log creation and add string manipulation
	 * (Hooked into `jpcrm_new_contact_log`)
	 */
	public function new_contact_log_override( $note_long_description, $source_key, $uid ) {

        if ( $source_key == 'woo' ){

			if ( !empty( $uid ) ){
            	$note_long_description = sprintf( __( 'Created from WooCommerce Order #%s', 'zero-bs-crm' ), $uid ) . ' <i class="fa fa-shopping-cart"></i>';
            } else {
            	$note_long_description = __( 'Created from WooCommerce Order', 'zero-bs-crm' ) . ' <i class="fa fa-shopping-cart"></i>';
            }

        }

	    return $note_long_description;
	}

	/**
	 * Register styles & scripts
	 *  (previously on `init`)
	 */
	public function register_styles_scripts() {

		// WooCommerce My Account
		wp_register_style( 'jpcrm-woo-sync-my-account', plugins_url( '/css/jpcrm-woo-sync-my-account'.wp_scripts_get_suffix().'.css', JPCRM_WOO_SYNC_ROOT_FILE ) );
		wp_register_style( 'jpcrm-woo-sync-fa', plugins_url( '/css/font-awesome.min.css', ZBS_ROOTFILE ) );

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
			$connection_tab               = $this->slugs['settings_connections'];
			$tabs[ $main_tab ]            = array(
				'name' => $this->ext_name,
				'ico' => '',
				'submenu' => array(
					"{$main_tab}&subtab={$connection_tab}" => array(
						'name' => __( 'Store Connections', 'zero-bs-crm'),
						'ico'  => '',
					),
				),
			);
		}

		return $tabs;

	}


	/**
	 * Return default settings
	 */
	public function default_settings() {

		return require( JPCRM_WOO_SYNC_ROOT_PATH . 'includes/jpcrm-woo-sync-default-settings.php' );

	}


	/**
	 * Main page addition
	 */
	function add_wp_pages( $menu_array=array() ) {

		// add a submenu item to main CRM menu
		$menu_array['jpcrm']['subitems']['woosync'] = array(
			'title'      => 'WooSync',
			'url'        => $this->slugs['hub'],
			'perms'      => 'admin_zerobs_manage_options',
			'order'      => 10,
			'wpposition' => 10,
			'callback'   => 'jpcrm_woosync_render_hub_page',
			'stylefuncs' => array( 'zeroBSCRM_global_admin_styles', 'jpcrm_woosync_hub_page_styles_scripts' ),
		);

		return $menu_array;

	} 


	/**
	 * Adds Tools menu sub item
	 */
	public function add_tools_menu_sub_item_link( $menu_items ) {

		global $zbs;
		
		$menu_items[] = '<a href="' . zeroBSCRM_getAdminURL( $this->slugs['hub'] ) . '" class="item"><i class="shopping cart icon"></i> WooSync</a>';
		
		return $menu_items;

	}


	/**
	 * Output learn menu
	 */
	public function render_learn_menu(){

		if ( $this->is_hub_page() ){

			global $zbs;

			$learn_content = '<p>' . __( "Here you can import your WooCommerce data. It's important that you have setup the extension correctly, including setting the order statuses to map to contact statuses.", 'zerobscrm' ) . '</p>';
			$learn_content .= '<p>' . __( "If you do not set this up, all WooCommerce orders will be imported as contacts with default status (Lead). Hit import to get started or learn more about how to setup the extension.", 'zero-bs-crm' ) . '</p>';
			$image_url = JPCRM_WOO_SYNC_IMAGE_URL . 'learn/learn-woo-sync.png';
			
			// output
			$zbs->learn_menu->render_generic_learn_menu(
				'WooCommerce Sync',
				'',
				'',
				true,
				__( "Import WooCommerce History", "zerobscrm" ),
				$learn_content,
				$zbs->urls['kb-woosync-home'],
				$image_url,
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
		
		jpcrm_load_admin_page( $page_name, JPCRM_WOO_SYNC_ROOT_PATH );

	}


	/**
	 * Append/override Woo related info to CRM external source infobox
	 *  (previously `transaction_to_order_link`)
	 *
	 * @param string $html
	 * @param array $external_source
	 */
	public function override_crm_external_source_infobox( $html, $external_source ) {

		global $zbs;
		
		if ( $external_source['source'] == 'woo' ){

			// retrieve origin info (where available)
			$origin_str = '';
			$origin_detail = $zbs->DAL->hydrate_origin( $external_source['origin'] );
			if ( is_array( $origin_detail ) && isset( $origin_detail['origin_type'] ) && $origin_detail['origin_type'] == 'domain' ){

				// clean the domain (at this point strip protocols)
				$clean_domain = $zbs->DAL->clean_external_source_domain_string( $origin_detail['origin'] );
				$origin_str = __( ' from ', 'zero-bs-crm' ) . '<span class="jpcrm-ext-source-domain">' . $clean_domain . '</span>';

			}

			$woo_order_link = admin_url( 'post.php?post=' . $external_source['unique_id'] . '&action=edit' );
			// get label, which is usually the order ID but may be a custom order number
			$woo_order_link_label = $this->get_order_number_from_object_meta( $external_source['objtype'], $external_source['objid'], $external_source['unique_id'] );

			switch ( $external_source['objtype'] ){

				case ZBS_TYPE_INVOICE:
				case ZBS_TYPE_TRANSACTION:

					// local (can show order link) or external (can't show order link)
					if ( $this->is_order_from_local_by_external_source( $external_source ) ){

						$html = '<div class="jpcrm-ext-source-woo-order">' . __( "Order", 'zero-bs-crm' ) . ' <span class="jpcrm-ext-source-uid">#' . $woo_order_link_label . '</span><a class="compact ui mini button right floated" href="' . esc_url( $woo_order_link ) . '" target="_blank">' . __( 'View Order', 'zero-bs-crm' ) . '</a></div>';

					} else {

						$html = '<div class="jpcrm-ext-source-woo-order">' . __( "Order", 'zero-bs-crm' ) . ' <span class="jpcrm-ext-source-uid">#' . $woo_order_link_label . '</span>' . $origin_str . '</div>';

					}

					break;

				case ZBS_TYPE_CONTACT:
				case ZBS_TYPE_COMPANY:

					// local (can show order link) or external (can't show order link)
					if ( $this->is_order_from_local_by_external_source( $external_source ) ){

						$html = '<div class="jpcrm-ext-source-woo-order">' . __( "Order", 'zero-bs-crm' ) . ' <span class="jpcrm-ext-source-uid">#' . $woo_order_link_label . '</span><a class="compact ui mini button right floated" href="' . esc_url( $woo_order_link ) . '" target="_blank">' . __( 'View Order', 'zero-bs-crm' ) . '</a></div>';

					} else {

						$html = '<div class="jpcrm-ext-source-woo-order">' . __( "Order", 'zero-bs-crm' ) . ' <span class="jpcrm-ext-source-uid">#' . $woo_order_link_label . '</span>' . $origin_str . '</div>';

					}

					break;

			}

		}

		return $html;

	}

	
	/**
	 * This checks an external source for 'origin', and if that matches local site url, returns true
	 * ... if origin is not recorded, this falls back to current setup mode (for users data pre refactor with origin (~v5))
	 *
	 * @param array $external_source
	 */
	public function is_order_from_local_by_external_source( $external_source ) {

		global $zbs;

		if ( is_array( $external_source ) && isset( $external_source['origin'] ) ){

			$origin_detail = $zbs->DAL->hydrate_origin( $external_source['origin'] );
			if ( $origin_detail['origin_type'] == 'domain' ){

				if ( $origin_detail['origin'] == site_url() ){
					return true;
				}

			}

		} else {

			// no origin, must be a pre-v5 recorded order

		}

		return false;

	}

	
	/**
	 * Return object number retrieved from an object meta (which can be different from an object ID)
	 *
	 * @param int $obj_type_id
	 * @param int $obj_id
	 * @param int $order_post_id
	 */
	public function get_order_number_from_object_meta( $obj_type_id, $obj_id, $order_post_id ) {

		global $zbs;
		$order_num = $zbs->DAL->meta( $obj_type_id, $obj_id, 'extra_order_num' );
		if ( !$order_num ) {
			$order_num = $order_post_id;
		}

		return $order_num;

	}


	/**
	 * Pay for invoice via WooCommerce checkout 
	 *  Intercepts pay button logic and adds pay via woo button
	 *  Does not do so for API-imported orders
	 *
	 * @param int $invoice_id
	 */
	public function render_pay_via_woo_checkout_button( $invoice_id = -1 ) {

		global $zbs;

		// We can't generate a Woo payment button if WooCommerce isn't active
		if ( ! $zbs->woocommerce_is_active() ) {
			// show an error if an invoice admin
			if ( zeroBSCRM_permsInvoices() ) {
				$admin_alert  = '<b>' . esc_html__( 'Admin note', 'zero-bs-crm' ) . ':</b> ';
				$admin_alert .= esc_html__( 'Please enable WooCommerce to show the payment link here.', 'zero-bs-crm' );
				return $admin_alert;
			} else {
				return false;
			}
		}

		if ( $invoice_id > 0 ) {

			$api = $this->get_invoice_meta( $invoice_id, 'api' );
			$order_post_id = $this->get_invoice_meta( $invoice_id, 'order_post_id' );

			// intercept pay button and set to pay via woo checkout
			if ( empty( $api ) && ! empty( $order_post_id ) ) {
				remove_filter( 'invoicing_pro_paypal_button', 'zeroBSCRM_paypalbutton', 1 );
				remove_filter( 'invoicing_pro_stripe_button', 'zeroBSCRM_stripebutton', 1 );
				$order        = wc_get_order( $order_post_id );
				$payment_page = $order->get_checkout_payment_url();
				$res          = '<h3>' . __( 'Pay Invoice', 'zero-bs-crm' ) . '</h3>';
				$res         .= '<a href="' . esc_url( $payment_page ) . '" class="ui button btn">' . __( 'Pay Now', 'zero-bs-crm' ) . '</a>';

				return $res;
			}

			return $invoice_id;
			
		}

	}



	/**
	 * Append WooCommerce products to CRM product index (used on invoice editor)
	 *  Applied via filter `zbs_invpro_productindex`
	 *
	 * @param array $crm_product_index
	 */
	public function append_woo_products_to_crm_product_index( $crm_product_index ){

		// Get Sync sites, and cycle through them
		$sync_sites = $this->get_active_sync_sites();

		foreach ( $sync_sites as $site_key => $site_info ){

			if ( $site_info['mode'] == JPCRM_WOO_SYNC_MODE_LOCAL ){

				// Local store
				$woo_product_index = $this->get_product_list_via_local_store();

			} else {
				
				// From API-derived store
				$woo_product_index = $this->get_product_list_via_api();

			}

			// append to array
			if ( is_array( $woo_product_index ) && count( $woo_product_index ) > 0 ){

				$crm_product_index = array_merge( $woo_product_index, $crm_product_index );

			}

		}

		return $crm_product_index;
	}


	/**
	 * Retrieve WooCommerce product list via API
	 * 
	 * @param string site connection key
	 * 
	 */
	public function get_product_list_via_api( $site_key ){

		$woo_product_index = array();

		try {

			// use Woo client library
			$woocommerce = $this->get_woocommerce_client( $site_key ); 	

			// Set params
			$params = array( 'per_page' => $this->max_woo_product_index );
			$params = apply_filters( 'zbs-woo-product-list', $params );
			$product_list = $woocommerce->get( 'products', $params );

			// cycle through & simplify to match product index
			foreach ( $product_list as $product_data ){
				
				$index_line                = new \stdClass;
				$index_line->ID            = $product_data->id;
				$index_line->zbsprod_name  = $product_data->name;
				$index_line->zbsprod_desc  = wp_strip_all_tags($product_data->short_description);
				$index_line->zbsprod_price = $product_data->price;
			
				$woo_product_index[] = $index_line;

			}

		} catch ( HttpClientException $e ) {

			echo "<div class='ui message red'><i class='ui icon exclamation circle'></i> WooCommerce Client Error: " . print_r( $e->getMessage(), true ) . "</div>";

		}

		return $woo_product_index;

	}


	/**
	 * Retrieve WooCommerce product list via Local store
	 */
	public function get_product_list_via_local_store(){

		$woo_product_index = array();

		if ( class_exists( 'WC_Product_Query' ) ){

			$products = wc_get_products( array(
				'limit' => $this->max_woo_product_index,
			));

			foreach( $products as $product ){

				// retrieve variations
				$args = array(
					'post_type'     => 'product_variation',
					'post_status'   => array( 'private', 'publish' ),
					'numberposts'   => -1,
					'orderby'       => 'menu_order',
					'order'         => 'asc',
					'post_parent'   => $product->get_id()
				);
				$variations = get_posts( $args );

				foreach ( $variations as $variation ) {
					
					$variable_product = wc_get_product( $variation->ID ); 

					// add variation
					$index_line                = new \stdClass;
					$index_line->ID            = $variation->ID;
					$index_line->zbsprod_name  = $variable_product->get_name();
					$index_line->zbsprod_desc  = wp_strip_all_tags( $variable_product->get_short_description() );
					$index_line->zbsprod_price = $variable_product->get_price();
				
					$woo_product_index[] = $index_line;
				} 
				
				// Add main product
				$index_line                = new \stdClass;
				$index_line->ID            = $product->get_id();
				$index_line->zbsprod_name  = $product->get_name();
				$index_line->zbsprod_desc  = wp_strip_all_tags($product->get_short_description());
				$index_line->zbsprod_price = $product->get_price();
			
				$woo_product_index[] = $index_line;

			}

		}

		return $woo_product_index;

	}


	/**
	 * Returns total order count for local store
	 */
	public function get_order_count_via_local_store() {

		// retrieve generic page of orders to get total
		$args = array(
			'limit'     => 1,
			'paged'     => 1,
			'paginate'  => true,
		);
		$orders = wc_get_orders( $args );
		return $orders->total;

	}


	/**
	 * Returns the total number of woosync imported contacts present in CRM
	 */
	public function get_crm_woo_contact_count() {

		global $zbs;

		return $zbs->DAL->contacts->getContacts(
			array(
				'externalSource' => 'woo',
				'count'          => true,
				'ignoreowner'    => true,
				)
			);

	}


	/**
	 * Returns the total number of woosync imported transactions present in CRM

	 */
	public function get_crm_woo_transaction_count() {

		global $zbs;

		return $zbs->DAL->transactions->getTransactions(
			array(
				'externalSource' => 'woo',
				'count'          => true,
				'ignoreowner'    => true,
			)
		);

	}


	/**
	 * Returns the total value of woosync imported transactions present in CRM
	 */
	public function get_crm_woo_transaction_total() {

		global $zbs;

		return $zbs->DAL->transactions->getTransactions(
			array(
				// this may need status filtering. For now left as total total (MVP)
				'externalSource' => 'woo',
				'total'          => true,
				'ignoreowner'    => true,
				)
			);

	}


	/**
	 * Returns the most recent woo order crm transaction
	 */
	public function get_crm_woo_latest_woo_transaction() {

		global $zbs;

		$orders = $zbs->DAL->transactions->getTransactions(
			array(
				'externalSource' => 'woo',
				'sortByField'    => 'date',
				'sortOrder'      => 'DESC',
				'page'           => 0,
				'perPage'        => 1,
				'ignoreowner'    => true,
			)
		);

		if ( is_array( $orders ) && isset( $orders[0] ) && is_array( $orders[0] ) ) {

			return $orders[0];

		}

		return false;

	}


	/**
	 * Returns the a string based on the most recent woo order crm transaction
	 */
	public function get_crm_woo_latest_woo_transaction_string() {

		global $zbs;
		$latest_synced_transaction = $this->get_crm_woo_latest_woo_transaction();
		$latest_synced_transaction_text = '';

		if ( is_array( $latest_synced_transaction ) ) {
			$latest_synced_transaction_text .= '<br />';

			// build a 'latest order' string
			$latest_synced_transaction_text .= __( 'Latest import:', 'zero-bs-crm' ) . ' <a href="' . jpcrm_esc_link( 'edit', $latest_synced_transaction['id'], ZBS_TYPE_TRANSACTION ) . '" target="_blank">' . $latest_synced_transaction['ref'] . '</a> ';
			if ( !empty( $latest_synced_transaction['title'] ) ) {

				$latest_synced_transaction_text .= '- ' . $latest_synced_transaction['title'] . ' ';

			}
			if ( !empty( $latest_synced_transaction['date_date'] ) ) {

				$latest_synced_transaction_text .= '(' . $latest_synced_transaction['date_date'] . ') ';

			}
			/* skip origin string for now, as we currently only support one origin at a time */
			// $origin_str        = '';
			// $external_sources  = $zbs->DAL->getExternalSources(
			// 	-1,
			// 	array(
			// 		'objectID'          => $latest_synced_transaction['id'],
			// 		'objectType'        => ZBS_TYPE_TRANSACTION,
			// 		'grouped_by_source' => true,
			// 		'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT ),
			// 	)
			// );
			// if ( isset( $external_sources['woo'] ) ) {
			// 	$origin_detail = $zbs->DAL->hydrate_origin( $external_sources['woo'][0]['origin'] );
			// 	$clean_domain  = $zbs->DAL->clean_external_source_domain_string( $origin_detail['origin'] );
			// 	$origin_str    = __( ' from ', 'zero-bs-crm' ) . $clean_domain;
			// }
			// $latest_synced_transaction_text .= $origin_str;
		}
		return $latest_synced_transaction_text;

	}


	/**
	 * Returns the latest WooSync stats
	 */
	public function get_jpcrm_woo_latest_stats() {

		$last_order_synced = $this->get_crm_woo_latest_woo_transaction_string();
		$contacts_synced = zeroBSCRM_prettifyLongInts( $this->get_crm_woo_contact_count() );
		$transactions_synced = zeroBSCRM_prettifyLongInts( $this->get_crm_woo_transaction_count() );
		$transaction_total = zeroBSCRM_formatCurrency( $this->get_crm_woo_transaction_total( ) );

		return array(
			'last_order_synced'   => $last_order_synced,
			'contacts_synced'     => $contacts_synced,
			'transactions_synced' => $transactions_synced,
			'transaction_total'   => $transaction_total,
		);

	}


	/**
	 * Returns a crm transaction based on order num|origin
	 */
	public function get_transaction_from_order_num( $order_num, $origin='', $only_id=false ){

		global $zbs;

		$source_args = array(
			'externalSource'    => 'woo',
			'externalSourceUID' => $order_num,
			'origin'            => $origin,
		);

		if ( $only_id ){
			$source_args['onlyID'] = true;
		}

		return $zbs->DAL->transactions->getTransaction( -1, $source_args);

	}


	/**
	 * Returns settings-saved order prefix
	 *
	 * @param string site connection key
	 * 
	 * @return string Order Prefix
	 */
	public function get_prefix( $site_key ){

		$sync_site = $this->get_active_sync_site( $site_key );
		return $sync_site['prefix'];

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
	 * Processes an error string to make it more user friendly (#legacy)
	 *
	 * @return string $error
	 */
	public function process_error( $error ){

		// number 1: Invalid JSON = endpoint incorrect...
		if ( str_contains( $error, 'Invalid JSON returned for' ) ) {

			return __( 'Error. Your WooCommerce endpoint may be incorrect!', 'zero-bs-crm' );

		}

		return $error;
	}

	/**
	 * Returns CRM Invoice meta with a specified key
	 *
	 * @param int $invoice_id
	 * @param string $key
	 *
	 * @return mixed $meta value
	 */
	public function get_invoice_meta( $invoice_id, $key = '' ){

		global $zbs;
		return $zbs->DAL->invoices->getInvoiceMeta( $invoice_id, 'extra_' . $key );

	}

	/**
	 * Returns future WooCommerce Bookings against a contact/object
	 *
	 * @param int $objid
	 *
	 * @return array WC Booking objects
	 */
	public function get_future_woo_bookings_for_object( $objid = -1 ){

		$bookings = array();
		if ( class_exists( 'WC_Booking_Data_Store' ) ){

			$wp_id = zeroBS_getCustomerWPID( $objid );
			if ( $wp_id > 0 ){
				$bookings = \WC_Booking_Data_Store::get_bookings_for_user(
					$wp_id,
					array(
						'orderby'    => 'start_date',
						'order'      => 'ASC',
						'date_after' => current_datetime()->setTime( 0, 0, 0, 0 )->getTimestamp() + current_datetime()->getOffset(), // gets the start of the day, respecting the current timezone (getOffset()).
					)
				);

			}

		}

		return $bookings;

	}

	/**
	 * Returns URL to hop to local WooCommerce wp-admin
	 *	 
	 * @return string URL
	 */
	public function get_local_woo_admin_url( ){

		return site_url( '/wp-admin/admin.php?page=wc-admin' );

	}


	/**
	 * Returns URL to hop to external WooCommerce wp-admin
	 *
	 * @param string Site URL
	 * @return string URL
	 */
	public function get_external_woo_admin_url( $site_url = '' ){

		if ( empty( $site_url ) ){

			return '#woo-url-error';

		}

		// dumb hard-typed for now, is there a smarter way?
		return trailingslashit( $site_url ) . 'wp-admin/admin.php?page=wc-admin';

	}


	/**
	 * Returns query string for URL to auth external WooCommerce wp-admin
	 * https://woocommerce.github.io/woocommerce-rest-api-docs/#rest-api-keys
	 * 
	 * @param string $domain
	 *
	 * @return string URL query string
	 */
	public function get_external_woo_url_for_oauth( $domain='' ){

		global $zbs;

		if ( empty( $domain ) ){

			return '#woo-url-error';

		}

		$app_name = sprintf( __( 'CRM: %s', 'zero-bs-crm' ), site_url() );
		$return_url = jpcrm_esc_link( $zbs->slugs['settings'] . '&tab=' . $zbs->modules->woosync->slugs['settings'] . '&subtab=' . $this->slugs['settings_connections'] );	

		##WLREMOVE
		$app_name = sprintf( __( 'Jetpack CRM: %s', 'zero-bs-crm' ), site_url() );
		##/WLREMOVE

		// user_id - we use this with a transient to provide catching service tallying, 
		// given that the credentials sent back to the callback url from woo do not hold the domain
		$user_id = get_current_user_id();
		set_transient( 'jpcrm_woo_connect_token_' . $user_id, $domain, 600 );
		
		// load listener if it's not already loaded
		$zbs->load_listener();

		// build callback url
		$callback_url = $zbs->listener->get_callback_url( 'woosync_add_store' );

		$params = [
		    'app_name' => $app_name,
		    'scope' => 'read',
		    'user_id' => $user_id,
		    'return_url' => $return_url,
		    'callback_url' => $callback_url
		];
		$query_string = http_build_query( $params );

		return $domain . '/wc-auth/v1/authorize?' . $query_string;

	}

	/*
	 * Add our listener action to the stack
	 *
	*/
	public function add_listener_action( $actions = array() ) {

		$actions[] = 'woosync_add_store';

		return $actions;

	}

	/*
	 * Add a catch for our endpoint listener action
	 * Catches Woo site authentications via endpoint listener
	 *
	*/
	public function catch_add_store_auth() {

		// at this point its basically authenticated via endpoint listener

		$log = array();

		$request = file_get_contents('php://input');

		$log[] = 'req:'.$request;

		// should be in json, is it?
		$params = json_decode( $request );

		$log[] = 'params:'.gettype($params);

		if ( is_object( $params ) && isset( $params->user_id ) ){

			$log[] = 'got params';

			// could be legit
			/* e.g. 
			{
				"key_id": 2,
				"user_id": "1",
				"consumer_key": "ck_65bff54d05b71c762bef6c99125fc1ea8570622c",
				"consumer_secret": "cs_f71faa8a0p0fe014c05fee0eed463cbb10fb61e9",
				"key_permissions": "read"
			}
			*/

			if ( isset( $params->user_id ) && isset( $params->consumer_key ) && isset( $params->consumer_secret ) && isset( $params->key_permissions ) ){

				// basic validation
				$key = sanitize_text_field( $params->consumer_key );
				$secret = sanitize_text_field( $params->consumer_secret );
				// no need to check permissions? `read` 

				$log[] = 'got key:'.$key;
				$log[] = 'got secret:'.$secret;

				// got keys?
				if ( !empty( $key ) && !empty( $secret ) ){

					$log[] = 'validated';

					// see if we have a transient to match this
					$transient_check_domain = get_transient( 'jpcrm_woo_connect_token_' . $params->user_id );
					$log[] = 'transient '.$transient_check_domain . ' (jpcrm_woo_connect_token_' . $params->user_id . ')';
					if ( !empty( $transient_check_domain ) ){

						$log[] = 'transient checks out '.$transient_check_domain;

						// run a test on connection (make a function in backgroudn sync?)
						if ( $this->verify_api_connection( false, $transient_check_domain, $key, $secret ) ){

							$log[] = 'connection verified';

							// if legit, add as site							
							$new_sync_site = $this->add_sync_site( array(
			        			
					            'mode'           => JPCRM_WOO_SYNC_MODE_API,
					            'domain'         => $transient_check_domain,
					            'key'            => $key,
					            'secret'         => $secret,
					            'prefix'         => ''

					        ));

							// add option to flag newly added to UI
							set_transient( 'jpcrm_woo_newly_authenticated', $new_sync_site['site_key'], 600 );

						} else {

							// failed to verify? What to do.
							$log[] = 'connection NOT verified';

						}

					}

				}

			}

		}

		$log[] = 'fini';
		//update_option('wlogtemp', $log, false);

		exit();


	}

	/**
	 * Translates a WooCommerce order status to the equivalent settings key
	 *
	 * @param string $obj_type_id Object type ID.
	 *
	 * @return array The associated settings key array [ $order_status => $settings_key ]
	 */
	public function woo_order_status_mapping( $obj_type_id ) {
		global $zbs;

		// convert to key for use in legacy setting name
		$obj_type_key = $zbs->DAL->objTypeKey( $obj_type_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		$setting_prefix = $this->get_woo_order_mapping_types()[ $obj_type_key ]['prefix'];

		return array(
			'completed'      => $setting_prefix . 'wccompleted',
			'on-hold'        => $setting_prefix . 'wconhold',
			'cancelled'      => $setting_prefix . 'wccancelled',
			'processing'     => $setting_prefix . 'wcprocessing',
			'refunded'       => $setting_prefix . 'wcrefunded',
			'failed'         => $setting_prefix . 'wcfailed',
			'pending'        => $setting_prefix . 'wcpending',
			'checkout-draft' => $setting_prefix . 'wccheckoutdraft',
		);
	}

	/**
	 * Translates a WooCommerce order status to a CRM contact resultant status
	 *  previously `apply_status`
	 *
	 * @param string $obj_type_id Object type ID.
	 * @param string $order_status Status from WooCommerce order (e.g. 'processing').
	 *
	 * @return string contact status
	 */
	public function translate_order_status_to_obj_status( $obj_type_id, $order_status ) {
		global $zbs;

		$settings = $this->get_settings();

		// get default object status for given Woo order status
		$default_status = $this->get_default_status_for_order_obj( $obj_type_id, $order_status );

		// if status mapping is disabled, return default status
		$is_status_mapping_enabled = ( isset( $settings['enable_woo_status_mapping'] ) ? ( (int) $settings['enable_woo_status_mapping'] === 1 ) : true );
		if ( ! $is_status_mapping_enabled ) {
			return $default_status;
		}

		// mappings
		$woo_order_status_mapping = $this->woo_order_status_mapping( $obj_type_id );

		if (
			! empty( $settings[ $woo_order_status_mapping[ $order_status ] ] )
			&& $zbs->DAL->is_valid_obj_status( $obj_type_id, $settings[ $woo_order_status_mapping[ $order_status ] ] ) // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		) {
			// there's a valid mapping in settings, so use that
			return $settings[ $woo_order_status_mapping[ $order_status ] ];
		} elseif ( $default_status ) {
			// there's a default object mapping for this order status, so use that
			return $default_status;
		}

		// use provided order status as fallback status
		return $order_status;
	}


	// ===============================================================================
	// ===========   Connections DAL  ================================================


	/**
	 * Attempts to retrieve products to validate connection settings
	 * 
	 * @param $site_key
	 * 
	 * or
	 * 
	 * @param $domain
	 * @param $api_key
	 * @param $api_secret
	 * 
	 */
	public function verify_api_connection( $site_key, $domain='', $api_key='', $api_secret='' ){

		// site key or creds?
		if ( !empty( $site_key ) ){

			// retrieve site
			$sync_site = $this->get_active_sync_site( $site_key );

			// remote site?
			if ( is_array( $sync_site ) && $sync_site['mode'] == JPCRM_WOO_SYNC_MODE_API ){

				// Woo client library
				$woocommerce_client = $this->get_woocommerce_client( $site_key ); 

			}

		} elseif ( !empty( $domain ) && !empty( $api_key ) && !empty( $api_secret ) ) {

			// attempt with creds
			$woocommerce_client = $this->get_woocommerce_client( false, $domain, $api_key, $api_secret ); 

		}

		// got a client?
		if ( isset( $woocommerce_client ) ){

			try {
	

				// Set params
				$product_list = $woocommerce_client->get( 'products', array( 'per_page' => 1 ) );

				// success if no exceptions thrown!
				if ( is_array( $product_list ) ){
					return true;
				}

			} catch ( HttpClientException $e ) {
				

				//echo "<div class='ui message red'><i class='ui icon exclamation circle'></i> WooCommerce Client Error: " . print_r( $e->getMessage(), true ) . "</div>";
				return false;

			}

		} 

		return false;

	}


	/**
	 * Returns an array of active sites which need syncing ordered by longest since sync
	 * Note: This ignores `paused` state, which should be checked for within these records via the attribute `paused`
	 * 
	 * @param string $order_by	 
	 * 
	 */
	public function get_active_sync_sites( $order_by = 'last_sync' ){

		global $zbs;

		// retrieve existing
		$sync_sites = $this->settings->get( 'sync_sites' );
		if ( !is_array( $sync_sites ) ){
			$sync_sites = array();
		}

		// Add local if present
		// Catches when a user now has Woo installed but they didn't before, and then adds a sync site for it
		if ( !$this->skip_local_woo_check && $zbs->woocommerce_is_active() ){

			// does it already have a stored record?
			if ( !isset( $sync_sites['local'] ) ){

				// build local sync record
				$this->add_sync_site( array(

        			'site_key'       => 'local',
        			
		            'mode'           => JPCRM_WOO_SYNC_MODE_LOCAL,
		            'domain'         => site_url(),
		            'key'            => '',
		            'secret'         => '',
		            'prefix'         => '',

		            'paused'         => false, // default to enabled

		        ));

		        // reload sync sites
				$sync_sites = $this->settings->get( 'sync_sites' );

			}
	
		}

		// sorts
		switch ( $order_by ){

			case 'last_sync':

				uasort( $sync_sites, array( $this, 'compare_sync_sites_for_order_last_sync' ) );

				break;

		}

		return $sync_sites;

	}



	/**
	 * Sort compare function to help order sync_sites
	 */
	private function compare_sync_sites_for_order_last_sync( $a, $b ){

		return $this->compare_sync_sites_for_order( $a, $b, 'last_sync' );

	}

	/**
	 * Sort compare function to help order sync_sites
	 */
	private function compare_sync_sites_for_order( $a, $b, $attribute_key ){

		$x = ( isset( $a[ $attribute_key ] ) ? $a[ $attribute_key ] : false );
		$y = ( isset( $b[ $attribute_key ] ) ? $b[ $attribute_key ] : false );

		return strcmp( $x, $y );

	}


	/**
	 * Retrieve single sync site via key
	 */
	public function get_active_sync_site( $site_key = '' ){

		// get existing
		$sync_sites = $this->get_active_sync_sites( 'default' );

		if ( isset( $sync_sites[ $site_key ] ) ){

			return $sync_sites[ $site_key ];
		}

		return false;

	}


	/**
	 * Takes an URL and makes a unique site key slug from it, testing against existing
	 */
	public function generate_site_key( $site_url ){

		$attempts = 0;
		$max_attempts = 20;

		while ( $attempts < $max_attempts ){

			$new_key = $this->generate_site_key_string( $site_url );

			// seems to exist, append
			if ( $attempts > 0 ){

				$new_key .= '_' . $attempts;

			}

			// exists?
			if ( $this->get_active_sync_site( $new_key ) === false ){

				return $new_key;

			}
			$attempts++;

		}

		return false;

	}


	/**
	 * Takes an URL and makes a site key slug from it
	 */
	private function generate_site_key_string( $site_url ){

		global $zbs;

		// simplistic replacements
		$site_url = str_replace( array( 'https', 'http' ), '', $site_url );
		$site_url = str_replace( array( '/', '.' ), '_', $site_url );
		$site_url = str_replace( '__', '_', $site_url );

		// use DAL finally
		$site_url = $zbs->DAL->makeSlug( $site_url, array(), '_' );

		return $site_url;

	}


	/**
	 * Add a new Sync Site record
	 */
	public function add_sync_site( $args=array() ){

        // ============ LOAD ARGS ===============
        $defaultArgs = array(

        	'site_key'       => '', // if none is passed, domain will be used to generate

            'mode'           => -1,
            'domain'         => '',
            'key'            => '',
            'secret'         => '',
            'prefix'         => '',

            'paused'         => false, // if set to non-false site will not sync (typically pass timestamp of time paused)

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }        
        // ============ / LOAD ARGS =============

		// get existing (but side-step the woo local check because that can cause an infinite loop)
		$pre_state = $this->skip_local_woo_check;
		$this->skip_local_woo_check = true;
		$sync_sites = $this->get_active_sync_sites( 'default' );
		$this->skip_local_woo_check = $pre_state;

        // basic validation
        if ( !in_array( $mode, array( JPCRM_WOO_SYNC_MODE_LOCAL, JPCRM_WOO_SYNC_MODE_API ) ) ){
        	return false;
        }
        if ( isset( $sync_sites[ $site_key ] ) ){
        	return false;
        }

	    
        // if no site key, attempt to generate one:
        if ( empty( $site_key ) ){

			if ( $mode == JPCRM_WOO_SYNC_MODE_LOCAL ){
				
				$site_key = 'local';

				// if local and already have a local, error?
		        if ( isset( $sync_sites[ $site_key ] ) ){
		        	return false;
		        }

			} else {

				if ( !empty( $domain ) ){
					
					$site_key = $this->generate_site_key( $domain );

				} else {

					// external site setup without a domain ¯\_(ツ)_/¯
					$site_key = $this->generate_site_key( 'no_domain' );

				}

			}

			// any luck?
			if ( empty( $site_key ) ){

				return false;

			}

		}

        
        // add
        $sync_sites[ $site_key ] = array(

            'mode'           => $mode,
            'domain'         => $domain,
            'key'            => $key,
            'secret'         => $secret,
            'prefix'         => $prefix,

            // tracking
            'last_sync_fired'        => -1,
            'resume_from_page'       => 1,
            'total_order_count'      => 0,
            'total_customer_count'   => 0,
            'first_import_complete'  => false,

        );

        // pause, if present
        if ( $paused ){

        	$sync_sites[ $site_key ][ 'paused' ] = $paused;

        }

        // save
        $this->settings->update( 'sync_sites', $sync_sites );

        // add the sitekey (which may have been autogenerated above) and return
        $sync_sites[ $site_key ]['site_key'] = $site_key;
		return $sync_sites[ $site_key ];

	}


	/**
	 * Update sync site record
	 */
	public function update_sync_site( $args = array() ){

        // ============ LOAD ARGS ===============
        $defaultArgs = array(

        	'site_key'       => '',

            'mode'           => -1,
            'domain'         => '',
            'key'            => '',
            'secret'         => '',
            'prefix'         => '',

            'last_sync_fired'        => -1,
            'resume_from_page'       => 1,
            'total_order_count'      => 0,
            'total_customer_count'   => 0,
            'first_import_complete'  => false,

            'paused'                 => false, // if set to non-false site will not sync (typically pass timestamp of time paused)
            
            // meta
            'site_connection_errors' => 0, // counts how many connection errors since last good connection (allows for pausing on 3x errors)

        ); foreach ($defaultArgs as $argK => $argV){ $$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$$argK = $newData;} else { $$argK = $args[$argK]; } } }        
        // ============ / LOAD ARGS =============

		// get existing
		$sync_sites = $this->get_active_sync_sites( 'default' );

        // basic validation
        if ( empty( $site_key ) ){
        	return false;
        }
        if ( !in_array( $mode, array( JPCRM_WOO_SYNC_MODE_LOCAL, JPCRM_WOO_SYNC_MODE_API )) ){
        	return false;
        }
        
        // override
        $sync_sites[ $site_key ] = array(

            'mode'           => $mode,
            'domain'         => $domain,
            'key'            => $key,
            'secret'         => $secret,
            'prefix'         => $prefix,

            // tracking
            'last_sync_fired'        => $last_sync_fired,
            'resume_from_page'       => $resume_from_page,
            'total_order_count'      => $total_order_count,
            'total_customer_count'   => $total_customer_count,
            'first_import_complete'  => $first_import_complete,
            'site_connection_errors' => $site_connection_errors,

        );

        // pause, if present
        if ( $paused ){

        	$sync_sites[ $site_key ][ 'paused' ] = $paused;

        }

        // save
        $this->settings->update( 'sync_sites', $sync_sites );

        // return
		return $sync_sites[ $site_key ];

	}



	/**
	 * Set a specific attribute against a sync site
	 */
	public function set_sync_site_attribute( $site_key, $attribute_key, $value ){

		// get existing
		$sync_site = $this->get_active_sync_site( $site_key );

		// set
		$sync_site[ $attribute_key ] = $value;

		// save
		$data = $sync_site;
		$data['site_key'] = $site_key;
		return $this->update_sync_site( $data );

	}	


	/**
	 * Get a specific attribute from a sync site
	 */
	public function get_sync_site_attribute( $site_key, $attribute_key, $fallback_value=false ){

		// get existing
		$sync_site = $this->get_active_sync_site( $site_key );

		if ( isset( $sync_site[ $attribute_key ] ) ){

			return $sync_site[ $attribute_key ];

		}

		return $fallback_value;

	}


	/**
	 * Increment a count against a sync site
	 */
	public function increment_sync_site_count( $site_key, $attribute_key, $increment_by = 1 ){

		// get existing
		$sync_site = $this->get_active_sync_site( $site_key );

		// set?
		if ( !isset( $sync_site[ $attribute_key ] ) ){
			$sync_site[ $attribute_key ] = 0;
		}

		// increment
		$sync_site[ $attribute_key ] = (int)$sync_site[ $attribute_key ];
		$sync_site[ $attribute_key ] = $sync_site[ $attribute_key ] + $increment_by;

		// save
		$data = $sync_site;
		$data['site_key'] = $site_key;
		return $this->update_sync_site( $data );

	}


	/**
	 * Remove a Sync Site from the connection stack
	 */
	public function remove_sync_site( $site_key = '' ){

		// get existing
		$sync_sites = $this->get_active_sync_sites( 'default' );

        // basic validation
        if ( empty( $site_key ) || !isset( $sync_sites[ $site_key ] ) ){
        	return false;
        }
        
        // remove it
        unset( $sync_sites[ $site_key ] );

        // save
        $this->settings->update( 'sync_sites', $sync_sites );

        // return
		return true;

	}


	/**
	 * Pause a sync site
	 */
	public function pause_sync_site( $site_key ){

		return $this->set_sync_site_attribute( $site_key, 'paused', time() );

	}	


	/**
	 * Resume a sync site
	 */
	public function resume_sync_site( $site_key ){

		// get existing
		$sync_site = $this->get_active_sync_site( $site_key );

		// unset
		unset( $sync_site[ 'paused' ] );

		// save
		$data = $sync_site;
		$data['site_key'] = $site_key;
		return $this->update_sync_site( $data );

	}




	/**
	 * Returns WooCommerce Client instance
	 *  built using settings based keys etc.
	 * 
	 * @param $domain
	 * @param $key
	 * @param $secret
	 * 
	 */
	public function get_woocommerce_client( $site_key = '', $domain='', $key='', $secret='' ){

		// load via site key
		if ( !empty( $site_key ) ){

			$site_info = $this->get_active_sync_site( $site_key );

			// got sync site?
			if ( !is_array( $site_info ) ){

				return false;

			}

			$domain     = $site_info['domain'];
			$key        = $site_info['key'];
			$secret     = $site_info['secret'];

		}

		// got creds?
		if ( !empty( $key ) && !empty( $secret ) && !empty( $domain ) ){

			// include the rest API files
			$this->include_woocommerce_rest_api();

			return new Client(
				$domain, 
				$key, 
				$secret,
				[
					// https://github.com/woocommerce/wc-api-php
					'version' => 'wc/v3',

					// https://stackoverflow.com/questions/42186757/woocommerce-woocommerce-rest-cannot-view-status-401
					'query_string_auth' => true,

				]
			);

		} else {

			$missing = array();
			if ( empty( $key ) ){
				$missing[] = 'key';
			}
			if ( empty( $secret ) ){
				$missing[] = 'secret';
			}
			if ( empty( $domain ) ){
				$missing[] = 'domain';
			}

	       	throw new Missing_Settings_Exception( 101, 'Failed to load WooCommerce API Library', array( 'missing' => $missing ) );

		}

		return false;

	}


	// =========== / Connections DAL  ================================================
	// ===============================================================================
	

	// ===============================================================================
	// =========== WooSync Specific Migrations  ======================================


	/*
	* Migrations
	*/
	private function run_migrations(){

		// 5.2 - Migrate any WooSync site connections from 1:many setup
		$this->migrate_52();

	}


	/*
	* Migration 5.2 - Migrate any WooSync site connections from 1:many setup
	* Should only really need to run once
	*/
	private function migrate_52(){

		// retrieve current settings
		$settings = $this->get_settings();

		// completed already?
		$migration_status = get_option( 'jpcrm_woosync_52_mig' );

		if ( !$migration_status ){

			// do we have settings even?
			if ( is_array( $settings ) && isset( $settings['wcsetuptype'] ) && in_array( $settings['wcsetuptype'], array( JPCRM_WOO_SYNC_MODE_LOCAL, JPCRM_WOO_SYNC_MODE_API ) ) ){

				// It's important we set this before we migrate because otherwise if local install exists it'll catch itself in a loop attempting to make it on the fly
				$this->skip_local_woo_check = true;

				// looks like it. 

				// only if we're not in local, pass the domain and keys.
				// (we don't want to pass them if local because of the situation where a user may have previously 
				// had an external site and then we'd end up with a local sync site record with remote domain)				
			    if ( $settings['wcsetuptype'] == JPCRM_WOO_SYNC_MODE_LOCAL ){

			    	$data = array(

	        			'site_key'       => 'local',
	        			
			            'mode'           => JPCRM_WOO_SYNC_MODE_LOCAL,
			            'domain'         => site_url(),
			            'key'            => '',
			            'secret'         => '',
			            'prefix'         => ''

			        );

			    } else if ( $settings['wcsetuptype'] == JPCRM_WOO_SYNC_MODE_API ){

			        $data = array(

			    		'site_key'       => '', // let woosync generate it

				        'mode'           => JPCRM_WOO_SYNC_MODE_API,
				        'domain'         => $settings['wcdomain'],
				        'key'            => $settings['wckey'],
				        'secret'         => $settings['wcsecret'],
				        'prefix'         => $settings['wcprefix'],

				    );

			    }

				// add as new sync site record
				$new_sync_site = $this->add_sync_site( $data );

			    // verify
			    if ( is_array( $new_sync_site ) && !empty( $new_sync_site['site_key'] ) && $this->get_active_sync_site( $new_sync_site['site_key'], true ) ){

			    	// backup and remove old settings
			    	update_option( 'jpcrm_woosync_52_mig_backup', $settings, false );
			    	$this->settings->delete('wcsetuptype');
			    	$this->settings->delete('wcdomain');
			    	$this->settings->delete('wckey');
			    	$this->settings->delete('wcsecret');
			    	$this->settings->delete('wcprefix');

			    	// mark migrated
			    	update_option( 'jpcrm_woosync_52_mig', time(), false );

			    } else {

			    	// failed migration... will keep trying to run ?

			        // insert notification
			        zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'woosync.5.2.migration', 'failed_importing_sync_site' );
		        

			    }

			} else {

				// no settings, fresh install with no past, simple.
			    update_option( 'jpcrm_woosync_52_mig', time(), false );

			}

		} 

	}

	// =========== / WooSync Specific Migrations  ====================================
	// ===============================================================================


	/**
	 * Register WooSync webhook actions with the CRM API
	 * 
	 * @param array $valid_webhook_actions
	 * 
	 * @return array $valid_webhook_actions
	**/
	public function add_webhook_actions( $valid_webhook_actions ) {
		$valid_webhook_actions[] = 'woosync_do_something';
		add_action( 'jpcrm_webhook_woosync_do_something', array( $this, 'webhook_process_some_data' ) );

		return $valid_webhook_actions;
	}

	/**
	 * Example function when `woosync_do_something` webhook action is called
	 * 
	 * @param array $data
	**/
	public function webhook_process_some_data( $data ) {
		// do stuff with data, e.g.
		// wp_send_json_success( $data );
	}


	/*
	 *   Adds segment condition category positions (to effect the display order)
	 */
	public function add_segments_condition_category_positions( $positions = array() ) {

	    global $zbs;

	    $positions['woosync'] = 10;

	    return $positions;

	}
}
