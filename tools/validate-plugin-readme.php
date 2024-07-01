#!/usr/bin/env php
<?php
/**
 * A fairly simple script to screen-scrape the output of the WordPress Readme Validator,
 * since there's no API or standalone tool to do it.
 *
 * @package automattic/jetpack-monorepo
 * @see https://wordpress.org/plugins/developers/readme-validator/
 */

/**
 * Print an error message.
 *
 * @param string $msg Error message.
 * @param mixed  ...$args Printf args.
 */
function printErr( $msg, ...$args ) {
	fprintf( STDERR, "\x1b[1;31m$msg\x1b[0m\n", ...$args );
}

if ( count( $argv ) !== 2 ) {
	printErr( 'USAGE: %s <readme-file>', $argv[0] );
	exit( 1 );
}

$readme = file_get_contents( $argv[1] );
if ( ! $readme ) {
	printErr( 'Failed to read %s', $argv[1] );
	exit( 1 );
}

$response = '';
$curl     = curl_init();
curl_setopt_array(
	$curl,
	array(
		CURLOPT_URL            => 'https://wordpress.org/plugins/developers/readme-validator/',
		CURLOPT_WRITEFUNCTION  => function ( $ch, $data ) use ( &$response ) {
			$response .= $data;
			return strlen( $data );
		},
		CURLOPT_FAILONERROR    => true,
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_ENCODING       => '',
		CURLOPT_MAXREDIRS      => 10,
		CURLOPT_TIMEOUT        => 30,
		CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
		CURLOPT_POST           => 1,
		CURLOPT_POSTFIELDS     => array(
			'readme'          => '',
			'readme_contents' => base64_encode( $readme ),
		),
	)
);

if ( ! curl_exec( $curl ) || curl_getinfo( $curl, CURLINFO_RESPONSE_CODE ) >= 400 ) {
	printErr( 'Failed to query validator' );
	echo $response;
	exit( 1 );
}

$doc = new DOMDocument();
$doc->loadHTML( $response, LIBXML_NOERROR );
$xpath = new DOMXPath( $doc );

if ( $xpath->query( "//div[contains(@class,'notice-success')]" )->length > 0 ) {
	echo "No issues found!\n";
	exit( 0 );
}

$ignore = array(
	'The following tags are not widely used: ',
	'No == Upgrade Notice == section was found',
	'No donate link was found',
);

$any      = false;
$anyatall = false;
foreach ( array( 'errors', 'warnings', 'notes' ) as $class ) {
	foreach ( $xpath->evaluate( "//ul[contains(@class,'$class')]/li" ) as $n ) {
		$anyatall = true;
		$v        = $xpath->evaluate( 'string(.)', $n );
		if ( ! in_array( $v, $ignore, true ) ) {
			$any = true;
			echo "$v\n";
		}
	}
}
if ( ! $any ) {
	echo "No issues found!\n";
}
if ( ! $anyatall ) {
	echo "(something may be wrong, found neither issues nor the success message)\n";
}
