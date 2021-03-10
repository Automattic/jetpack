#!/usr/bin/env php
<?php
/**
 * Tool to list projects in dependency order for build.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DiscouragedPHPFunctions, WordPress.Security.EscapeOutput.OutputNotEscaped

ob_start();
require_once __DIR__ . '/find-project-deps.php';
ob_end_clean();

$debug_color = getenv( 'CI' ) ? '34' : '1;30';

/**
 * Test if a variable is falsey.
 *
 * @param mixed $v Variable to test.
 * @return bool
 */
function is_falsey( $v ) {
	return ! $v;
}

// We look for packages that have no outgoing dependencies, collect then and remove them from the dependency graph, then repeat.
// This is basically Kahn's algorithm with some steps interleaved.
$deps = get_dependencies();
unset( $deps['monorepo'] );
$output = array();
while ( $deps ) {
	$ok = array_keys( array_filter( $deps, 'is_falsey' ) );
	if ( ! $ok ) {
		if ( getenv( 'CI' ) ) {
			$lf = '%%0A';
			fprintf( STDERR, '::error::The dependency graph contains a cycle!' );
			$end = "\n";
		} else {
			$lf = "\n";
			fprintf( STDERR, "\e[1;37;41mThe dependency graph contains a cycle!\e[0m" );
			$end = '';
		}
		fprintf( STDERR, " Involved dependencies are:${lf}" );
		$l = 0;
		foreach ( $deps as $k => $v ) {
			$l = max( $l, strlen( $k ) );
		}
		foreach ( $deps as $k => $v ) {
			fprintf( STDERR, "  %${l}s -> %s${lf}", $k, implode( ' ', $v ) );
		}
		fprintf( STDERR, $end );
		exit( 1 );
	}
	fprintf( STDERR, "\e[${debug_color}mReady at this step: %s\e[0m\n", implode( ' ', $ok ) );

	$output = array_merge( $output, $ok );
	foreach ( $ok as $slug ) {
		unset( $deps[ $slug ] );
	}
	foreach ( $deps as &$v ) {
		$v = array_diff( $v, $ok );
	}
	unset( $v );
}

echo implode( "\n", $output ) . "\n";
