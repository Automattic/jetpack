<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Background Sync
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * WooSync Background Sync class
 */
class Woo_Sync_Background_Sync {

	/**
	 * Ready Mode, 
	 * No syncing will run unless this is set to true. 
	 * This is designed to allow for migrations to run on update, before collision-likely sync runs.
	 */
	private $ready_mode = false;
	
	/**
	 * If set to true this will echo progress of a sync job.
	 */
	public $debug = false;

	/*
	 * Tax rates table storage
	 */
	private $tax_rates_table = false;

	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup WooSync Background Sync
	 * Note: This will effectively fire after core settings and modules loaded
	 * ... effectively on tail end of `init`
	 */
	public function __construct( ) {

		// check we're good to go
		$this->verify_ready_mode();

		if ( $this->ready_mode ){

			// load job class
			require_once JPCRM_WOO_SYNC_ROOT_PATH. 'includes/class-woo-sync-background-sync-job.php';

			// Initialise Hooks
			$this->init_hooks();

			// Schedule cron
			$this->schedule_cron();

		}

	}
		

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Woo_Sync_Background_Sync is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Woo_Sync_Background_Sync main instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}


	/**
	 * Returns main class instance
	 */
	public function woosync(){

		global $zbs;
		return $zbs->modules->woosync;

	}


	/**
	 * Checks that all 'pre-ready' conditions are met before enabling sync
	 * (Critical migrations when we moved from 1 to many site syncing)
	 */
	public function verify_ready_mode( ){

		// check for critical migration when we moved from 1 to many site syncing
		$migration_status = get_option( 'jpcrm_woosync_52_mig' );		
		if ( $migration_status ){

			$this->ready_mode = true;

		}

		return $this->ready_mode;

	}

	
	/**
	 * If $this->debug is true, outputs passed string
	 *
	 * @param string - Debug string
	 */
	private function debug( $str ){

		if ( $this->debug ){

			echo '[' . zeroBSCRM_locale_utsToDatetime( time() ) . '] ' . $str . '<br>';

		}

	}


	/**
	 * Initialise Hooks
	 */
	private function init_hooks( ) {

		// cron
		add_action( 'jpcrm_woosync_sync', array( $this, 'cron_job' ) );

		// Syncing based on WooCommerce hooks:

		// Order changes:
		add_action( 'woocommerce_order_status_changed',    array( $this, 'add_update_from_woo_order' ), 1, 1 );
		add_action( 'woocommerce_process_shop_order_meta', array( $this, 'add_update_from_woo_order' ), 100, 1 );
		add_action( 'woocommerce_deposits_create_order',   array( $this, 'add_update_from_woo_order' ), 100, 1 );
		add_action( 'wp_trash_post',                       array( $this, 'woocommerce_order_trashed' ), 10, 1 );
		add_action( 'before_delete_post',                  array( $this, 'woocommerce_order_deleted' ), 10, 1 );	

		// Catch WooCommerce customer address changes and update contact:
		add_action( 'woocommerce_customer_save_address',   array( $this, 'update_contact_address_from_wp_user' ), 10, 3 );

		// add our cron task to the core crm cron monitor list
		add_filter( 'jpcrm_cron_to_monitor',               array( $this, 'add_cron_monitor' ) );

	}


	/**
	 * Setup cron schedule
	 */
	private function schedule_cron( ) {

		// schedule it
		if ( ! wp_next_scheduled( 'jpcrm_woosync_sync' ) ) {
		  wp_schedule_event( time(), '5min', 'jpcrm_woosync_sync' );
		}	

	}


	/**
	 * Run cron job
	 */
	public function cron_job(){

		// define global to mark this as a cron call
		define( 'jpcrm_woosync_cron_running', 1 );

		// fire job
		$this->sync_orders();

	}

	/**
	 * Returns bool as to whether or not the current call was made via cron
	 */
	private function is_cron(){

		return defined( 'jpcrm_woosync_cron_running' );

	}


	/**
	 * Filter call to add the cron zbssendbot to the watcher system
	 *
	 * @param array $crons
	 * @return array
	 */
	function add_cron_monitor( $crons ) {

		if ( is_array( $crons ) ) {

			$crons[ 'jpcrm_woosync_sync' ] = '5min'; //'hourly';
		}

		return $crons;
	}


	/**
	 * Main job function: using established settings, this will retrieve and import orders
	 *  from WooCommerce into CRM. This can be called in three 'modes'
	 *    - via cron (as defined by `jpcrm_woosync_cron_running`)
	 *    - via AJAX (if not via cron and not in debug mode)
	 *    - for debug (if $this->debug is set) This is designed to be called inline and will output progress of sync job
	 *
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of orers imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of orders imported is returned
	 */
	public function sync_orders(){

		global $zbs;

		$this->debug( 'Fired `sync_orders()`.' );

		if ( !$this->ready_mode ){

			$this->debug( 'Blocked by !ready_mode.' );

			// return blocker error
			return array( 
				'status' => 'not_in_ready_mode',
				'status_short_text' => __( 'Unable to complete migration 5.2', 'zero-bs-crm' ),
				'status_long_text' => __( 'WooSync was unable to complete a necessary migration and therefore cannot yet sync.', 'zero-bs-crm' ),
			);

		}

		$sync_sites = $this->woosync()->get_active_sync_sites();

		$this->debug( 'Sync Sites:<pre>' . print_r( $sync_sites, 1 ) . '</pre>' );

		if ( !is_array( $sync_sites ) ){
			
			$this->debug( 'Failed to retrieve sites to sync! ' );

		}

		// check not currently running
		if ( defined( 'jpcrm_woosync_running' ) ) {

			$this->debug( 'Attempted to run `sync_orders()` when job already in progress.' );

			// return blocker error
			return array( 'status' => 'job_in_progress' );

		}

		$this->debug( 'Commencing syncing ' . count( $sync_sites ) . ' sites.' );

		// prep silos
		$total_remaining_pages = 0;
		$total_pages = 0;
		$total_active_connections = 0;
		$total_paused_connections = 0;
		$errors = array();

		// cycle through each sync site and attempt sync
		foreach ( $sync_sites as $site_key => $site_info ){

			// check not marked 'paused'
			if ( isset( $site_info['paused'] ) && $site_info['paused'] ){

				// skip it
				$total_paused_connections++;
				$this->debug( 'Skipping Sync for ' . $site_info['domain'] . ' (mode: ' . $site_info['mode'] . ') - Paused' );
				continue;

			}

			$this->debug( 'Starting Sync for ' . $site_info['domain'] . ' (mode: ' . $site_info['mode'] . ')' );
			$total_active_connections++;

			// blocker			
			if ( !defined( 'jpcrm_woosync_running' ) ) {
			
				define( 'jpcrm_woosync_running', 1 );
			
			}

			// init class
			$sync_job = new Woo_Sync_Background_Sync_Job( $site_key, $site_info, $this->debug );

			// start sync job
			$sync_result = $sync_job->run_sync();
			
			$this->debug( 'Sync Result:<pre>' . print_r( $sync_result, 1 ) . '</pre>' );

			/* will be
			false

			or

			array(

				'total_pages'           => $total_pages,
				'total_remaining_pages' => $total_remaining_pages,
				'errors'                => $errors,

			);*/

			if ( is_array( $sync_result ) && isset( $sync_result['total_pages'] ) && isset( $sync_result['total_remaining_pages'] ) ){

				// maintain overall % counts later used to provide a summary % across sync site connections
				$total_pages += (int)$sync_result['total_pages'];
				$total_remaining_pages += $sync_result['total_remaining_pages'];

			}

		}

		// discern completeness
		if ( $total_active_connections > 0 ){

			if ( $total_paused_connections === 0 ){

				// no paused connections

				if ( $total_remaining_pages == 0 ){

					$sync_status = 'sync_completed';
					$overall_percentage = 100;
					$status_short_text = __( 'Sync Completed', 'zero-bs-crm' );
					$status_long_text = __( 'WooSync has imported all existing orders and will continue to import future orders.', 'zero-bs-crm' );

				} else {

					$sync_status = 'sync_part_complete';
					$overall_percentage = (int)( ( $total_pages - $total_remaining_pages ) / $total_pages * 100 );
					$status_short_text = __( 'Syncing content from WooCommerce...', 'zero-bs-crm' );
					$status_long_text = '';

				}

			} else {

				// has some paused connections

				if ( $total_remaining_pages == 0 ){

					$sync_status = 'sync_completed';
					$overall_percentage = 100;
					$status_short_text = __( 'Sync Completed for active connections', 'zero-bs-crm' );
					$status_long_text = __( 'WooSync has imported existing orders for sites with active connections, but could not import from paused site connections.', 'zero-bs-crm' );

				} else {

					$sync_status = 'sync_part_complete';
					$overall_percentage = (int)( ( $total_pages - $total_remaining_pages ) / $total_pages * 100 );
					$status_short_text = __( 'Syncing content from WooCommerce...', 'zero-bs-crm' );
					$status_long_text = '';

				}

			}

		} else {

			if ( $total_remaining_pages == 0 ){

				$sync_status = 'sync_completed';
				$overall_percentage = 100;
				$status_short_text = __( 'Sync Previously Completed', 'zero-bs-crm' );
				$status_long_text = __( 'WooSync imported orders previously, but is not currently actively syncing due to paused connections.', 'zero-bs-crm' );

			} else {

				$sync_status = 'sync_part_complete';
				$overall_percentage = (int)( ( $total_pages - $total_remaining_pages ) / $total_pages * 100 );
				$status_short_text = __( 'WooSync is trying to sync, but cannot retrieve all orders due to paused connections.', 'zero-bs-crm' );
				$status_long_text = '';

			}


		}

		// if cron, we just return count
		if ( $this->is_cron() ) {

			return array(

					'status'               => $sync_status, // sync_completed sync_part_complete job_in_progress error
					'status_short_text'    => $status_short_text,
					'percentage_completed' => $overall_percentage,

			);

		} else {

			$this->debug( 'Completed multi-site sync job: ' . $sync_status );
			$woosync_status_array = array(
				'status'               => $sync_status,
				'status_short_text'    => $status_short_text,
				'status_long_text'     => $status_long_text,
				'page_no'              => ( $total_pages - $total_remaining_pages ),
				'orders_imported'      => 0,
				'percentage_completed' => $overall_percentage,
			);
			$woosync_latest_stats = $this->woosync()->get_jpcrm_woo_latest_stats();
			echo json_encode( array_merge( $woosync_latest_stats, $woosync_status_array ) );
			exit();

		}

	}



	/**
	 * Update contact address of a wp user (likely WooCommerce user)
	 *
	 * @param int $user_id (WordPress user id)
	 * @param string $address_type (e.g. `billing`)
	 */
	public function update_contact_address_from_wp_user( $user_id = -1, $address_type = 'billing' ){

		global $zbs;

		// retrieve contact ID from WP user ID
		$contact_id 	= $zbs->DAL->contacts->getContact(array(
			'WPID'      => $user_id,
			'onlyID'    => true
		));

		if ( $contact_id > 0 ){

			// retrieve customer data from WP user ID
			$woo_customer_meta 	= get_user_meta( $user_id );
			
			if ( $address_type == 'billing' ){

				$data = array(
						'addr1' 	=> $woo_customer_meta['billing_address_1'][0],
						'addr2' 	=> $woo_customer_meta['billing_address_2'][0],
						'city' 		=> $woo_customer_meta['billing_city'][0],
						'county' 	=> $woo_customer_meta['billing_state'][0],
						'country' 	=> $woo_customer_meta['billing_country'][0],
						'postcode' 	=> $woo_customer_meta['billing_postcode'][0],
				);

			} else {
			
				$data = array(
						'secaddr1' 		=> $woo_customer_meta['shipping_address_1'][0],
						'secaddr2' 		=> $woo_customer_meta['shipping_address_2'][0],
						'seccity' 		=> $woo_customer_meta['shipping_city'][0],
						'seccounty' 	=> $woo_customer_meta['shipping_state'][0],
						'seccountry' 	=> $woo_customer_meta['shipping_country'][0],
						'secpostcode' 	=> $woo_customer_meta['shipping_postcode'][0],
				);
			
			}

			// addUpdate as limited fields
			$limited_fields_array = array();
			foreach ( $data as $k => $v ){

				$limited_fields_array[] = array(

					'key' => 'zbsc_' .$k,
					'val' => $v,
					'type'=> '%s'

				);

			}

			// then addUpdate
			$zbs->DAL->contacts->addUpdateContact(array(

				'id'             => $contact_id,
				'limitedFields'  => $limited_fields_array

			));

		}

	}


	/**
	 * Catches trashing of WooCommerce orders and (optionally) removes transactions from CRM
	 *
	 * @param int $order_post_id
	 */
	public function woocommerce_order_trashed( $order_post_id ) {

		// retrieve action
		$delete_action = $this->woosync()->settings->get( 'auto_trash', false );

		// action?
		if ( $delete_action === 'do_nothing' ) {
			return;
		}

		// act
		$this->woocommerce_order_removed( $order_post_id, $delete_action );

	}


	/**
	 * Catches deletion of WooCommerce orders and (optionally) removes transactions from CRM
	 *
	 * @param int $order_post_id
	 */
	public function woocommerce_order_deleted( $order_post_id ) {

		// retrieve action
		$delete_action = $this->woosync()->settings->get( 'auto_delete', false );

		// action?
		if ( $delete_action === 'do_nothing' ) {
			return;
		}

		// act
		$this->woocommerce_order_removed( $order_post_id, $delete_action );

	}


	/**
	 * Catches deletion of WooCommerce orders and (optionally) removes transactions from CRM
	 *
	 * @param int $order_post_id
	 * @param str $delete_action
	 */
	private function woocommerce_order_removed( $order_post_id, $delete_action ) {

		global $zbs;

		// was it an order that was deleted?
		$post_type = get_post_type( $order_post_id );
		if ( $post_type !== 'shop_order' ) {
			return;
		}

		// catch default
		if ( empty( $delete_action ) ) {
			$delete_action = 'change_status';
		}

		// retrieve order
		$order = wc_get_order( $order_post_id );

		if ( method_exists( $order, 'get_order_number' ) ) {
			$order_num = $order->get_order_number();
		} else {
			// order number by default is the same as the order post ID
			$order_num = $order_post_id;
		}

		// get transaction
		$transaction_id = $this->woosync()->get_transaction_from_order_num( $order_num, '', true );

		if ( $transaction_id > 0 ) {

			// retrieve any associated invoices
			$invoice_id = $zbs->DAL->transactions->get_transaction_invoice_id( $transaction_id );

			// act
			switch ( $delete_action ) {

				// change the transaction (and invoice) status to 'Deleted'
				case 'change_status':

					// set status
					$zbs->DAL->transactions->setTransactionStatus( $transaction_id, __( 'Deleted', 'zero-bs-crm' ) );

					// Also change the status on any woo-created associated invoice
					if ( $invoice_id > 0 ) {
						$zbs->DAL->invoices->setInvoiceStatus( $invoice_id, __( 'Deleted', 'zero-bs-crm' ) );
					}

					break;

				// Delete the transaction (and invoice) and add log to contact
				case 'hard_delete_and_log':

					// delete transaction
					$zbs->DAL->transactions->deleteTransaction( array(
						'id' => $transaction_id
					));

					// Also delete any woo-created associated invoice
					if ( $invoice_id > 0 ) {
						$zbs->DAL->invoices->deleteInvoice( array(
							'id'            => $invoice_id,
							'saveOrphans'   => false
						));
					}

					// get contact(s) to add log to
					// only 1:1 via ui currently, but is support for many in DAL
					$contacts = $zbs->DAL->transactions->get_transaction_contacts( $transaction_id );

					if ( is_array( $contacts ) ) {

						foreach ( $contacts as $contact ) {

							// add log
							$zbs->DAL->logs->addUpdateLog( array(

								'data' => array(

									'objtype'   => ZBS_TYPE_CONTACT,
									'objid'     => $contact['id'],
									'type'      => 'transaction_deleted',
									'shortdesc' => __( 'WooCommerce Order Deleted', 'zero-bs-crm' ),
									'longdesc'  => sprintf( __( 'Transaction #%s was removed from your CRM after the related WooCommerce order #%s was deleted.', 'zero-bs-crm' ), $transaction_id, $order_num )

								),

							));

						}

					}

					break;

			}

		}

	}

	/**
	 * Add or update an order from local WooCommerce (passthru to sync job)
	 *
	 * @param int $order_id - Order id from WooCommerce (may be different than $order_num)
	 */
	public function add_update_from_woo_order( $order_id ) {

		$sync_sites = $this->woosync()->settings->get( 'sync_sites' );

		// if there's a local site and if it's not paused
		if ( isset( $sync_sites['local'] ) && empty( $sync_sites['local']['paused'] ) ) {

			$local_site_info = $sync_sites['local'];

			$local_sync_job = new Woo_Sync_Background_Sync_Job( 'local', $local_site_info, $this->debug );

			$local_sync_job->add_update_from_woo_order( $order_id );

		}

	}

	/**
	 * Get tax rates table (cached)
	 */
	public function get_tax_rates_table( $refresh_from_db = false ) {

		if ( !is_array( $this->tax_rates_table ) || $refresh_from_db ){

			// retrieve tax table to feed in tax links
			$this->tax_rates_table = zeroBSCRM_taxRates_getTaxTableArr( true );

		}

		return $this->tax_rates_table;

	}


}