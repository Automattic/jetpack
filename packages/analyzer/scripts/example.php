<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

use Automattic\Jetpack\Analyzer\Analyzer as PHP_Analyzer;

$base_path             = dirname( dirname( dirname( __DIR__ ) ) );
$example_external_path = dirname( __DIR__ ) . '/data/example-external.php';

$jp74_base_path = '/Users/dan/Downloads/jetpack';

// a place for data
$data_path = '/Users/dan/Downloads/';

// echo "Analyzing $file_path\n";

// analyze the Jetpack code base
$analyzer = new PHP_Analyzer( $base_path );

// analyze a single file
// $analyzer->file( $base_path . '/class.jetpack.php' );
// return;

$analyzer->scan();
$analyzer->save_declarations( $data_path . 'master.csv' );
// $analyzer->print_declarations();
// return;
// load the output into another analyzer
echo "*** Jetpack master ***\n";
$other_analyzer = new PHP_Analyzer( $base_path );
$other_analyzer->load_declarations( $data_path . 'master.csv' );
// $other_analyzer->print_declarations();

// exit;

// analyze a separate code base
echo "*** Jetpack 7.4 ***\n";
$jp74_analyzer = new PHP_Analyzer( $jp74_base_path );
$jp74_analyzer->scan();
// $jp74_analyzer->save_declarations( $data_path . 'jp74.csv');
// $jp74_analyzer->print_declarations();

$differences = $other_analyzer->find_differences( $jp74_analyzer );

foreach ( $differences->get_differences() as $difference ) {
	echo $difference->to_csv() . "\n";
}

echo "*** Generating compatibility checker\n";

$other_analyzer->check_file_compatibility( $example_external_path );

echo "Done\n";
