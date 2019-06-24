<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

use Automattic\Jetpack\Analyzer\Analyzer as PHP_Analyzer;

$base_path             = dirname( dirname( dirname( __DIR__ ) ) );
$example_external_path = dirname( __DIR__ ) . '/data/example-external.php';

// a place for data
$data_path = '/Users/dan/Downloads/';

// echo "Analyzing $file_path\n";

// analyze the Jetpack code base
$analyzer = new PHP_Analyzer( $base_path );

// analyze a single file
$file_declarations = $analyzer->file( $base_path . '/class.jetpack.php' );
// $file_declarations->print();

// scan a whole directory
$declarations = $analyzer->scan();
$declarations->save( $data_path . 'master.csv' );
// $declarations->print();

// test loading the output into another analyzer
echo "*** Jetpack master ***\n";
$other_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$other_declarations->load( $data_path . 'master.csv' );
// $other_declarations->print();

// analyze a separate code base
$jp74_base_path = '/Users/dan/Downloads/jetpack';
echo "*** Jetpack 7.4 ***\n";
$jp74_analyzer    = new PHP_Analyzer( $jp74_base_path );
$jp74_declarations = $jp74_analyzer->scan();
$jp74_declarations->save( $data_path . 'jp74.csv');
// $jp74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
// $jp74_declarations->load( $data_path . 'jp74.csv');
// $jp74_declarations->print();

echo "*** Finding differences between the two versions\n";
$differences = $other_declarations->find_differences( $jp74_declarations );

foreach ( $differences->get() as $difference ) {
	echo implode( ', ', $difference->to_csv_array() ) . "\n";
}

echo "*** Checking compatibility of external file\n";
$warnings = $differences->check_file_compatibility( $example_external_path );

$warnings->print();

echo "*** Done\n";
