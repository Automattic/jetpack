<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.2
 *
 * Copyright 2020 Automattic
 *
 * Date: 16/11/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */




/* ======================================================
  Hard Coded Social Types
   ====================================================== */

    global $zbsSocialAccountTypes;

    /* 
            WH added 2.2 - this drives what "social accounts" are shown everywhere for contacts etc.
            
    */

        $zbsSocialAccountTypes = array(


        	'tw' => array(
        					'name'			=> 'Twitter',
        					'slug' 			=> 'twitter',
        					'placeholder' 	=> 'example',
        					'fa'			=> 'fa-twitter',
        					'urlprefix'		=> 'https://twitter.com/'
        				),
        	'li' => array(
        					'name'			=> 'Linked In',
        					'slug' 			=> 'linked-in',
        					'placeholder' 	=> 'example',
        					'fa'			=> 'fa-linkedin',
        					'urlprefix'		=> 'https://www.linkedin.com/in/'
        				),
        	'fb' => array(
        					'name'			=> 'Facebook',
        					'slug' 			=> 'facebook',
        					'placeholder' 	=> 'example',
        					'fa'			=> 'fa-facebook',
        					'urlprefix'		=> 'https://fb.com/'
        				)


        );

/* ======================================================
  / Hard Coded Social Types
   ====================================================== */




/* ======================================================
  Social helper funcs
   ====================================================== */

   // returns an url (E.g. https://twitter.com/woodyhayday) from a social acc obj
   function zeroBSCRM_getSocialLink( $key, $userSocialAccs ){

   		if (isset($key) && isset($userSocialAccs) && is_array($userSocialAccs)){

   			global $zbsSocialAccountTypes;

   			// got acc?
   			if (isset($userSocialAccs[$key]) && !empty($userSocialAccs[$key])){

	   			// get prefix
	   			$URL = $zbsSocialAccountTypes[$key]['urlprefix'];

	   			// finish it off + return
	   			return $URL . $userSocialAccs[$key];

	   		}

   		}

   		return '#';

   }




/* ======================================================
  / Social helper funcs
   ====================================================== */