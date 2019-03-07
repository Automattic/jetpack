#!/usr/bin/env php
<?php
/**
 * Executable that combines `git diff` and `phpcs` to report PHPCS errors
 * only on lines that have changed.
 *
 * Accepts most anything `git diff` does.
 *
 * ./sniff-diff
 * ./sniff-diff --staged
 * ./sniff-diff HEAD
 * ./sniff-diff master
 * ./sniff-diff master...
 * ./sniff-diff branch1 branch2
 * etc.
 *
 * To pass arguments to PHPCS, add them after a `--phpcs--` separator
 * argument:
 *
 * ./sniff-diff --staged --phpcs-- --report=json
 *
 * @see get_args()
 *
 * @package Jetpack
 */

// This file is PHP 5.6+ only.
// phpcs:disable PHPCompatibility.Syntax.NewShortArray.Found,PHPCompatibility.Keywords.NewKeywords.t_dirFound,PHPCompatibility.FunctionDeclarations.NewClosure.Found,PHPCompatibility.LanguageConstructs.NewLanguageConstructs.t_ellipsisFound,PHPCompatibility.Syntax.NewFunctionArrayDereferencing.Found

// This file does not generate HTML.
// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

// This file benefits from direct file access.
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_fwrite,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents,WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents,WordPress.WP.AlternativeFunctions.file_system_read_fclose

// This file uses shell access.
// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open,WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec


// Go!
exit( sniff_diff( $argv ) );

/**
 * Runs `git diff` with the arguments supplied to this script.
 * For each changed file, runs PHPCS and filters the report to only
 * include errors from changed lines.
 *
 * To filter out the unnecessary lines, we run PHPCS twice:
 * 1. Run PHPCS once to cache the sniff data.
 * 2. Manipulate the sniff data to remove information about unchanged
 *    lines.
 * 3. Run PHPCS again. It reads the filtered cache and so is tricked into
 *    only reporting about the changed lines.
 *
 * @param string[] $argv Like the global.
 * @return int
 */
function sniff_diff( $argv ) {
	list(
		$git_args,         // Arguments we'll pass to `git diff`.
		$phpcs_cache_args, // Arguments we'll pass to the first, caching run of `phpcs`.
		$phpcs_args        // Arguments we'll pass to the second, reporting run of `phpcs`.
	) = get_args( $argv );

	$changed_files = get_changed_files( $git_args );

	if ( ! $changed_files ) {
		fwrite( STDERR, "SNIFF DIFF: No changed files.\n" );
		return 0;
	}

	// Temp file we'll store the PHPCS cache in.
	$cache_file = tempnam( sys_get_temp_dir(), 'sniff-diff-cache' );
	if ( ! $cache_file ) {
		fwrite( STDERR, "SNIFF DIFF: Could not create temporary cache file.\n" );
		return 1;
	}

	// If we're examining the working tree (e.g., `git diff`), this isn't necessary.
	// If we're looking at the index (e.g., `git diff --staged`) or the database
	// (e.g., `git diff branch1 branch2`), we'll put a copy of that version of each
	// file here.
	$cache_dir = "$cache_file.dir/";
	if ( ! mkdir( $cache_dir ) ) {
		fwrite( STDERR, "SNIFF DIFF: Could not create temporary cache directory.\n" );
		return 1;
	}

	// On shutdown, delete all files queued for deletion.
	register_shutdown_function( 'delete_temp', false, $cache_dir );

	$base_dir      = get_changed_files_base_dir( $changed_files, $cache_dir );
	$sniff_files   = prepare_files_for_sniff( $changed_files, $base_dir );
	$changed_lines = get_changed_files_changed_lines( $changed_files, $base_dir );

	$phpcs = dirname( __DIR__ ) . '/vendor/bin/phpcs';

	// Generate summary report for the whole files (looking at changed and unchanged lines) and cache the results.
	$phpcs_status = 0;
	$summary      = proc(
		array_merge(
			[ $phpcs, '--report=summary', "--cache=$cache_file", "--basepath=$base_dir" ],
			$phpcs_cache_args,
			[ '--' ],
			$sniff_files
		),
		$phpcs_status
	);

	print_summary( $summary, $changed_files );

	// If the whole file passes, we can bail early.
	if ( ! $phpcs_status ) {
		return 0;
	}

	filter_cache( $cache_file, $changed_lines );

	// Feed the cache back into PHPCS.
	$phpcs_status = 0;
	$report       = proc(
		array_merge(
			[ $phpcs, "--cache=$cache_file", "--basepath=$base_dir" ],
			// If we can, set the report width based on the TTY width.
			// PHPCS normally takes care of this for us, but can't if
			// it's called via `proc_open()` (not a TTY).
			add_width_argument( $phpcs_args ),
			[ '--' ],
			$sniff_files
		),
		$phpcs_status
	);

	print_report( $report, $changed_files );

	return $phpcs_status;
}

/**
 * Given the changed files, returns the directory in PHPCS will find
 * the files to sniff.
 *
 * For working tree diffs (e.g., `git diff`), this will just be the git directory.
 * For index diffs (e.g., `git diff --staged`), or db diffs (e.g., `git diff branch1 branch2`),
 * this will be a temporary directory that will later be populated by the correct versions
 * of the files.
 *
 * @param array[] $changed_files From `get_changed_files()`.
 * @param string  $cache_dir The directory for any temporary files.
 * @return string the base dir.
 */
function get_changed_files_base_dir( $changed_files, $cache_dir ) {
	$changed_files_in_working_dir = count( array_filter( array_map( 'is_change_in_working_tree', $changed_files ) ) );

	if ( ! $changed_files_in_working_dir ) {
		return $cache_dir;
	} elseif ( count( $changed_files ) === $changed_files_in_working_dir ) {
		return dirname( __DIR__ ) . '/';
	} else {
		fwrite( STDERR, "SNIFF DIFF: Diff contains mix of git database/index changes and working tree changes. I don't know what to do with that.\n" );
		exit( 5 );
	}
}

/**
 * Determins if the changes to a file are in the working tree
 * or the index/db.
 *
 * @param array $changed_file An entry from `get_changed_files()`.
 * @return boolean True if the change is in the working tree.
 */
function is_change_in_working_tree( $changed_file ) {
	return '0000000000000000000000000000000000000000' === $changed_file['new_hash'];
}

/**
 * Given the list of changed files, create temporary copies
 * of each file at the revision in question if necessary and return
 * the absolute paths to the changed files.
 *
 * @param array[] $changed_files From `get_changed_files()`.
 * @param string  $base_dir The base dir for the relative file paths.
 * @return string[] Absolute paths of files to sniff,
 */
function prepare_files_for_sniff( $changed_files, $base_dir ) {
	$sniff_files = [];
	foreach ( $changed_files as $changed_file ) {
		$new_file_path   = "{$base_dir}{$changed_file['new_file']}";
		$is_working_tree = is_change_in_working_tree( $changed_file );

		if ( ! $is_working_tree ) {
			// We're looking at the index or database, so we need a copy
			// of that version of the file.
			put_blob_contents( $new_file_path, $changed_file['new_hash'], $base_dir );
		}

		$sniff_files[] = $new_file_path;
	}

	return $sniff_files;
}

/**
 * Given the list of changed files, generate a list of
 * changed lines.
 *
 * @param array[] $changed_files From `get_changed_files()`.
 * @param string  $base_dir The base dir for the relative file paths.
 * @return array[] Keys are absolute file paths and values are arrays of line numbers or an empty array for added files.
 */
function get_changed_files_changed_lines( $changed_files, $base_dir ) {
	$changed_lines = [];
	foreach ( $changed_files as $changed_file ) {
		$new_file_path   = "{$base_dir}{$changed_file['new_file']}";
		$is_working_tree = is_change_in_working_tree( $changed_file );

		switch ( $changed_file['status'] ) {
			// Take note of the changed lines so we can filter out sniff information from unchanged lines later.
			case 'M': // Modified.
			case 'R': // Renamed.
			case 'C': // Copied.
				$lines = get_changed_lines(
					$changed_file['old_hash'],
					$is_working_tree ? $changed_file['new_file'] : $changed_file['new_hash']
				);

				if ( $lines ) {
					$changed_lines[ $new_file_path ] = $lines;
				}
				break;
			case 'A': // Added.
				$changed_lines[ $new_file_path ] = [];
				break;
			default:
				// Other options are Unmerged (U), Type Changed (T), Unknown (X).
				// We already filtered out Deleted (D) with `--diff-filter=d`.
				fwrite( STDERR, sprintf( "SNIFF DIFF: I don't know what to do with file '%s' of type '%s'.\n", $changed_file['new_file'], $changed_file['status'] ) );
				exit( 5 );
		}
	}

	return $changed_lines;
}

/**
 * Given a PHPCS cache file, removes any errors/warnings from
 * unchanged lines.
 *
 * @param string  $cache_file Path to PHPCS cache file.
 * @param array[] $changed_lines Keys are file paths. Values are arrays of line numbers.
 */
function filter_cache( $cache_file, $changed_lines ) {
	$cache = json_decode( file_get_contents( $cache_file ), true );

	// Remove the unchanged lines from the cache.
	foreach ( array_intersect_key( $cache, $changed_lines ) as $file => $file_data ) {
		if ( ! $changed_lines[ $file ] ) {
			// Added files have an entry in $changed_lines, but the entry is an empty array.
			continue; // Show all errors in new files.
		}
		foreach ( [ 'errors', 'warnings' ] as $group ) {
			$cache[ $file ][ $group ] = array_intersect_key( $cache[ $file ][ $group ], array_flip( $changed_lines[ $file ] ) );
		}
	}

	file_put_contents( $cache_file, json_encode( $cache ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
}

/**
 * Prints the summary information from the first run of `phpcs`.
 * This information is about the whole files - not just the changed lines.
 *
 * Modifies the normal PHPCS report to make that clear and to add
 * blob hashes to each file.
 *
 * @param string  $summary the PHPCS --report=summary.
 * @param array[] $changed_files From `get_changed_files()`.
 */
function print_summary( $summary, $changed_files ) {
	// Make it clear we're looking at the whole file.
	$summary = str_replace( 'PHP CODE SNIFFER REPORT SUMMARY', 'PHP CODE SNIFFER REPORT SUMMARY (WHOLE FILES)', $summary );

	// Add blob hash to the report.
	$summary = preg_replace( '/^(\033\\[[0-9;]+m)?FILE             /m', '$1FILE (BLOB HASH) ', $summary );
	foreach ( $changed_files as $changed_file ) {
		$hash = '0000000000000000000000000000000000000000' === $changed_file['new_hash'] ? 'working tree' : $changed_file['new_hash'];

		$summary = preg_replace_callback(
			'/^' . preg_quote( $changed_file['new_file'], '/' ) . ' +/m',
			function( $matches ) use ( $hash ) {
				$length = strlen( $matches[0] );

				$new_line = substr(
					trim( $matches[0] ) . " ($hash",
					0,
					$length - 2
				) . ') ';

				return $new_line . str_repeat( ' ', $length - strlen( $new_line ) );
			},
			$summary
		);
	}

	echo $summary;
}

/**
 * Prints the filtered report from the second run of `phpcs`.
 * This information is about the changed lines, not the whole files/unchanged lines.
 *
 * Modifies the normal PHPCS report to make that clear and to add
 * blob hashes to each file.
 *
 * @param string  $report the PHPCS --report=full.
 * @param array[] $changed_files From `get_changed_files()`.
 */
function print_report( $report, $changed_files ) {
	// Make it clear we're looking only at the changed lines.
	$report = preg_replace( '/AFFECTING (\\d+) LINE/', 'AFFECTING $1 CHANGED LINE', $report );

	// Add blob hash to the report.
	foreach ( $changed_files as $changed_file ) {
		$hash = '0000000000000000000000000000000000000000' === $changed_file['new_hash'] ? 'working tree' : $changed_file['new_hash'];

		$report = str_replace( "FILE: {$changed_file['new_file']}", "FILE: {$changed_file['new_file']} ($hash)", $report );
	}

	echo $report;
}

/**
 * Uses `git diff --raw` to determine what files have changed in what
 * ways.
 *
 * Returns path and blob hash information for each changed file.
 *
 * @param string[] $args Extra arguments to pass to `git diff --raw`.
 * @return array[] Array values are: [
 *                   'old_file' => old pathname of file,
 *                   'old_hash' => blob hash of old version of file,
 *                   'new_file' => new pathname of file,
 *                   'new_hash' => blob hash of new version of file,
 *                 ].
 */
function get_changed_files( $args ) {
	$git_args = array_merge(
		[
			'git',
			'diff',
			'--raw',           // Special format that is easy to parse.
			'--diff-filter=d', // We don't care about deleted files.
			'--abbrev=40',     // Output the full blob hash, not an abbreviated form.
		],
		$args
	);

	$diff_status = 0;
	$diff_output = proc( $git_args, $diff_status );

	if ( $diff_status ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: `%s` FAILED with exit code `%d`\n", join( ' ', $git_args ), $diff_status ) );
		exit( 5 );
	}

	// `trim()` to get rid of PHP_EOL inconsistencies between environments
	$diff_lines = array_map(
		function( $line ) {
			return trim( $line );
		},
		explode( "\n", trim( $diff_output ) )
	);

	$files = [];
	foreach ( $diff_lines as $diff_line ) {
		if ( ! $diff_line ) {
			continue;
		}

		// @see `git help diff` "RAW OUTPUT FORMAT"
		// https://git-scm.com/docs/git-diff#_raw_output_format
		//
		// In particular, we want to know he blob hashes of the
		// file at the revisions in question.
		//
		// ($dst only exists for Copied and Renamed files.)
		@list( $head, $src, $dst )                                  = explode( "\t", $diff_line ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		list( $src_mode, $dst_mode, $src_hash, $dst_hash, $status ) = explode( ' ', $head ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// Use only the first character: R and C come with extra characters.
		switch ( $status{0} ) {
			case 'M': // Modifed: source -> destination.
				$file = [
					'old_file' => $src,
					'old_hash' => $src_hash,
					'new_file' => $src, // [sic] - M rows have no $dst
					'new_hash' => $dst_hash,
				];
				break;
			case 'A': // Added: null -> source [sic].
				$file = [
					'old_file' => null,
					'old_hash' => null,
					'new_file' => $src, // [sic] - A rows have no $dst
					'new_hash' => $dst_hash,
				];
				break;
			case 'R': // Renamed: source -> destination.
			case 'C': // Copied: source -> destination.
			default: // Other options are Unmerged (U), Type Changed (T), Unknown (X).
				$file = [
					'old_file' => $src,
					'old_hash' => $src_hash,
					'new_file' => $dst,
					'new_hash' => $dst_hash,
				];
				break;
		}

		$file['status'] = $status{0};

		$files[] = $file;
	}

	return $files;
}

/**
 * Uses `git diff -U0` to calculate the lines that changed between source
 * and destination.
 *
 * Only cares about destination lines that are different than source
 * lines. That is, only modified or created lines, not deleted lines.
 *
 * @param string $src The blob hash of the source file.
 * @param string $dst The pathname or blob hash of the destination file.
 * @return int[]
 */
function get_changed_lines( $src, $dst ) {
	// For comparing two version of the file in the repo:
	// `git diff <blob> <blob>`
	// For comparing a version of the file in the repo against the
	// working copy of that file:
	// `git diff <blob> <file>`
	// <blob> is a blob hash, <file> is a file path.
	$args        = [ 'git', 'diff', '-U0', '--no-color', $src, $dst ];
	$diff_status = 0;
	$diff        = proc( $args, $diff_status );

	if ( $diff_status ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: `%s` FAILED with exit code `%d`\n", join( ' ', $args ), $diff_status ) );
		exit( 5 );
	}

	// Find the range markers for each chunk.
	preg_match_all( '/^@@ -[0-9,]+ \\+([0-9,]+) @@/m', $diff, $matches );
	$lines = [];
	foreach ( $matches[1] as $new_range ) {
		// $new_range is either "123,456" or "123".
		@list( $first, $length ) = explode( ',', $new_range ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		// @@ -123,10 +456,0 @@
		// If the length is '0', there are only deleted lines for
		// the destination in this chunk.
		if ( '0' === $length ) {
			continue;
		}

		if ( $length ) {
			// @@ -123,10 +456,10 @@
			// There are multiple lines for the destination in
			// this chunk.
			array_push( $lines, ...range( $first, $first + $length - 1 ) );
		} else {
			// @@ -123,10 +456 @@
			// If the length is '', there is only one line for
			// the destination in this chunk.
			$lines[] = (int) $first;
		}
	}

	return $lines;
}

/**
 * Get the contents of a file at its version corresponding to the given
 * blob hash and write it to the appropriate subdirectory of $cache_dir.
 *
 * @param string $file The relative path of the file within the repo.
 * @param string $hash The blob hash of the file at the version we're interested in.
 * @param string $cache_dir The directory for any temporary files.
 */
function put_blob_contents( $file, $hash, $cache_dir ) {
	if ( 0 !== strpos( $file, $cache_dir ) ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: Could not write file '%s' (%s) outside of cache dir '%s'.\n", $file, $hash, $cache_dir ) );
		exit( 5 );
	}

	$file_dir = dirname( $file );
	if ( 0 === strpos( $file_dir, $cache_dir ) ) {
		// We know $file is somewhere in $cache_dir.
		// This just avoids attempting to mkdir( $cache_dir ).
		// How?: $file_dir is unslashed, $cache_dir is slashed.
		mkdir( $file_dir, 0777, true );
	}

	// Use the file's blob hash to get its contents at the version we're interested in.
	$cat_status = 0;
	$contents   = proc( [ 'git', 'cat-file', 'blob', $hash ], $cat_status );

	if ( $cat_status ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: Could not cat-file '%s' (%s). Exited with code `%d`.\n", $file, $hash, $cat_status ) );
		exit( 5 );
	}

	file_put_contents( $file, $contents );

	// Queue the temporary file for deletion.
	delete_temp( $file, $cache_dir );
}

/**
 * Does two things:
 * 1. Queues files for eventual deletion.
 * 2. Deletes all files in the queue, the cache directory, and the cache file.
 *
 * @param string|false $file File to queue for deletion. False to delete all files.
 * @param string       $cache_dir Don't delete anything outside this directory.
 */
function delete_temp( $file, $cache_dir ) {
	static $files = [];

	if ( ! $cache_dir ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: Could not delete `%s` from empty cache_dir\n", $file ) );
		exit( 5 );
	}

	if ( false !== $file && 0 !== strpos( $file, rtrim( $cache_dir, '/' ) . '/' ) ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: Could not delete `%s` from outside cache_dir `%s`\n", $file, $cache_dir ) );
		exit( 5 );
	}

	if ( $file ) {
		// Add to queue.
		$files[] = $file;

		// Recursively add any subdirectories.
		$file = dirname( $file );
		if ( strlen( $file ) <= strlen( $cache_dir ) ) {
			return;
		}
		delete_temp( $file, $cache_dir );

		return; // Important :) Just add to the queue. Don't do any deletions.
	}

	// Sort from longest to shortest to make sure we delete all files in a
	// directory before deleting the directory.
	usort(
		$files,
		function( $a, $b ) {
			return strlen( $b ) - strlen( $a );
		}
	);

	foreach ( array_unique( $files ) as $file ) {
		if ( is_dir( $file ) ) {
			rmdir( $file );
		} else {
			unlink( $file );
		}
	}

	// Delete the cache file.
	$cache_file = preg_replace( '#\\.dir\\/$#', '', $cache_dir );
	unlink( $cache_file );

	// Delete the cache dir.
	rmdir( $cache_dir );
}

/**
 * `proc_open()` wrapper.
 *
 * STDOUT is returned, STDERR is piped to the parent STDERR.
 *
 * @param string[] $args The command to run and all of its arguments.
 * @param int      $status The exit status of the command. Outparam.
 * @return string STDOUT of command.
 */
function proc( $args, &$status = null ) {
	$pipes = [];
	$proc  = proc_open(
		join( ' ', array_map( 'escapeshellarg', $args ) ),
		[
			0 => [ 'pipe', 'r' ],
			1 => [ 'pipe', 'w' ],
			2 => STDERR, // Send the command's STDERR to ours.
		],
		$pipes
	);

	if ( ! $proc ) {
		fwrite( STDERR, sprintf( "SNIFF DIFF: Could not spawn `%s`\n", join( ' ', $args ) ) );
		exit( 5 );
	}

	fclose( $pipes[0] );

	$output = stream_get_contents( $pipes[1] );
	fclose( $pipes[1] );

	$status = proc_close( $proc );

	return $output;
}

/**
 * Parses $argv for `git diff` and `phpcs` arguments.
 *
 * @param string[] $argv Like the global.
 * @return array[] [
 *                   0 => string[] Arguments for `git diff`,
 *                   1 => string[] Arguments for the first, caching run of `phpcs`.
 *                   2 => string[] Arguments for the second, reporting caching run of `phpcs`.
 *                 ].
 */
function get_args( $argv ) {
	// Arguments we'll pass to `git diff`.
	$git_args = [];

	// Arguments we'll pass to the first, caching run of `phpcs`.
	$phpcs_cache_args = [];

	// Arguments we'll pass to the second, reporting run of `phpcs`.
	$phpcs_args = [];

	$git_arg     = true; // Are we still collecting `git diff` args?
	$runtime_arg = 0;    // Are we looking at a PHPCS `--runtime-set` argument? If so, we need special handling.
	foreach ( array_slice( $argv, 1 ) as $arg ) {
		if ( '--phpcs--' === $arg ) {
			// We've found the argument separator.
			// Stop collecting `git diff` args.
			// Start collecting `phpcs` args.
			$git_arg = false;
			continue;
		}

		if ( $git_arg ) {
			$git_args[] = $arg;
		} else {
			$phpcs_args[] = $arg;
			// --runtime-set key value
			// We need to capture these arguments for both the
			// first and second run of `phpcs`: changes to
			// these arguments invalidates the cache.
			if ( '--runtime-set' === $arg ) {
				$runtime_arg = 3;
			}
			if ( 0 < $runtime_arg-- ) {
				$phpcs_cache_args[] = $arg;
			}
		}
	}

	return [
		$git_args,
		$phpcs_cache_args,
		$phpcs_args,
	];
}

/**
 * If `--report-width` is not specified, try to determine the TTY width.
 *
 * @param string[] $phpcs_args The arguments to be sent to `phpcs`.
 * @return string[]
 */
function add_width_argument( $phpcs_args ) {
	$width         = 0;
	$width_arg_pos = false;
	foreach ( $phpcs_args as $key => $phpcs_arg ) {
		if ( 0 === strpos( $phpcs_arg, '--report-width=' ) ) {
			$width         = (int) explode( '=', $phpcs_arg, 2 )[1];
			$width_arg_pos = $key;
		}
	}

	if ( ! $width ) {
		$width = (int) exec( 'tput cols' );
	}

	if ( ! $width ) {
		$width = 80;
	}

	$width_arg = "--report-width=$width";

	if ( false === $width_arg_pos ) {
		array_unshift( $phpcs_args, $width_arg );
	} else {
		$phpcs_args[ $width_arg_pos ] = $width_arg;
	}

	return $phpcs_args;
}
