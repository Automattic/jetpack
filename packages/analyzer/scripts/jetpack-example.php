<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

$base_path = dirname( dirname( dirname( __DIR__ ) ) );

$jetpack_75_path = $base_path;
$jetpack_74_path = '/Users/dan/Downloads/jetpack';
$wpcomsh_path = '/Users/dan/workspace/a8c/wpcomsh';
$jetpack_exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

echo "Scan master declarations\n";
$jetpack_75_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_75_declarations->scan( $jetpack_75_path, $jetpack_exclude );

echo "Scan 7.4 declarations\n";
$jetpack_74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_74_declarations->scan( $jetpack_74_path, $jetpack_exclude );

echo "Find differences\n";
$differences = new Automattic\Jetpack\Analyzer\Differences();
$differences->find( $jetpack_75_declarations, $jetpack_74_declarations );

echo "Find invocations\n";
$invocations = new Automattic\Jetpack\Analyzer\Invocations();
$invocations->scan( $wpcomsh_path );

echo "Generate warnings\n";
$warnings = new Automattic\Jetpack\Analyzer\Warnings();
$warnings->generate( $invocations, $differences );
$warnings->print();
