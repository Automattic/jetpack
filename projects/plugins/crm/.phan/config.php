<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpackcrm
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'exclude_analysis_directory_list' => array(
			'tests/codeception/_support/_generated/AcceptanceTesterActions.php',
		),
		'exclude_file_list'               => array(
			// We have a stub for this because the real file has duplicate trait definitions.
			'tests/php/WP_UnitTestCase_Fix.php',
		),
		'+stubs'                          => array( 'woocommerce' ),
	)
);
