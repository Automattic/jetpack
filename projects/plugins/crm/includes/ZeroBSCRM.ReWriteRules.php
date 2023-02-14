<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2+
 *
 * Copyright 2020 Automattic
 *
 * Date: 29/12/2016
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



# http://stackoverflow.com/questions/23698827/custom-permalink-structure-custom-post-type-custom-taxonomy-post-name

/* ======================================================
  Quote Builder -> Expose
   ====================================================== */


        /* FOR HASHING: ADD A QUERY VAR to avoid users brute force finding quote data */

        # http://www.rlmseo.com/blog/passing-get-query-string-parameters-in-wordpress-url/
        /* WH switched out 9/7/18 
        function zeroBSCRM_addQuoteQueryVars($aVars) {
          $aVars[] = "quotehash";
          return $aVars;
        } add_filter('query_vars', 'zeroBSCRM_addQuoteQueryVars');
        */
        
        function zeroBSCRM_addInVoiceID($aVars) {
          $aVars[] = "invoiceid";
          return $aVars;
        } add_filter('query_vars', 'zeroBSCRM_addInVoiceID');



   # for now we ALWAYS add this rule, (should it be only onquotebuilder?)
/**
 * Tell WordPress how to interpret our URL structure
 *
 * @param array $rules Existing rewrite rules
 * @return array
 */

// sets an option which'll next be caught on post init in core
function zeroBSCRM_rewrite_setToFlush(){
          
    update_option('zbs_please_flush', time(), false);

}

// flush rules
function zeroBSCRM_rewrite_flushRules(){

    flush_rewrite_rules();

}

// flush rules if set (ran from core post init)
add_action( 'zerobscrm_post_init', 'zeroBSCRM_rewrite_flushIfSet', 100);
function zeroBSCRM_rewrite_flushIfSet(){

    $f = get_option( 'zbs_please_flush' );
    if ($f !== -1 && $f > 0){ 

      zeroBSCRM_rewrite_flushRules();
      delete_option( 'zbs_please_flush' );

    }

}



/* ======================================================
  / Quote Builder -> Expose
   ====================================================== */