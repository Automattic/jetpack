<?php
/**
 * Script to build modules/photon-cdn/jetpack-manifest.php
 *
 * @package Jetpack
 */

// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open, PHPCompatibility.ParameterValues.NewProcOpenCmdArray.Found, WordPress.WP.AlternativeFunctions

// The repo root path.
$jetpack_path = dirname( __DIR__ ) . '/';

// Build an iterator over all files in the repo that match the regex in the RegexIterator.
$directory = new RecursiveDirectoryIterator( $jetpack_path );
$iterator  = new RecursiveIteratorIterator( $directory );
$regex     = new RegexIterator( $iterator, '/^.+\.(css|js)$/i', RecursiveRegexIterator::GET_MATCH );

$ignore_paths = array(
	'_inc/client/',
	'extensions/',
	'logs/',
	'node_modules/',
	'tests/',
	'tools/',
	'vendor/',
);

$manifest = array();
foreach ( $regex as $path_to_file => $value ) {
	$path_from_repo_root = str_replace( $jetpack_path, '', $path_to_file );

	// Ignore top-level files.
	if ( false === strpos( $path_from_repo_root, '/' ) ) {
		continue;
	}

	// Ignore explicit ignore list.
	foreach ( $ignore_paths as $ignore_path ) {
		if ( 0 === strpos( $path_from_repo_root, $ignore_path ) ) {
			continue 2;
		}
	}

	$manifest[] = $path_from_repo_root;
}

/**
 * Wrapper for proc_open.
 *
 * @param array|string $cmd Command.
 * @param array        $pipes Output variable for pipes.
 * @return resource From `proc_open`.
 */
function do_proc_open( $cmd, &$pipes ) {
	global $jetpack_path;

	if ( is_array( $cmd ) && version_compare( PHP_VERSION, '7.4.0', '<' ) ) {
		// PHP <7.4 doesn't support an array, so convert it to a string.
		$cmd = implode( ' ', array_map( 'escapeshellarg', $cmd ) );
	}
	return proc_open(
		$cmd,
		array( array( 'pipe', 'r' ), array( 'pipe', 'w' ), STDERR ),
		$pipes,
		$jetpack_path
	);
}

// Make phpcs happy. These get set by the `do_proc_open` call.
$ignore_pipes  = null;
$include_pipes = null;
$exclude_pipes = null;

// Use .gitignore and .gitattributes to select files to include.
$ignore  = do_proc_open( array( 'git', 'check-ignore', '--stdin', '-v', '-n' ), $ignore_pipes );
$include = do_proc_open( array( 'git', 'check-attr', '--stdin', 'production-include' ), $include_pipes );
$exclude = do_proc_open( array( 'git', 'check-attr', '--stdin', 'production-exclude' ), $exclude_pipes );
foreach ( $manifest as $i => $file ) {
	fwrite( $ignore_pipes[0], "$file\n" );
	$res = array_map( 'trim', explode( ':', fgets( $ignore_pipes[1] ) ) );
	if ( '' !== $res[0] ) {
		// File is ignored. Check if it's included anyway.
		fwrite( $include_pipes[0], "$file\n" );
		$res = array_map( 'trim', explode( ':', fgets( $include_pipes[1] ) ) );
		if ( 'production-include' === $res[1] && ( 'unspecified' === $res[2] || 'unset' === $res[2] ) ) {
			// File is not included. Skip it.
			unset( $manifest[ $i ] );
			continue;
		}
	}

	fwrite( $exclude_pipes[0], "$file\n" );
	$res = array_map( 'trim', explode( ':', fgets( $exclude_pipes[1] ) ) );
	if ( 'production-exclude' === $res[1] && 'unspecified' !== $res[2] && 'unset' !== $res[2] ) {
		// File is excluded. Skip it.
		unset( $manifest[ $i ] );
	}
}
fclose( $ignore_pipes[0] );
fclose( $ignore_pipes[1] );
fclose( $include_pipes[0] );
fclose( $include_pipes[1] );
fclose( $exclude_pipes[0] );
fclose( $exclude_pipes[1] );
proc_close( $ignore );
proc_close( $include );
proc_close( $exclude );

sort( $manifest );
$export = var_export( $manifest, true ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_var_export

file_put_contents(
	$jetpack_path . 'modules/photon-cdn/jetpack-manifest.php',
	"<?php
// This file is autogenerated by bin/build-asset-cdn-json.php

\$assets = $export;\n"
);
