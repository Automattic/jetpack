<?php
/**
 * Updates PHP versions to match package.json.
 *
 * @package bin
 */

/**
 * Updates the WPCOMSH version in the files that keep them.
 *
 * @param string $filename File name.
 */
function replace_version( $filename ) {

	$package_json = file_get_contents( 'package.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$package      = json_decode( $package_json );
	$version      = $package->version;

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

	file_put_contents( $filename, $lines ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
}

replace_version( 'wpcomsh.php' );
