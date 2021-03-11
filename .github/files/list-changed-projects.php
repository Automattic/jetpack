#!/usr/bin/env php
<?php
/**
 * Tool to list whether projects have changed.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.WP.AlternativeFunctions, WordPress.PHP.DiscouragedPHPFunctions, WordPress.Security.EscapeOutput.OutputNotEscaped

// Files that mean all tests should be run.
// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
$infrastructure_files = array(
	'.github/files/list-changed-projects.php',
	'.github/files/generate-ci-matrix.php',
	'.github/files/process-coverage.sh',
	'.github/files/setup-wordpress-env.sh',
	'.github/php-version',
	'.github/workflows/tests.yml',
	'.nvmrc',
);

// Globs that should be ignored. Supports `*`, `**`, and `?`.
// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
$ignore_globs = array(
	'**.md',
	'**.txt',
);

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

/**
 * Fetch the list of all projects.
 *
 * @return string[]
 */
function get_all_projects() {
	static $cache = null;

	if ( null === $cache ) {
		$cache = array( 'monorepo' );
		foreach ( glob( 'projects/*/*/composer.json' ) as $file ) {
			$cache[] = substr( $file, 9, -14 );
		}
		ksort( $cache );
	}

	return $cache;
}

/**
 * Fetch the list of changed projects.
 *
 * @return string[]
 */
function get_changed_projects() {
	global $infrastructure_files, $ignore_globs;

	// Code coverage probably needs to run all tests to avoid confusing metrics.
	// @todo Determine if that's actually true.
	if ( 'test-coverage' === getenv( 'TEST_SCRIPT' ) ) {
		debug( 'TEST_SCRIPT is test-coverage, considering all projects changed.' );
		return get_all_projects();
	}

	$event = getenv( 'GITHUB_EVENT_NAME' );
	if ( 'pull_request' === $event ) {
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
		debug( 'GITHUB_EVENT_NAME is pull_request, checking diff from %s...%s.', $base, $head );
	} elseif ( 'push' === $event ) {
		debug( 'GITHUB_EVENT_NAME is push, considering all projects changed.' );
		return get_all_projects();
	} else {
		fprintf( STDERR, "Unsupported GITHUB_EVENT_NAME \"%s\"\n", $event );
		exit( 1 );
	}

	$pipes = null;
	$p     = proc_open(
		sprintf( 'git diff --no-renames --name-only %s...%s', escapeshellarg( $base ), escapeshellarg( $head ) ),
		array( array( 'pipe', 'r' ), array( 'pipe', 'w' ), STDERR ),
		$pipes
	);
	if ( ! $p ) {
		exit( 1 );
	}
	fclose( $pipes[0] );

	// PHP doesn't seem to have something that'll correctly handle `**`, so munge to a regex.
	$ignore_regexes = array();
	foreach ( $ignore_globs as $glob ) {
		$re = '!^';
		for ( $i = 0, $l = strlen( $glob ); $i < $l; $i++ ) {
			$c = $glob[ $i ];
			switch ( $c ) {
				case '\\':
					$re .= preg_quote( $glob[ ++$i ], '!' );
					break;
				case '*':
					if ( '*' === $glob[ $i + 1 ] ) {
						$i++;
						$re .= '.*';
					} else {
						$re .= '[^/]*';
					}
					break;
				case '?':
					$re .= '[^/]';
					break;
				default:
					$re .= preg_quote( $c, '!' );
					break;
			}
		}
		$re                     .= '$!';
		$ignore_regexes[ $glob ] = $re;
	}

	$projects = array();
	// phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
	while ( ( $line = fgets( $pipes[1] ) ) ) {
		$line = trim( $line );
		if ( in_array( $line, $infrastructure_files, true ) ) {
			debug( 'PR touches infrastructure file %s, considering all projects changed.', $line );
			return get_all_projects();
		}
		foreach ( $ignore_regexes as $glob => $re ) {
			if ( preg_match( $re, $line ) ) {
				debug( 'PR touches file %s, but ignoring due to match with `%s`.', $line, $glob );
				continue 2;
			}
		}
		$parts = explode( '/', $line, 4 );
		if ( count( $parts ) === 4 && 'projects' === $parts[0] ) {
			$slug = "{$parts[1]}/{$parts[2]}";
		} else {
			$slug = 'monorepo';
		}
		if ( empty( $projects[ $slug ] ) ) {
			debug( 'PR touches file %s, marking %s as changed.', $line, $slug );
			$projects[ $slug ] = true;
		}
	}
	fclose( $pipes[1] );

	$status = proc_close( $p );
	if ( $status ) {
		exit( $status );
	}

	ksort( $projects );
	return array_keys( $projects );
}

/**
 * Get the path to a file in a project.
 *
 * @param string $project The project slug to check.
 * @param string $path Path components to check.
 * @return string
 */
function project_path( $project, $path ) {
	return 'monorepo' === $project ? $path : "projects/$project/$path";
}

/**
 * Check whether any of a project's extra dependencies have changed.
 *
 * Dependencies declared in composer.json `.extra.dependencies`.
 *
 * @param string $project The project slug to check.
 * @param array  $changed Array mapping project slugs to "changed" flags.
 * @return bool
 */
function check_extra_deps( $project, $changed ) {
	$json = json_decode( file_get_contents( project_path( $project, 'composer.json' ) ), true );
	if ( isset( $json['extra']['dependencies'] ) ) {
		foreach ( $json['extra']['dependencies'] as $dep ) {
			if ( ! empty( $changed[ $dep ] ) ) {
				debug( 'Project %s depends on %s, marking it changed.', $project, $dep );
				return true;
			}
		}
	}
	return false;
}

/**
 * Check whether any of a project's composer dependencies have changed.
 *
 * @param string $project The project slug to check.
 * @param array  $changed Array mapping project slugs to "changed" flags.
 * @return bool
 */
function check_composer_deps( $project, $changed ) {
	static $package_map = null;

	if ( null === $package_map ) {
		$package_map = array();
		foreach ( get_all_projects() as $p ) {
			if ( substr( $p, 0, 9 ) === 'packages/' ) {
				$json = json_decode( file_get_contents( project_path( $p, 'composer.json' ) ), true );
				if ( isset( $json['name'] ) ) {
					$package_map[ $json['name'] ] = $p;
				}
			}
		}
	}

	$json = json_decode( file_get_contents( project_path( $project, 'composer.json' ) ), true );
	$deps = array_merge(
		isset( $json['require'] ) ? $json['require'] : array(),
		isset( $json['require-dev'] ) ? $json['require-dev'] : array()
	);
	foreach ( $package_map as $package => $p ) {
		if ( isset( $deps[ $package ] ) && ! empty( $changed[ $p ] ) ) {
			debug( 'Project %s depends on composer package %s from %s, marking it changed.', $project, $package, $p );
			return true;
		}
	}
	return false;
}

// Get a list of projects indicating which are changed.
$projects = array_fill_keys( get_changed_projects(), true ) + array_fill_keys( get_all_projects(), false );

// Figure out if any projects depend on a changed project. Repeat to propagate until none are found.
do {
	$any = false;
	foreach ( $projects as $project => $changed ) {
		if ( $changed ) {
			continue;
		}
		if ( check_extra_deps( $project, $projects ) ||
			check_composer_deps( $project, $projects )
		) {
			$projects[ $project ] = true;
			$any                  = true;
		}
	}
} while ( $any );

// Output.
ksort( $projects );
echo json_encode( $projects, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "\n";
