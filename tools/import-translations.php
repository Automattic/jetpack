<?php

/*
 * Imports translations from one or multiple WordPress.com GlotPress project to another
 *
 * php import-translations.php DESTINATION_URL SOURCE_URL [SOURCE_URL ...]
 */

/**
 * Terminates script.  Prints help and message to STDERR
 *
 * @param string $message
 */
function die_error( $message ) {
	global $argv;

	fwrite( STDERR, "php $argv[0] DESTINATION_URL SOURCE_URL [SOURCE_URL ...]\n" );
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

if ( empty( $argv[1] ) ) {
	die_error( 'No DESTINATION_URL specified' );
}

$destination_url = apize_url( rtrim( $argv[1], '/' ) );
$destination = json_decode( file_get_contents( $destination_url ) );

$destination_locales = array();
foreach ( $destination->translation_sets as $translation_set ) {
	$destination_locales[$translation_set->locale] = sprintf( '%s/%s', $translation_set->locale, $translation_set->slug );
}

if ( isset( $argv[2] ) ) {
	$origin_urls = array_map( 'apize_url', array_slice( $argv, 2 ) );
} else {
/*
	// Imports all siblings into destination
	$origin_urls = array();
	$destination_parent_url = rtrim( dirname( $destination_url ), '/' );
	$destination_parent = json_decode( file_get_contents( $destination_parent_url ) );
	foreach ( $destination_parent->sub_projects as $sub_project ) {
		$origin_url = sprintf( '%s/%s', $destination_parent_url, $sub_project->slug );
		if ( $origin_url == $destination_url ) {
			continue;
		}
		$origin_urls[] = $origin_url;
	}

	$origin_urls[] = 'http://translate.wordpress.com/api/projects/wpcom';
*/
	die_error( 'No SOURCE_URLs specified' );
}

sort( $origin_urls );

// Log in
echo "WordPress.com Username: ";
$user_login = trim( fgets( STDIN ) );

echo "WordPress.com Password: ";
$user_pass = shell_exec( 'read -rs secret_password && echo $secret_password' );
$user_pass = substr( $user_pass, 0, -1 );
echo "\n";

$cookie_jar = tmpfile();                                // handle
$cookie_jar_meta = stream_get_meta_data( $cookie_jar ); // file meta data
$cookie_jar_file = $cookie_jar_meta['uri'];             // file

$login = curl_init( 'https://translate.wordpress.com/login' );
$login_error = false;

curl_setopt_array( $login, array(
	CURLOPT_POSTFIELDS => compact( 'user_login', 'user_pass' ),
	CURLOPT_COOKIEJAR  => $cookie_jar_file, // write cookies
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_HEADER => false,
	CURLOPT_HEADERFUNCTION => function( $curl, $header_line ) use ( &$login_error ) {
		if ( preg_match( '/_gp_notice_error=/', $header_line, $matches ) ) {
			$login_error = true;
		}
		return strlen( $header_line );
	},
) );

curl_exec( $login );
curl_close( $login ); // Now our cookies are stored in $cookie_jar_file

if ( $login_error ) {
	die_error( 'Invalid username/password' );
}

foreach ( $destination_locales as $locale => $locale_url_suffix ) {
	echo "$locale: ";

	$destination_locale_url = sprintf( '%s/%s', $destination_url, $locale_url_suffix );
	$destination_locale_export_url = sprintf( '%s/%s/%s', $destination_url, $locale_url_suffix, 'export-translations?format=po' );
	$destination_locale_import_url = sprintf( '%s/%s/%s', $destination_url, $locale_url_suffix, 'import-translations' );

	$destination_locale_po = tmpfile();                                                 // handle
	$destination_locale_po_meta = stream_get_meta_data( $destination_locale_po );       // file meta data
	$destination_locale_po_file = $destination_locale_po_meta['uri'];                   // file
	$destination_locale_po_data = @file_get_contents( $destination_locale_export_url ); // file contents
	fwrite( $destination_locale_po, $destination_locale_po_data );

	$total_strings = preg_match_all( '/^msgstr/m', $destination_locale_po_data, $m );
	$untranslated_strings = preg_match_all( '/^msgstr(\[\d+\])? ""/m', $destination_locale_po_data, $m );

	echo "TOTAL: $total_strings; UNTRANSLATED: $untranslated_strings\n";

	foreach ( $origin_urls as $origin_url ) {
		$origin_locale_url = sprintf( '%s/%s', $origin_url, $locale_url_suffix );
		$origin_locale_export_url = sprintf( '%s/%s/%s', $origin_url, $locale_url_suffix, 'export-translations?format=po' );

		$origin_locale_po = tmpfile();                                            // handle
		$origin_locale_po_meta = stream_get_meta_data( $origin_locale_po );       // file meta data
		$origin_locale_po_file = $origin_locale_po_meta['uri'];                   // file
		$origin_locale_po_data = @file_get_contents( $origin_locale_export_url ); // file contents

		$translations_added = 0;

		if ( $origin_locale_po_data ) {
			fwrite( $origin_locale_po, $origin_locale_po_data );

			$translations_added = upload_translation( $destination_locale_import_url, $origin_locale_po_file );
		}

		fclose( $origin_locale_po );

		printf( "%s: %d\n", $origin_locale_url, $translations_added );
	}

	$translations_added = upload_translation( $destination_locale_import_url, $destination_locale_po_file );
	printf( "%s: %d\n", $destination_locale_url, $translations_added );

	fclose( $destination_locale_po );

	echo "\n";
}

/**
 * Upload file to URL using Cookie Authentication
 *
 * @param string $import_url
 * @param string $file
 */
function upload_translation( $import_url, $file ) {
	global $cookie_jar_file;

	$import = curl_init( $import_url );

	$translations_added = 0;

	curl_setopt_array( $import, array(
		CURLOPT_COOKIEFILE => $cookie_jar_file, // read cookies
		CURLOPT_POSTFIELDS => array(
			'format' => 'po',
			'import-file' => sprintf( '@%s', $file ),
		),
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_HEADER => false,
		CURLOPT_HEADERFUNCTION => function( $curl, $header_line ) use ( &$translations_added ) {
			if ( preg_match( '/_gp_notice_notice=(\d+)/', $header_line, $matches ) ) {
				$translations_added = (int) $matches[1];
			}
			return strlen( $header_line );
		},
	) );

	curl_exec( $import );

	return $translations_added;
}
