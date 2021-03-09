<?php
/**
 * This script can be used as such to check some codebase against latest changes in Jetpack plugin.
 *
 * It only pulls from wp.org svn tags. It defaults to use `trunk` as the latest version, and
 * finds the next non-beta version as latest stable.
 *
 * It requires one parameter, which is the path to the code you would like to analyze against. The other
 * two are optional, and probably a bit gratuitous :)
 *
 * `php jetpack-svn.php path/to/your/plugin/code`
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

// Args.
$external_repo_path = isset( $argv[1] ) ? $argv[1] : '/path/to/workspace/a8c/some-repo';
$from_version       = isset( $argv[2] ) ? $argv[2] : ''; // Defaults to latest stable version in wp.org svn.
$to_version         = isset( $argv[3] ) ? $argv[3] : 'trunk';

if ( ! file_exists( $external_repo_path ) ) {
	echo "Need a path of another codebase to compare Jetpack changes against.\n";
	exit;
}

// tmp paths.
$tmp_path             = dirname( __DIR__ ) . '/data/tmp';
$to_path              = $tmp_path . '/jetpack-to';
$from_path            = $tmp_path . '/jetpack-from';
$jetpack_version_to   = "$to_path/jetpack";
$jetpack_version_from = "$from_path/jetpack";

// Make tmp directories.
exec( "mkdir -p $tmp_path $to_path $from_path" );

if ( empty( $from_version ) ) {
	// Get latest stable version in svn.
	$jetpack_info = json_decode( file_get_contents( 'https://api.wordpress.org/plugins/info/1.0/jetpack.json' ) );
	$org_versions = array_reverse( (array) $jetpack_info->versions );
	foreach ( $org_versions as $version => $zip_path ) {
		if ( ! preg_match( '/[a-z]/i', $version ) ) {
			$from_version = $version;
			break;
		}
	}
}

// Download and unzip "from" version.
if ( ! file_exists( $jetpack_version_from ) ) {
	echo "Downloading {$org_versions[ $from_version ]} to $jetpack_version_from...\n";
	exec( "wget -O $from_path/$from_version.zip {$org_versions[ $from_version ]}; unzip $from_path/$from_version.zip -d $from_path; rm $from_path/$from_version.zip" );
}

// Download and unzip "to" version.
if ( ! file_exists( $jetpack_version_to ) ) {
	echo "Downloading {$org_versions[ $to_version ]} to $jetpack_version_to...\n";
	exec( "wget -O $to_path/$to_version.zip {$org_versions[ $to_version ]}; unzip $to_path/$to_version.zip -d $to_path; rm $to_path/$to_version.zip" );
}

$jetpack_exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

echo "Scan Jetpack's $to_version declarations\n";
$jetpack_to_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_to_declarations->scan( $jetpack_version_to, $jetpack_exclude );

echo "Scan Jetpack's $from_version declarations\n";
$jetpack_from_declarations = new Automattic\Jetpack\Analyzer\Declarations();
$jetpack_from_declarations->scan( $jetpack_version_from, $jetpack_exclude );

echo "Find differences\n";
$differences = new Automattic\Jetpack\Analyzer\Differences();
$differences->find( $jetpack_to_declarations, $jetpack_from_declarations );

echo "Find invocations in $external_repo_path\n";
$invocations = new Automattic\Jetpack\Analyzer\Invocations();
$invocations->scan( $external_repo_path );

echo "Generate warnings for $external_repo_path\n";
$warnings = new Automattic\Jetpack\Analyzer\Warnings();
$warnings->generate( $invocations, $differences );
$warnings->output();

echo "Done!\n";

echo "Cleaning up...\n";
exec( "rm -rf $tmp_path" );

// phpcs:enable
