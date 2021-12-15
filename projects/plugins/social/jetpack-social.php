<?php
/**
 *
 * Plugin Name: Jetpack Social
 * Plugin URI: TBD
 * Description: Abstracting Publicize
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-social
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

// Constant definitions.
define( 'JETPACK_SOCIAL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_SOCIAL_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_SOCIAL_PLUGIN_SLUG', 'jetpack-social' );
define( 'JETPACK_SOCIAL_PLUGIN_NAME', 'Jetpack Social' );
define( 'JETPACK_SOCIAL_PLUGIN_URI', 'https://jetpack.com/jetpack-social' );
define( 'JETPACK_SOCIAL_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

require_once JETPACK_SOCIAL_PLUGIN_DIR . 'vendor/autoload_packages.php';

// Redirect to plugin page when the plugin is activated.
add_action( 'activated_plugin', array( 'Jetpack_Social', 'plugin_activation' ) );

register_deactivation_hook( __FILE__, array( 'Jetpack_Social', 'plugin_deactivation' ) );

require_once __DIR__ . '/src/php/publicize.php';
require_once __DIR__ . '/src/php/endpoints/class.jetpack-core-api-site-endpoints.php';
require_once __DIR__ . '/src/php/endpoints/class-wpcom-rest-api-v2-endpoint-publicize-share-post.php';
require_once __DIR__ . '/src/php/endpoints/publicize-connections.php';
require_once __DIR__ . '/src/php/endpoints/publicize-connection-test-results.php';

new Jetpack_Social();
