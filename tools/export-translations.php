<?php

/*
 * Exports translations from http://translate.wordpress.com/api/projects/jetpack
 *
 * php export-translations.php DIRECTORY SOURCE_URL
 */

require dirname( dirname( __FILE__ ) ) . '/locales.php';

/**
 * Terminates script.  Prints help and message to STDERR
 *
 * @param string $message
 */
function die_error( $message ) {
	global $argv;

	fwrite( STDERR, "php $argv[0] DIRECTORY SOURCE_URL\n" );
	fwrite( STDERR, "$message\n" );
	exit( 1 );
}

/**
 * Converts GlotPress URL into a GlotPress API URL
 *
 * @param sring $url URL
 * @return sstring API URL
 */
function apize_url( $url ) {
	if ( false !== strpos( $url, '/api' ) ) {
		return $url;
	}

	$host = preg_quote( parse_url( $url, PHP_URL_HOST ) );

	return preg_replace( "#^https?://$host#", '\\0/api', $url );
}

// Output
if ( empty( $argv[1] ) ) {
	die_error( 'No DIRECTORY' );
}

$jetpack_directory = rtrim( $argv[1], '/' );
$jetpack_directory = realpath( $jetpack_directory );
if ( !$jetpack_directory || !is_dir( $jetpack_directory ) ) {
	die_error( 'DIRECTORY must be a valid directory' );
}

// Input
if ( empty( $argv[2] ) ) {
	die_error( 'No SOURCE_URL' );
}

// gettext tools required
$msgfmt = trim( `which msgfmt` );
if ( empty( $msgfmt ) ) {
	die_error( 'msgfmt must be installed' );
}

// Create a temporary directory... hack
$temp_file_handle = tmpfile();                                 // file handle
$temp_file_meta   = stream_get_meta_data( $temp_file_handle ); // file meta data
$temp_file_path   = $temp_file_meta['uri'];                    // file path
fclose( $temp_file_handle );
mkdir( $temp_file_path, 0700, true );
register_shutdown_function( function( $temp_file_path ) {
	exec( sprintf( 'rm -rf %s', escapeshellarg( $temp_file_path ) ) );
}, $temp_file_path );

// The current Jetpack translations
$current_sets = glob( $jetpack_directory . '/languages/*.mo' );
$current_sets = preg_replace( '/.*-(\w+)\.mo/', '$1', $current_sets );
$keys = array_map( 'strtolower', $current_sets );
$current_sets = array_combine( $keys, $current_sets );
unset( $keys );

$source_url = apize_url( rtrim( $argv[2], '/' ) );
$source     = file_get_contents( $source_url );

$available_sets = json_decode( $source )->translation_sets;

// Maps source locale slugs to current Jetpack locales
$map = array();
foreach ( $available_sets as $set ) {
	$s = strtolower( str_replace( '-', '_', $set->locale ) );

	if ( GP_Locales::exists( $set->locale ) ) {
		$locale = GP_Locales::by_slug( $set->locale );
		$map[$set->locale] = $locale->wp_locale;
		continue;
	}

	echo "ERROR\n";

	// source's 'ja' matches Jetpack's 'ja'
	if ( isset( $current_sets[$s] ) ) {
		$map[$set->locale] = $current_sets[$s];
		unset( $current_sets[$s] );
		continue;
	}

	// source's 'it' matches Jetpack's 'it_IT'
	foreach ( array_keys( $current_sets ) as $c ) {
		if ( 0 === strpos( $c, $s ) ) {
			$map[$set->locale] = $current_sets[$c];
			unset( $current_sets[$c] );
			continue 2;
		}
	}

	// New locale
	$map[$set->locale] = $set->locale;
}

// Get all the PO files
foreach ( $available_sets as $id => $set ) {
	if ( empty( $map[$set->locale] ) ) {
		echo "UNKNOWN LOCALE: {$set->locale}\n";
		continue;
	}

	$output_file = "{$temp_file_path}/jetpack-{$map[$set->locale]}.po";
	$input_url   = sprintf( '%s/%s/%s/export-translations?format=po', $source_url, $set->locale, $set->slug );
	$exec        = sprintf( 'curl -s -o %s %s', escapeshellarg( $output_file ), escapeshellarg( $input_url ) );
	echo "Downloading $input_url\n";
	exec( $exec );
}

echo "\n";

// Convert PO files to MO files
foreach( glob( "{$temp_file_path}/*.po" ) as $output_po ) {
	$file = basename( $output_po );
	echo "$file\n";

	$current_file = "{$jetpack_directory}/languages/$file";
	$current_exec = sprintf( '%s --statistics %s -o /dev/null 2>&1', $msgfmt, escapeshellarg( $current_file ) );
	$stats = exec( $current_exec );
	@list( $translated, $untranslated ) = explode( ',', $stats );

	$translated    = (int) $translated;
	$untranslated  = isset( $untranslated ) ? (int) $untranslated : 0;
	$current       = $translated;
	$current_total = $translated + $untranslated;

	$output_mo = preg_replace( '/\.po$/', '.mo', $output_po );
	$exec = sprintf( '%s --statistics %s -o %s 2>&1', $msgfmt, escapeshellarg( $output_po ), escapeshellarg( $output_mo ) );
	$stats = exec( $exec );
	@list( $translated, $untranslated ) = explode( ',', $stats );

	$translated   = (int) $translated;
	$untranslated = isset( $untranslated ) ? (int) $untranslated : 0;
	$now          = $translated;
	$now_total    = $translated + $untranslated;

	echo "NOW: $now/$now_total, CURRENT: $current/$current_total\n";

	if ( $now < $current - 1 ) { // some off-by-one error?
		echo "IGNORING $file\n";
		exec( sprintf( 'rm %s', $output_mo ) );
		exec( sprintf( 'rm %s', $output_po ) );
	} else {
		echo "MOVING $file\n";
		exec( sprintf( 'mv %s %s', $output_mo, "{$jetpack_directory}/languages/" ) );
		exec( sprintf( 'mv %s %s', $output_po, "{$jetpack_directory}/languages/" ) );
	}

	echo "\n";
}
