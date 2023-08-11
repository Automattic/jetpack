<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Segment Condition: Order Count
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * WooSync: Segment Condition: Order Count class
 */
class Segment_Condition_Woo_Order_Count extends zeroBSCRM_segmentCondition {

    public $key = 'woo_order_count';
    public $condition = array(
        'category' => 'WooSync',
        'position' => 2,
        'operators' => array( 'equal', 'notequal', 'larger', 'less', 'intrange', 'largerequal', 'lessequal' ),
        'fieldname' => 'woo_order_count',
        'inputmask' => 'int'
    );

    /**
     * init, here just used to set translated attributes.
     */
    public function __construct( $constructionArgs = array() ) {

        // set translations
        $this->condition['name']        = __( 'WooCommerce Order Count', 'zero-bs-crm' );
        $this->condition['description'] = __( 'Select contacts who match WooCommerce customers with specific order counts', 'zero-bs-crm' );


        // fire main class init
        $this->init( $constructionArgs );

    }

    
    public function conditionArg( $startingArg=false, $condition=false, $conditionKeySuffix=false ){
                
        global $zbs, $ZBSCRM_t;

            // here we just count objlinks, which has the vulnerability that if there are orphan links created it'll show wrong count, but for now is 'enough'
            // Note this also ignores ownership :O
            $order_count_query = "SELECT COUNT(DISTINCT(obj_links.zbsol_objid_from)) FROM " . $ZBSCRM_t['objlinks'] . " obj_links"
            . " INNER JOIN " . $ZBSCRM_t['externalsources'] . " ext_sources"
            . " ON obj_links.zbsol_objid_from = ext_sources.zbss_objid"
            . " WHERE obj_links.zbsol_objtype_from = " . ZBS_TYPE_TRANSACTION
            . " AND obj_links.zbsol_objtype_to = " . ZBS_TYPE_CONTACT
            . " AND obj_links.zbsol_objid_to = contact.ID"
            . " AND ext_sources.zbss_objtype = " . ZBS_TYPE_TRANSACTION;
        
            /* example:
                SELECT * FROM 
                wp_zbs_object_links obj_links
                INNER JOIN wp_zbs_externalsources ext_sources
                ON obj_links.zbsol_objid_from = ext_sources.zbss_objid
                WHERE obj_links.zbsol_objtype_from = 5 
                AND obj_links.zbsol_objtype_to = 1 
                AND obj_links.zbsol_objid_to = {CONTACTID}
                AND ext_sources.zbss_objtype = 5
            */

            if ( $condition['operator'] == 'equal' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_equal' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '=',
                                    '%d',
                                    $condition['value']
                                )
                            )
                        );
            else if ( $condition['operator'] == 'notequal' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_notequal' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '<>',
                                    '%d',
                                    $condition['value']
                                )
                            )
                        );
            else if ( $condition['operator'] == 'larger' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_larger' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '>',
                                    '%d',
                                    $condition['value']
                                )
                            )
                        );
            else if ( $condition['operator'] == 'largerequal' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_larger_equal' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '>=',
                                    '%d',
                                    $condition['value']
                                )
                            )
                        );
            else if ( $condition['operator'] == 'less' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_smaller' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '<',
                                    '%d',
                                    $condition['value']
                                )
                            )
                        );
            else if ( $condition['operator'] == 'lessequal' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_smaller_equal' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '<=',
                                    '%d',
                                    $condition['value']
                                )
                            )
                        );
            else if ( $condition['operator'] == 'intrange' )
                return array('additionalWhereArr'=>
                            array(
                                'woo_order_count_larger' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '>=',
                                    '%d',
                                    $condition['value']
                                ),
                                'woo_order_count_smaller' . $conditionKeySuffix => array(
                                    "(" . $order_count_query . ")",
                                    '<=',
                                    '%d',
                                    $condition['value2']
                                )
                            )
                        );

        return $startingArg;
    }

}