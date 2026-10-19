<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-knowledge
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

// Native provider fixtures declare APIs that run in isolated processes.
return make_phan_config(
	dirname( __DIR__ ),
	array(
		'exclude_file_regex' => array(
			'tests/php/fixtures/knowledge-provider\\.php$',
			'tests/php/fixtures/gutenberg-knowledge/',
		),
	)
);
