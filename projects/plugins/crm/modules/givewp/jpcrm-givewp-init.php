<?php
if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

/**
 * This file registers the GiveWP module with core; it's pretty convoluted,
 * but that's due to a legacy init setup. The goal here is to have all
 * needed code self-contained in the module's folder.
 * 
 * If the module is enabled, it is loaded with the jpcrm_load_modules hook
 */

global $zbs;
$zbs->urls['kb_givewp'] = 'https://kb.jetpackcrm.com/knowledge-base/givewp-connector-for-jetpack-crm/';

// adds a feature that we can sniff for
function jpcrm_sniff_feature_givewp() {
	global $zbs;
	$zbs->feature_sniffer->sniff_for_plugin(
		array(
			'feature_slug'   => 'givewp',
			'plugin_slug'    => 'give/give.php',
			'more_info_link' => $zbs->urls['kb_givewp'],
			'is_module'      => true,
		)
	);
}
add_action( 'jpcrm_sniff_features', 'jpcrm_sniff_feature_givewp' );

// registers a GiveWP as a core extension
function jpcrm_register_free_extension_givewp( $exts ) {
	$exts['givewp'] = array(
		'name'       => __( 'GiveWP Connector', 'zero-bs-crm' ),
		'i'          => 'givewp.png',
		'short_desc' => __( 'Capture donations into your CRM.', 'zero-bs-crm' ),
	);
	return $exts;
}
add_filter( 'jpcrm_register_free_extensions', 'jpcrm_register_free_extension_givewp' );

// registers a GiveWP as an external source
function jpcrm_register_external_sources_givewp( $external_sources ) {
	$external_sources['givewp'] = array(
		'GiveWP',
		'ico' => 'fa-wpforms',
	);
	return $external_sources;
}
add_filter( 'jpcrm_register_external_sources', 'jpcrm_register_external_sources_givewp' );


global $zeroBSCRM_extensionsCompleteList;
$zeroBSCRM_extensionsCompleteList['givewp'] = array(
	'fallbackname' => __( 'GiveWP Connector', 'zero-bs-crm' ),
	'imgstr'       => '<i class="fa fa-keyboard-o" aria-hidden="true"></i>',
	'desc'         => __( 'Capture donations in your CRM', 'zero-bs-crm' ),
	// 'url' => 'https://jetpackcrm.com/feature/',
	'colour'       => 'rgb(126, 88, 232)',
	'helpurl'      => 'https://kb.jetpackcrm.com/knowledge-base/givewp/',
	'shortname'    => __( 'GiveWP Connector', 'zero-bs-crm' ), // used where long name won't fit

);

global $jpcrm_core_extension_setting_map;
$jpcrm_core_extension_setting_map['givewp'] = 'feat_givewp';

// adds install/uninstall functions
function zeroBSCRM_extension_install_givewp() {
	$is_installed = jpcrm_install_core_extension( 'givewp' );
	if ( $is_installed ) {

		global $zbs;

		// add donor contact status if it doesn't exist
		$status_to_add = __( 'Donor', 'zero-bs-crm' );

		$customised_fields_settings = $zbs->settings->get( 'customisedfields' );
		$contact_statuses = explode( ',', $customised_fields_settings['customers']['status'][1] );
		if ( !in_array( $status_to_add, $contact_statuses ) ) {
			$contact_statuses[] = $status_to_add;
		}
		$customised_fields_settings['customers']['status'][1] = implode( ',', $contact_statuses );
		$zbs->settings->update( 'customisedfields', $customised_fields_settings );

	}

	return $is_installed;
}
function zeroBSCRM_extension_uninstall_givewp() {
	return jpcrm_uninstall_core_extension( 'givewp' );
}

// load the JPCRM_GiveWP class if feature is enabled
function jpcrm_load_givewp() {
	global $zbs;
	if ( zeroBSCRM_isExtensionInstalled( 'givewp' ) ) {
		require_once( JPCRM_MODULES_PATH . 'givewp/class-jpcrm-givewp.php' );
		// $zbs->givewp = new JPCRM_GiveWP;
		$zbs->modules->load_module( 'givewp', 'JPCRM_GiveWP' );
	}
}
add_action( 'jpcrm_load_modules', 'jpcrm_load_givewp' );
