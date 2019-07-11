<?php

require dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

$base_path = dirname( dirname( dirname( __DIR__ ) ) );

$jetpack_75_path    = $base_path;
$jetpack_74_path    = '/Users/dan/Downloads/jetpack';
$external_repo_path = '/Users/dan/workspace/a8c/jetpack-compat-check';
$jetpack_exclude    = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

echo "Scan master declarations\n";
$jetpack_75_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_75_declarations->scan( $jetpack_75_path, $jetpack_exclude );

echo "Scan 7.4 declarations\n";
$jetpack_74_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_74_declarations->scan( $jetpack_74_path, $jetpack_exclude );

echo "Find differences\n";
$differences = new Automattic\Jetpack\Analyzer\Differences();
$differences->find( $jetpack_75_declarations, $jetpack_74_declarations, $base_path );

$repos = glob( $external_repo_path . '/*' , GLOB_ONLYDIR );

$warnings = new Automattic\Jetpack\Analyzer\Warnings();
$dependencies = new Automattic\Jetpack\Analyzer\Dependencies();

foreach( $repos as $repo_path ) {
	$repo_name = basename( $repo_path );

	if ( 'jetpack-sync-expansion-pack' !== $repo_name ) {
		continue;
	}

	echo "\n*** Find invocations for $repo_name\n";
	$invocations = new Automattic\Jetpack\Analyzer\Invocations();
	$invocations->scan( $repo_path, array( '.git', 'node_modules' ) );

	echo "\n*** Generate dependencies for $repo_name against Jetpack 7.4\n";
	$dependencies->generate( $invocations, $jetpack_74_declarations, $repo_path );

	echo "\n*** Generate warnings for $repo_name\n";
	$warnings->generate( $invocations, $differences );
	$warnings->output();
	$warnings->save( "/Users/dan/Downloads/$repo_name.csv" );
}

echo "\n*** List of dependencies\n";
$dependencies->output();

echo "\n*** Summary of dependencies by declaration\n";
echo $dependencies->declaration_summary();

echo "\n*** Summary of dependencies by external file\n";
echo $dependencies->external_file_summary();

echo "\n*** All warnings\n";
$warnings->output();

echo "\n*** Summary of warnings\n";
echo $warnings->summary();

echo "Done\n";


