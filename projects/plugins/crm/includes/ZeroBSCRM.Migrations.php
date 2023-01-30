<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.18
 *
 * Copyright 2020 Automattic
 *
 * Date: 30/08/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

/* ======================================================
	MIGRATION FUNCS
   ====================================================== */

global $zeroBSCRM_migrations; $zeroBSCRM_migrations = array(
	'240', // Refresh user roles
	'288', // build client portal page (moved to shortcodes) if using
	'2963', // 2.96.3 - installs page templates
	'29999', // Flush permalinks 
	'411', // 4.11.0 - Ensure upload folders are secure
	'50', // 5.0 - Alter external sources table for existing users (added origin)
	'53', // 5.3 - Migrate all encrypted data to new encryption endpoints
	'54', // 5.4 - Support pinned logs, migrate all log meta stored in old dehydrated fashion
	'543', // 5.4.3 - Deletes unwanted .htaccess files
	'544', // 5.4.2 Forces re-install of default fonts
	'55', // 5.5 Deletes orphaned rows linked to invoices in the objlinks table
	'55a', // 5.5a Recompiles segments after wp_loaded
	'551', // 5.5.1 Deletes orphaned aka rows linked to contacts since deleted
	'560', // 5.6.0 Moves old folder structure (zbscrm-store) to new (jpcrm-stora
	/*
	'123','127',
	'216','22',
	,'241','242','250','2531',
	'270', // DAL 2.0
	'275',
	'280','281',
	'287',
	'2943', // 2.94.2 rebuild roles (added logs perms) + notice for mail delivery peeps (not using wp-mail)
	'295', // 2.94 - mikes alter of sys emails table + reset user roles (Added emails)
	'2952', // 2.95.2 - adds cron manager table silently (mc2 prep)
	'2962', // 2.96.2 - although set to 2953 as less so will run in v2.96.1 also
	'2964', // 2.96.4 - FIX for missing 2.96.3 extra template for 'password reset email for cp'
	'2966',	// 2.96.6 - adds extra template for 'pdf statement'
	'2972', // 2.97.2 - adds db performance improvements for contacts retrieved via tag (including adding indexes)
	'2974', // 2.97.4 - fixes duplicated email templates (found on 2 installs so far)
	'2975', // 2.97.5 - (actually included in 2.97.4) corrects borked external sources setup.
	'2977', // 2.97.7 - Fixes an index to allow non-uniques (for user screen options)
	'2984', // 2.98.4 - Fixes segment conditions bug
	'2981',	// 2.98.1 - add in the invoice tax table
	'2999', // 2.99.0 - install tables for DAL3.0	
		'3000', // 3.0 - Migrate all the THINGS
	'305', // 3.0.5 - catch instances where really old installs saved customer statuses as trans statuses gh-179
	'308', // 3.0.8 - Anyone with pdf module installed already, install pdf fonts for them
	'3012', // 3.0.12 - Remove any uploads\ directory which may have been accidentally created pre 2.96.6			
	'3013', // 3.0.13 - Mark any wp options we've set as autoload=false, where they are not commonly needed (perf)
	'3014', // 3.0.14 - Correct any wrongly permified transaction statuses 'to include'
	'3017', // 3.0.17 - Change line item quantity to a decimal
  	'3018', // 3.0.18 - Catch any Contact date custom fields (which were in date format pre v3) and convert them to UTS as v3 expects
	'3019', // 3.0.19 - Migrate the SMTP passwords
	'402', // 4.0.2 - Fix the transactions data
	'407', // 4.0.7 - corrects outdated event notification template
    '408', // 4.0.8 - Add default reference type of invoices & Update the existing template for email notifications (had old label)
	//'4010', // 4.0.10 - Jan sale notification 
	'450', // 4.5.0 - Adds indexing protection to directories with potentially sensitive .html files


*/
	);

global $zeroBSCRM_migrations_requirements; $zeroBSCRM_migrations_requirements = array(
		//'270' => array('preload'),
		'288' => array('isDAL2','postsettings'),
		//'3000' => array('preload','isDAL2'),
		//'3014' => array('isDAL3','postsettings'),
		//'3018' => array('isDAL3','postsettings'),
		//'408'  => array('isDAL3','postsettings'),
		'53'     => array('isDAL3','postsettings'),
		'5402'   => array('isDAL3','postsettings'),
		'55a'    => array( 'wp_loaded' ),
	);


// mark's a migration complete
function zeroBSCRM_migrations_markComplete($migrationKey=-1,$logObj=false){

	global $zeroBSCRM_migrations;

	if (!empty($migrationKey) && in_array($migrationKey, $zeroBSCRM_migrations)) {

		$completedMigrations = zeroBSCRM_migrations_getCompleted();
		$completedMigrations[] = $migrationKey;

		// we're using wp options because they're reliable OUTSIDE of the scope of our settings model
		// ... which has changed through versions 
		// the separation here is key, at 2.88 WH discovered much re-running + pain due to this.
		// stick to a separate migration system (away from zbssettings)
	    update_option('zbsmigrations',$completedMigrations, false);

		// log opt?
	    update_option('zbsmigration'.$migrationKey,array('completed'=>time(),'meta'=>$logObj), false);

	}
}

// gets the list of completed migrations
function zeroBSCRM_migrations_getCompleted(){

	// we're using wp options because they're reliable OUTSIDE of the scope of our settings model
	// ... which has changed through versions 
	// the separation here is key, at 2.88 WH discovered much re-running + pain due to this.
	// stick to a separate migration system (away from zbssettings)

	// BUT WAIT! hilariously, for those who already have finished migrations, this'll re-run them
	// ... so here we 'MIGRATE' the migrations :o ffs
	global $zbs; $migrations = $zbs->settings->get('migrations'); if (isset($migrations) && is_array($migrations) && count($migrations) > 0) {
	
		$existingMigrationsMigration = get_option( 'zbsmigrationsdal', -1);

		if ($existingMigrationsMigration == -1){
			// copy over +
			// to stop this ever rerunning + confusing things, we set an option to say migrated the migrations, LOL
			update_option('zbsmigrations',$migrations, false);
			update_option('zbsmigrationsdal',2, false);
		}
	}

	// normal return
	return get_option( 'zbsmigrations', array() );

}

// gets details on a migration
function jpcrm_migrations_get_migration($migrationKey=''){

	// we're using wp options because they're reliable OUTSIDE of the scope of our settings model
	// ... which has changed through versions 
	// the separation here is key, at 2.88 WH discovered much re-running + pain due to this.
	// stick to a separate migration system (away from zbssettings)
	$finished = false; $migrations = zeroBSCRM_migrations_getCompleted(); if (in_array($migrationKey,$migrations)) $finished = true;

	return array($finished,get_option('zbsmigration'.$migrationKey,false));

}

function zeroBSCRM_migrations_run( $settingsArr = false, $run_at = 'init' ){

	global $zeroBSCRM_migrations,$zeroBSCRM_migrations_requirements;

	    // catch migration block removal (can be run from system status):
	    if (current_user_can('admin_zerobs_manage_options') && isset($_GET['resetmigrationblock']) && wp_verify_nonce( $_GET['_wpnonce'], 'resetmigrationblock' ) ){

	        // unblock migration blocks
	        delete_option('zbsmigrationpreloadcatch');
	        delete_option('zbsmigrationblockerrors');

	        // flag
	        $migrationBlocksRemoved = true;
	    }

	#} Check if we've been stumped by blocking errs, and STOP migrating if so
	$blockingErrs = get_option( 'zbsmigrationblockerrors', false);
    if ($blockingErrs !== false && !empty($blockingErrs)) return false;

	#} load migrated list if not loaded
	$migratedAlreadyArr = zeroBSCRM_migrations_getCompleted();

	#} Run count
	$migrationRunCount = 0;

	#} cycle through any migrations + fire if not fired.
	if (count($zeroBSCRM_migrations) > 0) foreach ($zeroBSCRM_migrations as $migration){

		if (!in_array($migration,$migratedAlreadyArr) && function_exists('zeroBSCRM_migration_'.$migration)) {

			$run = true;

			// check reached state
			if ( isset( $zeroBSCRM_migrations_requirements[$migration] ) ){

				// 'preload' requirement means this migration needs to run AFTER a reload AFTER the previous migration
				// ... so if preload here, we kill this loop, if prev migrations have run
				if ( in_array( 'preload', $zeroBSCRM_migrations_requirements[$migration]) && $migrationRunCount > 0 ){

					// ... as a catch to stop infinite reloads, we check whether more than 3 of these have run in a row, and we stop that.
					$previousAttempts = get_option( 'zbsmigrationpreloadcatch', array());
					if (!is_array($previousAttempts)) $previousAttempts = array();
					if (!isset($previousAttempts[$migration])) $previousAttempts[$migration] = 1;
					if ($previousAttempts[$migration] < 5){

						// update count
						$previousAttempts[$migration]++;
						update_option('zbsmigrationpreloadcatch', $previousAttempts, false);

						// stop running migrations, reload the page
						header("Refresh:0");
						exit();

					} else {

						// set a global which'll show up on systemstatus if this state occurs.
						update_option('zbsmigrationblockerrors', $migration, false);					

						// expose an error that the world's about to rupture
					    add_action('after-zerobscrm-admin-init','zeroBSCRM_adminNotices_majorMigrationError');
			    		add_action( 'admin_notices', 'zeroBSCRM_adminNotices_majorMigrationError' );

					}

				}				

				// assume func
				foreach ($zeroBSCRM_migrations_requirements[$migration] as $check){

					// skip 'preload', dealt with above
					// skip 'wp_loaded', dealt with in second run
					if ( $check !== 'preload' && $check !== 'wp_loaded' ){

						$checkFuncName = 'zeroBSCRM_migrations_checks_'.$check;
						if (!call_user_func($checkFuncName)) $run = false;

					}
				}
				
				// wp_loaded
				if ( in_array( 'wp_loaded', $zeroBSCRM_migrations_requirements[$migration] ) ){

					$run = false;

					if ( $run_at == 'wp_loaded' ){
						 $run = true;
					}

				}

			}

			// go
			if ($run) {

				// run migration
				call_user_func('zeroBSCRM_migration_'.$migration);
				
				// update count
				$migrationRunCount++;

			}
		}

	}

}

// Migration dependency check for DAL2
function zeroBSCRM_migrations_checks_isDAL2(){

	global $zbs; return $zbs->isDAL2();

}
// Migration dependency check for DAL3
function zeroBSCRM_migrations_checks_isDAL3(){

	global $zbs; return $zbs->isDAL3();

}

function zeroBSCRM_migrations_checks_postsettings(){

	global $zbs;
	/* didn't work:
	if (isset($zbs->settings) && method_exists($zbs->settings,'get')){
		$possiblyInstalled = $zbs->settings->get('settingsinstalled',true);
		if (isset($possiblyInstalled) && $possiblyInstalled > 0) return true;
	} */
	// HARD DB settings check
	try {
		$potentialDBSetting = $zbs->DAL->getSetting(array('key' => 'settingsinstalled','fullDetails' => false));	

		if (isset($potentialDBSetting) && $potentialDBSetting > 0) {

			return true;

		}

	} catch (Exception $e){

	}

	return false;
}

// general migration mechanism error
function zeroBSCRM_adminNotices_majorMigrationError(){

     //pop in a Notify Me Notification here instead....?
	 if (get_current_user_id() > 0){

	     // already sent?
	     $msgSent = get_transient('zbs-migration-general-errors');
	     if (!$msgSent){

	       zeroBSCRM_notifyme_insert_notification(get_current_user_id(), -999, -1, 'migration.blocked.errors','migration.blocked.errors');
	       set_transient( 'zbs-migration-general-errors', 20, 24 * 7 * HOUR_IN_SECONDS );

	    }

	}

}

/* ======================================================
	/ MIGRATION FUNCS
   ====================================================== */



/* ======================================================
	MIGRATIONS
   ====================================================== */

	/*
	* Migration 2.4 - Refresh user roles
	*/
	function zeroBSCRM_migration_240(){

		#} Glob
		global $zbs, $zeroBSCRM_Conf_Setup; #req

		#} This function migrates users from before ver 2.4

		  #} re-add/remove any roles :)

			    // roles
				zeroBSCRM_clearUserRoles();

				// roles + 
				zeroBSCRM_addUserRoles();

	    	zeroBSCRM_migrations_markComplete('240',array('updated'=>1));
			


	}


	/*
	* Migration 2.88 - build client portal page (moved to shortcodes) if using
	*/
	function zeroBSCRM_migration_288(){

		global $zbs;

		zeroBSCRM_portal_checkCreatePage();
		
		zeroBSCRM_migrations_markComplete('288',array('updated'=>'1'));

	}


	/*
	* Migration 2.4 - Refresh user roles
	*  Previously this was a number of template related migrations
	*  for v5 we combined these, though in time the need for this method of install should be done away with
	*  Previously, migrations: 2.96.3, 2.96.4, 2.96.6, 2.97.4, 4.0.7, 4.0.8
	*/
	function zeroBSCRM_migration_2963(){
		
		global $zbs, $wpdb, $ZBSCRM_t;

		#} Check + create
		zeroBSCRM_checkTablesExist();

		#} Make the DB emails...
		zeroBSCRM_populateEmailTemplateList();


		// ===== Previously: Migration 2.96.3 - adds new template for 'client portal pw reset'

		#} default is admin email and CRM name	
		//now all done via zeroBSCRM_mailDelivery_defaultFromname
		$from_name = zeroBSCRM_mailDelivery_defaultFromname();

		/* This wasn't used in end, switched to default mail delivery opt 
		$from_address = zeroBSCRM_mailDelivery_defaultEmail();; //default WordPress admin email ?
		$reply_to = '';
		$cc = ''; */
		$deliveryMethod = zeroBSCRM_getMailDeliveryDefault(); 
		
		$ID = 6;
		$reply_to = '';
		$cc = '';
		$bcc = '';

		#} The email stuff...
		$subject = __("Your Client Portal Password", 'zero-bs-crm');
		$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('clientportalpwreset');
		$active = 1; //1 = true..
		if(zeroBSCRM_mailTemplate_exists($ID) == 0){
			$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
			//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
			zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
		}

		// ===== / Previously: Migration 2.96.3


		// ===== Previously: last one hadn't got the html file, this ADDS file proper :)

		#} default is admin email and CRM name	
		//now all done via zeroBSCRM_mailDelivery_defaultFromname
		$from_name = zeroBSCRM_mailDelivery_defaultFromname();

		/* This wasn't used in end, switched to default mail delivery opt 
		$from_address = zeroBSCRM_mailDelivery_defaultEmail();; //default WordPress admin email ?
		$reply_to = '';
		$cc = ''; */
		$deliveryMethod = zeroBSCRM_getMailDeliveryDefault(); 
		
		$ID = 6;
		$reply_to = '';
		$cc = '';
		$bcc = '';

		// BRUTAL DELETE old one
		$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );

		#} The email stuff...
		$subject = __("Your Client Portal Password", 'zero-bs-crm');
		$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('clientportalpwreset');
		
		$active = 1; //1 = true..
		if(zeroBSCRM_mailTemplate_exists($ID) == 0){
			$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
			//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
			zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
		}

		// ===== / Previously: last one hadn't got the html file, this ADDS file proper :)


		// ===== Previously: adds template for 'invoice summary statement sent'

		#} default is admin email and CRM name	
		//now all done via zeroBSCRM_mailDelivery_defaultFromname
		$from_name = zeroBSCRM_mailDelivery_defaultFromname();

		/* This wasn't used in end, switched to default mail delivery opt 
		$from_address = zeroBSCRM_mailDelivery_defaultEmail();; //default WordPress admin email ?
		$reply_to = '';
		$cc = ''; */
		$deliveryMethod = zeroBSCRM_getMailDeliveryDefault(); 
		
		$ID = 7;
		$reply_to = '';
		$cc = '';
		$bcc = '';
		
		#} The email stuff...
		$subject = __("Your Statement", 'zero-bs-crm');
		$content = zeroBSCRM_mail_retrieveDefaultBodyTemplate('invoicestatementsent');

		// BRUTAL DELETE old one
		$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'zbsmail_id' => $ID ) );
		
		$active = 1; //1 = true..
		if(zeroBSCRM_mailTemplate_exists($ID) == 0){
			$content = zeroBSCRM_mailTemplate_processEmailHTML($content);
			//zeroBSCRM_insertEmailTemplate($ID,$from_name,$from_address,$reply_to,$cc,$bcc,$subject,$content,$active);
			zeroBSCRM_insertEmailTemplate($ID,$deliveryMethod,$bcc,$subject,$content,$active);
		}

		// ===== / Previously: adds template for 'invoice summary statement sent'


		// ===== Previously: 2.97.4 - fixes duplicated email templates (found on 2 installs so far)

		// 7 template emails up to here :)
		for ($i = 0; $i <= 7; $i++){

			// count em
			$sql = $wpdb->prepare("SELECT ID FROM " . $ZBSCRM_t['system_mail_templates'] . " WHERE zbsmail_id = %d GROUP BY ID ORDER BY zbsmail_id DESC, zbsmail_lastupdated DESC", $i);
			$r = $wpdb->get_results($sql, ARRAY_A);

				// if too many, delete oldest (few?)
				if (is_array($r) && count($r) > 1){

					$count = 0;

					// first stays, as the above selects in order by last updated
					foreach ($r as $x){

						// if already got one, delete this (extra)
						if ($count > 0){

							// BRUTAL DELETE old one
							$wpdb->delete( $ZBSCRM_t['system_mail_templates'], array( 'ID' => $x['ID'] ) );

						}

						$count++;

					}

				}

		}
		
		// ===== / Previously: 2.97.4 - fixes duplicated email templates (found on 2 installs so far)
		

		// ===== Previously: 4.0.7 - corrects outdated event notification template

		// retrieve existing template - hardtyped
		$existingTemplate = $wpdb->get_var('SELECT zbsmail_body FROM '.$ZBSCRM_t['system_mail_templates'].' WHERE ID = 6');

		// load new
		$newTemplate = zeroBSCRM_mail_retrieveDefaultBodyTemplate('eventnotification');

		// back it up into a WP option if was different
	    if ($existingTemplate !== $newTemplate) update_option('jpcrm_eventnotificationtemplate',$existingTemplate, false);

		// overwrite
		$sql = "UPDATE " . $ZBSCRM_t['system_mail_templates'] . " SET zbsmail_body = %s WHERE ID = 6";
		$q = $wpdb->prepare($sql,array($newTemplate));
		$wpdb->query($q);
		
		// ===== / Previously: 4.0.7 - corrects outdated event notification template
		

		// ===== Previously: 4.0.8 - Set the default reference type for invoices & Update the existing template for email notifications (had old label)
        
        if ( $zbs->DAL->invoices->getFullCount() > 0 ) {
            // The user has used the invoice module. Default reference type = manual
            $zbs->settings->update( 'reftype', 'manual' );
        }


        // Update the existing template for email notifications (had old label)     
		global $ZBSCRM_t,$wpdb;

		// retrieve existing template - hardtyped
		$existingTemplate = $wpdb->get_var('SELECT zbsmail_body FROM '.$ZBSCRM_t['system_mail_templates'].' WHERE ID = 4');

		// load new
		$newTemplate = zeroBSCRM_mail_retrieveDefaultBodyTemplate('invoicesent');

		// back it up into a WP option if was different
	    if ($existingTemplate !== $newTemplate) update_option('jpcrm_invnotificationtemplate',$existingTemplate, false);

		// overwrite
		$sql = "UPDATE " . $ZBSCRM_t['system_mail_templates'] . " SET zbsmail_body = %s WHERE ID = 4";
		$q = $wpdb->prepare($sql,array($newTemplate));
		$wpdb->query($q);

		// ===== / Previously: 4.0.8 - Set the default reference type for invoices & Update the existing template for email notifications (had old label)

		zeroBSCRM_migrations_markComplete('2963',array('updated'=>'1'));

	}


	/*
	* Migration 2.99.99 - set permalinks to flush (was used with v3.0 migration, left in tact as portal may be dependent)
	*/
	function zeroBSCRM_migration_29999(){

		// set permalinks to flush, this'll cause them to be refreshed on 3000 migration
		// ... as that has preload setting
		zeroBSCRM_rewrite_setToFlush();

		// fini
		zeroBSCRM_migrations_markComplete('29999',array('updated'=>1));

	}

	/*
	* Migration 4.11.0 - secure upload folders
    *  previously:
    *  4.5.0 - Adds indexing protection to directories with potentially sensitive .html files
	*  4.11.0 - secure upload folders
	*/
	function zeroBSCRM_migration_411(){

		$wp_uploads_dir = wp_upload_dir();

		// directories to secure
		// if these ever expand beyond this we should move the list to core & manage periodic checks
		$directories = array(

			ZEROBSCRM_PATH . 'templates/',
			ZEROBSCRM_PATH . 'templates/emails/',
			ZEROBSCRM_PATH . 'templates/invoices/',
			ZEROBSCRM_PATH . 'templates/quotes/',

			$wp_uploads_dir['basedir'] . '/' . 'zbscrm-store/_wip/',

		);

		// secure them!
		foreach ( $directories as $directory ){
			jpcrm_create_and_secure_dir_from_external_access( $directory, true );
		}

		jpcrm_create_and_secure_dir_from_external_access( $wp_uploads_dir['basedir'] . '/' . 'zbscrm-store/', false );

		// mark complete
		zeroBSCRM_migrations_markComplete('411',array('updated'=>1));

	}

	/*
	* Migration 5.0 - Alter external sources table for existing users (added origin)
	*/
	function zeroBSCRM_migration_50(){

		global $zbs, $wpdb, $ZBSCRM_t;

		// external source tweak
		if ( !zeroBSCRM_migration_tableHasColumn( $ZBSCRM_t['externalsources'], 'zbss_origin' ) ){

			$sql = "ALTER TABLE " . $ZBSCRM_t['externalsources'] . " ADD COLUMN `zbss_origin` VARCHAR(400) NULL DEFAULT NULL AFTER `zbss_uid`, ADD INDEX (zbss_origin);";
			$wpdb->query( $sql );

		}

		// add transaction status

		// build string
    $transaction_statuses = zeroBSCRM_getTransactionsStatuses(true);
    $deleted_string = __( 'Deleted', 'zero-bs-crm' );
    if ( !in_array( $deleted_string, $transaction_statuses ) ){
      $transaction_statuses[] = $deleted_string;
    }
    $transaction_statuses_str = implode( ',', $transaction_statuses );

    // update
    $customisedFields = $zbs->settings->get('customisedfields');
    $customisedFields['transactions']['status'][1] = $transaction_statuses_str;   
    $zbs->settings->update('customisedfields',$customisedFields);


		// mark complete
		zeroBSCRM_migrations_markComplete( '50', array( 'updated' => 1 ) );

	}


	/*
	* 5.3 - Migrate all encrypted data to new encryption endpoints
	*/
	function zeroBSCRM_migration_53(){

		global $zbs;

		// load libs

		// ~5.3
		if ( ! function_exists( 'zeroBSCRM_encrypt' ) ) {
			require( ZEROBSCRM_INCLUDE_PATH . 'ZeroBSCRM.Encryption.php' );
		}

		// 5.3~
		$zbs->load_encryption();

		// count
		$successful_recryptions = 0;

		// Mail Delivery methods (if any):

		// previous decrypt key
		$decryption_key = hex2bin( zeroBSCRM_getSetting('smtpkey') );

		// retrieve existing
		$existing_mail_delivery_methods = zeroBSCRM_getSetting( 'smtpaccs' );
		if (!is_array($existing_mail_delivery_methods)) $existing_mail_delivery_methods = array();

		// cycle through them and re-encrypt
		$replacement_delivery_methods = array();
		foreach ( $existing_mail_delivery_methods as $method_key => $method_array ){

				$updated_method_array = $method_array;

				if ( isset( $method_array['pass'] ) ){

					// decrypt (hiding deprecation notices via param)
					$password = zeroBSCRM_encryption_unsafe_process( 'decrypt', $method_array['pass'], $decryption_key, zeroBSCRM_get_iv( true ), true );

					// This is used as a fallback because some users can still have passwords
					// that were encrypted using the wrong IV.
					if ( !$password ) {
						$password = zeroBSCRM_encryption_unsafe_process( 'decrypt', $method_array['pass'], $decryption_key, $decryption_key, true );
					}

					if ( $password ) {

						// encrypt password:
						$updated_method_array['pass'] = $zbs->encryption->encrypt( $password, 'smtp' );

					} else {

						// keep existing ciphertext; likely already updated but otherwise corrupt
						$updated_method_array['pass'] = $method_array['pass'];

					}

					$successful_recryptions++;

				}

				$replacement_delivery_methods[ $method_key ] = $updated_method_array;

		}

		// update em
		$zbs->settings->update( 'smtpaccs', $replacement_delivery_methods );

		// There was some old usage of pwmanager on companys with CPTs, for now we're skipping support.
		// $pws = get_post_meta($id,$zbsPasswordManager['dbkey'],true);

		// hash secret if not already hashed
		$api_secret = $zbs->DAL->setting( 'api_secret' );
		if ( strpos( $api_secret, 'zbscrm_' ) === 0 ) {
			$hashed_api_secret = $zbs->encryption->hash( $api_secret );
			$zbs->DAL->updateSetting( 'api_secret', $hashed_api_secret );
    }

		global $wpdb, $ZBSCRM_t;
		// add indexes for performance
		if ( jpcrm_database_server_has_ability('fulltext_index') && !jpcrm_migration_table_has_index( $ZBSCRM_t['customfields'], 'search' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['customfields'] . ' ADD FULLTEXT INDEX `search` (`zbscf_objval`);';
			$wpdb->query( $sql );
		}
		if ( !jpcrm_migration_table_has_index( $ZBSCRM_t['taglinks'], 'zbstl_tagid+zbstl_objtype' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['taglinks'] . ' ADD INDEX `zbstl_tagid+zbstl_objtype` (`zbstl_tagid`,`zbstl_objtype`) USING BTREE;';
			$wpdb->query( $sql );
		}
		if ( !jpcrm_migration_table_has_index( $ZBSCRM_t['externalsources'], 'zbss_uid+zbss_source+zbss_objtype' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['externalsources'] . ' ADD INDEX `zbss_uid+zbss_source+zbss_objtype` (`zbss_uid`,`zbss_source`,`zbss_objtype`) USING BTREE;';
			$wpdb->query( $sql );
		}
		if ( !jpcrm_migration_table_has_index( $ZBSCRM_t['meta'], 'zbsm_objid+zbsm_key+zbsm_objtype' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['meta'] . ' ADD INDEX `zbsm_objid+zbsm_key+zbsm_objtype` (`zbsm_objid`,`zbsm_key`,`zbsm_objtype`) USING BTREE;';
			$wpdb->query( $sql );
		}
		if ( !jpcrm_migration_table_has_index( $ZBSCRM_t['logs'], 'zbsl_created' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['logs'] . ' ADD INDEX `zbsl_created` (`zbsl_created`) USING BTREE;';
			$wpdb->query( $sql );
		}
		if ( !jpcrm_migration_table_has_index( $ZBSCRM_t['contacts'], 'zbsc_status' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['contacts'] . ' ADD INDEX `zbsc_status` (`zbsc_status`) USING BTREE;';
			$wpdb->query( $sql );
		}

		// remove errant .htaccess file
		$wp_uploads_dir = wp_upload_dir();
		$errant_htaccess = $wp_uploads_dir['basedir'] . '/' . 'zbscrm-store/.htaccess';
		if ( file_exists( $errant_htaccess ) ) {
			unlink( $errant_htaccess );
		}
		// mark complete
		zeroBSCRM_migrations_markComplete( '53', array( 'updated' => $successful_recryptions ) );

	}

	/*
	* Migration 5.4
  * - Support pinned logs.
  * - Migrate all log meta stored in old dehydrated fashion. (Will do in 1k chunks until finished.)
	*/
	function zeroBSCRM_migration_54(){

		global $zbs, $wpdb, $ZBSCRM_t;

		// add zbsl_pinned to log table if not existing
		if ( !zeroBSCRM_migration_tableHasColumn( $ZBSCRM_t['logs'], 'zbsl_pinned' ) ) {
			$sql = 'ALTER TABLE ' . $ZBSCRM_t['logs'] . ' ADD `zbsl_pinned` int(1) NULL AFTER `zbsl_longdesc`;';
			$wpdb->query( $sql );
		}

		// get outdated log meta count
		$outdated_log_meta_count = (int)$wpdb->get_var( 'SELECT COUNT(ID) FROM ' . $ZBSCRM_t['meta'] . ' WHERE zbsm_objtype = 8 AND zbsm_key = "logmeta"' );

		if ( $outdated_log_meta_count > 0 ) {

			// get outdated meta records
			$outdated_log_meta_records = $wpdb->get_results( 'SELECT * FROM ' . $ZBSCRM_t['meta'] . ' WHERE zbsm_objtype = 8 AND zbsm_key = "logmeta" ORDER BY ID DESC LIMIT 5000' );

			foreach ( $outdated_log_meta_records as $log_record ){

				// hydrate - Note that `[]` doesn't hydrate into array with this
				$log_meta = $zbs->DAL->decodeIfJSON( $zbs->DAL->stripSlashes( $log_record->zbsm_val ) );

				// insert new line foreach meta
				if ( is_array( $log_meta ) ){

					foreach ( $log_meta as $key => $value ){

						$zbs->DAL->updateMeta( ZBS_TYPE_LOG, $log_record->zbsm_objid, $zbs->DAL->makeSlug( $key ), $value );

					}

				}

				// delete old 'dehydrated whole' line
				zeroBSCRM_db2_deleteGeneric( $log_record->ID, 'meta' );

			}

			// any left?
			$outdated_log_meta_count = (int)$wpdb->get_var( 'SELECT COUNT(ID) FROM ' . $ZBSCRM_t['meta'] . ' WHERE zbsm_objtype = 8 AND zbsm_key = "logmeta"' );

		}

		if ( $outdated_log_meta_count == 0 ){

			// mark complete
			zeroBSCRM_migrations_markComplete( '54', array( 'updated' => 1 ) );

		}

	}

	/*
	* Migration 5.4.3
	* - Removes unwanted .htaccess files
	*/
	function zeroBSCRM_migration_543() {
		// recursively deletes all .htaccess files starting from the root storage folder 
		$root_storage = zeroBSCRM_privatisedDirCheck();
		if ( $root_storage !== false ) {
			$recursive_file_iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root_storage['path'] ) );
			$htaccess_files          = array();

			foreach ( $recursive_file_iterator as $file ) {
				if ( $file->isDir() || $file->getBasename() != '.htaccess' ) {
					continue;
				}
				$htaccess_files[] = $file->getPathname();
			}

			foreach ( $htaccess_files as $errant_htaccess ) {
				if ( is_file( $errant_htaccess ) ){
						unlink( $errant_htaccess );
				}
			}
		}

		// mark this migration as complete
		zeroBSCRM_migrations_markComplete( '543', array( 'updated' => 1 ) );
	}

	/*
	* Migration 5.4.4
	* - Forces re-install of default fonts (moved to new JPCRM storage folder)
	*/
	function zeroBSCRM_migration_544(){

		global $zbs;

		// font reinstall
		$shouldBeInstalled = zeroBSCRM_getSetting( 'feat_pdfinv' );
		if ( $shouldBeInstalled == "1" ){

			// force reinstall of fonts
			$fonts = $zbs->get_fonts();
			if ( !$fonts->extract_and_install_default_fonts() ) {
				return false;
			}

		}

		// mark complete
		zeroBSCRM_migrations_markComplete( '544', array( 'updated' => 1 ) );

	}

	/*
	* Migration 5.5
	* - Deletes orphaned rows linked to invoices in the objlinks table
	*/
	function zeroBSCRM_migration_55() {

		global $zbs, $wpdb, $ZBSCRM_t;

		// Deletes links when missing invoices are the 'to' object
		$wpdb->query(
				' DELETE FROM ' . $ZBSCRM_t['objlinks']
			. ' WHERE '
			. ' zbsol_objtype_to = ' . ZBS_TYPE_INVOICE
			. ' AND zbsol_objid_to NOT IN ( SELECT ID from ' . $ZBSCRM_t['invoices'] . ' ) '
		);

		// Deletes links when missing invoices are the 'from' object
		$wpdb->query(
				' DELETE FROM ' . $ZBSCRM_t['objlinks']
			. ' WHERE '
			. ' zbsol_objtype_from = ' . ZBS_TYPE_INVOICE
			. ' AND zbsol_objid_from NOT IN ( SELECT ID from ' . $ZBSCRM_t['invoices'] . ' ) '
		);

		// Deletes orphaned line items
		$wpdb->query(
			  ' DELETE FROM ' . $ZBSCRM_t['lineitems'] . ' WHERE ID NOT IN'
			. ' ('
			. '   SELECT zbsol_objid_from FROM ' . $ZBSCRM_t['objlinks']
			. '   WHERE '
			. '    zbsol_objtype_from = ' . ZBS_TYPE_LINEITEM
			. ' )'
		);

		// mark complete
		zeroBSCRM_migrations_markComplete( '55', array( 'updated' => 1 ) );

	}

	/*
	* Migration 5.5a
	* Recompiles segments, runs on later schedule (wp_loaded)
	*/
	function zeroBSCRM_migration_55a(){

		global $zbs;

		// recompile segments with new condition names
		$zbs->DAL->segments->compile_all_segments();

		// mark complete
		zeroBSCRM_migrations_markComplete( '55a', array( 'updated' => 1 ) );


	}



	/*
	* Migration 5.5.1
	* - Deletes orphaned aka rows linked to contacts since deleted
	*/
	function zeroBSCRM_migration_551() {

		global $zbs, $wpdb, $ZBSCRM_t;

		// Deletes orphaned aka rows
		$wpdb->query(
			  'DELETE FROM ' . $ZBSCRM_t['aka'] 
			  . ' WHERE aka_type = ' . ZBS_TYPE_CONTACT . ' AND aka_id NOT IN'
			  . ' (SELECT id FROM ' . $ZBSCRM_t['contacts'] . ')'
		);

		// mark complete
		zeroBSCRM_migrations_markComplete( '551', array( 'updated' => 1 ) );

	}

/**
 * Migration 5.6.0
 * Moves files from the old file structure (zbscrm-store) to the new
 * one (jpcrm-storage) for rows from the meta table that have their object type
 * equals to ZBS_TYPE_CONTACT and a file in the zbsm_val column.
 *
 * @param object $meta_row Row from the meta table that needs to be updated.
 *
 * @return void
 */
function zeroBSCRM_migration_560_move_custom_file_upload_box( $meta_row ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	global $wpdb, $ZBSCRM_t; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	jpcrm_migration_load_wp_filesystem_direct();

	// Skip if this is not a custom file for a contact
	// (the only type that should exist, but we are being extra careful here).
	if ( $meta_row->zbsm_objtype !== ZBS_TYPE_CONTACT ) {
		return;
	}
	$file_path = $meta_row->zbsm_val;
	// Skip if this file doesn't exist (user may have deleted using the filesystem).
	if ( ! file_exists( $file_path ) ) {
		error_log( sprintf( 'JPCRM migration error while searching for upload box file %s', $file_path ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return;
	}
	$new_dir = jpcrm_storage_dir_info_for_contact( $meta_row->zbsm_objid );
	// Skip if there is no information for the files subfolder.
	if ( $new_dir === false || ! isset( $new_dir['files'] ) ) {
		error_log( sprintf( 'JPCRM migration error missing subfolder files for contact ID %s', $meta_row->zbsm_objid ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return;
	}
	$new_dir_info         = $new_dir['files'];
	$upload_folder_exists = jpcrm_create_and_secure_dir_from_external_access( $new_dir_info['path'], false );
	if ( $upload_folder_exists === false ) {
		// We shouldn't have any errors here, but if we do we log it and skip this one.
		error_log( sprintf( 'JPCRM migration error while creating upload box folder %s ', $new_dir_info['path'] ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return;
	}
	$file_name            = basename( $file_path );
	$new_file_path        = $new_dir_info['path'] . '/' . $file_name;
	$wp_filesystem_direct = new WP_Filesystem_Direct( false );
	// Moving the file.
	if ( ! $wp_filesystem_direct->move( $file_path, $new_file_path, true ) ) {
		// We shouldn't have any errors here, but if we do we log it and skip this one.
		error_log( sprintf( 'JPCRM migration error while moving upload box %s to %s', $file_path, $new_file_path ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return;
	}

	// Updates the database.
	$update_result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$ZBSCRM_t['meta'], // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		array(
			'zbsm_val'         => $new_file_path,
			'zbsm_lastupdated' => time(),
		),
		array( 'ID' => $meta_row->ID ),
		array( // Field data types.
			'%s',
			'%d',
		),
		array( // Where data types.
			'%d',
		)
	);

	if ( $update_result === false ) {
		error_log( sprintf( 'JPCRM migration error while updating upload box meta %s to %s', $meta_row->ID ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}

/**
 * Migration 5.6.0
 * Moves files from the old file structure (zbscrm-store) to the new
 * one (jpcrm-storage) for rows from the meta table that have the key 'files'.
 *
 * @param object $meta_row Row from the meta table that needs to be updated.
 *
 * @return void
 */
function zeroBSCRM_migration_560_move_file_array( $meta_row ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	global $wpdb, $ZBSCRM_t; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	jpcrm_migration_load_wp_filesystem_direct();

	// Before we move the files from the array we must discover its type and
	// update its dir_info information (contains information for several
	// subfolders, we will use the 'files' subfolder).
	$new_dir = false;
	switch ( $meta_row->zbsm_objtype ) {
		case ZBS_TYPE_CONTACT:
			$new_dir = jpcrm_storage_dir_info_for_contact( $meta_row->zbsm_objid );
			break;

		case ZBS_TYPE_COMPANY:
			$new_dir = jpcrm_storage_dir_info_for_company( $meta_row->zbsm_objid );
			break;

		case ZBS_TYPE_QUOTE:
			$new_dir = jpcrm_storage_dir_info_for_quotes( $meta_row->zbsm_objid );
			break;

		case ZBS_TYPE_INVOICE:
			$new_dir = jpcrm_storage_dir_info_for_invoices( $meta_row->zbsm_objid );
			break;
	}

	// Skip if any other type (we are only moving these four types).
	if ( $new_dir === false || ! isset( $new_dir['files'] ) ) {
		return;
	}

	$new_dir_info        = $new_dir['files'];
	$outdated_file_array = json_decode( $meta_row->zbsm_val, true );
	// If we can't decode it neither the CRM can when it shows files, so
	// we can skip it.
	if ( $outdated_file_array === null ) {
		return;
	}

	// This was the hard-coded value in JPCRM < 5.4.x.
	$previous_folder = 'zbscrm-store';
	$new_file_array  = array();
	foreach ( $outdated_file_array as $outdated_file_meta ) {
		// Skip if this has an unknown format.
		// Skip if this isn't an outdate file.
		// Skip if this file doesn`t exist (user may have deleted using the filesystem).
		if (
			! isset( $outdated_file_meta['file'] )
			|| strpos( $outdated_file_meta['file'], "/$previous_folder/" ) === false
			|| ! file_exists( $outdated_file_meta['file'] )
		) {
			$new_file_array[] = $outdated_file_meta;
			continue;
		}

		$upload_folder_exists = jpcrm_create_and_secure_dir_from_external_access( $new_dir_info['path'], false );
		if ( $upload_folder_exists === false ) {
			// We shouldn't have any errors here, but if we do we log it and skip this one.
			error_log( sprintf( 'JPCRM migration error while creating folder %s ', $new_dir_info['path'] ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			$new_file_array[] = $outdated_file_meta;
			return;
		}

		$file_name            = basename( $outdated_file_meta['file'] );
		$new_file_path        = $new_dir_info['path'] . '/' . $file_name;
		$wp_filesystem_direct = new WP_Filesystem_Direct( false );
		// Moving the file.
		if ( ! $wp_filesystem_direct->move( $outdated_file_meta['file'], $new_file_path, true ) ) {
			// We shouldn't have any errors here, but if we do we log it and skip this one.
			error_log( sprintf( 'JPCRM migration error while moving %s to %s', $outdated_file_meta['file'], $new_file_path ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			$new_file_array[] = $outdated_file_meta;
			continue;
		}

		// Updating references to save in the database.
		$outdated_file_meta['file'] = $new_file_path;
		$outdated_file_meta['url']  = $new_dir_info['url'] . '/' . $file_name;
		$new_file_array[]           = $outdated_file_meta;
	}
	// Updates the database.
	$update_result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$ZBSCRM_t['meta'], // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		array(
			'zbsm_val'         => wp_json_encode( $new_file_array ),
			'zbsm_lastupdated' => time(),
		),
		array( 'ID' => $meta_row->ID ),
		array( // Field data types.
			'%s',
			'%d',
		),
		array( // Where data types.
			'%d',
		)
	);

	if ( $update_result === false ) {
		error_log( sprintf( 'JPCRM migration error while updating file array meta %s to %s', $meta_row->ID ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}

/**
 * Migration 5.6.0
 * Moves the old folder structure (zbscrm-store) to the new one (jpcrm-storage).
 *
 * @return void
 */
function zeroBSCRM_migration_560() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	global $wpdb, $ZBSCRM_t; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	// This was the hard-coded value in JPCRM < 5.4.x.
	$previous_folder = 'zbscrm-store';
	// We only store files in the meta table.
	$query         = sprintf( "SELECT * FROM `%s` WHERE `zbsm_val` LIKE '%s'", $ZBSCRM_t['meta'], '%%%s%%' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$outdated_rows = $wpdb->get_results( $wpdb->prepare( $query, $previous_folder ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

	if ( is_array( $outdated_rows ) ) {
		foreach ( $outdated_rows as $outdated_row ) {
			// The first type of row we have to migrate has they key 'files' and
			// has an array of files attached to an object of type `zbsm_objtype`.
			if ( $outdated_row->zbsm_key === 'files' ) {
				zeroBSCRM_migration_560_move_file_array( $outdated_row );
			} else {
				zeroBSCRM_migration_560_move_custom_file_upload_box( $outdated_row );
			}
		}
	}

	// Mark as complete.
	zeroBSCRM_migrations_markComplete( '560', array( 'updated' => 1 ) );
}

/* ======================================================
	/ MIGRATIONS
   ====================================================== */


/* ======================================================
   MIGRATION Helpers
   ====================================================== */

   // simplistic arr manager
   function zeroBSCRM_migration_addErrToStack($err=array(),$errKey=''){

   		if ($errKey !== ''){

   			$existing = get_option($errKey, array());

   			// catch err in err stack.
   			if (!is_array($existing)) $existing = array();

   			// add + update
   			$existing[] = $err;
			update_option( $errKey, $existing, false);

			return true;

   		}

   		return false;
   }

   // checks if a column already exists
   // note $tableName is used unchecked
   function zeroBSCRM_migration_tableHasColumn( $table_name, $column_name ){

   		global $wpdb;

   		if ( !empty( $table_name ) && !empty( $column_name ) ){

   			$query = $wpdb->prepare( "SHOW COLUMNS FROM " . $table_name . " LIKE %s", $column_name );
	
	   		$row = $wpdb->get_results( $query );
			
			if ( is_array( $row ) && count( $row ) > 0 ){

				return true;

			}

		}

		return false;

   }

   /*
   * Verifies if a mysql table has an index named X
   */
   function jpcrm_migration_table_has_index( $table_name, $index_name ){

   		global $wpdb;

		$query = $wpdb->prepare( "SHOW INDEX FROM " . $table_name . " WHERE Key_name = %s", $index_name );
		$row = $wpdb->get_results( $query );

		if ( is_array( $row ) && count( $row ) > 0){

			return true;

		}

		return false;
		
   }

   /**
	* Retrieves the data typo of the given colemn name in the given table name.
	* It's worth noting that it will have the size of the field too, so `int(10)`
	* rather than just `int`.
	*
	* @param $table_name string The table name to query.
	* @param $column_name string The column name to query.
	*
	* @return string|false The column type as a string, or `false` on failure.
	*/
   function zeraBSCRM_migration_get_column_data_type( $table_name, $column_name ) {
	   global $wpdb;

	   $column = $wpdb->get_row( $wpdb->prepare( 
		   "SHOW COLUMNS FROM $table_name LIKE %s",
		   $column_name ) );
	   return empty( $column ) ? false : $column->Type;
   }

/**
 * Loads everything needed to use the WP_Filesystem_Direct class.
 *
 * @return void
 */
function jpcrm_migration_load_wp_filesystem_direct() {
	require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php';
	require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-direct.php';
}

/* ======================================================
   / MIGRATION Helpers
   ====================================================== */
