<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-codesniffer
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'stubs'             => array(),
		'exclude_file_list' => array(
			// We override this.
			'vendor/mediawiki/mediawiki-codesniffer/MediaWiki/Sniffs/PHPUnit/PHPUnitTestTrait.php',
		),
	)
);
