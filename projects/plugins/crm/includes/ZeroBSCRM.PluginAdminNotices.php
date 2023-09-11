<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Date: 31 March 2021
 */

/*
* This function blocks display of admin_notices on pages specified in `$zbs->hide_admin_pages`
*/
function jpcrm_autohide_admin_notices_for_specific_pages(){

    global $zbs;

    if ( isset( $zbs->hide_admin_pages ) && is_array( $zbs->hide_admin_pages ) ){

        if ( !empty( $zbs->zbsvar('page') ) && in_array( $zbs->zbsvar('page'), $zbs->hide_admin_pages ) ){

            remove_all_actions( 'admin_notices' );

        }

    }
}



// admin notices
// show/hide admin notice :)
//add_action( 'admin_notices', 'jpcrm_woo_promo_admin_notice' );
function jpcrm_woo_promo_admin_notice(){

    global $zbs;
    $bundle = false; if ($zbs->hasFreelancerBundleMin()) $bundle = true;

    //default true if not set
    $display_status = get_option( 'jpcrm_hide_woo_promo', 'show' );

    /* Check transient, if available display notice */
    if ( current_user_can( 'activate_plugins' )){
        
        if(is_plugin_active( 'woocommerce/woocommerce.php' ) && zeroBSCRM_isAdminPage() && !zeroBSCRM_isExtensionInstalled('woosync') && !$bundle && $display_status != "hide"){
            jpcrm_woo_promo_admin_notice_banner();
        }
        
    }else{

    }

}



/**
 * WooCommerce promo if running one
 */
function jpcrm_woo_promo_admin_notice_banner(){

}

/**
 * Usage Tracking
 */

add_action( 'admin_notices', 'jpcrm_usage_tracking_notice' );
function jpcrm_usage_tracking_notice(){

    global $zbs;

    //default true if not set
    $display_status = get_option( 'jpcrm_hide_track_notice', 'show' );
    /* Check transient, if available display notice to admins */
    if ( current_user_can( 'activate_plugins' )){
        
        if(zeroBSCRM_isAdminPage() && $display_status != "hide"){
            jpcrm_usage_tracking_notice_banner();
        }
        
    }else{

    }

}


function jpcrm_usage_tracking_notice_banner(){

	global $zbs;

	// don't show if wizard was completed
	if ( get_option( 'jpcrm_wizard_completed' ) ) {
		return;
	}

	?>
		<div id="track-notice" class="ui segment jpcrm-promo notice is-dismissible">
			<div class="content">
				<b><?= esc_html__('Help make Jetpack CRM better for you through usage tracking.', 'zero-bs-crm' ) ?></b>
				<br><?= esc_html__('We have changed what data we track to help make your CRM better.', 'zero-bs-crm') ?>
			</div>
			<div class="button-group">
				<a href="<?php echo esc_url(admin_url("admin.php?page=" . $zbs->slugs['settings'])); ?>#wpzbscrm_shareessentials" class="button ui green"><?php esc_html_e("Change setting","zero-bs-crm");?></a>
				<a href="<?php echo esc_url( $zbs->urls['usagetrackinginfo'] ); ?>" target="_blank" class="button ui inverse"><?php esc_html_e("Learn more","zero-bs-crm");?></a>
			</div>
		</div>

	<?php

}

