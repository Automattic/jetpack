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
 * Id of the facade module wp-build builds from `packages/sdk`.
 */
const SDK_FACADE_MODULE_ID = '@jetpack-premium-analytics/sdk';

/**
 * Resolve the facade module's registration from the build's module registry.
 *
 * @param array[] $modules   The modules of `build/modules/registry.php`.
 * @param array   $constants The constants of `build/constants.php`.
 * @param string  $build_dir Directory of the build, which holds the asset files.
 * @param bool    $minified  Whether to serve the minified bundle.
 * @return array|null `src`, `deps` and `version` for `wp_register_script_module()`, or null when the registry has no facade.
 */
function get_sdk_module_registration( array $modules, array $constants, $build_dir, $minified = true ) {
	foreach ( $modules as $module ) {
		if ( SDK_FACADE_MODULE_ID !== $module['id'] ) {
			continue;
		}

		$asset_path = $build_dir . '/modules/' . $module['asset'];
		$asset      = file_exists( $asset_path ) ? require $asset_path : array();

		return array(
			'src'     => $constants['build_url'] . 'modules/' . $module['path'] . ( $minified ? '.min.js' : '.js' ),
			'deps'    => $asset['module_dependencies'] ?? array(),
			'version' => $asset['version'] ?? false,
		);
	}

	return null;
}

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

	$registration = get_sdk_module_registration(
		require $registry_file,
		require $build_dir . '/constants.php',
		$build_dir,
		! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG )
	);
	if ( null === $registration ) {
		return;
	}

	wp_register_script_module( SDK_MODULE_ID, $registration['src'], $registration['deps'], $registration['version'] );
}

// After wp-build's own registration of the package's modules, at the default priority.
add_action( 'wp_default_scripts', __NAMESPACE__ . '\register_sdk_script_module', 20 );
