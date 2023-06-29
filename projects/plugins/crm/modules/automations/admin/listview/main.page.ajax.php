<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation: List view AJAX
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/*
 * Return Automation to AJAX (hooked via `zeroBSCRM_AJAX_listViewRetrieveData()`)
 */
function jpcrm_automations_pro_list_view_ajax_return( $list_view_params = array() ){

	global $zbs;

	// check perms
	if ($list_view_params['listtype'] == 'customer' && !zeroBSCRM_permsViewCustomers()) zeroBSCRM_sendJSONError(array('no-action-or-rights'=>1));

	// prep final return
	$results = array( 'objects' => array(), 'objectcount' => -1, 'paged' => 1 );

	// Build Query
	$page_number = 0;
	$owner_id = -99;
	$possible_search_term = '';
	$args_override = false;
	$in_array = '';

	// Sorting
	$sort_field = 'ID';
	$sort_order = 'DESC';

	// Filters: Search
	if ( isset( $list_view_params['filters'] ) && isset( $list_view_params['filters']['s'] ) && !empty( $list_view_params['filters']['s'] ) ) {
		$possible_search_term = $list_view_params['filters']['s'];
	}

	// Paging:
	if (isset($list_view_params['paged']) && !empty($list_view_params['paged'])) {

		$possible_page = (int)$list_view_params['paged'];
		if ($possible_page > 0){

			$page_number = $possible_page;
		}

	}

	// Sorting:
	if ( isset( $list_view_params['sort'] ) && !empty( $list_view_params['sort'] ) ) {

		$possible_sort_field = $list_view_params['sort'];

			// These need translating for now..
			switch( $possible_sort_field ){

				case 'id':

					$sort_field = 'ID';

					break;

				case 'name':

					$sort_field = 'zbsauto_name';

					break;

				case 'added':

					$sort_field = 'zbsauto_created';

					break;

				default:

					$sort_field = '';

					break;

			}

		if ( !empty( $sort_field ) ){
			
			$sort_order = 'DESC'; 
			if ( isset( $list_view_params['sortorder'] ) && !empty( $list_view_params['sortorder'] ) ){
			
				$sort_order = strtoupper($list_view_params['sortorder']);
			
			}

		}

	}


	// Retrieve data
	/* #TBC Hypathetical, when DAL:
	$results['objects'] = $zbs->DAL->automations->getAutomations( array(
		'owner' => $owner_id, 
		'perPage' => $per_page, 
		'page' => $page_number,
		'searchPhrase' => $possible_search_term,
		'inArray' => $in_array,
		'sortByField' => $sort_field,
		'sortOrder' => $sort_order
	)); */
	$results['objects'] = array();


	//If using pagination, also return total count
	if ( isset( $list_view_params['pagination'] ) && $list_view_params['pagination'] ){
		
		$results['objectcount'] = 0;

	}

	// output results
	header( 'Content-Type: application/json' );
	echo json_encode( $results );
	exit();

}
add_action( 'zerobs_ajax_list_view_automations', 'jpcrm_automations_pro_list_view_ajax_return', 10 );