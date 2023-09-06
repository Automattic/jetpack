<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2+
 *
 * Copyright 2020 Automattic
 *
 * Date: 29/12/2016
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

/**
 * Flush rewrite rules if flagged to do so
 */
function jpcrm_do_flush_rewrite() {
	$flush_rewrite_option = get_option( 'jpcrm_flush_rewrite_flag', 0 );
	// no need for flush/rewrite
	if ( $flush_rewrite_option <= 0 ) {
		return;
	}
	flush_rewrite_rules();
	delete_option( 'jpcrm_flush_rewrite_flag' );
}
add_action( 'init', 'jpcrm_do_flush_rewrite' );

/**
 * Add flag to flush rewrite rules
 */
function jpcrm_flag_for_flush_rewrite() {
	update_option( 'jpcrm_flush_rewrite_flag', time(), false );
}

/**
 * Tell WordPress how to interpret our URL structure
 *
 * @param array $rules Existing rewrite rules
 * @return array
 */

// sets an option which'll next be caught on post init in core
function zeroBSCRM_rewrite_setToFlush(){
          
    update_option('zbs_please_flush', time(), false);

}

// flush rules
function zeroBSCRM_rewrite_flushRules(){

    flush_rewrite_rules();

}

// flush rules if set (ran from core post init)
add_action( 'zerobscrm_post_init', 'zeroBSCRM_rewrite_flushIfSet', 100);
function zeroBSCRM_rewrite_flushIfSet(){

    $f = get_option( 'zbs_please_flush' );
    if ($f !== -1 && $f > 0){ 

      zeroBSCRM_rewrite_flushRules();
      delete_option( 'zbs_please_flush' );

    }

}
