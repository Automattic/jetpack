<?php
/**
 *
 * Plugin Name: WordPress.com Features
 * Description: Enhances your site with features powered by WordPress.com
 * Version: 0.2.0-alpha
 * Author: Automattic
 * License: GPLv2 or later
 * Text Domain: jetpack-mu-wpcom
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Jetpack\Mu_Wpcom;

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

define( 'JETPACK_MU_WPCOM__PLUGIN_VERSION', '0.2.0-alpha' );
define( 'JETPACK_MU_WPCOM__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// Shared code for src/features
require_once __DIR__ . '/src/common/index.php';

/**
 * Load the Coming Soon feature.
 */
function load_coming_soon() {
	if (
		( defined( 'WPCOM_PUBLIC_COMING_SOON' ) && WPCOM_PUBLIC_COMING_SOON ) ||
		apply_filters( 'a8c_enable_public_coming_soon', false )
	) {
		require_once __DIR__ . '/src/features/coming-soon/coming-soon.php';
	}
}
// Todo: once coming-soon is removed from ETK, we can remove this check.
if ( has_action( 'plugins_loaded', 'A8C\FSE\load_coming_soon' ) === false ) {
	add_action( 'plugins_loaded', __NAMESPACE__ . '\load_coming_soon' );
}
