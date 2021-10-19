<?php
/**
 * Compatibility files for third-party plugins.
 * This is used to improve compatibility of specific Jetpack features with third-party plugins.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack;

/**
 * Loads the individual 3rd-party compat files.
 */
function load_3rd_party() {
	// Array of third-party compat files to always require.
	$compat_files = array(
		'bbpress.php',
		'beaverbuilder.php',
		'bitly.php',
		'buddypress.php',
		'class.jetpack-amp-support.php',
		'class-jetpack-crm-data.php',
		'class-jetpack-modules-overrides.php', // Special case. Tools to be used to override module settings.
		'creative-mail.php',
		'debug-bar.php',
		'class-domain-mapping.php',
		'crowdsignal.php',
		'qtranslate-x.php',
		'vaultpress.php',
		'web-stories.php',
		'wpml.php',
		'woocommerce.php',
		'woocommerce-services.php',
	);

	foreach ( $compat_files as $file ) {
		if ( file_exists( JETPACK__PLUGIN_DIR . '/3rd-party/' . $file ) ) {
			require_once JETPACK__PLUGIN_DIR . '/3rd-party/' . $file;
		}
	}

	add_filter( 'jetpack_development_version', __NAMESPACE__ . '\atomic_weekly_override' );
}

/**
 * Handles suppressing development version notices on Atomic-hosted sites.
 *
 * @param bool $development_version Filterable value if this is a development version of Jetpack.
 *
 * @return bool
 */
function atomic_weekly_override( $development_version ) {
	if ( Constants::is_true( 'ATOMIC_SITE_ID' ) && Constants::is_true( 'ATOMIC_CLIENT_ID' ) ) {
		return false;
	}
	return $development_version;
}

load_3rd_party();
