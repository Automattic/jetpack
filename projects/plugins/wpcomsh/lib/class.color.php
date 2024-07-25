<?php
/**
 * Load lib from Jetpack.
 *
 * @package lib
 */

// phpcs:ignoreFile WordPress.Files.FileName.NotHyphenatedLowercase

// Dummy comment to make phpcs happy.
if ( defined( 'CLASSIC_THEME_HELPER_PLUGIN_DIR') ) {
	require_once CLASSIC_THEME_HELPER_PLUGIN_DIR . '_inc/lib/class.color.php';
}
