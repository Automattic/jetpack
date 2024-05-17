<?php
/**
 * Example usage script.
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
 */

require dirname( __DIR__ ) . '/vendor/autoload.php';

$base_path = dirname( dirname( dirname( __DIR__ ) ) );

$jetpack_75_path    = $base_path;
$jetpack_74_path    = '/path/to/Downloads/jetpack';
$external_repo_path = '/path/to/workspace/a8c/some-repo';
$jetpack_exclude    = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

echo "Scan trunk declarations\n";
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
$invocations->scan( $external_repo_path );

echo "Generate warnings\n";
$warnings = new Automattic\Jetpack\Analyzer\Warnings();
$warnings->generate( $invocations, $differences );
$warnings->output();

// phpcs:enable
