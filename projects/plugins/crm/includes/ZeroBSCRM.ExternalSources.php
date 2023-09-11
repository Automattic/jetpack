<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.97.4+
 *
 * Copyright 2020 Automattic
 *
 * Date: 11/01/2019
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

   /* 
        
        External sources got a bit muddy in DAL1, This file is designed to centralise + simplify :)

   */


    // Init set of external sources
    /* 
        // Proper way to add to these is (in extension plugin class):
        // key is that filter has priority below 99
        // .. can then be used anywhere POST init:99

        public function register_external_source($external_sources = array()){
            $external_sources['str'] = array('Stripe', 'ico' => 'fa-stripe');
            return $external_sources;
        }

        #} adds this as an external source
        add_filter('zbs_approved_sources' , array($this, 'register_external_source'), 10);

    */
    global  $zbscrmApprovedExternalSources;
            $zbscrmApprovedExternalSources = zeroBS_baseExternalSources();

// 2.97.7 wrapped these in a func so they can be less affected than a global ? :/
// this is called directly now in core to load them, rather than using the global $zbscrmApprovedExternalSources;
// ... global $zbscrmApprovedExternalSources is still set though, for backward compat, (not sure if some older ext using?) 
function zeroBS_baseExternalSources() {
	$external_sources = array(
		'woo'          => array( 'WooCommerce', 'ico' => 'fa-shopping-cart' ), // fa-shopping-cart is default :) no woo yet.
		'pay'          => array( 'PayPal', 'ico' => 'fa-paypal' ),
		'env'          => array( 'Envato', 'ico' => 'fa-envira' ), // fa-envira is a look-alike http://fontawesome.io/icon/envira/.
		'csv'          => array( 'CSV Import', 'ico' => 'fa-file-text' ),
		'form'         => array( 'Form Capture', 'ico' => 'fa-wpforms'),		
		'gra'          => array( 'Gravity Forms', 'ico' => 'fa-wpforms'),
		'api'          => array( 'API', 'ico' => 'fa-random'),
		'wpa'          => array( 'WorldPay', 'ico' => 'fa-credit-card'),
		'str'          => array( 'Stripe', 'ico' => 'fa-credit-card'),
		'wordpress'    => array( 'WordPress', 'ico' => 'fa-wpforms'),
		'cf7'          => array( 'Contact Form 7', 'ico' => 'fa-wpforms'),
		'jetpack_form' => array( 'Jetpack Contact Form', 'ico' => 'fa-wpforms' ),

        // Discontinued
        //'jvz'          => array( 'JV Zoo', 'ico' => 'fa-paypal' ),
	);

	$external_sources = apply_filters( 'jpcrm_register_external_sources', $external_sources );
	return $external_sources;
	// phpcs:enable WordPress.Arrays.ArrayDeclarationSpacing.AssociativeArrayFound
}


/*
* Simple external source info return based on key
*/
function jpcrm_get_external_source_info( $source_key ){

    $external_sources = zeroBS_baseExternalSources();

    if ( isset( $external_sources[ $source_key ] ) ){

        return $external_sources[ $source_key ];
        
    }

    return false;
}

// Returns a simplified 1 line explanation of an external source
function zeroBS_getExternalSourceTitle($srcKey='',$srcUID=''){

    // some old hard typed:

        switch ($srcKey){

            case 'pay': #} paypal

                return '<i class="fa fa-paypal"></i> PayPal:<br /><span>'.$srcUID.'</span>';

                break;

            #case 'woo': #} Woo
            case 'env':

                return '<i class="fa fa-envira"></i> Envato:<br /><span>'.$srcUID.'</span>';

                break;

            case 'form':

                return '<i class="fa fa-wpforms"></i> Form Capture:<br /><span>'.$srcUID.'</span>';

                break;

            case 'csv':

                return '<i class="fa fa-file-text"></i> CSV Import:<br /><span>'.$srcUID.'</span>';

                break;

            case 'gra':

                return '<i class="fa fa-wpforms"></i> Gravity Forms:<br /><span>'.$srcUID.'</span>';

                break;
                
            case 'api':

                return '<i class="fa fa-random"></i> API:<br /><span>'.$srcUID.'</span>';

                break;

            default:

                // see if in $zbs->external_sources
                global $zbs;

                if (isset($zbs->external_sources[$srcKey])){

                    $ico = 'fa-users'; if (is_array($zbs->external_sources[$srcKey]) && isset($zbs->external_sources[$srcKey]['ico'])) $ico = $zbs->external_sources[$srcKey]['ico'];
                    $name = ucwords(str_replace('_',' ',$srcKey)); if (is_array($zbs->external_sources[$srcKey]) && isset($zbs->external_sources[$srcKey][0])) $name = $zbs->external_sources[$srcKey][0];

                    return '<i class="fa '.$ico.'"></i> '.$name.':<br /><span>'.$srcUID.'</span>';

                } else {

                    #} Generic for now
                    return '<i class="fa fa-users"></i> '.ucwords(str_replace('_',' ',$srcKey)).':<br /><span>'.$srcUID.'</span>';

                }

                break;



        }
}


/*
* Renders HTML describing external sources for an object
*  Primarily used in object 'external source' metaboxes
*
* @param int $object_id (crm contact, company, invoice, or transaction)
* @param int $object_type_id
*/
function jpcrm_render_external_sources_by_id( $object_id, $object_type_id ){

    global $zbs;

    // get sources, if any
    $external_sources = $zbs->DAL->getExternalSources( -1, array(
        
        'objectID'          => $object_id, 
        'objectType'        => $object_type_id,
        'grouped_by_source' => true,
        'ignoreowner'       => zeroBSCRM_DAL2_ignoreOwnership(ZBS_TYPE_CONTACT)

        ));

    // render
    jpcrm_render_external_sources_info( $external_sources, $object_id, $object_type_id );

}


/*
* Renders HTML describing external sources for an object
*  Primarily used in object 'external source' metaboxes
*  ... but also used on contact view etc.
*
* @param array $external_sources (requires these in 'grouped' format)
*/
function jpcrm_render_external_sources_info( $external_sources, $object_id, $object_type_id ){

    global $zbs;
    
    // got any to render?
    if ( isset( $external_sources ) && is_array( $external_sources ) && count( $external_sources ) > 0 ){
        
        if ( count( $external_sources ) > 0 ){

            echo '<div id="jpcrm-external-sources-metabox">';

            // first cycle through sources and stack by origin key (e.g. 'woo'), 
            // so we can group if multiple.


            foreach ( $external_sources as $external_source_group_key => $external_source_group ){

                // 'woo' => array( 'WooCommerce', 'ico' => 'fa-shopping-cart' )
                $external_source_group_info = jpcrm_get_external_source_info( $external_source_group_key );

                // got multiple of same source? (e.g. woo customer with multiple orders)
                $multiple_in_group = ( count( $external_source_group ) > 1 );

                // show group header                        
                echo '<div class="jpcrm-external-source-group">';

                    echo '<div class="jpcrm-external-source-group-header ui header">' . ( is_array( $external_source_group_info ) ? '<i class="fa ' . esc_attr( $external_source_group_info['ico'] ) . '"></i>&nbsp;&nbsp;' . $external_source_group_info[0] : $external_source_group_key ) . '</div>';

                    foreach ( $external_source_group as $external_source ){

                        #} Display a "source"
                        echo '<div class="jpcrm-external-source">';

                            $uid = $external_source['uid'];

                            // company + CSV means uid will be a useless hash, so replace that with name if we have
                            if ( $external_source['source'] == 'csv' && $object_type_id == ZBS_TYPE_COMPANY ){
                                $uid = __( 'Imported based on name', 'zero-bs-crm' );
                            }

                            // build basic
                            $external_source_html = zeroBS_getExternalSourceTitle( $external_source['source'], $uid );

                            // filter any given title - can be wired in to give links (e.g. wooc orders)
                            $external_source_html = apply_filters( 'zbs_external_source_infobox_line', $external_source_html, 
                                array(
                                    'objtype'   => $object_type_id,
                                    'objid'     => $object_id,
                                    'source'    => $external_source['source'],
                                    'origin'    => $external_source['origin'],
                                    'unique_id' => $uid
                                )
                            );

                            // output
                            echo $external_source_html;

                        echo '</div>';

                    }
                
                echo '</div>';

            }
                
            echo '</div>';

        }

    } else {

        // manually added
        echo '<p><i class="address book icon"></i> ' . esc_html( sprintf( __( '%s added manually.', 'zero-bs-crm' ), ucwords( $zbs->DAL->objTypeKey( $object_type_id ) ) ) ) . '</p>';

    }

}