<?php
/**
 * Test double for Report_Csv_Generator that skips real file I/O.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake generator: returns a canned path (or WP_Error) and no-ops deletion, so
 * process_export_job() can be exercised without a writable export directory.
 */
class Fake_Generator extends Report_Csv_Generator {

	/**
	 * Value generate() returns (path string or WP_Error).
	 *
	 * @var mixed
	 */
	public $result = '/tmp/pa-fake-export.csv';

	/**
	 * Value stream_file() returns.
	 *
	 * @var bool
	 */
	public $stream_result = true;

	/**
	 * Recorded stream_file() calls.
	 *
	 * @var array[]
	 */
	public $streams = array();

	public function generate( array $data, array $columns, callable $formatter, string $filename = '' ) { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		return $this->result;
	}

	public function delete_file( string $file_path ): bool { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		return true;
	}

	public function stream_file( string $file_path, string $filename = '' ): bool { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		$this->streams[] = array(
			'file_path' => $file_path,
			'filename'  => $filename,
		);
		return $this->stream_result;
	}
}
