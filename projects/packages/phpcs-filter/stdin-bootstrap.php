<?php
/**
 * This is a phpcs bootstrap file to apply the filter's Config and RuleSet modifications
 * when phpcs is passed a file via stdin.
 *
 * @package automattic/jetpack-phpcs-filter
 */

use PHP_CodeSniffer\Autoload;

call_user_func(
	function () {
		global $runner;

		$config = $runner->config;
		if ( ! $config->stdin || ! $config->stdinPath || ! $config->filter ) {
			return;
		}
		$path = realpath( $config->stdinPath );
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
