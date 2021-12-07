<?php

require dirname( __DIR__ ) . '/vendor/autoload.php';

// ini_set( 'memory_limit', '512M' );

$excludes = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

// $jetpack_new_path = '/Users/brbrr/Developer/a8c/jetpack/projects/plugins/jetpack';
// $jetpack_old_path = '/Users/brbrr/Developer/a8c/jetpack/projects/packages/analyzer/jetpack-production';
$folder_name = $argv[1];

$slurper_path = dirname( __DIR__ ) . '/slurper/plugins';

// $jetpack_new_path = '/Users/brbrr/Developer/a8c/jetpack/projects/plugins/jetpack';
$jetpack_new_path = '/var/www/html/wp-content/plugins/jetpack';
$jetpack_old_path = $slurper_path . '/jetpack-production';
$differences      = Automattic\Jetpack\Analyzer\Scripts::get_differences( $jetpack_new_path, $jetpack_old_path );

Automattic\Jetpack\Analyzer\Scripts::get_warnings( $folder_name, $differences, $excludes );
echo 'Done with ' . basename( $folder_name ) . "\n";

// phpcs:enable
