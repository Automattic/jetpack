#!/usr/bin/env php
<?php
/**
 * Tool to list whether projects have been touched so as to need a changelog entry.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DiscouragedPHPFunctions, WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.GlobalVariablesOverride

chdir( __DIR__ . '/../../' );

if ( array_search( '--debug', $argv, true ) !== false ) {
	/**
	 * Output debug info.
	 *
	 * @param array ...$args Arguments to printf. A newline is automatically appended.
	 */
	function debug( ...$args ) {
		if ( getenv( 'CI' ) ) {
			$args[0] = "\e[34m${args[0]}\e[0m\n";
		} else {
			$args[0] = "\e[1;30m${args[0]}\e[0m\n";
		}
		fprintf( STDERR, ...$args );
	}
} else {
	/**
	 * Do not output debug info.
	 */
	function debug() {
	}
}

// Find projects that use changelogger, and read the relevant config.
$changelogger_projects = array();
foreach ( glob( 'projects/*/*/composer.json' ) as $file ) {
	$data = json_decode( file_get_contents( $file ), true );
	if ( 'projects/packages/changelogger/composer.json' !== $file &&
		! isset( $data['require']['automattic/jetpack-changelogger'] ) &&
		! isset( $data['require-dev']['automattic/jetpack-changelogger'] )
	) {
		continue;
	}
	$data  = isset( $data['extra']['changelogger'] ) ? $data['extra']['changelogger'] : array();
	$data += array(
		'changelog'   => 'CHANGELOG.md',
		'changes-dir' => 'changelog',
	);
	$changelogger_projects[ substr( $file, 9, -14 ) ] = $data;
}

// Get the event data.
$event = getenv( 'GITHUB_EVENT_NAME' );
if ( 'pull_request' !== $event ) {
	fprintf( STDERR, "Unsupported GITHUB_EVENT_NAME \"%s\"\n", $event );
	exit( 1 );
}
$event_path = getenv( 'GITHUB_EVENT_PATH' );
if ( ! $event_path || ! file_exists( $event_path ) ) {
	fprintf( STDERR, "Missing GITHUB_EVENT_PATH for pull_request event\n" );
	exit( 1 );
}
$event = json_decode( file_get_contents( $event_path ) );
if ( ! isset( $event->pull_request->base->sha ) || ! isset( $event->pull_request->head->sha ) ) {
	fprintf( STDERR, "Missing pull_request data in GITHUB_EVENT_PATH file\n" );
	exit( 1 );
}
$base = $event->pull_request->base->sha;
$head = $event->pull_request->head->sha;

// Process the diff.
debug( 'Checking diff from %s...%s.', $base, $head );
$pipes = null;
$p     = proc_open(
	sprintf( 'git -c core.quotepath=off diff --no-renames --name-only %s...%s', escapeshellarg( $base ), escapeshellarg( $head ) ),
	array( array( 'pipe', 'r' ), array( 'pipe', 'w' ), STDERR ),
	$pipes
);
if ( ! $p ) {
	exit( 1 );
}
fclose( $pipes[0] );

$ok_projects      = array();
$touched_projects = array();
// phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
while ( ( $line = fgets( $pipes[1] ) ) ) {
	$line  = trim( $line );
	$parts = explode( '/', $line, 5 );
	if ( count( $parts ) < 4 || 'projects' !== $parts[0] ) {
		debug( 'Ignoring non-project file %s.', $line );
		continue;
	}
	$slug = "{$parts[1]}/{$parts[2]}";
	if ( ! isset( $changelogger_projects[ $slug ] ) ) {
		debug( 'Ignoring file %s, project %s does not use changelogger.', $line, $slug );
		continue;
	}
	if ( $parts[3] === $changelogger_projects[ $slug ]['changelog'] ) {
		debug( 'Ignoring changelog file %s.', $line );
		continue;
	}
	if ( $parts[3] === $changelogger_projects[ $slug ]['changes-dir'] ) {
		if ( '.' === $parts[4][0] ) {
			debug( 'Ignoring changes dir dotfile %s.', $line );
		} else {
			debug( 'PR touches file %s, marking %s as having a change file.', $line, $slug );
			$ok_projects[ $slug ] = true;
		}
		continue;
	}

	debug( 'PR touches file %s, marking %s as touched.', $line, $slug );
	if ( ! isset( $touched_projects[ $slug ] ) ) {
		$touched_projects[ $slug ][] = $line;
	}
}

fclose( $pipes[1] );
$status = proc_close( $p );
if ( $status ) {
	exit( $status );
}

// Output.
ksort( $touched_projects );
$exit = 0;
foreach ( $touched_projects as $slug => $files ) {
	if ( empty( $ok_projects[ $slug ] ) ) {
		printf( "---\n" ); // Bracket message containing newlines for better visibility in GH's logs.
		printf(
			"::error::Project %s is being changed, but no change file in %s is touched!%%0A%%0AGo to that project and use `%s add` to add a change file.%%0AGuidelines: https://github.com/Automattic/jetpack/blob/master/docs/writing-a-good-changelog-entry.md\n",
			$slug,
			"projects/$slug/{$changelogger_projects[ $slug ]['changes-dir']}/",
			'packages/changelogger' === $slug ? 'bin/changelogger' : 'vendor/bin/changelogger'
		);
		printf( "---\n" );
		$exit = 1;
	}
}
exit( $exit );
