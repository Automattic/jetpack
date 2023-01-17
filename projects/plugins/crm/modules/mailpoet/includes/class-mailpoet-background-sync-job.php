<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Background Sync Job (per run, site connection, currently only 1 local site)
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * MailPoet Background Sync Job class
 */
class Mailpoet_Background_Sync_Job {

	/**
	 * Paused state
	 */
	private $paused = false;

	/**
	 * Mode (Local/API)
	 */
	private $mode = JPCRM_MAILPOET_MODE_LOCAL;

	/**
	 * Number of subscribers to process per job
	 */
	private $subscribers_per_page = 500;
	private $pages_per_job = 1;

	/**
	 * Current page the job is working on
	 */
	private $current_page = 1;

	/**
	 * Number of pages in MailPoet
	 */
	private $mailpoet_total_pages = 0;

	/**
	 * Number of subscribers in MailPoet
	 */
	private $mailpoet_total_subscribers = 0;
	
	/**
	 * A per-job cached list of MailPoet Segment data
	 */
	public $segment_list = false;
	
	/**
	 * If set to true this will echo progress of a sync job.
	 */
	public $debug = false;

	/**
	 * Setup MailPoet Background Sync Job
	 */
	public function __construct( $debug = false, $subscribers_per_page = 50, $pages_per_job = 1 ) {


		// set vars
		$this->debug           = $debug;
		$this->subscribers_per_page = $subscribers_per_page;
		$this->pages_per_job   = $pages_per_job;

		// promote paused state
		// <for now we're pausing on this pause functionality>

	}


	/**
	 * Returns main class instance
	 */
	public function mailpoet(){

		global $zbs;
		return $zbs->modules->mailpoet;

	}


	/**
	 * Returns full settings array from main settings class
	 */
	public function settings(){

		return $this->mailpoet()->settings->getAll();

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
	 * Main job function: this will retrieve and import subscribers from MailPoet into CRM.
	 * 
	 * @return mixed (int|json)
	 *   - if cron originated: a count of subscribers imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of subscribers imported is returned
	 */
	public function run_sync(){

		global $zbs;

		$this->debug( 'Fired `run_sync()`' );

		// prep vars
		$run_sync_job = true;
		$total_remaining_pages = 0;
		$total_pages = 0;
		$errors = array();
		$subscribers_synced = 0;

		// check not marked 'paused'
		if ( $this->paused ){

			// skip it
			$this->debug( 'Skipping Sync (mode: ' . $this->mode . ') - Paused' );
			$run_sync_job = false;

		}

		$this->debug( 'Starting Sync (mode: ' . $this->mode . ')' );

		// switch by mode
		if ( $this->mode == JPCRM_MAILPOET_MODE_LOCAL ) {
	
			// local install

			// verify mailpoet installed
			if ( !$zbs->mailpoet_is_active() ) {

				$status_short_text = __( 'Missing MailPoet', 'zero-bs-crm' );

				$this->debug( $status_short_text );

				$errors[] = array(
					'status'            => 'error',
					'status_short_text' => $status_short_text,
					'status_long_text'  => __( 'MailPoet Sync will start importing data when you have installed the MailPoet plugin.', 'zero-bs-crm' ),
					'error'             => 'local_no_mailpoet',
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
				'status_long_text'  => __( 'MailPoet Sync could not sync because it is in an unacceptable mode.', 'zero-bs-crm' ),
				'error'             => 'mode_error',
			);

			// skip this site connection
			$run_sync_job = false;

		}

		if ( $run_sync_job ){

			$this->debug( 'Running Import of ' . $this->pages_per_job . ' pages' );

			// retrieve segment (list) summary data (used to tag contacts with their list participation if option)
			$this->segment_list = $this->mailpoet()->get_mailpoet_lists_summary( true );

			// do x pages
			for ( $i = 0; $i < $this->pages_per_job; $i++ ) {

				// get last working position
				$page_to_retrieve = $this->resume_from_page();

				// ... if for some reason we've got a negative, start from scratch.
				if ( $page_to_retrieve < 0 ) {

					$page_to_retrieve = 0;

				}

				$this->current_page = $page_to_retrieve;

				// import the page of subscribers
				// This always returns the count of imported subscribers,
				//   unless 100% sync is reached, at which point it will exit (if called via AJAX)
				//   for now, we don't need to track the return
				$subscribers_synced += (int)$this->import_page_of_subscribers( $page_to_retrieve );

			}

			// mark the pass
			$this->mailpoet()->settings->update( 'last_sync_fired', time() );
			$this->debug( 'Sync Job finished with percentage complete: ' . $this->percentage_completed( false ) . '% complete.' );

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
			'subscribers_synced'    => $subscribers_synced

		);

	}


	/**
	 * Retrieve and process 1 page of MailPoet Subscribers from local install (or later, API)
	 *
	 * @param int $page_no - the page number to start from
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of subscribers imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of subscribers imported is returned
	 */
	private function import_page_of_subscribers( $page_no ) {

		$this->debug( 'Fired `import_page_of_subscribers( ' . $page_no . ' )`, importing from ' . $this->import_mode( true ) . '.' );

		// store/api switch
		if ( $this->import_mode() === JPCRM_MAILPOET_MODE_LOCAL ) {

			// Local
			return $this->import_local_subscribers( $page_no );

		} else {

			// not yet implemented, external import (JPCRM_MAILPOET_MODE_API)
			return false;

		}

	}


	/**
	 * Retrieve and process a page of MailPoet Subscribers from local install
	 *
	 * @param int $page_no
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of subscribers imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of subscribers imported is returned
	 */
	public function import_local_subscribers( $page_no = -1 ) {

		// Where we're trying to run without MailPoet, fail.
		// In theory we shouldn't ever hit this, as we catch it earlier.
		global $zbs;
		if ( !$zbs->mailpoet_is_active() ) {
			$this->debug( 'Unable to import as it appears the MailPoet plugin is not installed.' );
			return false;
		}

		// catch paging
		if ( $page_no < 0 ){
			$page_no = 0;
		}
		$limit = $this->subscribers_per_page;
		$offset = $this->subscribers_per_page * $page_no;

		$this->debug( 'Retrieving page ' . $page_no . ' of subscribers (limit=' . $limit . ', offset=' . $offset . ')' );

		$subscribers_synced = 0;

		// Later: Allow per-list syncing, (for now this grabs all)
		$mailpoet_subscribers = $this->mailpoet()->get_all_mailpoet_subscribers( $limit, $offset, false, true, true );

		// got subs?
		if ( is_array( $mailpoet_subscribers ) ){

			// cycle through and import
			foreach ( $mailpoet_subscribers as $subscriber ){

				// will be an assoc arr of sub details
				$this->import_subscriber( $subscriber );

				$subscribers_synced++;

			}

		} else {

			$this->debug( 'No MailPoet subscribers found (have we reached the end of the list?)' );
			return false;

		}


		// check for completion
		$total_page_count = $this->get_total_page_count();
		if ( $page_no >= $total_page_count ) {

			$this->debug( 'MailPoet subscriber import complete!' );

			// we're at 100%, mark sync complete
			$this->set_first_import_status( true );

			// set pointer to last page
			$this->set_resume_from_page( $total_page_count );

			// return count
			return $subscribers_synced;

		}

		// There's still pages to go then:

		// increase pointer by one, (only if we've got a full pages worth)
		if ( $subscribers_synced == $this->subscribers_per_page){
			$this->set_resume_from_page( $page_no + 1 );
		}

		// return the count
		return $subscribers_synced;

	}


	/**
	 * Takes a MailPoet associative array for a subscriber and adds/updates a crm contact
	 *
	 * @param array $subscriber
	 * 
	 * @return int $contact_id
	 */
	public function import_subscriber( $subscriber ){

		global $zbs;

		// get settings
		$settings = $this->mailpoet()->settings->getAll();

		// get wpid where passed
		$wpid = -1;
		if ( isset( $subscriber['wp_user_id'] ) && !empty( $subscriber['wp_user_id'] ) ){

			$wpid = $subscriber['wp_user_id'];

		}

		// unused subscriber attributes:
		// is_woocommerce_user, status, subscribed_ip, confirmed_ip, confirmed_at, last_subscribed_at, 
		// updated_at, deleted_at, unconfirmed_data, source (e.g. wordpress user), count_confirmations,
		// unsubscribe_token, link_token, engagement_score, engagement_score_updated_at, last_engagement_at
		// woocommerce_synced_at, email_count
		$contact_args = array(

			'data' => array(

				'email' => $subscriber['email'],
                'fname' =>  $subscriber['first_name'],
                'lname' =>  $subscriber['last_name'],
                'wpid'  => $wpid,

                'externalSources' => array( 
                	array( 
	                	'source'   => 'mailpoet',
	                	'uid'      => $subscriber['id'],
	                	'origin'   => '', // for now this is always same-site
	                	'owner'    => 0 // for now we hard-type no owner to avoid ownership issues. As we roll out fuller ownership we may want to adapt this.
                	)
                ),

                'created' => strtotime( $subscriber['created_at'] ),

			),
			//'extraMeta' => array()

		);

		// tags
		$tags = array();
		if ( $settings['tag_with_list'] == 1 ){

			// tag with subscriber list
			if ( isset( $subscriber['subscriptions'] ) && is_array( $subscriber['subscriptions'] ) ){

				foreach ( $subscriber['subscriptions'] as $subscription ){

					// only for subs
					if ( $subscription['status'] == 'subscribed' ){

						/* 
                            [id] => 1
                            [subscriber_id] => 1
                            [created_at] => 2022-10-11 07:55:51
                            [segment_id] => 1
                            [status] => subscribed
                            [updated_at] => 2022-10-11 07:55:51
	                    */

	                    // find segment (list) name from our summary data
	                    // note: if this doesn't find a match it's likely 
	                    // id 1+2 which seem to be WP and Woo user data sets
	                    // which are not returned by the API `getLists()`
	                    $segment_name = ( isset( $this->segment_list[ $subscription['segment_id'] ] ) ? $this->segment_list[ $subscription['segment_id'] ]['name'] : '' );

	                    // valid list name?
	                    // here we sidestep any with suffix `| CRM` or `| Jetpack CRM`
	                    // .. to avoid us exporting a CRM segment into a list, then reimporting and adding a tag we created
	                    if ( !empty( $segment_name ) && substr( $segment_name, -5 ) !== '| CRM' && substr( $segment_name, -13 ) !== '| Jetpack CRM' ){

	                    	$tags[] = $settings['tag_list_prefix'] . $segment_name;

	                    }

	                }

				}

			}

			

		}
		if ( $settings['tag_with_tags'] == 1 ){

			// tag with subscriber tags
			if ( isset( $subscriber['tags'] ) && is_array( $subscriber['tags'] ) ){

				foreach ( $subscriber['tags'] as $tag ){

					/* 
	                    [id] => 54
	                    [subscriber_id] => 1
	                    [tag_id] => 4
	                    [created_at] => 2022-11-03 13:23:38
	                    [updated_at] => 2022-11-03 13:23:38
	                    [name] => xxx
                    */

	                    // here we sidestep any with suffix `| CRM` or `| Jetpack CRM`
	                    // .. to avoid us exporting a CRM segment into a list, then reimporting and adding a tag we created
	                    if ( substr( $tag['name'], -5 ) !== '| CRM' && substr( $tag['name'], -13 ) !== '| Jetpack CRM' ){
                    
                    		$tags[] = $settings['tag_tag_prefix'] . $tag['name'];

                    	}

				}

			}


		}


		// got tags?
		if ( count( $tags ) > 0 ){

			$contact_args['data']['tags'] = $tags;
			$contact_args['data']['tag_mode'] = 'append';

		}


		//$this->debug( 'Add/Update contact: <pre>' . var_export( $contact_args ) . '</pre>' );

		// Add/update the contact & return id
		return $zbs->DAL->contacts->addUpdateContact( $contact_args );

	}


	/**
	 * Returns a number for total pages to process (with current $this->subscribers_per_page)
	 *
	 * @return int $total_pages
	 */
	public function get_total_page_count(){

		// calculate it
		$this->mailpoet_total_subscribers = $this->mailpoet()->get_all_mailpoet_subscribers_count();
		$total_pages = 0;
		if ( $this->subscribers_per_page > 0 && $this->mailpoet_total_subscribers > 0 ){

			$total_pages = ceil( $this->mailpoet_total_subscribers / $this->subscribers_per_page );

		}

		$this->mailpoet_total_pages = $total_pages;

		return $total_pages;

	}


	/**
	 * Set's a completion status for subscriber imports
	 * (Wrapper)
	 *
	 * @param string|bool $status = 'yes|no' (#legacy) or 'true|false'
	 *
	 * @return bool $status
	 */
	public function set_first_import_status( $status ){

		return $this->mailpoet()->background_sync->set_first_import_status( $status );

	}


	/**
	 * Returns a completion status for subscriber imports
	 * (Wrapper)
	 * 
	 * @return bool $status
	 */
	public function first_import_completed(){

		return $this->mailpoet()->background_sync->first_import_completed();

	}

	/**
	 * Sets current working page index (to resume from)
	 * (Wrapper)
	 * 
	 * @return int $page
	 */
	public function set_resume_from_page( $page_no ){

		return $this->mailpoet()->background_sync->set_resume_from_page( $page_no );

	}


	/**
	 * Return current working page index (to resume from)
	 * (Wrapper)
	 * 
	 * @return int $page
	 */
	public function resume_from_page(){

		return $this->mailpoet()->background_sync->resume_from_page();

	}


	/**
	 * Returns 'local' or 'api'
	 *  (whichever mode is selected in settings)
	 * (Wrapper)
	 */
	public function import_mode( $str_mode = false ){

		return $this->mailpoet()->background_sync->import_mode( $str_mode );

	}

	/**
	 * Attempts to return the percentage completed of a sync
	 *
	 * @param bool $return_counts - Return counts (if true returns an array inc % completed, x of y pages)
	 * @param bool $use_cache - use values cached in object instead of retrieving them directly from MailPoet
	 * 
	 * @return int|bool - percentage completed, or false if not attainable
	 */
	public function percentage_completed( $return_counts = false, $use_cache = true ) {

		// if not using cache, retrieve values from MailPoet
		if ( !$use_cache ) {

			// could probably abstract the retrieval of subscribers for more nesting. For now it's fairly DRY as only in 2 places.

				// Local store
				$this->mailpoet_total_pages = $this->get_total_page_count();

		}

		// calculate completeness
		if ( $this->mailpoet_total_pages === 0 ) {

			// no subscribers to sync, so complete
			$percentage_completed = 100;

		} else {

			$percentage_completed = $this->current_page / $this->mailpoet_total_pages * 100;

		}

		$this->debug( 'Percentage completed: ' . $percentage_completed . '%' );

		$this->debug( 'Pages completed: ' . $this->current_page . ' / ' . $this->mailpoet_total_pages );
		$this->debug( 'Subscribers completed: ' . min( $this->current_page * $this->subscribers_per_page, $this->mailpoet_total_subscribers ) . ' / ' . $this->mailpoet_total_subscribers );
		$this->debug( 'Percentage completed: ' . $percentage_completed . '%' );

		if ( $return_counts ){

			return array(

				'page_no'              => $this->current_page,
				'total_pages'          => $this->mailpoet_total_pages,
				'percentage_completed' => $percentage_completed

			);

		}

		// return
		if ( $percentage_completed >= 0 ) {

			return $percentage_completed;

		}

		return false;

	}


}