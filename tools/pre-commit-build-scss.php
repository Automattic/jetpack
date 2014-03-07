<?php

$files = array(
	'jetpack.scss',
	'jetpack-banners.scss',
	'jetpack-admin.scss',
);

$disclaimer = "/*!
 * Do not modify this file directly.  It is compiled Sass code.
 */
";

require_once( dirname( __FILE__ ) . '/../modules/custom-css/custom-css/preprocessors/scss.inc.php' );
require_once( 'class.scss_formatter_wp.php' );

$_inc = realpath( dirname( __FILE__ ) . '/../_inc/' ) . '/';
$scssc = new scssc();
$scssc->setImportPaths( $_inc );

foreach ( $files as $this_file ) {
	$basename = basename( $this_file, '.scss' );
	$path = $_inc . $basename . '.scss';

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
