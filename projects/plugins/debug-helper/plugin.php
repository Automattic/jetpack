<?php
/**
 * Plugin Name: Jetpack Debug Tools
 * Description: Give me a Jetpack connection, and I'll break it every way possible.
 * Author: Automattic - Jetpack Crew
 * Version: 1.1.1-alpha
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-debug-helper.
 */

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

namespace Automattic\Jetpack\Debug_Helper;

define( 'JETPACK_DEBUG_HELPER_BASE_PLUGIN_FILE', __FILE__ );

/**
 * The plugin version.
 * Increase that if you do any edits to ensure refreshing the cached assets.
 */
define( 'JETPACK_DEBUG_HELPER_VERSION', '1.1.1-alpha' );

/**
 * Include file names from the modules directory here.
 */
$jetpack_dev_debug_modules = array(
	'broken-token'    => array(
		'file'        => 'class-broken-token.php',
		'name'        => 'Broken token Utilities',
		'description' => '',
	),
	'idc-simulator'   => array(
		'file'        => 'class-idc-simulator.php',
		'name'        => 'Identity Crisis Simulation Utility',
		'description' => '',
	),
	'sync-debug'      => array(
		'file'        => 'class-jetpack-sync-debug-helper.php',
		'name'        => 'Sync Debug Utilities',
		'description' => '',
	),
	'rest-api-tester' => array(
		'file'        => 'class-rest-api-tester.php',
		'name'        => 'REST API Tester',
		'description' => '',
	),
	'mocker'          => array(
		'file'        => 'class-mocker.php',
		'name'        => 'Mocker',
		'description' => '',
	),
);

require_once 'class-admin.php';

foreach ( (array) Admin::get_active_modules() as $module ) {
	if ( isset( $jetpack_dev_debug_modules[ $module ] ) ) {
		include_once plugin_dir_path( __FILE__ ) . 'modules/' . $jetpack_dev_debug_modules[ $module ]['file'];
	}
}
