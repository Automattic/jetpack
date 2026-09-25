<?php
/**
 * Registers the dashboard's SDK under the name of its package.
 *
 * Widgets built against `@automattic/jetpack-premium-analytics-sdk` import that name, and wp-build
 * leaves it external, so the page import map must resolve it to the facade module this package builds.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

const SDK_MODULE_ID = '@automattic/jetpack-premium-analytics-sdk';

/**
 * Register the facade module a second time, under the SDK package's name.
 *
 * @return void
 */
function register_sdk_script_module() {
	$build_dir     = dirname( __DIR__ ) . '/build';
	$registry_file = $build_dir . '/modules/registry.php';
	if ( ! file_exists( $build_dir . '/constants.php' ) || ! file_exists( $registry_file ) ) {
		return;
	}

	foreach ( require $registry_file as $module ) {
		if ( '@jetpack-premium-analytics/sdk' !== $module['id'] ) {
			continue;
		}

		$constants  = require $build_dir . '/constants.php';
		$extension  = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '.js' : '.min.js';
		$asset_path = $build_dir . '/modules/' . $module['asset'];
		$asset      = file_exists( $asset_path ) ? require $asset_path : array();

		wp_register_script_module(
			SDK_MODULE_ID,
			$constants['build_url'] . 'modules/' . $module['path'] . $extension,
			$asset['module_dependencies'] ?? array(),
			$asset['version'] ?? false
		);
		return;
	}
}

// After wp-build's own registration of the package's modules, at the default priority.
add_action( 'wp_default_scripts', __NAMESPACE__ . '\register_sdk_script_module', 20 );
