<?php
/**
 * Print the Composer content-hash for a composer.json.
 *
 * Mirrors Composer\Package\Locker::getContentHash(). Used to re-stamp a lock written while the
 * manifest was temporarily pinned, so it still validates against the restored one. If Composer
 * ever changes the key set this returns a hash Composer rejects, which costs a `composer update`
 * rather than producing a wrong install.
 *
 * @package automattic/jetpack-cli
 */

if ( empty( $argv[1] ) || ! is_readable( $argv[1] ) ) {
	fwrite( STDERR, "usage: composer-content-hash.php <composer.json>\n" );
	exit( 1 );
}

$content = json_decode( file_get_contents( $argv[1] ), true );
if ( ! is_array( $content ) ) {
	fwrite( STDERR, "could not parse {$argv[1]}\n" );
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

// The 0 flags are load-bearing: this must byte-match Composer's own JsonFile::encode( $c, 0 ),
// or the hash differs and every install silently falls back to `composer update`.
// phpcs:ignore Jetpack.Functions.JsonEncodeFlags.ZeroFound
echo hash( 'md5', json_encode( $relevant, 0 ) );
