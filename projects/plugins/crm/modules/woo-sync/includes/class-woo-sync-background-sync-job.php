<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Background Sync Job (per run, site connection)
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

#} the WooCommerce API
use Automattic\WooCommerce\Client;
use Automattic\WooCommerce\HttpClient\HttpClientException;
use Automattic\JetpackCRM\Missing_Settings_Exception;

/**
 * WooSync Background Sync Job class
 */
class Woo_Sync_Background_Sync_Job {


	/**
	 * Site Key
	 */
	private $site_key = false;

	/**
	 * Site Info
	 */
	private $site_info = false;

	/**
	 * Paused state
	 */
	private $paused = false;

	/**
	 * Number of orders to process per job
	 */
	private $orders_per_page = 50;
	private $pages_per_job = 1;

	/**
	 * Current page the job is working on
	 */
	private $current_page = 1;

	/**
	 * Number of pages in Woo
	 */
	private $woo_total_pages = 0;

	/**
	 * Number of orders in Woo
	 */
	private $woo_total_orders = 0;
	
	/**
	 * If set to true this will echo progress of a sync job.
	 */
	public $debug = false;

	/**
	 * Setup WooSync Background Sync
	 * Note: This will effectively fire after core settings and modules loaded
	 * ... effectively on tail end of `init`
	 */
	public function __construct( $site_key = '', $site_info = false, $debug = false, $orders_per_page = 50, $pages_per_job = 1 ) {

		// requires key
		if ( empty( $site_key ) ){

			// fail.
			return false;

		}

		// set vars
		$this->site_key        = $site_key;
		$this->site_info       = $site_info;
		$this->debug           = $debug;
		$this->orders_per_page = $orders_per_page;
		$this->pages_per_job   = $pages_per_job;

		// load where not passed
		if ( !is_array( $this->site_info ) ){

			$this->site_info = $this->woosync()->get_active_sync_site( $this->site_key );

		}

		// promote paused state
		if ( isset( $this->site_info['paused'] ) && $this->site_info['paused'] ){

			$this->paused = true;

		}

		// good to go?
		if ( empty( $this->site_key ) || !is_array( $this->site_info ) ){
			
			return false;

		}

	}


	/**
	 * Returns main class instance
	 */
	public function woosync(){

		global $zbs;
		return $zbs->modules->woosync;

	}


	/**
	 * Returns full settings array from main settings class
	 */
	public function settings(){

		return $this->woosync()->settings->getAll();

	}



	/**
	 * Returns 'local' or 'api'
	 *  (whichever mode is selected in settings)
	 */
	public function import_mode( $str_mode = false ){

		// import mode
		$mode = (int)$this->site_info['mode'];

		// debug/string mode
		if ( $str_mode ) {
			if ( $mode === 0 ) {
				return 'JPCRM_WOO_SYNC_MODE_LOCAL';
			} else {
				return 'JPCRM_WOO_SYNC_MODE_API';
			}
		}

		return $mode;

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
	 * Main job function: this will retrieve and import orders from WooCommerce into CRM. 
	 * for a given sync site
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of orders imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of orders imported is returned
	 */
	public function run_sync(){

		global $zbs;

		$this->debug( 'Fired `sync_orders()` for `' . $this->site_key . '`.<pre>' . print_r( $this->site_info, 1 ) . '</pre>' );

		if ( !is_array( $this->site_info ) ){
			
			// debug
			$this->debug( 'Failed to retrieve site to sync! ' );
			return false;

		}

		// prep vars
		$run_sync_job = true;
		$total_remaining_pages = 0;
		$total_pages = 0;
		$errors = array();

		// check not marked 'paused'
		if ( $this->paused ){

			// skip it
			$this->debug( 'Skipping Sync for ' . $this->site_info['domain'] . ' (mode: ' . $this->site_info['mode'] . ') - Paused' );
			$run_sync_job = false;

		}

		$this->debug( 'Starting Sync for ' . $this->site_info['domain'] . ' (mode: ' . $this->site_info['mode'] . ')' );

		// switch by mode
		if ( $this->site_info['mode'] == JPCRM_WOO_SYNC_MODE_API ) {

			// vars
			$domain = $this->site_info['domain'];
			$key    = $this->site_info['key'];
			$secret = $this->site_info['secret'];
			$prefix = $this->site_info['prefix'];

			// confirm settings
			if ( empty( $domain ) || empty( $key ) || empty( $secret ) ) {

				$status_short_text = __( 'Setup required', 'zero-bs-crm' );

				$this->debug( $status_short_text );

				$errors[] = array(
					'status'            => 'error',
					'status_short_text' => $status_short_text,
					'status_long_text'  => sprintf( __( 'WooSync will start importing data when you have updated your settings. Your site connection <code>%s</code> needs more information to connect.', 'zero-bs-crm' ), $this->site_info['domain'] ),
					'error'             => 'external_no_settings',
				);

				// skip this site connection
				$run_sync_job = false;
	
			}
	
		} elseif ( $this->site_info['mode'] == JPCRM_WOO_SYNC_MODE_LOCAL ) {
	
			// local install

			// verify woo installed
			if ( !$zbs->woocommerce_is_active() ) {

				$status_short_text = __( 'Missing WooCommerce', 'zero-bs-crm' );

				$this->debug( $status_short_text );

				$errors[] = array(
					'status'            => 'error',
					'status_short_text' => $status_short_text,
					'status_long_text'  => __( 'WooSync will start importing data when you have installed WooCommerce.', 'zero-bs-crm' ),
					'error'             => 'local_no_woocommerce',
				);

				// skip this site connection
				$run_sync_job = false;

			}

		} else {

			// no mode, or a faulty one!
			$this->debug( 'Mode unacceptable' );

			$errors[] = array(
				'status'            => 'error',
				'status_short_text' => $status_short_text,
				'status_long_text'  => __( 'WooSync could not sync because one of your store connections is in an unacceptable mode.', 'zero-bs-crm' ),
				'error'             => 'local_no_woocommerce',
			);

			// skip this site connection
			$run_sync_job = false;

		}

		if ( $run_sync_job ){

			$this->debug( 'Running Import of ' . $this->pages_per_job . ' pages' );

			// do x pages
			for ( $i = 0; $i < $this->pages_per_job; $i++ ) {

				// get last working position
				$page_to_retrieve = $this->resume_from_page();

				// ... if for some reason we've got a negative, start from scratch.
				if ( $page_to_retrieve < 1 ) {

					$page_to_retrieve = 1;

				}

				$this->current_page = $page_to_retrieve;
				// import the page of orders
				// This always returns the count of imported orders,
				//   unless 100% sync is reached, at which point it will exit (if called via AJAX)
				//   for now, we don't need to track the return
				$this->import_page_of_orders( $page_to_retrieve );

			}

			// mark the pass
			$this->woosync()->set_sync_site_attribute( $this->site_key, 'last_sync_fired', time() );
			$this->debug( 'Sync Job finished for ' . $this->site_info['domain'] . ' with percentage complete: ' . $this->percentage_completed( false ) . '% complete.' );

		}

		// return overall % counts later used to provide a summary % across sync site connections
		$percentage_counts = $this->percentage_completed( true );
		if ( is_array( $percentage_counts ) ){

			$total_pages = (int)$percentage_counts['total_pages'];
			$total_remaining_pages = $percentage_counts['total_pages'] - $percentage_counts['page_no'];

		}

		// We should never have less than zero here
		// (seems to happen when site connections error out)
		if ( $total_remaining_pages < 0 ){
			$total_remaining_pages = 0;
		}

		return array(

			'total_pages'           => $total_pages,
			'total_remaining_pages' => $total_remaining_pages,
			'errors'                => $errors,

		);

	}


	/**
	 * Retrieve and process 1 page of WooCommerce orders via API or from local store
	 *
	 * @param int $page_no - the page number to start from
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of orders imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of orders imported is returned
	 */
	private function import_page_of_orders( $page_no ) {

		$this->debug( 'Fired `import_page_of_orders( ' . $page_no . ' )`, importing from ' . $this->import_mode( true ) . ' on site ' . $this->site_key .'.' );

		// store/api switch
		if ( $this->import_mode() === JPCRM_WOO_SYNC_MODE_API ) {

			// API
			return $this->import_orders_from_api( $page_no );

		} else {

			return $this->import_orders_from_store( $page_no );

		}

	}


	/**
	 * Retrieve and process a page of WooCommerce orders from local store
	 *  Previously `get_orders_from_store`
	 *
	 * @param int $page_no
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of orders imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of orders imported is returned
	 */
	public function import_orders_from_store( $page_no = -1 ) {

		// Where we're trying to run without WooCommerce, fail.
		// In theory we shouldn't ever hit this, as we catch it earlier.
		global $zbs;
		if ( !$zbs->woocommerce_is_active() ) {
			$this->debug( 'Unable to import as it appears WooCommerce is not installed.' );
			return false;
		}

		// retrieve orders
		$orders = wc_get_orders( array(
			'limit'    => $this->orders_per_page,
			'paged'    => $page_no,
			'paginate' => true,
			'order'    => 'ASC',
			'orderby'  => 'ID',
		));

		// count the pages and break if we have nothing to import
		if ( $orders->max_num_pages == 0 ) {

			// we're at 100%, mark sync complete
			$this->set_first_import_status( true );
			
			// return count
			return 0;

		}

		// cache values
		$this->woo_total_pages = $orders->max_num_pages;
		$this->woo_total_orders = $orders->total;

		// we have some pages to process, so proceed
		$orders_imported = 0;

		// cycle through orders from store and import
		foreach ( $orders->orders as $order ) {

			// We previously used the wp cpt ID, see #1982
			// In case we hit issues where a user sees dupes from this, we'll store any != in an extra meta
			$order_post_id = $order->get_id();

			// Get order number if there is one; for example refunds don't have 'get_order_number'
			if ( method_exists( $order, 'get_order_number' ) ) {
				$order_num = $order->get_order_number();
			} else {
				// order number by default is the same as the order post ID
				$order_num = $order_post_id;
			}

			if ( !empty( $order_post_id ) ) {

				$this->debug( 'Importing order: ' . $order_num . '(' . $order_post_id . ')' );

				// this seems perhaps unperformant given we have the `order` object
				// ... and this function re-get's the order object, but it's centralised and useful (and #legacy)
				$this->add_update_from_woo_order( $order_post_id );

				// this will include orders updated...
				$orders_imported++;

			}

		}

		// check for completion
		if ( $page_no >= $orders->max_num_pages ) {

			// we're at 100%, mark sync complete
			$this->set_first_import_status( true );

			// set pointer to last page
			$this->set_resume_from_page( $orders->max_num_pages );

			// return count
			return $orders_imported;

		}

		// There's still pages to go then:

		// increase pointer by one
		$this->set_resume_from_page( $page_no + 1 );

		// return the count
		return $orders_imported;

	}


	/**
	 * Retrieve and process a page of WooCommerce orders via API
	 *  Previously `get_orders_from_api`
	 *
	 * @param int $page_no
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of orders imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of orders imported is returned
	 */
	public function import_orders_from_api( $page_no = -1 ) {

		global $zbs;

		try {

			// get client
			$woocommerce = $this->woosync()->get_woocommerce_client( $this->site_key );

			$this->debug( 'Got WooCommerce Client...' );

			// clock origin
			$origin = '';
			$domain = $this->site_info['domain'];
			if ( !empty( $domain ) ) {

				// if Domain
				if ( $domain ) {
					
					$origin = $zbs->DAL->add_origin_prefix( $domain, 'domain' );

				}

			}

			// retrieve orders
			// http://woocommerce.github.io/woocommerce-rest-api-docs/#orders
			$orders = $woocommerce->get(
				'orders',
				array(
					'page'     => $page_no,
					'per_page' => $this->orders_per_page,
					'order'    => 'asc',
					'orderby'  => 'id',
				)
			);

			// retrieve page count from headers:
			$last_response       = $woocommerce->http->getResponse();
			$response_headers    = $last_response->getHeaders();
			$lc_response_headers = array_change_key_case( $response_headers, CASE_LOWER );

			// error if X-WP-TotalPages header doesn't exist
			if ( !isset( $lc_response_headers['x-wp-totalpages'] ) ) {

				echo json_encode(
					array(
						'status'               => 'error',
						'status_short_text'    => 'woo_api_missing_headers',
						'status_long_text'     => __( 'Missing headers in API response. It seems that WooCommerce has not responded in a standard way.', 'zero-bs-crm' ),
						'page_no'              => $page_no,
						'orders_imported'      => 0,
						'percentage_completed' => 0,
					)
				);
				exit;
			}

			// cache values
			$this->woo_total_pages = (int)$lc_response_headers['x-wp-totalpages'];
			$this->woo_total_orders = (int)$lc_response_headers['x-wp-total'];

			$total_pages = (int)$lc_response_headers['x-wp-totalpages'];

			$this->debug( 'API Response:<pre>' . var_export( array(

				'orders_retrieved'    => count( $orders ),
				// 'last_response'       => $last_response,
				// 'response_headers'    => $response_headers,
				// 'lc_response_headers' => $lc_response_headers,
				'total_pages'         => $this->woo_total_pages,

			), true ) . '</pre>' );

			// count the pages and break if we have nothing to import
			if ( $this->woo_total_pages === 0 ) {

				// we're at 100%, mark sync complete
				$this->set_first_import_status( true );

				// return count
				return 0;
			}

			// we have some pages to process, so proceed
			$orders_imported = 0;

			// cycle through orders
			foreach ( $orders as $order ) {

				$this->debug( 'Importing order: ' . $order->number . ' (becoming: ' . $this->woosync()->get_prefix( $this->site_key ) . $order->number . ')' );

				// prefix ID and number
				$order->number = $this->woosync()->get_prefix( $this->site_key ) . $order->number;
				$order->id = $this->woosync()->get_prefix( $this->site_key ) . $order->id;

				// translate order data to crm objects
				$crm_objects = $this->woocommerce_api_order_to_crm_objects( $order, $origin );

				// import crm objects
				$this->import_crm_object_data( $crm_objects );

				$orders_imported++;

			}

			// check for completion
			if ( $page_no >= $this->woo_total_pages ) {

				// we're at 100%, mark sync complete
				$this->set_first_import_status( true );

				// set pointer to last page
				$this->set_resume_from_page( $this->woo_total_pages );

			} else {

				// There's still pages to go then:

				// increase pointer by one
				$this->set_resume_from_page( $page_no + 1 );

			}

			// connection worked, so reset any errors:
			$this->woosync()->set_sync_site_attribute( $this->site_key, 'site_connection_errors', 0 );

			// return count
			return $orders_imported;

		} catch ( HttpClientException $e ) {

			$this->debug( 'Sync Failed in `import_orders_from_api()`, WooCommerce REST API error: ' . $e->getMessage() );

			/* 
			echo json_encode(
				array(

					'status'               => 'error',
					'status_short_text'    => 'woo_client_error',
					'status_long_text'     => $this->woosync()->process_error( $e->getMessage() ),
					'page_no'              => $page_no,
					'orders_imported'      => 0,
					'percentage_completed' => 0,

				)
			); */

			// log connection error (3x = auto-pause)
			$this->log_connection_error();

			return 'error';

		} catch ( Missing_Settings_Exception $e ) {

			// missing settings means couldn't load lib.

			// compile string of what's missing
			$missing_string = '';
			$missing_data = $e->get_error_data();
			if ( is_array( $missing_data ) && isset( $missing_data['missing'] ) ) {
				$missing_string = '<br>' . __( 'Missing:', 'zero-bs-crm' ) . ' ' . implode( ', ', $missing_data['missing'] );
			}

			$this->debug( 'Sync Failed in `import_orders_from_api()` due to missing settings against `' . $this->site_key . '` (could not, therefore, load WooCommerce API Connection): ' . $e->getMessage() . $missing_string );

			/* 
			echo json_encode(
				array(

					'status'               => 'error',
					'status_short_text'    => 'woo_client_error',
					'status_long_text'     => $this->woosync()->process_error( $e->getMessage() ),
					'page_no'              => $page_no,
					'orders_imported'      => 0,
					'percentage_completed' => 0,

				)
			);
			*/

			// log connection error (3x = auto-pause)
			$this->log_connection_error();

			return 'error';

		}

	}


	/**
	 * Add or Update an order from WooCommerce
	 *  (previously `add_order_from_id`)
	 *
	 * @param int $order_post_id Order post id from WooCommerce (may be different than $order_num)
	 */
	public function add_update_from_woo_order( $order_post_id ) {

		global $zbs;

		// This is only fired from local store calls, so let's retrieve the local domain as origin
		$origin = '';
		$domain = site_url();
		if ( $domain ) {
			$origin = $zbs->DAL->add_origin_prefix( $domain, 'domain' );
		}

		// get order data
		$order = wc_get_order( $order_post_id );

		// return if order doesn't exist
		if ( ! $order ) {
			return false;
		}

		$extra_meta = array();

		// Get order number if there is one; for example:
		// * refunds don't have 'get_order_number'
		// * some plugins like Sequential Order Numbers Pro set a custom order number
		if ( method_exists( $order, 'get_order_number' ) ) {

			$order_num = $order->get_order_number();

			// store the order number for future reference
			$extra_meta['order_num'] = $order_num;

		} else {
			// order number by default is the same as the order post ID
			$order_num = $order_post_id;
		}

		$raw_order_data = $order->get_data();

		// consolidate data
		$tidy_order_data = $this->woocommerce_order_to_crm_objects(
			$raw_order_data,
			$order,
			$order_post_id,
			$order_num,
			'',
			'',
			false,
			array(),
			$origin,
			$extra_meta
		);

		// import data
		$this->import_crm_object_data( $tidy_order_data );

	}


	/**
	 * Set's a completion status for woo order imports
	 *
	 * @param string|bool $status = 'yes|no' (#legacy) or 'true|false'
	 *
	 * @return bool $status
	 */
	public function set_first_import_status( $status ){

		$status_bool = false;

		if ( $status == 'yes' || $status === true ){

			$status_bool = true;

		}

		// set it 
		$this->woosync()->set_sync_site_attribute( $this->site_key, 'first_import_complete', $status_bool );

		return $status_bool;

	}


	/**
	 * Returns a completion status for woo order imports
	 *
	 * @return bool $status
	 */
	public function first_import_completed(){

		$status_bool = false;

		// get
		$sync_site = $this->woosync()->get_active_sync_site( $this->site_key );

		if ( $sync_site['first_import_complete'] == 'yes' || $sync_site['first_import_complete'] === true || $sync_site['first_import_complete'] == 1 ){

			$status_bool = true;

		}

		return $status_bool;

	}

	/**
	 * Sets current working page index (to resume from)
	 *
	 * @return int $page
	 */
	public function set_resume_from_page( $page_no ){

		//update_option( 'zbs_woo_resume_sync_' . $this->site_key, $page_no );
		$this->woosync()->set_sync_site_attribute( $this->site_key, 'resume_from_page', $page_no );

		return $page_no;

	}


	/**
	 * Return current working page index (to resume from)
	 *
	 * @return int $page
	 */
	public function resume_from_page(){

		return $this->woosync()->get_sync_site_attribute( $this->site_key, 'resume_from_page', 1 );

	}


	/**
	 * Adds or updates crm objects related to a processed woocommerce order
	 *  (requires that the $order_data has been passed through `woocommerce_order_to_crm_objects`)
	 *  Previously `import_woocommerce_order_from_order_data`
	 *
	 * @param array $crm_object_data (Woo Order data passed through `woocommerce_order_to_crm_objects`)
	 * 
	 * @return int $transaction_id
	 * 
	 */
	public function import_crm_object_data( $crm_object_data ) {

		global $zbs;

		$settings = $this->settings();

		// Add/update contact from cleaned order data, (previously `add_or_update_contact_from_order_data`)
		$contact_id = -1;
		if ( isset( $crm_object_data['contact'] ) && isset( $crm_object_data['contact']['email'] ) ) {

			// Add the contact
			$contact_id = $zbs->DAL->contacts->addUpdateContact( array(
				'data'                 => $crm_object_data['contact'],
				'extraMeta'            => $crm_object_data['contact_extra_meta'],
				'do_not_update_blanks' => true
			) );

		}

		// if contact: add logs, contact id relations to objects, and addupdate company
		if ( $contact_id > 0 ) {

			$this->debug( 'Contact added/updated #' . $contact_id );

			// contact logs
			if ( is_array( $crm_object_data['contact_logs'] ) ) {

				foreach ( $crm_object_data['contact_logs'] as $log ) {					

					// add log
					$log_id = $zbs->DAL->logs->addUpdateLog( array(

						'id'    => -1,
						'owner' => -1,
						'ignore_if_existing_desc_type' => true,
		                'ignore_if_meta_matching' => array(
		                  'key' => 'from_woo_order',
		                  'value' => $crm_object_data['order_post_id']
		                ),

						// fields (directly)
						'data'  => array(

							'objtype'   => ZBS_TYPE_CONTACT,
							'objid'     => $contact_id,
							'type'      => $log['type'],
							'shortdesc' => $log['shortdesc'],
							'longdesc'  => $log['longdesc'],

							'meta'      => array( 'from_woo_order' => $crm_object_data['order_post_id'] ),
							'created'   => -1

						),

					) );

				}

			}

			// add contact ID relationship to the related objects
			$crm_object_data['transaction']['contacts'] = array( $contact_id );
			$crm_object_data['invoice']['contacts']     = array( $contact_id );

			// Add/update company (if using b2b mode, and successfully added/updated contact):
			$b2b_mode = zeroBSCRM_getSetting( 'companylevelcustomers' );
			if ( $b2b_mode && isset( $crm_object_data['company']['name'] ) && !empty( $crm_object_data['company']['name'] ) ) {

				// Add the company
				$company_id = $zbs->DAL->companies->addUpdateCompany( array(
					'data' => $crm_object_data['company'],
				) );

				if ( $company_id > 0 ) {

					$this->debug( 'Company added/updated #' . $company_id );

					// inject into transaction data too
					$crm_object_data['transaction']['companies'] = array( $company_id );
					$zbs->DAL->contacts->addUpdateContactCompanies(
						array(
							'id'         => $contact_id,
							'companyIDs' => array( $company_id ),
						)
					);

				} else {

						$this->debug( 'Company import failed: <code>' . json_encode( $crm_object_data['company'] ) . '</code>' );

				}

			}

		} else {

			// failed to add contact? 
			$this->debug( 'Contact import failed, or there was no contact to import. Contact Data: <code>' . json_encode( $crm_object_data['contact'] ) . '</code>' );

		}

		// Add/update invoice (if enabled) (previously `add_or_update_invoice`)
		if ( $settings['wcinv'] == 1 ) {

			// retrieve existing invoice
			// note this is substituting $crm_object_data['invoice']['existence_check_args'] for what should be $args, but it works
			$invoice_id = $zbs->DAL->invoices->getInvoice( -1, $crm_object_data['invoice']['existence_check_args'] );


			// add logo if invoice doesn't exist yet
			if ( !$invoice_id ) {
				$crm_object_data['invoice']['logo_url'] = jpcrm_business_logo_url();
			} else {
				// if this is an update, let's not overwrite existing hash and logo
				$old_invoice_data = $zbs->DAL->invoices->getInvoice( $invoice_id );
				$crm_object_data['invoice']['logo_url'] = $old_invoice_data['logo_url'];
				$crm_object_data['invoice']['hash'] = $old_invoice_data['hash'];
			}

			// add/update invoice
			$invoice_id = $zbs->DAL->invoices->addUpdateInvoice( array(
				'id'        => $invoice_id,
				'data'      => $crm_object_data['invoice'],
				'extraMeta' => ( isset( $crm_object_data['invoice']['extra_meta'] ) ? $crm_object_data['invoice']['extra_meta'] : -1 ),
			) );

			// link the transaction to the invoice
			if ( !empty( $invoice_id ) ) {

				$this->debug( 'Added invoice #' . $invoice_id );

				$crm_object_data['transaction']['invoice_id'] = $invoice_id;

			} else {

				$this->debug( 'invoice import failed: <code>' . json_encode( $crm_object_data['invoice'] ) . '</code>' );

			}

		}

		// Add/update transaction (previously `add_or_update_transaction`)
		// note this is substituting $crm_object_data['invoice']['existence_check_args'] for what should be $args, but it works
		$existing_transaction_id = $zbs->DAL->transactions->getTransaction( -1, $crm_object_data['transaction']['existence_check_args'] );
		
		if ( !empty( $existing_transaction_id ) ) {
			$this->debug( 'Existing transaction #' . $existing_transaction_id );
		}

		$args = array(
			'id'    => $existing_transaction_id,
			'owner' => -1,
			'data'  => $crm_object_data['transaction'],
		);

		// got any extra meta?
		if ( isset( $crm_object_data['transaction_extra_meta'] ) && is_array( $crm_object_data['transaction_extra_meta'] ) ) {

			$args['extraMeta'] = $crm_object_data['transaction_extra_meta'];

		}

		// This parameter (do_not_mark_invoices) makes sure invoice status are not changed.
		$args[ 'do_not_mark_invoices' ] = true;
		$transaction_id = $zbs->DAL->transactions->addUpdateTransaction( $args );

		if ( !empty( $transaction_id ) ) {

			// if we have success here, but we didn't have a previous id, then it's a successful new order addition
			if ( empty( $existing_transaction_id ) ){

				// increment connection order import count
				$this->woosync()->increment_sync_site_count( $this->site_key, 'total_order_count' );


				$this->debug( 'Added transaction #' . $transaction_id );

			} else {

				$this->debug( 'Updated transaction #' . $transaction_id );

			}

		} else {

			$this->debug( 'Transaction import failed: <code>' . json_encode( $crm_object_data['transaction'] ) . '</code>' );

		}

		// Secondary transactions (Refunds)
		if ( is_array( $crm_object_data['secondary_transactions'] ) ) {

			foreach ( $crm_object_data['secondary_transactions'] as $sub_transaction ) {

				// slightly modified version of above transaction insert logic.
				$existing_transaction_id = $zbs->DAL->transactions->getTransaction( -1, $sub_transaction['existence_check_args'] );

				// debug
				if ( !empty( $existing_transaction_id ) ){
					$this->debug( 'Sub transaction: Existing transaction #' . $existing_transaction_id );
				}

				// build arguments
				$args = array(
					'id'    => $existing_transaction_id,
					'owner' => -1,
					'data'  => $sub_transaction,
				);

				// if we have transaction id, also inject it as a parent (this gets caught by the UI to give a link back)
				if ( isset( $transaction_id ) && !empty( $contact_id ) ) {
					$args['data']['parent'] = $transaction_id;
				}

				// if we have contact id, also inject it
				if ( isset( $contact_id ) && !empty( $contact_id ) ) {
					$args['data']['contacts'] = array( $contact_id );
				}

				// if we have company id, also inject it
				if ( isset( $company_id ) && !empty( $company_id ) ) {
					$args['data']['companies'] = array( $company_id );
				}

				// if we have invoice_id, inject it
				// ... this makes our double entry invoices work.
				if ( isset( $invoice_id ) && !empty( $invoice_id ) ) {

					$args['data']['invoice_id'] = $invoice_id;

				}

				// pass any extra meta along
				if ( isset( $sub_transaction['extra_meta'] ) && is_array( $sub_transaction['extra_meta'] ) ) {

					$args['extraMeta'] = $sub_transaction['extra_meta'];
					unset( $args['data']['extra_meta'] );

				}

				$sub_transaction_id = $zbs->DAL->transactions->addUpdateTransaction( $args );

				$this->debug( 'Added/Updated Sub-transaction (Refund) #' . $sub_transaction_id );

			}

		}

		return $transaction_id;

	}


	/**
	 * Translates a local store order into an import-ready crm objects array
	 *  previously `tidy_order_from_store`
	 *
	 * @param $order_data
	 * @param $order
	 * @param $order_num
	 * @param $order_items
	 * @param $api
	 * @param $order_tags
	 * @param $origin
	 * @param $extra_meta
	 *
	 * @return array of various objects (contact|company|transaction|invoice)
	 */
	public function woocommerce_order_to_crm_objects(
		$order_data,
		$order,
		$order_post_id,
		$order_num,
		$order_items = '',
		$item_title = '',
		$from_api = false,
		$order_tags = array(),
		$origin = '',
		$extra_meta = array()
	) {

	    global $zbs;

	    // get settings
	    $settings = $this->settings();

	    // build arrays
	    $data = array(
	        'contact'                 => array(),
	        'contact_extra_meta'      => array(),
	        'contact_logs'            => array(),
	        'company'                 => false,
	        'invoice'                 => false,
	        'transaction'             => false,
	        'secondary_transactions'  => array(),
	        'lineitems'               => array(),
	    	'order_post_id'           => $order_post_id,
	    );

	    // Below we sometimes need to do some type-conversion, (e.g. dates), so here we retrieve our 
	    // crm contact custom fields to use the types...
	    $custom_fields              = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_CONTACT ) );
	    $is_status_mapping_enabled  = ( isset( $settings['enable_woo_status_mapping'] ) ? ( (int) $settings['enable_woo_status_mapping'] === 1 ) : true );
		$contact_statuses          = zeroBSCRM_getCustomerStatuses( true );

	    // initialise dates
	    $contact_creation_date         = -1;
	    $contact_creation_date_uts     = -1;
	    $transaction_creation_date_uts = -1;
	    $invoice_creation_date_uts     = -1;

	    // Tag customer setting i.e. do we want to tag with every product name
	    // Will be useful to be able to filter Sales Dashboard by Product name eventually
	    $tag_contact_with_item     = false;
	    $tag_transaction_with_item = false;
	    $tag_invoice_with_item     = false;
	    $tag_with_coupon           = false;
	    $tag_product_prefix = ( isset( $settings['wctagproductprefix'] ) ) ? zeroBSCRM_textExpose( $settings['wctagproductprefix'] ) : '';
	    $tag_coupon_prefix = ( isset( $settings['wctagcouponprefix'] ) ) ? zeroBSCRM_textExpose( $settings['wctagcouponprefix'] ) : '';
	    if ( isset( $settings['wctagcust'] ) && $settings['wctagcust'] == 1 ) {

	        $tag_contact_with_item = true;

	    }
	    if ( isset( $settings['wctagtransaction'] ) && $settings['wctagtransaction'] == 1 ) {

	        $tag_transaction_with_item = true;

	    }
	    if ( isset( $settings['wctaginvoice'] ) && $settings['wctaginvoice'] == 1 ) {

	        $tag_invoice_with_item = true;

	    }
	    if ( isset( $settings['wctagcoupon'] ) && $settings['wctagcoupon'] == 1 ) {

	        $tag_with_coupon = true;

	    }

	    $order_status_to_invoice_settings     = $this->woosync()->woo_order_status_mapping( 'invoice' );
	    $order_status_to_transaction_settings = $this->woosync()->woo_order_status_mapping( 'transaction' );
	    $valid_transaction_statuses           = zeroBSCRM_getTransactionsStatuses( true );
	    $valid_invoice_statuses               = zeroBSCRM_getInvoicesStatuses();
	    // pre-processing from the $order_data
	    $order_status   = $order_data['status'];
	    $order_currency = $order_data['currency'];

	    // Add external source
	    $data['source'] = array(
	        'externalSource'      => 'woo',
	        'externalSourceUID'   => $order_post_id,
	        'origin'              => $origin,
	        'onlyID'              => true
	    );

	    // Dates:
	    if ( !$from_api ) {

	        // from local store

	        if ( isset( $order_data['date_created'] ) && !empty( $order_data['date_created'] ) ) {

	            $contact_creation_date         = $order_data['date_created']->date("Y-m-d h:m:s");
	            $contact_creation_date_uts     = $order_data['date_created']->date("U");
	            $transaction_creation_date_uts = $order_data['date_created']->date("U");
	            $invoice_creation_date_uts     = $order_data['date_created']->date("U");

	        }

	    } else {

	        // from API
	        // dates are strings in API.
	        $contact_creation_date         = $order_data['date_created'];
	        $contact_creation_date_uts     = strtotime($order_data['date_created']);
	        $transaction_creation_date_uts = strtotime($order_data['date_created']);
	        $invoice_creation_date_uts     = strtotime($order_data['date_created']);

	    }

	    // ==== Tax Rates (on local stores only)
	    if ( !$from_api ) {
		
			// retrieve tax table to feed in tax links
			$tax_rates_table = $this->woosync()->background_sync->get_tax_rates_table();

			// Add/update any tax rates used in this order
			$tax_rate_changes = false;
	        foreach ( $order->get_items('tax') as $item ){

	            $tax_rate_id    = $item->get_rate_id(); // Tax rate ID
	            $tax_label      = $item->get_label(); // Tax label name
	            $tax_percent    = \WC_Tax::get_rate_percent( $tax_rate_id ); // Tax percentage
	            $tax_rate       = str_replace('%', '', $tax_percent); // Tax rate

	            /*
	            $tax_rate_code  = $item->get_rate_code(); // Tax code
	            $tax_name       = $item->get_(); // Tax name
	            $tax_total      = $item->get_tax_total(); // Tax Total
	            $tax_ship_total = $item->get_shipping_tax_total(); // Tax shipping total
	            $tax_compound   = $item->get_compound(); // Tax compound
	            */          

	        	// check if tax rate exists already
	        	$tax_rate_exists = false;
	        	foreach ( $tax_rates_table as $tax_rate_id => $tax_rate_detail ){

	        		if ( 
	        			
	        			// name
	        			sprintf( __( '%s (From WooCommerce)', 'zero-bs-crm' ), $tax_label ) == $tax_rate_detail['name']
	        			&&
	        			// rate
	        			$tax_rate == $tax_rate_detail['rate']
	        			
	        			){

	        				$tax_rate_exists = true;
	        				break;

	        			}        		

	        	}

	        	// add/update it if it doesn't exist or has changed rate
	        	if ( !$tax_rate_exists ){

	        		// add/update
					$added_rate_id = zeroBSCRM_taxRates_addUpdateTaxRate(
						array(

							//'id'   => -1,
							'data' => array(
								'name' => sprintf( __( '%s (From WooCommerce)', 'zero-bs-crm' ), $tax_label ),
								'rate' => (float)$tax_rate,
							),
						)
					);

	        		// mark as table changed
	        		$tax_rate_changes = true;

				}

	        };

	        // reload tax rate table if changes actioned
	        if ( $tax_rate_changes ){

	        	$tax_rates_table = $this->woosync()->background_sync->get_tax_rates_table( true );

	        }

	    }

        // /=== Tax

	    // ==== Contact

	    // Always use contact email, not billing email:
	    // We've hit issues based on adding a Jetpack CRM contact based on billing email if they have a WP user attached
	    // with a different email. The $order_data['customer_id'] will = 0 for guest or +tive for users. This way we will always
	    // store the contact against the contact email (and not the billing email)
	    $contact_email = '';
	    $billing_email = '';

	    if ( isset( $order_data['customer_id']) && $order_data['customer_id'] > 0 ) {
				// then we have an existing user. Get the WP email
				$user          = get_user_by( 'id', $order_data['customer_id'] );
				$contact_email = $user->user_email;
				if ( isset($order_data['billing']['email'] ) ) {
					$billing_email = $order_data['billing']['email'];
				}

				// pass WP ID to contact
				$data['contact']['wpid'] = $order_data['customer_id'];

	    } else {

	        if ( isset( $order_data['billing']['email'] ) ) {
	            $billing_email = $order_data['billing']['email'];
	            $contact_email = $billing_email;
	        }

	    }

		// we only add a contact whom has an email
		if ( !empty( $contact_email ) ) {

			if ( $is_status_mapping_enabled ) {
				$contact_id = zeroBS_getCustomerIDWithEmail( $contact_email );
				// If this is a new contact or the current status equals the first status (CRM's default value is 'Lead'), we are allowed to change it.
				if ( empty( $contact_id ) || $zbs->DAL->contacts->getContactStatus( $contact_id ) === $contact_statuses[0] ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$data['contact']['status'] = $this->woosync()->woocommerce_order_status_to_contact_status( $order_status );
				}
			}
			$data['contact']['created']         = $contact_creation_date_uts;
			$data['contact']['email']           = $contact_email;
			$data['contact']['externalSources'] = array(
				array(
					'source' => 'woo',
					'uid'    => $order_post_id,
					'origin' => $origin,
					'owner'  => 0, // for now we hard-type no owner to avoid ownership issues. As we roll out fuller ownership we may want to adapt this.
				),
			);

			if ( isset( $order_data['billing']['first_name'] ) ) {
				$data['contact']['fname'] = $order_data['billing']['first_name'];
			}

			if ( isset( $order_data['billing']['last_name'] ) ) {
				$data['contact']['lname'] = $order_data['billing']['last_name'];
			}

			// if we've not got any fname/lname and we do have 'customer_id' attribute (wp user id)
			// ... check the wp user to see if they have a display name we can use.
			if ( isset( $order_data['customer_id'] ) && $order_data['customer_id'] > 0 ) {

				// retrieve wp user
				$woo_customer_meta = get_user_meta( $order_data['customer_id'] );

				// fname
				if (
					isset( $woo_customer_meta['first_name'] )
					&&
					( !isset( $data['contact']['fname'] ) || empty( $data['contact']['fname'] ) )
				) {

					$data['contact']['fname'] = $woo_customer_meta['first_name'][0];

				}

				// lname
				if (
					isset( $woo_customer_meta['last_name'] )
					&&
					( !isset( $data['contact']['lname'] ) || empty( $data['contact']['lname'] ) )
				) {

					$data['contact']['lname'] = $woo_customer_meta['last_name'][0];

				}
			}

			if ( isset( $order_data['billing']['address_1'] ) ) {
				$data['contact']['addr1'] = $order_data['billing']['address_1'];
			}

			if ( isset( $order_data['billing']['address_2'] ) ) {
				$data['contact']['addr2'] = $order_data['billing']['address_2'];
			}

			if ( isset( $order_data['billing']['city'] ) ) {
				$data['contact']['city'] = $order_data['billing']['city'];
			}

			if ( isset( $order_data['billing']['state'] ) ) {
				$data['contact']['county'] = $order_data['billing']['state'];
			}

			if ( isset( $order_data['billing']['postcode'] ) ) {
				$data['contact']['postcode'] = $order_data['billing']['postcode'];
			}

			if ( isset( $order_data['billing']['country'] ) ) {
				$data['contact']['country'] = $order_data['billing']['country'];
			}

			if ( isset( $order_data['billing']['phone'] ) ) {
				$data['contact']['hometel'] = $order_data['billing']['phone'];
			}

			// if setting: copy shipping address
			if ( $settings['wccopyship'] ) {
				if ( isset( $order_data['shipping']['address_1'] ) ) {
					$data['contact']['secaddr1'] = $order_data['shipping']['address_1'];
				}

				if ( isset( $order_data['shipping']['address_2'] ) ) {
					$data['contact']['secaddr2'] = $order_data['shipping']['address_2'];
				}

				if ( isset( $order_data['shipping']['city'] ) ) {
					$data['contact']['seccity'] = $order_data['shipping']['city'];
				}

				if ( isset( $order_data['shipping']['state'] ) ) {
					$data['contact']['seccounty'] = $order_data['shipping']['state'];
				}

				if ( isset( $order_data['shipping']['postcode'] ) ) {
					$data['contact']['secpostcode'] = $order_data['shipping']['postcode'];
				}

				if ( isset( $order_data['shipping']['country'] ) ) {
					$data['contact']['seccountry'] = $order_data['shipping']['country'];
				}
			}

			// Store the billing email as an alias, and as an extraMeta (for later potential origin work)
			if ( !empty( $billing_email ) ) {

				$data['contact_extra_meta']['billingemail'] = $billing_email;

				// we only need to add the alias if it's different to the $contact_email
				if ( $billing_email !== $contact_email ) {
					$data['contact']['aliases'] = array( $billing_email );
				}
			}

			// Store any customer notes
			if ( isset( $order_data['customer_note'] ) && !empty( $order_data['customer_note'] ) ) {

				// Previously `notes` field, refactor into core moved this into log addition
				$data['contact_logs'][] = array(

					'type'      => 'note',
					'shortdesc' => __( 'WooCommerce Customer notes', 'zero-bs-crm' ),
					'longdesc'  => __( 'WooCommerce Customer notes:', 'zero-bs-crm' ) . ' ' . $order_data['customer_note'] . '<br>' . sprintf( __( 'From order: #%s', 'zero-bs-crm' ), $order_post_id ),

				);

			}

			// Retrieve any WooCommerce Checkout metaa data & try to store it against contact if match custom fields
			// Returns array of WC_Meta_Data objects https://woocommerce.github.io/code-reference/classes/WC-Meta-Data.html
			// Filters to support WooCommerce Checkout Field Editor, Field editor Pro etc.
			/*

					[1] => WC_Meta_Data Object
						(
								[current_data:protected] => Array
										(
												[id] => 864
												[key] => tax-id
												[value] => 12345
										)

								[data:protected] => Array
										(
												[id] => 864
												[key] => tax-id
												[value] => 12345
										)

						)

				*/
			if ( isset( $order_data['meta_data'] ) && is_array( $order_data['meta_data'] ) ) {

				// Cycle through them and pick out matching fields
				foreach ( $order_data['meta_data'] as $wc_meta_data_object ) {

					// retrieve data
					$meta_data = $wc_meta_data_object->get_data();

					if ( is_array( $meta_data ) ) {

						// process it, only adding if not already set (to avoid custom checkout overriding base fields)
						$key = $zbs->DAL->makeSlug( $meta_data['key'] );

						if ( !empty( $key ) && !isset( $data['contact'][ $key ] ) ) {

							$value = $meta_data['value'];

							// see if we have a matching custom field to infer type conversions from:
							if ( isset( $custom_fields[ $key ] ) ) {

								// switch on type
								switch ( $custom_fields[ $key ][0] ) {

									case 'date':
										// May 29, 2022 => UTS
										$value = strtotime( $value );
										break;

								}

							}

							// simplistic add
							$data['contact'][ $key ] = $value;

							// filter through any mods
							$data['contact'] = $this->filter_checkout_contact_fields( $key, $value, $data['contact'], $order, $custom_fields );

						}

					}

				}

			}

			// WooCommerce Checkout Add-ons fields support, where installed
			$data['contact'] = $this->checkout_add_ons_add_field_values( $order_post_id, $data['contact'], $custom_fields );

		}

		// ==== Company (where available)

		if ( isset( $order_data['billing'] ) && isset( $order_data['billing']['company'] ) ) {

			// Build fields for company
			$data['company'] = array(
				'status'          => __( 'Customer', 'zero-bs-crm' ),
				'name'            => $order_data['billing']['company'],
				'created'         => $contact_creation_date_uts,
				'externalSources' => array(
					array(
						'source' => 'woo',
						'uid'    => $order_post_id,
						'origin' => $origin,
						'owner'  => 0, // for now we hard-type no owner to avoid ownership issues. As we roll out fuller ownership we may want to adapt this.
					),
				),
			);

			if ( isset( $order_data['billing']['address_1'] ) && !empty( $order_data['billing']['address_1'] ) ) {
				$data['company']['addr1'] = $order_data['billing']['address_1'];
			}

			if ( isset( $order_data['billing']['address_2'] ) && !empty( $order_data['billing']['address_2'] ) ) {
				$data['company']['addr2'] = $order_data['billing']['address_2'];
			}

			if ( isset( $order_data['billing']['city'] ) && !empty( $order_data['billing']['city'] ) ) {
				$data['company']['city'] = $order_data['billing']['city'];
			}

			if ( isset( $order_data['billing']['state'] ) && !empty( $order_data['billing']['state'] ) ) {
				$data['company']['county'] = $order_data['billing']['state'];
			}

			if ( isset( $order_data['billing']['country'] ) && !empty( $order_data['billing']['country'] ) ) {
				$data['company']['country'] = $order_data['billing']['country'];
			}

			if ( isset( $order_data['billing']['postcode'] ) && !empty( $order_data['billing']['postcode'] ) ) {
				$data['company']['postcode'] = $order_data['billing']['postcode'];
			}

			if ( isset( $order_data['billing']['phone'] ) && !empty( $order_data['billing']['phone'] ) ) {
				$data['company']['maintel'] = $order_data['billing']['phone'];
			}

			if ( isset( $order_data['billing']['email'] ) && !empty( $order_data['billing']['email'] ) ) {
				$data['company']['email'] = $order_data['billing']['email'];
			}

		}

		// ==== Transaction

		// prep dates
		$transaction_paid_date_uts      = null;
		$transaction_completed_date_uts = null;

		if ( array_key_exists( 'date_paid', $order_data ) && !empty( $order_data['date_paid'] ) ) {
			$transaction_paid_date_uts = $order_data['date_paid']->date( 'U' );
		}

		$invoice_status = __( 'Unpaid', 'zero-bs-crm' );

		// Look for a custom user-defined status mapping value, otherwise we keep using the default value.
		if ( $is_status_mapping_enabled ) {
			$candidate_invoice_status = ! empty( $settings[ $order_status_to_invoice_settings[ $order_status ] ] ) ? $settings[ $order_status_to_invoice_settings[ $order_status ] ] : -1;

			// Make sure that the user-defined invoice status mapping is still in the list of allowed Contact statuses.
			$invoice_status = in_array( $candidate_invoice_status, $valid_invoice_statuses ) ? $candidate_invoice_status : $invoice_status;
		}

		// retrieve completed date, where available
		if ( array_key_exists( 'date_completed', $order_data ) && !empty( $order_data['date_completed'] ) ) {

			$transaction_completed_date_uts = $order_data['date_completed']->date( 'U' );

		}

		// Retrieve and process order line items
		if ( !$from_api ) {

			$item_title = '';
			$order_items = $order->get_items();

			// Retrieve order-used tax rates
			$tax_items_labels = array();
			$shipping_tax_label = '';
			foreach ( $order->get_items('tax') as $tax_item ) {
			   
			    $tax_items_labels[$tax_item->get_rate_id()] = $tax_item->get_label();
			    if ( ! empty($tax_item->get_shipping_tax_total() ) ){
			        $shipping_tax_label = $tax_item->get_label();
			    }

			}

			// cycle through order items to create crm line items
			foreach ( $order_items as $item_key => $item ) {

				// first item gets item name
				if ( empty( $item_title ) ) {

					$item_title = $item->get_name();

				} else {

					$item_title = __( 'Multiple Items', 'zero-bs-crm' );

				}

				// retrieve item data
				$item_data = $item->get_data();

				// catch cases where quantity is 0; see gh-2190
				$price = empty( $item_data['quantity'] ) ? 0 : $item_data['subtotal'] / $item_data['quantity'];

				// translate Woo taxes to CRM taxes
				$item_woo_taxes = $item->get_taxes();
				$tax_label = '';
				$item_tax_rate_ids = array(); // collect taxes

			    foreach ( $item_woo_taxes['subtotal'] as $rate_id => $tax ){

			        if ( isset( $tax_items_labels[ $rate_id ] ) ){

			        	$tax_label = $tax_items_labels[ $rate_id ];

			        	// match tax label to tax in our crm tax table (should have been added by the logic above here, even if new)
			        	foreach ( $tax_rates_table as $tax_rate_id => $tax_rate_detail ){

			        		if ( sprintf( __( '%s (From WooCommerce)', 'zero-bs-crm' ), $tax_label ) == $tax_rate_detail['name'] ){

			        			// this tax is applied to this line item
			        			$item_tax_rate_ids[] = $tax_rate_id;

			        		}
			        	}

			        }
			        			        
			    }

				// attributes not yet translatable but originally referenced: `variation_id|tax_class|subtotal_tax`
				$new_line_item = array(
					'order'    => $order_post_id, // passed as parameter to this function
					'currency' => $order_currency,
					'quantity' => $item_data['quantity'],
					'price'    => $price,
					'total'    => $item_data['total'],
					'title'    => $item_data['name'],
					'desc'     => $item_data['name'] . ' (#' . $item_data['product_id'] . ')',
					'tax'      => $item_data['total_tax'],
					'shipping' => 0,
				);

				// add taxes, where present
				if ( is_array( $item_tax_rate_ids ) && count( $item_tax_rate_ids ) > 0 ){
					
					$new_line_item['taxes'] = implode( ',', $item_tax_rate_ids );

				}

				// add
				$data['lineitems'][] = $new_line_item;

				// add to tags where not alreday present
				if ( !in_array( $item_data['name'], $order_tags ) ) {
					$order_tags[] = $tag_product_prefix . $item_data['name'];
				}

			}

			// if the order has a coupon. Tag the contact with that coupon too, but only if from same store.
			if ( $tag_with_coupon ) {

				foreach ( $order->get_coupon_codes() as $coupon_code ) {
					$order_tags[] = $tag_coupon_prefix . $coupon_code;
				}

			}

		} else {

			// API response returns these differently
			$data['lineitems'] = $order_items;

		}

		// tags (contact)
		if ( $tag_contact_with_item ) {

			$data['contact']['tags']     = $order_tags;
			$data['contact']['tag_mode'] = 'append';

		}

		// Transactions have a "Hold" status by default, not "On-hold"
		$transaction_status = ( $order_status == "on-hold" ? "Hold" : ucfirst( $order_status ) );
		
		if ( $is_status_mapping_enabled ) {
			$candidate_transaction_status = ! empty( $settings[ $order_status_to_transaction_settings[ $order_status ] ] ) ? $settings[ $order_status_to_transaction_settings[ $order_status ] ] : -1;

			// Make sure that the user-defined transaction status mapping is still in the list of allowed transaction statuses.
			$transaction_status = in_array( $candidate_transaction_status, $valid_transaction_statuses ) ? $candidate_transaction_status : $transaction_status;
		}

		// fill out transaction header (object)
		$data['transaction'] = array(

			'ref'                  => $order_num,
			'type'                 => __( 'Sale', 'zero-bs-crm' ),
			'title'                => $item_title,
			'status'               => $transaction_status,
			'total'                => $order_data['total'],
			'date'                 => $transaction_creation_date_uts,
			'created'              => $transaction_creation_date_uts,
			'date_completed'       => $transaction_completed_date_uts,
			'date_paid'            => $transaction_paid_date_uts,
			'externalSources'      => array(
				array(
					'source' => 'woo',
					'uid'    => $order_post_id,
					'origin' => $origin,
					'owner'  => 0, // for now we hard-type no owner to avoid ownership issues. As we roll out fuller ownership we may want to adapt this.
				),
			),
			'currency'             => $order_currency,
			'net'                  => ( (float)$order_data['total'] - (float)$order_data['discount_total'] - (float)$order_data['total_tax'] - (float)$order_data['shipping_total'] ),
			'tax'                  => $order_data['total_tax'],
			'fee'                  => 0,
			'discount'             => $order_data['discount_total'],
			'shipping'             => $order_data['shipping_total'],
			'existence_check_args' => $data['source'],
			'lineitems'            => $data['lineitems'],

		);

		// tags (transaction)
		if ( $tag_transaction_with_item ) {

			$data['transaction']['tags']     = $order_tags;
			$data['transaction']['tag_mode'] = 'append';

		}

		// any extra meta?
		if ( is_array( $extra_meta ) && count( $extra_meta ) > 0 ) {

			$data['transaction_extra_meta'] = $extra_meta;

		}

		// Sub-transactions (refunds)
		if ( method_exists( $order, 'get_refunds' ) ) {

			// process refunds
			$refunds = $order->get_refunds();
			if ( is_array( $refunds ) ) {

				// cycle through and add as secondary transactions
				foreach ( $refunds as $refund ) {

					// retrieve refund data
					$refund_data = $refund->get_data();

					// process the refund as a secondary transaction
					// This mimicks the main transaction, taking from the refund object where sensible
					$refund_id = $refund->get_id();
					$refund_title = sprintf( __( 'Refund against transaction #%s', 'zero-bs-crm' ), $order_num );
					$refund_description = $refund_title . "\r\n" . __( 'Reason: ', 'zero-bs-crm' ) . $refund_data['reason'];
					$refund_date_uts = strtotime( $refund_data['date_created']->__toString() );
					if ( isset( $refund_data['currency'] ) && !empty( $refund_data['currency'] ) ) {
						$refund_currency = $refund_data['currency'];
					} else {
						$refund_currency = $order_currency;
					}

					$refund_transaction = array(

						'ref'                  => $refund_id,
						'type'                 => __( 'Refund', 'zero-bs-crm' ),
						'title'                => $refund_title,
						'status'               => __( 'Refunded', 'zero-bs-crm' ),
						'total'                => -$refund_data['total'],
						'desc'                 => $refund_description,
						'date'                 => $refund_date_uts,
						'created'              => $refund_date_uts,
						'date_completed'       => $transaction_completed_date_uts,
						'date_paid'            => $transaction_paid_date_uts,
						'externalSources'      => array(
							array(
								'source' => 'woo',
								'uid'    => $refund_id, // rather than order_num, here we use the refund item id
								'origin' => $origin,
								'owner'  => 0, // for now we hard-type no owner to avoid ownership issues. As we roll out fuller ownership we may want to adapt this.
							),
						),
						'currency'             => $refund_currency,
						'net'                  => -( (float)$refund_data['total'] - (float)$refund_data['discount_total'] - (float)$refund_data['total_tax'] - (float)$refund_data['shipping_total'] ),
						'tax'                  => $refund_data['total_tax'],
						'fee'                  => 0,
						'discount'             => $refund_data['discount_total'],
						'shipping'             => $refund_data['shipping_total'],
						'existence_check_args' => array(
							'externalSource'    => 'woo',
							'externalSourceUID' => $refund_id,
							'origin'            => $origin,
							'onlyID'            => true,
						),
						'lineitems'            => array(
							// here we roll a single refund line item
							array(
								'order'    => $refund_id,
								'currency' => $refund_currency,
								'quantity' => 1,
								'price'    => -$refund_data['total'],
								'total'    => -$refund_data['total'],
								'title'    => $refund_title,
								'desc'     => $refund_description,
								'tax'      => $refund_data['total_tax'],
								'shipping' => 0,
							),
						),
						'extra_meta'           => array(), // this is caught to insert as extraMeta

					);

					// Add any extra meta we can glean in case future useful:
					$refund_transaction['extra_meta']['order_num'] = $order_num; // backtrace
					if ( isset( $refund_data['refunded_by'] ) && !empty( $refund_data['refunded_by'] ) ) {
						$refund_transaction['extra_meta']['refunded_by'] = $refund_data['refunded_by'];
					}
					if ( isset( $refund_data['refunded_payment'] ) && !empty( $refund_data['refunded_payment'] ) ) {
						$refund_transaction['extra_meta']['refunded_payment'] = $refund_data['refunded_payment'];
					}

					// add it to the stack
					$data['secondary_transactions'][] = $refund_transaction;

				}

			}

		}

		// ==== Invoice
		$data['invoice'] = array();
		if ( $settings['wcinv'] == 1 ) {

			$data['invoice'] = array(
				'id_override'          => 'woo-' . $order_num, // we have to add a prefix here otherwise woo order #123 wouldn't insert if invoice with id #123 already exists
				'status'               => $invoice_status,
				'currency'             => $order_currency,
				'date'                 => $invoice_creation_date_uts,
				'due_date'             => $invoice_creation_date_uts,
				'total'                => $order_data['total'],
				'discount'             => $order_data['discount_total'],
				'discount_type'        => 'm',
				'shipping'             => $order_data['shipping_total'],
				'shipping_tax'         => $order_data['shipping_tax'],
				'tax'                  => $order_data['total_tax'],
				'ref'                  => $item_title,
				'hours_or_quantity'    => 1,
				'lineitems'            => $data['lineitems'],
				'created'              => $invoice_creation_date_uts,
				'externalSources'      => array(
					array(
						'source' => 'woo',
						'uid'    => $order_post_id,
						'origin' => $origin,
						'owner'  => 0, // for now we hard-type no owner to avoid ownership issues. As we roll out fuller ownership we may want to adapt this.
					),
				),
				'existence_check_args' => $data['source'],
				'extra_meta'           => array(
					'order_post_id' => $order_post_id,
					'api'           => $from_api,
				),
			);

			if ( is_array( $extra_meta ) && count( $extra_meta ) > 0 ) {

				$data['invoice']['extra_meta'] = array_merge( $extra_meta, $data['invoice']['extra_meta'] );

			}

			// tags (invoice)
			if ( $tag_invoice_with_item ) {

				$data['invoice']['tags']     = $order_tags;
				$data['invoice']['tag_mode'] = 'append';

			}

		}

		return $data;
	}


	/**
	 * Translates an API order into an import-ready crm objects array
	 *  previously `tidy_order_from_api`
	 *
	 * @param $order
	 *
	 * @return array of various objects (contact|company|transaction|invoice)
	 */
	public function woocommerce_api_order_to_crm_objects( $order, $origin = '' ){

	    // $order_status is the WooCommerce order status
		$settings = $this->settings();
		$tag_with_coupon = false;
	    $tag_product_prefix = ( isset( $settings['wctagproductprefix'] ) ) ? zeroBSCRM_textExpose( $settings['wctagproductprefix'] ) : '';
	    $tag_coupon_prefix = zeroBSCRM_textExpose( $settings['wctagcouponprefix'] );
	    if ( $settings['wctagcoupon'] == 1 ) {

	        $tag_with_coupon = true;

	    }

	    // Translate API order into local order equivalent
	    $order_data = array(

	        'status'         => $order->status,
	        'currency'       => $order->currency,
	        'date_created'   => $order->date_created_gmt,
	        'customer_id'    => 0, // will be 0 from the API.
	        'billing'        => array(
	            'company'    => $order->billing->company,
	            'email'      => $order->billing->email,
	            'first_name' => $order->billing->first_name,
	            'last_name'  => $order->billing->last_name,
	            'address_1'  => $order->billing->address_1,
	            'address_2'  => $order->billing->address_2,
	            'city'       => $order->billing->city,
	            'state'      => $order->billing->state,
	            'postcode'   => $order->billing->postcode,
	            'country'    => $order->billing->country,
	            'phone'      => $order->billing->phone,
	        ),
	        'shipping'       => array(
	            'address_1' => $order->shipping->address_1,
	            'address_2' => $order->shipping->address_2,
	            'city'      => $order->shipping->city,
	            'state'     => $order->shipping->state,
	            'postcode'  => $order->shipping->postcode,
	            'country'   => $order->shipping->country,
	        ),
	        'total'          => $order->total,
	        'discount_total' => $order->discount_total,
	        'shipping_total' => $order->shipping_total,
	        'shipping_tax'   => $order->shipping_tax,
	        'total_tax'      => $order->total_tax,

	    );

	    $order_line_items = array();
	    $order_tags       = array();
	    $item_title       = '';

	    // cycle through line items and process
	    foreach ( $order->line_items as $line_item_key => $line_item ) {

	        if ( empty( $item_title ) ) {

	            $item_title = $line_item->name;

	        } else {

	            $item_title = __( 'Multiple Items', 'zero-bs-crm' );

	        }

	        $order_line_items[] = array(
	            'order'    => $order->id,
	            'quantity' => $line_item->quantity,
	            'price'    => $line_item->price,
	            'currency' => $order_data['currency'],
	            'total'    => $line_item->subtotal,
	            'title'    => $line_item->name,
	            'desc'     => $line_item->name . ' (#' . $line_item->product_id . ')',
	            'tax'      => $line_item->total_tax,
	            'shipping' => 0,
	        );
	        
	        if ( !in_array( $line_item->name, $order_tags ) ){
	        	
	        	$order_tags[] = $tag_product_prefix . $line_item->name;

	        }
	    }

	    // catch coupon_lines and tag if tagging
	    // http://woocommerce.github.io/woocommerce-rest-api-docs/#coupon-properties
        if ( $tag_with_coupon && isset( $order->coupon_lines ) ) {
        
        	foreach ( $order->coupon_lines as $coupon_line ) {
	            
	            $order_tags[] = $tag_coupon_prefix . $coupon_line->code;

	        }

	    }

			// store the order post ID for future reference
		$extra_meta = array(
			'order_num' => $order->number,
		);

		// Finally translate through `woocommerce_order_to_crm_objects` with the argument `$from_api = true` so it skips local store parts of the process
		return $this->woocommerce_order_to_crm_objects(
			$order_data,
			$order,
			$order->id,
			$order->number,
			$order_line_items,
			$item_title,
			true,
			$order_tags,
			$origin,
			$extra_meta
		);

	}



	/**
	 * Attempts to return the percentage completed of a sync
	 *
	 * @param bool $return_counts - Return counts (if true returns an array inc % completed, x of y pages)
	 * @param bool $use_cache - use values cached in object instead of retrieving them directly from Woo
	 * 
	 * @return int|bool - percentage completed, or false if not attainable
	 */
	public function percentage_completed( $return_counts = false, $use_cache = true ) {

		// if not using cache, retrieve values from Woo
		if ( !$use_cache ) {

			// could probably abstract the retrieval of orders for more nesting. For now it's fairly DRY as only in 2 places.

			// store/api switch
			if ( $this->import_mode( $this->site_key ) == JPCRM_WOO_SYNC_MODE_API ) {

				// API
				try {

					// get client
					$woocommerce = $this->woosync()->get_woocommerce_client( $this->site_key );

					// retrieve orders
					// https://woocommerce.github.io/woocommerce-rest-api-docs/v3.html?php#parameters
					$orders = $woocommerce->get(
						'orders',
						array(
							'page'  => 1,
							'per_page' => 1,
						)
					);

					// retrieve page count from headers:
					$last_response    = $woocommerce->http->getResponse();
					$response_headers = $last_response->getHeaders();

					$lc_response_headers = array_change_key_case( $response_headers, CASE_LOWER );
					if ( !isset( $lc_response_headers['x-wp-totalpages'] ) ) {
						return false;
					}

					$this->woo_total_orders = (int)$lc_response_headers['x-wp-total'];

					// we can't rely on the X-WP-TotalPages header here, as we're only retrieving one order for speed
					$this->woo_total_pages = ceil( $this->woo_total_orders / $this->orders_per_page );


				} catch ( HttpClientException $e ) {

					// failed to connect
					return false;

				} catch ( Missing_Settings_Exception $e ) {

					// missing settings means couldn't load lib.
					return false;

				}


			} else {

				// Local store

				// Where we're trying to run without WooCommerce, fail.
				if ( !function_exists( 'wc_get_orders' ) ) {

					$this->debug( 'Unable to return percentage completed as it appears WooCommerce is not installed.' );
					return false;

				} else {

					// retrieve orders (just to get total page count (≖_≖ ))
					$orders = wc_get_orders(
						array(
							'limit'    => 1, // no need to retrieve more than one order here
							'paged'    => 1,
							'paginate' => true,
						)
					);

					$this->woo_total_orders = $orders->total;

					// we can't rely on $orders->max_num_pages here, as we're only retrieving one order for speed
					$this->woo_total_pages = ceil( $this->woo_total_orders / $this->orders_per_page );

				}

			}

		}

		// calculate completeness
		if ( $this->woo_total_pages === 0 ) {

			// no orders to sync, so complete
			$percentage_completed = 100;

		} else {

			$percentage_completed = $this->current_page / $this->woo_total_pages * 100;

		}

		$this->debug( 'Percentage completed: ' . $percentage_completed . '%' );

		$this->debug( 'Pages completed: ' . $this->current_page . ' / ' . $this->woo_total_pages );
		$this->debug( 'Orders completed: ' . min( $this->current_page * $this->orders_per_page, $this->woo_total_orders ) . ' / ' . $this->woo_total_orders );
		$this->debug( 'Percentage completed: ' . $percentage_completed . '%' );

		if ( $return_counts ){

			return array(

				'page_no'              => $this->current_page,
				'total_pages'          => $this->woo_total_pages,
				'percentage_completed' => $percentage_completed

			);

		}

		// return
		if ( $percentage_completed >= 0 ) {

			return $percentage_completed;

		}

		return false;

	}


	/**
	 * Filter contact data passed through the woo checkout
	 * .. allows us to hook in support for things like WooCommerce Checkout Field Editor
	 *
	 * @param array $field_key
	 * @param array $field_value
	 * @param array $contact_data
	 * @param array $order - WooCommerce order object passed down
	 * @param array $custom_fields - CRM Contact custom fields details
	 * 
	 * @return array ($contact_data potentially modified)
	 */
	private function filter_checkout_contact_fields( $field_key, $field_value, $contact_data, $order, $custom_fields ) {

	    // Checkout Field Editor custom fields support, (where installed)
	    // https://woocommerce.com/products/woocommerce-checkout-field-editor/
	    if ( function_exists( 'wc_get_custom_checkout_fields' ) ) {
	    	
	    	$contact_data = $this->checkout_field_editor_filter_field( $field_key, $field_value, $contact_data, $order, $custom_fields );
	    
	    }


	    // Checkout Field Editor Pro custom fields support, (where installed)
	    // https://wordpress.org/plugins/woo-checkout-field-editor-pro/
	    if ( class_exists( 'THWCFD' ) ) {
	    	
	    	$contact_data = $this->checkout_field_editor_pro_filter_field( $field_key, $field_value, $contact_data, $order, $custom_fields );
	    
	    }

	    
	    return $contact_data;

	}


	/**
	 * Filter to add Checkout Field Editor custom fields support, where installed
	 * https://woocommerce.com/products/woocommerce-checkout-field-editor/
	 *
	 * @param array $field_key
	 * @param array $field_value
	 * @param array $contact_data
	 * @param array $order - WooCommerce order object passed down
	 * @param array $custom_fields - CRM Contact custom fields details
	 * 
	 * @return array ($contact_data potentially modified)
	 */
	private function checkout_field_editor_filter_field( $field_key, $field_value, $contact_data, $order, $custom_fields ) {

	    // Checkout Field Editor custom fields support, (where installed)
	    if ( function_exists( 'wc_get_custom_checkout_fields' ) ) {

	    	// get full fields
	    	$fields_info = wc_get_custom_checkout_fields( $order );

	    	// catch specific cases
	    	if ( isset( $fields_info[ $field_key ] ) ){

	    		// format info from Checkout Field Editor
	    		$field_info = $fields_info[ $field_key ];

	    		switch ( $field_info['type'] ){

	    			// multiselect
	    			case 'multiselect':

	    				// here the value will be a csv with extra padding (spaces we don't store)
	    				$contact_data[ $field_key ] = str_replace( ', ', ',', $field_value );

	    				break;

	    			// checkbox, singular
	    			case 'checkbox':

	    				// here the value will be 1 if it's checked, 
	    				// but in CRM we only have 'checkboxes' plural, so here we convert '1' to a checked matching box
	    				// Here if checked, we'll check the first available checkbox
	    				if ( $field_value == 1 ){

	    					// get value
	    					if ( isset( $custom_fields[ $field_key ] ) ){

	    						$fields_csv = $custom_fields[ $field_key ][2];
	    						if ( strpos( $fields_csv, ',' ) ){
	    							$field_value = substr( $fields_csv, 0, strpos( $fields_csv, ',' ) );
	    						} else {
	    							$field_value = $fields_csv;
	    						}

	    					}

	    					$contact_data[ $field_key ] = $field_value;

	    				}


	    				break;

	    		}


	    	}


	    }

	    return $contact_data;

	}

	
	/**
	 * Filter to add Checkout Field Editor Pro (Checkout Manager) for WooCommerce support, where installed
	 * https://wordpress.org/plugins/woo-checkout-field-editor-pro/
	 *
	 * @param array $field_key
	 * @param array $field_value
	 * @param array $contact_data
	 * @param array $order - WooCommerce order object passed down
	 * @param array $custom_fields - CRM Contact custom fields details
	 * 
	 * @return array ($contact_data potentially modified)
	 */
	private function checkout_field_editor_pro_filter_field( $field_key, $field_value, $contact_data, $order, $custom_fields ) {

	    // Checkout Field Editor custom fields support, (where installed)
	    if ( class_exists( 'THWCFD' ) ) {

			// see if we have a matching custom field to infer type conversions from:
			if ( isset( $custom_fields[ $field_key ] ) ){

				// switch on type
				switch ( $custom_fields[ $field_key ][0] ){

	    			// checkbox, singular
	    			case 'checkbox':

	    				// here the value will be 1 if it's checked, 
	    				// but in CRM we only have 'checkboxes' plural, so here we convert '1' to a checked matching box
	    				// Here if checked, we'll check the first available checkbox
	    				if ( $field_value == 1 ){

	    					// get value
	    					if ( isset( $custom_fields[ $field_key ] ) ){

	    						$fields_csv = $custom_fields[ $field_key ][2];
	    						if ( strpos( $fields_csv, ',' ) ){
	    							$field_value = substr( $fields_csv, 0, strpos( $fields_csv, ',' ) );
	    						} else {
	    							$field_value = $fields_csv;
	    						}

	    					}

	    					$contact_data[ $field_key ] = $field_value;

	    				}


	    				break;

				}

			}			

	    }

	    return $contact_data;

	}


	/**
	 * Filter to add WooCommerce Checkout Add-ons fields support, where installed
	 * https://woocommerce.com/products/woocommerce-checkout-add-ons/
	 *
	 * @param array $order_post_id - WooCommerce order id
	 * @param array $contact_data
	 * @param array $custom_fields - CRM Contact custom fields details
	 * 
	 * @return array ($contact_data potentially modified)
	 */
	private function checkout_add_ons_add_field_values( $order_post_id, $contact_data, $custom_fields ) {

		global $zbs;

	    // WooCommerce Checkout Add-ons fields support, where installed
	    if ( function_exists( 'wc_checkout_add_ons' ) ) {

	    	$checkout_addons_instance = wc_checkout_add_ons();
	    	$field_values = $checkout_addons_instance->get_order_add_ons( $order_post_id );
	    	
	    	// Add any fields we have saved in Checkout Add-ons,
	    	// note this overrides any existing values, if conflicting
	    	if ( is_array( $field_values ) ){

	    		/* Example
	    		    Array(
		    		    [de22a81] => Array
				        (
				            [name] => tax-id-2
				            [checkout_label] => tax-id-2
				            [value] => 999
				            [normalized_value] => 999
				            [total] => 0
				            [total_tax] => 0
				            [fee_id] => 103
				        )
				    )
			    */

	    		foreach ( $field_values as $checkout_addon_key => $checkout_addon_field ){

	    			$field_key = $zbs->DAL->makeSlug( $checkout_addon_field['name'] );

	    			// brutal addition/override of any fields passed
	    			$contact_data[ $field_key ] = $checkout_addon_field['value'];

	    			// all array-type values (multi-select etc.) can be imploded for our storage:
	    			// multiselect, multicheckbox
	    			if ( is_array( $contact_data[ $field_key ] ) ){

	    				// note we used `normalized_value` not `value`, because that matches our custom field storage
	    				// ... e.g. "Blue" = `normalized_value`, "blue" = value (but we store case)
	    				$contact_data[ $field_key ] = implode( ',', $checkout_addon_field['normalized_value'] );

	    			}

	    			// see if we have a matching custom field to infer type conversions from:
    				if ( isset( $custom_fields[ $field_key ] ) ){

    					// switch on type
    					switch ( $custom_fields[ $field_key ][0] ){

			    			// Select, radio
			    			case 'select':
			    			case 'radio':

			    				// note we used `normalized_value` not `value`, because that matches our custom field storage
			    				// ... e.g. "Blue" = `normalized_value`, "blue" = value (but we store case)
			    				$contact_data[ $field_key ] = $checkout_addon_field['normalized_value'];

			    				break;

			    			// checkbox, singular
			    			case 'checkbox':

			    				// here the value will be 1 if it's checked, 
			    				// but in CRM we only have 'checkboxes' plural, so here we convert '1' to a checked matching box
			    				// Here if checked, we'll check the first available checkbox
			    				if ( $contact_data[ $field_key ] == 1 ){

			    					// get value
			    					if ( isset( $custom_fields[ $field_key ] ) ){

			    						$fields_csv = $custom_fields[ $field_key ][2];
			    						if ( strpos( $fields_csv, ',' ) ){
			    							$contact_data[ $field_key ] = substr( $fields_csv, 0, strpos( $fields_csv, ',' ) );
			    						} else {
			    							$contact_data[ $field_key ] = $fields_csv;
			    						}

			    					}

			    				}

			    				break;

    					}

    				}


	    		}

	    	}
	    
	    
	    }

	    return $contact_data;

	}


	/*
	 * Catch site sync connection errors (and log count per site)
	 */
	private function log_connection_error() {

		// increment connection error count
		$this->woosync()->increment_sync_site_count( $this->site_key, 'site_connection_errors' );

		// how many?
		$error_count = $this->woosync()->get_sync_site_attribute( $this->site_key, 'site_connection_errors', 0 );

		$this->debug( 'External store connection error detected (' . $error_count . ')' );

		if ( $error_count >= 3 ){

			$this->pause_site_due_to_connection_error();

		}

	}


	/*
	 * Fired when a remote site errors out 3 times, pauses site and adds notification to admin area
	 */
	private function pause_site_due_to_connection_error() {

		$this->debug( 'External store connection error count exceeds maximum ... Pausing site connection' );

		// pause
		$this->woosync()->pause_sync_site( $this->site_key );

		// set notification

		// check not fired within past day
		$existing_transient = get_transient( 'woosync.syncsite.paused.errors' );
		if ( !$existing_transient ) {
			global $zbs;

			// add notice & transient
			$reference = strtotime( 'today midnight' );

			$connections_page_url = jpcrm_esc_link( $zbs->slugs['settings'] ) . '&tab=' . $zbs->modules->woosync->slugs['settings'] . '&subtab=' . $zbs->modules->woosync->slugs['settings_connections'];
			zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'woosync.syncsite.paused', $connections_page_url, $reference );
			set_transient( 'woosync.syncsite.paused.errors', 'woosync.syncsite.paused.errors', HOUR_IN_SECONDS * 24 );

		}

	}

}