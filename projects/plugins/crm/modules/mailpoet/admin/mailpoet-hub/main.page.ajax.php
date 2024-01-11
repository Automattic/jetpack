<?php

/**
 * Fired by AJAX on hub page (where still contacts to import, checks nonce and initiates sync)
 */
function jpcrm_mailpoet_ajax_import_subscribers( ){

	global $zbs;

	// verify nonce
	check_ajax_referer( 'jpcrm_mailpoet_hubsync', 'sec' );

	// init
	$return = $zbs->modules->mailpoet->background_sync->sync_subscribers();

	// if something's returned, output via AJAX
	// (Mostly `background_sync->sync_subscribers()` will do this automatically)
	echo json_encode( $return );
	exit();

}

// import subscribers AJAX
add_action( 'wp_ajax_jpcrm_mailpoet_fire_sync_job', 'jpcrm_mailpoet_ajax_import_subscribers' );
