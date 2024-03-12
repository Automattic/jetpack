<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package jetpack
 */

// Require base config.
require __DIR__ . '/config.base.php';

$config = make_phan_config(
	dirname( __DIR__ ),
	array(
		'is_wordpress'       => false,
		'exclude_file_regex' => array(
			// For the monorepo itself, we want to exclude all the projects. Those are processed individually instead.
			'projects/',
			// This also should be analyzed separately.
			// @todo Do so.
			'tools/cli/helpers/doc-parser/',
			// Ignore stuff in various subdirs too.
			'.*/node_modules/',
			'tools/docker/',
		),
	)
);

// Rm duplicate.
$config['file_list'] = array_diff( $config['file_list'], array( __DIR__ . '/config.base.php' ) );

return $config;
