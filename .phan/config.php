<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package jetpack
 */

// This is not WordPress.
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase, WordPress.WP.AlternativeFunctions

// Require base config.
require __DIR__ . '/config.base.php';

// Pseudo-projects.
$pseudoProjects = json_decode( preg_replace( '#^\s*\/\/.*#m', '', file_get_contents( __DIR__ . '/monorepo-pseudo-projects.jsonc' ) ), true );

$config = make_phan_config(
	dirname( __DIR__ ),
	array(
		'stubs'              => array(),
		'exclude_file_regex' => array_merge(
			array(
				// For the monorepo itself, we want to exclude all the projects. Those are processed individually instead.
				'projects/',
				// Ignore stuff in various subdirs too.
				'.*/node_modules/',
				'tools/docker/',
				// Don't load the stubs. (if we need to start loading _a_ stub for the "monorepo", do like `(?!filename\.php)` to exclude it from the exclusion.)
				'.phan/stubs/',
			),
			// Also any pseudo-projects are processed separately.
			array_values( $pseudoProjects )
		),
	)
);

// Rm duplicate.
$config['file_list'] = array_diff( $config['file_list'], array( __DIR__ . '/config.base.php' ) );

return $config;
