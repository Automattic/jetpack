<?php
/*
Plugin Name: WP.com Site Helper
Description: WordPress.com provided functionality & tools pre-installed and activated on all Atomic Sites
*/

if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
  require_once( WPMU_PLUGIN_DIR . '/wpcomsh/wpcomsh.php' );

  // load and init the plan manager
  require_once( WPMU_PLUGIN_DIR . '/wpcomsh/class.atomic-plan-manager.php' );
  add_action( 'muplugins_loaded', array( 'Atomic_Plan_Manager', 'init') );
}
