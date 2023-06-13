<?php

/**
 * Fired by AJAX on hub page (where still things to import, checks nonce and initiates import_orders)
 */
function jpcrm_woosync_ajax_import_orders( ){

	global $zbs;

	// verify nonce
	check_ajax_referer( 'jpcrm_woosync_hubsync', 'sec' );

	// init
	$return = $zbs->modules->woosync->background_sync->sync_orders();

	// if something's returned, output via AJAX
	// (Mostly `background_sync->sync_orders()` will do this automatically)
	echo json_encode( $return );
	exit();

}

// import orders AJAX
add_action( 'wp_ajax_jpcrm_woosync_fire_sync_job', 'jpcrm_woosync_ajax_import_orders' );