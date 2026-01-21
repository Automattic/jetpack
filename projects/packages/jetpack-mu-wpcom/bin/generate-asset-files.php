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
 */
function generate_asset_file( $path ) {
	if ( file_exists( $path ) ) {
		echo "Skipped (already exists): $path\n";
		return;
	}

	$dir = dirname( $path );
	if ( ! is_dir( $dir ) ) {
		if ( ! mkdir( $dir, 0755, true ) ) {
			fwrite( STDERR, "Error: Failed to create directory: $dir\n" );
			exit( 1 );
		}
	}

	$arr     = array(
		'dependencies' => array(),
		'version'      => 'stub',
	);
	$content = '<?php return ' . var_export( $arr, true ) . ';';

	if ( false === file_put_contents( $path, $content ) ) {
		fwrite( STDERR, "Error: Failed to write file: $path\n" );
		exit( 1 );
	}
	echo "Generated: $path\n";
}

/**
 * Generate the build-module/assets.php file.
 *
 * @param string $path The path where the file should be created.
 */
function generate_module_assets_file( $path ) {
	if ( file_exists( $path ) ) {
		echo "Skipped (already exists): $path\n";
		return;
	}

	$dir = dirname( $path );
	if ( ! is_dir( $dir ) ) {
		if ( ! mkdir( $dir, 0755, true ) ) {
			fwrite( STDERR, "Error: Failed to create directory: $dir\n" );
			exit( 1 );
		}
	}

	$arr     = array(
		'wpcom-blocks-code-edit-function/wpcom-blocks-code-edit-function.js' => array(
			'dependencies' => array(),
			'version'      => 'stub',
		),
		'wpcom-blocks-code-block-front/wpcom-blocks-code-block-front.js'     => array(
			'dependencies' => array(),
			'version'      => 'stub',
		),
		'wpcom-blocks-code-worker/wpcom-blocks-code-worker.js'                => array(
			'dependencies' => array(),
			'version'      => 'stub',
		),
	);
	$content = '<?php return ' . var_export( $arr, true ) . ';';

	if ( false === file_put_contents( $path, $content ) ) {
		fwrite( STDERR, "Error: Failed to write file: $path\n" );
		exit( 1 );
	}
	echo "Generated: $path\n";
}

// Determine the base directory
// Accept optional path argument, otherwise use script's parent directory
$base_dir = isset( $argv[1] ) ? $argv[1] : dirname( __DIR__ );

// If it's a relative path, resolve it relative to current working directory
if ( ! preg_match( '#^[/\\\\]|^[a-zA-Z]:#', $base_dir ) ) {
	$base_dir = getcwd() . '/' . $base_dir;
}

// Ensure base_dir is a directory (create parent dirs if needed when we write files)
$base_dir = rtrim( $base_dir, '/' );

echo "Generating stub asset files in: $base_dir\n";

// Generate the asset files
generate_asset_file(
	$base_dir . '/build/wpcom-blocks-code-block-definition/wpcom-blocks-code-block-definition.asset.php'
);

generate_asset_file(
	$base_dir . '/build/wpcom-blocks-code-editor-style/wpcom-blocks-code-editor-style.asset.php'
);

generate_asset_file(
	$base_dir . '/build/wpcom-blocks-code-style/wpcom-blocks-code-style.asset.php'
);

generate_module_assets_file(
	$base_dir . '/build-module/assets.php'
);

echo "All stub asset files generated successfully.\n";
