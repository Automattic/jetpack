<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

$base_path             = dirname( dirname( dirname( __DIR__ ) ) );
$external_base_path    = dirname( __DIR__ ) . '/data';

// a place for data
$data_path = '/Users/dan/Downloads/';

// echo "Analyzing $file_path\n";

// analyze the Jetpack code base
// $analyzer = new PHP_Analyzer( $base_path );

// analyze a single file
echo "*** File declarations\n";
$file_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$file_declarations->scan( $base_path . '/class.jetpack.php' );
// $file_declarations->print();

// scan a whole directory
echo "*** Directory declarations\n";
$dir_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );
$dir_declarations->scan( $base_path, $exclude );
$dir_declarations->save( $data_path . 'master.csv' );
// $dir_declarations->print();

// test loading the output into another analyzer
echo "*** Load Jetpack master declarations ***\n";
$master_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$master_declarations->load( $data_path . 'master.csv' );
// $master_declarations->print();

// analyze a separate code base
$jp74_base_path = '/Users/dan/Downloads/jetpack';
echo "*** Jetpack 7.4 ***\n";
// $jp74_analyzer    = new PHP_Analyzer( $jp74_base_path );
$jp74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jp74_declarations->scan( $jp74_base_path, $exclude );
$jp74_declarations->save( $data_path . 'jp74.csv');
// $jp74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
// $jp74_declarations->load( $data_path . 'jp74.csv');
// $jp74_declarations->print();

echo "*** Finding differences between the two versions\n";
$differences = new Automattic\Jetpack\Analyzer\Differences();
$differences->find( $master_declarations, $jp74_declarations );

foreach ( $differences->get() as $difference ) {
	echo implode( ', ', $difference->to_csv_array() ) . "\n";
}

echo "*** Checking compatibility of single external file\n";
$warnings = $differences->check_file_compatibility( $external_base_path . '/example-external.php', $external_base_path );

$warnings->print();

echo "*** Done\n";
