<?php
/**
 * Handle rewrite rules for Jetpack CRM
 *
 * @package automattic/jetpack-crm
 */

// prevent direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

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
