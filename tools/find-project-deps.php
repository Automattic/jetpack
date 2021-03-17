#!/usr/bin/env php
<?php
/**
 * Function to collect project direct dependencies.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions

/**
 * Collect project dependencies.
 *
 * @return string[][] Key is the project slug, value is an array of slugs depended on.
 */
function get_dependencies() {
	$base = dirname( __DIR__ );
	$l    = strlen( $base );

	// Collect all project slugs.
	$output = array(
		'monorepo' => array(),
	);
	foreach ( glob( "$base/projects/*/*/composer.json" ) as $file ) {
		$output[ substr( $file, $l + 10, -14 ) ] = array();
	}

	// Collect package name→slug mappings.
	$package_map = array();
	foreach ( glob( "$base/projects/packages/*/composer.json" ) as $file ) {
		$json = json_decode( file_get_contents( $file ), true );
		if ( isset( $json['name'] ) ) {
			$package_map[ $json['name'] ] = substr( $file, $l + 10, -14 );
		}
	}

	// Collect js-package name→slug mappings.
	$js_package_map = array();
	foreach ( glob( "$base/projects/js-packages/*/package.json" ) as $file ) {
		$json = json_decode( file_get_contents( $file ), true );
		if ( isset( $json['name'] ) ) {
			$js_package_map[ $json['name'] ] = substr( $file, $l + 10, -14 );
		}
	}

	// Collect dependencies.
	foreach ( $output as $slug => &$deps ) {
		$path = 'monorepo' === $slug ? $base : "$base/projects/$slug";

		// Collect composer require, require-dev, and .extra.dependencies.
		$json = json_decode( file_get_contents( "$path/composer.json" ), true );
		foreach ( $package_map as $package => $p ) {
			if ( isset( $json['require'][ $package ] ) || isset( $json['require-dev'][ $package ] ) ) {
				$deps[] = $p;
			}
		}
		if ( isset( $json['extra']['dependencies'] ) ) {
			$deps = array_merge( $deps, $json['extra']['dependencies'] );
		}

		// Collect yarn dependencies and devDependencies.
		if ( file_exists( "$path/package.json" ) ) {
			$json = json_decode( file_get_contents( "$path/package.json" ), true );
			foreach ( $js_package_map as $package => $p ) {
				if ( isset( $json['dependencies'][ $package ] ) || isset( $json['devDependencies'][ $package ] ) ) {
					$deps[] = $p;
				}
			}
		}

		// Finalize.
		$deps = array_unique( $deps );
		sort( $deps );
	}

	ksort( $output );
	return $output;
}

echo json_encode( get_dependencies(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "\n";
