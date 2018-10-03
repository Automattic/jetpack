<?php

$path      = dirname( dirname( __FILE__ ) ) . '/';
$directory = new RecursiveDirectoryIterator( $path );
$iterator  = new RecursiveIteratorIterator( $directory );
$regex     = new RegexIterator( $iterator, '/^.+\.(css|js)$/i', RecursiveRegexIterator::GET_MATCH );

$manifest = array();
foreach ( $regex as $file => $value ) {
	$file = str_replace( $path, '', $file );
	$directory = substr( $file, 0, strpos( $file, '/' ) );
	if ( in_array( $directory, array( 'node_modules', 'tests' ) ) ) {
		continue;
	}
	$manifest[] = $file;
}

$export = var_export( $manifest, true );

file_put_contents( $path . 'modules/photon-cdn/jetpack-manifest.php', "<?php \r\n\$assets = $export;\r\n" );
