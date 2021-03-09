<?php
/**
 * A script to scan the entire WordPress.org plugins directory for breaking changes between
 * two different versions of Jetpack.
 *
 * @package automattic/jetpack-analyzer
 */

/**
 * This script is meant to run outside of typical WordPress environments and only by knowledgeable folks.
 * Disabling some phpcs scripts:
 *
 * phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
 * phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
 * phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
 *
 * To prepare for scanning Jetpack against all plugins of WordPress.org directory you need to
 * use the slurper tool.
 *
 * @see https://github.com/markjaquith/WordPress-Plugin-Directory-Slurper
 *
 * Note: the full repository checkout takes a lot of disk space (around 70Gb) and takes a long time
 * to finish for the first time. After you're done, you can use the path to the `plugins` folder
 * inside the slurper checkout as the value for the `$slurper_path` variable below.
 * The old and new Jetpack path are pretty straightforward: the new path is the path after changes were
 * made, the old - before changes were made.
 * After running this script you'll get a csv file in the `scipts` folder for every plugin that is
 * affected by the changes.
 */

require dirname( __DIR__ ) . '/vendor/autoload.php';

$jetpack_new_path = '/path/to/new/jetpack';
$jetpack_old_path = '/path/to/old/jetpack';
$slurper_path     = '/path/to/slurper/plugins';
$jetpack_exclude  = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

echo "Scanning new declarations\n";
$jetpack_new_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_new_declarations->scan( $jetpack_new_path, $jetpack_exclude );

echo "Scanning old declarations\n";
$jetpack_old_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_old_declarations->scan( $jetpack_old_path, $jetpack_exclude );

echo "Looking for differences\n";
$differences = new Automattic\Jetpack\Analyzer\Differences();
$differences->find( $jetpack_new_declarations, $jetpack_old_declarations, $jetpack_new_path );

foreach ( glob( $slurper_path . '/*' ) as $folder_name ) {
	echo "Looking for invocations in:\n${folder_name}\n\n";
	$invocations = new Automattic\Jetpack\Analyzer\Invocations();
	$invocations->scan( $folder_name );

	echo "Generate warnings\n";
	$warnings = new Automattic\Jetpack\Analyzer\Warnings();
	$warnings->generate( $invocations, $differences );
	$warnings->output();
	$warnings->save( __DIR__ . '/' . basename( $folder_name ) . '.csv', false );
}

// phpcs:enable
