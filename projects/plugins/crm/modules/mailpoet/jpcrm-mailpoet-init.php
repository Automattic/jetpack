<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Module initialisation
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;


// Add to $zeroBSCRM_extensionsCompleteList global
// (Legacy way of maintaining an extensions list)
global $zbs, $zeroBSCRM_extensionsCompleteList;
$zeroBSCRM_extensionsCompleteList['mailpoet'] = array(
  'fallbackname'  => 'MailPoet Sync',
  'imgstr'        => '<i class="fa fa-keyboard-o" aria-hidden="true"></i>',
  'desc'          => __( 'Automatically import MailPoet data into your CRM.', 'zero-bs-crm' ),
  'url'           => $zbs->urls['mailpoet'],
  'colour'        => '#fe5300',
  'helpurl'       => $zbs->urls['kb-mailpoet'],
  'shortname'     => 'MailPoet',
);

global $jpcrm_core_extension_setting_map;
$jpcrm_core_extension_setting_map['mailpoet'] = 'feat_mailpoet';


// registers MailPoet Sync as a core extension, and adds to $zeroBSCRM_extensionsCompleteList global
function jpcrm_register_free_extension_mailpoet( $exts ) {

  // append our module
  $exts['mailpoet'] = array(
    'name' => 'MailPoet Sync',
    'i' => 'ext/mailpoet.png',
    'short_desc' => __( 'Automatically import MailPoet data into your CRM.', 'zero-bs-crm' )
  );

  return $exts;

}
add_filter( 'jpcrm_register_free_extensions', 'jpcrm_register_free_extension_mailpoet' );


// load the Mailpoet class if feature is enabled
function jpcrm_load_mailpoet() {

  global $zbs;

  // load
  if ( zeroBSCRM_isExtensionInstalled( 'mailpoet' ) ) {
    
    require_once( JPCRM_MODULES_PATH . 'mailpoet/includes/class-mailpoet.php' );
    $zbs->modules->load_module( 'mailpoet', 'Mailpoet' );

  }

}
add_action( 'jpcrm_load_modules', 'jpcrm_load_mailpoet' );


// registers MailPoet as an external source
function jpcrm_register_external_sources_mailpoet( $external_sources ) {
  $external_sources['mailpoet'] = array(
      'MailPoet',
      'ico' => 'fa-users'
  );
  return $external_sources;
}
add_filter( 'jpcrm_register_external_sources', 'jpcrm_register_external_sources_mailpoet' );


// Install function
function zeroBSCRM_extension_install_mailpoet() {
  
  return jpcrm_install_core_extension( 'mailpoet' );

}

// Uninstall function
function zeroBSCRM_extension_uninstall_mailpoet() {

	// Removes any MailPoet filter buttons
	jpcrm_mailpoet_remove_filter_buttons();
	
	// remove cron
	wp_clear_scheduled_hook( 'jpcrm_mailpoet_sync' );

	return jpcrm_uninstall_core_extension( 'mailpoet' );

}

/*
* Removes any MailPoet filter buttons from user filter button settings:
* (Leaving a flag to re-install them if reactivated.)
*/
function jpcrm_mailpoet_remove_filter_buttons(){


    global $zbs;

      // get current list view filters
      $custom_views = $zbs->settings->get( 'customviews2' );

      // If we have a customer filter button enabled
      if ( isset( $custom_views['customer_filters']['mailpoet_customer'] ) ){

        // remove our filter
        unset( $custom_views['customer_filters']['mailpoet_customer'] );

        // save
        $zbs->settings->update( 'customviews2', $custom_views );

        // flag it to re-activate when we re-install
        // (delete any 'has_added_mailpoetfilter' flag, which would usually stop this auto-re-enabling, effectively saying 'do re-enable' when reactivated)
        // (enacted via main MailPoet class->include_filter_buttons())
        $zbs->settings->dmzDelete( 'ext_mailpoet', 'has_added_mailpoetfilter' );

      }

}

// Sniffs for MailPoet, and puts out notification when we have MailPoet but no MailPoet Sync
function jpcrm_sniff_feature_mailpoet() {

  global $zbs;
  
  // where we've not got MailPoet active..
  if ( !zeroBSCRM_isExtensionInstalled( 'mailpoet' ) ) {

    // check if MailPoet _is_ active & prompt
    $zbs->feature_sniffer->sniff_for_plugin(
      array(
        'feature_slug'    => 'mailpoet',
        'plugin_slug'     => 'mailpoet/mailpoet.php',
        'more_info_link'  => $zbs->urls['kb-mailpoet'],
        'is_module'       => true,
      )
    );

  }

}
add_action( 'jpcrm_sniff_features', 'jpcrm_sniff_feature_mailpoet' );

// add jobs to system assistant
function jpcrm_add_mailpoet_jobs_to_system_assistant( $job_list ) {

	global $zbs;

	if ( $zbs->mailpoet_is_active() ) {

		// enable the MailPoet module if MailPoet plugin is enabled
		$job_list['enable_mailpoet_module'] = array(

			'title'           => __( 'Enable MailPoet Sync', 'zero-bs-crm' ),
			'icon'            => 'users',
			'desc_incomplete' => __( 'You have the MailPoet plugin installed, but the CRM module is not yet enabled. In order to sync your MailPoet data to the CRM, you first need to enable the module.', 'zero-bs-crm' ),
			'desc_complete'   => __( 'The MailPoet Sync module is active.', 'zero-bs-crm' ),
			'button_url'      => jpcrm_esc_link( $zbs->slugs['modules'] ),
			'button_txt'      => __( 'Check module state', 'zero-bs-crm' ),
			'state'           => zeroBSCRM_isExtensionInstalled( 'mailpoet' ),

		);

		// Sync MailPoet if module is enabled
		if ( zeroBSCRM_isExtensionInstalled( 'mailpoet' ) ) {

			// Get MailPoet data if no MailPoet subscribers exist
			$job_list['get_mailpoet_data'] = array(

				'title'           => __( 'Sync MailPoet data', 'zero-bs-crm' ),
				'icon'            => 'sync alternate',
				'desc_incomplete' => __( 'No subscribers have been imported yet.', 'zero-bs-crm' ),
				'desc_complete'   => __( 'Subscriber data has been imported.', 'zero-bs-crm' ),
				'button_url'      => jpcrm_esc_link( $zbs->modules->mailpoet->slugs['hub'] ),
				'button_txt'      => __( 'Check sync status', 'zero-bs-crm' ),
				'state'           => $zbs->modules->mailpoet->get_crm_mailpoet_contact_count() > 0,

			);
		}

	}

	return $job_list;

}
add_filter( 'jpcrm_system_assistant_jobs', 'jpcrm_add_mailpoet_jobs_to_system_assistant' );

// Extension legacy definitions
if ( ! defined( 'JPCRM_MAILPOET_ROOT_FILE' ) ) {
  define( 'JPCRM_MAILPOET_ROOT_FILE', __FILE__ );
  define( 'JPCRM_MAILPOET_ROOT_PATH', plugin_dir_path( __FILE__ ) );
  define( 'JPCRM_MAILPOET_IMAGE_URL', plugin_dir_url( JPCRM_MAILPOET_ROOT_FILE ) . 'i/' );
}
