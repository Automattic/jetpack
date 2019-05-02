<?php
/**
 * Compatibility files for third-party plugins.
 * This is used to improve compatibility of specific Jetpack features with third-party plugins.
 *
 * @package Jetpack
 */

// Array of third-party compat files to always require.
$compat_files = array(
	'bbpress.php',
	'beaverbuilder.php',
	'bitly.php',
	'buddypress.php',
	'class.jetpack-amp-support.php',
	'class.jetpack-modules-overrides.php', // Special case. Tools to be used to override module settings.
	'debug-bar.php',
	'domain-mapping.php',
	'polldaddy.php',
	'qtranslate-x.php',
	'vaultpress.php',
	'wpml.php',
	'woocommerce.php',
	'woocommerce-services.php',
);

foreach ( $compat_files as $file ) {
	if ( file_exists( JETPACK__PLUGIN_DIR . '/3rd-party/' . $file ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/' . $file;
	}
}
