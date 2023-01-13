<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V4.5
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

/*
 * This Parent class allows us to simplify what's needed of each condition into a class below
*/
class zeroBSCRM_segmentCondition {

    public $key = false;
    public $condition = false;
    public $superseded_keys = array();

    // killswitch
    private $addFilters = true;


    /**
     * Jetpack CRM Segment Argument Constructor.
     */
    public function __construct( $constructionArgs = array() ) {

        // in children we play with the order here (preConstructor)
        // so it's separated into an init func
        $this->init( $constructionArgs );

    }

    public function init( $constructionArgs = array() ){

        global $zbs;

        if ( $this->addFilters && $this->key !== false && is_array( $this->condition ) ){

            // __ name, category, description etc.
            if ( isset( $this->condition['name'] ) ) $this->condition['name'] = __( $this->condition['name'], 'zero-bs-crm' );
            if ( isset( $this->condition['category'] ) ) $this->condition['category'] = __( $this->condition['category'], 'zero-bs-crm' );
            if ( isset( $this->condition['description'] ) ) $this->condition['description'] = __( $this->condition['description'], 'zero-bs-crm' );

            // add the condition
            add_filter( 'zbs_segment_conditions', array( $this, 'condition' ) );

            // add the query arg builder
            add_filter( $zbs->DAL->makeSlug( $this->key ) . '_zbsSegmentArgumentBuild', array( $this, 'conditionArg' ), 10, 3 );

            // any conditions that this supersedes get filters added too, to ensure backward compatibility (though these should be migrated too)
            if ( is_array( $this->superseded_keys ) ){

                foreach ( $this->superseded_keys as $key ){

                    // add filter
                    add_filter( $key . '_zbsSegmentArgumentBuild', array( $this, 'condition_arg_superseded' ), 10, 3 );

                }

            }

        }

    }

    public function condition( $conditions = array() ) {

        if ( $this->key !== false && is_array( $this->condition ) ){

            return array_merge( $conditions, array( $this->key => $this->condition ) );

        }

        // else don't add
        return $conditions;
    }

    // note starting arg is ignored (should not have been called multiple times)
    public function conditionArg($startingArg=false,$condition=false,$conditionKeySuffix=false){

        global $zbs,$wpdb,$ZBSCRM_t;

        return $startingArg;
     }

    /*
     * This fires when a superseded condition key has been used
     * It'll migrate the key in the db then return as `conditionArg()`
     */
    public function condition_arg_superseded( $startingArg = false, $condition = false, $conditionKeySuffix = false ){

        global $zbs;

        // migrate to avoid future reoccurances
        $zbs->DAL->segments->migrate_superseded_condition( $condition['type'], $this->key );

        // return conditionArg as if normal
        return $this->conditionArg( $startingArg, $condition, $conditionKeySuffix );

    }

}