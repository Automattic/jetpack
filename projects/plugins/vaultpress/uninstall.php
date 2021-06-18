<?php
/**
 * This file runs if someone clicks the delete link next to a deactivated
 * copy of the VaultPress plugin from within the WordPress admin area.
 *
 * @see https://developer.wordpress.org/plugins/the-basics/uninstall-methods/
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit();
}

delete_option( 'vaultpress' );