<?php
/**
 * Plugin Name: Jetpack Monorepo (not a real plugin)
 * Plugin URI: https://github.com/Automattic/jetpack#jetpack-monorepo
 * Description: The Jetpack Monorepo is not a plugin. Don't try to use it as one. See the Jetpack Monorepo documentation for instructions on correctly installing Jetpack.
 * Author: Automattic
 * Version: 9.4-alpha
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

/**
 * Notify the admin that the Jetpack Monorepo is not a plugin,
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
