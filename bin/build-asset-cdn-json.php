<?php

// The repo root path.
$path = dirname( dirname( __FILE__ ) ) . '/';

// Build an iterator over all files in the repo that match the regex in the RegexIterator.
$directory = new RecursiveDirectoryIterator( $path );
$iterator  = new RecursiveIteratorIterator( $directory );
$regex     = new RegexIterator( $iterator, '/^.+\.(css|js)$/i', RecursiveRegexIterator::GET_MATCH );

$ignore_paths = array(
	'_inc/client/',
	'bin/',
	'docker/',
	'docs/',
	'extensions/',
	'logs/',
	'node_modules/',
	'tests/',
	'tools/',
	'vendor/',
);

$manifest = array();
foreach ( $regex as $path_to_file => $value ) {
	$path_from_repo_root = str_replace( $path, '', $path_to_file );

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

$export = var_export( $manifest, true );

file_put_contents( $path . 'modules/photon-cdn/jetpack-manifest.php', "<?php
// This file is autogenerated by bin/build-asset-cdn-json.php

\$assets = $export;\r\n" );
