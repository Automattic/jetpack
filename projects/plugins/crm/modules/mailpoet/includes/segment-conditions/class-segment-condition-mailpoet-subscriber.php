<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Segment Condition: Is MailPoet Subscriber
 *
 */

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * MailPoet Sync: Segment Condition: Is MailPoet Subscriber class
 */
class Segment_Condition_Mailpoet_Subscriber extends zeroBSCRM_segmentCondition {

    public $key = 'imported_mailpoet_subscriber';
    public $condition = array(
        'category' => 'MailPoet',
        'priority' => 1,
        'operators' => array( 'istrue', 'isfalse' ),
        'fieldname' =>'imported_mailpoet_subscriber'
    );


    /**
     * init, here just used to set translated attributes.
     */
    public function __construct( $constructionArgs = array() ) {

        // set translations
        $this->condition['name']        = __( 'Imported from MailPoet', 'zero-bs-crm' );
        $this->condition['description'] = __( 'Select contacts which were imported from MailPoet via MailPoet Sync', 'zero-bs-crm' );


        // fire main class init
        $this->init( $constructionArgs );

    }


    public function conditionArg( $startingArg=false, $condition=false, $conditionKeySuffix=false ){
                
        global $zbs, $ZBSCRM_t;
        
            if ( $condition['operator'] == 'istrue' )
                return array('additionalWhereArr'=>        
                            array(
                                'is_mailpoet_subscriber' . $conditionKeySuffix => array(
                                    'ID','IN',
                                    '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = ".ZBS_TYPE_CONTACT." AND zbss_source = %s)",
                                    array( 'mailpoet' )
                                )
                            )
                        );
        
            if ( $condition['operator'] == 'isfalse' )
                return array('additionalWhereArr'=>        
                            array(
                                'is_mailpoet_subscriber' . $conditionKeySuffix => array(
                                    'ID','NOT IN',
                                    '(SELECT DISTINCT zbss_objid FROM ' . $ZBSCRM_t['externalsources'] . " WHERE zbss_objtype = ".ZBS_TYPE_CONTACT." AND zbss_source = %s)",
                                    array( 'mailpoet' )
                                )
                            )
                        );

        return $startingArg;
    }
    
}