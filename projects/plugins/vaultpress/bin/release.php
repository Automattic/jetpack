<?php
/**
 * Plugin release management.
 *
 * Example usage: `php bin/release.php`
 *
 * @package jetpack
 */

/**
 * Globals
 */
$tmp_build_dir = '/tmp/build-release';

/**
 * How does it work?
 *
 * @param int    $exit_value
 * @param string $message
 */
function usage( $exit_value = 1, $message = '' ) {
	$handle = $exit_value ? STDERR : STDOUT;

	if ( $message ) {
		fwrite( $handle, "$message\n\n" );
	}

	$usage = <<<"USAGE"
php {$GLOBALS['argv'][0]} --new=[major|point] --update=RELEASE_NUM

  Plugin release management scripts.

  Can do things like:
  - Create a new release branch in GitHub
  - Update an existing release branch in GitHub
  - Publish a release branch as a tag/release on GitHub
  - Publish a GitHub tag/release to the wp.org svn

    --list
        List all release branches and tags

    --new RELEASE_NUM
        New release?

    --update RELEASE_NUM
        Update an existing release in GitHub.

USAGE;

	fwrite( $handle, $usage );
	exit( (int) $exit_value );
}


function build_or_update_production_release_branch( $version ) {
	global $tmp_build_dir;
	execute_command( sprintf( 'rm -rf %s', escapeshellarg( $tmp_build_dir ) ), 'Could not clean.' );

	$release_branch      = "release/$version";
	$release_branch_prod = "release/$version-prod";

	execute_command( sprintf( 'git checkout %s && git pull', escapeshellarg( $release_branch ) ), 'Could not check out to release branch.' );

	echo_bold( "Building production branch...\n" );
	execute_command( 'yarn build-production', 'Something went wrong. See output above for error.' );
	echo_success( "Release built! Now purging dev files for built branch...\n" );
	purge_dev_files();

	// Create a new local branch if none exists, else checkout to it
	$branch_exists = execute_command( sprintf( 'git ls-remote --exit-code --heads origin %s', escapeshellarg( $release_branch_prod ) ), '', true );
	if ( empty( $branch_exists ) ) {
		execute_command( sprintf( 'git checkout -b %s', escapeshellarg( $release_branch_prod ) ), "Could not create local release branch: $release_branch_prod" );
	} else {
		$remote_url = execute_command( 'git remote get-url --all origin', 'Error', true );
		execute_command(
			sprintf( 'git clone --depth 1 -b %1s --single-branch %2s %3s',
				escapeshellarg( trim( $release_branch_prod ) ),
				escapeshellarg( $remote_url ),
				escapeshellarg( $tmp_build_dir )
			), 'Could not clone release branch. See above output for details.' );

		execute_command( sprintf( 'rsync -r --delete --exclude="*.git*" . %s', $tmp_build_dir ), 'Could not rsync.' );
		chdir( $tmp_build_dir );
	}

	// Commit and push!
	execute_command( 'git commit -am "New Build"', 'Could not commit.' );
	execute_command( sprintf( 'git push -u origin %s', escapeshellarg( $release_branch_prod ) ), "Could not push $release_branch_prod to remote." );
}

/**
 * Resets everything.
 */
function reset_and_clean() {
	global $tmp_build_dir;
	execute_command( 'git fetch origin && git checkout master && git reset --hard origin/master' );
	execute_command( sprintf( 'rm -rf %s', escapeshellarg( $tmp_build_dir ) ) );
}

/**
 * Reads every line in .svnignore as a file/directory and removes them.
 */
function purge_dev_files() {
	$ignored = file( dirname( dirname( __FILE__ ) ) . '/.svnignore', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );

	foreach ( $ignored as $file_pattern ) {
		if ( ! preg_match( '/^#/', $file_pattern ) ) {
			execute_command( sprintf( 'rm -rf %s', $file_pattern ) );
		}
	}
}

/**
 * Prompt for user-input strings
 *
 * @param string $question
 * @param array  $options
 * @return bool|string
 */
function prompt( $question = '', $options = array(), $show_options = true ) {
	if ( empty( $question ) ) {
		usage();
	};

	echo_bold( $question );
	if ( ! empty( $options ) ) {
		$options_string = 'Your options are: ' . implode( ' or ', $options ) . "\n";
		if ( $show_options ) {
			echo $options_string;
		}
	}

	$handle = fopen( 'php://stdin', 'r' );
	$line   = trim( fgets( $handle ) );

	if ( ! empty( $options ) && ! in_array( $line, $options ) ) {
		echo_fail( 'Sorry, that is not a valid input. Try again?' );
		echo $options_string;
		prompt( $question, $options, false );
	}

	echo "\n";
	return preg_replace( '/[^A-Za-z0-9\-\.]/', '', $line );
}

/**
 * Get a yes/no confirmation
 *
 * @param string $question
 */
function confirm( $question = '' ) {
	$question = ! empty( $question ) ? $question : "Are you sure you want to do this?  Type 'yes' to continue: ";
	echo_bold( $question );

	$handle = fopen( 'php://stdin', 'r' );
	$line   = fgets( $handle );
	if ( trim( $line ) != 'yes' ) {
		exit;
	}
	echo "\n";
}


// Bold
function echo_bold( $string ) {
	printf( "\e[1m%s\e[0m\n", (string) $string );
}

// Green
function echo_success( $string ) {
	printf( "\e[32m%s\e[0m\n", (string) $string );
}

// Red
function echo_fail( $string ) {
	printf( "\e[31m%s\e[0m\n", (string) $string );
}

/**
 * Execute a command.
 * On failure, throw an exception with the specified message (if specified).
 *
 * @param string $command           Command to execute.
 * @param string $error             Error message to be thrown if command fails.
 * @param bool   $return            Whether to return the output
 * @param bool   $cleanup_repo      Whether to cleaup repo on error.
 * @param bool   $cleanup_remotes   Whether to cleanup remotes on error.
 *
 * @return string|null
 */
function execute_command( $command, $error = '', $return = false, $cleanup = false ) {
	if ( $return ) {
		return trim( shell_exec( $command ) );
	}

	// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_passthru
	passthru( $command, $status );
	// phpcs:enable WordPress.PHP.DiscouragedPHPFunctions.system_calls_passthru

	if ( $error && 0 !== $status ) {
		if ( $cleanup ) {
			reset_and_clean();
		}

		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
		echo( 'Error: ' . $error . PHP_EOL );
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	return '';
}

/**
 * Begin script!
 */

// Should never be uncommitted changes
$changes = execute_command( 'git status -s --porcelain', 'Uncommitted changes found.', true );
if ( ! empty( $changes ) ) {
	echo_fail( 'Uncommitted changes found, please clean them up.' );
	exit;
}

$opts = array(
	'list',
	'new::',
	'update::',
);
$args = getopt( '', $opts );

// Gotta tell us something
if ( empty( $args ) ) {
	usage();
} elseif ( isset( $args['list'] ) ) {
	execute_command( 'git branch -l origin release/*', 'No release branches found.' );
} elseif ( isset( $args['new'] ) ) {
	$version = $args['new'];
	if ( empty( $version ) ) {
		$version = prompt( "What version are you releasing?\n" );
	}

	$release_branch      = "release/$version";
	$release_branch_prod = "release/$version-prod";

	// Checkout to current origin/master in detached state
	execute_command( 'git fetch origin master', 'Could not fetch origin master' );
	execute_command( 'git checkout origin/master', 'Could not check out to origin/master' );

	// Create a new local branch
	execute_command( sprintf( 'git checkout -b %s', escapeshellarg( $release_branch ) ), "Could not create local release branch: $release_branch" );

	// Push it to remote
	execute_command( sprintf( 'git push -u origin %s', escapeshellarg( $release_branch ) ), "Could not push $release_branch to remote." );
	echo_success( "New dev release branch pushed!\n" );

	build_or_update_production_release_branch( $version );

	echo_success( "Success! New release branches were created and pushed to the repo. \n- dev: $release_branch\n- production: $release_branch_prod\n" );
} elseif ( isset( $args['update'] ) ) {
	$version = $args['update'];
	if ( empty( $version ) ) {
		$version = prompt( "What version are you updating?\n" );
	}

	build_or_update_production_release_branch( $version );
	echo_success( "Updated the $version production release branch!" );
}

reset_and_clean();
