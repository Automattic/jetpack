<?php

$file_contents = "<?php return;

/**
 * This file exists soley to store the module
 * header translation strings, that exist ordinarily
 * in comments on files in this directory.
 *
 * It is never included anywhere, and is used for parsing.
 */
";

$jp_dir = dirname( dirname( __FILE__ ) ) . '/';
$files = glob( "{$jp_dir}modules/*.php" );
foreach ( $files as $file ) {
	$absolute_path  = $file;
	$relative_path  = str_replace( $jp_dir, '', $file );
	$_file_contents = '';

	$file      = fopen( $absolute_path, 'r' );
	$file_data = fread( $file, 8192 );
	fclose( $file );

	// Make sure we catch CR-only line endings.
	$file_data = str_replace( "\r", "\n", $file_data );

	$all_headers = array(
		'name'        => 'Module Name',
		'description' => 'Module Description',
	);

	foreach ( $all_headers as $field => $regex ) {
		if ( preg_match( '/^[ \t\/*#@]*' . preg_quote( $regex, '/' ) . ':(.*)$/mi', $file_data, $match ) && $match[1] ) {
			$string = trim( preg_replace( "/\s*(?:\*\/|\?>).*/", '', $match[1] ) );
			$_file_contents .= "_x( '{$string}', '{$regex}', 'jetpack' );\r\n";
		}
	}

	if ( $_file_contents ) {
		$file_contents .= "\r\n// {$relative_path}\r\n";
		$file_contents .= $_file_contents;
	}

}

file_put_contents( "{$jp_dir}modules/module-headings.php", $file_contents );
