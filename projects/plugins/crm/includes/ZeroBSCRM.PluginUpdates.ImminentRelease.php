<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

// This file provides ample warning for users who may be updating to v3.0 
// ... should have been introduced way earlier than 2.98+, but better late than never
// notes: https://wisdomplugin.com/add-inline-plugin-update-message/

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



/* ======================================================
  ~v4 -> v5 (Jetpack CRM)
   ====================================================== */

// this makes it only fire when loading plugins.php :)
add_action( 'pre_current_active_plugins', 'jpcrm_update_checks_v5_check' );

// Checks to see if we're upgrading from <5.0 to 5.0 + warns
function jpcrm_update_checks_v5_check() {

	// only for users who can ;)
	if ( current_user_can( 'activate_plugins' ) ) {

		global $zbs;

		$update_data = zeroBSCRM_updates_pluginHasUpdate( 'Zero BS CRM', 'zero-bs-crm' );

		if ( is_object( $update_data ) && isset( $update_data->update ) && is_object( $update_data->update ) && isset( $update_data->update->new_version ) ) {

			// has update available
			// is it v5, and current is pre v5?
			if (
				version_compare( $update_data->update->new_version, '5.0' ) > -1
				&& // current is pre 5.0:
				version_compare( $zbs->version, '5.0' ) < 0 ) {

				// show on plugin updates
				add_action( 'in_plugin_update_message-' . ZBS_ROOTPLUGIN, 'jpcrm_update_checks_v5_available_notice', 10, 2 );

			}

		} // has update

	} // users who can

}

// Plugin updates page inline msg:
function jpcrm_update_checks_v5_available_notice( $data, $response ) {

	global $zbs;

	$upgrade_title = __( 'CRM v5.0', 'zero-bs-crm' );
	$button_html = '';

	##WLREMOVE
	$upgrade_title = __( 'Jetpack CRM v5.0', 'zero-bs-crm' );
	##/WLREMOVE

	// see #734-gh

	// do we have a pre DAL3 install?
	if ( !$zbs->isDAL3() ) {

		// upgrade warning - will not be able to use with pre DAL3 db state
		$secondary_message = __( 'Please do not update to this major version until you have migrated your database!', 'zero-bs-crm' );
		##WLREMOVE
		$button_html = '<a href="' . $zbs->urls['v5announce'] . '" target="_blank">' . __( 'v5 Announcement', 'zero-bs-crm' ) . '</a>';
		$button_html .= '&nbsp;|&nbsp;<a href="' . $zbs->urls['db3migrate'] . '" target="_blank">' . __( 'Read about migrating your database', 'zero-bs-crm' ) . '</a>';
		##/WLREMOVE

	} else {

		// simpler upgrade notice
		$secondary_message = __( 'This major release brings WooCommerce syncing directly into CRM core!', 'zero-bs-crm' );
		##WLREMOVE
		$button_html = '<a href="' . $zbs->urls['v5announce'] . '" target="_blank">' . __( 'Read about version 5.0', 'zero-bs-crm' ) . '</a>';
		##/WLREMOVE
	}

	// build inline message
	$msg = '</p><div style="background-color:#D0E6B8;padding:0.5em 1em;margin: 1em"><strong>' . $upgrade_title . '</strong> - ' . $secondary_message . '<br>';
	$msg .= ' ' . $button_html . '</div>';
	echo wp_kses_post( $msg ) . '<p class="upgrade-notice-dummy" style="display:none !important;">';


	// .upgrade-notice-dummy is a workaround for seemingly a wp bug (adapted from Woo:in_plugin_update_message())
	// just put inline ^^ .upgrade-notice-dummy { display:none !important; }

}
