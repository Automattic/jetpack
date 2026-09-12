<?php
/**
 * Print the Composer content-hash for a composer.json.
 *
 * Mirrors Composer\Package\Locker::getContentHash().
 *
 * @package automattic/jetpack-cli
 */

$content = is_readable( $argv[1] ?? '' ) ? json_decode( (string) file_get_contents( $argv[1] ), true ) : null;
if ( ! is_array( $content ) ) {
	fwrite( STDERR, "usage: composer-content-hash.php <readable composer.json>\n" );
	exit( 1 );
}

$relevant_keys = array(
	'name',
	'version',
	'require',
	'require-dev',
	'conflict',
	'replace',
	'provide',
	'minimum-stability',
	'prefer-stable',
	'repositories',
	'extra',
);

$relevant = array();
foreach ( array_intersect( $relevant_keys, array_keys( $content ) ) as $key ) {
	$relevant[ $key ] = $content[ $key ];
}
if ( isset( $content['config']['platform'] ) ) {
	$relevant['config']['platform'] = $content['config']['platform'];
}
ksort( $relevant );

// Must byte-match Composer's own JsonFile::encode( $c, 0 ).
// phpcs:ignore Jetpack.Functions.JsonEncodeFlags.ZeroFound
echo hash( 'md5', json_encode( $relevant, 0 ) );
