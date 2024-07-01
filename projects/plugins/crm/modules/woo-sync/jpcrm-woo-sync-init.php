<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync Module initialisation
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;


// Add to $zeroBSCRM_extensionsCompleteList global
// (Legacy way of maintaining an extensions list)
global $zbs, $zeroBSCRM_extensionsCompleteList;
$zeroBSCRM_extensionsCompleteList['woo-sync'] = array(
  'fallbackname'  => 'WooSync',
  'imgstr'        => '<i class="fa fa-keyboard-o" aria-hidden="true"></i>',
  'desc'          => __( 'Automatically import WooCommerce data into your CRM.', 'zero-bs-crm' ),
  'url'           => $zbs->urls['woosync'],
  'colour'        => 'rgb(127 85 178)',
  'helpurl'       => 'https://kb.jetpackcrm.com/article-categories/woocommerce-sync/',
  'shortname'     => 'WooSync',
);

global $jpcrm_core_extension_setting_map;
$jpcrm_core_extension_setting_map['woo-sync'] = 'feat_woosync';


// registers WooSync as a core extension, and adds to $zeroBSCRM_extensionsCompleteList global
function jpcrm_register_free_extension_woosync( $exts ) {

  // append our module
  $exts['woo-sync'] = array(
    'name' => 'WooCommerce Sync',
    'i' => 'ext/woocommerce.png',
    'short_desc' => __( 'Automatically import WooCommerce data into your CRM.', 'zero-bs-crm' )
  );

  return $exts;

}
add_filter( 'jpcrm_register_free_extensions', 'jpcrm_register_free_extension_woosync' );


// load the Woo_Sync class if feature is enabled
function jpcrm_load_woo_sync() {

  global $zbs;
  
  // Check whether old WooSync is installed, if so, deactivate in favour of core module
  jpcrm_intercept_old_woosync();

  // load
  if ( zeroBSCRM_isExtensionInstalled( 'woo-sync' ) ) {
    
    require_once( JPCRM_MODULES_PATH . 'woo-sync/includes/class-woo-sync.php' );
    $zbs->modules->load_module( 'woosync', 'Woo_Sync' );

  }

}
add_action( 'jpcrm_load_modules', 'jpcrm_load_woo_sync' );


/* 
* Where WooSync is installed as an extension, deactivate it
*/
function jpcrm_intercept_old_woosync( ){

	// here we check if the old extension exists by its name function
	// ... if this didn't catch all situations, use zeroBSCRM_installedProExt
	if ( function_exists( 'zeroBSCRM_extension_name_woosync' ) ) {

		// deactivate
		if ( jpcrm_extensions_deactivate_by_key( 'woosync' ) ) {

			// Activate the module in its place
			zeroBSCRM_extension_install_woo_sync();
			// remove obsolete cron
			wp_clear_scheduled_hook( 'zerobscrm_woosync_hourly_sync' );
			// check not fired within past day
			$existing_transient = get_transient( 'woosync.conflict.deactivated' );
			if ( !$existing_transient ) {

				// add notice & transient
				zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'woosync.conflict.deactivated', '' );
				set_transient( 'woosync.conflict.deactivated', 'woosync.conflict.deactivated', HOUR_IN_SECONDS * 24 );

			}
		}
	}
}

/**
 *  Add a warning message on the plugin list.
 *
 * @param array  $actions List of actions.
 * @param string $plugin_file Plugin file name.
 * @return array
 */
function jpcrm_warning_message_woosync_ext( $actions, $plugin_file = '', $plugin_data = array() ) {

	$woosync_ext_files = array(
		'ZeroBSCRM_WooCommerce.php',
		'-ext-woo-connect.php',
	);

	$is_woosyc_ext_installed = false;
	foreach ( $woosync_ext_files as $ext_file ) {
		$is_woosyc_ext_installed = ( str_contains( $plugin_file, $ext_file ) );

		if ( $is_woosyc_ext_installed ) {
			break;
		}
	}

	if ( $is_woosyc_ext_installed ) {

		$delete_link = '';

		if ( array_key_exists( 'delete', $actions ) ) {
			$delete_link = $actions['delete'];
		}

		$modified_actions = array(
			'warning' => __( 'As of <b>CRM v5</b> this extension is no longer needed.', 'zero-bs-crm' ) . '<br><span style="color:#000;">' . $delete_link . '</span>',
		);

		##WLREMOVE
		$modified_actions = array(
			'warning' => __( 'As of <b>Jetpack CRM v5</b> this extension is no longer needed.', 'zero-bs-crm' ) . '<br><span style="color:#000;">' . $delete_link . '</span>',
		);
		##/WLREMOVE

		return $modified_actions;
	}

	return $actions;
}
add_filter( 'plugin_action_links', 'jpcrm_warning_message_woosync_ext', 10, 3);



// Install function
function zeroBSCRM_extension_install_woo_sync() {
  
  return jpcrm_install_core_extension( 'woo-sync' );

}

// Uninstall function
function zeroBSCRM_extension_uninstall_woo_sync() {

	// remove cron
	wp_clear_scheduled_hook( 'jpcrm_woosync_sync' );
	return jpcrm_uninstall_core_extension( 'woo-sync' );

}

// Sniffs for WooCommerce, and puts out notification when we have woo but no woosync
function jpcrm_sniff_feature_woosync() {

  global $zbs;
  
  // where we've not got WooSync active..
  if ( !zeroBSCRM_isExtensionInstalled( 'woo-sync' ) ) {

    // check if WooCommerce _is_ active & prompt
    $zbs->feature_sniffer->sniff_for_plugin(
      array(
        'feature_slug'    => 'woocommerce',
        'plugin_slug'     => 'woocommerce/woocommerce.php',
        'more_info_link'  => $zbs->urls['kb-woosync-home'],
        'is_module'       => true,
      )
    );

  }

}
add_action( 'jpcrm_sniff_features', 'jpcrm_sniff_feature_woosync' );

// add jobs to system assistant
function jpcrm_add_woo_jobs_to_system_assistant( $job_list ) {

	global $zbs;

	if ( $zbs->woocommerce_is_active() ) {

		// enable the Woo module if WooCommerce plugin is enabled
		$job_list['enable_woo_module'] = array(

			'title'           => __( 'Enable WooSync', 'zero-bs-crm' ),
			'icon'            => 'dollar sign',
			'desc_incomplete' => __( 'You have the WooCommerce plugin installed, but the CRM module is not yet enabled. In order to sync your WooCommerce data to the CRM, you first need to enable the module.', 'zero-bs-crm' ),
			'desc_complete'   => __( 'The WooSync module is active.', 'zero-bs-crm' ),
			'button_url'      => jpcrm_esc_link( $zbs->slugs['modules'] ),
			'button_txt'      => __( 'Check module state', 'zero-bs-crm' ),
			'state'           => zeroBSCRM_isExtensionInstalled( 'woo-sync' ),

		);

		// Get Woo data if no Woo transactions exist
		if ( zeroBSCRM_isExtensionInstalled( 'woo-sync' ) ) {

			$job_list['get_woo_data'] = array(

				'title'           => __( 'Sync WooCommerce data', 'zero-bs-crm' ),
				'icon'            => 'sync alternate',
				'desc_incomplete' => __( 'No orders have been imported yet. Please verify that the module is properly configured.', 'zero-bs-crm' ),
				'desc_complete'   => __( 'Order data has been imported.', 'zero-bs-crm' ),
				'button_url'      => jpcrm_esc_link( $zbs->modules->woosync->slugs['hub'] ),
				'button_txt'      => __( 'Check sync status', 'zero-bs-crm' ),
				'state'           => $zbs->modules->woosync->get_crm_woo_transaction_count() > 0,

			);

		}

	}

	return $job_list;

}
add_filter( 'jpcrm_system_assistant_jobs', 'jpcrm_add_woo_jobs_to_system_assistant' );

/**
 * Check if HPOS is enabled.
 *
 * The feature was enabled in WooCommerce 7.1.
 *
 * For new stores created on or after 10 October 2023, this is enabled by default.
 * https://woo.com/posts/platform-update-high-performance-order-storage-for-woocommerce/
 *
 * @return bool Defaults to false.
 */
function jpcrm_woosync_is_hpos_enabled() {
	if ( class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) ) {
		return \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
	}
	return false;
}

// If we ever have more WooSync constants we should create a separate php file.
if ( ! defined( 'JPCRM_WOOSYNC_DO_NOT_CREATE' ) ) {
	define(
		'JPCRM_WOOSYNC_DO_NOT_CREATE',
		array(
			'id'    => 'woo_do_not_create',
			'label' => __( 'Do not create', 'zero-bs-crm' ),
		)
	);
}

// Extension legacy definitions
if ( ! defined( 'JPCRM_WOO_SYNC_ROOT_FILE' ) ) {
  define( 'JPCRM_WOO_SYNC_ROOT_FILE', __FILE__ );
  define( 'JPCRM_WOO_SYNC_ROOT_PATH', plugin_dir_path( __FILE__ ) );
  define( 'JPCRM_WOO_SYNC_IMAGE_URL', plugin_dir_url( JPCRM_WOO_SYNC_ROOT_FILE ) . 'i/' );
}
