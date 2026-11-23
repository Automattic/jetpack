<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-stats
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'            => array( 'amp', 'wpcom' ),
		'exclude_file_list' => array(
			// Testing mocks that override AMP stubs.
			'tests/php/mocks/amp-is-request-mock.php',
			'tests/php/mocks/class-amp-base-sanitizer.php',
		),
	)
);
