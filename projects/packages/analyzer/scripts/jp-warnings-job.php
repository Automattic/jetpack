<?php

require dirname( __DIR__ ) . '/vendor/autoload.php';

// ini_set( 'memory_limit', '512M' );

$folder_name = $argv[1];
$excludes = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

$differences      = Automattic\Jetpack\Analyzer\Scripts::load_differences();

Automattic\Jetpack\Analyzer\Scripts::get_warnings( $folder_name, $differences, $excludes );

// phpcs:enable
