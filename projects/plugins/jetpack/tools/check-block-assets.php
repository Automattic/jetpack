#!/usr/bin/env php
<?php
/**
 * Script to check blocks' view.asset.php for unexpected dependencies.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped -- This is not WordPress code.

/**
 * Non-WP dependencies to check for.
 *
 * @var string[]
 */
$bad_deps = array(
	'jquery',
	'lodash',
	'lodash-es',
	'moment',
	'react',
	'react-dom',
);

/**
 * WP dependencies to allow.
 *
 * @var string[]
 */
$ok_wp_deps = array(
	'wp-a11y',
	'wp-api-fetch',
	'wp-autop',
	'wp-blob',
	'wp-block-serialization-default-parser',
	'wp-block-serialization-spec-parser',
	'wp-deprecated',
	'wp-dom',
	'wp-dom-ready',
	'wp-escape-html',
	'wp-experiments',
	'wp-hooks',
	'wp-html-entities',
	'wp-i18n',
	'wp-is-shallow-equal',
	'wp-polyfill',
	'wp-preferences-persistence',
	'wp-priority-queue',
	'wp-redux-routine',
	'wp-shortcode',
	'wp-token-list',
	'wp-url',
	'wp-warning',
);

/**
 * Blocks allowed to have extra dependencies.
 *
 * @var string[][] Keys are block names, value is an array of dependencies to not complain about.
 */
$allowed = array(
	'ai-chat'        => array(
		'react',
		'react-dom',
		'wp-components',
		'wp-compose',
		'wp-element',
	),
	'podcast-player' => array(
		'lodash',
		'react',
		'react-dom',
		'wp-compose',
		'wp-data',
		'wp-element',
		'wp-primitives',
	),
	'story'          => array(
		'lodash',
		'react',
		'react-dom',
		'wp-compose',
		'wp-data',
		'wp-element',
		'wp-keycodes',
		'wp-plugins',
		'wp-primitives',
	),
);

chdir( dirname( __DIR__ ) );
$base   = 'projects/plugins/jetpack/';
$script = 'projects/plugins/jetpack/tools/check-block-assets.php';
$issues = array( $script => array() );

$tmp = $bad_deps;
sort( $bad_deps );
if ( $tmp !== $bad_deps ) {
	$issues[ $script ][] = 'The `$bad_deps` array is not sorted. Please sort it.';
}
$tmp = $ok_wp_deps;
sort( $ok_wp_deps );
if ( $tmp !== $ok_wp_deps ) {
	$issues[ $script ][] = 'The `$ok_wp_deps` array is not sorted. Please sort it.';
}
$tmp = array_keys( $allowed );
ksort( $allowed );
if ( $tmp !== array_keys( $allowed ) ) {
	$issues[ $script ][] = 'The `$allowed` array is not sorted. Please sort it.';
}
foreach ( $allowed as $k => $v ) {
	$tmp = $v;
	sort( $v );
	if ( $tmp !== $v ) {
		$issues[ $script ][] = "The `\$allowed['$k']` array is not sorted. Please sort it.";
	}
}

$bad_deps   = array_fill_keys( $bad_deps, true );
$ok_wp_deps = array_fill_keys( $ok_wp_deps, true );
$iter       = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( '_inc/blocks/', FilesystemIterator::SKIP_DOTS | FilesystemIterator::CURRENT_AS_PATHNAME ) );
foreach ( $iter as $file ) {
	if ( ! str_ends_with( $file, '/view.asset.php' ) ) {
		continue;
	}
	$block = substr( $file, 12, -15 );

	$data  = require $file;
	$allow = isset( $allowed[ $block ] ) ? array_fill_keys( $allowed[ $block ], true ) : array();
	unset( $allowed[ $block ] );
	foreach ( $data['dependencies'] as $dep ) {
		if ( isset( $bad_deps[ $dep ] ) || str_starts_with( $dep, 'wp-' ) && ! isset( $ok_wp_deps[ $dep ] ) ) {
			if ( isset( $allow[ $dep ] ) ) {
				unset( $allow[ $dep ] );
			} else {
				$issues[ $base . $file ][] = "Dependency `$dep` should not be used by the $block block's view.js.";
			}
		}
	}
	if ( ! empty( $allow ) ) {
		$issues[ $script ][] = sprintf( 'Allowlist data for the %s block lists unneeded dependencies: %s.', $block, implode( ', ', array_keys( $allow ) ) );
	}
}

if ( ! empty( $allowed ) ) {
	foreach ( $allowed as $block => $dummy ) {
		$issues[ $script ][] = "A block \"$block\" has allowlist data, but no view script for the block was found.";
	}
}

if ( empty( $issues[ $script ] ) ) {
	unset( $issues[ $script ] );
}
if ( ! empty( $issues ) ) {
	echo "\n\n\e[1mBlock view script dependency check detected issues!\e[0m\n";
	foreach ( $issues as $file => $msgs ) {
		echo "\n\e[1mIn $file\e[0m\n" . implode( "\n", $msgs ) . "\n";
	}
	echo "\n\e[32mDependencies allowed may be adjusted by editing the arrays at the top of $script.\e[0m\n\n";
	exit( 1 );
}
