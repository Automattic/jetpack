<?php

date_default_timezone_set( 'UTC' );

$_inc = realpath( dirname( __FILE__ ) . '/../_inc/' ) . '/';
$_disclaimer = "/*!
 * Do not modify this file directly.  It is compiled Sass code.
 * Last Modified: " . date( 'r' ) . "
 * @see: %s
 */
";

require_once( dirname( __FILE__ ) . '/../modules/custom-css/custom-css/preprocessors/scss.inc.php' );
require_once( 'class.scss_formatter_wp.php' );
$scssc = new scssc();
$scssc->setImportPaths( $_inc );

foreach ( glob( "{$_inc}*.scss" ) as $this_file ) {
	$basename   = basename( $this_file, '.scss' );
	$path       = $_inc . $basename . '.scss';
	$disclaimer = sprintf( $_disclaimer, "jetpack/_inc/{$basename}.scss" );

	if ( ! is_readable( $path ) ) {
		echo "Error: {$path} not found.\r\n";
		continue;
	}

	$raw_scss = file_get_contents( $path );

	$scssc->setFormatter( 'scss_formatter_wp' );
	$compiled_css = $scssc->compile( $raw_scss );
	file_put_contents( "{$_inc}{$basename}.css", $disclaimer . $compiled_css );

	$scssc->setFormatter( 'scss_formatter_compressed' );
	$minified_css = $scssc->compile( $raw_scss );
	file_put_contents( "{$_inc}{$basename}.min.css", $disclaimer . $minified_css );

	echo "Success: `{$basename}` compiled successfully.\r\n";

}
