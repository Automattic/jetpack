<?php

$files = array(
	'jetpack.css',
	'jetpack-banners.css',
);

require_once( dirname( __FILE__ ) . '/../modules/custom-css/csstidy/class.csstidy.php' );

function tidy_css( $css ) {
	$csstidy = new csstidy();

	$csstidy->set_cfg( 'remove_bslash',              false );
	$csstidy->set_cfg( 'compress_colors',            false );
	$csstidy->set_cfg( 'compress_font-weight',       false );
	$csstidy->set_cfg( 'optimise_shorthands',        0 );
	$csstidy->set_cfg( 'remove_last_;',              false );
	$csstidy->set_cfg( 'case_properties',            false );
	$csstidy->set_cfg( 'discard_invalid_properties', true );
	$csstidy->set_cfg( 'css_level',                  'CSS3.0' );
	$csstidy->set_cfg( 'preserve_css',               true );
	$csstidy->set_cfg( 'template',                   dirname( __FILE__ ) . '/../modules/custom-css/csstidy/wordpress-standard.tpl' );

	$csstidy->parse( $css );

	return $csstidy->print->plain();
}

function smush_css( $css ) {
	$csstidy = new csstidy();

	$csstidy->set_cfg( 'remove_bslash',              false );
	$csstidy->set_cfg( 'compress_colors',            true );
	$csstidy->set_cfg( 'compress_font-weight',       true );
	$csstidy->set_cfg( 'remove_last_;',              true );
	$csstidy->set_cfg( 'case_properties',            true );
	$csstidy->set_cfg( 'discard_invalid_properties', true );
	$csstidy->set_cfg( 'css_level',                  'CSS3.0' );
	$csstidy->set_cfg( 'template',                   'highest');

	$csstidy->parse( $css );

	return $csstidy->print->plain();
}

foreach ( $files as $this_file ) {
	$path = dirname( __FILE__ ) . '/../_inc/' . $this_file;
	if ( is_readable( $path ) ) {
		$css = file_get_contents( $path );

		$tidied_css = tidy_css( $css );
		file_put_contents( $path, $tidied_css );

		$min_path = str_replace( '.css', '.min.css', $path );
		$smushed_css = smush_css( $css );
		file_put_contents( $min_path, $smushed_css );

		echo "Success: {$this_file} tidied and smushed.\r\n";
	} else {
		echo "Error: {$this_file} not found.\r\n";
	}
}