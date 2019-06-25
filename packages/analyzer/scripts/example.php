<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

$base_path             = dirname( dirname( dirname( __DIR__ ) ) );
$external_base_path    = dirname( __DIR__ ) . '/data';

// a place for exported data
$data_path = '/Users/dan/Downloads/';

// analyze a single file
// echo "*** File declarations\n";
// $file_declarations = new Automattic\Jetpack\Analyzer\Declarations();
// $file_declarations->scan( $base_path . '/class.jetpack.php' );
// $file_declarations->print();

// scan a whole directory
echo "*** Find Jetpack master declarations\n";
$dir_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );
$dir_declarations->scan( $base_path, $jetpack_exclude );
$dir_declarations->save( $data_path . 'master.csv' );
// $dir_declarations->print();

// test loading the output into another analyzer
echo "*** Load Jetpack master declarations\n";
$master_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$master_declarations->load( $data_path . 'master.csv' );
// $master_declarations->print();

// analyze a separate code base
$jp74_base_path = '/Users/dan/Downloads/jetpack';
echo "*** Find Jetpack 7.4 declarations\n";
$jp74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jp74_declarations->scan( $jp74_base_path, $jetpack_exclude );
$jp74_declarations->save( $data_path . 'jp74.csv');
$jp74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jp74_declarations->load( $data_path . 'jp74.csv');
// $jp74_declarations->print();

echo "*** Finding differences between the two versions\n";
$differences = new Automattic\Jetpack\Analyzer\Differences();
$differences->find( $master_declarations, $jp74_declarations );
// $differences->print();
// $differences->save( $data_path . 'differences.csv' );

echo "*** Checking compatibility of single external file\n";
$invocations = new Automattic\Jetpack\Analyzer\Invocations();
$wpcomsh_path = '/Users/dan/workspace/a8c/wpcomsh';
$invocations->scan( $external_base_path . '/example-external.php' );
// $invocations->scan( $wpcomsh_path, array( '.git', '.gitmodules', 'assets' ) );
// $invocations->print();

$warnings = new Automattic\Jetpack\Analyzer\Warnings();
$warnings->generate( $invocations, $differences );
$warnings->print();

echo "*** Done\n";
