<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package jetpack
 */

$root = dirname( __DIR__, 4 );

return array(
	// Versions of PHP to check with.
	'minimum_target_php_version'      => '7.0',
	'target_php_version'              => '8.2',

	// Apparently this is only useful when upgrading from php 5, not for 7-to-8.
	'backward_compatibility_checks'   => false,

	// Plugins to enable.
	'plugins'                         => array(
		'PHPUnitNotDeadCodePlugin',
	),

	// Directories and individual files to parse (and, by default, analyze).
	'directory_list'                  => array(
		'.',
	),
	'file_list'                       => array(
		"$root/vendor/php-stubs/wordpress-stubs/wordpress-stubs.php",
		"$root/vendor/php-stubs/wordpress-tests-stubs/wordpress-tests-stubs.php",
		"$root/vendor/php-stubs/wp-cli-stubs/wp-cli-stubs.php",
		"$root/vendor/php-stubs/wp-cli-stubs/wp-cli-commands-stubs.php",
		"$root/vendor/php-stubs/wp-cli-stubs/wp-cli-i18n-stubs.php",
	),

	// Regex to exclude files from parsing.
	'exclude_file_regex'              => '@^\./(?:' . implode(
		'|',
		array(
			// Ignore any `test`, `tests`, `Test`, `Tests`, `wordpress`, `jetpack_vendor`, `vendor`, and `node_modules` inside `vendor` and `jetpack_vendor`.
			// Most of these are probably from our intra-monorepo symlinks.
			'(?:jetpack_)?vendor/.*/(tests?|Tests?|wordpress|(?:jetpack_)?vendor|node_modules)/',
			// Other stuff to ignore.
			'node_modules/',
			'tests/e2e/node_modules/',
			'\.cache/',
		)
	) . ')@',

	// Specific files to exclude from parsing.
	'exclude_file_list'               => array(
		'modules/custom-css/custom-css/preprocessors/lessc.inc.php',
	),

	// List directories that will be excluded from analysis (but will still be parsed).
	// Note anything here needs to be listed in `directory_list` or `file_list` to be parsed in the first place.
	'exclude_analysis_directory_list' => array(
		'jetpack_vendor',
		'vendor',
		"$root/vendor",
	),
);
