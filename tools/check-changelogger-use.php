#!/usr/bin/env php
<?php
/**
 * Tool to list whether projects have been touched so as to need a changelog entry.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DiscouragedPHPFunctions, WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.GlobalVariablesOverride

chdir( __DIR__ . '/../' );

/**
 * Display usage information and exit.
 */
function usage() {
	global $argv;
	echo <<<EOH
USAGE: {$argv[0]} [--debug|-v] [--list] <base-ref> <head-ref>

Checks that a monorepo commit contains a Changelogger change entry for each
project touched.

  --debug, -v  Display verbose output.
  --list       Just list projects, no explanatory output.
  <base-ref>   Base git ref to compare for changed files.
  <head-ref>   Head git ref to compare for changed files.

EOH;
	exit( 1 );
}

$idx     = 0;
$verbose = false;
$list    = false;
$base    = null;
$head    = null;
for ( $i = 1; $i < $argc; $i++ ) {
	switch ( $argv[ $i ] ) {
		case '-v':
		case '--debug':
			$verbose = true;
			break;
		case '--list':
			$list = true;
			break;
		case '-h':
		case '--help':
			usage();
			break;
		default:
			if ( substr( $argv[ $i ], 0, 1 ) !== '-' ) {
				switch ( $idx++ ) {
					case 0:
						$base = $argv[ $i ];
						break;
					case 1:
						$head = $argv[ $i ];
						break;
					default:
						fprintf( STDERR, "\e[1;31mToo many arguments.\e[0m\n" );
						usage();
				}
			} else {
				fprintf( STDERR, "\e[1;31mUnrecognized parameter `%s`.\e[0m\n", $argv[ $i ] );
				usage();
			}
			break;
	}
}

if ( null === $head ) {
	fprintf( STDERR, "\e[1;31mBase and head refs are required.\e[0m\n" );
	usage();
}

if ( $verbose ) {
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
		if ( $list ) {
			echo "$slug\n";
		} elseif ( getenv( 'CI' ) ) {
			printf( "---\n" ); // Bracket message containing newlines for better visibility in GH's logs.
			printf(
				"::error::Project %s is being changed, but no change file in %s is touched!%%0A%%0AUse `jetpack changelogger add %s` to add a change file.%%0AGuidelines: https://github.com/Automattic/jetpack/blob/master/docs/writing-a-good-changelog-entry.md\n",
				$slug,
				"projects/$slug/{$changelogger_projects[ $slug ]['changes-dir']}/",
				$slug
			);
			printf( "---\n" );
			$exit = 1;
		} else {
			printf(
				"\e[1;31mProject %s is being changed, but no change file in %s is touched!\e[0m\n",
				$slug,
				"projects/$slug/{$changelogger_projects[ $slug ]['changes-dir']}/"
			);
			$exit = 1;
		}
	}
}
if ( $exit && ! getenv( 'CI' ) && ! $list ) {
	printf( "\e[32mUse `jetpack changelogger add <slug>` to add a change file for each project.\e[0m\n" );
	printf( "\e[32mGuidelines: https://github.com/Automattic/jetpack/blob/master/docs/writing-a-good-changelog-entry.md\e[0m\n" );
}

exit( $exit );
