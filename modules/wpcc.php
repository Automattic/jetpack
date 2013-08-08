<?php

/**
 * Module Name: WordPress.com Connect
 * Module Description: Let users login with their WordPress.com Credentials, through <a href="http://developer.wordpress.com/docs/wpcc/">WordPress.com Connect</a>
 * Sort Order: 50
 * First Introduced: 2.4
 * Requires Connection: No
 */

if ( ! class_exists( 'WPCC_Sign_On' ) )
	require_once( dirname( __FILE__ ) . '/wpcc/wpcc-sign-on.php' );
