<?php

$commit = getenv( 'TRAVIS_COMMIT' );
$repo   = getenv( 'TRAVIS_REPO_SLUG' );
// `TRAVIS_BRANCH` set to `master for PRs, so lets use `TRAVIS_PULL_REQUEST` in such cases (not sure we actually need this)
$branch = 'master' === getenv( 'TRAVIS_BRANCH' ) ? getenv( 'TRAVIS_PULL_REQUEST' ) : getenv( 'TRAVIS_BRANCH' );
$pr     = getenv( 'TRAVIS_PULL_REQUEST' );

// Remove anything which isn't a word, whitespace, number
// or any of the following caracters -_~,;[]().
$sanitized_branch = mb_ereg_replace( "([^\w\s\d\-_~,;\[\]\(\).])", '_', $branch );

if (
	'master' !== $branch
	&& stripos( $branch, 'branch-' ) !== 0
	&& stripos( $branch, 'feature/' ) !== 0
	&& ! $pr
) {
	// $cmd = 'mv ' . $argv[1] . ' ' . dirname( $argv[1] ) . '/processed-commit.txt';
	// system( $cmd );
	error_log( 'Did not process: because it isn\'t master, a release branch, or a PR.');
	exit;
}

echo $commit . "\n";
echo $repo . "\n";
echo $branch . "\n";
echo $pr . "\n";
echo $sanitized_branch . "\n";

define( 'BUILDER_DIR', __DIR__ );
define( 'TEMP_DIR', '/tmp' );

$destination_path = BUILDER_DIR . '/target';
$build_path       = TEMP_DIR . '/jetpack';
$cmd              = array();

// Move into the Jetpack repo directory & build.
$cmd[] = './tools/build-jetpack.sh -d -b '
	. $branch . ' '
	. $repo . ' '
	. $build_path;

if ( ! file_exists( $destination_path ) ) {
	$cmd[] = "mkdir $destination_path";
}

// Grab version info for destination.
$cmd[] = "mv $build_path/version.txt $destination_path";

// Done in one command so that the working dir persists.
$cmd[] = 'cd /tmp && '
	. 'mv jetpack jetpack-dev && '
	. 'zip -9r jetpack-dev.zip jetpack-dev && '
	. 'mv /tmp/jetpack-dev.zip ' . $destination_path;

foreach ( $cmd as $c ) {
	echo $c . "\n";
	exec( $c, $output, $exit );
	if ( 0 !== $exit ) {
	// if ( 0 !== 0 ) {
		echo( 'Something went wrong: ' );
		echo( 'Command `' . $c . '\' exited with code ' . $exit );

		exit;
	}
}

$version = trim( file_get_contents( $destination_path . '/version.txt' ) );

// Process the JSON file.
// $branches = (object) json_decode( file_get_contents( PUBLIC_DIR . '/jetpack-branches.json' ) );

$n = array(
	'branch'       => $branch,
	'commit'       => $commit,
	'download_url' => 'https://betadownload.jetpack.me/branches/' . $sanitized_branch . '/jetpack-dev.zip',
	'update_date'  => date( 'Y-m-d H:i:s' ),
	'version'      => $version,
	'pr'           => $pr,
);


print_r( $n );
echo "\n";

// if ( 'master' === $branch ) {
// 	$branches->{ $sanitized_branch } = $n;
// } elseif ( 1 === preg_match( '/^branch-\d+\.\d+$/', $branch ) ) {
// 	$branches->rc = $n;
// } elseif ( $pr ) {
// 	$branches->pr->{ $sanitized_branch } = $n;
// }

// file_put_contents(
// 	PUBLIC_DIR . '/jetpack-branches.json',
// 	json_encode( (object) $branches )
// );

file_put_contents(
	$destination_path . '/build-info.json',
	json_encode(
		(object) array(
			'sanitized_path' => $sanitized_branch,
			'repo'           => $repo,
			'commit'         => $commit,
			'branch'         => $branch,
			'pr'             => $pr,
			'running'        => date( 'Y-m-d H:i:s' ),
			'version'        => $version,
			'path'           => $destination_path,
		)
	)
);
