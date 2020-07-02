<?php
/**
 * Plugin Name: Jetpack Debug Tools
 * Description: Give me a Jetpack connection, and I'll break it every way possible.
 * Author: Automattic - Jetpack Crew
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package Jetpack.
 */

namespace Automattic\Jetpack\Debug_Helper;

define( 'JETPACK_DEBUG_HELPER_BASE_PLUGIN_FILE', __FILE__ );

/**
 * Include file names from the modules directory here.
 */
$jetpack_dev_debug_modules = array(
	'broken-token' => array(
		'file'        => 'class-broken-token.php',
		'name'        => 'Broken token Utilities',
		'description' => '',
	),
	'sync-debug'   => array(
		'file'        => 'class-jetpack-sync-debug-helper.php',
		'name'        => 'Sync Debug Utilities',
		'description' => '',
	),
);

require_once 'class-admin.php';

foreach ( (array) Admin::get_active_modules() as $module ) {
	if ( isset( $jetpack_dev_debug_modules[ $module ] ) ) {
		include_once plugin_dir_path( __FILE__ ) . 'modules/' . $jetpack_dev_debug_modules[ $module ]['file'];
	}
}
