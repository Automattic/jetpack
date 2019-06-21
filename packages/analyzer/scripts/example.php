<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

use Automattic\Jetpack\Analyzer\Analyzer as PHP_Analyzer;

$base_path = dirname( dirname( dirname( __DIR__ ) ) );
$file_path = $base_path . '/class.jetpack.php';

echo "Analyzing $file_path\n";

$analyzer = new PHP_Analyzer( $base_path );
$analyzer->file( $file_path );

echo "Done\n";
