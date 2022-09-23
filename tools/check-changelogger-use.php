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

  --debug, -v    Display verbose output.
  --list         Just list projects, no explanatory output.
  --maybe-merge  If unmerged change entries are detected, offer to merge them.
  <base-ref>     Base git ref to compare for changed files.
  <head-ref>     Head git ref to compare for changed files.

Exit codes:

 0: No change entries are needed.
 1: Execution failure of some kind.
 2: Projects lack a change entry.
 4: Projects have uncommitted change entries. None are missing an entry.
 6: Some projects have uncommitted change entries, and some lack a change entry.
 8: Change entries were committed. No more change entries are needed.
10: Change entries were committed. Some change entries are still needed.

EOH;
	exit( 1 );
}

$exit        = 0;
$idx         = 0;
$verbose     = false;
$list        = false;
$maybe_merge = false;
$base        = null;
$head        = null;
for ( $i = 1; $i < $argc; $i++ ) {
	switch ( $argv[ $i ] ) {
		case '-v':
		case '--debug':
			$verbose = true;
			break;
		case '--list':
			$list = true;
			break;
		case '--maybe-merge':
			$maybe_merge = true;
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

if ( $maybe_merge && $list ) {
	debug( 'Ignoring --maybe-merge, --list was provided' );
	$maybe_merge = false;
}
if ( $maybe_merge && getenv( 'CI' ) ) {
	debug( 'Ignoring --maybe-merge, running in CI mode' );
	$maybe_merge = false;
}
if ( $maybe_merge && ! ( is_callable( 'posix_isatty' ) && posix_isatty( STDIN ) ) ) {
	debug( 'Ignoring --maybe-merge, stdin is not a tty' );
	$maybe_merge = false;
}
if ( $maybe_merge ) {
	$ver = shell_exec( 'git version' );
	if ( ! $ver ||
		! preg_match( '/git version (\d+\.\d+\.\d+)/', $ver, $m ) ||
		// PHP's version_compare is kind of broken, but works for all-numeric versions.
		version_compare( $m[1], '2.25.0', '<' )
	) {
		debug( 'Ignoring --maybe-merge, git is unavailable or too old (version 2.25+ is required)' );
		$maybe_merge = false;
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
	exit( 1 );
}

// Check if any projects needing change entries were found.
$needed_projects = array_diff_key( $touched_projects, $ok_projects );
if ( ! $needed_projects ) {
	exit( 0 );
}

// Look for unmerged change entry files.
debug( 'Checking for unmerged change entry files.' );
$pipes = null;
$p     = proc_open(
	'git -c core.quotepath=off status --no-renames --porcelain',
	array( array( 'pipe', 'r' ), array( 'pipe', 'w' ), STDERR ),
	$pipes
);
if ( ! $p ) {
	exit( 1 );
}
fclose( $pipes[0] );

$unmerged_projects = array();
// phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
while ( ( $line = fgets( $pipes[1] ) ) ) {
	$line  = trim( $line );
	$file  = substr( $line, 3 );
	$parts = explode( '/', $file, 5 );
	if ( count( $parts ) < 4 || 'projects' !== $parts[0] ) {
		debug( 'Ignoring non-project file %s.', $file );
		continue;
	}
	$slug = "{$parts[1]}/{$parts[2]}";
	if ( ! isset( $changelogger_projects[ $slug ] ) ) {
		debug( 'Ignoring file %s, project %s does not use changelogger.', $file, $slug );
		continue;
	}
	if ( $parts[3] === $changelogger_projects[ $slug ]['changes-dir'] && '.' !== $parts[4][0] ) {
		if ( empty( $needed_projects[ $slug ] ) ) {
			debug( 'Ignoring unmerged change entry file %s, project %s is already ok.', $file, $slug );
		} else {
			debug( 'Unmerged changes touch change entry file %s, marking %s as having an unmerged change file.', $file, $slug );
			$unmerged_projects[ $slug ][] = $file;
		}
		continue;
	}

	debug( 'Ignoring non-change-entry file %s.', $file );
}

fclose( $pipes[1] );
$status = proc_close( $p );
if ( $status ) {
	exit( 1 );
}

// Offer to merge, if applicable.
if ( $unmerged_projects && $maybe_merge ) {
	echo "The following change entry files exist and are needed but are not committed.\n";
	echo ' - ' . join( "\n - ", array_merge( ...( array_values( $unmerged_projects ) ) ) ) . "\n";
	echo 'Shall I merge them for you? [Y/n] ';
	$do_merge = null;
	while ( $do_merge === null ) {
		$c = fgets( STDIN );
		if ( $c === false || $c === '' ) {
			$do_merge = false;
		} else {
			$c = substr( trim( $c ), 0, 1 );
			if ( $c === '' || $c === 'y' || $c === 'Y' ) {
				$do_merge = true;
			} elseif ( $c === 'n' || $c === 'N' ) {
				$do_merge = false;
			}
		}
	}
	if ( $do_merge ) {
		foreach ( array( 'add', 'commit -m "Changelog"' ) as $cmd ) {
			$pipes = null;
			$p     = proc_open(
				"git --literal-pathspecs $cmd --pathspec-from-file=- --pathspec-file-nul",
				array( array( 'pipe', 'r' ), STDOUT, STDERR ),
				$pipes
			);
			if ( ! $p ) {
				exit( 1 );
			}
			$str = join( "\0", array_merge( ...( array_values( $unmerged_projects ) ) ) );
			while ( $str !== '' ) {
				$l = fwrite( $pipes[0], $str );
				if ( $l === false ) {
					exit( 1 );
				}
				$str = (string) substr( $str, $l );
			}
			fclose( $pipes[0] );
			$status = proc_close( $p );
			if ( $status ) {
				exit( 1 );
			}
		}
		$ok_projects      += $unmerged_projects;
		$unmerged_projects = array();
		$exit             |= 8;
	}
}

// Output.
ksort( $touched_projects );
foreach ( $touched_projects as $slug => $files ) {
	if ( empty( $ok_projects[ $slug ] ) ) {
		if ( ! empty( $unmerged_projects[ $slug ] ) ) {
			$ct = count( $unmerged_projects[ $slug ] );
			if ( $ct > 1 ) {
				$msg                                   = 'Project %s is being changed, and change files %s exist but are not committed!';
				$unmerged_projects[ $slug ][ $ct - 1 ] = 'and ' . $unmerged_projects[ $slug ][ $ct - 1 ];
			} else {
				$msg = 'Project %s is being changed, and change file %s exists but is not committed!';
			}
			$msg   = sprintf(
				$msg,
				$slug,
				join( $ct > 2 ? ', ' : ' ', $unmerged_projects[ $slug ] )
			);
			$msg2  = '';
			$exit |= 4;
		} else {
			$msg   = sprintf(
				'Project %s is being changed, but no change file in %s is touched!',
				$slug,
				"projects/$slug/{$changelogger_projects[ $slug ]['changes-dir']}/"
			);
			$msg2  = sprintf( "\n\nUse `jetpack changelogger add %s` to add a change file.\nGuidelines: https://github.com/Automattic/jetpack/blob/trunk/docs/writing-a-good-changelog-entry.md", $slug );
			$exit |= 2;
		}

		if ( $list ) {
			echo "$slug\n";
		} elseif ( getenv( 'CI' ) ) {
			$msg = strtr( $msg . $msg2, array( "\n" => '%0A' ) );
			echo "---\n::error::$msg\n---\n";
		} else {
			echo "\e[1;31m$msg\e[0m\n";
		}
	}
}
if ( ( $exit & 2 ) && ! getenv( 'CI' ) && ! $list ) {
	printf( "\e[32mUse `jetpack changelogger add <slug>` to add a change file for each project.\e[0m\n" );
	printf( "\e[32mGuidelines: https://github.com/Automattic/jetpack/blob/trunk/docs/writing-a-good-changelog-entry.md\e[0m\n" );
}

exit( $exit );
