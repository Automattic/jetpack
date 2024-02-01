<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Core Segment Conditions
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;


/*
*   Returns the default segment conditions
*/
function jpcrm_segments_default_conditions() {

    return array(

            'status' => array(
            	'name' => __( 'Status', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'position' => 1,
            	'description' => __( 'Select contacts based on their status', 'zero-bs-crm' ),
            	'operators' => array( 'equal', 'notequal'), 
            	'fieldname' => 'status'
            ),
            'fullname' => array(
            	'name' => __( 'Full Name', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'position' => 1,
            	'description' => __( 'Select contacts based on their full name ', 'zero-bs-crm' ),
            	'operators' => array( 'equal', 'notequal', 'contains' ), 'fieldname' => 'fullname'
            ),
            'email' => array(
            	'name' => __( 'Email', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'position' => 1,
            	'description' => __( 'Select contacts based on their email address', 'zero-bs-crm' ),
            	'operators' => array( 'equal', 'notequal', 'contains' ),
            	'fieldname' => 'email'
            ),
            'dateadded' => array(
            	'name' => __( 'Date Added', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'description' => __( 'Select contacts by when they were added to the CRM', 'zero-bs-crm' ),
            	'operators' => array( 'before', 'after', 'daterange', 'datetimerange', 'beforeequal', 'afterequal', 'previousdays' ),
            	'fieldname' => 'dateadded',
            	'conversion' => 'date-to-uts'
            ),
            'datelastcontacted' => array(
            	'name' => __( 'Date Last Contacted', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'description' => __( 'Select contacts by the date that they were last contacted', 'zero-bs-crm' ),
            	'operators' => array( 'before', 'after', 'daterange', 'datetimerange', 'beforeequal', 'afterequal', 'previousdays' ),
            	'fieldname' => 'datelastcontacted',
            	'conversion' => 'date-to-uts'
            ),
            'tagged' => array(
            	'name' => __( 'Has Tag', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'description' => __( 'Select Contacts who have a specific tag', 'zero-bs-crm' ),
            	'operators' => array( 'tag' ),
            	'fieldname' => 'tagged'
            ),
            'nottagged' => array(
            	'name' => __( 'Is Not Tagged', 'zero-bs-crm' ),
            	'category' => __( 'Contact Fields', 'zero-bs-crm' ),
            	'description' => __( 'Select contacts who do not have a specific tag', 'zero-bs-crm' ),
            	'operators' => array( 'tag' ),
            	'fieldname' => 'nottagged'
            ),

        );
}


/*
*   Returns segment condition category positions (to effect the display order)
*/
function jpcrm_segments_condition_category_positions() {

    global $zbs;

    return apply_filters( 'jpcrm_segment_condition_category_positions', array(

        $zbs->DAL->makeSlug( __( 'Contact Fields', 'zero-bs-crm' ) ) => 1,
        $zbs->DAL->makeSlug( __( 'Contact Address Fields', 'zero-bs-crm' ) ) => 2,
        $zbs->DAL->makeSlug( __( 'Quotes', 'zero-bs-crm' ) ) => 3,
        $zbs->DAL->makeSlug( __( 'Invoices', 'zero-bs-crm' ) ) => 4,
        $zbs->DAL->makeSlug( __( 'Transactions', 'zero-bs-crm' ) ) => 5,
        $zbs->DAL->makeSlug( __( 'Source', 'zero-bs-crm' ) ) => 6,
        $zbs->DAL->makeSlug( __( 'Ownership', 'zero-bs-crm' ) ) => 7,

        'general' => 99 // end of list

    ));

}

    
/*
*   Retrieves available segment conditions
*/
function zeroBSCRM_segments_availableConditions( $split_by_category = false ){

    global $zbs;

    // retrieve conditions
    $available_conditions = apply_filters('zbs_segment_conditions', jpcrm_segments_default_conditions() ); 
    
    // compare with previous available conditions
    // (fires jpcrm_segment_conditions_changed action if changes in available conditions)
    // Note that we only fire this if it's not already been fired on this load (to avoid looping)
    if ( !defined( 'jpcrm_segments_compared' ) ) {

        // blocker. This is a prime candidate for core states (#XXX)
        define( 'jpcrm_segments_compared', 1 );

        // compare
        jpcrm_segments_compare_available_conditions_to_prev( $available_conditions );

    }

    // if not split by category, return as it was
    if ( !$split_by_category ){

        return $available_conditions;

    }

    // else, split by category, so build that and return:
	$category_positions = jpcrm_segments_condition_category_positions();
	$conditions_by_category = array(
		'general' => array(
			'name'        => __( 'General', 'zero-bs-crm' ),
			'conditions'  => array(),
			'position'    => 99
		)
	);

	foreach ( $available_conditions as $key => $condition ){

		if ( isset( $condition['category'] ) ){

			$category = $zbs->DAL->makeSlug( $condition['category'] );
			$category_position = 99;

			// to enact category positions, we see if the category has a position, if so we use that as a prefix
			if ( isset( $category_positions[ $category ] ) ){
			
				$category_position = $category_positions[ $category ];

			}

			// if not set, create it
			if ( !isset( $conditions_by_category[ $category ] ) ){

				$conditions_by_category[ $category ] = array(
					'key'        => $category,
					'name'       => $condition['category'],
					'conditions' => array(),
					'position'   => $category_position
				);

			}

		} else $category = 'general';

		// add condition
		$conditions_by_category[ $category ]['conditions'][ $key ] = $condition;

	}

	// sort categories
	usort( $conditions_by_category, 'jpcrm_segments_sort_conditions_and_categories');

	// in turn sort each conditions sub-list by position
	$conditions_by_category_array = array();

	foreach ( $conditions_by_category as $category_key => $category ){

		$conditions = $category['conditions'];

		usort( $conditions, 'jpcrm_segments_sort_conditions_and_categories');

		$conditions_by_category_array[ $category_key ] = $category;
		$conditions_by_category_array[ $category_key ]['conditions'] = $conditions;

	}
	

	ksort( $conditions_by_category_array );

	return $conditions_by_category_array;

         
}

/* 
 * Sorting function for categories and conditions
 */
function jpcrm_segments_sort_conditions_and_categories($a, $b){

	$position_a = 99;
	$position_b = 99;
	if ( isset( $a['position'] ) ){ 
		$position_a = $a['position'];
	}
	if ( isset( $b['position'] ) ){ 
		$position_b = $b['position'];
	}

    return $position_a < $position_b ? -1 : ($position_a == $position_b ? 0 : 1);

}


function zeroBSCRM_segments_availableConditionOperators(){

	return array(

		'equal'          => array( 'name' => __( 'Equals (=)', 'zero-bs-crm' ) ),
		'notequal'       => array( 'name' => __( 'Not equals (!=)', 'zero-bs-crm' ) ),
		'contains'       => array( 'name' => __( 'Contains (*)', 'zero-bs-crm' ) ),
		'doesnotcontain' => array( 'name' => __( 'Does not contain (*)', 'zero-bs-crm' ) ),
		'larger'         => array( 'name' => __( 'Greater than (>)', 'zero-bs-crm' ) ),
		'less'           => array( 'name' => __( 'Less than (<)', 'zero-bs-crm' ) ),
		'before'         => array( 'name' => __( 'Before datetime', 'zero-bs-crm' ) ),
		'after'          => array( 'name' => __( 'After datetime', 'zero-bs-crm' ) ),
		'beforeequal'    => array( 'name' => __( 'On or before date', 'zero-bs-crm' ) ),
		'afterequal'     => array( 'name' => __( 'On or after date', 'zero-bs-crm' ) ),
		'nextdays'       => array( 'name' => __( 'In the next X days', 'zero-bs-crm' ) ),
		'previousdays'   => array( 'name' => __( 'In the previous X days', 'zero-bs-crm' ) ),
		'daterange'      => array( 'name' => __( 'In date range', 'zero-bs-crm' ) ),
		'datetimerange'  => array( 'name' => __( 'In datetime range', 'zero-bs-crm' ) ),
		'floatrange'     => array( 'name' => __( 'In range', 'zero-bs-crm' ) ),
		'intrange'       => array( 'name' => __( 'In range', 'zero-bs-crm' ) ),
		'istrue'         => array( 'name' => __( 'Is True', 'zero-bs-crm' ) ),
		'isfalse'        => array( 'name' => __( 'Is False', 'zero-bs-crm' ) ),
		'largerequal'    => array( 'name' => __( 'Greater than or equal to (>=)', 'zero-bs-crm' ) ),
		'lessequal'      => array( 'name' => __( 'Less than or equal to (<=)', 'zero-bs-crm' ) ),

	);

}


/*
* Compares available segment conditions to previously logged available conditions
* Fires `jpcrm_segment_conditions_changed` action if change observed.
* 
* @param array $available_conditions - segment conditions available
*/
function jpcrm_segments_compare_available_conditions_to_prev( $available_conditions = false ){

    global $zbs;


    // if not passed, retrieve
    if ( !$available_conditions ){
       
        // retrieve conditions
        $available_conditions = apply_filters('zbs_segment_conditions', jpcrm_segments_default_conditions() ); 

    }

    // retrieve previous hash
    $previous_conditions_hash = $zbs->settings->get( 'segment-condition-hash' );

    // generate new
    $available_conditions_hash = jpcrm_generate_hash_of_obj( $available_conditions );
    
    // if different, conditions available have changed, so regenerate segment audiences
    if ( $available_conditions_hash  != $previous_conditions_hash ){

        // fire action which can be hooked into to check segments for errors
        // e.g. if using advanced segments or custom code to add custom conditions
        // ... then that code is removed/deactivated, therefor you lose access to conditions
        do_action( 'jpcrm_segment_conditions_changed' );

        // save hash
        $zbs->settings->update( 'segment-condition-hash', $available_conditions_hash );

    }


}


/*
* Segment conditions available have changed, let's rebuild segment counts
* (which inadvertantly checks for segments where conditions are no longer present)
*
* Fired on `jpcrm_segment_conditions_changed`.
*/
function jpcrm_segments_conditions_have_changed(){

    global $zbs;

    // recompile all segments
    $zbs->DAL->segments->compile_all_segments();

}
add_action('jpcrm_segment_conditions_changed', 'jpcrm_segments_conditions_have_changed');
