#!/usr/bin/env php
<?php
/**
 * Script to output summary data from a PHPUnit raw config.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanAccessMethodInternal -- Nothing much we can do to avoid it.

use SebastianBergmann\CodeCoverage\Node\File;

if ( $argc < 2 ) {
	fprintf( STDERR, "USAGE: $0 <php.cov> <monorepo-root-path>\n" );
	exit( 1 );
}

require __DIR__ . '/vendor/autoload.php';
$cov    = require $argv[1];
$report = $cov->getReport();

foreach ( $report as $item ) {
	if ( ! $item instanceof File ) {
		continue;
	}

	$path = $item->pathAsString();

	fputcsv(
		STDOUT,
		array( $path, $item->numberOfExecutableLines() + $item->numberOfExecutableBranches(), $item->numberOfExecutedLines() + $item->numberOfExecutedBranches() ),
		"\t",
		'"',
		''
	);
}
