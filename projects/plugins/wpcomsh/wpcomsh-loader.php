<?php
/**
 * Plugin Name: WP.com Site Helper
 * Description: WordPress.com provided functionality & tools pre-installed and activated on all Atomic Sites
 *
 * @package wpcomsh
 */

if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
	require_once WPMU_PLUGIN_DIR . '/wpcomsh/wpcomsh.php';
}
