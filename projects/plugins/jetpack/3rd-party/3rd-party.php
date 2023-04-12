<?php
/**
 * Compatibility files for third-party plugins.
 * This is used to improve compatibility of specific Jetpack features with third-party plugins.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Status\Host;
// Automattic\Jetpack\Constants is already available via the Automattic\Jetpack namespace.

/**
 * Loads the individual 3rd-party compat files.
 */
function load_3rd_party() {
	add_action( 'plugins_loaded', __NAMESPACE__ . '\load_3rd_party_compat_filters', 11 );
	// Array of third-party compat files to always require.
	$compat_files = array(
		'class-salesforce-lead-form.php', // not a module but the handler for Salesforce forms
		'wpml.php',
	);

	foreach ( $compat_files as $file ) {
		if ( file_exists( JETPACK__PLUGIN_DIR . '/3rd-party/' . $file ) ) {
			require_once JETPACK__PLUGIN_DIR . '/3rd-party/' . $file;
		}
	}

	add_filter( 'jetpack_development_version', __NAMESPACE__ . '\atomic_weekly_override' );
}

/**
 * Loads the individual 3rd-party compat functions.
 *
 * This is a refactor of load_3rd_party() to load the individual compat files only when needed instead of universally.
 */
function load_3rd_party_compat_filters() {
	// bbPress
	if ( function_exists( 'bbpress' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/bbpress.php';
	}

	// Beaver Builder
	if ( class_exists( 'FLBuilder' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/beaverbuilder.php';
	}

	// Bitly
	if ( class_exists( 'Bitly' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/bitly.php';
	}

	// BuddyPress
	if ( class_exists( 'BuddyPress' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/buddypress.php';
	}

	// AMP. AMP__DIR__ is defined in the AMP plugin since the very first version.
	if ( Constants::is_defined( 'AMP__DIR__' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/class.jetpack-amp-support.php';
	}

	// Domain Mapping. All assume multisite, so it's an easy check.
	if ( Constants::is_defined( 'SUNRISE' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/class-domain-mapping.php';
	}

	// Debug Bar
	if ( class_exists( 'Debug_Bar' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/debug-bar.php';
	}

	// CRM. Always included; it is used only when certain endpoints are hit.
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/class-jetpack-crm-data.php';

	// Special case. Tools to be used to override module settings.
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/class-jetpack-modules-overrides.php';

	// Letting these always load since it handles somethings upon plugin activation.
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/creative-mail.php';
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/jetpack-backup.php';
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/jetpack-boost.php';
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/woocommerce-services.php';

	// Crowdsignal. @todo Review the usage of modern Jetpack with outdated Crowdsignal.
	require_once JETPACK__PLUGIN_DIR . '/3rd-party/crowdsignal.php';

	// qTranslate. Plugin closed in 2021, but leaving support for now to allow sites to drop it.
	if ( Constants::is_defined( 'QTX_VERSION' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/qtranslate-x.php';
	}

	// VaultPress.
	if ( Constants::is_defined( 'VAULTPRESS__VERSION' ) || class_exists( 'VaultPress' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/vaultpress.php';
	}

	// Web Stories
	if ( Constants::is_defined( 'WEBSTORIES_VERSION' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/web-stories.php';
	}

	// WooCommerce
	if ( class_exists( 'WooCommerce' ) ) {
		require_once JETPACK__PLUGIN_DIR . '/3rd-party/woocommerce.php';
	}
}

/**
 * Handles suppressing development version notices on Atomic-hosted sites.
 *
 * @param bool $development_version Filterable value if this is a development version of Jetpack.
 *
 * @return bool
 */
function atomic_weekly_override( $development_version ) {
	if ( ( new Host() )->is_atomic_platform() ) {
		$haystack = Constants::get_constant( 'JETPACK__PLUGIN_DIR' );
		$needle   = '/jetpack-dev/';
		if (
			( function_exists( 'str_ends_with' ) && str_ends_with( $haystack, $needle ) ) || // phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.str_ends_withFound
			0 === substr_compare( $haystack, $needle, -13 )
		) {
			return $development_version; // Returns the default response if the active Jetpack version is from the beta plugin.
		}

		$development_version = false; // Returns false for regular installs on Atomic.
	}
	return $development_version; // Return default if not on Atomic.
}

load_3rd_party();
