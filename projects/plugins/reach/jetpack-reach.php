<?php
/**
 *
 * Plugin Name: Jetpack Reach
 * Plugin URI: https://wordpress.org/plugins/reach
 * Description: Share your site’s posts on several social media networks automatically when you publish a new post
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-reach
 *
 * @package automattic/jetpack-reach
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

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JETPACK_REACH_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_REACH_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_REACH_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_REACH_PLUGIN_SLUG', 'jetpack-reach' );
define( 'JETPACK_REACH_PLUGIN_NAME', 'Jetpack reach' );
define( 'JETPACK_REACH_PLUGIN_URI', 'https://jetpack.com/jetpack-reach' );
define( 'JETPACK_REACH_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Main plugin class.
new Jetpack_Reach();
