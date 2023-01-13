<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0+
 *
 * Copyright 2020 Automattic
 *
 * Date: 05/07/19
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



/**
* ZBS DAL >> Addresses
*
* @author   Woody Hayday <hello@jetpackcrm.com>
* @version  2.0
* @access   public
* @see      https://jetpackcrm.com/kb
*/
class zbsDAL_addresses extends zbsDAL_ObjectLayer {


    protected $objectType = ZBS_TYPE_ADDRESS;
    //protected $objectDBPrefix = 'zbsadd_';
    protected $include_in_templating = true;
    protected $objectModel = array(

        // ID
        'ID' => array('fieldname' => 'ID', 'format' => 'int'),

        // site + team generics
        'zbs_site' => array('fieldname' => 'zbs_site', 'format' => 'int'),
        'zbs_team' => array('fieldname' => 'zbs_team', 'format' => 'int'),
        'zbs_owner' => array('fieldname' => 'zbs_owner', 'format' => 'int'),

        // other fields
        'addr1'             => array(
            // db model:
            'fieldname' => 'zbsa_addr1', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Address Line 1',
            'placeholder'=>''
        ),
        'addr2'             => array(
            // db model:
            'fieldname' => 'zbsa_addr2', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Address Line 2',
            'placeholder'=>''
        ),
        'city'              => array(
            // db model:
            'fieldname' => 'zbsa_city', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'City',
            'placeholder'=> 'e.g. New York'
        ),
        'county'            => array(
            // db model:
            'fieldname' => 'zbsa_county', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'County',
            'placeholder'=> 'e.g. Kings County'
        ),
        'postcode'          => array(
            // db model:
            'fieldname' => 'zbsa_postcode', 'format' => 'str',
            // output model
            'input_type' => 'text',
            'label' => 'Post Code',
            'placeholder'=> 'e.g. 10019'
        ),
        'country'           => array(
            // db model:
            'fieldname' => 'zbsa_country', 'format' => 'str',
            // output model
            'input_type' => 'selectcountry',
            'label' => 'Country',
            'placeholder'=>''
        ),

        'created' => array('fieldname' => 'zbsa_created', 'format' => 'uts'),
        'lastupdated' => array('fieldname' => 'zbsa_lastupdated', 'format' => 'uts'),
        
        );


    function __construct($args=array()) {


        #} =========== LOAD ARGS ==============
        $defaultArgs = array(

            //'tag' => false,

        ); foreach ($defaultArgs as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
        #} =========== / LOAD ARGS =============


    }



    // ===============================================================================
    // ===========   ADDRESS  ========================================================

    /*
            
            Addresses as distinct objects didn't make the v3.0 cut.
            They'd be a valid area for expansion post v3.0.

            This file is here as a precursor, and is used by the 3.0 migration routine
            to stop custom field keys colliding with field names (the obj model above)
            (function zeroBSCRM_AJAX_dbMigration300open())


    */

    // ===========  /   ADDRESS  =====================================================
    // ===============================================================================
    

} // / class
