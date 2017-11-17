<?php

/**
* Jetpack_Google_Analytics_Universal hooks and and enqueues support for analytics.js
* https://developers.google.com/analytics/devguides/collection/analyticsjs/
*
* @author allendav 
*/

/**
* Bail if accessed directly
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jetpack_Google_Analytics_Universal {
	public function __construct() {
		// TODO add_filter( 'jetpack_wga_classic_custom_vars', array( $this, 'jetpack_wga_classic_anonymize_ip' ) );
		// TODO add_filter( 'jetpack_wga_classic_custom_vars', array( $this, 'jetpack_wga_classic_track_purchases' ) );
		// TODO add_action( 'wp_footer', array( $this, 'insert_code' ) );
		// TODO add_action( 'wp_footer', array( $this, 'jetpack_wga_classic_track_add_to_cart' ) );
	}

	public function insert_code() {

	}
}