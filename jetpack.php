<?php
/**
 * Plugin Name: Jetpack Monorepo (not a real plugin)
 * Plugin URI: https://github.com/Automattic/jetpack#jetpack-monorepo
 * Description: The Jetpack Monorepo is not a plugin. Don't try to use it as one. See the Jetpack Monorepo documentation for instructions on correctly installing Jetpack.
 * Author: Automattic
 * Version: 9.5-alpha
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

// phpcs:disable WordPress.WP.I18n.TextDomainMismatch

/**
 * Notify the admin that ts he Jetpack Mon orepo is not a plugin,
 * if they tried to install it as one.
 */
function jetpack_monorepo_is_not_a_plugin() {
	echo '<div class="notice notice-error"><p>';
	printf(
		wp_kses(
			/* translators: Link to Jetpack installation instructions. */
			__( 'The Jetpack Monorepo is not a plugin, and should not be installed as one. See <a href="%s">the Jetpack Monorepo documentation</a> for instructions on correctly installing Jetpack.', 'jetpack' ),
			array(
				'a' => array( 'href' => array() ),
			)
		),
		esc_url( 'https://github.com/Automattic/jetpack#jetpack-monorepo' )
	);
	echo "</p></div>\n";
}

add_action( 'admin_notices', 'jetpack_monorepo_is_not_a_plugin' );
