<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Background Sync
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * MailPoet Background Sync class
 */
class Mailpoet_Background_Sync {
	
	/**
	 * If set to true this will echo progress of a sync job.
	 */
	public $debug = false;
	
	/**
	 * Future proofing multi-connections
	 */
	public $mode = JPCRM_MAILPOET_MODE_LOCAL;

	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup MailPoet Background Sync
	 */
	public function __construct( ) {

		// load job class
		require_once JPCRM_MAILPOET_ROOT_PATH. 'includes/class-mailpoet-background-sync-job.php';

		// Initialise Hooks
		$this->init_hooks();

		// Schedule cron
		$this->schedule_cron();

	}
		

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Mailpoet_Background_Sync is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Mailpoet_Background_Sync main instance
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
	public function mailpoet(){

		global $zbs;
		return $zbs->modules->mailpoet;

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
		add_action( 'jpcrm_mailpoet_sync', array( $this, 'cron_job' ) );

		// Syncing based on MailPoet hooks:

		// Subscriber edits/changes:
		add_action( 'mailpoet_subscriber_created',    array( $this, 'add_update_subscriber_by_id' ), 1, 1 );
		add_action( 'mailpoet_subscriber_updated',    array( $this, 'add_update_subscriber_by_id' ), 1, 1 );
		add_action( 'mailpoet_subscriber_deleted',    array( $this, 'delete_subscriber_by_id' ), 1, 1 );
		add_action( 'mailpoet_multiple_subscribers_created',    array( $this, 'add_update_subscribers_by_id' ), 1, 1 );
		add_action( 'mailpoet_multiple_subscribers_updated',    array( $this, 'add_update_subscribers_by_id' ), 1, 1 );
		add_action( 'mailpoet_multiple_subscribers_deleted',    array( $this, 'delete_subscribers_by_id' ), 1, 1 );

		// add our cron task to the core crm cron monitor list
		add_filter( 'jpcrm_cron_to_monitor',               array( $this, 'add_cron_monitor' ) );

	}


	/**
	 * Setup cron schedule
	 */
	private function schedule_cron( ) {

		// schedule it
		if ( ! wp_next_scheduled( 'jpcrm_mailpoet_sync' ) ) {
		  wp_schedule_event( time(), '5min', 'jpcrm_mailpoet_sync' );
		}	

	}


	/**
	 * Run cron job
	 */
	public function cron_job(){

		// define global to mark this as a cron call
		define( 'jpcrm_mailpoet_cron_running', 1 );

		// fire job
		$this->sync_subscribers();

	}

	/**
	 * Returns bool as to whether or not the current call was made via cron
	 */
	private function is_cron(){

		return defined( 'jpcrm_mailpoet_cron_running' );

	}


	/**
	 * Filter call to add the cron zbssendbot to the watcher system
	 *
	 * @param array $crons
	 * @return array
	 */
	function add_cron_monitor( $crons ) {

		if ( is_array( $crons ) ) {

			$crons[ 'jpcrm_mailpoet_sync' ] = '5min';
		}

		return $crons;
	}


	/**
	 * Main job function: this will retrieve and import subscribers from MailPoet
	 * 	This can be called in three 'modes'
	 *    - via cron (as defined by `jpcrm_mailpoet_cron_running`)
	 *    - via AJAX (if not via cron and not in debug mode)
	 *    - for debug (if $this->debug is set) This is designed to be called inline and will output progress of sync job
	 *
	 * @param bool $silent - if true no output will be returned (for use where we call after `add_update_subscribers_by_id()`)
	 *
	 * @return mixed (int|json)
	 *   - if cron originated: a count of orers imported is returned
	 *   - if not cron originated (assumes AJAX):
	 *      - if completed sync: JSON summary info is output and then exit() is called
	 *      - else count of subscribers imported is returned
	 */
	public function sync_subscribers( $silent = false ){

		global $zbs;
		

		$this->debug( 'Fired `sync_subscribers()`.' );

		// check not currently running
		if ( defined( 'jpcrm_mailpoet_running' ) ) {

			$this->debug( 'Attempted to run `sync_subscribers()` when job already in progress.' );

			// return blocker error
			return array( 'status' => 'job_in_progress' );

		}

		$this->debug( 'Commencing syncing...' );

		// prep silos
		$total_remaining_pages = 0;
		$total_pages = 0;
		$errors = array();
		$subscribers_synced = 0;

		// blocker			
		if ( !defined( 'jpcrm_mailpoet_running' ) ) {
		
			define( 'jpcrm_mailpoet_running', 1 );
		
		}

		// init class
		$sync_job = new Mailpoet_Background_Sync_Job( $this->debug );

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
			$subscribers_synced = (int)$sync_result['subscribers_synced'];

		}


		// discern completeness
		// either maxxed pages, or more likely x no = y no
		if ( $total_remaining_pages == 0 || $this->mailpoet()->get_all_mailpoet_subscribers_count() <= $this->mailpoet()->get_crm_mailpoet_contact_count() ){

			$sync_status = 'sync_completed';
			$overall_percentage = 100;
			$status_short_text = __( 'Sync Completed', 'zero-bs-crm' );
			$status_long_text = __( 'MailPoet Sync has imported all existing subscribers and will continue to import future subscribers.', 'zero-bs-crm' );

		} else {

			$sync_status = 'sync_part_complete';
			$overall_percentage = (int)( ( $total_pages - $total_remaining_pages ) / $total_pages * 100 );
			$status_short_text = __( 'Syncing subscribers from MailPoet...', 'zero-bs-crm' );
			$status_long_text = '';

		}

		// if cron, we just return count
		if ( $this->is_cron() || $silent ) {

			return array(

					'status'               => $sync_status, // sync_completed sync_part_complete job_in_progress error
					'status_short_text'    => $status_short_text,
					'percentage_completed' => $overall_percentage,

			);

		} else {

			$this->debug( 'Completed Subscriber Sync Job: ' . $sync_status );
			$mailpoetsync_status_array = array(
				'status'                           => $sync_status,
				'status_short_text'                => $status_short_text,
				'status_long_text'                 => $status_long_text,
				'page_no'                          => ( $total_pages - $total_remaining_pages ),
				'subscribers_synced'               => $subscribers_synced,
				'percentage_completed'             => $overall_percentage,
				'total_crm_contacts_from_mailpoet' => $this->mailpoet()->get_crm_mailpoet_contact_count()
			);
			$mailpoet_latest_stats = $this->mailpoet()->get_jpcrm_mailpoet_latest_stats();
			echo json_encode( array_merge( $mailpoet_latest_stats, $mailpoetsync_status_array ) );
			exit();

		}

	}


	/**
	 * Set's a completion status for MailPoet Subscriber imports
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
		$this->mailpoet()->settings->update( 'first_import_complete', $status_bool );

		return $status_bool;

	}


	/**
	 * Returns a completion status for MailPoet Subscriber imports
	 *
	 * @return bool $status
	 */
	public function first_import_completed(){

		$status_bool = false;

		// get
		$first_import_complete = $this->mailpoet()->settings->get( 'first_import_complete', false );

		if ( $first_import_complete == 'yes' || $first_import_complete === true || $first_import_complete == 1 ){

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

		$this->mailpoet()->settings->update( 'resume_from_page', $page_no );

		return $page_no;

	}


	/**
	 * Return current working page index (to resume from)
	 *
	 * @return int $page
	 */
	public function resume_from_page(){

		return $this->mailpoet()->settings->get( 'resume_from_page', 0 );

	}


	/**
	 * Returns 'local' or 'api'
	 *  (whichever mode is selected in settings)
	 */
	public function import_mode( $str_mode = false ){

		// import mode
		$mode = (int)$this->mode;

		// debug/string mode
		if ( $str_mode ) {
			if ( $mode === 0 ) {
				return 'JPCRM_MAILPOET_MODE_LOCAL';
			} else {
				return 'JPCRM_MAILPOET_MODE_API';
			}
		}

		return $mode;

	}



	/**
	 * Add or Update subscriber
	 * Fired by hooks: mailpoet_subscriber_created, mailpoet_subscriber_updated, mailpoet_subscriber_deleted
	 * Changes caught here:
	 * - first, last names
	 * - email
	 * - doens't seem to fire on: change of newsletter, change of tags
	 */
	public function add_update_subscriber_by_id( int $subscriberId ){

		global $zbs;

		// should we log changes via contact note?
		$autolog_changes = $this->mailpoet()->settings->get( 'autolog_changes', false );

		// retrieve records
		$potential_subscriber = $this->mailpoet()->get_mailpoet_subscriber_by_subscriber_id( $subscriberId );
		$potential_contact = $zbs->DAL->contacts->getContact( -1, array(

            'externalSource'    => 'mailpoet',
            'externalSourceUID' => $subscriberId,

        ));

		// got records?
		if (
				is_array( $potential_subscriber ) && isset( $potential_subscriber['email'] )
		){

			// Update:
			if ( is_array( $potential_contact ) && isset( $potential_contact['id'] ) ){
		
				// note changes
				$previous_data = $potential_contact;
				$contact_changes = array();

				// email (will always be the same until https://github.com/Automattic/zero-bs-crm/issues/2565)
				// ... in fact this next block is defunct as it stands because getSubscriber above gets the subscriber
				// ... AFTER email change.
				if ( $potential_subscriber['email'] != $potential_contact['email'] ){

					$contact_changes['email'] = $potential_subscriber->data->email;

					// if email changed, add old as an alias
					// for that we need the old alias list to append to
					$contact_aliases = is_array( $potential_contact['aliases'] ) ? $potential_contact['aliases'] : array();
					if ( !in_array( $previous_data['email'], $contact_aliases ) ){

						$contact_aliases[] = $previous_data['email'];

					}

				}

				// first name
				if ( $potential_subscriber['first_name'] != $potential_contact['fname'] ){

					$contact_changes['fname'] = $potential_subscriber['first_name'];

				}

				// last name
				if ( $potential_subscriber['last_name'] != $potential_contact['lname'] ){

					$contact_changes['lname'] = $potential_subscriber['last_name'];

				}		

				// enact changes
				if ( count( $contact_changes ) > 0 ){
		
					// we split this into field + contact_aliases changes, because then we can use limitedFields support

					// build limited fields:
					$contact_changes_as_limited_fields = array();
					foreach ( $contact_changes as $key => $value ){

						$contact_changes_as_limited_fields[] = array(

							'key'    => 'zbsc_' . $key,
							'val'    => $value,
							'type'   => '%s' // all are strings here

						);

					}

					// enact
					$zbs->DAL->contacts->addUpdateContact( array( 
						
						'id'            => $potential_contact['id'],
						'limitedFields' => $contact_changes_as_limited_fields 

					));

					// any aliases to add?
					if ( isset( $contact_aliases ) && count( $contact_aliases ) ){

						foreach ( $contact_aliases as $alias ){

	                        zeroBS_addObjAlias( ZBS_TYPE_CONTACT, $potential_contact['id'], $alias );
						}

					}

					// do we add logs?
					if ( $autolog_changes == "1" ){

						// build log
						$object_change_str = '';
						if ( isset( $contact_changes['email'] ) ){

							$object_change_str .= sprintf ( '%s: <code>%s</code> → <code>%s</code><br>', __( 'Email', 'zero-bs-crm' ), $previous_data['email'], $contact_changes['email'] );

						}
						if ( isset( $contact_changes['fname'] ) ){

							$object_change_str .= sprintf ( '%s: <code>%s</code> → <code>%s</code><br>', __( 'First name', 'zero-bs-crm' ), $previous_data['fname'], $contact_changes['fname'] );

						}
						if ( isset( $contact_changes['lname'] ) ){

							$object_change_str .= sprintf ( '%s: <code>%s</code> → <code>%s</code><br>', __( 'Last name', 'zero-bs-crm' ), $previous_data['lname'], $contact_changes['lname'] );

						}

						// add log
						if ( !empty( $object_change_str ) ){

							zeroBS_addUpdateLog(
								$potential_contact['id'],
								-1,
								-1,
								array(
									'type' => __( 'Contact Changed via MailPoet', 'zero-bs-crm' ),
									'shortdesc' => __( 'Contact details changed via connected MailPoet subscriber', 'zero-bs-crm' ),
									'longdesc' => $object_change_str,
								),
								'zerobs_customer'
							);

						}

					}

				}

				return;

			} else {

				// New addition

				// Note we can't act on this hook because currently the only thing passed is the 
				// MailPoet ID, from which the user can't currently (via MailPoet API) be retrieved
				// ... so when they add that we can use $this->mailpoet()->get_mailpoet_subscriber_by_subscriber_id
				// in it's real sense and write logic here to import the addition.
				// For now we hack around this below using their GetSubscribers endpoint with a filter of `minUpdatedAt`
				// ... though that's not a sure bet by any means.
				// see #temporary-workaround
				// gh-2565


			}

		}

		// Temporary workaround for lack of accessibility to getSubscriberByID in MP API
		// in the instance of newly added subs
		// #temporary-workaround
		// Attempts to grab the last inserted sub. This will be hit and miss, but will work smoothly for
		// small, infrequently updated lists
		$last_updated_guess_timestamp = time() + jpcrm_get_wp_timezone_offset_in_seconds() - 1;
		$potential_subscribers = $this->mailpoet()->get_mailpoet_subscribers( false, false, $last_updated_guess_timestamp, 1, 0, false, true, true );

		if ( is_array( $potential_subscribers ) && count( $potential_subscribers ) > 0 ){

			// push this sub through our sync import function:

			// init class
			$sync_job = new Mailpoet_Background_Sync_Job( false );
			$sync_job->import_subscriber( $potential_subscribers[0] );

		}


	}

	/**
	 * Delete subscriber
	 * Fired by hooks: mailpoet_subscriber_created, mailpoet_subscriber_updated, mailpoet_subscriber_deleted
	 */
	public function delete_subscriber_by_id( int $subscriberId ){

		global $zbs;

		// what's the delete action?
		$delete_action = $this->mailpoet()->settings->get( 'delete_action', 'none' );

		// shall we delete the related crm contact?
		if ( $delete_action == 'delete' || $delete_action == 'delete_save_related_objects' ){

			// retrieve record
			$potential_contact_id = $zbs->DAL->contacts->getContact( -1, array(

	            'externalSource'    => 'mailpoet',
	            'externalSourceUID' => $subscriberId,

	            'onlyID'            => true,

	        ));

			// got record?
			if ( $potential_contact_id ){

				$save_orphans = false;
				if ( $delete_action == 'delete_save_related_objects' ) {
					
					$save_orphans = true;

				}

				// delete the contact
				$zbs->DAL->contacts->deleteContact( array(

					'id'            => $potential_contact_id,
					'saveOrphans'   => $save_orphans,

				));

			}

		} elseif ( $delete_action == 'add_note' ) {

			// if it was deleted in MailPoet but user has 'add_note' selected as delete action, we add a log to contact

			// retrieve record
			$potential_contact_id = $zbs->DAL->contacts->getContact( -1, array(

	            'externalSource'    => 'mailpoet',
	            'externalSourceUID' => $subscriberId,

	            'onlyID'            => true,

	        ));

			// got record?
			if ( $potential_contact_id ){

				zeroBS_addUpdateLog(
					$potential_contact_id,
					-1,
					-1,
					array(
						'type'      => __( 'Subscriber deleted in MailPoet', 'zero-bs-crm' ),
						'shortdesc' => __( 'Associated MailPoet subscriber was deleted in MailPoet', 'zero-bs-crm' ),
						'longdesc'  => ''
					),
					'zerobs_customer'
				);

			}

		}

		// if we're not deleting the contact, we need to remove the external source record
		// for the contact, because there's no link any more.
		// ... actually if we leave it in tact it still records useful info (the fact the source was MP)

	}


	/**
	 * Add or Update subscribers 
	 * Fired by hooks: mailpoet_multiple_subscribers_created, mailpoet_multiple_subscribers_updated
	 */
	public function add_update_subscribers_by_id( int $minActionTimestamp ){

		// catch these via sync
		$this->sync_subscribers( true );

	}


	/**
	 * Delete subscribers 
	 * Fired by hook: mailpoet_multiple_subscribers_deleted
	 */
	public function delete_subscribers_by_id( array $subscriberIds ){

		// here we rely on our other function `delete_subscriber_by_id()`
		// which has all of the settings-based delete actions
		if ( count( $subscriberIds ) > 0 ){

			foreach ( $subscriberIds as $subscriber_id ){

				$this->delete_subscriber_by_id( $subscriber_id );

			} 
		}

	}


}