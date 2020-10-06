<?php
/**
 * Updates PHP versions to match package.json.
 */

$package_json = file_get_contents( 'package.json' );
$package      = json_decode( $package_json );
$version      = $package->version;

function replace_version( $filename ) {
	global $version;

	$lines = array();
	$file  = file( $filename );

	foreach ( $file as $line ) {
		if ( stripos( $line, ' * Version: ' ) !== false ) {
			$line = " * Version: {$version}\n";
		}
		if ( stripos( $line, "define( 'WPCOMSH_VERSION'," ) !== false ) {
			$line = "define( 'WPCOMSH_VERSION', '{$version}' );\n";
		}
		
		$lines[] = $line;
	}

	file_put_contents( $filename, $lines );
}

replace_version( 'wpcomsh.php' );
