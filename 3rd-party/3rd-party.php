<?php

/*
 * Placeholder to load 3rd party plugin tweaks until a legit system
 * is architected
 */

require_once( JETPACK__PLUGIN_DIR . '3rd-party/buddypress.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/wpml.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/bitly.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/bbpress.php' );
require_once( JETPACK__PLUGIN_DIR . '3rd-party/woocommerce.php' );

if ( class_exists( 'WP_Polldaddy' ) ) {
	global $polldaddy_object;
	if ( is_object( $polldaddy_object ) && isset( $polldaddy_object->version ) && version_compare('2.0.32', $polldaddy_object->version , '>' ) ) {
		require_once( JETPACK__PLUGIN_DIR . '3rd-party/polldaddy.php' );
	}
}
