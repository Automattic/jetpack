<?php
/**
 * Boot module asset proxy for wp-build page consumers.
 *
 * When wp-build generates page templates, they reference a boot module asset
 * file at a hardcoded relative path (build/modules/boot/index.min.asset.php).
 * This proxy file is copied to that location by the monorepo build tooling,
 * and resolves the real asset data from the wp-build-polyfills package
 * regardless of where it is installed (vendor/ or jetpack_vendor/).
 *
 * @package automattic/jetpack-wp-build-polyfills
 */

// phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed -- This is not a class file.

$class_name = 'Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills';

if ( ! class_exists( $class_name ) ) {
	return array(
		'dependencies' => array(),
		'version'      => '',
	);
}

$ref        = new ReflectionClass( $class_name );
$asset_file = dirname( $ref->getFileName(), 2 ) . '/build/modules/boot/index.asset.php';

if ( ! file_exists( $asset_file ) ) {
	return array(
		'dependencies' => array(),
		'version'      => '',
	);
}

return require $asset_file;
