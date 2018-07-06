<?php
/*
Plugin Name: WP.com Site Helper
Description: WordPress.com provided functionality & tools
*/

if ( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
  require_once( WPMU_PLUGIN_DIR . '/wpcomsh/wpcomsh.php' );
}
