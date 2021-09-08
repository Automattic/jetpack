<?php
/**
 * Script to be directly executed to output the latest version of WP.
 *
 * @package automattic/jetpack
 *
 * Disable WordPress-related coding standards; this script does not run within WP.
 * @phpcs:disable WordPress.Security
 * @phpcs:disable WordPress.WP.AlternativeFunctions
 */

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, 'https://api.wordpress.org/core/version-check/1.7/' );

// Set so curl_exec returns the result instead of outputting it.
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );

// Get the response and close the channel.
$response = curl_exec( $ch );
curl_close( $ch );

$versions = json_decode( $response );
$versions = $versions->offers;

/**
 * Sorting available WordPress offers by version number.
 *
 * @param object $first WordPress update offer object.
 * @param object $second WordPress update offer object.
 *
 * @return bool|int
 */
function offer_version_sort( $first, $second ) {
	return version_compare( $second->version, $first->version );
}

uasort( $versions, 'offer_version_sort' );

$version_stack = array();

foreach ( $versions as $offer ) {
	list( $major, $minor ) = explode( '.', $offer->version );

	$base = $major . '.' . $minor;

	if (
		! isset( $version_stack[ $base ] )
		|| version_compare( $offer->version, $version_stack[ $base ], '>' ) ) {

		// There is no version like this yet or there is a newer patch to this major version.
		$version_stack[ $base ] = $offer->version;
	}

	if ( count( $version_stack ) === 2 ) {
		break;
	}
}

$wp_versions = array_values( $version_stack );

if ( empty( $argv[1] ) ) {
	print $wp_versions[0] . "\n";
} elseif ( '--previous' === $argv[1] ) {
	print $wp_versions[1] . "\n";
} else {
	die(
		'Unknown argument: ' . $argv[1] . "\n"
		. "Use with no arguments to get the latest stable WordPress version, or use `--previous' to get the previous stable major release.\n"
	);
}
