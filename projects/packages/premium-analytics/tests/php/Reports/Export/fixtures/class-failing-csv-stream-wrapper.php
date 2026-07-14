<?php
/**
 * Stream wrapper that accepts opens but reports failed writes.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Stream wrapper test double for CSV write failures.
 */
class Failing_Csv_Stream_Wrapper {

	/**
	 * Stream context.
	 *
	 * @var resource
	 */
	public $context;

	/**
	 * Open stream.
	 *
	 * @param string $path        Stream path.
	 * @param string $mode        Open mode.
	 * @param int    $options     Stream options.
	 * @param string $opened_path Opened path.
	 * @return bool
	 */
	public function stream_open( $path, $mode, $options, &$opened_path ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}

	/**
	 * Report that no bytes were written.
	 *
	 * @param string $data Data to write.
	 * @return int
	 */
	public function stream_write( $data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return 0;
	}
}
