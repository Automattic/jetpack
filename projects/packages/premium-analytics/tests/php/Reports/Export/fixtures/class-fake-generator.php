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

	public function generate( array $data, array $columns, callable $formatter, string $filename = '' ) { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		return $this->result;
	}

	public function delete_file( string $file_path ): bool { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		return true;
	}
}
