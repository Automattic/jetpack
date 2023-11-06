<?php
/**
 * This is a phpcs bootstrap file to apply the filter's Config and RuleSet modifications
 * when phpcs is passed a file via stdin.
 *
 * @package automattic/jetpack-phpcs-filter
 */

use PHP_CodeSniffer\Autoload;
use PHP_CodeSniffer\Util;

call_user_func(
	function () {
		global $runner;

		$config = $runner->config;
		if ( ! $config->stdin || ! $config->filter ) {
			return;
		}

		// phpcs has two ways to determine the path for stdin. The newer, documented way is the `--stdin-path=$path` command line option.
		// The older (and not really documented) way is to prepend a line "phpcs_input_file:$path" to the input on stdin itself.
		// Fortunately it's possible to get that stdin without screwing up phpcs's own use of it.
		$path = null;
		if ( $config->stdinPath ) {
			$path = realpath( $config->stdinPath );
		} else {
			// This should match the logic in phpcs's Runner::run().
			$fileContents = $config->stdinContent;
			if ( $fileContents === null ) {
				$handle = fopen( 'php://stdin', 'r' );
				stream_set_blocking( $handle, true );
				$fileContents = stream_get_contents( $handle );
				fclose( $handle );
				// Save the stdin contents so phpcs's Runner::run() will find it later.
				$config->stdinContent = $fileContents;
			}

			// This should match the logic in phpcs's DummyFile::__construct().
			if ( substr( $fileContents, 0, 17 ) === 'phpcs_input_file:' ) {
				try {
					$eolChar = Util\Common::detectLineEndings( $fileContents );
				} catch ( RuntimeException $e ) {
					return;
				}
				$eolPos = strpos( $fileContents, $eolChar );
				$path   = trim( substr( $fileContents, 17, ( $eolPos - 17 ) ) );
			}
		}
		if ( ! $path ) {
			return;
		}

		// This should match the logic in phpcs's FileList::getFilterClass().
		if ( strpos( $config->filter, '.' ) !== false ) {
			// This is a path to a custom filter class.
			$filename = realpath( $config->filter );
			if ( false === $filename ) {
				return;
			}
			$filterClass = Autoload::loadFile( $filename );
		} else {
			$filterClass = '\\PHP_CodeSniffer\\Filters\\' . $config->filter;
		}

		// Ask the filter which config and ruleset it should use for the path.
		$iter   = new RecursiveArrayIterator( array( $path ) );
		$filter = new $filterClass( $iter, '/', $config, $runner->ruleset );
		if ( is_callable( array( $filter, 'getConfigAndRuleset' ) ) ) {
			try {
				list( $runner->config, $runner->ruleset ) = $filter->getConfigAndRuleset( $path );
			} catch ( Exception $ex ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				// Don't care.
			}
		}
	}
);
