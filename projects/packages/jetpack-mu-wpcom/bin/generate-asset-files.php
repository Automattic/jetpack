#!/usr/bin/env php
<?php
/**
 * Generate stub asset files for testing.
 *
 * This script generates minimal asset.php files that are normally created by webpack/build process.
 * These stub files allow PHP tests to run without requiring a full JavaScript build.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Generate a standard asset.php file.
 *
 * @param string $path The path where the file should be created.
 * @param array  $dependencies Optional array of dependencies.
 * @param string $version Optional version string.
 */
function generate_asset_file( $path, $dependencies = array(), $version = '1.0.0-test' ) {
	$dir = dirname( $path );
	if ( ! is_dir( $dir ) ) {
		mkdir( $dir, 0755, true );
	}

	$content = "<?php\n";
	$content .= "// This file is auto-generated for testing purposes.\n";
	$content .= "return array(\n";
	$content .= "\t'dependencies' => " . var_export( $dependencies, true ) . ",\n";
	$content .= "\t'version' => " . var_export( $version, true ) . ",\n";
	$content .= ");\n";

	file_put_contents( $path, $content );
	echo "Generated: $path\n";
}

/**
 * Generate the build-module/assets.php file.
 *
 * @param string $path The path where the file should be created.
 */
function generate_module_assets_file( $path ) {
	$dir = dirname( $path );
	if ( ! is_dir( $dir ) ) {
		mkdir( $dir, 0755, true );
	}

	$content = "<?php\n";
	$content .= "// This file is auto-generated for testing purposes.\n";
	$content .= "return array(\n";
	$content .= "\t'wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js' => array(\n";
	$content .= "\t\t'dependencies' => array(),\n";
	$content .= "\t\t'version' => '1.0.0-test',\n";
	$content .= "\t),\n";
	$content .= "\t'wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js' => array(\n";
	$content .= "\t\t'dependencies' => array(),\n";
	$content .= "\t\t'version' => '1.0.0-test',\n";
	$content .= "\t),\n";
	$content .= "\t'wpcom-blocks-code-worker/wpcom-blocks-code-worker.js' => array(\n";
	$content .= "\t\t'dependencies' => array(),\n";
	$content .= "\t\t'version' => '1.0.0-test',\n";
	$content .= "\t),\n";
	$content .= ");\n";

	file_put_contents( $path, $content );
	echo "Generated: $path\n";
}

// Determine the base directory
$base_dir = dirname( __DIR__ );

// Generate the asset files
generate_asset_file(
	$base_dir . '/build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.asset.php',
	array(),
	'1.0.0-test'
);

generate_asset_file(
	$base_dir . '/build/wpcom-blocks-code-editor-style/wpcom-blocks-code-editor-style.asset.php',
	array(),
	'1.0.0-test'
);

generate_asset_file(
	$base_dir . '/build/wpcom-blocks-code-style/wpcom-blocks-code-style.asset.php',
	array(),
	'1.0.0-test'
);

generate_module_assets_file(
	$base_dir . '/build-module/assets.php'
);

echo "All stub asset files generated successfully.\n";
