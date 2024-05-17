<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Segment Condition: Is WooCommerce Customer
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * WooSync: Segment Condition: Is WooCommerce Customer class
 */
class Segment_Condition_Woo_Customer extends zeroBSCRM_segmentCondition {

    public $key = 'is_woo_customer';
    public $condition = array(
        'position' => 1,
        'category' => 'WooSync',
        'operators' => array( 'istrue', 'isfalse' ),
        'fieldname' =>'is_woo_customer'
    );

    /**
     * init, here just used to set translated attributes.
     */
    public function __construct( $constructionArgs = array() ) {

        // set translations
        $this->condition['name']        = __( 'WooCommerce Customer', 'zero-bs-crm' );
        $this->condition['description'] = __( 'Select contacts who are or are not also WooCommerce customers', 'zero-bs-crm' );


        // fire main class init
        $this->init( $constructionArgs );

    }

    public function conditionArg( $startingArg=false, $condition=false, $conditionKeySuffix=false ){
                
        global $zbs, $ZBSCRM_t;
        
            if ( $condition['operator'] == 'istrue' )
                return array('additionalWhereArr'=>        
                            array(
                                'is_woo_customer' . $conditionKeySuffix => array(
                                    'ID','IN',
                                    '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = ".ZBS_TYPE_CONTACT." AND zbss_source = %s)",
                                    array( 'woo' )
                                )
                            )
                        );
        
            if ( $condition['operator'] == 'isfalse' )
                return array('additionalWhereArr'=>        
                            array(
                                'is_woo_customer' . $conditionKeySuffix => array(
                                    'ID','NOT IN',
                                    '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = ".ZBS_TYPE_CONTACT." AND zbss_source = %s)",
                                    array( 'woo' )
                                )
                            )
                        );

        return $startingArg;
    }
}
